---
title: Table 表格
description: 面向业务列表页的基础表格组件
---

# Table 表格

面向业务列表页的基础表格组件。

## 基础用法

通过 `columns` 定义列，通过 `dataSource` 传入数据源，通过 `rowKey` 指定行唯一标识。

```tsx
import "@squid-design/ui/styles/global.css";
import { Table } from "@squid-design/ui";
import type { TableColumn } from "@squid-design/ui/table";

type UserRow = {
  id: number;
  name: string;
  age: number | null;
  address: string | null;
};

const columns: TableColumn<UserRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name" },
  { title: "年龄", dataIndex: "age", key: "age", align: "right", width: 120 },
  {
    title: "地址",
    dataIndex: "address",
    key: "address",
    ellipsis: true,
    width: 260,
  },
];

const dataSource: UserRow[] = [
  {
    id: 1,
    name: "张三",
    age: 18,
    address: "上海市静安区南京西路 100 号，地址故意写长一点测试截断效果",
  },
  { id: 2, name: "李四", age: 20, address: "北京市朝阳区" },
  { id: 3, name: "王五", age: null, address: null },
];

export default () => (
  <Table columns={columns} dataSource={dataSource} rowKey="id" />
);
```

## 对齐、宽度与省略

使用 `align`、`width`、`ellipsis` 控制列的展示形式。

```tsx
import "@squid-design/ui/styles/global.css";
import { Table } from "@squid-design/ui";
import type { TableColumn } from "@squid-design/ui/table";

type UserRow = {
  id: number;
  name: string;
  age: number;
  address: string;
};

const columns: TableColumn<UserRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name", align: "center", width: 140 },
  { title: "年龄", dataIndex: "age", key: "age", align: "right", width: 120 },
  { title: "地址", dataIndex: "address", key: "address", ellipsis: true, width: 260 },
];

const dataSource: UserRow[] = [
  { id: 1, name: "张三", age: 18, address: "上海市静安区南京西路 100 号，地址故意写长一点测试截断效果" },
  { id: 2, name: "李四", age: 20, address: "北京市朝阳区建国路 88 号" },
];

export default () => (
  <Table columns={columns} dataSource={dataSource} rowKey="id" />
);
```

## 自定义渲染

通过 `render(value, record, index)` 自定义单元格内容。

```tsx
import "@squid-design/ui/styles/global.css";
import { Table } from "@squid-design/ui";
import type { TableColumn } from "@squid-design/ui/table";

type UserRow = {
  id: number;
  name: string;
  status: string;
  createdAt: string;
};

const columns: TableColumn<UserRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name", ellipsis: true, width: 160 },
  {
    title: "状态",
    dataIndex: "status",
    key: "status",
    width: 120,
    align: "center",
    render: (value) => (
      <span
        style={{
          display: "inline-flex",
          padding: "2px 8px",
          borderRadius: 999,
          background: value === "启用" ? "var(--squid-color-success-bg)" : "var(--squid-color-fill-tertiary)",
          color: value === "启用" ? "var(--squid-color-success-active)" : "var(--squid-color-text-secondary)",
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
    render: (value) =>
      typeof value === "string"
        ? new Intl.DateTimeFormat("zh-CN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(value))
        : "-",
  },
];

const dataSource: UserRow[] = [
  { id: 1, name: "张三", status: "启用", createdAt: "2026-03-20T08:00:00.000Z" },
  { id: 2, name: "李四", status: "停用", createdAt: "2026-03-21T08:00:00.000Z" },
];

export default () => (
  <Table columns={columns} dataSource={dataSource} rowKey="id" />
);
```

## 加载态与空态

通过 `loading` 和 `emptyText` 处理列表页的异步加载状态。

```tsx
import "@squid-design/ui/styles/global.css";
import { Table } from "@squid-design/ui";
import type { TableColumn } from "@squid-design/ui/table";

type UserRow = {
  id: number;
  name: string;
};

const columns: TableColumn<UserRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name" },
];

export default () => (
  <div style={{ display: "grid", gap: 24 }}>
    <Table columns={columns} dataSource={[{ id: 1, name: "张三" }]} rowKey="id" loading />
    <Table columns={columns} dataSource={[]} rowKey="id" emptyText="当前没有可展示的数据" />
  </div>
);
```

## 分页

`Table` 的分页采用受控模式，组件内部负责渲染分页器，数据切片由外部控制。

```tsx
import "@squid-design/ui/styles/global.css";
import { Table } from "@squid-design/ui";
import type { TableColumn } from "@squid-design/ui/table";
import { useState } from "react";

type UserRow = {
  id: number;
  name: string;
  age: number;
};

const columns: TableColumn<UserRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name" },
  { title: "年龄", dataIndex: "age", key: "age", align: "right", width: 120 },
];

const allData = Array.from({ length: 23 }, (_, index) => ({
  id: index + 1,
  name: `用户 ${index + 1}`,
  age: 18 + (index % 10),
}));

export default () => {
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pagedData = allData.slice((current - 1) * pageSize, current * pageSize);

  return (
    <Table
      columns={columns}
      dataSource={pagedData}
      rowKey="id"
      pagination={{
        current,
        pageSize,
        total: allData.length,
        onPageChange: (page) => setCurrent(page),
        onPageSizeChange: (nextPageSize) => {
          setPageSize(nextPageSize);
          setCurrent(1);
        },
      }}
    />
  );
};
```

