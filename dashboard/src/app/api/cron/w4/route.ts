import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getSessions, getInscriptions, getSatisfaction, getReclamations, getEmargement, getOrganisme, getConfig } from "@/lib/sheets";
import { updateCell, logJournal } from "@/lib/sheets-write";
import { sendEmail } from "@/lib/email";
import { w4Reclamation, w4Rapport } from "@/lib/email-templates";

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
}

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const SHEET_02 = process.env.SHEET_02_ID!;
  const SHEET_03 = process.env.SHEET_03_ID!;

  const errors: string[] = [];
  let processed = 0;

  try {
    const [reclamations, satisfaction, inscriptions, emargements, sessions, organismeRows, config] =
      await Promise.all([
        getReclamations(), getSatisfaction(), getInscriptions(), getEmargement(),
        getSessions(), getOrganisme(), getConfig(),
      ]);

    const organisme = organismeRows[0] ?? {};
    const emailQualite = config.find((c) => c.cle === "email_responsable_qualite")?.valeur || organisme.email || "";

    // 1. Process new reclamations
    const nouvelles = reclamations.filter((r) => norm(r.statut ?? "") === "nouvelle");
    for (const rec of nouvelles) {
      try {
        await updateCell(SHEET_02, "Reclamations", "reclamation_id", rec.reclamation_id, "statut", "en_traitement");

        if (emailQualite) {
          await sendEmail(
            emailQualite,
            `[Réclamation] ${rec.objet || rec.reclamation_id}`,
            w4Reclamation(organisme, rec)
          );
        }
        processed++;
      } catch (err) {
        errors.push(`Réclamation ${rec.reclamation_id}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 2. Calculate KPIs
    const satNotes = satisfaction.map((s) => parseFloat(s.note_globale)).filter((n) => !isNaN(n));
    const satMoyenne = satNotes.length > 0 ? (satNotes.reduce((a, b) => a + b, 0) / satNotes.length).toFixed(1) : "0";

    const recommandations = satisfaction.filter((s) => {
      const n = parseFloat(s.recommandation ?? s.note_globale ?? "0");
      return n >= 7;
    }).length;
    const tauxRecommandation = satisfaction.length > 0
      ? Math.round((recommandations / satisfaction.length) * 100)
      : 0;

    const recOuvertes = reclamations.filter((r) => !["traitee", "resolue", "cloturee"].includes(norm(r.statut ?? ""))).length;

    const totalEmargements = emargements.length;
    const totalInscrits = inscriptions.length;
    const tauxEmargement = totalInscrits > 0 ? Math.round((totalEmargements / totalInscrits) * 100) : 0;

    const today = new Date().toISOString().substring(0, 10);

    // Write KPIs — match actual Sheet 03 kpi_id values
    // KPI-006: Note satisfaction moyenne (/10)
    // KPI-007: Taux de réponse satisfaction (%)
    // KPI-008: Taux de complétion formations (%) — approx via emargement
    // KPI-009: Taux d'assiduité moyen (%) — approx via emargement
    // KPI-004: Non-conformités ouvertes (nombre) — use reclamations as proxy
    const tauxReponseSat = inscriptions.length > 0
      ? Math.round((satisfaction.length / inscriptions.length) * 100)
      : 0;

    const kpis = [
      { kpi_id: "KPI-006", valeur: satMoyenne },
      { kpi_id: "KPI-007", valeur: String(tauxReponseSat) },
      { kpi_id: "KPI-008", valeur: String(tauxEmargement) },
      { kpi_id: "KPI-009", valeur: String(tauxEmargement) },
      { kpi_id: "KPI-004", valeur: String(recOuvertes) },
    ];

    for (const kpi of kpis) {
      try {
        await updateCell(SHEET_03, "KPIs", "kpi_id", kpi.kpi_id, "valeur_actuelle", kpi.valeur);
        await updateCell(SHEET_03, "KPIs", "kpi_id", kpi.kpi_id, "date_maj", today);
      } catch {
        // KPI row may not exist, skip silently
      }
    }

    // 3. Send weekly report
    if (emailQualite) {
      const sessionsActives = sessions.filter((s) => ["en_cours", "planifiee"].includes(norm(s.statut ?? ""))).length;
      await sendEmail(
        emailQualite,
        `[Rapport hebdo] Qualité — ${today}`,
        w4Rapport(organisme, { sessionsActives, satMoyenne, tauxRecommandation, recOuvertes, tauxEmargement, nouvellesRec: nouvelles.length, date: today })
      );
    }

    await logJournal("W4", "", "succes", `Amélioration : ${nouvelles.length} réclamation(s), KPIs mis à jour, rapport envoyé`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }

  return NextResponse.json({ success: true, processed, errors });
}
