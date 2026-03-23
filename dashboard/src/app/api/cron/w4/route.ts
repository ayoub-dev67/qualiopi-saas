import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { w4Reclamation, w4Rapport } from "@/lib/email-templates";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const errors: string[] = [];
  let processed = 0;

  try {
    // Get all orgs to process
    const { data: orgs } = await admin.from("organizations").select("*");
    if (!orgs || orgs.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: "No organizations" });
    }

    for (const org of orgs) {
      try {
        // Get org config
        const { data: configRows } = await admin
          .from("config")
          .select("*")
          .eq("org_id", org.id);
        const configMap = new Map((configRows ?? []).map((c) => [c.parametre, c.valeur]));

        const emailQualite = configMap.get("email_responsable_qualite") || org.responsable_qualite_email || org.email_contact || "";

        // ── 1. Process new reclamations ──
        const { data: nouvelles } = await admin
          .from("reclamations")
          .select("*")
          .eq("org_id", org.id)
          .eq("statut", "nouvelle");

        for (const rec of nouvelles ?? []) {
          try {
            await admin
              .from("reclamations")
              .update({ statut: "en_traitement" })
              .eq("id", rec.id);

            if (emailQualite) {
              await sendEmail(
                emailQualite,
                `[Reclamation] ${rec.objet || rec.id}`,
                w4Reclamation(
                  { nom: org.nom, email: org.email_contact || "", telephone: org.telephone || "", adresse: org.adresse || "" },
                  { reclamation_id: rec.id, apprenant_id: rec.nom, objet: rec.objet, description: rec.description, date_reclamation: rec.created_at }
                )
              );
            }
            processed++;
          } catch (err) {
            errors.push(`Reclamation ${rec.id}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }

        // ── 2. Calculate KPIs ──
        const { data: satisfaction } = await admin
          .from("satisfaction")
          .select("*")
          .eq("org_id", org.id);
        const satRows = satisfaction ?? [];

        const satNotes = satRows.map((s) => s.note_globale).filter((n): n is number => n !== null && !isNaN(n));
        const satMoyenne = satNotes.length > 0
          ? (satNotes.reduce((a, b) => a + b, 0) / satNotes.length).toFixed(1)
          : "0";

        const recommandations = satRows.filter((s) => s.recommandation === true).length;
        const tauxRecommandation = satRows.length > 0
          ? Math.round((recommandations / satRows.length) * 100)
          : 0;

        const { data: allReclamations } = await admin
          .from("reclamations")
          .select("*")
          .eq("org_id", org.id);
        const recOuvertes = (allReclamations ?? []).filter(
          (r) => !["traitee", "fermee"].includes(r.statut)
        ).length;

        const { data: inscriptions } = await admin
          .from("inscriptions")
          .select("id")
          .eq("org_id", org.id)
          .eq("is_deleted", false);
        const totalInscrits = (inscriptions ?? []).length;

        const { data: emargements } = await admin
          .from("emargements")
          .select("id")
          .eq("org_id", org.id);
        const totalEmargements = (emargements ?? []).length;

        const tauxEmargement = totalInscrits > 0
          ? Math.round((totalEmargements / totalInscrits) * 100)
          : 0;

        const tauxReponseSat = totalInscrits > 0
          ? Math.round((satRows.length / totalInscrits) * 100)
          : 0;

        const today = new Date().toISOString().substring(0, 10);

        // ── 3. Upsert KPIs ──
        const kpiDefs = [
          { ref: "KPI-006", nom: "Note satisfaction moyenne (/10)", valeur: parseFloat(satMoyenne), unite: "/10" },
          { ref: "KPI-007", nom: "Taux de reponse satisfaction (%)", valeur: tauxReponseSat, unite: "%" },
          { ref: "KPI-008", nom: "Taux de completion formations (%)", valeur: tauxEmargement, unite: "%" },
          { ref: "KPI-009", nom: "Taux d'assiduite moyen (%)", valeur: tauxEmargement, unite: "%" },
          { ref: "KPI-004", nom: "Non-conformites ouvertes", valeur: recOuvertes, unite: "nombre" },
        ];

        for (const kpi of kpiDefs) {
          const { data: existing } = await admin
            .from("kpis")
            .select("id")
            .eq("org_id", org.id)
            .eq("ref", kpi.ref)
            .maybeSingle();

          if (existing) {
            await admin
              .from("kpis")
              .update({ valeur: kpi.valeur, date_maj: today })
              .eq("id", existing.id);
          } else {
            await admin
              .from("kpis")
              .insert({ org_id: org.id, ref: kpi.ref, nom: kpi.nom, valeur: kpi.valeur, unite: kpi.unite, date_maj: today });
          }
        }

        // ── 4. Send weekly report ──
        if (emailQualite) {
          const { count: sessionsActives } = await admin
            .from("sessions")
            .select("id", { count: "exact", head: true })
            .eq("org_id", org.id)
            .in("statut", ["en_cours", "planifiee"])
            .eq("is_deleted", false);

          await sendEmail(
            emailQualite,
            `[Rapport hebdo] Qualite - ${today}`,
            w4Rapport(
              { nom: org.nom, email: org.email_contact || "", telephone: org.telephone || "", adresse: org.adresse || "" },
              {
                sessionsActives: sessionsActives ?? 0,
                satMoyenne,
                tauxRecommandation,
                recOuvertes,
                tauxEmargement,
                nouvellesRec: (nouvelles ?? []).length,
                date: today,
              }
            )
          );
        }

        // ── 5. Log journal ──
        await admin.from("journal_systeme").insert({
          org_id: org.id,
          workflow: "W4",
          statut: "OK",
          message: `Amelioration : ${(nouvelles ?? []).length} reclamation(s), KPIs mis a jour, rapport envoye`,
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
