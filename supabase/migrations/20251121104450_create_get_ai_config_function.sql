/*
  # Create get_ai_config Function
  
  1. Overview
    - Fonction pour récupérer la configuration IA centralisée
    - Utilisée par tous les services premium IA
    - Masque la clé API pour les non-admins
  
  2. Fonction
    - get_ai_config() - Retourne la configuration IA
      - Pour les admins : retourne toute la config incluant api_key
      - Pour les autres : retourne la config sans api_key
      - Retourne NULL si aucune config n'existe
  
  3. Sécurité
    - SECURITY DEFINER pour permettre l'accès contrôlé
    - api_key visible uniquement pour les admins
*/

-- Fonction pour récupérer la configuration IA
CREATE OR REPLACE FUNCTION get_ai_config()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config record;
  v_is_admin boolean;
  v_user_id uuid;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  
  -- Check if user is admin
  v_is_admin := false;
  IF v_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = v_user_id
      AND user_type = 'admin'
    ) INTO v_is_admin;
  END IF;
  
  -- Get config
  SELECT * INTO v_config
  FROM chatbot_config
  LIMIT 1;
  
  IF v_config IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'no_config',
      'message', 'Configuration IA non trouvée'
    );
  END IF;
  
  -- Return config with or without api_key based on user role
  IF v_is_admin THEN
    RETURN jsonb_build_object(
      'success', true,
      'config', jsonb_build_object(
        'id', v_config.id,
        'enabled', v_config.enabled,
        'name', v_config.name,
        'ai_model', v_config.ai_model,
        'api_provider', v_config.api_provider,
        'api_endpoint', v_config.api_endpoint,
        'api_key', v_config.api_key,
        'temperature', v_config.temperature,
        'max_tokens', v_config.max_tokens,
        'system_prompt', v_config.system_prompt
      )
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'config', jsonb_build_object(
        'id', v_config.id,
        'enabled', v_config.enabled,
        'name', v_config.name,
        'ai_model', v_config.ai_model,
        'api_provider', v_config.api_provider,
        'temperature', v_config.temperature,
        'max_tokens', v_config.max_tokens
      )
    );
  END IF;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_ai_config TO authenticated;
GRANT EXECUTE ON FUNCTION get_ai_config TO anon;
