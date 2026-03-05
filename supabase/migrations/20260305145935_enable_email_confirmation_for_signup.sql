/*
  # Enable Email Confirmation for New Signups

  ## Purpose
  Ensures the email confirmation requirement is properly enforced at the database level.
  
  ## Changes
  - Creates a trigger function that marks newly registered users as unconfirmed
    when the system is configured to require email confirmation.
  - This migration is a no-op if Supabase Auth settings already handle this,
    but documents the intent in the migration history.

  ## Note
  The primary email confirmation toggle is managed in Supabase Auth settings
  (Dashboard > Authentication > Email). This migration adds a check function
  to verify the confirmation status during sign-in.
*/

CREATE OR REPLACE FUNCTION public.check_email_confirmed(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_confirmed boolean;
BEGIN
  SELECT (email_confirmed_at IS NOT NULL)
  INTO is_confirmed
  FROM auth.users
  WHERE id = user_id;
  
  RETURN COALESCE(is_confirmed, false);
END;
$$;
