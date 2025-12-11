/*
  # Create Premium Subscriptions System for Candidates

  1. New Table
    - `premium_subscriptions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `plan_code` (text) - Code du plan (e.g., 'premium_pro_plus')
      - `plan_name` (text) - Nom du plan (e.g., 'Premium PRO+')
      - `price_amount` (numeric) - Montant payé
      - `currency` (text) - Devise (GNF)
      - `payment_method` (text) - Méthode de paiement (orange_money, lengopay, digitalpay)
      - `payment_reference` (text, unique) - Référence unique du paiement
      - `payment_status` (text) - État du paiement (pending, waiting_proof, completed, failed, cancelled)
      - `subscription_status` (text) - État de l'abonnement (pending, active, expired, cancelled)
      - `payment_proof_url` (text) - URL de la preuve de paiement
      - `admin_notes` (text) - Notes de l'administrateur
      - `started_at` (timestamptz) - Date de début de l'abonnement
      - `expires_at` (timestamptz) - Date d'expiration de l'abonnement
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Updates to profiles table
    - Add `is_premium` (boolean) - Indicateur premium actif
    - Add `premium_expiration` (timestamptz) - Date d'expiration du premium

  3. Security
    - Enable RLS on `premium_subscriptions` table
    - Users can read their own subscriptions
    - Only admins can modify subscriptions

  4. Functions
    - Function to check if user has active premium
    - Function to activate premium subscription
    - Function to cancel premium subscription
*/

-- Create premium_subscriptions table
CREATE TABLE IF NOT EXISTS premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL DEFAULT 'premium_pro_plus',
  plan_name text NOT NULL DEFAULT 'Premium PRO+',
  price_amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'GNF',
  payment_method text NOT NULL DEFAULT 'orange_money',
  payment_reference text UNIQUE NOT NULL,
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status = ANY(ARRAY['pending'::text, 'waiting_proof'::text, 'completed'::text, 'failed'::text, 'cancelled'::text])),
  subscription_status text NOT NULL DEFAULT 'pending' CHECK (subscription_status = ANY(ARRAY['pending'::text, 'active'::text, 'expired'::text, 'cancelled'::text])),
  payment_proof_url text,
  admin_notes text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add premium fields to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_premium boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'premium_expiration'
  ) THEN
    ALTER TABLE profiles ADD COLUMN premium_expiration timestamptz;
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_user_id ON premium_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status ON premium_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_payment_status ON premium_subscriptions(payment_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Enable RLS
ALTER TABLE premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for premium_subscriptions

-- Users can view their own subscriptions
CREATE POLICY "Users can view own premium subscriptions"
  ON premium_subscriptions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Only admins can view all subscriptions
CREATE POLICY "Admins can view all premium subscriptions"
  ON premium_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Users can insert their own subscriptions
CREATE POLICY "Users can create own premium subscriptions"
  ON premium_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Only admins can update subscriptions
CREATE POLICY "Admins can update premium subscriptions"
  ON premium_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Only admins can delete subscriptions
CREATE POLICY "Admins can delete premium subscriptions"
  ON premium_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Function: Check if user has active premium subscription
CREATE OR REPLACE FUNCTION public.has_active_premium_subscription(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id_param 
    AND is_premium = true
    AND (premium_expiration IS NULL OR premium_expiration > now())
  );
END;
$$;

-- Function: Activate premium subscription (Admin only)
CREATE OR REPLACE FUNCTION public.activate_premium_subscription(subscription_id_param uuid, duration_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription premium_subscriptions%ROWTYPE;
  v_start_date timestamptz;
  v_expiration_date timestamptz;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès non autorisé'
    );
  END IF;

  -- Get subscription
  SELECT * INTO v_subscription
  FROM premium_subscriptions
  WHERE id = subscription_id_param;

  IF v_subscription.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Abonnement non trouvé'
    );
  END IF;

  -- Calculate dates
  v_start_date := now();
  v_expiration_date := v_start_date + (duration_days || ' days')::interval;

  -- Update subscription
  UPDATE premium_subscriptions
  SET 
    subscription_status = 'active',
    payment_status = 'completed',
    started_at = v_start_date,
    expires_at = v_expiration_date,
    updated_at = now()
  WHERE id = subscription_id_param;

  -- Update user profile
  UPDATE profiles
  SET 
    is_premium = true,
    premium_expiration = v_expiration_date,
    updated_at = now()
  WHERE id = v_subscription.user_id;

  -- Create credit transaction for welcome bonus
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    balance_before,
    balance_after
  )
  SELECT
    v_subscription.user_id,
    'bonus',
    100,
    'Bonus Premium PRO+ - Bienvenue!',
    p.credits_balance,
    p.credits_balance + 100
  FROM profiles p
  WHERE p.id = v_subscription.user_id;

  -- Add bonus credits
  UPDATE profiles
  SET credits_balance = credits_balance + 100
  WHERE id = v_subscription.user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Abonnement activé avec succès',
    'expires_at', v_expiration_date
  );
END;
$$;

-- Function: Cancel premium subscription (Admin only)
CREATE OR REPLACE FUNCTION public.cancel_premium_subscription(subscription_id_param uuid, cancel_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription premium_subscriptions%ROWTYPE;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Accès non autorisé'
    );
  END IF;

  -- Get subscription
  SELECT * INTO v_subscription
  FROM premium_subscriptions
  WHERE id = subscription_id_param;

  IF v_subscription.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Abonnement non trouvé'
    );
  END IF;

  -- Update subscription
  UPDATE premium_subscriptions
  SET 
    subscription_status = 'cancelled',
    payment_status = 'cancelled',
    admin_notes = COALESCE(admin_notes || E'\n', '') || 'Annulé: ' || COALESCE(cancel_reason, 'Aucune raison fournie'),
    updated_at = now()
  WHERE id = subscription_id_param;

  -- Update user profile
  UPDATE profiles
  SET 
    is_premium = false,
    premium_expiration = NULL,
    updated_at = now()
  WHERE id = v_subscription.user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Abonnement annulé avec succès'
  );
END;
$$;