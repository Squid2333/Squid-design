import type { Meta, StoryObj } from "@storybook/react";
import Select from "./Select";

const options = [
  { label: "Jack", value: "jack", text: "Jack" },
  { label: "Lucy", value: "lucy", text: "Lucy" },
  { label: "Disabled", value: "disabled", text: "Disabled", disabled: true },
  { label: "Yiminghe", value: "yiminghe", text: "Yiminghe" },
];

const meta = {
  title: "Data Entry/Select",
  component: Select,
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Sizes: Story = {
  args: {
    options,
    placeholder: "Please select",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Select options={options} placeholder="Large select" size="large" />
      <Select options={options} placeholder="Default select" />
      <Select options={options} placeholder="Small select" size="small" />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    options,
    placeholder: "Disabled select",
  },
  render: () => <Select disabled options={options} placeholder="Disabled select" />,
};

export const Searchable: Story = {
  args: {
    options,
    placeholder: "Search to select",
  },
  render: () => (
    <Select options={options} placeholder="Search to select" showSearch />
  ),
};

export const Multiple: Story = {
  args: {
    options,
    placeholder: "Select multiple",
  },
  render: () => (
    <Select
      defaultValue={["jack"]}
      mode="multiple"
      options={options}
      placeholder="Select multiple"
      showSearch
    />
  ),
};

export const Tags: Story = {
  args: {
    options,
    placeholder: "Add tags",
  },
  render: () => (
    <Select
      defaultValue={["lucy"]}
      mode="tags"
      options={options}
      placeholder="Add tags"
      showSearch
    />
  ),
};

export const Status: Story = {
  args: {
    options,
    placeholder: "Select with status",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Select options={options} placeholder="Error" status="error" />
      <Select options={options} placeholder="Warning" status="warning" />
    </div>
  ),
};

export const MaxCount: Story = {
  args: {
    options,
    placeholder: "Select up to 2",
  },
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Select
        defaultValue={["jack"]}
        maxCount={2}
        mode="multiple"
        options={options}
        placeholder="Select up to 2"
        showSearch
      />
      <Select
        defaultValue={["lucy"]}
        maxCount={2}
        mode="tags"
        options={options}
        placeholder="Add up to 2 tags"
        showSearch
      />
    </div>
  ),
};
