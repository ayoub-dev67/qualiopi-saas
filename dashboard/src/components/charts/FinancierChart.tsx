"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface DataPoint {
  month: string;
  prevu: number;
  facture: number;
  encaisse: number;
}

export default function FinancierChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 h-full flex items-center justify-center">
        <p className="text-sm text-[#64748b]">Aucune donnée financière</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-[#94a3b8] mb-6">
        Suivi financier mensuel
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="month"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "12px",
            }}
            formatter={(v: number | string | undefined) => [
              `${Number(v ?? 0).toLocaleString("fr-FR")} €`,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
          />
          <Bar dataKey="prevu" name="Prévu" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="facture" name="Facturé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="encaisse" name="Encaissé" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
