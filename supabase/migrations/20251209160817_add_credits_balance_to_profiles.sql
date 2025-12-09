/*
  # Add Credits Balance to Profiles
  
  1. New Column
    - Add `credits_balance` column to profiles table to track user credits
  
  2. Changes
    - Add credits_balance column with default value of 100 (test credits)
    - Create index for quick lookups
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'credits_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN credits_balance INTEGER DEFAULT 100;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_credits_balance ON profiles(credits_balance);
