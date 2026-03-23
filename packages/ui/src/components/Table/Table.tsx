import "./style.css";
import { useRef, useState } from "react";
import type { CSSProperties, Key, ReactNode } from "react";
import { createPortal } from "react-dom";

type PathSegment = string | number;
type RecordField<T> = Extract<keyof T, PathSegment>;
type DataIndex<T> = RecordField<T> | PathSegment | readonly PathSegment[];
type RowKey<T> = keyof T | ((record: T) => Key);
type TableAlign = "left" | "center" | "right";
export type TableSortOrder = "asc" | "desc" | null;

export type TablePagination = {
  current: number;
  pageSize: number;
  total: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number, pageSize: number) => void;
  onPageSizeChange?: (pageSize: number, page: number) => void;
};

export type TableSortState = {
  key: Key;
  order: TableSortOrder;
};

export type TableFilterOption = {
  text: ReactNode;
  value: Key;
};

export type TableFilterState = {
  key: Key;
  values: Key[];
};

export type TableColumn<T> = {
  title: ReactNode;
  dataIndex: DataIndex<T>;
  key: Key;
  align?: TableAlign;
  width?: CSSProperties["width"];
  ellipsis?: boolean;
  sortable?: boolean;
  sorter?: (left: T, right: T) => number;
  filters?: TableFilterOption[];
  filterMultiple?: boolean;
  onFilter?: (value: Key, record: T) => boolean;
  render?: (value: unknown, record: T, index: number) => ReactNode;
};

export type TableProps<T extends Record<string, unknown>> = {
  className?: string;
  columns: TableColumn<T>[];
  dataSource: T[];
  rowKey: RowKey<T>;
  style?: CSSProperties;
  loading?: boolean;
  emptyText?: ReactNode;
  pagination?: false | TablePagination;
  sortState?: TableSortState;
  onSortChange?: (sortState: TableSortState) => void;
  filterState?: TableFilterState[];
  onFilterChange?: (filterState: TableFilterState[]) => void;
};

const FILTER_POPUP_MIN_WIDTH = 180;
const FILTER_POPUP_MAX_WIDTH = 280;
const FILTER_POPUP_VIEWPORT_GAP = 8;

function FilterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227" />
    </svg>
  );
}

function SortIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 9l4 -4l4 4m-4 -4v14" />
      <path d="M21 15l-4 4l-4 -4m4 4v-14" />
    </svg>
  );
}

function getPathValue(
  record: Record<string, unknown>,
  dataIndex: DataIndex<Record<string, unknown>>,
): unknown {
  const path = Array.isArray(dataIndex) ? dataIndex : [dataIndex];

  let currentValue: unknown = record;

  for (const segment of path) {
    if (currentValue == null || typeof currentValue !== "object") {
      return null;
    }

    currentValue = (currentValue as Record<string | number, unknown>)[segment];
  }

  return currentValue;
}

