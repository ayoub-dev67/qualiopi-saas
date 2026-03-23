import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { AttestationPDF, CertificatRealisationPDF } from "@/lib/pdf";
import { sendEmail } from "@/lib/email";
import { w6SuiviFroid } from "@/lib/email-templates";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const errors: string[] = [];
  let processed = 0;
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://app.example.com";

  try {
    const { data: orgs } = await admin.from("organizations").select("*");

    for (const org of orgs ?? []) {
      try {
        // Read config for suivi froid delay
        const { data: configRows } = await admin
          .from("config")
          .select("*")
          .eq("org_id", org.id);
        const configMap = new Map((configRows ?? []).map((c) => [c.parametre, c.valeur]));
        const delaiSuiviFroid = parseInt(configMap.get("delai_suivi_froid") ?? "180", 10);

        // ── 1. Query sessions terminee with date_fin + delay < now ──
        const cutoffDate = new Date(Date.now() - delaiSuiviFroid * 24 * 60 * 60 * 1000)
          .toISOString()
          .substring(0, 10);

        const { data: sessions } = await admin
          .from("sessions")
          .select("*, formations(*), formateurs(*)")
          .eq("org_id", org.id)
          .eq("statut", "terminee")
          .eq("is_deleted", false)
          .lte("date_fin", cutoffDate);

        // ── 2. Check which sessions already have suivi_froid sent ──
        const { data: alreadySent } = await admin
          .from("questionnaires_envoyes")
          .select("session_id")
          .eq("org_id", org.id)
          .eq("type", "suivi_froid");
        const sentSessionIds = new Set((alreadySent ?? []).map((q) => q.session_id));

        const eligible = (sessions ?? []).filter((s) => !sentSessionIds.has(s.id));

        for (const session of eligible) {
          try {
            const formation = session.formations as Record<string, unknown>;
            const formateur = session.formateurs as Record<string, unknown>;

            // Get inscriptions for this session
            const { data: inscriptions } = await admin
              .from("inscriptions")
              .select("*, apprenants(*)")
              .eq("session_id", session.id)
              .eq("is_deleted", false);

            const orgData: Record<string, string> = {
              nom: org.nom,
              email: org.email_contact || "",
              telephone: org.telephone || "",
              adresse: org.adresse || "",
              siret: org.siret || "",
              nda: org.nda || "",
              ville: "",
            };
            const formationData: Record<string, string> = {
              intitule: (formation?.intitule as string) || "",
              duree_heures: String(formation?.duree_heures ?? ""),
              objectifs: (formation?.objectifs as string) || "",
              tarif: String(formation?.tarif ?? ""),
              prerequis: (formation?.prerequis as string) || "",
            };
            const sessionData: Record<string, string> = {
              date_debut: session.date_debut,
              date_fin: session.date_fin,
              lieu: session.lieu || "",
              modalite: session.modalite,
            };

            for (const ins of inscriptions ?? []) {
              const apprenant = ins.apprenants as Record<string, unknown> | null;
              const email = (apprenant?.email as string) || "";
              if (!email) continue;

              const prenom = (apprenant?.prenom as string) || "";
              const nom = (apprenant?.nom as string) || "";
              const entreprise = (apprenant?.entreprise as string) || "";

              const inscritData: Record<string, string> = {
                prenom,
                nom,
                entreprise,
                inscription_id: ins.ref || ins.id,
              };

              // ── 3. Generate PDFs ──
              const attestBuf = await AttestationPDF({
                organisme: orgData,
                formation: formationData,
                session: sessionData,
                inscrit: inscritData,
              });
              const certBuf = await CertificatRealisationPDF({
                organisme: orgData,
                formation: formationData,
                session: sessionData,
                inscrit: inscritData,
              });

              // Upload to Supabase Storage
              const attestPath = `${org.id}/${session.id}/attestation_${ins.id}.pdf`;
              const certPath = `${org.id}/${session.id}/certificat_${ins.id}.pdf`;

              await admin.storage.from("documents").upload(attestPath, attestBuf, {
                contentType: "application/pdf",
                upsert: true,
              });
              await admin.storage.from("documents").upload(certPath, certBuf, {
                contentType: "application/pdf",
                upsert: true,
              });

              // Record documents in DB
              await admin.from("documents").insert([
                {
                  org_id: org.id,
                  session_id: session.id,
                  inscription_id: ins.id,
                  type: "attestation",
                  nom_fichier: `Attestation_${ins.ref || ins.id}.pdf`,
                  storage_path: attestPath,
                },
                {
                  org_id: org.id,
                  session_id: session.id,
                  inscription_id: ins.id,
                  type: "certificat_realisation",
                  nom_fichier: `Certificat_${ins.ref || ins.id}.pdf`,
                  storage_path: certPath,
                },
              ]);

              // ── 4. Create questionnaire entry with token and send email ──
              const token = crypto.randomUUID();
              const formUrl = `${BASE_URL}/forms/suivi_froid?token=${token}`;

              await sendEmail(
                email,
                `Suivi a froid & Documents - ${(formation?.intitule as string) || "Formation"}`,
                w6SuiviFroid(orgData, formationData, sessionData, prenom, nom, formUrl),
                [
                  { filename: `Attestation_${ins.ref || ins.id}.pdf`, content: attestBuf },
                  { filename: `Certificat_${ins.ref || ins.id}.pdf`, content: certBuf },
                ]
              );

              await admin.from("questionnaires_envoyes").insert({
                org_id: org.id,
                inscription_id: ins.id,
                session_id: session.id,
                type: "suivi_froid",
                statut: "envoye",
                date_envoi: new Date().toISOString().substring(0, 10),
                nb_relances: 0,
                token,
              });
            }

            // ── 5. Log journal ──
            await admin.from("journal_systeme").insert({
              org_id: org.id,
              workflow: "W6",
              session_id: session.id,
              session_ref: session.ref,
              statut: "OK",
              message: `Suivi a froid envoye a ${(inscriptions ?? []).length} apprenant(s), attestations et certificats generes`,
            });
            processed++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`${session.id}: ${msg}`);
            await admin.from("journal_systeme").insert({
              org_id: org.id,
              workflow: "W6",
              session_id: session.id,
              session_ref: session.ref,
              statut: "ERROR",
              message: msg,
            }).then(() => {}, () => {});
          }
        }
      } catch (err) {
        errors.push(`Org ${org.id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
