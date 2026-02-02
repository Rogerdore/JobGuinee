-- Script de test pour vérifier les compteurs en temps réel

-- 1. Identifier un candidat
SELECT
  id,
  email,
  full_name,
  user_type
FROM profiles
WHERE user_type = 'candidate'
AND email = 'doreroger1986@gmail.com';

-- Résultat attendu: UUID du candidat Candidat2 Doré

-- 2. Vérifier les données réelles dans les tables
SELECT
  '1. Offres consultées' as compteur,
  COUNT(DISTINCT job_id) as valeur_reelle
FROM job_clicks
WHERE user_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33'

UNION ALL

SELECT
  '2. Candidatures' as compteur,
  COUNT(*) as valeur_reelle
FROM applications
WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33'

UNION ALL

SELECT
  '3. Vues de profil' as compteur,
  COUNT(*) as valeur_reelle
FROM profile_views
WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33'

UNION ALL

SELECT
  '4. Profils achetés' as compteur,
  COUNT(*) as valeur_reelle
FROM profile_purchases
WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33'

UNION ALL

SELECT
  '5. Formations' as compteur,
  COUNT(*) as valeur_reelle
FROM formation_enrollments
WHERE user_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33';

-- 3. Tester la fonction get_candidate_stats
SELECT
  (get_candidate_stats('089942e6-acad-4e28-b5fe-089ad8c1fb33'::uuid))::jsonb ->> 'job_views_count' as offres_consultees,
  (get_candidate_stats('089942e6-acad-4e28-b5fe-089ad8c1fb33'::uuid))::jsonb ->> 'applications_count' as candidatures,
  (get_candidate_stats('089942e6-acad-4e28-b5fe-089ad8c1fb33'::uuid))::jsonb ->> 'profile_views_count' as vues_profil,
  (get_candidate_stats('089942e6-acad-4e28-b5fe-089ad8c1fb33'::uuid))::jsonb ->> 'purchases_count' as profils_achetes,
  (get_candidate_stats('089942e6-acad-4e28-b5fe-089ad8c1fb33'::uuid))::jsonb ->> 'formations_count' as formations;

-- 4. Comparer candidate_stats vs vraies tables
SELECT
  'candidate_stats (OLD)' as source,
  job_views_count,
  applications_count,
  profile_views_count,
  purchases_count,
  formations_count
FROM candidate_stats
WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33'

UNION ALL

SELECT
  'Vraies tables (NEW)' as source,
  (SELECT COUNT(DISTINCT job_id) FROM job_clicks WHERE user_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33') as job_views_count,
  (SELECT COUNT(*) FROM applications WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33') as applications_count,
  (SELECT COUNT(*) FROM profile_views WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33') as profile_views_count,
  (SELECT COUNT(*) FROM profile_purchases WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33') as purchases_count,
  (SELECT COUNT(*) FROM formation_enrollments WHERE user_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33') as formations_count;

-- 5. Tester le tracking d'une nouvelle vue
-- Note: Utiliser l'Edge Function en production
-- SELECT track_job_view_secure(
--   '67c1c25f-7571-43d0-9198-b14b786aa3f2'::uuid,
--   'test_session_manual',
--   'test_ip_hash',
--   'Mozilla/5.0 Test'
-- );

-- 6. Vérifier l'historique des vues
SELECT
  j.title as offre,
  jc.clicked_at as consulte_le,
  jc.session_id
FROM job_clicks jc
JOIN jobs j ON j.id = jc.job_id
WHERE jc.user_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33'
ORDER BY jc.clicked_at DESC
LIMIT 10;

-- 7. Vérifier les logs de tracking
SELECT
  stat_type,
  status,
  delta,
  created_at,
  metadata
FROM candidate_stats_logs
WHERE candidate_id = '089942e6-acad-4e28-b5fe-089ad8c1fb33'
  AND stat_type = 'job_view'
ORDER BY created_at DESC
LIMIT 10;
