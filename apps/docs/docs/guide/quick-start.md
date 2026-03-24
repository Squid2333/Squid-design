---
title: 快速开始
description: 用最小代码跑通 squid-design
---

# 快速开始

下面是一个最小可运行示例：

```tsx
import '@squid-design/ui/styles/global.css';
import { Button, Input } from '@squid-design/ui';

export default function App() {
  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <Input placeholder="请输入内容" />
      <Button type="primary">提交</Button>
    </div>
  );
}
```
