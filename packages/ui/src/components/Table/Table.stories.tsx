import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { TableColumn, TableFilterState, TableSortState } from "./Table";
import Table from "./Table";

type BasicRow = {
  id: number;
  name: string;
  age: number | null;
  address: string | null;
};

type RenderRow = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

type StoryRow = Record<string, unknown>;

const basicColumns: TableColumn<BasicRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name", align: "center" },
  { title: "年龄", dataIndex: "age", key: "age", align: "right", width: 120 },
  {
    title: "地址",
    dataIndex: "address",
    key: "address",
    ellipsis: true,
    width: 260,
  },
];

const sortableColumns: TableColumn<BasicRow>[] = [
  {
    title: "姓名",
    dataIndex: "name",
    key: "name",
    align: "center",
    sortable: true,
    sorter: (left, right) => left.name.localeCompare(right.name, "zh-CN"),
  },
  {
    title: "年龄",
    dataIndex: "age",
    key: "age",
    align: "right",
    width: 120,
    sortable: true,
    sorter: (left, right) => (left.age ?? -1) - (right.age ?? -1),
    filters: [
      { text: "18-19 岁", value: "18-19" },
      { text: "20 岁及以上", value: "20+" },
    ],
    filterMultiple: false,
    onFilter: (value, record) =>
      value === "18-19" ? (record.age ?? 0) < 20 : (record.age ?? 0) >= 20,
  },
  {
    title: "地址",
    dataIndex: "address",
    key: "address",
    ellipsis: true,
    width: 260,
    sortable: true,
    sorter: (left, right) =>
      (left.address ?? "").localeCompare(right.address ?? "", "zh-CN"),
    filters: [
      { text: "上海", value: "上海" },
      { text: "北京", value: "北京" },
    ],
    onFilter: (value, record) => (record.address ?? "").includes(String(value)),
  },
];

const remoteSortableColumns: TableColumn<BasicRow>[] = sortableColumns.map((column) => ({
  ...column,
  sorter: undefined,
}));

const filterableColumns: TableColumn<BasicRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name", align: "center" },
  {
    title: "年龄",
    dataIndex: "age",
    key: "age",
    align: "right",
    width: 120,
    filters: [
      { text: "18-19 岁", value: "18-19" },
      { text: "20 岁及以上", value: "20+" },
    ],
    filterMultiple: false,
    onFilter: (value, record) =>
      value === "18-19" ? (record.age ?? 0) < 20 : (record.age ?? 0) >= 20,
  },
  {
    title: "地址",
    dataIndex: "address",
    key: "address",
    ellipsis: true,
    width: 260,
    filters: [
      { text: "上海", value: "上海" },
      { text: "北京", value: "北京" },
    ],
    onFilter: (value, record) => (record.address ?? "").includes(String(value)),
  },
];

const dataSource: BasicRow[] = [
  {
    id: 1,
    name: "张三",
    age: 18,
    address: "上海市静安区南京西路 100 号，地址故意写长一点测试截断效果",
  },
  { id: 2, name: "李四", age: 20, address: "北京市朝阳区" },
  { id: 3, name: "王五", age: null, address: null },
];

const renderColumns: TableColumn<RenderRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name", ellipsis: true, width: 160 },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 120,
    align: "center",
    render: (value: unknown) => (
      <span
        style={{
          display: "inline-flex",
          padding: "2px 8px",
          borderRadius: 999,
          background:
            value === "启用"
              ? "var(--squid-color-success-bg)"
              : "var(--squid-color-fill-tertiary)",
          color:
            value === "启用"
              ? "var(--squid-color-success-active)"
              : "var(--squid-color-text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    title: "创建时间",
    dataIndex: "createdAt",
    key: "createdAt",
    width: 160,
    align: "right",
    render: (value: unknown) =>
      typeof value === "string"
        ? new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(value))
        : "-",
  },
  {
    title: "操作",
    dataIndex: "id",
    key: "action",
    width: 140,
    align: "center",
    render: (_value: unknown, record: { name: string }) => (
      <button
        style={{
          padding: "0",
          border: "0",
          background: "transparent",
          color: "var(--squid-color-primary)",
          cursor: "pointer",
        }}
        type="button"
      >
        查看{record.name}
      </button>
    ),
  },
];

const renderDataSource: RenderRow[] = [
  {
    id: 1,
    name: "张三",
    status: "启用",
    createdAt: "2026-03-20T08:00:00.000Z",
  },
  {
    id: 2,
    name: "李四",
    status: "停用",
    createdAt: "2026-03-21T08:00:00.000Z",
  },
];

const meta = {
  title: "Data Display/Table",
  component: Table,
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    columns: basicColumns as TableColumn<StoryRow>[],
    dataSource: dataSource as StoryRow[],
    rowKey: "id",
  },
  render: () => (
    <Table<BasicRow>
      columns={basicColumns}
      dataSource={dataSource}
      rowKey="id"
    />
  ),
};

