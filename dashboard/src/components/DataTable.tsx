import { type ReactNode } from "react";

interface DataTableProps {
  headers: string[];
  rows: ReactNode[][];
}

export default function DataTable({ headers, rows }: DataTableProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-12 text-center">
        <p className="text-sm text-[#64748b]">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#1e293b] bg-[#111827]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#1e293b]">
            {headers.map((h) => (
              <th
                key={h}
                className="text-left px-5 py-3.5 text-xs font-semibold text-[#64748b] uppercase tracking-wider whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-[#1e293b]/50 hover:bg-white/[0.02] transition-colors"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-5 py-3.5 text-[#c8d1dc]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
