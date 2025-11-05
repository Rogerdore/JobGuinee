/*
  # Enhance Blog Posts for User Submissions

  ## Overview
  This migration enhances the blog_posts table and storage to support
  comprehensive article submissions with images, documents, and contact info.

  ## Changes
  1. New Columns in blog_posts
    - `author_phone` (text) - Author's phone number for contact
    - `author_email` (text) - Author's email for communication
    - `document_urls` (jsonb) - Array of attached documents (PDF, DOCX, etc.)

  2. New Storage Bucket
    - `blog-documents` - For document attachments (PDF, DOCX, XLSX, etc.)

  3. Storage Policies
    - Allow authenticated users to upload blog documents
    - Allow public read access to published documents
    - Allow anyone to upload to blog-images (for article submissions)

  ## Security Notes
  - Documents are publicly readable once uploaded
  - Admins can moderate and delete inappropriate content
*/

-- Add new columns to blog_posts table
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS author_phone text,
  ADD COLUMN IF NOT EXISTS author_email text,
  ADD COLUMN IF NOT EXISTS document_urls jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN blog_posts.author_phone IS 'Author contact phone number';
COMMENT ON COLUMN blog_posts.author_email IS 'Author contact email';
COMMENT ON COLUMN blog_posts.document_urls IS 'Array of document attachment URLs (PDF, DOCX, etc.)';

-- Create storage bucket for blog documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-documents', 'blog-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing restrictive policies for blog-images to allow submissions
DO $$
BEGIN
  DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
  DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;
END $$;

-- Allow authenticated users to upload blog images (for article submissions)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload blog images'
  ) THEN
    CREATE POLICY "Authenticated users can upload blog images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'blog-images');
  END IF;
END $$;

-- Allow users to update their own uploads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update their blog images'
  ) THEN
    CREATE POLICY "Users can update their blog images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'blog-images' AND auth.uid() = owner);
  END IF;
END $$;

-- Allow admins to delete any blog images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can delete any blog images'
  ) THEN
    CREATE POLICY "Admins can delete any blog images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'blog-images' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

-- Allow authenticated users to upload blog documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload blog documents'
  ) THEN
    CREATE POLICY "Authenticated users can upload blog documents"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'blog-documents');
  END IF;
END $$;

-- Allow users to update their own documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update their blog documents'
  ) THEN
    CREATE POLICY "Users can update their blog documents"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (bucket_id = 'blog-documents' AND auth.uid() = owner);
  END IF;
END $$;

-- Allow admins to delete any blog documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Admins can delete any blog documents'
  ) THEN
    CREATE POLICY "Admins can delete any blog documents"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'blog-documents' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

-- Allow public read access to blog documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Public can view blog documents'
  ) THEN
    CREATE POLICY "Public can view blog documents"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'blog-documents');
  END IF;
END $$;
