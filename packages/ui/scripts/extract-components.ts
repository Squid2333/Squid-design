import fs from "node:fs";
import path from "node:path";
import {
  Node,
  Project,
  SyntaxKind,
  type BindingElement,
  type ExportDeclaration,
  type FunctionDeclaration,
  type InterfaceDeclaration,
  type ObjectBindingPattern,
  type PropertySignature,
  type SourceFile,
  type TypeAliasDeclaration,
  type VariableDeclaration,
} from "ts-morph";

type PropSchema = {
  name: string;
  type: string;
  resolvedType: string;
  required: boolean;
  default: string | null;
  isEvent: boolean;
};

type ExportItem = {
  name: string;
  from: string;
  isTypeOnly: boolean;
};

type ComponentSchema = {
  componentName: string;
  sourceFile: string;
  props: PropSchema[];
  events: string[];
  exports: {
    entryFile: string;
    defaultExport: {
      from: string;
    } | null;
    namedExports: ExportItem[];
  };
};

type ComponentsSchemaFile = {
  generatedAt: string;
  sourceRoot: string;
  components: ComponentSchema[];
};

type ComponentEntry = {
  componentName: string;
  entrySourceFile: SourceFile;
  entryFilePath: string;
  defaultImplFilePath: string | null;
  namedExports: ExportItem[];
};

type ResolvedFunctionInfo = {
  functionNode: FunctionDeclaration | null;
  propsTypeName: string | null;
  defaultsByProp: Map<string, string>;
};

/**
 * 解析 UI 包目录。
 * 兼容在仓库根目录和在 packages/ui 目录两种运行方式。
 */
function resolveUiDir(cwd: string): string {
  const runInUiDir = fs.existsSync(path.join(cwd, "src/components"));
  if (runInUiDir) {
    return cwd;
  }
  return path.join(cwd, "packages/ui");
}

/**
 * 将 import/export 的相对模块路径转换为绝对文件路径。
 * 说明：
 * - 仓库中存在 `./Button.tsx` / `./interface.ts` / `./xxx/index.ts` 这几类路径；
 * - 为了提高容错率，这里按常见后缀逐个探测；
 * - 找不到时返回 null，由上层做降级处理。
 */
