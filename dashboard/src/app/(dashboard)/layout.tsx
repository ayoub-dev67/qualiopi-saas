import { getOrganisme, getSessions, getFormateurs } from "@/lib/sheets";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AutoRefresh from "@/components/AutoRefresh";

function isTrue(v: string | undefined) { const l = (v ?? "").toLowerCase(); return l === "true" || l === "vrai"; }
function norm(s: string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"); }

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [organisme, sessions, formateurs] = await Promise.all([
    getOrganisme(), getSessions(), getFormateurs(),
  ]);
  const org = organisme[0] ?? {};

  let alertCount = 0;
  for (const s of sessions) {
    const st = norm(s.statut ?? "");
    if (st === "planifiee" && !isTrue(s.workflow_0_ok)) alertCount++;
    if (st === "en_cours" && !isTrue(s.workflow_2_ok)) alertCount++;
    if (st === "terminee" && !isTrue(s.workflow_3_ok)) alertCount++;
  }
  alertCount += formateurs.filter((f) => !isTrue(f.dossier_complet)).length;

  return (
    <>
      <AutoRefresh />
      <Sidebar orgName={org.nom} orgNda={org.nda} alertCount={alertCount} serverTime={Date.now()} />
      <div className="ml-[60px] lg:ml-60 min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </>
  );
}
