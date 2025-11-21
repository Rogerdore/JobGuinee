/*
  # Create consume_service_credits Function

  1. Overview
    - Function to consume credits from user_service_credits table
    - Works with the new service-specific credits system
    - Allows users to consume their own credits (not just admins)

  2. New Function
    - consume_service_credits(p_service_code, p_metadata)
      - Takes service_code and optional metadata
      - Uses auth.uid() to get current user automatically
      - Checks if user has sufficient credits for the service
      - Deducts credits from user_service_credits table
      - Records transaction in user_service_credit_transactions
      - Returns success status and new balance

  3. Security
    - Users can only consume their own credits (auth.uid() check)
    - Function is SECURITY DEFINER to allow update of own credits
    - Validates credit availability before deduction
*/

-- Function to consume service credits from user_service_credits table
CREATE OR REPLACE FUNCTION consume_service_credits(
  p_service_code text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_service_id uuid;
  v_service_cost integer;
  v_current_balance integer;
  v_new_balance integer;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_authenticated',
      'message', 'Utilisateur non authentifié'
    );
  END IF;

  -- Get service ID
  SELECT id INTO v_service_id
  FROM premium_services
  WHERE code = p_service_code;

  IF v_service_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'service_not_found',
      'message', 'Service non trouvé'
    );
  END IF;

  -- Get service cost
  SELECT credits_cost INTO v_service_cost
  FROM service_credit_costs
  WHERE service_code = p_service_code
  AND is_active = true;

  IF v_service_cost IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'cost_not_found',
      'message', 'Coût du service non configuré'
    );
  END IF;

  -- Get current balance for this service
  SELECT credits_balance INTO v_current_balance
  FROM user_service_credits
  WHERE user_id = v_user_id
  AND service_id = v_service_id;

  IF v_current_balance IS NULL THEN
    v_current_balance := 0;
  END IF;

  -- Check if user has enough credits
  IF v_current_balance < v_service_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_credits',
      'message', 'Crédits insuffisants',
      'required', v_service_cost,
      'available', v_current_balance
    );
  END IF;

  -- Calculate new balance
  v_new_balance := v_current_balance - v_service_cost;

  -- Update balance
  UPDATE user_service_credits
  SET
    credits_balance = v_new_balance,
    updated_at = now()
  WHERE user_id = v_user_id
  AND service_id = v_service_id;

  -- If no row was updated, create one with negative balance (shouldn't happen)
  IF NOT FOUND THEN
    INSERT INTO user_service_credits (user_id, service_id, credits_balance)
    VALUES (v_user_id, v_service_id, v_new_balance)
    ON CONFLICT (user_id, service_id) DO UPDATE
    SET credits_balance = v_new_balance,
        updated_at = now();
  END IF;

  -- Record transaction
  INSERT INTO user_service_credit_transactions (
    user_id,
    service_id,
    amount,
    balance_after,
    transaction_type,
    note,
    performed_by
  )
  VALUES (
    v_user_id,
    v_service_id,
    -v_service_cost,
    v_new_balance,
    'usage',
    COALESCE(p_metadata->>'note', 'Service usage'),
    v_user_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'credits_used', v_service_cost,
    'new_balance', v_new_balance,
    'service_code', p_service_code,
    'message', 'Crédits consommés avec succès'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION consume_service_credits TO authenticated;
