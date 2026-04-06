-- Qualiopi improvements migration
-- Date: 2026-04-06
-- Apply this file in the Supabase SQL editor.

-- ═══════════════════════════════════════════════
-- 1. Add type_action enum + column for Qualiopi indicateur 4
-- ═══════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE type_action_formation AS ENUM (
    'formation_continue',
    'apprentissage',
    'bilan_competences',
    'vae'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS type_action type_action_formation DEFAULT 'formation_continue';

-- ═══════════════════════════════════════════════
-- 2. Extend financement_type enum
-- ═══════════════════════════════════════════════

DO $$ BEGIN
  ALTER TYPE financement_type ADD VALUE IF NOT EXISTS 'region';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE financement_type ADD VALUE IF NOT EXISTS 'agefiph';
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TYPE financement_type ADD VALUE IF NOT EXISTS 'plan_developpement';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ═══════════════════════════════════════════════
-- 3. Non-conformities table
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS non_conformites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ref TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('majeure', 'mineure', 'remarque')),
  origine TEXT,
  description TEXT NOT NULL,
  action_corrective TEXT,
  responsable TEXT,
  echeance DATE,
  statut TEXT DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'en_cours', 'cloturee')),
  cloture_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, ref)
);

ALTER TABLE non_conformites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_non_conformites" ON non_conformites;
CREATE POLICY "org_select_non_conformites" ON non_conformites FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "org_insert_non_conformites" ON non_conformites;
CREATE POLICY "org_insert_non_conformites" ON non_conformites FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "org_update_non_conformites" ON non_conformites;
CREATE POLICY "org_update_non_conformites" ON non_conformites FOR UPDATE
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_nc_org ON non_conformites(org_id);
CREATE INDEX IF NOT EXISTS idx_nc_statut ON non_conformites(org_id, statut);

-- ═══════════════════════════════════════════════
-- 4. BPF table (Bilan Pédagogique et Financier)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bpf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  annee INTEGER NOT NULL,
  ca_total DECIMAL(12, 2) DEFAULT 0,
  nb_stagiaires INTEGER DEFAULT 0,
  nb_heures_stagiaires INTEGER DEFAULT 0,
  nb_actions INTEGER DEFAULT 0,
  statut TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'finalise', 'depose')),
  date_depot DATE,
  donnees JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, annee)
);

ALTER TABLE bpf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_select_bpf" ON bpf;
CREATE POLICY "org_select_bpf" ON bpf FOR SELECT
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "org_insert_bpf" ON bpf;
CREATE POLICY "org_insert_bpf" ON bpf FOR INSERT
  WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "org_update_bpf" ON bpf;
CREATE POLICY "org_update_bpf" ON bpf FOR UPDATE
  USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
