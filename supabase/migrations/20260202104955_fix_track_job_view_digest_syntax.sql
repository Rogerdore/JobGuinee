/*
  # Correction de la Fonction track_job_view_secure - Syntaxe digest()
  
  1. Problème
    - Extension pgcrypto activée mais erreur persist : "function digest(text, unknown) does not exist"
    - Le problème est la syntaxe de digest() avec le type du deuxième paramètre
  
  2. Solution
    - Recréer la fonction avec la bonne syntaxe : digest(text, 'sha256'::text)
    - Utiliser md5() comme alternative simple qui ne nécessite pas de cast
  
  3. Impact
    - Le tracking fonctionnera correctement
    - Les fingerprints seront toujours uniques et sécurisés
*/

-- Recréer la fonction avec la syntaxe correcte
CREATE OR REPLACE FUNCTION track_job_view_secure(
  p_job_id uuid,
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
  v_last_view_at timestamptz;
  v_result jsonb;
BEGIN
  -- Récupérer l'ID utilisateur si connecté
  v_user_id := auth.uid();

  -- Créer un fingerprint unique
  IF v_user_id IS NOT NULL THEN
    -- Utilisateur connecté : son ID est son fingerprint
    v_viewer_fingerprint := v_user_id::text;
  ELSE
    -- Utilisateur anonyme : hash simple avec md5 (pas besoin de pgcrypto)
    v_viewer_fingerprint := md5(
      COALESCE(p_session_id, '') || 
      COALESCE(p_ip_hash, '') || 
      COALESCE(p_user_agent, '')
    );
  END IF;

  -- Vérifier l'anti-spam (1 heure)
  SELECT created_at INTO v_last_view_at
  FROM candidate_stats_logs
  WHERE stat_type = 'job_view'
    AND related_id = p_job_id
    AND viewer_fingerprint = v_viewer_fingerprint
    AND created_at > (now() - interval '1 hour')
  ORDER BY created_at DESC
  LIMIT 1;

  -- Si vue récente, bloquer et logger
  IF v_last_view_at IS NOT NULL THEN
    INSERT INTO candidate_stats_logs (
      candidate_id,
      stat_type,
      source,
      related_id,
      viewer_id,
      viewer_fingerprint,
      session_id,
      ip_hash,
      user_agent,
      delta,
      status,
      metadata
    ) VALUES (
      NULL,
      'job_view',
      'job_detail',
      p_job_id,
      v_user_id,
      v_viewer_fingerprint,
      p_session_id,
      p_ip_hash,
      p_user_agent,
      0,
      'blocked_spam',
      jsonb_build_object('last_view_at', v_last_view_at, 'blocked_reason', 'viewed_within_1_hour')
    );

    RETURN jsonb_build_object(
      'success', false,
      'status', 'blocked_spam',
      'message', 'Vous avez déjà consulté cette offre récemment'
    );
  END IF;

  -- Incrémenter le compteur de vues dans la table jobs
  UPDATE jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id;

  -- Logger le succès
  INSERT INTO candidate_stats_logs (
    candidate_id,
    stat_type,
    source,
    related_id,
    viewer_id,
    viewer_fingerprint,
    session_id,
    ip_hash,
    user_agent,
    delta,
    status
  ) VALUES (
    v_user_id,
    'job_view',
    'job_detail',
    p_job_id,
    v_user_id,
    v_viewer_fingerprint,
    p_session_id,
    p_ip_hash,
    p_user_agent,
    1,
    'success'
  );

  -- Si utilisateur connecté, mettre à jour ses stats
  IF v_user_id IS NOT NULL THEN
    INSERT INTO candidate_stats (candidate_id, job_views_count, updated_at)
    VALUES (v_user_id, 1, now())
    ON CONFLICT (candidate_id) DO UPDATE
    SET job_views_count = candidate_stats.job_views_count + 1,
        updated_at = now();
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'success',
    'message', 'Vue enregistrée'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Logger l'erreur
    INSERT INTO candidate_stats_logs (
      stat_type,
      source,
      related_id,
      viewer_id,
      delta,
      status,
      error_message
    ) VALUES (
      'job_view',
      'job_detail',
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
