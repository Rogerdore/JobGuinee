/*
  # Ajout du champ credits_balance à profiles

  1. Modifications
    - Ajoute la colonne credits_balance à la table profiles
    - Valeur par défaut: 100 crédits
    - Contrainte: ne peut pas être négatif
    - Index pour les requêtes fréquentes

  2. Sécurité
    - Contrainte CHECK pour empêcher crédits négatifs
*/

-- Ajouter la colonne si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'credits_balance'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN credits_balance integer DEFAULT 100 NOT NULL
    CHECK (credits_balance >= 0);
  END IF;
END $$;

-- Créer un index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_profiles_credits_balance 
  ON profiles(credits_balance);

-- Mettre à jour les profils existants pour avoir un solde initial
UPDATE profiles 
SET credits_balance = 100 
WHERE credits_balance IS NULL;