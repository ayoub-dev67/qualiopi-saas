import { CalendarDays, Users, Star, Shield, Clock, Activity, ArrowRight, FileText, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Démo — Qualiopi SaaS | Essayez gratuitement",
  description: "Découvrez le dashboard Qualiopi SaaS avec des données de démonstration.",
};

const sessions = [
  { id: "SES-2026-001", formation: "Marketing Digital", statut: "terminee", dates: "10/03 → 11/03", lieu: "Strasbourg", fill: "8/10" },
  { id: "SES-2026-002", formation: "SEO Référencement", statut: "en_cours", dates: "22/03 → 24/03", lieu: "Strasbourg", fill: "5/8" },
  { id: "SES-2026-003", formation: "Gestion Projet Agile", statut: "planifiee", dates: "01/04 → 02/04", lieu: "Strasbourg", fill: "12/15" },
  { id: "SES-2026-004", formation: "Excel & Power BI", statut: "planifiee", dates: "10/04 → 12/04", lieu: "Distanciel", fill: "6/8" },
  { id: "SES-2026-005", formation: "Prise de Parole", statut: "planifiee", dates: "20/04", lieu: "Strasbourg", fill: "3/10" },
];

const journal = [
  { wf: "W0", color: "#6ee7b7", bg: "rgba(16,185,129,0.15)", msg: "Setup session terminé : 4 convocation(s)", date: "20 mars à 08:15", session: "SES-2026-003" },
  { wf: "W2", color: "#a5b4fc", bg: "rgba(99,102,241,0.15)", msg: "Émargement envoyé à 2 apprenant(s)", date: "22 mars à 09:00", session: "SES-2026-002" },
  { wf: "W1", color: "#93c5fd", bg: "rgba(59,130,246,0.15)", msg: "Positionnement envoyé à 2 apprenant(s)", date: "20 mars à 08:10", session: "SES-2026-002" },
  { wf: "W4", color: "#f9a8d4", bg: "rgba(236,72,153,0.15)", msg: "KPIs mis à jour, rapport envoyé", date: "20 mars à 08:30", session: "" },
  { wf: "W0", color: "#6ee7b7", bg: "rgba(16,185,129,0.15)", msg: "Erreur Drive : quota API dépassé", date: "20 mars à 08:16", session: "SES-2026-004", error: true },
];

const alertes = [
  { level: "danger", msg: "SES-2026-004 : Setup session non effectué (W0)", icon: AlertTriangle },
  { level: "danger", msg: "SES-2026-005 : Setup session non effectué (W0)", icon: AlertTriangle },
  { level: "warning", msg: "Julie Blanc : dossier formateur incomplet", icon: FileText },
  { level: "info", msg: "SES-2026-002 : évaluation en attente (W3)", icon: Clock },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    planifiee: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    en_cours: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    terminee: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  };
  const labels: Record<string, string> = { planifiee: "Planifiée", en_cours: "En cours", terminee: "Terminée" };
  return <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${styles[status] || styles.planifiee}`}>{labels[status] || status}</span>;
}

export default function DemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Banner */}
      <div className="mb-6 flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <span className="text-sm text-indigo-300 font-medium">Mode démo — Données fictives</span>
        <Link href="/signup" className="text-xs font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-1.5 rounded-lg">Créer mon compte</Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sessions actives", value: "5", color: "#6366f1", icon: CalendarDays },
          { label: "Bénéficiaires inscrits", value: "34", color: "#10b981", icon: Users },
          { label: "Satisfaction moyenne", value: "8.6/10", color: "#f59e0b", icon: Star },
          { label: "Score Qualiopi", value: "87%", color: "#3b82f6", icon: Shield },
        ].map((kpi) => (
          <div key={kpi.label} className="glass-card p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[var(--text-dim)]">{kpi.label}</span>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Satisfaction par mois</h3>
          <div className="flex items-end gap-2 h-40">
            {[7.2, 7.8, 8.0, 8.5, 7.9, 8.3, 8.6, 9.0, 8.4, 8.7, 8.6, 8.8].map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-sm bg-gradient-to-t from-indigo-500/60 to-indigo-500/20" style={{ height: `${(v / 10) * 100}%` }} />
                <span className="text-[9px] text-[var(--text-dim)]">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl flex flex-col items-center justify-center">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Score Qualiopi</h3>
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset="12.7" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-indigo-400">87%</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {[["C1 Information", 92], ["C2 Objectifs", 85], ["C3 Adaptation", 80], ["C4 Moyens", 100], ["C5 Compétences", 67], ["C6 Engagement", 90], ["C7 Amélioration", 95]].map(([label, score]) => (
              <div key={label as string} className="flex items-center gap-2">
                <div className="w-12 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${score}%`, background: (score as number) >= 80 ? "#10b981" : (score as number) >= 50 ? "#f59e0b" : "#ef4444" }} />
                </div>
                <span className="text-[var(--text-dim)] whitespace-nowrap">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">Sessions récentes</h3>
            <Clock size={16} className="text-[var(--text-dim)]" />
          </div>
          <div className="space-y-2.5">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                <div>
                  <p className="text-sm text-indigo-400 font-medium font-mono">{s.id}</p>
                  <p className="text-xs text-[var(--text-dim)] mt-0.5">{s.dates} · {s.lieu}</p>
                </div>
                <StatusBadge status={s.statut} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">Activité récente</h3>
            <Activity size={16} className="text-[var(--text-dim)]" />
          </div>
          <div className="space-y-2.5">
            {journal.map((j, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ background: j.bg, color: j.color }}>{j.wf}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text-primary)] truncate">{j.msg}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-[var(--text-dim)]">{j.date}</span>
                    {j.session && <span className="text-xs text-[var(--text-dim)] font-mono">{j.session}</span>}
                  </div>
                </div>
                {j.error && <span className="text-[10px] text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md font-medium shrink-0">ERREUR</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts */}
      <div className="glass-card p-6 rounded-2xl">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">Alertes</h3>
        <div className="space-y-2">
          {alertes.map((a, i) => {
            const colors = { danger: "border-red-500/20 bg-red-500/5 text-red-400", warning: "border-amber-500/20 bg-amber-500/5 text-amber-400", info: "border-blue-500/20 bg-blue-500/5 text-blue-400" };
            return (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${colors[a.level as keyof typeof colors]}`}>
                <a.icon size={16} className="shrink-0" />
                <span className="text-sm">{a.msg}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-8 text-center">
        <Link href="/signup" className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-transform">
          Créer mon compte gratuitement
        </Link>
        <p className="mt-2 text-xs text-[var(--text-dim)]">14 jours d&apos;essai gratuit · Sans carte bancaire</p>
      </div>
    </div>
  );
}
