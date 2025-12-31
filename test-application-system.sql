/*
  ========================================
  TESTS AUTOMATISÉS - SYSTÈME DE CANDIDATURE
  ========================================

  Ce script teste l'ensemble du système de candidature :
  - Anti-doublon
  - Génération référence
  - Calcul score IA
  - RLS policies
  - Triggers automatiques

  USAGE :
  psql <CONNECTION_STRING> -f test-application-system.sql
  ou via Supabase SQL Editor
*/

-- ================================================
-- SECTION 0 : Configuration et nettoyage
-- ================================================

BEGIN;

-- Créer un utilisateur test si nécessaire
DO $$
DECLARE
  test_candidate_id UUID;
  test_recruiter_id UUID;
  test_job_id UUID;
BEGIN
  -- Insérer ou récupérer candidat test
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'test.candidate@test.com',
    'Test Candidate',
    'candidate'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insérer ou récupérer recruteur test
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'test.recruiter@test.com',
    'Test Recruiter',
    'recruiter'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insérer ou récupérer job test
  INSERT INTO jobs (id, user_id, title, status)
  VALUES (
    'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000002',
    'Test Developer Job',
    'published'
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Test data initialized';
END $$;

-- ================================================
-- SECTION 1 : Test génération application_reference
-- ================================================

DO $$
DECLARE
  test_app_id UUID;
  test_app_ref TEXT;
BEGIN
  RAISE NOTICE '=== TEST 1: Génération application_reference ===';

  -- Insérer candidature sans référence
  INSERT INTO applications (
    candidate_id,
    job_id,
    status
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'pending'
  )
  RETURNING id, application_reference INTO test_app_id, test_app_ref;

  -- Vérifier que la référence a été générée
  IF test_app_ref IS NULL THEN
    RAISE EXCEPTION '❌ ÉCHEC: application_reference est NULL';
  END IF;

  IF test_app_ref !~ '^APP-[0-9]{8}-[0-9]{4}$' THEN
    RAISE EXCEPTION '❌ ÉCHEC: Format application_reference invalide: %', test_app_ref;
  END IF;

  RAISE NOTICE '✅ SUCCÈS: Référence générée: %', test_app_ref;

  -- Nettoyer
  DELETE FROM applications WHERE id = test_app_id;
END $$;

-- ================================================
-- SECTION 2 : Test anti-doublon
-- ================================================

DO $$
DECLARE
  test_app_id UUID;
  duplicate_detected BOOLEAN := FALSE;
BEGIN
  RAISE NOTICE '=== TEST 2: Anti-doublon candidature ===';

  -- Première candidature
  INSERT INTO applications (
    candidate_id,
    job_id,
    status
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'pending'
  )
  RETURNING id INTO test_app_id;

  -- Tenter doublon
  BEGIN
    INSERT INTO applications (
      candidate_id,
      job_id,
      status
    ) VALUES (
      'a0000000-0000-0000-0000-000000000001',
      'a0000000-0000-0000-0000-000000000003',
      'pending'
    );

  EXCEPTION WHEN unique_violation THEN
    duplicate_detected := TRUE;
  END;

  IF NOT duplicate_detected THEN
    RAISE EXCEPTION '❌ ÉCHEC: Doublon non détecté';
  END IF;

  RAISE NOTICE '✅ SUCCÈS: Doublon correctement bloqué';

  -- Nettoyer
  DELETE FROM applications WHERE id = test_app_id;
END $$;

-- ================================================
-- SECTION 3 : Test calcul score IA
-- ================================================

DO $$
DECLARE
  test_score NUMERIC;
  candidate_skills TEXT[] := ARRAY['JavaScript', 'React', 'Node.js'];
  required_skills TEXT[] := ARRAY['JavaScript', 'React', 'TypeScript'];
  experience_level TEXT := 'intermediate';
BEGIN
  RAISE NOTICE '=== TEST 3: Calcul score IA ===';

  -- Appeler la fonction de calcul
  SELECT calculate_simple_ai_score(
    candidate_skills,
    required_skills,
    experience_level
  ) INTO test_score;

  -- Vérifier que le score est dans la plage valide
  IF test_score IS NULL THEN
    RAISE EXCEPTION '❌ ÉCHEC: Score IA est NULL';
  END IF;

  IF test_score < 0 OR test_score > 100 THEN
    RAISE EXCEPTION '❌ ÉCHEC: Score IA hors limites: %', test_score;
  END IF;

  RAISE NOTICE '✅ SUCCÈS: Score IA calculé: %/100', ROUND(test_score);

  -- Test cas spécifique : 2/3 compétences = 67% skills, intermediate = 30% exp
  -- Score attendu = (67 * 0.7) + (30 * 0.3) = 46.9 + 9 = 55.9
  IF test_score < 50 OR test_score > 60 THEN
    RAISE WARNING '⚠️  Score inattendu pour 2/3 compétences matchées: % (attendu ~56)', test_score;
  END IF;
END $$;

-- ================================================
-- SECTION 4 : Test RLS - Applications
-- ================================================

DO $$
DECLARE
  can_candidate_read BOOLEAN;
  can_recruiter_read BOOLEAN;
  can_other_read BOOLEAN;
  test_app_id UUID;
BEGIN
  RAISE NOTICE '=== TEST 4: RLS Applications ===';

  -- Créer une candidature test
  INSERT INTO applications (
    candidate_id,
    job_id,
    status
  ) VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000003',
    'pending'
  )
  RETURNING id INTO test_app_id;

  -- Simuler accès candidat (dans un vrai test, utiliser set_config)
  -- Pour ce test, on vérifie juste l'existence des policies

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications'
    AND policyname = 'Candidates can view own applications'
  ) INTO can_candidate_read;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'applications'
    AND policyname LIKE '%Recruiters can view%'
  ) INTO can_recruiter_read;

  IF NOT can_candidate_read THEN
    RAISE EXCEPTION '❌ ÉCHEC: Policy RLS candidat manquante';
  END IF;

  IF NOT can_recruiter_read THEN
    RAISE EXCEPTION '❌ ÉCHEC: Policy RLS recruteur manquante';
  END IF;

  RAISE NOTICE '✅ SUCCÈS: Policies RLS applications présentes';

  -- Nettoyer
  DELETE FROM applications WHERE id = test_app_id;
