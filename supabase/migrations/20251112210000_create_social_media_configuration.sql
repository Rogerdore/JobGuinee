/*
  # Système de Configuration des Réseaux Sociaux

  1. Nouvelle Table
    - `social_media_configuration`
      - `id` (uuid, primary key)
      - `facebook_url` (text) - Lien Facebook
      - `instagram_url` (text) - Lien Instagram
      - `tiktok_url` (text) - Lien TikTok
      - `youtube_url` (text) - Lien YouTube
      - `linkedin_url` (text) - Lien LinkedIn
      - `twitter_url` (text) - Lien Twitter/X
      - `enable_facebook` (boolean) - Activer Facebook
      - `enable_instagram` (boolean) - Activer Instagram
      - `enable_tiktok` (boolean) - Activer TikTok
      - `enable_youtube` (boolean) - Activer YouTube
      - `enable_linkedin` (boolean) - Activer LinkedIn
      - `enable_twitter` (boolean) - Activer Twitter/X
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur `social_media_configuration`
    - Tout le monde peut lire
    - Seuls les admins peuvent modifier
*/

-- Créer la table de configuration des réseaux sociaux
CREATE TABLE IF NOT EXISTS social_media_configuration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  youtube_url text,
  linkedin_url text,
  twitter_url text,
  enable_facebook boolean DEFAULT false,
  enable_instagram boolean DEFAULT false,
  enable_tiktok boolean DEFAULT false,
  enable_youtube boolean DEFAULT false,
  enable_linkedin boolean DEFAULT false,
  enable_twitter boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE social_media_configuration ENABLE ROW LEVEL SECURITY;

-- Policies pour social_media_configuration
CREATE POLICY "Tout le monde peut lire la configuration des réseaux sociaux"
  ON social_media_configuration FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public peut lire la configuration des réseaux sociaux"
  ON social_media_configuration FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Seuls les admins peuvent insérer la configuration"
  ON social_media_configuration FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Seuls les admins peuvent modifier la configuration"
  ON social_media_configuration FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Seuls les admins peuvent supprimer la configuration"
  ON social_media_configuration FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_social_media_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_media_configuration_updated_at_trigger
  BEFORE UPDATE ON social_media_configuration
  FOR EACH ROW
  EXECUTE FUNCTION update_social_media_configuration_updated_at();

-- Insérer une configuration par défaut
INSERT INTO social_media_configuration (
  facebook_url,
  instagram_url,
  tiktok_url,
  youtube_url,
  linkedin_url,
  twitter_url,
  enable_facebook,
  enable_instagram,
  enable_tiktok,
  enable_youtube,
  enable_linkedin,
  enable_twitter
) VALUES (
  'https://facebook.com/jobguinee',
  'https://instagram.com/jobguinee',
  'https://tiktok.com/@jobguinee',
  'https://youtube.com/@jobguinee',
  'https://linkedin.com/company/jobguinee',
  'https://twitter.com/jobguinee',
  false,
  false,
  false,
  false,
  false,
  false
) ON CONFLICT DO NOTHING;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_social_media_configuration_created_at
  ON social_media_configuration(created_at DESC);
