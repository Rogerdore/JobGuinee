/*
  # Correction de la fonction get_recruiter_recent_jobs
  
  1. Problème
    - La fonction utilise `expires_at` qui n'existe pas
    - La colonne correcte est `deadline`
    
  2. Correction
    - DROP puis recréer la fonction avec `deadline`
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_recruiter_recent_jobs(uuid, int);

-- Recréer avec la bonne colonne
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
  deadline date
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
    j.deadline
  FROM jobs j
  LEFT JOIN applications a ON a.job_id = j.id
  WHERE j.company_id = company_id_param
  GROUP BY j.id, j.title, j.location, j.status, j.views_count, j.created_at, j.deadline
  ORDER BY j.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_recruiter_recent_jobs(uuid, int) TO authenticated;
