import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function render(element: React.ReactElement): Promise<Buffer> {
  return Buffer.from(await renderToBuffer(element as any));
}

// Common styles
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.5 },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#1a365d", paddingBottom: 10 },
  orgName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1a365d" },
  orgInfo: { fontSize: 8, color: "#555", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "center", marginVertical: 15, color: "#1a365d" },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#1a365d", borderBottomWidth: 0.5, borderBottomColor: "#ccc", paddingBottom: 3 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 160, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#333" },
  value: { flex: 1, fontSize: 9 },
  p: { fontSize: 9, marginBottom: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 7, color: "#888", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#ddd", paddingTop: 5 },
  tableHeader: { flexDirection: "row", backgroundColor: "#1a365d", padding: 5 },
  tableHeaderCell: { color: "#fff", fontSize: 8, fontFamily: "Helvetica-Bold" },
  tableRow: { flexDirection: "row", padding: 5, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  tableCell: { fontSize: 8 },
  signatureBlock: { marginTop: 30, flexDirection: "row", justifyContent: "space-between" },
  signatureBox: { width: "40%", borderTopWidth: 1, borderTopColor: "#333", paddingTop: 5 },
  signatureLabel: { fontSize: 8, textAlign: "center" },
});

type Data = Record<string, string>;

function OrgHeader({ organisme }: { organisme: Data }) {
  return React.createElement(View, { style: s.header },
    React.createElement(Text, { style: s.orgName }, organisme.nom || "Organisme de formation"),
    React.createElement(Text, { style: s.orgInfo },
      `NDA : ${organisme.nda || "—"} | SIRET : ${organisme.siret || "—"} | ${organisme.adresse || ""} ${organisme.code_postal || ""} ${organisme.ville || ""}`
    ),
    React.createElement(Text, { style: s.orgInfo },
      `Tél : ${organisme.telephone || "—"} | Email : ${organisme.email || "—"}`
    )
  );
}

