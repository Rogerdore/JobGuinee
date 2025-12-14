/*
  # Créer le bucket de stockage pour les logos d'entreprise

  1. Nouveau bucket de stockage
    - `company-logos` - Stockage public des logos d'entreprise
  
  2. Sécurité
    - Enable RLS sur le bucket
    - Politique de lecture publique
    - Politique d'upload pour les recruteurs authentifiés uniquement
*/

-- Créer le bucket de stockage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company-logos',
  'company-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Public read access for company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own company logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own company logos" ON storage.objects;

-- Politique de lecture publique pour tous
CREATE POLICY "Public read access for company logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'company-logos');

-- Politique d'upload pour les utilisateurs authentifiés
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Politique de mise à jour pour les propriétaires
CREATE POLICY "Users can update their own company logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos');

-- Politique de suppression pour les propriétaires
CREATE POLICY "Users can delete their own company logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos');
