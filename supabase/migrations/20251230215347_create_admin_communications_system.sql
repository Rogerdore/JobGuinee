/*
  # Système de Communication Multicanale Admin

  1. Nouvelles Tables
    - `admin_communications`
      - Stocke les campagnes de communication créées par l'Admin
      - Contient les filtres d'audience, canaux, statut, planification
      - Statuts: draft, scheduled, sending, completed, canceled

    - `admin_communication_messages`
      - Stocke les messages individuels par utilisateur et canal
      - Tracking du statut d'envoi par canal (pending, sent, failed)
      - Permet retry et traçabilité complète

    - `admin_communication_templates`
      - Templates réutilisables par canal (email, sms, whatsapp, notification)
      - Variables dynamiques supportées: {{prenom}}, {{nom}}, {{role}}, {{lien}}, etc.
      - Activation/désactivation

    - `admin_communication_logs`
      - Logs de toutes les actions sur les communications
      - Traçabilité complète: qui, quand, quoi
      - Actions: create, update, send, cancel, schedule

  2. Sécurité
    - RLS strict: Admin-only sur toutes les tables
    - Policies séparées pour lecture/écriture
    - Audit automatique via triggers

  3. Performance
    - Index sur communication_id, user_id, status, channel
    - Index sur scheduled_at pour les envois programmés
    - Index sur created_by pour les logs Admin

  4. Notes Importantes
    - Respecte les consentements utilisateurs (consent_email, consent_sms, consent_whatsapp)
    - Les notifications internes (in-app) sont toujours autorisées
    - Module indépendant du système de diffusion ciblée des annonces
    - Aucun paiement requis pour les communications Admin
*/

-- =====================================================
-- TABLE: admin_communications
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations de base
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('system_info', 'important_notice', 'promotion', 'maintenance_alert', 'institutional')),
  description text,

  -- Filtres d'audience (JSON)
  filters_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  estimated_audience_count integer DEFAULT 0,

  -- Canaux et messages (JSON)
  channels_json jsonb NOT NULL DEFAULT '{}'::jsonb,

  -- Statut et planification
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'canceled', 'failed')),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,

  -- Statistiques
  total_recipients integer DEFAULT 0,
  total_sent integer DEFAULT 0,
  total_failed integer DEFAULT 0,
  total_excluded integer DEFAULT 0,

  -- Métadonnées
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_admin_communications_status ON admin_communications(status);
CREATE INDEX IF NOT EXISTS idx_admin_communications_scheduled_at ON admin_communications(scheduled_at) WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_admin_communications_created_by ON admin_communications(created_by);
CREATE INDEX IF NOT EXISTS idx_admin_communications_type ON admin_communications(type);

