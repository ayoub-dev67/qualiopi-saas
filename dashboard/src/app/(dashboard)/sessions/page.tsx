import { getSessions } from "@/lib/db";
import Link from "next/link";
import { CalendarDays, PlayCircle, CheckCircle2, XCircle, Search } from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";
import WorkflowDot from "@/components/WorkflowDot";
import DataTable from "@/components/DataTable";

function fmtDate(d: string): string {
  if (d.length >= 10) {
    const parts = d.substring(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  }
  return d || "—";
}

export default async function SessionsPage() {
  const sessions = await getSessions();

  // Counts
  const counts = { planifiee: 0, en_cours: 0, terminee: 0, annulee: 0 };
  for (const s of sessions) {
    const st = s.statut;
    if (st in counts) counts[st as keyof typeof counts]++;
  }

  // Gradient color for progress bar
  function progressGradient(pct: number): string {
    if (pct >= 80) return "linear-gradient(90deg, #059669, #10b981)";
    if (pct >= 50) return "linear-gradient(90deg, #d97706, #f59e0b)";
    return "linear-gradient(90deg, #4f46e5, #6366f1)";
  }

  // Table rows
  const tableRows = sessions.map((s) => {
    const nbInscrits = s.nb_inscrits ?? 0;
    const nbPlaces = s.nombre_places ?? 1;
    const pctFill = Math.min(100, Math.round((nbInscrits / nbPlaces) * 100));

    return [
      // Session ID — hover underline
      <Link key="id" href={`/sessions/${s.id}`} className="font-mono text-indigo-400 text-xs hover:underline cursor-pointer">{s.ref}</Link>,
      // Formation
      <span key="f" className="text-sm">{s.formations.intitule}</span>,
      // Formateur
      <span key="fm" className="text-sm">{`${s.formateurs.prenom} ${s.formateurs.nom}`.trim()}</span>,
      // Dates (DD/MM format)
      <span key="d" className="text-xs whitespace-nowrap">
        {fmtDate(s.date_debut ?? "")}{s.date_fin ? ` → ${fmtDate(s.date_fin)}` : ""}
      </span>,
      // Lieu
      <span key="l" className="text-xs">{s.lieu || "—"}</span>,
      // Inscrits (gradient progress bar)
      <div key="ins" className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pctFill}%`,
              background: progressGradient(pctFill),
            }}
          />
        </div>
        <span className="text-[11px] text-[var(--text-dim)] font-mono whitespace-nowrap">
          {nbInscrits}/{nbPlaces}
        </span>
      </div>,
      // Statut
      <StatusBadge key="st" status={s.statut} />,
      // Workflows
      <div key="wf" className="flex items-center gap-1.5">
        <WorkflowDot done={s.workflow_0_ok} />
        <WorkflowDot done={s.workflow_1_ok} />
        <WorkflowDot done={s.workflow_2_ok} />
        <WorkflowDot done={s.workflow_3_ok} />
      </div>,
    ];
  });

  return (
    <div className="space-y-6">
      {/* Mini KPI cards with stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="Planifiées" value={counts.planifiee} icon={CalendarDays} accent="#a5b4fc" delay={0} />
        <KPICard label="En cours" value={counts.en_cours} icon={PlayCircle} accent="#10b981" delay={80} />
        <KPICard label="Terminées" value={counts.terminee} icon={CheckCircle2} accent="#94a3b8" delay={160} />
        <KPICard label="Annulées" value={counts.annulee} icon={XCircle} accent="#ef4444" delay={240} />
      </div>

      {/* Search / filter bar (cosmetic) */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="flex items-center gap-2 flex-1 bg-white/[0.03] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5">
          <Search size={16} className="text-[var(--text-dim)]" />
          <span className="text-sm text-[var(--text-dim)]">Rechercher une session...</span>
        </div>
        <div className="flex items-center gap-2">
          {["Toutes", "Planifiées", "En cours", "Terminées"].map((f) => (
            <span
              key={f}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors cursor-default ${
                f === "Toutes"
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] font-medium"
                  : "text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-white/[0.03]"
              }`}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        headers={["Session", "Formation", "Formateur", "Dates", "Lieu", "Inscrits", "Statut", "WF"]}
        rows={tableRows}
        emptyIcon={CalendarDays}
        emptyTitle="Aucune session enregistrée"
        emptyDescription="Créez votre première session de formation pour commencer le suivi"
      />
    </div>
  );
}
