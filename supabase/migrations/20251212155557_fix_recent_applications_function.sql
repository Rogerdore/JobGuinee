/*
  # Correction de la fonction get_recruiter_recent_applications
  
  1. Problème
    - La fonction cherche ai_matching_results qui n'existe pas
    
  2. Correction
    - Retirer la référence à ai_matching_results
    - Mettre ai_match_score à 0 par défaut
    - Fonction simplifiée mais fonctionnelle
*/

-- Recréer la fonction sans ai_matching_results
CREATE OR REPLACE FUNCTION get_recruiter_recent_applications(
  company_id_param uuid,
  limit_count int DEFAULT 10
)
RETURNS TABLE (
  application_id uuid,
  candidate_name text,
  candidate_email text,
  job_title text,
  experience_level text,
  ai_match_score numeric,
  is_strong_profile boolean,
  workflow_stage text,
  applied_at timestamptz,
  candidate_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id as application_id,
    p.full_name as candidate_name,
    p.email as candidate_email,
    j.title as job_title,
    CASE
      WHEN cp.experience_years >= 5 THEN 'Senior'
      WHEN cp.experience_years >= 2 THEN 'Intermédiaire'
      ELSE 'Junior'
    END as experience_level,
    0::numeric as ai_match_score,
    false as is_strong_profile,
    a.workflow_stage,
    a.applied_at,
    a.candidate_id
  FROM applications a
  INNER JOIN jobs j ON a.job_id = j.id
  INNER JOIN candidate_profiles cp ON a.candidate_id = cp.id
  INNER JOIN profiles p ON cp.profile_id = p.id
  WHERE j.company_id = company_id_param
  ORDER BY a.applied_at DESC
  LIMIT limit_count;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_recruiter_recent_applications(uuid, int) TO authenticated;
