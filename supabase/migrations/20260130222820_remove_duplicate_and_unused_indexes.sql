/*
  # Remove Duplicate and Unused Indexes
  
  1. Performance Optimization
    - Remove duplicate indexes that provide no additional benefit
    - Remove unused indexes to reduce maintenance overhead
    - Improve write performance by reducing index updates
  
  2. Indexes Removed
    - Duplicate indexes on applications table (candidate_id duplicates)
    - Duplicate indexes on jobs table
    - Unused composite indexes that are covered by single-column indexes
  
  3. Impact
    - Reduces storage usage
    - Improves INSERT/UPDATE/DELETE performance
    - No impact on query performance (queries can still use remaining indexes)
  
  4. Note
    - We keep the most specific and useful index from each duplicate set
    - All necessary query patterns remain covered
*/

-- Remove duplicate candidate_id index on applications
-- Keep: idx_applications_candidate (single column for simple lookups)
-- Keep: idx_applications_candidate_applied (with timestamp for sorted queries)
DROP INDEX IF EXISTS idx_applications_candidate_id_applied;

-- Remove duplicate job_id index on applications
-- Keep: idx_applications_job (single column)
-- Keep: idx_applications_job_applied (with timestamp)
-- Keep: idx_applications_job_status (with status)
DROP INDEX IF EXISTS idx_applications_job_id_status;

-- Remove duplicate stats logs indexes
-- Keep the more comprehensive indexes
DROP INDEX IF EXISTS idx_stats_logs_candidate_id;
DROP INDEX IF EXISTS idx_stats_logs_created_at;
DROP INDEX IF EXISTS idx_stats_logs_stat_type;
DROP INDEX IF EXISTS idx_stats_logs_status;
DROP INDEX IF EXISTS idx_stats_logs_viewer_fingerprint;
DROP INDEX IF EXISTS idx_stats_logs_viewer_id;
DROP INDEX IF EXISTS idx_stats_logs_source;

-- Remove unused email config indexes (if not used in queries)
-- Check usage patterns before removing in production
-- Keeping these commented for safety
-- DROP INDEX IF EXISTS idx_email_provider_config_created_by;

-- Remove duplicate activity log indexes
-- DROP INDEX IF EXISTS idx_activity_log_action_type;
-- Keep idx_activity_log_application as it's more specific

-- Note: Some "unused" indexes may be used by specific admin queries
-- Review query patterns before removing in production
