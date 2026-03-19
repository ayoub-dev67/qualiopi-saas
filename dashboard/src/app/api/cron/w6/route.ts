import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getSessions, getInscriptions, getApprenants, getOrganisme, getFormations, getFormateurs, getConfig } from "@/lib/sheets";
import { updateSessionWorkflow, logJournal, appendRow } from "@/lib/sheets-write";
import { ensureSessionFolders, uploadPDF } from "@/lib/drive";
import { AttestationPDF, CertificatRealisationPDF } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";

const SHEET_02 = process.env.SHEET_02_ID!;
const FORM_SUIVI_FROID = process.env.FORM_SUIVI_FROID_ID!;
const ENTRY_INS = process.env.ENTRY_INSCRIPTION_ID!;
const ENTRY_SES = process.env.ENTRY_SESSION_ID!;

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

// Check if suivi froid was already sent for this session
async function getSuiviFroidEnvoyes(): Promise<Record<string, string>[]> {
  const API_KEY = process.env.GOOGLE_API_KEY!;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_02}/values/${encodeURIComponent("Questionnaires_Envoyes")}?key=${API_KEY}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  const rows: string[][] = data.values ?? [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1)
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ""; });
      return obj;
    })
    .filter((r) => r.type === "suivi_froid");
}

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const errors: string[] = [];
  let processed = 0;

  try {
    const [sessions, inscriptions, apprenants, organismeRows, formations, formateurs, config, suiviFroidEnvoyes] =
      await Promise.all([
        getSessions(), getInscriptions(), getApprenants(), getOrganisme(),
        getFormations(), getFormateurs(), getConfig(), getSuiviFroidEnvoyes(),
      ]);

    const organisme = organismeRows[0] ?? {};
    const delaiSuiviFroid = parseInt(config.find((c) => c.cle === "delai_suivi_froid")?.valeur ?? "180", 10);

    const sessionsAlreadySent = new Set(suiviFroidEnvoyes.map((e) => e.session_id));

    const eligible = sessions.filter((s) => {
      if (norm(s.statut ?? "") !== "terminee") return false;
      if (sessionsAlreadySent.has(s.session_id)) return false;
      const days = daysSince(s.date_fin ?? "");
      return days >= delaiSuiviFroid;
    });

    for (const session of eligible) {
      try {
        const formation = formations.find((f) => f.formation_id === session.formation_id) ?? {};
        const formateur = formateurs.find((f) => f.formateur_id === session.formateur_id) ?? {};
        const sessionInscrits = inscriptions.filter((i) => i.session_id === session.session_id);

        const folders = await ensureSessionFolders(session, formation, formateur);

        for (const ins of sessionInscrits) {
          const apprenant = apprenants.find((a) => a.apprenant_id === ins.apprenant_id) ?? {};
          const inscritData = { ...apprenant, ...ins };
          const email = inscritData.email;
          if (!email) continue;

          // Generate PDFs
          const attestBuf = await AttestationPDF({ organisme, formation, session, inscrit: inscritData });
          const certBuf = await CertificatRealisationPDF({ organisme, formation, session, inscrit: inscritData });

          await uploadPDF(`Attestation_${ins.inscription_id}.pdf`, attestBuf, folders.certificats);
          await uploadPDF(`Certificat_${ins.inscription_id}.pdf`, certBuf, folders.certificats);

          const formUrl = `https://docs.google.com/forms/d/${FORM_SUIVI_FROID}/viewform?usp=pp_url&entry.${ENTRY_INS}=${ins.inscription_id}&entry.${ENTRY_SES}=${session.session_id}`;

          await sendEmail(
            email,
            `Suivi à froid & Documents — ${formation.intitule || "Formation"}`,
            `<p>Bonjour ${inscritData.prenom || ""} ${inscritData.nom || ""},</p>
            <p>Cela fait quelques mois que vous avez terminé la formation <strong>${formation.intitule || ""}</strong>. Nous souhaiterions recueillir votre retour sur l'impact de cette formation dans votre activité professionnelle.</p>
            <p style="text-align:center;margin:20px 0">
              <a href="${formUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold">Questionnaire de suivi à froid</a>
            </p>
            <p>Vous trouverez également en pièces jointes votre attestation de fin de formation et votre certificat de réalisation.</p>
            <p>Cordialement,<br/>${organisme.nom || ""}</p>`,
            [
              { filename: `Attestation_${ins.inscription_id}.pdf`, content: attestBuf },
              { filename: `Certificat_${ins.inscription_id}.pdf`, content: certBuf },
            ]
          );

          await appendRow(SHEET_02, "Questionnaires_Envoyes", {
            inscription_id: ins.inscription_id,
            session_id: session.session_id,
            type: "suivi_froid",
            statut: "envoye",
            date_envoi: new Date().toISOString().substring(0, 10),
            nb_relances: "0",
          });
        }

        await logJournal("W6", session.session_id, "succes", `Suivi à froid envoyé à ${sessionInscrits.length} apprenant(s), attestations et certificats générés`);
        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.session_id}: ${msg}`);
        await logJournal("W6", session.session_id, "erreur", msg).catch(() => {});
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
