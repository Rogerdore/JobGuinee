-- Fix and add social media settings
DELETE FROM site_settings WHERE key LIKE 'social_%' OR key LIKE 'social_%\n';

INSERT INTO site_settings (key, value, category, description, is_public) VALUES
('social_facebook', '"https://facebook.com/jobguinee"', 'social', 'Lien Facebook', true),
('social_linkedin', '"https://linkedin.com/company/jobguinee"', 'social', 'Lien LinkedIn', true),
('social_twitter', '"https://twitter.com/JobGuinee"', 'social', 'Lien Twitter', true),
('social_instagram', '"https://instagram.com/jobguinee"', 'social', 'Lien Instagram', true),
('social_whatsapp', '"https://wa.me/224620000000"', 'social', 'Lien WhatsApp', true)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_public = EXCLUDED.is_public;
