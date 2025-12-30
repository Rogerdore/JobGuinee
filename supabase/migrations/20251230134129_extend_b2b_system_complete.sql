/*
  # Extension complète du système B2B - Externalisation RH
  
  1. Tables existantes étendues
    - `b2b_leads` - Ajout champs détaillés mission RH
    - `b2b_pipeline` - Amélioration tracking
    
  2. Nouvelles tables
    - `b2b_contracts` - Contrats clients
    - `b2b_client_feedback` - Scores satisfaction
    - `b2b_documents` - Documents missions (devis, rapports, etc.)
    - `b2b_mission_reports` - Rapports RH détaillés
    
  3. Sécurité
    - RLS activé sur toutes les tables
    - Policies admin et client appropriées
    
  4. Fonctions
    - Génération numéros contrats
    - Calcul satisfaction moyenne
*/

-- Étendre b2b_leads avec champs détaillés
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS mission_type text;
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS positions_count integer DEFAULT 1;
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS seniority_level text;
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS estimated_budget decimal(12,2);
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS budget_currency text DEFAULT 'GNF';
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS additional_requirements jsonb DEFAULT '{}';
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS preferred_contact_method text DEFAULT 'email';
ALTER TABLE b2b_leads ADD COLUMN IF NOT EXISTS preferred_contact_time text;

-- Table contrats B2B
CREATE TABLE IF NOT EXISTS b2b_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number text UNIQUE NOT NULL,
  pipeline_id uuid REFERENCES b2b_pipeline(id),
  lead_id uuid REFERENCES b2b_leads(id),
  quote_id uuid REFERENCES b2b_quotes(id),
  contract_title text NOT NULL,
  contract_type text NOT NULL CHECK (contract_type IN ('externalisation_recrutement', 'cvtheque_access', 'ats_license', 'formation', 'conseil_rh', 'pack_enterprise', 'autre')),
  client_company text NOT NULL,
  client_contact_name text NOT NULL,
  client_contact_email text NOT NULL,
  client_contact_phone text,
  contract_value decimal(12,2) NOT NULL,
  currency text DEFAULT 'GNF',
  payment_terms text,
  start_date date,
  end_date date,
  auto_renewal boolean DEFAULT false,
  terms_and_conditions text,
  special_clauses jsonb DEFAULT '[]',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_signature', 'signed', 'active', 'completed', 'cancelled', 'expired')),
  signed_at timestamptz,
  signed_by_client text,
  signed_by_admin uuid REFERENCES profiles(id),
  document_url text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table feedback clients
CREATE TABLE IF NOT EXISTS b2b_client_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES b2b_missions(id),
  pipeline_id uuid REFERENCES b2b_pipeline(id),
  lead_id uuid REFERENCES b2b_leads(id),
  client_email text NOT NULL,
  satisfaction_score integer NOT NULL CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  quality_score integer CHECK (quality_score >= 1 AND quality_score <= 5),
  timeliness_score integer CHECK (timeliness_score >= 1 AND timeliness_score <= 5),
  communication_score integer CHECK (communication_score >= 1 AND communication_score <= 5),
  value_for_money_score integer CHECK (value_for_money_score >= 1 AND value_for_money_score <= 5),
  would_recommend boolean,
  positive_feedback text,
  areas_for_improvement text,
  testimonial text,
  allow_public_testimonial boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table documents B2B
CREATE TABLE IF NOT EXISTS b2b_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES b2b_pipeline(id),
  lead_id uuid REFERENCES b2b_leads(id),
  quote_id uuid REFERENCES b2b_quotes(id),
  mission_id uuid REFERENCES b2b_missions(id),
  contract_id uuid REFERENCES b2b_contracts(id),
  document_type text NOT NULL CHECK (document_type IN ('quote_pdf', 'contract', 'mission_report', 'invoice', 'candidate_shortlist', 'hr_analysis', 'other')),
  document_title text NOT NULL,
  document_description text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  is_confidential boolean DEFAULT true,
  is_signed boolean DEFAULT false,
  signed_at timestamptz,
  uploaded_by uuid REFERENCES profiles(id),
  accessible_by_client boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Table rapports RH missions
