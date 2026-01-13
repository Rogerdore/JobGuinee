/*
  # Correction des Compteurs - Contraintes et Triggers Automatiques

  1. Contraintes UNIQUE
    - Ajoute contrainte UNIQUE sur (candidate_id, job_id) dans applications
    - Empêche les doublons de candidatures (race condition fix)

  2. Indexes de Performance
    - Index sur applications(job_id, status) pour les queries recruteur
    - Index sur applications(candidate_id, applied_at) pour historique candidat
    - Index sur candidate_stats_logs(viewer_fingerprint, created_at) pour anti-spam

  3. Triggers Automatiques
    - Trigger pour incrémenter jobs.applications_count sur INSERT applications
    - Trigger pour incrémenter candidate_stats.applications_count
    - Trigger pour logger toutes les candidatures dans candidate_stats_logs

  4. Sécurité
    - Tous les triggers sont SECURITY DEFINER
    - Logs d'audit pour toutes les actions
*/

-- 1. CONTRAINTES UNIQUE (Empêcher doublons)
-- =============================================

-- Vérifier si la contrainte existe déjà avant de l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'applications_candidate_job_unique'
  ) THEN
    ALTER TABLE applications
    ADD CONSTRAINT applications_candidate_job_unique
    UNIQUE (candidate_id, job_id);
    
    RAISE NOTICE 'Contrainte UNIQUE applications_candidate_job_unique ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte UNIQUE applications_candidate_job_unique existe déjà';
  END IF;
END $$;

-- 2. INDEXES DE PERFORMANCE
-- =============================================

-- Index pour requêtes recruteur (dashboard, filtres par statut)
CREATE INDEX IF NOT EXISTS idx_applications_job_id_status
ON applications(job_id, status) WHERE status IS NOT NULL;

-- Index pour historique candidat (dashboard candidat, tri par date)
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id_applied
ON applications(candidate_id, applied_at DESC);

-- Index pour anti-spam (lookup rapide des vues récentes)
CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_fingerprint_date
ON candidate_stats_logs(viewer_fingerprint, created_at DESC)
WHERE viewer_fingerprint IS NOT NULL;

-- Index pour stats par type d'événement
CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_type_status
ON candidate_stats_logs(stat_type, status, created_at DESC);

-- Index pour retrouver les logs d'un candidat
CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_candidate_id
ON candidate_stats_logs(candidate_id, created_at DESC)
WHERE candidate_id IS NOT NULL;

-- 3. TRIGGERS AUTOMATIQUES POUR COMPTEURS
-- =============================================

-- Trigger 1: Incrémenter jobs.applications_count
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Incrémenter le compteur dans la table jobs
  UPDATE jobs
  SET applications_count = COALESCE(applications_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.job_id;
  
  RETURN NEW;
END;
$$;

-- Créer le trigger seulement s'il n'existe pas déjà
DROP TRIGGER IF EXISTS trigger_update_job_applications_count ON applications;

CREATE TRIGGER trigger_update_job_applications_count
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_count();

-- Trigger 2: Incrémenter candidate_stats.applications_count
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION update_candidate_applications_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Incrémenter ou créer le compteur dans candidate_stats
  INSERT INTO candidate_stats (candidate_id, applications_count, updated_at)
  VALUES (NEW.candidate_id, 1, now())
  ON CONFLICT (candidate_id) DO UPDATE
  SET applications_count = candidate_stats.applications_count + 1,
      updated_at = now();

  -- Logger l'événement dans candidate_stats_logs
  INSERT INTO candidate_stats_logs (
    candidate_id,
    stat_type,
    source,
    related_id,
    status,
    metadata,
    created_at
  ) VALUES (
    NEW.candidate_id,
    'application',
    'applications_trigger',
    NEW.job_id,
    'success',
    jsonb_build_object(
      'application_id', NEW.id,
      'workflow_stage', NEW.workflow_stage,
      'ai_matching_score', NEW.ai_matching_score
    ),
    now()
  );

  RETURN NEW;
END;
$$;

-- Créer le trigger seulement s'il n'existe pas déjà
DROP TRIGGER IF EXISTS trigger_update_candidate_applications_count ON applications;

CREATE TRIGGER trigger_update_candidate_applications_count
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION update_candidate_applications_count();

-- 4. FONCTION DE RECALCUL DES COMPTEURS (Utilitaire)
-- ===================================================

CREATE OR REPLACE FUNCTION recalculate_applications_counters()
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_jobs_updated int := 0;
  v_candidates_updated int := 0;
BEGIN
  -- Recalculer jobs.applications_count
  UPDATE jobs j
  SET applications_count = (
    SELECT COUNT(*)
    FROM applications a
    WHERE a.job_id = j.id
  ),
  updated_at = now()
  WHERE id IN (SELECT DISTINCT job_id FROM applications);
  
  GET DIAGNOSTICS v_jobs_updated = ROW_COUNT;

  -- Recalculer candidate_stats.applications_count
  INSERT INTO candidate_stats (candidate_id, applications_count, updated_at)
  SELECT 
    candidate_id,
    COUNT(*) as app_count,
    now()
  FROM applications
  GROUP BY candidate_id
  ON CONFLICT (candidate_id) DO UPDATE
  SET applications_count = EXCLUDED.applications_count,
      updated_at = now();
  
  GET DIAGNOSTICS v_candidates_updated = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'jobs_updated', v_jobs_updated,
    'candidates_updated', v_candidates_updated,
    'message', format('Recalcul terminé: %s jobs, %s candidats', v_jobs_updated, v_candidates_updated)
  );
