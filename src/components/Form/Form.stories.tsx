import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import Button from "../Button";
import Input from "../Input";
import Select from "../Select";
import Upload from "../Upload";
import type { UploadFile } from "../Upload";
import Form from "./Form";
import { useForm } from "./useForm";

const meta = {
  title: "Data Entry/Form",
  component: Form,
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => {
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
              onClick={() => {
                form.resetFields();
                setSubmitted(null);
              }}
              type="default"
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
  },
};
