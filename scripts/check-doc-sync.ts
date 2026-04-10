import fs from "node:fs";
import path from "node:path";

type SourceProp = {
  name: string;
  type: string;
  resolvedType?: string;
  required: boolean;
  default: string | null;
  isEvent: boolean;
};

type SourceComponent = {
  componentName: string;
  sourceFile: string;
  props: SourceProp[];
};

type SourceSchemaFile = {
  generatedAt: string;
  sourceRoot: string;
  components: SourceComponent[];
};

type DocsComponent = {
  componentName: string;
  docFile: string;
  documentedProps: string[];
  props?: DocsProp[];
};

type DocsSchemaFile = {
  generatedAt: string;
  docsRoot: string;
  components: DocsComponent[];
};

type DocsProp = {
  name: string;
  type: string | null;
  default: string | null;
  required: boolean | null;
  source: "api_table" | "example" | "text";
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
  generatedAt: string;
  sourceSchemaFile: string;
  docsSchemaFile: string;
  summary: {
    totalComponentsInSource: number;
    totalComponentsInDocs: number;
    errorCount: number;
    warnCount: number;
  };
  issues: SyncIssue[];
};

type IssueType = SyncIssue["type"];
type SeverityLevel = SyncIssue["level"];

type GovernanceRules = {
  severity?: Partial<Record<IssueType, SeverityLevel>>;
  ignore?: {
    components?: string[];
    issues?: Array<{
      componentName?: string;
      type?: IssueType;
      propName?: string;
    }>;
  };
  allowlist?: Partial<
    Record<
      IssueType,
      Record<string, string[]>
    >
  >;
};

type GovernanceRulesResolved = {
  severity: Record<IssueType, SeverityLevel>;
  ignore: {
    components: string[];
    issues: Array<{
      componentName?: string;
      type?: IssueType;
      propName?: string;
    }>;
  };
  allowlist: Record<IssueType, Record<string, string[]>>;
};

/**
 * 将同步报告渲染成 Markdown 摘要。
 * 这个文件会被 CI 用于：
 * 1) 写入 Job Summary（Actions 页面可读）
 * 2) 作为 PR 评论正文（评审无需翻日志）
 */
function renderMarkdownReport(report: SyncReport): string {
  const lines: string[] = [];
  lines.push("# Governance Doc Sync Report");
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Source Components: ${report.summary.totalComponentsInSource}`);
  lines.push(`- Docs Components: ${report.summary.totalComponentsInDocs}`);
  lines.push(`- Errors: ${report.summary.errorCount}`);
  lines.push(`- Warnings: ${report.summary.warnCount}`);
  lines.push("");

  if (report.issues.length === 0) {
    lines.push("## Result");
    lines.push("- No issues found.");
    lines.push("");
    return lines.join("\n");
  }

  const errorIssues = report.issues.filter((issue) => issue.level === "error");
  const warnIssues = report.issues.filter((issue) => issue.level === "warn");

  if (errorIssues.length > 0) {
    lines.push("## Errors");
    for (const issue of errorIssues) {
      lines.push(`- **${issue.componentName}** \`${issue.type}\`: ${issue.detail}`);
    }
    lines.push("");
  }

  if (warnIssues.length > 0) {
    lines.push("## Warnings");
    for (const issue of warnIssues) {
      lines.push(`- **${issue.componentName}** \`${issue.type}\`: ${issue.detail}`);
    }
    lines.push("");
  }

  lines.push("## Artifacts");
  lines.push(`- \`${report.sourceSchemaFile}\``);
  lines.push(`- \`${report.docsSchemaFile}\``);
  lines.push("- `artifacts/doc-sync.report.json`");
  lines.push("- `artifacts/doc-sync.md`");
  lines.push("");

  return lines.join("\n");
}

/**
 * 统一读取 JSON 文件并做最基本校验。
 */
function readJsonFile<T>(filePath: string): T {
  if (!fs.existsSync(filePath)) {
    console.error("未找到文件：", filePath);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("JSON 解析失败：", filePath);
    throw error;
  }
}

