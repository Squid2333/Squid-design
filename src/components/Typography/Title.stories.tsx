import type { Meta, StoryObj } from "@storybook/react-vite";
import Title from "./Title";

const meta = {
  title: "Typography/Title",
  component: Title,
} satisfies Meta<typeof Title>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Level1: Story = {
  args: {
    children: "Heading Level 1",
    level: 1,
  },
};

export const Level2: Story = {
  args: {
    children: "Heading Level 2",
    level: 2,
  },
};

export const Level3: Story = {
  args: {
    children: "Heading Level 3",
    level: 3,
  },
};

export const Level4: Story = {
  args: {
    children: "Heading Level 4",
    level: 4,
  },
};

export const Level5: Story = {
  args: {
    children: "Heading Level 5",
    level: 5,
  },
};
