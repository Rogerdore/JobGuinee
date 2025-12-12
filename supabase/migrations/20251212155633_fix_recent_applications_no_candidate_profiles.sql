/*
  # Correction de get_recruiter_recent_applications - Version sans candidate_profiles
  
  1. Problème
    - Les candidatures n'ont pas de candidate_profiles associés
    - La jointure INNER échoue
    
  2. Correction
    - Utiliser directement profiles
    - LEFT JOIN avec candidate_profiles pour experience_years
    - Fonction fonctionnelle même sans profils candidats complets
*/

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
    COALESCE(p.full_name, 'Candidat') as candidate_name,
    COALESCE(p.email, 'N/A') as candidate_email,
    j.title as job_title,
    CASE
      WHEN cp.experience_years >= 5 THEN 'Senior'
      WHEN cp.experience_years >= 2 THEN 'Intermédiaire'
      WHEN cp.experience_years IS NOT NULL THEN 'Junior'
      ELSE 'Non spécifié'
    END as experience_level,
    0::numeric as ai_match_score,
    false as is_strong_profile,
    COALESCE(a.workflow_stage, 'applied') as workflow_stage,
    a.applied_at,
    a.candidate_id
  FROM applications a
  INNER JOIN jobs j ON a.job_id = j.id
  LEFT JOIN profiles p ON a.candidate_id = p.id
  LEFT JOIN candidate_profiles cp ON a.candidate_id = cp.id
  WHERE j.company_id = company_id_param
  ORDER BY a.applied_at DESC
  LIMIT limit_count;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_recruiter_recent_applications(uuid, int) TO authenticated;
