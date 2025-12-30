/*
  # Système de Configuration Admin - Diffusion Ciblée

  1. Nouvelles Tables
    - `diffusion_settings` - Paramètres généraux du système
    - `channel_pricing` - Tarification par canal
    - `message_templates` - Templates de messages Email/SMS/WhatsApp
    - `diffusion_audit_log` - Logs et traçabilité

  2. Sécurité
    - RLS activé sur toutes les tables
    - Accès réservé aux admins uniquement

  3. Fonctionnalités
    - Configuration centralisée
    - Admin 100% autonome
    - Traçabilité complète
*/

-- Table des paramètres généraux
CREATE TABLE IF NOT EXISTS diffusion_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Activation globale
  module_enabled boolean DEFAULT true,
  jobs_enabled boolean DEFAULT true,
  trainings_enabled boolean DEFAULT true,
  posts_enabled boolean DEFAULT true,

  -- Mode de fonctionnement
  test_mode boolean DEFAULT false,
  admin_info_message text,

  -- Audience & règles
  min_profile_completion int DEFAULT 80 CHECK (min_profile_completion >= 0 AND min_profile_completion <= 100),
  max_inactive_days int DEFAULT 30,
  allow_multi_channels boolean DEFAULT true,
  max_recipients_per_campaign int DEFAULT 1000,

  -- Anti-spam
  max_sends_per_24h int DEFAULT 1,
  max_sends_per_7d int DEFAULT 2,

  -- Paiement
  orange_money_number text DEFAULT '+224 622 00 00 00',
  orange_money_recipient_name text DEFAULT 'JobGuinée Admin',
  payment_instructions text,
  require_payment_validation boolean DEFAULT true,

  -- WhatsApp Admin
  whatsapp_admin_number text,
  whatsapp_api_enabled boolean DEFAULT false,
  whatsapp_manual_mode boolean DEFAULT true,

  -- Tracking
  shortlink_domain text DEFAULT 'jobguinee.com',
  enable_click_tracking boolean DEFAULT true,

  -- Marketing B2B
  show_b2b_marketing boolean DEFAULT true,
  b2b_cta_text text DEFAULT 'Demander une démonstration',

  -- Images par défaut
  default_job_image_url text,
  default_training_image_url text,
  default_post_image_url text,
  default_logo_url text,

  -- CTA par défaut
  default_cta_job text DEFAULT 'Postuler maintenant',
  default_cta_training text DEFAULT 'S''inscrire',
  default_cta_post text DEFAULT 'Voir l''annonce',

  -- Métadonnées
  last_updated_by uuid REFERENCES auth.users(id),
  version int DEFAULT 1
);

-- Créer un seul enregistrement par défaut
INSERT INTO diffusion_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Table de tarification par canal
CREATE TABLE IF NOT EXISTS channel_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  channel_type text NOT NULL CHECK (channel_type IN ('email', 'sms', 'whatsapp')),
  
  -- Configuration canal
  enabled boolean DEFAULT true,
  unit_cost numeric NOT NULL CHECK (unit_cost >= 0),
  currency text DEFAULT 'GNF',

  -- Limites
  min_quantity int DEFAULT 1,
  max_quantity int DEFAULT 10000,

  -- Description
  display_name text NOT NULL,
  description text,
  icon_name text,

  -- Ordre d affichage
  display_order int DEFAULT 0,

  -- Métadonnées
  last_updated_by uuid REFERENCES auth.users(id),

  UNIQUE(channel_type)
);

-- Insérer les tarifs par défaut
INSERT INTO channel_pricing (channel_type, enabled, unit_cost, display_name, description, icon_name, display_order)
VALUES 
  ('email', true, 500, 'Email', 'Messages enrichis avec visuels professionnels et call-to-action direct', 'mail', 1),
  ('sms', true, 1000, 'SMS', 'Messages courts et percutants avec lien tracké vers votre annonce', 'message-square', 2),
  ('whatsapp', true, 3000, 'WhatsApp', 'Messages multimédias avec image, texte riche et engagement maximal', 'send', 3)
