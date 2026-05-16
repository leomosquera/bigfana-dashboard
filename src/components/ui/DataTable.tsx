"use client";

/**
 * BigFana — Enterprise DataTable
 *
 * Built on TanStack Table v8. Supports sorting, pagination, global search,
 * row selection, column visibility, row actions, loading + empty states,
 * sticky header, responsive overflow, and stagger animations.
 *
 * Render-stability contract
 * ─────────────────────────
 * All function props (rowActions, onSelectionChange, getRowId, onRowClick,
 * bulkActions, onExport) are captured in mutable refs and read at call-time.
 * They are never included in useMemo or useEffect dependency arrays.
 * This lets callers pass inline arrow functions without causing rebuild loops.
 *
 * autoResetPageIndex is explicitly false — enabling it re-creates a new
 * pagination state object every time columns are re-evaluated, which feeds
 * a render → setState → render loop when any callback prop is unstable.
 */

import { useState, useMemo, useEffect, useRef } from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Database,
  Download,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Input } from "./Input";
import { DropdownMenu } from "./DropdownMenu";
import { Skeleton } from "./Skeleton";
import { Checkbox } from "@/components/forms/Checkbox";
import { t } from "@/lib/design-system/motion";

// Re-export so consumers only need one import
export type { ColumnDef };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<TData> {
  data:               TData[];
  columns:            ColumnDef<TData, unknown>[];
  /** Custom row ID (defaults to row index). */
  getRowId?:          (row: TData, index: number) => string;

  // ── Loading / empty ──────────────────────────────────────────────────────
  loading?:           boolean;
  skeletonRows?:      number;
  emptyMessage?:      string;
  emptyDescription?:  string;

  // ── Search ───────────────────────────────────────────────────────────────
  searchable?:        boolean;
  searchPlaceholder?: string;

  // ── Pagination ───────────────────────────────────────────────────────────
  paginated?:         boolean;
  defaultPageSize?:   number;
  pageSizeOptions?:   number[];

  // ── Selection ────────────────────────────────────────────────────────────
  selectable?:        boolean;
  onSelectionChange?: (rows: TData[]) => void;

  // ── Interactions ─────────────────────────────────────────────────────────
  onRowClick?:        (row: TData) => void;

  // ── Slots ─────────────────────────────────────────────────────────────────
  /** Per-row action renderer — receives row data, returns ReactNode. */
  rowActions?:        (row: TData) => React.ReactNode;
  /** Bulk action bar shown inside the selection banner. */
  bulkActions?:       (rows: TData[]) => React.ReactNode;
  /** Injected left of the search input in the toolbar. */
  toolbarLeft?:       React.ReactNode;
  /** Injected right of the column picker in the toolbar. */
  toolbarRight?:      React.ReactNode;
  /** Shown as an Export button; omit to hide the button. */
  onExport?:          () => void;

  // ── Layout ───────────────────────────────────────────────────────────────
  stickyHeader?:      boolean;
  /** Explicit max-height for the scrollable table area (e.g. "500px"). */
  maxHeight?:         string;
  caption?:           string;
  className?:         string;
}

// ─── Sort indicator ───────────────────────────────────────────────────────────