function resolveModuleFilePath(
  fromFilePath: string,
  moduleSpecifier: string,
): string | null {
  if (!moduleSpecifier.startsWith(".")) {
    return null;
  }

  const basePath = path.resolve(path.dirname(fromFilePath), moduleSpecifier);
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.mts`,
    `${basePath}.cts`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * 从根入口 `src/index.ts` 读取对外公开组件列表。
 * 只收集 `export { default as Xxx } from "..."` 这类导出，
 * 这样能确保治理范围聚焦在“公共 API 组件”。
 */
function getPublicComponentEntries(project: Project, uiDir: string): ComponentEntry[] {
  const indexPath = path.join(uiDir, "src/index.ts");
  const rootIndexFile = project.getSourceFile(indexPath);

  if (!rootIndexFile) {
    return [];
  }

  const entries: ComponentEntry[] = [];

  for (const exportDecl of rootIndexFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue();
    if (!moduleSpecifier) {
      continue;
    }

    for (const namedExport of exportDecl.getNamedExports()) {
      // 目标模式：export { default as Button } from "...";
      if (namedExport.getName() !== "default") {
        continue;
      }

      const aliasNode = namedExport.getAliasNode();
      if (!aliasNode) {
        continue;
      }

      const componentName = aliasNode.getText();
      const entryFilePath = resolveModuleFilePath(indexPath, moduleSpecifier);
      if (!entryFilePath) {
        continue;
      }

      const entrySourceFile = project.getSourceFile(entryFilePath);
      if (!entrySourceFile) {
        continue;
      }

      const { defaultImplFilePath, namedExports } =
        collectExportsFromComponentEntry(entrySourceFile, uiDir);

      entries.push({
        componentName,
        entrySourceFile,
        entryFilePath,
        defaultImplFilePath,
        namedExports,
      });
    }
  }

  return entries.sort((a, b) => a.componentName.localeCompare(b.componentName));
}

/**
 * 读取组件级入口文件（如 Button/index.ts）中的导出信息。
 * 我们关心两类数据：
 * 1) 默认导出来自哪个实现文件（defaultExport.from）
 * 2) 还有哪些具名导出（namedExports）
 */
function collectExportsFromComponentEntry(
  entrySourceFile: SourceFile,
  uiDir: string,
): {
  defaultImplFilePath: string | null;
  namedExports: ExportItem[];
} {
  let defaultImplFilePath: string | null = null;
  const namedExports: ExportItem[] = [];

  for (const exportDecl of entrySourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue();
    if (!moduleSpecifier) {
      continue;
    }

    const resolvedFrom = resolveModuleFilePath(
      entrySourceFile.getFilePath(),
      moduleSpecifier,
    );
    const fromText = resolvedFrom
      ? path.relative(uiDir, resolvedFrom)
      : moduleSpecifier;

    for (const namedExport of exportDecl.getNamedExports()) {
      const exportedName = namedExport.getAliasNode()?.getText() ?? namedExport.getName();
      // 只有 `export { default } from "...";` 才算组件默认导出。
      // `export { default as Dragger }` 属于具名导出，不能覆盖 defaultExport。
      const isDefault =
        namedExport.getName() === "default" && !namedExport.getAliasNode();
      const isTypeOnly =
        exportDecl.isTypeOnly() ||
        namedExport.getNameNode().getKind() === SyntaxKind.TypeKeyword;

      if (isDefault) {
        defaultImplFilePath = resolvedFrom ?? defaultImplFilePath;
        continue;
      }

      namedExports.push({
        name: exportedName,
        from: fromText,
        isTypeOnly,
      });
    }
  }

  // 去重 + 稳定排序，保证输出稳定。
  const unique = new Map<string, ExportItem>();
  for (const item of namedExports) {
    unique.set(`${item.name}|${item.from}|${item.isTypeOnly}`, item);
  }

  return {
    defaultImplFilePath,
    namedExports: Array.from(unique.values()).sort((a, b) =>
      `${a.name}:${a.from}`.localeCompare(`${b.name}:${b.from}`),
    ),
  };
}

/**
 * 解析对象解构参数中的默认值。
 * 例如：
 *   function Button({ size = "medium", disabled = false }: ButtonProps)
 * 会得到：
 *   size -> "\"medium\""
 *   disabled -> "false"
 */
function extractDefaultsFromBindingPattern(
  objectBindingPattern: ObjectBindingPattern,
): Map<string, string> {
  const defaults = new Map<string, string>();

  for (const element of objectBindingPattern.getElements()) {
    const propName = getBindingElementPropertyName(element);
    if (!propName) {
      continue;
    }

    const initializer = element.getInitializer();
    if (initializer) {
      defaults.set(propName, initializer.getText());
    }
  }

  return defaults;
}

/**
 * 从解构元素中拿到“属性名”。
 * 兼容写法：
 * - { size }
 * - { size: localSize }
 */
function getBindingElementPropertyName(element: BindingElement): string | null {
  const propertyNameNode = element.getPropertyNameNode();
  if (propertyNameNode) {
    return propertyNameNode.getText();
  }

  const nameNode = element.getNameNode();
  if (Node.isIdentifier(nameNode)) {
    return nameNode.getText();
  }

  return null;
}

/**
 * 从参数类型文本里提取基础类型名。
 * 例如：
 * - TableProps<T> -> TableProps
 * - Foo.BarProps -> BarProps
 */
function normalizePropsTypeName(typeText: string): string {
  const withoutGeneric = typeText.split("<")[0].trim();
  const segments = withoutGeneric.split(".");
  return segments[segments.length - 1];
}

/**
 * 从一个 SourceFile 中查找给定类型名对应的声明（type / interface）。
 * 说明：
 * - 先查当前文件；
 * - 再查当前文件的本地 import（仅处理相对路径模块）；
 * - 支持 import 别名（例如 `import type { Foo as Bar }`）。
 */
function findTypeDeclarationByName(
  sourceFile: SourceFile,
  typeName: string,
  project: Project,
): TypeAliasDeclaration | InterfaceDeclaration | null {
  const localTypeAlias = sourceFile.getTypeAlias(typeName);
  if (localTypeAlias) {
    return localTypeAlias;
  }
  const localInterface = sourceFile.getInterface(typeName);
  if (localInterface) {
    return localInterface;
  }

  for (const importDecl of sourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    if (!moduleSpecifier?.startsWith(".")) {
      continue;
    }

    // 仅在“明确 import 了这个名字”时才继续，避免无意义扫描。
    const namedImports = importDecl.getNamedImports();
    const matchedImport = namedImports.find((item) => {
      const importName = item.getNameNode().getText();
      const aliasName = item.getAliasNode()?.getText();
      return importName === typeName || aliasName === typeName;
    });
    if (!matchedImport) {
      continue;
    }

    const targetFilePath = resolveModuleFilePath(sourceFile.getFilePath(), moduleSpecifier);
    if (!targetFilePath) {
      continue;
    }

    const targetSourceFile = project.getSourceFile(targetFilePath);
    if (!targetSourceFile) {
      continue;
    }

    // 注意：如果 import 使用了别名，需要回到“原始导出名”查声明。
    const targetName = matchedImport.getNameNode().getText();
    const targetTypeAlias = targetSourceFile.getTypeAlias(targetName);
    if (targetTypeAlias) {
      return targetTypeAlias;
    }
    const targetInterface = targetSourceFile.getInterface(targetName);
    if (targetInterface) {
      return targetInterface;
    }
  }

  return null;
}

/**
 * 递归展开“类型别名”，返回更接近文档描述的类型文本。
 * 例如：
 * - ButtonColor -> "default" | "primary" | "danger"
 * - SelectValue -> string | string[]
 *
 * 设计边界：
 * - 主要解决一层或多层别名链；
 * - 复杂泛型（如 RowKey<T>）保留原样，避免错误展开。
 */
function resolveTypeAliasText(
  sourceFile: SourceFile,
  rawTypeText: string,
  project: Project,
  seen: Set<string> = new Set(),
): string {
  const normalized = rawTypeText.trim().replace(/;$/, "");

  /**
   * 先处理“单标识符”的类型别名展开。
   * 例如：
   * - ButtonColor -> "default" | "primary" | "danger"
   * - SelectValue -> string | string[]
   */
  const resolveSingleIdentifier = (
    identifier: string,
    currentSourceFile: SourceFile,
    currentSeen: Set<string>,
  ): string => {
    if (currentSeen.has(identifier)) {
      return identifier;
    }
    currentSeen.add(identifier);

    const declaration = findTypeDeclarationByName(currentSourceFile, identifier, project);
    if (!declaration) {
      return identifier;
    }

    if (Node.isTypeAliasDeclaration(declaration)) {
      const typeNode = declaration.getTypeNode();
      if (!typeNode) {
        return identifier;
      }
      const aliasText = typeNode.getText().trim();
      return resolveTypeAliasText(
        declaration.getSourceFile(),
        aliasText,
        project,
        currentSeen,
      );
    }

    // interface 默认保留名称；需要对象展开可后续增强。
    return identifier;
  };

  // 情况 1：纯标识符类型，直接展开。
  if (/^[A-Za-z_]\w*$/.test(normalized)) {
    return resolveSingleIdentifier(normalized, sourceFile, seen);
  }

  /**
   * 情况 2：复杂表达式（函数、泛型、联合等）。
   * 这里做“温和展开”：仅替换以大写开头的标识符，尽量不动关键字和字面量。
   * 典型收益：
   * - (value: SelectValue) => void
   *   展开为
   * - (value: string | string[]) => void
   */
  const builtInTypeNames = new Set([
    "String",
    "Number",
    "Boolean",
    "Object",
    "Array",
    "Promise",
    "Record",
    "Partial",
    "Required",
    "Readonly",
    "Pick",
    "Omit",
    "Exclude",
    "Extract",
    "NonNullable",
    "ReturnType",
    "Parameters",
    "ConstructorParameters",
    "InstanceType",
    "ReactNode",
    "CSSProperties",
    "File",
    "Error",
    "Key",
    "T",
  ]);

  const expanded = normalized.replace(/\b([A-Za-z_]\w*)\b/g, (token) => {
    // 仅尝试展开以大写开头的类型名，避免误碰到普通标识符与字符串字面量内容。
    if (!/^[A-Z]/.test(token)) {
      return token;
    }
    if (builtInTypeNames.has(token)) {
      return token;
    }

    const resolved = resolveSingleIdentifier(token, sourceFile, new Set(seen));
    return resolved;
  });

  return expanded;
}

/**
 * 解析某个默认导出组件对应的“函数实现 + 参数类型 + 默认值”。
 * 兼容场景：
 * 1) export default function Button(...) {}
 * 2) function FormRoot(...) {} ; const Form = FormRoot as X ; export default Form;
 */
function resolveComponentFunctionInfo(
  implSourceFile: SourceFile,
  componentName: string,
): ResolvedFunctionInfo {
  const exportAssignment = implSourceFile.getExportAssignment((item) => !item.isExportEquals());

  // 辅助函数：从函数节点读取 props 类型名和解构默认值。
  const readFunctionInfo = (fn: FunctionDeclaration | null): ResolvedFunctionInfo => {
    if (!fn) {
      return {
        functionNode: null,
        propsTypeName: null,
        defaultsByProp: new Map<string, string>(),
      };
    }

    const firstParam = fn.getParameters()[0];
    if (!firstParam) {
      return {
        functionNode: fn,
        propsTypeName: null,
        defaultsByProp: new Map<string, string>(),
      };
    }

    const propsTypeNode = firstParam.getTypeNode();
    const propsTypeName = propsTypeNode
      ? normalizePropsTypeName(propsTypeNode.getText())
      : null;
    const defaultsByProp = Node.isObjectBindingPattern(firstParam.getNameNode())
      ? extractDefaultsFromBindingPattern(firstParam.getNameNode())
      : new Map<string, string>();

    return {
      functionNode: fn,
      propsTypeName,
      defaultsByProp,
    };
  };

  // 情况 1：直接是默认导出的函数声明。
  const directDefaultFunction = implSourceFile.getFunctions().find((fn) => fn.isDefaultExport());
  if (directDefaultFunction) {
    return readFunctionInfo(directDefaultFunction);
  }

  // 情况 2：默认导出是某个标识符（例如 export default Form）。
  if (exportAssignment) {
    const expr = exportAssignment.getExpression();
    if (Node.isIdentifier(expr)) {
      const exportName = expr.getText();
      const fnByName = implSourceFile.getFunction(exportName);
      if (fnByName) {
        return readFunctionInfo(fnByName);
      }

      // 处理 const Form = FormRoot as FormComponent 的间接引用。
      const variableDecl = implSourceFile.getVariableDeclaration(exportName);
      if (variableDecl) {
        const initializer = variableDecl.getInitializer();
        if (initializer) {
          // 先剥离 as 表达式。
          const identifier =
            Node.isAsExpression(initializer) && Node.isIdentifier(initializer.getExpression())
              ? initializer.getExpression()
              : Node.isIdentifier(initializer)
                ? initializer
                : null;

          if (identifier) {
            const referencedFn = implSourceFile.getFunction(identifier.getText());
            if (referencedFn) {
              return readFunctionInfo(referencedFn);
            }
          }
        }
      }
    }
  }

  // 情况 3：兜底策略，按组件名找同名函数。
  const fnByComponentName = implSourceFile.getFunction(componentName);
  if (fnByComponentName) {
    return readFunctionInfo(fnByComponentName);
  }

  // 情况 4：最后兜底，找第一个拥有 Props 参数的函数。
  const fallbackFunction = implSourceFile
    .getFunctions()
    .find((fn) => fn.getParameters()[0]?.getTypeNode()?.getText().includes("Props"));

  return readFunctionInfo(fallbackFunction ?? null);
}

/**
 * 在实现文件及其 import 中查找 Props 类型声明。
 * 查找顺序：
 * 1) 当前文件内的 type/interface
 * 2) 从当前文件 import 的本地文件（如 ./interface.ts）
 */
function findPropsDeclaration(
  implSourceFile: SourceFile,
  propsTypeName: string,
  project: Project,
): TypeAliasDeclaration | InterfaceDeclaration | null {
  const localTypeAlias = implSourceFile.getTypeAlias(propsTypeName);
  if (localTypeAlias) {
    return localTypeAlias;
  }

  const localInterface = implSourceFile.getInterface(propsTypeName);
  if (localInterface) {
    return localInterface;
  }

  for (const importDecl of implSourceFile.getImportDeclarations()) {
    const moduleSpecifier = importDecl.getModuleSpecifierValue();
    if (!moduleSpecifier?.startsWith(".")) {
      continue;
    }

    const targetFilePath = resolveModuleFilePath(
      implSourceFile.getFilePath(),
      moduleSpecifier,
    );
    if (!targetFilePath) {
      continue;
    }

    const targetSourceFile = project.getSourceFile(targetFilePath);
    if (!targetSourceFile) {
      continue;
    }

    const targetTypeAlias = targetSourceFile.getTypeAlias(propsTypeName);
    if (targetTypeAlias) {
      return targetTypeAlias;
    }

    const targetInterface = targetSourceFile.getInterface(propsTypeName);
    if (targetInterface) {
      return targetInterface;
    }
  }

  return null;
}

/**
 * 将 TypeAlias / Interface 转成属性签名列表。
 * 设计目标：
 * - 聚焦“组件自己定义的 props”；
 * - 避免把 Omit<HTMLAttributes<...>> 展开的超大量属性带进来。
 *
 * 因此这里优先抽取 type literal 的显式成员：
 * - interface Foo { ... }
 * - type Foo = { ... }
 * - type Foo = Xxx & { ... } 中的大括号部分
 */
function extractPropertySignaturesFromPropsDeclaration(
  declaration: TypeAliasDeclaration | InterfaceDeclaration,
): PropertySignature[] {
  if (Node.isInterfaceDeclaration(declaration)) {
    return declaration
      .getMembers()
      .filter((member): member is PropertySignature => Node.isPropertySignature(member));
  }

  const typeNode = declaration.getTypeNode();
  if (!typeNode) {
    return [];
  }

  if (Node.isTypeLiteral(typeNode)) {
    return typeNode
      .getMembers()
      .filter((member): member is PropertySignature => Node.isPropertySignature(member));
  }

  if (Node.isIntersectionTypeNode(typeNode)) {
    const typeLiteralNode = typeNode.getTypeNodes().find((node) => Node.isTypeLiteral(node));
    if (!typeLiteralNode || !Node.isTypeLiteral(typeLiteralNode)) {
      return [];
    }
    return typeLiteralNode
      .getMembers()
      .filter((member): member is PropertySignature => Node.isPropertySignature(member));
  }

  return [];
}

/**
 * 读取属性签名并组装 props schema。
 */
function buildPropsSchema(
  propSignatures: PropertySignature[],
  defaultsByProp: Map<string, string>,
  sourceFile: SourceFile,
  project: Project,
): PropSchema[] {
  const props: PropSchema[] = [];

  for (const propertySignature of propSignatures) {
    const nameNode = propertySignature.getNameNode();
    const propName = nameNode.getText().replace(/^["']|["']$/g, "");
    const typeText =
      propertySignature.getTypeNode()?.getText() ??
      propertySignature.getType().getText(propertySignature);
    const resolvedTypeText = resolveTypeAliasText(
      sourceFile,
      typeText,
      project,
    );
    const required = !propertySignature.hasQuestionToken();
    const defaultValue = defaultsByProp.get(propName) ?? null;
    const isEvent = /^on[A-Z]/.test(propName);

    props.push({
      name: propName,
      type: typeText.trim(),
      resolvedType: resolvedTypeText,
      required,
      default: defaultValue,
      isEvent,
    });
  }

  return props.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 为单个公开组件构建结构化描述。
 */
function buildComponentSchema(
  entry: ComponentEntry,
  uiDir: string,
  project: Project,
): ComponentSchema | null {
  if (!entry.defaultImplFilePath) {
    return null;
  }

  const implSourceFile = project.getSourceFile(entry.defaultImplFilePath);
  if (!implSourceFile) {
    return null;
  }

  const functionInfo = resolveComponentFunctionInfo(implSourceFile, entry.componentName);
  if (!functionInfo.propsTypeName) {
    return null;
  }

  const propsDeclaration = findPropsDeclaration(
    implSourceFile,
    functionInfo.propsTypeName,
    project,
  );
  if (!propsDeclaration) {
    return null;
  }

  const propSignatures = extractPropertySignaturesFromPropsDeclaration(propsDeclaration);
  if (propSignatures.length === 0) {
    return null;
  }

  const props = buildPropsSchema(
    propSignatures,
    functionInfo.defaultsByProp,
    propsDeclaration.getSourceFile(),
    project,
  );
  const events = props.filter((prop) => prop.isEvent).map((prop) => prop.name);

  return {
    componentName: entry.componentName,
    sourceFile: path.relative(uiDir, entry.defaultImplFilePath),
    props,
    events,
    exports: {
      entryFile: path.relative(uiDir, entry.entryFilePath),
      defaultExport: {
        from: path.relative(uiDir, entry.defaultImplFilePath),
      },
      namedExports: entry.namedExports,
    },
  };
}

function main(): void {
  const cwd = path.resolve(process.cwd());
  const uiDir = resolveUiDir(cwd);
  const componentsDir = path.join(uiDir, "src/components");
  const outputDir = path.join(uiDir, "artifacts");
  const outputFile = path.join(outputDir, "components.schema.json");

  if (!fs.existsSync(componentsDir)) {
    console.error("未找到组件目录：", componentsDir);
    process.exit(1);
  }

  const tsConfigPath = path.join(uiDir, "tsconfig.app.json");
  const project = new Project({
    tsConfigFilePath: tsConfigPath,
    skipAddingFilesFromTsConfig: false,
    skipFileDependencyResolution: false,
  });

  const entries = getPublicComponentEntries(project, uiDir);
  const components: ComponentSchema[] = [];

  for (const entry of entries) {
    const schema = buildComponentSchema(entry, uiDir, project);
    if (schema) {
      components.push(schema);
    }
  }

  const output: ComponentsSchemaFile = {
    generatedAt: new Date().toISOString(),
    sourceRoot: path.relative(uiDir, componentsDir),
    components: components.sort((a, b) => a.componentName.localeCompare(b.componentName)),
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), "utf8");

  console.log(`已生成：${path.relative(uiDir, outputFile)}`);
  console.log(`共抽取组件：${components.length}`);
}

main();
