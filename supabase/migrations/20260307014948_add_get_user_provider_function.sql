/*
  # Add get_user_provider function

  Returns the authentication provider for a given email address
  by querying auth.identities. Used to detect Google accounts during signup.

  - Function: get_user_provider(user_email text) returns text
  - Returns: 'google', 'email', or null if not found
  - Security: SECURITY DEFINER to access auth schema
*/

CREATE OR REPLACE FUNCTION public.get_user_provider(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider text;
BEGIN
  SELECT i.provider INTO v_provider
  FROM auth.users u
  JOIN auth.identities i ON i.user_id = u.id
  WHERE lower(u.email) = lower(user_email)
  LIMIT 1;

  RETURN v_provider;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_provider(text) TO anon, authenticated;
