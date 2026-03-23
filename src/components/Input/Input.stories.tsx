import type { Meta, StoryObj } from "@storybook/react-vite";
import Input from "./Input";

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="1em"
      viewBox="0 0 14 14"
      width="1em"
    >
      <circle
        cx="7"
        cy="4.25"
        r="2.25"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M2.5 11.75C3.2 9.95 4.8 9 7 9C9.2 9 10.8 9.95 11.5 11.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

const meta = {
  title: "Data Entry/Input",
  component: Input,
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  args: {
    placeholder: "default size",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input placeholder="large size" prefix={<UserIcon />} size="large" />
      <Input placeholder="default size" prefix={<UserIcon />} />
      <Input placeholder="small size" prefix={<UserIcon />} size="small" />
      <Input placeholder="large size" size="large" />
      <Input placeholder="default size" />
      <Input placeholder="small size" size="small" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: "disabled input",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input disabled placeholder="disabled input" prefix={<UserIcon />} />
      <Input
        disabled
        placeholder="small disabled input"
        prefix={<UserIcon />}
        size="small"
      />
    </div>
  ),
};

export const Variants: Story = {
  args: {
    placeholder: "Outlined",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input placeholder="Outlined" variant="outlined" />
      <Input placeholder="Filled" variant="filled" />
      <Input placeholder="Borderless" variant="borderless" />
      <Input placeholder="Underlined" variant="underlined" />
    </div>
  ),
};

export const ShowCount: Story = {
  args: {
    placeholder: "input with count",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input maxLength={20} placeholder="input with count" showCount />
      <Input
        maxLength={20}
        placeholder="input with prefix and count"
        prefix={<UserIcon />}
        showCount
      />
    </div>
  ),
};

export const Password: Story = {
  args: {
    placeholder: "Enter password",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input password placeholder="Enter password" />
      <Input password placeholder="Password with prefix" prefix={<UserIcon />} />
      <Input password showCount maxLength={20} placeholder="Password with count" />
    </div>
  ),
};

export const Status: Story = {
  args: {
    placeholder: "Status input",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Input placeholder="Error" status="error" />
      <Input placeholder="Warning" status="warning" />
      <Input placeholder="Error with prefix" prefix={<UserIcon />} status="error" />
      <Input
        placeholder="Warning with prefix"
        prefix={<UserIcon />}
        status="warning"
      />
    </div>
  ),
};
