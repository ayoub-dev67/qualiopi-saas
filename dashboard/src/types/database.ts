// Auto-generated types matching supabase/schema.sql

export type SessionStatut = "planifiee" | "en_cours" | "terminee" | "annulee" | "reportee";
export type SessionModalite = "presentiel" | "distanciel" | "mixte";
export type InscriptionStatut = "inscrit" | "present" | "absent" | "annule";
export type PaiementStatut = "a_facturer" | "facturee" | "payee" | "relancee" | "avoir";
export type FinancementType = "opco" | "entreprise" | "cpf" | "personnel" | "pole_emploi";
export type ReclamationStatut = "nouvelle" | "en_traitement" | "traitee" | "fermee";
export type ReclamationGravite = "mineure" | "importante" | "tres_grave";
export type QuestionnaireType = "positionnement" | "emargement" | "satisfaction" | "evaluation" | "suivi_froid";
export type QuestionnaireStatut = "envoye" | "relance_1" | "relance_2" | "relance_3" | "complete";
export type JournalStatut = "OK" | "ERROR" | "WARNING";
export type UserRole = "owner" | "admin" | "member";

// ── Row types ──

export interface Organization {
  id: string;
  nom: string;
  siret: string | null;
  adresse: string | null;
  email_contact: string | null;
  telephone: string | null;
  nda: string | null;
  referent_handicap_nom: string | null;
  referent_handicap_email: string | null;
  responsable_qualite_email: string | null;
  direction_email: string | null;
  logo_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_status: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Formation {
  id: string;
  org_id: string;
  ref: string;
  intitule: string;
  description: string | null;
  duree_heures: number;
  objectifs: string | null;
  prerequis: string | null;
  modalite: SessionModalite;
  public_vise: string | null;
  tarif: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Formateur {
  id: string;
  org_id: string;
  ref: string;
  nom: string;
  prenom: string;
  email: string | null;
  telephone: string | null;
  specialite: string | null;
  qualifications: string | null;
  cv_url: string | null;
  diplomes_url: string | null;
  dossier_complet: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  org_id: string;
  ref: string;
  formation_id: string;
  formateur_id: string;
  date_debut: string;
  date_fin: string;
  lieu: string | null;
  modalite: SessionModalite;
  statut: SessionStatut;
  nombre_places: number;
  nb_inscrits: number;
  workflow_0_ok: boolean;
  workflow_1_ok: boolean;
  workflow_2_ok: boolean;
  workflow_3_ok: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionWithRelations extends Session {
  formations: Formation;
  formateurs: Formateur;
}

export interface Apprenant {
  id: string;
  org_id: string;
  ref: string;
  nom: string;
  prenom: string;
  email: string | null;
  entreprise: string | null;
  telephone: string | null;
  situation_handicap: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Inscription {
  id: string;
  org_id: string;
  ref: string;
  session_id: string;
  apprenant_id: string;
  statut: InscriptionStatut;
  date_inscription: string;
  convention_envoyee: boolean;
  convocation_envoyee: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface InscriptionWithApprenant extends Inscription {
  apprenants: Apprenant;
}

export interface Positionnement {
  id: string;
  org_id: string;
  inscription_id: string;
  session_id: string;
  niveau: string | null;
  experience: string | null;
  attentes: string | null;
  objectifs_personnels: string | null;
  besoins_specifiques: boolean;
  besoins_details: string | null;
  completed_at: string;
}

export interface Emargement {
  id: string;
  org_id: string;
  inscription_id: string;
  session_id: string;
  date: string;
  demi_journee: string;
  present: boolean;
  plateforme: string | null;
  signed_at: string;
}

export interface Evaluation {
  id: string;
  org_id: string;
  inscription_id: string;
  session_id: string;
  competence_1: number | null;
  competence_2: number | null;
  competence_3: number | null;
  objectifs_atteints: string | null;
  commentaire: string | null;
  completed_at: string;
}

export interface Satisfaction {
  id: string;
  org_id: string;
  inscription_id: string | null;
  session_id: string;
  type_repondant: string | null;
  note_globale: number | null;
  note_contenu: number | null;
  note_formateur: number | null;
  note_organisation: number | null;
  objectifs_atteints: number | null;
  points_forts: string | null;
  axes_amelioration: string | null;
  commentaire: string | null;
  recommandation: boolean | null;
  completed_at: string;
}

export interface SuiviFroid {
  id: string;
  org_id: string;
  inscription_id: string;
  session_id: string;
  en_emploi: string | null;
  meme_domaine: string | null;
  utilisation_competences: string | null;
  note_utilite: number | null;
  commentaire: string | null;
  completed_at: string;
}

export interface Reclamation {
  id: string;
  org_id: string;
  nom: string;
  email: string | null;
  formation: string | null;
  objet: string;
  description: string;
  gravite: ReclamationGravite;
  statut: ReclamationStatut;
  reponse: string | null;
  traite_par: string | null;
  traite_at: string | null;
  created_at: string;
}

export interface QuestionnaireEnvoye {
  id: string;
  org_id: string;
  inscription_id: string | null;
  session_id: string;
  type: QuestionnaireType;
  statut: QuestionnaireStatut;
  date_envoi: string;
  nb_relances: number;
  date_derniere_relance: string | null;
  token: string;
  completed_at: string | null;
  created_at: string;
}

export interface Facture {
  id: string;
  org_id: string;
  ref: string;
  session_id: string | null;
  formation_id: string | null;
  entreprise: string | null;
  financeur: string | null;
  type_financement: FinancementType | null;
  montant_prevu: number;
  montant_facture: number;
  montant_encaisse: number;
  statut_paiement: PaiementStatut;
  date_facture: string | null;
  date_paiement: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  org_id: string;
  workflow: string;
  session_id: string | null;
  session_ref: string | null;
  statut: JournalStatut;
  message: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface KPI {
  id: string;
  org_id: string;
  ref: string;
  nom: string;
  valeur: number;
  unite: string | null;
  date_maj: string;
  created_at: string;
}

export interface Config {
  id: string;
  org_id: string;
  parametre: string;
  valeur: string | null;
  description: string | null;
}

export interface Document {
  id: string;
  org_id: string;
  session_id: string | null;
  inscription_id: string | null;
  type: string;
  nom_fichier: string;
  storage_path: string;
  public_url: string | null;
  created_at: string;
}

// ── Supabase Database type ──

export type Database = {
  public: {
    Tables: {
      organizations: { Row: Organization; Insert: Partial<Organization> & { nom: string }; Update: Partial<Organization>; Relationships: [] };
      profiles: { Row: Profile; Insert: Partial<Profile> & { id: string }; Update: Partial<Profile>; Relationships: [] };
      formations: { Row: Formation; Insert: Partial<Formation> & { org_id: string; ref: string; intitule: string; duree_heures: number }; Update: Partial<Formation>; Relationships: [] };
      formateurs: { Row: Formateur; Insert: Partial<Formateur> & { org_id: string; ref: string; nom: string; prenom: string }; Update: Partial<Formateur>; Relationships: [] };
      sessions: { Row: Session; Insert: Partial<Session> & { org_id: string; ref: string; formation_id: string; formateur_id: string; date_debut: string; date_fin: string }; Update: Partial<Session>; Relationships: [] };
      apprenants: { Row: Apprenant; Insert: Partial<Apprenant> & { org_id: string; ref: string; nom: string; prenom: string }; Update: Partial<Apprenant>; Relationships: [] };
      inscriptions: { Row: Inscription; Insert: Partial<Inscription> & { org_id: string; ref: string; session_id: string; apprenant_id: string }; Update: Partial<Inscription>; Relationships: [] };
      positionnements: { Row: Positionnement; Insert: Partial<Positionnement> & { org_id: string; inscription_id: string; session_id: string }; Update: Partial<Positionnement>; Relationships: [] };
      emargements: { Row: Emargement; Insert: Partial<Emargement> & { org_id: string; inscription_id: string; session_id: string; date: string; demi_journee: string }; Update: Partial<Emargement>; Relationships: [] };
      evaluations: { Row: Evaluation; Insert: Partial<Evaluation> & { org_id: string; inscription_id: string; session_id: string }; Update: Partial<Evaluation>; Relationships: [] };
      satisfaction: { Row: Satisfaction; Insert: Partial<Satisfaction> & { org_id: string; session_id: string }; Update: Partial<Satisfaction>; Relationships: [] };
      suivi_froid: { Row: SuiviFroid; Insert: Partial<SuiviFroid> & { org_id: string; inscription_id: string; session_id: string }; Update: Partial<SuiviFroid>; Relationships: [] };
      reclamations: { Row: Reclamation; Insert: Partial<Reclamation> & { org_id: string; nom: string; objet: string; description: string }; Update: Partial<Reclamation>; Relationships: [] };
      questionnaires_envoyes: { Row: QuestionnaireEnvoye; Insert: Partial<QuestionnaireEnvoye> & { org_id: string; session_id: string; type: QuestionnaireType }; Update: Partial<QuestionnaireEnvoye>; Relationships: [] };
      factures: { Row: Facture; Insert: Partial<Facture> & { org_id: string; ref: string }; Update: Partial<Facture>; Relationships: [] };
      journal_systeme: { Row: JournalEntry; Insert: Partial<JournalEntry> & { org_id: string; workflow: string }; Update: Partial<JournalEntry>; Relationships: [] };
      kpis: { Row: KPI; Insert: Partial<KPI> & { org_id: string; ref: string; nom: string }; Update: Partial<KPI>; Relationships: [] };
      config: { Row: Config; Insert: Partial<Config> & { org_id: string; parametre: string }; Update: Partial<Config>; Relationships: [] };
      documents: { Row: Document; Insert: Partial<Document> & { org_id: string; type: string; nom_fichier: string; storage_path: string }; Update: Partial<Document>; Relationships: [] };
    };
    Views: {
      [_ in never]: never;
    };
    Enums: {
      session_statut: SessionStatut;
      session_modalite: SessionModalite;
      inscription_statut: InscriptionStatut;
      paiement_statut: PaiementStatut;
      financement_type: FinancementType;
      reclamation_statut: ReclamationStatut;
      reclamation_gravite: ReclamationGravite;
      questionnaire_type: QuestionnaireType;
      questionnaire_statut: QuestionnaireStatut;
      journal_statut: JournalStatut;
      user_role: UserRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
    Functions: {
      generate_ref: {
        Args: { prefix: string; org: string; tbl: string };
        Returns: string;
      };
    };
  };
};
