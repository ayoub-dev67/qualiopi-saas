"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Shield,
  DollarSign,
  Zap,
  Bell,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/conformite", label: "Conformité Qualiopi", icon: Shield },
  { href: "/financier", label: "Financier", icon: DollarSign },
  { href: "/workflows", label: "Workflows", icon: Zap },
  { href: "/alertes", label: "Alertes", icon: Bell },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-[#0d1117] border-r border-[#1e293b] flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg font-mono">
          Q
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">
          Qualiopi SaaS
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                isActive
                  ? "bg-white/5 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-indigo-500 rounded-l" />
              )}
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-[#1e293b]">
        <p className="text-xs text-gray-400 font-medium">Centre Formation Test</p>
        <p className="text-[11px] text-gray-600 mt-0.5">NDA : 11755555555</p>
      </div>
    </aside>
  );
}
