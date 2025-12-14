/*
  # Ajouter les champs manquants à la table jobs

  ## Colonnes ajoutées
  
  ### Informations du poste
  - `category` - Catégorie du poste (ex: Ressources Humaines, IT, etc.)
  - `position_count` - Nombre de postes à pourvoir
  - `position_level` - Niveau du poste (Junior, Intermédiaire, Senior)
  - `profile_sought` - Description du profil recherché
  
  ### Informations de l'entreprise
  - `company_logo_url` - URL du logo de l'entreprise
  - `company_description` - Description de l'entreprise
  - `company_website` - Site web de l'entreprise
  
  ### Rémunération
  - `salary_range` - Fourchette de salaire en texte
  - `salary_type` - Type de salaire (Négociable, Fixe, etc.)
  
  ### Candidature
  - `application_email` - Email pour postuler
  - `receive_in_platform` - Recevoir candidatures sur la plateforme
  - `required_documents` - Documents requis (CV, lettre, etc.)
  - `application_instructions` - Instructions pour postuler
  
  ### Publication et visibilité
  - `visibility` - Visibilité de l'offre (Publique, Privée)
  - `is_premium` - Offre premium avec fonctionnalités avancées
  - `announcement_language` - Langue de l'annonce
  - `auto_share` - Partage automatique sur réseaux sociaux
  - `publication_duration` - Durée de publication
  - `auto_renewal` - Renouvellement automatique
  - `legal_compliance` - Conformité légale acceptée
*/

-- Informations du poste
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS position_count integer DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS position_level text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS profile_sought text;

-- Informations de l'entreprise
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_logo_url text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_description text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_website text;

-- Rémunération
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_range text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_type text DEFAULT 'Négociable';

-- Candidature
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_email text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS receive_in_platform boolean DEFAULT true;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS required_documents text[] DEFAULT ARRAY['CV', 'Lettre de motivation'];
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_instructions text;

-- Publication et visibilité
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'Publique';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS announcement_language text DEFAULT 'Français';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_share boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS publication_duration text DEFAULT '30 jours';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS auto_renewal boolean DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS legal_compliance boolean DEFAULT false;

-- Colonnes additionnelles pour application_deadline
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_deadline date;

-- Ajouter des contraintes et valeurs par défaut
ALTER TABLE jobs ALTER COLUMN position_count SET DEFAULT 1;
ALTER TABLE jobs ALTER COLUMN receive_in_platform SET DEFAULT true;
ALTER TABLE jobs ALTER COLUMN visibility SET DEFAULT 'Publique';
ALTER TABLE jobs ALTER COLUMN is_premium SET DEFAULT false;
ALTER TABLE jobs ALTER COLUMN announcement_language SET DEFAULT 'Français';
ALTER TABLE jobs ALTER COLUMN auto_share SET DEFAULT false;
ALTER TABLE jobs ALTER COLUMN publication_duration SET DEFAULT '30 jours';
ALTER TABLE jobs ALTER COLUMN auto_renewal SET DEFAULT false;
ALTER TABLE jobs ALTER COLUMN legal_compliance SET DEFAULT false;

-- Créer un index sur les colonnes fréquemment recherchées
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_position_level ON jobs(position_level);
CREATE INDEX IF NOT EXISTS idx_jobs_visibility ON jobs(visibility);
CREATE INDEX IF NOT EXISTS idx_jobs_is_premium ON jobs(is_premium);
