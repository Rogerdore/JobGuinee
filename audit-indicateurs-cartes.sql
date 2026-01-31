/*
  SCRIPT D'AUDIT - INDICATEURS DES CARTES D'OFFRES

  Ce script permet de vérifier l'état réel des compteurs
  et de les comparer avec la réalité des données.

  À exécuter dans la console Supabase SQL Editor
*/

-- =============================================
-- 1. AUDIT COMPLET DES COMPTEURS
-- =============================================

SELECT
  j.id,
  j.title,
  j.created_at,
  j.status,

  -- Compteurs stockés
  j.views_count as compteur_vues_stocke,
  j.applications_count as compteur_candidatures_stocke,
  j.saves_count as compteur_favoris_stocke,
  j.comments_count as compteur_commentaires_stocke,

  -- Compteurs calculés (réalité)
  (SELECT COUNT(*)
   FROM candidate_stats_logs
   WHERE stat_type = 'job_view'
     AND related_id = j.id
     AND status = 'success'
  ) as vues_calculees,

  (SELECT COUNT(*)
   FROM applications
   WHERE job_id = j.id
  ) as candidatures_calculees,

  (SELECT COUNT(*)
   FROM saved_jobs
   WHERE job_id = j.id
  ) as favoris_calcules,

  (SELECT COUNT(*)
   FROM job_comments
   WHERE job_id = j.id
     AND parent_id IS NULL
  ) as commentaires_calcules,

  -- Différences (0 = OK, >0 = désynchronisation)
  j.views_count - COALESCE((SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND related_id = j.id AND status = 'success'), 0) as diff_vues,
  j.applications_count - COALESCE((SELECT COUNT(*) FROM applications WHERE job_id = j.id), 0) as diff_candidatures,
  j.saves_count - COALESCE((SELECT COUNT(*) FROM saved_jobs WHERE job_id = j.id), 0) as diff_favoris,
  j.comments_count - COALESCE((SELECT COUNT(*) FROM job_comments WHERE job_id = j.id AND parent_id IS NULL), 0) as diff_commentaires

FROM jobs j
WHERE j.status = 'published'
ORDER BY j.created_at DESC
LIMIT 20;

-- =============================================
-- 2. STATISTIQUES GLOBALES
-- =============================================

SELECT
  'VUES' as indicateur,
  SUM(j.views_count) as total_stocke,
  (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND status = 'success') as total_calcule,
  SUM(j.views_count) - (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND status = 'success') as difference
FROM jobs j
WHERE j.status = 'published'

UNION ALL

SELECT
  'CANDIDATURES' as indicateur,
  SUM(j.applications_count) as total_stocke,
  (SELECT COUNT(*) FROM applications) as total_calcule,
  SUM(j.applications_count) - (SELECT COUNT(*) FROM applications) as difference
FROM jobs j
WHERE j.status = 'published'

UNION ALL

SELECT
  'FAVORIS' as indicateur,
  SUM(j.saves_count) as total_stocke,
  (SELECT COUNT(*) FROM saved_jobs) as total_calcule,
  SUM(j.saves_count) - (SELECT COUNT(*) FROM saved_jobs) as difference
FROM jobs j
WHERE j.status = 'published'

UNION ALL

SELECT
  'COMMENTAIRES' as indicateur,
  SUM(j.comments_count) as total_stocke,
  (SELECT COUNT(*) FROM job_comments WHERE parent_id IS NULL) as total_calcule,
  SUM(j.comments_count) - (SELECT COUNT(*) FROM job_comments WHERE parent_id IS NULL) as difference
FROM jobs j
WHERE j.status = 'published';

-- =============================================
-- 3. JOBS AVEC DÉSYNCHRONISATION
-- =============================================

WITH job_diffs AS (
  SELECT
    j.id,
    j.title,
    j.views_count - COALESCE((SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND related_id = j.id AND status = 'success'), 0) as diff_vues,
    j.applications_count - COALESCE((SELECT COUNT(*) FROM applications WHERE job_id = j.id), 0) as diff_candidatures,
    j.saves_count - COALESCE((SELECT COUNT(*) FROM saved_jobs WHERE job_id = j.id), 0) as diff_favoris,
    j.comments_count - COALESCE((SELECT COUNT(*) FROM job_comments WHERE job_id = j.id AND parent_id IS NULL), 0) as diff_commentaires
  FROM jobs j
  WHERE j.status = 'published'
)
SELECT
  id,
  title,
  diff_vues,
  diff_candidatures,
  diff_favoris,
  diff_commentaires
