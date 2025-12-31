/*
  # Normalisation des champs de la table Jobs - JobGuinée V6 Étape 2/6
  
  ## Vue d'ensemble
  Cette migration corrige les incohérences de nommage dans la table jobs :
  - Consolidation de `deadline` et `application_deadline` -> utiliser uniquement `deadline`
  - Documentation des champs canoniques pour éviter confusion
  - Préparation à la dépréciation de `application_deadline`
  
  ## Problèmes identifiés
  1. **Doublon de champs** : `deadline` ET `application_deadline` existent tous les deux
  2. **Confusion dans le code** : certains fichiers utilisent l'un, d'autres l'autre
  3. **Incohérence TypeScript** : les types ne reflètent pas la réalité de la DB
  
  ## Actions
  1. Migrer les données de `application_deadline` vers `deadline` si nécessaire
  2. Déprécier `application_deadline` (commentaire + trigger d'avertissement)
  3. Ajouter commentaires sur les champs canoniques
  
  ## Champs canoniques (après migration)
  - `deadline` (date) - Date limite de candidature
  - `views_count` (integer) - Nombre de vues
  - `applications_count` (integer) - Nombre de candidatures
  - `keywords` (text[]) - Mots-clés / compétences requises
  - `languages` (text[]) - Langues requises
  
  ## Note importante
  Pour compatibilité temporaire, `application_deadline` reste en DB mais est marqué
  comme deprecated. Le code frontend doit être mis à jour pour utiliser `deadline`.
*/

-- =====================================================
-- 1. MIGRER LES DONNÉES DE application_deadline VERS deadline
-- =====================================================

-- Copier application_deadline vers deadline si deadline est NULL
UPDATE jobs
SET deadline = application_deadline
WHERE deadline IS NULL 
AND application_deadline IS NOT NULL;

-- Copier deadline vers application_deadline si application_deadline est NULL (pour compat inverse)
UPDATE jobs
SET application_deadline = deadline
WHERE application_deadline IS NULL 
AND deadline IS NOT NULL;

-- =====================================================
-- 2. AJOUTER COMMENTAIRES SUR LES CHAMPS CANONIQUES
-- =====================================================

COMMENT ON COLUMN jobs.deadline IS 
'Date limite de candidature (champ canonique). Utiliser ce champ au lieu de application_deadline.';

COMMENT ON COLUMN jobs.application_deadline IS 
'DEPRECATED: Utiliser deadline à la place. Ce champ est maintenu pour compatibilité temporaire uniquement.';

COMMENT ON COLUMN jobs.views_count IS 
'Nombre de vues du job (champ canonique). Incrémenté automatiquement à chaque consultation.';

COMMENT ON COLUMN jobs.applications_count IS 
'Nombre de candidatures reçues (champ canonique). Mis à jour par trigger lors des INSERT/DELETE sur applications.';

COMMENT ON COLUMN jobs.keywords IS 
'Mots-clés et compétences requises pour le poste (champ canonique). Utilisé pour le matching IA et les recherches.';

COMMENT ON COLUMN jobs.languages IS 
'Langues requises pour le poste (champ canonique). Format: array de codes ou noms de langues.';

-- =====================================================
-- 3. CRÉER TRIGGER DE SYNCHRONISATION (temporaire)
-- =====================================================

-- Fonction pour maintenir la synchro entre deadline et application_deadline
CREATE OR REPLACE FUNCTION sync_job_deadline_fields()
RETURNS TRIGGER AS $$
BEGIN
  -- Si deadline est modifié, copier vers application_deadline
  IF NEW.deadline IS DISTINCT FROM OLD.deadline THEN
    NEW.application_deadline := NEW.deadline;
  END IF;
  
  -- Si application_deadline est modifié et deadline est NULL, copier vers deadline
  IF NEW.application_deadline IS DISTINCT FROM OLD.application_deadline AND NEW.deadline IS NULL THEN
    NEW.deadline := NEW.application_deadline;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_sync_job_deadline ON jobs;
CREATE TRIGGER trigger_sync_job_deadline
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION sync_job_deadline_fields();

-- =====================================================
-- 4. VÉRIFIER L'EXISTENCE DU TRIGGER applications_count
-- =====================================================

