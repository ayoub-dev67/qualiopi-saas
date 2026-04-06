"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Building, Loader2, Check, AlertCircle, SkipForward } from "lucide-react";

const inputClass =
  "w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] transition-colors";
const inputClassNoIcon =
  "w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-glow)] transition-colors";
const labelClass = "text-xs font-medium text-[var(--text-secondary)] mb-1.5 block";

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Organisme essentials only
  const [siret, setSiret] = useState("");
  const [nda, setNda] = useState("");
  const [orgEmail, setOrgEmail] = useState("");

  async function finishOnboarding(skip: boolean) {
    setLoading(true);
    setError("");

    const supabase = createBrowserSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      setError("Session expirée, veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    if (!skip) {
      try {
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            step: "org",
            data: { siret, nda, email_contact: orgEmail },
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setError(body?.error || "Une erreur est survenue");
          setLoading(false);
          return;
        }
      } catch {
        setError("Erreur de connexion");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    finishOnboarding(false);
  }

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] animate-[fadeInUp_0.6s_ease-out]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 items-center justify-center mb-4 shadow-lg shadow-indigo-500/25">
            <Building size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bienvenue sur Qualiopi SaaS</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Renseignez les informations essentielles de votre organisme, ou passez cette étape pour explorer le dashboard immédiatement.
          </p>
        </div>

        {/* Form card */}
        <div className="glass-card p-8 rounded-2xl">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--danger-glow)] border border-[var(--danger)]/30 mb-4">
              <AlertCircle size={16} className="text-[var(--danger)] shrink-0" />
              <span className="text-sm text-[var(--danger)]">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>SIRET</label>
              <div className="relative">
                <Building size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
                <input
                  type="text"
                  value={siret}
                  onChange={(e) => setSiret(e.target.value)}
                  placeholder="123 456 789 00012"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Numéro de déclaration d&apos;activité (NDA)</label>
              <input
                type="text"
                value={nda}
                onChange={(e) => setNda(e.target.value)}
                placeholder="11755XXXXXXX"
                className={inputClassNoIcon}
              />
            </div>

            <div>
              <label className={labelClass}>Email de contact</label>
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                placeholder="contact@organisme.fr"
                className={inputClassNoIcon}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
              {loading ? "Enregistrement..." : "Terminer et accéder au dashboard"}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => finishOnboarding(true)}
              className="w-full py-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] font-medium text-sm transition-colors flex items-center justify-center gap-2"
            >
              <SkipForward size={14} />
              Passer pour l&apos;instant
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-dim)] mt-4">
            Vous pourrez compléter ces informations à tout moment dans les paramètres.
          </p>
        </div>
      </div>
    </div>
  );
}
