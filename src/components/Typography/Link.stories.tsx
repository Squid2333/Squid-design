import type { Meta, StoryObj } from "@storybook/react-vite";
import Link from "./Link";

const meta = {
  title: "Typography/Link",
  component: Link,
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    children: "Squid Design",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <Link>Squid Design</Link>
      <Link disabled>Squid Design (disabled)</Link>
      <Link strong>Squid Design (strong)</Link>
      <Link underline>Squid Design (underline)</Link>
      <Link italic>Squid Design (italic)</Link>
    </div>
  ),
};
