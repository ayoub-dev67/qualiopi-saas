import { type LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: { direction: "up" | "down"; value: string };
  icon: LucideIcon;
  accent?: string;
  delay?: number;
  sparkline?: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48;
  const h = 20;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  return (
    <svg width={w} height={h} className="inline-block ml-1.5">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function KPICard({
  label, value, suffix, trend, icon: Icon, accent = "#6366f1", delay = 0, sparkline,
}: KPICardProps) {
  return (
    <div
      className="glass-card relative overflow-hidden p-6 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-[0.08]" style={{ background: accent }} />

      <div className="flex items-start justify-between relative">
        <div>
          <p className="text-sm text-[var(--text-secondary)] mb-2">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[40px] font-extrabold text-[var(--text-primary)] leading-none tracking-[-2px]">
              {value}
            </span>
            {suffix && <span className="text-base text-[var(--text-dim)] font-medium">{suffix}</span>}
          </div>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend.direction === "up" ? "text-emerald-400" : "text-red-400"}`}>
                {trend.direction === "up" ? "↑" : "↓"} {trend.value}
              </span>
              {sparkline && <MiniSparkline data={sparkline} color={trend.direction === "up" ? "#10b981" : "#ef4444"} />}
            </div>
          )}
        </div>
        {/* Icon circle with glassmorphism */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center backdrop-blur-sm"
          style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}
