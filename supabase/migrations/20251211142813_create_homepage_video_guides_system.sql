/*
  # Système de Vidéo et Guides de la Page d'Accueil

  ## Description
  Ce système permet aux administrateurs de configurer une section dynamique sur la page d'accueil
  comprenant une vidéo de présentation et des guides utilisateurs catégorisés.

  ## Nouvelles Tables
  
  1. `homepage_video_settings` - Configuration de la vidéo de présentation
     - `id` (uuid, PK)
     - `is_enabled` (boolean) - Active/désactive la section
     - `video_url` (text) - URL de la vidéo (YouTube, Vimeo, MP4)
     - `video_file_url` (text) - URL du fichier vidéo uploadé
     - `thumbnail_url` (text) - Image miniature personnalisée
     - `title` (text) - Titre de la section
     - `description` (text) - Description de la section
     - `layout` (text) - Position de la vidéo (left/right)
     - `background_color` (text) - Couleur de fond
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. `homepage_guides` - Guides utilisateurs
     - `id` (uuid, PK)
     - `title` (text) - Titre du guide
     - `description` (text) - Description courte
     - `category` (text) - Catégorie (candidate, recruiter, trainer, ia, general)
     - `icon` (text) - Nom de l'icône Lucide
     - `file_url` (text) - URL du PDF ou lien externe
     - `file_type` (text) - Type (pdf, external_link)
     - `is_active` (boolean) - Active/désactive
     - `display_order` (integer) - Ordre d'affichage
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  ## Sécurité
  - RLS activé sur toutes les tables
  - Lecture publique pour tous les utilisateurs
  - Modification réservée aux administrateurs uniquement
*/

-- Table: homepage_video_settings
CREATE TABLE IF NOT EXISTS homepage_video_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled boolean DEFAULT true,
  video_url text,
  video_file_url text,
  thumbnail_url text,
  title text DEFAULT 'Découvrez JobGuinée',
  description text DEFAULT 'La plateforme N°1 de l''emploi en Guinée',
  layout text DEFAULT 'left' CHECK (layout IN ('left', 'right')),
  background_color text DEFAULT '#F9FAFB',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table: homepage_guides
CREATE TABLE IF NOT EXISTS homepage_guides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('candidate', 'recruiter', 'trainer', 'ia', 'general')),
  icon text DEFAULT 'FileText',
  file_url text NOT NULL,
  file_type text DEFAULT 'pdf' CHECK (file_type IN ('pdf', 'external_link')),
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE homepage_video_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_guides ENABLE ROW LEVEL SECURITY;

-- Policies: Public read access for all
CREATE POLICY "Public can view video settings"
  ON homepage_video_settings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view active guides"
  ON homepage_guides
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policies: Admin-only write access
CREATE POLICY "Admin can manage video settings"
  ON homepage_video_settings
  FOR ALL
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

CREATE POLICY "Admin can manage guides"
  ON homepage_guides
  FOR ALL
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

-- Insert default configuration
INSERT INTO homepage_video_settings (
  is_enabled,
  title,
  description,
  layout,
  background_color
) VALUES (
  true,
  'Découvrez JobGuinée',
  'La plateforme de recrutement digital qui connecte talents et opportunités en Guinée',
  'left',
  '#F9FAFB'
) ON CONFLICT DO NOTHING;

-- Insert example guides
INSERT INTO homepage_guides (title, description, category, icon, file_url, file_type, display_order) VALUES
('Guide du Candidat', 'Apprenez à créer un CV professionnel et à postuler efficacement', 'candidate', 'User', '#', 'external_link', 1),
('Guide du Recruteur', 'Publiez des offres et trouvez les meilleurs talents', 'recruiter', 'Briefcase', '#', 'external_link', 2),
('Guide Formateur/Organisme', 'Publiez vos formations et gérez vos inscriptions', 'trainer', 'GraduationCap', '#', 'external_link', 3),
('Services IA', 'Découvrez tous nos services d''intelligence artificielle', 'ia', 'Sparkles', '#', 'external_link', 4)
ON CONFLICT DO NOTHING;