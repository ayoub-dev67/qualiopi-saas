"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataPoint { month: string; prevu: number; facture: number; encaisse: number; }

export default function FinancierChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) return null;

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-6">Suivi financier mensuel</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="month" stroke="var(--text-dim)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--text-dim)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px" }}
            formatter={(v: number | string | undefined) => [`${Number(v ?? 0).toLocaleString("fr-FR")} €`]}
          />
          <Legend wrapperStyle={{ fontSize: "12px", color: "var(--text-secondary)" }} />
          <Bar dataKey="prevu" name="Prévu" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="facture" name="Facturé" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          <Bar dataKey="encaisse" name="Encaissé" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
