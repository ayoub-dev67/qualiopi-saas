"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Search } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import WorkflowDot from "@/components/WorkflowDot";
import DataTable from "@/components/DataTable";
import type { SessionWithRelations } from "@/types/database";

type StatusFilter = "all" | "planifiee" | "en_cours" | "terminee";

const FILTER_PILLS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "planifiee", label: "Planifiées" },
  { key: "en_cours", label: "En cours" },
  { key: "terminee", label: "Terminées" },
];

function fmtDate(d: string): string {
  if (d.length >= 10) {
    const parts = d.substring(0, 10).split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  }
  return d || "—";
}

function progressGradient(pct: number): string {
  if (pct >= 80) return "linear-gradient(90deg, #059669, #10b981)";
  if (pct >= 50) return "linear-gradient(90deg, #d97706, #f59e0b)";
  return "linear-gradient(90deg, #4f46e5, #6366f1)";
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export default function SessionsClient({ sessions }: { sessions: SessionWithRelations[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return sessions.filter((s) => {
      // Status filter
      if (statusFilter !== "all" && s.statut !== statusFilter) return false;
      if (!q) return true;
      // Search fields
      const fields = [
        s.formations?.intitule ?? "",
        s.formateurs?.nom ?? "",
        s.formateurs?.prenom ?? "",
        s.ref ?? "",
        s.lieu ?? "",
      ]
        .map(normalize)
        .join(" ");
      return fields.includes(q);
    });
  }, [sessions, search, statusFilter]);

  const tableRows = filtered.map((s) => {
    const nbInscrits = s.nb_inscrits ?? 0;
    const nbPlaces = s.nombre_places ?? 1;
    const pctFill = Math.min(100, Math.round((nbInscrits / nbPlaces) * 100));

    return [
      <Link
        key="id"
        href={`/sessions/${s.id}`}
        className="font-mono text-[var(--accent)] text-xs hover:underline cursor-pointer"
      >
        {s.ref}
      </Link>,
      <span key="f" className="text-sm">
        {s.formations.intitule}
      </span>,
      <span key="fm" className="text-sm">
        {`${s.formateurs.prenom} ${s.formateurs.nom}`.trim()}
      </span>,
      <span key="d" className="text-xs whitespace-nowrap">
        {fmtDate(s.date_debut ?? "")}
        {s.date_fin ? ` → ${fmtDate(s.date_fin)}` : ""}
      </span>,
      <span key="l" className="text-xs">
        {s.lieu || "—"}
      </span>,
      <div key="ins" className="flex items-center gap-2 min-w-[100px]">
        <div className="flex-1 h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pctFill}%`,
              background: progressGradient(pctFill),
            }}
          />
        </div>
        <span className="text-[11px] text-[var(--text-dim)] font-mono whitespace-nowrap">
          {nbInscrits}/{nbPlaces}
        </span>
      </div>,
      <StatusBadge key="st" status={s.statut} />,
      <div key="wf" className="flex items-center gap-1.5">
        <WorkflowDot done={s.workflow_0_ok} />
        <WorkflowDot done={s.workflow_1_ok} />
        <WorkflowDot done={s.workflow_2_ok} />
        <WorkflowDot done={s.workflow_3_ok} />
      </div>,
    ];
  });

  const emptyTitle =
    sessions.length === 0
      ? "Pas encore de session de formation"
      : "Aucune session ne correspond";
  const emptyDescription =
    sessions.length === 0
      ? "Créez votre première session pour démarrer le suivi Qualiopi."
      : "Essayez d'ajuster votre recherche ou vos filtres.";

  return (
    <>
      {/* Search / filter bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-2 flex-1 bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5">
          <Search size={16} className="text-[var(--text-dim)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une session, une formation, un intervenant..."
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {FILTER_PILLS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  active
                    ? "bg-[var(--accent-glow)] text-[var(--accent)] font-medium"
                    : "text-[var(--text-dim)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        headers={["Session", "Formation", "Intervenant", "Dates", "Lieu", "Inscrits", "Statut", "WF"]}
        rows={tableRows}
        emptyIcon={CalendarDays}
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
      />
    </>
  );
}
