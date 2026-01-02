/*
  # Création des tables de configuration pour les modules système

  1. Nouvelles Tables
    - `formation_config` - Configuration globale des formations
    - `cv_builder_config` - Configuration du CV Builder
    - `cv_templates` - Templates de CV disponibles
    - `job_alerts_config` - Configuration des alertes emploi
    - `interview_config` - Configuration du système d'entretiens

  2. Sécurité
    - Activation de RLS sur toutes les tables
    - Politiques d'accès admin uniquement pour toutes les configurations

  3. Notes
    - Ces tables permettent une configuration complète via l'interface admin
    - Une seule ligne de configuration par table (pattern singleton)
*/

-- Table: formation_config
CREATE TABLE IF NOT EXISTS formation_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boost_7j_price integer NOT NULL DEFAULT 50000,
  boost_15j_price integer NOT NULL DEFAULT 90000,
  boost_30j_price integer NOT NULL DEFAULT 150000,
  premium_month_price integer NOT NULL DEFAULT 200000,
  premium_org_annual_price integer NOT NULL DEFAULT 2000000,
  max_formations_per_trainer integer NOT NULL DEFAULT 10,
  auto_approve_formations boolean NOT NULL DEFAULT false,
  require_trainer_verification boolean NOT NULL DEFAULT true,
  min_formation_duration_hours integer NOT NULL DEFAULT 1,
  max_formation_duration_hours integer NOT NULL DEFAULT 500,
  allow_online_formations boolean NOT NULL DEFAULT true,
  allow_in_person_formations boolean NOT NULL DEFAULT true,
  allow_hybrid_formations boolean NOT NULL DEFAULT true,
  default_currency text NOT NULL DEFAULT 'GNF',
  commission_percentage integer NOT NULL DEFAULT 15,
  platform_fee_percentage integer NOT NULL DEFAULT 5,
  enable_trainer_analytics boolean NOT NULL DEFAULT true,
  enable_formation_ratings boolean NOT NULL DEFAULT true,
  min_rating_stars integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE formation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage formation config"
  ON formation_config
  FOR ALL
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

-- Table: cv_builder_config
CREATE TABLE IF NOT EXISTS cv_builder_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enable_cv_builder boolean NOT NULL DEFAULT true,
  enable_ai_suggestions boolean NOT NULL DEFAULT true,
  enable_cv_parsing boolean NOT NULL DEFAULT true,
  enable_cv_templates boolean NOT NULL DEFAULT true,
  max_cv_versions_per_user integer NOT NULL DEFAULT 5,
  allow_custom_templates boolean NOT NULL DEFAULT false,
  require_profile_completion boolean NOT NULL DEFAULT true,
  min_profile_completion_percentage integer NOT NULL DEFAULT 50,
  enable_cv_export_pdf boolean NOT NULL DEFAULT true,
  enable_cv_export_docx boolean NOT NULL DEFAULT true,
  enable_cv_watermark boolean NOT NULL DEFAULT false,
  watermark_text text NOT NULL DEFAULT 'Généré par JobGuinee',
  default_cv_language text NOT NULL DEFAULT 'fr',
  enable_multi_language_cv boolean NOT NULL DEFAULT true,
  ai_suggestion_credit_cost integer NOT NULL DEFAULT 10,
  cv_improvement_credit_cost integer NOT NULL DEFAULT 20,
  cv_targeted_credit_cost integer NOT NULL DEFAULT 30,
  enable_cv_analytics boolean NOT NULL DEFAULT true,
  enable_cv_versioning boolean NOT NULL DEFAULT true,
  max_file_size_mb integer NOT NULL DEFAULT 5,
  allowed_file_types text[] NOT NULL DEFAULT ARRAY['pdf', 'docx', 'doc'],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cv_builder_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage cv builder config"
  ON cv_builder_config
  FOR ALL
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

-- Table: cv_templates
CREATE TABLE IF NOT EXISTS cv_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  is_premium boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  preview_url text,
  template_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cv_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage cv templates"
  ON cv_templates
  FOR ALL
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

