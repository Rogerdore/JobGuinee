/*
  # Add CVThèque Badges and Verification System

  1. Columns Added to candidate_profiles
    - `is_verified` (boolean) - Whether the profile is verified by admin
    - `verified_at` (timestamptz) - When the profile was verified
    - `verified_by` (uuid) - Which admin verified the profile
    - `is_gold` (boolean) - Whether the candidate has GOLD status
    - `gold_expiration` (timestamptz) - When GOLD status expires
    - `experience_level` (text) - Computed experience level: junior, intermediate, senior

  2. New Tables
    - `candidate_gold_subscriptions` - For managing candidate GOLD subscriptions
    - `candidate_verifications` - For managing profile verification requests

  3. Security
    - Enable RLS on all new tables
    - Add appropriate policies

  4. Functions
    - `can_view_profile` - RPC function to check if a user can view a candidate profile
*/

-- Add new columns to candidate_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN is_verified boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN verified_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'verified_by'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN verified_by uuid REFERENCES profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'is_gold'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN is_gold boolean DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'gold_expiration'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN gold_expiration timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN experience_level text;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_is_verified ON candidate_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_is_gold ON candidate_profiles(is_gold) WHERE is_gold = true;
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_experience_level ON candidate_profiles(experience_level);

-- Function to calculate and update experience level
CREATE OR REPLACE FUNCTION update_candidate_experience_level()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.experience_years IS NOT NULL THEN
    IF NEW.experience_years >= 6 THEN
      NEW.experience_level := 'senior';
    ELSIF NEW.experience_years >= 3 THEN
      NEW.experience_level := 'intermediate';
    ELSE
      NEW.experience_level := 'junior';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update experience level
DROP TRIGGER IF EXISTS trigger_update_experience_level ON candidate_profiles;
CREATE TRIGGER trigger_update_experience_level
  BEFORE INSERT OR UPDATE OF experience_years ON candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_experience_level();

-- Create candidate_gold_subscriptions table
CREATE TABLE IF NOT EXISTS candidate_gold_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_name text NOT NULL,
  price_amount numeric NOT NULL CHECK (price_amount > 0),
  currency text DEFAULT 'GNF' NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days > 0),
  payment_method text DEFAULT 'orange_money',
  payment_reference text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_proof', 'completed', 'failed', 'cancelled')),
  payment_proof_url text,
  subscription_status text DEFAULT 'pending' CHECK (subscription_status IN ('pending', 'active', 'expired', 'cancelled', 'rejected')),
  admin_notes text,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  rejection_reason text,
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on candidate_gold_subscriptions
ALTER TABLE candidate_gold_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for candidate_gold_subscriptions
CREATE POLICY "Candidates can view own gold subscriptions"
  ON candidate_gold_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can create own gold subscriptions"
  ON candidate_gold_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all gold subscriptions"
  ON candidate_gold_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all gold subscriptions"
  ON candidate_gold_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create candidate_verifications table
CREATE TABLE IF NOT EXISTS candidate_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  verification_type text DEFAULT 'identity' CHECK (verification_type IN ('identity', 'education', 'experience', 'full')),
  documents_urls text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes text,
  verified_by uuid REFERENCES profiles(id),
  verified_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on candidate_verifications
ALTER TABLE candidate_verifications ENABLE ROW LEVEL SECURITY;

-- Policies for candidate_verifications
CREATE POLICY "Candidates can view own verifications"
  ON candidate_verifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Candidates can create own verifications"
  ON candidate_verifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications"
  ON candidate_verifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all verifications"
  ON candidate_verifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidate_gold_subscriptions_user_id ON candidate_gold_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_gold_subscriptions_status ON candidate_gold_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_candidate_verifications_user_id ON candidate_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_verifications_status ON candidate_verifications(status);

-- Function to check if a user can view a candidate profile
CREATE OR REPLACE FUNCTION can_view_profile(
  p_candidate_id uuid,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS jsonb AS $$
DECLARE
  v_user_type text;
  v_can_view boolean := false;
  v_reason text := 'access_denied';
  v_is_purchased boolean := false;
  v_is_verified boolean := false;
  v_has_enterprise_gold boolean := false;
  v_has_pack boolean := false;
  v_pack_remaining integer := 0;
BEGIN
  -- Check if user is authenticated
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_view', false,
      'reason', 'not_authenticated',
      'show_preview', true
    );
  END IF;

  -- Get user type
  SELECT user_type INTO v_user_type
  FROM profiles
  WHERE id = p_user_id;

  -- If not a recruiter, deny access
  IF v_user_type != 'recruiter' THEN
    RETURN jsonb_build_object(
      'can_view', false,
      'reason', 'not_recruiter',
      'show_preview', false
    );
  END IF;

  -- Check if already purchased this specific profile
  SELECT EXISTS (
    SELECT 1 FROM profile_purchases
    WHERE buyer_id = p_user_id
    AND candidate_id = p_candidate_id
    AND payment_status = 'completed'
    AND payment_verified_by_admin = true
  ) INTO v_is_purchased;

  IF v_is_purchased THEN
    RETURN jsonb_build_object(
      'can_view', true,
      'reason', 'purchased',
      'show_preview', false
    );
  END IF;

  -- Check for Enterprise GOLD subscription
  SELECT EXISTS (
    SELECT 1 FROM enterprise_subscriptions es
    JOIN companies c ON c.id = es.company_id
    WHERE c.profile_id = p_user_id
    AND es.subscription_type = 'gold'
    AND es.status = 'active'
    AND es.end_date > now()
  ) INTO v_has_enterprise_gold;

  IF v_has_enterprise_gold THEN
    RETURN jsonb_build_object(
      'can_view', true,
      'reason', 'enterprise_gold',
      'show_preview', false
    );
  END IF;

  -- Check for available CVThèque packs
  SELECT 
    COALESCE(SUM(profiles_remaining), 0) INTO v_pack_remaining
  FROM cvtheque_pack_purchases
  WHERE buyer_id = p_user_id
  AND purchase_status = 'active'
  AND (expires_at IS NULL OR expires_at > now())
  AND profiles_remaining > 0;

  IF v_pack_remaining > 0 THEN
    v_has_pack := true;
  END IF;

  -- Return result with context
  RETURN jsonb_build_object(
    'can_view', v_has_pack,
    'reason', CASE 
      WHEN v_has_pack THEN 'has_pack'
      ELSE 'no_access'
    END,
    'show_preview', true,
    'has_pack', v_has_pack,
    'pack_remaining', v_pack_remaining
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;