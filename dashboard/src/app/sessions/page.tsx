import { getSessions, getFormations, getFormateurs } from "@/lib/sheets";
import { CalendarDays, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";
import WorkflowDot from "@/components/WorkflowDot";
import DataTable from "@/components/DataTable";

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

export default async function SessionsPage() {
  const [sessions, formations, formateurs] = await Promise.all([
    getSessions(),
    getFormations(),
    getFormateurs(),
  ]);

  const formationMap = new Map(formations.map((f) => [f.formation_id, f.intitule]));
  const formateurMap = new Map(
    formateurs.map((f) => [f.formateur_id, `${f.prenom ?? ""} ${f.nom ?? ""}`.trim()])
  );

  // Counts
  const counts = { planifiee: 0, en_cours: 0, terminee: 0, annulee: 0 };
  for (const s of sessions) {
    const st = normalizeStatus(s.statut ?? "");
    if (st in counts) counts[st as keyof typeof counts]++;
  }

  // Table rows
  const tableRows = sessions.map((s) => {
    const nbInscrits = parseInt(s.nb_inscrits ?? "0") || 0;
    const nbPlaces = parseInt(s.nombre_places ?? "0") || 1;
    const pctFill = Math.min(100, Math.round((nbInscrits / nbPlaces) * 100));

    return [
      // Session ID
      <span key="id" className="font-mono text-indigo-400 text-xs">{s.session_id}</span>,
      // Formation
      <span key="f" className="text-sm">{formationMap.get(s.formation_id) ?? s.formation_id}</span>,
      // Formateur
      <span key="fm" className="text-sm">{formateurMap.get(s.formateur_id) ?? s.formateur_id}</span>,
      // Dates
      <span key="d" className="text-xs whitespace-nowrap">
        {s.date_debut || "—"}{s.date_fin ? ` → ${s.date_fin}` : ""}
      </span>,
      // Lieu
      <span key="l" className="text-xs">{s.lieu || "—"}</span>,
      // Inscrits (progress bar)
      <div key="ins" className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pctFill}%`,
              backgroundColor: pctFill >= 80 ? "#10b981" : pctFill >= 50 ? "#f59e0b" : "#6366f1",
            }}
          />
        </div>
        <span className="text-[11px] text-[#64748b] font-mono whitespace-nowrap">
          {nbInscrits}/{nbPlaces}
        </span>
      </div>,
      // Statut
      <StatusBadge key="st" status={s.statut ?? "planifiee"} />,
      // Workflows
      <div key="wf" className="flex items-center gap-1.5">
        <WorkflowDot done={s.workflow_0_ok === "TRUE" || s.workflow_0_ok === "true"} />
        <WorkflowDot done={s.workflow_1_ok === "TRUE" || s.workflow_1_ok === "true"} />
        <WorkflowDot done={s.workflow_2_ok === "TRUE" || s.workflow_2_ok === "true"} />
        <WorkflowDot done={s.workflow_3_ok === "TRUE" || s.workflow_3_ok === "true"} />
      </div>,
    ];
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Mini KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="Planifiées" value={counts.planifiee} icon={CalendarDays} accent="#a5b4fc" />
        <KPICard label="En cours" value={counts.en_cours} icon={PlayCircle} accent="#10b981" />
        <KPICard label="Terminées" value={counts.terminee} icon={CheckCircle2} accent="#94a3b8" />
        <KPICard label="Annulées" value={counts.annulee} icon={XCircle} accent="#ef4444" />
      </div>

      {/* Data Table */}
      <DataTable
        headers={["Session", "Formation", "Formateur", "Dates", "Lieu", "Inscrits", "Statut", "WF"]}
        rows={tableRows}
      />
    </div>
  );
}
