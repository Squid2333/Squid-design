import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "../Button";
import Dragger from "./Dragger";
import Upload from "./Upload";
import type { UploadFile } from "./interface";

const meta = {
  title: "Data Entry/Upload",
  component: Upload,
} satisfies Meta<typeof Upload>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: () => <Upload />,
};

export const Controlled: Story = {
  render: () => {
    function Demo() {
      const [fileList, setFileList] = useState<UploadFile[]>([]);

      return <Upload fileList={fileList} onChange={setFileList} />;
    }

    return <Demo />;
  },
};

export const BeforeUpload: Story = {
  render: () => (
    <Upload
      beforeUpload={(file) => file.type === "image/png"}
    >
      <Button type="default">Only PNG</Button>
    </Upload>
  ),
};

export const CustomRequest: Story = {
  render: () => (
    <Upload
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
      multiple
    >
      <Button type="primary">Upload Files</Button>
    </Upload>
  ),
};

export const DragUpload: Story = {
  render: () => <Dragger multiple />,
};
