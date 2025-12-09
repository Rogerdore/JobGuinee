-- Add profile_completion_percentage to candidate_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidate_profiles' AND column_name = 'profile_completion_percentage'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN profile_completion_percentage integer DEFAULT 0;
  END IF;
END $$;

-- Create function to calculate profile completion
CREATE OR REPLACE FUNCTION calculate_profile_completion(candidate_id_param uuid)
RETURNS integer AS $$
DECLARE
  total_fields integer := 0;
  filled_fields integer := 0;
BEGIN
  -- Count total fields
  total_fields := 15; -- Adjust based on your schema
  
  -- Count filled fields for this candidate
  SELECT COUNT(*) INTO filled_fields
  FROM (
    SELECT CASE WHEN title IS NOT NULL THEN 1 ELSE 0 END
    UNION ALL SELECT CASE WHEN bio IS NOT NULL THEN 1 ELSE 0 END
    UNION ALL SELECT CASE WHEN experience_years IS NOT NULL THEN 1 ELSE 0 END
    UNION ALL SELECT CASE WHEN skills IS NOT NULL AND skills != '{}' THEN 1 ELSE 0 END
    UNION ALL SELECT CASE WHEN education_level IS NOT NULL THEN 1 ELSE 0 END
  ) subquery;
  
  RETURN ROUND((filled_fields::float / total_fields) * 100)::integer;
END;
$$ LANGUAGE plpgsql;