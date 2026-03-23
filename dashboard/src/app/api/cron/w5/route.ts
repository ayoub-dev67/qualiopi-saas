import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { w5Relance } from "@/lib/email-templates";

function daysDiff(dateStr: string): number {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

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
    // Get all orgs
    const { data: orgs } = await admin.from("organizations").select("*");

    for (const org of orgs ?? []) {
      try {
        // ── 1. Read config for relay delays ──
        const { data: configRows } = await admin
          .from("config")
          .select("*")
          .eq("org_id", org.id);
        const configMap = new Map((configRows ?? []).map((c) => [c.parametre, c.valeur]));

        const delai1 = parseInt(configMap.get("delai_relance_1") ?? "2", 10);
        const delai2 = parseInt(configMap.get("delai_relance_2") ?? "5", 10);
        const delai3 = parseInt(configMap.get("delai_relance_3") ?? "10", 10);

        const today = new Date().toISOString().substring(0, 10);

        // ── 2. Query pending questionnaires ──
        const { data: pending } = await admin
          .from("questionnaires_envoyes")
          .select("*, inscriptions(*, apprenants(*))")
          .eq("org_id", org.id)
          .in("statut", ["envoye", "relance_1", "relance_2"]);

        for (const envoi of pending ?? []) {
          try {
            const dateRef = envoi.date_derniere_relance || envoi.date_envoi;
            if (!dateRef) continue;
            const days = daysDiff(dateRef);
            const currentStatut = envoi.statut;

            let nextStatut: "relance_1" | "relance_2" | "relance_3" | "" = "";
            let ton: "amical" | "ferme" | "dernier" = "amical";

            if (currentStatut === "envoye" && days >= delai1) {
              nextStatut = "relance_1";
              ton = "amical";
            } else if (currentStatut === "relance_1" && days >= delai2) {
              nextStatut = "relance_2";
              ton = "ferme";
            } else if (currentStatut === "relance_2" && days >= delai3) {
              nextStatut = "relance_3";
              ton = "dernier";
            }

            if (!nextStatut) continue;

            // Get apprenant email from joined data
            const inscription = envoi.inscriptions as Record<string, unknown> | null;
            const apprenant = (inscription as Record<string, unknown>)?.apprenants as Record<string, unknown> | null;
            const email = (apprenant?.email as string) || "";
            if (!email) continue;

            const prenom = (apprenant?.prenom as string) || "";
            const nom = (apprenant?.nom as string) || "";
            const typeLabel = (envoi.type ?? "questionnaire").replace(/_/g, " ");

            // ── 3. Build form URL using token ──
            const formUrl = `${BASE_URL}/forms/${envoi.type}?token=${envoi.token}`;

            await sendEmail(
              email,
              `[Rappel] Questionnaire de ${typeLabel}`,
              w5Relance(
                { nom: org.nom, email: org.email_contact || "", telephone: org.telephone || "", adresse: org.adresse || "" },
                prenom,
                nom,
                typeLabel,
                formUrl,
                ton
              )
            );

            // ── Update statut and nb_relances ──
            await admin
              .from("questionnaires_envoyes")
              .update({
                statut: nextStatut,
                nb_relances: envoi.nb_relances + 1,
                date_derniere_relance: today,
              })
              .eq("id", envoi.id);

            processed++;
          } catch (err) {
            errors.push(`${envoi.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // ── Log journal ──
        await admin.from("journal_systeme").insert({
          org_id: org.id,
          workflow: "W5",
          statut: "OK",
          message: `Relances : ${processed} email(s) envoye(s)`,
        });
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
