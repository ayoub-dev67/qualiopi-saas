"use client";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}

export default function ProgressRing({
  value,
  size = 80,
  strokeWidth = 6,
  color = "#6366f1",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-[#f1f5f9]">
        {Math.round(clamped)}%
      </span>
    </div>
  );
}
