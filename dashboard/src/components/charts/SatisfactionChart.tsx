"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint { month: string; note: number; }

/** Minimalist SVG illustration: empty chart placeholder */
function EmptyChartIllustration() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="mb-5 opacity-40">
      {/* Axes */}
      <line x1="20" y1="10" x2="20" y2="65" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="65" x2="110" y2="65" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
      {/* Grid lines */}
      <line x1="20" y1="25" x2="110" y2="25" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
      <line x1="20" y1="45" x2="110" y2="45" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />
      {/* Placeholder bars */}
      <rect x="32" y="40" width="10" height="25" rx="2" fill="#1e293b" />
      <rect x="50" y="30" width="10" height="35" rx="2" fill="#1e293b" />
      <rect x="68" y="35" width="10" height="30" rx="2" fill="#1e293b" />
      <rect x="86" y="45" width="10" height="20" rx="2" fill="#1e293b" />
      {/* Dashed trend line */}
      <polyline points="37,38 55,28 73,33 91,43" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="4 3" fill="none" strokeLinecap="round" />
      {/* Dots on trend */}
      <circle cx="37" cy="38" r="2.5" fill="#6366f1" />
      <circle cx="55" cy="28" r="2.5" fill="#6366f1" />
      <circle cx="73" cy="33" r="2.5" fill="#6366f1" />
      <circle cx="91" cy="43" r="2.5" fill="#6366f1" />
    </svg>
  );
}

export default function SatisfactionChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-card p-6 h-full flex flex-col items-center justify-center min-h-[320px]">
        <EmptyChartIllustration />
        <p className="text-sm text-[var(--text-secondary)]">Pas encore de données satisfaction</p>
        <p className="text-xs text-[var(--text-dim)] mt-1 max-w-xs text-center">Les résultats apparaîtront ici après les premières réponses aux questionnaires de satisfaction</p>
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
