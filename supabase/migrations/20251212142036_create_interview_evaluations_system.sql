/*
  # Système d'Évaluation Post-Entretien (V2)

  ## Description
  Ce système permet aux recruteurs d'évaluer les candidats après un entretien avec un scoring détaillé
  et des recommandations d'embauche.

  ## Nouvelles Tables

  ### interview_evaluations
  Table contenant les évaluations détaillées post-entretien
  - id (uuid, clé primaire)
  - interview_id (uuid, référence vers interviews)
  - application_id (uuid, référence vers applications)
  - recruiter_id (uuid, référence vers profiles)
  - technical_score (integer 0-100) - Compétences techniques
  - soft_skills_score (integer 0-100) - Soft skills
  - motivation_score (integer 0-100) - Motivation et engagement
  - cultural_fit_score (integer 0-100) - Adéquation culturelle
  - overall_score (integer 0-100) - Score global calculé
  - recommendation (text) - recommended | to_confirm | not_retained
  - strengths (text) - Points forts identifiés
  - weaknesses (text) - Points d'amélioration
  - detailed_feedback (text) - Commentaires détaillés
  - hiring_recommendation_notes (text) - Notes pour la décision finale
  - created_at (timestamp)
  - updated_at (timestamp)

  ## Sécurité
  - RLS activé sur interview_evaluations
  - Seuls les recruteurs de l'entreprise peuvent créer/modifier des évaluations
  - Les évaluations ne sont jamais visibles par les candidats

  ## Index
  - Index sur interview_id pour récupération rapide
  - Index sur application_id pour comparaisons
  - Index composite sur (application_id, overall_score DESC) pour classements
*/

-- Créer la table d'évaluations post-entretien
CREATE TABLE IF NOT EXISTS interview_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
  soft_skills_score INTEGER CHECK (soft_skills_score >= 0 AND soft_skills_score <= 100),
  motivation_score INTEGER CHECK (motivation_score >= 0 AND motivation_score <= 100),
  cultural_fit_score INTEGER CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  
  recommendation TEXT CHECK (recommendation IN ('recommended', 'to_confirm', 'not_retained')),
  
  strengths TEXT,
  weaknesses TEXT,
  detailed_feedback TEXT,
  hiring_recommendation_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(interview_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_interview ON interview_evaluations(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_application ON interview_evaluations(application_id);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_score ON interview_evaluations(application_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_interview_evaluations_recommendation ON interview_evaluations(recommendation) WHERE recommendation IS NOT NULL;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_interview_evaluation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interview_evaluation_updated ON interview_evaluations;
CREATE TRIGGER interview_evaluation_updated
  BEFORE UPDATE ON interview_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_interview_evaluation_timestamp();

-- Function pour calculer le score global
CREATE OR REPLACE FUNCTION calculate_overall_score(
  technical INTEGER,
  soft_skills INTEGER,
  motivation INTEGER,
  cultural_fit INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN ROUND(
    (COALESCE(technical, 0) * 0.3 + 
     COALESCE(soft_skills, 0) * 0.25 + 
     COALESCE(motivation, 0) * 0.25 + 
     COALESCE(cultural_fit, 0) * 0.2)
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger pour auto-calculer le score global
CREATE OR REPLACE FUNCTION auto_calculate_overall_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.overall_score = calculate_overall_score(
    NEW.technical_score,
    NEW.soft_skills_score,
    NEW.motivation_score,
    NEW.cultural_fit_score
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS interview_evaluation_calculate_score ON interview_evaluations;
CREATE TRIGGER interview_evaluation_calculate_score
  BEFORE INSERT OR UPDATE ON interview_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION auto_calculate_overall_score();

-- RLS Policies
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Recruiters can create evaluations for their interviews" ON interview_evaluations;
DROP POLICY IF EXISTS "Recruiters can view their company evaluations" ON interview_evaluations;
DROP POLICY IF EXISTS "Recruiters can update their own evaluations" ON interview_evaluations;
DROP POLICY IF EXISTS "Recruiters can delete their own evaluations" ON interview_evaluations;

-- Politique: Les recruteurs peuvent créer des évaluations pour leurs entretiens
CREATE POLICY "Recruiters can create evaluations for their interviews"
  ON interview_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE i.id = interview_evaluations.interview_id
        AND c.profile_id = auth.uid()
    )
  );

-- Politique: Les recruteurs peuvent voir les évaluations de leur entreprise
CREATE POLICY "Recruiters can view their company evaluations"
  ON interview_evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM interviews i
      JOIN applications a ON a.id = i.application_id
      JOIN jobs j ON j.id = a.job_id
      JOIN companies c ON c.id = j.company_id
      WHERE i.id = interview_evaluations.interview_id
        AND c.profile_id = auth.uid()
    )
  );

-- Politique: Les recruteurs peuvent modifier leurs propres évaluations
CREATE POLICY "Recruiters can update their own evaluations"
  ON interview_evaluations
  FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

-- Politique: Les recruteurs peuvent supprimer leurs propres évaluations
CREATE POLICY "Recruiters can delete their own evaluations"
  ON interview_evaluations
  FOR DELETE
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Vue pour comparaison des candidats par offre
CREATE OR REPLACE VIEW job_candidate_comparison AS
SELECT 
  j.id as job_id,
  j.title as job_title,
  a.id as application_id,
  a.candidate_id,
  p.full_name as candidate_name,
  a.ai_match_score,
  ie.overall_score as interview_score,
  ie.recommendation,
  ie.technical_score,
  ie.soft_skills_score,
  ie.motivation_score,
  ie.cultural_fit_score,
  a.is_shortlisted,
  a.workflow_stage,
  ie.created_at as evaluated_at
FROM jobs j
JOIN applications a ON a.job_id = j.id
JOIN profiles p ON p.id = a.candidate_id
LEFT JOIN interviews i ON i.application_id = a.id AND i.status = 'completed'
LEFT JOIN interview_evaluations ie ON ie.interview_id = i.id
WHERE a.workflow_stage NOT IN ('rejected', 'withdrawn')
ORDER BY j.id, ie.overall_score DESC NULLS LAST, a.ai_match_score DESC NULLS LAST;
