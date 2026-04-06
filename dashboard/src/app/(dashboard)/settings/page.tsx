import { getOrganization } from "@/lib/db";
import { Database, AlertTriangle, Accessibility } from "lucide-react";
import type { Metadata } from "next";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "Paramètres — Qualiopi Dashboard" };

export default async function SettingsPage() {
  const org = await getOrganization();
  const hasReferent = !!(org?.referent_handicap_nom && org?.referent_handicap_email);

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paramètres</h1>

      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Mon organisme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ["Nom", org?.nom],
            ["SIRET", org?.siret],
            ["NDA", org?.nda],
            ["Adresse", org?.adresse],
            ["Email", org?.email_contact],
            ["Téléphone", org?.telephone],
          ].map(([label, value]) => (
            <div key={label as string}>
              <span className="text-xs text-[var(--text-dim)]">{label}</span>
              <p className="text-[var(--text-secondary)]">{(value as string) || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Référent handicap — Critère 3 Qualiopi */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center gap-2 mb-4">
          <Accessibility size={18} className="text-[var(--accent)]" />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Référent handicap <span className="text-xs text-[var(--text-dim)] font-normal">(Critère 3 Qualiopi)</span>
          </h2>
        </div>

        {hasReferent ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-xs text-[var(--text-dim)]">Nom</span>
              <p className="text-[var(--text-secondary)]">{org?.referent_handicap_nom}</p>
            </div>
            <div>
              <span className="text-xs text-[var(--text-dim)]">Email</span>
              <p className="text-[var(--text-secondary)]">{org?.referent_handicap_email}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--warning-glow)] border border-[var(--warning)]/30">
            <AlertTriangle size={18} className="text-[var(--warning)] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-[var(--text-primary)] font-medium mb-1">
                Vous devez désigner un référent handicap
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                L&apos;indicateur 26 du RNQ exige que votre organisme désigne un référent handicap et communique ses
                coordonnées aux bénéficiaires. Renseignez ces informations pour couvrir le Critère 3.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Abonnement</h2>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-card-hover)]">
          <Database size={18} className="text-[var(--accent)]" />
          <div>
            <p className="text-sm text-[var(--text-primary)]">
              {org?.stripe_status === "active" ? "Actif" : org?.stripe_status === "trialing" ? "Essai gratuit" : "Inactif"}
            </p>
            {org?.trial_ends_at && (
              <p className="text-xs text-[var(--text-dim)]">Expire le {new Date(org.trial_ends_at).toLocaleDateString("fr-FR")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-[var(--danger)] mb-2">Zone dangereuse</h2>
        <p className="text-xs text-[var(--text-dim)] mb-4">Ces actions sont irréversibles.</p>
        <LogoutButton />
      </div>
    </div>
  );
}
