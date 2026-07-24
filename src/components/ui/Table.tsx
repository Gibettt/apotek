import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  emptyText = "Data belum tersedia"
}: {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-none bg-white shadow-[0_20px_60px_rgba(31,41,35,0.06)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {data.length ? (
              data.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-slate-50">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-3 text-slate-700", column.className)}
                    >
                      {column.cell(row)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-slate-500"
                  colSpan={columns.length}
                >
                  {emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
