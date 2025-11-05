/*
  # Create Success Stories Storage Bucket

  ## Description
  Creates a storage bucket for success stories media (profile photos, gallery images, and videos).

  ## Changes Made

  1. Storage Bucket
    - `success-stories` - Public bucket for all success story media
      - Profile photos in `profiles/` folder
      - Gallery images in `gallery/images/` folder
      - Gallery videos in `gallery/videos/` folder

  2. Security Policies
    - Public read access for all files
    - Authenticated users can upload files
    - Users can update/delete their own files

  3. Configuration
    - Public bucket (files accessible via public URLs)
    - File size limits enforced by client
    - Organized folder structure

  ## Important Notes
  - All files are publicly readable
  - Only authenticated users can upload
  - Automatic public URL generation
  - Supports images (JPG, PNG) and videos (MP4, MOV)
*/

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('success-stories', 'success-stories', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for success stories media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'success-stories');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload success stories media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'success-stories'
  AND (storage.foldername(name))[1] IN ('profiles', 'gallery')
);

-- Allow users to update their own files
CREATE POLICY "Users can update their own success stories media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'success-stories'
  AND owner = auth.uid()
)
WITH CHECK (
  bucket_id = 'success-stories'
  AND owner = auth.uid()
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own success stories media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'success-stories'
  AND owner = auth.uid()
);

-- Add helpful comment
COMMENT ON TABLE storage.buckets IS 'Storage buckets for file uploads';
