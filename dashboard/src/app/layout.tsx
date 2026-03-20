import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-jetbrains-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Qualiopi SaaS — Automatisez votre conformit\u00e9 Qualiopi",
  description: "Le seul outil de conformit\u00e9 Qualiopi con\u00e7u pour les formateurs ind\u00e9pendants. Score temps r\u00e9el, documents automatiques, 29\u20ac/mois.",
  openGraph: {
    title: "Qualiopi SaaS — Automatisez votre conformit\u00e9 Qualiopi",
    description: "Le seul outil de conformit\u00e9 Qualiopi con\u00e7u pour les formateurs ind\u00e9pendants.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
