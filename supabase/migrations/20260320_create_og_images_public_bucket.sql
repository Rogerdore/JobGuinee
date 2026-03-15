-- Create the og-images storage bucket as PUBLIC so Facebook can access generated OG images
-- This bucket stores auto-generated Open Graph images for job listings

INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow the service role (Edge Functions) to upload OG images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Service role can manage OG images'
  ) THEN
    CREATE POLICY "Service role can manage OG images"
    ON storage.objects FOR ALL
    TO service_role
    USING (bucket_id = 'og-images')
    WITH CHECK (bucket_id = 'og-images');
  END IF;
END $$;

-- Allow public (anonymous) read access to OG images
-- This is essential for Facebook/LinkedIn/Twitter crawlers to fetch the images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Public can view OG images'
  ) THEN
    CREATE POLICY "Public can view OG images"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'og-images');
  END IF;
END $$;
