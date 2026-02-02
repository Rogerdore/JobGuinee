/*
  # Correction de tous les compteurs pour utiliser les données réelles

  1. Modifications
    - Modifie `get_candidate_stats` pour compter depuis les vraies tables
    - job_views_count depuis job_clicks
    - applications_count depuis applications
    - profile_views_count depuis profile_views
    - purchases_count depuis profile_purchases
    - formations_count depuis formation_enrollments

  2. Résultat
    - Tous les compteurs affichent les vraies données en temps réel
    - Plus de désynchronisation avec candidate_stats
*/

CREATE OR REPLACE FUNCTION get_candidate_stats(
  p_candidate_id uuid
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_stats record;
  v_credits_balance integer;
  v_is_premium boolean;
  v_real_job_views_count integer;
  v_real_applications_count integer;
  v_real_profile_views_count integer;
  v_real_purchases_count integer;
  v_real_formations_count integer;
BEGIN
  -- Récupérer les stats de base (pour ai_score uniquement)
  SELECT * INTO v_stats
  FROM candidate_stats
  WHERE candidate_id = p_candidate_id;

  IF v_stats IS NULL THEN
    INSERT INTO candidate_stats (candidate_id)
    VALUES (p_candidate_id)
    RETURNING * INTO v_stats;
  END IF;

  -- Récupérer les infos du profil
  SELECT credits_balance, is_premium
  INTO v_credits_balance, v_is_premium
  FROM profiles
  WHERE id = p_candidate_id;

  -- Compter les offres réellement consultées depuis job_clicks (DISTINCT)
  SELECT COUNT(DISTINCT job_id)
  INTO v_real_job_views_count
  FROM job_clicks
  WHERE user_id = p_candidate_id;

  -- Compter les vraies candidatures depuis applications
  SELECT COUNT(*)
  INTO v_real_applications_count
  FROM applications
  WHERE candidate_id = p_candidate_id;

  -- Compter les vraies vues de profil depuis profile_views
  SELECT COUNT(*)
  INTO v_real_profile_views_count
  FROM profile_views
  WHERE candidate_id = p_candidate_id;

  -- Compter les vrais achats de profil depuis profile_purchases
  SELECT COUNT(*)
  INTO v_real_purchases_count
  FROM profile_purchases
  WHERE candidate_id = p_candidate_id;

  -- Compter les vraies formations depuis formation_enrollments
  SELECT COUNT(*)
  INTO v_real_formations_count
  FROM formation_enrollments
  WHERE user_id = p_candidate_id;

  RETURN jsonb_build_object(
    'job_views_count', COALESCE(v_real_job_views_count, 0),
    'applications_count', COALESCE(v_real_applications_count, 0),
    'profile_views_count', COALESCE(v_real_profile_views_count, 0),
    'purchases_count', COALESCE(v_real_purchases_count, 0),
    'formations_count', COALESCE(v_real_formations_count, 0),
    'ai_score', v_stats.ai_score,
    'ai_score_version', v_stats.ai_score_version,
    'ai_score_updated_at', v_stats.ai_score_updated_at,
    'credits_balance', COALESCE(v_credits_balance, 0),
    'is_premium', COALESCE(v_is_premium, false),
    'updated_at', now()
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'job_views_count', 0,
      'applications_count', 0,
      'profile_views_count', 0,
      'purchases_count', 0,
      'formations_count', 0,
      'ai_score', 0,
      'credits_balance', 0,
      'is_premium', false
    );
END;
$$;

-- Commentaire explicatif
COMMENT ON FUNCTION get_candidate_stats IS 'Retourne les statistiques du candidat en comptant depuis les vraies tables (job_clicks, applications, profile_views, profile_purchases, formation_enrollments) pour garantir la cohérence des données en temps réel.';
