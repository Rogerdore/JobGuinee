/*
  # Fonctions pour récupérer les données récentes du dashboard recruteur

  1. Nouvelles Fonctions
    - `get_recruiter_recent_jobs` - Projets récents avec statistiques
    - `get_recruiter_recent_applications` - Candidatures récentes avec scores IA

  2. Données Retournées
    - Projets: titre, localisation, statut, vues, candidatures
    - Candidatures: candidat, poste, niveau, score IA, badge profil fort

  3. Sécurité
    - SECURITY DEFINER pour accès aux données
    - Filtrage par company_id du recruteur
*/

-- Fonction pour récupérer les projets récents
CREATE OR REPLACE FUNCTION get_recruiter_recent_jobs(
  company_id_param uuid,
  limit_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  title text,
  location text,
  status text,
  views_count int,
  applications_count bigint,
  created_at timestamptz,
  expires_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.id,
    j.title,
    j.location,
    j.status,
    COALESCE(j.views_count, 0) as views_count,
    COUNT(DISTINCT a.id) as applications_count,
    j.created_at,
    j.expires_at
  FROM jobs j
  LEFT JOIN applications a ON a.job_id = j.id
  WHERE j.company_id = company_id_param
  GROUP BY j.id, j.title, j.location, j.status, j.views_count, j.created_at, j.expires_at
  ORDER BY j.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Fonction pour récupérer les candidatures récentes avec scores IA
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
    COALESCE(amr.ai_match_score, 0) as ai_match_score,
    (COALESCE(amr.ai_match_score, 0) >= 80) as is_strong_profile,
    a.workflow_stage,
    a.applied_at,
    a.candidate_id
  FROM applications a
  INNER JOIN jobs j ON a.job_id = j.id
  INNER JOIN candidate_profiles cp ON a.candidate_id = cp.id
  INNER JOIN profiles p ON cp.profile_id = p.id
  LEFT JOIN ai_matching_results amr ON amr.application_id = a.id
  WHERE j.company_id = company_id_param
  ORDER BY a.applied_at DESC
  LIMIT limit_count;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_recruiter_recent_jobs(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION get_recruiter_recent_applications(uuid, int) TO authenticated;

-- Commentaires
COMMENT ON FUNCTION get_recruiter_recent_jobs IS
'Retourne les projets récents du recruteur avec statistiques de vues et candidatures';

COMMENT ON FUNCTION get_recruiter_recent_applications IS
'Retourne les candidatures récentes avec scores IA et identification des profils forts';