import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { uploadPDF } from "@/lib/storage";
import { EmargementPDF } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { w2Emargement } from "@/lib/email-templates";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get all sessions needing W2, across all orgs
    const { data: sessions, error: sessErr } = await admin
      .from("sessions")
      .select("*, formations(*), formateurs(*)")
      .eq("statut", "en_cours")
      .eq("workflow_2_ok", false)
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

        const { data: inscriptions } = await admin
          .from("inscriptions")
          .select("*, apprenants(*)")
          .eq("session_id", session.id)
          .eq("is_deleted", false);

        const inscrits = inscriptions ?? [];

        const orgData: Record<string, string> = {
          nom: org.nom,
          siret: org.siret ?? "",
          nda: org.nda ?? "",
          adresse: org.adresse ?? "",
          code_postal: "",
          ville: "",
          telephone: org.telephone ?? "",
          email: org.email_contact ?? "",
        };

        const formationData: Record<string, string> = {
          intitule: formation.intitule,
          duree_heures: String(formation.duree_heures),
          objectifs: formation.objectifs ?? "",
        };

        const sessionData: Record<string, string> = {
          date_debut: session.date_debut,
          date_fin: session.date_fin,
          lieu: session.lieu ?? "",
          modalite: session.modalite,
        };

        // Send emargement form link to each inscrit
        for (const ins of inscrits) {
          const apprenant = ins.apprenants;
          const email = apprenant.email;
          if (!email) continue;

          const token = randomUUID();

          await admin.from("questionnaires_envoyes").insert({
            org_id: session.org_id,
            inscription_id: ins.id,
            session_id: session.id,
            type: "emargement",
            statut: "envoye",
            date_envoi: new Date().toISOString().substring(0, 10),
            nb_relances: 0,
            token,
          });

          const formUrl = `${process.env.NEXT_PUBLIC_APP_URL}/forms/emargement?token=${token}`;

          await sendEmail(
            email,
            `Émargement — ${formation.intitule}`,
            w2Emargement(orgData, formationData, sessionData, apprenant.prenom, apprenant.nom, formUrl)
          );
        }

        // Generate emargement PDF
        const { data: emargements } = await admin
          .from("emargements")
          .select("*")
          .eq("session_id", session.id);

        const inscritsData: Record<string, string>[] = inscrits.map((ins) => ({
          inscription_id: ins.id,
          nom: ins.apprenants.nom,
          prenom: ins.apprenants.prenom,
          email: ins.apprenants.email ?? "",
        }));

        const emargementsData: Record<string, string>[] = (emargements ?? []).map((e) => ({
          inscription_id: e.inscription_id,
          matin: e.demi_journee === "matin" && e.present ? "Présent" : "",
          apres_midi: e.demi_journee === "apres_midi" && e.present ? "Présent" : "",
        }));

        const pdfBuf = await EmargementPDF({
          organisme: orgData,
          formation: formationData,
          session: sessionData,
          inscrits: inscritsData,
          emargements: emargementsData,
        });

        const emargFileName = `Emargement_${session.ref}.pdf`;
        const { path, url } = await uploadPDF(
          session.org_id,
          session.ref,
          "emargement",
          emargFileName,
          pdfBuf
        );

        await admin.from("documents").insert({
          org_id: session.org_id,
          session_id: session.id,
          type: "emargement",
          nom_fichier: emargFileName,
          storage_path: path,
          public_url: url,
        });

        // Mark workflow_2 as done
        await admin
          .from("sessions")
          .update({ workflow_2_ok: true })
          .eq("id", session.id);

        await admin.from("journal_systeme").insert({
          org_id: session.org_id,
          workflow: "W2",
          session_id: session.id,
          session_ref: session.ref,
          statut: "OK",
          message: `Émargement envoyé à ${inscrits.length} apprenant(s), PDF généré`,
        });

        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.ref}: ${msg}`);
        await admin
          .from("journal_systeme")
          .insert({
            org_id: session.org_id,
            workflow: "W2",
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
