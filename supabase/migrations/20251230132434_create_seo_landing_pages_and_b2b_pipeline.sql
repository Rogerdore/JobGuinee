/*
  # Système Landing Pages SEO + Pipeline B2B JobGuinée

  1. Tables créées
    - `seo_landing_pages` : Landing pages SEO dynamiques (métier, secteur, ville, niveau)
    - `b2b_pipeline` : Pipeline de conversion leads → missions
    - `b2b_quotes` : Devis RH générés
    - `b2b_missions` : Missions RH actives
    - `seo_conversion_tracking` : Tracking conversions SEO → B2B

  2. Sécurité
    - RLS activé sur toutes les tables
    - Admins : accès complet
    - Public : lecture landing pages actives
*/

-- Table des landing pages SEO
CREATE TABLE IF NOT EXISTS seo_landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL CHECK (page_type IN (
    'job_by_profession',
    'job_by_sector',
    'job_by_city',
    'job_by_level'
  )),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  meta_description text NOT NULL,
  keywords text NOT NULL,
  h1 text NOT NULL,
  introduction text,
  profession_name text,
  sector_name text,
  city_name text,
  level_name text,
  schema_org jsonb DEFAULT '{}'::jsonb,
  canonical_url text,
  og_image_url text,
  content_blocks jsonb DEFAULT '[]'::jsonb,
  faq_items jsonb DEFAULT '[]'::jsonb,
  stats jsonb DEFAULT '{}'::jsonb,
  primary_cta text DEFAULT 'Confier un recrutement',
  secondary_cta text DEFAULT 'Voir les offres',
  cta_tracking_params jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  views_count int DEFAULT 0,
  conversions_count int DEFAULT 0,
  conversion_rate decimal(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_indexed_at timestamptz,
  seo_score int DEFAULT 0
);

-- Table du pipeline B2B
CREATE TABLE IF NOT EXISTS b2b_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES b2b_leads(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'new_lead' CHECK (status IN (
    'new_lead', 'contacted', 'qualified', 'quote_sent', 'negotiation',
    'won', 'lost', 'mission_active', 'mission_completed', 'invoiced', 'paid'
  )),
  lead_score int DEFAULT 0,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_value decimal(12,2),
  probability_percentage int DEFAULT 50,
  source_page text,
  source_type text CHECK (source_type IN ('seo', 'direct', 'referral', 'paid', 'other')),
  landing_page_id uuid REFERENCES seo_landing_pages(id),
  utm_params jsonb DEFAULT '{}'::jsonb,
  assigned_to uuid REFERENCES profiles(id),
  assigned_at timestamptz,
  contacted_at timestamptz,
  qualified_at timestamptz,
  quote_sent_at timestamptz,
  won_at timestamptz,
  lost_at timestamptz,
  expected_close_date date,
  lost_reason text,
  lost_details text,
  last_contact_date timestamptz,
  next_follow_up_date timestamptz,
  contact_count int DEFAULT 0,
  internal_notes text,
  qualification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des devis RH
CREATE TABLE IF NOT EXISTS b2b_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES b2b_pipeline(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES b2b_leads(id),
  quote_number text UNIQUE NOT NULL,
  quote_title text NOT NULL,
  quote_description text,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal decimal(12,2) NOT NULL,
  discount_percentage decimal(5,2) DEFAULT 0,
  discount_amount decimal(12,2) DEFAULT 0,
  tax_percentage decimal(5,2) DEFAULT 0,
  tax_amount decimal(12,2) DEFAULT 0,
  total_amount decimal(12,2) NOT NULL,
  currency text DEFAULT 'GNF',
  validity_days int DEFAULT 30,
  payment_terms text,
  delivery_timeline text,
  terms_and_conditions text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'revised'
  )),
  pdf_url text,
  pdf_generated_at timestamptz,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,
  signed_by text,
  signed_at timestamptz,
  signature_ip text,
  version int DEFAULT 1,
  parent_quote_id uuid REFERENCES b2b_quotes(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des missions RH
CREATE TABLE IF NOT EXISTS b2b_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES b2b_pipeline(id),
  quote_id uuid REFERENCES b2b_quotes(id),
  lead_id uuid REFERENCES b2b_leads(id),
  mission_number text UNIQUE NOT NULL,
  mission_name text NOT NULL,
  mission_type text NOT NULL CHECK (mission_type IN (
    'externalisation_recrutement', 'cvtheque_access', 'formation',
    'conseil_rh', 'pack_enterprise', 'autre'
  )),
  client_company text NOT NULL,
  client_contact_name text NOT NULL,
  client_contact_email text NOT NULL,
  client_contact_phone text,
  job_title text,
  job_description text,
  positions_count int DEFAULT 1,
  target_start_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN (
    'pending', 'active', 'paused', 'completed', 'cancelled', 'archived'
  )),
  project_manager_id uuid REFERENCES profiles(id),
  team_members jsonb DEFAULT '[]'::jsonb,
  milestones jsonb DEFAULT '[]'::jsonb,
  deliverables jsonb DEFAULT '[]'::jsonb,
  applications_received int DEFAULT 0,
  candidates_shortlisted int DEFAULT 0,
  candidates_interviewed int DEFAULT 0,
  candidates_hired int DEFAULT 0,
  contract_value decimal(12,2),
  invoiced_amount decimal(12,2) DEFAULT 0,
  paid_amount decimal(12,2) DEFAULT 0,
  start_date date,
  expected_end_date date,
  actual_end_date date,
  client_satisfaction_score int,
  client_feedback text,
  contract_url text,
  reports jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table de tracking conversions SEO
