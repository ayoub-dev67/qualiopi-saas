"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  month: string;
  note: number;
}

export default function SatisfactionChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 h-full flex items-center justify-center">
        <p className="text-sm text-[#64748b]">Pas encore de données satisfaction</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6">
      <h3 className="text-sm font-medium text-[#94a3b8] mb-6">
        Évolution de la satisfaction
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="satGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="month"
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 5]}
            stroke="#64748b"
            tick={{ fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#111827",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              color: "#f1f5f9",
              fontSize: "12px",
            }}
            formatter={(v: number | string | undefined) => [`${Number(v ?? 0).toFixed(1)}/5`, "Note"]}
          />
          <Area
            type="monotone"
            dataKey="note"
            stroke="#6366f1"
            fill="url(#satGrad)"
            strokeWidth={2}
            dot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#818cf8", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
