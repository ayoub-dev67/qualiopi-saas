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

/** Deterministic pseudo-random sparkline (7 points) */
function generateSparkline(seed: number, trend: "up" | "stable" = "up"): number[] {
  const points: number[] = [];
  let val = (seed % 40) + 30;
  for (let i = 0; i < 7; i++) {
    const noise = (((seed + 1) * (i + 1) * 13) % 21) - 10;
    const drift = trend === "up" ? 4 : 0;
    val = Math.max(10, Math.min(90, val + drift + noise));
    points.push(Math.round(val));
  }
  return points;
}

function BottomSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 40;
  const padding = 2;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${padding + (h - 2 * padding) - ((v - min) / range) * (h - 2 * padding)}`)
    .join(" ");
  // Area fill path
  const areaPath = `M0,${h} ` + data
    .map((v, i) => `L${(i / (data.length - 1)) * w},${padding + (h - 2 * padding) - ((v - min) / range) * (h - 2 * padding)}`)
    .join(" ") + ` L${w},${h} Z`;
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute bottom-0 left-0 right-0 rounded-b-2xl overflow-hidden">
      <defs>
        <linearGradient id={`spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.3} />
    </svg>
  );
}

export default function KPICard({
  label, value, suffix, trend, icon: Icon, accent = "#6366f1", delay = 0, sparkline,
}: KPICardProps) {
  // Always show sparkline — use provided data or generate deterministic one
  const numVal = typeof value === "number" ? value : parseInt(String(value)) || 0;
  const sparkData = sparkline ?? generateSparkline(
    numVal + label.length * 7,
    trend?.direction === "down" ? "stable" : "up"
  );

  return (
    <div
      className="glass-card relative overflow-hidden p-6 pb-12 animate-fade-in-up"
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

      {/* Bottom sparkline — always visible */}
      <BottomSparkline data={sparkData} color={accent} />
    </div>
  );
}
