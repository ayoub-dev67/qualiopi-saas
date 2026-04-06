const STATUSES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  ok:       { bg: "rgba(16, 185, 129, 0.14)", text: "#047857", icon: "✓", label: "Actif" },
  warning:  { bg: "rgba(245, 158, 11, 0.14)", text: "#b45309", icon: "⚠", label: "Alerte" },
  error:    { bg: "rgba(239, 68, 68, 0.14)",  text: "#b91c1c", icon: "✕", label: "Erreur" },
  inactive: { bg: "rgba(100, 116, 139, 0.18)", text: "#475569", icon: "○", label: "Inactif" },
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
