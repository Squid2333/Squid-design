---
title: Input 输入框
description: 常用的文本输入组件
---

# Input 输入框

常用的文本输入组件。

## 基础用法

用于获取用户输入，适合表单、搜索和筛选场景。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ maxWidth: 360 }}>
    <Input placeholder="请输入内容" />
  </div>
);
```

## 禁用状态

通过 `disabled` 属性控制输入框是否可编辑。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
    <Input placeholder="默认状态" />
    <Input disabled placeholder="禁用状态" />
  </div>
);
```

## 调整尺寸

使用 `size` 属性配置尺寸，目前支持 `large`、`medium`、`small`。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
    <Input size="large" placeholder="Large input" />
    <Input size="medium" placeholder="Medium input" />
    <Input size="small" placeholder="Small input" />
  </div>
);
```

## 变体样式

使用 `variant` 切换不同输入框外观。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
    <Input variant="outlined" placeholder="Outlined" />
    <Input variant="filled" placeholder="Filled" />
    <Input variant="borderless" placeholder="Borderless" />
    <Input variant="underlined" placeholder="Underlined" />
  </div>
);
```

## 状态

通过 `status` 为输入框添加警告或错误反馈。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
    <Input placeholder="默认状态" />
    <Input status="warning" placeholder="警告状态" />
    <Input status="error" placeholder="错误状态" />
  </div>
);
```

## 前缀

通过 `prefix` 在输入框前添加辅助信息。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
    <Input prefix="@" placeholder="用户名" />
    <Input prefix="¥" placeholder="请输入价格" />
  </div>
);
```

## 字数统计

通过 `showCount` 展示当前输入长度，搭配 `maxLength` 可以同时显示上限。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
    <Input showCount placeholder="仅展示当前长度" />
    <Input showCount maxLength={20} placeholder="展示长度与上限" />
  </div>
);
```

## 密码输入

通过 `password` 启用密码模式，组件会自动提供显示与隐藏切换。

```tsx
import "@squid-design/ui/styles/global.css";
import { Input } from "@squid-design/ui";

export default () => (
  <div style={{ maxWidth: 360 }}>
    <Input password placeholder="请输入密码" />
  </div>
);
```

## Button API

### Input Attributes

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `size` | 输入框尺寸 | `"large" \| "medium" \| "small"` | `"medium"` |
| `variant` | 输入框样式变体 | `"outlined" \| "filled" \| "borderless" \| "underlined"` | `"outlined"` |
| `status` | 状态样式 | `"warning" \| "error"` | `undefined` |
| `prefix` | 前缀内容 | `ReactNode` | `undefined` |
| `showCount` | 是否显示字数统计 | `boolean` | `false` |
| `password` | 是否启用密码输入模式 | `boolean` | `false` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `value` | 受控值 | `string` | `undefined` |
| `defaultValue` | 默认值 | `string` | `undefined` |
| `maxLength` | 最大输入长度 | `number` | `undefined` |
| `placeholder` | 占位内容 | `string` | `undefined` |
| `className` | 自定义类名 | `string` | `undefined` |

### Input Events

| 事件名 | 说明 | 类型 |
| --- | --- | --- |
| `onChange` | 输入值变化时触发 | `(event: ChangeEvent<HTMLInputElement>) => void` |

### 说明

- `showCount` 在受控和非受控模式下都可用
- `password` 会自动将输入类型切换为 `password`
- `password` 模式下，组件会提供显示/隐藏切换按钮
