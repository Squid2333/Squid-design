# Squid Design

一个基于 React 构建的组件库项目，当前采用 `pnpm workspace` 管理组件主包与文档站，围绕中后台与通用业务场景沉淀基础组件、设计 token 与文档体系。

## 当前能力

- 组件库主包：`packages/ui`
- 文档站：`apps/docs`，基于 dumi
- 组件展示与交互验证：Storybook
- 主题基础：全局 token + dark mode token
- 引入方式：支持完整引入与组件子路径引入

当前已经实现的核心组件包括：

- `Button`
- `Input`
- `Select`
- `Modal`
- `Table`
- `Form`
- `Upload`
- `Typography`

## 目录结构

```txt
squid-design/
├── apps/
│   └── docs/          # dumi 文档站
├── packages/
│   └── ui/            # React 组件库主包
├── package.json       # workspace root
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## 技术栈

- React
- TypeScript
- Vite
- Storybook
- dumi
- pnpm workspace
- ESLint

## 开发命令

在仓库根目录执行：

```bash
pnpm install
```

启动组件开发环境：

```bash
pnpm dev:ui
```

启动文档站：

```bash
pnpm dev:docs
```

启动 Storybook：

```bash
pnpm storybook
```

构建整个仓库：

```bash
pnpm build
```

单独构建文档站：

```bash
pnpm build:docs
```

代码检查：

```bash
pnpm lint
```
