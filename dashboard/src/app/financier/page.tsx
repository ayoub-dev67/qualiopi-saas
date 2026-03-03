import { getFinancier } from "@/lib/sheets";
import { DollarSign, Receipt, TrendingUp } from "lucide-react";
import KPICard from "@/components/KPICard";
import DataTable from "@/components/DataTable";
import StatusBadge from "@/components/StatusBadge";
import FinancierChart from "@/components/charts/FinancierChart";

const PAIEMENT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  paye:           { bg: "#064e3b", text: "#6ee7b7", label: "PAYÉ" },
  encaisse:       { bg: "#064e3b", text: "#6ee7b7", label: "ENCAISSÉ" },
  en_attente:     { bg: "#312e81", text: "#a5b4fc", label: "EN ATTENTE" },
  emise:          { bg: "#312e81", text: "#a5b4fc", label: "ÉMISE" },
  facturee:       { bg: "#451a03", text: "#fcd34d", label: "FACTURÉE" },
  en_retard:      { bg: "#450a0a", text: "#fca5a5", label: "EN RETARD" },
  annulee:        { bg: "#1e293b", text: "#94a3b8", label: "ANNULÉE" },
};

function normalizeStr(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

export default async function FinancierPage() {
  const financier = await getFinancier();

  if (financier.length === 0) {
    return (
      <div className="animate-fade-in flex items-center justify-center h-64">
        <div className="text-center">
          <DollarSign size={40} className="text-[#1e293b] mx-auto mb-3" />
          <p className="text-sm text-[#64748b]">Aucune donnée financière pour le moment</p>
        </div>
      </div>
    );
  }

  // KPIs
  const totalEncaisse = financier.reduce(
    (sum, f) => sum + (parseFloat(f.montant_encaisse) || 0),
    0
  );
  const totalFacture = financier.reduce(
    (sum, f) => sum + (parseFloat(f.montant_facture) || 0),
    0
  );
  const totalPrevu = financier.reduce(
    (sum, f) => sum + (parseFloat(f.montant_prevu) || 0),
    0
  );
  const enAttente = financier.filter((f) => {
    const st = normalizeStr(f.statut_paiement ?? "");
    return ["en_attente", "emise", "facturee"].includes(st);
  }).length;
  const tauxEncaissement =
    totalFacture > 0 ? Math.round((totalEncaisse / totalFacture) * 100) : 0;

  // Chart — aggregate by month from date_facture
  const byMonth = new Map<string, { prevu: number; facture: number; encaisse: number }>();
  for (const f of financier) {
    const date = f.date_facture || "";
    const month = date.length >= 7 ? date.substring(0, 7) : "N/A";
    const entry = byMonth.get(month) ?? { prevu: 0, facture: 0, encaisse: 0 };
    entry.prevu += parseFloat(f.montant_prevu) || 0;
    entry.facture += parseFloat(f.montant_facture) || 0;
    entry.encaisse += parseFloat(f.montant_encaisse) || 0;
    byMonth.set(month, entry);
  }
  const chartData = Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Table
  const tableRows = financier.map((f) => {
    const st = normalizeStr(f.statut_paiement ?? "");
    const style = PAIEMENT_STYLES[st] ?? PAIEMENT_STYLES.en_attente;
    return [
      <span key="id" className="font-mono text-indigo-400 text-xs">
        {f.facture_id}
      </span>,
      <span key="s" className="text-xs">{f.session_id}</span>,
      <span key="e" className="text-xs">{f.entreprise || "—"}</span>,
      <span key="t" className="text-xs">{f.type_financement || "—"}</span>,
      <span key="mp" className="text-xs font-mono">
        {(parseFloat(f.montant_prevu) || 0).toLocaleString("fr-FR")} €
      </span>,
      <span key="mf" className="text-xs font-mono">
        {(parseFloat(f.montant_facture) || 0).toLocaleString("fr-FR")} €
      </span>,
      <span key="me" className="text-xs font-mono text-emerald-400">
        {(parseFloat(f.montant_encaisse) || 0).toLocaleString("fr-FR")} €
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
    <div className="animate-fade-in space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <KPICard
          label="CA Encaissé"
          value={totalEncaisse.toLocaleString("fr-FR")}
          suffix="€"
          icon={DollarSign}
          accent="#10b981"
          trend={totalPrevu > 0 ? { direction: "up", value: `${Math.round((totalEncaisse / totalPrevu) * 100)}% du prévu` } : undefined}
        />
        <KPICard
          label="Factures en attente"
          value={enAttente}
          icon={Receipt}
          accent="#f59e0b"
        />
        <KPICard
          label="Taux d'encaissement"
          value={tauxEncaissement}
          suffix="%"
          icon={TrendingUp}
          accent="#6366f1"
          trend={tauxEncaissement >= 80 ? { direction: "up", value: "Bon" } : { direction: "down", value: "À surveiller" }}
        />
      </div>

      {/* Chart */}
      <FinancierChart data={chartData} />

      {/* Table */}
      <DataTable
        headers={["Facture", "Session", "Entreprise", "Financement", "Prévu", "Facturé", "Encaissé", "Statut"]}
        rows={tableRows}
      />
    </div>
  );
}