## 排序

当前支持单列排序，点击列头右侧排序图标触发排序状态切换。

```tsx
import "@squid-design/ui/styles/global.css";
import { Table } from "@squid-design/ui";
import type { TableColumn, TableSortState } from "@squid-design/ui/table";
import { useState } from "react";

type UserRow = {
  id: number;
  name: string;
  age: number;
};

const dataSource: UserRow[] = [
  { id: 1, name: "张三", age: 18 },
  { id: 2, name: "李四", age: 20 },
  { id: 3, name: "王五", age: 19 },
];

export default () => {
  const [sortState, setSortState] = useState<TableSortState>({
    key: "age",
    order: null,
  });

  const columns: TableColumn<UserRow>[] = [
    { title: "姓名", dataIndex: "name", key: "name" },
    {
      title: "年龄",
      dataIndex: "age",
      key: "age",
      sortable: true,
      sorter: (left, right) => left.age - right.age,
      align: "right",
      width: 120,
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      sortState={sortState}
      onSortChange={setSortState}
    />
  );
};
```

## 筛选

支持列头筛选入口、单选/多选和本地过滤。

```tsx
import "@squid-design/ui/styles/global.css";
import { Table } from "@squid-design/ui";
import type { TableColumn } from "@squid-design/ui/table";

type UserRow = {
  id: number;
  name: string;
  age: number;
  address: string;
};

const columns: TableColumn<UserRow>[] = [
  { title: "姓名", dataIndex: "name", key: "name" },
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
      value === "18-19" ? record.age < 20 : record.age >= 20,
  },
  {
    title: "地址",
    dataIndex: "address",
    key: "address",
    filters: [
      { text: "上海", value: "上海" },
      { text: "北京", value: "北京" },
    ],
    onFilter: (value, record) => record.address.includes(String(value)),
  },
];

const dataSource: UserRow[] = [
  { id: 1, name: "张三", age: 18, address: "上海市静安区" },
  { id: 2, name: "李四", age: 20, address: "北京市朝阳区" },
  { id: 3, name: "王五", age: 21, address: "上海市浦东新区" },
];

export default () => (
  <Table columns={columns} dataSource={dataSource} rowKey="id" />
);
```

## Table API

### Table Props

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `columns` | 列配置 | `TableColumn<T>[]` | `undefined` |
| `dataSource` | 表格数据源 | `T[]` | `undefined` |
| `rowKey` | 行唯一标识 | `keyof T \| (record: T) => Key` | - |
| `className` | 自定义类名 | `string` | `undefined` |
| `style` | 自定义样式 | `CSSProperties` | `undefined` |
| `loading` | 加载态 | `boolean` | `false` |
| `emptyText` | 空态文案 | `ReactNode` | `"暂无数据"` |
| `pagination` | 分页配置 | `false \| TablePagination` | `false` |
| `sortState` | 当前排序状态 | `TableSortState` | `undefined` |
| `onSortChange` | 排序变化回调 | `(sortState: TableSortState) => void` | `undefined` |
| `filterState` | 当前筛选状态 | `TableFilterState[]` | `undefined` |
| `onFilterChange` | 筛选变化回调 | `(filterState: TableFilterState[]) => void` | `undefined` |

### TableColumn Attributes

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `title` | 列标题 | `ReactNode` | - |
| `dataIndex` | 数据字段路径 | `string \| number \| (string \| number)[]` | - |
| `key` | 列唯一标识 | `Key` | - |
| `align` | 对齐方式 | `"left" \| "center" \| "right"` | `"left"` |
| `width` | 列宽 | `CSSProperties["width"]` | `undefined` |
| `ellipsis` | 是否省略过长文本 | `boolean` | `false` |
| `sortable` | 是否开启排序 | `boolean` | `false` |
| `sorter` | 本地排序函数 | `(left: T, right: T) => number` | `undefined` |
| `filters` | 筛选项配置 | `TableFilterOption[]` | `undefined` |
| `filterMultiple` | 是否多选筛选 | `boolean` | `true` |
| `onFilter` | 本地筛选函数 | `(value: Key, record: T) => boolean` | `undefined` |
| `render` | 自定义渲染 | `(value: unknown, record: T, index: number) => ReactNode` | `undefined` |

### Pagination Attributes

| 属性名 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| `current` | 当前页 | `number` | - |
| `pageSize` | 每页条数 | `number` | - |
| `total` | 数据总数 | `number` | - |
| `pageSizeOptions` | 每页条数选项 | `number[]` | `[10, 20, 50]` |
| `onPageChange` | 页码变化回调 | `(page: number, pageSize: number) => void` | `undefined` |
| `onPageSizeChange` | 每页条数变化回调 | `(pageSize: number, page: number) => void` | `undefined` |

### 说明

- `Table` 支持基础展示、排序、筛选、分页、加载态与空态
- 排序当前为单列排序，交互入口在列头图标区
- 筛选支持受控与内部兜底状态，两种模式都可使用