function Footer({ organisme }: { organisme: Data }) {
  return React.createElement(View, { style: s.footer, fixed: true },
    React.createElement(Text, null,
      `${organisme.nom || ""} — NDA ${organisme.nda || ""} — SIRET ${organisme.siret || ""} — ${organisme.adresse || ""} ${organisme.code_postal || ""} ${organisme.ville || ""}`
    )
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return React.createElement(View, { style: s.row },
    React.createElement(Text, { style: s.label }, label),
    React.createElement(Text, { style: s.value }, value || "—")
  );
}

// ═══════════════════════════════════════
// Convention de formation
// ═══════════════════════════════════════
function ConventionDoc({ organisme, formation, formateur, session, inscrit }: {
  organisme: Data; formation: Data; formateur: Data; session: Data; inscrit: Data;
}) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: s.page },
      React.createElement(OrgHeader, { organisme }),
      React.createElement(Text, { style: s.title }, "CONVENTION DE FORMATION PROFESSIONNELLE"),
      React.createElement(Text, { style: s.p },
        `Entre l'organisme de formation ${organisme.nom || "—"}, NDA ${organisme.nda || "—"}, ci-après dénommé "l'Organisme",`
      ),
      React.createElement(Text, { style: s.p },
        `Et ${inscrit.prenom || ""} ${inscrit.nom || ""}, ${inscrit.entreprise ? `entreprise ${inscrit.entreprise}` : "participant(e)"}, ci-après dénommé(e) "le Bénéficiaire".`
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 1 — Objet"),
        React.createElement(Text, { style: s.p },
          `La présente convention a pour objet la réalisation de l'action de formation "${formation.intitule || "—"}".`
        )
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 2 — Détails de la formation"),
        React.createElement(Field, { label: "Intitulé :", value: formation.intitule || "" }),
        React.createElement(Field, { label: "Durée :", value: `${formation.duree_heures || "—"} heures` }),
        React.createElement(Field, { label: "Dates :", value: `Du ${session.date_debut || "—"} au ${session.date_fin || "—"}` }),
        React.createElement(Field, { label: "Lieu :", value: session.lieu || "—" }),
        React.createElement(Field, { label: "Modalité :", value: session.modalite || "—" }),
        React.createElement(Field, { label: "Formateur :", value: `${formateur.prenom || ""} ${formateur.nom || ""}` }),
        React.createElement(Field, { label: "Objectifs :", value: formation.objectifs || "—" }),
        React.createElement(Field, { label: "Prérequis :", value: formation.prerequis || "Aucun" })
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 3 — Coût"),
        React.createElement(Field, { label: "Tarif :", value: `${formation.tarif || "—"} € HT` })
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 4 — Modalités de règlement"),
        React.createElement(Text, { style: s.p }, "Le règlement sera effectué selon les conditions convenues entre les parties.")
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 5 — Droit de rétractation"),
        React.createElement(Text, { style: s.p },
          "Conformément à l'article L.6353-5 du Code du travail, le bénéficiaire dispose d'un délai de rétractation de 10 jours à compter de la signature de la présente convention. Passé ce délai, celle-ci devient définitive."
        )
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 6 — Modalités d'évaluation"),
        React.createElement(Text, { style: s.p },
          "L'action de formation fait l'objet d'une évaluation des acquis en fin de parcours ainsi que d'un questionnaire de satisfaction. Un bilan pédagogique sera communiqué au bénéficiaire et, le cas échéant, à son financeur."
        )
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 7 — Accessibilité et handicap"),
        React.createElement(Text, { style: s.p },
          `L'organisme s'engage à étudier toute demande spécifique liée à une situation de handicap afin de proposer les adaptations pédagogiques nécessaires. Référent handicap : ${organisme.referent_handicap_nom || "à désigner"}${organisme.referent_handicap_email ? ` (${organisme.referent_handicap_email})` : ""}.`
        )
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Article 8 — Confidentialité"),
        React.createElement(Text, { style: s.p },
          "Les parties s'engagent à garder confidentielles les informations échangées dans le cadre de la présente convention et à respecter la réglementation en vigueur concernant la protection des données personnelles (RGPD)."
        )
      ),
      React.createElement(Text, { style: { ...s.p, marginTop: 8, fontStyle: "italic" } },
        "Document établi en deux exemplaires originaux."
      ),
      React.createElement(View, { style: s.signatureBlock },
        React.createElement(View, { style: s.signatureBox },
          React.createElement(Text, { style: s.signatureLabel }, "L'Organisme de formation"),
          React.createElement(Text, { style: { ...s.signatureLabel, marginTop: 30 } }, `Date : ${new Date().toLocaleDateString("fr-FR")}`)
        ),
        React.createElement(View, { style: s.signatureBox },
          React.createElement(Text, { style: s.signatureLabel }, "Le Bénéficiaire"),
          React.createElement(Text, { style: { ...s.signatureLabel, marginTop: 30 } }, `Date : ${new Date().toLocaleDateString("fr-FR")}`)
        )
      ),
      React.createElement(Footer, { organisme })
    )
  );
}

export async function ConventionPDF(data: {
  organisme: Data; formation: Data; formateur: Data; session: Data; inscrit: Data;
}): Promise<Buffer> {
  return render(React.createElement(ConventionDoc, data));
}

// ═══════════════════════════════════════
// Convocation
// ═══════════════════════════════════════
function ConvocationDoc({ organisme, formation, formateur, session, inscrit }: {
  organisme: Data; formation: Data; formateur: Data; session: Data; inscrit: Data;
}) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: s.page },
      React.createElement(OrgHeader, { organisme }),
      React.createElement(Text, { style: s.title }, "CONVOCATION À UNE ACTION DE FORMATION"),
      React.createElement(Text, { style: { ...s.p, marginBottom: 15 } },
        `${inscrit.civilite === "Mme" ? "Madame" : "Monsieur"} ${inscrit.prenom || ""} ${inscrit.nom || ""},`
      ),
      React.createElement(Text, { style: s.p },
        `Nous avons le plaisir de vous confirmer votre inscription à la formation "${formation.intitule || "—"}".`
      ),
      React.createElement(Text, { style: s.p }, "Vous trouverez ci-dessous les informations pratiques :"),
      React.createElement(View, { style: { ...s.section, marginTop: 15 } },
        React.createElement(Field, { label: "Formation :", value: formation.intitule || "" }),
        React.createElement(Field, { label: "Dates :", value: `Du ${session.date_debut || "—"} au ${session.date_fin || "—"}` }),
        React.createElement(Field, { label: "Horaires :", value: session.horaires || "9h00 — 17h00" }),
        React.createElement(Field, { label: "Lieu :", value: session.lieu || "—" }),
        React.createElement(Field, { label: "Modalité :", value: session.modalite || "Présentiel" }),
        React.createElement(Field, { label: "Formateur :", value: `${formateur.prenom || ""} ${formateur.nom || ""}` }),
        React.createElement(Field, { label: "Durée :", value: `${formation.duree_heures || "—"} heures` })
      ),
      React.createElement(Text, { style: { ...s.p, marginTop: 15 } },
        "Merci de vous présenter muni(e) d'une pièce d'identité. En cas d'empêchement, veuillez nous prévenir dans les meilleurs délais."
      ),
      React.createElement(Text, { style: { ...s.p, marginTop: 20 } }, "Cordialement,"),
      React.createElement(Text, { style: { ...s.p, fontFamily: "Helvetica-Bold" } }, organisme.nom || ""),
      React.createElement(View, { style: { ...s.section, marginTop: 20, paddingTop: 8, borderTopWidth: 0.5, borderTopColor: "#ccc" } },
        React.createElement(Text, { style: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#1a365d", marginBottom: 3 } }, "Accessibilité PMR et handicap"),
        React.createElement(Text, { style: { fontSize: 8, color: "#555" } },
          `Pour toute demande spécifique liée à une situation de handicap, contactez ${organisme.referent_handicap_nom || "notre référent handicap"}${organisme.referent_handicap_email ? ` à ${organisme.referent_handicap_email}` : ""}. Nous étudierons avec vous les adaptations possibles.`
        )
      ),
      React.createElement(Footer, { organisme })
    )
  );
}

