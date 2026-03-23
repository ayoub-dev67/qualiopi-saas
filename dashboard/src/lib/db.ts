import { createServerSupabaseClient } from "./supabase-server";
import { createAdminClient } from "./supabase";
import type {
  Organization, Formation, Formateur, Session, SessionWithRelations,
  Apprenant, Inscription, InscriptionWithApprenant, Positionnement, Emargement,
  Evaluation, Satisfaction, SuiviFroid, Reclamation, QuestionnaireEnvoye,
  Facture, JournalEntry, KPI, Config, Document,
  SessionStatut, QuestionnaireType, JournalStatut,
} from "@/types/database";

// ── Helpers ──

async function getOrgId(): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("org_id").eq("id", user.id).single();
  if (!profile?.org_id) throw new Error("No organization found");
  return profile.org_id;
}

async function getClient() {
  return createServerSupabaseClient();
}

// ── READ ──

export async function getOrganization(): Promise<Organization | null> {
  const supabase = await getClient();
  const { data } = await supabase.from("organizations").select("*").single();
  return data;
}

export async function getProfile() {
  const supabase = await getClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*, organizations(*)").eq("id", user.id).single();
  return data;
}

export async function getFormations(): Promise<Formation[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("formations").select("*").eq("is_deleted", false).order("ref");
  return data ?? [];
}

export async function getFormation(id: string): Promise<Formation | null> {
  const supabase = await getClient();
  const { data } = await supabase.from("formations").select("*").eq("id", id).single();
  return data;
}

export async function getFormateurs(): Promise<Formateur[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("formateurs").select("*").eq("is_deleted", false).order("nom");
  return data ?? [];
}

export async function getFormateur(id: string): Promise<Formateur | null> {
  const supabase = await getClient();
  const { data } = await supabase.from("formateurs").select("*").eq("id", id).single();
  return data;
}

export async function getSessions(): Promise<SessionWithRelations[]> {
  const supabase = await getClient();
  const { data } = await supabase
    .from("sessions")
    .select("*, formations(*), formateurs(*)")
    .eq("is_deleted", false)
    .order("date_debut", { ascending: false });
  return (data ?? []) as SessionWithRelations[];
}

export async function getSession(id: string): Promise<SessionWithRelations | null> {
  const supabase = await getClient();
  const { data } = await supabase
    .from("sessions")
    .select("*, formations(*), formateurs(*)")
    .eq("id", id)
    .single();
  return data as SessionWithRelations | null;
}

export async function getSessionByRef(ref: string): Promise<SessionWithRelations | null> {
  const supabase = await getClient();
  const { data } = await supabase
    .from("sessions")
    .select("*, formations(*), formateurs(*)")
    .eq("ref", ref)
    .single();
  return data as SessionWithRelations | null;
}

export async function getApprenants(): Promise<Apprenant[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("apprenants").select("*").eq("is_deleted", false).order("nom");
  return data ?? [];
}

export async function getInscriptions(sessionId?: string): Promise<InscriptionWithApprenant[]> {
  const supabase = await getClient();
  let q = supabase.from("inscriptions").select("*, apprenants(*)").eq("is_deleted", false);
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q.order("created_at");
  return (data ?? []) as InscriptionWithApprenant[];
}

export async function getPositionnements(sessionId?: string): Promise<Positionnement[]> {
  const supabase = await getClient();
  let q = supabase.from("positionnements").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q;
  return data ?? [];
}

export async function getEmargements(sessionId?: string): Promise<Emargement[]> {
  const supabase = await getClient();
  let q = supabase.from("emargements").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q;
  return data ?? [];
}

export async function getEvaluations(sessionId?: string): Promise<Evaluation[]> {
  const supabase = await getClient();
  let q = supabase.from("evaluations").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q;
  return data ?? [];
}

export async function getSatisfaction(sessionId?: string): Promise<Satisfaction[]> {
  const supabase = await getClient();
  let q = supabase.from("satisfaction").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q;
  return data ?? [];
}

export async function getSuiviFroid(sessionId?: string): Promise<SuiviFroid[]> {
  const supabase = await getClient();
  let q = supabase.from("suivi_froid").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q;
  return data ?? [];
}

export async function getReclamations(): Promise<Reclamation[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("reclamations").select("*").order("created_at", { ascending: false });
  return data ?? [];
}

export async function getQuestionnairesEnvoyes(sessionId?: string): Promise<QuestionnaireEnvoye[]> {
  const supabase = await getClient();
  let q = supabase.from("questionnaires_envoyes").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q.order("created_at", { ascending: false });
  return data ?? [];
}

export async function getFactures(): Promise<Facture[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("factures").select("*, sessions(ref, formations(intitule))").eq("is_deleted", false).order("created_at", { ascending: false });
  return (data ?? []) as Facture[];
}

