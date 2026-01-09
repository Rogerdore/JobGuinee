/*
  # Add Share Type to Social Share Analytics

  1. New Columns
    - `share_type`: Type of share (manual, auto, scheduled)
    - `metadata`: Additional JSON data for the share

  2. New Function
    - `get_share_stats_by_type()`: Get share statistics grouped by type and platform

  3. Indexes
    - Index on share_type for faster queries
*/

-- Add columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_share_analytics' 
    AND column_name = 'share_type'
  ) THEN
    ALTER TABLE social_share_analytics
    ADD COLUMN share_type text DEFAULT 'manual' CHECK (share_type IN ('manual', 'auto', 'scheduled'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_share_analytics' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE social_share_analytics
    ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create index if not exists
CREATE INDEX IF NOT EXISTS idx_share_analytics_share_type
ON social_share_analytics(share_type);

-- Function to get share stats by type
CREATE OR REPLACE FUNCTION get_share_stats_by_type(p_job_id uuid DEFAULT NULL)
RETURNS TABLE (
  share_type text,
  platform text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.share_type,
    s.platform,
    COUNT(*)::bigint as count
  FROM social_share_analytics s
  WHERE (p_job_id IS NULL OR s.job_id = p_job_id)
  GROUP BY s.share_type, s.platform
  ORDER BY s.share_type, COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get auto-share success rate
CREATE OR REPLACE FUNCTION get_auto_share_success_rate()
RETURNS TABLE (
  platform text,
  total_attempts bigint,
  successful bigint,
  failed bigint,
  success_rate numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.platform,
    COUNT(*)::bigint as total_attempts,
    COUNT(*) FILTER (WHERE (s.metadata->>'success')::boolean = true)::bigint as successful,
    COUNT(*) FILTER (WHERE (s.metadata->>'success')::boolean = false)::bigint as failed,
    ROUND(
      (COUNT(*) FILTER (WHERE (s.metadata->>'success')::boolean = true)::numeric / 
      NULLIF(COUNT(*), 0) * 100), 
      2
    ) as success_rate
  FROM social_share_analytics s
  WHERE s.share_type = 'auto'
  GROUP BY s.platform
  ORDER BY success_rate DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;