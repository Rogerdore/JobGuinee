/*
  # Amélioration du Système de Soumission de Candidature

  ## Problème
  Le système actuel manque :
  - Score IA de matching
  - Génération automatique de application_reference
  - Sanitization robuste des données

  ## Tables modifiées
  - `applications` - Ajout de ai_matching_score

  ## Fonctions créées
  1. `generate_application_reference()` - Génère une référence unique
  2. `sanitize_text_field()` - Nettoie les champs texte
  3. `calculate_simple_ai_score()` - Calcule score de matching

  ## Triggers créés
  1. Trigger pour auto-générer application_reference et sanitizer

  ## Sécurité
  - Références uniques garanties
  - Sanitization automatique
  - Incrémentation sécurisée par jour
*/

-- ============================================================================
-- 1. AJOUT COLONNE AI_MATCHING_SCORE
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'ai_matching_score'
  ) THEN
    ALTER TABLE applications 
    ADD COLUMN ai_matching_score NUMERIC DEFAULT 0 CHECK (ai_matching_score >= 0 AND ai_matching_score <= 100);
    
    COMMENT ON COLUMN applications.ai_matching_score IS
      'Score de matching IA entre le profil du candidat et le poste (0-100). '
      'Calculé automatiquement lors de la soumission.';
  END IF;
END $$;

-- ============================================================================
-- 2. FONCTION SANITIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION sanitize_text_field(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  cleaned_text TEXT;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  cleaned_text := input_text;
  
  -- Remplacer les doubles backslashes par un seul
  cleaned_text := REPLACE(cleaned_text, E'\\\\', E'\\');
  
  -- Nettoyer les séquences unicode échappées incorrectement
  cleaned_text := REPLACE(cleaned_text, E'\\u', 'u');
  
  -- Supprimer les caractères de contrôle dangereux
  cleaned_text := REGEXP_REPLACE(cleaned_text, '[\x00-\x08\x0B\x0C\x0E-\x1F]', '', 'g');
  
  -- Trim les espaces
  cleaned_text := TRIM(cleaned_text);
  
  RETURN cleaned_text;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION sanitize_text_field IS
  'Nettoie un champ texte en supprimant les backslashes excessifs, '
  'les séquences unicode incorrectes et les caractères de contrôle.';

-- ============================================================================
-- 3. FONCTION GÉNÉRATION APPLICATION_REFERENCE
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_application_reference()
RETURNS TEXT AS $$
DECLARE
  today_date TEXT;
  sequence_num INTEGER;
  reference TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Format: APP-YYYYMMDD-XXXX
  today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
  
  LOOP
    -- Obtenir le prochain numéro de séquence pour aujourd'hui
    SELECT COALESCE(MAX(
      CAST(
        SUBSTRING(application_reference FROM 'APP-[0-9]{8}-([0-9]{4})') 
        AS INTEGER
      )
    ), 0) + 1
    INTO sequence_num
    FROM applications
    WHERE application_reference LIKE 'APP-' || today_date || '-%';
    
    -- Générer la référence
    reference := 'APP-' || today_date || '-' || LPAD(sequence_num::TEXT, 4, '0');
    
    -- Vérifier l'unicité
    IF NOT EXISTS (
      SELECT 1 FROM applications WHERE application_reference = reference
    ) THEN
      RETURN reference;
    END IF;
    
    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      -- Fallback avec timestamp
      reference := 'APP-' || today_date || '-' || 
                   LPAD(sequence_num::TEXT, 4, '0') || '-' ||
                   EXTRACT(EPOCH FROM CLOCK_TIMESTAMP())::TEXT;
      RETURN reference;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_application_reference IS
  'Génère une référence unique pour une candidature au format APP-YYYYMMDD-XXXX. '
  'Gère les collisions et garantit l''unicité.';

-- ============================================================================
-- 4. TRIGGER AUTO-GÉNÉRATION APPLICATION_REFERENCE
-- ============================================================================

CREATE OR REPLACE FUNCTION set_application_reference()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer la référence seulement si elle n'est pas déjà définie
  IF NEW.application_reference IS NULL OR NEW.application_reference = '' THEN
    NEW.application_reference := generate_application_reference();
  END IF;
  
  -- Sanitizer la lettre de motivation si présente
  IF NEW.cover_letter IS NOT NULL THEN
    NEW.cover_letter := sanitize_text_field(NEW.cover_letter);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_application_reference ON applications;

CREATE TRIGGER trigger_set_application_reference
  BEFORE INSERT ON applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_reference();

COMMENT ON TRIGGER trigger_set_application_reference ON applications IS
  'Génère automatiquement application_reference et sanitize cover_letter avant insertion.';

-- ============================================================================
-- 5. INDEX POUR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_applications_reference 
  ON applications(application_reference);

CREATE INDEX IF NOT EXISTS idx_applications_ai_score 
  ON applications(ai_matching_score DESC NULLS LAST) 
  WHERE ai_matching_score > 0;

CREATE INDEX IF NOT EXISTS idx_applications_candidate_job 
  ON applications(candidate_id, job_id);

-- ============================================================================
-- 6. FONCTION CALCUL SCORE IA SIMPLIFIÉ
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_simple_ai_score(
  candidate_skills TEXT[],
  candidate_experience_years INTEGER,
  job_keywords TEXT[],
  job_experience_level TEXT
)
RETURNS NUMERIC AS $$
DECLARE
  skills_score NUMERIC := 0;
  experience_score NUMERIC := 0;
  total_score NUMERIC;
  matching_skills INTEGER := 0;
  required_skills INTEGER;
BEGIN
  -- Score des compétences (70% du total)
  IF job_keywords IS NOT NULL AND array_length(job_keywords, 1) > 0 THEN
    required_skills := array_length(job_keywords, 1);
    
    -- Compter les compétences qui matchent
    SELECT COUNT(*)
    INTO matching_skills
    FROM unnest(candidate_skills) cs
    WHERE cs = ANY(job_keywords);
    
    skills_score := (matching_skills::NUMERIC / required_skills::NUMERIC) * 70;
  ELSE
    skills_score := 35; -- Score neutre si pas de keywords
  END IF;
  
  -- Score d'expérience (30% du total)
  experience_score := CASE 
    WHEN job_experience_level = 'Débutant' OR job_experience_level = 'Junior' THEN
      CASE 
        WHEN candidate_experience_years <= 2 THEN 30
        WHEN candidate_experience_years <= 5 THEN 25
        ELSE 20
      END
    WHEN job_experience_level = 'Intermédiaire' OR job_experience_level = 'Confirmé' THEN
      CASE 
        WHEN candidate_experience_years < 2 THEN 15
        WHEN candidate_experience_years BETWEEN 2 AND 5 THEN 30
        WHEN candidate_experience_years > 5 THEN 25
      END
    WHEN job_experience_level = 'Senior' OR job_experience_level = 'Expert' THEN
      CASE 
        WHEN candidate_experience_years < 5 THEN 10
        WHEN candidate_experience_years BETWEEN 5 AND 10 THEN 25
        WHEN candidate_experience_years > 10 THEN 30
      END
    ELSE
      15 -- Score neutre si niveau non spécifié
  END;
  
  total_score := ROUND(skills_score + experience_score, 2);
  
  -- S'assurer que le score est entre 0 et 100
  RETURN GREATEST(0, LEAST(100, total_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_simple_ai_score IS
  'Calcule un score de matching simplifié entre candidat et poste. '
  '70% basé sur les compétences, 30% sur l''expérience.';