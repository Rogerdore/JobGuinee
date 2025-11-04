/*
  # Create Blog Media Storage

  ## Overview
  This migration sets up Supabase Storage buckets for blog post media files
  including cover images and additional media content.

  ## Changes
  1. Create storage buckets
    - `blog-images` - for blog post images and thumbnails

  2. Add storage policies for secure access
    - Allow authenticated admins to upload blog media
    - Allow public read access to published blog media

  3. Update blog_posts table
    - Add `media_urls` column for additional images
*/

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated admins to upload blog images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can upload blog images'
  ) THEN
    CREATE POLICY "Admins can upload blog images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'blog-images' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

-- Allow admins to update blog images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can update blog images'
  ) THEN
    CREATE POLICY "Admins can update blog images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'blog-images' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

-- Allow admins to delete blog images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Admins can delete blog images'
  ) THEN
    CREATE POLICY "Admins can delete blog images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'blog-images' AND
        auth.uid() IN (SELECT id FROM profiles WHERE user_type = 'admin')
      );
  END IF;
END $$;

-- Allow public read access to blog images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view blog images'
  ) THEN
    CREATE POLICY "Public can view blog images"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'blog-images');
  END IF;
END $$;

-- Add media_urls column to blog_posts table for additional images
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS media_urls jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN blog_posts.media_urls IS 'Array of additional media URLs (images) for the blog post';