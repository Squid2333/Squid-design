import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";

const meta = {
  title: "General/Button",
  component: Button,
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: "Primary Button",
    variant: "primary",
  },
};

export const Default: Story = {
  args: {
    children: "Default Button",
  },
};
