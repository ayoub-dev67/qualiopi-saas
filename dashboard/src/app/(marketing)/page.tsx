import Link from "next/link";
import { ShieldCheck, FileText, UserCheck, Star, Bell, Clock, Zap, Table, Shield, Check, X, ChevronDown, Minus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Qualiopi SaaS — Automatisez votre conformité Qualiopi",
  description: "Le seul outil de conformité Qualiopi conçu pour les formateurs indépendants. Score temps réel, documents automatiques, 29€/mois.",
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border border-indigo-500/30 bg-indigo-500/10 text-indigo-300">
      {children}
    </span>
  );
}

function FeatureCard({ icon: Icon, color, title, desc, badge }: { icon: any; color: string; title: string; desc: string; badge: string }) {
  return (
    <div className="glass-card p-6 rounded-2xl hover:border-white/[0.12] transition-all group">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}15` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{desc}</p>
      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-[var(--text-dim)]">{badge}</span>
    </div>
  );
}

function Step({ num, title, desc, icon: Icon }: { num: number; title: string; desc: string; icon: any }) {
  return (
    <div className="flex flex-col items-center text-center flex-1">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
        <Icon size={24} className="text-white" />
      </div>
      <span className="text-xs font-bold text-indigo-400 mb-1">ÉTAPE {num}</span>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xs">{desc}</p>
    </div>
  );
}

function Testimonial({ name, role, quote, stars }: { name: string; role: string; quote: string; stars: number }) {
  const initials = name.split(" ").map(n => n[0]).join("");
  return (
    <div className="glass-card p-6 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">{initials}</div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{name}</p>
          <p className="text-xs text-[var(--text-dim)]">{role}</p>
        </div>
      </div>
      <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed mb-3">&ldquo;{quote}&rdquo;</p>
      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} className={i < stars ? "text-amber-400 fill-amber-400" : "text-slate-700"} />)}</div>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="group glass-card rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between p-5 cursor-pointer text-sm font-medium text-[var(--text-primary)] hover:bg-white/[0.02] transition-colors list-none [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown size={16} className="text-[var(--text-dim)] transition-transform group-open:rotate-180 shrink-0 ml-4" />
      </summary>
      <div className="px-5 pb-5 text-sm text-[var(--text-secondary)] leading-relaxed">{a}</div>
    </details>
  );
}

const comparisons = [
  { label: "Prix", us: "29€/mois fixe", them: "49–350€/mois", usWin: true },
  { label: "Mise en place", us: "1 heure", them: "3–6 mois", usWin: true },
  { label: "Propriété données", us: "Google Drive (vous)", them: "Serveurs Digiforma", usWin: true },
  { label: "Score Qualiopi temps réel", us: "Oui", them: "Non", usWin: true },
  { label: "Documents automatiques", us: "7 types de PDF", them: "Oui", usWin: true },
  { label: "Émargement digital", us: "Google Forms", them: "Oui (+29€/mois)", usWin: true },
  { label: "LMS intégré", us: "Non", them: "Oui", usWin: false },
  { label: "CRM intégré", us: "Non", them: "Oui", usWin: false },
];

const features = [
  { icon: ShieldCheck, color: "#6366f1", title: "Score Qualiopi temps réel", desc: "7 critères, 32 indicateurs calculés automatiquement. Visualisez votre conformité d'un coup d'œil.", badge: "7 critères" },
  { icon: FileText, color: "#10b981", title: "Documents automatiques", desc: "Convention, convocation, attestation, certificat, feuille d'émargement. Générés en PDF, stockés dans Drive.", badge: "Ind. 1-8" },
  { icon: UserCheck, color: "#3b82f6", title: "Émargement digital", desc: "Feuilles de présence dématérialisées. Vos apprenants signent depuis leur smartphone.", badge: "Ind. 11-12" },
  { icon: Star, color: "#f59e0b", title: "Satisfaction & Évaluation", desc: "Questionnaires pré et post-formation envoyés automatiquement. Analyse des résultats en temps réel.", badge: "Ind. 30-31" },
  { icon: Bell, color: "#8b5cf6", title: "Relances intelligentes", desc: "3 niveaux de relance progressive. Vos apprenants n'oublient plus de répondre.", badge: "Ind. 13" },
  { icon: Clock, color: "#ec4899", title: "Suivi à 6 mois", desc: "Enquête automatique 6 mois après la formation. Attestations et certificats joints.", badge: "Ind. 32" },
];

const faqs = [
  { q: "Dois-je migrer mes données ?", a: "Non. Vous créez 3 fichiers Google Sheets depuis nos modèles, et vos données restent dans votre Google Drive. Aucune migration nécessaire." },
  { q: "Est-ce suffisant pour passer l'audit Qualiopi ?", a: "Notre outil couvre les 7 critères et 32 indicateurs du référentiel Qualiopi. Le score en temps réel vous montre exactement où vous en êtes et ce qu'il reste à compléter." },
  { q: "Comment fonctionnent les workflows automatiques ?", a: "7 automatisations tournent en arrière-plan : création de dossiers, envoi de documents, questionnaires, relances et suivi. Tout se déclenche automatiquement selon l'avancement de vos sessions." },
  { q: "Mes données sont-elles sécurisées ?", a: "Vos données restent dans votre propre Google Drive. Nous ne stockons aucune donnée personnelle sur nos serveurs. Le dashboard lit vos Sheets en temps réel." },
  { q: "Puis-je essayer gratuitement ?", a: "Oui, 14 jours d'essai gratuit sans carte bancaire. Testez toutes les fonctionnalités pendant cette période." },
  { q: "Quelle est la différence avec Digiforma ?", a: "Digiforma est un ERP complet (CRM, LMS, facturation) à 49-350€/mois. Notre outil se concentre sur la conformité Qualiopi à 29€/mois. Si vous êtes un petit OF, notre solution est faite pour vous." },
];

const essentialFeatures = [
  "Dashboard temps réel",
  "Score Qualiopi sur 32 indicateurs",
  "7 workflows automatiques",
  "Tous les documents PDF",
  "Émargement digital",
  "Emails automatiques",
  "Relances multi-niveaux",
  "Suivi à froid",
  "Google Workspace natif",
  "Apprenants illimités",
  "Support email",
];

const customFeatures = [
  "Tout du plan Essentiel",
  "Personnalisation des workflows",
  "Formation dédiée (2h)",
  "Support prioritaire",
  "Multi-organismes",
  "Intégrations sur mesure",
];

export default function LandingPage() {
  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        </div>

        <div className="max-w-4xl mx-auto text-center pt-16">
          <Badge>Nouveau — Score Qualiopi temps réel</Badge>

          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-[64px] font-extrabold leading-[1.1] tracking-tight">
            <span className="text-[var(--text-primary)]">Automatisez votre</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">conformité Qualiopi</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Le seul outil conçu pour les formateurs indépendants et petits organismes de formation. Opérationnel en 1 heure, sans migration, à partir de 29€/mois.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-transform text-center">
              Démarrer gratuitement
            </Link>
            <Link href="/demo" className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-white/[0.1] text-[var(--text-secondary)] font-medium text-sm hover:bg-white/[0.04] transition-colors text-center">
              Voir la démo →
            </Link>
          </div>

          <p className="mt-4 text-xs text-[var(--text-dim)]">✓ 14 jours gratuits · ✓ Sans carte bancaire · ✓ Données souveraines</p>
        </div>

        {/* Dashboard mock */}
        <div className="mt-12 max-w-5xl mx-auto w-full px-4" style={{ perspective: "1000px" }}>
          <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/80 shadow-2xl overflow-hidden" style={{ transform: "rotateX(5deg)" }}>
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/60" />
              <span className="ml-3 text-[10px] text-[var(--text-dim)] font-mono">qualiopi-dashboard.vercel.app</span>
            </div>
            <div className="p-6 grid grid-cols-4 gap-3">
              {[
                { label: "Sessions actives", value: "6", color: "#6366f1" },
                { label: "Apprenants", value: "34", color: "#10b981" },
                { label: "Satisfaction", value: "8.4", color: "#f59e0b" },
                { label: "Score Qualiopi", value: "87%", color: "#3b82f6" },
              ].map((k) => (
                <div key={k.label} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <p className="text-[10px] text-[var(--text-dim)]">{k.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: k.color }}>{k.value}</p>
                </div>
              ))}
              <div className="col-span-3 h-32 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-end p-4 gap-1">
                {[40, 55, 45, 70, 60, 80, 75, 90, 85, 92, 88, 95].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500/40 to-indigo-500/10" style={{ height: `${h}%` }} />
                ))}
              </div>
              <div className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-center">
                <div className="relative w-20 h-20">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="#6366f1" strokeWidth="3" strokeDasharray="97.4" strokeDashoffset="12.7" strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-400">87%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM ═══ */}
      <section className="py-20 px-4 bg-[#0a0e1a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-3">La conformité Qualiopi ne devrait pas coûter une fortune</h2>
          <p className="text-center text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">Les solutions existantes sont complexes, chères, et vous enferment.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { problem: "50 écrans complexes", solution: "1 dashboard intuitif", desc: "Digiforma demande 3 à 6 mois d'adoption. Notre outil s'utilise dès la première heure." },
              { problem: "350€/mois qui explosent", solution: "29€/mois, point final", desc: "Plus d'apprenants = plus cher. Chez nous, tarif fixe quelle que soit votre croissance." },
              { problem: "Données prisonnières", solution: "100% souverain", desc: "Vos données restent dans votre Google Drive. Exportables en 1 clic, pour toujours." },
            ].map((item) => (
              <div key={item.solution} className="glass-card p-6 rounded-2xl">
                <p className="text-sm text-red-400/80 line-through mb-1">{item.problem}</p>
                <p className="text-lg font-semibold text-emerald-400 mb-3">{item.solution}</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-12">Opérationnel en 3 étapes</h2>
          <div className="flex flex-col md:flex-row gap-8 md:gap-4">
            <Step num={1} title="Connectez Google Sheets" desc="Créez 3 fichiers Google Sheets depuis nos modèles. Vos données restent chez vous." icon={Table} />
            <div className="hidden md:flex items-center text-[var(--text-dim)]">
              <div className="w-12 border-t border-dashed border-white/[0.1]" />
            </div>
            <Step num={2} title="Activez les workflows" desc="7 automatisations prennent le relais : documents, emails, relances, tout est géré." icon={Zap} />
            <div className="hidden md:flex items-center text-[var(--text-dim)]">
              <div className="w-12 border-t border-dashed border-white/[0.1]" />
            </div>
            <Step num={3} title="Suivez votre score" desc="Votre score Qualiopi se calcule en temps réel. Vous êtes prêt pour l'audit." icon={Shield} />
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="fonctionnalites" className="py-20 px-4 bg-[#0a0e1a]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-3">Tout ce dont vous avez besoin</h2>
          <p className="text-center text-[var(--text-secondary)] mb-12 max-w-2xl mx-auto">Chaque fonctionnalité a été pensée pour les 32 indicateurs Qualiopi</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ═══ COMPARISON ═══ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-12">Qualiopi SaaS vs Digiforma</h2>
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 p-4 border-b border-white/[0.06] text-xs font-semibold">
              <span className="text-[var(--text-dim)]">Critère</span>
              <span className="text-indigo-400 text-center">Qualiopi SaaS</span>
              <span className="text-[var(--text-dim)] text-center">Digiforma</span>
            </div>
            {comparisons.map((c) => (
              <div key={c.label} className="grid grid-cols-3 p-4 border-b border-white/[0.04] text-sm items-center">
                <span className="text-[var(--text-secondary)]">{c.label}</span>
                <span className={`text-center ${c.usWin ? "text-emerald-400" : "text-[var(--text-dim)]"}`}>{c.us} {c.usWin ? "✓" : ""}</span>
                <span className={`text-center ${!c.usWin ? "text-emerald-400" : "text-[var(--text-dim)]"}`}>{c.them} {!c.usWin ? "✓" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="py-20 px-4 bg-[#0a0e1a]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-3">Un prix simple, sans surprise</h2>
          <p className="text-center text-[var(--text-secondary)] mb-12">Pas de coûts cachés, pas de tarification par apprenant</p>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Essentiel */}
            <div className="relative glass-card p-8 rounded-2xl border-indigo-500/30">
              <span className="absolute -top-3 left-6 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-violet-600 text-white rounded-full">Populaire</span>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Essentiel</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[var(--text-primary)]">29€</span>
                <span className="text-sm text-[var(--text-dim)]">/mois HT</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mt-1 line-through">vs 99–350€/mois chez les concurrents</p>
              <ul className="mt-6 space-y-2.5">
                {essentialFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Check size={14} className="text-emerald-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-8 w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold text-sm text-center block hover:opacity-90 transition-opacity">
                Commencer l&apos;essai gratuit
              </Link>
              <p className="text-center text-xs text-[var(--text-dim)] mt-2">14 jours gratuits · Sans carte bancaire</p>
            </div>
            {/* Sur mesure */}
            <div className="glass-card p-8 rounded-2xl">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">Sur mesure</h3>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-[var(--text-primary)]">Sur devis</span>
              </div>
              <p className="text-xs text-[var(--text-dim)] mt-1">Pour les besoins spécifiques</p>
              <ul className="mt-6 space-y-2.5">
                {customFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Check size={14} className="text-emerald-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/contact" className="mt-8 w-full py-3 rounded-xl border border-white/[0.1] text-[var(--text-secondary)] font-semibold text-sm text-center block hover:bg-white/[0.04] transition-colors">
                Nous contacter
              </Link>
              <p className="text-center text-xs text-[var(--text-dim)] mt-2">Réponse sous 24h</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-12">Ce que disent nos utilisateurs</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Testimonial name="Jean-Marc L." role="Formateur indépendant, Strasbourg" quote="J'ai passé mon audit Qualiopi du premier coup grâce au score en temps réel. En 2 mois, j'ai économisé plus de 15 heures d'administratif." stars={5} />
            <Testimonial name="Nathalie R." role="Directrice, Centre Formation Pro Alsace" quote="On utilisait Digiforma avant. Trop complexe, trop cher pour notre petit organisme de 5 formateurs. Ici, tout est simple et ça marche." stars={5} />
            <Testimonial name="Karim B." role="Responsable qualité, Institut Technique" quote="Le suivi des 32 indicateurs en temps réel, c'est exactement ce qui nous manquait. Les relances automatiques nous font gagner un temps fou." stars={4} />
          </div>
          <p className="text-center text-[10px] text-[var(--text-dim)] mt-6">Témoignages représentatifs de nos premiers utilisateurs</p>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="py-20 px-4 bg-[#0a0e1a]">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-[var(--text-primary)] mb-12">Questions fréquentes</h2>
          <div className="space-y-3">
            {faqs.map((f) => <FAQ key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section className="relative py-24 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/3 w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px]" />
        </div>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-4">Prêt à simplifier votre conformité Qualiopi ?</h2>
          <p className="text-[var(--text-secondary)] mb-8">Commencez en 1 heure, pas en 1 mois.</p>
          <Link href="/signup" className="inline-block px-10 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-semibold shadow-lg shadow-indigo-500/25 hover:scale-[1.02] transition-transform">
            Créer mon compte gratuitement
          </Link>
          <p className="mt-4 text-xs text-[var(--text-dim)]">14 jours d&apos;essai gratuit · Sans carte bancaire · Annulable à tout moment</p>
        </div>
      </section>
    </>
  );
}
