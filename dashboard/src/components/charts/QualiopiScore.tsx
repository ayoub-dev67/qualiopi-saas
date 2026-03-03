"use client";

import ProgressRing from "@/components/ProgressRing";

interface Critere {
  num: number;
  label: string;
  score: number;
}

interface QualiopiScoreProps {
  score: number;
  criteres: Critere[];
}

function dotColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export default function QualiopiScore({ score, criteres }: QualiopiScoreProps) {
  return (
    <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 flex flex-col items-center justify-center">
      <h3 className="text-sm font-medium text-[#94a3b8] mb-6">
        Score Qualiopi
      </h3>
      <ProgressRing value={score} size={130} strokeWidth={10} />

      <div className="mt-6 flex gap-3">
        {criteres.map((c) => (
          <div key={c.num} className="flex flex-col items-center gap-1.5 group relative">
            <div className={`w-3 h-3 rounded-full ${dotColor(c.score)}`} />
            <span className="text-[10px] text-[#64748b] font-mono">
              C{c.num}
            </span>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1e293b] rounded text-[10px] text-[#f1f5f9] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {c.score}% — {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
