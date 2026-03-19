import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getConfig, getOrganisme, getApprenants, getFormations, getSessions, getInscriptions } from "@/lib/sheets";
import { updateCell, logJournal } from "@/lib/sheets-write";
import { sendEmail } from "@/lib/email";

const SHEET_02 = process.env.SHEET_02_ID!;
const FORM_POSITIONNEMENT = process.env.FORM_POSITIONNEMENT_ID!;
const FORM_EMARGEMENT = process.env.FORM_EMARGEMENT_ID!;
const FORM_SATISFACTION = process.env.FORM_SATISFACTION_ID!;
const FORM_EVALUATION = process.env.FORM_EVALUATION_ID!;
const ENTRY_INS = process.env.ENTRY_INSCRIPTION_ID!;
const ENTRY_SES = process.env.ENTRY_SESSION_ID!;

const FORM_MAP: Record<string, string> = {
  positionnement: FORM_POSITIONNEMENT,
  emargement: FORM_EMARGEMENT,
  satisfaction: FORM_SATISFACTION,
  evaluation: FORM_EVALUATION,
};

// Fetch Questionnaires_Envoyes tab (not in the standard sheets.ts exports)
async function getQuestionnairesEnvoyes(): Promise<Record<string, string>[]> {
  const API_KEY = process.env.GOOGLE_API_KEY!;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_02}/values/${encodeURIComponent("Questionnaires_Envoyes")}?key=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const rows: string[][] = data.values ?? [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
    return obj;
  });
}

function daysDiff(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const errors: string[] = [];
  let processed = 0;

  try {
    const [config, organismeRows, apprenants, inscriptions, envois] =
      await Promise.all([getConfig(), getOrganisme(), getApprenants(), getInscriptions(), getQuestionnairesEnvoyes()]);

    const organisme = organismeRows[0] ?? {};
    const delai1 = parseInt(config.find((c) => c.cle === "delai_relance_1")?.valeur ?? "2", 10);
    const delai2 = parseInt(config.find((c) => c.cle === "delai_relance_2")?.valeur ?? "5", 10);
    const delai3 = parseInt(config.find((c) => c.cle === "delai_relance_3")?.valeur ?? "10", 10);

    const today = new Date().toISOString().substring(0, 10);

    // Filter envois that are pending (not completed)
    const pending = envois.filter((e) => {
      const st = e.statut ?? "";
      return ["envoye", "relance_1", "relance_2"].includes(st);
    });

    for (const envoi of pending) {
      try {
        const dateRef = envoi.date_derniere_relance || envoi.date_envoi || "";
        if (!dateRef) continue;
        const days = daysDiff(dateRef);
        const currentStatut = envoi.statut ?? "";

        let nextStatut = "";
        let delai = 0;
        let ton = "";

        if (currentStatut === "envoye" && days >= delai1) {
          nextStatut = "relance_1";
          delai = delai1;
          ton = "amical";
        } else if (currentStatut === "relance_1" && days >= delai2) {
          nextStatut = "relance_2";
          delai = delai2;
          ton = "ferme";
        } else if (currentStatut === "relance_2" && days >= delai3) {
          nextStatut = "relance_3";
          delai = delai3;
          ton = "dernier";
        }

        if (!nextStatut) continue;

        const ins = inscriptions.find((i) => i.inscription_id === envoi.inscription_id);
        const apprenant = apprenants.find((a) => a.apprenant_id === (ins?.apprenant_id ?? ""));
        const email = apprenant?.email || ins?.email;
        if (!email) continue;

        const formId = FORM_MAP[envoi.type ?? ""] || "";
        const formUrl = formId
          ? `https://docs.google.com/forms/d/${formId}/viewform?usp=pp_url&entry.${ENTRY_INS}=${envoi.inscription_id}&entry.${ENTRY_SES}=${envoi.session_id}`
          : "#";

        const prenom = apprenant?.prenom || ins?.prenom || "";
        const nom = apprenant?.nom || ins?.nom || "";
        const typeLabel = (envoi.type ?? "questionnaire").replace(/_/g, " ");

        const messages: Record<string, string> = {
          amical: `<p>Bonjour ${prenom} ${nom},</p>
            <p>Nous n'avons pas encore reçu votre réponse au questionnaire de ${typeLabel}. Pourriez-vous prendre quelques minutes pour le compléter ?</p>
            <p style="text-align:center;margin:20px 0">
              <a href="${formUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Compléter le questionnaire</a>
            </p>
            <p>Merci par avance,<br/>${organisme.nom || ""}</p>`,
          ferme: `<p>Bonjour ${prenom} ${nom},</p>
            <p>Ceci est un rappel concernant le questionnaire de ${typeLabel} que nous vous avons envoyé. Votre retour est important pour la qualité de nos formations.</p>
            <p style="text-align:center;margin:20px 0">
              <a href="${formUrl}" style="background:#f59e0b;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Compléter maintenant</a>
            </p>
            <p>Cordialement,<br/>${organisme.nom || ""}</p>`,
          dernier: `<p>Bonjour ${prenom} ${nom},</p>
            <p><strong>Dernier rappel</strong> : nous n'avons toujours pas reçu votre réponse au questionnaire de ${typeLabel}. C'est notre dernier message à ce sujet.</p>
            <p style="text-align:center;margin:20px 0">
              <a href="${formUrl}" style="background:#ef4444;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Répondre maintenant</a>
            </p>
            <p>Cordialement,<br/>${organisme.nom || ""}</p>`,
        };

        await sendEmail(
          email,
          `[Rappel] Questionnaire de ${typeLabel}`,
          messages[ton] || messages.amical
        );

        // Update the envoi row — use inscription_id + type as composite key
        // We need row-level update, so use a manual approach
        const nbRelances = parseInt(envoi.nb_relances ?? "0", 10) + 1;

        // Update statut
        await updateCell(SHEET_02, "Questionnaires_Envoyes", "inscription_id", envoi.inscription_id, "statut", nextStatut);
        await updateCell(SHEET_02, "Questionnaires_Envoyes", "inscription_id", envoi.inscription_id, "nb_relances", String(nbRelances));
        await updateCell(SHEET_02, "Questionnaires_Envoyes", "inscription_id", envoi.inscription_id, "date_derniere_relance", today);

        processed++;
      } catch (err) {
        errors.push(`${envoi.inscription_id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    await logJournal("W5", "", "succes", `Relances : ${processed} email(s) envoyé(s)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
