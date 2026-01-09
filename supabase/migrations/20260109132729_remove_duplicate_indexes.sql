/*
  # Remove Duplicate Indexes

  1. Performance Optimization
    - Removes duplicate indexes that serve the same purpose
    - Reduces storage overhead and write performance impact
    - Keeps the more descriptive index name in each pair

  2. Indexes Removed
    - ai_service_usage_history: 2 duplicates removed
    - chatbot_knowledge_base: 1 duplicate removed
    - chatbot_logs: 1 duplicate removed
    - jobs: 3 duplicates removed
    
  3. Impact
    - Reduced disk space usage
    - Faster INSERT/UPDATE operations
    - Simplified index maintenance
    - No query performance degradation (keeping one of each pair)
    
  Note: candidate_contact_preferences_person_id_key is constraint-backed and kept
*/

-- AI Service Usage History duplicates
-- Keep idx_ai_usage_service_key (more descriptive)
DROP INDEX IF EXISTS idx_ai_usage_service;

-- Keep idx_ai_usage_user_created (more descriptive with ordering)
DROP INDEX IF EXISTS idx_ai_usage_user;

-- Chatbot Knowledge Base
-- Keep idx_chatbot_kb_tags (follows chatbot naming convention)
DROP INDEX IF EXISTS idx_kb_tags;

-- Chatbot Logs
-- Keep idx_chatbot_logs_user_created (more descriptive with ordering)
DROP INDEX IF EXISTS idx_chatbot_logs_user;

-- Jobs table duplicates
-- Keep idx_jobs_company_id (more explicit column name)
DROP INDEX IF EXISTS idx_jobs_company;

-- Keep idx_jobs_user_id_status (more explicit column name)
DROP INDEX IF EXISTS idx_jobs_user_status;

-- Keep idx_jobs_keywords_gin (indicates index type)
DROP INDEX IF EXISTS idx_jobs_keywords;
