import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ROOT_DIR = path.resolve(__dirname(), "../..");

const COMPONENTS_SCHEMA_PATH = path.join(
  ROOT_DIR,
  "packages/ui/artifacts/components.schema.json",
);
const DOCS_SCHEMA_PATH = path.join(ROOT_DIR, "apps/docs/artifacts/docs.schema.json");

const COMPONENTS_SCHEMA_URI = "file:///governance/components.schema.json";
const DOCS_SCHEMA_URI = "file:///governance/docs.schema.json";
const REPORT_JSON_PATH = path.join(ROOT_DIR, "artifacts/doc-sync.report.json");

type DeepSeekAdviceResult = {
  ok: boolean;
  text: string;
  errorMessage?: string;
};

type SyncIssue = {
  componentName: string;
  propName?: string;
  type:
    | "missing_doc_file"
    | "missing_in_docs"
    | "missing_in_source"
    | "type_mismatch"
    | "default_mismatch"
    | "doc_without_source";
  level: "error" | "warn";
  detail: string;
};

type SyncReport = {
  summary?: {
    errorCount?: number;
    warnCount?: number;
  };
  issues?: SyncIssue[];
};

/**
 * 兼容 ESM 环境的 __dirname。
 */
function __dirname(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * 统一执行 pnpm 脚本命令。
 * 设计目标：
 * 1) 明确返回 stdout/stderr/exitCode，便于工具结果可读；
 * 2) 不抛异常中断，让 MCP Tool 总能返回结构化结果；
 * 3) 使用仓库根目录作为工作目录，保证命令行为一致。
 */
async function runPnpmScript(scriptName: string): Promise<{
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
}> {
  return new Promise((resolve) => {
    const child = spawn("pnpm", [scriptName], {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      resolve({
        ok: false,
        exitCode: 1,
        stdout,
        stderr: `${stderr}\n${String(error)}`.trim(),
      });
    });

    child.on("close", (code) => {
      const exitCode = code ?? 1;
      resolve({
        ok: exitCode === 0,
        exitCode,
        stdout,
        stderr,
      });
    });
  });
}

/**
 * 读取文件资源。
 * 说明：
 * - 文件不存在时，依然返回可读提示而不是抛错；
 * - 资源协议先使用 JSON 纯文本，方便模型直接消费。
 */
function readJsonResource(filePath: string, uri: string): {
  contentText: string;
  exists: boolean;
} {
  void uri;
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      contentText: JSON.stringify(
        {
          message: "resource file not found",
          filePath: path.relative(ROOT_DIR, filePath),
          hint: "run tool extract_components / extract_docs first",
        },
        null,
        2,
      ),
    };
  }

  return {
    exists: true,
    contentText: fs.readFileSync(filePath, "utf8"),
  };
}

/**
 * 将命令执行结果格式化为 MCP Tool 的 text content。
 */
