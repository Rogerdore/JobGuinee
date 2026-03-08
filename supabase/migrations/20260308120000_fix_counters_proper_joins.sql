/*
  # Correction complète de get_candidate_stats - Comptage temps réel

  ## Problèmes corrigés:
  1. job_views: comptait depuis job_clicks (tracking social) au lieu de candidate_stats_logs (tracking consultation)
  2. profile_views: candidate_id = auth.users.id mais profile_views.candidate_id = candidate_profiles.id → toujours 0
  3. profile_purchases: même problème de FK + pas de filtre sur payment_verified_by_admin
  4. Ajout des stats mensuelles (this_month_views, this_month_purchases)

  ## Règles métier:
  - Offres consultées: DISTINCT offres vues par le candidat (depuis candidate_stats_logs)
  - Candidatures: nombre total de candidatures soumises
  - Vues profil: vues du profil candidat dans la CVthèque (via candidate_profiles JOIN)
  - Profil acheté: achats vérifiés par admin uniquement
  - Formations: inscriptions actives (enrolled, in_progress, completed)
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
  v_candidate_profile_id uuid;
  v_real_job_views_count integer;
  v_real_applications_count integer;
  v_real_profile_views_count integer;
  v_real_purchases_count integer;
  v_real_formations_count integer;
  v_this_month_views integer;
  v_this_month_purchases integer;
BEGIN
  -- Vérifier que l'utilisateur existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_candidate_id) THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Récupérer le candidate_profiles.id pour les JOINs
  SELECT id INTO v_candidate_profile_id
  FROM candidate_profiles
  WHERE user_id = p_candidate_id;

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

  -- 1. OFFRES CONSULTÉES: Compter les offres distinctes vues par le candidat
  --    Source: candidate_stats_logs (rempli par track_job_view_secure)
  SELECT COUNT(DISTINCT related_id)
  INTO v_real_job_views_count
  FROM candidate_stats_logs
  WHERE candidate_id = p_candidate_id
    AND stat_type = 'job_view'
    AND status = 'success';

  -- 2. CANDIDATURES: Compter les candidatures soumises
  SELECT COUNT(*)
  INTO v_real_applications_count
  FROM applications
  WHERE candidate_id = p_candidate_id;

  -- 3. VUES PROFIL: Compter via candidate_profiles.id (FK correcte)
  IF v_candidate_profile_id IS NOT NULL THEN
    SELECT COUNT(*)
    INTO v_real_profile_views_count
    FROM profile_views
    WHERE candidate_id = v_candidate_profile_id;

    -- 4. PROFIL ACHETÉ: Uniquement achats vérifiés par admin
    SELECT COUNT(*)
    INTO v_real_purchases_count
    FROM profile_purchases
    WHERE candidate_id = v_candidate_profile_id
      AND payment_status = 'completed'
      AND payment_verified_by_admin = true;

    -- Stats mensuelles: vues ce mois
    SELECT COUNT(*)
    INTO v_this_month_views
    FROM profile_views
    WHERE candidate_id = v_candidate_profile_id
      AND viewed_at >= date_trunc('month', now());

    -- Stats mensuelles: achats ce mois
    SELECT COUNT(*)
    INTO v_this_month_purchases
    FROM profile_purchases
    WHERE candidate_id = v_candidate_profile_id
      AND payment_status = 'completed'
      AND payment_verified_by_admin = true
      AND purchased_at >= date_trunc('month', now());
  ELSE
    v_real_profile_views_count := 0;
    v_real_purchases_count := 0;
    v_this_month_views := 0;
    v_this_month_purchases := 0;
  END IF;

  -- 5. FORMATIONS: Inscriptions actives
  SELECT COUNT(*)
  INTO v_real_formations_count
  FROM formation_enrollments
  WHERE user_id = p_candidate_id
    AND status IN ('enrolled', 'in_progress', 'completed');

  RETURN jsonb_build_object(
    'job_views_count', COALESCE(v_real_job_views_count, 0),
    'applications_count', COALESCE(v_real_applications_count, 0),
    'profile_views_count', COALESCE(v_real_profile_views_count, 0),
    'purchases_count', COALESCE(v_real_purchases_count, 0),
    'formations_count', COALESCE(v_real_formations_count, 0),
    'ai_score', COALESCE(v_stats.ai_score, 0),
    'ai_score_version', COALESCE(v_stats.ai_score_version, 'v1.0'),
    'ai_score_updated_at', v_stats.ai_score_updated_at,
    'credits_balance', COALESCE(v_credits_balance, 0),
    'is_premium', COALESCE(v_is_premium, false),
    'this_month_views', COALESCE(v_this_month_views, 0),
    'this_month_purchases', COALESCE(v_this_month_purchases, 0),
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
      'is_premium', false,
      'this_month_views', 0,
      'this_month_purchases', 0
    );
END;
$$;

COMMENT ON FUNCTION get_candidate_stats IS 'Retourne les statistiques du candidat en temps réel. Offres consultées depuis candidate_stats_logs, vues profil et achats via candidate_profiles JOIN, formations depuis formation_enrollments.';
