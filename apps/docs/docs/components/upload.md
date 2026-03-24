---
title: Upload 上传
description: 文件选择、拖拽上传与上传列表展示
---

# Upload 上传

文件选择、拖拽上传与上传列表展示。

## 基础用法

默认会渲染一个触发按钮，点击后选择文件。

```tsx
import "@squid-design/ui/styles/global.css";
import { Upload } from "@squid-design/ui";

export default () => <Upload />;
```

## 受控模式

通过 `fileList` 与 `onChange` 控制上传列表。

```tsx
import "@squid-design/ui/styles/global.css";
import { Upload } from "@squid-design/ui";
import type { UploadFile } from "@squid-design/ui/upload";
import { useState } from "react";

export default () => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  return <Upload fileList={fileList} onChange={setFileList} />;
};
```

## 上传前校验

通过 `beforeUpload` 可以拦截不符合条件的文件。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Upload } from "@squid-design/ui";

export default () => (
  <Upload beforeUpload={(file) => file.type === "image/png"}>
    <Button type="default">Only PNG</Button>
  </Upload>
);
```

## 自定义上传请求

通过 `customRequest` 自定义上传流程，并手动上报进度和结果。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Upload } from "@squid-design/ui";

export default () => (
  <Upload
    multiple
    customRequest={({ file, onProgress, onSuccess }) => {
      let percent = 0;
      const timer = window.setInterval(() => {
        percent += 20;
        onProgress(percent);

        if (percent >= 100) {
          window.clearInterval(timer);
          onSuccess({ fileName: file.name });
        }
      }, 100);
    }}
  >
    <Button type="primary">Upload Files</Button>
  </Upload>
);
```

## 拖拽上传

除了默认按钮触发外，也可以使用拖拽上传区域。

```tsx
import "@squid-design/ui/styles/global.css";
import { Dragger } from "@squid-design/ui/upload";

export default () => <Dragger multiple />;
```

## Upload API

### Upload Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `accept` | 接受的文件类型 | `string` | `undefined` |
| `beforeUpload` | 上传前校验 | `(file: File, fileList: File[]) => boolean \| File \| Promise<boolean \| File>` | `undefined` |
| `children` | 自定义触发区域 | `ReactNode` | `undefined` |
| `customRequest` | 自定义上传请求 | `(options) => void` | `undefined` |
| `defaultFileList` | 默认文件列表 | `UploadFile[]` | `undefined` |
| `fileList` | 受控文件列表 | `UploadFile[]` | `undefined` |
| `multiple` | 是否支持多文件 | `boolean` | `false` |
| `onChange` | 文件列表变化回调 | `(fileList: UploadFile[]) => void` | `undefined` |
| `onRemove` | 删除文件回调 | `(file: UploadFile) => void \| boolean` | `undefined` |

### UploadFile

| 属性名 | 说明 | 类型 |
| --- | --- | --- |
| `uid` | 文件唯一标识 | `string` |
| `name` | 文件名 | `string` |
| `status` | 上传状态 | `"uploading" \| "done" \| "error" \| "removed"` |
| `percent` | 上传进度 | `number` |
| `originFileObj` | 原始文件对象 | `File` |
| `response` | 上传响应 | `unknown` |
| `error` | 错误信息 | `string` |
| `thumbUrl` | 缩略图地址 | `string` |

### 说明

- 默认会显示上传列表与状态
- `customRequest` 适合接入实际后端上传逻辑
- 拖拽上传能力由 `Dragger` 承载
