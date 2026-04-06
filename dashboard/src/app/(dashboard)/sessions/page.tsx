import { getSessions } from "@/lib/db";
import { CalendarDays, PlayCircle, CheckCircle2, XCircle } from "lucide-react";
import KPICard from "@/components/KPICard";
import SessionsClient from "./SessionsClient";

export default async function SessionsPage() {
  const sessions = await getSessions();

  // Counts
  const counts = { planifiee: 0, en_cours: 0, terminee: 0, annulee: 0 };
  for (const s of sessions) {
    const st = s.statut;
    if (st in counts) counts[st as keyof typeof counts]++;
  }

  return (
    <div className="space-y-6">
      {/* Mini KPI cards with stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KPICard label="Planifiées" value={counts.planifiee} icon={CalendarDays} accent="#6366f1" delay={0} />
        <KPICard label="En cours" value={counts.en_cours} icon={PlayCircle} accent="#10b981" delay={80} />
        <KPICard label="Terminées" value={counts.terminee} icon={CheckCircle2} accent="#94a3b8" delay={160} />
        <KPICard label="Annulées" value={counts.annulee} icon={XCircle} accent="#ef4444" delay={240} />
      </div>

      <SessionsClient sessions={sessions} />
    </div>
  );
}
