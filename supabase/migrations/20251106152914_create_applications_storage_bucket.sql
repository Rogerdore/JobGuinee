/*
  # Create Applications Storage Bucket

  1. Storage Bucket
    - Create 'applications' bucket for CV and cover letters
    - Public bucket for easy access by recruiters
    
  2. Storage Policies
    - Allow authenticated users to upload to their own folder
    - Allow authenticated users to read all files (recruiters need access)
    - Allow users to update/delete their own files
    
  3. Security
    - Users can only upload to their own user_id folder
    - All authenticated users can download files (for recruiters)
    - Proper file type validation
*/

-- Create the applications storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'applications',
  'applications',
  true,
  5242880,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'applications' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read all files (recruiters need access)
CREATE POLICY "Authenticated users can read all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'applications');

-- Policy: Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'applications'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'applications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'applications'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