function SortIcon({ dir }: { dir: "asc" | "desc" | false }) {
  if (dir === "asc")  return <ChevronUp  size={11} className="text-[#FF2D55] shrink-0" />;
  if (dir === "desc") return <ChevronDown size={11} className="text-[#FF2D55] shrink-0" />;
  return (
    <ChevronsUpDown
      size={11}
      className="text-[#55556A] shrink-0 group-hover:text-[#8888AA] transition-colors duration-100"
    />
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({
  message,
  description,
  colCount,
}: {
  message?:     string;
  description?: string;
  colCount:     number;
}) {
  return (
    <tr>
      <td colSpan={colCount}>
        <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <Database size={20} className="text-[#55556A]" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-[#8888AA]">
              {message ?? "No results found"}
            </p>
            {description && (
              <p className="text-xs text-[#55556A]">{description}</p>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  const widths = ["w-24", "w-32", "w-20", "w-16", "w-28"];
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-white/[0.03]">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-4 py-3">
              <Skeleton
                className={cn(
                  "h-3.5 rounded-lg",
                  widths[(ci + ri) % widths.length]
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────

export function DataTable<TData>({
  data,
  columns,
  getRowId,
  loading           = false,
  skeletonRows      = 6,
  emptyMessage,
  emptyDescription,
  searchable        = false,
  searchPlaceholder = "Search…",
  paginated         = false,
  defaultPageSize   = 10,
  pageSizeOptions   = [10, 25, 50, 100],
  selectable        = false,
  onSelectionChange,
  onRowClick,
  rowActions,
  bulkActions,
  toolbarLeft,
  toolbarRight,
  onExport,
  stickyHeader      = false,
  maxHeight,
  caption,
  className,
}: DataTableProps<TData>) {

  // ── Internal table state ───────────────────────────────────────────────────
  const [sorting,          setSorting]          = useState<SortingState>([]);
  const [globalFilter,     setGlobalFilter]     = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection,     setRowSelection]     = useState<RowSelectionState>({});
  const [pagination,       setPagination]       = useState({
    pageIndex: 0,
    pageSize:  defaultPageSize,
  });

  // ── Stable callback refs ───────────────────────────────────────────────────
  // Updated every render so the latest function is always available at call-time,
  // but the ref objects themselves never change → safe to omit from deps arrays.
  const rowActionsRef        = useRef(rowActions);
  rowActionsRef.current      = rowActions;

  const onSelectionChangeRef        = useRef(onSelectionChange);
  onSelectionChangeRef.current      = onSelectionChange;

  const getRowIdRef          = useRef(getRowId);
  getRowIdRef.current        = getRowId;

  const onRowClickRef        = useRef(onRowClick);
  onRowClickRef.current      = onRowClick;

  // ── Column augmentation ────────────────────────────────────────────────────
  // `rowActions` presence is represented as a stable boolean so the useMemo
  // only rebuilds when the column _structure_ changes (provided/removed),
  // not when the inline function reference changes each render.
  const hasRowActions = rowActions !== undefined;

  const augmentedColumns = useMemo<ColumnDef<TData, unknown>[]>(() => {
    const cols: ColumnDef<TData, unknown>[] = [];

    if (selectable) {
      cols.push({
        id:            "__select__",
        enableSorting: false,
        enableHiding:  false,
        size:          44,
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            indeterminate={
              table.getIsSomePageRowsSelected() &&
              !table.getIsAllPageRowsSelected()
            }
            onChange={(e) => table.getToggleAllPageRowsSelectedHandler()(e)}
            size="sm"
          />
        ),
        cell: ({ row }) => (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={(e) => row.getToggleSelectedHandler()(e)}
              size="sm"
            />
          </div>
        ),
      });
    }

    cols.push(...columns);

    if (hasRowActions) {
      cols.push({
        id:            "__actions__",
        enableSorting: false,
        enableHiding:  false,
        size:          52,
        header:        () => null,
        // rowActionsRef.current is read at call-time — always latest value
        cell: ({ row }) => (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            {rowActionsRef.current!(row.original)}
          </div>
        ),
      });
    }

    return cols;
    // rowActions is deliberately excluded from deps: `hasRowActions` captures
    // structural changes; the actual function is always accessed via ref.
  }, [columns, selectable, hasRowActions]);

  // ── TanStack table instance ────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns:    augmentedColumns,
    getRowId,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange:          setSorting,
    onGlobalFilterChange:     setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange:     setRowSelection,
    onPaginationChange:       setPagination,
    getCoreRowModel:          getCoreRowModel(),
    getSortedRowModel:        getSortedRowModel(),
    getFilteredRowModel:      getFilteredRowModel(),
    ...(paginated && { getPaginationRowModel: getPaginationRowModel() }),
    enableRowSelection:       selectable,
    globalFilterFn:           "includesString",
    // IMPORTANT: must be false — true causes TanStack to call setPagination
    // with a fresh object whenever columns evaluate, creating a render loop
    // when any callback prop (e.g. rowActions) is an inline function.
    autoResetPageIndex:       false,
  });

  // ── Selection → parent callback ────────────────────────────────────────────
  // Deps: only `rowSelection` (the actual change signal) and `data` (needed to
  // map ids → rows). All function props are read via refs to avoid them
  // appearing in deps and causing the effect to fire on every render.
  useEffect(() => {
    if (!onSelectionChangeRef.current) return;
    const selectedIds = new Set(
      Object.entries(rowSelection).filter(([, v]) => v).map(([k]) => k)
    );
    const selected = data.filter((row, index) => {
      const id = getRowIdRef.current
        ? getRowIdRef.current(row, index)
        : String(index);
      return selectedIds.has(id);
    });
    onSelectionChangeRef.current(selected);
  }, [rowSelection, data]); // callbacks accessed via refs — intentionally omitted

  // ── Derived render values ──────────────────────────────────────────────────
  const rows         = table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const selectedCount = Object.values(rowSelection).filter(Boolean).length;
  const totalFiltered = table.getFilteredRowModel().rows.length;

  const hidableColumns = table.getAllLeafColumns().filter(
    (c) => c.id !== "__select__" && c.id !== "__actions__" && c.getCanHide()
  );

  const showToolbar =
    searchable ||
    toolbarLeft !== undefined ||
    toolbarRight !== undefined ||
    onExport !== undefined ||
    hidableColumns.length > 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden",
        className
      )}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      {showToolbar && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.05]">
          {/* Left: injected slot + search */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {toolbarLeft}
            {searchable && (
              <Input
                size="sm"
                placeholder={searchPlaceholder}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                leftIcon={<Search size={13} />}
                rightIcon={
                  globalFilter ? (
                    <button
                      type="button"
                      onClick={() => setGlobalFilter("")}
                      className="text-[#55556A] hover:text-[#8888AA] transition-colors duration-100"
                    >
                      <X size={13} />
                    </button>
                  ) : undefined
                }
                wrapperClassName="w-52"
              />
            )}
          </div>

          {/* Right: injected slot + column picker + export */}
          <div className="flex items-center gap-2 shrink-0">
            {toolbarRight}

            {/* Column visibility */}
            {hidableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenu.Trigger asChild>
                  <Button intent="ghost" size="icon-sm" title="Toggle columns">
                    <SlidersHorizontal size={14} />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" minWidth={168}>
                  <DropdownMenu.Label>Columns</DropdownMenu.Label>
                  {hidableColumns.map((col) => (
                    <DropdownMenu.CheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={(val) => col.toggleVisibility(val)}
                    >
                      {typeof col.columnDef.header === "string"
                        ? col.columnDef.header
                        : col.id}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu>
            )}

            {/* Export */}
            {onExport && (
              <Button
                intent="secondary"
                size="sm"
                leftIcon={<Download size={13} />}
                onClick={onExport}
              >
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── Bulk selection banner ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectable && selectedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={t.fast}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#FF2D55]/[0.06] border-b border-[#FF2D55]/[0.12]">
              <span className="text-xs font-semibold text-[#FF2D55]">
                {selectedCount} row{selectedCount !== 1 ? "s" : ""} selected
              </span>
              {bulkActions && (
                <div className="flex items-center gap-2">
                  {bulkActions(selectedRows)}
                </div>
              )}
              <button
                type="button"
                onClick={() => table.resetRowSelection()}
                className="ml-auto text-[#55556A] hover:text-[#8888AA] transition-colors duration-100"
                title="Clear selection"
              >
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div
        className="overflow-x-auto"
        style={maxHeight ? { maxHeight, overflowY: "auto" } : undefined}
      >
        <table className="w-full border-collapse">
          {caption && (
            <caption className="caption-bottom text-xs text-[#55556A] py-2">
              {caption}
            </caption>
          )}

          {/* Head */}
          <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-[#0D0D14]")}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-white/[0.04]">
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      style={{ width: header.getSize() }}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      className={cn(
                        "px-4 py-3 text-left",
                        "text-[10px] font-semibold uppercase tracking-wider text-[#55556A]",
                        canSort &&
                          "group cursor-pointer select-none hover:text-[#8888AA] transition-colors duration-100"
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1.5">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {canSort && <SortIcon dir={sortDir} />}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              <TableSkeleton rows={skeletonRows} cols={augmentedColumns.length} />
            ) : rows.length === 0 ? (
              <EmptyState
                message={emptyMessage}
                description={emptyDescription}
                colCount={augmentedColumns.length}
              />
            ) : (
              rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.22,
                    delay:    Math.min(i * 0.03, 0.28),
                    ease:     [0, 0, 0.2, 1],
                  }}
                  onClick={
                    onRowClickRef.current
                      ? () => onRowClickRef.current!(row.original)
                      : undefined
                  }
                  className={cn(
                    "border-b border-white/[0.03] transition-colors duration-100",
                    onRowClick && "cursor-pointer",
                    row.getIsSelected()
                      ? "bg-[#FF2D55]/[0.04]"
                      : "hover:bg-white/[0.025]"
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="px-4 py-3 text-sm text-[#C8C8E0] whitespace-nowrap"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ──────────────────────────────────────────────────── */}
      {paginated && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-white/[0.05] bg-white/[0.01]">
          {/* Left: result count + selection hint */}
          <p className="text-xs text-[#55556A] shrink-0">
            {totalFiltered.toLocaleString()} result
            {totalFiltered !== 1 ? "s" : ""}
            {selectedCount > 0 && (
              <span className="text-[#FF2D55] ml-1.5">
                · {selectedCount} selected
              </span>
            )}
          </p>

          {/* Right: page size + nav */}
          <div className="flex items-center gap-3">
            {/* Page size selector */}
            <DropdownMenu>
              <DropdownMenu.Trigger asChild>
                <Button
                  intent="ghost"
                  size="xs"
                  rightIcon={<ChevronDown size={11} />}
                >
                  {pagination.pageSize} / page
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content align="end" minWidth={128}>
                <DropdownMenu.Label>Rows per page</DropdownMenu.Label>
                <DropdownMenu.RadioGroup
                  value={String(pagination.pageSize)}
                  onValueChange={(v) => table.setPageSize(Number(v))}
                >
                  {pageSizeOptions.map((size) => (
                    <DropdownMenu.RadioItem key={size} value={String(size)}>
                      {size} rows
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu>

            {/* Page info */}
            <span className="text-xs text-[#55556A] tabular-nums">
              {table.getState().pagination.pageIndex + 1} /{" "}
              {Math.max(1, table.getPageCount())}
            </span>

            {/* Navigation */}
            <div className="flex items-center gap-0.5">
              <Button
                intent="ghost"
                size="icon-xs"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                title="First page"
              >
                <ChevronsLeft size={13} />
              </Button>
              <Button
                intent="ghost"
                size="icon-xs"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                title="Previous page"
              >
                <ChevronLeft size={13} />
              </Button>
              <Button
                intent="ghost"
                size="icon-xs"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                title="Next page"
              >
                <ChevronRight size={13} />
              </Button>
              <Button
                intent="ghost"
                size="icon-xs"
                onClick={() =>
                  table.setPageIndex(table.getPageCount() - 1)
                }
                disabled={!table.getCanNextPage()}
                title="Last page"
              >
                <ChevronsRight size={13} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