CREATE TABLE IF NOT EXISTS b2b_mission_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id uuid REFERENCES b2b_missions(id) NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('initial_analysis', 'candidate_shortlist', 'interview_summary', 'final_recommendation', 'post_placement_followup')),
  report_title text NOT NULL,
  executive_summary text,
  detailed_content jsonb NOT NULL DEFAULT '{}',
  candidates_evaluated integer DEFAULT 0,
  candidates_shortlisted integer DEFAULT 0,
  candidates_interviewed integer DEFAULT 0,
  candidate_profiles jsonb DEFAULT '[]',
  market_insights text,
  recommendations text,
  next_steps text,
  report_status text DEFAULT 'draft' CHECK (report_status IN ('draft', 'review', 'approved', 'sent_to_client')),
  generated_by uuid REFERENCES profiles(id),
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  sent_to_client_at timestamptz,
  pdf_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fonction génération numéro contrat
CREATE OR REPLACE FUNCTION generate_contract_number()
RETURNS text AS $$
DECLARE
  new_number text;
  year_code text;
  sequence_num integer;
BEGIN
  year_code := TO_CHAR(NOW(), 'YY');
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(contract_number FROM 5) AS integer)), 0) + 1
  INTO sequence_num
  FROM b2b_contracts
  WHERE contract_number LIKE 'CT' || year_code || '%';
  
  new_number := 'CT' || year_code || LPAD(sequence_num::text, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction calcul satisfaction moyenne client
CREATE OR REPLACE FUNCTION get_client_satisfaction_avg(p_lead_id uuid)
RETURNS decimal AS $$
DECLARE
  avg_satisfaction decimal;
BEGIN
  SELECT AVG(satisfaction_score)
  INTO avg_satisfaction
  FROM b2b_client_feedback
  WHERE lead_id = p_lead_id;
  
  RETURN COALESCE(avg_satisfaction, 0);
END;
$$ LANGUAGE plpgsql;

-- RLS pour b2b_contracts
ALTER TABLE b2b_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to contracts"
  ON b2b_contracts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- RLS pour b2b_client_feedback
ALTER TABLE b2b_client_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all feedback"
  ON b2b_client_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Clients can submit feedback"
  ON b2b_client_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS pour b2b_documents
ALTER TABLE b2b_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to documents"
  ON b2b_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Clients can view their accessible documents"
  ON b2b_documents
  FOR SELECT
  TO authenticated
  USING (
    accessible_by_client = true
    AND EXISTS (
      SELECT 1 FROM b2b_leads
      WHERE b2b_leads.id = b2b_documents.lead_id
      AND b2b_leads.contact_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- RLS pour b2b_mission_reports
ALTER TABLE b2b_mission_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access to mission reports"
  ON b2b_mission_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_b2b_contracts_pipeline ON b2b_contracts(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_b2b_contracts_status ON b2b_contracts(status);
CREATE INDEX IF NOT EXISTS idx_b2b_client_feedback_mission ON b2b_client_feedback(mission_id);
CREATE INDEX IF NOT EXISTS idx_b2b_client_feedback_lead ON b2b_client_feedback(lead_id);
CREATE INDEX IF NOT EXISTS idx_b2b_documents_pipeline ON b2b_documents(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_b2b_documents_mission ON b2b_documents(mission_id);
CREATE INDEX IF NOT EXISTS idx_b2b_mission_reports_mission ON b2b_mission_reports(mission_id);
CREATE INDEX IF NOT EXISTS idx_b2b_mission_reports_status ON b2b_mission_reports(report_status);

-- Storage bucket pour documents B2B
INSERT INTO storage.buckets (id, name, public)
VALUES ('b2b-documents', 'b2b-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Admins can upload B2B documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'b2b-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can read B2B documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'b2b-documents'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