END;
$$;

COMMENT ON FUNCTION recalculate_applications_counters() IS 
'Utilitaire pour recalculer tous les compteurs de candidatures si désynchronisation';

-- 5. RECALCULER LES COMPTEURS EXISTANTS
-- ======================================

-- Recalculer immédiatement pour synchroniser les données existantes
SELECT recalculate_applications_counters();

-- 6. FONCTION DE VALIDATION DES COMPTEURS
-- ========================================

CREATE OR REPLACE FUNCTION validate_counters_integrity()
RETURNS TABLE (
  counter_name text,
  expected_value bigint,
  actual_value bigint,
  is_synchronized boolean,
  discrepancy bigint
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validation 1: jobs.applications_count
  RETURN QUERY
  SELECT
    'jobs.applications_count'::text as counter_name,
    COUNT(a.id) as expected_value,
    COALESCE(SUM(j.applications_count), 0) as actual_value,
    COUNT(a.id) = COALESCE(SUM(j.applications_count), 0) as is_synchronized,
    COUNT(a.id) - COALESCE(SUM(j.applications_count), 0) as discrepancy
  FROM jobs j
  LEFT JOIN applications a ON a.job_id = j.id;

  -- Validation 2: candidate_stats.applications_count
  RETURN QUERY
  SELECT
    'candidate_stats.applications_count'::text as counter_name,
    COUNT(a.id) as expected_value,
    COALESCE(SUM(cs.applications_count), 0) as actual_value,
    COUNT(a.id) = COALESCE(SUM(cs.applications_count), 0) as is_synchronized,
    COUNT(a.id) - COALESCE(SUM(cs.applications_count), 0) as discrepancy
  FROM applications a
  LEFT JOIN candidate_stats cs ON cs.candidate_id = a.candidate_id;

  -- Validation 3: jobs.views_count vs logs
  RETURN QUERY
  SELECT
    'jobs.views_count'::text as counter_name,
    COUNT(csl.id) as expected_value,
    COALESCE(SUM(j.views_count), 0) as actual_value,
    COUNT(csl.id) = COALESCE(SUM(j.views_count), 0) as is_synchronized,
    COUNT(csl.id) - COALESCE(SUM(j.views_count), 0) as discrepancy
  FROM candidate_stats_logs csl
  RIGHT JOIN jobs j ON true
  WHERE csl.stat_type = 'job_view' AND csl.status = 'success';

  RETURN;
END;
$$;

COMMENT ON FUNCTION validate_counters_integrity() IS
'Valide que tous les compteurs sont synchronisés avec les données réelles';

-- 7. LOGS ET NOTIFICATIONS
-- ========================

-- Logger cette migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration compteurs appliquée avec succès';
  RAISE NOTICE '✅ Contrainte UNIQUE ajoutée sur applications(candidate_id, job_id)';
  RAISE NOTICE '✅ Indexes de performance créés';
  RAISE NOTICE '✅ Triggers automatiques installés';
  RAISE NOTICE '✅ Compteurs recalculés et synchronisés';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Pour valider l''intégrité: SELECT * FROM validate_counters_integrity();';
  RAISE NOTICE '🔄 Pour recalculer manuellement: SELECT recalculate_applications_counters();';
END $$;