CREATE POLICY "Users can view active templates"
  ON cv_templates
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Table: job_alerts_config
CREATE TABLE IF NOT EXISTS job_alerts_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enable_job_alerts boolean NOT NULL DEFAULT true,
  enable_email_alerts boolean NOT NULL DEFAULT true,
  enable_sms_alerts boolean NOT NULL DEFAULT false,
  enable_push_notifications boolean NOT NULL DEFAULT true,
  enable_whatsapp_alerts boolean NOT NULL DEFAULT false,
  default_frequency text NOT NULL DEFAULT 'daily',
  max_alerts_per_user integer NOT NULL DEFAULT 10,
  max_alerts_per_day integer NOT NULL DEFAULT 50,
  alert_batch_size integer NOT NULL DEFAULT 10,
  send_time_hour integer NOT NULL DEFAULT 9,
  enable_immediate_alerts boolean NOT NULL DEFAULT true,
  enable_daily_digest boolean NOT NULL DEFAULT true,
  enable_weekly_digest boolean NOT NULL DEFAULT true,
  min_match_score integer NOT NULL DEFAULT 70,
  include_similar_jobs boolean NOT NULL DEFAULT true,
  max_similar_jobs integer NOT NULL DEFAULT 3,
  alert_expiration_days integer NOT NULL DEFAULT 90,
  require_email_verification boolean NOT NULL DEFAULT true,
  enable_alert_analytics boolean NOT NULL DEFAULT true,
  pause_alerts_after_days integer NOT NULL DEFAULT 30,
  auto_unsubscribe_after_months integer NOT NULL DEFAULT 6,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_alerts_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage job alerts config"
  ON job_alerts_config
  FOR ALL
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

-- Table: interview_config
CREATE TABLE IF NOT EXISTS interview_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enable_interview_scheduling boolean NOT NULL DEFAULT true,
  enable_interview_simulation boolean NOT NULL DEFAULT true,
  enable_interview_evaluation boolean NOT NULL DEFAULT true,
  enable_video_interviews boolean NOT NULL DEFAULT true,
  enable_in_person_interviews boolean NOT NULL DEFAULT true,
  enable_phone_interviews boolean NOT NULL DEFAULT true,
  enable_automatic_reminders boolean NOT NULL DEFAULT true,
  reminder_hours_before integer[] NOT NULL DEFAULT ARRAY[24, 2],
  max_interviews_per_candidate integer NOT NULL DEFAULT 5,
  max_interviews_per_day integer NOT NULL DEFAULT 20,
  interview_duration_minutes integer NOT NULL DEFAULT 60,
  buffer_time_minutes integer NOT NULL DEFAULT 15,
  allow_rescheduling boolean NOT NULL DEFAULT true,
  max_reschedules integer NOT NULL DEFAULT 2,
  cancellation_hours_notice integer NOT NULL DEFAULT 24,
  enable_interview_feedback boolean NOT NULL DEFAULT true,
  require_interview_notes boolean NOT NULL DEFAULT false,
  enable_interview_recording boolean NOT NULL DEFAULT false,
  recording_retention_days integer NOT NULL DEFAULT 30,
  enable_ai_interview_analysis boolean NOT NULL DEFAULT true,
  ai_analysis_credit_cost integer NOT NULL DEFAULT 50,
  enable_candidate_self_scheduling boolean NOT NULL DEFAULT false,
  working_hours_start integer NOT NULL DEFAULT 9,
  working_hours_end integer NOT NULL DEFAULT 17,
  working_days text[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  enable_interview_templates boolean NOT NULL DEFAULT true,
  default_evaluation_criteria text[] NOT NULL DEFAULT ARRAY['Communication', 'Compétences techniques', 'Motivation', 'Culture fit'],
  min_evaluation_score integer NOT NULL DEFAULT 1,
  max_evaluation_score integer NOT NULL DEFAULT 5,
  enable_multi_stage_interviews boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE interview_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage interview config"
  ON interview_config
  FOR ALL
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

-- Créer des index pour les performances
CREATE INDEX IF NOT EXISTS idx_cv_templates_category ON cv_templates(category);
CREATE INDEX IF NOT EXISTS idx_cv_templates_active ON cv_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_cv_templates_premium ON cv_templates(is_premium);

-- Insérer les configurations par défaut
INSERT INTO formation_config (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

INSERT INTO cv_builder_config (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

INSERT INTO job_alerts_config (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;

INSERT INTO interview_config (id) VALUES (gen_random_uuid())
ON CONFLICT DO NOTHING;