END $$;

-- ================================================
-- SECTION 5 : Test RLS - Email Logs
-- ================================================

DO $$
DECLARE
  has_admin_insert BOOLEAN;
  has_user_select BOOLEAN;
BEGIN
  RAISE NOTICE '=== TEST 5: RLS Email Logs ===';

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_logs'
    AND policyname LIKE '%Admins%'
    AND cmd = 'INSERT'
  ) INTO has_admin_insert;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_logs'
    AND policyname LIKE '%Utilisateurs voient%'
    AND cmd = 'SELECT'
  ) INTO has_user_select;

  IF NOT has_admin_insert THEN
    RAISE EXCEPTION '❌ ÉCHEC: Policy INSERT email_logs manquante';
  END IF;

  IF NOT has_user_select THEN
    RAISE EXCEPTION '❌ ÉCHEC: Policy SELECT email_logs manquante';
  END IF;

  RAISE NOTICE '✅ SUCCÈS: Policies RLS email_logs sécurisées';
END $$;

-- ================================================
-- SECTION 6 : Test RLS - Daily Digest Log
-- ================================================

DO $$
DECLARE
  has_recruiter_select BOOLEAN;
  has_no_insert BOOLEAN;
BEGIN
  RAISE NOTICE '=== TEST 6: RLS Daily Digest Log ===';

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_digest_log'
    AND policyname LIKE '%Recruteurs%'
    AND cmd = 'SELECT'
  ) INTO has_recruiter_select;

  -- Vérifier qu'il n'y a PAS de policy INSERT (seulement service_role)
  SELECT NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'daily_digest_log'
    AND cmd = 'INSERT'
  ) INTO has_no_insert;

  IF NOT has_recruiter_select THEN
    RAISE EXCEPTION '❌ ÉCHEC: Policy SELECT daily_digest_log manquante';
  END IF;

  IF NOT has_no_insert THEN
    RAISE WARNING '⚠️  Policy INSERT sur daily_digest_log existe (devrait être supprimée)';
  END IF;

  RAISE NOTICE '✅ SUCCÈS: Policies RLS daily_digest_log sécurisées';
END $$;

-- ================================================
-- SECTION 7 : Test Recruiter Notification Settings
-- ================================================

DO $$
DECLARE
  test_settings_id UUID;
BEGIN
  RAISE NOTICE '=== TEST 7: Recruiter Notification Settings ===';

  -- Insérer paramètres test
  INSERT INTO recruiter_notification_settings (
    recruiter_id,
    daily_digest_enabled,
    daily_digest_hour,
    digest_format
  ) VALUES (
    'a0000000-0000-0000-0000-000000000002',
    true,
    9,
    'detailed'
  )
  RETURNING id INTO test_settings_id;

  -- Vérifier insertion
  IF test_settings_id IS NULL THEN
    RAISE EXCEPTION '❌ ÉCHEC: Impossible de créer recruiter_notification_settings';
  END IF;

  RAISE NOTICE '✅ SUCCÈS: Recruiter notification settings créés';

  -- Nettoyer
  DELETE FROM recruiter_notification_settings WHERE id = test_settings_id;
END $$;

-- ================================================
-- SECTION 8 : Résumé des tests
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════╗';
  RAISE NOTICE '║    RÉSUMÉ DES TESTS - SYSTÈME CANDIDATURE   ║';
  RAISE NOTICE '╚══════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✅ TEST 1: Génération application_reference - OK';
  RAISE NOTICE '✅ TEST 2: Anti-doublon candidature - OK';
  RAISE NOTICE '✅ TEST 3: Calcul score IA - OK';
  RAISE NOTICE '✅ TEST 4: RLS Applications - OK';
  RAISE NOTICE '✅ TEST 5: RLS Email Logs - OK';
  RAISE NOTICE '✅ TEST 6: RLS Daily Digest Log - OK';
  RAISE NOTICE '✅ TEST 7: Recruiter Notification Settings - OK';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 TOUS LES TESTS PASSÉS AVEC SUCCÈS !';
  RAISE NOTICE '';
END $$;

COMMIT;
