/*
  # Extension du système de profil recruteur JobGuinée

  ## Vue d'ensemble
  Cette migration étend le système de profil recruteur en ajoutant de nouveaux champs
  pour enrichir les informations personnelles et professionnelles, tout en maintenant
  la rétrocompatibilité totale avec les données existantes.

  ## 1. Nouveaux champs - Table `profiles`
    - `first_name` (text, nullable) - Prénom du recruteur
    - `last_name` (text, nullable) - Nom de famille du recruteur
    - `professional_email` (text, nullable) - Email professionnel distinct du login
    - `profile_visibility` (text, default 'public') - Visibilité du profil (public/private)

  ## 2. Nouveaux champs - Table `companies`
    - `company_type` (text, nullable) - Type d'entreprise (privée, publique, ONG, startup, cabinet, etc.)
    - `origin_country` (text, nullable) - Pays d'origine ou groupe

  ## 3. Nouveaux champs - Table `recruiter_profiles`
    - `recruitment_role` (text, nullable) - Rôle dans le recrutement (RH interne, cabinet, consultant)

  ## 4. Sécurité
    - Maintien de toutes les politiques RLS existantes
    - Aucune modification des permissions actuelles
    - Les nouveaux champs sont nullable pour garantir la rétrocompatibilité

  ## 5. Notes importantes
    - Tous les champs sont nullable pour ne pas affecter les données existantes
    - Aucune perte de données
    - Compatibilité ascendante garantie
    - Les valeurs par défaut sont définies uniquement pour les nouveaux enregistrements
*/

-- =====================================================
-- 1. Extension de la table profiles
-- =====================================================

-- Ajouter les champs prénom/nom (nullable pour rétrocompatibilité)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
END $$;

-- Ajouter l'email professionnel distinct
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'professional_email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN professional_email text;
  END IF;
END $$;

-- Ajouter la visibilité du profil
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_visibility'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_visibility text DEFAULT 'public';
  END IF;
END $$;

-- Créer un index pour la recherche par email professionnel
CREATE INDEX IF NOT EXISTS idx_profiles_professional_email ON profiles(professional_email);

-- =====================================================
-- 2. Extension de la table companies
-- =====================================================

-- Ajouter le type d'entreprise
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'company_type'
  ) THEN
    ALTER TABLE companies ADD COLUMN company_type text;
  END IF;
END $$;

-- Ajouter le pays d'origine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'origin_country'
  ) THEN
    ALTER TABLE companies ADD COLUMN origin_country text;
  END IF;
END $$;

-- Créer un index pour faciliter les filtres par type et pays
CREATE INDEX IF NOT EXISTS idx_companies_company_type ON companies(company_type);
CREATE INDEX IF NOT EXISTS idx_companies_origin_country ON companies(origin_country);

-- =====================================================
-- 3. Extension de la table recruiter_profiles
-- =====================================================

-- Ajouter le rôle dans le recrutement
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'recruiter_profiles' AND column_name = 'recruitment_role'
  ) THEN
    ALTER TABLE recruiter_profiles ADD COLUMN recruitment_role text;
  END IF;
END $$;

-- Créer un index pour faciliter les filtres par rôle
CREATE INDEX IF NOT EXISTS idx_recruiter_profiles_recruitment_role ON recruiter_profiles(recruitment_role);

-- =====================================================
-- 4. Commentaires sur les colonnes (documentation)
-- =====================================================

COMMENT ON COLUMN profiles.first_name IS 'Prénom du recruteur';
COMMENT ON COLUMN profiles.last_name IS 'Nom de famille du recruteur';
COMMENT ON COLUMN profiles.professional_email IS 'Email professionnel distinct de l''email de connexion';
COMMENT ON COLUMN profiles.profile_visibility IS 'Visibilité du profil: public (visible dans CVthèque) ou private (interne uniquement)';

COMMENT ON COLUMN companies.company_type IS 'Type d''entreprise: privée, publique, ONG, startup, cabinet de recrutement, etc.';
COMMENT ON COLUMN companies.origin_country IS 'Pays d''origine de l''entreprise ou groupe d''appartenance';

COMMENT ON COLUMN recruiter_profiles.recruitment_role IS 'Rôle dans le recrutement: RH interne, cabinet de recrutement, consultant RH, etc.';

-- =====================================================
-- 5. Fonction d'aide pour la migration des données
-- =====================================================

-- Fonction optionnelle pour aider à peupler first_name/last_name depuis full_name
CREATE OR REPLACE FUNCTION split_full_name_to_first_last()
RETURNS void AS $$
BEGIN
  -- Cette fonction peut être appelée manuellement si nécessaire
  -- Elle ne modifie que les profils où first_name et last_name sont NULL
  UPDATE profiles
  SET
    first_name = SPLIT_PART(full_name, ' ', 1),
    last_name = CASE
      WHEN LENGTH(TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))) > 0
      THEN TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
      ELSE NULL
    END
  WHERE
    (first_name IS NULL OR last_name IS NULL)
    AND full_name IS NOT NULL
    AND TRIM(full_name) != ''
    AND user_type = 'recruiter';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION split_full_name_to_first_last() IS 'Fonction optionnelle pour peupler first_name/last_name depuis full_name existant';
