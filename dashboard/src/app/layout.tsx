import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Qualiopi SaaS — Dashboard",
  description: "Tableau de bord de gestion Qualiopi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Sidebar />
        <div className="ml-60 min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
