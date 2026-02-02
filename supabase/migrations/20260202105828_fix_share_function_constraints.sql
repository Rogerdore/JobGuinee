/*
  # Correction Finale de la Fonction track_job_share
  
  1. Problème
    - Les valeurs par défaut ne correspondent pas aux contraintes CHECK
    - share_type doit être : 'manual', 'auto', ou 'scheduled'
    - Les colonnes action et status doivent être remplies si présentes
  
  2. Solution
    - Adapter la fonction pour utiliser les bonnes valeurs
    - Simplifier en utilisant share_type = 'manual' par défaut
*/

CREATE OR REPLACE FUNCTION track_job_share(
  p_job_id uuid,
  p_platform text, -- 'facebook', 'twitter', 'linkedin', 'whatsapp'
  p_share_type text DEFAULT 'manual', -- 'manual', 'auto', 'scheduled'
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
    action,
    status,
    metadata
  ) VALUES (
    p_job_id,
    v_user_id,
    p_platform,
    p_share_type,
    v_viewer_fingerprint,
    p_user_agent,
    'triggered',
    'success',
    jsonb_build_object(
      'session_id', p_session_id,
      'fingerprint', v_viewer_fingerprint,
      'tracked_via', 'rpc'
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
    RAISE NOTICE 'Erreur track_job_share: %', SQLERRM;
    
    RETURN jsonb_build_object(
      'success', false,
      'status', 'error',
      'message', SQLERRM
    );
END;
$$;
