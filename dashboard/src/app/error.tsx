"use client";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-extrabold text-red-500/30 mb-4">Erreur</p>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Une erreur est survenue</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{error.message || "Veuillez réessayer."}</p>
        <button onClick={reset} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-medium">Réessayer</button>
      </div>
    </div>
  );
}