-- S'assurer que le trigger pour applications_count existe
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs 
    SET applications_count = applications_count + 1 
    WHERE id = NEW.job_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs 
    SET applications_count = GREATEST(0, applications_count - 1)
    WHERE id = OLD.job_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_update_job_applications_count'
  ) THEN
    CREATE TRIGGER trigger_update_job_applications_count
      AFTER INSERT OR DELETE ON applications
      FOR EACH ROW
      EXECUTE FUNCTION update_job_applications_count();
  END IF;
END $$;

-- =====================================================
-- 5. CRÉER VUE POUR COMPATIBILITÉ (optionnel)
-- =====================================================

-- Vue qui expose les champs normalisés avec alias pour compat
CREATE OR REPLACE VIEW jobs_normalized AS
SELECT 
  *,
  deadline as application_deadline_normalized,
  views_count as view_count_normalized,
  keywords as required_skills_normalized
FROM jobs;

COMMENT ON VIEW jobs_normalized IS 
'Vue de compatibilité exposant les champs normalisés avec leurs anciens noms en alias. 
Utiliser cette vue temporairement si nécessaire pendant la migration du code.';

-- =====================================================
-- 6. FONCTION HELPER POUR VALIDATION
-- =====================================================

-- Fonction pour valider qu'un job a les champs requis
CREATE OR REPLACE FUNCTION validate_job_required_fields(job_id uuid)
RETURNS TABLE(
  is_valid boolean,
  missing_fields text[]
) AS $$
DECLARE
  v_job jobs%ROWTYPE;
  v_missing text[] := ARRAY[]::text[];
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = job_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, ARRAY['job_not_found']::text[];
    RETURN;
  END IF;
  
  -- Vérifier les champs requis
  IF v_job.title IS NULL OR v_job.title = '' THEN
    v_missing := array_append(v_missing, 'title');
  END IF;
  
  IF v_job.description IS NULL OR v_job.description = '' THEN
    v_missing := array_append(v_missing, 'description');
  END IF;
  
  IF v_job.location IS NULL OR v_job.location = '' THEN
    v_missing := array_append(v_missing, 'location');
  END IF;
  
  IF v_job.contract_type IS NULL OR v_job.contract_type = '' THEN
    v_missing := array_append(v_missing, 'contract_type');
  END IF;
  
  -- Retourner le résultat
  RETURN QUERY SELECT 
    (array_length(v_missing, 1) IS NULL OR array_length(v_missing, 1) = 0),
    v_missing;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_job_required_fields IS 
'Valide qu un job possède tous les champs requis avant publication.';

-- =====================================================
-- 7. INDEX POUR PERFORMANCE
-- =====================================================

-- Index sur deadline pour les recherches de jobs actifs
CREATE INDEX IF NOT EXISTS idx_jobs_deadline 
ON jobs(deadline) 
WHERE status = 'published';

-- Index sur views_count pour les tris par popularité
CREATE INDEX IF NOT EXISTS idx_jobs_views_count_desc 
ON jobs(views_count DESC) 
WHERE status = 'published';

-- Index sur keywords pour les recherches full-text
CREATE INDEX IF NOT EXISTS idx_jobs_keywords_gin 
ON jobs USING gin(keywords);

-- Index sur languages pour les filtres
CREATE INDEX IF NOT EXISTS idx_jobs_languages_gin 
ON jobs USING gin(languages);

-- =====================================================
-- 8. STATISTIQUES POST-MIGRATION
-- =====================================================

-- Compter les jobs avec deadline
DO $$
DECLARE
  v_total_jobs integer;
  v_with_deadline integer;
  v_with_application_deadline integer;
  v_synced integer;
BEGIN
  SELECT COUNT(*) INTO v_total_jobs FROM jobs;
  SELECT COUNT(*) INTO v_with_deadline FROM jobs WHERE deadline IS NOT NULL;
  SELECT COUNT(*) INTO v_with_application_deadline FROM jobs WHERE application_deadline IS NOT NULL;
  SELECT COUNT(*) INTO v_synced FROM jobs WHERE deadline = application_deadline OR (deadline IS NULL AND application_deadline IS NULL);
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'STATISTIQUES POST-MIGRATION';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Total jobs: %', v_total_jobs;
  RAISE NOTICE 'Jobs avec deadline: %', v_with_deadline;
  RAISE NOTICE 'Jobs avec application_deadline: %', v_with_application_deadline;
  RAISE NOTICE 'Jobs synchronisés: %', v_synced;
  RAISE NOTICE '==============================================';
END $$;
