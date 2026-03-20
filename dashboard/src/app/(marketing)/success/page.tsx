import Link from "next/link";
import { CheckCircle } from "lucide-react";

export const metadata = { title: "Bienvenue — Qualiopi SaaS" };

export default function SuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="glass-card p-8 rounded-2xl text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Bienvenue !</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Votre essai gratuit de 14 jours est activé.</p>
        <Link href="/dashboard" className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm">Accéder au dashboard</Link>
      </div>
    </div>
  );
}
