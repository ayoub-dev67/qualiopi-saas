import {
  getSessions,
  getFormateurs,
  getReclamations,
  getInscriptions,
  getSatisfaction,
  getSuiviFroid,
} from "@/lib/sheets";
import { AlertTriangle, AlertOctagon, Info, CheckCircle2 } from "lucide-react";
import KPICard from "@/components/KPICard";

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

function isTrue(v: string | undefined): boolean {
  return (v ?? "").toLowerCase() === "true";
}

type AlertLevel = "danger" | "warning" | "info";

interface Alert {
  level: AlertLevel;
  message: string;
  source: string;
  timestamp: string;
}

function daysBetween(dateStr: string, now: Date): number {
  if (!dateStr || dateStr.length < 10) return Infinity;
  const d = new Date(dateStr.substring(0, 10));
  if (isNaN(d.getTime())) return Infinity;
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function AlertesPage() {
  const [sessions, formateurs, reclamations, inscriptions, satisfaction, suiviFroid] =
    await Promise.all([
      getSessions(),
      getFormateurs(),
      getReclamations(),
      getInscriptions(),
      getSatisfaction(),
      getSuiviFroid(),
    ]);

  const now = new Date();
  const alertes: Alert[] = [];

  // DANGER — Session planifiée avec date_debut dans moins de 3 jours et workflow_0_ok=false
  const sessionsPlanifiees = sessions.filter(
    (s) => normalizeStatus(s.statut ?? "") === "planifiee"
  );
  for (const s of sessionsPlanifiees) {
    if (!isTrue(s.workflow_0_ok) && s.date_debut) {
      const daysUntil = -daysBetween(s.date_debut, now);
      if (daysUntil >= 0 && daysUntil <= 3) {
        alertes.push({
          level: "danger",
          message: `Session ${s.session_id} commence dans ${daysUntil === 0 ? "aujourd'hui" : `${daysUntil}j`} — setup non effectué (WF0)`,
          source: "Sessions",
          timestamp: s.date_debut,
        });
      }
    }
  }

  // DANGER — Sessions en cours avec workflows incomplets
  const sessionsEnCours = sessions.filter(
    (s) => normalizeStatus(s.statut ?? "") === "en_cours"
  );
  for (const s of sessionsEnCours) {
    if (!isTrue(s.workflow_2_ok)) {
      alertes.push({
        level: "danger",
        message: `Session ${s.session_id} en cours : émargement non lancé (WF2)`,
        source: "Workflows",
        timestamp: s.date_debut || "—",
      });
    }
  }

  // DANGER — Sessions terminées avec WF3 incomplet
  const sessionsTerminees = sessions.filter(
    (s) => normalizeStatus(s.statut ?? "") === "terminee"
  );
  for (const s of sessionsTerminees) {
    if (!isTrue(s.workflow_3_ok)) {
      alertes.push({
        level: "danger",
        message: `Session ${s.session_id} terminée : satisfaction/évaluation non envoyée (WF3)`,
        source: "Workflows",
        timestamp: s.date_fin || s.date_debut || "—",
      });
    }
  }

  // DANGER — Formateurs sans dossier complet
  const formateursIncomplets = formateurs.filter(
    (f) => !isTrue(f.dossier_complet)
  );
  for (const f of formateursIncomplets) {
    alertes.push({
      level: "danger",
      message: `Formateur ${f.prenom ?? ""} ${f.nom ?? ""} (${f.formateur_id}) : dossier incomplet`,
      source: "Formateurs",
      timestamp: f.date_creation || "—",
    });
  }

  // WARNING — Réclamations non traitées
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

  // WARNING — Relances: inscriptions sans retour satisfaction
  const inscrSansSat = inscriptions.filter(
    (i) =>
      !isTrue(i.satisfaction_repondue) &&
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

  // INFO — Suivi froid éligible (sessions terminées depuis plus de 150 jours)
  const suiviFroidEnvoyes = new Set(
    suiviFroid.map((sf) => sf.session_id).filter(Boolean)
  );
  const eligibleSuiviFroid = sessionsTerminees.filter((s) => {
    if (suiviFroidEnvoyes.has(s.session_id)) return false;
    const d = s.date_fin || s.date_debut || "";
    const days = daysBetween(d, now);
    return days >= 150;
  });
  if (eligibleSuiviFroid.length > 0) {
    alertes.push({
      level: "info",
      message: `${eligibleSuiviFroid.length} session(s) éligible(s) au suivi à froid (>150 jours post-formation)`,
      source: "Suivi froid",
      timestamp: "—",
    });
  }

  // INFO — Satisfaction moyenne
  const satNotes = satisfaction
    .map((s) => parseFloat(s.note_globale))
    .filter((n) => !isNaN(n));
  if (satNotes.length > 0) {
    const moy = (satNotes.reduce((a, b) => a + b, 0) / satNotes.length).toFixed(1);
    alertes.push({
      level: "info",
      message: `Satisfaction moyenne : ${moy}/10 sur ${satNotes.length} réponses`,
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
    <div className="space-y-6">
      {/* Mini KPI cards with stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPICard label="Critiques" value={nbDanger} icon={AlertOctagon} accent="#ef4444" delay={0} />
        <KPICard label="Avertissements" value={nbWarning} icon={AlertTriangle} accent="#f59e0b" delay={80} />
        <KPICard label="Informations" value={nbInfo} icon={Info} accent="#3b82f6" delay={160} />
      </div>

      {/* Positive state when no critical alerts */}
      {nbDanger === 0 && (
        <div className="glass-card p-5 flex items-center gap-4" style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(6,78,59,0.15)" }}>
          <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm text-emerald-300 font-medium">Aucune alerte critique — tout est en ordre</p>
            <p className="text-xs text-emerald-400/60 mt-0.5">Tous les workflows critiques fonctionnent correctement</p>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="glass-card p-6">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
            <p className="text-sm text-[var(--text-secondary)]">Aucune alerte active</p>
            <p className="text-xs text-[var(--text-dim)] mt-1">Tout est en ordre — aucun problème détecté</p>
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
                    <p className="text-sm text-[var(--text-primary)] leading-relaxed">{a.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-[var(--text-dim)]">{a.source}</span>
                      {a.timestamp !== "—" && (
                        <span className="text-[11px] text-[var(--text-dim)] font-mono">{a.timestamp}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
