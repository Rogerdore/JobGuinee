/*
  # Système de Diffusion Ciblée Multicanale

  1. Nouvelles Tables
    - `campaigns` - Campagnes de diffusion ciblée
    - `campaign_channels` - Canaux utilisés (Email/SMS/WhatsApp)
    - `candidate_contact_preferences` - Consentements candidats
    - `shortlinks` - Liens trackés
    - `campaign_sends` - Historique d'envois
    - `campaign_clicks` - Tracking des clics
    - `campaign_blacklist` - Liste d'opt-out

  2. Sécurité
    - RLS activé sur toutes les tables
    - Policies pour recruteurs et admins

  3. Fonctionnalités
    - Calcul d'audience disponible
    - Génération de shortlinks
    - Tracking des clics
    - Anti-spam (max 1/24h, 2/7j)
*/

-- Table des campagnes de diffusion
CREATE TABLE IF NOT EXISTS campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Créateur
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,

  -- Entité liée (annonce)
  entity_type text NOT NULL CHECK (entity_type IN ('job', 'training', 'post')),
  entity_id uuid NOT NULL,

  -- Nom de la campagne
  campaign_name text NOT NULL,

  -- Filtres d'audience (JSONB)
  audience_filters jsonb DEFAULT '{}'::jsonb,
  audience_available int DEFAULT 0,

  -- Coûts
  total_cost numeric DEFAULT 0,

  -- Statuts
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending_payment', 'payment_approved', 'in_progress', 'completed', 'cancelled')),
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_proof', 'approved', 'rejected')),

  -- Validation admin
  admin_validated_by uuid REFERENCES auth.users(id),
  admin_validated_at timestamptz,
  admin_notes text,

  -- Métriques
  total_sent int DEFAULT 0,
  total_clicks int DEFAULT 0,

  -- Dates
  launched_at timestamptz,
  completed_at timestamptz
);

-- Table des canaux par campagne
CREATE TABLE IF NOT EXISTS campaign_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp')),

  -- Quantités et coûts
  quantity int NOT NULL CHECK (quantity > 0),
  unit_cost numeric NOT NULL CHECK (unit_cost >= 0),
  total_cost numeric NOT NULL CHECK (total_cost >= 0),

  -- Statut
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),

  -- Métriques
  sent_count int DEFAULT 0,
  delivered_count int DEFAULT 0,
  failed_count int DEFAULT 0,
  click_count int DEFAULT 0,

  -- Timestamp
  sent_at timestamptz,
  completed_at timestamptz,

  UNIQUE(campaign_id, channel_type)
);

-- Table des préférences de contact candidats
CREATE TABLE IF NOT EXISTS candidate_contact_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  person_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,

  -- Consentements par canal
  consent_email boolean DEFAULT true,
  consent_sms boolean DEFAULT true,
  consent_whatsapp boolean DEFAULT true,

  -- Préférences
  frequency_preference text DEFAULT 'moderate' CHECK (frequency_preference IN ('high', 'moderate', 'low')),

  -- Opt-out global
  global_opt_out boolean DEFAULT false,
  global_opt_out_at timestamptz
);

-- Table des shortlinks trackés
CREATE TABLE IF NOT EXISTS shortlinks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp')),

  original_url text NOT NULL,
  short_code text NOT NULL UNIQUE,

  clicks_count int DEFAULT 0,
  last_clicked_at timestamptz,

  UNIQUE(campaign_id, channel_type)
);

-- Table des envois (historique)
CREATE TABLE IF NOT EXISTS campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp')),

  recipient_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_contact text NOT NULL,

  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),

  sent_at timestamptz,
  delivered_at timestamptz,
  failed_at timestamptz,
  error_message text
);

-- Table des clics trackés
CREATE TABLE IF NOT EXISTS campaign_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  shortlink_id uuid REFERENCES shortlinks(id) ON DELETE CASCADE NOT NULL,

  clicked_by uuid REFERENCES candidate_profiles(id),

  -- Métadonnées
  ip_address text,
  user_agent text,
  referer text
);

-- Table de blacklist (opt-out)
CREATE TABLE IF NOT EXISTS campaign_blacklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  person_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  channel_type text CHECK (channel_type IN ('email', 'sms', 'whatsapp', 'all')),

  reason text,
  opt_out_at timestamptz DEFAULT now(),

  UNIQUE(person_id, channel_type)
);

