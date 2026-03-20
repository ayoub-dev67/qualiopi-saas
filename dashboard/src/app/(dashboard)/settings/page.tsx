import { getOrganisme } from "@/lib/sheets";
import { LogOut, ExternalLink, Database } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Paramètres — Qualiopi Dashboard" };

export default async function SettingsPage() {
  const organismeRows = await getOrganisme();
  const org = organismeRows[0] ?? {};

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paramètres</h1>

      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Mon organisme</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {[
            ["Nom", org.nom],
            ["SIRET", org.siret],
            ["NDA", org.nda],
            ["Adresse", org.adresse],
            ["Email", org.email],
            ["Téléphone", org.telephone],
          ].map(([label, value]) => (
            <div key={label as string}>
              <span className="text-xs text-[var(--text-dim)]">{label}</span>
              <p className="text-[var(--text-secondary)]">{(value as string) || "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Configuration</h2>
        <div className="space-y-2">
          {[
            ["01_Referentiel", process.env.SHEET_01_ID],
            ["02_Suivi_Apprenants", process.env.SHEET_02_ID],
            ["03_Qualite_KPIs", process.env.SHEET_03_ID],
          ].map(([name, id]) => (
            <a key={name as string} href={`https://docs.google.com/spreadsheets/d/${id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-sm text-[var(--text-secondary)]">
              <span>{name}</span>
              <ExternalLink size={14} className="text-[var(--text-dim)]" />
            </a>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 rounded-2xl border-red-500/10">
        <h2 className="text-sm font-semibold text-red-400 mb-2">Zone dangereuse</h2>
        <p className="text-xs text-[var(--text-dim)] mb-4">Ces actions sont irréversibles.</p>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="px-4 py-2 rounded-lg border border-red-500/20 text-red-400 text-sm hover:bg-red-500/10 transition-colors flex items-center gap-2">
            <LogOut size={14} /> Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}
