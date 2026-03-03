const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  planifiee: { bg: "#312e81", text: "#a5b4fc", label: "PLANIFIÉE" },
  en_cours:  { bg: "#064e3b", text: "#6ee7b7", label: "EN COURS" },
  terminee:  { bg: "#1e293b", text: "#94a3b8", label: "TERMINÉE" },
  annulee:   { bg: "#450a0a", text: "#fca5a5", label: "ANNULÉE" },
  reportee:  { bg: "#451a03", text: "#fcd34d", label: "REPORTÉE" },
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
