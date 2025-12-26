/*
  # Add profile completion percentage column

  1. Changes
    - Add `profile_completion_percentage` column to `profiles` table
      - Type: integer (0-100)
      - Default: 0
      - Used to track and display profile completion across dashboard and forms

  2. Notes
    - This column stores the calculated completion percentage
    - Updated automatically by the frontend when profile data changes
    - Helps maintain consistent completion display across all pages
*/

-- Add profile_completion_percentage column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_completion_percentage'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_completion_percentage integer DEFAULT 0;
  END IF;
END $$;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_completion_percentage 
ON profiles(profile_completion_percentage);
