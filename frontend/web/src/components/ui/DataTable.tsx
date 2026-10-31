import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { TableSkeleton } from "./Skeleton";

export interface DataColumn<T> {
  key: string;
  header: ReactNode;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
}

export function DataTable<T extends { id: number | string }>({
  rows,
  columns,
  loading = false,
  empty,
  renderMobile,
  rowClassName,
  stickyHeader = true,
  caption,
  className,
}: {
  rows: T[];
  columns: DataColumn<T>[];
  loading?: boolean;
  empty: ReactNode;
  renderMobile?: (row: T) => ReactNode;
  rowClassName?: (row: T) => string | undefined;
  stickyHeader?: boolean;
  caption?: string;
  className?: string;
}) {
  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  if (rows.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "border-b border-navy-100/70 bg-canvas/95 px-4 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-faint backdrop-blur first:rounded-l-input last:rounded-r-input",
                    column.headerClassName,
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "group transition-colors duration-150 hover:bg-navy-50/40",
                  rowClassName?.(row),
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "border-b border-navy-50/80 px-4 py-3.5 align-middle text-xs text-ink-soft last:border-b-0",
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderMobile ? (
        <div className="grid gap-3 lg:hidden">
          {rows.map((row) => (
            <div key={row.id}>{renderMobile(row)}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
