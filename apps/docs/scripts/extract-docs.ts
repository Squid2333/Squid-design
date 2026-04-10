import fs from "node:fs";
import path from "node:path";

type DocsComponentSchema = {
  componentName: string;
  docFile: string;
  documentedProps: string[];
  props: DocsPropSchema[];
};

type DocsSchemaFile = {
  generatedAt: string;
  docsRoot: string;
  components: DocsComponentSchema[];
};

/**
 * 文档侧单个属性结构。
 * 说明：
 * - type/default/required 可能为空，因为并不是所有文档都会写全。
 * - source 用于标记属性来自哪里（API 表、示例代码、正文文本），
 *   后续校验时可优先使用 API 表数据，降低噪音。
 */
type DocsPropSchema = {
  name: string;
  type: string | null;
  default: string | null;
  required: boolean | null;
  source: "api_table" | "example" | "text";
};

/**
 * 解析 docs 包目录。
 * 兼容在仓库根目录执行和在 apps/docs 目录执行两种方式。
 */
function resolveDocsDir(cwd: string): string {
  const runInDocsDir = fs.existsSync(path.join(cwd, "docs/components"));
  if (runInDocsDir) {
    return cwd;
  }
  return path.join(cwd, "apps/docs");
}

/**
 * 将 markdown 文件名转为组件名（PascalCase）。
 * 示例：
 * - button.md -> Button
 * - upload.md -> Upload
 * - some-component.md -> SomeComponent
 */
function fileNameToComponentName(fileName: string): string {
  return fileName
    .replace(/\.md$/, "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

/**
 * 提取 Markdown 中所有代码块内容。
 * 支持 tsx/jsx/ts/js。
 */
function extractCodeBlocks(markdown: string): string[] {
  const blocks: string[] = [];
  const codeBlockPattern = /```(?:tsx|jsx|ts|js)?\n([\s\S]*?)```/g;
  let match = codeBlockPattern.exec(markdown);

  while (match) {
    blocks.push(match[1]);
    match = codeBlockPattern.exec(markdown);
  }

  return blocks;
}

/**
 * 从代码块里提取组件标签上的属性。
 * 例如：
 *   <Button type="primary" disabled />
 * 会提取出：type、disabled
 */
function extractPropsFromComponentTags(code: string, componentName: string): string[] {
  const propSet = new Set<string>();
  const tagPattern = new RegExp(`<${componentName}\\b([\\s\\S]*?)>`, "g");
  const selfClosingPattern = new RegExp(`<${componentName}\\b([\\s\\S]*?)\\/>`, "g");
  const attrChunks: string[] = [];

  let match = tagPattern.exec(code);
  while (match) {
    attrChunks.push(match[1]);
    match = tagPattern.exec(code);
  }

  match = selfClosingPattern.exec(code);
  while (match) {
    attrChunks.push(match[1]);
    match = selfClosingPattern.exec(code);
  }

  for (const attrsChunk of attrChunks) {
    // 清除属性展开写法，避免把 ...props 当成属性名。
    // 同时清理字符串和 JSX 表达式，避免把属性值里的英文单词误识别为属性名。
    const cleaned = attrsChunk
      .replace(/\{\.\.\.[^}]*\}/g, " ")
      .replace(/"[^"]*"/g, '""')
      .replace(/'[^']*'/g, "''")
      .replace(/\{[^}]*\}/g, "{}");
    const attrPattern = /(?:^|\s)([A-Za-z_][\w-]*)(?=(\s*=|\s|$))/g;
    let attrMatch = attrPattern.exec(cleaned);

    while (attrMatch) {
      const attr = attrMatch[1];
      if (!["return", "const", "function"].includes(attr)) {
        propSet.add(attr);
      }
      attrMatch = attrPattern.exec(cleaned);
    }
  }

  return Array.from(propSet);
}

/**
 * 从正文反引号中提取属性名提示。
 * 例如：
 *   使用 `disabled` 属性...
 * 这样可以补充“文字提到但示例未覆盖”的属性。
 */