export async function ConvocationPDF(data: {
  organisme: Data; formation: Data; formateur: Data; session: Data; inscrit: Data;
}): Promise<Buffer> {
  return render(React.createElement(ConvocationDoc, data));
}

// ═══════════════════════════════════════
// Feuille d'émargement
// ═══════════════════════════════════════
function EmargementDoc({ organisme, formation, session, inscrits, emargements }: {
  organisme: Data; formation: Data; session: Data; inscrits: Data[]; emargements: Data[];
}) {
  const emargMap = new Map(emargements.map((e) => [e.inscription_id, e]));
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: s.page },
      React.createElement(OrgHeader, { organisme }),
      React.createElement(Text, { style: s.title }, "FEUILLE D'ÉMARGEMENT"),
      React.createElement(View, { style: s.section },
        React.createElement(Field, { label: "Formation :", value: formation.intitule || "" }),
        React.createElement(Field, { label: "Dates :", value: `Du ${session.date_debut || "—"} au ${session.date_fin || "—"}` }),
        React.createElement(Field, { label: "Lieu :", value: session.lieu || "—" })
      ),
      // Table header
      React.createElement(View, { style: s.tableHeader },
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "5%" } }, "#"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "25%" } }, "Nom"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "25%" } }, "Prénom"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "15%" } }, "Matin"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "15%" } }, "Après-midi"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "15%" } }, "Signature")
      ),
      // Table rows
      ...inscrits.map((ins, i) => {
        const em = emargMap.get(ins.inscription_id);
        return React.createElement(View, { key: i, style: s.tableRow },
          React.createElement(Text, { style: { ...s.tableCell, width: "5%" } }, String(i + 1)),
          React.createElement(Text, { style: { ...s.tableCell, width: "25%" } }, ins.nom || ""),
          React.createElement(Text, { style: { ...s.tableCell, width: "25%" } }, ins.prenom || ""),
          React.createElement(Text, { style: { ...s.tableCell, width: "15%" } }, em?.matin || ""),
          React.createElement(Text, { style: { ...s.tableCell, width: "15%" } }, em?.apres_midi || ""),
          React.createElement(Text, { style: { ...s.tableCell, width: "15%" } }, "")
        );
      }),
      React.createElement(Footer, { organisme })
    )
  );
}

export async function EmargementPDF(data: {
  organisme: Data; formation: Data; session: Data; inscrits: Data[]; emargements: Data[];
}): Promise<Buffer> {
  return render(React.createElement(EmargementDoc, data));
}

