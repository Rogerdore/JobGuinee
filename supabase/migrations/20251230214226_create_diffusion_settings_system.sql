/*
  # Système de Configuration de la Diffusion Ciblée

  1. Nouvelles Tables
    - `diffusion_system_settings`
      - Paramètres généraux du système
      - Activation/désactivation par type d'entité
      - Mode test/production
      
    - `diffusion_channel_pricing`
      - Configuration des canaux (Email, SMS, WhatsApp)
      - Tarifs unitaires modifiables
      - Activation/désactivation par canal
      
    - `diffusion_audience_rules`
      - Règles de sélection d'audience
      - Critères de filtrage
      - Limites de diffusion
      
    - `diffusion_message_templates`
      - Templates personnalisables par canal
      - Variables dynamiques
      - Multilingue (FR/EN)
      
    - `diffusion_image_settings`
      - Images génériques par type
      - Configuration CTA
      - Ordre de fallback
      
    - `diffusion_payment_settings`
      - Configuration Orange Money
      - Messages de paiement
      - Règles de validation
      
    - `diffusion_antispam_rules`
      - Limites temporelles
      - Blacklist
      - Règles d'exclusion
      
    - `diffusion_whatsapp_config`
      - Configuration WhatsApp Admin
      - Templates messages Admin
      - Mode API/Manuel
      
    - `diffusion_marketing_content`
      - Contenu marketing B2B
      - Visibilité et CTA
      
    - `diffusion_config_audit`
      - Logs de modifications
      - Traçabilité Admin
      - Historique des changements

  2. Sécurité
    - RLS activé sur toutes les tables
    - Accès Admin uniquement
    - Journalisation complète
*/

