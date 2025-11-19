/*
  # Fix match_jobs_to_alerts Function - ANY Operator Error

  1. Problem
    - Function uses incorrect syntax: ILIKE '%' || ANY(array) || '%'
    - This causes "op ANY/ALL (array) requires operator to yield boolean" error
    - Error blocks all job updates when status changes to 'published'
  
  2. Solution
    - Replace ANY(array) with unnest(array) for ILIKE pattern matching
    - Use EXISTS with unnest() to check if any keyword matches
    - This is the correct PostgreSQL syntax for array element matching
  
  3. Impact
    - Fixes job activation/approval workflow
    - Job alerts will now work correctly
    - No more blocking errors on job status updates
*/

DROP FUNCTION IF EXISTS public.match_jobs_to_alerts(uuid);
CREATE FUNCTION public.match_jobs_to_alerts(p_job_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_job record;
  v_alert record;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  
  FOR v_alert IN
    SELECT DISTINCT ja.*
    FROM job_alerts ja
    WHERE ja.is_active = true
      AND (
        (ja.keywords IS NULL OR ja.keywords = '{}') 
        OR
        EXISTS (
          SELECT 1 
          FROM unnest(ja.keywords) AS keyword
          WHERE v_job.title ILIKE '%' || keyword || '%' 
             OR v_job.description ILIKE '%' || keyword || '%'
        )
      )
      AND (ja.location IS NULL OR v_job.location ILIKE '%' || ja.location || '%')
      AND (ja.contract_type IS NULL OR v_job.contract_type = ja.contract_type)
  LOOP
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      link
    ) VALUES (
      v_alert.user_id,
      'job_alert',
      'Nouvelle offre correspondante',
      'Une nouvelle offre correspond à vos alertes: ' || v_job.title,
      '/jobs/' || v_job.id
    );
    
    INSERT INTO job_alert_history (
      alert_id,
      job_id
    ) VALUES (
      v_alert.id,
      p_job_id
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;