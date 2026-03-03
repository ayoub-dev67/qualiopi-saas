import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { getOrganisme, getSessions, getFormateurs } from "@/lib/sheets";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import AutoRefresh from "@/components/AutoRefresh";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Qualiopi SaaS — Dashboard",
  description: "Tableau de bord de gestion Qualiopi",
};

function isTrue(v: string | undefined) { return v === "TRUE" || v === "true"; }
function norm(s: string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_"); }

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [organisme, sessions, formateurs] = await Promise.all([
    getOrganisme(), getSessions(), getFormateurs(),
  ]);
  const org = organisme[0] ?? {};

  // Compute alert count for sidebar badge
  let alertCount = 0;
  for (const s of sessions) {
    const st = norm(s.statut ?? "");
    if (st === "planifiee" && !isTrue(s.workflow_0_ok)) alertCount++;
    if (st === "en_cours" && !isTrue(s.workflow_2_ok)) alertCount++;
    if (st === "terminee" && !isTrue(s.workflow_3_ok)) alertCount++;
  }
  alertCount += formateurs.filter((f) => !isTrue(f.dossier_complet)).length;

  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AutoRefresh />
        <Sidebar orgName={org.nom} orgNda={org.nda} alertCount={alertCount} serverTime={Date.now()} />
        <div className="ml-[60px] lg:ml-60 min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
