/*
  # Correction du compteur d'offres consultées

  1. Modifications
    - Modifie la fonction `get_candidate_stats` pour compter les clics réels depuis `job_clicks`
    - Utilise COUNT(DISTINCT job_id) pour éviter les doublons
    - Maintient la compatibilité avec le système existant

  2. Résultat
    - L'indicateur "Offres consultées" affichera le nombre réel de jobs consultés
    - Chaque job est compté une seule fois même si consulté plusieurs fois
*/

-- Recréer la fonction get_candidate_stats avec le vrai comptage
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
BEGIN
  -- Récupérer les stats de base
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

  -- NOUVEAU: Compter les offres réellement consultées depuis job_clicks
  -- On compte chaque job une seule fois (DISTINCT)
  SELECT COUNT(DISTINCT job_id)
  INTO v_real_job_views_count
  FROM job_clicks
  WHERE user_id = p_candidate_id;

  RETURN jsonb_build_object(
    'job_views_count', COALESCE(v_real_job_views_count, 0),
    'applications_count', v_stats.applications_count,
    'profile_views_count', v_stats.profile_views_count,
    'purchases_count', v_stats.purchases_count,
    'formations_count', v_stats.formations_count,
    'ai_score', v_stats.ai_score,
    'ai_score_version', v_stats.ai_score_version,
    'ai_score_updated_at', v_stats.ai_score_updated_at,
    'credits_balance', COALESCE(v_credits_balance, 0),
    'is_premium', COALESCE(v_is_premium, false),
    'updated_at', v_stats.updated_at
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
