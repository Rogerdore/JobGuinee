/*
  # Fix match_jobs_to_alerts - Use Correct Column Names

  1. Problem
    - Function references wrong column names (singular instead of plural)
    - job_alerts table uses: locations, sectors, contract_types (all arrays)
    - Previous function used: location, contract_type (singular)
  
  2. Solution
    - Update all column references to match actual table structure
    - Use unnest() for all array columns
    - Check if job matches any value in the alert's arrays
  
  3. Matching Logic
    - Keywords: match in title or description
    - Locations: check if job location matches any alert location
    - Sectors: check if job sector matches any alert sector
    - Contract types: check if job contract_type matches any alert contract_type
    - All conditions are optional (NULL or empty array = no filter)
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
      AND (
        (ja.locations IS NULL OR ja.locations = '{}')
        OR
        EXISTS (
          SELECT 1
          FROM unnest(ja.locations) AS loc
          WHERE v_job.location ILIKE '%' || loc || '%'
        )
      )
      AND (
        (ja.sectors IS NULL OR ja.sectors = '{}')
        OR
        EXISTS (
          SELECT 1
          FROM unnest(ja.sectors) AS sector
          WHERE v_job.sector = sector
        )
      )
      AND (
        (ja.contract_types IS NULL OR ja.contract_types = '{}')
        OR
        EXISTS (
          SELECT 1
          FROM unnest(ja.contract_types) AS ct
          WHERE v_job.contract_type = ct
        )
      )
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
    ) ON CONFLICT DO NOTHING;
    
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