/*
  # Create Resources System for Blog Page

  ## Overview
  This migration creates a comprehensive resources system allowing admins to publish
  downloadable resources like ebooks, documents, software, and other informational materials.

  ## Changes
  1. New Tables
    - `resources` - stores all resource information
      - `id` (uuid, primary key)
      - `title` (text, resource name)
      - `description` (text, resource description)
      - `category` (text, resource type: ebook, document, software, etc.)
      - `file_url` (text, link to file storage)
      - `file_type` (text, file extension/type)
      - `file_size` (text, readable file size)
      - `thumbnail_url` (text, preview image)
      - `author` (text, resource author/creator)
      - `download_count` (integer, track downloads)
      - `tags` (text array, searchable tags)
      - `published` (boolean, visibility status)
      - `published_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Storage Buckets
    - `resource-files` - for storing resource files
    - `resource-thumbnails` - for resource preview images

  3. Security
    - Enable RLS on resources table
    - Admins can manage all resources
    - Public can read published resources only
    - Storage policies for admin upload and public download
*/

-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  file_url text,
  file_type text,
  file_size text,
  thumbnail_url text,
  author text,
  download_count integer DEFAULT 0 NOT NULL,
  tags text[] DEFAULT '{}',
  published boolean DEFAULT false NOT NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow public to read published resources
CREATE POLICY "Public can view published resources"
  ON resources
  FOR SELECT
  TO public
  USING (published = true);

-- Allow admins to manage resources
CREATE POLICY "Admins can insert resources"
  ON resources
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
  );

CREATE POLICY "Admins can update resources"
  ON resources
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
  );

CREATE POLICY "Admins can delete resources"
  ON resources
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
  );

-- Create storage buckets for resource files
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('resource-files', 'resource-files', true),
  ('resource-thumbnails', 'resource-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resource files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload resource files'
  ) THEN
    CREATE POLICY "Admins can upload resource files"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'resource-files' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update resource files'
  ) THEN
    CREATE POLICY "Admins can update resource files"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'resource-files' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete resource files'
  ) THEN
    CREATE POLICY "Admins can delete resource files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'resource-files' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view resource files'
  ) THEN
    CREATE POLICY "Public can view resource files"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'resource-files');
  END IF;
END $$;

-- Storage policies for resource thumbnails
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload resource thumbnails'
  ) THEN
    CREATE POLICY "Admins can upload resource thumbnails"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'resource-thumbnails' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update resource thumbnails'
  ) THEN
    CREATE POLICY "Admins can update resource thumbnails"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'resource-thumbnails' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete resource thumbnails'
  ) THEN
    CREATE POLICY "Admins can delete resource thumbnails"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'resource-thumbnails' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view resource thumbnails'
  ) THEN
    CREATE POLICY "Public can view resource thumbnails"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'resource-thumbnails');
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_published ON resources(published);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_tags ON resources USING gin(tags);

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_resource_downloads(resource_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE resources
  SET download_count = download_count + 1
  WHERE id = resource_id;
END;
$$;

COMMENT ON TABLE resources IS 'Stores downloadable resources like ebooks, documents, software, etc.';
COMMENT ON FUNCTION increment_resource_downloads IS 'Safely increments the download count for a resource';