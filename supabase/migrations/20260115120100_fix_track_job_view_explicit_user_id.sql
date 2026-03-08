-- =====================================================
-- Fix: track_job_view_secure now accepts explicit p_user_id
-- instead of relying on auth.uid() which may be null
-- when called from Edge Function with service_role_key
-- =====================================================

CREATE OR REPLACE FUNCTION track_job_view_secure(
  p_job_id uuid,
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_viewer_fingerprint text;
  v_last_view_at timestamptz;
  v_result jsonb;
BEGIN
  -- Use explicit p_user_id if provided, otherwise fallback to auth.uid()
  v_user_id := COALESCE(p_user_id, auth.uid());

  IF v_user_id IS NOT NULL THEN
    v_viewer_fingerprint := v_user_id::text;
  ELSE
    v_viewer_fingerprint := encode(
      digest(COALESCE(p_session_id, '') || COALESCE(p_ip_hash, '') || COALESCE(p_user_agent, ''), 'sha256'),
      'hex'
    );
  END IF;

  SELECT created_at INTO v_last_view_at
  FROM candidate_stats_logs
  WHERE stat_type = 'job_view'
    AND related_id = p_job_id
    AND viewer_fingerprint = v_viewer_fingerprint
    AND created_at > (now() - interval '1 hour')
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_last_view_at IS NOT NULL THEN
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      viewer_fingerprint,
      session_id,
      ip_hash,
      user_agent,
      delta,
      status,
      metadata
    ) VALUES (
      NULL,
      'job_view',
      'job_detail',
      p_job_id,
      v_user_id,
      v_viewer_fingerprint,
      p_session_id,
      p_ip_hash,
      p_user_agent,
      0,
      'blocked_spam',
      jsonb_build_object('last_view_at', v_last_view_at, 'blocked_reason', 'viewed_within_1_hour')
    );

    RETURN jsonb_build_object(
      'success', false,
      'status', 'blocked_spam',
      'message', 'Vous avez déjà consulté cette offre récemment'
    );
  END IF;

  UPDATE jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id;

  INSERT INTO candidate_stats_logs (
    candidate_id,
    stat_type,
    source,
    related_id,
    viewer_id,
    viewer_fingerprint,
    session_id,
    ip_hash,
    user_agent,
    delta,
    status
  ) VALUES (
    v_user_id,
    'job_view',
    'job_detail',
    p_job_id,
    v_user_id,
    v_viewer_fingerprint,
    p_session_id,
    p_ip_hash,
    p_user_agent,
    1,
    'success'
  );

  IF v_user_id IS NOT NULL THEN
    INSERT INTO candidate_stats (candidate_id, job_views_count, updated_at)
    VALUES (v_user_id, 1, now())
    ON CONFLICT (candidate_id) DO UPDATE
    SET job_views_count = candidate_stats.job_views_count + 1,
        updated_at = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'success',
    'message', 'Vue enregistrée'
  );

EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO candidate_stats_logs (
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status,
      error_message
    ) VALUES (
      'job_view',
      'job_detail',
      p_job_id,
      v_user_id,
      0,
      'error',
      SQLERRM
    );

    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;