/**
 * 尝试读取治理规则配置。
 * 规则文件不存在时不报错，回退到内置默认值，保证脚本可独立运行。
 */
function readOptionalJsonFile<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error("规则文件 JSON 解析失败：", filePath);
    throw error;
  }
}

/**
 * 构建最终生效的规则。
 * - 默认规则提供兜底；
 * - 用户 rules.json 可覆盖默认值。
 */
function buildEffectiveRules(rootDir: string): GovernanceRulesResolved {
  const defaultRules: GovernanceRulesResolved = {
    severity: {
      missing_doc_file: "error",
      missing_in_docs: "error",
      missing_in_source: "warn",
      type_mismatch: "error",
      default_mismatch: "error",
      doc_without_source: "warn",
    },
    ignore: {
      components: [],
      issues: [],
    },
    allowlist: {
      missing_doc_file: {},
      missing_in_docs: {},
      missing_in_source: {},
      type_mismatch: {},
      default_mismatch: {},
      doc_without_source: {},
    },
  };

  const rulesPath = path.join(rootDir, "governance/rules.json");
  const customRules = readOptionalJsonFile<GovernanceRules>(rulesPath);
  if (!customRules) {
    return defaultRules;
  }

  const merged: GovernanceRulesResolved = {
    severity: {
      ...defaultRules.severity,
      ...(customRules.severity ?? {}),
    },
    ignore: {
      components: customRules.ignore?.components ?? defaultRules.ignore.components,
      issues: customRules.ignore?.issues ?? defaultRules.ignore.issues,
    },
    allowlist: {
      ...defaultRules.allowlist,
      ...(customRules.allowlist ?? {}),
    },
  };

  return merged;
}

/**
 * 判断某条 issue 是否命中 allowlist。
 */
function isAllowlisted(
  rules: GovernanceRulesResolved,
  issueType: IssueType,
  componentName: string,
  propName?: string,
): boolean {
  if (!propName) {
    return false;
  }
  const allowlistForType = rules.allowlist[issueType];
  if (!allowlistForType) {
    return false;
  }
  const allowedProps = allowlistForType[componentName] ?? [];
  return allowedProps.includes(propName);
}

/**
 * 判断某条 issue 是否命中 ignore 规则。
 */
function isIgnoredByRules(
  rules: GovernanceRulesResolved,
  issue: Pick<SyncIssue, "componentName" | "type" | "propName">,
): boolean {
  if (rules.ignore.components.includes(issue.componentName)) {
    return true;
  }

  return rules.ignore.issues.some((rule) => {
    const componentMatched =
      rule.componentName === undefined || rule.componentName === issue.componentName;
    const typeMatched = rule.type === undefined || rule.type === issue.type;
    const propMatched = rule.propName === undefined || rule.propName === issue.propName;
    return componentMatched && typeMatched && propMatched;
  });
}

/**
 * 小工具：集合差集。
 * 返回 left 中有而 right 中没有的项。
 */
function diffSet(left: Set<string>, right: Set<string>): string[] {
  const diff: string[] = [];
  for (const item of left) {
    if (!right.has(item)) {
      diff.push(item);
    }
  }
  return diff.sort((a, b) => a.localeCompare(b));
}

/**
 * 标准化类型字符串，用于弱化“格式差异”对比噪音。
 * 主要处理：
 * - markdown 转义：`\|` -> `|`
 * - 多余空格
 * - 结尾分号
 */
