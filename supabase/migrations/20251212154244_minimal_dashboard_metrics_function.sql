/*
  # Version minimale de get_recruiter_dashboard_metrics
  
  1. Problème
    - Plusieurs tables référencées n'existent pas (workflow_history, ai_matching_results, interviews)
    
  2. Correction
    - Version ultra-simplifiée avec seulement les données essentielles
    - total_jobs, active_jobs, total_applications
*/

CREATE OR REPLACE FUNCTION get_recruiter_dashboard_metrics(company_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  total_jobs_count int;
  active_jobs_count int;
  total_applications_count int;
  this_week_applications int;
BEGIN
  -- Vérifier que la company existe
  IF NOT EXISTS (SELECT 1 FROM companies WHERE id = company_id_param) THEN
    RAISE EXCEPTION 'Company not found';
  END IF;

  -- 1. Compter total des offres
  SELECT COUNT(*)
  INTO total_jobs_count
  FROM jobs
  WHERE company_id = company_id_param;

  -- 2. Compter offres actives (publiées et non expirées)
  SELECT COUNT(*)
  INTO active_jobs_count
  FROM jobs
  WHERE company_id = company_id_param
    AND status = 'published'
    AND (deadline IS NULL OR deadline > CURRENT_DATE);

  -- 3. Compter total candidatures
  SELECT COUNT(*)
  INTO total_applications_count
  FROM applications a
  INNER JOIN jobs j ON a.job_id = j.id
  WHERE j.company_id = company_id_param;

  -- 4. Candidatures cette semaine
  SELECT COUNT(*)
  INTO this_week_applications
  FROM applications a
  INNER JOIN jobs j ON a.job_id = j.id
  WHERE j.company_id = company_id_param
    AND a.applied_at >= NOW() - INTERVAL '7 days';

  -- Construire le résultat JSON
  result := jsonb_build_object(
    'total_jobs', total_jobs_count,
    'active_jobs', active_jobs_count,
    'total_applications', total_applications_count,
    'avg_time_to_hire_days', 0,
    'avg_matching_score', 0,
    'this_week_applications', this_week_applications,
    'scheduled_interviews', 0
  );

  RETURN result;
END;
$$;
