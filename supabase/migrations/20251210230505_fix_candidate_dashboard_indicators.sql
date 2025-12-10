/*
  # Correction des indicateurs du tableau de bord candidat

  1. Nouvelles Tables
    - `job_views`: Suivi des consultations d'offres par candidat
    - `formation_enrollments`: Inscriptions aux formations par candidat
  
  2. Modifications Tables Existantes
    - `applications`: Ajout de la colonne `ai_match_score` (score de compatibilité IA 0-100)
  
  3. Security
    - Enable RLS sur toutes les nouvelles tables
    - Policies pour que les utilisateurs accèdent uniquement à leurs données
*/

-- Ajouter la colonne ai_match_score à applications
ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS ai_match_score INTEGER DEFAULT NULL CHECK (ai_match_score >= 0 AND ai_match_score <= 100);

-- Table pour le suivi des vues d'offres
CREATE TABLE IF NOT EXISTS job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les inscriptions aux formations
CREATE TABLE IF NOT EXISTS formation_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, formation_id)
);

-- Enable RLS
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE formation_enrollments ENABLE ROW LEVEL SECURITY;

-- Policies pour job_views
CREATE POLICY "Users can view their own job views"
  ON job_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job views"
  ON job_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policies pour formation_enrollments
CREATE POLICY "Users can view their own enrollments"
  ON formation_enrollments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enrollments"
  ON formation_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments"
  ON formation_enrollments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_job_views_user_id ON job_views(user_id);
CREATE INDEX IF NOT EXISTS idx_job_views_job_id ON job_views(job_id);
CREATE INDEX IF NOT EXISTS idx_job_views_viewed_at ON job_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_user_id ON formation_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_formation_id ON formation_enrollments(formation_id);
CREATE INDEX IF NOT EXISTS idx_formation_enrollments_status ON formation_enrollments(status);
