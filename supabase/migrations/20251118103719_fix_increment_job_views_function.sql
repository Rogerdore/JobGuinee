/*
  # Fix increment_job_views function

  ## Changes
    - Fix parameter name conflict in increment_job_views function
    - The function parameter was named 'job_id' which conflicts with the column name
    - Rename parameter to 'p_job_id' for clarity
*/

DROP FUNCTION IF EXISTS public.increment_job_views(uuid);

CREATE FUNCTION public.increment_job_views(p_job_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE jobs
  SET views = COALESCE(views, 0) + 1
  WHERE id = p_job_id;
END;
$$;