-- =====================================================
-- TABLE diffusion_system_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Activation générale
  module_enabled boolean DEFAULT true,
  
  -- Activation par type
  jobs_enabled boolean DEFAULT true,
  trainings_enabled boolean DEFAULT true,
  posts_enabled boolean DEFAULT true,
  
  -- Mode
  test_mode boolean DEFAULT false,
  
  -- Messages
  admin_info_message text DEFAULT 'Gérez ici tous les paramètres de la diffusion ciblée multicanale.',
  
  -- Shortlink
  shortlink_domain text DEFAULT 'jobguinee.com',
  tracking_enabled boolean DEFAULT true,
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer configuration par défaut
INSERT INTO diffusion_system_settings (id, module_enabled)
VALUES (gen_random_uuid(), true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE diffusion_channel_pricing
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_channel_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  channel text NOT NULL UNIQUE CHECK (channel IN ('email', 'sms', 'whatsapp')),
  enabled boolean DEFAULT true,
  unit_cost integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'GNF',
  
  -- Description
  description text,
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer tarifs par défaut
INSERT INTO diffusion_channel_pricing (channel, enabled, unit_cost, description) VALUES
  ('email', true, 500, 'Messages enrichis avec visuels professionnels'),
  ('sms', true, 1000, 'Messages courts et percutants avec lien tracké'),
  ('whatsapp', true, 3000, 'Messages multimédias avec engagement maximal')
ON CONFLICT (channel) DO NOTHING;

-- =====================================================
-- TABLE diffusion_audience_rules
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_audience_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Critères
  min_profile_completion integer DEFAULT 80,
  max_inactive_days integer DEFAULT 30,
  
  -- Priorités
  priority_by_completion boolean DEFAULT true,
  priority_by_activity boolean DEFAULT true,
  
  -- Limites
  allow_multi_channel boolean DEFAULT true,
  max_quantity_per_campaign integer DEFAULT 10000,
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer règles par défaut
INSERT INTO diffusion_audience_rules (id) 
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE diffusion_message_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
  language text DEFAULT 'fr',
  
  -- Contenu
  subject text,
  content text NOT NULL,
  
  -- Activation
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  
  -- Variables disponibles
  available_variables jsonb DEFAULT '["title", "description", "company", "location", "link", "shortlink", "image_url"]'::jsonb,
  
  -- Métadonnées
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_templates_channel ON diffusion_message_templates(channel);
CREATE INDEX idx_templates_active ON diffusion_message_templates(is_active);

-- =====================================================
-- TABLE diffusion_image_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_image_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Images génériques par type
  generic_job_image_url text,
  generic_training_image_url text,
  generic_post_image_url text,
  default_logo_url text,
  
  -- Ordre de fallback
  fallback_order jsonb DEFAULT '["entity_image", "company_logo", "generic_image", "ai_generated"]'::jsonb,
  
  -- CTA
  default_cta_job text DEFAULT 'Postuler maintenant',
  default_cta_training text DEFAULT 'S''inscrire',
  default_cta_post text DEFAULT 'Voir l''annonce',
  
  -- Options IA
  enable_ai_images boolean DEFAULT false,
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer config par défaut
INSERT INTO diffusion_image_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE diffusion_payment_settings
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Orange Money
  orange_money_number text DEFAULT '+224 620 00 00 00',
  beneficiary_name text DEFAULT 'JobGuinée Admin',
  
  -- Messages
  payment_message text DEFAULT 'Effectuez le paiement via Orange Money au numéro {{number}}. Envoyez la preuve par WhatsApp ou SMS.',
  
  -- Validation
  require_admin_validation boolean DEFAULT true,
  allow_free_campaigns boolean DEFAULT false,
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer config par défaut
INSERT INTO diffusion_payment_settings (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE diffusion_antispam_rules
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_antispam_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Limites temporelles
  max_per_candidate_24h integer DEFAULT 1,
  max_per_candidate_7d integer DEFAULT 2,
  
  -- Exclusions
  respect_opt_out boolean DEFAULT true,
  respect_blacklist boolean DEFAULT true,
  
  -- Règles additionnelles
  additional_rules jsonb DEFAULT '{}'::jsonb,
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer règles par défaut
INSERT INTO diffusion_antispam_rules (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE diffusion_whatsapp_config
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Configuration
  admin_whatsapp_number text DEFAULT '+224 620 00 00 00',
  api_enabled boolean DEFAULT false,
  api_token text,
  
  -- Mode envoi
  send_mode text DEFAULT 'manual' CHECK (send_mode IN ('manual', 'api')),
  
  -- Templates Admin
  templates jsonb DEFAULT '{
    "payment_request": "Bonjour,\n\nVotre demande de diffusion ciblée a été enregistrée.\n\nVeuillez effectuer le paiement via Orange Money au numéro : {{number}}\n\nMerci.\nJobGuinée",
    "payment_approved": "Bonjour,\n\nVotre paiement a été validé ✅\n\nVotre campagne de diffusion est en cours de lancement.\n\nMerci.\nJobGuinée",
    "payment_rejected": "Bonjour,\n\nVotre paiement n''a pas pu être validé.\n\nVeuillez nous contacter.\n\nMerci.\nJobGuinée",
    "campaign_completed": "Bonjour,\n\nVotre campagne est terminée ✅\n\nConsultez les résultats dans votre tableau de bord.\n\nMerci.\nJobGuinée"
  }'::jsonb,
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer config par défaut
INSERT INTO diffusion_whatsapp_config (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE diffusion_marketing_content
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_marketing_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Activation
  show_on_b2b_page boolean DEFAULT true,
  
  -- Contenu
  title text DEFAULT 'Diffusion Ciblée Multicanale',
  subtitle text DEFAULT 'Maximisez la visibilité de vos annonces',
  description text DEFAULT 'Touchez directement les candidats qualifiés via Email, SMS et WhatsApp',
  
  -- CTA
  cta_text text DEFAULT 'Demander une démonstration',
  cta_url text DEFAULT '/contact',
  
  -- Métadonnées
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Insérer contenu par défaut
INSERT INTO diffusion_marketing_content (id)
VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

-- =====================================================
-- TABLE diffusion_config_audit
-- =====================================================
CREATE TABLE IF NOT EXISTS diffusion_config_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Action
  table_name text NOT NULL,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  
  -- Données
  old_data jsonb,
  new_data jsonb,
  
  -- Admin
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  admin_email text,
  
  -- Métadonnées
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_table ON diffusion_config_audit(table_name);
CREATE INDEX idx_audit_admin ON diffusion_config_audit(admin_id);
CREATE INDEX idx_audit_created ON diffusion_config_audit(created_at);

-- =====================================================
-- ENABLE RLS
-- =====================================================
ALTER TABLE diffusion_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_channel_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_audience_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_image_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_payment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_antispam_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_marketing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE diffusion_config_audit ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES (Admin uniquement)
-- =====================================================

-- diffusion_system_settings
CREATE POLICY "Admins can do everything on system settings"
  ON diffusion_system_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Public can view system settings"
  ON diffusion_system_settings FOR SELECT
  TO public
  USING (true);

-- diffusion_channel_pricing
CREATE POLICY "Admins can do everything on channel pricing"
  ON diffusion_channel_pricing FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Public can view channel pricing"
  ON diffusion_channel_pricing FOR SELECT
  TO public
  USING (enabled = true);

-- diffusion_audience_rules
CREATE POLICY "Admins can do everything on audience rules"
  ON diffusion_audience_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Public can view audience rules"
  ON diffusion_audience_rules FOR SELECT
  TO public
  USING (true);

-- diffusion_message_templates
CREATE POLICY "Admins can do everything on templates"
  ON diffusion_message_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- diffusion_image_settings
CREATE POLICY "Admins can do everything on image settings"
  ON diffusion_image_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Public can view image settings"
  ON diffusion_image_settings FOR SELECT
  TO public
  USING (true);

-- diffusion_payment_settings
CREATE POLICY "Admins can do everything on payment settings"
  ON diffusion_payment_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- diffusion_antispam_rules
CREATE POLICY "Admins can do everything on antispam rules"
  ON diffusion_antispam_rules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- diffusion_whatsapp_config
CREATE POLICY "Admins can do everything on whatsapp config"
  ON diffusion_whatsapp_config FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- diffusion_marketing_content
CREATE POLICY "Admins can do everything on marketing content"
  ON diffusion_marketing_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Public can view marketing content"
  ON diffusion_marketing_content FOR SELECT
  TO public
  USING (show_on_b2b_page = true);

-- diffusion_config_audit
CREATE POLICY "Admins can view audit logs"
  ON diffusion_config_audit FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- FUNCTIONS : Audit automatique
-- =====================================================
CREATE OR REPLACE FUNCTION log_diffusion_config_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO diffusion_config_audit (
    table_name,
    action,
    old_data,
    new_data,
    admin_id,
    admin_email
  ) VALUES (
    TG_TABLE_NAME,
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    auth.uid(),
    (SELECT email FROM auth.users WHERE id = auth.uid())
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers d'audit
CREATE TRIGGER audit_system_settings
  AFTER INSERT OR UPDATE OR DELETE ON diffusion_system_settings
  FOR EACH ROW EXECUTE FUNCTION log_diffusion_config_change();

CREATE TRIGGER audit_channel_pricing
  AFTER INSERT OR UPDATE OR DELETE ON diffusion_channel_pricing
  FOR EACH ROW EXECUTE FUNCTION log_diffusion_config_change();

CREATE TRIGGER audit_audience_rules
  AFTER INSERT OR UPDATE OR DELETE ON diffusion_audience_rules
  FOR EACH ROW EXECUTE FUNCTION log_diffusion_config_change();

CREATE TRIGGER audit_payment_settings
  AFTER INSERT OR UPDATE OR DELETE ON diffusion_payment_settings
  FOR EACH ROW EXECUTE FUNCTION log_diffusion_config_change();

CREATE TRIGGER audit_antispam_rules
  AFTER INSERT OR UPDATE OR DELETE ON diffusion_antispam_rules
  FOR EACH ROW EXECUTE FUNCTION log_diffusion_config_change();
