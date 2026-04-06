import Link from "next/link";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#060912]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold text-[var(--text-primary)] hidden sm:block">Qualiopi SaaS</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#fonctionnalites" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Pricing</a>
            <Link href="/contact" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5">Connexion</Link>
            <Link href="/signup" className="text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-violet-600 px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">Démarrer</Link>
          </div>
        </div>
      </nav>

      <main className="pt-16">{children}</main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#060912]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
                <span className="font-bold text-[var(--text-primary)]">Qualiopi SaaS</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] leading-relaxed">Automatisez votre conformité Qualiopi en toute simplicité.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Produit</h4>
              <div className="space-y-2">
                <a href="#fonctionnalites" className="block text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">Fonctionnalités</a>
                <a href="#pricing" className="block text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">Pricing</a>
                <Link href="/demo" className="block text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">Démo</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Entreprise</h4>
              <div className="space-y-2">
                <Link href="/contact" className="block text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">Contact</Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">Légal</h4>
              <div className="space-y-2">
                <Link href="/mentions-legales" className="block text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">Mentions légales</Link>
                <Link href="/cgv" className="block text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">CGV</Link>
                <Link href="/confidentialite" className="block text-xs text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors">Confidentialité / RGPD</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-white/[0.06] mt-8 pt-6 text-center">
            <p className="text-xs text-[var(--text-dim)]">© 2026 Qualiopi SaaS — Conçu à Strasbourg</p>
          </div>
        </div>
      </footer>
    </>
  );
}
