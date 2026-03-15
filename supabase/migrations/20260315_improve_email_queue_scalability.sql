-- ============================================================
-- Migration: Improve email queue scalability & observability
-- Safe, additive changes only — no destructive operations
-- ============================================================

-- 1. Add deduplication and priority columns to email_queue
-- ============================================================

-- event_id: deterministic key for deduplication (e.g. 'application_confirmation_<uuid>')
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS event_id TEXT NULL;

-- entity_id: optional reference to the related entity (application, interview, job, etc.)
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS entity_id UUID NULL;

-- priority: lower = higher priority (1 = critical, 5 = default/digest)
-- Defaults to 5 so existing rows and inserts without priority are unaffected
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'email_queue' AND column_name = 'priority'
  ) THEN
    ALTER TABLE email_queue ADD COLUMN priority INTEGER NOT NULL DEFAULT 5;
  END IF;
END $$;


-- 2. Indexes for performance
-- ============================================================

-- Priority-based ordering for queue processing
CREATE INDEX IF NOT EXISTS idx_email_queue_priority
  ON email_queue(priority ASC, created_at ASC)
  WHERE status = 'pending';

-- Deduplication: unique on (event_id, to_email) when event_id is set
-- Prevents duplicate emails when both frontend + DB triggers enqueue
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_queue_dedup
  ON email_queue(event_id, to_email)
  WHERE event_id IS NOT NULL AND status IN ('pending', 'processing', 'sent');

-- Fast lookup for rate limiting by recipient
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient_recent
  ON email_queue(to_email, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '2 hours';


-- 3. Create email_events table for observability
-- ============================================================

CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id UUID REFERENCES email_queue(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,            -- 'sent', 'failed', 'retrying', 'rate_limited', 'deduplicated'
  recipient_email TEXT,
  template_key TEXT,
  provider TEXT,
  status TEXT,
  error_message TEXT,
  latency_ms INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying recent events
CREATE INDEX IF NOT EXISTS idx_email_events_created
  ON email_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_events_queue_id
  ON email_events(email_queue_id)
  WHERE email_queue_id IS NOT NULL;

-- RLS: only service_role can read/write events
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on email_events"
  ON email_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin read access
CREATE POLICY "Admin read access on email_events"
  ON email_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.user_type = 'admin'
    )
  );


-- 4. Rate limiting function
-- ============================================================
-- Returns TRUE if the email should be rate-limited (blocked)
-- Exempt template keys are never rate-limited

CREATE OR REPLACE FUNCTION public.check_email_rate_limit(
  p_recipient_email TEXT,
  p_template_key TEXT DEFAULT NULL,
  p_max_per_hour INTEGER DEFAULT 5
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_count INTEGER;
  v_exempt_keys TEXT[] := ARRAY[
    'welcome_confirmed',
    'password_reset',
    'interview_reminder_24h',
    'interview_reminder_2h',
    'interview_scheduled',
    'interview_cancelled',
    'interview_rescheduled'
  ];
BEGIN
  -- System emails are never rate-limited
  IF p_template_key IS NOT NULL AND p_template_key = ANY(v_exempt_keys) THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM email_queue
  WHERE to_email = p_recipient_email
    AND created_at > NOW() - INTERVAL '1 hour';

  RETURN v_count >= p_max_per_hour;
END;
$$;

REVOKE ALL ON FUNCTION public.check_email_rate_limit(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_email_rate_limit(TEXT, TEXT, INTEGER) TO authenticated;


-- 5. Update claim_pending_emails to use correct priority ordering
-- ============================================================
-- Priority ASC (1 = highest), then created_at ASC (oldest first)
-- Increased default limit to 100

CREATE OR REPLACE FUNCTION public.claim_pending_emails(p_limit INTEGER DEFAULT 100)
RETURNS SETOF email_queue
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT eq.id
    FROM email_queue eq
    WHERE eq.status = 'pending'
      AND eq.scheduled_for <= NOW()
    ORDER BY eq.priority ASC, eq.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE email_queue
  SET status = 'processing'
  FROM claimed
  WHERE email_queue.id = claimed.id
  RETURNING email_queue.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_emails(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_pending_emails(INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.claim_pending_emails(INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_emails(INTEGER) TO service_role;


-- 6. Safe enqueue wrapper with dedup + rate limiting
-- ============================================================
-- Wraps existing enqueue logic with dedup and rate-limit checks
-- Returns JSON with status information

CREATE OR REPLACE FUNCTION public.safe_enqueue_email(
  p_template_id UUID,
  p_to_email TEXT,
  p_to_name TEXT DEFAULT NULL,
  p_template_variables JSONB DEFAULT '{}',
  p_priority INTEGER DEFAULT 5,
  p_scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  p_user_id UUID DEFAULT NULL,
  p_job_id UUID DEFAULT NULL,
  p_event_id TEXT DEFAULT NULL,
  p_entity_id UUID DEFAULT NULL,
  p_template_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_queue_id UUID;
  v_rate_limited BOOLEAN;
BEGIN
  -- 1. Check rate limit
  v_rate_limited := public.check_email_rate_limit(p_to_email, p_template_key);
  IF v_rate_limited THEN
    -- Log the rate-limited event
    INSERT INTO email_events (event_type, recipient_email, template_key, status, metadata)
    VALUES ('rate_limited', p_to_email, p_template_key, 'blocked',
            jsonb_build_object('reason', 'rate_limit_exceeded', 'event_id', p_event_id));
    RETURN jsonb_build_object('success', false, 'reason', 'rate_limited');
  END IF;

  -- 2. Insert with ON CONFLICT for dedup (only works when event_id is set)
  INSERT INTO email_queue (
    template_id, to_email, to_name, template_variables,
    priority, scheduled_for, user_id, job_id,
    event_id, entity_id, status
  ) VALUES (
    p_template_id, p_to_email, p_to_name, p_template_variables,
    p_priority, p_scheduled_for, p_user_id, p_job_id,
    p_event_id, p_entity_id, 'pending'
  )
  ON CONFLICT (event_id, to_email) WHERE event_id IS NOT NULL AND status IN ('pending', 'processing', 'sent')
  DO NOTHING
  RETURNING id INTO v_queue_id;

  -- 3. Check if deduplicated
  IF v_queue_id IS NULL AND p_event_id IS NOT NULL THEN
    INSERT INTO email_events (event_type, recipient_email, template_key, status, metadata)
    VALUES ('deduplicated', p_to_email, p_template_key, 'skipped',
            jsonb_build_object('event_id', p_event_id));
    RETURN jsonb_build_object('success', false, 'reason', 'deduplicated');
  END IF;

  RETURN jsonb_build_object('success', true, 'queue_id', v_queue_id);
END;
$$;

REVOKE ALL ON FUNCTION public.safe_enqueue_email FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.safe_enqueue_email TO service_role;
GRANT EXECUTE ON FUNCTION public.safe_enqueue_email TO authenticated;


-- 7. Quick stats view for admin dashboard
-- ============================================================

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
FROM email_queue;
