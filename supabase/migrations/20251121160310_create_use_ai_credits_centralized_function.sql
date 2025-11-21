/*
  # Fonction centralisée use_ai_credits()

  ## Description
  Fonction unique pour gérer TOUS les appels aux services IA:
  - Vérifie le solde de crédits
  - Déduit les crédits
  - Enregistre l'utilisation
  - Enregistre l'historique complet (input/output)
  
  ## Paramètres
  - p_user_id: UUID de l'utilisateur
  - p_service_key: Clé du service (ex: 'analyse_profil')
  - p_input_payload: Données envoyées (jsonb)
  - p_output_response: Réponse de l'IA (jsonb)
  
  ## Retour
  jsonb avec:
  - success: boolean
  - credits_remaining: integer
  - usage_id: uuid (pour traçabilité)
  - error: text (si échec)
  
  ## Sécurité
  - SECURITY DEFINER pour accès contrôlé
  - Vérifie les crédits avant déduction
  - Transaction atomique
*/

CREATE OR REPLACE FUNCTION use_ai_credits(
  p_user_id uuid,
  p_service_key text,
  p_input_payload jsonb DEFAULT '{}'::jsonb,
  p_output_response jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service record;
  v_current_balance integer;
  v_new_balance integer;
  v_usage_id uuid;
  v_service_name text;
BEGIN
  -- 1. Récupérer la configuration du service
  SELECT 
    id,
    service_code,
    service_name,
    credits_cost,
    is_active,
    status
  INTO v_service
  FROM service_credit_costs
  WHERE service_key = p_service_key;
  
  -- Vérifier si le service existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', format('Service "%s" introuvable', p_service_key)
    );
  END IF;
  
  -- Vérifier si le service est actif
  IF NOT v_service.is_active OR NOT v_service.status THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SERVICE_INACTIVE',
      'message', format('Le service "%s" est actuellement inactif', v_service.service_name)
    );
  END IF;
  
  v_service_name := v_service.service_name;
  
  -- 2. Vérifier le solde de crédits
  SELECT total_credits
  INTO v_current_balance
  FROM user_credit_balances
  WHERE user_id = p_user_id;
  
  -- Si pas de compte crédit, le créer avec 0
  IF NOT FOUND THEN
    INSERT INTO user_credit_balances (user_id, total_credits, credits_purchased, credits_used)
    VALUES (p_user_id, 0, 0, 0);
    v_current_balance := 0;
  END IF;
  
  -- Vérifier si suffisant
  IF v_current_balance < v_service.credits_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', format('Crédits insuffisants. Requis: %s, Disponible: %s', v_service.credits_cost, v_current_balance),
      'required_credits', v_service.credits_cost,
      'available_credits', v_current_balance
    );
  END IF;
  
  -- 3. Déduire les crédits
  v_new_balance := v_current_balance - v_service.credits_cost;
  
  UPDATE user_credit_balances
  SET 
    total_credits = v_new_balance,
    credits_used = credits_used + v_service.credits_cost,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- 4. Enregistrer la transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    service_code,
    description,
    balance_before,
    balance_after,
    metadata
  ) VALUES (
    p_user_id,
    'usage',
    -v_service.credits_cost,
    v_service.service_code,
    format('Utilisation: %s', v_service_name),
    v_current_balance,
    v_new_balance,
    jsonb_build_object(
      'service_key', p_service_key,
      'service_id', v_service.id
    )
  );
  
  -- 5. Enregistrer dans l'historique d'utilisation avec input/output
  INSERT INTO ai_service_usage_history (
    user_id,
    service_code,
    service_name,
    credits_consumed,
    balance_before,
    balance_after,
    input_payload,
    output_response,
    metadata
  ) VALUES (
    p_user_id,
    v_service.service_code,
    v_service_name,
    v_service.credits_cost,
    v_current_balance,
    v_new_balance,
    p_input_payload,
    p_output_response,
    jsonb_build_object(
      'service_key', p_service_key,
      'service_id', v_service.id,
      'timestamp', now()
    )
  )
  RETURNING id INTO v_usage_id;
  
  -- 6. Retourner le succès
  RETURN jsonb_build_object(
    'success', true,
    'credits_remaining', v_new_balance,
    'credits_consumed', v_service.credits_cost,
    'usage_id', v_usage_id,
    'service_name', v_service_name,
    'message', format('Service "%s" exécuté avec succès. Crédits restants: %s', v_service_name, v_new_balance)
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INTERNAL_ERROR',
      'message', format('Erreur interne: %s', SQLERRM)
    );
END;
$$;

-- Commentaire
COMMENT ON FUNCTION use_ai_credits IS 'Fonction centralisée pour gérer TOUS les appels aux services IA avec déduction de crédits et historique complet';
