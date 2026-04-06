import {
  getOrganization,
  getFormations,
  getFormateurs,
  getSatisfaction,
  getReclamations,
  getInscriptions,
  getQualiopiScore,
} from "@/lib/db";
import ProgressRing from "@/components/ProgressRing";
import { Lightbulb, CheckCircle2 } from "lucide-react";

interface Critere {
  num: number;
  titre: string;
  indicateurs: string[];
  score: number;
  details: string;
}

// Official RNQ distribution (32 indicateurs, 7 critères)
// C1: 1-3, C2: 4-7, C3: 8-16, C4: 17-19, C5: 20-22, C6: 23-29, C7: 30-32
const CRITERE_TIPS: Record<
  number,
  { good: string; ok: string[]; bad: string[] }
> = {
  1: {
    good: "Votre information publique est conforme — tenez-la à jour chaque trimestre.",
    ok: [
      "Complétez les informations manquantes de votre organisme (SIRET, NDA, adresse).",
      "Vérifiez la clarté de l'information fournie au public (CGV, tarifs, délais).",
    ],
    bad: [
      "Renseignez les informations légales obligatoires : raison sociale, SIRET, NDA.",
      "Publiez vos CGV et modalités d'accès sur votre site ou vos supports.",
      "Indiquez clairement vos délais d'accès, tarifs et modalités de contact.",
    ],
  },
  2: {
    good: "Vos objectifs de formation sont clairs et alignés avec les attentes.",
    ok: [
      "Complétez les objectifs pédagogiques opérationnels de chaque formation.",
      "Ajoutez les prérequis et le public visé pour chaque formation.",
    ],
    bad: [
      "Formulez des objectifs opérationnels précis pour chaque formation.",
      "Décrivez précisément le public visé et les prérequis.",
      "Indiquez la durée, le tarif et la modalité de chaque action.",
    ],
  },
  3: {
    good: "Vos dispositifs d'adaptation aux bénéficiaires sont bien en place.",
    ok: [
      "Envoyez un questionnaire de positionnement avant chaque formation.",
      "Formalisez le parcours individualisé de chaque bénéficiaire.",
    ],
    bad: [
      "Mettez en place un questionnaire de positionnement systématique.",
      "Identifiez un référent handicap et communiquez ses coordonnées.",
      "Documentez les adaptations pédagogiques proposées.",
    ],
  },
  4: {
    good: "Vos moyens pédagogiques sont alignés avec les objectifs.",
    ok: [
      "Complétez les dossiers pédagogiques (supports, méthodes, évaluations).",
      "Documentez les modalités d'évaluation en cours de formation.",
    ],
    bad: [
      "Formalisez pour chaque formation les moyens humains et techniques.",
      "Décrivez les supports pédagogiques et les modalités d'évaluation.",
      "Assurez la traçabilité (émargements, attestations).",
    ],
  },
  5: {
    good: "Vos intervenants disposent des qualifications requises.",
    ok: [
      "Ajoutez les CV, diplômes et qualifications de vos intervenants.",
      "Vérifiez que les qualifications sont à jour.",
    ],
    bad: [
      "Collectez et archivez les CV de chaque intervenant.",
      "Rassemblez les diplômes, certifications et références professionnelles.",
      "Formalisez la politique de maintien des compétences des intervenants.",
    ],
  },
  6: {
    good: "Votre engagement dans l'environnement socio-économique est solide.",
    ok: [
      "Traitez les réclamations ouvertes dans les meilleurs délais.",
      "Documentez votre veille sectorielle et réglementaire.",
    ],
    bad: [
      "Mettez en place une procédure de gestion des réclamations.",
      "Formalisez votre veille sur les évolutions du secteur et du métier.",
      "Recueillez les appréciations de vos partenaires et financeurs.",
    ],
  },
  7: {
    good: "Votre démarche d'amélioration continue est bien ancrée.",
    ok: [
      "Exploitez les retours satisfaction pour alimenter vos actions correctives.",
      "Réalisez un bilan annuel de votre démarche qualité.",
    ],
    bad: [
      "Lancez systématiquement une enquête de satisfaction post-formation.",
      "Formalisez vos actions correctives et leur suivi.",
      "Mettez en place un suivi à froid (6 mois post-formation).",
    ],
  },
};