function getDefaultCellContent(value: unknown): ReactNode {
  if (value == null) {
    return null;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return null;
}

function getCellTitle(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "bigint" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return undefined;
}

function getRowKey<T extends Record<string, unknown>>(
  record: T,
  rowKey: RowKey<T>,
): Key {
  if (typeof rowKey === "function") {
    return rowKey(record);
  }

  return record[rowKey] as Key;
}

function getPageNumbers(current: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([
    1,
    totalPages,
    current - 1,
    current,
    current + 1,
  ]);

  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }

  if (current >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

function getNextSortOrder(order: TableSortOrder): TableSortOrder {
  if (order === null) {
    return "asc";
  }

  if (order === "asc") {
    return "desc";
  }

  return null;
}

export default function Table<T extends Record<string, unknown>>({
  className,
  columns,
  dataSource,
  rowKey,
  style,
  loading = false,
  emptyText = "暂无数据",
  pagination = false,
  sortState,
  onSortChange,
  filterState,
  onFilterChange,
}: TableProps<T>) {
  const [innerFilterState, setInnerFilterState] = useState<TableFilterState[]>(
    [],
  );
  const [openFilterKey, setOpenFilterKey] = useState<Key | null>(null);
  const [filterPopupStyle, setFilterPopupStyle] = useState<CSSProperties>();
  const filterTriggerRefs = useRef(new Map<Key, HTMLButtonElement | null>());
  const tableClassName = ["squid-table-wrapper", className]
    .filter(Boolean)
    .join(" ");
  const mergedFilterState = filterState ?? innerFilterState;
  const paginationConfig = pagination || undefined;
  const totalPages = paginationConfig
    ? Math.max(1, Math.ceil(paginationConfig.total / paginationConfig.pageSize))
    : 0;
  const currentPage = paginationConfig
    ? Math.min(Math.max(1, paginationConfig.current), totalPages)
    : 1;
  const pageNumbers = paginationConfig
    ? getPageNumbers(currentPage, totalPages)
    : [];
  const filteredDataSource = mergedFilterState.length
    ? dataSource.filter((record) =>
        mergedFilterState.every((currentFilter) => {
          if (currentFilter.values.length === 0) {
            return true;
          }

          const column = columns.find((item) => item.key === currentFilter.key);

          if (!column?.onFilter) {
            return true;
          }

          return currentFilter.values.some((value) =>
            column.onFilter?.(value, record),
          );
        }),
      )
    : dataSource;
  const sortedDataSource =
    sortState && sortState.order
      ? (() => {
          const sortColumn = columns.find(
            (column) => column.key === sortState.key,
          );

          if (!sortColumn?.sorter) {
            return filteredDataSource;
          }

          const sortedRecords = [...filteredDataSource].sort(sortColumn.sorter);

          return sortState.order === "desc"
            ? sortedRecords.reverse()
            : sortedRecords;
        })()
      : filteredDataSource;

  function handlePageChange(page: number) {
    if (!paginationConfig || page === currentPage) {
      return;
    }

    paginationConfig.onPageChange?.(page, paginationConfig.pageSize);
  }

  function handlePageSizeChange(nextPageSize: number) {
    if (!paginationConfig) {
      return;
    }

    paginationConfig.onPageSizeChange?.(nextPageSize, 1);
    paginationConfig.onPageChange?.(1, nextPageSize);
  }

  function handleSort(column: TableColumn<T>) {
    if (!column.sortable) {
      return;
    }

    const currentOrder = sortState?.key === column.key ? sortState.order : null;

    onSortChange?.({
      key: column.key,
      order: getNextSortOrder(currentOrder),
    });
  }

  function getColumnFilterState(columnKey: Key) {
    return mergedFilterState.find((item) => item.key === columnKey);
  }

  function updateFilterState(nextFilterState: TableFilterState[]) {
    if (filterState === undefined) {
      setInnerFilterState(nextFilterState);
    }

    onFilterChange?.(nextFilterState);
  }

  function handleFilterChange(
    column: TableColumn<T>,
    filterValue: Key,
    checked: boolean,
  ) {
    const currentFilterState = getColumnFilterState(column.key);
    const currentValues = currentFilterState?.values ?? [];
    const nextValues =
      column.filterMultiple === false
        ? checked
          ? [filterValue]
          : []
        : checked
          ? [...currentValues, filterValue]
          : currentValues.filter((value) => value !== filterValue);
    const nextFilterState = mergedFilterState.filter(
      (item) => item.key !== column.key,
    );

    if (nextValues.length > 0) {
      nextFilterState.push({
        key: column.key,
        values: nextValues,
      });
    }

    updateFilterState(nextFilterState);
  }

  function clearFilter(columnKey: Key) {
    updateFilterState(
      mergedFilterState.filter((item) => item.key !== columnKey),
    );
  }

  function toggleFilterPopup(columnKey: Key) {
    const triggerElement = filterTriggerRefs.current.get(columnKey);

    if (!triggerElement) {
      return;
    }

    if (openFilterKey === columnKey) {
      setOpenFilterKey(null);
      return;
    }

    const rect = triggerElement.getBoundingClientRect();
    const popupWidth = Math.min(
      Math.max(rect.width + 152, FILTER_POPUP_MIN_WIDTH),
      FILTER_POPUP_MAX_WIDTH,
    );
    const left = Math.min(
      Math.max(rect.right - popupWidth, FILTER_POPUP_VIEWPORT_GAP),
      window.innerWidth - popupWidth - FILTER_POPUP_VIEWPORT_GAP,
    );
    const top = Math.min(rect.bottom + 8, window.innerHeight - 220);

    setFilterPopupStyle({
      position: "fixed",
      top,
      left,
      width: popupWidth,
      zIndex: 1000,
    });
    setOpenFilterKey(columnKey);
  }

  const openFilterColumn =
    openFilterKey != null
      ? columns.find((column) => column.key === openFilterKey)
      : undefined;
  const openFilterColumnState =
    openFilterKey != null ? getColumnFilterState(openFilterKey) : undefined;

  return (
    <div className="squid-table-container" style={style}>
      <div className={tableClassName}>
        <table className="squid-table">
          <colgroup>
            {columns.map((column) => (
              <col
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
              />
            ))}
          </colgroup>

          <thead className="squid-table-thead">
            <tr>
              {columns.map((column) =>
                (() => {
                  const currentFilterState = getColumnFilterState(column.key);
                  const hasFilter = Boolean(column.filters?.length);
                  const hasActiveFilter =
                    (currentFilterState?.values.length ?? 0) > 0;

                  return (
                    <th
                      className={[
                        "squid-table-cell",
                        "squid-table-cell-head",
                        (column.sortable || hasFilter) &&
                          "squid-table-cell-sortable",
                        `squid-table-cell-align-${column.align ?? "left"}`,
                      ].join(" ")}
                      key={column.key}
                    >
                      <div className="squid-table-header">
                        <span
                          className={[
                            "squid-table-cell-content",
                            column.ellipsis &&
                              "squid-table-cell-content-ellipsis",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {column.title}
                        </span>

                        <div className="squid-table-header-actions">
                          {column.sortable ? (
                            <button
                              aria-label="Sort column"
                              className={[
                                "squid-table-sorter-trigger",
                                sortState?.key === column.key &&
                                  sortState.order &&
                                  `squid-table-sorter-trigger-${sortState.order}`,
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => handleSort(column)}
                              type="button"
                            >
                              <span
                                aria-hidden="true"
                                className="squid-table-sorter-icon"
                              >
                                <SortIcon />
                              </span>
                            </button>
                          ) : null}

                          {hasFilter ? (
                            <button
                              aria-label="Filter column"
                              className={[
                                "squid-table-filter-trigger",
                                hasActiveFilter &&
                                  "squid-table-filter-trigger-active",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              onClick={() => toggleFilterPopup(column.key)}
                              ref={(node) => {
                                filterTriggerRefs.current.set(column.key, node);
                              }}
                              type="button"
                            >
                              <FilterIcon />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </th>
                  );
                })(),
              )}
            </tr>
          </thead>

          <tbody className="squid-table-tbody">
            {loading ? (
              <tr className="squid-table-row">
                <td
                  className="squid-table-cell squid-table-state-cell"
                  colSpan={columns.length}
                >
                  <div className="squid-table-state">
                    <span
                      aria-hidden="true"
                      className="squid-table-loading-spinner"
                    />
                    <span>加载中...</span>
                  </div>
                </td>
              </tr>
            ) : dataSource.length > 0 ? (
              sortedDataSource.map((record, index) => (
                <tr className="squid-table-row" key={getRowKey(record, rowKey)}>
                  {columns.map((column) => {
                    const rawValue = getPathValue(
                      record,
                      column.dataIndex as DataIndex<Record<string, unknown>>,
                    );
                    const renderedValue = column.render?.(
                      rawValue,
                      record,
                      index,
                    );
                    const defaultValue = getDefaultCellContent(rawValue);
                    const cellContent = renderedValue ?? defaultValue;
                    const cellClassName = [
                      "squid-table-cell",
                      `squid-table-cell-align-${column.align ?? "left"}`,
                    ].join(" ");
                    const contentClassName = [
                      "squid-table-cell-content",
                      column.ellipsis && "squid-table-cell-content-ellipsis",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    const title = column.ellipsis
                      ? getCellTitle(rawValue)
                      : undefined;

                    return (
                      <td className={cellClassName} key={column.key}>
                        {cellContent == null ? (
                          <span className="squid-table-cell-empty">-</span>
                        ) : column.render ? (
                          <div
                            className={[
                              "squid-table-cell-custom",
                              column.ellipsis &&
                                "squid-table-cell-custom-ellipsis",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            title={title}
                          >
                            {cellContent}
                          </div>
                        ) : (
                          <span className={contentClassName} title={title}>
                            {cellContent}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr className="squid-table-row">
                <td
                  className="squid-table-cell squid-table-state-cell"
                  colSpan={columns.length}
                >
                  <div className="squid-table-state squid-table-state-empty">
                    {emptyText}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {paginationConfig ? (
        <div className="squid-table-pagination">
          <div className="squid-table-pagination-total">
            共 {paginationConfig.total} 条，第 {currentPage}/{totalPages} 页
          </div>

          <div className="squid-table-pagination-controls">
            <label className="squid-table-page-size">
              <span>每页</span>
              <select
                className="squid-table-page-size-select"
                onChange={(event) =>
                  handlePageSizeChange(Number(event.target.value))
                }
                value={paginationConfig.pageSize}
              >
                {(paginationConfig.pageSizeOptions ?? [10, 20, 50]).map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ),
                )}
              </select>
              <span>条</span>
            </label>

            <button
              className="squid-table-page-button"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              type="button"
            >
              上一页
            </button>

            <div className="squid-table-page-list">
              {pageNumbers.map((page, index) => {
                const previousPage = pageNumbers[index - 1];
                const showEllipsis =
                  previousPage !== undefined && page - previousPage > 1;

                return (
                  <span className="squid-table-page-item-group" key={page}>
                    {showEllipsis ? (
                      <span className="squid-table-page-ellipsis">...</span>
                    ) : null}
                    <button
                      className={[
                        "squid-table-page-button",
                        page === currentPage &&
                          "squid-table-page-button-active",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => handlePageChange(page)}
                      type="button"
                    >
                      {page}
                    </button>
                  </span>
                );
              })}
            </div>

            <button
              className="squid-table-page-button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              type="button"
            >
              下一页
            </button>
          </div>
        </div>
      ) : null}

      {openFilterColumn && filterPopupStyle
        ? createPortal(
            <div className="squid-table-filter-panel" style={filterPopupStyle}>
              <div className="squid-table-filter-options">
                {openFilterColumn.filters?.map((option) => {
                  const checked =
                    openFilterColumnState?.values.includes(option.value) ??
                    false;

                  return (
                    <label
                      className="squid-table-filter-option"
                      key={option.value}
                    >
                      <input
                        checked={checked}
                        name={`filter-${String(openFilterColumn.key)}`}
                        onChange={(event) =>
                          handleFilterChange(
                            openFilterColumn,
                            option.value,
                            event.target.checked,
                          )
                        }
                        type={
                          openFilterColumn.filterMultiple === false
                            ? "radio"
                            : "checkbox"
                        }
                      />
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </div>

              <div className="squid-table-filter-panel-footer">
                <button
                  className="squid-table-filter-clear"
                  onClick={() => clearFilter(openFilterColumn.key)}
                  type="button"
                >
                  清空
                </button>
                <button
                  className="squid-table-filter-close"
                  onClick={() => setOpenFilterKey(null)}
                  type="button"
                >
                  关闭
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
