/*
  # Add Profile Views and Purchases Tracking

  ## Overview
  This migration adds tracking for candidate profile views and purchases in the CVthèque.

  ## 1. Changes to Tables

  ### `candidate_profiles`
  - Add `profile_views_count` (integer) - Number of times profile was viewed
  - Add `profile_purchases_count` (integer) - Number of times profile was purchased
  - Add `last_viewed_at` (timestamptz) - Last time profile was viewed

  ## 2. New Tables

  ### `profile_views`
  - `id` (uuid, primary key)
  - `candidate_id` (uuid, references candidate_profiles) - Profile that was viewed
  - `viewer_id` (uuid, references profiles) - User who viewed the profile
  - `viewed_at` (timestamptz) - When the view occurred
  - `session_id` (text) - Optional session identifier to prevent duplicate counts

  ## 3. Functions

  ### `increment_profile_views`
  - Increments the profile views count for a candidate
  - Updates last_viewed_at timestamp
  - Records the view in profile_views table

  ### `update_profile_purchases_count`
  - Trigger function to automatically update purchases count
  - Called when a new purchase is completed

  ## 4. Security
  - Enable RLS on profile_views table
  - Add policies for authenticated users
  - Ensure recruiters can only view their own viewing history
*/

-- Add columns to candidate_profiles table
ALTER TABLE candidate_profiles
ADD COLUMN IF NOT EXISTS profile_views_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS profile_purchases_count integer DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;

-- Create profile_views tracking table
CREATE TABLE IF NOT EXISTS profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidate_profiles(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  session_id text,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_views_candidate_id ON profile_views(candidate_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at ON profile_views(viewed_at DESC);

-- Enable RLS on profile_views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view their own viewing history
CREATE POLICY "Users can view own viewing history"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (auth.uid() = viewer_id);

-- Policy: Admins can view all profile views
CREATE POLICY "Admins can view all profile views"
  ON profile_views
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Policy: Authenticated users can insert profile views
CREATE POLICY "Authenticated users can record profile views"
  ON profile_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to increment profile views
CREATE OR REPLACE FUNCTION increment_profile_views(
  p_candidate_id uuid,
  p_viewer_id uuid DEFAULT NULL,
  p_session_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the candidate profile views count
  UPDATE candidate_profiles
  SET
    profile_views_count = profile_views_count + 1,
    last_viewed_at = now()
  WHERE id = p_candidate_id;

  -- Record the view in profile_views table
  INSERT INTO profile_views (candidate_id, viewer_id, session_id)
  VALUES (p_candidate_id, p_viewer_id, p_session_id);
END;
$$;

-- Function to update profile purchases count (trigger function)
CREATE OR REPLACE FUNCTION update_profile_purchases_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only increment if payment is completed and verified
  IF NEW.payment_status = 'completed' AND NEW.payment_verified_by_admin = true THEN
    UPDATE candidate_profiles
    SET profile_purchases_count = profile_purchases_count + 1
    WHERE id = NEW.candidate_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to automatically update purchases count
DROP TRIGGER IF EXISTS trigger_update_profile_purchases_count ON profile_purchases;
CREATE TRIGGER trigger_update_profile_purchases_count
  AFTER INSERT OR UPDATE OF payment_status, payment_verified_by_admin
  ON profile_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_purchases_count();

-- Initialize existing profile purchases counts
UPDATE candidate_profiles cp
SET profile_purchases_count = (
  SELECT COUNT(*)
  FROM profile_purchases pp
  WHERE pp.candidate_id = cp.id
  AND pp.payment_status = 'completed'
  AND pp.payment_verified_by_admin = true
)
WHERE EXISTS (
  SELECT 1
  FROM profile_purchases pp
  WHERE pp.candidate_id = cp.id
);

-- Create a helper function to get candidate profile stats
CREATE OR REPLACE FUNCTION get_candidate_profile_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result json;
BEGIN
  SELECT json_build_object(
    'profile_views_count', COALESCE(cp.profile_views_count, 0),
    'profile_purchases_count', COALESCE(cp.profile_purchases_count, 0),
    'last_viewed_at', cp.last_viewed_at,
    'recent_viewers_count', (
      SELECT COUNT(DISTINCT viewer_id)
      FROM profile_views pv
      WHERE pv.candidate_id = cp.id
      AND pv.viewed_at > now() - interval '30 days'
    ),
    'this_month_views', (
      SELECT COUNT(*)
      FROM profile_views pv
      WHERE pv.candidate_id = cp.id
      AND pv.viewed_at >= date_trunc('month', now())
    ),
    'this_month_purchases', (
      SELECT COUNT(*)
      FROM profile_purchases pp
      WHERE pp.candidate_id = cp.id
      AND pp.payment_status = 'completed'
      AND pp.purchased_at >= date_trunc('month', now())
    )
  ) INTO v_result
  FROM candidate_profiles cp
  WHERE cp.user_id = p_user_id;

  RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_profile_views(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_candidate_profile_stats(uuid) TO authenticated;