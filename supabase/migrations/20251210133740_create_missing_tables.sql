/*
  # Création des tables manquantes

  1. Nouvelles Tables
    - `site_settings` - Paramètres globaux du site
      - `id` (uuid, primary key)
      - `key` (text, unique) - Clé du paramètre
      - `value` (jsonb) - Valeur du paramètre
      - `is_public` (boolean) - Si le paramètre est public
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `notification_preferences` - Préférences de notification des utilisateurs
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `email_notifications` (boolean)
      - `sms_notifications` (boolean)
      - `push_notifications` (boolean)
      - `job_alerts` (boolean)
      - `application_updates` (boolean)
      - `marketing_emails` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `cms_sections` - Sections CMS du site
      - `id` (uuid, primary key)
      - `section_key` (text, unique)
      - `title` (text)
      - `content` (jsonb)
      - `status` (text) - active, inactive
      - `display_order` (integer)
      - `page_location` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour permettre la lecture publique des paramètres publics
    - Politiques pour les utilisateurs authentifiés
*/

-- Table site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb DEFAULT '{}'::jsonb,
  is_public boolean DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour lecture publique des paramètres publics
CREATE POLICY "Public settings are viewable by everyone"
  ON site_settings FOR SELECT
  USING (is_public = true);

-- Politique pour admin
CREATE POLICY "Admins can manage all settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Table notification_preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email_notifications boolean DEFAULT true,
  sms_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  job_alerts boolean DEFAULT true,
  application_updates boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques pour notification_preferences
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Table cms_sections
CREATE TABLE IF NOT EXISTS cms_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL,
  content jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  display_order integer DEFAULT 0,
  page_location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cms_sections ENABLE ROW LEVEL SECURITY;

-- Politiques pour cms_sections
CREATE POLICY "Active CMS sections are viewable by everyone"
  ON cms_sections FOR SELECT
  USING (status = 'active');

CREATE POLICY "Admins can manage CMS sections"
  ON cms_sections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Fonction pour créer automatiquement les préférences de notification
CREATE OR REPLACE FUNCTION create_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer les préférences de notification lors de la création d'un utilisateur
DROP TRIGGER IF EXISTS on_auth_user_created_notification_prefs ON auth.users;
CREATE TRIGGER on_auth_user_created_notification_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_preferences();

-- Insérer des paramètres par défaut
INSERT INTO site_settings (key, value, is_public, description)
VALUES 
  ('site_name', '"JobGuinee"'::jsonb, true, 'Nom du site'),
  ('site_description', '"Plateforme de recrutement en Guinée"'::jsonb, true, 'Description du site'),
  ('contact_email', '"contact@jobguinee.com"'::jsonb, true, 'Email de contact'),
  ('maintenance_mode', 'false'::jsonb, true, 'Mode maintenance')
ON CONFLICT (key) DO NOTHING;

-- Insérer des sections CMS par défaut
INSERT INTO cms_sections (section_key, title, content, page_location)
VALUES 
  ('home_hero', 'Section Hero', '{"heading": "Trouvez votre prochain emploi", "subheading": "La plateforme de recrutement en Guinée"}'::jsonb, 'home'),
  ('home_features', 'Fonctionnalités', '{"features": []}'::jsonb, 'home'),
  ('about_us', 'À propos', '{"content": "JobGuinee est la première plateforme de recrutement en Guinée."}'::jsonb, 'about')
ON CONFLICT (section_key) DO NOTHING;
