import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales — Qualiopi SaaS" };

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">Mentions légales</h1>

      <section className="space-y-6 text-[var(--text-secondary)] text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Éditeur du site</h2>
          <p>
            Le site Qualiopi SaaS est édité par Qualiopi SaaS.<br />
            Contact : contact@qualiopi-saas.fr
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Hébergement</h2>
          <p>
            Vercel Inc.<br />
            440 N Barranca Ave #4133<br />
            Covina, CA 91723, USA<br />
            https://vercel.com
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus présents sur ce site (textes, images, logos, vidéos) sont protégés par le droit d&apos;auteur et
            demeurent la propriété exclusive de Qualiopi SaaS ou de leurs auteurs respectifs.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Responsabilité</h2>
          <p>
            Les informations fournies sur ce site sont données à titre indicatif. Qualiopi SaaS ne peut être tenue
            responsable des erreurs ou omissions éventuelles, ni de l&apos;interprétation qui pourrait en être faite.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Contact</h2>
          <p>
            Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l&apos;adresse&nbsp;:
            contact@qualiopi-saas.fr
          </p>
        </div>
      </section>
    </div>
  );
}
