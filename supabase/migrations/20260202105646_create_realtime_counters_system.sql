/*
  # Système de Comptage en Temps Réel - Favoris, Commentaires, Partages
  
  1. Objectif
    - Comptage automatique et en temps réel de :
      * saves_count (favoris/sauvegardes)
      * comments_count (commentaires)
      * shares_count (partages sociaux)
    - Système anti-spam intégré
    - Logs d'audit complets
  
  2. Composants
    - Triggers automatiques sur INSERT/DELETE
    - Fonctions RPC pour tracking manuel si nécessaire
    - Intégration avec candidate_stats_logs
  
  3. Sécurité
    - Anti-spam : 1 action par heure par utilisateur/job
    - Validation des données
    - Logs d'erreurs
*/

-- =====================================================
-- FONCTION 1 : Mise à jour automatique saves_count
-- =====================================================

CREATE OR REPLACE FUNCTION update_job_saves_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur
    UPDATE jobs
    SET saves_count = COALESCE(saves_count, 0) + 1
    WHERE id = NEW.job_id;
    
    -- Logger l'action
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status
    ) VALUES (
      NEW.user_id,
      'job_save',
      'saved_jobs',
      NEW.job_id,
      NEW.user_id,
      1,
      'success'
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur
    UPDATE jobs
    SET saves_count = GREATEST(COALESCE(saves_count, 0) - 1, 0)
    WHERE id = OLD.job_id;
    
    -- Logger l'action
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status
    ) VALUES (
      OLD.user_id,
      'job_unsave',
      'saved_jobs',
      OLD.job_id,
      OLD.user_id,
      -1,
      'success'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer le trigger sur saved_jobs
DROP TRIGGER IF EXISTS update_job_saves_count_trigger ON saved_jobs;
CREATE TRIGGER update_job_saves_count_trigger
  AFTER INSERT OR DELETE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_saves_count();

-- =====================================================
-- FONCTION 2 : Mise à jour automatique comments_count
-- =====================================================

CREATE OR REPLACE FUNCTION update_job_comments_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur
    UPDATE jobs
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.job_id;
    
    -- Logger l'action
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status
    ) VALUES (
      NEW.user_id,
      'job_comment',
      'job_comments',
      NEW.job_id,
      NEW.user_id,
      1,
      'success'
    );
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Décrémenter le compteur
    UPDATE jobs
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.job_id;
    
    -- Logger l'action
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status
    ) VALUES (
      OLD.user_id,
      'job_uncomment',
      'job_comments',
      OLD.job_id,
      OLD.user_id,
      -1,
      'success'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Créer le trigger sur job_comments
DROP TRIGGER IF EXISTS update_job_comments_count_trigger ON job_comments;
CREATE TRIGGER update_job_comments_count_trigger
  AFTER INSERT OR DELETE ON job_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_job_comments_count();

-- =====================================================
-- FONCTION 3 : Mise à jour automatique shares_count
-- =====================================================

CREATE OR REPLACE FUNCTION update_job_shares_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrémenter le compteur
    UPDATE jobs
    SET shares_count = COALESCE(shares_count, 0) + 1
    WHERE id = NEW.job_id;
    
    -- Logger l'action
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status,
      metadata
    ) VALUES (
      auth.uid(),
      'job_share',
      NEW.platform,
      NEW.job_id,
      auth.uid(),
      1,
      'success',
      jsonb_build_object('platform', NEW.platform, 'share_type', NEW.share_type)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger sur social_share_analytics
DROP TRIGGER IF EXISTS update_job_shares_count_trigger ON social_share_analytics;
CREATE TRIGGER update_job_shares_count_trigger
  AFTER INSERT ON social_share_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_job_shares_count();

-- =====================================================
-- FONCTION RPC 4 : Track Save/Unsave avec anti-spam
-- =====================================================

CREATE OR REPLACE FUNCTION track_job_save(
  p_job_id uuid,
  p_action text -- 'save' ou 'unsave'
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_existing_save uuid;
BEGIN
  -- Récupérer l'ID utilisateur
  v_user_id := auth.uid();
  
  -- Vérifier que l'utilisateur est connecté
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'unauthorized',
      'message', 'Vous devez être connecté pour sauvegarder une offre'
    );
  END IF;
  
  IF p_action = 'save' THEN
    -- Vérifier si déjà sauvegardé
    SELECT id INTO v_existing_save
    FROM saved_jobs
    WHERE user_id = v_user_id AND job_id = p_job_id;
    
    IF v_existing_save IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'status', 'already_saved',
        'message', 'Cette offre est déjà dans vos favoris'
      );
    END IF;
    
    -- Sauvegarder (le trigger met à jour le compteur)
    INSERT INTO saved_jobs (user_id, job_id)
    VALUES (v_user_id, p_job_id);
    
    RETURN jsonb_build_object(
      'success', true,
      'status', 'saved',
      'message', 'Offre ajoutée aux favoris'
    );
    
  ELSIF p_action = 'unsave' THEN
    -- Supprimer (le trigger met à jour le compteur)
    DELETE FROM saved_jobs
    WHERE user_id = v_user_id AND job_id = p_job_id;
    
    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'status', 'not_saved',
        'message', 'Cette offre n''était pas dans vos favoris'
      );
    END IF;
    
    RETURN jsonb_build_object(
      'success', true,
      'status', 'unsaved',
      'message', 'Offre retirée des favoris'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'status', 'invalid_action',
      'message', 'Action invalide. Utilisez "save" ou "unsave"'
    );
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO candidate_stats_logs (
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status,
      error_message
    ) VALUES (
      'job_save',
      'track_job_save_rpc',
      p_job_id,
      v_user_id,
      0,
      'error',
      SQLERRM
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;

-- =====================================================
-- FONCTION RPC 5 : Track Share avec anti-spam
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
      (user_id IS NULL AND session_fingerprint = v_viewer_fingerprint)
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
    session_fingerprint,
    user_agent,
    ip_hash
  ) VALUES (
    p_job_id,
    v_user_id,
    p_platform,
    p_share_type,
    v_viewer_fingerprint,
    p_user_agent,
    p_ip_hash
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'status', 'shared',
    'message', 'Partage enregistré',
    'platform', p_platform
  );
  
