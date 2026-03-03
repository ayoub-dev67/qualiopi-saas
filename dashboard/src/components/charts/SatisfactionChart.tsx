"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface DataPoint { month: string; note: number; }

export default function SatisfactionChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6 h-full flex flex-col items-center justify-center min-h-[320px]">
        <TrendingUp size={48} className="text-[var(--text-dim)] mb-4" />
        <p className="text-sm text-[var(--text-secondary)]">Pas encore de données satisfaction</p>
        <p className="text-xs text-[var(--text-dim)] mt-1">Les données apparaîtront après vos premières sessions</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-6">Évolution de la satisfaction</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="satGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
          <XAxis dataKey="month" stroke="var(--text-dim)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 10]} stroke="var(--text-dim)" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "12px" }}
            formatter={(v: number | string | undefined) => [`${Number(v ?? 0).toFixed(1)}/10`, "Note"]}
          />
          <Area type="monotone" dataKey="note" stroke="#6366f1" fill="url(#satGrad)" strokeWidth={2} dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} activeDot={{ r: 6, fill: "#818cf8", strokeWidth: 0 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
