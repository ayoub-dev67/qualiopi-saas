import { getSessions, getJournal } from "@/lib/sheets";
import { CheckCircle2, AlertTriangle, XCircle, CircleDot } from "lucide-react";
import KPICard from "@/components/KPICard";
import WorkflowStatusBadge from "@/components/WorkflowStatusBadge";

interface WorkflowDef {
  id: string;
  name: string;
  description: string;
}

const WORKFLOWS: WorkflowDef[] = [
  { id: "WF0", name: "Tally → Inscription", description: "Webhook Tally, création apprenant et inscription automatique" },
  { id: "WF1", name: "Génération PDF", description: "Convention, convocation, attestation via Gotenberg" },
  { id: "WF2", name: "Envoi Positionnement", description: "Questionnaire de positionnement pré-formation" },
  { id: "WF3", name: "Satisfaction & Évaluation", description: "Envoi questionnaires satisfaction et évaluation post-session" },
  { id: "WF4", name: "Relances automatiques", description: "Relances par email pour documents non retournés" },
  { id: "WF5", name: "Alertes Réclamation", description: "Notification et suivi des réclamations apprenants" },
  { id: "WF6", name: "Archivage Drive", description: "Archivage automatique des documents dans Google Drive" },
];

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

export default async function WorkflowsPage() {
  const [sessions, journal] = await Promise.all([
    getSessions(),
    getJournal(),
  ]);

  // Derive workflow statuses from session data
  const wfColumns = ["workflow_0_ok", "workflow_1_ok", "workflow_2_ok", "workflow_3_ok"];
  const sessionsActives = sessions.filter(
    (s) => ["en_cours", "planifiee"].includes(normalizeStatus(s.statut ?? ""))
  );

  function getWfStats(colIndex: number) {
    if (colIndex >= wfColumns.length) return { done: 0, total: 0 };
    const col = wfColumns[colIndex];
    const done = sessionsActives.filter(
      (s) => s[col] === "TRUE" || s[col] === "true"
    ).length;
    return { done, total: sessionsActives.length };
  }

  // Build workflow status info
  const workflowData = WORKFLOWS.map((wf, i) => {
    const stats = getWfStats(i);
    let status: string;
    let lastExec = "—";
    let execCount = 0;
    let errorCount = 0;

    // Check journal for this workflow
    const journalEntries = journal.filter(
      (j) => (j.workflow ?? "").toUpperCase().includes(wf.id)
    );
    execCount = journalEntries.length;
    errorCount = journalEntries.filter(
      (j) => normalizeStatus(j.statut ?? "") === "erreur" || normalizeStatus(j.statut ?? "") === "error"
    ).length;

    if (journalEntries.length > 0) {
      const last = journalEntries[journalEntries.length - 1];
      lastExec = last.date ?? last.timestamp ?? "—";
    }

    // Determine status
    if (stats.total === 0 && execCount === 0) {
      status = "inactive";
    } else if (errorCount > 0) {
      status = "error";
    } else if (stats.total > 0 && stats.done < stats.total) {
      status = "warning";
    } else {
      status = "ok";
    }

    // For WF4-WF6 without direct session columns, use journal or default
    if (i >= 4) {
      if (execCount === 0) {
        status = journalEntries.length > 0 ? (errorCount > 0 ? "error" : "ok") : "inactive";
      }
    }

    return { ...wf, status, lastExec, execCount, errorCount, stats };
  });

  // Counts
  const countOk = workflowData.filter((w) => w.status === "ok").length;
  const countWarn = workflowData.filter((w) => w.status === "warning").length;
  const countErr = workflowData.filter((w) => w.status === "error").length;
  const countInactive = workflowData.filter((w) => w.status === "inactive").length;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Mini KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="Actifs" value={countOk} icon={CheckCircle2} accent="#10b981" />
        <KPICard label="En alerte" value={countWarn} icon={AlertTriangle} accent="#f59e0b" />
        <KPICard label="En erreur" value={countErr} icon={XCircle} accent="#ef4444" />
        <KPICard label="Inactifs" value={countInactive} icon={CircleDot} accent="#94a3b8" />
      </div>

      {/* Workflow cards */}
      <div className="space-y-4">
        {workflowData.map((wf) => (
          <div
            key={wf.id}
            className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 hover:border-[#2d3a4f] transition-all"
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-5">
                {/* ID */}
                <div className="text-2xl font-bold font-mono text-[#f1f5f9] min-w-[60px]">
                  {wf.id}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#f1f5f9]">{wf.name}</h4>
                  <p className="text-xs text-[#64748b] mt-1 max-w-md">{wf.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Stats */}
                <div className="text-right">
                  <p className="text-xs text-[#64748b]">Dernière exécution</p>
                  <p className="text-xs text-[#94a3b8] font-mono mt-0.5">{wf.lastExec}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#64748b]">Exécutions</p>
                  <p className="text-sm font-medium text-[#f1f5f9] mt-0.5">{wf.execCount}</p>
                </div>
                {wf.errorCount > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-[#64748b]">Erreurs</p>
                    <p className="text-sm font-medium text-red-400 mt-0.5">{wf.errorCount}</p>
                  </div>
                )}
                <WorkflowStatusBadge status={wf.status} />
              </div>
            </div>

            {/* Progress for WF0-WF3 */}
            {wf.stats.total > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((wf.stats.done / wf.stats.total) * 100)}%`,
                      backgroundColor:
                        wf.status === "ok" ? "#10b981" : wf.status === "warning" ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <span className="text-[11px] text-[#64748b] font-mono">
                  {wf.stats.done}/{wf.stats.total}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
