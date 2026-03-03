import {
  getOrganisme,
  getFormations,
  getFormateurs,
  getSatisfaction,
  getReclamations,
  getInscriptions,
} from "@/lib/sheets";
import ProgressRing from "@/components/ProgressRing";

function normalizeStatus(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

interface Critere {
  num: number;
  titre: string;
  indicateurs: string;
  score: number;
  details: string;
}

export default async function ConformitePage() {
  const [organisme, formations, formateurs, satisfaction, reclamations, inscriptions] =
    await Promise.all([
      getOrganisme(),
      getFormations(),
      getFormateurs(),
      getSatisfaction(),
      getReclamations(),
      getInscriptions(),
    ]);

  // Calcul par critère
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

  const satNotes = satisfaction
    .map((s) => parseFloat(s.note_globale))
    .filter((n) => !isNaN(n));
  const satMoy =
    satNotes.length > 0
      ? satNotes.reduce((a, b) => a + b, 0) / satNotes.length
      : 0;

  const criteres: Critere[] = [
    {
      num: 1,
      titre: "Information du public",
      indicateurs: "Ind. 1-3",
      score: Math.round((orgFilled / orgTotal) * 100),
      details: `${orgFilled}/${orgTotal} champs renseignés`,
    },
    {
      num: 2,
      titre: "Objectifs des prestations",
      indicateurs: "Ind. 4-8",
      score:
        formations.length > 0
          ? Math.round((formCompletes / formations.length) * 100)
          : 0,
      details: `${formCompletes}/${formations.length} formations complètes`,
    },
    {
      num: 3,
      titre: "Adaptation aux bénéficiaires",
      indicateurs: "Ind. 9-16",
      score:
        inscriptions.length > 0
          ? Math.round((positionFait / inscriptions.length) * 100)
          : 0,
      details: `${positionFait}/${inscriptions.length} positionnements`,
    },
    {
      num: 4,
      titre: "Moyens pédagogiques",
      indicateurs: "Ind. 17-21",
      score:
        formateurs.length > 0
          ? Math.round((formateursDossier / formateurs.length) * 100)
          : 0,
      details: `${formateursDossier}/${formateurs.length} dossiers complets`,
    },
    {
      num: 5,
      titre: "Compétences des formateurs",
      indicateurs: "Ind. 22-26",
      score:
        formateurs.length > 0
          ? Math.round((formateursQualif / formateurs.length) * 100)
          : 0,
      details: `${formateursQualif}/${formateurs.length} qualifiés`,
    },
    {
      num: 6,
      titre: "Engagement dans l'environnement",
      indicateurs: "Ind. 27-29",
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
      indicateurs: "Ind. 30-32",
      score: satNotes.length > 0 ? Math.min(100, Math.round(satMoy * 20)) : 0,
      details:
        satNotes.length > 0
          ? `Satisfaction ${satMoy.toFixed(1)}/5 (${satNotes.length} réponses)`
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
    if (score >= 80) return { bg: "#064e3b", text: "#6ee7b7" };
    if (score >= 50) return { bg: "#451a03", text: "#fcd34d" };
    return { bg: "#450a0a", text: "#fca5a5" };
  }

  function badgeLabel(score: number): string {
    if (score >= 80) return "CONFORME";
    if (score >= 50) return "PARTIEL";
    return "NON CONFORME";
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Score global */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-2xl p-8 flex flex-col items-center">
        <h3 className="text-sm font-medium text-[#94a3b8] mb-6">
          Score de conformité global
        </h3>
        <ProgressRing
          value={globalScore}
          size={160}
          strokeWidth={12}
          color={ringColor(globalScore)}
        />
        <p className="mt-4 text-xs text-[#64748b]">
          Basé sur {criteres.length} critères &middot;{" "}
          {criteres.filter((c) => c.score >= 80).length} conformes
        </p>
      </div>

      {/* 7 critères */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {criteres.map((c) => {
          const badge = badgeColor(c.score);
          return (
            <div
              key={c.num}
              className="bg-[#111827] border border-[#1e293b] rounded-2xl p-6 hover:border-[#2d3a4f] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-indigo-400">
                      C{c.num}
                    </span>
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: badge.bg, color: badge.text }}
                    >
                      {badgeLabel(c.score)}
                    </span>
                  </div>
                  <h4 className="text-sm font-medium text-[#f1f5f9] mt-1.5">
                    {c.titre}
                  </h4>
                  <p className="text-[11px] text-[#64748b] mt-0.5">{c.indicateurs}</p>
                </div>
                <ProgressRing
                  value={c.score}
                  size={56}
                  strokeWidth={5}
                  color={ringColor(c.score)}
                />
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#1e293b] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${c.score}%`,
                    backgroundColor: ringColor(c.score),
                  }}
                />
              </div>
              <p className="text-[11px] text-[#64748b]">{c.details}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
