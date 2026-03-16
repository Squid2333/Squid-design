import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import Button from "../Button";
import Modal from "./Modal";

const meta = {
  title: "Feedback/Modal",
  component: Modal,
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    title: "Basic Modal",
  },
  render: () => {
    function Demo() {
      const [isModalOpen, setIsModalOpen] = useState(false);

      function handleOk() {
        setIsModalOpen(false);
      }

      function handleCancel() {
        setIsModalOpen(false);
      }

      return (
        <>
          <Button onClick={() => setIsModalOpen(true)} type="primary">
            Open Modal
          </Button>
          <Modal
            closable={{ "aria-label": "Custom Close Button" }}
            onCancel={handleCancel}
            onOk={handleOk}
            open={isModalOpen}
            title="Basic Modal"
          >
            <p>Some contents...</p>
            <p>Some contents...</p>
            <p>Some contents...</p>
          </Modal>
        </>
      );
    }

    return <Demo />;
  },
};

export const Width: Story = {
  args: {
    title: "Custom Width Modal",
  },
  render: () => {
    function Demo() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <Button onClick={() => setOpen(true)} type="primary">
            Open Wide Modal
          </Button>
          <Modal
            onCancel={() => setOpen(false)}
            onOk={() => setOpen(false)}
            open={open}
            title="Custom Width Modal"
            width={720}
          >
            <p>Modal width is controlled by the `width` prop.</p>
          </Modal>
        </>
      );
    }

    return <Demo />;
  },
};

export const MaskVariants: Story = {
  args: {
    title: "Mask Variants",
  },
  render: () => {
    function Demo() {
      const [mask, setMask] = useState<"blur" | "dimmed" | "none" | null>(null);

      return (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Button onClick={() => setMask("blur")} type="default">
              blur
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
            onCancel={() => setMask(null)}
            onOk={() => setMask(null)}
            open={mask !== null}
            title="Mask Variants"
          >
            <p>遮罩</p>
            <p>遮罩效果。</p>
          </Modal>
        </>
      );
    }

    return <Demo />;
  },
};

export const Position: Story = {
  args: {
    title: "Modal Position",
  },
  render: () => {
    function Demo() {
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
            onCancel={() => setTopOpen(false)}
            onOk={() => setTopOpen(false)}
            open={topOpen}
            style={{ top: 20 }}
            title="20px to Top"
          >
            <p>some contents...</p>
            <p>some contents...</p>
            <p>some contents...</p>
          </Modal>

          <Modal
            centered
            onCancel={() => setCenterOpen(false)}
            onOk={() => setCenterOpen(false)}
            open={centerOpen}
            title="Centered Modal"
          >
            <p>some contents...</p>
            <p>some contents...</p>
            <p>some contents...</p>
          </Modal>
        </>
      );
    }

    return <Demo />;
  },
};