-- Indexes pour performances
CREATE INDEX IF NOT EXISTS idx_campaigns_created_by ON campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_entity ON campaigns(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_payment_status ON campaigns(payment_status);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign ON campaign_channels(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_channels_status ON campaign_channels(status);

CREATE INDEX IF NOT EXISTS idx_contact_prefs_person ON candidate_contact_preferences(person_id);
CREATE INDEX IF NOT EXISTS idx_contact_prefs_opt_out ON candidate_contact_preferences(global_opt_out);

CREATE INDEX IF NOT EXISTS idx_shortlinks_code ON shortlinks(short_code);
CREATE INDEX IF NOT EXISTS idx_shortlinks_campaign ON shortlinks(campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaign_sends_campaign ON campaign_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_recipient ON campaign_sends(recipient_id);
CREATE INDEX IF NOT EXISTS idx_campaign_sends_status ON campaign_sends(status);

CREATE INDEX IF NOT EXISTS idx_campaign_clicks_campaign ON campaign_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_clicks_shortlink ON campaign_clicks(shortlink_id);

CREATE INDEX IF NOT EXISTS idx_blacklist_person ON campaign_blacklist(person_id);

-- RLS Policies

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Admins can view all campaigns"
  ON campaigns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Recruiters can create campaigns"
  ON campaigns FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'recruiter'
    )
  );

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update all campaigns"
  ON campaigns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Campaign Channels
ALTER TABLE campaign_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign channels"
  ON campaign_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_channels.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all campaign channels"
  ON campaign_channels FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Users can insert own campaign channels"
  ON campaign_channels FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_channels.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

-- Contact Preferences
ALTER TABLE candidate_contact_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates can view own preferences"
  ON candidate_contact_preferences FOR SELECT
  TO authenticated
  USING (person_id IN (
    SELECT id FROM candidate_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Candidates can update own preferences"
  ON candidate_contact_preferences FOR UPDATE
  TO authenticated
  USING (person_id IN (
    SELECT id FROM candidate_profiles WHERE id = auth.uid()
  ))
  WITH CHECK (person_id IN (
    SELECT id FROM candidate_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can view all preferences"
  ON candidate_contact_preferences FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Shortlinks (public read for redirect)
ALTER TABLE shortlinks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shortlinks for redirect"
  ON shortlinks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert shortlinks"
  ON shortlinks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = shortlinks.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

-- Campaign Sends
ALTER TABLE campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign owners can view sends"
  ON campaign_sends FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_sends.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all sends"
  ON campaign_sends FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Campaign Clicks
ALTER TABLE campaign_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign owners can view clicks"
  ON campaign_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = campaign_clicks.campaign_id
      AND campaigns.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can view all clicks"
  ON campaign_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Blacklist
ALTER TABLE campaign_blacklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own blacklist status"
  ON campaign_blacklist FOR SELECT
  TO authenticated
  USING (person_id IN (
    SELECT id FROM candidate_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can opt out"
  ON campaign_blacklist FOR INSERT
  TO authenticated
  WITH CHECK (person_id IN (
    SELECT id FROM candidate_profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Admins can view all blacklist"
  ON campaign_blacklist FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Fonction pour calculer l'audience disponible
CREATE OR REPLACE FUNCTION calculate_available_audience(
  p_filters jsonb
) RETURNS int AS $$
DECLARE
  v_count int;
  v_job_title text;
  v_sector text;
  v_location text;
  v_min_experience int;
  v_max_experience int;
  v_active_days int;
  v_min_completion int;
BEGIN
  -- Extraire les filtres
  v_job_title := p_filters->>'job_title';
  v_sector := p_filters->>'sector';
  v_location := p_filters->>'location';
  v_min_experience := COALESCE((p_filters->>'min_experience')::int, 0);
  v_max_experience := COALESCE((p_filters->>'max_experience')::int, 100);
  v_active_days := COALESCE((p_filters->>'active_within_days')::int, 30);
  v_min_completion := COALESCE((p_filters->>'min_completion')::int, 80);

  -- Compter les candidats éligibles
  SELECT COUNT(DISTINCT cp.id) INTO v_count
  FROM candidate_profiles cp
  INNER JOIN profiles p ON p.id = cp.id
  LEFT JOIN candidate_contact_preferences ccp ON ccp.person_id = cp.id
  LEFT JOIN campaign_blacklist cb ON cb.person_id = cp.id AND cb.channel_type = 'all'
  WHERE
    -- Actif récemment
    p.updated_at >= (now() - (v_active_days || ' days')::interval)
    -- Profil complété
    AND COALESCE(cp.profile_completion_percentage, 0) >= v_min_completion
    -- Pas en blacklist globale
    AND cb.id IS NULL
    -- Pas d'opt-out global
    AND COALESCE(ccp.global_opt_out, false) = false
    -- Filtres métier
    AND (v_job_title IS NULL OR cp.desired_position ILIKE '%' || v_job_title || '%')
    -- Filtres secteur
    AND (v_sector IS NULL OR cp.sector ILIKE '%' || v_sector || '%')
    -- Filtres localisation
    AND (v_location IS NULL OR cp.location ILIKE '%' || v_location || '%')
    -- Filtres expérience
    AND COALESCE(cp.years_of_experience, 0) BETWEEN v_min_experience AND v_max_experience;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour générer un shortcode unique
CREATE OR REPLACE FUNCTION generate_shortcode() RETURNS text AS $$
DECLARE
  v_chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  v_code text := '';
  v_i int;
  v_exists boolean;
BEGIN
  LOOP
    v_code := '';
    FOR v_i IN 1..8 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;

    SELECT EXISTS(SELECT 1 FROM shortlinks WHERE short_code = v_code) INTO v_exists;

    IF NOT v_exists THEN
      EXIT;
    END IF;
  END LOOP;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier l'anti-spam (max 1/24h, 2/7j)
CREATE OR REPLACE FUNCTION check_anti_spam(
  p_person_id uuid,
  p_channel_type text
) RETURNS boolean AS $$
DECLARE
  v_count_24h int;
  v_count_7d int;
BEGIN
  -- Compter envois dans les 24h
  SELECT COUNT(*) INTO v_count_24h
  FROM campaign_sends
  WHERE recipient_id = p_person_id
    AND channel_type = p_channel_type
    AND created_at >= (now() - interval '24 hours');

  -- Compter envois dans les 7 jours
  SELECT COUNT(*) INTO v_count_7d
  FROM campaign_sends
  WHERE recipient_id = p_person_id
    AND channel_type = p_channel_type
    AND created_at >= (now() - interval '7 days');

  -- Retourner true si autorisé
  RETURN v_count_24h < 1 AND v_count_7d < 2;
END;
$$ LANGUAGE plpgsql;

-- Initialiser les préférences pour les candidats existants
INSERT INTO candidate_contact_preferences (person_id, consent_email, consent_sms, consent_whatsapp)
SELECT id, true, true, true
FROM candidate_profiles
WHERE NOT EXISTS (
  SELECT 1 FROM candidate_contact_preferences WHERE person_id = candidate_profiles.id
)
ON CONFLICT (person_id) DO NOTHING;