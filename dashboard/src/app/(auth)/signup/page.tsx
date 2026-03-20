import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata = { title: "Inscription — Qualiopi SaaS" };

export default function SignupPage() {
  return (
    <div className="w-full max-w-[420px] mx-4 animate-[fadeInUp_0.6s_ease-out]">
      <div className="glass-card p-8 rounded-2xl text-center">
        <div className="flex justify-center mb-6">
          <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-2xl">Q</span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Inscription</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          L&apos;inscription sera bientôt disponible.
        </p>
        <div className="glass-card p-4 rounded-xl mb-6">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
            <Mail size={16} className="text-indigo-400" />
            <span>contact@formation-alsace.fr</span>
          </div>
        </div>
        <Link
          href="/login"
          className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          &larr; Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
