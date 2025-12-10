/*
  # Extend candidate_profiles for AI parsing and intelligent features

  1. Nouvelles colonnes
    - `desired_salary_min` (numeric) - Salaire minimum souhaité
    - `desired_salary_max` (numeric) - Salaire maximum souhaité
    - `desired_position` (text) - Poste recherché
    - `desired_sectors` (text[]) - Secteurs d'activité souhaités
    - `mobility` (text[]) - Zones de mobilité géographique
    - `availability` (text) - Disponibilité (immediate, 1_month, 3_months, negotiable)
    - `education_level` (text) - Niveau d'études
    - `languages` (jsonb) - Langues avec niveaux
    - `driving_license` (text[]) - Permis de conduire
    - `linkedin_url` (text) - Profil LinkedIn
    - `portfolio_url` (text) - Portfolio en ligne
    - `github_url` (text) - Profil GitHub
    - `other_urls` (jsonb) - Autres liens
    - `cv_parsed_at` (timestamptz) - Date du dernier parsing CV
    - `cv_parsed_data` (jsonb) - Données extraites du CV
    - `profile_completion_percentage` (int) - Pourcentage de complétion
    - `ai_generated_summary` (text) - Résumé généré par IA
    - `nationality` (text) - Nationalité

  2. Notes
    - Les données sont étendues pour supporter le parsing CV intelligent
    - Compatibilité totale avec l'écosystème IA existant
*/

-- Ajouter les nouveaux champs seulement s'ils n'existent pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'desired_salary_min'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_salary_min numeric DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'desired_salary_max'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_salary_max numeric DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'desired_position'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_position text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'desired_sectors'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN desired_sectors text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'mobility'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN mobility text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'availability'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN availability text DEFAULT 'immediate';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'education_level'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN education_level text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'languages'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN languages jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'driving_license'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN driving_license text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'linkedin_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN linkedin_url text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'portfolio_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN portfolio_url text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'github_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN github_url text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'other_urls'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN other_urls jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'cv_parsed_at'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN cv_parsed_at timestamptz DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'cv_parsed_data'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN cv_parsed_data jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'profile_completion_percentage'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN profile_completion_percentage integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'ai_generated_summary'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN ai_generated_summary text DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'nationality'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN nationality text DEFAULT NULL;
  END IF;
END $$;

-- Créer un index pour les recherches par secteur et mobilité
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_sectors ON candidate_profiles USING GIN (desired_sectors);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_mobility ON candidate_profiles USING GIN (mobility);

-- Fonction pour calculer le pourcentage de complétion du profil
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  total_fields integer := 20;
  completed_fields integer := 0;
BEGIN
  -- Compter les champs remplis
  IF NEW.title IS NOT NULL AND NEW.title != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.location IS NOT NULL AND NEW.location != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.experience_years IS NOT NULL AND NEW.experience_years > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.education IS NOT NULL AND jsonb_array_length(NEW.education) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.work_experience IS NOT NULL AND jsonb_array_length(NEW.work_experience) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.cv_url IS NOT NULL AND NEW.cv_url != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.desired_position IS NOT NULL AND NEW.desired_position != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.desired_salary_min IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.desired_sectors IS NOT NULL AND array_length(NEW.desired_sectors, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.mobility IS NOT NULL AND array_length(NEW.mobility, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.availability IS NOT NULL THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.education_level IS NOT NULL AND NEW.education_level != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.languages IS NOT NULL AND jsonb_array_length(NEW.languages) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.portfolio_url IS NOT NULL AND NEW.portfolio_url != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.github_url IS NOT NULL AND NEW.github_url != '' THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.driving_license IS NOT NULL AND array_length(NEW.driving_license, 1) > 0 THEN completed_fields := completed_fields + 1; END IF;
  IF NEW.nationality IS NOT NULL AND NEW.nationality != '' THEN completed_fields := completed_fields + 1; END IF;

  -- Calculer le pourcentage
  NEW.profile_completion_percentage := ROUND((completed_fields::numeric / total_fields::numeric) * 100);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour calculer automatiquement le pourcentage
DROP TRIGGER IF EXISTS update_profile_completion ON candidate_profiles;
CREATE TRIGGER update_profile_completion
  BEFORE INSERT OR UPDATE ON candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_completion();
