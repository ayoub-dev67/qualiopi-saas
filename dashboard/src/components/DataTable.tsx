import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}

export default function DataTable({
  headers, rows, emptyIcon: EmptyIcon, emptyTitle, emptyDescription,
}: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="glass-card p-12 flex flex-col items-center text-center">
        {EmptyIcon && <EmptyIcon size={48} className="text-[var(--text-dim)] mb-4" />}
        <p className="text-sm text-[var(--text-secondary)]">{emptyTitle ?? "Aucune donnée"}</p>
        {emptyDescription && <p className="text-xs text-[var(--text-dim)] mt-1 max-w-xs">{emptyDescription}</p>}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto glass-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border-subtle)]" style={{ background: "rgba(255,255,255,0.02)" }}>
            {headers.map((h) => (
              <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-card-hover)] transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3.5 text-[var(--text-secondary)]">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
