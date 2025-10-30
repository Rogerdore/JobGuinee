/*
  # Add salary fields to candidate profiles

  1. Changes
    - Add `desired_salary_min` column (numeric, nullable)
    - Add `desired_salary_max` column (numeric, nullable)
  
  2. Purpose
    - Allow candidates to specify their salary expectations
    - Enable better job matching based on salary requirements
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidate_profiles' AND column_name = 'desired_salary_min'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_salary_min numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidate_profiles' AND column_name = 'desired_salary_max'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_salary_max numeric;
  END IF;
END $$;
