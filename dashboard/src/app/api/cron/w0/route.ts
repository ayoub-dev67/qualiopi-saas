import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getSessions, getFormations, getFormateurs, getOrganisme, getInscriptions, getApprenants } from "@/lib/sheets";
import { updateSessionWorkflow, logJournal } from "@/lib/sheets-write";
import { ensureSessionFolders, uploadPDF } from "@/lib/drive";
import { ConventionPDF, ConvocationPDF } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";

function isTrue(v: string | undefined) {
  const l = (v ?? "").toLowerCase();
  return l === "true" || l === "vrai";
}

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const errors: string[] = [];
  let processed = 0;

  try {
    const [sessions, formations, formateurs, organismeRows, inscriptions, apprenants] =
      await Promise.all([
        getSessions(), getFormations(), getFormateurs(), getOrganisme(), getInscriptions(), getApprenants(),
      ]);

    const organisme = organismeRows[0] ?? {};
    const toProcess = sessions.filter(
      (s) => !isTrue(s.workflow_0_ok) && (s.statut ?? "").toLowerCase().replace(/\s/g, "_") === "planifiee"
    );

    for (const session of toProcess) {
      try {
        const formation = formations.find((f) => f.formation_id === session.formation_id) ?? {};
        const formateur = formateurs.find((f) => f.formateur_id === session.formateur_id) ?? {};
        const sessionInscrits = inscriptions.filter((i) => i.session_id === session.session_id);

        // Create Drive folders
        const folders = await ensureSessionFolders(session, formation, formateur);

        // Generate & upload convention
        const conventionBuf = await ConventionPDF({ organisme, formation, formateur, session, inscrit: sessionInscrits[0] ?? {} });
        await uploadPDF(`Convention_${session.session_id}.pdf`, conventionBuf, folders.admin);

        // For each inscrit: generate convocation, email, upload
        for (const ins of sessionInscrits) {
          const apprenant = apprenants.find((a) => a.apprenant_id === ins.apprenant_id) ?? {};
          const inscritData = { ...apprenant, ...ins };

          const convocBuf = await ConvocationPDF({ organisme, formation, formateur, session, inscrit: inscritData });
          await uploadPDF(`Convocation_${ins.inscription_id}.pdf`, convocBuf, folders.admin);

          if (inscritData.email) {
            await sendEmail(
              inscritData.email,
              `Convocation — ${formation.intitule || "Formation"}`,
              `<p>Bonjour ${inscritData.prenom || ""} ${inscritData.nom || ""},</p>
              <p>Veuillez trouver ci-joint votre convocation pour la formation <strong>${formation.intitule || ""}</strong> du ${session.date_debut || ""} au ${session.date_fin || ""}.</p>
              <p>Cordialement,<br/>${organisme.nom || ""}</p>`,
              [{ filename: `Convocation_${ins.inscription_id}.pdf`, content: convocBuf }]
            );
          }
        }

        await updateSessionWorkflow(session.session_id, "workflow_0_ok");
        await logJournal("W0", session.session_id, "succes", `Setup session terminé : ${sessionInscrits.length} convocation(s) envoyée(s)`);
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.session_id}: ${msg}`);
        await logJournal("W0", session.session_id, "erreur", msg).catch(() => {});
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
