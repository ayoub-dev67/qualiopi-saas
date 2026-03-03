import {
  getSessions,
  getInscriptions,
  getSatisfaction,
  getReclamations,
  getOrganisme,
  getFormations,
  getFormateurs,
} from "@/lib/sheets";
import { CalendarDays, Users, Star, Shield, AlertTriangle, Clock } from "lucide-react";
import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";
import SatisfactionChart from "@/components/charts/SatisfactionChart";
import QualiopiScore from "@/components/charts/QualiopiScore";

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

export default async function HomePage() {
  const [sessions, inscriptions, satisfaction, reclamations, organisme, formations, formateurs] =
    await Promise.all([
      getSessions(),
      getInscriptions(),
      getSatisfaction(),
      getReclamations(),
      getOrganisme(),
      getFormations(),
      getFormateurs(),
    ]);

  // KPIs
  const sessionsActives = sessions.filter(
    (s) => ["en_cours", "planifiee"].includes(normalizeStatus(s.statut ?? ""))
  ).length;

  const inscrits = inscriptions.length;

  const satNotes = satisfaction
    .map((s) => parseFloat(s.note_globale))
    .filter((n) => !isNaN(n));
  const satMoyenne =
    satNotes.length > 0
      ? (satNotes.reduce((a, b) => a + b, 0) / satNotes.length).toFixed(1)
      : "N/A";

  // Score Qualiopi — même calcul que la page Conformité (moyenne des 7 critères)
  const orgFields = organisme[0] ?? {};
  const orgFilled = Object.values(orgFields).filter((v) => v && v.trim() !== "").length;
  const orgTotal = Math.max(1, Object.keys(orgFields).length);

  const formCompletes = formations.filter(
    (f) => f.intitule && f.objectifs && f.prerequis && f.duree_heures
  ).length;

  const positionFait = inscriptions.filter(
    (i) => i.positionnement_fait === "TRUE" || i.positionnement_fait === "true"
  ).length;

  const formateursDossier = formateurs.filter(
    (f) => f.dossier_complet === "TRUE" || f.dossier_complet === "true"
  ).length;

  const formateursQualif = formateurs.filter(
    (f) => f.qualifications && f.qualifications.trim() !== ""
  ).length;

  const recTraitees = reclamations.filter(
    (r) => ["traitee", "resolue", "cloturee"].includes(normalizeStatus(r.statut ?? ""))
  ).length;

  // Satisfaction chart data — aggregate by month
  const satByMonth = new Map<string, { sum: number; count: number }>();
  for (const s of satisfaction) {
    const note = parseFloat(s.note_globale);
    if (isNaN(note)) continue;
    const date = s.date_reponse || s.date_envoi || "";
    const month = date.length >= 7 ? date.substring(0, 7) : "Inconnu";
    const entry = satByMonth.get(month) ?? { sum: 0, count: 0 };
    entry.sum += note;
    entry.count += 1;
    satByMonth.set(month, entry);
  }
  const satChartData = Array.from(satByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({
      month,
      note: Math.round((sum / count) * 10) / 10,
    }));

  const satMoy = satNotes.length > 0
    ? satNotes.reduce((a, b) => a + b, 0) / satNotes.length
    : 0;

  // Critères Qualiopi — identique à conformite/page.tsx
  const criteres = [
    { num: 1, label: "Information", score: Math.round((orgFilled / orgTotal) * 100) },
    { num: 2, label: "Objectifs", score: formations.length > 0 ? Math.round((formCompletes / formations.length) * 100) : 0 },
    { num: 3, label: "Adaptation", score: inscriptions.length > 0 ? Math.round((positionFait / inscriptions.length) * 100) : 0 },
    { num: 4, label: "Moyens", score: formateurs.length > 0 ? Math.round((formateursDossier / formateurs.length) * 100) : 0 },
    { num: 5, label: "Compétences", score: formateurs.length > 0 ? Math.round((formateursQualif / formateurs.length) * 100) : 0 },
    { num: 6, label: "Engagement", score: reclamations.length > 0 ? Math.round((recTraitees / reclamations.length) * 100) : 100 },
    { num: 7, label: "Amélioration", score: satNotes.length > 0 ? Math.min(100, Math.round(satMoy * 20)) : 0 },
  ];

  const scoreQualiopi = Math.round(
    criteres.reduce((sum, c) => sum + c.score, 0) / criteres.length
  );

  // Recent sessions (last 4)
  const recentSessions = sessions.slice(-4).reverse();

  // Alertes dynamiques
  type Alert = { type: "danger" | "warning" | "info"; message: string };
  const alertes: Alert[] = [];

  const sessionsEnCours = sessions.filter(
    (s) => normalizeStatus(s.statut ?? "") === "en_cours"
  );
  for (const s of sessionsEnCours) {
    if (s.workflow_0_ok !== "TRUE" && s.workflow_0_ok !== "true") {
      alertes.push({
        type: "danger",
        message: `Session ${s.session_id} : convention non générée`,
      });
    }
  }

  const recNonTraitees = reclamations.filter(
    (r) => normalizeStatus(r.statut ?? "") !== "traitee" && normalizeStatus(r.statut ?? "") !== "resolue"
  );
  for (const r of recNonTraitees.slice(0, 3)) {
    alertes.push({
      type: "warning",
      message: `Réclamation ${r.reclamation_id} en attente : ${r.objet || "sans objet"}`,
    });
  }

  if (inscrits > 0) {
    alertes.push({
      type: "info",
      message: `${inscrits} apprenants inscrits — suivi en cours`,
    });
  }

  const alertColors = {
    danger: { border: "#ef4444", bg: "#450a0a", icon: "text-red-400" },
    warning: { border: "#f59e0b", bg: "#451a03", icon: "text-amber-400" },
    info: { border: "#3b82f6", bg: "#172554", icon: "text-blue-400" },
  };

  return (
    <div className="animate-fade-in space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          label="Sessions actives"
          value={sessionsActives}
          icon={CalendarDays}
          accent="#6366f1"
          trend={sessions.length > 0 ? { direction: "up", value: `${sessions.length} total` } : undefined}
        />
        <KPICard
          label="Apprenants inscrits"
          value={inscrits}
          icon={Users}
          accent="#10b981"
        />
        <KPICard
          label="Satisfaction moyenne"
          value={satMoyenne}
          suffix="/10"
          icon={Star}
          accent="#f59e0b"
          trend={satNotes.length > 0 ? { direction: parseFloat(satMoyenne) >= 7 ? "up" : "down", value: `${satNotes.length} réponses` } : undefined}
        />
        <KPICard
          label="Score Qualiopi"
          value={scoreQualiopi}
          suffix="%"
          icon={Shield}
          accent="#3b82f6"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SatisfactionChart data={satChartData} />
        </div>
        <QualiopiScore score={scoreQualiopi} criteres={criteres} />
      </div>

      {/* Recent Sessions + Alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Sessions */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-[#94a3b8]">Sessions récentes</h3>
            <Clock size={16} className="text-[#64748b]" />
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-[#64748b]">Aucune session</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => (
                <div
                  key={s.session_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <div>
                    <p className="text-sm text-[#f1f5f9] font-medium font-mono">
                      {s.session_id}
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      {s.date_debut}{s.date_fin ? ` → ${s.date_fin}` : ""} · {s.lieu || "—"}
                    </p>
                  </div>
                  <StatusBadge status={s.statut ?? "planifiee"} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertes */}
        <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-[#94a3b8]">Alertes récentes</h3>
            <AlertTriangle size={16} className="text-[#64748b]" />
          </div>
          {alertes.length === 0 ? (
            <p className="text-sm text-[#64748b]">Aucune alerte</p>
          ) : (
            <div className="space-y-2.5">
              {alertes.slice(0, 5).map((a, i) => {
                const c = alertColors[a.type];
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl transition-colors"
                    style={{
                      borderLeft: `3px solid ${c.border}`,
                      backgroundColor: `${c.bg}40`,
                    }}
                  >
                    <AlertTriangle size={14} className={`${c.icon} mt-0.5 shrink-0`} />
                    <p className="text-xs text-[#c8d1dc] leading-relaxed">{a.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
