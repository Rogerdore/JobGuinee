/*
  # Fix get_candidate_stats function - Add user existence check

  Fixes the issue where the function tries to create candidate_stats
  for non-existent users, causing a foreign key constraint violation.
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_candidate_stats(uuid);

-- Recreate with user existence check
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
  v_user_exists boolean;
BEGIN
  -- Vérifier si l'utilisateur existe dans auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE id = p_candidate_id
  ) INTO v_user_exists;

  -- Si l'utilisateur n'existe pas, retourner des valeurs par défaut
  IF NOT v_user_exists THEN
    RETURN jsonb_build_object(
      'job_views_count', 0,
      'applications_count', 0,
      'profile_views_count', 0,
      'purchases_count', 0,
      'formations_count', 0,
      'ai_score', 0,
      'ai_score_version', 'v1.0',
      'ai_score_updated_at', null,
      'credits_balance', 0,
      'is_premium', false,
      'updated_at', now()
    );
  END IF;

  -- Récupérer les stats existantes
  SELECT * INTO v_stats
  FROM candidate_stats
  WHERE candidate_id = p_candidate_id;

  -- Créer l'enregistrement seulement si l'utilisateur existe
  IF v_stats IS NULL THEN
    INSERT INTO candidate_stats (candidate_id)
    VALUES (p_candidate_id)
    RETURNING * INTO v_stats;
  END IF;

  -- Récupérer balance crédits et statut premium
  SELECT credits_balance, is_premium
  INTO v_credits_balance, v_is_premium
  FROM profiles
  WHERE id = p_candidate_id;

  RETURN jsonb_build_object(
    'job_views_count', v_stats.job_views_count,
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
    -- En cas d'erreur, retourner des valeurs par défaut plutôt qu'une erreur
    RETURN jsonb_build_object(
      'job_views_count', 0,
      'applications_count', 0,
      'profile_views_count', 0,
      'purchases_count', 0,
      'formations_count', 0,
      'ai_score', 0,
      'ai_score_version', 'v1.0',
      'ai_score_updated_at', null,
      'credits_balance', 0,
      'is_premium', false,
      'updated_at', now(),
      'error', SQLERRM
    );
END;
$$;