/*
  # Add YouTube and Instagram to social media settings

  ## Changes
  - Inserts default (empty) entries for social_instagram and social_youtube in site_settings
  - value column is jsonb, so empty string is stored as JSON string '""'
  - Uses ON CONFLICT DO NOTHING to avoid duplicates if already present
  - Category: 'social' to match existing social settings pattern
*/

INSERT INTO site_settings (key, value, category, description, is_public)
VALUES
  ('social_instagram', '""'::jsonb, 'social', 'Lien Instagram de la plateforme', true),
  ('social_youtube', '""'::jsonb, 'social', 'Lien YouTube de la plateforme', true)
ON CONFLICT (key) DO NOTHING;
