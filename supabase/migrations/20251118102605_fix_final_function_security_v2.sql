/*
  # Fix Final Function Security Issues (v2)

  ## Changes
    - Fix remaining complex functions with search_path
    - Drop and recreate triggers where necessary
*/

DROP FUNCTION IF EXISTS public.initialize_free_subscription(uuid);
CREATE FUNCTION public.initialize_free_subscription(p_user_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO premium_subscriptions (user_id, plan, status, start_date)
  VALUES (p_user_id, 'free', 'active', now())
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO user_credit_balances (user_id, total_credits, used_credits)
  VALUES (p_user_id, 150000, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description
  ) VALUES (
    p_user_id,
    'grant',
    150000,
    'Welcome credits - Free trial'
  );
END;
$$;

DROP FUNCTION IF EXISTS public.purchase_service_credits(uuid, uuid, integer);
CREATE FUNCTION public.purchase_service_credits(
  p_user_id uuid,
  p_service_id uuid,
  p_quantity integer DEFAULT 1
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_price numeric;
  v_service_name text;
BEGIN
  SELECT price, name
  INTO v_price, v_service_name
  FROM premium_services
  WHERE id = p_service_id AND is_active = true;
  
  IF v_price IS NULL THEN
    RETURN false;
  END IF;
  
  INSERT INTO user_premium_services (
    user_id,
    service_id,
    credits_purchased,
    credits_remaining,
    price_paid
  ) VALUES (
    p_user_id,
    p_service_id,
    p_quantity,
    p_quantity,
    v_price * p_quantity
  );
  
  RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS public.use_service_credits(uuid, uuid);
CREATE FUNCTION public.use_service_credits(
  p_user_id uuid,
  p_service_id uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_service_id uuid;
BEGIN
  SELECT id
  INTO v_user_service_id
  FROM user_premium_services
  WHERE user_id = p_user_id
    AND service_id = p_service_id
    AND credits_remaining > 0
  ORDER BY created_at ASC
  LIMIT 1;
  
  IF v_user_service_id IS NULL THEN
    RETURN false;
  END IF;
  
  UPDATE user_premium_services
  SET credits_remaining = credits_remaining - 1,
      updated_at = now()
  WHERE id = v_user_service_id;
  
  INSERT INTO premium_service_usage (
    user_id,
    service_id,
    credits_used
  ) VALUES (
    p_user_id,
    p_service_id,
    1
  );
  
  RETURN true;
END;
$$;

DROP FUNCTION IF EXISTS public.grant_trial_credits_to_existing_candidates();
CREATE FUNCTION public.grant_trial_credits_to_existing_candidates()
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_credit_balances (user_id, total_credits, used_credits)
  SELECT p.id, 150000, 0
  FROM profiles p
  WHERE p.user_type = 'candidate'
    AND NOT EXISTS (
      SELECT 1 FROM user_credit_balances ucb
      WHERE ucb.user_id = p.id
    )
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO credit_transactions (user_id, transaction_type, credits_amount, description)
  SELECT p.id, 'grant', 150000, 'Welcome credits - Retroactive grant'
  FROM profiles p
  WHERE p.user_type = 'candidate'
    AND NOT EXISTS (
      SELECT 1 FROM credit_transactions ct
      WHERE ct.user_id = p.id
        AND ct.transaction_type = 'grant'
        AND ct.description LIKE '%Welcome credits%'
    );
END;
$$;

-- Drop trigger first, then recreate function
DROP TRIGGER IF EXISTS trigger_auto_initialize_premium ON profiles;

DROP FUNCTION IF EXISTS public.auto_initialize_premium_on_profile_creation() CASCADE;
CREATE FUNCTION public.auto_initialize_premium_on_profile_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_type = 'candidate' THEN
    PERFORM initialize_free_subscription(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER trigger_auto_initialize_premium
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_initialize_premium_on_profile_creation();

DROP FUNCTION IF EXISTS public.analyze_profile_with_ai(uuid, uuid);
CREATE FUNCTION public.analyze_profile_with_ai(
  p_user_id uuid,
  p_job_id uuid
)
RETURNS uuid
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  v_analysis_id uuid;
  v_cost bigint;
BEGIN
  SELECT credit_cost INTO v_cost
  FROM service_credit_costs
  WHERE service_type = 'profile_analysis' AND is_active = true
  LIMIT 1;
  
  IF NOT use_credits_for_service(p_user_id, 'profile_analysis', COALESCE(v_cost, 10000)) THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;
  
  INSERT INTO ai_profile_analysis (
    user_id,
    offer_id,
    status
  ) VALUES (
    p_user_id,
    p_job_id,
    'pending'
  ) RETURNING id INTO v_analysis_id;
  
  RETURN v_analysis_id;
END;
$$;