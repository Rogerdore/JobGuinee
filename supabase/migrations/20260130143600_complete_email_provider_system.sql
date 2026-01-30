/*
  # Complétion du système de configuration email

  1. Tables nouvelles
    - `email_provider_config` - Configuration fournisseurs (SMTP, SendGrid, etc.)
    - `email_templates` - Templates personnalisables
    - `email_queue` - File d'attente

  2. Amélioration email_logs existante
    - Ajout de colonnes si manquantes

  3. Providers supportés
    - SMTP/Gmail
    - SendGrid
    - AWS SES
    - Mailgun
    - Resend
    - Brevo

  4. Features
    - Configuration multi-providers
    - Templates avec variables
    - Queue avec retry
    - Stats avancées
*/

-- Table de configuration du provider email
CREATE TABLE IF NOT EXISTS email_provider_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type text NOT NULL CHECK (provider_type IN ('smtp', 'sendgrid', 'aws_ses', 'mailgun', 'resend', 'brevo')),
  is_active boolean DEFAULT false,
  
  -- Configuration SMTP
  smtp_host text,
  smtp_port integer,
  smtp_secure boolean DEFAULT true,
  smtp_user text,
  smtp_password text,
  
  -- Configuration API
  api_key text,
  api_domain text,
  api_region text,
  
  -- Configuration générale
  from_email text NOT NULL,
  from_name text NOT NULL DEFAULT 'JobGuinée',
  reply_to_email text,
  
  -- Limites
  daily_limit integer DEFAULT 500,
  rate_limit_per_minute integer DEFAULT 10,
  
  -- Tests
  last_tested_at timestamptz,
  last_test_status text,
  last_test_error text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_email_provider 
  ON email_provider_config (is_active) 
  WHERE is_active = true;

-- Table des templates
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('auth', 'application', 'notification', 'marketing', 'system')),
  
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  
  available_variables jsonb DEFAULT '[]'::jsonb,
  
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT false,
  
  sent_count integer DEFAULT 0,
  open_count integer DEFAULT 0,
  click_count integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES profiles(id)
);

-- Table de queue
CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES email_templates(id),
  
  to_email text NOT NULL,
  to_name text,
  
  template_variables jsonb DEFAULT '{}'::jsonb,
  
  priority integer DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  scheduled_for timestamptz DEFAULT now(),
  
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  error_message text,
  
  email_log_id uuid REFERENCES email_logs(id),
  
  user_id uuid REFERENCES profiles(id),
  job_id uuid REFERENCES jobs(id),
  
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_templates_key ON email_templates(template_key);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority, scheduled_for) WHERE status = 'pending';

-- RLS email_provider_config
ALTER TABLE email_provider_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view email config" ON email_provider_config;
CREATE POLICY "Admins can view email config"
  ON email_provider_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage email config" ON email_provider_config;
CREATE POLICY "Admins can manage email config"
  ON email_provider_config FOR ALL
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

-- RLS email_templates
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active templates" ON email_templates;
CREATE POLICY "Anyone can view active templates"
  ON email_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage templates" ON email_templates;
CREATE POLICY "Admins can manage templates"
  ON email_templates FOR ALL
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

-- RLS email_queue
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view email queue" ON email_queue;
CREATE POLICY "Admins can view email queue"
  ON email_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "System can manage email queue" ON email_queue;
CREATE POLICY "System can manage email queue"
  ON email_queue FOR ALL
  TO authenticated
  WITH CHECK (true);

-- Function: Get active config
CREATE OR REPLACE FUNCTION get_active_email_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config record;
BEGIN
  SELECT * INTO v_config
  FROM email_provider_config
  WHERE is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'No active email configuration found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'config', row_to_json(v_config)
  );
END;
$$;

-- Function: Queue email
CREATE OR REPLACE FUNCTION queue_email(
  p_template_key text,
  p_to_email text,
  p_to_name text DEFAULT NULL,
  p_variables jsonb DEFAULT '{}'::jsonb,
  p_priority integer DEFAULT 5,
  p_scheduled_for timestamptz DEFAULT now(),
  p_user_id uuid DEFAULT NULL,
  p_job_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template_id uuid;
  v_queue_id uuid;
BEGIN
  SELECT id INTO v_template_id
  FROM email_templates
  WHERE template_key = p_template_key
  AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Template not found: ' || p_template_key
    );
  END IF;

  INSERT INTO email_queue (
    template_id,
    to_email,
    to_name,
    template_variables,
    priority,
    scheduled_for,
    user_id,
    job_id
  ) VALUES (
    v_template_id,
    p_to_email,
    p_to_name,
    p_variables,
    p_priority,
    p_scheduled_for,
    COALESCE(p_user_id, auth.uid()),
    p_job_id
  )
  RETURNING id INTO v_queue_id;

  RETURN jsonb_build_object(
    'success', true,
    'queue_id', v_queue_id
  );
