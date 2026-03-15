-- Migration: Add atomic email queue claim function
-- Prevents race conditions when multiple process-email-queue workers run concurrently
-- Uses FOR UPDATE SKIP LOCKED to ensure each email is claimed by exactly one worker

CREATE OR REPLACE FUNCTION public.claim_pending_emails(p_limit INTEGER DEFAULT 10)
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
    ORDER BY eq.priority DESC, eq.created_at ASC
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

-- Grant execute permission to service role only
REVOKE ALL ON FUNCTION public.claim_pending_emails(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_pending_emails(INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.claim_pending_emails(INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_emails(INTEGER) TO service_role;
