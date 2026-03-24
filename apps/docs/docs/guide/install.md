---
title: 安装
description: 在业务项目中接入 squid-design
---

# 安装

推荐使用 `pnpm` 安装：

```bash
pnpm add @squid-design/ui
```

如果你在 monorepo 内部联调，可以通过 workspace 依赖直接引用：

```json
{
  "dependencies": {
    "@squid-design/ui": "workspace:*"
  }
}
```

## 用法

### 完整引入

如果你对打包体积没有特别严格的要求，推荐先使用完整引入，接入成本最低。

```ts
import '@squid-design/ui/styles/global.css';
import { Button, Input, Table } from '@squid-design/ui';
```

### 按需引入

如果你希望按组件维度引入，也可以使用子路径导出：

```ts
import '@squid-design/ui/styles/global.css';
import Button from '@squid-design/ui/button';
import Input from '@squid-design/ui/input';
import Table from '@squid-design/ui/table';
```

### 样式引入

组件样式依赖全局 token 与基础样式，建议在应用入口统一引入一次：

```ts
import '@squid-design/ui/styles/global.css';
```

建议在应用入口统一引入一次，例如 `main.tsx`、`app.tsx` 或框架的全局布局文件。
