// Status badge — uses rgba backgrounds so that both light and dark mode keep sufficient contrast.
const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  planifiee: { bg: "rgba(99, 102, 241, 0.14)", text: "#4338ca", label: "PLANIFIÉE" },
  en_cours:  { bg: "rgba(16, 185, 129, 0.14)", text: "#047857", label: "EN COURS" },
  terminee:  { bg: "rgba(100, 116, 139, 0.18)", text: "#475569", label: "TERMINÉE" },
  annulee:   { bg: "rgba(239, 68, 68, 0.14)",  text: "#b91c1c", label: "ANNULÉE" },
  reportee:  { bg: "rgba(245, 158, 11, 0.14)", text: "#b45309", label: "REPORTÉE" },
  inscrit:   { bg: "rgba(99, 102, 241, 0.14)", text: "#4338ca", label: "INSCRIT" },
  present:   { bg: "rgba(16, 185, 129, 0.14)", text: "#047857", label: "PRÉSENT" },
  absent:    { bg: "rgba(239, 68, 68, 0.14)",  text: "#b91c1c", label: "ABSENT" },
  annule:    { bg: "rgba(100, 116, 139, 0.18)", text: "#475569", label: "ANNULÉ" },
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[normalize(status)] ?? STATUS_STYLES.planifiee;

  return (
    <span
      className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
      style={{ backgroundColor: style.bg, color: style.text }}
    >
      {style.label}
    </span>
  );
}