ON CONFLICT (channel_type) DO NOTHING;

-- Table des templates de messages
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Type de template
  template_type text NOT NULL CHECK (template_type IN ('email', 'sms', 'whatsapp', 'admin_whatsapp')),
  
  -- Nom et description
  template_name text NOT NULL,
  description text,

  -- Contenu
  subject text,
  body text NOT NULL,
  
  -- Variables disponibles
  available_variables jsonb DEFAULT '[]'::jsonb,

  -- Configuration
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  language text DEFAULT 'fr',

  -- Métadonnées
  created_by uuid REFERENCES auth.users(id),
  last_updated_by uuid REFERENCES auth.users(id),

  UNIQUE(template_type, template_name, language)
);

-- Insérer les templates par défaut
INSERT INTO message_templates (template_type, template_name, description, subject, body, available_variables, is_default)
VALUES 
  (
    'email',
    'Offre d''emploi - Standard',
    'Template par défaut pour les offres d''emploi',
    'Nouvelle opportunité : {{job_title}} chez {{company_name}}',
    '<h2>Bonjour {{candidate_name}},</h2><p>Une nouvelle opportunité correspond à votre profil :</p><p><strong>{{job_title}}</strong> chez <strong>{{company_name}}</strong></p><p>Localisation : {{location}}</p><p>{{description_short}}</p><p><a href="{{link}}" style="background: #FF8C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 16px;">{{cta_text}}</a></p>',
    '["candidate_name", "job_title", "company_name", "location", "description_short", "link", "cta_text", "image_url"]',
    true
  ),
  (
    'sms',
    'Offre d''emploi - Standard',
    'Template par défaut pour les offres d''emploi',
    NULL,
    'Bonjour {{candidate_name}}, nouvelle offre : {{job_title}} chez {{company_name}} à {{location}}. Postulez ici : {{shortlink}}',
    '["candidate_name", "job_title", "company_name", "location", "shortlink"]',
    true
  ),
  (
    'whatsapp',
    'Offre d''emploi - Standard',
    'Template par défaut pour les offres d''emploi',
    NULL,
    'Bonjour {{candidate_name}} 👋\n\nNouvelle opportunité qui pourrait vous intéresser :\n\n*{{job_title}}*\n{{company_name}}\n📍 {{location}}\n\n{{description_short}}\n\n{{cta_text}} : {{link}}',
    '["candidate_name", "job_title", "company_name", "location", "description_short", "link", "cta_text"]',
    true
  ),
  (
    'admin_whatsapp',
    'Demande de paiement',
    'Message envoyé au client pour demande de paiement',
    NULL,
    '💳 *Paiement de la diffusion ciblée*\n\nBonjour,\n\nVotre campagne "{{campaign_name}}" est prête !\n\n*Montant :* {{total_cost}} GNF\n*Audience :* {{audience_count}} candidats\n*Canaux :* {{channels}}\n\nPour lancer la diffusion :\n1️⃣ Payez via Orange Money au {{orange_money_number}}\n2️⃣ Envoyez la preuve de paiement à ce numéro\n\nMerci ! 🙏',
    '["campaign_name", "total_cost", "audience_count", "channels", "orange_money_number"]',
    true
  ),
  (
    'admin_whatsapp',
    'Validation paiement',
    'Message de confirmation après validation',
    NULL,
    '✅ *Paiement validé*\n\nBonjour,\n\nLe paiement de votre campagne "{{campaign_name}}" a été validé !\n\n🚀 La diffusion va être lancée dans les prochaines minutes.\n\nVous recevrez une notification une fois la diffusion terminée.\n\nMerci de votre confiance ! 🙏',
    '["campaign_name"]',
    true
  ),
  (
    'admin_whatsapp',
    'Rejet paiement',
    'Message envoyé en cas de rejet',
    NULL,
    '❌ *Paiement non validé*\n\nBonjour,\n\nLe paiement de votre campagne "{{campaign_name}}" n''a pas pu être validé.\n\n*Raison :* {{rejection_reason}}\n\nMerci de nous recontacter pour plus d''informations.\n\n📞 {{admin_phone}}',
    '["campaign_name", "rejection_reason", "admin_phone"]',
    true
  )
