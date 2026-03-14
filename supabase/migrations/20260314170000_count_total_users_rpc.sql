-- Fonction publique pour compter le nombre total d'utilisateurs inscrits
-- Compte depuis auth.users (même source que l'admin)
CREATE OR REPLACE FUNCTION public.count_total_users()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) FROM auth.users;
$$;