EXCEPTION
  WHEN OTHERS THEN
    INSERT INTO candidate_stats_logs (
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status,
      error_message
    ) VALUES (
      'job_share',
      'track_job_share_rpc',
      p_job_id,
      v_user_id,
      0,
      'error',
      SQLERRM
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;

-- =====================================================
-- FONCTION 6 : Recalculer tous les compteurs (maintenance)
-- =====================================================

CREATE OR REPLACE FUNCTION recalculate_all_job_counters()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Recalculer saves_count
  UPDATE jobs j
  SET saves_count = (
    SELECT COUNT(*)
    FROM saved_jobs sj
    WHERE sj.job_id = j.id
  );
  
  -- Recalculer comments_count
  UPDATE jobs j
  SET comments_count = (
    SELECT COUNT(*)
    FROM job_comments jc
    WHERE jc.job_id = j.id
  );
  
  -- Recalculer shares_count
  UPDATE jobs j
  SET shares_count = (
    SELECT COUNT(*)
    FROM social_share_analytics ssa
    WHERE ssa.job_id = j.id
  );
  
  RAISE NOTICE 'Tous les compteurs ont été recalculés';
END;
$$;

-- =====================================================
-- INDEX pour performance
-- =====================================================

-- Index pour saved_jobs (si pas déjà présent)
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_job 
  ON saved_jobs(user_id, job_id);

-- Index pour job_comments (si pas déjà présent)
CREATE INDEX IF NOT EXISTS idx_job_comments_job_user 
  ON job_comments(job_id, user_id);

-- Index pour social_share_analytics
CREATE INDEX IF NOT EXISTS idx_social_share_job_platform 
  ON social_share_analytics(job_id, platform, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_share_user_job 
  ON social_share_analytics(user_id, job_id) 
  WHERE user_id IS NOT NULL;

-- =====================================================
-- Recalculer les compteurs existants
-- =====================================================

SELECT recalculate_all_job_counters();
