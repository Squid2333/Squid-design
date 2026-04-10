import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const ROOT_DIR = path.resolve(__dirname(), "../..");
const COMPONENTS_SCHEMA_URI = "file:///governance/components.schema.json";
const DOCS_SCHEMA_URI = "file:///governance/docs.schema.json";
const REPORT_JSON_PATH = path.join(ROOT_DIR, "artifacts/doc-sync.report.json");

/**
 * 兼容 ESM 环境的 __dirname。
 */
function __dirname(): string {
  return path.dirname(fileURLToPath(import.meta.url));
}

/**
 * 将 MCP content 数组转为纯文本，便于在命令行输出。
 */
function toPlainText(content: unknown): string {
  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((item) => {
      if (item && typeof item === "object" && "text" in item) {
        const text = (item as { text?: unknown }).text;
        return typeof text === "string" ? text : "";
      }
      return "";
    })
    .filter(Boolean)
    .join("\n");
}

/**
 * 对资源内容做截断，避免终端输出过大。
 */
function truncateText(text: string, maxLength = 1200): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}\n...<truncated>`;
}

async function main(): Promise<void> {
  const transport = new StdioClientTransport({
    command: "pnpm",
    args: ["mcp:server"],
    cwd: ROOT_DIR,
    // 把 server stderr 透出到当前终端，便于排障。
    stderr: "inherit",
  });

  const client = new Client(
    {
      name: "governance-mcp-smoke-client",
      version: "0.1.0",
    },
    {
      capabilities: {},
    },
  );

  try {
    await client.connect(transport);

    console.log("== MCP Smoke Test ==");
    console.log(`cwd: ${ROOT_DIR}`);
    console.log("");

    // 第 1 步：列出 tools。
    const toolsResult = await client.listTools();
    const toolNames = (toolsResult.tools ?? []).map((tool) => tool.name).sort();
    console.log("Tools:");
    for (const name of toolNames) {
      console.log(`- ${name}`);
    }
    console.log("");

    // 第 2 步：调用 check_sync。
    const checkResult = await client.callTool({
      name: "check_sync",
      arguments: {},
    });
    console.log("check_sync:");
    console.log(`- isError: ${Boolean(checkResult.isError)}`);
    console.log(truncateText(toPlainText(checkResult.content)));
    console.log("");

    // 第 3 步：读取 components schema resource。
    const componentsResource = await client.readResource({
      uri: COMPONENTS_SCHEMA_URI,
    });
    const componentsText =
      componentsResource.contents?.find((item) => "text" in item)?.text ?? "";
    console.log("components.schema.json:");
    console.log(truncateText(String(componentsText)));
    console.log("");

    // 第 4 步：读取 docs schema resource。
    const docsResource = await client.readResource({
      uri: DOCS_SCHEMA_URI,
    });
    const docsText = docsResource.contents?.find((item) => "text" in item)?.text ?? "";
    console.log("docs.schema.json:");
    console.log(truncateText(String(docsText)));
    console.log("");

    // 第 5 步：如果环境里配置了 DEEPSEEK_API_KEY，则验证 AI 增强工具。
    // 这里采用“resource-first”方式：
    // 客户端先读 MCP Resource，再把内容作为 arguments 传入 Tool，
    // 让模型推理显式依赖 resource，而不是 server 内部读文件。
    if (process.env.DEEPSEEK_API_KEY) {
      const reportJson = (() => {
        try {
          return fs.readFileSync(REPORT_JSON_PATH, "utf8");
        } catch {
          return "";
        }
      })();
      const aiResult = await client.callTool({
        name: "check_sync_with_ai",
        arguments: {
          checkSummary: toPlainText(checkResult.content),
          reportJson,
        },
      });
      console.log("check_sync_with_ai:");
      console.log(`- isError: ${Boolean(aiResult.isError)}`);
      console.log(truncateText(toPlainText(aiResult.content), 1800));
      console.log("");
    } else {
      console.log(
        "check_sync_with_ai: skipped (未检测到 DEEPSEEK_API_KEY，跳过 AI 增强工具验证)",
      );
      console.log("");
    }

    console.log("Smoke test completed.");
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("[mcp-client-smoke] failed");
  console.error(error);
  process.exit(1);
});
