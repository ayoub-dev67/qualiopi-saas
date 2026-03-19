import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getSessions, getInscriptions, getApprenants, getOrganisme, getFormations } from "@/lib/sheets";
import { updateSessionWorkflow, logJournal, appendRow } from "@/lib/sheets-write";
import { sendEmail } from "@/lib/email";

const SHEET_02 = process.env.SHEET_02_ID!;
const FORM_SAT = process.env.FORM_SATISFACTION_ID!;
const FORM_EVAL = process.env.FORM_EVALUATION_ID!;
const ENTRY_INS = process.env.ENTRY_INSCRIPTION_ID!;
const ENTRY_SES = process.env.ENTRY_SESSION_ID!;

function isTrue(v: string | undefined) {
  const l = (v ?? "").toLowerCase();
  return l === "true" || l === "vrai";
}

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

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
      (s) => norm(s.statut ?? "") === "terminee" && !isTrue(s.workflow_3_ok)
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

          const satUrl = `https://docs.google.com/forms/d/${FORM_SAT}/viewform?usp=pp_url&entry.${ENTRY_INS}=${ins.inscription_id}&entry.${ENTRY_SES}=${session.session_id}`;
          const evalUrl = `https://docs.google.com/forms/d/${FORM_EVAL}/viewform?usp=pp_url&entry.${ENTRY_INS}=${ins.inscription_id}&entry.${ENTRY_SES}=${session.session_id}`;
          const prenom = apprenant.prenom || ins.prenom || "";
          const nom = apprenant.nom || ins.nom || "";

          await sendEmail(
            email,
            `Évaluation & Satisfaction — ${formation.intitule || "Formation"}`,
            `<p>Bonjour ${prenom} ${nom},</p>
            <p>Votre formation <strong>${formation.intitule || ""}</strong> est terminée. Merci de compléter les deux questionnaires ci-dessous :</p>
            <p style="text-align:center;margin:20px 0">
              <a href="${satUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;margin-right:10px">Questionnaire de satisfaction</a>
              <a href="${evalUrl}" style="background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Évaluation des acquis</a>
            </p>
            <p>Cordialement,<br/>${organisme.nom || ""}</p>`
          );

          const today = new Date().toISOString().substring(0, 10);
          await appendRow(SHEET_02, "Questionnaires_Envoyes", {
            inscription_id: ins.inscription_id,
            session_id: session.session_id,
            type: "satisfaction",
            statut: "envoye",
            date_envoi: today,
            nb_relances: "0",
          });
          await appendRow(SHEET_02, "Questionnaires_Envoyes", {
            inscription_id: ins.inscription_id,
            session_id: session.session_id,
            type: "evaluation",
            statut: "envoye",
            date_envoi: today,
            nb_relances: "0",
          });

          sent++;
        }

        await updateSessionWorkflow(session.session_id, "workflow_3_ok");
        await logJournal("W3", session.session_id, "succes", `Satisfaction + Évaluation envoyés à ${sent} apprenant(s)`);
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.session_id}: ${msg}`);
        await logJournal("W3", session.session_id, "erreur", msg).catch(() => {});
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
