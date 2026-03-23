import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const results: string[] = [];

  try {
    // ═══════════════════════════════════════
    // 1. Find or create organization
    // ═══════════════════════════════════════
    let orgId: string;
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("nom", "Centre de Formation Alsace")
      .maybeSingle();

    if (existingOrg) {
      orgId = existingOrg.id;
      results.push("Organization: found existing");
    } else {
      const { data: newOrg, error } = await admin.from("organizations").insert({
        nom: "Centre de Formation Alsace",
        siret: "98765432100012",
        adresse: "15 rue du Dome, 67000 Strasbourg",
        email_contact: "contact@formation-alsace.fr",
        telephone: "03 88 22 44 66",
        nda: "44670000067",
        referent_handicap_nom: "Marie Weber",
        referent_handicap_email: "handicap@formation-alsace.fr",
        responsable_qualite_email: "qualite@formation-alsace.fr",
        direction_email: "direction@formation-alsace.fr",
      }).select("id").single();
      if (error) throw new Error(`Org insert: ${error.message}`);
      orgId = newOrg.id;
      results.push("Organization: created");
    }

    // ═══════════════════════════════════════
    // 2. Formations (5)
    // ═══════════════════════════════════════
    const formationDefs = [
      { ref: "FOR-001", intitule: "Initiation au Marketing Digital", duree_heures: 14, modalite: "presentiel" as const, tarif: 1200, objectifs: "Maitriser les fondamentaux du marketing digital : SEO, SEA, reseaux sociaux, email marketing", prerequis: "Aucun prerequis technique", public_vise: "Dirigeants, responsables marketing, charges de communication" },
      { ref: "FOR-002", intitule: "SEO et Referencement Naturel", duree_heures: 21, modalite: "mixte" as const, tarif: 1800, objectifs: "Optimiser la visibilite d'un site web sur les moteurs de recherche", prerequis: "Connaissances de base en HTML", public_vise: "Webmasters, charges de marketing digital" },
      { ref: "FOR-003", intitule: "Gestion de Projet Agile (Scrum)", duree_heures: 14, modalite: "presentiel" as const, tarif: 1500, objectifs: "Maitriser la methode Scrum et ses rituels, piloter un projet agile", prerequis: "Experience en gestion de projet souhaitee", public_vise: "Chefs de projet, product owners, scrum masters" },
      { ref: "FOR-004", intitule: "Excel Avance et Power BI", duree_heures: 21, modalite: "distanciel" as const, tarif: 1600, objectifs: "Automatiser des tableaux de bord, creer des rapports interactifs avec Power BI", prerequis: "Maitrise d'Excel niveau intermediaire", public_vise: "Controleurs de gestion, analystes, managers" },
      { ref: "FOR-005", intitule: "Prise de Parole en Public", duree_heures: 7, modalite: "presentiel" as const, tarif: 800, objectifs: "Structurer son message, gerer son stress, captiver son audience", prerequis: "Aucun", public_vise: "Tout professionnel amene a presenter en public" },
    ];

    // Delete existing seed data for this org
    await admin.from("formations").delete().eq("org_id", orgId).in("ref", formationDefs.map((f) => f.ref));

    const { data: formations, error: fErr } = await admin
      .from("formations")
      .insert(formationDefs.map((f) => ({ org_id: orgId, ...f })))
      .select("id, ref");
    if (fErr) throw new Error(`Formations insert: ${fErr.message}`);
    const fMap = new Map((formations ?? []).map((f) => [f.ref, f.id]));
    results.push(`Formations: ${formations?.length ?? 0} rows`);

    // ═══════════════════════════════════════
    // 3. Formateurs (3)
    // ═══════════════════════════════════════
    const formateurDefs = [
      { ref: "FORM-001", nom: "Martin", prenom: "Sophie", email: "sophie.martin@formation-alsace.fr", specialite: "Marketing Digital & SEO", qualifications: "Master Marketing Digital, 10 ans d'experience, Certifiee Google Ads & Analytics", dossier_complet: true },
      { ref: "FORM-002", nom: "Dupont", prenom: "Marc", email: "marc.dupont@formation-alsace.fr", specialite: "Gestion de Projet & Data", qualifications: "PMP, PSM I, 8 ans d'experience chef de projet IT", dossier_complet: true },
      { ref: "FORM-003", nom: "Blanc", prenom: "Julie", email: "julie.blanc@formation-alsace.fr", specialite: "Communication & Soft Skills", qualifications: "DEA Sciences de la Communication, Coach certifiee ICF", dossier_complet: false },
    ];

    await admin.from("formateurs").delete().eq("org_id", orgId).in("ref", formateurDefs.map((f) => f.ref));

    const { data: formateurs, error: ftErr } = await admin
      .from("formateurs")
      .insert(formateurDefs.map((f) => ({ org_id: orgId, ...f })))
      .select("id, ref");
    if (ftErr) throw new Error(`Formateurs insert: ${ftErr.message}`);
    const ftMap = new Map((formateurs ?? []).map((f) => [f.ref, f.id]));
    results.push(`Formateurs: ${formateurs?.length ?? 0} rows`);

    // ═══════════════════════════════════════
    // 4. Sessions (6)
    // ═══════════════════════════════════════
    const sessionDefs = [
      { ref: "SES-2026-001", formation_id: fMap.get("FOR-001")!, formateur_id: ftMap.get("FORM-001")!, date_debut: "2026-03-10", date_fin: "2026-03-11", lieu: "Strasbourg", modalite: "presentiel" as const, statut: "terminee" as const, nombre_places: 10, nb_inscrits: 8, workflow_0_ok: true, workflow_1_ok: true, workflow_2_ok: true, workflow_3_ok: true },
      { ref: "SES-2026-002", formation_id: fMap.get("FOR-002")!, formateur_id: ftMap.get("FORM-001")!, date_debut: "2026-03-22", date_fin: "2026-03-24", lieu: "Strasbourg", modalite: "mixte" as const, statut: "en_cours" as const, nombre_places: 8, nb_inscrits: 5, workflow_0_ok: true, workflow_1_ok: true, workflow_2_ok: true, workflow_3_ok: false },
      { ref: "SES-2026-003", formation_id: fMap.get("FOR-003")!, formateur_id: ftMap.get("FORM-002")!, date_debut: "2026-04-01", date_fin: "2026-04-02", lieu: "Strasbourg", modalite: "presentiel" as const, statut: "planifiee" as const, nombre_places: 15, nb_inscrits: 12, workflow_0_ok: true, workflow_1_ok: false, workflow_2_ok: false, workflow_3_ok: false },
      { ref: "SES-2026-004", formation_id: fMap.get("FOR-004")!, formateur_id: ftMap.get("FORM-002")!, date_debut: "2026-04-10", date_fin: "2026-04-12", lieu: "Distanciel", modalite: "distanciel" as const, statut: "planifiee" as const, nombre_places: 8, nb_inscrits: 6, workflow_0_ok: false, workflow_1_ok: false, workflow_2_ok: false, workflow_3_ok: false },
      { ref: "SES-2026-005", formation_id: fMap.get("FOR-005")!, formateur_id: ftMap.get("FORM-003")!, date_debut: "2026-04-20", date_fin: "2026-04-20", lieu: "Strasbourg", modalite: "presentiel" as const, statut: "planifiee" as const, nombre_places: 10, nb_inscrits: 3, workflow_0_ok: false, workflow_1_ok: false, workflow_2_ok: false, workflow_3_ok: false },
      { ref: "SES-2026-006", formation_id: fMap.get("FOR-001")!, formateur_id: ftMap.get("FORM-001")!, date_debut: "2025-09-01", date_fin: "2025-09-02", lieu: "Strasbourg", modalite: "presentiel" as const, statut: "terminee" as const, nombre_places: 10, nb_inscrits: 10, workflow_0_ok: true, workflow_1_ok: true, workflow_2_ok: true, workflow_3_ok: true },
    ];

    await admin.from("sessions").delete().eq("org_id", orgId).in("ref", sessionDefs.map((s) => s.ref));

    const { data: sessions, error: sErr } = await admin
      .from("sessions")
      .insert(sessionDefs.map((s) => ({ org_id: orgId, ...s })))
      .select("id, ref");
    if (sErr) throw new Error(`Sessions insert: ${sErr.message}`);
    const sMap = new Map((sessions ?? []).map((s) => [s.ref, s.id]));
    results.push(`Sessions: ${sessions?.length ?? 0} rows`);

    // ═══════════════════════════════════════
    // 5. Apprenants (10)
    // ═══════════════════════════════════════
    const apprenantDefs = [
      { ref: "APP-001", nom: "Muller", prenom: "Thomas", email: "thomas.muller@entreprise-abc.fr", entreprise: "Entreprise ABC SARL", situation_handicap: false },
      { ref: "APP-002", nom: "Schmidt", prenom: "Claire", email: "claire.schmidt@entreprise-abc.fr", entreprise: "Entreprise ABC SARL", situation_handicap: false },
      { ref: "APP-003", nom: "Weber", prenom: "Antoine", email: "antoine.weber@startup-xyz.fr", entreprise: "Startup XYZ SAS", situation_handicap: false },
      { ref: "APP-004", nom: "Klein", prenom: "Marie", email: "marie.klein@startup-xyz.fr", entreprise: "Startup XYZ SAS", situation_handicap: true },
      { ref: "APP-005", nom: "Braun", prenom: "Lucas", email: "lucas.braun@societe-def.fr", entreprise: "Societe DEF", situation_handicap: false },
      { ref: "APP-006", nom: "Fischer", prenom: "Emma", email: "emma.fischer@cabinet-ghi.fr", entreprise: "Cabinet GHI & Associes", situation_handicap: false },
      { ref: "APP-007", nom: "Keller", prenom: "Hugo", email: "hugo.keller@cabinet-ghi.fr", entreprise: "Cabinet GHI & Associes", situation_handicap: false },
      { ref: "APP-008", nom: "Roth", prenom: "Camille", email: "camille.roth@cabinet-ghi.fr", entreprise: "Cabinet GHI & Associes", situation_handicap: false },
      { ref: "APP-009", nom: "Bauer", prenom: "Sophie", email: "sophie.bauer@indep.fr", entreprise: "Independante", situation_handicap: false },
      { ref: "APP-010", nom: "Lang", prenom: "Pierre", email: "pierre.lang@mairie-strasbourg.fr", entreprise: "Mairie de Strasbourg", situation_handicap: true },
    ];

    await admin.from("apprenants").delete().eq("org_id", orgId).in("ref", apprenantDefs.map((a) => a.ref));

    const { data: apprenants, error: aErr } = await admin
      .from("apprenants")
      .insert(apprenantDefs.map((a) => ({ org_id: orgId, ...a })))
      .select("id, ref");
    if (aErr) throw new Error(`Apprenants insert: ${aErr.message}`);
    const aMap = new Map((apprenants ?? []).map((a) => [a.ref, a.id]));
    results.push(`Apprenants: ${apprenants?.length ?? 0} rows`);

    // ═══════════════════════════════════════
    // 6. Inscriptions (15)
    // ═══════════════════════════════════════
    const inscriptionDefs = [
      { ref: "INS-001", apprenant_id: aMap.get("APP-001")!, session_id: sMap.get("SES-2026-001")!, statut: "present" as const, date_inscription: "2026-02-15" },
      { ref: "INS-002", apprenant_id: aMap.get("APP-002")!, session_id: sMap.get("SES-2026-001")!, statut: "present" as const, date_inscription: "2026-02-16" },
      { ref: "INS-003", apprenant_id: aMap.get("APP-005")!, session_id: sMap.get("SES-2026-001")!, statut: "present" as const, date_inscription: "2026-02-18" },
      { ref: "INS-004", apprenant_id: aMap.get("APP-003")!, session_id: sMap.get("SES-2026-002")!, statut: "present" as const, date_inscription: "2026-03-01" },
      { ref: "INS-005", apprenant_id: aMap.get("APP-004")!, session_id: sMap.get("SES-2026-002")!, statut: "present" as const, date_inscription: "2026-03-02" },
      { ref: "INS-006", apprenant_id: aMap.get("APP-006")!, session_id: sMap.get("SES-2026-003")!, statut: "inscrit" as const, date_inscription: "2026-03-10" },
      { ref: "INS-007", apprenant_id: aMap.get("APP-007")!, session_id: sMap.get("SES-2026-003")!, statut: "inscrit" as const, date_inscription: "2026-03-10" },
      { ref: "INS-008", apprenant_id: aMap.get("APP-008")!, session_id: sMap.get("SES-2026-003")!, statut: "inscrit" as const, date_inscription: "2026-03-11" },
      { ref: "INS-009", apprenant_id: aMap.get("APP-009")!, session_id: sMap.get("SES-2026-003")!, statut: "inscrit" as const, date_inscription: "2026-03-12" },
      { ref: "INS-010", apprenant_id: aMap.get("APP-003")!, session_id: sMap.get("SES-2026-004")!, statut: "inscrit" as const, date_inscription: "2026-03-15" },
      { ref: "INS-011", apprenant_id: aMap.get("APP-001")!, session_id: sMap.get("SES-2026-004")!, statut: "inscrit" as const, date_inscription: "2026-03-15" },
      { ref: "INS-012", apprenant_id: aMap.get("APP-010")!, session_id: sMap.get("SES-2026-004")!, statut: "inscrit" as const, date_inscription: "2026-03-16" },
      { ref: "INS-013", apprenant_id: aMap.get("APP-009")!, session_id: sMap.get("SES-2026-005")!, statut: "inscrit" as const, date_inscription: "2026-03-18" },
      { ref: "INS-014", apprenant_id: aMap.get("APP-010")!, session_id: sMap.get("SES-2026-005")!, statut: "inscrit" as const, date_inscription: "2026-03-18" },
      { ref: "INS-015", apprenant_id: aMap.get("APP-001")!, session_id: sMap.get("SES-2026-006")!, statut: "present" as const, date_inscription: "2025-08-20" },
    ];

    await admin.from("inscriptions").delete().eq("org_id", orgId).in("ref", inscriptionDefs.map((i) => i.ref));

    const { data: inscriptions, error: iErr } = await admin
      .from("inscriptions")
      .insert(inscriptionDefs.map((i) => ({ org_id: orgId, ...i })))
      .select("id, ref");
    if (iErr) throw new Error(`Inscriptions insert: ${iErr.message}`);
    const iMap = new Map((inscriptions ?? []).map((i) => [i.ref, i.id]));
    results.push(`Inscriptions: ${inscriptions?.length ?? 0} rows`);

    // ═══════════════════════════════════════
    // 7. Satisfaction (8)
    // ═══════════════════════════════════════
    const satisfactionDefs = [
      { inscription_id: iMap.get("INS-001")!, session_id: sMap.get("SES-2026-001")!, type_repondant: "apprenant", note_globale: 9, note_contenu: 9, note_formateur: 10, note_organisation: 8, objectifs_atteints: 5, points_forts: "Tres bonne pedagogie, cas pratiques pertinents", axes_amelioration: "Plus de temps pour les exercices", commentaire: "Excellente formation, je recommande vivement", recommandation: true, completed_at: "2026-03-12" },
      { inscription_id: iMap.get("INS-002")!, session_id: sMap.get("SES-2026-001")!, type_repondant: "apprenant", note_globale: 8, note_contenu: 8, note_formateur: 9, note_organisation: 7, objectifs_atteints: 4, points_forts: "Formateur dynamique et competent", axes_amelioration: "Support de cours a ameliorer", commentaire: "Bonne formation dans l'ensemble", recommandation: true, completed_at: "2026-03-12" },
      { inscription_id: iMap.get("INS-003")!, session_id: sMap.get("SES-2026-001")!, type_repondant: "apprenant", note_globale: 7, note_contenu: 7, note_formateur: 8, note_organisation: 7, objectifs_atteints: 3, points_forts: "Contenu riche et structure", axes_amelioration: "Salle un peu petite", commentaire: "Contenu interessant mais rythme rapide", recommandation: false, completed_at: "2026-03-13" },
      { inscription_id: iMap.get("INS-015")!, session_id: sMap.get("SES-2026-006")!, type_repondant: "apprenant", note_globale: 10, note_contenu: 10, note_formateur: 10, note_organisation: 9, objectifs_atteints: 5, points_forts: "Parfait de bout en bout", axes_amelioration: "Rien a signaler", commentaire: "La meilleure formation que j'ai suivie", recommandation: true, completed_at: "2025-09-03" },
      { inscription_id: iMap.get("INS-015")!, session_id: sMap.get("SES-2026-006")!, type_repondant: "apprenant", note_globale: 9, note_contenu: 9, note_formateur: 9, note_organisation: 8, objectifs_atteints: 4, points_forts: "Cas pratiques tres realistes", axes_amelioration: "Un peu court", commentaire: "Tres satisfait, formation tres utile", recommandation: true, completed_at: "2025-09-03" },
      { inscription_id: iMap.get("INS-015")!, session_id: sMap.get("SES-2026-006")!, type_repondant: "apprenant", note_globale: 8, note_contenu: 8, note_formateur: 9, note_organisation: 8, objectifs_atteints: 4, points_forts: "Echanges enrichissants avec le groupe", axes_amelioration: "Horaires un peu contraignants", commentaire: "Bonne formation, bien organisee", recommandation: true, completed_at: "2025-09-04" },
      { inscription_id: iMap.get("INS-015")!, session_id: sMap.get("SES-2026-006")!, type_repondant: "apprenant", note_globale: 9, note_contenu: 8, note_formateur: 10, note_organisation: 9, objectifs_atteints: 5, points_forts: "Sophie Martin est une excellente formatrice", axes_amelioration: "", commentaire: "Je referai une formation avec cet organisme", recommandation: true, completed_at: "2025-09-04" },
      { inscription_id: iMap.get("INS-015")!, session_id: sMap.get("SES-2026-006")!, type_repondant: "apprenant", note_globale: 7, note_contenu: 7, note_formateur: 8, note_organisation: 7, objectifs_atteints: 3, points_forts: "Bon contenu theorique", axes_amelioration: "Plus de pratique souhaitee", commentaire: "Correct mais j'attendais plus de pratique", recommandation: false, completed_at: "2025-09-05" },
    ];

    // Clean existing satisfaction for these sessions
    await admin.from("satisfaction").delete().eq("org_id", orgId).in("session_id", [sMap.get("SES-2026-001")!, sMap.get("SES-2026-006")!]);

    const { error: satErr } = await admin
      .from("satisfaction")
      .insert(satisfactionDefs.map((s) => ({ org_id: orgId, ...s })));
    if (satErr) throw new Error(`Satisfaction insert: ${satErr.message}`);
    results.push(`Satisfaction: ${satisfactionDefs.length} rows`);

    // ═══════════════════════════════════════
    // 8. Factures (4)
    // ═══════════════════════════════════════
    const factureDefs = [
      { ref: "FAC-2026-001", session_id: sMap.get("SES-2026-001")!, formation_id: fMap.get("FOR-001")!, entreprise: "Entreprise ABC SARL", type_financement: "opco" as const, montant_prevu: 9600, montant_facture: 9600, montant_encaisse: 9600, statut_paiement: "payee" as const, date_facture: "2026-03-12", date_paiement: "2026-03-25" },
      { ref: "FAC-2026-002", session_id: sMap.get("SES-2026-002")!, formation_id: fMap.get("FOR-002")!, entreprise: "Startup XYZ SAS", type_financement: "entreprise" as const, montant_prevu: 9000, montant_facture: 9000, montant_encaisse: 0, statut_paiement: "facturee" as const, date_facture: "2026-03-25", date_paiement: null },
      { ref: "FAC-2026-003", session_id: sMap.get("SES-2026-001")!, formation_id: fMap.get("FOR-001")!, entreprise: "Societe DEF", type_financement: "cpf" as const, montant_prevu: 2400, montant_facture: 2400, montant_encaisse: 2400, statut_paiement: "payee" as const, date_facture: "2026-03-12", date_paiement: "2026-03-20" },
      { ref: "FAC-2026-004", session_id: sMap.get("SES-2026-003")!, formation_id: fMap.get("FOR-003")!, entreprise: "Cabinet GHI & Associes", type_financement: "opco" as const, montant_prevu: 22500, montant_facture: 0, montant_encaisse: 0, statut_paiement: "a_facturer" as const, date_facture: null, date_paiement: null },
    ];

    await admin.from("factures").delete().eq("org_id", orgId).in("ref", factureDefs.map((f) => f.ref));

    const { error: facErr } = await admin
      .from("factures")
      .insert(factureDefs.map((f) => ({ org_id: orgId, ...f })));
    if (facErr) throw new Error(`Factures insert: ${facErr.message}`);
    results.push(`Factures: ${factureDefs.length} rows`);

    // ═══════════════════════════════════════
    // 9. Journal entries (12)
    // ═══════════════════════════════════════
    // Clear existing journal for this org
    await admin.from("journal_systeme").delete().eq("org_id", orgId);

    const journalDefs = [
      { workflow: "W0", session_id: sMap.get("SES-2026-001")!, session_ref: "SES-2026-001", statut: "OK" as const, message: "Setup session termine : 3 convocation(s) envoyee(s)", created_at: "2026-03-10T08:15:00Z" },
      { workflow: "W1", session_id: sMap.get("SES-2026-001")!, session_ref: "SES-2026-001", statut: "OK" as const, message: "Positionnement envoye a 3 apprenant(s)", created_at: "2026-03-10T08:20:00Z" },
      { workflow: "W2", session_id: sMap.get("SES-2026-001")!, session_ref: "SES-2026-001", statut: "OK" as const, message: "Emargement envoye a 3 apprenant(s), PDF genere", created_at: "2026-03-10T14:30:00Z" },
      { workflow: "W3", session_id: sMap.get("SES-2026-001")!, session_ref: "SES-2026-001", statut: "OK" as const, message: "Satisfaction + Evaluation envoyes a 3 apprenant(s)", created_at: "2026-03-11T18:00:00Z" },
      { workflow: "W4", session_id: null, session_ref: null, statut: "OK" as const, message: "Amelioration : 0 reclamation(s), KPIs mis a jour, rapport envoye", created_at: "2026-03-15T09:00:00Z" },
      { workflow: "W0", session_id: sMap.get("SES-2026-002")!, session_ref: "SES-2026-002", statut: "OK" as const, message: "Setup session termine : 2 convocation(s) envoyee(s)", created_at: "2026-03-20T08:05:00Z" },
      { workflow: "W1", session_id: sMap.get("SES-2026-002")!, session_ref: "SES-2026-002", statut: "OK" as const, message: "Positionnement envoye a 2 apprenant(s)", created_at: "2026-03-20T08:10:00Z" },
      { workflow: "W2", session_id: sMap.get("SES-2026-002")!, session_ref: "SES-2026-002", statut: "OK" as const, message: "Emargement envoye a 2 apprenant(s), PDF genere", created_at: "2026-03-22T09:00:00Z" },
      { workflow: "W0", session_id: sMap.get("SES-2026-003")!, session_ref: "SES-2026-003", statut: "OK" as const, message: "Setup session termine : 4 convocation(s) envoyee(s)", created_at: "2026-03-20T08:15:00Z" },
      { workflow: "W0", session_id: sMap.get("SES-2026-004")!, session_ref: "SES-2026-004", statut: "ERROR" as const, message: "Erreur Drive : quota API depasse temporairement", created_at: "2026-03-20T08:16:00Z" },
      { workflow: "W5", session_id: null, session_ref: null, statut: "OK" as const, message: "Relances : 0 email(s) envoye(s)", created_at: "2026-03-20T09:00:00Z" },
      { workflow: "W4", session_id: null, session_ref: null, statut: "OK" as const, message: "Amelioration : 0 reclamation(s), KPIs mis a jour, rapport envoye", created_at: "2026-03-20T08:30:00Z" },
    ];

    const { error: jErr } = await admin
      .from("journal_systeme")
      .insert(journalDefs.map((j) => ({ org_id: orgId, ...j })));
    if (jErr) throw new Error(`Journal insert: ${jErr.message}`);
    results.push(`Journal: ${journalDefs.length} rows`);

    // ═══════════════════════════════════════
    // 10. Config
    // ═══════════════════════════════════════
    await admin.from("config").delete().eq("org_id", orgId);

    const configDefs = [
      { parametre: "email_responsable_qualite", valeur: "qualite@formation-alsace.fr", description: "Email du responsable qualite" },
      { parametre: "delai_relance_1", valeur: "2", description: "Delai en jours avant relance 1" },
      { parametre: "delai_relance_2", valeur: "5", description: "Delai en jours avant relance 2" },
      { parametre: "delai_relance_3", valeur: "10", description: "Delai en jours avant relance 3" },
      { parametre: "delai_suivi_froid", valeur: "180", description: "Delai en jours avant suivi a froid" },
    ];

    const { error: cErr } = await admin
      .from("config")
      .insert(configDefs.map((c) => ({ org_id: orgId, ...c })));
    if (cErr) throw new Error(`Config insert: ${cErr.message}`);
    results.push(`Config: ${configDefs.length} rows`);

    return NextResponse.json({ success: true, org_id: orgId, results });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err), results },
      { status: 500 }
    );
  }
}
