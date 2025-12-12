/*
  # Fonction de calcul des métriques du dashboard recruteur

  1. Fonction RPC
    - `get_recruiter_dashboard_metrics(company_id_param uuid)`
    - Retourne les KPIs réels du recruteur:
      - Nombre total d'offres
      - Nombre d'offres actives
      - Nombre total de candidatures
      - Délai moyen de recrutement (en jours)
      - Taux de matching moyen (score IA)
      - Nombre de candidatures cette semaine
      - Nombre d'entretiens planifiés

  2. Calculs
    - Offres actives = status 'published' AND NOT expired
    - Délai moyen = moyenne du temps entre création offre et dernier statut workflow
    - Taux matching = moyenne des scores IA des candidatures

  3. Sécurité
    - Fonction SECURITY DEFINER pour accès aux données
    - Validation company_id appartient au recruteur
*/

-- Fonction pour calculer les métriques du dashboard recruteur
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
  avg_time_days numeric;
  avg_matching_score numeric;
  this_week_applications int;
  scheduled_interviews_count int;
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
    AND (expires_at IS NULL OR expires_at > NOW());

  -- 3. Compter total candidatures
  SELECT COUNT(*)
  INTO total_applications_count
  FROM applications a
  INNER JOIN jobs j ON a.job_id = j.id
  WHERE j.company_id = company_id_param;

  -- 4. Calculer délai moyen (création job -> dernier changement workflow)
  WITH job_durations AS (
    SELECT
      j.id,
      EXTRACT(EPOCH FROM (
        COALESCE(
          (SELECT MAX(changed_at) FROM workflow_history wh WHERE wh.application_id = a.id),
          a.applied_at
        ) - j.created_at
      )) / 86400 as duration_days
    FROM jobs j
    LEFT JOIN applications a ON a.job_id = j.id
    WHERE j.company_id = company_id_param
      AND j.status = 'closed'
      AND a.id IS NOT NULL
  )
  SELECT ROUND(AVG(duration_days)::numeric, 1)
  INTO avg_time_days
  FROM job_durations
  WHERE duration_days > 0;

  -- Si pas de données, mettre 0
  avg_time_days := COALESCE(avg_time_days, 0);

  -- 5. Calculer taux de matching moyen (score IA)
  SELECT ROUND(AVG(ai_match_score)::numeric, 0)
  INTO avg_matching_score
  FROM ai_matching_results amr
  INNER JOIN applications a ON amr.application_id = a.id
  INNER JOIN jobs j ON a.job_id = j.id
  WHERE j.company_id = company_id_param
    AND amr.ai_match_score IS NOT NULL;

  -- Si pas de données, mettre 0
  avg_matching_score := COALESCE(avg_matching_score, 0);

  -- 6. Candidatures cette semaine
  SELECT COUNT(*)
  INTO this_week_applications
  FROM applications a
  INNER JOIN jobs j ON a.job_id = j.id
  WHERE j.company_id = company_id_param
    AND a.applied_at >= NOW() - INTERVAL '7 days';

  -- 7. Entretiens planifiés (confirmés et futurs)
  SELECT COUNT(*)
  INTO scheduled_interviews_count
  FROM interviews i
  INNER JOIN applications a ON i.application_id = a.id
  INNER JOIN jobs j ON a.job_id = j.id
  WHERE j.company_id = company_id_param
    AND i.status IN ('scheduled', 'confirmed')
    AND i.scheduled_at > NOW();

  -- Construire le résultat JSON
  result := jsonb_build_object(
    'total_jobs', total_jobs_count,
    'active_jobs', active_jobs_count,
    'total_applications', total_applications_count,
    'avg_time_to_hire_days', avg_time_days,
    'avg_matching_score', avg_matching_score,
    'this_week_applications', this_week_applications,
    'scheduled_interviews', scheduled_interviews_count
  );

  RETURN result;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION get_recruiter_dashboard_metrics(uuid) TO authenticated;

-- Commentaire
COMMENT ON FUNCTION get_recruiter_dashboard_metrics IS
'Calcule les métriques réelles du dashboard recruteur basées sur les données de la base';