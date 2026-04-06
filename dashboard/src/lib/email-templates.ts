type Org = Record<string, string>;

interface Button {
  label: string;
  url: string;
  color: string;
}

function btn(b: Button): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto"><tr><td align="center" bgcolor="${b.color}" style="border-radius:8px"><a href="${b.url}" target="_blank" style="display:block;width:100%;max-width:300px;padding:14px 24px;font-family:Arial,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px">${b.label}</a></td></tr></table>`;
}

function wrap(org: Org, body: string): string {
  const nom = org.nom || "Organisme de formation";
  const email = org.email || "";
  const tel = org.telephone || "";
  const addr = [org.adresse, org.code_postal, org.ville].filter(Boolean).join(" ");

  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head><body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f4f7">
<tr><td align="center" style="padding:24px 16px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;background-color:#ffffff;border-radius:12px;overflow:hidden">
<!-- Header -->
<tr><td style="background-color:#1a365d;padding:24px 32px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.5px">${nom}</td>
</tr></table>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px 32px 24px 32px;font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#333333">
${body}
</td></tr>
<!-- Footer -->
<tr><td style="background-color:#f8f9fa;padding:20px 32px;border-top:1px solid #e5e7eb">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
<td style="font-family:Arial,sans-serif;font-size:12px;color:#6b7280;line-height:1.5">
<strong>${nom}</strong><br>
${addr ? addr + "<br>" : ""}${tel ? "Tél : " + tel + "<br>" : ""}${email ? "Email : " + email : ""}
</td>
</tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function sessionInfo(session: Record<string, string>, formation: Record<string, string>): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fa;border-radius:8px;margin:16px 0">
<tr><td style="padding:16px;font-family:Arial,sans-serif;font-size:13px;color:#333">
<strong>Formation :</strong> ${formation.intitule || "—"}<br>
<strong>Dates :</strong> ${session.date_debut || "—"} au ${session.date_fin || "—"}<br>
<strong>Lieu :</strong> ${session.lieu || "—"}<br>
<strong>Durée :</strong> ${formation.duree_heures || "—"} heures
</td></tr></table>`;
}

function greeting(prenom: string, nom: string): string {
  return `<p style="margin:0 0 16px 0">Bonjour ${prenom} ${nom},</p>`;
}

function closing(orgName: string): string {
  return `<p style="margin:16px 0 0 0">Cordialement,<br><strong>${orgName}</strong></p>`;
}

function accessibility(org: Org): string {
  const nom = org.referent_handicap_nom || "";
  const email = org.referent_handicap_email || "";
  if (!nom && !email) {
    return `<p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px"><strong>Accessibilité handicap :</strong> pour toute demande spécifique liée à une situation de handicap, contactez notre référent handicap. Nous étudierons avec vous les adaptations possibles.</p>`;
  }
  return `<p style="margin:16px 0 0 0;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px"><strong>Accessibilité handicap :</strong> pour toute demande spécifique liée à une situation de handicap, contactez ${nom}${email ? ` à <a href="mailto:${email}" style="color:#6366f1">${email}</a>` : ""}.</p>`;
}

// ═══════════════════════════════════════
// W0 — Convocation
// ═══════════════════════════════════════
export function w0Convocation(org: Org, formation: Record<string, string>, session: Record<string, string>, inscrit: Record<string, string>): string {
  return wrap(org, `
${greeting(inscrit.prenom || "", inscrit.nom || "")}
<p style="margin:0 0 8px 0">Veuillez trouver ci-joint votre <strong>convocation</strong> pour la formation ci-dessous :</p>
${sessionInfo(session, formation)}
<p style="margin:8px 0 0 0;font-size:13px;color:#6b7280">La convocation est également disponible en pièce jointe au format PDF.</p>
${closing(org.nom || "")}
${accessibility(org)}
`);
}

// ═══════════════════════════════════════
// W1 — Positionnement
// ═══════════════════════════════════════
export function w1Positionnement(org: Org, formation: Record<string, string>, session: Record<string, string>, prenom: string, nom: string, formUrl: string): string {
  return wrap(org, `
${greeting(prenom, nom)}
<p style="margin:0 0 8px 0">Avant votre formation, nous vous invitons à compléter un <strong>questionnaire de positionnement</strong>. Cela nous permettra d'adapter le contenu à votre niveau.</p>
${sessionInfo(session, formation)}
${btn({ label: "Compléter le questionnaire", url: formUrl, color: "#6366f1" })}
${closing(org.nom || "")}
${accessibility(org)}
`);
}

// ═══════════════════════════════════════
// W2 — Émargement
// ═══════════════════════════════════════
export function w2Emargement(org: Org, formation: Record<string, string>, session: Record<string, string>, prenom: string, nom: string, formUrl: string): string {
  return wrap(org, `
${greeting(prenom, nom)}
<p style="margin:0 0 8px 0">Merci de signer votre <strong>feuille d'émargement</strong> pour la formation en cours :</p>
${sessionInfo(session, formation)}
${btn({ label: "Signer l'émargement", url: formUrl, color: "#6366f1" })}
${closing(org.nom || "")}
`);
}

// ═══════════════════════════════════════
// W3 — Satisfaction + Évaluation
// ═══════════════════════════════════════
export function w3SatisfactionEval(org: Org, formation: Record<string, string>, session: Record<string, string>, prenom: string, nom: string, satUrl: string, evalUrl: string): string {
  return wrap(org, `
${greeting(prenom, nom)}
<p style="margin:0 0 8px 0">Votre formation est terminée ! Merci de prendre quelques minutes pour compléter les <strong>deux questionnaires</strong> ci-dessous :</p>
${sessionInfo(session, formation)}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0">
<tr><td align="center">
${btn({ label: "Questionnaire de satisfaction", url: satUrl, color: "#6366f1" })}
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="height:16px"></td></tr></table>
${btn({ label: "Évaluation des acquis", url: evalUrl, color: "#10b981" })}
</td></tr>
</table>
${closing(org.nom || "")}
`);
}

