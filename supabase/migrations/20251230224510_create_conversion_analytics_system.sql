/*
  # Conversion Analytics System

  1. New Tables
    - `conversion_events`
      - Tracks all modal interactions and conversions
      - Fields: id, event_type, modal_type, user_id, session_id, action, context, timestamp

    - `cta_configurations`
      - Admin-configurable CTA texts and settings
      - Fields: id, component_name, cta_type, text_content, is_active, target_url, display_order

    - `saved_jobs`
      - User's saved/bookmarked job offers
      - Fields: id, user_id, job_id, saved_at, notes

  2. Security
    - Enable RLS on all tables
    - Conversion events: authenticated users can insert own events, admins can read all
    - CTA configs: public read, admin write
    - Saved jobs: users can manage own saved jobs
*/

-- Conversion Events Table
CREATE TABLE IF NOT EXISTS conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('modal_view', 'modal_interaction', 'modal_conversion', 'modal_dismiss')),
  modal_type text NOT NULL CHECK (modal_type IN ('auth_required', 'application_success', 'diffusion_proposal', 'profile_completion', 'premium_upgrade', 'other')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  action text,
  context jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversion_events_modal_type ON conversion_events(modal_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_session_id ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp DESC);

ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert conversion events"
  ON conversion_events FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can view own conversion events"
  ON conversion_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversion events"
  ON conversion_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- CTA Configurations Table
CREATE TABLE IF NOT EXISTS cta_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name text NOT NULL,
  cta_type text NOT NULL CHECK (cta_type IN ('primary', 'secondary', 'tertiary')),
  text_content text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  target_url text,
  display_order integer DEFAULT 0,
  button_style jsonb DEFAULT '{}'::jsonb,
  modal_config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(component_name, cta_type)
);

CREATE INDEX IF NOT EXISTS idx_cta_configurations_component ON cta_configurations(component_name);
CREATE INDEX IF NOT EXISTS idx_cta_configurations_active ON cta_configurations(is_active);

ALTER TABLE cta_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active CTA configurations"
  ON cta_configurations FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage CTA configurations"
  ON cta_configurations FOR ALL
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

-- Saved Jobs Table
CREATE TABLE IF NOT EXISTS saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  notes text,
  saved_at timestamptz DEFAULT now(),
  reminder_date timestamptz,
  is_archived boolean DEFAULT false,
  UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_id ON saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_saved_at ON saved_jobs(saved_at DESC);

ALTER TABLE saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved jobs"
  ON saved_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved jobs"
  ON saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved jobs"
  ON saved_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved jobs"
  ON saved_jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert Default CTA Configurations
INSERT INTO cta_configurations (component_name, cta_type, text_content, description, display_order, modal_config) VALUES
  ('auth_required_modal', 'primary', 'Créer mon compte', 'CTA principal pour inscription', 1, '{"show_benefits": true, "highlight_color": "green"}'::jsonb),
  ('auth_required_modal', 'secondary', 'Se connecter', 'CTA secondaire pour connexion', 2, '{}'::jsonb),
  ('application_success_modal', 'primary', 'Compléter mon profil', 'CTA pour profil incomplet', 1, '{"threshold": 80}'::jsonb),
  ('application_success_modal', 'secondary', 'Voir d''autres offres', 'CTA alternatif après candidature', 2, '{}'::jsonb),
  ('diffusion_proposal_modal', 'primary', 'Lancer la diffusion ciblée', 'CTA principal diffusion', 1, '{"delay_seconds": 1.5}'::jsonb),
  ('diffusion_proposal_modal', 'secondary', 'Plus tard', 'CTA report diffusion', 2, '{}'::jsonb),
  ('profile_completion_bar', 'primary', 'Compléter maintenant', 'CTA complétion profil', 1, '{}'::jsonb)
ON CONFLICT (component_name, cta_type) DO NOTHING;

-- Function to get conversion metrics
CREATE OR REPLACE FUNCTION get_conversion_metrics(
  p_modal_type text,
  p_date_from timestamptz DEFAULT NULL,
  p_date_to timestamptz DEFAULT NULL
)
RETURNS TABLE (
  modal_type text,
  total_views bigint,
  total_conversions bigint,
  total_dismissals bigint,
  conversion_rate numeric,
  avg_time_spent numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH event_stats AS (
    SELECT
      ce.modal_type,
      COUNT(*) FILTER (WHERE ce.event_type = 'modal_view') as views,
      COUNT(*) FILTER (WHERE ce.event_type = 'modal_conversion') as conversions,
      COUNT(*) FILTER (WHERE ce.event_type = 'modal_dismiss') as dismissals,
      AVG((ce.context->>'time_spent_seconds')::numeric) FILTER (WHERE ce.event_type = 'modal_dismiss') as avg_time
    FROM conversion_events ce
    WHERE ce.modal_type = p_modal_type
      AND (p_date_from IS NULL OR ce.timestamp >= p_date_from)
      AND (p_date_to IS NULL OR ce.timestamp <= p_date_to)
    GROUP BY ce.modal_type
  )
  SELECT
    es.modal_type,
    es.views,
    es.conversions,
    es.dismissals,
    CASE WHEN es.views > 0 THEN ROUND((es.conversions::numeric / es.views::numeric) * 100, 2) ELSE 0 END as conversion_rate,
    COALESCE(es.avg_time, 0) as avg_time_spent
  FROM event_stats es;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle save job
CREATE OR REPLACE FUNCTION toggle_save_job(
  p_job_id uuid
)
RETURNS boolean AS $$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM saved_jobs
    WHERE user_id = auth.uid()
    AND job_id = p_job_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM saved_jobs
    WHERE user_id = auth.uid()
    AND job_id = p_job_id;
    RETURN false;
  ELSE
    INSERT INTO saved_jobs (user_id, job_id)
    VALUES (auth.uid(), p_job_id);
    RETURN true;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE conversion_events IS 'Tracks all user interactions with modals for conversion analytics';
COMMENT ON TABLE cta_configurations IS 'Admin-configurable CTA texts and settings for all components';
COMMENT ON TABLE saved_jobs IS 'User bookmarked/saved job offers for later review';
