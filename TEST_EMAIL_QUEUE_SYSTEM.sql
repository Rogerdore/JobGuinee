-- ============================================================================
-- SCRIPT DE TEST COMPLET DU SYSTÈME DE FILE D'ATTENTE D'EMAILS
-- ============================================================================
-- Ce script teste TOUS les composants du système d'emails automatiques
-- Exécuter dans Supabase SQL Editor ou via psql
-- ============================================================================

-- PRÉPARATION : Nettoyer les tests précédents
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DÉBUT DES TESTS - %', now();
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- TEST 1 : Vérification de l'infrastructure
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- TEST 1 : Vérification de l''infrastructure ---';
END $$;

-- Vérifier que la fonction centrale existe
SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'enqueue_email')
    THEN '✓ Fonction enqueue_email existe'
    ELSE '✗ ERREUR : Fonction enqueue_email manquante'
  END as test_result;

-- Vérifier que tous les triggers existent
SELECT
  CASE
    WHEN COUNT(*) = 4
    THEN '✓ Tous les triggers email sont présents (4/4)'
    ELSE '✗ ERREUR : Triggers manquants (' || COUNT(*) || '/4)'
  END as test_result
FROM pg_trigger
WHERE tgname IN (
  'send_welcome_email_trigger',
  'trigger_send_application_confirmation',
  'trigger_send_recruiter_application_alert',
  'trigger_send_job_alerts'
);

-- Vérifier que tous les templates sont actifs
SELECT
  CASE
    WHEN COUNT(*) >= 5
    THEN '✓ Templates email actifs (' || COUNT(*) || ')'
    ELSE '✗ ERREUR : Templates manquants (' || COUNT(*) || '/5)'
  END as test_result
FROM email_templates
WHERE is_active = true;

-- Vérifier que la vue de monitoring existe
SELECT
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.views
      WHERE table_name = 'v_email_queue_monitoring'
    )
    THEN '✓ Vue de monitoring existe'
    ELSE '✗ ERREUR : Vue de monitoring manquante'
  END as test_result;

-- ============================================================================
-- TEST 2 : Test de la fonction centrale enqueue_email
-- ============================================================================

DO $$
DECLARE
  v_queue_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- TEST 2 : Test de la fonction enqueue_email ---';

  -- Test avec un template valide
  v_queue_id := enqueue_email(
    p_template_key := 'welcome_candidate',
    p_to_email := 'test-fonction@exemple.com',
    p_to_name := 'Test Fonction',
    p_variables := jsonb_build_object(
      'candidate_name', 'Test Fonction',
      'app_url', 'https://jobguinee-pro.com'
    ),
    p_priority := 5
  );

  IF v_queue_id IS NOT NULL THEN
    RAISE NOTICE '✓ enqueue_email fonctionne - ID retourné: %', v_queue_id;
  ELSE
    RAISE NOTICE '✗ ERREUR : enqueue_email a retourné NULL';
  END IF;

  -- Test avec un template invalide (ne doit pas bloquer)
  v_queue_id := enqueue_email(
    p_template_key := 'template_inexistant',
    p_to_email := 'test@exemple.com',
    p_to_name := 'Test',
    p_variables := '{}'::jsonb
  );

  IF v_queue_id IS NULL THEN
    RAISE NOTICE '✓ Template invalide géré correctement (retourne NULL)';
  ELSE
    RAISE NOTICE '✗ ERREUR : Template invalide devrait retourner NULL';
  END IF;

  -- Test avec email vide (ne doit pas bloquer)
  v_queue_id := enqueue_email(
    p_template_key := 'welcome_candidate',
    p_to_email := '',
    p_to_name := 'Test',
    p_variables := '{}'::jsonb
  );

  IF v_queue_id IS NULL THEN
    RAISE NOTICE '✓ Email vide géré correctement (retourne NULL)';
  ELSE
    RAISE NOTICE '✗ ERREUR : Email vide devrait retourner NULL';
  END IF;
END $$;

-- Vérifier que l'email de test est dans la queue
SELECT
  CASE
    WHEN COUNT(*) > 0
    THEN '✓ Email de test inséré dans la queue'
    ELSE '✗ ERREUR : Email de test non trouvé dans la queue'
  END as test_result
FROM email_queue
WHERE to_email = 'test-fonction@exemple.com';

