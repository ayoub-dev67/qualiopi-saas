import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getSession,
  getInscriptions,
  getPositionnements,
  getEmargements,
  getSatisfaction,
  getJournal,
  getDocuments,
} from "@/lib/db";
import StatusBadge from "@/components/StatusBadge";
import {
  ArrowLeft,
  FileText,
  Users,
  BookOpen,
  UserCheck,
  MapPin,
  Check,
  Clock,
  ExternalLink,
  Star,
  MessageSquare,
} from "lucide-react";

function fmtDateFull(d: string): string {
  if (!d || d.length < 10) return d || "—";
  const parts = d.substring(0, 10).split("-");
  if (parts.length !== 3) return d;
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  const day = parseInt(parts[2], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parts[0];
  if (isNaN(day) || isNaN(month) || month < 0 || month > 11) return d;
  return `${day} ${MOIS[month]} ${year}`;
}

function fmtDateShort(d: string): string {
  if (!d || d.length < 10) return d || "—";
  const parts = d.substring(0, 10).split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

const MOIS_COURT = ["janv.", "fév.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

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

// Pipeline step status
type StepStatus = "done" | "active" | "pending";

interface PipelineStep {
  label: string;
  status: StepStatus;
}

function computePipeline(session: {
  statut: string;
  workflow_0_ok: boolean;
  workflow_1_ok: boolean;
  workflow_2_ok: boolean;
  workflow_3_ok: boolean;
}): PipelineStep[] {
  const w0 = session.workflow_0_ok;
  const w1 = session.workflow_1_ok;
  const w2 = session.workflow_2_ok;
  const w3 = session.workflow_3_ok;
  const enCours = session.statut === "en_cours";
  const terminee = session.statut === "terminee";

  return [
    { label: "Créée", status: "done" },
    { label: "Setup (W0)", status: w0 ? "done" : "active" },
    { label: "Positionnement (W1)", status: w1 ? "done" : w0 ? "active" : "pending" },
    { label: "En cours", status: enCours || terminee ? "done" : "pending" },
    { label: "Émargement (W2)", status: w2 ? "done" : enCours ? "active" : "pending" },
    { label: "Évaluation (W3)", status: w3 ? "done" : terminee ? "active" : "pending" },
    { label: "Terminée", status: terminee ? "done" : "pending" },
  ];
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

// Modalité badge
function ModaliteBadge({ modalite }: { modalite: string }) {
  const m = norm(modalite);
  const styles: Record<string, { bg: string; text: string }> = {
    presentiel: { bg: "rgba(16,185,129,0.15)", text: "#6ee7b7" },
    distanciel: { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
    mixte: { bg: "rgba(139,92,246,0.15)", text: "#c4b5fd" },
  };
  const style = styles[m] ?? { bg: "rgba(71,85,105,0.15)", text: "#94a3b8" };
  return (
    <span
      className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {modalite || "—"}
    </span>
  );
}

// Document status
function DocStatus({ status }: { status: "done" | "in_progress" | "pending"; label: string }) {
  const styles = {
    done: { bg: "rgba(16,185,129,0.15)", text: "#6ee7b7", border: "#065f46" },
    in_progress: { bg: "rgba(245,158,11,0.15)", text: "#fcd34d", border: "#78350f" },
    pending: { bg: "rgba(71,85,105,0.1)", text: "#64748b", border: "#1e293b" },
  };
  const s = styles[status];
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[11px] font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {status === "done" ? "Généré ✓" : status === "in_progress" ? "En cours" : "En attente"}
    </span>
  );
}

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getSession(id);
  if (!session) notFound();

  const formation = session.formations;
  const formateur = session.formateurs;

  const [inscriptions, positionnements, emargement, satisfaction, journal, documents] =
    await Promise.all([
      getInscriptions(session.id),
      getPositionnements(),
      getEmargements(session.id),
      getSatisfaction(session.id),
      getJournal(),
      getDocuments(session.id),
    ]);

  // Positionnement lookup by inscription_id
  const positionnementSet = new Set(positionnements.map((p) => p.inscription_id));

  // Emargement by inscription
  const emargementByInscription = new Map<string, typeof emargement>();
  for (const e of emargement) {
    const list = emargementByInscription.get(e.inscription_id) ?? [];
    list.push(e);
    emargementByInscription.set(e.inscription_id, list);
  }

  // Satisfaction by inscription
  const satisfactionMap = new Map(satisfaction.map((s) => [s.inscription_id, s]));

  // Pipeline
  const pipeline = computePipeline(session);

  // Journal entries for this session
  const sessionJournal = journal.filter((j) => j.session_id === session.id).reverse();

  // Satisfaction data
  const satNotes = satisfaction
    .map((s) => s.note_globale)
    .filter((n): n is number => n !== null && n !== undefined);
  const satMoyenne = satNotes.length > 0 ? satNotes.reduce((a, b) => a + b, 0) / satNotes.length : null;

  // Category scores
  const catScores: { label: string; key: string }[] = [
    { label: "Contenu", key: "note_contenu" },
    { label: "Formateur", key: "note_formateur" },
    { label: "Organisation", key: "note_organisation" },
  ];
  const catAverages = catScores.map(({ label, key }) => {
    const notes = satisfaction
      .map((s) => (s as unknown as Record<string, unknown>)[key] as number | null)
      .filter((n): n is number => n !== null && n !== undefined);
    return {
      label,
      average: notes.length > 0 ? notes.reduce((a, b) => a + b, 0) / notes.length : null,
    };
  });

  // Verbatims
  const verbatims = satisfaction
    .map((s) => s.commentaire || s.points_forts || "")
    .filter((v) => typeof v === "string" && v.trim() !== "") as string[];

  // Counts
  const nbInscrits = session.nb_inscrits ?? inscriptions.length;
  const nbPlaces = session.nombre_places ?? 1;
  const pctFill = Math.min(100, Math.round((nbInscrits / nbPlaces) * 100));

  // Workflow badge colors
  const WF_COLORS: Record<string, { bg: string; text: string }> = {
    W0: { bg: "rgba(16,185,129,0.15)", text: "#6ee7b7" },
    W1: { bg: "rgba(59,130,246,0.15)", text: "#93c5fd" },
    W2: { bg: "rgba(99,102,241,0.15)", text: "#a5b4fc" },
    W3: { bg: "rgba(245,158,11,0.15)", text: "#fcd34d" },
    W4: { bg: "rgba(236,72,153,0.15)", text: "#f9a8d4" },
    W5: { bg: "rgba(139,92,246,0.15)", text: "#c4b5fd" },
    W6: { bg: "rgba(20,184,166,0.15)", text: "#5eead4" },
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors w-fit"
        >
          <ArrowLeft size={16} /> Sessions
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--text-primary)] leading-tight">
              {formation.intitule}
            </h1>
            <p className="text-sm text-[var(--text-dim)] mt-1.5 font-mono">
              {session.ref}
              <span className="mx-2 text-[var(--border-subtle)]">·</span>
              {`${formateur.prenom} ${formateur.nom}`.trim()}
              <span className="mx-2 text-[var(--border-subtle)]">·</span>
              {session.lieu || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <StatusBadge status={session.statut} />
            <ModaliteBadge modalite={session.modalite ?? ""} />
          </div>
        </div>
      </div>

      {/* Pipeline */}
      <div className="glass-card p-6 stagger-1">
        <h3 className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider mb-6">
          Progression de la session
        </h3>
        <div className="relative flex items-start justify-between">
          {/* Connecting line */}
          <div className="absolute top-5 left-5 right-5 h-0.5 bg-[var(--border-subtle)]" />
          {pipeline.map((step, i) => {
            // Green line up to last "done" step
            const prevDone = i > 0 && pipeline[i - 1].status === "done" && step.status === "done";
            return (
              <div key={step.label} className="relative flex flex-col items-center z-10" style={{ flex: 1 }}>
                {/* Green connecting segment */}
                {prevDone && (
                  <div
                    className="absolute top-5 h-0.5 bg-emerald-500"
                    style={{ right: "50%", left: "-50%", transform: "translateX(0)" }}
                  />
                )}
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step.status === "done"
                      ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                      : step.status === "active"
                      ? "bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]"
                      : "bg-slate-700 text-slate-400"
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {step.status === "done" ? (
                    <Check size={18} strokeWidth={3} />
                  ) : step.status === "active" ? (
                    <Clock size={16} />
                  ) : (
                    <span className="text-xs">{i + 1}</span>
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-[11px] mt-2 text-center leading-tight max-w-[80px] ${
                    step.status === "done"
                      ? "text-emerald-400 font-medium"
                      : step.status === "active"
                      ? "text-amber-400 font-medium"
                      : "text-[var(--text-dim)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Grid: 3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Formation Card */}
        <div className="glass-card p-6 stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Formation</h3>
          </div>
          <div className="space-y-3 text-sm">
            <InfoRow label="Intitulé" value={formation.intitule ?? "—"} />
            <InfoRow label="Durée" value={formation.duree_heures ? `${formation.duree_heures}h` : "—"} />
            <InfoRow label="Objectifs" value={formation.objectifs ?? "—"} />
            <InfoRow label="Prérequis" value={formation.prerequis ?? "—"} />
            <InfoRow label="Modalité" value={formation.modalite ?? session.modalite ?? "—"} />
            <InfoRow label="Tarif" value={formation.tarif ? `${formation.tarif} €` : "—"} />
          </div>
        </div>

        {/* Formateur Card */}
        <div className="glass-card p-6 stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Formateur</h3>
          </div>
          <div className="space-y-3 text-sm">
            <InfoRow label="Nom" value={`${formateur.prenom} ${formateur.nom}`.trim()} />
            <InfoRow label="Email" value={formateur.email ?? "—"} />
            <InfoRow label="Spécialité" value={formateur.specialite ?? "—"} />
            <InfoRow label="Qualifications" value={formateur.qualifications ?? "—"} />
            <div className="pt-1">
              {formateur.dossier_complet ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md font-medium">
                  <Check size={12} /> Dossier complet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md font-medium">
                  <Clock size={12} /> Dossier incomplet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Logistique Card */}
        <div className="glass-card p-6 stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Logistique</h3>
          </div>
          <div className="space-y-3 text-sm">
            <InfoRow label="Début" value={fmtDateFull(session.date_debut ?? "")} />
            <InfoRow label="Fin" value={fmtDateFull(session.date_fin ?? "")} />
            <InfoRow label="Lieu" value={session.lieu || "—"} />
            <InfoRow label="Modalité" value={session.modalite || "—"} />
            <div>
              <p className="text-[var(--text-dim)] text-xs mb-1.5">Remplissage</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pctFill}%`,
                      background: pctFill >= 80 ? "linear-gradient(90deg, #059669, #10b981)" : pctFill >= 50 ? "linear-gradient(90deg, #d97706, #f59e0b)" : "linear-gradient(90deg, #4f46e5, #6366f1)",
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-[var(--text-secondary)]">{nbInscrits}/{nbPlaces}</span>
                <span className="text-xs text-[var(--text-dim)]">({pctFill}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apprenants */}
      <div className="glass-card p-6 stagger-5">
        <div className="flex items-center gap-2 mb-5">
          <Users size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">
            Apprenants inscrits
            <span className="ml-2 text-xs text-[var(--text-dim)] font-normal">({inscriptions.length})</span>
          </h3>
        </div>
        {inscriptions.length === 0 ? (
          <div className="flex flex-col items-center py-8">
            <Users size={40} className="text-[var(--text-dim)] mb-3 opacity-30" />
            <p className="text-sm text-[var(--text-secondary)]">Aucun apprenant inscrit à cette session</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]" style={{ background: "rgba(255,255,255,0.02)" }}>
                  {["Nom", "Prénom", "Email", "Entreprise", "Statut", "Positionnement", "Émargement", "Satisfaction"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inscriptions.map((ins) => {
                  const apprenant = ins.apprenants;
                  const hasPositionnement = positionnementSet.has(ins.id);
                  const emarges = emargementByInscription.get(ins.id) ?? [];
                  const sat = satisfactionMap.get(ins.id);
                  const satNote = sat?.note_globale ?? null;

                  return (
                    <tr key={ins.id} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-card-hover)] transition-colors">
                      <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{apprenant?.nom ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">{apprenant?.prenom ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--text-dim)] text-xs">{apprenant?.email ?? "—"}</td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">{apprenant?.entreprise ?? "—"}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ins.statut ?? "inscrit"} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasPositionnement ? (
                          <span className="text-emerald-400">✓</span>
                        ) : (
                          <span className="text-[var(--text-dim)]">✗</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-mono text-[var(--text-secondary)]">
                        {emarges.length > 0 ? `${emarges.length}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {satNote !== null ? (
                          <span className="text-amber-400 font-medium text-xs">{satNote.toFixed(1)}/10</span>
                        ) : (
                          <span className="text-[var(--text-dim)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="glass-card p-6 stagger-6">
        <div className="flex items-center gap-2 mb-5">
          <FileText size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Documents</h3>
        </div>
        <div className="space-y-2">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-3.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              style={{
                borderLeft: "3px solid #10b981",
              }}
            >
              <FileText size={18} className="text-emerald-400" />
              <div className="flex-1 min-w-0">
                <span className="text-sm text-[var(--text-primary)] truncate block">{doc.nom_fichier}</span>
                <span className="text-[11px] text-[var(--text-dim)]">{doc.type}</span>
              </div>
              <span className="text-[11px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-md font-medium">Généré</span>
              <a
                href={doc.public_url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--text-dim)] hover:text-[var(--accent)] transition-colors flex items-center gap-1"
              >
                <ExternalLink size={12} /> Voir
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Timeline + Evaluations side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Timeline */}
        <div className="glass-card p-6 stagger-7">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Activité</h3>
          </div>
          {sessionJournal.length === 0 ? (
            <div className="flex flex-col items-center py-8">
              <Clock size={40} className="text-[var(--text-dim)] mb-3 opacity-30" />
              <p className="text-sm text-[var(--text-secondary)]">Aucune activité enregistrée pour cette session</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--border-subtle)]" />
              {sessionJournal.map((j, i) => {
                const isError = (j.statut ?? "").toLowerCase().includes("erreur") || (j.statut ?? "").toLowerCase().includes("error");
                const rawWf = (j.workflow ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
                const wfNum = rawWf.replace(/^WF?/, "");
                const wfKey = `W${wfNum}`;
                const wfColor = WF_COLORS[wfKey] ?? { bg: "rgba(71,85,105,0.15)", text: "#94a3b8" };

                return (
                  <div key={i} className="relative flex items-start gap-3 py-3 pl-0">
                    {/* Dot */}
                    <div
                      className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 z-10 ${
                        isError ? "bg-red-500/20" : "bg-[var(--bg-card)]"
                      }`}
                      style={{ border: `2px solid ${isError ? "#ef4444" : wfColor.text}` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isError ? "#ef4444" : wfColor.text }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: wfColor.bg, color: wfColor.text }}
                        >
                          {wfKey || "SYS"}
                        </span>
                        <span className="text-xs text-[var(--text-dim)]">
                          {fmtJournalDate(j.created_at ?? "")}
                        </span>
                        {isError && (
                          <span className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded font-medium">ERREUR</span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-primary)]">{j.message || "—"}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Evaluations */}
        <div className="glass-card p-6 stagger-8">
          <div className="flex items-center gap-2 mb-5">
            <Star size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Évaluations</h3>
          </div>
          {satMoyenne === null ? (
            <div className="flex flex-col items-center py-8">
              <Star size={40} className="text-[var(--text-dim)] mb-3 opacity-30" />
              <p className="text-sm text-[var(--text-secondary)]">Les évaluations apparaîtront après envoi des questionnaires</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Global score */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="#f59e0b"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(satMoyenne / 10) * 264} 264`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-[var(--text-primary)]">{satMoyenne.toFixed(1)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--text-primary)]">Note globale</p>
                  <p className="text-xs text-[var(--text-dim)]">{satNotes.length} réponse{satNotes.length > 1 ? "s" : ""}</p>
                </div>
              </div>

              {/* Category bars */}
              <div className="space-y-3">
                {catAverages.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-[var(--text-secondary)]">{cat.label}</span>
                      <span className="text-xs font-mono text-[var(--text-dim)]">
                        {cat.average !== null ? `${cat.average.toFixed(1)}/10` : "—"}
                      </span>
                    </div>
                    <div className="h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: cat.average !== null ? `${(cat.average / 10) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Verbatims */}
              {verbatims.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare size={14} className="text-[var(--text-dim)]" />
                    <span className="text-xs font-semibold text-[var(--text-dim)] uppercase tracking-wider">Verbatims</span>
                  </div>
                  <div className="space-y-2">
                    {verbatims.map((v, i) => (
                      <div key={i} className="p-3 rounded-lg bg-white/[0.02] border-l-2 border-amber-500/30">
                        <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{v}&rdquo;</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Simple label/value row for info cards */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[var(--text-dim)] text-xs mb-0.5">{label}</p>
      <p className="text-[var(--text-primary)] text-sm">{value}</p>
    </div>
  );
}
