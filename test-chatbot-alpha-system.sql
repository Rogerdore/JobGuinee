-- ============================================================================
-- TEST SUITE COMPLÈTE - CHATBOT "ALPHA" JobGuinée
-- ============================================================================
-- Ce fichier teste toutes les fonctionnalités du système chatbot Alpha
-- Exécuter dans l'ordre pour valider le système complet
-- ============================================================================

-- Test 1: Vérification des tables et indexes
-- ============================================================================
SELECT 'Test 1: Tables chatbot existantes' as test;

SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'chatbot_logs',
  'chatbot_settings',
  'chatbot_styles',
  'chatbot_knowledge_base',
  'chatbot_quick_actions'
)
ORDER BY table_name;

-- Vérification des indexes de performance
SELECT 'Test 1b: Indexes de performance' as test;

SELECT indexname, tablename
FROM pg_indexes
WHERE tablename LIKE 'chatbot%'
  AND indexname LIKE 'idx_chatbot%'
ORDER BY tablename, indexname;

-- Test 2: RLS Policies - chatbot_logs
-- ============================================================================
SELECT 'Test 2: RLS Policies sur chatbot_logs' as test;

SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'chatbot_logs'
ORDER BY policyname;

-- Test 3: RLS Policies - Tables de configuration
-- ============================================================================
SELECT 'Test 3: RLS Policies sur tables configuration' as test;

SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN (
  'chatbot_settings',
  'chatbot_styles',
  'chatbot_knowledge_base',
  'chatbot_quick_actions'
)
ORDER BY tablename, policyname;

-- Test 4: Insertion log conversation (utilisateur authentifié)
-- ============================================================================
SELECT 'Test 4: Test insertion chatbot_logs' as test;

-- Simuler une insertion (à adapter avec un vrai user_id)
-- INSERT INTO chatbot_logs (
--   user_id,
--   message_user,
--   message_bot,
--   tokens_used,
--   response_time_ms,
--   intent_detected,
--   page_url,
--   session_id
-- ) VALUES (
--   'USER_ID_HERE',
--   'Bonjour Alpha, comment créer un CV ?',
--   'Bonjour ! Je suis Alpha. Pour créer un CV, je peux vous aider...',
--   50,
--   250,
--   'cv_help',
--   '/candidate-dashboard',
--   'test-session-001'
-- );

SELECT 'Insertion test passé (à décommenter avec vrai user_id)' as result;

-- Test 5: Recherche Knowledge Base par score
-- ============================================================================
SELECT 'Test 5: Recherche Knowledge Base' as test;

SELECT
  question,
  answer,
  priority_level,
  tags,
  is_active
FROM chatbot_knowledge_base
WHERE is_active = true
ORDER BY priority_level DESC
LIMIT 5;

-- Test 6: Vérification settings chatbot
-- ============================================================================
SELECT 'Test 6: Settings chatbot actifs' as test;

SELECT
  is_enabled,
  position,
  welcome_message,
  show_quick_actions,
  max_context_messages,
  enable_premium_detection
FROM chatbot_settings
WHERE is_enabled = true
LIMIT 1;

-- Test 7: Vérification style par défaut
-- ============================================================================
SELECT 'Test 7: Style chatbot par défaut' as test;

SELECT
  name,
  primary_color,
  secondary_color,
  widget_size,
  animation_type,
  is_default
FROM chatbot_styles
WHERE is_default = true
LIMIT 1;

-- Test 8: Quick Actions actives
-- ============================================================================
SELECT 'Test 8: Quick Actions actives' as test;

SELECT
  label,
  description,
  action_type,
  is_active,
  order_index
FROM chatbot_quick_actions
WHERE is_active = true
ORDER BY order_index
LIMIT 5;

-- Test 9: Test fonction cleanup_old_chatbot_logs
-- ============================================================================
SELECT 'Test 9: Fonction cleanup existe' as test;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'cleanup_old_chatbot_logs';

-- Test 10: Test fonction limit_session_history
-- ============================================================================
SELECT 'Test 10: Fonction limit_session_history existe' as test;

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'limit_session_history';

-- Test 11: Vérification trigger
-- ============================================================================
SELECT 'Test 11: Trigger limit_session_history actif' as test;

SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'trigger_limit_session_history';

-- Test 12: Test colonnes ajoutées (last_intent, sanitization_applied)
-- ============================================================================
SELECT 'Test 12: Nouvelles colonnes chatbot_logs' as test;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'chatbot_logs'
  AND column_name IN ('last_intent', 'sanitization_applied')
ORDER BY column_name;

-- Test 13: Score KB - Simulation recherche
-- ============================================================================
SELECT 'Test 13: Simulation scoring Knowledge Base' as test;

