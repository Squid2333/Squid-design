import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";

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

const meta = {
  title: "General/Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Types: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Button type="primary">Primary</Button>
      <Button type="default">Default</Button>
      <Button type="dashed">Dashed</Button>
      <Button type="text">Text</Button>
      <Button type="link">Link</Button>
    </div>
  ),
};

export const ColorVariants: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
  ),
};

export const Disabled: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
  ),
};

export const Sizes: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <Button type="primary" size="large">
        Large
      </Button>
      <Button type="primary">Medium</Button>
      <Button type="primary" size="small">
        Small
      </Button>
      <Button type="text" size="large">
        Large Text
      </Button>
      <Button type="text">Medium Text</Button>
      <Button type="text" size="small">
        Small Text
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
      }}
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
  ),
};

export const Block: Story = {
  args: {
    children: "Block Button",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 320 }}>
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
  ),
};

export const Icons: Story = {
  args: {
    children: "Button",
  },
  render: () => (
    <div
      style={{
        display: "flex",
        gap: 12,
        flexWrap: "wrap",
        alignItems: "center",
      }}
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
  ),
};
