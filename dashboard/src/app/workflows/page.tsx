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
  { id: "WF0", name: "Setup Session", description: "Création dossier Drive, génération Convention PDF (Gotenberg), envoi Convocations email avec pièces jointes" },
  { id: "WF1", name: "Positionnement", description: "Envoi automatique des liens Google Forms pour le questionnaire de positionnement pré-formation à chaque apprenant inscrit" },
  { id: "WF2", name: "Émargement", description: "Génération et envoi des feuilles de présence quotidiennes, suivi de l'émargement digital par session" },
  { id: "WF3", name: "Satisfaction & Évaluation", description: "Envoi des questionnaires Google Forms de satisfaction et d'évaluation des acquis post-session, collecte et agrégation des résultats" },
  { id: "WF4", name: "Amélioration Continue", description: "Traitement des réclamations, calcul hebdomadaire des KPIs qualité, génération du rapport d'amélioration continue" },
  { id: "WF5", name: "Relances", description: "Relances automatiques multi-niveaux par email pour les questionnaires non complétés, conventions non signées, documents manquants" },
  { id: "WF6", name: "Suivi à Froid", description: "Génération des attestations et certificats de réalisation, envoi du questionnaire de suivi à froid 6 mois post-formation" },
];

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

function isTrue(v: string | undefined): boolean {
  const lower = (v ?? "").toLowerCase();
  return lower === "true" || lower === "vrai";
}

export default async function WorkflowsPage() {
  const [sessions, journal] = await Promise.all([
    getSessions(),
    getJournal(),
  ]);

  // Per-workflow status logic
  // W0: sessions "planifiee" → warning if workflow_0_ok=false
  // W1: sessions with workflow_0_ok=true → warning if workflow_1_ok=false
  // W2: sessions "en_cours" → warning if workflow_2_ok=false
  // W3: sessions "terminee" → warning if workflow_3_ok=false

  function getWfConcerned(wfIndex: number) {
    switch (wfIndex) {
      case 0:
        return sessions.filter((s) => normalizeStatus(s.statut ?? "") === "planifiee");
      case 1:
        return sessions.filter((s) => isTrue(s.workflow_0_ok));
      case 2:
        return sessions.filter((s) => normalizeStatus(s.statut ?? "") === "en_cours");
      case 3:
        return sessions.filter((s) => normalizeStatus(s.statut ?? "") === "terminee");
      default:
        return [];
    }
  }

  const wfColumns = ["workflow_0_ok", "workflow_1_ok", "workflow_2_ok", "workflow_3_ok"];

  const workflowData = WORKFLOWS.map((wf, i) => {
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

    // Last 3 executions for mini timeline
    const last3 = journalEntries.slice(-3);
    const timeline: ("ok" | "error" | "none")[] = [];
    for (let t = 0; t < 3; t++) {
      if (t < last3.length) {
        const st = normalizeStatus(last3[t].statut ?? "");
        timeline.push(st === "erreur" || st === "error" ? "error" : "ok");
      } else {
        timeline.push("none");
      }
    }

    // Determine status
    let status: string;
    let concerned = 0;
    let done = 0;
    let missing = 0;

    if (i < wfColumns.length) {
      const concernedSessions = getWfConcerned(i);
      concerned = concernedSessions.length;
      done = concernedSessions.filter((s) => isTrue(s[wfColumns[i]])).length;
      missing = concerned - done;

      if (concerned === 0) {
        status = "inactive";
      } else if (missing > 0) {
        status = "warning";
      } else {
        status = "ok";
      }
    } else {
      // WF4-WF6: use journal data
      if (execCount === 0) {
        status = "inactive";
      } else if (errorCount > 0) {
        status = "error";
      } else {
        status = "ok";
      }
    }

    return { ...wf, status, lastExec, execCount, errorCount, concerned, done, missing, timeline };
  });

  // Counts
  const countOk = workflowData.filter((w) => w.status === "ok").length;
  const countWarn = workflowData.filter((w) => w.status === "warning").length;
  const countErr = workflowData.filter((w) => w.status === "error").length;
  const countInactive = workflowData.filter((w) => w.status === "inactive").length;

  const timelineColor = (s: "ok" | "error" | "none") => {
    if (s === "ok") return "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]";
    if (s === "error") return "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]";
    return "bg-[var(--border-subtle)]";
  };

  return (
    <div className="space-y-6">
      {/* Mini KPI cards with stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="Actifs" value={countOk} icon={CheckCircle2} accent="#10b981" delay={0} />
        <KPICard label="En alerte" value={countWarn} icon={AlertTriangle} accent="#f59e0b" delay={80} />
        <KPICard label="En erreur" value={countErr} icon={XCircle} accent="#ef4444" delay={160} />
        <KPICard label="Inactifs" value={countInactive} icon={CircleDot} accent="#94a3b8" delay={240} />
      </div>

      {/* Workflow cards */}
      <div className="space-y-4">
        {workflowData.map((wf, idx) => (
          <div
            key={wf.id}
            className={`glass-card p-6 stagger-${idx + 1}`}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-5">
                {/* ID */}
                <div className="text-2xl font-bold font-mono text-[var(--text-primary)] min-w-[60px]">
                  {wf.id}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">{wf.name}</h4>
                  <p className="text-xs text-[var(--text-dim)] mt-1 max-w-lg leading-relaxed">{wf.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {/* Stats */}
                <div className="text-right">
                  <p className="text-xs text-[var(--text-dim)]">Dernière exécution</p>
                  <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5">{wf.lastExec}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-dim)]">Exécutions</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">{wf.execCount}</p>
                </div>
                {wf.errorCount > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-[var(--text-dim)]">Erreurs</p>
                    <p className="text-sm font-medium text-red-400 mt-0.5">{wf.errorCount}</p>
                  </div>
                )}
                <WorkflowStatusBadge status={wf.status} />
              </div>
            </div>

            {/* Progress for WF0-WF3 */}
            {wf.concerned > 0 && (
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((wf.done / wf.concerned) * 100)}%`,
                      backgroundColor:
                        wf.status === "ok" ? "#10b981" : wf.status === "warning" ? "#f59e0b" : "#ef4444",
                    }}
                  />
                </div>
                <span className="text-[11px] text-[var(--text-dim)] font-mono">
                  {wf.done}/{wf.concerned}
                </span>
              </div>
            )}

            {/* Mini timeline — 3 last executions */}
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]/50 flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-dim)] mr-1">Dernières exec.</span>
              {wf.timeline.map((t, ti) => (
                <span key={ti} className={`w-2.5 h-2.5 rounded-full ${timelineColor(t)}`} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