-- ============================================================================
-- TEST 3 : Diagnostic du système
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- TEST 3 : Diagnostic du système ---';
END $$;

SELECT
  metric,
  count,
  details
FROM diagnose_email_queue()
ORDER BY
  CASE metric
    WHEN 'Total emails en attente' THEN 1
    WHEN 'Emails prêts à envoyer' THEN 2
    WHEN 'Emails envoyés (dernières 24h)' THEN 3
    WHEN 'Emails échoués (dernières 24h)' THEN 4
    WHEN 'Templates actifs' THEN 5
    WHEN 'Triggers actifs' THEN 6
  END;

-- ============================================================================
-- TEST 4 : Simulation complète d'inscription candidat
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'test-candidat-' || floor(random() * 1000000) || '@exemple.com';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- TEST 4 : Simulation inscription candidat ---';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: %', v_email;

  -- Simuler l'insertion dans auth.users (normalement fait par Supabase Auth)
  -- Note: Nous ne pouvons pas insérer directement dans auth.users
  -- Donc nous testons uniquement le trigger sur profiles

  -- Insérer un profil candidat (déclenche send_welcome_email_trigger)
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (v_user_id, v_email, 'Test Candidat Auto', 'candidate');

  RAISE NOTICE '✓ Profil candidat créé';

  -- Vérifier que l'email est dans la queue
  IF EXISTS (
    SELECT 1 FROM email_queue
    WHERE to_email = v_email
    AND template_id IN (
      SELECT id FROM email_templates WHERE template_key = 'welcome_candidate'
    )
  ) THEN
    RAISE NOTICE '✓ Email de bienvenue candidat dans la queue';
  ELSE
    RAISE NOTICE '✗ ERREUR : Email de bienvenue candidat non trouvé';
  END IF;

  -- Nettoyer
  DELETE FROM profiles WHERE id = v_user_id;
  DELETE FROM email_queue WHERE to_email = v_email;
  RAISE NOTICE '✓ Nettoyage effectué';
END $$;

-- ============================================================================
-- TEST 5 : Simulation inscription recruteur
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_email TEXT := 'test-recruteur-' || floor(random() * 1000000) || '@exemple.com';
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- TEST 5 : Simulation inscription recruteur ---';
  RAISE NOTICE 'User ID: %', v_user_id;
  RAISE NOTICE 'Email: %', v_email;

  -- Insérer un profil recruteur (déclenche send_welcome_email_trigger)
  INSERT INTO profiles (id, email, full_name, user_type, company_name)
  VALUES (v_user_id, v_email, 'Test Recruteur Auto', 'recruiter', 'Test Company');

  RAISE NOTICE '✓ Profil recruteur créé';

  -- Vérifier que l'email est dans la queue
  IF EXISTS (
    SELECT 1 FROM email_queue
    WHERE to_email = v_email
    AND template_id IN (
      SELECT id FROM email_templates WHERE template_key = 'welcome_recruiter'
    )
  ) THEN
    RAISE NOTICE '✓ Email de bienvenue recruteur dans la queue';
  ELSE
    RAISE NOTICE '✗ ERREUR : Email de bienvenue recruteur non trouvé';
  END IF;

  -- Nettoyer
  DELETE FROM profiles WHERE id = v_user_id;
  DELETE FROM email_queue WHERE to_email = v_email;
  RAISE NOTICE '✓ Nettoyage effectué';
END $$;

-- ============================================================================
-- TEST 6 : Simulation candidature (2 emails)
-- ============================================================================

