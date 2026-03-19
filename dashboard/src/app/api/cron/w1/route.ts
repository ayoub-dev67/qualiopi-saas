import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getSessions, getInscriptions, getApprenants, getOrganisme, getFormations } from "@/lib/sheets";
import { updateSessionWorkflow, logJournal, appendRow } from "@/lib/sheets-write";
import { sendEmail } from "@/lib/email";
import { isTrue } from "@/lib/sheets-utils";

const SHEET_02 = process.env.SHEET_02_ID!;
const FORM_ID = process.env.FORM_POSITIONNEMENT_ID!;
const ENTRY_INS = process.env.ENTRY_INSCRIPTION_ID!;
const ENTRY_SES = process.env.ENTRY_SESSION_ID!;

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const errors: string[] = [];
  let processed = 0;

  try {
    const [sessions, inscriptions, apprenants, organismeRows, formations] =
      await Promise.all([getSessions(), getInscriptions(), getApprenants(), getOrganisme(), getFormations()]);

    const organisme = organismeRows[0] ?? {};
    const toProcess = sessions.filter(
      (s) => isTrue(s.workflow_0_ok) && !isTrue(s.workflow_1_ok)
    );

    for (const session of toProcess) {
      try {
        const formation = formations.find((f) => f.formation_id === session.formation_id) ?? {};
        const sessionInscrits = inscriptions.filter((i) => i.session_id === session.session_id);
        let sent = 0;

        for (const ins of sessionInscrits) {
          const apprenant = apprenants.find((a) => a.apprenant_id === ins.apprenant_id) ?? {};
          const email = apprenant.email || ins.email;
          if (!email) continue;

          const formUrl = `https://docs.google.com/forms/d/${FORM_ID}/viewform?usp=pp_url&entry.${ENTRY_INS}=${ins.inscription_id}&entry.${ENTRY_SES}=${session.session_id}`;

          await sendEmail(
            email,
            `Questionnaire de positionnement — ${formation.intitule || "Formation"}`,
            `<p>Bonjour ${apprenant.prenom || ins.prenom || ""} ${apprenant.nom || ins.nom || ""},</p>
            <p>Avant votre formation <strong>${formation.intitule || ""}</strong>, nous vous invitons à compléter un questionnaire de positionnement.</p>
            <p style="text-align:center;margin:20px 0">
              <a href="${formUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Compléter le questionnaire</a>
            </p>
            <p>Cordialement,<br/>${organisme.nom || ""}</p>`
          );

          await appendRow(SHEET_02, "Questionnaires_Envoyes", {
            inscription_id: ins.inscription_id,
            session_id: session.session_id,
            type: "positionnement",
            statut: "envoye",
            date_envoi: new Date().toISOString().substring(0, 10),
            nb_relances: "0",
          });

          sent++;
        }

        await updateSessionWorkflow(session.session_id, "workflow_1_ok");
        await logJournal("W1", session.session_id, "succes", `Positionnement envoyé à ${sent} apprenant(s)`);
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.session_id}: ${msg}`);
        await logJournal("W1", session.session_id, "erreur", msg).catch(() => {});
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
