import type { Meta, StoryObj } from "@storybook/react";
import Text from "./Text";

const meta = {
  title: "Typography/Text",
  component: Text,
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: "Squid Design",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Text size="sm">Squid Design (sm)</Text>
      <Text>Squid Design (base)</Text>
      <Text size="lg">Squid Design (sm)</Text>
    </div>
  ),
};

export const SemanticColors: Story = {
  args: {
    children: "Squid Design",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Text>Squid Design (default)</Text>
      <Text textType="secondary">Squid Design (secondary)</Text>
      <Text textType="success">Squid Design (success)</Text>
      <Text textType="warning">Squid Design (warning)</Text>
      <Text textType="danger">Squid Design (danger)</Text>
    </div>
  ),
};

export const Decoration: Story = {
  args: {
    children: "Squid Design",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Text disabled>Squid Design (disabled)</Text>
      <Text strong>Squid Design (strong)</Text>
      <Text underline>Squid Design (underline)</Text>
      <Text italic>Squid Design (italic)</Text>
    </div>
  ),
};
