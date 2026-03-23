import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { uploadPDF } from "@/lib/storage";
import { ConventionPDF, ConvocationPDF } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { w0Convocation } from "@/lib/email-templates";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get all sessions needing W0, across all orgs
    const { data: sessions, error: sessErr } = await admin
      .from("sessions")
      .select("*, formations(*), formateurs(*)")
      .eq("workflow_0_ok", false)
      .eq("statut", "planifiee")
      .eq("is_deleted", false);

    if (sessErr) throw new Error(sessErr.message);
    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ success: true, processed: 0, errors: [] });
    }

    // Get org data for all relevant orgs
    const orgIds = [...new Set(sessions.map((s) => s.org_id))];
    const { data: orgs } = await admin
      .from("organizations")
      .select("*")
      .in("id", orgIds);
    const orgMap = new Map((orgs ?? []).map((o) => [o.id, o]));

    for (const session of sessions) {
      try {
        const org = orgMap.get(session.org_id);
        if (!org) throw new Error(`Organization ${session.org_id} not found`);

        const formation = session.formations;
        const formateur = session.formateurs;

        // Get inscriptions with apprenants for this session
        const { data: inscriptions } = await admin
          .from("inscriptions")
          .select("*, apprenants(*)")
          .eq("session_id", session.id)
          .eq("is_deleted", false);

        const inscrits = inscriptions ?? [];

        // Build data records for PDF generation (expects Record<string, string>)
        const orgData: Record<string, string> = {
          nom: org.nom,
          siret: org.siret ?? "",
          nda: org.nda ?? "",
          adresse: org.adresse ?? "",
          code_postal: "",
          ville: "",
          telephone: org.telephone ?? "",
          email: org.email_contact ?? "",
          representant: org.nom,
        };

        const formationData: Record<string, string> = {
          intitule: formation.intitule,
          duree_heures: String(formation.duree_heures),
          objectifs: formation.objectifs ?? "",
          prerequis: formation.prerequis ?? "",
          tarif: String(formation.tarif),
        };

        const formateurData: Record<string, string> = {
          nom: formateur.nom,
          prenom: formateur.prenom,
          email: formateur.email ?? "",
        };

        const sessionData: Record<string, string> = {
          date_debut: session.date_debut,
          date_fin: session.date_fin,
          lieu: session.lieu ?? "",
          modalite: session.modalite,
          horaires: "9h00 — 17h00",
        };

        // Generate & upload convention PDF
        const firstInscrit = inscrits[0];
        const conventionInscritData: Record<string, string> = firstInscrit
          ? {
              nom: firstInscrit.apprenants.nom,
              prenom: firstInscrit.apprenants.prenom,
              email: firstInscrit.apprenants.email ?? "",
              entreprise: firstInscrit.apprenants.entreprise ?? "",
            }
          : {};

        const conventionBuf = await ConventionPDF({
          organisme: orgData,
          formation: formationData,
          formateur: formateurData,
          session: sessionData,
          inscrit: conventionInscritData,
        });

        const conventionFileName = `Convention_${session.ref}.pdf`;
        const { path: convPath, url: convUrl } = await uploadPDF(
          session.org_id,
          session.ref,
          "convention",
          conventionFileName,
          conventionBuf
        );

        await admin.from("documents").insert({
          org_id: session.org_id,
          session_id: session.id,
          type: "convention",
          nom_fichier: conventionFileName,
          storage_path: convPath,
          public_url: convUrl,
        });

        // For each inscrit: generate convocation, upload, email
        for (const ins of inscrits) {
          const apprenant = ins.apprenants;
          const inscritData: Record<string, string> = {
            nom: apprenant.nom,
            prenom: apprenant.prenom,
            email: apprenant.email ?? "",
            entreprise: apprenant.entreprise ?? "",
            civilite: "",
          };

          const convocBuf = await ConvocationPDF({
            organisme: orgData,
            formation: formationData,
            formateur: formateurData,
            session: sessionData,
            inscrit: inscritData,
          });

          const convocFileName = `Convocation_${ins.ref}.pdf`;
          const { path: cPath, url: cUrl } = await uploadPDF(
            session.org_id,
            session.ref,
            "convocation",
            convocFileName,
            convocBuf
          );

          await admin.from("documents").insert({
            org_id: session.org_id,
            session_id: session.id,
            inscription_id: ins.id,
            type: "convocation",
            nom_fichier: convocFileName,
            storage_path: cPath,
            public_url: cUrl,
          });

          if (apprenant.email) {
            await sendEmail(
              apprenant.email,
              `Convocation — ${formation.intitule}`,
              w0Convocation(orgData, formationData, sessionData, inscritData),
              [{ filename: convocFileName, content: convocBuf }]
            );
          }
        }

        // Mark workflow_0 as done
        await admin
          .from("sessions")
          .update({ workflow_0_ok: true })
          .eq("id", session.id);

        // Journal entry
        await admin.from("journal_systeme").insert({
          org_id: session.org_id,
          workflow: "W0",
          session_id: session.id,
          session_ref: session.ref,
          statut: "OK",
          message: `Setup session terminé : ${inscrits.length} convocation(s) envoyée(s)`,
        });

        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.ref}: ${msg}`);
        await admin
          .from("journal_systeme")
          .insert({
            org_id: session.org_id,
            workflow: "W0",
            session_id: session.id,
            session_ref: session.ref,
            statut: "ERROR",
            message: msg,
          })
          .then(() => {}, () => {});
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
