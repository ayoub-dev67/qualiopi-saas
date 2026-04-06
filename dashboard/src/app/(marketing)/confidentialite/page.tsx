import type { Metadata } from "next";

export const metadata: Metadata = { title: "Confidentialité / RGPD — Qualiopi SaaS" };

export default function ConfidentialitePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">Politique de confidentialité (RGPD)</h1>

      <section className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Responsable du traitement</h2>
          <p>
            Qualiopi SaaS est responsable du traitement des données personnelles collectées via sa plateforme.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Données collectées</h2>
          <p>
            Dans le cadre de l&apos;utilisation du service, nous collectons : identifiants de compte (email, nom), données
            d&apos;organisme (SIRET, NDA, adresse), données des bénéficiaires (nom, prénom, email), données relatives aux
            formations et sessions, documents générés.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Finalités</h2>
          <p>
            Les données sont collectées pour : la fourniture du service Qualiopi SaaS, la gestion des abonnements,
            l&apos;amélioration continue du produit, le support client et le respect des obligations légales (Qualiopi,
            BPF).
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Durée de conservation</h2>
          <p>
            Les données de votre organisme et de vos bénéficiaires sont conservées aussi longtemps que votre compte est
            actif. En cas de résiliation, les données sont conservées pendant la durée légale requise puis supprimées.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Vos droits</h2>
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de portabilité,
            de limitation et d&apos;opposition au traitement de vos données. Pour exercer ces droits, contactez-nous à
            privacy@qualiopi-saas.fr.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Sous-traitants</h2>
          <p>
            Nous faisons appel à des sous-traitants (Supabase pour la base de données, Vercel pour l&apos;hébergement,
            Stripe pour le paiement, Resend pour l&apos;envoi d&apos;emails) qui respectent le RGPD.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Cookies</h2>
          <p>
            Nous utilisons uniquement des cookies fonctionnels nécessaires au bon fonctionnement de la plateforme
            (session, préférences). Aucun cookie publicitaire n&apos;est déposé.
          </p>
        </div>
      </section>
    </div>
  );
}
