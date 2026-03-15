/*
  # Switch from per-application instant emails to daily digest only
  
  Business requirement: Recruiters should receive ONE daily digest email
  with all candidatures from the last 24h, NOT an instant email per application.
  
  Changes:
  1. Drop trigger_recruiter_new_application_alert (instant per-application email)
  2. Keep the daily digest system (recruiter-daily-digest Edge Function)
  3. Add pg_cron schedule to invoke the digest hourly
  4. Ensure recruiter_notification_settings defaults to digest enabled
*/

-- ============================================================
-- 1. Drop the per-application instant email trigger
-- ============================================================
-- This trigger sends an instant email for every new application.
-- The daily digest replaces this with a single aggregated email per 24h.

DROP TRIGGER IF EXISTS trigger_recruiter_new_application_alert ON applications;

-- Keep the function definition in case we need to re-enable it later,
-- but it will no longer fire automatically.
-- To fully remove: DROP FUNCTION IF EXISTS trigger_recruiter_new_application_alert();


-- ============================================================
-- 2. Schedule the recruiter-daily-digest Edge Function via pg_cron
--    Runs every hour to catch recruiters at their preferred digest_hour
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove old schedule if exists
    BEGIN
      PERFORM cron.unschedule('recruiter_daily_digest_job');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Schedule: every hour at minute 0
    PERFORM cron.schedule(
      'recruiter_daily_digest_job',
      '0 * * * *',  -- Every hour at :00
      $$
        SELECT net.http_post(
          url := 'https://cebahbvlhvmdbqazhhru.supabase.co/functions/v1/recruiter-daily-digest',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlYmFoYnZsaHZtZGJxYXpoaHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzAzNTczOCwiZXhwIjoyMDUyNjExNzM4fQ.ppmBUExOwOlSB2Xzj6l2Czi9k1IcZtaHKgMBLrmT3ag'
          ),
          body := '{}'::jsonb,
          timeout_milliseconds := 120000
        ) as request_id;
      $$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available or config missing, skipping digest schedule. Error: %', SQLERRM;
END $$;


-- ============================================================
-- 3. Ensure default recruiter_notification_settings has digest enabled
-- ============================================================

-- Add default values for new recruiters (if columns don't have defaults)
DO $$
BEGIN
  -- Set default for daily_digest_enabled to true if not already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recruiter_notification_settings'
    AND column_name = 'daily_digest_enabled'
  ) THEN
    ALTER TABLE recruiter_notification_settings
      ALTER COLUMN daily_digest_enabled SET DEFAULT true;
  END IF;

  -- Set default digest hour to 8 AM if not already
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recruiter_notification_settings'
    AND column_name = 'daily_digest_hour'
  ) THEN
    ALTER TABLE recruiter_notification_settings
      ALTER COLUMN daily_digest_hour SET DEFAULT 8;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not set defaults on recruiter_notification_settings: %', SQLERRM;
END $$;


-- ============================================================
-- 4. Enable existing recruiters for daily digest (if not already)
-- ============================================================

UPDATE recruiter_notification_settings
SET daily_digest_enabled = true
WHERE daily_digest_enabled = false OR daily_digest_enabled IS NULL;


-- ============================================================
-- 5. Ensure the recruiter_daily_digest event is enabled
-- ============================================================

INSERT INTO email_event_settings (event_key, event_label, is_enabled, description)
VALUES (
  'recruiter_daily_digest',
  'Digest quotidien recruteur',
  true,
  'Email quotidien regroupant toutes les candidatures reçues dans les dernières 24h'
)
ON CONFLICT (event_key) DO UPDATE
SET is_enabled = true;
