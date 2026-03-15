-- ============================================================
-- Migration: Enhance Newsletter Alerts System
-- Date: 2026-03-16
-- Steps: frequency options, daily limit, performance indexes,
--        daily digest, unsubscribe, active filtering
-- ============================================================

-- ============================================================
-- STEP 1: Add new columns to newsletter_subscribers
-- Additive only — existing columns untouched
-- ============================================================
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS frequency TEXT DEFAULT 'instant';

-- Note: `is_active` already exists (boolean DEFAULT true)
-- We add `active` as a computed alias only if needed, but since
-- the existing column is `is_active`, we keep using that.
-- The `active` column requested is functionally identical to `is_active`.

-- Add CHECK constraint for frequency values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'newsletter_subscribers_frequency_check'
  ) THEN
    ALTER TABLE newsletter_subscribers
      ADD CONSTRAINT newsletter_subscribers_frequency_check
      CHECK (frequency IN ('instant', 'daily', 'weekly'));
  END IF;
END $$;

-- ============================================================
-- STEP 2: Performance indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_newsletter_active
  ON newsletter_subscribers(is_active);

CREATE INDEX IF NOT EXISTS idx_newsletter_frequency
  ON newsletter_subscribers(frequency);

CREATE INDEX IF NOT EXISTS idx_newsletter_sectors
  ON newsletter_subscribers USING GIN(sectors);

CREATE INDEX IF NOT EXISTS idx_newsletter_locations
  ON newsletter_subscribers USING GIN(locations);

CREATE INDEX IF NOT EXISTS idx_newsletter_contract_types
  ON newsletter_subscribers USING GIN(contract_types);

CREATE INDEX IF NOT EXISTS idx_newsletter_keywords
  ON newsletter_subscribers USING GIN(keywords);

-- ============================================================
-- STEP 3: Create email_events table for tracking/rate limiting
-- ============================================================
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  metadata JSONB DEFAULT '{}'::jsonb,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_recipient
  ON email_events(recipient_email, event_type, created_at);