function formatCommandResult(params: {
  title: string;
  ok: boolean;
  exitCode: number;
  stdout: string;
  stderr: string;
}): string {
  const lines: string[] = [];
  lines.push(`# ${params.title}`);
  lines.push("");
  lines.push(`- ok: ${params.ok}`);
  lines.push(`- exitCode: ${params.exitCode}`);
  lines.push("");

  if (params.stdout.trim() !== "") {
    lines.push("## stdout");
    lines.push("```text");
    lines.push(params.stdout.trimEnd());
    lines.push("```");
    lines.push("");
  }

  if (params.stderr.trim() !== "") {
    lines.push("## stderr");
    lines.push("```text");
    lines.push(params.stderr.trimEnd());
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

type AiToolInput = {
  checkSummary?: string;
  reportJson?: string;
};

/**
 * 尝试解析同步报告 JSON。
 * 优先使用客户端传入内容；为空时回退读取本地 artifacts。
 */
function loadSyncReport(reportJsonFromArgs: string | undefined): SyncReport | null {
  const rawFromArgs = reportJsonFromArgs?.trim() ?? "";
  const candidate = rawFromArgs !== "" ? rawFromArgs : (
    fs.existsSync(REPORT_JSON_PATH) ? fs.readFileSync(REPORT_JSON_PATH, "utf8") : ""
  );
  if (candidate.trim() === "") {
    return null;
  }
  try {
    return JSON.parse(candidate) as SyncReport;
  } catch {
    return null;
  }
}

/**
 * 调用 DeepSeek 生成治理建议。
 * 关键约束：
 * - API Key 仅从环境变量读取，不写入仓库文件；
 * - 失败时返回结构化错误，不抛出异常中断 MCP Tool；
 * - 输出面向工程动作，避免空泛建议。
 */
async function requestDeepSeekGovernanceAdvice(params: {
  checkSummary: string;
  issues: SyncIssue[];
}): Promise<DeepSeekAdviceResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      text: "",
      errorMessage:
        "未检测到 DEEPSEEK_API_KEY。请先在终端设置环境变量后再调用该 Tool。",
    };
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";
  const endpoint = `${baseUrl.replace(/\/$/, "")}/chat/completions`;

  const systemPrompt = [
    "你是前端组件治理专家。",
    "请仅根据输入 issues 列表输出可执行建议，不要自行猜测额外问题。",
    "要求：",
    "1. 先给“结论摘要”（不超过 5 条）；",
    "2. 再给“按组件拆分的修复清单”；",
    "3. 每条建议都要包含：问题类型、修改位置、建议动作；",
    "4. 仅基于输入事实，不要编造组件或字段；",
    "5. 输出中文，使用 Markdown。",
  ].join("\n");

  const userPrompt = [
    "以下是治理检查结果，请给出修复建议：",
    "",
    "## check_summary",
    params.checkSummary,
    "",
    "## issues_json",
    JSON.stringify(params.issues, null, 2),
  ].join("\n");

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        ok: false,
        text: "",
        errorMessage: `DeepSeek 请求失败：HTTP ${response.status} ${response.statusText}\n${errorText}`,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return {
        ok: false,
        text: "",
        errorMessage: "DeepSeek 返回成功，但未拿到有效文本内容。",
      };
    }

    return { ok: true, text };
  } catch (error) {
    return {
      ok: false,
      text: "",
      errorMessage: `调用 DeepSeek 异常：${String(error)}`,
    };
  }
}

/**
 * 创建 MCP Server 并注册所有治理能力。
 * 本阶段只提供“读结果 + 输出建议”的基础能力，不执行自动改文件。
 */
