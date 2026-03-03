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
  { href: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/conformite", label: "Conformité", icon: Shield },
  { href: "/financier", label: "Financier", icon: DollarSign },
  { href: "/workflows", label: "Workflows", icon: Zap },
  { href: "/alertes", label: "Alertes", icon: Bell },
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
    <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-[60px] lg:w-60 flex-col bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]">
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
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isAlertes = href === "/alertes";
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-[14px] py-[14px] lg:py-3 rounded-[10px] text-sm transition-all ${
                active
                  ? "bg-[var(--accent-glow)] text-white"
                  : "text-[var(--text-secondary)] hover:text-white hover:bg-white/5"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--accent)] rounded-r" />
              )}
              <Icon size={18} className="shrink-0" />
              <span className="hidden lg:inline">{label}</span>
              {isAlertes && alertCount > 0 && (
                <span className="absolute top-2 right-2 lg:static lg:ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[var(--danger)] text-white text-[10px] font-bold animate-pulse-glow">
                  {alertCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Live indicator */}
      <div className="px-3 lg:px-5 py-3 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-glow shrink-0" />
          <span className="hidden lg:inline text-[10px] text-[var(--text-dim)]">
            Sync {syncLabel}
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