CREATE TABLE IF NOT EXISTS seo_conversion_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES profiles(id),
  landing_page_id uuid REFERENCES seo_landing_pages(id),
  landing_page_slug text NOT NULL,
  entry_url text NOT NULL,
  pages_visited jsonb DEFAULT '[]'::jsonb,
  time_on_site int,
  converted boolean DEFAULT false,
  conversion_type text CHECK (conversion_type IN (
    'lead_form', 'account_creation', 'job_application', 'contact_click',
    'phone_click', 'whatsapp_click', 'quote_request', 'other'
  )),
  conversion_value decimal(12,2),
  lead_id uuid REFERENCES b2b_leads(id),
  pipeline_id uuid REFERENCES b2b_pipeline(id),
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  device_type text,
  browser text,
  os text,
  ip_address text,
  city text,
  country text DEFAULT 'GN',
  session_start timestamptz DEFAULT now(),
  session_end timestamptz,
  converted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Activation RLS
ALTER TABLE seo_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_pipeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_conversion_tracking ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Anyone can view active landing pages"
  ON seo_landing_pages FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage landing pages"
  ON seo_landing_pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can view all pipeline"
  ON b2b_pipeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Admins can manage pipeline"
  ON b2b_pipeline FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Admins can view all quotes"
  ON b2b_quotes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Admins can manage quotes"
  ON b2b_quotes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Admins can view all missions"
  ON b2b_missions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Admins can manage missions"
  ON b2b_missions FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

CREATE POLICY "Anyone can insert conversion tracking"
  ON seo_conversion_tracking FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view conversion tracking"
  ON seo_conversion_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.user_type = 'admin')
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_slug ON seo_landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_type ON seo_landing_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_seo_landing_pages_active ON seo_landing_pages(is_active);
CREATE INDEX IF NOT EXISTS idx_b2b_pipeline_status ON b2b_pipeline(status);
CREATE INDEX IF NOT EXISTS idx_b2b_pipeline_lead_id ON b2b_pipeline(lead_id);
CREATE INDEX IF NOT EXISTS idx_b2b_pipeline_landing_page ON b2b_pipeline(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_pipeline ON b2b_quotes(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_b2b_quotes_status ON b2b_quotes(status);
CREATE INDEX IF NOT EXISTS idx_b2b_missions_status ON b2b_missions(status);
CREATE INDEX IF NOT EXISTS idx_seo_conversion_landing_page ON seo_conversion_tracking(landing_page_id);
CREATE INDEX IF NOT EXISTS idx_seo_conversion_converted ON seo_conversion_tracking(converted);
