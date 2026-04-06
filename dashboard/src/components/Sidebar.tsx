"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Shield,
  DollarSign,
  Zap,
  Bell,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Vue d'ensemble", shortLabel: "Accueil", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", shortLabel: "Sessions", icon: CalendarDays },
  { href: "/conformite", label: "Conformité", shortLabel: "Conform.", icon: Shield },
  { href: "/financier", label: "Financier", shortLabel: "Finance", icon: DollarSign },
  { href: "/workflows", label: "Workflows", shortLabel: "Workflows", icon: Zap },
  { href: "/alertes", label: "Alertes", shortLabel: "Alertes", icon: Bell },
];

interface SidebarProps {
  orgName?: string;
  orgNda?: string;
  alertCount?: number;
  serverTime?: number;
}

export default function Sidebar({ orgName, orgNda, alertCount = 0, serverTime }: SidebarProps) {
  const pathname = usePathname();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    setElapsed(0);
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [serverTime]);

  const syncLabel = elapsed < 5 ? "à l'instant" : `il y a ${elapsed}s`;

  return (
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-[72px] lg:w-60 flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)] shadow-sm">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3 lg:px-5 py-6">
        <div
          className="shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center text-white font-extrabold text-xl font-mono"
          style={{
            background: "linear-gradient(135deg, #6366f1, #10b981, #6366f1)",
            backgroundSize: "200% 200%",
            animation: "gradient-rotate 8s ease infinite",
          }}
        >
          Q
        </div>
        <div className="hidden lg:block">
          <p className="text-[var(--text-primary)] font-extrabold text-xs tracking-[3px]">QUALIOPI</p>
          <p className="text-[var(--text-dim)] text-[10px] mt-0.5">Dashboard</p>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-3 lg:mx-5 h-px bg-[var(--border-subtle)] mb-2" />

      {/* Nav */}
      <nav className="flex-1 px-2 lg:px-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, shortLabel, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
          const isAlertes = href === "/alertes";
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-1 lg:px-[14px] py-2 lg:py-3 rounded-[10px] text-sm transition-all ${
                active
                  ? "bg-[var(--accent-glow)] text-[var(--accent)] lg:text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)]"
              }`}
            >
              {active && (
                <span className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--accent)] rounded-r" />
              )}
              <Icon size={18} className="shrink-0" />
              {/* Short label visible on mobile under the icon */}
              <span className="lg:hidden text-[9px] font-medium leading-none text-center">
                {shortLabel}
              </span>
              {/* Full label visible on desktop */}
              <span className="hidden lg:inline">{label}</span>
              {isAlertes && alertCount > 0 && (
                <span className="absolute top-1 right-1 lg:static lg:ml-auto min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-[var(--danger)] text-white text-[9px] font-bold animate-pulse-glow">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator — 8px dot with pulse + "Données live · Sync il y a Xs" */}
      <div className="px-3 lg:px-5 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5 justify-center lg:justify-start">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow shrink-0" />
          <span className="hidden lg:inline text-[11px] text-[var(--text-dim)] leading-tight">
            Données live · Sync {syncLabel}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="hidden lg:block px-5 py-4 border-t border-[var(--border-subtle)]">
        <p className="text-xs text-[var(--text-secondary)] font-medium truncate">
          {orgName || "Centre Formation"}
        </p>
        {orgNda && (
          <p className="text-[10px] text-[var(--text-dim)] font-mono mt-0.5">
            NDA {orgNda}
          </p>
        )}
      </div>
    </aside>
  );
}
