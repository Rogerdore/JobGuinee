/*
  # Fix Remaining Function Security Issues (v2)

  ## Changes
    - Drop and recreate functions with proper search_path
    - Ensures all functions are protected against search path manipulation
*/

DROP FUNCTION IF EXISTS public.increment_document_download(uuid);
CREATE FUNCTION public.increment_document_download(doc_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE ai_generated_documents
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = doc_id;
END;
$$;

DROP FUNCTION IF EXISTS public.increment_analysis_download(uuid);
CREATE FUNCTION public.increment_analysis_download(analysis_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE ai_profile_analysis
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE id = analysis_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_documents_size(uuid);
CREATE FUNCTION public.get_user_documents_size(p_user_id uuid)
RETURNS bigint
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
DECLARE
  total_size bigint;
BEGIN
  SELECT COALESCE(SUM(file_size), 0)
  INTO total_size
  FROM candidate_documents
  WHERE user_id = p_user_id;
  
  RETURN total_size;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_documents_stats(uuid);
CREATE FUNCTION public.get_user_documents_stats(p_user_id uuid)
RETURNS TABLE (
  total_size bigint,
  cv_count integer,
  cover_letter_count integer,
  other_count integer
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(file_size), 0)::bigint as total_size,
    COUNT(*) FILTER (WHERE document_type = 'cv')::integer as cv_count,
    COUNT(*) FILTER (WHERE document_type = 'cover_letter')::integer as cover_letter_count,
    COUNT(*) FILTER (WHERE document_type NOT IN ('cv', 'cover_letter'))::integer as other_count
  FROM candidate_documents
  WHERE user_id = p_user_id;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_ai_documents(uuid);
CREATE FUNCTION public.get_user_ai_documents(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  document_type text,
  title text,
  content text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  download_count integer
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.document_type,
    d.title,
    d.content,
    d.status,
    d.created_at,
    d.updated_at,
    d.download_count
  FROM ai_generated_documents d
  WHERE d.user_id = p_user_id
  ORDER BY d.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_user_profile_analyses(uuid);
CREATE FUNCTION public.get_user_profile_analyses(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  job_title text,
  analysis_result jsonb,
  compatibility_score numeric,
  status text,
  created_at timestamptz,
  download_count integer
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    j.title as job_title,
    a.analysis_result,
    a.compatibility_score,
    a.status,
    a.created_at,
    a.download_count
  FROM ai_profile_analysis a
  LEFT JOIN jobs j ON j.id = a.offer_id
  WHERE a.user_id = p_user_id
  ORDER BY a.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_profile_analysis_detail(uuid);
CREATE FUNCTION public.get_profile_analysis_detail(p_analysis_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  offer_id uuid,
  job_title text,
  analysis_result jsonb,
  compatibility_score numeric,
  strengths jsonb,
  weaknesses jsonb,
  recommendations jsonb,
  status text,
  created_at timestamptz,
  download_count integer
)
SECURITY DEFINER
SET search_path = public, pg_temp
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.user_id,
    a.offer_id,
    j.title as job_title,
    a.analysis_result,
    a.compatibility_score,
    a.strengths,
    a.weaknesses,
    a.recommendations,
    a.status,
    a.created_at,
    a.download_count
  FROM ai_profile_analysis a
  LEFT JOIN jobs j ON j.id = a.offer_id
  WHERE a.id = p_analysis_id;
END;
$$;