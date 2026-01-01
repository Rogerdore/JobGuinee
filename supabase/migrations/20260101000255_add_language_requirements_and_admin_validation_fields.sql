/*
  # Ajout champs pour niveaux de langues et validation admin
  
  ## Changements
  1. **language_requirements** : JSONB pour stocker langues avec niveaux
     - Structure : [{language: string, level: string}]
  2. **auto_renewal_pending_admin** : BOOLEAN pour validation admin du renouvellement auto
     - Default: false
     - TRUE quand renouvellement demandé, en attente validation admin
  3. **use_profile_logo** : BOOLEAN pour indiquer l'utilisation du logo du profil
     - Default: false
     - TRUE = utiliser logo du profil recruteur
  
  ## Sécurité
  - Champs optionnels avec valeurs par défaut
  - Pas de migration de données nécessaire
  - Rétrocompatibilité maintenue avec colonne languages
*/

-- Ajouter colonne language_requirements (JSONB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'language_requirements'
  ) THEN
    ALTER TABLE jobs ADD COLUMN language_requirements JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Ajouter colonne auto_renewal_pending_admin (BOOLEAN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'auto_renewal_pending_admin'
  ) THEN
    ALTER TABLE jobs ADD COLUMN auto_renewal_pending_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Ajouter colonne use_profile_logo (BOOLEAN)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jobs' AND column_name = 'use_profile_logo'
  ) THEN
    ALTER TABLE jobs ADD COLUMN use_profile_logo BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Commentaires pour documentation
COMMENT ON COLUMN jobs.language_requirements IS 'Langues exigées avec niveaux - Format: [{language: string, level: string}]';
COMMENT ON COLUMN jobs.auto_renewal_pending_admin IS 'Renouvellement automatique en attente de validation admin';
COMMENT ON COLUMN jobs.use_profile_logo IS 'Indique si le logo du profil recruteur doit être utilisé';
