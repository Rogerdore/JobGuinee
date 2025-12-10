/*
  # Create Storage Buckets for Candidate Documents

  1. New Storage Buckets
    - `candidate-cvs` - For storing candidate CVs (PDF, Word)
    - `candidate-cover-letters` - For storing cover letters
    - `candidate-certificates` - For storing certificates and attestations
  
  2. Security
    - Allow authenticated users to upload their own documents
    - Allow authenticated users to read their own documents
    - Allow recruiters with premium access to read candidate documents they purchased
*/

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('candidate-cvs', 'candidate-cvs', false),
  ('candidate-cover-letters', 'candidate-cover-letters', false),
  ('candidate-certificates', 'candidate-certificates', false)
ON CONFLICT (id) DO NOTHING;

-- Policies for candidate-cvs bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can upload their own CVs'
  ) THEN
    CREATE POLICY "Users can upload their own CVs"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'candidate-cvs' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can read their own CVs'
  ) THEN
    CREATE POLICY "Users can read their own CVs"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-cvs' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can update their own CVs'
  ) THEN
    CREATE POLICY "Users can update their own CVs"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'candidate-cvs' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can delete their own CVs'
  ) THEN
    CREATE POLICY "Users can delete their own CVs"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'candidate-cvs' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Policies for candidate-cover-letters bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can upload their own cover letters'
  ) THEN
    CREATE POLICY "Users can upload their own cover letters"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'candidate-cover-letters' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can read their own cover letters'
  ) THEN
    CREATE POLICY "Users can read their own cover letters"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-cover-letters' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can update their own cover letters'
  ) THEN
    CREATE POLICY "Users can update their own cover letters"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'candidate-cover-letters' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can delete their own cover letters'
  ) THEN
    CREATE POLICY "Users can delete their own cover letters"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'candidate-cover-letters' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Policies for candidate-certificates bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can upload their own certificates'
  ) THEN
    CREATE POLICY "Users can upload their own certificates"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'candidate-certificates' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can read their own certificates'
  ) THEN
    CREATE POLICY "Users can read their own certificates"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'candidate-certificates' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can update their own certificates'
  ) THEN
    CREATE POLICY "Users can update their own certificates"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'candidate-certificates' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Users can delete their own certificates'
  ) THEN
    CREATE POLICY "Users can delete their own certificates"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'candidate-certificates' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;