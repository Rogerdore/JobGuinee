/*
  # Correction du Tracking de Vues - Activation de pgcrypto
  
  1. Problème Identifié
    - Les tentatives de tracking échouent avec l'erreur : "function digest(text, unknown) does not exist"
    - La fonction track_job_view_secure utilise digest() pour hasher les fingerprints anonymes
    - L'extension pgcrypto n'était pas activée
  
  2. Solution
    - Activation de l'extension pgcrypto
    - Cette extension fournit les fonctions de hashing cryptographiques (digest, encode, etc.)
    - Nécessaire pour le fingerprinting des utilisateurs anonymes
  
  3. Impact
    - Le tracking des vues fonctionnera pour TOUS les utilisateurs
    - Connectés ET anonymes
    - Anti-spam opérationnel
*/

-- Activer l'extension pgcrypto si elle n'est pas déjà activée
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Vérifier que l'extension est bien activée
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto'
  ) THEN
    RAISE EXCEPTION 'Extension pgcrypto n''a pas pu être activée';
  END IF;
END $$;
