/*
  # Backfill recruiter_id for existing jobs

  ## Changes
    - Updates all jobs that have user_id but no recruiter_id
    - Sets recruiter_id = user_id for consistency
    - This allows recruiters to view their existing jobs

  ## Notes
    - Only updates jobs where recruiter_id is NULL
    - Uses user_id as the recruiter_id value
    - Safe operation that doesn't affect other data
*/

-- Update existing jobs to set recruiter_id from user_id
UPDATE jobs
SET recruiter_id = user_id
WHERE recruiter_id IS NULL
AND user_id IS NOT NULL;