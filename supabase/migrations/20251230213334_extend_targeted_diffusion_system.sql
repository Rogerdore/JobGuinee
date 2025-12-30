/*
  # Extension du Système de Diffusion Ciblée

  1. Modifications de la table campaigns existante
    - Ajout de champs pour le paiement manuel
    - Ajout de champs de tracking

  2. Nouvelles Tables
    - `campaign_channels` : Canaux par campagne
    - `campaign_results` : Résultats de diffusion
    - `candidate_contact_preferences` : Consentements RGPD
    - `shortlinks` : Tracking des clics
    - `campaign_whatsapp_logs` : Communication Admin ↔ Client

  3. Sécurité
    - RLS activé sur toutes les nouvelles tables
    - Policies restrictives
*/

-- =====================================================
-- EXTEND campaigns table
-- =====================================================

-- Ajouter colonnes manquantes si elles n'existent pas
DO $$
BEGIN
  -- Paiement manuel
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'payment_proof_url') THEN
    ALTER TABLE campaigns ADD COLUMN payment_proof_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'payment_validated_by') THEN
    ALTER TABLE campaigns ADD COLUMN payment_validated_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'payment_validated_at') THEN
    ALTER TABLE campaigns ADD COLUMN payment_validated_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'payment_rejection_reason') THEN
    ALTER TABLE campaigns ADD COLUMN payment_rejection_reason text;
  END IF;

  -- Diffusion
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'scheduled_at') THEN
    ALTER TABLE campaigns ADD COLUMN scheduled_at timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'started_at') THEN
    ALTER TABLE campaigns ADD COLUMN started_at timestamptz;
  END IF;

  -- Filtres (renommer si besoin)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'audience_filters') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'campaigns' AND column_name = 'target_filters') THEN
    ALTER TABLE campaigns RENAME COLUMN audience_filters TO target_filters;
  END IF;
END $$;

-- =====================================================
-- TABLE campaign_channels
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  -- Canal
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),

  -- Quantités
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_cost integer NOT NULL, -- en GNF
  total_cost integer GENERATED ALWAYS AS (quantity * unit_cost) STORED,

  -- Template
  template_content text,

  -- Métadonnées
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign ON campaign_channels(campaign_id);

-- =====================================================
-- TABLE campaign_results
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),

  -- Métriques
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  unsubscribed_count integer DEFAULT 0,

  -- Détails
  results_data jsonb DEFAULT '{}'::jsonb,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaign_results_campaign ON campaign_results(campaign_id);

-- =====================================================
-- TABLE candidate_contact_preferences
-- =====================================================
CREATE TABLE IF NOT EXISTS candidate_contact_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL,

  -- Consentements
  consent_email boolean DEFAULT true,
  consent_sms boolean DEFAULT true,
  consent_whatsapp boolean DEFAULT true,

  -- Opt-out global
  opted_out boolean DEFAULT false,
  opted_out_at timestamptz,

  -- Anti-spam
  last_email_sent_at timestamptz,
  last_sms_sent_at timestamptz,
  last_whatsapp_sent_at timestamptz,

  emails_received_last_7_days integer DEFAULT 0,
  sms_received_last_7_days integer DEFAULT 0,
  whatsapp_received_last_7_days integer DEFAULT 0,

  -- Blacklist
  is_blacklisted boolean DEFAULT false,
  blacklisted_reason text,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_prefs_person ON candidate_contact_preferences(person_id);
CREATE INDEX IF NOT EXISTS idx_candidate_prefs_consents ON candidate_contact_preferences(consent_email, consent_sms, consent_whatsapp);

-- =====================================================
-- TABLE shortlinks
-- =====================================================
CREATE TABLE IF NOT EXISTS shortlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),

  -- URLs
  original_url text NOT NULL,
  short_code text UNIQUE NOT NULL,

  -- Tracking
  clicks_count integer DEFAULT 0,
  last_clicked_at timestamptz,

  -- Métadonnées
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shortlinks_campaign ON shortlinks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_shortlinks_code ON shortlinks(short_code);

-- =====================================================
-- TABLE campaign_whatsapp_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS campaign_whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,

  -- Message
  message_type text NOT NULL CHECK (message_type IN (
    'payment_request',
    'proof_received',
    'payment_approved',
    'payment_rejected',
    'campaign_completed'
  )),
  message_content text NOT NULL,

  -- Destinataire
  recipient_phone text NOT NULL,

  -- Statut
  sent_status text DEFAULT 'pending' CHECK (sent_status IN ('pending', 'sent', 'delivered', 'failed')),
  sent_at timestamptz,

  -- Métadonnées
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_campaign ON campaign_whatsapp_logs(campaign_id);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_contact_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES campaign_channels
-- =====================================================

DROP POLICY IF EXISTS "Admin can do everything on channels" ON campaign_channels;
CREATE POLICY "Admin can do everything on channels"
  ON campaign_channels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view channels of own campaigns" ON campaign_channels;
CREATE POLICY "Users can view channels of own campaigns"
  ON campaign_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_channels.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert channels for own campaigns" ON campaign_channels;
CREATE POLICY "Users can insert channels for own campaigns"
  ON campaign_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_channels.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

-- =====================================================
-- POLICIES campaign_results
-- =====================================================

DROP POLICY IF EXISTS "Admin can do everything on results" ON campaign_results;
CREATE POLICY "Admin can do everything on results"
  ON campaign_results FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view results of own campaigns" ON campaign_results;
CREATE POLICY "Users can view results of own campaigns"
  ON campaign_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_results.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

-- =====================================================
-- POLICIES candidate_contact_preferences
-- =====================================================

DROP POLICY IF EXISTS "Admin can do everything on preferences" ON candidate_contact_preferences;
CREATE POLICY "Admin can do everything on preferences"
  ON candidate_contact_preferences FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Candidates can view own preferences" ON candidate_contact_preferences;
CREATE POLICY "Candidates can view own preferences"
  ON candidate_contact_preferences FOR SELECT
  TO authenticated
  USING (person_id = auth.uid());

DROP POLICY IF EXISTS "Candidates can update own preferences" ON candidate_contact_preferences;
CREATE POLICY "Candidates can update own preferences"
  ON candidate_contact_preferences FOR UPDATE
  TO authenticated
  USING (person_id = auth.uid())
  WITH CHECK (person_id = auth.uid());

DROP POLICY IF EXISTS "Candidates can insert own preferences" ON candidate_contact_preferences;
CREATE POLICY "Candidates can insert own preferences"
  ON candidate_contact_preferences FOR INSERT
  TO authenticated
  WITH CHECK (person_id = auth.uid());

-- =====================================================
-- POLICIES shortlinks
-- =====================================================

DROP POLICY IF EXISTS "Admin can do everything on shortlinks" ON shortlinks;
CREATE POLICY "Admin can do everything on shortlinks"
  ON shortlinks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Public can view shortlinks" ON shortlinks;
CREATE POLICY "Public can view shortlinks"
  ON shortlinks FOR SELECT
  TO public
  USING (true);

-- =====================================================
-- POLICIES campaign_whatsapp_logs
-- =====================================================

DROP POLICY IF EXISTS "Admin can do everything on whatsapp logs" ON campaign_whatsapp_logs;
CREATE POLICY "Admin can do everything on whatsapp logs"
  ON campaign_whatsapp_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can view whatsapp logs of own campaigns" ON campaign_whatsapp_logs;
CREATE POLICY "Users can view whatsapp logs of own campaigns"
  ON campaign_whatsapp_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_whatsapp_logs.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );
