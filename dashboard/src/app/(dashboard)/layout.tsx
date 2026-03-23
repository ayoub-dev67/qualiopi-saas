import { getOrganization, getSessions, getFormateurs } from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AutoRefresh from "@/components/AutoRefresh";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [org, sessions, formateurs] = await Promise.all([
    getOrganization(), getSessions(), getFormateurs(),
  ]);

  let alertCount = 0;
  for (const s of sessions) {
    if (s.statut === "planifiee" && !s.workflow_0_ok) alertCount++;
    if (s.statut === "en_cours" && !s.workflow_2_ok) alertCount++;
    if (s.statut === "terminee" && !s.workflow_3_ok) alertCount++;
  }
  alertCount += formateurs.filter((f) => !f.dossier_complet).length;

  return (
    <>
      <AutoRefresh />
      <Sidebar orgName={org?.nom} orgNda={org?.nda ?? undefined} alertCount={alertCount} serverTime={Date.now()} />
      <div className="ml-[60px] lg:ml-60 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </>
  );
}
