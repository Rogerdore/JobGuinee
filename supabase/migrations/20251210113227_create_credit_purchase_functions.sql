/*
  # Create Credit Purchase Functions
  
  1. Functions
    - create_credit_purchase: Create a new purchase record
    - complete_credit_purchase: Complete purchase and credit user account
    - cancel_credit_purchase: Cancel a purchase
*/

-- Function to create credit purchase
CREATE OR REPLACE FUNCTION create_credit_purchase(
  p_package_id uuid,
  p_payment_method text DEFAULT 'orange_money'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_package record;
  v_purchase_id uuid;
  v_payment_reference text;
  v_total_credits integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous devez être connecté',
      'error', 'UNAUTHORIZED'
    );
  END IF;

  SELECT * INTO v_package
  FROM credit_packages
  WHERE id = p_package_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Pack de crédits introuvable',
      'error', 'PACKAGE_NOT_FOUND'
    );
  END IF;

  v_total_credits := v_package.credits_amount + v_package.bonus_credits;
  v_payment_reference := 'REF-' || upper(substring(gen_random_uuid()::text, 1, 8));

  INSERT INTO credit_purchases (
    user_id,
    package_id,
    credits_amount,
    bonus_credits,
    total_credits,
    price_amount,
    currency,
    payment_method,
    payment_reference,
    payment_status,
    purchase_status
  ) VALUES (
    v_user_id,
    p_package_id,
    v_package.credits_amount,
    v_package.bonus_credits,
    v_total_credits,
    v_package.price_amount,
    v_package.currency,
    p_payment_method,
    v_payment_reference,
    'pending',
    'pending'
  )
  RETURNING id INTO v_purchase_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat créé avec succès',
    'purchase_id', v_purchase_id,
    'payment_reference', v_payment_reference,
    'amount', v_package.price_amount,
    'currency', v_package.currency,
    'credits', v_total_credits
  );
END;
$$;

-- Function to complete credit purchase
CREATE OR REPLACE FUNCTION complete_credit_purchase(
  p_purchase_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase record;
  v_user_id uuid;
  v_is_admin boolean;
  v_new_balance integer;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous devez être connecté',
      'error', 'UNAUTHORIZED'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Action réservée aux administrateurs',
      'error', 'FORBIDDEN'
    );
  END IF;

  SELECT * INTO v_purchase
  FROM credit_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Achat introuvable',
      'error', 'PURCHASE_NOT_FOUND'
    );
  END IF;

  IF v_purchase.payment_status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Achat déjà complété',
      'error', 'ALREADY_COMPLETED'
    );
  END IF;

  UPDATE profiles
  SET credits_balance = COALESCE(credits_balance, 0) + v_purchase.total_credits
  WHERE id = v_purchase.user_id
  RETURNING credits_balance INTO v_new_balance;

  UPDATE credit_purchases
  SET 
    payment_status = 'completed',
    purchase_status = 'completed',
    completed_at = now(),
    admin_notes = p_admin_notes
  WHERE id = p_purchase_id;

  INSERT INTO credit_transactions (
    user_id,
    amount,
    transaction_type,
    reference_type,
    reference_id,
    description,
    balance_after
  ) VALUES (
    v_purchase.user_id,
    v_purchase.total_credits,
    'purchase',
    'credit_purchase',
    p_purchase_id,
    'Achat de crédits IA - ' || v_purchase.payment_reference,
    v_new_balance
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat validé et crédits ajoutés',
    'credits_added', v_purchase.total_credits,
    'new_balance', v_new_balance
  );
END;
$$;

-- Function to cancel credit purchase
CREATE OR REPLACE FUNCTION cancel_credit_purchase(
  p_purchase_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_purchase record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Vous devez être connecté',
      'error', 'UNAUTHORIZED'
    );
  END IF;

  SELECT * INTO v_purchase
  FROM credit_purchases
  WHERE id = p_purchase_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Achat introuvable',
      'error', 'PURCHASE_NOT_FOUND'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = v_user_id AND user_type = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin AND v_purchase.user_id != v_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Non autorisé',
      'error', 'FORBIDDEN'
    );
  END IF;

  IF v_purchase.payment_status = 'completed' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Impossible d''annuler un achat complété',
      'error', 'ALREADY_COMPLETED'
    );
  END IF;

  UPDATE credit_purchases
  SET 
    payment_status = 'cancelled',
    purchase_status = 'cancelled',
    failed_reason = p_reason
  WHERE id = p_purchase_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Achat annulé avec succès'
  );
END;
$$;