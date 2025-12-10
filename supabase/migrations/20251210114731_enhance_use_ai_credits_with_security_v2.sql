/*
  # Amélioration de use_ai_credits avec sécurité
  
  Intègre les vérifications de sécurité dans la fonction use_ai_credits:
  - Rate limiting
  - Vérification utilisateur suspendu
  - Logs de sécurité
  - Protection contre abus
*/

-- Drop existing function
DROP FUNCTION IF EXISTS use_ai_credits(uuid, text, jsonb, jsonb);

-- Recreate with security checks
CREATE OR REPLACE FUNCTION use_ai_credits(
  p_user_id uuid,
  p_service_key text,
  p_input_payload jsonb DEFAULT NULL,
  p_output_response jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_config record;
  v_user_balance integer;
  v_credits_cost integer;
  v_new_balance integer;
  v_usage_id uuid;
  v_rate_limit_check jsonb;
BEGIN
  -- 1. CHECK RATE LIMIT (PREMIER CHECK - AVANT TOUT)
  v_rate_limit_check := check_ai_rate_limit(p_user_id, p_service_key);
  
  IF NOT (v_rate_limit_check->>'allowed')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', v_rate_limit_check->>'reason',
      'message', v_rate_limit_check->>'message',
      'limit', v_rate_limit_check->>'limit',
      'current', v_rate_limit_check->>'current'
    );
  END IF;

  -- 2. CHECK USER EXISTS
  IF p_user_id IS NULL THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_key,
      'blocked',
      'User not authenticated',
      NULL, NULL, NULL,
      p_input_payload
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNAUTHORIZED',
      'message', 'Vous devez être connecté pour utiliser ce service'
    );
  END IF;

  -- 3. GET SERVICE CONFIG
  SELECT * INTO v_service_config
  FROM service_credit_costs
  WHERE service_code = p_service_key
    AND is_active = true;

  IF NOT FOUND THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_key,
      'blocked',
      'Service not found or inactive',
      NULL, NULL, NULL,
      p_input_payload
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', 'Service non trouvé ou actuellement indisponible'
    );
  END IF;

  v_credits_cost := v_service_config.credits_cost;

  -- 4. CHECK USER BALANCE
  SELECT COALESCE(credits_balance, 0) INTO v_user_balance
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_key,
      'blocked',
      'User profile not found',
      NULL, NULL, NULL,
      p_input_payload
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Profil utilisateur introuvable'
    );
  END IF;

  IF v_user_balance < v_credits_cost THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_key,
      'blocked',
      'Insufficient credits',
      NULL, NULL, NULL,
      p_input_payload
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', format('Crédits insuffisants. Requis: %s, Disponible: %s', v_credits_cost, v_user_balance),
      'required_credits', v_credits_cost,
      'available_credits', v_user_balance
    );
  END IF;

  -- 5. CONSUME CREDITS
  UPDATE profiles
  SET credits_balance = credits_balance - v_credits_cost
  WHERE id = p_user_id
  RETURNING credits_balance INTO v_new_balance;

  -- 6. LOG TRANSACTION
  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_type,
    reference_id,
    description,
    balance_after
  ) VALUES (
    p_user_id,
    -v_credits_cost,
    'usage',
    'ai_service',
    p_service_key,
    format('Utilisation service IA: %s', v_service_config.service_name),
    v_new_balance
  );

  -- 7. LOG USAGE
  INSERT INTO ai_service_usage_history (
    user_id,
    service_code,
    service_name,
    credits_consumed,
    input_payload,
    output_response,
    status
  ) VALUES (
    p_user_id,
    p_service_key,
    v_service_config.service_name,
    v_credits_cost,
    p_input_payload,
    p_output_response,
    'success'
  )
  RETURNING id INTO v_usage_id;

  -- 8. LOG SECURITY EVENT (SUCCESS)
  PERFORM log_ai_security_event(
    p_user_id,
    p_service_key,
    'allowed',
    'Service used successfully',
    (v_rate_limit_check->>'calls_minute')::integer,
    (v_rate_limit_check->>'calls_hour')::integer,
    (v_rate_limit_check->>'calls_day')::integer,
    p_input_payload
  );

  -- 9. RETURN SUCCESS
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Service utilisé avec succès. %s crédits consommés.', v_credits_cost),
    'credits_consumed', v_credits_cost,
    'credits_remaining', v_new_balance,
    'usage_id', v_usage_id,
    'service_name', v_service_config.service_name,
    'rate_limit_info', jsonb_build_object(
      'calls_minute', v_rate_limit_check->>'calls_minute',
      'calls_hour', v_rate_limit_check->>'calls_hour',
      'calls_day', v_rate_limit_check->>'calls_day',
      'limit_minute', v_rate_limit_check->>'limit_minute',
      'limit_hour', v_rate_limit_check->>'limit_hour',
      'limit_day', v_rate_limit_check->>'limit_day'
    )
  );

EXCEPTION
  WHEN OTHERS THEN
    PERFORM log_ai_security_event(
      p_user_id,
      p_service_key,
      'blocked',
      format('Error: %s', SQLERRM),
      NULL, NULL, NULL,
      p_input_payload
    );
    
    RETURN jsonb_build_object(
      'success', false,
      'error', 'EXCEPTION',
      'message', 'Une erreur inattendue est survenue'
    );
END;
$$;