// ═══════════════════════════════════════
// W4 — Réclamation notification
// ═══════════════════════════════════════
export function w4Reclamation(org: Org, rec: Record<string, string>): string {
  return wrap(org, `
<p style="margin:0 0 16px 0">Une <strong>nouvelle réclamation</strong> nécessite votre attention :</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fef2f2;border-left:4px solid #ef4444;border-radius:4px;margin:16px 0">
<tr><td style="padding:16px;font-family:Arial,sans-serif;font-size:13px;color:#333">
<strong>ID :</strong> ${rec.reclamation_id || "—"}<br>
<strong>Apprenant :</strong> ${rec.apprenant_id || "—"}<br>
<strong>Objet :</strong> ${rec.objet || "—"}<br>
<strong>Description :</strong> ${rec.description || "—"}<br>
<strong>Date :</strong> ${rec.date_reclamation || "—"}
</td></tr></table>
<p style="margin:0;font-size:13px;color:#6b7280">Veuillez traiter cette réclamation dans les meilleurs délais.</p>
`);
}

// ═══════════════════════════════════════
// W4 — Rapport hebdomadaire
// ═══════════════════════════════════════
export function w4Rapport(org: Org, data: { sessionsActives: number; satMoyenne: string; tauxRecommandation: number; recOuvertes: number; tauxEmargement: number; nouvellesRec: number; date: string }): string {
  const row = (label: string, value: string, color?: string) =>
    `<tr><td style="padding:10px 16px;font-size:13px;color:#6b7280;border-bottom:1px solid #f0f0f0">${label}</td><td style="padding:10px 16px;font-size:14px;font-weight:600;color:${color || "#333"};border-bottom:1px solid #f0f0f0;text-align:right">${value}</td></tr>`;

  return wrap(org, `
<p style="margin:0 0 16px 0"><strong>Rapport qualité hebdomadaire</strong> — ${data.date}</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8f9fa;border-radius:8px;overflow:hidden;margin:16px 0">
${row("Sessions actives", String(data.sessionsActives))}
${row("Satisfaction moyenne", data.satMoyenne + "/10", parseFloat(data.satMoyenne) >= 7 ? "#10b981" : "#f59e0b")}
${row("Taux de recommandation", data.tauxRecommandation + "%")}
${row("Réclamations ouvertes", String(data.recOuvertes), data.recOuvertes > 0 ? "#ef4444" : "#10b981")}
${row("Taux d'émargement", data.tauxEmargement + "%")}
${row("Réclamations traitées cette semaine", String(data.nouvellesRec))}
</table>
`);
}

// ═══════════════════════════════════════
// W5 — Relances (3 tons)
// ═══════════════════════════════════════
export function w5Relance(org: Org, prenom: string, nom: string, typeLabel: string, formUrl: string, ton: "amical" | "ferme" | "dernier"): string {
  const bodies: Record<string, string> = {
    amical: `
${greeting(prenom, nom)}
<p style="margin:0 0 8px 0">Nous n'avons pas encore reçu votre réponse au <strong>questionnaire de ${typeLabel}</strong>. Pourriez-vous prendre quelques minutes pour le compléter ?</p>
${btn({ label: "Compléter le questionnaire", url: formUrl, color: "#6366f1" })}
<p style="margin:16px 0 0 0">Merci par avance,<br><strong>${org.nom || ""}</strong></p>
`,
    ferme: `
${greeting(prenom, nom)}
<p style="margin:0 0 8px 0">Ceci est un <strong>rappel</strong> concernant le questionnaire de <strong>${typeLabel}</strong> que nous vous avons envoyé. Votre retour est important pour la qualité de nos formations.</p>
${btn({ label: "Compléter maintenant", url: formUrl, color: "#f59e0b" })}
${closing(org.nom || "")}
`,
    dernier: `
${greeting(prenom, nom)}
<p style="margin:0 0 8px 0"><strong>Dernier rappel :</strong> nous n'avons toujours pas reçu votre réponse au questionnaire de <strong>${typeLabel}</strong>. C'est notre dernier message à ce sujet.</p>
${btn({ label: "Répondre maintenant", url: formUrl, color: "#ef4444" })}
${closing(org.nom || "")}
`,
  };
  return wrap(org, bodies[ton] || bodies.amical);
}

// ═══════════════════════════════════════
// W6 — Suivi à froid
// ═══════════════════════════════════════
export function w6SuiviFroid(org: Org, formation: Record<string, string>, session: Record<string, string>, prenom: string, nom: string, formUrl: string): string {
  return wrap(org, `
${greeting(prenom, nom)}
<p style="margin:0 0 8px 0">Cela fait quelques mois que vous avez terminé la formation ci-dessous. Nous souhaiterions recueillir votre retour sur <strong>l'impact de cette formation</strong> dans votre activité professionnelle.</p>
${sessionInfo(session, formation)}
${btn({ label: "Questionnaire de suivi à froid", url: formUrl, color: "#6366f1" })}
<p style="margin:16px 0 0 0;font-size:13px;color:#6b7280">Vous trouverez également en pièces jointes votre attestation de fin de formation et votre certificat de réalisation.</p>
${closing(org.nom || "")}
`);
}
