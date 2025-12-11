/*
  # Mise à jour automatique du prix des profils

  1. Fonction
    - Crée une fonction pour calculer le prix en fonction de l'expérience

  2. Trigger
    - Ajoute un trigger pour mettre à jour automatiquement profile_price

  3. Mise à jour des données existantes
    - Met à jour tous les profils existants avec le bon prix
*/

-- Fonction pour calculer le prix du profil en fonction de l'expérience
CREATE OR REPLACE FUNCTION calculate_profile_price()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcul du prix selon les années d'expérience
  IF NEW.experience_years >= 6 THEN
    NEW.profile_price := 15000;
  ELSIF NEW.experience_years >= 3 THEN
    NEW.profile_price := 8000;
  ELSE
    NEW.profile_price := 4000;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour profile_price lors de l'insertion ou mise à jour
DROP TRIGGER IF EXISTS update_profile_price_trigger ON candidate_profiles;

CREATE TRIGGER update_profile_price_trigger
  BEFORE INSERT OR UPDATE OF experience_years
  ON candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_price();

-- Mise à jour de tous les profils existants avec le bon prix
UPDATE candidate_profiles
SET profile_price = CASE
  WHEN experience_years >= 6 THEN 15000
  WHEN experience_years >= 3 THEN 8000
  ELSE 4000
END
WHERE profile_price = 0 OR profile_price IS NULL;