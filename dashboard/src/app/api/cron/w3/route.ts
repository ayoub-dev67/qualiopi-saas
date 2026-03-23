import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { w3SatisfactionEval } from "@/lib/email-templates";
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
    // Get all sessions needing W3, across all orgs
    const { data: sessions, error: sessErr } = await admin
      .from("sessions")
      .select("*, formations(*)")
      .eq("statut", "terminee")
      .eq("workflow_3_ok", false)
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

        const { data: inscriptions } = await admin
          .from("inscriptions")
          .select("*, apprenants(*)")
          .eq("session_id", session.id)
          .eq("is_deleted", false);

        const inscrits = inscriptions ?? [];
        let sent = 0;

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

        const today = new Date().toISOString().substring(0, 10);

        for (const ins of inscrits) {
          const apprenant = ins.apprenants;
          const email = apprenant.email;
          if (!email) continue;

          const satToken = randomUUID();
          const evalToken = randomUUID();

          // Insert satisfaction questionnaire
          await admin.from("questionnaires_envoyes").insert({
            org_id: session.org_id,
            inscription_id: ins.id,
            session_id: session.id,
            type: "satisfaction",
            statut: "envoye",
            date_envoi: today,
            nb_relances: 0,
            token: satToken,
          });

          // Insert evaluation questionnaire
          await admin.from("questionnaires_envoyes").insert({
            org_id: session.org_id,
            inscription_id: ins.id,
            session_id: session.id,
            type: "evaluation",
            statut: "envoye",
            date_envoi: today,
            nb_relances: 0,
            token: evalToken,
          });

          const satUrl = `${process.env.NEXT_PUBLIC_APP_URL}/forms/satisfaction?token=${satToken}`;
          const evalUrl = `${process.env.NEXT_PUBLIC_APP_URL}/forms/evaluation?token=${evalToken}`;

          await sendEmail(
            email,
            `Évaluation & Satisfaction — ${formation.intitule}`,
            w3SatisfactionEval(orgData, formationData, sessionData, apprenant.prenom, apprenant.nom, satUrl, evalUrl)
          );

          sent++;
        }

        // Mark workflow_3 as done
        await admin
          .from("sessions")
          .update({ workflow_3_ok: true })
          .eq("id", session.id);

        await admin.from("journal_systeme").insert({
          org_id: session.org_id,
          workflow: "W3",
          session_id: session.id,
          session_ref: session.ref,
          statut: "OK",
          message: `Satisfaction + Évaluation envoyés à ${sent} apprenant(s)`,
        });

        processed++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${session.ref}: ${msg}`);
        await admin
          .from("journal_systeme")
          .insert({
            org_id: session.org_id,
            workflow: "W3",
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
