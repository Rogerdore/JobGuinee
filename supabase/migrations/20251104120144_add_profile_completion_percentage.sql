/*
  # Add profile completion percentage

  1. Changes
    - Add `profile_completion_percentage` column to profiles table
    - Add index for better query performance

  2. Notes
    - Will be calculated on each profile update
    - Ranges from 0 to 100
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_completion_percentage'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_completion_percentage integer DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_completion ON profiles(profile_completion_percentage);