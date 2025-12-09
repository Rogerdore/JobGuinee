-- Create bucket for formation media
INSERT INTO storage.buckets (id, name, public)
VALUES ('formation-media', 'formation-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for formation-media bucket
CREATE POLICY "Public can view formation media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'formation-media');

CREATE POLICY "Authenticated users can upload formation media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'formation-media');

CREATE POLICY "Authenticated users can delete their formation media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'formation-media' AND auth.uid() = owner);