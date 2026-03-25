# Squid Design

一个基于 React 构建的组件库项目，当前采用 `pnpm workspace` 管理组件主包、文档站与 Storybook 宿主，围绕中后台与通用业务场景沉淀基础组件、设计 token 与文档体系。

## 当前能力

- 组件库主包：`packages/ui`
- 文档站：`apps/docs`，基于 dumi
- 组件展示与交互验证：`apps/storybook`
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
│   ├── docs/          # dumi 文档站
│   └── storybook/     # Storybook 宿主
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

构建 Storybook 静态站点：

```bash
pnpm build-storybook
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

## 仓库职责

- `packages/ui`
  只负责组件源码、样式、导出入口与构建。
- `apps/docs`
  基于 dumi，负责正式文档、接入指南与组件说明。
- `apps/storybook`
  负责组件联调、状态演示与交互验证，stories 继续贴近组件源码维护。
