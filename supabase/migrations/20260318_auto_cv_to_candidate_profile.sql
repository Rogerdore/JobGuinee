-- Migration: Auto-copy CV from application to candidate_profiles
-- When a candidate applies with a CV and their candidate_profiles doesn't have one yet,
-- automatically copy the CV URL to their profile so it appears in their profile form.

CREATE OR REPLACE FUNCTION auto_copy_cv_to_candidate_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if the application has a CV
  IF NEW.cv_url IS NOT NULL AND TRIM(NEW.cv_url) <> '' THEN
    -- Only UPDATE existing candidate_profiles; never INSERT an empty row.
    -- If the candidate has no profile yet, the CV will be loaded
    -- when they create their profile via the CandidateProfileForm.
    UPDATE candidate_profiles
    SET cv_url = NEW.cv_url,
        updated_at = NOW()
    WHERE profile_id = NEW.candidate_id
      AND (cv_url IS NULL OR TRIM(cv_url) = '');
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger fires AFTER INSERT on applications
DROP TRIGGER IF EXISTS trigger_auto_cv_to_profile ON applications;
CREATE TRIGGER trigger_auto_cv_to_profile
  AFTER INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION auto_copy_cv_to_candidate_profile();

COMMENT ON FUNCTION auto_copy_cv_to_candidate_profile() IS
  'Auto-copies CV URL from a new application to candidate_profiles.cv_url if the candidate already has a profile row but no CV yet. Does NOT create empty profile rows.';