function normalizeTypeText(input: string | null): string | null {
  if (input == null) {
    return null;
  }

  const normalized = input
    .replace(/\\\|/g, "|")
    .replace(/\s+/g, " ")
    .replace(/\s*\|\s*/g, " | ")
    .replace(/^(\|\s*)+/, "")
    // ts-morph 展开别名时，可能在替换后留下 `)<T>` 这类残留泛型参数。
    // 例如：((record: T) => Key)<T>，这里把它归一为 ((record: T) => Key)。
    .replace(/\)\s*<[^>]+>/g, ")")
    // 对象类型风格归一：去掉结尾分号差异，避免
    // `{ a: string; b?: number; }` 与 `{ a: string; b?: number }` 误报。
    .replace(/;\s*}/g, " }")
    .replace(/\s*;\s*/g, "; ")
    .replace(/;$/, "")
    .trim();

  // 对“顶层联合类型”做顺序无关归一，避免 "a|b" 与 "b|a" 误报。
  return normalizeTopLevelUnion(normalized);
}

/**
 * 标准化默认值文本。
 * 目标是把“文档里的无默认值写法”统一映射为 null，
 * 例如：`undefined` / `-` / 空字符串。
 */
function normalizeDefaultValue(input: string | null): string | null {
  if (input == null) {
    return null;
  }

  const cleaned = input
    .replace(/\\\|/g, "|")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^`|`$/g, "");

  if (
    cleaned === "" ||
    cleaned === "-" ||
    cleaned.toLowerCase() === "undefined"
  ) {
    return null;
  }

  return cleaned;
}

/**
 * 将函数类型做弱归一：
 * - 忽略参数名，只保留参数类型和返回类型；
 * - 再做类型文本标准化，减少“名字不同语义相同”的误报。
 *
 * 示例：
 * (value: string, count: number) => void
 * 与
 * (v: string, c: number) => void
 * 会被视为等价。
 */
function normalizeFunctionTypeSignature(input: string): string {
  const normalized = input.replace(/\s+/g, " ").trim();
  const fnMatch = /^\((.*)\)\s*=>\s*(.+)$/.exec(normalized);
  if (!fnMatch) {
    return normalized;
  }

  const paramsText = fnMatch[1].trim();
  const returnTypeText = fnMatch[2].trim();
  const params = paramsText === "" ? [] : splitTopLevel(paramsText, ",");

  const normalizedParamTypes = params.map((param) => {
    const trimmed = param.trim();
    if (trimmed === "") {
      return "";
    }
    const colonIndex = findTopLevelColon(trimmed);
    if (colonIndex < 0) {
      return normalizeTypeText(trimmed) ?? trimmed;
    }
    const typePart = trimmed.slice(colonIndex + 1).trim();
    return normalizeTypeText(typePart) ?? typePart;
  });

  const normalizedReturnType = normalizeTypeText(returnTypeText) ?? returnTypeText;
  return `(${normalizedParamTypes.filter(Boolean).join(",")})=>${normalizedReturnType}`;
}

/**
 * 将“顶层联合类型”拆分并排序。
 * 只在顶层 `|` 切分，避免破坏泛型/函数参数中的 `|`。
 */
function normalizeTopLevelUnion(input: string): string {
  const parts = splitTopLevel(input, "|")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return input;
  }

  return parts.sort((a, b) => a.localeCompare(b)).join(" | ");
}

/**
 * 按指定分隔符做“顶层切分”（忽略括号/泛型/对象内部层级）。
 */
function splitTopLevel(input: string, delimiter: "," | "|"): string[] {
  const parts: string[] = [];
  let current = "";
  let angle = 0;
  let round = 0;
  let square = 0;
  let curly = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const prev = i > 0 ? input[i - 1] : "";

    if (ch === "'" && prev !== "\\" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      current += ch;
      continue;
    }
    if (ch === '"' && prev !== "\\" && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      current += ch;
      continue;
    }
    if (inSingleQuote || inDoubleQuote) {
      current += ch;
      continue;
    }

    if (ch === "<") angle += 1;
    else if (ch === ">") angle = Math.max(0, angle - 1);
    else if (ch === "(") round += 1;
    else if (ch === ")") round = Math.max(0, round - 1);
    else if (ch === "[") square += 1;
    else if (ch === "]") square = Math.max(0, square - 1);
    else if (ch === "{") curly += 1;
    else if (ch === "}") curly = Math.max(0, curly - 1);

    if (
      ch === delimiter &&
      angle === 0 &&
      round === 0 &&
      square === 0 &&
      curly === 0
    ) {
      parts.push(current);
      current = "";
      continue;
    }

    current += ch;
  }

  parts.push(current);
  return parts;
}