export function createGovernanceMcpServer(): McpServer {
  const server = new McpServer({
    name: "squid-design-governance-mcp",
    version: "0.1.0",
  });

  // Tool 1: 抽取组件源码 schema。
  server.registerTool(
    "extract_components",
    {
      title: "Extract Components Schema",
      description:
        "Run governance extractor for component source and refresh components.schema.json.",
    },
    async () => {
      const result = await runPnpmScript("governance:extract:components");
      return {
        isError: !result.ok,
        content: [
          {
            type: "text",
            text: formatCommandResult({
              title: "extract_components",
              ...result,
            }),
          },
        ],
      };
    },
  );

  // Tool 2: 抽取文档 schema。
  server.registerTool(
    "extract_docs",
    {
      title: "Extract Docs Schema",
      description:
        "Run governance extractor for docs and refresh docs.schema.json.",
    },
    async () => {
      const result = await runPnpmScript("governance:extract:docs");
      return {
        isError: !result.ok,
        content: [
          {
            type: "text",
            text: formatCommandResult({
              title: "extract_docs",
              ...result,
            }),
          },
        ],
      };
    },
  );

  // Tool 3: 执行同步校验。
  server.registerTool(
    "check_sync",
    {
      title: "Check Docs Sync",
      description:
        "Run governance sync check and produce report files (doc-sync.report.json / doc-sync.md).",
    },
    async () => {
      const result = await runPnpmScript("governance:check");
      return {
        isError: !result.ok,
        content: [
          {
            type: "text",
            text: formatCommandResult({
              title: "check_sync",
              ...result,
            }),
          },
        ],
      };
    },
  );

  // Tool 4: 执行同步校验 + 模型建议（DeepSeek）。
  server.registerTool(
    "check_sync_with_ai",
    {
      title: "Check Docs Sync With AI Advice",
      description:
        "Run governance sync check first, then use DeepSeek to generate actionable fix suggestions based on report artifacts.",
      inputSchema: {
        checkSummary: z.string().optional(),
        reportJson: z.string().optional(),
      },
    },
    async (args) => {
      const raw = (args ?? {}) as Record<string, unknown>;
      const nested =
        raw.arguments && typeof raw.arguments === "object"
          ? (raw.arguments as Record<string, unknown>)
          : null;
      const input = (nested ?? raw) as AiToolInput;
      const checkSummary = typeof input.checkSummary === "string" ? input.checkSummary : "";
      const reportJson = typeof input.reportJson === "string" ? input.reportJson : "";

      const checkResult = await runPnpmScript("governance:check");

      const baseText = formatCommandResult({
        title: "check_sync_with_ai",
        ...checkResult,
      });

      const report = loadSyncReport(reportJson);
      if (!report) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `${baseText}\n\n## AI advice\n未读取到有效的 doc-sync.report.json，无法生成可信建议。`,
            },
          ],
        };
      }

      const errorCount = Number(report.summary?.errorCount ?? 0);
      const warnCount = Number(report.summary?.warnCount ?? 0);
      const issues = Array.isArray(report.issues) ? report.issues : [];

      // 强约束：0 error + 0 warn 时不调用模型，避免模型在“无问题”场景胡乱推断。
      if (errorCount === 0 && warnCount === 0) {
        return {
          isError: !checkResult.ok,
          content: [
            {
              type: "text",
              text: `${baseText}\n\n## AI advice\n当前治理检查结果为 0 错误、0 警告，无需修复。建议保持现有 CI 校验流程并在组件变更时持续执行。`,
            },
          ],
        };
      }

      const advice = await requestDeepSeekGovernanceAdvice({
        checkSummary,
        issues,
      });
      if (!advice.ok) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `${baseText}\n\n## AI advice\n${advice.errorMessage ?? "未知错误"}`,
            },
          ],
        };
      }

      return {
        isError: !checkResult.ok,
        content: [
          {
            type: "text",
            text: `${baseText}\n\n## AI advice\n${advice.text}`,
          },
        ],
      };
    },
  );

  // Resource 1: 组件 schema。
  server.registerResource(
    "components_schema",
    COMPONENTS_SCHEMA_URI,
    {
      title: "Components Schema JSON",
      description:
        "Structured schema extracted from component source code.",
      mimeType: "application/json",
    },
    async (uri) => {
      const { contentText } = readJsonResource(
        COMPONENTS_SCHEMA_PATH,
        uri.toString(),
      );
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: contentText,
          },
        ],
      };
    },
  );

  // Resource 2: 文档 schema。
  server.registerResource(
    "docs_schema",
    DOCS_SCHEMA_URI,
    {
      title: "Docs Schema JSON",
      description:
        "Structured schema extracted from markdown docs.",
      mimeType: "application/json",
    },
    async (uri) => {
      const { contentText } = readJsonResource(DOCS_SCHEMA_PATH, uri.toString());
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: "application/json",
            text: contentText,
          },
        ],
      };
    },
  );

  return server;
}

/**
 * 启动 stdio MCP 服务。
 * 注意：
 * - 该进程会持续阻塞等待客户端消息；
 * - 仅在“作为主入口执行”时启动，避免 import 时卡住。
 */
export async function startMcpServer(): Promise<void> {
  const server = createGovernanceMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

/**
 * 判断当前模块是否被直接执行（而非被 import）。
 */
function isMainModule(): boolean {
  const current = pathToFileURL(fileURLToPath(import.meta.url)).href;
  const entry = process.argv[1]
    ? pathToFileURL(path.resolve(process.argv[1])).href
    : "";
  return current === entry;
}

if (isMainModule()) {
  startMcpServer().catch((error) => {
    // MCP stdio 场景下，stdout 是协议通道，错误日志应写入 stderr。
    console.error("[governance-mcp] failed to start server");
    console.error(error);
    process.exit(1);
  });
}