export default async function ConformitePage() {
  const [organisme, formations, formateurs, satisfaction, reclamations, inscriptions, qualiopiScore] =
    await Promise.all([
      getOrganization(),
      getFormations(),
      getFormateurs(),
      getSatisfaction(),
      getReclamations(),
      getInscriptions(),
      getQualiopiScore(),
    ]);

  // Calcul par critère
  const orgFields = organisme ?? {};
  const orgFilled = Object.values(orgFields).filter((v) => v !== null && v !== undefined && String(v).trim() !== "").length;
  const orgTotal = Math.max(1, Object.keys(orgFields).length);

  const formCompletes = formations.filter(
    (f) => f.intitule && f.objectifs && f.prerequis && f.duree_heures
  ).length;

  const positionFait = inscriptions.filter(
    (i) => i.statut === "present"
  ).length;

  const formateursDossier = formateurs.filter(
    (f) => f.dossier_complet
  ).length;

  const formateursQualif = formateurs.filter(
    (f) => f.qualifications && f.qualifications.trim() !== ""
  ).length;

  const recTraitees = reclamations.filter(
    (r) => ["traitee", "fermee"].includes(r.statut ?? "")
  ).length;

  const { satMoyenne, satNotes } = qualiopiScore;
  const satMoy = satMoyenne;

  // C7 scoring: /10 scale — 100% at >=7/10, proportional below
  const c7Score = satNotes.length > 0 ? Math.min(100, Math.round((satMoy / 7) * 100)) : 0;

  function range(start: number, end: number): string[] {
    const arr: string[] = [];
    for (let i = start; i <= end; i++) arr.push(`Ind.${i}`);
    return arr;
  }

  const criteres: Critere[] = [
    {
      num: 1,
      titre: "Information du public",
      indicateurs: range(1, 3), // 3 indicateurs
      score: Math.round((orgFilled / orgTotal) * 100),
      details: `${orgFilled}/${orgTotal} champs renseignés`,
    },
    {
      num: 2,
      titre: "Objectifs des prestations",
      indicateurs: range(4, 7), // 4 indicateurs
      score:
        formations.length > 0
          ? Math.round((formCompletes / formations.length) * 100)
          : 0,
      details: `${formCompletes}/${formations.length} formations complètes`,
    },
    {
      num: 3,
      titre: "Adaptation aux bénéficiaires",
      indicateurs: range(8, 16), // 9 indicateurs
      score:
        inscriptions.length > 0
          ? Math.round((positionFait / inscriptions.length) * 100)
          : 0,
      details: `${positionFait}/${inscriptions.length} positionnements`,
    },
    {
      num: 4,
      titre: "Moyens pédagogiques",
      indicateurs: range(17, 19), // 3 indicateurs
      score:
        formateurs.length > 0
          ? Math.round((formateursDossier / formateurs.length) * 100)
          : 0,
      details: `${formateursDossier}/${formateurs.length} dossiers complets`,
    },
    {
      num: 5,
      titre: "Compétences des intervenants",
      indicateurs: range(20, 22), // 3 indicateurs
      score:
        formateurs.length > 0
          ? Math.round((formateursQualif / formateurs.length) * 100)
          : 0,
      details: `${formateursQualif}/${formateurs.length} qualifiés`,
    },
    {
      num: 6,
      titre: "Engagement dans l'environnement",
      indicateurs: range(23, 29), // 7 indicateurs
      score:
        reclamations.length > 0
          ? Math.round((recTraitees / reclamations.length) * 100)
          : 100,
      details:
        reclamations.length > 0
          ? `${recTraitees}/${reclamations.length} réclamations traitées`
          : "Aucune réclamation",
    },
    {
      num: 7,
      titre: "Amélioration continue",
      indicateurs: range(30, 32), // 3 indicateurs
      score: c7Score,
      details:
        satNotes.length > 0
          ? `Satisfaction ${satMoy.toFixed(1)}/10 (${satNotes.length} réponses)`
          : "Pas de données satisfaction",
    },
  ];

  const globalScore = Math.round(
    criteres.reduce((sum, c) => sum + c.score, 0) / criteres.length
  );

  function ringColor(score: number): string {
    if (score >= 80) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  }

  function badgeColor(score: number): { bg: string; text: string } {
    if (score >= 80) return { bg: "rgba(16, 185, 129, 0.12)", text: "#059669" };
    if (score >= 50) return { bg: "rgba(245, 158, 11, 0.12)", text: "#b45309" };
    return { bg: "rgba(239, 68, 68, 0.12)", text: "#b91c1c" };
  }

  function badgeLabel(score: number): string {
    if (score >= 80) return "CONFORME";
    if (score >= 50) return "PARTIEL";
    return "NON CONFORME";
  }

  return (
    <div className="space-y-6">
      {/* Score global */}
      <div className="glass-card p-8 flex flex-col items-center">
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-6">
          Score de conformité global
        </h3>
        <ProgressRing
          value={globalScore}
          size={160}
          strokeWidth={12}
          color={ringColor(globalScore)}
        />
        <p className="mt-4 text-xs text-[var(--text-dim)]">
          Basé sur {criteres.length} critères · {criteres.reduce((s, c) => s + c.indicateurs.length, 0)} indicateurs ·{" "}
          {criteres.filter((c) => c.score >= 80).length} conformes
        </p>
      </div>

      {/* 7 critères */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {criteres.map((c) => {
          const badge = badgeColor(c.score);
          const tips = CRITERE_TIPS[c.num];
          const tipContent =
            c.score >= 80 ? null : c.score >= 50 ? tips.ok : tips.bad;
          const tipColor =
            c.score >= 80
              ? "#10b981"
              : c.score >= 50
              ? "#f59e0b"
              : "#ef4444";

          return (
            <div
              key={c.num}
              className="glass-card p-6 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-[var(--accent)]">
                      C{c.num}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badgeLabel(c.score)}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-[var(--text-primary)] mt-1.5">
                    {c.titre}
                  </h4>
                  {/* Indicator badges */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.indicateurs.map((ind) => (
                      <span key={ind} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-dim)] font-mono">
                        {ind}
                      </span>
                    ))}
                  </div>
                </div>
                <ProgressRing
                  value={c.score}
                  size={56}
                  strokeWidth={5}
                  color={ringColor(c.score)}
                />
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${c.score}%`,
                    backgroundColor: ringColor(c.score),
                  }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-dim)] mb-3">{c.details}</p>

              {/* Tips block */}
              <div
                className="mt-3 p-3 rounded-lg"
                style={{
                  background: `${tipColor}10`,
                  borderLeft: `3px solid ${tipColor}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  {c.score >= 80 ? (
                    <CheckCircle2 size={12} style={{ color: tipColor }} />
                  ) : (
                    <Lightbulb size={12} style={{ color: tipColor }} />
                  )}
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: tipColor }}
                  >
                    {c.score >= 80 ? "Conforme" : "Comment améliorer"}
                  </span>
                </div>
                {c.score >= 80 ? (
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {tips.good}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {tipContent?.map((tip, i) => (
                      <li key={i} className="text-[11px] text-[var(--text-secondary)] leading-relaxed flex items-start gap-1.5">
                        <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: tipColor }} />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
