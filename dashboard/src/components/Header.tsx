"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { RotateCw, Plus } from "lucide-react";
import NewSessionModal from "./NewSessionModal";
import ThemeToggle from "./ThemeToggle";

const TITLES: Record<string, string> = {
  "/dashboard": "Vue d'ensemble",
  "/sessions": "Sessions",
  "/conformite": "Conformité Qualiopi",
  "/financier": "Financier",
  "/workflows": "Workflows",
  "/alertes": "Alertes",
  "/settings": "Paramètres",
  "/onboarding": "Configuration",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const title = TITLES[pathname] ?? "Dashboard";

  const [now, setNow] = useState<Date | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleRefresh = useCallback(() => {
    setSpinning(true);
    router.refresh();
    setTimeout(() => setSpinning(false), 1000);
  }, [router]);

  const time = now
    ? now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "";
  const date = now
    ? now.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <>
      <header className="flex items-center justify-between px-4 lg:px-8 py-4 border-b border-[var(--border-subtle)]">
        <div>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-dim)]">Dashboard</span>
            <span className="text-xs text-[var(--text-dim)]">/</span>
            <span className="text-xs text-[var(--text-secondary)]">{title}</span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h1>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-glow" />
              Live
            </span>
          </div>
          {now && (
            <p className="text-[11px] text-[var(--text-dim)] mt-0.5 capitalize">
              {date} — {time}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-secondary)] glass-card rounded-lg"
          >
            <RotateCw
              size={14}
              className={spinning ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Rafraîchir</span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-white rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-shadow"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Nouvelle session</span>
          </button>
        </div>
      </header>

      <NewSessionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
