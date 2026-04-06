import { getFactures } from "@/lib/db";
import { DollarSign, Receipt, TrendingUp, FileText } from "lucide-react";
import KPICard from "@/components/KPICard";
import DataTable from "@/components/DataTable";
import FinancierChart from "@/components/charts/FinancierChart";

const PAIEMENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paye:           { bg: "rgba(16, 185, 129, 0.14)", text: "#047857", label: "PAYÉ" },
  encaisse:       { bg: "rgba(16, 185, 129, 0.14)", text: "#047857", label: "ENCAISSÉ" },
  en_attente:     { bg: "rgba(99, 102, 241, 0.14)", text: "#4338ca", label: "EN ATTENTE" },
  emise:          { bg: "rgba(99, 102, 241, 0.14)", text: "#4338ca", label: "ÉMISE" },
  facturee:       { bg: "rgba(245, 158, 11, 0.14)", text: "#b45309", label: "FACTURÉE" },
  en_retard:      { bg: "rgba(239, 68, 68, 0.14)",  text: "#b91c1c", label: "EN RETARD" },
  annulee:        { bg: "rgba(100, 116, 139, 0.18)", text: "#475569", label: "ANNULÉE" },
};

export default async function FinancierPage() {
  const factures = await getFactures();

  if (factures.length === 0) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mb-5">
            <FileText size={32} className="text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucune donnée financière</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-4">
            Les données financières apparaîtront ici une fois vos premières factures enregistrées dans l&apos;onglet Financier du classeur 01_Referentiel.
          </p>
          <div className="text-xs text-[var(--text-dim)] space-y-1">
            <p>1. Ouvrez le classeur 01_Referentiel_Qualiopi</p>
            <p>2. Accédez à l&apos;onglet &quot;Financier&quot;</p>
            <p>3. Ajoutez vos factures avec les montants prévus, facturés et encaissés</p>
          </div>
        </div>
      </div>
    );
  }

  // KPIs
  const totalEncaisse = factures.reduce(
    (sum, f) => sum + (f.montant_encaisse ?? 0),
    0
  );
  const totalFacture = factures.reduce(
    (sum, f) => sum + (f.montant_facture ?? 0),
    0
  );
  const totalPrevu = factures.reduce(
    (sum, f) => sum + (f.montant_prevu ?? 0),
    0
  );
  const enAttente = factures.filter((f) =>
    ["en_attente", "emise", "facturee"].includes(f.statut_paiement)
  ).length;
  const tauxEncaissement =
    totalFacture > 0 ? Math.round((totalEncaisse / totalFacture) * 100) : 0;

  // Chart — aggregate by month from date_facture
  const byMonth = new Map<string, { prevu: number; facture: number; encaisse: number }>();
  for (const f of factures) {
    const date = f.date_facture || "";
    const month = date.length >= 7 ? date.substring(0, 7) : "N/A";
    const entry = byMonth.get(month) ?? { prevu: 0, facture: 0, encaisse: 0 };
    entry.prevu += f.montant_prevu ?? 0;
    entry.facture += f.montant_facture ?? 0;
    entry.encaisse += f.montant_encaisse ?? 0;
    byMonth.set(month, entry);
  }
  const chartData = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Table
  const tableRows = factures.map((f) => {
    const style = PAIEMENT_STYLES[f.statut_paiement] ?? PAIEMENT_STYLES.en_attente;
    return [
      <span key="id" className="font-mono text-indigo-400 text-xs">
        {f.ref}
      </span>,
      <span key="s" className="text-xs">{f.entreprise || "—"}</span>,
      <span key="t" className="text-xs">{f.type_financement || "—"}</span>,
      <span key="mp" className="text-xs font-mono">
        {(f.montant_prevu ?? 0).toLocaleString("fr-FR")} €
      </span>,
      <span key="mf" className="text-xs font-mono">
        {(f.montant_facture ?? 0).toLocaleString("fr-FR")} €
      </span>,
      <span key="me" className="text-xs font-mono text-emerald-400">
        {(f.montant_encaisse ?? 0).toLocaleString("fr-FR")} €
      </span>,
      <span
        key="st"
        className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
      </span>,
    ];
  });

  return (
    <div className="space-y-6">
      {/* KPIs with stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPICard
          label="CA Encaissé"
          value={totalEncaisse.toLocaleString("fr-FR")}
          suffix="€"
          icon={DollarSign}
          accent="#10b981"
          delay={0}
          trend={totalPrevu > 0 ? { direction: "up", value: `${Math.round((totalEncaisse / totalPrevu) * 100)}% du prévu` } : undefined}
        />
        <KPICard
          label="Factures en attente"
          value={enAttente}
          icon={Receipt}
          accent="#f59e0b"
          delay={80}
        />
        <KPICard
          label="Taux d'encaissement"
          value={tauxEncaissement}
          suffix="%"
          icon={TrendingUp}
          accent="#6366f1"
          delay={160}
          trend={tauxEncaissement >= 80 ? { direction: "up", value: "Bon" } : { direction: "down", value: "À surveiller" }}
        />
      </div>

      {/* Chart */}
      <FinancierChart data={chartData} />

      {/* Table */}
      <DataTable
        headers={["Facture", "Entreprise", "Financement", "Prévu", "Facturé", "Encaissé", "Statut"]}
        rows={tableRows}
        emptyIcon={Receipt}
        emptyTitle="Aucune facture"
        emptyDescription="Les factures apparaîtront ici après ajout dans le classeur Financier"
      />
    </div>
  );
}