/**
 * 找到参数声明里的“顶层冒号”，用于切分 `name: type`。
 */
function findTopLevelColon(input: string): number {
  let angle = 0;
  let round = 0;
  let square = 0;
  let curly = 0;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    if (ch === "<") angle += 1;
    else if (ch === ">") angle = Math.max(0, angle - 1);
    else if (ch === "(") round += 1;
    else if (ch === ")") round = Math.max(0, round - 1);
    else if (ch === "[") square += 1;
    else if (ch === "]") square = Math.max(0, square - 1);
    else if (ch === "{") curly += 1;
    else if (ch === "}") curly = Math.max(0, curly - 1);
    else if (
      ch === ":" &&
      angle === 0 &&
      round === 0 &&
      square === 0 &&
      curly === 0
    ) {
      return i;
    }
  }

  return -1;
}

/**
 * 判断两个类型文本是否“语义等价”。
 * 比较策略从严格到宽松：
 * 1) 直接标准化后比较
 * 2) 函数签名弱比较（忽略参数名）
 * 3) 已知模式特判（例如 NonNullable<...["type"]> 与按钮 type 联合字面量）
 */
function isTypeEquivalent(
  sourceTypeResolved: string | null,
  sourceTypeRaw: string | null,
  docsType: string | null,
): boolean {
  if (docsType === null) {
    return true;
  }

  const candidates = [sourceTypeResolved, sourceTypeRaw].filter(
    (item): item is string => item !== null,
  );
  if (candidates.length === 0) {
    return false;
  }

  const docsNormalized = normalizeTypeText(docsType);
  const docsFunctionNormalized = docsNormalized
    ? normalizeFunctionTypeSignature(docsNormalized)
    : null;

  for (const candidate of candidates) {
    const sourceNormalized = normalizeTypeText(candidate);
    const sourceFunctionNormalized = sourceNormalized
      ? normalizeFunctionTypeSignature(sourceNormalized)
      : null;

    if (sourceNormalized === docsNormalized) {
      return true;
    }
    if (
      docsFunctionNormalized !== null &&
      sourceFunctionNormalized === docsFunctionNormalized
    ) {
      return true;
    }
  }

  // 已知模式：htmlType（NativeButtonType）常表示为 NonNullable<...["type"]>。
  // 文档更常写成字面量联合，这里做特判以避免误报。
  const htmlTypeUnion = '"button" | "reset" | "submit"';
  const sourceLooksLikeNativeButtonType = candidates.some((candidate) =>
    /NonNullable<.*\["type"\]\s*>/.test(candidate.replace(/\s+/g, " ")),
  );
  const sourceContainsNativeButtonHint = candidates.some((candidate) =>
    /NativeButtonType|ButtonHTMLAttributes<\s*HTMLButtonElement\s*>/.test(candidate),
  );
  if (
    docsNormalized === htmlTypeUnion &&
    (sourceLooksLikeNativeButtonType || sourceContainsNativeButtonHint)
  ) {
    return true;
  }

  // 已知模式：RowKey<T> 常被展开/书写为
  // `keyof T | (record: T) => Key` 或 `(record: T) => Key | keyof T`，
  // 由于函数类型与联合类型的括号优先级差异，文本可能不同但语义接近。
  const looksLikeRowKey = (text: string): boolean =>
    text.includes("keyof T") &&
    text.includes("(record: T) => Key");
  if (
    docsNormalized !== null &&
    candidates.some((candidate) => looksLikeRowKey(candidate)) &&
    looksLikeRowKey(docsNormalized)
  ) {
    return true;
  }

  return false;
}

