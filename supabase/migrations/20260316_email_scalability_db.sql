-- ============================================================
-- Migration: Email system scalability hardening (DB layer)
-- Fixes: CHECK constraint, partial indexes, stats view,
--        archival, frozen NOW() index
-- ============================================================

-- 1. Update CHECK constraint to include 'retrying' status
-- ============================================================
-- The process-email-queue code sets status to 'retrying' but
-- the constraint only allows pending/processing/sent/failed.

DO $$
BEGIN
  -- Drop old constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'email_queue'
      AND constraint_type = 'CHECK'
      AND constraint_name = 'email_queue_status_check'
  ) THEN
    ALTER TABLE email_queue DROP CONSTRAINT email_queue_status_check;
  END IF;
END $$;

-- Add updated constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'email_queue'
      AND constraint_name = 'email_queue_status_check'
  ) THEN
    ALTER TABLE email_queue ADD CONSTRAINT email_queue_status_check
      CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'retrying'));
  END IF;
END $$;


-- 2. Add missing partial indexes for retry and stale processing queries
-- ============================================================

-- Index for retrying failed emails (used by process-email-queue orphan recovery)
CREATE INDEX IF NOT EXISTS idx_email_queue_failed_retry
  ON email_queue(scheduled_for ASC)
  WHERE status IN ('failed', 'retrying') AND retry_count < 3;

-- Index for stale processing detection (orphaned emails)
CREATE INDEX IF NOT EXISTS idx_email_queue_stale_processing
  ON email_queue(created_at ASC)
  WHERE status = 'processing';


-- 3. Fix frozen NOW() in partial index
-- ============================================================
-- idx_email_queue_recipient_recent used WHERE created_at > NOW() - INTERVAL '2 hours'
-- but NOW() is evaluated at index creation time, making it static and useless.
-- Replace with a non-partial index on (to_email, created_at DESC) used by rate limiting.

DROP INDEX IF EXISTS idx_email_queue_recipient_recent;

CREATE INDEX IF NOT EXISTS idx_email_queue_recipient_rate
  ON email_queue(to_email, created_at DESC);


-- 4. Optimize stats view to avoid full table scan
-- ============================================================
-- The original view scans entire email_queue. Limit to recent 30 days.

CREATE OR REPLACE VIEW public.v_email_queue_stats AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') AS pending_count,
  COUNT(*) FILTER (WHERE status = 'processing') AS processing_count,
  COUNT(*) FILTER (WHERE status = 'sent' AND processed_at > NOW() - INTERVAL '1 hour') AS sent_last_hour,
  COUNT(*) FILTER (WHERE status = 'failed' AND processed_at > NOW() - INTERVAL '1 hour') AS failed_last_hour,
  COUNT(*) FILTER (WHERE status = 'sent' AND processed_at > NOW() - INTERVAL '24 hours') AS sent_last_24h,
  COUNT(*) FILTER (WHERE status = 'failed' AND processed_at > NOW() - INTERVAL '24 hours') AS failed_last_24h,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at)))::INTEGER
    FILTER (WHERE status = 'sent' AND processed_at > NOW() - INTERVAL '1 hour') AS avg_latency_seconds_last_hour
FROM email_queue
WHERE created_at > NOW() - INTERVAL '30 days';


-- 5. Email queue archival
-- ============================================================

-- Archive table (same structure minus constraints)
CREATE TABLE IF NOT EXISTS email_queue_archive (
  LIKE email_queue INCLUDING DEFAULTS INCLUDING GENERATED
);

-- No RLS on archive (service_role only, via function)
ALTER TABLE email_queue_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Service role full access on email_queue_archive"
  ON email_queue_archive FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Archival function: moves sent/failed emails older than p_days to archive
CREATE OR REPLACE FUNCTION public.archive_old_emails(p_days INTEGER DEFAULT 90)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_archived INTEGER;
  v_cutoff TIMESTAMPTZ;
BEGIN
  v_cutoff := NOW() - (p_days || ' days')::INTERVAL;

  WITH moved AS (
    DELETE FROM email_queue
    WHERE status IN ('sent', 'failed')
      AND created_at < v_cutoff
    RETURNING *
  )
  INSERT INTO email_queue_archive
  SELECT * FROM moved;

  GET DIAGNOSTICS v_archived = ROW_COUNT;

  RETURN jsonb_build_object(
    'archived', v_archived,
    'cutoff', v_cutoff,
    'timestamp', NOW()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.archive_old_emails(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_old_emails(INTEGER) TO service_role;


-- 6. Schedule monthly archival via pg_cron (if available)
-- ============================================================
-- This will silently fail if pg_cron is not enabled; safe to include.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'archive-old-emails',
      '0 3 1 * *',  -- 3 AM on 1st of each month
      $cron$SELECT public.archive_old_emails(90);$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, skipping archival schedule';
END $$;


-- 7. Index for email_events cleanup queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_email_events_type_created
  ON email_events(event_type, created_at DESC);
