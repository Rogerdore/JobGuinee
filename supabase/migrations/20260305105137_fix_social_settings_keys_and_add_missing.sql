/*
  # Fix social media settings keys

  ## Problem
  - social_facebook has a trailing newline in its key (\n)
  - social_linkedin, social_twitter, social_whatsapp are missing entirely
  - value format is inconsistent ({value: "url"} vs plain string)

  ## Fix
  - Delete the corrupted entry with newline in key
  - Insert all 6 social networks with clean keys and empty string values
  - Use ON CONFLICT DO NOTHING to preserve existing clean entries
*/

DELETE FROM site_settings WHERE key = E'social_facebook\n';

INSERT INTO site_settings (key, value, category, description, is_public)
VALUES
  ('social_facebook',  '""'::jsonb, 'social', 'Lien Facebook de la plateforme',  true),
  ('social_linkedin',  '""'::jsonb, 'social', 'Lien LinkedIn de la plateforme',  true),
  ('social_twitter',   '""'::jsonb, 'social', 'Lien Twitter/X de la plateforme', true),
  ('social_whatsapp',  '""'::jsonb, 'social', 'Lien WhatsApp de la plateforme',  true),
  ('social_instagram', '""'::jsonb, 'social', 'Lien Instagram de la plateforme', true),
  ('social_youtube',   '""'::jsonb, 'social', 'Lien YouTube de la plateforme',   true)
ON CONFLICT (key) DO NOTHING;