DO $$
DECLARE
  v_candidate_id UUID;
  v_recruiter_id UUID;
  v_company_id UUID;
  v_job_id UUID;
  v_application_id UUID;
  v_candidate_email TEXT := 'test-candidat-app-' || floor(random() * 1000000) || '@exemple.com';
  v_recruiter_email TEXT := 'test-recruteur-app-' || floor(random() * 1000000) || '@exemple.com';
  v_ref_number TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- TEST 6 : Simulation candidature complète ---';

  -- Créer un candidat de test
  v_candidate_id := gen_random_uuid();
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (v_candidate_id, v_candidate_email, 'Test Candidat', 'candidate');
  RAISE NOTICE '✓ Candidat créé: %', v_candidate_email;

  -- Créer un recruteur de test
  v_recruiter_id := gen_random_uuid();
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (v_recruiter_id, v_recruiter_email, 'Test Recruteur', 'recruiter');
  RAISE NOTICE '✓ Recruteur créé: %', v_recruiter_email;

  -- Créer une compagnie de test
  INSERT INTO companies (name, created_by)
  VALUES ('Test Company Auto', v_recruiter_id)
  RETURNING id INTO v_company_id;
  RAISE NOTICE '✓ Compagnie créée';

  -- Créer une offre de test
  INSERT INTO jobs (
    title, description, location, job_type, status,
    recruiter_id, company_id, experience_level
  )
  VALUES (
    'Test Job Auto',
    'Description du test job',
    'Conakry',
    'CDI',
    'published',
    v_recruiter_id,
    v_company_id,
    'intermediate'
  )
  RETURNING id INTO v_job_id;
  RAISE NOTICE '✓ Offre créée';

  -- Supprimer les emails de bienvenue générés
  DELETE FROM email_queue
  WHERE to_email IN (v_candidate_email, v_recruiter_email);

  -- Créer une candidature (déclenche 2 triggers)
  INSERT INTO applications (
    job_id, candidate_id, recruiter_id, status
  )
  VALUES (
    v_job_id, v_candidate_id, v_recruiter_id, 'pending'
  )
  RETURNING id, reference_number INTO v_application_id, v_ref_number;
  RAISE NOTICE '✓ Candidature créée: %', v_ref_number;

  -- Attendre un peu pour que les triggers se terminent
  PERFORM pg_sleep(0.5);

  -- Vérifier email de confirmation au candidat
  IF EXISTS (
    SELECT 1 FROM email_queue
    WHERE to_email = v_candidate_email
    AND template_id IN (
      SELECT id FROM email_templates WHERE template_key = 'application_confirmation'
    )
  ) THEN
    RAISE NOTICE '✓ Email de confirmation candidat dans la queue';
  ELSE
    RAISE NOTICE '✗ ERREUR : Email de confirmation candidat non trouvé';
  END IF;

  -- Vérifier email d'alerte au recruteur
  IF EXISTS (
    SELECT 1 FROM email_queue
    WHERE to_email = v_recruiter_email
    AND template_id IN (
      SELECT id FROM email_templates WHERE template_key = 'new_application_alert'
    )
  ) THEN
    RAISE NOTICE '✓ Email d''alerte recruteur dans la queue';
  ELSE
    RAISE NOTICE '✗ ERREUR : Email d''alerte recruteur non trouvé';
  END IF;

  -- Afficher les emails générés
  RAISE NOTICE '';
  RAISE NOTICE 'Emails générés:';
END $$;

SELECT
  to_email,
  et.template_key,
  eq.priority,
  eq.status
FROM email_queue eq
JOIN email_templates et ON eq.template_id = et.id
WHERE to_email LIKE 'test-%app-%@exemple.com'
ORDER BY priority DESC;

-- Nettoyer les données de test
DO $$
BEGIN
  DELETE FROM applications WHERE reference_number LIKE 'APP-%';
  DELETE FROM jobs WHERE title = 'Test Job Auto';
  DELETE FROM companies WHERE name = 'Test Company Auto';
  DELETE FROM profiles WHERE email LIKE 'test-%app-%@exemple.com';
  DELETE FROM email_queue WHERE to_email LIKE 'test-%app-%@exemple.com';
  RAISE NOTICE '✓ Nettoyage complet effectué';
END $$;

-- ============================================================================
-- TEST 7 : État final de la queue de test
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '--- TEST 7 : État final de la queue ---';
END $$;

SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'processing') as processing,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) as total
FROM email_queue
WHERE to_email LIKE 'test-%@exemple.com';

-- Nettoyer tous les emails de test
DELETE FROM email_queue WHERE to_email LIKE 'test-%@exemple.com';

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TESTS TERMINÉS - %', now();
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Si tous les tests affichent ✓, le système est opérationnel.';
  RAISE NOTICE '';
  RAISE NOTICE 'Prochaines étapes:';
  RAISE NOTICE '1. Vérifier que le cron externe appelle process-email-queue';
  RAISE NOTICE '2. Créer un vrai compte pour tester l''email de bienvenue';
  RAISE NOTICE '3. Surveiller la vue v_email_queue_monitoring';
  RAISE NOTICE '';
END $$;

-- Afficher le diagnostic final
SELECT '=== DIAGNOSTIC FINAL ===' as info;
SELECT * FROM diagnose_email_queue();
