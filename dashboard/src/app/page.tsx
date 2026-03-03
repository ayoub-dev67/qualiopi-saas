import {
  getSessions,
  getInscriptions,
  getSatisfaction,
  getReclamations,
  getOrganisme,
  getFormations,
  getFormateurs,
  getJournal,
} from "@/lib/sheets";
import { CalendarDays, Users, Star, Shield, Clock, Activity, ArrowRight } from "lucide-react";
import Link from "next/link";
import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";
import SatisfactionChart from "@/components/charts/SatisfactionChart";
import QualiopiScore from "@/components/charts/QualiopiScore";

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

const MOIS_COURT = ["janv.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Format "2026-02-27" + "20:06:00" → "27 fév. à 20:06" */
function fmtJournalDate(date: string, heure?: string): string {
  if (!date || date === "—") return "—";
  const parts = date.substring(0, 10).split("-");
  if (parts.length !== 3) return date;
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10) - 1;
  if (isNaN(day) || isNaN(month) || month < 0 || month > 11) return date;
  const timeStr = heure ? ` à ${heure.substring(0, 5)}` : "";
  return `${day} ${MOIS_COURT[month]}${timeStr}`;
}

export default async function HomePage() {
  const [sessions, inscriptions, satisfaction, reclamations, organisme, formations, formateurs, journal] =
    await Promise.all([
      getSessions(),
      getInscriptions(),
      getSatisfaction(),
      getReclamations(),
      getOrganisme(),
      getFormations(),
      getFormateurs(),
      getJournal(),
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

  // Score Qualiopi — moyenne des 7 critères
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

  const satMoy =
    satNotes.length > 0
      ? satNotes.reduce((a, b) => a + b, 0) / satNotes.length
      : 0;

  // Satisfaction chart — aggregate by month
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

  // Critères Qualiopi — C7 uses /10 scale (100% at >=7/10)
  const criteres = [
    { num: 1, label: "Information", score: Math.round((orgFilled / orgTotal) * 100) },
    { num: 2, label: "Objectifs", score: formations.length > 0 ? Math.round((formCompletes / formations.length) * 100) : 0 },
    { num: 3, label: "Adaptation", score: inscriptions.length > 0 ? Math.round((positionFait / inscriptions.length) * 100) : 0 },
    { num: 4, label: "Moyens", score: formateurs.length > 0 ? Math.round((formateursDossier / formateurs.length) * 100) : 0 },
    { num: 5, label: "Compétences", score: formateurs.length > 0 ? Math.round((formateursQualif / formateurs.length) * 100) : 0 },
    { num: 6, label: "Engagement", score: reclamations.length > 0 ? Math.round((recTraitees / reclamations.length) * 100) : 100 },
    { num: 7, label: "Amélioration", score: satNotes.length > 0 ? Math.min(100, Math.round((satMoy / 7) * 100)) : 0 },
  ];

  const scoreQualiopi = Math.round(
    criteres.reduce((sum, c) => sum + c.score, 0) / criteres.length
  );

  // Recent sessions (last 5)
  const recentSessions = sessions.slice(-5).reverse();

  // Recent journal activity (last 8) — already filtered & hour-converted by getJournal()
  const recentJournal = journal.slice(-8).reverse();

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Cards with stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard
          label="Sessions actives"
          value={sessionsActives}
          icon={CalendarDays}
          accent="#6366f1"
          delay={0}
          trend={sessions.length > 0 ? { direction: "up", value: `${sessions.length} total` } : undefined}
        />
        <KPICard
          label="Apprenants inscrits"
          value={inscrits}
          icon={Users}
          accent="#10b981"
          delay={80}
        />
        <KPICard
          label="Satisfaction moyenne"
          value={satMoyenne}
          suffix="/10"
          icon={Star}
          accent="#f59e0b"
          delay={160}
          trend={satNotes.length > 0 ? { direction: parseFloat(satMoyenne) >= 7 ? "up" : "down", value: `${satNotes.length} réponses` } : undefined}
        />
        <KPICard
          label="Score Qualiopi"
          value={scoreQualiopi}
          suffix="%"
          icon={Shield}
          accent="#3b82f6"
          delay={240}
        />
      </div>

      {/* Row 2: Charts (7/5 ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 stagger-1">
          <SatisfactionChart data={satChartData} />
        </div>
        <div className="lg:col-span-5 stagger-2">
          <QualiopiScore score={scoreQualiopi} criteres={criteres} />
        </div>
      </div>

      {/* Row 3: Recent Sessions + Activity (1/1 ratio) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sessions récentes */}
        <div className="glass-card p-6 stagger-3">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">Sessions récentes</h3>
            <Clock size={16} className="text-[var(--text-dim)]" />
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-[var(--text-dim)]">Aucune session</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const d1 = s.date_debut ?? "";
                const d2 = s.date_fin ?? "";
                const fmtDate = (d: string) => {
                  if (d.length >= 10) {
                    const parts = d.substring(0, 10).split("-");
                    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
                  }
                  return d || "—";
                };
                return (
                  <div
                    key={s.session_id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-[var(--text-primary)] font-medium font-mono">
                        {s.session_id}
                      </p>
                      <p className="text-xs text-[var(--text-dim)] mt-0.5">
                        {fmtDate(d1)}{d2 ? ` → ${fmtDate(d2)}` : ""} · {s.lieu || "—"}
                      </p>
                    </div>
                    <StatusBadge status={s.statut ?? "planifiee"} />
                  </div>
                );
              })}
            </div>
          )}
          <Link
            href="/sessions"
            className="flex items-center gap-1.5 text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] mt-4 transition-colors"
          >
            Voir toutes les sessions <ArrowRight size={12} />
          </Link>
        </div>

        {/* Activité récente (Journal_Systeme) — cleaned data */}
        <div className="glass-card p-6 stagger-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">Activité récente</h3>
            <Activity size={16} className="text-[var(--text-dim)]" />
          </div>
          {recentJournal.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              {/* Empty state SVG illustration */}
              <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="mb-4 opacity-30">
                <rect x="5" y="10" width="70" height="40" rx="6" stroke="#475569" strokeWidth="1.5" fill="none" />
                <line x1="15" y1="22" x2="45" y2="22" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                <line x1="15" y1="30" x2="55" y2="30" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
                <line x1="15" y1="38" x2="35" y2="38" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)]">Aucune activité enregistrée</p>
              <p className="text-xs text-[var(--text-dim)] mt-1">Les événements apparaîtront ici automatiquement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJournal.map((j, i) => {
                const isError = (j.statut ?? "").toLowerCase().includes("erreur") || (j.statut ?? "").toLowerCase().includes("error");
                // Workflow badge color — journal uses "W0" or "WF0"
                const rawWf = (j.workflow ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
                const wfNum = rawWf.replace(/^WF?/, "");
                const wfKey = `W${wfNum}`;
                const WF_COLORS: Record<string, { bg: string; text: string }> = {
                  W0: { bg: "rgba(16,185,129,0.15)", text: "#6ee7b7" },
                  W1: { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
                  W2: { bg: "rgba(99,102,241,0.15)", text: "#a5b4fc" },
                  W3: { bg: "rgba(245,158,11,0.15)", text: "#fcd34d" },
                  W4: { bg: "rgba(236,72,153,0.15)", text: "#f9a8d4" },
                  W5: { bg: "rgba(139,92,246,0.15)", text: "#c4b5fd" },
                  W6: { bg: "rgba(20,184,166,0.15)", text: "#5eead4" },
                };
                const wfColor = WF_COLORS[wfKey] ?? { bg: "rgba(71,85,105,0.15)", text: "#94a3b8" };
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Workflow badge */}
                    <span
                      className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                      style={{ background: wfColor.bg, color: wfColor.text }}
                    >
                      {wfKey || "SYS"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        {j.message || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--text-dim)]">
                          {fmtJournalDate(j.date ?? j.timestamp ?? "", j.heure)}
                        </span>
                        {j.session_id && (
                          <span className="text-xs text-[var(--text-dim)] font-mono">{j.session_id}</span>
                        )}
                      </div>
                    </div>
                    {isError && (
                      <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md font-medium shrink-0">ERREUR</span>
                    )}
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
