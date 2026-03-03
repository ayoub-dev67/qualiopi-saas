const STATUSES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  ok:       { bg: "#064e3b", text: "#6ee7b7", icon: "✓", label: "Actif" },
  warning:  { bg: "#451a03", text: "#fcd34d", icon: "⚠", label: "Alerte" },
  error:    { bg: "#450a0a", text: "#fca5a5", icon: "✕", label: "Erreur" },
  inactive: { bg: "#1e293b", text: "#94a3b8", icon: "○", label: "Inactif" },
};

export default function WorkflowStatusBadge({ status }: { status: string }) {
  const s = STATUSES[status] ?? STATUSES.inactive;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      <span>{s.icon}</span>
      {s.label}
    </span>
  );
}
