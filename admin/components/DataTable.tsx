import type { ReactNode } from "react";

export interface DataTableColumn<T> {
  header: string;
  accessor: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = "Nothing here yet.",
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-card border border-sand bg-white px-6 py-12 text-center text-body text-ink/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-card border border-sand bg-white overflow-hidden overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-sand">
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-5 py-3 text-label-upper uppercase tracking-[0.08em] font-semibold text-ink/60 whitespace-nowrap"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={`border-b border-sand last:border-0 ${
                onRowClick
                  ? "cursor-pointer hover:bg-sand/40 transition-colors duration-300 ease-out"
                  : ""
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={`px-5 py-3.5 text-body text-ink align-middle ${col.className ?? ""}`}
                >
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