export async function getJournal(limit = 20): Promise<JournalEntry[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("journal_systeme").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function getKPIs(): Promise<KPI[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("kpis").select("*");
  return data ?? [];
}

export async function getConfig(): Promise<Config[]> {
  const supabase = await getClient();
  const { data } = await supabase.from("config").select("*");
  return data ?? [];
}

export async function getConfigValue(parametre: string): Promise<string | null> {
  const supabase = await getClient();
  const { data } = await supabase.from("config").select("valeur").eq("parametre", parametre).single();
  return data?.valeur ?? null;
}

export async function getDocuments(sessionId?: string): Promise<Document[]> {
  const supabase = await getClient();
  let q = supabase.from("documents").select("*");
  if (sessionId) q = q.eq("session_id", sessionId);
  const { data } = await q.order("created_at", { ascending: false });
  return data ?? [];
}

// ── WRITE ──

async function generateRef(prefix: string, table: string): Promise<string> {
  const orgId = await getOrgId();
  const supabase = await getClient();
  const { data, error } = await supabase.rpc("generate_ref", { prefix, org: orgId, tbl: table });
  if (error) throw error;
  return data as string;
}

export async function createFormation(input: { intitule: string; duree_heures: number; objectifs?: string; prerequis?: string; modalite?: string; public_vise?: string; tarif?: number; description?: string }) {
  const orgId = await getOrgId();
  const ref = await generateRef("FOR", "formations");
  const supabase = await getClient();
  const { data, error } = await supabase.from("formations").insert({ org_id: orgId, ref, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function createFormateur(input: { nom: string; prenom: string; email?: string; specialite?: string; qualifications?: string }) {
  const orgId = await getOrgId();
  const ref = await generateRef("FORM", "formateurs");
  const supabase = await getClient();
  const { data, error } = await supabase.from("formateurs").insert({ org_id: orgId, ref, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function createSession(input: { formation_id: string; formateur_id: string; date_debut: string; date_fin: string; lieu?: string; modalite?: string; nombre_places?: number }) {
  const orgId = await getOrgId();
  const ref = await generateRef("SES", "sessions");
  const supabase = await getClient();
  const { data, error } = await supabase.from("sessions").insert({ org_id: orgId, ref, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function updateSessionStatus(id: string, statut: SessionStatut) {
  const supabase = await getClient();
  const { error } = await supabase.from("sessions").update({ statut }).eq("id", id);
  if (error) throw error;
}

export async function updateSessionWorkflow(id: string, field: "workflow_0_ok" | "workflow_1_ok" | "workflow_2_ok" | "workflow_3_ok", value = true) {
  const supabase = await getClient();
  const { error } = await supabase.from("sessions").update({ [field]: value }).eq("id", id);
  if (error) throw error;
}

export async function createApprenant(input: { nom: string; prenom: string; email?: string; entreprise?: string; situation_handicap?: boolean }) {
  const orgId = await getOrgId();
  const ref = await generateRef("APP", "apprenants");
  const supabase = await getClient();
  const { data, error } = await supabase.from("apprenants").insert({ org_id: orgId, ref, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function createInscription(input: { session_id: string; apprenant_id: string }) {
  const orgId = await getOrgId();
  const ref = await generateRef("INS", "inscriptions");
  const supabase = await getClient();
  const { data, error } = await supabase.from("inscriptions").insert({ org_id: orgId, ref, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function createFacture(input: { session_id?: string; formation_id?: string; entreprise?: string; type_financement?: string; montant_prevu?: number; montant_facture?: number; montant_encaisse?: number; statut_paiement?: string; date_facture?: string }) {
  const orgId = await getOrgId();
  const ref = await generateRef("FAC", "factures");
  const supabase = await getClient();
  const { data, error } = await supabase.from("factures").insert({ org_id: orgId, ref, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function createReclamation(input: { nom: string; objet: string; description: string; email?: string; formation?: string; gravite?: string }) {
  const orgId = await getOrgId();
  const supabase = await getClient();
  const { data, error } = await supabase.from("reclamations").insert({ org_id: orgId, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function createQuestionnaire(input: { session_id: string; inscription_id?: string; type: QuestionnaireType }, adminClient?: ReturnType<typeof createAdminClient>) {
  const client = adminClient ?? await getClient();
  // For admin client we need org_id from the session
  let orgId: string;
  if (adminClient) {
    const { data: session } = await client.from("sessions").select("org_id").eq("id", input.session_id).single();
    orgId = session!.org_id;
  } else {
    orgId = await getOrgId();
  }
  const { data, error } = await client.from("questionnaires_envoyes").insert({ org_id: orgId, ...input } as never).select().single();
  if (error) throw error;
  return data as QuestionnaireEnvoye;
}

export async function updateQuestionnaire(id: string, updates: Partial<QuestionnaireEnvoye>) {
  const supabase = await getClient();
  const { error } = await supabase.from("questionnaires_envoyes").update(updates as never).eq("id", id);
  if (error) throw error;
}

export async function logJournal(workflow: string, sessionId: string | null, sessionRef: string | null, statut: JournalStatut, message: string, details?: Record<string, unknown>, adminClient?: ReturnType<typeof createAdminClient>) {
  const client = adminClient ?? await getClient();
  let orgId: string;
  if (adminClient && sessionId) {
    const { data: session } = await client.from("sessions").select("org_id").eq("id", sessionId).single();
    orgId = session?.org_id ?? "";
  } else if (adminClient) {
    orgId = "";
  } else {
    orgId = await getOrgId();
  }
  await client.from("journal_systeme").insert({
    org_id: orgId, workflow, session_id: sessionId, session_ref: sessionRef, statut, message, details: details ?? null,
  } as never);
}

export async function updateKPI(ref: string, nom: string, valeur: number, unite: string) {
  const orgId = await getOrgId();
  const supabase = await getClient();
  const { data: existing } = await supabase.from("kpis").select("id").eq("ref", ref).single();
  if (existing) {
    await supabase.from("kpis").update({ valeur, date_maj: new Date().toISOString() } as never).eq("id", existing.id);
  } else {
    await supabase.from("kpis").insert({ org_id: orgId, ref, nom, valeur, unite } as never);
  }
}

export async function saveDocument(input: { session_id?: string; inscription_id?: string; type: string; nom_fichier: string; storage_path: string; public_url?: string }, adminClient?: ReturnType<typeof createAdminClient>) {
  const client = adminClient ?? await getClient();
  let orgId: string;
  if (adminClient && input.session_id) {
    const { data: session } = await client.from("sessions").select("org_id").eq("id", input.session_id).single();
    orgId = session!.org_id;
  } else {
    orgId = await getOrgId();
  }
  const { data, error } = await client.from("documents").insert({ org_id: orgId, ...input } as never).select().single();
  if (error) throw error;
  return data;
}

export async function updateOrganization(updates: Partial<Organization>) {
  const supabase = await getClient();
  const { data: org } = await supabase.from("organizations").select("id").single();
  if (!org) throw new Error("Organization not found");
  const { error } = await supabase.from("organizations").update(updates as never).eq("id", org.id);
  if (error) throw error;
}

// ── QUALIOPI SCORE (same logic as before, from DB data) ──

export async function getQualiopiScore() {
  const [org, formations, formateurs, inscriptions, satisfaction, reclamations] = await Promise.all([
    getOrganization(),
    getFormations(),
    getFormateurs(),
    getInscriptions(),
    getSatisfaction(),
    getReclamations(),
  ]);

  const orgFields = org ? Object.values(org).filter((v) => v && String(v).trim() !== "").length : 0;
  const orgTotal = Math.max(1, org ? Object.keys(org).length : 1);

  const formCompletes = formations.filter((f) => f.intitule && f.objectifs && f.prerequis && f.duree_heures).length;

  const positionDone = inscriptions.filter((i) => i.statut === "present").length;

  const formateursDossier = formateurs.filter((f) => f.dossier_complet).length;
  const formateursQualif = formateurs.filter((f) => f.qualifications && f.qualifications.trim() !== "").length;

  const recTraitees = reclamations.filter((r) => ["traitee", "fermee"].includes(r.statut)).length;

  const satNotes = satisfaction.map((s) => s.note_globale).filter((n): n is number => n !== null);
  const satMoy = satNotes.length > 0 ? satNotes.reduce((a, b) => a + b, 0) / satNotes.length : 0;

  const criteres = [
    { num: 1, label: "Information", score: Math.round((orgFields / orgTotal) * 100) },
    { num: 2, label: "Objectifs", score: formations.length > 0 ? Math.round((formCompletes / formations.length) * 100) : 0 },
    { num: 3, label: "Adaptation", score: inscriptions.length > 0 ? Math.round((positionDone / inscriptions.length) * 100) : 0 },
    { num: 4, label: "Moyens", score: formateurs.length > 0 ? Math.round((formateursDossier / formateurs.length) * 100) : 0 },
    { num: 5, label: "Compétences", score: formateurs.length > 0 ? Math.round((formateursQualif / formateurs.length) * 100) : 0 },
    { num: 6, label: "Engagement", score: reclamations.length > 0 ? Math.round((recTraitees / reclamations.length) * 100) : 100 },
    { num: 7, label: "Amélioration", score: satNotes.length > 0 ? Math.min(100, Math.round((satMoy / 7) * 100)) : 0 },
  ];

  const score = Math.round(criteres.reduce((sum, c) => sum + c.score, 0) / criteres.length);

  return { score, criteres, satMoyenne: satMoy, satNotes };
}
