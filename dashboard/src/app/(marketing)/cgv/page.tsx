import type { Metadata } from "next";

export const metadata: Metadata = { title: "CGV — Qualiopi SaaS" };

export default function CGVPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">Conditions générales de vente</h1>

      <section className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">1. Objet</h2>
          <p>
            Les présentes conditions générales de vente régissent les relations contractuelles entre Qualiopi SaaS et
            ses clients dans le cadre de l&apos;utilisation de la plateforme logicielle Qualiopi SaaS.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">2. Services proposés</h2>
          <p>
            Qualiopi SaaS propose un logiciel en ligne d&apos;aide à la conformité Qualiopi pour les organismes de formation :
            gestion des sessions, des bénéficiaires, génération de documents, suivi des indicateurs qualité.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">3. Prix et paiement</h2>
          <p>
            Les tarifs en vigueur sont indiqués sur la page pricing du site. L&apos;abonnement est mensuel et renouvelable
            par tacite reconduction. Le paiement s&apos;effectue par carte bancaire via Stripe.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">4. Droit de rétractation</h2>
          <p>
            Conformément aux dispositions du Code de la consommation, le client dispose d&apos;un délai de 14 jours
            pour exercer son droit de rétractation sans avoir à justifier de motifs ni à payer de pénalité.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">5. Résiliation</h2>
          <p>
            Le client peut résilier son abonnement à tout moment depuis son espace personnel. La résiliation prendra
            effet à la fin de la période d&apos;abonnement en cours.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">6. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est régi par notre politique de confidentialité. Voir la page RGPD
            pour plus de détails.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">7. Droit applicable</h2>
          <p>
            Les présentes CGV sont soumises au droit français. Tout litige relatif à leur interprétation ou à leur
            exécution relève des tribunaux compétents.
          </p>
        </div>
      </section>
    </div>
  );
}
