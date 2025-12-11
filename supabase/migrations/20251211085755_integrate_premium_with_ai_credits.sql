/*
  # Intégration Premium avec le système de crédits IA

  1. Modifications
    - Modifier la fonction use_ai_credits pour bypass la consommation de crédits si l'utilisateur est Premium
    - Les utilisateurs Premium peuvent utiliser tous les services IA sans consommer de crédits
    - L'utilisation est toujours loguée pour les statistiques
    - Le rate limiting s'applique toujours

  2. Comportement
    - Si is_premium = true ET premium_expiration > now() -> pas de consommation de crédits
    - Sinon -> fonctionnement normal
*/

-- Drop and recreate use_ai_credits with premium bypass
DROP FUNCTION IF EXISTS use_ai_credits(uuid, text, jsonb, jsonb);

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
  v_user_profile record;
  v_user_balance integer;
  v_credits_cost integer;
  v_new_balance integer;
  v_usage_id uuid;
  v_rate_limit_check jsonb;
  v_is_premium boolean := false;
  v_credits_consumed integer := 0;
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

  -- 4. GET USER PROFILE AND CHECK PREMIUM STATUS
  SELECT 
    COALESCE(credits_balance, 0) as balance,
    COALESCE(is_premium, false) as premium,
    premium_expiration
  INTO v_user_profile
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

  v_user_balance := v_user_profile.balance;

  -- CHECK IF USER HAS ACTIVE PREMIUM
  v_is_premium := v_user_profile.premium = true 
    AND (v_user_profile.premium_expiration IS NULL OR v_user_profile.premium_expiration > now());

  -- 5. CONSUME CREDITS (BYPASS IF PREMIUM)
  IF v_is_premium THEN
    -- Premium user: no credits consumed
    v_credits_consumed := 0;
    v_new_balance := v_user_balance;
    
    -- Log as premium usage (no transaction created)
  ELSE
    -- Non-premium user: check balance and consume credits
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

    -- Consume credits
    UPDATE profiles
    SET credits_balance = credits_balance - v_credits_cost
    WHERE id = p_user_id
    RETURNING credits_balance INTO v_new_balance;

    v_credits_consumed := v_credits_cost;

    -- Log transaction
    INSERT INTO credit_transactions (
      user_id,
      transaction_type,
      credits_amount,
      service_code,
      description,
      balance_before,
      balance_after
    ) VALUES (
      p_user_id,
      'usage',
      -v_credits_cost,
      p_service_key,
      format('Utilisation service IA: %s', v_service_config.service_name),
      v_user_balance,
      v_new_balance
    );
  END IF;

  -- 6. LOG USAGE (TOUJOURS - MÊME POUR PREMIUM)
  INSERT INTO ai_service_usage_history (
    user_id,
    service_key,
    credits_consumed,
    input_payload,
    output_response,
    status
  ) VALUES (
    p_user_id,
    p_service_key,
    v_credits_consumed,
    p_input_payload,
    p_output_response,
    'success'
  )
  RETURNING id INTO v_usage_id;

  -- 7. LOG SECURITY EVENT (SUCCESS)
  PERFORM log_ai_security_event(
    p_user_id,
    p_service_key,
    'allowed',
    CASE 
      WHEN v_is_premium THEN 'Premium service used successfully (no credits consumed)'
      ELSE 'Service used successfully'
    END,
    (v_rate_limit_check->>'calls_minute')::integer,
    (v_rate_limit_check->>'calls_hour')::integer,
    (v_rate_limit_check->>'calls_day')::integer,
    p_input_payload
  );

  -- 8. RETURN SUCCESS
  RETURN jsonb_build_object(
    'success', true,
    'message', CASE 
      WHEN v_is_premium THEN format('Service utilisé avec succès (Premium - 0 crédits consommés)')
      ELSE format('Service utilisé avec succès. %s crédits consommés.', v_credits_consumed)
    END,
    'credits_consumed', v_credits_consumed,
    'credits_remaining', v_new_balance,
    'usage_id', v_usage_id,
    'service_name', v_service_config.service_name,
    'is_premium', v_is_premium,
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