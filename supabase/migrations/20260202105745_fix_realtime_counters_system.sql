/*
  # Correction du Système de Comptage en Temps Réel
  
  1. Problèmes détectés
    - Contrainte CHECK sur candidate_stats_logs.stat_type trop restrictive
    - Fonction track_job_share utilise des colonnes inexistantes
  
  2. Corrections
    - Étendre la contrainte CHECK pour inclure les nouveaux types
    - Corriger la fonction track_job_share pour utiliser les bonnes colonnes
    - Simplifier le système pour utiliser metadata au lieu de colonnes spécifiques
*/

-- =====================================================
-- 1. Étendre la contrainte sur stat_type
-- =====================================================

ALTER TABLE candidate_stats_logs
  DROP CONSTRAINT IF EXISTS candidate_stats_logs_stat_type_check;

ALTER TABLE candidate_stats_logs
  ADD CONSTRAINT candidate_stats_logs_stat_type_check
  CHECK (stat_type = ANY (ARRAY[
    'job_view'::text,
    'profile_view'::text,
    'application'::text,
    'purchase'::text,
    'formation'::text,
    'ai_score'::text,
    'job_save'::text,
    'job_unsave'::text,
    'job_comment'::text,
    'job_uncomment'::text,
    'job_share'::text
  ]));

-- =====================================================
-- 2. Corriger la fonction track_job_share
-- =====================================================

CREATE OR REPLACE FUNCTION track_job_share(
  p_job_id uuid,
  p_platform text, -- 'facebook', 'twitter', 'linkedin', 'whatsapp', etc.
  p_share_type text DEFAULT 'button', -- 'button', 'copy_link', 'direct'
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_viewer_fingerprint text;
  v_last_share_at timestamptz;
BEGIN
  -- Récupérer l'ID utilisateur
  v_user_id := auth.uid();
  
  -- Créer un fingerprint unique
  IF v_user_id IS NOT NULL THEN
    v_viewer_fingerprint := v_user_id::text;
  ELSE
    v_viewer_fingerprint := md5(
      COALESCE(p_session_id, '') || 
      COALESCE(p_ip_hash, '') || 
      COALESCE(p_user_agent, '')
    );
  END IF;
  
  -- Vérifier l'anti-spam (1 partage par heure sur la même plateforme)
  SELECT created_at INTO v_last_share_at
  FROM social_share_analytics
  WHERE job_id = p_job_id
    AND platform = p_platform
    AND (
      (user_id IS NOT NULL AND user_id = v_user_id) OR
      (user_id IS NULL AND ip_address = v_viewer_fingerprint)
    )
    AND created_at > (now() - interval '1 hour')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_last_share_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'blocked_spam',
      'message', 'Vous avez déjà partagé cette offre récemment sur ' || p_platform
    );
  END IF;
  
  -- Enregistrer le partage (le trigger met à jour le compteur)
  INSERT INTO social_share_analytics (
    job_id,
    user_id,
    platform,
    share_type,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    p_job_id,
    v_user_id,
    p_platform,
    p_share_type,
    v_viewer_fingerprint,
    p_user_agent,
    jsonb_build_object(
      'session_id', p_session_id,
      'fingerprint', v_viewer_fingerprint
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'status', 'shared',
    'message', 'Partage enregistré',
    'platform', p_platform
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur sans contrainte sur stat_type
    RAISE NOTICE 'Erreur track_job_share: %', SQLERRM;
    
    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;

-- =====================================================
-- 3. Fonction pour vérifier si une offre est sauvegardée
-- =====================================================

CREATE OR REPLACE FUNCTION is_job_saved(p_job_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_is_saved boolean;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  SELECT EXISTS (
    SELECT 1
    FROM saved_jobs
    WHERE user_id = v_user_id AND job_id = p_job_id
  ) INTO v_is_saved;
  
  RETURN COALESCE(v_is_saved, false);
END;
$$;

-- =====================================================
-- 4. Fonction pour obtenir tous les compteurs d'une offre
-- =====================================================

CREATE OR REPLACE FUNCTION get_job_stats(p_job_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_stats jsonb;
BEGIN
  v_user_id := auth.uid();
  
  SELECT jsonb_build_object(
    'views_count', COALESCE(views_count, 0),
    'saves_count', COALESCE(saves_count, 0),
    'comments_count', COALESCE(comments_count, 0),
    'shares_count', COALESCE(shares_count, 0),
    'applications_count', COALESCE(applications_count, 0),
    'is_saved', (
      SELECT EXISTS (
        SELECT 1 FROM saved_jobs 
        WHERE user_id = v_user_id AND job_id = p_job_id
      )
    )
  ) INTO v_stats
  FROM jobs
  WHERE id = p_job_id;
  
  RETURN COALESCE(v_stats, '{}'::jsonb);
END;
$$;