function extractPropsFromBackticks(markdown: string): string[] {
  const propSet = new Set<string>();
  const pattern = /`([a-z][\w-]{1,40})`\s*(?:属性|prop)/gi;
  let match = pattern.exec(markdown);

  while (match) {
    const token = match[1];
    if (!token.includes("/") && !token.includes("@")) {
      propSet.add(token);
    }
    match = pattern.exec(markdown);
  }

  return Array.from(propSet);
}

/**
 * 将 markdown 表格行拆分成单元格。
 * 这里不能直接 line.split("|")，因为类型里会出现 `\|`（转义竖线）。
 * 我们只在“未被反斜杠转义”的 `|` 处分割。
 */
function splitMarkdownTableRow(line: string): string[] {
  const cells: string[] = [];
  let current = "";

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const prev = i > 0 ? line[i - 1] : "";
    if (char === "|" && prev !== "\\") {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());

  // 表格行首尾通常有空单元格（因为 `| a | b |`），这里做一次清理。
  while (cells.length > 0 && cells[0] === "") {
    cells.shift();
  }
  while (cells.length > 0 && cells[cells.length - 1] === "") {
    cells.pop();
  }

  return cells;
}

/**
 * 标准化表格单元格文本：
 * - 去掉包裹反引号
 * - 去掉多余空格
 */