// ═══════════════════════════════════════
// Attestation de fin de formation
// ═══════════════════════════════════════
function AttestationDoc({ organisme, formation, session, inscrit }: {
  organisme: Data; formation: Data; session: Data; inscrit: Data;
}) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: s.page },
      React.createElement(OrgHeader, { organisme }),
      React.createElement(Text, { style: s.title }, "ATTESTATION DE FIN DE FORMATION"),
      React.createElement(Text, { style: s.p },
        `Je soussigné(e), ${organisme.representant || organisme.nom || "—"}, responsable de l'organisme de formation ${organisme.nom || "—"}, atteste que :`
      ),
      React.createElement(View, { style: { ...s.section, marginTop: 15 } },
        React.createElement(Field, { label: "Participant(e) :", value: `${inscrit.prenom || ""} ${inscrit.nom || ""}` }),
        React.createElement(Field, { label: "Entreprise :", value: inscrit.entreprise || "—" }),
        React.createElement(Field, { label: "Formation :", value: formation.intitule || "" }),
        React.createElement(Field, { label: "Durée :", value: `${formation.duree_heures || "—"} heures` }),
        React.createElement(Field, { label: "Dates :", value: `Du ${session.date_debut || "—"} au ${session.date_fin || "—"}` }),
        React.createElement(Field, { label: "Lieu :", value: session.lieu || "—" })
      ),
      React.createElement(Text, { style: { ...s.p, marginTop: 10 } },
        "a bien suivi l'intégralité de l'action de formation mentionnée ci-dessus."
      ),
      React.createElement(Text, { style: { ...s.p, marginTop: 5 } },
        `Fait à ${organisme.ville || "—"}, le ${new Date().toLocaleDateString("fr-FR")}`
      ),
      React.createElement(View, { style: { marginTop: 40 } },
        React.createElement(Text, { style: { fontSize: 9, fontFamily: "Helvetica-Bold" } }, organisme.representant || organisme.nom || ""),
        React.createElement(Text, { style: { fontSize: 8, color: "#555" } }, "Signature et cachet")
      ),
      React.createElement(Footer, { organisme })
    )
  );
}

export async function AttestationPDF(data: {
  organisme: Data; formation: Data; session: Data; inscrit: Data;
}): Promise<Buffer> {
  return render(React.createElement(AttestationDoc, data));
}

// ═══════════════════════════════════════
// Certificat de réalisation
// ═══════════════════════════════════════
function CertificatRealisationDoc({ organisme, formation, session, inscrit }: {
  organisme: Data; formation: Data; session: Data; inscrit: Data;
}) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: s.page },
      React.createElement(OrgHeader, { organisme }),
      React.createElement(Text, { style: s.title }, "CERTIFICAT DE RÉALISATION"),
      React.createElement(Text, { style: { ...s.p, fontSize: 8, textAlign: "center", marginBottom: 15, color: "#666" } },
        "Prévu par l'article L.6353-1 du Code du travail"
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Organisme de formation"),
        React.createElement(Field, { label: "Raison sociale :", value: organisme.nom || "" }),
        React.createElement(Field, { label: "NDA :", value: organisme.nda || "" }),
        React.createElement(Field, { label: "SIRET :", value: organisme.siret || "" })
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Bénéficiaire"),
        React.createElement(Field, { label: "Nom :", value: `${inscrit.prenom || ""} ${inscrit.nom || ""}` }),
        React.createElement(Field, { label: "Entreprise :", value: inscrit.entreprise || "—" })
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Action de formation"),
        React.createElement(Field, { label: "Intitulé :", value: formation.intitule || "" }),
        React.createElement(Field, { label: "Type d'action :", value: "Action de formation continue (article L.6313-1 du Code du travail)" }),
        React.createElement(Field, { label: "Objectifs :", value: formation.objectifs || "" }),
        React.createElement(Field, { label: "Durée :", value: `${formation.duree_heures || "—"} heures` }),
        React.createElement(Field, { label: "Modalité :", value: session.modalite || "" }),
        React.createElement(Field, { label: "Dates :", value: `Du ${session.date_debut || "—"} au ${session.date_fin || "—"}` }),
        React.createElement(Field, { label: "Lieu :", value: session.lieu || "—" })
      ),
      React.createElement(Text, { style: { ...s.p, marginTop: 10 } },
        "Je soussigné(e) certifie que l'action de formation décrite ci-dessus a été réalisée."
      ),
      React.createElement(Text, { style: { ...s.p, marginTop: 5 } },
        `Fait à ${organisme.ville || "—"}, le ${new Date().toLocaleDateString("fr-FR")}`
      ),
      React.createElement(View, { style: s.signatureBlock },
        React.createElement(View, { style: s.signatureBox },
          React.createElement(Text, { style: s.signatureLabel }, "L'Organisme de formation"),
          React.createElement(Text, { style: { ...s.signatureLabel, marginTop: 25 } }, "Signature et cachet")
        ),
        React.createElement(View, { style: s.signatureBox },
          React.createElement(Text, { style: s.signatureLabel }, "Le Financeur / Employeur"),
          React.createElement(Text, { style: { ...s.signatureLabel, marginTop: 25 } }, "Signature et cachet")
        )
      ),
      React.createElement(Footer, { organisme })
    )
  );
}

