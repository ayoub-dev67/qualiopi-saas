import { getOrganization } from "@/lib/db";
import { Database } from "lucide-react";
import type { Metadata } from "next";
import LogoutButton from "@/components/LogoutButton";

export const metadata: Metadata = { title: "Paramètres — Qualiopi Dashboard" };

export default async function SettingsPage() {
  const org = await getOrganization();

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

      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Abonnement</h2>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]">
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

      <div className="glass-card p-6 rounded-2xl border-red-500/10">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Zone dangereuse</h2>
        <p className="text-xs text-[var(--text-dim)] mb-4">Ces actions sont irréversibles.</p>
        <LogoutButton />
      </div>
    </div>
  );
}
