"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

/* ---------- Form field definitions ---------- */

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "range" | "checkbox" | "radio";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
  showIf?: (data: Record<string, unknown>) => boolean;
}

const FORM_FIELDS: Record<string, FieldDef[]> = {
  positionnement: [
    {
      key: "niveau",
      label: "Votre niveau actuel",
      type: "select",
      options: [
        { value: "debutant", label: "Débutant" },
        { value: "intermediaire", label: "Intermédiaire" },
        { value: "avance", label: "Avancé" },
      ],
    },
    { key: "experience", label: "Votre expérience dans ce domaine", type: "textarea", placeholder: "Décrivez votre parcours et vos expériences..." },
    { key: "attentes", label: "Vos attentes pour cette formation", type: "textarea", placeholder: "Qu'attendez-vous de cette formation ?" },
    { key: "objectifs_personnels", label: "Vos objectifs personnels", type: "textarea", placeholder: "Quels sont vos objectifs à l'issue de la formation ?" },
    { key: "besoins_specifiques", label: "Avez-vous des besoins spécifiques ?", type: "checkbox" },
    {
      key: "besoins_details",
      label: "Précisez vos besoins",
      type: "textarea",
      placeholder: "Accessibilité, contraintes horaires, besoins particuliers...",
      showIf: (data) => !!data.besoins_specifiques,
    },
  ],
  emargement: [
    { key: "date", label: "Date", type: "text" },
    {
      key: "demi_journee",
      label: "Demi-journée",
      type: "select",
      options: [
        { value: "matin", label: "Matin" },
        { value: "apres_midi", label: "Après-midi" },
      ],
    },
    { key: "present", label: "Je confirme ma présence", type: "checkbox" },
  ],
  satisfaction: [
    { key: "note_globale", label: "Satisfaction globale", type: "range", min: 1, max: 10 },
    { key: "note_contenu", label: "Qualité du contenu", type: "range", min: 1, max: 10 },
    { key: "note_formateur", label: "Qualité de l'intervenant", type: "range", min: 1, max: 10 },
    { key: "note_organisation", label: "Organisation générale", type: "range", min: 1, max: 10 },
    { key: "points_forts", label: "Points forts de la formation", type: "textarea", placeholder: "Ce que vous avez particulièrement apprécié..." },
    { key: "axes_amelioration", label: "Axes d'amélioration", type: "textarea", placeholder: "Ce qui pourrait être amélioré..." },
    { key: "commentaire", label: "Commentaire libre", type: "textarea", placeholder: "Remarques supplémentaires..." },
    {
      key: "recommandation",
      label: "Recommanderiez-vous cette formation ?",
      type: "radio",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
      ],
    },
  ],
  evaluation: [
    { key: "competence_1", label: "Compétence 1", type: "range", min: 1, max: 10 },
    { key: "competence_2", label: "Compétence 2", type: "range", min: 1, max: 10 },
    { key: "competence_3", label: "Compétence 3", type: "range", min: 1, max: 10 },
    {
      key: "objectifs_atteints",
      label: "Objectifs atteints",
      type: "select",
      options: [
        { value: "totalement", label: "Totalement atteints" },
        { value: "partiellement", label: "Partiellement atteints" },
        { value: "non_atteints", label: "Non atteints" },
      ],
    },
    { key: "commentaire", label: "Commentaire", type: "textarea", placeholder: "Vos observations..." },
  ],
  "suivi-froid": [
    {
      key: "en_emploi",
      label: "Êtes-vous actuellement en emploi ?",
      type: "select",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
        { value: "en_recherche", label: "En recherche" },
      ],
    },
    {
      key: "meme_domaine",
      label: "Travaillez-vous dans le même domaine que la formation ?",
      type: "select",
      options: [
        { value: "oui", label: "Oui" },
        { value: "non", label: "Non" },
        { value: "partiellement", label: "Partiellement" },
      ],
    },
    {
      key: "utilisation_competences",
      label: "Utilisez-vous les compétences acquises ?",
      type: "select",
      options: [
        { value: "quotidiennement", label: "Quotidiennement" },
        { value: "regulierement", label: "Régulièrement" },
        { value: "rarement", label: "Rarement" },
        { value: "jamais", label: "Jamais" },
      ],
    },
    { key: "note_utilite", label: "Utilité de la formation", type: "range", min: 1, max: 10 },
    { key: "commentaire", label: "Commentaire", type: "textarea", placeholder: "Remarques sur l'impact de la formation..." },
  ],
};

const TYPE_LABELS: Record<string, string> = {
  positionnement: "Questionnaire de positionnement",
  emargement: "Émargement",
  satisfaction: "Enquête de satisfaction",
  evaluation: "Évaluation des acquis",
  "suivi-froid": "Suivi à froid",
};

/* ---------- Sub-components ---------- */