-- ============================================================
-- STEP 4: Daily alert limit function
-- Uses parameterized query to avoid variable shadowing
-- ============================================================
CREATE OR REPLACE FUNCTION check_daily_job_alert_limit(p_recipient_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  alert_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO alert_count
  FROM email_events ee
  WHERE ee.recipient_email = p_recipient_email
    AND ee.event_type = 'job_alert_match'
    AND ee.created_at > NOW() - INTERVAL '24 hours';

  RETURN alert_count < 10;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- STEP 5: Updated trigger function
-- Backward compatible: frequency IS NULL or 'instant' = instant
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_job_alerts_to_candidates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_alert RECORD;
  v_newsletter RECORD;
  v_company_name TEXT;
  v_can_send BOOLEAN;
BEGIN
  -- Only process published jobs
  IF NOT (
    (TG_OP = 'INSERT' AND NEW.status = 'published') OR
    (TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published')
  ) THEN
    RETURN NEW;
  END IF;

  SELECT name INTO v_company_name FROM companies WHERE id = NEW.company_id;

  -- PART 1: Connected user alerts (job_alerts) — unchanged
  FOR v_alert IN
    SELECT DISTINCT ja.user_id, p.email, p.full_name, ja.id as alert_id
    FROM job_alerts ja
    JOIN profiles p ON ja.user_id = p.id
    WHERE ja.is_active = true
      AND ja.notify_email = true
      AND (ja.keywords = '{}' OR ja.keywords IS NULL OR EXISTS (SELECT 1 FROM unnest(ja.keywords) kw WHERE NEW.title ILIKE '%' || kw || '%' OR NEW.description ILIKE '%' || kw || '%'))
      AND (ja.sectors = '{}' OR ja.sectors IS NULL OR NEW.sector = ANY(ja.sectors))
      AND (ja.locations = '{}' OR ja.locations IS NULL OR NEW.location = ANY(ja.locations))
      AND (ja.contract_types = '{}' OR ja.contract_types IS NULL OR NEW.contract_type = ANY(ja.contract_types))
      AND (ja.experience_level = '{}' OR ja.experience_level IS NULL OR NEW.experience_level = ANY(ja.experience_level))
  LOOP
    PERFORM enqueue_email(
      p_template_key := 'job_alert_match',
      p_to_email := v_alert.email,
      p_to_name := v_alert.full_name,
      p_variables := jsonb_build_object(
        'candidate_name', COALESCE(v_alert.full_name, 'Candidat'),
        'job_title', NEW.title,
        'company_name', COALESCE(v_company_name, NEW.company_name, 'Une entreprise'),
        'location', COALESCE(NEW.location, 'Guinée'),
        'job_type', COALESCE(NEW.contract_type, ''),
        'salary_range', COALESCE(NEW.salary_range, 'Non spécifié'),
        'app_url', 'https://jobguinee-pro.com',
        'job_url', 'https://jobguinee-pro.com/jobs/' || NEW.id
      ),
      p_priority := 5,
      p_scheduled_for := now() + interval '5 minutes',
      p_user_id := v_alert.user_id,
      p_job_id := NEW.id
    );

    UPDATE job_alerts
    SET matched_jobs_count = matched_jobs_count + 1, last_check_at = now()
    WHERE id = v_alert.alert_id;
  END LOOP;

  -- PART 2: Newsletter subscriber alerts
  -- Now filters by: active + instant frequency + daily limit
  FOR v_newsletter IN
    SELECT DISTINCT ns.id, ns.email
    FROM newsletter_subscribers ns
    WHERE ns.is_active = true
      -- Backward compatible: NULL or 'instant' = instant behavior
      AND (ns.frequency IS NULL OR ns.frequency = 'instant')
      AND (ns.domain = 'all' OR ns.domain IS NULL OR ns.domain = '' OR ns.domain = NEW.sector)
      AND (ns.sectors = '{}' OR ns.sectors IS NULL OR NEW.sector = ANY(ns.sectors))
      AND (ns.locations = '{}' OR ns.locations IS NULL OR NEW.location = ANY(ns.locations))
      AND (ns.contract_types = '{}' OR ns.contract_types IS NULL OR NEW.contract_type = ANY(ns.contract_types))
      AND (ns.experience_level = '{}' OR ns.experience_level IS NULL OR NEW.experience_level = ANY(ns.experience_level))
      AND (ns.keywords = '{}' OR ns.keywords IS NULL OR EXISTS (SELECT 1 FROM unnest(ns.keywords) kw WHERE NEW.title ILIKE '%' || kw || '%' OR NEW.description ILIKE '%' || kw || '%'))
      -- Avoid duplicates with job_alerts already sent
      AND NOT EXISTS (
        SELECT 1 FROM job_alerts ja
        JOIN profiles p ON ja.user_id = p.id
        WHERE p.email = ns.email AND ja.is_active = true
      )
  LOOP
    -- Check daily limit before sending
    SELECT check_daily_job_alert_limit(v_newsletter.email) INTO v_can_send;

    IF v_can_send THEN
      PERFORM enqueue_email(
        p_template_key := 'job_alert_match',
        p_to_email := v_newsletter.email,
        p_to_name := NULL,
        p_variables := jsonb_build_object(
          'candidate_name', 'Cher abonné',
          'job_title', NEW.title,
          'company_name', COALESCE(v_company_name, NEW.company_name, 'Une entreprise'),
          'location', COALESCE(NEW.location, 'Guinée'),
          'job_type', COALESCE(NEW.contract_type, ''),
          'salary_range', COALESCE(NEW.salary_range, 'Non spécifié'),
          'app_url', 'https://jobguinee-pro.com',
          'job_url', 'https://jobguinee-pro.com/jobs/' || NEW.id
        ),
        p_priority := 6,
        p_scheduled_for := now() + interval '10 minutes',
        p_job_id := NEW.id
      );

      -- Log the event for rate limiting
      INSERT INTO email_events (recipient_email, event_type, status, job_id, metadata)
      VALUES (v_newsletter.email, 'job_alert_match', 'sent', NEW.id,
        jsonb_build_object('job_title', NEW.title, 'subscriber_id', v_newsletter.id));
    ELSE
      -- Daily limit reached — log skip
      INSERT INTO email_events (recipient_email, event_type, status, job_id, metadata)
      VALUES (v_newsletter.email, 'job_alert_match', 'skipped_daily_limit', NEW.id,
        jsonb_build_object('job_title', NEW.title, 'subscriber_id', v_newsletter.id, 'reason', 'daily_limit_exceeded'));
    END IF;
  END LOOP;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Erreur trigger_job_alerts_to_candidates: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- STEP 6: Daily digest function
-- Sends one summary email per day to daily subscribers
-- ============================================================
CREATE OR REPLACE FUNCTION process_daily_newsletter_alerts()
RETURNS void AS $$
BEGIN
  -- Enqueue a daily digest email for each active daily subscriber
  -- Uses the existing enqueue_email function for compatibility
  PERFORM enqueue_email(
    p_template_key := 'daily_job_alert_digest',
    p_to_email := ns.email,
    p_to_name := NULL,
    p_variables := jsonb_build_object(
      'date', CURRENT_DATE::text,
      'subscriber_email', ns.email
    ),
    p_priority := 6,
    p_scheduled_for := now()
  )
  FROM newsletter_subscribers ns
  WHERE ns.is_active = true
    AND ns.frequency = 'daily';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- ============================================================
-- STEP 6b: Weekly digest function
-- ============================================================
CREATE OR REPLACE FUNCTION process_weekly_newsletter_alerts()
RETURNS void AS $$
BEGIN
  PERFORM enqueue_email(
    p_template_key := 'weekly_job_alert_digest',
    p_to_email := ns.email,
    p_to_name := NULL,
    p_variables := jsonb_build_object(
      'date', CURRENT_DATE::text,
      'subscriber_email', ns.email
    ),
    p_priority := 7,
    p_scheduled_for := now()
  )
  FROM newsletter_subscribers ns
  WHERE ns.is_active = true
    AND ns.frequency = 'weekly';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- ============================================================
-- STEP 7: Cron jobs (pg_cron)
-- Daily digest at 08:00 UTC, Weekly digest Monday 08:00 UTC
-- ============================================================
DO $$
BEGIN
  -- Only schedule if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing cron jobs if they exist (idempotent)
    PERFORM cron.unschedule(jobname)
    FROM cron.job
    WHERE jobname IN ('daily_newsletter_digest', 'weekly_newsletter_digest');

    -- Daily digest: every day at 08:00 UTC
    PERFORM cron.schedule(
      'daily_newsletter_digest',
      '0 8 * * *',
      'SELECT process_daily_newsletter_alerts()'
    );

    -- Weekly digest: every Monday at 08:00 UTC
    PERFORM cron.schedule(
      'weekly_newsletter_digest',
      '0 8 * * 1',
      'SELECT process_weekly_newsletter_alerts()'
    );
  ELSE
    RAISE NOTICE 'pg_cron not available — cron jobs not scheduled. Schedule manually.';
  END IF;
END $$;

-- ============================================================
-- STEP 8: Unsubscribe helper function
-- Soft-delete: sets is_active = false, preserves analytics
-- ============================================================
CREATE OR REPLACE FUNCTION unsubscribe_newsletter(subscriber_email TEXT)
RETURNS void AS $$
BEGIN
  UPDATE newsletter_subscribers
  SET is_active = false,
      unsubscribed_at = now(),
      updated_at = now()
  WHERE email = subscriber_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- ============================================================
-- RLS for email_events
-- ============================================================
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_events'
      AND policyname = 'Service role full access on email_events'
  ) THEN
    CREATE POLICY "Service role full access on email_events"
      ON email_events FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