ON CONFLICT (template_type, template_name, language) DO NOTHING;

-- Table d audit et logs
CREATE TABLE IF NOT EXISTS diffusion_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),

  -- Action
  action_type text NOT NULL CHECK (action_type IN (
    'settings_updated',
    'pricing_updated',
    'template_created',
    'template_updated',
    'template_deleted',
    'campaign_validated',
    'campaign_rejected',
    'payment_approved',
    'payment_rejected',
    'module_toggled',
    'channel_toggled'
  )),

  -- Contexte
  entity_type text,
  entity_id uuid,

  -- Détails
  description text NOT NULL,
  old_value jsonb,
  new_value jsonb,

  -- Responsable
  performed_by uuid REFERENCES auth.users(id) NOT NULL,
  ip_address text,
  user_agent text
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_channel_pricing_type ON channel_pricing(channel_type);
CREATE INDEX IF NOT EXISTS idx_channel_pricing_enabled ON channel_pricing(enabled);

CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_default ON message_templates(is_default);

CREATE INDEX IF NOT EXISTS idx_audit_log_action ON diffusion_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON diffusion_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON diffusion_audit_log(created_at DESC);

-- RLS Policies

ALTER TABLE diffusion_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view settings"
  ON diffusion_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update settings"
  ON diffusion_settings FOR UPDATE
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

-- Channel Pricing
ALTER TABLE channel_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pricing"
  ON channel_pricing FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage pricing"
  ON channel_pricing FOR ALL
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

-- Message Templates
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage templates"
  ON message_templates FOR ALL
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

-- Audit Log
ALTER TABLE diffusion_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON diffusion_audit_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can insert audit logs"
  ON diffusion_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Fonction pour logger les actions
CREATE OR REPLACE FUNCTION log_diffusion_action(
  p_action_type text,
  p_description text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO diffusion_audit_log (
    action_type,
    description,
    entity_type,
    entity_id,
    old_value,
    new_value,
    performed_by
  ) VALUES (
    p_action_type,
    p_description,
    p_entity_type,
    p_entity_id,
    p_old_value,
    p_new_value,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les settings actifs
CREATE OR REPLACE FUNCTION get_active_diffusion_settings()
RETURNS TABLE (
  module_enabled boolean,
  jobs_enabled boolean,
  trainings_enabled boolean,
  posts_enabled boolean,
  test_mode boolean,
  min_profile_completion int,
  max_inactive_days int,
  allow_multi_channels boolean,
  max_recipients_per_campaign int,
  max_sends_per_24h int,
  max_sends_per_7d int,
  orange_money_number text,
  orange_money_recipient_name text,
  require_payment_validation boolean,
  shortlink_domain text,
  enable_click_tracking boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ds.module_enabled,
    ds.jobs_enabled,
    ds.trainings_enabled,
    ds.posts_enabled,
    ds.test_mode,
    ds.min_profile_completion,
    ds.max_inactive_days,
    ds.allow_multi_channels,
    ds.max_recipients_per_campaign,
    ds.max_sends_per_24h,
    ds.max_sends_per_7d,
    ds.orange_money_number,
    ds.orange_money_recipient_name,
    ds.require_payment_validation,
    ds.shortlink_domain,
    ds.enable_click_tracking
  FROM diffusion_settings ds
  WHERE ds.id = '00000000-0000-0000-0000-000000000001';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les tarifs actifs
CREATE OR REPLACE FUNCTION get_active_channel_pricing()
RETURNS TABLE (
  channel_type text,
  enabled boolean,
  unit_cost numeric,
  currency text,
  display_name text,
  description text,
  min_quantity int,
  max_quantity int
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cp.channel_type,
    cp.enabled,
    cp.unit_cost,
    cp.currency,
    cp.display_name,
    cp.description,
    cp.min_quantity,
    cp.max_quantity
  FROM channel_pricing cp
  WHERE cp.enabled = true
  ORDER BY cp.display_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;