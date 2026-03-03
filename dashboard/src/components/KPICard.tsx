import { type LucideIcon } from "lucide-react";

interface KPICardProps {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: { direction: "up" | "down"; value: string };
  icon: LucideIcon;
  accent?: string;
}

export default function KPICard({
  label,
  value,
  suffix,
  trend,
  icon: Icon,
  accent = "#6366f1",
}: KPICardProps) {
  return (
    <div className="relative overflow-hidden bg-[#111827] border border-[#1e293b] rounded-2xl p-6 hover:border-[#2d3a4f] transition-all">
      {/* Decorative circle */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-[0.07]"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[#94a3b8] mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#f1f5f9]">{value}</span>
            {suffix && (
              <span className="text-sm text-[#64748b]">{suffix}</span>
            )}
          </div>
          {trend && (
            <p
              className={`text-xs mt-2 font-medium ${
                trend.direction === "up"
                  ? "text-emerald-400"
                  : "text-red-400"
              }`}
            >
              {trend.direction === "up" ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}18` }}
        >
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}
