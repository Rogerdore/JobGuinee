/*
  # Extend social_share_analytics for Enhanced Audit Trail

  1. Changes
    - Add `action` column to track lifecycle stages (prepared/triggered/skipped/failed)
    - Add `status` column for final outcome (success/error/skipped)
    - Add `error_message` column for explicit error logging
    
  2. Backward Compatibility
    - Populate existing rows with inferred values from metadata
    - Create indexes for performance on new columns
    
  3. Security
    - No RLS changes needed (existing policies remain)
    - Maintains admin-only access pattern
*/

-- Add new audit columns
ALTER TABLE social_share_analytics
ADD COLUMN IF NOT EXISTS action text CHECK (action IN ('prepared', 'triggered', 'skipped', 'failed')),
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('success', 'error', 'skipped')),
ADD COLUMN IF NOT EXISTS error_message text;

-- Backfill existing rows for backward compatibility
UPDATE social_share_analytics
SET
  action = 'triggered',
  status = CASE
    WHEN metadata->>'success' = 'true' THEN 'success'
    WHEN metadata->>'success' = 'false' THEN 'error'
    ELSE 'success'
  END,
  error_message = metadata->>'error'
WHERE action IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_share_analytics_status 
  ON social_share_analytics(status);

CREATE INDEX IF NOT EXISTS idx_social_share_analytics_action 
  ON social_share_analytics(action);

CREATE INDEX IF NOT EXISTS idx_social_share_analytics_job_status 
  ON social_share_analytics(job_id, status);
