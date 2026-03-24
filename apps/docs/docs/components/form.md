---
title: Form 表单
description: 支持表单状态管理、校验与字段联动
---

# Form 表单

支持表单状态管理、校验与字段联动。

## 基础用法

`Form` 搭配 `Form.Item` 使用，通过 `name` 绑定字段，通过 `rules` 配置校验规则。

```tsx
import "@squid-design/ui/styles/global.css";
import { Button, Form, Input, Select, Upload } from "@squid-design/ui";
import type { UploadFile } from "@squid-design/ui/upload";
import { useForm } from "@squid-design/ui/form";
import { useState } from "react";

export default () => {
  const form = useForm();
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);

  return (
    <div style={{ maxWidth: 520 }}>
      <Form
        form={form}
        initialValues={{
          tags: ["react"],
          username: "",
        }}
        onFinish={(values) => {
          setSubmitted(values);
        }}
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[
            { required: true, message: "Please enter a username" },
            { min: 3, message: "Username must be at least 3 characters" },
          ]}
        >
          <Input placeholder="Enter username" />
        </Form.Item>

        <Form.Item
          help="You can create tags directly in tags mode."
          label="Tags"
          name="tags"
          rules={[{ required: true, message: "Please select at least one tag" }]}
        >
          <Select
            mode="tags"
            options={[
              { label: "React", value: "react" },
              { label: "TypeScript", value: "typescript" },
              { label: "Design System", value: "design-system" },
            ]}
            placeholder="Select or create tags"
          />
        </Form.Item>

        <Form.Item
          label="Attachment"
          name="files"
          rules={[{ required: true, message: "Please upload at least one file" }]}
          trigger="onChange"
          valuePropName="fileList"
        >
          <Upload />
        </Form.Item>

        <div className="squid-form-actions">
          <Button htmlType="submit" type="primary">
            Submit
          </Button>
          <Button
            type="default"
            onClick={() => {
              form.resetFields();
              setSubmitted(null);
            }}
          >
            Reset
          </Button>
        </div>
      </Form>

      <pre style={{ marginTop: 16 }}>
        {JSON.stringify(
          submitted,
          (_key, value) => {
            if (Array.isArray(value)) {
              return value.map((item) => {
                if (item && typeof item === "object" && "uid" in item) {
                  const uploadFile = item as UploadFile;

                  return {
                    name: uploadFile.name,
                    status: uploadFile.status,
                    uid: uploadFile.uid,
                  };
                }

                return item;
              });
            }

            return value;
          },
          2,
        )}
      </pre>
    </div>
  );
};
```

## 校验规则

支持常见校验能力：

- `required`
- `min`
- `max`
- `pattern`
- `validator`

规则通过 `Form.Item` 的 `rules` 传入，提交时会自动执行校验。

## 字段绑定

默认情况下，`Form.Item` 会将字段值绑定到子组件的 `value` 属性，并监听 `onChange`。

如果子组件的值属性不是 `value`，可以通过：

- `valuePropName`
- `trigger`
- `getValueFromEvent`

来自定义绑定方式。

## useForm

组件库也导出了 `useForm`，用于获取表单实例。

```ts
import { useForm } from "@squid-design/ui/form";

const form = useForm();
```

通过实例可以访问：

- `getFieldValue`
- `getFieldsValue`
- `setFieldValue`
- `setFieldsValue`
- `resetFields`
- `validateFields`
- `submit`

## Form API

### Form Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `children` | 表单内容 | `ReactNode` | `undefined` |
| `className` | 自定义类名 | `string` | `undefined` |
| `form` | 表单实例 | `FormInstance` | `undefined` |
| `initialValues` | 初始值 | `Store` | `undefined` |
| `onFinish` | 提交成功回调 | `(values: Store) => void` | `undefined` |
| `onFinishFailed` | 提交失败回调 | `(errors: FieldErrors, values: Store) => void` | `undefined` |

### Form.Item Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `label` | 字段标签 | `ReactNode` | `undefined` |
| `name` | 字段名 | `NamePath` | `undefined` |
| `help` | 额外提示文案 | `ReactNode` | `undefined` |
| `required` | 是否必填 | `boolean` | `false` |
| `rules` | 校验规则 | `Rule[]` | `undefined` |
| `trigger` | 值更新触发事件 | `string` | `"onChange"` |
| `validateTrigger` | 校验触发事件 | `string \| string[]` | `"onChange"` |
| `valuePropName` | 子组件值属性名 | `string` | `"value"` |
| `getValueFromEvent` | 从事件中提取值 | `(...args: unknown[]) => unknown` | `undefined` |

### Rule

| 属性名 | 说明 | 类型 |
| --- | --- | --- |
| `required` | 是否必填 | `boolean` |
| `min` | 最小长度 | `number` |
| `max` | 最大长度 | `number` |
| `pattern` | 正则校验 | `RegExp` |
| `message` | 错误信息 | `string` |
| `validator` | 自定义校验函数 | `(value: unknown, values: Store) => void \| Promise<void>` |

### 说明

- `Form.Item` 必须在 `Form` 内部使用
- 规则校验失败时，会优先展示第一条错误信息
- 复杂组件可通过 `trigger` 和 `valuePropName` 接入表单体系
