---
title: Button 按钮
description: 常用的操作按钮
---

# Button 按钮

常用的操作按钮。

## 基础用法

使用 `type` 来定义按钮的预设样式。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Button type="primary">Primary</Button>
    <Button type="default">Default</Button>
    <Button type="dashed">Dashed</Button>
    <Button type="text">Text</Button>
    <Button type="link">Link</Button>
  </div>
);
```

## 禁用状态

你可以使用 `disabled` 属性来定义按钮是否被禁用。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Button type="primary" disabled>
      Primary
    </Button>
    <Button type="default" disabled>
      Default
    </Button>
    <Button type="dashed" disabled>
      Dashed
    </Button>
    <Button type="text" disabled>
      Text
    </Button>
    <Button type="link" disabled>
      Link
    </Button>
  </div>
);
```

## 链接按钮

通过 `type="link"` 或 `variant="link"` 可以使用链接样式按钮。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Button type="link">Basic link button</Button>
    <Button type="link" disabled>
      Disabled link button
    </Button>
    <Button color="danger" variant="link">
      Danger link button
    </Button>
  </div>
);
```

## 文字按钮

没有边框和背景色的按钮，适合轻量操作场景。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Button type="text">Basic text button</Button>
    <Button color="primary" variant="text">
      Primary text button
    </Button>
    <Button type="text" disabled>
      Disabled text button
    </Button>
  </div>
);
```

## 图标按钮

使用 `icon` 属性为按钮添加更多语义，也可以通过 `shape="circle"` 生成纯图标按钮。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      viewBox="0 0 14 14"
      width="1em"
    >
      <circle cx="6" cy="6" r="4.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9.5 9.5L12.25 12.25"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default () => (
  <div
    style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
  >
    <Button icon={<SearchIcon />} type="primary">
      Search
    </Button>
    <Button icon={<SearchIcon />} shape="circle" type="primary" />
    <Button icon={<SearchIcon />} type="default">
      Search
    </Button>
    <Button icon={<SearchIcon />} shape="circle" type="text" />
  </div>
);
```

## 加载状态按钮

通过设置 `loading` 属性为 `true` 来显示加载中状态。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div
    style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}
  >
    <Button type="primary" loading>
      Loading
    </Button>
    <Button type="default" loading>
      Loading
    </Button>
    <Button type="text" loading>
      Loading
    </Button>
    <Button type="link" loading>
      Loading
    </Button>
  </div>
);
```

## 调整尺寸

使用 `size` 属性配置尺寸，目前支持 `large`、`medium`、`small`。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      flexWrap: 'wrap',
      alignItems: 'center',
    }}
  >
    <Button type="primary" size="large">
      Large
    </Button>
    <Button type="primary" size="medium">
      Medium
    </Button>
    <Button type="primary" size="small">
      Small
    </Button>
    <Button type="text" size="large">
      Large Text
    </Button>
    <Button type="text" size="small">
      Small Text
    </Button>
  </div>
);
```

## 块级按钮

使用 `block` 让按钮在容器中横向撑满。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div
    style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 320 }}
  >
    <Button type="primary" block>
      Primary Block Button
    </Button>
    <Button type="default" block>
      Default Block Button
    </Button>
    <Button type="dashed" block>
      Dashed Block Button
    </Button>
  </div>
);
```

## 自定义主题

除了 `type` 预设外，也可以通过 `color + variant` 组合来控制按钮样式。

```tsx
import '@squid-design/ui/styles/global.css';
import { Button } from '@squid-design/ui';

export default () => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    <Button color="primary" variant="outlined">
      Primary Outlined
    </Button>
    <Button color="danger" variant="solid">
      Danger Solid
    </Button>
    <Button color="danger" variant="dashed">
      Danger Dashed
    </Button>
    <Button color="primary" variant="text">
      Primary Text
    </Button>
    <Button color="danger" variant="link">
      Danger Link
    </Button>
  </div>
);
```

## Button API

### Button Attributes

| 属性名      | 说明             | 类型                                                     | 默认值      |
| ----------- | ---------------- | -------------------------------------------------------- | ----------- |
| `type`      | 按钮预设类型     | `"primary" \| "default" \| "dashed" \| "text" \| "link"` | `undefined` |
| `color`     | 按钮主题色       | `"default" \| "primary" \| "danger"`                     | `undefined` |
| `variant`   | 按钮变体样式     | `"solid" \| "outlined" \| "dashed" \| "text" \| "link"`  | `undefined` |
| `size`      | 按钮尺寸         | `"large" \| "medium" \| "small"`                         | `"medium"`  |
| `shape`     | 按钮形状         | `"default" \| "circle"`                                  | `"default"` |
| `icon`      | 按钮图标内容     | `ReactNode`                                              | `undefined` |
| `loading`   | 是否为加载中状态 | `boolean`                                                | `false`     |
| `block`     | 是否为块级按钮   | `boolean`                                                | `false`     |
| `disabled`  | 是否禁用         | `boolean`                                                | `false`     |
| `htmlType`  | 原生 button type | `"button" \| "submit" \| "reset"`                        | `"button"`  |
| `className` | 自定义类名       | `string`                                                 | `undefined` |

### 说明

- 当设置 `type` 时，会优先映射出一组预设的 `color + variant`
- 如果不设置 `type`，则会按 `color` 与 `variant` 组合渲染
- `loading` 状态下按钮会自动进入不可点击状态
