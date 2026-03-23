"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Building, BookOpen, UserCheck, Loader2, ArrowRight, Check, AlertCircle } from "lucide-react";

const STEPS = ["Votre organisme", "Premiere formation", "Premier formateur"];
const STEP_ICONS = [Building, BookOpen, UserCheck];

const inputClass =
  "w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-colors";
const inputClassNoIcon =
  "w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-colors";
const labelClass = "text-xs font-medium text-[var(--text-secondary)] mb-1.5 block";

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Step 0: Organisation
  const [siret, setSiret] = useState("");
  const [adresse, setAdresse] = useState("");
  const [tel, setTel] = useState("");
  const [nda, setNda] = useState("");
  const [orgEmail, setOrgEmail] = useState("");

  // Step 1: Formation
  const [intitule, setIntitule] = useState("");
  const [duree, setDuree] = useState("");
  const [objectifs, setObjectifs] = useState("");
  const [prerequis, setPrerequis] = useState("");
  const [modalite, setModalite] = useState("presentiel");
  const [tarif, setTarif] = useState("");

  // Step 2: Formateur
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [formateurEmail, setFormateurEmail] = useState("");
  const [specialite, setSpecialite] = useState("");
  const [qualifications, setQualifications] = useState("");

  async function submitStep() {
    setLoading(true);
    setError("");

    const supabase = createBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError("Session expiree, veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    const stepNames = ["org", "formation", "formateur"] as const;
    const stepData: Record<string, Record<string, unknown>> = {
      org: { siret, adresse, telephone: tel, nda, email_contact: orgEmail },
      formation: { intitule, duree_heures: Number(duree) || 0, objectifs, prerequis, modalite, tarif_ht: Number(tarif) || 0 },
      formateur: { nom, prenom, email: formateurEmail, specialite, qualifications },
    };

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ step: stepNames[step], data: stepData[stepNames[step]] }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error || "Une erreur est survenue");
        setLoading(false);
        return;
      }

      if (step < 2) {
        setStep(step + 1);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitStep();
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-[560px] animate-[fadeInUp_0.6s_ease-out]">
        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((label, i) => {
            const Icon = STEP_ICONS[i];
            const isActive = i === step;
            const isCompleted = i < step;

            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : isActive
                        ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                        : "bg-white/[0.06] border border-white/[0.1] text-[var(--text-dim)]"
                    }`}
                  >
                    {isCompleted ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                      isActive ? "text-[var(--text-primary)]" : "text-[var(--text-dim)]"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 rounded-full transition-colors duration-300 ${
                      i < step ? "bg-emerald-500" : "bg-white/[0.08]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Form card */}
        <div className="glass-card p-8 rounded-2xl">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            {STEPS[step]}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">
            {step === 0 && "Renseignez les informations de votre organisme de formation."}
            {step === 1 && "Creez votre premiere formation pour demarrer."}
            {step === 2 && "Ajoutez votre premier formateur."}
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 0: Organisation */}
            {step === 0 && (
              <>
                <div>
                  <label className={labelClass}>SIRET</label>
                  <div className="relative">
                    <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                    <input type="text" value={siret} onChange={(e) => setSiret(e.target.value)} placeholder="123 456 789 00012" required className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Adresse</label>
                  <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="12 rue de la Formation, 75001 Paris" required className={inputClassNoIcon} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Telephone</label>
                    <input type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="01 23 45 67 89" className={inputClassNoIcon} />
                  </div>
                  <div>
                    <label className={labelClass}>N. declaration d&apos;activite (NDA)</label>
                    <input type="text" value={nda} onChange={(e) => setNda(e.target.value)} placeholder="11755XXXXXXX" className={inputClassNoIcon} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email de contact</label>
                  <input type="email" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} placeholder="contact@organisme.fr" className={inputClassNoIcon} />
                </div>
              </>
            )}

            {/* Step 1: Formation */}
            {step === 1 && (
              <>
                <div>
                  <label className={labelClass}>Intitule de la formation</label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                    <input type="text" value={intitule} onChange={(e) => setIntitule(e.target.value)} placeholder="Formation professionnelle..." required className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Duree (heures)</label>
                    <input type="number" value={duree} onChange={(e) => setDuree(e.target.value)} placeholder="14" required className={inputClassNoIcon} />
                  </div>
                  <div>
                    <label className={labelClass}>Tarif HT (EUR)</label>
                    <input type="number" value={tarif} onChange={(e) => setTarif(e.target.value)} placeholder="1200" className={inputClassNoIcon} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Objectifs pedagogiques</label>
                  <textarea value={objectifs} onChange={(e) => setObjectifs(e.target.value)} placeholder="A l'issue de cette formation, le stagiaire sera capable de..." rows={3} required className={inputClassNoIcon + " resize-none"} />
                </div>
                <div>
                  <label className={labelClass}>Prerequis</label>
                  <input type="text" value={prerequis} onChange={(e) => setPrerequis(e.target.value)} placeholder="Aucun prerequis / Niveau bac..." className={inputClassNoIcon} />
                </div>
                <div>
                  <label className={labelClass}>Modalite</label>
                  <select value={modalite} onChange={(e) => setModalite(e.target.value)} className={inputClassNoIcon}>
                    <option value="presentiel">Presentiel</option>
                    <option value="distanciel">Distanciel</option>
                    <option value="mixte">Mixte</option>
                  </select>
                </div>
              </>
            )}

            {/* Step 2: Formateur */}
            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Nom</label>
                    <div className="relative">
                      <UserCheck size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                      <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Dupont" required className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Prenom</label>
                    <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" required className={inputClassNoIcon} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input type="email" value={formateurEmail} onChange={(e) => setFormateurEmail(e.target.value)} placeholder="jean.dupont@email.fr" required className={inputClassNoIcon} />
                </div>
                <div>
                  <label className={labelClass}>Specialite</label>
                  <input type="text" value={specialite} onChange={(e) => setSpecialite(e.target.value)} placeholder="Management, Informatique..." className={inputClassNoIcon} />
                </div>
                <div>
                  <label className={labelClass}>Qualifications</label>
                  <textarea value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="Diplomes, certifications, experiences..." rows={3} className={inputClassNoIcon + " resize-none"} />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : step < 2 ? (
                <ArrowRight size={16} />
              ) : (
                <Check size={16} />
              )}
              {loading
                ? "Enregistrement..."
                : step < 2
                ? "Suivant"
                : "Terminer et acceder au dashboard"}
            </button>
          </form>

          {/* Step indicator */}
          <p className="text-center text-xs text-[var(--text-dim)] mt-4">
            Etape {step + 1} sur {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
