/*
  # Amélioration du tracking social avec job_clicks

  1. Fonctions
    - `track_social_click_complete()` - Track dans social_share_clicks ET job_clicks, incrémente jobs.social_clicks
    - `increment_job_social_clicks()` - Trigger function pour incrémenter jobs.social_clicks

  2. Modifications
    - Améliore track_social_click pour aussi écrire dans job_clicks
    - Ajoute trigger sur job_clicks pour incrémenter jobs.social_clicks.{network}
    - Ajoute trigger sur job_clicks pour incrémenter jobs.clicks_count

  3. Logique
    - Chaque clic social écrit dans 2 tables: social_share_clicks (analytics) + job_clicks (logs)
    - jobs.social_clicks est un JSONB: {"facebook": 45, "linkedin": 23, "twitter": 12}
    - jobs.clicks_count est incrémenté automatiquement
*/

-- Function to increment social clicks counter in jobs table
CREATE OR REPLACE FUNCTION increment_job_social_clicks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increment clicks_count
  UPDATE jobs
  SET clicks_count = COALESCE(clicks_count, 0) + 1
  WHERE id = NEW.job_id;

  -- Increment social_clicks.{network} if source_network is provided
  IF NEW.source_network IS NOT NULL AND NEW.source_network != '' THEN
    UPDATE jobs
    SET social_clicks = jsonb_set(
      COALESCE(social_clicks, '{}'::jsonb),
      ARRAY[NEW.source_network],
      to_jsonb(COALESCE((social_clicks->>NEW.source_network)::int, 0) + 1)
    )
    WHERE id = NEW.job_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on job_clicks to auto-increment counters
DROP TRIGGER IF EXISTS trigger_increment_job_social_clicks ON job_clicks;
CREATE TRIGGER trigger_increment_job_social_clicks
  AFTER INSERT ON job_clicks
  FOR EACH ROW
  EXECUTE FUNCTION increment_job_social_clicks();

-- Enhanced track_social_click that writes to BOTH social_share_clicks and job_clicks
CREATE OR REPLACE FUNCTION track_social_click(
  p_job_id uuid,
  p_source_network text,
  p_user_agent text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_session_fingerprint text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_click_id uuid;
  v_new_click_id uuid;
  v_job_exists boolean;
  v_job_click_id uuid;
BEGIN
  -- Validate job exists
  SELECT EXISTS(SELECT 1 FROM jobs WHERE id = p_job_id AND status = 'published')
  INTO v_job_exists;

  IF NOT v_job_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Job not found or not published'
    );
  END IF;

  -- Validate network
  IF p_source_network NOT IN ('facebook', 'linkedin', 'twitter', 'whatsapp', 'telegram', 'email', 'direct', 'other') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid source network'
    );
  END IF;

  -- Anti-spam: Check if same fingerprint clicked this job in last 24h
  IF p_session_fingerprint IS NOT NULL THEN
    SELECT id INTO v_existing_click_id
    FROM social_share_clicks
    WHERE job_id = p_job_id
      AND session_fingerprint = p_session_fingerprint
      AND clicked_at > now() - interval '24 hours'
    LIMIT 1;

    IF v_existing_click_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'message', 'Click already tracked in last 24 hours',
        'click_id', v_existing_click_id
      );
    END IF;
  END IF;

  -- Insert into social_share_clicks (analytics table)
  INSERT INTO social_share_clicks (
    job_id,
    source_network,
    user_agent,
    ip_hash,
    session_fingerprint,
    candidate_id
  ) VALUES (
    p_job_id,
    p_source_network,
    p_user_agent,
    p_ip_hash,
    p_session_fingerprint,
    auth.uid()
  )
  RETURNING id INTO v_new_click_id;

  -- Also insert into job_clicks (logs table) for tracking
  -- This will automatically trigger increment_job_social_clicks()
  INSERT INTO job_clicks (
    job_id,
    source_network,
    user_agent,
    ip_address,
    user_id,
    session_id
  ) VALUES (
    p_job_id,
    p_source_network,
    p_user_agent,
    p_ip_hash,
    auth.uid(),
    p_session_fingerprint
  )
  RETURNING id INTO v_job_click_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Click tracked successfully',
    'click_id', v_new_click_id,
    'job_click_id', v_job_click_id
  );
END;
$$;

-- Function to get social stats including jobs.social_clicks
CREATE OR REPLACE FUNCTION get_job_social_stats_complete(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_stats jsonb;
  v_detailed_stats jsonb;
BEGIN
  -- Get social_clicks from jobs table
  SELECT jsonb_build_object(
    'job_id', id,
    'total_clicks', COALESCE(clicks_count, 0),
    'social_clicks', COALESCE(social_clicks, '{}'::jsonb),
    'views_count', COALESCE(views_count, 0)
  )
  INTO v_job_stats
  FROM jobs
  WHERE id = p_job_id;

  -- Get detailed stats from social_share_clicks
  SELECT get_job_social_stats(p_job_id)
  INTO v_detailed_stats;

  -- Merge both
  RETURN jsonb_build_object(
    'job_id', p_job_id,
    'summary', v_job_stats,
    'detailed_analytics', v_detailed_stats
  );
END;
$$;