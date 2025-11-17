/*
  # Create Company Logos Storage Bucket

  1. Storage
    - Create `company-logos` bucket for company logo uploads
    - Set as public bucket
    - Configure RLS policies for authenticated users

  2. Security
    - Allow authenticated users to upload logos
    - Allow public read access for logo display
    - Users can only update/delete their own company logos
*/

-- Create the storage bucket for company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
CREATE POLICY "Authenticated users can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Allow authenticated users to update their own logos
CREATE POLICY "Users can update their own company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own logos
CREATE POLICY "Users can delete their own company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access for all logos
CREATE POLICY "Public can view company logos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'company-logos');
