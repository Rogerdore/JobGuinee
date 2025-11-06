/*
  # Create increment job views function

  1. Functions
    - `increment_job_views` - Safely increments the view count for a job
    - Handles non-existent jobs gracefully
    - Returns void

  2. Security
    - SECURITY DEFINER to allow counting views without authentication
    - Public access for tracking analytics
*/

-- Create function to increment job views
CREATE OR REPLACE FUNCTION increment_job_views(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only increment if job exists
  UPDATE jobs
  SET views = COALESCE(views, 0) + 1
  WHERE id = job_id;
END;
$$;

-- Grant execute permission to all users (including anonymous)
GRANT EXECUTE ON FUNCTION increment_job_views(uuid) TO anon, authenticated;
