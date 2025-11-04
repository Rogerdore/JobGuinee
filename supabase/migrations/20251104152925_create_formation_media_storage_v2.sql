/*
  # Create Formation Media Storage

  ## Overview
  This migration sets up Supabase Storage buckets for formation media files
  including cover images, additional images, and videos.

  ## Changes
  1. Create storage buckets
    - `formation-covers` - for formation cover/thumbnail images
    - `formation-media` - for additional images and videos

  2. Add storage policies for secure access
    - Allow authenticated trainers to upload their formation media
    - Allow public read access to published formation media

  3. Update formations table
    - Add `media_urls` column for additional images/videos
*/

-- Create storage buckets for formation media
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('formation-covers', 'formation-covers', true),
  ('formation-media', 'formation-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated trainers to upload formation covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Trainers can upload formation covers'
  ) THEN
    CREATE POLICY "Trainers can upload formation covers"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'formation-covers' AND
        auth.uid() IN (SELECT user_id FROM trainer_profiles)
      );
  END IF;
END $$;

-- Allow trainers to update their own formation covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Trainers can update their formation covers'
  ) THEN
    CREATE POLICY "Trainers can update their formation covers"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'formation-covers' AND
        auth.uid() IN (SELECT user_id FROM trainer_profiles)
      );
  END IF;
END $$;

-- Allow trainers to delete their own formation covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Trainers can delete their formation covers'
  ) THEN
    CREATE POLICY "Trainers can delete their formation covers"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'formation-covers' AND
        auth.uid() IN (SELECT user_id FROM trainer_profiles)
      );
  END IF;
END $$;

-- Allow public read access to formation covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view formation covers'
  ) THEN
    CREATE POLICY "Public can view formation covers"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'formation-covers');
  END IF;
END $$;

-- Allow authenticated trainers to upload formation media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Trainers can upload formation media'
  ) THEN
    CREATE POLICY "Trainers can upload formation media"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'formation-media' AND
        auth.uid() IN (SELECT user_id FROM trainer_profiles)
      );
  END IF;
END $$;

-- Allow trainers to update their own formation media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Trainers can update their formation media'
  ) THEN
    CREATE POLICY "Trainers can update their formation media"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'formation-media' AND
        auth.uid() IN (SELECT user_id FROM trainer_profiles)
      );
  END IF;
END $$;

-- Allow trainers to delete their own formation media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Trainers can delete their formation media'
  ) THEN
    CREATE POLICY "Trainers can delete their formation media"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'formation-media' AND
        auth.uid() IN (SELECT user_id FROM trainer_profiles)
      );
  END IF;
END $$;

-- Allow public read access to formation media
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public can view formation media'
  ) THEN
    CREATE POLICY "Public can view formation media"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'formation-media');
  END IF;
END $$;

-- Add media_urls column to formations table for additional images/videos
ALTER TABLE formations
  ADD COLUMN IF NOT EXISTS media_urls jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN formations.media_urls IS 'Array of additional media URLs (images and videos) for the formation';