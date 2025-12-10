/*
  # Enhance AI Service Usage History Table
  
  1. Adds Missing Columns
    - status (success/error)
    - duration_ms (response time)
    - error_message (for debugging)
    
  2. Adds Indexes
    - For faster queries on status, service_key, created_at
    
  3. Maintains Data Integrity
    - Preserves existing data
    - Uses defaults for new columns
*/

-- Add status column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_service_usage_history' AND column_name = 'status'
  ) THEN
    ALTER TABLE ai_service_usage_history 
    ADD COLUMN status text DEFAULT 'success' CHECK (status IN ('success', 'error'));
  END IF;
END $$;

-- Add duration_ms column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_service_usage_history' AND column_name = 'duration_ms'
  ) THEN
    ALTER TABLE ai_service_usage_history 
    ADD COLUMN duration_ms integer DEFAULT 0;
  END IF;
END $$;

-- Add error_message column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ai_service_usage_history' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE ai_service_usage_history 
    ADD COLUMN error_message text;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_status ON ai_service_usage_history(status);
CREATE INDEX IF NOT EXISTS idx_ai_usage_service_key ON ai_service_usage_history(service_key);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_service_usage_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_service ON ai_service_usage_history(user_id, service_key);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON ai_service_usage_history(user_id, created_at DESC);