function RangeSlider({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-4">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${pct}%, #e2e8f0 ${pct}%, #e2e8f0 100%)`,
        }}
      />
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
        style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
      >
        {value}
      </span>
    </div>
  );
}

function FormField({ field, value, onChange }: { field: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all";

  switch (field.type) {
    case "textarea":
      return (
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className={inputClass + " resize-none"}
        />
      );

    case "select":
      return (
        <select value={(value as string) || ""} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">-- Choisir --</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case "range":
      return <RangeSlider value={typeof value === "number" ? value : field.min ?? 1} min={field.min ?? 1} max={field.max ?? 10} onChange={(v) => onChange(v)} />;

    case "checkbox":
      return (
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="peer sr-only"
            />
            <div className="w-5 h-5 rounded-md border-2 border-gray-300 peer-checked:border-indigo-500 peer-checked:bg-indigo-500 transition-colors flex items-center justify-center">
              {!!value && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm text-gray-700">{field.label}</span>
        </label>
      );

    case "radio":
      return (
        <div className="flex gap-4">
          {field.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-2 cursor-pointer select-none">
              <div className="relative">
                <input type="radio" name={field.key} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 peer-checked:border-indigo-500 transition-colors flex items-center justify-center">
                  {value === o.value && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                </div>
              </div>
              <span className="text-sm text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
          readOnly={field.key === "date"}
        />
      );
  }
}

/* ---------- Main component ---------- */

function FormPageInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const type = params.type as string;
  const token = searchParams.get("token");

  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const fields = FORM_FIELDS[type] ?? [];

  // Set default values on mount
  useEffect(() => {
    const defaults: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === "range") defaults[f.key] = f.min ?? 1;
      if (f.key === "date") defaults[f.key] = new Date().toISOString().split("T")[0];
    }
    setFormData(defaults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (!token) {
      setError("Lien invalide");
      setLoading(false);
      return;
    }
    fetch(`/api/public/forms/info?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error === "Already completed" ? "Ce questionnaire a déjà été complété." : "Lien invalide ou expiré.");
        } else {
          setInfo(data);
        }
      })
      .catch(() => setError("Erreur de chargement"))
      .finally(() => setLoading(false));
  }, [token]);

  function updateField(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/public/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, type: type.replace("-", "_"), data: formData }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const body = await res.json().catch(() => null);
        setError(body?.error || "Erreur lors de l'envoi");
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  /* -- Loading state -- */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
        <p className="mt-4 text-sm text-gray-500">Chargement du formulaire...</p>
      </div>
    );
  }

  /* -- Error state (no form) -- */
  if (error && !info) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Formulaire indisponible</h2>
        <p className="text-sm text-gray-500">{error}</p>
      </div>
    );
  }

  /* -- Success state -- */
  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center animate-[fadeInUp_0.6s_ease-out]">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Merci pour votre réponse !</h2>
        <p className="text-sm text-gray-500">Votre {TYPE_LABELS[type]?.toLowerCase() || "formulaire"} a bien été enregistré.</p>
      </div>
    );
  }

  /* -- Form -- */
  const questionnaire = (info as Record<string, unknown>)?.questionnaire as Record<string, unknown> | undefined;
  const org = (info as Record<string, unknown>)?.organization as Record<string, string> | undefined;
  const session = questionnaire?.sessions as Record<string, unknown> | undefined;
  const formation = session?.formations as Record<string, string> | undefined;

  return (
    <div className="animate-[fadeInUp_0.6s_ease-out]">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">Q</span>
          </div>
          {org?.nom && <span className="text-sm font-medium text-gray-600">{org.nom}</span>}
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">{TYPE_LABELS[type] || "Formulaire"}</h1>
        {formation?.intitule && <p className="text-sm text-gray-600">{formation.intitule}</p>}
        {!!session?.date_debut && (
          <p className="text-xs text-gray-400 mt-1">
            Session du {String(session.date_debut)} au {String(session.date_fin)}
          </p>
        )}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-6">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map((field) => {
            if (field.showIf && !field.showIf(formData)) return null;

            // Checkbox fields render their own label
            if (field.type === "checkbox") {
              return (
                <div key={field.key}>
                  <FormField field={field} value={formData[field.key]} onChange={(v) => updateField(field.key, v)} />
                </div>
              );
            }

            return (
              <div key={field.key}>
                <label className="text-sm font-medium text-gray-700 mb-2 block">{field.label}</label>
                <FormField field={field} value={formData[field.key]} onChange={(v) => updateField(field.key, v)} />
              </div>
            );
          })}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-200"
            style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)" }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? "Envoi en cours..." : "Envoyer ma réponse"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-400 mt-6">
        Propulsé par Qualiopi SaaS
      </p>
    </div>
  );
}

export default function FormPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-indigo-500" />
          <p className="mt-4 text-sm text-gray-500">Chargement...</p>
        </div>
      }
    >
      <FormPageInner />
    </Suspense>
  );
}
