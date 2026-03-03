"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { RefreshCw, Download } from "lucide-react";

const TITLES: Record<string, string> = {
  "/": "Vue d'ensemble",
  "/sessions": "Sessions",
  "/conformite": "Conformité Qualiopi",
  "/financier": "Financier",
  "/workflows": "Workflows",
  "/alertes": "Alertes",
};

export default function Header() {
  const pathname = usePathname();
  const title = TITLES[pathname] ?? "Dashboard";

  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = now
    ? now.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const formattedTime = now
    ? now.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-[#1e293b]">
      <div>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {now && (
          <p className="text-xs text-gray-500 mt-1 capitalize">
            {formattedDate} — {formattedTime}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-[#1e293b]">
          <RefreshCw size={14} />
          Rafraîchir
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-[#1e293b]">
          <Download size={14} />
          Exporter
        </button>
      </div>
    </header>
  );
}
