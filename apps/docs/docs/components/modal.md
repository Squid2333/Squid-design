---
title: Modal 对话框
description: 用于承载重要操作与弹层确认
---

# Modal 对话框

用于承载重要操作与弹层确认。

## 基础用法

通过 `open` 控制弹层显示与隐藏。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Modal } from "@squid-design/ui";
import { useState } from "react";

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="primary">
        Open Modal
      </Button>
      <Modal
        open={open}
        title="Basic Modal"
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
      >
        <p>Some contents...</p>
        <p>Some contents...</p>
        <p>Some contents...</p>
      </Modal>
    </>
  );
};
```

## 自定义宽度

通过 `width` 控制弹层宽度。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Modal } from "@squid-design/ui";
import { useState } from "react";

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="primary">
        Open Wide Modal
      </Button>
      <Modal
        open={open}
        title="Custom Width Modal"
        width={720}
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
      >
        <p>Modal width is controlled by the width prop.</p>
      </Modal>
    </>
  );
};
```

## 遮罩样式

通过 `mask` 切换不同遮罩表现。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Modal } from "@squid-design/ui";
import { useState } from "react";

export default () => {
  const [mask, setMask] = useState<"blur" | "dimmed" | "none" | null>(null);

  return (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button onClick={() => setMask("blur")} type="default">
          Blur mask
        </Button>
        <Button onClick={() => setMask("dimmed")} type="default">
          Dimmed mask
        </Button>
        <Button onClick={() => setMask("none")} type="default">
          No mask
        </Button>
      </div>

      <Modal
        mask={mask ?? "dimmed"}
        open={mask !== null}
        title="Mask Variants"
        onCancel={() => setMask(null)}
        onOk={() => setMask(null)}
      >
        <p>遮罩效果。</p>
      </Modal>
    </>
  );
};
```

## 位置控制

支持顶部偏移与垂直居中两种常见布局方式。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Modal } from "@squid-design/ui";
import { useState } from "react";

export default () => {
  const [topOpen, setTopOpen] = useState(false);
  const [centerOpen, setCenterOpen] = useState(false);

  return (
    <>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Button onClick={() => setTopOpen(true)} type="default">
          20px to Top
        </Button>
        <Button onClick={() => setCenterOpen(true)} type="default">
          Centered
        </Button>
      </div>

      <Modal
        open={topOpen}
        title="20px to Top"
        style={{ top: 20 }}
        onCancel={() => setTopOpen(false)}
        onOk={() => setTopOpen(false)}
      >
        <p>some contents...</p>
      </Modal>

      <Modal
        centered
        open={centerOpen}
        title="Centered Modal"
        onCancel={() => setCenterOpen(false)}
        onOk={() => setCenterOpen(false)}
      >
        <p>some contents...</p>
      </Modal>
    </>
  );
};
```

## 关闭按钮

通过 `closable` 控制是否显示右上角关闭按钮，也可以自定义可访问性文案。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Modal } from "@squid-design/ui";
import { useState } from "react";

export default () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="primary">
        Open Modal
      </Button>
      <Modal
        closable={{ "aria-label": "Custom Close Button" }}
        open={open}
        title="Closable Modal"
        onCancel={() => setOpen(false)}
        onOk={() => setOpen(false)}
      >
        <p>Custom close button aria-label.</p>
      </Modal>
    </>
  );
};
```

## Modal API

### Modal Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `title` | 弹窗标题 | `ReactNode` | `undefined` |
| `open` | 是否打开 | `boolean` | `false` |
| `width` | 弹窗宽度 | `number \| string` | `520` |
| `mask` | 遮罩样式 | `"blur" \| "dimmed" \| "none"` | `"dimmed"` |
| `centered` | 是否垂直居中 | `boolean` | `false` |
| `style` | 自定义弹窗样式 | `CSSProperties` | `undefined` |
| `closable` | 是否显示关闭按钮，或关闭按钮配置 | `boolean \| { "aria-label"?: string }` | `true` |
| `okText` | 确认按钮文案 | `ReactNode` | `"OK"` |
| `cancelText` | 取消按钮文案 | `ReactNode` | `"Cancel"` |
| `onOk` | 点击确认回调 | `() => void` | `undefined` |
| `onCancel` | 点击取消、关闭或遮罩回调 | `() => void` | `undefined` |
| `children` | 弹窗内容 | `ReactNode` | `undefined` |

### 说明

- `Modal` 通过 `createPortal` 挂载到 `document.body`
- 打开时会锁定 `body` 滚动
- 支持 `Esc` 快捷键关闭
