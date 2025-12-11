/*
  # Ajouter les informations du formateur aux formations

  1. Modifications
    - Ajoute `trainer_id` (uuid) pour lier la formation au profil du formateur
    - Ajoute `trainer_phone` (text) pour stocker le numéro de contact direct
    - Ajoute `trainer_contact_name` (text) pour le nom du formateur
    - Ajoute une clé étrangère vers la table profiles
  
  2. Sécurité
    - Les utilisateurs peuvent voir les informations de contact des formateurs
*/

-- Ajouter les colonnes pour les informations du formateur
ALTER TABLE formations 
ADD COLUMN IF NOT EXISTS trainer_id uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS trainer_phone text,
ADD COLUMN IF NOT EXISTS trainer_contact_name text,
ADD COLUMN IF NOT EXISTS trainer_email text;

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_formations_trainer_id ON formations(trainer_id);

-- Mettre à jour les formations existantes avec des données par défaut
-- (l'admin peut les modifier manuellement par la suite)
UPDATE formations 
SET 
  trainer_phone = '622000000',
  trainer_contact_name = 'Service Formation JobGuinee',
  trainer_email = 'formations@jobguinee.com'
WHERE trainer_phone IS NULL;
