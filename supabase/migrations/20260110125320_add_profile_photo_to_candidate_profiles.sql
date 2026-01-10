/*
  # Ajouter photo de profil aux candidats

  1. Nouveau champ
    - `photo_url` (text) - URL de la photo de profil du candidat

  2. Storage
    - Créer un bucket pour les photos de profil des candidats
    - Configurer les policies RLS pour l'accès sécurisé
*/

-- Ajouter le champ photo_url s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'candidate_profiles' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE candidate_profiles ADD COLUMN photo_url text DEFAULT NULL;
  END IF;
END $$;

-- Créer le bucket pour les photos de profil si non existant
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-profile-photos', 'candidate-profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les policies existantes
DROP POLICY IF EXISTS "Users can upload their own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile photo" ON storage.objects;
DROP POLICY IF EXISTS "Profile photos are publicly accessible" ON storage.objects;

-- Policies pour le storage des photos de profil
CREATE POLICY "Users can upload their own profile photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'candidate-profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-profile-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile photos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'candidate-profile-photos');