FROM job_diffs
WHERE diff_vues != 0
   OR diff_candidatures != 0
   OR diff_favoris != 0
   OR diff_commentaires != 0
ORDER BY ABS(diff_vues) + ABS(diff_candidatures) + ABS(diff_favoris) + ABS(diff_commentaires) DESC
LIMIT 10;

-- =============================================
-- 4. VÉRIFIER L'ÉTAT DE LA TABLE JOB_VIEWS
-- =============================================

SELECT
  'job_views (table obsolète)' as table_name,
  COUNT(*) as total_lignes,
  MIN(viewed_at) as premiere_vue,
  MAX(viewed_at) as derniere_vue
FROM job_views

UNION ALL

SELECT
  'candidate_stats_logs (table active)' as table_name,
  COUNT(*) as total_lignes,
  MIN(created_at) as premiere_vue,
  MAX(created_at) as derniere_vue
FROM candidate_stats_logs
WHERE stat_type = 'job_view';

-- =============================================
-- 5. ANTI-SPAM: VUES BLOQUÉES vs ACCEPTÉES
-- =============================================

SELECT
  status,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as pourcentage
FROM candidate_stats_logs
WHERE stat_type = 'job_view'
GROUP BY status
ORDER BY total DESC;

-- =============================================
-- 6. TOP 10 JOBS PAR INDICATEUR
-- =============================================

-- Top 10 jobs les plus vus
SELECT 'VUES' as indicateur, title, views_count as valeur
FROM jobs
WHERE status = 'published'
ORDER BY views_count DESC NULLS LAST
LIMIT 10;

-- Top 10 jobs avec le plus de candidatures
SELECT 'CANDIDATURES' as indicateur, title, applications_count as valeur
FROM jobs
WHERE status = 'published'
ORDER BY applications_count DESC NULLS LAST
LIMIT 10;

-- Top 10 jobs les plus favoris
SELECT 'FAVORIS' as indicateur, title, saves_count as valeur
FROM jobs
WHERE status = 'published'
ORDER BY saves_count DESC NULLS LAST
LIMIT 10;

-- Top 10 jobs avec le plus de commentaires
SELECT 'COMMENTAIRES' as indicateur, title, comments_count as valeur
FROM jobs
WHERE status = 'published'
ORDER BY comments_count DESC NULLS LAST
LIMIT 10;

-- =============================================
-- 7. RECALCULER TOUS LES COMPTEURS (SI NÉCESSAIRE)
-- =============================================

-- ATTENTION: Décommenter seulement si vous voulez recalculer les compteurs

/*
-- Recalculer applications_count
SELECT recalculate_applications_counters();

-- Recalculer saves_count
UPDATE jobs
SET saves_count = (
  SELECT COUNT(*)
  FROM saved_jobs
  WHERE saved_jobs.job_id = jobs.id
);

-- Recalculer comments_count
UPDATE jobs j
SET comments_count = (
  SELECT COUNT(*)
  FROM job_comments jc
  WHERE jc.job_id = j.id
    AND jc.parent_id IS NULL
);

-- Recalculer views_count depuis candidate_stats_logs
UPDATE jobs j
SET views_count = (
  SELECT COUNT(*)
  FROM candidate_stats_logs csl
  WHERE csl.stat_type = 'job_view'
    AND csl.related_id = j.id
    AND csl.status = 'success'
);

-- Vérifier le résultat
SELECT 'Recalcul terminé' as message;
*/

-- =============================================
-- 8. VÉRIFIER LES TRIGGERS
-- =============================================

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('applications', 'saved_jobs', 'job_comments', 'job_views')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- =============================================
-- 9. VÉRIFIER LES FONCTIONS RPC
-- =============================================

SELECT
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'track_job_view_secure',
    'recalculate_applications_counters',
    'get_candidate_stats',
    'toggle_save_job'
  )
ORDER BY routine_name;

-- =============================================
-- 10. RÉSUMÉ FINAL
-- =============================================

SELECT
  'Audit terminé' as message,
  (SELECT COUNT(*) FROM jobs WHERE status = 'published') as total_jobs_publies,
  (SELECT COUNT(*) FROM applications) as total_candidatures,
  (SELECT COUNT(*) FROM saved_jobs) as total_favoris,
  (SELECT COUNT(*) FROM job_comments WHERE parent_id IS NULL) as total_commentaires_parents,
  (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND status = 'success') as total_vues_valides,
  (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND status = 'blocked_spam') as total_vues_bloquees;
