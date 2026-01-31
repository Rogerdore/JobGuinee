/*
  # Fonction de nettoyage des comptes incomplets

  1. Description
    - Fonction pour nettoyer les comptes ayant un utilisateur dans auth.users
      mais sans profil correspondant dans la table profiles
    - Permet une réinscription propre en cas d'échec lors de la création initiale

  2. Fonctionnalité
    - Supprime les enregistrements auth.users orphelins (sans profil)
    - Accessible via RPC pour les utilisateurs en cours d'inscription

  3. Sécurité
    - La fonction vérifie que le profil n'existe pas avant de supprimer
    - Évite la suppression accidentelle de comptes valides
*/

-- Fonction pour nettoyer un compte incomplet (auth.users sans profil)
CREATE OR REPLACE FUNCTION cleanup_incomplete_account(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  profile_exists BOOLEAN;
BEGIN
  -- Récupérer l'ID de l'utilisateur par email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = user_email;

  -- Si l'utilisateur n'existe pas, retourner false
  IF user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Vérifier si un profil existe
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = user_id
  ) INTO profile_exists;

  -- Si le profil existe, ne rien faire (compte complet)
  IF profile_exists THEN
    RETURN false;
  END IF;

  -- Supprimer l'utilisateur orphelin (sans profil)
  DELETE FROM auth.users WHERE id = user_id;

  RETURN true;
END;
$$;

-- Commentaire sur la fonction
COMMENT ON FUNCTION cleanup_incomplete_account IS 
'Nettoie les comptes incomplets (auth.users sans profil) pour permettre une réinscription';