function normalizeTableCellText(cell: string): string {
  const trimmed = cell.trim();
  if (trimmed.startsWith("`") && trimmed.endsWith("`")) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * 识别并解析“组件 API 主表”。
 * 设计原则：
 * - 只解析与当前组件强相关的标题段（例如 `### Button Attributes` / `### Form Props`）；
 * - 跳过 Rule、Pagination 这类子结构表，避免把非组件顶层 prop 混入。
 */
function extractPropsFromComponentApiTables(
  markdown: string,
  componentName: string,
): DocsPropSchema[] {
  const lines = markdown.split("\n");
  const props: DocsPropSchema[] = [];
  let currentHeading = "";

  // 判断当前标题是否属于“组件主 API 表”。
  // 示例命中：
  // - Button Attributes
  // - Form Props
  // - Select Props
  const isMainComponentTableHeading = (heading: string): boolean => {
    const normalized = heading.trim().toLowerCase();
    const comp = componentName.toLowerCase();
    // 使用“精确组件名 + 空格 + Props/Attributes”的匹配方式，
    // 避免把 `Form.Item Props`、`TableColumn Attributes` 误判成主组件表。
    const escapedComp = comp.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${escapedComp}\\s+(props|attributes)\\b`, "i");
    return pattern.test(normalized);
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();

    // 记录最近标题，用于判断后续表格是否应被解析。
    const headingMatch = /^(#{2,4})\s+(.+)$/.exec(line);
    if (headingMatch) {
      currentHeading = headingMatch[2].trim();
      continue;
    }

    // 只处理 markdown 表格头（属性名/类型/默认值）。
    if (!line.startsWith("|")) {
      continue;
    }

    if (!isMainComponentTableHeading(currentHeading)) {
      continue;
    }

    const headerCells = splitMarkdownTableRow(line).map(normalizeTableCellText);
    if (headerCells.length < 3) {
      continue;
    }

    // 识别常见列索引：
    // 属性名 | 说明 | 类型 | 默认值
    const nameIndex = headerCells.findIndex((cell) => cell.includes("属性名"));
    const typeIndex = headerCells.findIndex((cell) => cell.includes("类型"));
    const defaultIndex = headerCells.findIndex((cell) => cell.includes("默认值"));

    if (nameIndex < 0 || typeIndex < 0) {
      continue;
    }

    // 下一行必须是分隔线行（---），否则不是规范表格。
    const separatorLine = lines[i + 1]?.trim() ?? "";
    if (!separatorLine.startsWith("|")) {
      continue;
    }

    // 从数据行开始读取。
    let rowIndex = i + 2;
    while (rowIndex < lines.length) {
      const rowLine = lines[rowIndex].trim();
      if (!rowLine.startsWith("|")) {
        break;
      }

      const rowCells = splitMarkdownTableRow(rowLine).map(normalizeTableCellText);
      const propNameRaw = rowCells[nameIndex] ?? "";
      const typeRaw = rowCells[typeIndex] ?? "";
      const defaultRaw = defaultIndex >= 0 ? rowCells[defaultIndex] ?? "" : "";

      const propName = propNameRaw.replace(/^["'`]|["'`]$/g, "").trim();
      if (propName !== "" && propName !== "---") {
        props.push({
          name: propName,
          type: typeRaw === "" ? null : typeRaw,
          default: defaultRaw === "" ? null : defaultRaw,
          required: null,
          source: "api_table",
        });
      }

      rowIndex += 1;
    }
  }

  // 去重：同名 prop 以“信息更全”的那条为准。
  const unique = new Map<string, DocsPropSchema>();
  for (const prop of props) {
    const current = unique.get(prop.name);
    if (!current) {
      unique.set(prop.name, prop);
      continue;
    }
    const score = (item: DocsPropSchema): number =>
      Number(item.type !== null) + Number(item.default !== null);
    if (score(prop) > score(current)) {
      unique.set(prop.name, prop);
    }
  }

  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function main(): void {
  const cwd = path.resolve(process.cwd());
  const docsDir = resolveDocsDir(cwd);
  const docsComponentsDir = path.join(docsDir, "docs/components");
  const outputDir = path.join(docsDir, "artifacts");
  const outputFile = path.join(outputDir, "docs.schema.json");

  if (!fs.existsSync(docsComponentsDir)) {
    console.error("未找到文档组件目录：", docsComponentsDir);
    process.exit(1);
  }

  const mdFiles = fs
    .readdirSync(docsComponentsDir)
    .filter((file) => file.endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));

  const components: DocsComponentSchema[] = [];

  for (const mdFile of mdFiles) {
    const absPath = path.join(docsComponentsDir, mdFile);
    const markdown = fs.readFileSync(absPath, "utf8");
    const componentName = fileNameToComponentName(mdFile);
    const codeBlocks = extractCodeBlocks(markdown);
    const propSet = new Set<string>();
    const propMap = new Map<string, DocsPropSchema>();

    // 第 1 层（主数据源）：从 API 表中抽取类型/默认值。
    for (const prop of extractPropsFromComponentApiTables(markdown, componentName)) {
      propSet.add(prop.name);
      propMap.set(prop.name, prop);
    }

    // 第 2 层（补充）：从示例代码中提取出现过的属性名。
    for (const code of codeBlocks) {
      for (const prop of extractPropsFromComponentTags(code, componentName)) {
        propSet.add(prop);
        if (!propMap.has(prop)) {
          propMap.set(prop, {
            name: prop,
            type: null,
            default: null,
            required: null,
            source: "example",
          });
        }
      }
    }

    // 第 3 层（补充）：从正文反引号提取属性名提示。
    for (const prop of extractPropsFromBackticks(markdown)) {
      propSet.add(prop);
      if (!propMap.has(prop)) {
        propMap.set(prop, {
          name: prop,
          type: null,
          default: null,
          required: null,
          source: "text",
        });
      }
    }

    components.push({
      componentName,
      docFile: path.relative(docsDir, absPath),
      documentedProps: Array.from(propSet).sort((a, b) => a.localeCompare(b)),
      props: Array.from(propMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  const output: DocsSchemaFile = {
    generatedAt: new Date().toISOString(),
    docsRoot: path.relative(docsDir, docsComponentsDir),
    components,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), "utf8");

  console.log(`已生成：${path.relative(docsDir, outputFile)}`);
  console.log(`共抽取文档组件：${components.length}`);
}

main();
