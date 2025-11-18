/*
  # Fix More Function Security Issues

  ## Changes
    - Fix remaining functions with search_path issues
*/

DROP FUNCTION IF EXISTS public.get_user_premium_status(uuid);
CREATE FUNCTION public.get_user_premium_status(p_user_id uuid)
RETURNS TABLE (
  subscription_plan text,
  subscription_status text,
  subscription_end_date timestamptz,
  total_credits bigint,
  used_credits bigint,
  remaining_credits bigint
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.plan,
    s.status,
    s.end_date,
    b.total_credits,
    b.used_credits,
    (b.total_credits - b.used_credits) as remaining_credits
  FROM premium_subscriptions s
  LEFT JOIN user_credit_balances b ON b.user_id = s.user_id
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$;

DROP FUNCTION IF EXISTS public.calculate_free_credits_value();
CREATE FUNCTION public.calculate_free_credits_value()
RETURNS numeric
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  total_value numeric := 0;
  cv_cost numeric;
  letter_cost numeric;
  analysis_cost numeric;
BEGIN
  SELECT credit_cost INTO cv_cost
  FROM service_credit_costs
  WHERE service_type = 'cv_generation' AND is_active = true
  LIMIT 1;
  
  SELECT credit_cost INTO letter_cost
  FROM service_credit_costs
  WHERE service_type = 'cover_letter_generation' AND is_active = true
  LIMIT 1;
  
  SELECT credit_cost INTO analysis_cost
  FROM service_credit_costs
  WHERE service_type = 'profile_analysis' AND is_active = true
  LIMIT 1;
  
  total_value := (COALESCE(cv_cost, 0) * 5) + 
                 (COALESCE(letter_cost, 0) * 5) + 
                 (COALESCE(analysis_cost, 0) * 5);
  
  RETURN total_value;
END;
$$;

DROP FUNCTION IF EXISTS public.get_welcome_credits_summary(uuid);
CREATE FUNCTION public.get_welcome_credits_summary(p_user_id uuid)
RETURNS TABLE (
  total_credits bigint,
  used_credits bigint,
  remaining_credits bigint,
  estimated_value numeric
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.total_credits,
    b.used_credits,
    (b.total_credits - b.used_credits) as remaining_credits,
    calculate_free_credits_value() as estimated_value
  FROM user_credit_balances b
  WHERE b.user_id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_credit_balance(uuid);
CREATE FUNCTION public.get_user_credit_balance(p_user_id uuid)
RETURNS bigint
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  balance bigint;
BEGIN
  SELECT (total_credits - used_credits)
  INTO balance
  FROM user_credit_balances
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(balance, 0);
END;
$$;

DROP FUNCTION IF EXISTS public.purchase_credit_package(uuid, uuid);
CREATE FUNCTION public.purchase_credit_package(
  p_user_id uuid,
  p_package_id uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_credits bigint;
  v_price numeric;
BEGIN
  SELECT credits_amount, price
  INTO v_credits, v_price
  FROM credit_packages
  WHERE id = p_package_id AND is_active = true;
  
  IF v_credits IS NULL THEN
    RETURN false;
  END IF;
  
  INSERT INTO user_credit_balances (user_id, total_credits, used_credits)
  VALUES (p_user_id, v_credits, 0)
  ON CONFLICT (user_id)
  DO UPDATE SET total_credits = user_credit_balances.total_credits + v_credits;
  
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    package_id,
    description
  ) VALUES (
    p_user_id,
    'purchase',
    v_credits,
    p_package_id,
    'Credit package purchase'
  );
  
  RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS public.use_credits_for_service(uuid, text, bigint);
CREATE FUNCTION public.use_credits_for_service(
  p_user_id uuid,
  p_service_type text,
  p_credits_amount bigint
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_available bigint;
BEGIN
  SELECT (total_credits - used_credits)
  INTO v_available
  FROM user_credit_balances
  WHERE user_id = p_user_id;
  
  IF v_available IS NULL OR v_available < p_credits_amount THEN
    RETURN false;
  END IF;
  
  UPDATE user_credit_balances
  SET used_credits = used_credits + p_credits_amount
  WHERE user_id = p_user_id;
  
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    service_type,
    description
  ) VALUES (
    p_user_id,
    'use',
    -p_credits_amount,
    p_service_type,
    'Service usage: ' || p_service_type
  );
  
  RETURN true;
END;
$$;