export async function CertificatRealisationPDF(data: {
  organisme: Data; formation: Data; session: Data; inscrit: Data;
}): Promise<Buffer> {
  return render(React.createElement(CertificatRealisationDoc, data));
}

// ═══════════════════════════════════════
// Évaluation des acquis
// ═══════════════════════════════════════
function EvaluationDoc({ formation, session, inscrit, evaluations }: {
  formation: Data; session: Data; inscrit: Data; evaluations: Data[];
}) {
  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: s.page },
      React.createElement(Text, { style: s.title }, "ÉVALUATION DES ACQUIS"),
      React.createElement(View, { style: s.section },
        React.createElement(Field, { label: "Formation :", value: formation.intitule || "" }),
        React.createElement(Field, { label: "Session :", value: `${session.date_debut || ""} — ${session.date_fin || ""}` }),
        React.createElement(Field, { label: "Participant(e) :", value: `${inscrit.prenom || ""} ${inscrit.nom || ""}` })
      ),
      React.createElement(View, { style: s.tableHeader },
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "40%" } }, "Compétence"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "20%" } }, "Avant"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "20%" } }, "Après"),
        React.createElement(Text, { style: { ...s.tableHeaderCell, width: "20%" } }, "Progression")
      ),
      ...evaluations.map((ev, i) =>
        React.createElement(View, { key: i, style: s.tableRow },
          React.createElement(Text, { style: { ...s.tableCell, width: "40%" } }, ev.competence || ""),
          React.createElement(Text, { style: { ...s.tableCell, width: "20%" } }, ev.note_avant || ""),
          React.createElement(Text, { style: { ...s.tableCell, width: "20%" } }, ev.note_apres || ""),
          React.createElement(Text, { style: { ...s.tableCell, width: "20%" } }, ev.progression || "")
        )
      )
    )
  );
}

export async function EvaluationPDF(data: {
  formation: Data; session: Data; inscrit: Data; evaluations: Data[];
}): Promise<Buffer> {
  return render(React.createElement(EvaluationDoc, data));
}

// ═══════════════════════════════════════
// PV Satisfaction
// ═══════════════════════════════════════
function SatisfactionDoc({ formation, session, satisfaction }: {
  formation: Data; session: Data; satisfaction: Data[];
}) {
  const notes = satisfaction.map((s) => parseFloat(s.note_globale)).filter((n) => !isNaN(n));
  const avg = notes.length > 0 ? (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1) : "N/A";
  const verbatims = satisfaction.map((s) => s.commentaire).filter((c) => c && c.trim());

  return React.createElement(Document, null,
    React.createElement(Page, { size: "A4", style: s.page },
      React.createElement(Text, { style: s.title }, "PROCÈS-VERBAL DE SATISFACTION"),
      React.createElement(View, { style: s.section },
        React.createElement(Field, { label: "Formation :", value: formation.intitule || "" }),
        React.createElement(Field, { label: "Session :", value: `${session.date_debut || ""} — ${session.date_fin || ""}` }),
        React.createElement(Field, { label: "Nombre de réponses :", value: String(satisfaction.length) }),
        React.createElement(Field, { label: "Note globale moyenne :", value: `${avg}/10` })
      ),
      React.createElement(View, { style: s.section },
        React.createElement(Text, { style: s.sectionTitle }, "Détail par catégorie"),
        ...["note_contenu", "note_formateur", "note_organisation"].map((key) => {
          const vals = satisfaction.map((s) => parseFloat(s[key])).filter((n) => !isNaN(n));
          const catAvg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "N/A";
          const label = key.replace("note_", "").charAt(0).toUpperCase() + key.replace("note_", "").slice(1);
          return React.createElement(Field, { key, label: `${label} :`, value: `${catAvg}/10` });
        })
      ),
      verbatims.length > 0
        ? React.createElement(View, { style: s.section },
            React.createElement(Text, { style: s.sectionTitle }, "Verbatims"),
            ...verbatims.map((v, i) =>
              React.createElement(Text, { key: i, style: { ...s.p, fontStyle: "italic" } }, `« ${v} »`)
            )
          )
        : null
    )
  );
}

export async function SatisfactionPDF(data: {
  formation: Data; session: Data; satisfaction: Data[];
}): Promise<Buffer> {
  return render(React.createElement(SatisfactionDoc, data));
}
