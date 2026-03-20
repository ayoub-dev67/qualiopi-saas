import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getSessions, getInscriptions, getApprenants, getOrganisme, getFormations, getEmargement, getFormateurs } from "@/lib/sheets";
import { updateSessionWorkflow, logJournal, appendRow } from "@/lib/sheets-write";
import { ensureSessionFolders, uploadPDF } from "@/lib/drive";
import { EmargementPDF } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { isTrue } from "@/lib/sheets-utils";
import { w2Emargement } from "@/lib/email-templates";

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const SHEET_02 = process.env.SHEET_02_ID!;
  const FORM_ID = process.env.FORM_EMARGEMENT_ID!;
  const ENTRY_INS = process.env.ENTRY_INSCRIPTION_ID!;
  const ENTRY_SES = process.env.ENTRY_SESSION_ID!;

  const errors: string[] = [];
  let processed = 0;

  try {
    const [sessions, inscriptions, apprenants, organismeRows, formations, formateurs, emargements] =
      await Promise.all([
        getSessions(), getInscriptions(), getApprenants(), getOrganisme(),
        getFormations(), getFormateurs(), getEmargement(),
      ]);

    const organisme = organismeRows[0] ?? {};
    const toProcess = sessions.filter(
      (s) => norm(s.statut ?? "") === "en_cours" && !isTrue(s.workflow_2_ok)
    );

    for (const session of toProcess) {
      try {
        const formation = formations.find((f) => f.formation_id === session.formation_id) ?? {};
        const formateur = formateurs.find((f) => f.formateur_id === session.formateur_id) ?? {};
        const sessionInscrits = inscriptions.filter((i) => i.session_id === session.session_id);

        // Send emargement form to each inscrit
        for (const ins of sessionInscrits) {
          const apprenant = apprenants.find((a) => a.apprenant_id === ins.apprenant_id) ?? {};
          const email = apprenant.email || ins.email;
          if (!email) continue;

          const formUrl = `https://docs.google.com/forms/d/${FORM_ID}/viewform?usp=pp_url&entry.${ENTRY_INS}=${ins.inscription_id}&entry.${ENTRY_SES}=${session.session_id}`;

          await sendEmail(
            email,
            `Émargement — ${formation.intitule || "Formation"}`,
            w2Emargement(organisme, formation, session, apprenant.prenom || "", apprenant.nom || "", formUrl)
          );

          await appendRow(SHEET_02, "Questionnaires_Envoyes", {
            inscription_id: ins.inscription_id,
            session_id: session.session_id,
            type: "emargement",
            statut: "envoye",
            date_envoi: new Date().toISOString().substring(0, 10),
            nb_relances: "0",
          });
        }

        // Generate emargement PDF
        const sessionEmargements = emargements.filter((e) => e.session_id === session.session_id);
        const inscritsData = sessionInscrits.map((ins) => {
          const app = apprenants.find((a) => a.apprenant_id === ins.apprenant_id) ?? {};
          return { ...app, ...ins };
        });

        const folders = await ensureSessionFolders(session, formation, formateur);
        const pdfBuf = await EmargementPDF({
          organisme, formation, session, inscrits: inscritsData, emargements: sessionEmargements,
        });
        await uploadPDF(`Emargement_${session.session_id}.pdf`, pdfBuf, folders.emargement);

        await updateSessionWorkflow(session.session_id, "workflow_2_ok");
        await logJournal("W2", session.session_id, "succes", `Émargement envoyé à ${sessionInscrits.length} apprenant(s), PDF généré`);
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.session_id}: ${msg}`);
        await logJournal("W2", session.session_id, "erreur", msg).catch(() => {});
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