function main(): void {
  const rootDir = path.resolve(process.cwd());
  const rules = buildEffectiveRules(rootDir);
  const sourceSchemaPath = path.join(
    rootDir,
    "packages/ui/artifacts/components.schema.json",
  );
  const docsSchemaPath = path.join(rootDir, "apps/docs/artifacts/docs.schema.json");
  const reportDir = path.join(rootDir, "artifacts");
  const reportPath = path.join(reportDir, "doc-sync.report.json");
  const markdownPath = path.join(reportDir, "doc-sync.md");

  const sourceSchema = readJsonFile<SourceSchemaFile>(sourceSchemaPath);
  const docsSchema = readJsonFile<DocsSchemaFile>(docsSchemaPath);
  const issues: SyncIssue[] = [];

  /**
   * 统一创建 issue，集中处理：
   * - severity 级别（由 rules 控制）
   * - allowlist（属性级白名单）
   * - ignore（组件/规则级忽略）
   */
  const addIssue = (payload: {
    componentName: string;
    type: IssueType;
    detail: string;
    propName?: string;
  }): void => {
    if (isAllowlisted(rules, payload.type, payload.componentName, payload.propName)) {
      return;
    }

    const level = rules.severity[payload.type] ?? "warn";
    const issue: SyncIssue = {
      componentName: payload.componentName,
      propName: payload.propName,
      type: payload.type,
      level,
      detail: payload.detail,
    };

    if (isIgnoredByRules(rules, issue)) {
      return;
    }

    issues.push(issue);
  };

  /**
   * 对某一类“属性集合问题”应用属性级白名单过滤。
   * 例如 missing_in_source 里，允许忽略 Button.className、Button.disabled。
   */
  const filterPropNamesByAllowlist = (
    issueType: IssueType,
    componentName: string,
    propNames: string[],
  ): string[] =>
    propNames.filter(
      (propName) => !isAllowlisted(rules, issueType, componentName, propName),
    );

  const docsMap = new Map<string, DocsComponent>();
  for (const component of docsSchema.components) {
    docsMap.set(component.componentName.toLowerCase(), component);
  }

  const sourceMap = new Map<string, SourceComponent>();
  for (const component of sourceSchema.components) {
    sourceMap.set(component.componentName.toLowerCase(), component);
  }

  // 第 1 步：以源码为准，检查文档是否存在、文档属性是否覆盖源码属性。
  for (const sourceComponent of sourceSchema.components) {
    const key = sourceComponent.componentName.toLowerCase();
    const docsComponent = docsMap.get(key);

    if (!docsComponent) {
      addIssue({
        componentName: sourceComponent.componentName,
        type: "missing_doc_file",
        detail: `未找到对应文档文件，源码：${sourceComponent.sourceFile}`,
      });
      continue;
    }

    // 优先使用 API 表的属性集合做对齐，避免示例代码里的噪音字段影响结果。
    const apiProps =
      docsComponent.props?.filter((prop) => prop.source === "api_table") ?? [];
    const docsPropsForCompare =
      apiProps.length > 0
        ? apiProps
        : docsComponent.documentedProps.map((name) => ({
            name,
            type: null,
            default: null,
            required: null,
            source: "example" as const,
          }));

    const sourcePropSet = new Set(sourceComponent.props.map((prop) => prop.name));
    const docsPropSet = new Set(docsPropsForCompare.map((prop) => prop.name));
    const docsPropMap = new Map<string, DocsProp>();
    for (const prop of docsPropsForCompare) {
      docsPropMap.set(prop.name, prop);
    }
    const sourcePropMap = new Map<string, SourceProp>();
    for (const prop of sourceComponent.props) {
      sourcePropMap.set(prop.name, prop);
    }

    const missingInDocsRaw = diffSet(sourcePropSet, docsPropSet);
    const missingInDocs = filterPropNamesByAllowlist(
      "missing_in_docs",
      sourceComponent.componentName,
      missingInDocsRaw,
    );
    if (missingInDocs.length > 0) {
      addIssue({
        componentName: sourceComponent.componentName,
        type: "missing_in_docs",
        detail: `文档缺少属性：${missingInDocs.join(", ")}`,
      });
    }

    const missingInSourceRaw = diffSet(docsPropSet, sourcePropSet);
    const missingInSource = filterPropNamesByAllowlist(
      "missing_in_source",
      sourceComponent.componentName,
      missingInSourceRaw,
    );
    if (missingInSource.length > 0) {
      addIssue({
        componentName: sourceComponent.componentName,
        type: "missing_in_source",
        detail: `文档存在但源码未定义：${missingInSource.join(", ")}`,
      });
    }

    // 在“共同存在”的属性上做字段级比对。
    const sharedProps = Array.from(sourcePropSet).filter((name) => docsPropSet.has(name));
    for (const propName of sharedProps) {
      const sourceProp = sourcePropMap.get(propName);
      const docsProp = docsPropMap.get(propName);
      if (!sourceProp || !docsProp) {
        continue;
      }

      // type_mismatch：仅当文档明确给了类型时校验。
      const sourceTypeResolved = normalizeTypeText(
        sourceProp.resolvedType ?? sourceProp.type,
      );
      const sourceTypeRaw = normalizeTypeText(sourceProp.type);
      const docsType = normalizeTypeText(docsProp.type);
      const typeMatched = isTypeEquivalent(sourceTypeResolved, sourceTypeRaw, docsType);

      if (!typeMatched) {
        addIssue({
          componentName: sourceComponent.componentName,
          propName,
          type: "type_mismatch",
          detail: `属性 ${propName} 类型不一致：源码=${sourceTypeResolved ?? sourceTypeRaw ?? "null"}，文档=${docsType}`,
        });
      }

      // default_mismatch：仅当文档明确给了默认值时校验。
      const sourceDefault = normalizeDefaultValue(sourceProp.default);
      const docsDefault = normalizeDefaultValue(docsProp.default);
      if (docsDefault !== null && sourceDefault !== docsDefault) {
        addIssue({
          componentName: sourceComponent.componentName,
          propName,
          type: "default_mismatch",
          detail: `属性 ${propName} 默认值不一致：源码=${sourceDefault ?? "undefined"}，文档=${docsDefault}`,
        });
      }
    }
  }

  // 第 2 步：反向检查“文档有组件但源码没有”。
  for (const docsComponent of docsSchema.components) {
    const key = docsComponent.componentName.toLowerCase();
    if (!sourceMap.has(key)) {
      addIssue({
        componentName: docsComponent.componentName,
        type: "doc_without_source",
        detail: `文档存在但未找到同名源码组件，文档：${docsComponent.docFile}`,
      });
    }
  }

  const errorCount = issues.filter((issue) => issue.level === "error").length;
  const warnCount = issues.filter((issue) => issue.level === "warn").length;

  const report: SyncReport = {
    generatedAt: new Date().toISOString(),
    sourceSchemaFile: path.relative(rootDir, sourceSchemaPath),
    docsSchemaFile: path.relative(rootDir, docsSchemaPath),
    summary: {
      totalComponentsInSource: sourceSchema.components.length,
      totalComponentsInDocs: docsSchema.components.length,
      errorCount,
      warnCount,
    },
    issues,
  };

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  fs.writeFileSync(markdownPath, renderMarkdownReport(report), "utf8");

  console.log("文档同步检查完成");
  console.log(`报告文件：${path.relative(rootDir, reportPath)}`);
  console.log(`Markdown 摘要：${path.relative(rootDir, markdownPath)}`);
  console.log(`错误：${errorCount}，警告：${warnCount}`);

  for (const issue of issues) {
    const prefix = issue.level === "error" ? "ERROR" : "WARN";
    console.log(`[${prefix}] ${issue.componentName} - ${issue.detail}`);
  }

  // 最小闭环策略：只要有 error 就返回非 0，便于 CI 阻断。
  if (errorCount > 0) {
    process.exit(1);
  }
}

main();
