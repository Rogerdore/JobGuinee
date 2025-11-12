/*
  # Configuration du Storage pour Documents Candidats

  ## Description
  Configure le bucket de stockage et les policies pour les documents des candidats.

  ## Bucket: candidate-documents
    - Stockage des CV, certificats, lettres de motivation
    - Accès sécurisé par utilisateur
    - Limite de taille: 10MB par fichier

  ## Policies Storage
    - Les utilisateurs peuvent télécharger leurs propres documents
    - Les utilisateurs peuvent voir leurs propres documents
    - Les utilisateurs peuvent supprimer leurs propres documents
*/

-- Créer le bucket s'il n'existe pas déjà
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'candidate-documents',
  'candidate-documents',
  false,
  10485760, -- 10MB
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];

-- Policy: Les utilisateurs peuvent télécharger leurs propres fichiers
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'candidate-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Les utilisateurs peuvent voir leurs propres fichiers
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'candidate-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres fichiers
CREATE POLICY "Users can update own documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'candidate-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'candidate-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Les utilisateurs peuvent supprimer leurs propres fichiers
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'candidate-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
