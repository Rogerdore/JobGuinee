/*
  # Système de Rollback des Configurations IA

  1. Nouvelles Fonctions
    - `rollback_ia_service_config` : Restaure une version précédente d'une configuration
    - `get_config_version_diff` : Compare deux versions d'une configuration

  2. Sécurité
    - SECURITY DEFINER pour permettre les rollbacks
    - Vérification que l'utilisateur est admin
    - Logs de tous les rollbacks

  3. Améliorations
    - Rollback en un clic
    - Comparaison de versions
    - Traçabilité complète
*/

-- Fonction pour rollback d'une configuration IA
CREATE OR REPLACE FUNCTION rollback_ia_service_config(
  p_service_code text,
  p_target_version integer,
  p_rollback_reason text DEFAULT 'Rollback vers version précédente'
)
RETURNS json AS $$
DECLARE
  v_history record;
  v_current_config record;
  v_new_version integer;
  v_user_id uuid;
BEGIN
  -- Vérifier que l'utilisateur est connecté
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Non authentifié'
    );
  END IF;

  -- Vérifier que l'utilisateur est admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id AND user_type = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Accès non autorisé - Admin requis'
    );
  END IF;

  -- Récupérer l'historique de la version cible
  SELECT * INTO v_history
  FROM ia_service_config_history
  WHERE service_code = p_service_code
    AND new_version = p_target_version;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Version non trouvée'
    );
  END IF;

  -- Récupérer config actuelle
  SELECT * INTO v_current_config
  FROM ia_service_config
  WHERE service_code = p_service_code;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Configuration non trouvée'
    );
  END IF;

  -- Mettre à jour avec l'ancienne config
  UPDATE ia_service_config
  SET
    base_prompt = COALESCE((v_history.new_config->>'base_prompt'), base_prompt),
    instructions = v_history.new_config->'instructions',
    system_message = COALESCE((v_history.new_config->>'system_message'), system_message),
    model = COALESCE((v_history.new_config->>'model'), model),
    temperature = COALESCE((v_history.new_config->>'temperature')::numeric, temperature),
    max_tokens = COALESCE((v_history.new_config->>'max_tokens')::integer, max_tokens),
    version = v_current_config.version + 1,
    updated_at = now(),
    updated_by = v_user_id
  WHERE service_code = p_service_code
  RETURNING version INTO v_new_version;

  -- Créer entrée historique pour le rollback
  INSERT INTO ia_service_config_history (
    service_id,
    service_code,
    previous_version,
    new_version,
    changes_summary,
    field_changes,
    previous_config,
    new_config,
    changed_by,
    change_reason
  ) VALUES (
    v_current_config.id,
    p_service_code,
    v_current_config.version,
    v_new_version,
    'Rollback vers version ' || p_target_version,
    jsonb_build_object(
      'rollback_to', p_target_version,
      'rollback_from', v_current_config.version
    ),
    row_to_json(v_current_config)::jsonb,
    v_history.new_config,
    v_user_id,
    p_rollback_reason
  );

  -- Log de sécurité
  INSERT INTO admin_security_logs (
    admin_id,
    action_type,
    entity_type,
    entity_id,
    action_details,
    ip_address
  ) VALUES (
    v_user_id,
    'config_rollback',
    'ia_service_config',
    v_current_config.id::text,
    jsonb_build_object(
      'service_code', p_service_code,
      'from_version', v_current_config.version,
      'to_version', p_target_version,
      'reason', p_rollback_reason
    ),
    inet_client_addr()
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Rollback effectué avec succès',
    'new_version', v_new_version,
    'previous_version', v_current_config.version,
    'target_version', p_target_version
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Erreur lors du rollback: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour comparer deux versions
CREATE OR REPLACE FUNCTION get_config_version_diff(
  p_service_code text,
  p_version_1 integer,
  p_version_2 integer
)
RETURNS json AS $$
DECLARE
  v_config_1 jsonb;
  v_config_2 jsonb;
  v_diff jsonb;
BEGIN
  -- Récupérer première version
  SELECT new_config INTO v_config_1
  FROM ia_service_config_history
  WHERE service_code = p_service_code
    AND new_version = p_version_1;

  -- Récupérer deuxième version
  SELECT new_config INTO v_config_2
  FROM ia_service_config_history
  WHERE service_code = p_service_code
    AND new_version = p_version_2;

  IF v_config_1 IS NULL OR v_config_2 IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Une ou plusieurs versions non trouvées'
    );
  END IF;

  -- Construire le diff
  v_diff := jsonb_build_object(
    'base_prompt_changed', (v_config_1->>'base_prompt') != (v_config_2->>'base_prompt'),
    'instructions_changed', (v_config_1->'instructions') != (v_config_2->'instructions'),
    'model_changed', (v_config_1->>'model') != (v_config_2->>'model'),
    'temperature_changed', (v_config_1->>'temperature') != (v_config_2->>'temperature'),
    'max_tokens_changed', (v_config_1->>'max_tokens') != (v_config_2->>'max_tokens'),
    'version_1', v_config_1,
    'version_2', v_config_2
  );

  RETURN json_build_object(
    'success', true,
    'diff', v_diff
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index pour améliorer les performances des rollbacks
CREATE INDEX IF NOT EXISTS idx_ia_config_history_service_version
ON ia_service_config_history(service_code, new_version);

-- Commentaires
COMMENT ON FUNCTION rollback_ia_service_config IS
'Restaure une configuration IA à une version antérieure. Nécessite les droits admin.';

COMMENT ON FUNCTION get_config_version_diff IS
'Compare deux versions d''une configuration et retourne les différences.';
