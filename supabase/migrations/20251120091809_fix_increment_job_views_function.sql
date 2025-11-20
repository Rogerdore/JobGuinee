/*
  # Fix increment_job_views function

  1. Changes
    - Update increment_job_views function to use correct column name 'views_count' instead of 'views'
    - This fixes the 404 error when viewing job details
*/

CREATE OR REPLACE FUNCTION public.increment_job_views(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  UPDATE jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id;
END;
$function$;
