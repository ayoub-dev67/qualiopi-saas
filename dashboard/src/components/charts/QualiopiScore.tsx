"use client";

import ProgressRing from "@/components/ProgressRing";

interface Critere { num: number; label: string; score: number; }
interface Props { score: number; criteres: Critere[]; }

function barColor(score: number): string {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#ef4444";
}

export default function QualiopiScore({ score, criteres }: Props) {
  return (
    <div className="glass-card p-6 flex flex-col items-center">
      <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-5">Score Qualiopi</h3>
      <ProgressRing value={score} size={140} strokeWidth={10} />
      <div className="w-full mt-6 space-y-2.5">
        {criteres.map((c) => (
          <div key={c.num} className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[var(--text-dim)] w-6 shrink-0">C{c.num}</span>
            <div className="flex-1 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${c.score}%`, backgroundColor: barColor(c.score) }}
              />
            </div>
            <span className="text-[11px] font-mono text-[var(--text-secondary)] w-8 text-right">{c.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
