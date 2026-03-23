-- ═══════════════════════════════════════════════
-- Qualiopi SaaS — Complete Database Schema
-- Target: Supabase PostgreSQL
-- ═══════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════
-- ENUMS
-- ═══════════════════════════════════════════════

CREATE TYPE session_statut AS ENUM ('planifiee', 'en_cours', 'terminee', 'annulee', 'reportee');
CREATE TYPE session_modalite AS ENUM ('presentiel', 'distanciel', 'mixte');
CREATE TYPE inscription_statut AS ENUM ('inscrit', 'present', 'absent', 'annule');
CREATE TYPE paiement_statut AS ENUM ('a_facturer', 'facturee', 'payee', 'relancee', 'avoir');
CREATE TYPE financement_type AS ENUM ('opco', 'entreprise', 'cpf', 'personnel', 'pole_emploi');
CREATE TYPE reclamation_statut AS ENUM ('nouvelle', 'en_traitement', 'traitee', 'fermee');
CREATE TYPE reclamation_gravite AS ENUM ('mineure', 'importante', 'tres_grave');
CREATE TYPE questionnaire_type AS ENUM ('positionnement', 'emargement', 'satisfaction', 'evaluation', 'suivi_froid');
CREATE TYPE questionnaire_statut AS ENUM ('envoye', 'relance_1', 'relance_2', 'relance_3', 'complete');
CREATE TYPE journal_statut AS ENUM ('OK', 'ERROR', 'WARNING');
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');

-- ═══════════════════════════════════════════════
-- TABLES
-- ═══════════════════════════════════════════════

-- Organizations (multi-tenant root)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  siret TEXT,
  adresse TEXT,
  email_contact TEXT,
  telephone TEXT,
  nda TEXT,
  referent_handicap_nom TEXT,
  referent_handicap_email TEXT,
  responsable_qualite_email TEXT,
  direction_email TEXT,
  logo_url TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_status TEXT DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT,
  role user_role DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Formations
CREATE TABLE formations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  intitule TEXT NOT NULL,
  description TEXT,
  duree_heures INTEGER NOT NULL CHECK (duree_heures > 0),
  objectifs TEXT,
  prerequis TEXT,
  modalite session_modalite DEFAULT 'presentiel',
  public_vise TEXT,
  tarif DECIMAL(10,2) DEFAULT 0,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, ref)
);

-- Formateurs
CREATE TABLE formateurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  telephone TEXT,
  specialite TEXT,
  qualifications TEXT,
  cv_url TEXT,
  diplomes_url TEXT,
  dossier_complet BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, ref)
);

-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  formation_id UUID NOT NULL REFERENCES formations(id),
  formateur_id UUID NOT NULL REFERENCES formateurs(id),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  lieu TEXT,
  modalite session_modalite DEFAULT 'presentiel',
  statut session_statut DEFAULT 'planifiee',
  nombre_places INTEGER DEFAULT 10,
  nb_inscrits INTEGER DEFAULT 0,
  workflow_0_ok BOOLEAN DEFAULT FALSE,
  workflow_1_ok BOOLEAN DEFAULT FALSE,
  workflow_2_ok BOOLEAN DEFAULT FALSE,
  workflow_3_ok BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, ref)
);

-- Apprenants
CREATE TABLE apprenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  email TEXT,
  entreprise TEXT,
  telephone TEXT,
  situation_handicap BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, ref)
);

-- Inscriptions (session <-> apprenant)
CREATE TABLE inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  session_id UUID NOT NULL REFERENCES sessions(id),
  apprenant_id UUID NOT NULL REFERENCES apprenants(id),
  statut inscription_statut DEFAULT 'inscrit',
  date_inscription DATE DEFAULT CURRENT_DATE,
  convention_envoyee BOOLEAN DEFAULT FALSE,
  convocation_envoyee BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, ref),
  UNIQUE(session_id, apprenant_id)
);