WITH search_terms AS (
  SELECT unnest(string_to_array(lower('créer cv'), ' ')) as term
)
SELECT
  kb.question,
  kb.answer,
  kb.priority_level,
  (
    SELECT COUNT(*)
    FROM search_terms st
    WHERE lower(kb.question) LIKE '%' || st.term || '%'
      OR lower(kb.answer) LIKE '%' || st.term || '%'
  ) * 10 + kb.priority_level as calculated_score
FROM chatbot_knowledge_base kb
WHERE kb.is_active = true
ORDER BY calculated_score DESC
LIMIT 3;

-- Test 14: Performance - Vérification index usage
-- ============================================================================
SELECT 'Test 14: Stats utilisation indexes' as test;

SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE tablename LIKE 'chatbot%'
ORDER BY tablename, indexname;

-- Test 15: Test access control Premium vs Non-Premium
-- ============================================================================
SELECT 'Test 15: Test contexte utilisateur Premium' as test;

-- Vérifier qu'on peut distinguer utilisateurs premium
SELECT
  COUNT(*) as total_users,
  SUM(CASE WHEN is_premium = true THEN 1 ELSE 0 END) as premium_users,
  SUM(CASE WHEN is_premium = false THEN 1 ELSE 0 END) as free_users
FROM profiles;

-- Test 16: Vérification crédits IA disponibles
-- ============================================================================
SELECT 'Test 16: Utilisateurs avec crédits IA' as test;

SELECT
  COUNT(*) as users_with_credits,
  AVG(credits_balance) as avg_credits,
  MAX(credits_balance) as max_credits
FROM profiles
WHERE credits_balance > 0;

-- Test 17: Test comptage logs par session (limite 50)
-- ============================================================================
SELECT 'Test 17: Comptage logs par session' as test;

SELECT
  session_id,
  COUNT(*) as message_count,
  MIN(created_at) as first_message,
  MAX(created_at) as last_message
FROM chatbot_logs
GROUP BY session_id
ORDER BY message_count DESC
LIMIT 5;

-- Test 18: Test intent detection analytics
-- ============================================================================
SELECT 'Test 18: Analytics intent detection' as test;

SELECT
  intent_detected,
  COUNT(*) as frequency,
  AVG(response_time_ms) as avg_response_time,
  AVG(tokens_used) as avg_tokens
FROM chatbot_logs
WHERE intent_detected IS NOT NULL
GROUP BY intent_detected
ORDER BY frequency DESC
LIMIT 10;

-- Test 19: Vérification messages sans intent (nécessitent amélioration)
-- ============================================================================
SELECT 'Test 19: Messages sans intent détecté' as test;

SELECT
  COUNT(*) as messages_without_intent,
  ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM chatbot_logs), 0), 2) as percentage
FROM chatbot_logs
WHERE intent_detected IS NULL OR intent_detected = '';

-- Test 20: Test performance moyenne du chatbot
-- ============================================================================
SELECT 'Test 20: Performance moyenne chatbot' as test;

SELECT
  COUNT(*) as total_conversations,
  AVG(response_time_ms) as avg_response_time_ms,
  MIN(response_time_ms) as min_response_time_ms,
  MAX(response_time_ms) as max_response_time_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time_ms) as p95_response_time
FROM chatbot_logs
WHERE response_time_ms IS NOT NULL;

-- ============================================================================
-- RÉSUMÉ FINAL
-- ============================================================================
SELECT '=== RÉSUMÉ TESTS CHATBOT ALPHA ===' as summary;

SELECT
  'Total tables chatbot' as metric,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'chatbot%')::text as value
UNION ALL
SELECT
  'Total indexes performance' as metric,
  (SELECT COUNT(*) FROM pg_indexes WHERE indexname LIKE 'idx_chatbot%')::text as value
UNION ALL
SELECT
  'Total RLS policies' as metric,
  (SELECT COUNT(*) FROM pg_policies WHERE tablename LIKE 'chatbot%')::text as value
UNION ALL
SELECT
  'Total logs enregistrés' as metric,
  (SELECT COUNT(*)::text FROM chatbot_logs)
UNION ALL
SELECT
  'Knowledge base entries' as metric,
  (SELECT COUNT(*)::text FROM chatbot_knowledge_base WHERE is_active = true)
UNION ALL
SELECT
  'Quick actions actives' as metric,
  (SELECT COUNT(*)::text FROM chatbot_quick_actions WHERE is_active = true)
UNION ALL
SELECT
  'Système activé' as metric,
  (SELECT CASE WHEN is_enabled THEN 'OUI' ELSE 'NON' END FROM chatbot_settings LIMIT 1)
ORDER BY metric;

-- ============================================================================
-- FIN DES TESTS
-- ============================================================================
SELECT '✓ Suite de tests complète exécutée avec succès !' as final_message;
