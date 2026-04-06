import Link from "next/link";
import { Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Qualiopi SaaS | À partir de 29€/mois",
  description: "Tarif fixe, sans surprise. 29€/mois pour automatiser votre conformité Qualiopi.",
};

const essentialFeatures = ["Dashboard temps réel","Score Qualiopi sur 32 indicateurs","7 workflows automatiques","Tous les documents PDF","Émargement digital","Emails automatiques","Relances multi-niveaux","Suivi à froid","Google Workspace natif","Bénéficiaires illimités","Support email"];
const customFeatures = ["Tout du plan Essentiel","Personnalisation des workflows","Formation dédiée (2h)","Support prioritaire","Multi-organismes","Intégrations sur mesure"];

export default function PricingPage() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-3">Un prix simple, sans surprise</h1>
        <p className="text-center text-[var(--text-secondary)] mb-12">Pas de coûts cachés, pas de tarification par bénéficiaire</p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative glass-card p-8 rounded-2xl border-indigo-500/30">
            <span className="absolute -top-3 left-6 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-full">Populaire</span>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Essentiel</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-[var(--text-primary)]">29€</span>
              <span className="text-sm text-[var(--text-dim)]">/mois HT</span>
            </div>
            <ul className="mt-6 space-y-2.5">
              {essentialFeatures.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Check size={14} className="text-emerald-400 shrink-0" />{f}</li>))}
            </ul>
            <Link href="/signup" className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm text-center block">Commencer l&apos;essai gratuit</Link>
            <p className="text-center text-xs text-[var(--text-dim)] mt-2">14 jours gratuits · Sans carte bancaire</p>
          </div>
          <div className="glass-card p-8 rounded-2xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sur mesure</h3>
            <div className="mt-4"><span className="text-4xl font-extrabold text-[var(--text-primary)]">Sur devis</span></div>
            <ul className="mt-6 space-y-2.5">
              {customFeatures.map((f) => (<li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Check size={14} className="text-emerald-400 shrink-0" />{f}</li>))}
            </ul>
            <Link href="/contact" className="mt-8 w-full py-3 rounded-xl border border-white/[0.1] text-[var(--text-secondary)] font-semibold text-sm text-center block">Nous contacter</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