-- Positionnements
CREATE TABLE positionnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inscription_id UUID NOT NULL REFERENCES inscriptions(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  niveau TEXT,
  experience TEXT,
  attentes TEXT,
  objectifs_personnels TEXT,
  besoins_specifiques BOOLEAN DEFAULT FALSE,
  besoins_details TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emargements
CREATE TABLE emargements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inscription_id UUID NOT NULL REFERENCES inscriptions(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  date DATE NOT NULL,
  demi_journee TEXT NOT NULL,
  present BOOLEAN DEFAULT TRUE,
  plateforme TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inscription_id UUID NOT NULL REFERENCES inscriptions(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  competence_1 INTEGER CHECK (competence_1 BETWEEN 1 AND 10),
  competence_2 INTEGER CHECK (competence_2 BETWEEN 1 AND 10),
  competence_3 INTEGER CHECK (competence_3 BETWEEN 1 AND 10),
  objectifs_atteints TEXT,
  commentaire TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Satisfaction
CREATE TABLE satisfaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inscription_id UUID REFERENCES inscriptions(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  type_repondant TEXT,
  note_globale INTEGER CHECK (note_globale BETWEEN 1 AND 10),
  note_contenu INTEGER CHECK (note_contenu BETWEEN 1 AND 10),
  note_formateur INTEGER CHECK (note_formateur BETWEEN 1 AND 10),
  note_organisation INTEGER CHECK (note_organisation BETWEEN 1 AND 10),
  objectifs_atteints INTEGER CHECK (objectifs_atteints BETWEEN 1 AND 10),
  points_forts TEXT,
  axes_amelioration TEXT,
  commentaire TEXT,
  recommandation BOOLEAN,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suivi à froid
CREATE TABLE suivi_froid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inscription_id UUID NOT NULL REFERENCES inscriptions(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  en_emploi TEXT,
  meme_domaine TEXT,
  utilisation_competences TEXT,
  note_utilite INTEGER CHECK (note_utilite BETWEEN 1 AND 10),
  commentaire TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Réclamations
CREATE TABLE reclamations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  email TEXT,
  formation TEXT,
  objet TEXT NOT NULL,
  description TEXT NOT NULL,
  gravite reclamation_gravite DEFAULT 'mineure',
  statut reclamation_statut DEFAULT 'nouvelle',
  reponse TEXT,
  traite_par TEXT,
  traite_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaires envoyés
CREATE TABLE questionnaires_envoyes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  inscription_id UUID REFERENCES inscriptions(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  type questionnaire_type NOT NULL,
  statut questionnaire_statut DEFAULT 'envoye',
  date_envoi DATE DEFAULT CURRENT_DATE,
  nb_relances INTEGER DEFAULT 0,
  date_derniere_relance DATE,
  token TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Factures
CREATE TABLE factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  session_id UUID REFERENCES sessions(id),
  formation_id UUID REFERENCES formations(id),
  entreprise TEXT,
  financeur TEXT,
  type_financement financement_type,
  montant_prevu DECIMAL(10,2) DEFAULT 0,
  montant_facture DECIMAL(10,2) DEFAULT 0,
  montant_encaisse DECIMAL(10,2) DEFAULT 0,
  statut_paiement paiement_statut DEFAULT 'a_facturer',
  date_facture DATE,
  date_paiement DATE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, ref)
);

-- Journal système
CREATE TABLE journal_systeme (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workflow TEXT NOT NULL,
  session_id UUID REFERENCES sessions(id),
  session_ref TEXT,
  statut journal_statut DEFAULT 'OK',
  message TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPIs
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  nom TEXT NOT NULL,
  valeur DECIMAL(10,2) DEFAULT 0,
  unite TEXT,
  date_maj TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Config
CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parametre TEXT NOT NULL,
  valeur TEXT,
  description TEXT,
  UNIQUE(org_id, parametre)
);

-- Documents générés
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id),
  inscription_id UUID REFERENCES inscriptions(id),
  type TEXT NOT NULL,
  nom_fichier TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════

CREATE INDEX idx_formations_org ON formations(org_id) WHERE NOT is_deleted;
CREATE INDEX idx_formateurs_org ON formateurs(org_id) WHERE NOT is_deleted;
CREATE INDEX idx_sessions_org ON sessions(org_id) WHERE NOT is_deleted;
CREATE INDEX idx_sessions_statut ON sessions(org_id, statut) WHERE NOT is_deleted;
CREATE INDEX idx_apprenants_org ON apprenants(org_id) WHERE NOT is_deleted;
CREATE INDEX idx_inscriptions_session ON inscriptions(session_id) WHERE NOT is_deleted;
CREATE INDEX idx_inscriptions_apprenant ON inscriptions(apprenant_id) WHERE NOT is_deleted;
CREATE INDEX idx_satisfaction_session ON satisfaction(session_id);
CREATE INDEX idx_emargements_session ON emargements(session_id);
CREATE INDEX idx_questionnaires_session ON questionnaires_envoyes(session_id);
CREATE INDEX idx_questionnaires_token ON questionnaires_envoyes(token);
CREATE INDEX idx_journal_org ON journal_systeme(org_id);
CREATE INDEX idx_journal_workflow ON journal_systeme(org_id, workflow);
CREATE INDEX idx_factures_org ON factures(org_id) WHERE NOT is_deleted;
CREATE INDEX idx_documents_session ON documents(session_id);

-- ═══════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE formateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE positionnements ENABLE ROW LEVEL SECURITY;
ALTER TABLE emargements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE satisfaction ENABLE ROW LEVEL SECURITY;
ALTER TABLE suivi_froid ENABLE ROW LEVEL SECURITY;
ALTER TABLE reclamations ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaires_envoyes ENABLE ROW LEVEL SECURITY;
ALTER TABLE factures ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_systeme ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Organizations
CREATE POLICY "Users can view their org" ON organizations FOR SELECT USING (
  id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update their org" ON organizations FOR UPDATE USING (
  id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);

-- Profiles
CREATE POLICY "Users can view org profiles" ON profiles FOR SELECT USING (
  org_id = (SELECT org_id FROM profiles WHERE id = auth.uid())
);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (id = auth.uid());

-- Generic org-scoped policies for all data tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'formations','formateurs','sessions','apprenants','inscriptions',
    'positionnements','emargements','evaluations','satisfaction','suivi_froid',
    'reclamations','questionnaires_envoyes','factures','journal_systeme',
    'kpis','config','documents'
  ]) LOOP
    EXECUTE format(
      'CREATE POLICY "org_select_%s" ON %I FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "org_insert_%s" ON %I FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY "org_update_%s" ON %I FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))',
      t, t
    );
  END LOOP;
END $$;

-- Public token access for questionnaires (apprenants answer via unique link)
CREATE POLICY "public_token_select" ON questionnaires_envoyes FOR SELECT USING (TRUE);
CREATE POLICY "public_token_update" ON questionnaires_envoyes FOR UPDATE USING (TRUE);

-- ═══════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════

-- Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'organizations','profiles','formations','formateurs','sessions',
    'apprenants','inscriptions','factures'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- Auto update nb_inscrits on inscriptions insert/delete
CREATE OR REPLACE FUNCTION update_nb_inscrits()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE sessions SET nb_inscrits = nb_inscrits + 1 WHERE id = NEW.session_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE sessions SET nb_inscrits = nb_inscrits - 1 WHERE id = OLD.session_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_nb_inscrits
AFTER INSERT OR DELETE ON inscriptions
FOR EACH ROW EXECUTE FUNCTION update_nb_inscrits();

-- ═══════════════════════════════════════════════
-- REF GENERATOR (auto-increment business IDs)
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_ref(prefix TEXT, org UUID, tbl TEXT)
RETURNS TEXT AS $$
DECLARE
  max_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');

  IF prefix IN ('SES', 'FAC') THEN
    EXECUTE format(
      'SELECT COALESCE(MAX(CAST(SPLIT_PART(ref, ''-'', 3) AS INTEGER)), 0) FROM %I WHERE org_id = $1 AND ref LIKE $2',
      tbl
    ) INTO max_num USING org, prefix || '-' || year_str || '-%';
    RETURN prefix || '-' || year_str || '-' || LPAD((max_num + 1)::TEXT, 3, '0');
  ELSE
    EXECUTE format(
      'SELECT COALESCE(MAX(CAST(SPLIT_PART(ref, ''-'', 2) AS INTEGER)), 0) FROM %I WHERE org_id = $1 AND ref LIKE $2',
      tbl
    ) INTO max_num USING org, prefix || '-%';
    RETURN prefix || '-' || LPAD((max_num + 1)::TEXT, 3, '0');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════
-- AUTH TRIGGER — auto-create org + profile on signup
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id UUID;
BEGIN
  INSERT INTO organizations (nom)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'org_name', 'Mon organisme'))
  RETURNING id INTO new_org_id;

  INSERT INTO profiles (id, org_id, full_name, role)
  VALUES (NEW.id, new_org_id, NEW.raw_user_meta_data->>'full_name', 'owner');

  INSERT INTO config (org_id, parametre, valeur, description) VALUES
    (new_org_id, 'delai_relance_1', '2', 'Jours avant première relance'),
    (new_org_id, 'delai_relance_2', '5', 'Jours avant deuxième relance'),
    (new_org_id, 'delai_relance_3', '10', 'Jours avant troisième relance'),
    (new_org_id, 'delai_suivi_froid', '180', 'Jours après fin pour suivi à froid');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════
-- STORAGE (create bucket via dashboard or API)
-- Bucket: "documents" (private)
-- ═══════════════════════════════════════════════
