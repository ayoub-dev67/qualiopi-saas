import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-indigo-500/30 mb-4">404</p>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Page introuvable</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">Oops, cette page n&apos;existe pas.</p>
        <Link href="/" className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium">Retour à l&apos;accueil</Link>
      </div>
    </div>
  );
}