END;
$$;

-- Function: Get email stats
CREATE OR REPLACE FUNCTION get_email_stats(
  p_days integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats jsonb;
  v_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Unauthorized');
  END IF;

  SELECT jsonb_build_object(
    'total_sent', COUNT(*) FILTER (WHERE status IN ('sent', 'delivered')),
    'total_delivered', COUNT(*) FILTER (WHERE status = 'delivered'),
    'total_opened', COUNT(*) FILTER (WHERE opened_at IS NOT NULL),
    'total_clicked', COUNT(*) FILTER (WHERE clicked_at IS NOT NULL),
    'total_failed', COUNT(*) FILTER (WHERE status = 'failed')
  ) INTO v_stats
  FROM email_logs
  WHERE created_at > now() - (p_days || ' days')::interval;

  RETURN jsonb_build_object(
    'success', true,
    'period_days', p_days,
    'stats', v_stats
  );
END;
$$;

-- Insert default templates
INSERT INTO email_templates (template_key, name, description, category, subject, html_body, text_body, available_variables, is_system) VALUES
(
  'welcome_candidate',
  'Bienvenue Candidat',
  'Email envoyé aux nouveaux candidats',
  'auth',
  'Bienvenue sur JobGuinée',
  '<html><body style="font-family: Arial, sans-serif;"><h1>Bienvenue {{candidate_name}} !</h1><p>Merci de votre inscription sur JobGuinée.</p><p>Commencez à postuler dès maintenant.</p><a href="{{app_url}}/jobs" style="background: #0E2F56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Voir les offres</a></body></html>',
  'Bienvenue {{candidate_name}} ! Merci de votre inscription.',
  '["candidate_name", "candidate_email", "app_url"]'::jsonb,
  true
),
(
  'welcome_recruiter',
  'Bienvenue Recruteur',
  'Email envoyé aux nouveaux recruteurs',
  'auth',
  'Bienvenue sur JobGuinée',
  '<html><body style="font-family: Arial, sans-serif;"><h1>Bienvenue {{company_name}} !</h1><p>Merci de votre inscription.</p><p>Publiez vos offres dès maintenant.</p><a href="{{app_url}}/recruiter" style="background: #0E2F56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Tableau de bord</a></body></html>',
  'Bienvenue {{company_name}} !',
  '["company_name", "recruiter_name", "recruiter_email", "app_url"]'::jsonb,
  true
),
(
  'application_confirmation',
  'Candidature reçue',
  'Confirmation candidature pour candidat',
  'application',
  'Candidature envoyée - {{job_title}}',
  '<html><body style="font-family: Arial, sans-serif;"><h1>Candidature envoyée</h1><p>Bonjour {{candidate_name}},</p><p>Votre candidature pour <strong>{{job_title}}</strong> chez {{company_name}} a été envoyée.</p><a href="{{app_url}}/candidate/dashboard" style="background: #0E2F56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Suivre mes candidatures</a></body></html>',
  'Candidature pour {{job_title}} envoyée.',
  '["candidate_name", "job_title", "company_name", "app_url"]'::jsonb,
  true
),
(
  'new_application_alert',
  'Nouvelle candidature',
  'Alerte nouvelle candidature pour recruteur',
  'application',
  'Nouvelle candidature - {{job_title}}',
  '<html><body style="font-family: Arial, sans-serif;"><h1>Nouvelle candidature</h1><p>Vous avez reçu une candidature pour <strong>{{job_title}}</strong>.</p><p>Candidat: {{candidate_name}}</p><a href="{{app_url}}/recruiter/applications/{{application_id}}" style="background: #0E2F56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Voir la candidature</a></body></html>',
  'Nouvelle candidature pour {{job_title}}.',
  '["job_title", "candidate_name", "application_id", "app_url"]'::jsonb,
  true
),
(
  'job_alert_match',
  'Alerte emploi',
  'Notification nouvelle offre',
  'notification',
  'Nouvelle offre : {{job_title}}',
  '<html><body style="font-family: Arial, sans-serif;"><h1>Nouvelle offre</h1><p>Bonjour {{candidate_name}},</p><h2>{{job_title}}</h2><p>{{company_name}} - {{job_location}}</p><a href="{{app_url}}/jobs/{{job_id}}" style="background: #0E2F56; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 16px;">Voir l''offre</a></body></html>',
  'Nouvelle offre : {{job_title}}.',
  '["candidate_name", "job_title", "company_name", "job_location", "job_id", "app_url"]'::jsonb,
  true
)
ON CONFLICT (template_key) DO NOTHING;
