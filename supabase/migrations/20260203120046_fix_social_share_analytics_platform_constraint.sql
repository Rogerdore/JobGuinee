/*
  # Fix Social Share Analytics Platform Constraint

  1. Changes
    - Update the platform CHECK constraint to allow 'all' value
    - This is needed for the auto-share trigger which logs global events with platform = 'all'

  2. Security
    - Maintains existing RLS policies
    - No data changes
*/

-- Drop existing constraint
ALTER TABLE social_share_analytics 
DROP CONSTRAINT IF EXISTS social_share_analytics_platform_check;

-- Recreate constraint with 'all' value allowed
ALTER TABLE social_share_analytics
ADD CONSTRAINT social_share_analytics_platform_check 
CHECK (platform IN ('facebook', 'linkedin', 'twitter', 'whatsapp', 'all'));
