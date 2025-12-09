-- Create bucket for blog media if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-media', 'blog-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for blog-media bucket
CREATE POLICY "Public can view blog media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'blog-media');

CREATE POLICY "Authenticated users can upload blog media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'blog-media');

CREATE POLICY "Authenticated users can delete their blog media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'blog-media' AND auth.uid() = owner);