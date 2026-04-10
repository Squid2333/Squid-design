---
title: Select 选择器
description: 常用的下拉选择组件
---

# Select 选择器

常用的下拉选择组件。

## 基础用法

通过 `options` 配置可选项，支持单选下拉场景。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "Jack", value: "jack", text: "Jack" },
  { label: "Lucy", value: "lucy", text: "Lucy" },
  { label: "Disabled", value: "disabled", text: "Disabled", disabled: true },
  { label: "Yiminghe", value: "yiminghe", text: "Yiminghe" },
];

export default () => (
  <div style={{ maxWidth: 320 }}>
    <Select options={options} placeholder="Please select" />
  </div>
);
```

## 调整尺寸

使用 `size` 属性配置尺寸，目前支持 `large`、`medium`、`small`。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "Jack", value: "jack" },
  { label: "Lucy", value: "lucy" },
];

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
    <Select options={options} placeholder="Large select" size="large" />
    <Select options={options} placeholder="Default select" />
    <Select options={options} placeholder="Small select" size="small" />
  </div>
);
```

## 禁用状态

通过 `disabled` 控制选择器是否可操作。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "Jack", value: "jack" },
  { label: "Lucy", value: "lucy" },
];

export default () => (
  <div style={{ maxWidth: 320 }}>
    <Select disabled options={options} placeholder="Disabled select" />
  </div>
);
```

## 可搜索

通过 `showSearch` 开启选项搜索能力。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "Jack", value: "jack", text: "Jack" },
  { label: "Lucy", value: "lucy", text: "Lucy" },
  { label: "Yiminghe", value: "yiminghe", text: "Yiminghe" },
];

export default () => (
  <div style={{ maxWidth: 320 }}>
    <Select options={options} placeholder="Search to select" showSearch />
  </div>
);
```

## 多选模式

通过 `mode="multiple"` 启用多选。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "Jack", value: "jack" },
  { label: "Lucy", value: "lucy" },
  { label: "Yiminghe", value: "yiminghe" },
];

export default () => (
  <div style={{ maxWidth: 360 }}>
    <Select
      defaultValue={["jack"]}
      mode="multiple"
      options={options}
      placeholder="Select multiple"
      showSearch
    />
  </div>
);
```

## 标签模式

通过 `mode="tags"` 支持创建自定义标签。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "React", value: "react" },
  { label: "TypeScript", value: "typescript" },
];

export default () => (
  <div style={{ maxWidth: 360 }}>
    <Select
      defaultValue={["react"]}
      mode="tags"
      options={options}
      placeholder="Add tags"
      showSearch
    />
  </div>
);
```

## 状态

通过 `status` 设置警告或错误状态。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "Jack", value: "jack" },
  { label: "Lucy", value: "lucy" },
];

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 320 }}>
    <Select options={options} placeholder="Error" status="error" />
    <Select options={options} placeholder="Warning" status="warning" />
  </div>
);
```

## 最大数量限制

在多选和标签模式下，可以通过 `maxCount` 限制最大可选数量。

```tsx
import "@squid-design/ui/styles/global.css";
import { Select } from "@squid-design/ui";

const options = [
  { label: "Jack", value: "jack" },
  { label: "Lucy", value: "lucy" },
  { label: "Yiminghe", value: "yiminghe" },
];

export default () => (
  <div style={{ display: "grid", gap: 12, maxWidth: 360 }}>
    <Select
      defaultValue={["jack"]}
      maxCount={2}
      mode="multiple"
      options={options}
      placeholder="Select up to 2"
      showSearch
    />
    <Select
      defaultValue={["lucy"]}
      maxCount={2}
      mode="tags"
      options={options}
      placeholder="Add up to 2 tags"
      showSearch
    />
  </div>
);
```

## Select API

### Select Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `options` | 选项配置 | `{ label: ReactNode; value: string; text?: string; disabled?: boolean }[]` | `undefined` |
| `value` | 当前值 | `string \| string[]` | `undefined` |
| `defaultValue` | 默认值 | `string \| string[]` | `undefined` |
| `placeholder` | 占位内容 | `string` | `"Please select"` |
| `size` | 选择器尺寸 | `"large" \| "medium" \| "small"` | `"medium"` |
| `showSearch` | 是否可搜索 | `boolean` | `false` |
| `mode` | 模式 | `"multiple" \| "tags"` | `undefined` |
| `status` | 状态样式 | `"error" \| "warning"` | `undefined` |
| `maxCount` | 最大可选数量 | `number` | `undefined` |
| `disabled` | 是否禁用 | `boolean` | `false` |
| `onChange` | 值变化回调 | `(value: string \| string[]) => void` | `undefined` |

### 说明

- 单选模式返回 `string`
- `multiple` 与 `tags` 模式返回 `string[]`
- `tags` 模式下可直接创建不在选项列表中的值
