import {
  getSessions,
  getInscriptions,
  getSatisfaction,
  getReclamations,
  getOrganization,
  getFormations,
  getFormateurs,
  getJournal,
  getQualiopiScore,
} from "@/lib/db";
import { CalendarDays, Users, Star, Shield, Clock, Activity, ArrowRight, Check, Sparkles } from "lucide-react";
import Link from "next/link";
import KPICard from "@/components/KPICard";
import StatusBadge from "@/components/StatusBadge";
import SatisfactionChart from "@/components/charts/SatisfactionChart";
import QualiopiScore from "@/components/charts/QualiopiScore";

const MOIS_COURT = ["janv.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** Format ISO string (e.g. "2026-02-27T20:06:00Z") → "27 fév. à 20:06" */
function fmtJournalDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const day = d.getDate();
  const month = d.getMonth();
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${MOIS_COURT[month]} à ${hours}:${minutes}`;
}

export default async function HomePage() {
  const [sessions, inscriptions, satisfaction, reclamations, org, formations, formateurs, journal, qualiopiData] =
    await Promise.all([
      getSessions(),
      getInscriptions(),
      getSatisfaction(),
      getReclamations(),
      getOrganization(),
      getFormations(),
      getFormateurs(),
      getJournal(),
      getQualiopiScore(),
    ]);

  // KPIs
  const sessionsActives = sessions.filter(
    (s) => s.statut === "en_cours" || s.statut === "planifiee"
  ).length;

  const inscrits = inscriptions.length;

  const satNotes = satisfaction
    .map((s) => s.note_globale)
    .filter((n): n is number => n != null && !isNaN(n));
  const satMoyenne =
    satNotes.length > 0
      ? (satNotes.reduce((a, b) => a + b, 0) / satNotes.length).toFixed(1)
      : "N/A";

  // Score Qualiopi — use pre-computed data from getQualiopiScore
  const { score: scoreQualiopi, criteres } = qualiopiData;

  // Satisfaction chart — aggregate by month
  const satByMonth = new Map<string, { sum: number; count: number }>();
  for (const s of satisfaction) {
    if (s.note_globale == null) continue;
    const date = s.completed_at ?? "";
    const month = date.length >= 7 ? date.substring(0, 7) : "Inconnu";
    const entry = satByMonth.get(month) ?? { sum: 0, count: 0 };
    entry.sum += s.note_globale;
    entry.count += 1;
    satByMonth.set(month, entry);
  }
  const satChartData = Array.from(satByMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, { sum, count }]) => ({
      month,
      note: Math.round((sum / count) * 10) / 10,
    }));

  // Recent sessions (last 5)
  const recentSessions = sessions.slice(-5).reverse();

  // Recent journal activity (last 8)
  const recentJournal = journal.slice(-8).reverse();

  // Welcome banner — show if no sessions and no inscriptions (fresh account)
  const showWelcomeBanner = sessions.length === 0 && inscrits === 0;
  const hasFormation = formations.length > 0;
  const hasSession = sessions.length > 0;

  // Keep org and formateurs referenced (used by welcome banner logic and qualiopi score already)
  void org;
  void formateurs;

  return (
    <div className="space-y-6">
      {/* Welcome banner — shown on fresh accounts */}
      {showWelcomeBanner && (
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--accent-glow)] blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-[var(--accent)]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                Bienvenue !
              </span>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
              3 étapes pour démarrer
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              Configurez votre espace pour bénéficier du suivi Qualiopi automatisé.
            </p>

            <ol className="space-y-3">
              {/* Étape 1 — compte créé */}
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={14} className="text-emerald-500" />
                </span>
                <div>
                  <p className="text-sm text-[var(--text-primary)] font-medium">Compte créé</p>
                  <p className="text-xs text-[var(--text-dim)]">Votre organisme est prêt.</p>
                </div>
              </li>

              {/* Étape 2 — formation */}
              <li className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    hasFormation ? "bg-emerald-500/20" : "border border-[var(--border-strong)]"
                  }`}
                >
                  {hasFormation ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--text-dim)]">2</span>
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)] font-medium">
                    Créer votre première formation
                  </p>
                  <p className="text-xs text-[var(--text-dim)]">
                    Renseignez l&apos;intitulé, la durée, les objectifs et les prérequis.
                  </p>
                </div>
                {!hasFormation && (
                  <Link
                    href="/onboarding"
                    className="text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium whitespace-nowrap"
                  >
                    Commencer →
                  </Link>
                )}
              </li>

              {/* Étape 3 — session */}
              <li className="flex items-start gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    hasSession ? "bg-emerald-500/20" : "border border-[var(--border-strong)]"
                  }`}
                >
                  {hasSession ? (
                    <Check size={14} className="text-emerald-500" />
                  ) : (
                    <span className="text-[10px] font-bold text-[var(--text-dim)]">3</span>
                  )}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)] font-medium">
                    Planifier votre première session
                  </p>
                  <p className="text-xs text-[var(--text-dim)]">
                    Utilisez le bouton « Nouvelle session » en haut à droite.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      )}

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
          label="Bénéficiaires inscrits"
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
                  <Link
                    key={s.ref}
                    href={`/sessions/${s.id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <div>
                      <p className="text-sm text-indigo-400 font-medium font-mono hover:underline">
                        {s.ref}
                      </p>
                      <p className="text-xs text-[var(--text-dim)] mt-0.5">
                        {fmtDate(d1)}{d2 ? ` → ${fmtDate(d2)}` : ""} · {s.formations?.intitule || "—"}
                      </p>
                    </div>
                    <StatusBadge status={s.statut ?? "planifiee"} />
                  </Link>
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

        {/* Activité récente (Journal) */}
        <div className="glass-card p-6 stagger-4">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">Activité récente</h3>
            <Activity size={16} className="text-[var(--text-dim)]" />
          </div>
          {recentJournal.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              {/* Empty state SVG illustration */}
              <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="mb-4 opacity-30">
                <rect x="5" y="10" width="70" height="40" rx="6" stroke="currentColor" strokeWidth="1.5" fill="none" className="text-[var(--text-dim)]" />
                <line x1="15" y1="22" x2="45" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--border-strong)]" />
                <line x1="15" y1="30" x2="55" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--border-strong)]" />
                <line x1="15" y1="38" x2="35" y2="38" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-[var(--border-strong)]" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)]">L&apos;activité de vos workflows apparaîtra ici</p>
              <p className="text-xs text-[var(--text-dim)] mt-1">Créez votre première session pour voir les événements</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJournal.map((j, i) => {
                const isError = j.statut === "ERROR";
                // Workflow badge color
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
                const WF_TOOLTIPS: Record<string, string> = {
                  W0: "W0 — Setup session : convention + convocations",
                  W1: "W1 — Envoi des questionnaires de positionnement",
                  W2: "W2 — Émargement des bénéficiaires",
                  W3: "W3 — Évaluation et satisfaction post-formation",
                  W4: "W4 — Amélioration continue + KPIs",
                  W5: "W5 — Relances des questionnaires non complétés",
                  W6: "W6 — Suivi à froid 6 mois",
                };
                const wfColor = WF_COLORS[wfKey] ?? { bg: "rgba(71,85,105,0.15)", text: "#94a3b8" };
                const wfTooltip = WF_TOOLTIPS[wfKey] ?? "Événement système";
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    {/* Workflow badge */}
                    <span
                      className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5 cursor-help"
                      style={{ background: wfColor.bg, color: wfColor.text }}
                      title={wfTooltip}
                    >
                      {wfKey || "SYS"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-[var(--text-primary)] truncate">
                        {j.message || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[var(--text-dim)]">
                          {fmtJournalDate(j.created_at)}
                        </span>
                        {j.session_ref && (
                          <span className="text-xs text-[var(--text-dim)] font-mono">{j.session_ref}</span>
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
