/*
  # Fonction de confirmation automatique pour les tests
  
  Crée une fonction qui permet de confirmer automatiquement l'email d'un utilisateur
  pour faciliter les tests automatisés.
  
  ATTENTION: Cette fonction est uniquement pour les tests et ne doit jamais être
  exposée en production.
*/

CREATE OR REPLACE FUNCTION public.confirm_test_user_email(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Confirmer l'email de l'utilisateur
  UPDATE auth.users
  SET email_confirmed_at = now()
  WHERE id = user_id_param
  AND email_confirmed_at IS NULL;
END;
$$;

-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION public.confirm_test_user_email(uuid) TO anon, authenticated;

COMMENT ON FUNCTION public.confirm_test_user_email IS 
'Fonction de test pour confirmer automatiquement les emails. À utiliser uniquement en développement.';