export const CustomRender: Story = {
  args: {
    columns: renderColumns as TableColumn<StoryRow>[],
    dataSource: renderDataSource as StoryRow[],
    rowKey: "id",
  },
  render: () => (
    <Table<RenderRow>
      columns={renderColumns}
      dataSource={renderDataSource}
      rowKey="id"
    />
  ),
};

export const Loading: Story = {
  args: {
    columns: basicColumns as TableColumn<StoryRow>[],
    dataSource: dataSource as StoryRow[],
    rowKey: "id",
    loading: true,
  },
  render: () => (
    <Table<BasicRow>
      columns={basicColumns}
      dataSource={dataSource}
      rowKey="id"
      loading
    />
  ),
};

export const Empty: Story = {
  args: {
    columns: basicColumns as TableColumn<StoryRow>[],
    dataSource: [],
    rowKey: "id",
    emptyText: "当前没有可展示的数据",
  },
  render: () => (
    <Table<BasicRow>
      columns={basicColumns}
      dataSource={[]}
      rowKey="id"
      emptyText="当前没有可展示的数据"
    />
  ),
};

const paginationDataSource: BasicRow[] = Array.from(
  { length: 57 },
  (_, index) => ({
    id: index + 1,
    name: `用户 ${index + 1}`,
    age: 18 + (index % 10),
    address: `上海市浦东新区世纪大道 ${index + 1} 号，这是一段用于分页示例的较长地址文本`,
  }),
);

const remoteSortDataSource: BasicRow[] = [
  { id: 101, name: "赵六", age: 27, address: "杭州市西湖区" },
  { id: 102, name: "孙七", age: 19, address: "苏州市工业园区" },
  { id: 103, name: "周八", age: 33, address: "南京市鼓楼区" },
];

export const Pagination: Story = {
  args: {
    columns: basicColumns as TableColumn<StoryRow>[],
    dataSource: paginationDataSource.slice(0, 10) as StoryRow[],
    rowKey: "id",
    pagination: {
      current: 1,
      pageSize: 10,
      total: paginationDataSource.length,
    },
  },
  render: () => {
    const [current, setCurrent] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const pagedData = paginationDataSource.slice(
      (current - 1) * pageSize,
      current * pageSize,
    );

    return (
      <Table<BasicRow>
        columns={basicColumns}
        dataSource={pagedData}
        rowKey="id"
        pagination={{
          current,
          pageSize,
          total: paginationDataSource.length,
          pageSizeOptions: [5, 10, 20],
          onPageChange: (page) => setCurrent(page),
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize);
            setCurrent(1);
          },
        }}
      />
    );
  },
};

export const SortLocal: Story = {
  args: {
    columns: sortableColumns as TableColumn<StoryRow>[],
    dataSource: dataSource as StoryRow[],
    rowKey: "id",
    sortState: { key: "age", order: "asc" },
  },
  render: () => {
    const [sortState, setSortState] = useState<TableSortState>({
      key: "age",
      order: "asc",
    });

    return (
      <Table<BasicRow>
        columns={sortableColumns}
        dataSource={dataSource}
        rowKey="id"
        sortState={sortState}
        onSortChange={setSortState}
      />
    );
  },
};

export const SortRemote: Story = {
  args: {
    columns: remoteSortableColumns as TableColumn<StoryRow>[],
    dataSource: remoteSortDataSource as StoryRow[],
    rowKey: "id",
    sortState: { key: "age", order: "asc" },
  },
  render: () => {
    const [sortState, setSortState] = useState<TableSortState>({
      key: "age",
      order: "asc",
    });
    const sortedData = [...remoteSortDataSource].sort((left, right) => {
      if (sortState.key === "age" && sortState.order !== null) {
        const result = (left.age ?? -1) - (right.age ?? -1);

        if (result !== 0) {
          return sortState.order === "desc" ? -result : result;
        }
      }

      if (sortState.key === "name" && sortState.order !== null) {
        const result = left.name.localeCompare(right.name, "zh-CN");

        if (result !== 0) {
          return sortState.order === "desc" ? -result : result;
        }
      }

      return 0;
    });

    return (
      <Table<BasicRow>
        columns={remoteSortableColumns}
        dataSource={sortedData}
        rowKey="id"
        sortState={sortState}
        onSortChange={setSortState}
      />
    );
  },
};

export const Filter: Story = {
  args: {
    columns: filterableColumns as TableColumn<StoryRow>[],
    dataSource: dataSource as StoryRow[],
    rowKey: "id",
    filterState: [{ key: "age", values: ["18-19"] }],
  },
  render: () => {
    const [filterState, setFilterState] = useState<TableFilterState[]>([
      { key: "age", values: ["18-19"] },
    ]);

    return (
      <Table<BasicRow>
        columns={filterableColumns}
        dataSource={dataSource}
        rowKey="id"
        filterState={filterState}
        onFilterChange={setFilterState}
      />
    );
  },
};
