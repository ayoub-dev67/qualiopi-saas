import {
  getSessions,
  getFormateurs,
  getReclamations,
  getInscriptions,
  getSatisfaction,
} from "@/lib/sheets";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from "lucide-react";
import KPICard from "@/components/KPICard";

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

type AlertLevel = "danger" | "warning" | "info";

interface Alert {
  level: AlertLevel;
  message: string;
  source: string;
  timestamp: string;
}

export default async function AlertesPage() {
  const [sessions, formateurs, reclamations, inscriptions, satisfaction] =
    await Promise.all([
      getSessions(),
      getFormateurs(),
      getReclamations(),
      getInscriptions(),
      getSatisfaction(),
    ]);

  const alertes: Alert[] = [];

  // DANGER — sessions en cours avec workflows incomplets
  const sessionsEnCours = sessions.filter(
    (s) => normalizeStatus(s.statut ?? "") === "en_cours"
  );
  for (const s of sessionsEnCours) {
    const wfs = [
      { col: "workflow_0_ok", name: "Convention" },
      { col: "workflow_1_ok", name: "Convocation" },
      { col: "workflow_2_ok", name: "Positionnement" },
      { col: "workflow_3_ok", name: "Satisfaction" },
    ];
    for (const wf of wfs) {
      if (s[wf.col] !== "TRUE" && s[wf.col] !== "true") {
        alertes.push({
          level: "danger",
          message: `Session ${s.session_id} : ${wf.name} non exécuté`,
          source: "Workflows",
          timestamp: s.date_debut || "—",
        });
      }
    }
  }

  // DANGER — formateurs sans dossier complet
  const formateursIncomplets = formateurs.filter(
    (f) => f.dossier_complet !== "TRUE" && f.dossier_complet !== "true"
  );
  for (const f of formateursIncomplets) {
    alertes.push({
      level: "danger",
      message: `Formateur ${f.prenom ?? ""} ${f.nom ?? ""} (${f.formateur_id}) : dossier incomplet`,
      source: "Formateurs",
      timestamp: f.date_creation || "—",
    });
  }

  // WARNING — réclamations non traitées
  const recNonTraitees = reclamations.filter(
    (r) =>
      !["traitee", "resolue", "cloturee"].includes(normalizeStatus(r.statut ?? ""))
  );
  for (const r of recNonTraitees) {
    alertes.push({
      level: "warning",
      message: `Réclamation ${r.reclamation_id} : "${r.objet || "sans objet"}" — ${r.gravite || "gravité inconnue"}`,
      source: "Réclamations",
      timestamp: r.date_reclamation || "—",
    });
  }

  // WARNING — relances en attente (inscriptions sans satisfaction)
  const inscrSansSat = inscriptions.filter(
    (i) =>
      (i.satisfaction_repondue !== "TRUE" && i.satisfaction_repondue !== "true") &&
      i.statut &&
      normalizeStatus(i.statut) !== "annulee"
  );
  if (inscrSansSat.length > 0) {
    alertes.push({
      level: "warning",
      message: `${inscrSansSat.length} inscriptions sans retour satisfaction`,
      source: "Relances",
      timestamp: "—",
    });
  }

  // INFO — suivi froid éligible
  const suiviFroidEligible = inscriptions.filter(
    (i) =>
      (i.suivi_froid_envoye !== "TRUE" && i.suivi_froid_envoye !== "true") &&
      (i.attestation_generee === "TRUE" || i.attestation_generee === "true")
  );
  if (suiviFroidEligible.length > 0) {
    alertes.push({
      level: "info",
      message: `${suiviFroidEligible.length} apprenants éligibles au suivi à froid`,
      source: "Suivi froid",
      timestamp: "—",
    });
  }

  // INFO — satisfaction
  const satNotes = satisfaction
    .map((s) => parseFloat(s.note_globale))
    .filter((n) => !isNaN(n));
  if (satNotes.length > 0) {
    const moy = (satNotes.reduce((a, b) => a + b, 0) / satNotes.length).toFixed(1);
    alertes.push({
      level: "info",
      message: `Satisfaction moyenne : ${moy}/5 sur ${satNotes.length} réponses`,
      source: "KPIs",
      timestamp: "—",
    });
  }

  // Counts
  const nbDanger = alertes.filter((a) => a.level === "danger").length;
  const nbWarning = alertes.filter((a) => a.level === "warning").length;
  const nbInfo = alertes.filter((a) => a.level === "info").length;

  const levelConfig: Record<AlertLevel, { border: string; bg: string; iconClass: string; Icon: typeof AlertOctagon }> = {
    danger:  { border: "#ef4444", bg: "rgba(69,10,10,0.3)",  iconClass: "text-red-400",   Icon: AlertOctagon },
    warning: { border: "#f59e0b", bg: "rgba(69,26,3,0.3)",   iconClass: "text-amber-400",  Icon: AlertTriangle },
    info:    { border: "#3b82f6", bg: "rgba(23,37,84,0.3)",   iconClass: "text-blue-400",   Icon: Info },
  };

  // Sort: danger first, then warning, then info
  const sorted = [...alertes].sort((a, b) => {
    const order: Record<AlertLevel, number> = { danger: 0, warning: 1, info: 2 };
    return order[a.level] - order[b.level];
  });

  return (
    <div className="animate-fade-in space-y-6">
      {/* Mini KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPICard label="Critiques" value={nbDanger} icon={AlertOctagon} accent="#ef4444" />
        <KPICard label="Avertissements" value={nbWarning} icon={AlertTriangle} accent="#f59e0b" />
        <KPICard label="Informations" value={nbInfo} icon={Info} accent="#3b82f6" />
      </div>

      {/* Alerts list */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <CheckCircle2 size={40} className="text-emerald-500 mb-3" />
            <p className="text-sm text-[#94a3b8]">Aucune alerte active</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((a, i) => {
              const conf = levelConfig[a.level];
              const { Icon } = conf;
              return (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-white/[0.02] transition-colors"
                  style={{
                    borderLeft: `3px solid ${conf.border}`,
                    backgroundColor: conf.bg,
                  }}
                >
                  <Icon size={16} className={`${conf.iconClass} mt-0.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#e2e8f0] leading-relaxed">{a.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-[#64748b]">{a.source}</span>
                      {a.timestamp !== "—" && (
                        <span className="text-[11px] text-[#475569] font-mono">{a.timestamp}</span>
                      )}
                    </div>
                  </div>
                  <button className="shrink-0 px-3 py-1.5 text-[11px] font-medium text-[#94a3b8] bg-white/5 hover:bg-white/10 rounded-lg border border-[#1e293b] transition-colors whitespace-nowrap">
                    Traiter
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
