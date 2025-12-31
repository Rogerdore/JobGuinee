/*
  # Normalisation et optimisation table jobs - Version 3
  
  ## Changements principaux
  1. **Nettoyage données** : Emails vides mis à NULL
  2. **Drop vue jobs_normalized** temporairement
  3. **Consolidation deadline** : Migrer données vers application_deadline
  4. **Suppression colonnes orphelines** : salary_min, salary_max, diploma_required, deadline
  5. **Recréation vue jobs_normalized** sans colonnes supprimées
  6. **Ajout contraintes de validation** (avec gestion données existantes)
  7. **Ajout index pour performance**
  
  ## Sécurité
  - Backup recommandé avant exécution
  - Données nettoyées avant contraintes
  - Vue recréée correctement
*/

-- Étape 0 : Nettoyer les données existantes
UPDATE jobs SET application_email = NULL WHERE application_email = '' OR LENGTH(TRIM(application_email)) = 0;

-- Étape 1 : Drop temporairement la vue jobs_normalized
DROP VIEW IF EXISTS jobs_normalized CASCADE;

-- Étape 2 : Consolider les données deadline vers application_deadline
UPDATE jobs
SET application_deadline = COALESCE(application_deadline, deadline)
WHERE application_deadline IS NULL AND deadline IS NOT NULL;

-- Étape 3 : Supprimer les colonnes après migration
ALTER TABLE jobs DROP COLUMN IF EXISTS deadline;
ALTER TABLE jobs DROP COLUMN IF EXISTS salary_min;
ALTER TABLE jobs DROP COLUMN IF EXISTS salary_max;
ALTER TABLE jobs DROP COLUMN IF EXISTS diploma_required;

-- Étape 4 : Recréer la vue jobs_normalized sans les colonnes supprimées
CREATE VIEW jobs_normalized AS
SELECT 
  id,
  user_id,
  company_id,
  title,
  description,
  location,
  contract_type,
  status,
  created_at,
  updated_at,
  experience_level,
  sector,
  education_level,
  views_count,
  applications_count,
  is_featured,
  is_urgent,
  requirements,
  responsibilities,
  benefits,
  nationality_required,
  languages,
  keywords,
  department,
  ai_generated,
  hiring_manager_id,
  cover_letter_required,
  category,
  position_count,
  position_level,
  profile_sought,
  company_logo_url,
  company_description,
  company_website,
  salary_range,
  salary_type,
  application_email,
  receive_in_platform,
  required_documents,
  application_instructions,
  visibility,
  is_premium,
  announcement_language,
  auto_share,
  publication_duration,
  auto_renewal,
  legal_compliance,
  application_deadline,
  submitted_at,
  moderated_at,
  moderated_by,
  rejection_reason,
  moderation_notes,
  published_by_admin,
  admin_publisher_id,
  publication_source,
  partner_id,
  partner_type,
  partner_name,
  partner_email,
  partner_logo_url,
  application_mode,
  external_apply_url,
  admin_notes,
  application_deadline AS deadline_normalized,
  views_count AS view_count_normalized,
  keywords AS required_skills_normalized
FROM jobs;

-- Étape 5 : Ajouter contrainte sur status (ENUM)
DO $$
BEGIN
  ALTER TABLE jobs DROP CONSTRAINT IF EXISTS check_status;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE jobs ADD CONSTRAINT check_status
  CHECK (status IN ('draft', 'pending', 'published', 'rejected', 'archived'));

-- Étape 6 : Ajouter contrainte sur format email (seulement si non NULL et non vide)
DO $$
BEGIN
  ALTER TABLE jobs DROP CONSTRAINT IF EXISTS check_email_format;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE jobs ADD CONSTRAINT check_email_format
  CHECK (
    application_email IS NULL OR
    LENGTH(TRIM(application_email)) = 0 OR
    application_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'
  );

-- Étape 7 : Ajouter contrainte deadline (tolérance 90 jours pour données existantes)
DO $$
BEGIN
  ALTER TABLE jobs DROP CONSTRAINT IF EXISTS check_deadline_future;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE jobs ADD CONSTRAINT check_deadline_future
  CHECK (
    application_deadline IS NULL OR
    application_deadline >= CURRENT_DATE - INTERVAL '90 days'
  );

-- Étape 8 : Créer index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status_created ON jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category) WHERE category IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_sector ON jobs(sector) WHERE sector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_user_id_status ON jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(application_deadline) WHERE application_deadline IS NOT NULL;
