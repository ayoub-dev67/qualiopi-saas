import { NextRequest, NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { getSheets } from "@/lib/google-auth";

export async function GET(req: NextRequest) {
  const authError = verifyCronAuth(req);
  if (authError) return authError;

  const SHEET_01 = process.env.SHEET_01_ID!;
  const SHEET_02 = process.env.SHEET_02_ID!;
  const SHEET_03 = process.env.SHEET_03_ID!;
  const sheets = getSheets();
  const results: string[] = [];

  try {
    // Clear existing data (keep headers) then inject
    async function clearAndWrite(sheetId: string, tab: string, headers: string[], rows: string[][]) {
      // Get current data to find range
      const existing = await sheets.spreadsheets.values.get({ spreadsheetId: sheetId, range: tab });
      const numRows = (existing.data.values?.length ?? 1);
      if (numRows > 1) {
        const lastCol = String.fromCharCode(64 + headers.length);
        await sheets.spreadsheets.values.clear({ spreadsheetId: sheetId, range: `${tab}!A2:${lastCol}${numRows + 100}` });
      }
      if (rows.length > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: sheetId,
          range: `${tab}!A2`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: rows },
        });
      }
      results.push(`${tab}: ${rows.length} rows`);
    }

    // ═══ SHEET 01 — Organisme ═══
    await clearAndWrite(SHEET_01, "Organisme",
      ["nom","siret","adresse","email","telephone","nda","referent_handicap_nom","referent_handicap_email","responsable_qualite_email","direction_email"],
      [["Centre de Formation Alsace","98765432100012","15 rue du Dôme, 67000 Strasbourg","contact@formation-alsace.fr","03 88 22 44 66","44670000067","Marie Weber","handicap@formation-alsace.fr","qualite@formation-alsace.fr","direction@formation-alsace.fr"]]
    );

    // ═══ SHEET 01 — Formations ═══
    await clearAndWrite(SHEET_01, "Formations",
      ["formation_id","intitule","duree_heures","modalite","tarif","objectifs","prerequis","public_vise"],
      [
        ["FOR-001","Initiation au Marketing Digital","14","présentiel","1200","Maîtriser les fondamentaux du marketing digital : SEO, SEA, réseaux sociaux, email marketing","Aucun prérequis technique","Dirigeants, responsables marketing, chargés de communication"],
        ["FOR-002","SEO et Référencement Naturel","21","mixte","1800","Optimiser la visibilité d'un site web sur les moteurs de recherche","Connaissances de base en HTML","Webmasters, chargés de marketing digital"],
        ["FOR-003","Gestion de Projet Agile (Scrum)","14","présentiel","1500","Maîtriser la méthode Scrum et ses rituels, piloter un projet agile","Expérience en gestion de projet souhaitée","Chefs de projet, product owners, scrum masters"],
        ["FOR-004","Excel Avancé et Power BI","21","distanciel","1600","Automatiser des tableaux de bord, créer des rapports interactifs avec Power BI","Maîtrise d'Excel niveau intermédiaire","Contrôleurs de gestion, analystes, managers"],
        ["FOR-005","Prise de Parole en Public","7","présentiel","800","Structurer son message, gérer son stress, captiver son audience","Aucun","Tout professionnel amené à présenter en public"],
      ]
    );

    // ═══ SHEET 01 — Formateurs ═══
    await clearAndWrite(SHEET_01, "Formateurs",
      ["formateur_id","nom","prenom","email","specialite","qualifications","dossier_complet"],
      [
        ["FORM-001","Martin","Sophie","sophie.martin@formation-alsace.fr","Marketing Digital & SEO","Master Marketing Digital, 10 ans d'expérience, Certifiée Google Ads & Analytics","TRUE"],
        ["FORM-002","Dupont","Marc","marc.dupont@formation-alsace.fr","Gestion de Projet & Data","PMP, PSM I, 8 ans d'expérience chef de projet IT","TRUE"],
        ["FORM-003","Blanc","Julie","julie.blanc@formation-alsace.fr","Communication & Soft Skills","DEA Sciences de la Communication, Coach certifiée ICF","FALSE"],
      ]
    );

    // ═══ SHEET 01 — Sessions ═══
    await clearAndWrite(SHEET_01, "Sessions",
      ["session_id","formation_id","formateur_id","date_debut","date_fin","lieu","modalite","statut","nb_inscrits","nb_places","workflow_0_ok","workflow_1_ok","workflow_2_ok","workflow_3_ok"],
      [
        ["SES-2026-001","FOR-001","FORM-001","2026-03-10","2026-03-11","Strasbourg","présentiel","terminee","8","10","TRUE","TRUE","TRUE","TRUE"],
        ["SES-2026-002","FOR-002","FORM-001","2026-03-22","2026-03-24","Strasbourg","mixte","en_cours","5","8","TRUE","TRUE","TRUE","FALSE"],
        ["SES-2026-003","FOR-003","FORM-002","2026-04-01","2026-04-02","Strasbourg","présentiel","planifiee","12","15","TRUE","FALSE","FALSE","FALSE"],
        ["SES-2026-004","FOR-004","FORM-002","2026-04-10","2026-04-12","Distanciel","distanciel","planifiee","6","8","FALSE","FALSE","FALSE","FALSE"],
        ["SES-2026-005","FOR-005","FORM-003","2026-04-20","2026-04-20","Strasbourg","présentiel","planifiee","3","10","FALSE","FALSE","FALSE","FALSE"],
        ["SES-2026-006","FOR-001","FORM-001","2025-09-01","2025-09-02","Strasbourg","présentiel","terminee","10","10","TRUE","TRUE","TRUE","TRUE"],
      ]
    );

    // ═══ SHEET 01 — Financier ═══
    await clearAndWrite(SHEET_01, "Financier",
      ["facture_id","session_id","formation_id","client","type_financement","montant_total","montant_facture","montant_encaisse","statut_paiement","date_facture","date_paiement"],
      [
        ["FAC-2026-001","SES-2026-001","FOR-001","Entreprise ABC SARL","opco","9600","9600","9600","payee","2026-03-12","2026-03-25"],
        ["FAC-2026-002","SES-2026-002","FOR-002","Startup XYZ SAS","entreprise","9000","9000","0","facturee","2026-03-25",""],
        ["FAC-2026-003","SES-2026-001","FOR-001","Société DEF","cpf","2400","2400","2400","payee","2026-03-12","2026-03-20"],
        ["FAC-2026-004","SES-2026-003","FOR-003","Cabinet GHI & Associés","opco","22500","0","0","a_facturer","",""],
      ]
    );

    // ═══ SHEET 02 — Apprenants ═══
    await clearAndWrite(SHEET_02, "Apprenants",
      ["apprenant_id","nom","prenom","email","entreprise","handicap"],
      [
        ["APP-001","Müller","Thomas","thomas.muller@entreprise-abc.fr","Entreprise ABC SARL","FALSE"],
        ["APP-002","Schmidt","Claire","claire.schmidt@entreprise-abc.fr","Entreprise ABC SARL","FALSE"],
        ["APP-003","Weber","Antoine","antoine.weber@startup-xyz.fr","Startup XYZ SAS","FALSE"],
        ["APP-004","Klein","Marie","marie.klein@startup-xyz.fr","Startup XYZ SAS","TRUE"],
        ["APP-005","Braun","Lucas","lucas.braun@societe-def.fr","Société DEF","FALSE"],
        ["APP-006","Fischer","Emma","emma.fischer@cabinet-ghi.fr","Cabinet GHI & Associés","FALSE"],
        ["APP-007","Keller","Hugo","hugo.keller@cabinet-ghi.fr","Cabinet GHI & Associés","FALSE"],
        ["APP-008","Roth","Camille","camille.roth@cabinet-ghi.fr","Cabinet GHI & Associés","FALSE"],
        ["APP-009","Bauer","Sophie","sophie.bauer@indep.fr","Indépendante","FALSE"],
        ["APP-010","Lang","Pierre","pierre.lang@mairie-strasbourg.fr","Mairie de Strasbourg","TRUE"],
      ]
    );

    // ═══ SHEET 02 — Inscriptions ═══
    await clearAndWrite(SHEET_02, "Inscriptions",
      ["inscription_id","apprenant_id","session_id","statut","date_inscription","positionnement_fait"],
      [
        ["INS-001","APP-001","SES-2026-001","present","2026-02-15","TRUE"],
        ["INS-002","APP-002","SES-2026-001","present","2026-02-16","TRUE"],
        ["INS-003","APP-005","SES-2026-001","present","2026-02-18","TRUE"],
        ["INS-004","APP-003","SES-2026-002","present","2026-03-01","TRUE"],
        ["INS-005","APP-004","SES-2026-002","present","2026-03-02","TRUE"],
        ["INS-006","APP-006","SES-2026-003","inscrit","2026-03-10","FALSE"],
        ["INS-007","APP-007","SES-2026-003","inscrit","2026-03-10","FALSE"],
        ["INS-008","APP-008","SES-2026-003","inscrit","2026-03-11","FALSE"],
        ["INS-009","APP-009","SES-2026-003","inscrit","2026-03-12","FALSE"],
        ["INS-010","APP-003","SES-2026-004","inscrit","2026-03-15","FALSE"],
        ["INS-011","APP-001","SES-2026-004","inscrit","2026-03-15","FALSE"],
        ["INS-012","APP-010","SES-2026-004","inscrit","2026-03-16","FALSE"],
        ["INS-013","APP-009","SES-2026-005","inscrit","2026-03-18","FALSE"],
        ["INS-014","APP-010","SES-2026-005","inscrit","2026-03-18","FALSE"],
        ["INS-015","APP-001","SES-2026-006","present","2025-08-20","TRUE"],
      ]
    );

    // ═══ SHEET 02 — Satisfaction ═══
    await clearAndWrite(SHEET_02, "Satisfaction",
      ["inscription_id","session_id","type_repondant","note_globale","note_contenu","note_formateur","note_organisation","objectifs_atteints","points_forts","axes_amelioration","commentaire","recommandation","date_reponse"],
      [
        ["INS-001","SES-2026-001","apprenant","9","9","10","8","Oui","Très bonne pédagogie, cas pratiques pertinents","Plus de temps pour les exercices","Excellente formation, je recommande vivement","Oui","2026-03-12"],
        ["INS-002","SES-2026-001","apprenant","8","8","9","7","Oui","Formateur dynamique et compétent","Support de cours à améliorer","Bonne formation dans l'ensemble","Oui","2026-03-12"],
        ["INS-003","SES-2026-001","apprenant","7","7","8","7","Partiellement","Contenu riche et structuré","Salle un peu petite","Contenu intéressant mais rythme rapide","Non","2026-03-13"],
        ["INS-015","SES-2026-006","apprenant","10","10","10","9","Oui","Parfait de bout en bout","Rien à signaler","La meilleure formation que j'ai suivie","Oui","2025-09-03"],
        ["INS-015","SES-2026-006","apprenant","9","9","9","8","Oui","Cas pratiques très réalistes","Un peu court","Très satisfait, formation très utile","Oui","2025-09-03"],
        ["INS-015","SES-2026-006","apprenant","8","8","9","8","Oui","Échanges enrichissants avec le groupe","Horaires un peu contraignants","Bonne formation, bien organisée","Oui","2025-09-04"],
        ["INS-015","SES-2026-006","apprenant","9","8","10","9","Oui","Sophie Martin est une excellente formatrice","","Je referai une formation avec cet organisme","Oui","2025-09-04"],
        ["INS-015","SES-2026-006","apprenant","7","7","8","7","Partiellement","Bon contenu théorique","Plus de pratique souhaitée","Correct mais j'attendais plus de pratique","Non","2025-09-05"],
      ]
    );

    // ═══ SHEET 03 — Journal_Systeme ═══
    await clearAndWrite(SHEET_03, "Journal_Systeme",
      ["date","heure","workflow","session_id","statut","message"],
      [
        ["2026-03-10","08:15","W0","SES-2026-001","succes","Setup session terminé : 3 convocation(s) envoyée(s)"],
        ["2026-03-10","08:20","W1","SES-2026-001","succes","Positionnement envoyé à 3 apprenant(s)"],
        ["2026-03-10","14:30","W2","SES-2026-001","succes","Émargement envoyé à 3 apprenant(s), PDF généré"],
        ["2026-03-11","18:00","W3","SES-2026-001","succes","Satisfaction + Évaluation envoyés à 3 apprenant(s)"],
        ["2026-03-15","09:00","W4","","succes","Amélioration : 0 réclamation(s), KPIs mis à jour, rapport envoyé"],
        ["2026-03-20","08:05","W0","SES-2026-002","succes","Setup session terminé : 2 convocation(s) envoyée(s)"],
        ["2026-03-20","08:10","W1","SES-2026-002","succes","Positionnement envoyé à 2 apprenant(s)"],
        ["2026-03-22","09:00","W2","SES-2026-002","succes","Émargement envoyé à 2 apprenant(s), PDF généré"],
        ["2026-03-20","08:15","W0","SES-2026-003","succes","Setup session terminé : 4 convocation(s) envoyée(s)"],
        ["2026-03-20","08:16","W0","SES-2026-004","erreur","Erreur Drive : quota API dépassé temporairement"],
        ["2026-03-20","09:00","W5","","succes","Relances : 0 email(s) envoyé(s)"],
        ["2026-03-20","08:30","W4","","succes","Amélioration : 0 réclamation(s), KPIs mis à jour, rapport envoyé"],
      ]
    );

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