-- =====================================================
-- TABLE: admin_communication_messages
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_communication_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  communication_id uuid NOT NULL REFERENCES admin_communications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Canal et contenu
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'notification')),
  content_rendered text NOT NULL,
  subject text, -- Pour email uniquement

  -- Statut d'envoi
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'excluded')),
  exclusion_reason text, -- Si excluded: 'no_consent', 'invalid_contact', etc.

  -- Tentatives et erreurs
  retry_count integer DEFAULT 0,
  error_message text,

  -- Horodatage
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_communication_messages_communication ON admin_communication_messages(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_messages_user ON admin_communication_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_communication_messages_status ON admin_communication_messages(status);
CREATE INDEX IF NOT EXISTS idx_communication_messages_channel ON admin_communication_messages(channel);
CREATE INDEX IF NOT EXISTS idx_communication_messages_pending ON admin_communication_messages(communication_id, status) WHERE status = 'pending';

-- =====================================================
-- TABLE: admin_communication_templates
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_communication_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informations du template
  name text NOT NULL,
  description text,
  channel text NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp', 'notification')),

  -- Contenu du template
  subject text, -- Pour email uniquement
  content text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb, -- Liste des variables disponibles: ["prenom", "nom", "role", "lien"]

  -- Métadonnées
  is_active boolean DEFAULT true,
  category text, -- 'system', 'marketing', 'operational', etc.

  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_communication_templates_channel ON admin_communication_templates(channel);
CREATE INDEX IF NOT EXISTS idx_communication_templates_active ON admin_communication_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_communication_templates_category ON admin_communication_templates(category);

-- =====================================================
-- TABLE: admin_communication_logs
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_communication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  communication_id uuid REFERENCES admin_communications(id) ON DELETE CASCADE,

  -- Action et détails
  action text NOT NULL CHECK (action IN ('create', 'update', 'send', 'cancel', 'schedule', 'complete', 'fail')),
  details jsonb DEFAULT '{}'::jsonb,

  -- Admin responsable
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_email text,

  -- Horodatage
  created_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_communication_logs_communication ON admin_communication_logs(communication_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_admin ON admin_communication_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_communication_logs_action ON admin_communication_logs(action);
CREATE INDEX IF NOT EXISTS idx_communication_logs_created_at ON admin_communication_logs(created_at DESC);

-- =====================================================
-- FONCTION: Trigger automatique pour les logs
-- =====================================================
CREATE OR REPLACE FUNCTION log_admin_communication_change()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_email text;
  v_action text;
BEGIN
  -- Récupérer l'email de l'admin
  SELECT email INTO v_admin_email
  FROM auth.users
  WHERE id = COALESCE(NEW.updated_by, NEW.created_by);

  -- Déterminer l'action
  IF TG_OP = 'INSERT' THEN
    v_action := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'sending' AND OLD.status != 'sending' THEN
      v_action := 'send';
    ELSIF NEW.status = 'canceled' AND OLD.status != 'canceled' THEN
      v_action := 'cancel';
    ELSIF NEW.status = 'scheduled' AND OLD.status != 'scheduled' THEN
      v_action := 'schedule';
    ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
      v_action := 'complete';
    ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
      v_action := 'fail';
    ELSE
      v_action := 'update';
    END IF;
  END IF;

  -- Insérer le log
  INSERT INTO admin_communication_logs (
    communication_id,
    action,
    details,
    admin_id,
    admin_email
  ) VALUES (
    NEW.id,
    v_action,
    jsonb_build_object(
      'title', NEW.title,
      'type', NEW.type,
      'status', NEW.status,
      'estimated_audience', NEW.estimated_audience_count
    ),
    COALESCE(NEW.updated_by, NEW.created_by),
    v_admin_email
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_log_admin_communication_change ON admin_communications;
CREATE TRIGGER trigger_log_admin_communication_change
  AFTER INSERT OR UPDATE ON admin_communications
  FOR EACH ROW
  EXECUTE FUNCTION log_admin_communication_change();

-- =====================================================
-- FONCTION: Calculer le nombre de destinataires
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_communication_audience(
  p_filters jsonb
)
RETURNS integer AS $$
DECLARE
  v_count integer := 0;
  v_user_types text[];
  v_account_status text[];
  v_min_completion integer;
BEGIN
  -- Extraire les filtres du JSON
  v_user_types := ARRAY(SELECT jsonb_array_elements_text(p_filters->'user_types'));
  v_account_status := ARRAY(SELECT jsonb_array_elements_text(p_filters->'account_status'));
  v_min_completion := COALESCE((p_filters->>'min_completion')::integer, 0);

  -- Compter les utilisateurs correspondants
  SELECT COUNT(DISTINCT u.id) INTO v_count
  FROM auth.users u
  LEFT JOIN profiles p ON p.id = u.id
  WHERE 1=1
    AND (CARDINALITY(v_user_types) = 0 OR p.user_type = ANY(v_user_types))
    AND (v_min_completion = 0 OR COALESCE(p.profile_completion_percentage, 0) >= v_min_completion);

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- admin_communications
ALTER TABLE admin_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all communications"
  ON admin_communications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can create communications"
  ON admin_communications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update communications"
  ON admin_communications FOR UPDATE
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

CREATE POLICY "Admins can delete communications"
  ON admin_communications FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- admin_communication_messages
ALTER TABLE admin_communication_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages"
  ON admin_communication_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage messages"
  ON admin_communication_messages FOR ALL
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

-- admin_communication_templates
ALTER TABLE admin_communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all templates"
  ON admin_communication_templates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage templates"
  ON admin_communication_templates FOR ALL
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

-- admin_communication_logs
ALTER TABLE admin_communication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all logs"
  ON admin_communication_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- =====================================================
-- DONNÉES INITIALES: Templates par défaut
-- =====================================================
INSERT INTO admin_communication_templates (name, description, channel, subject, content, variables, category, is_active)
VALUES
  (
    'Bienvenue - Email',
    'Email de bienvenue pour nouveaux utilisateurs',
    'email',
    'Bienvenue sur JobGuinée, {{prenom}} !',
    'Bonjour {{prenom}} {{nom}},

Nous sommes ravis de vous accueillir sur JobGuinée, la plateforme de référence pour l''emploi en Guinée.

Votre compte {{role}} a été créé avec succès. Vous pouvez dès maintenant profiter de toutes nos fonctionnalités.

{{lien}}

Cordialement,
L''équipe JobGuinée',
    '["prenom", "nom", "role", "lien"]'::jsonb,
    'system',
    true
  ),
  (
    'Notification Système - SMS',
    'Notification courte pour alertes système',
    'sms',
    NULL,
    'JobGuinée: {{message}}. Plus d''infos: {{lien}}',
    '["message", "lien"]'::jsonb,
    'system',
    true
  ),
  (
    'Maintenance - Notification',
    'Alerte de maintenance programmée',
    'notification',
    NULL,
    'Une maintenance est prévue le {{date}}. Les services seront temporairement indisponibles.',
    '["date"]'::jsonb,
    'operational',
    true
  ),
  (
    'Promotion - WhatsApp',
    'Message promotionnel pour nouvelles fonctionnalités',
    'whatsapp',
    NULL,
    'Bonjour {{prenom}} 👋

Découvrez nos nouvelles fonctionnalités JobGuinée:
{{description}}

En savoir plus: {{lien}}',
    '["prenom", "description", "lien"]'::jsonb,
    'marketing',
    true
  )
ON CONFLICT DO NOTHING;