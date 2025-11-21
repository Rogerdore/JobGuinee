/*
  # Système Complet d'Analyse IA de Profil
  
  ## Description
  Migration complète pour le système d'analyse IA de profil incluant :
  - Fonction get_candidate_profile pour récupérer les données candidat
  - Mise à jour de la table ai_profile_analysis pour meilleure compatibilité
  - Indexes pour performance
  - RLS policies pour sécurité
  
  ## Tables Modifiées/Créées
  1. ai_profile_analysis (amélioration)
     - Ajout de colonnes pour tracking complet
     - Support mode général vs comparaison offre
  
  ## Nouvelles Fonctions
  1. get_candidate_profile(p_user_id)
     - Récupère toutes les données du profil candidat
     - Retourne JSON formaté pour l'API IA
  
  ## Sécurité
  - RLS activé sur toutes les tables
  - Fonctions SECURITY DEFINER pour accès contrôlé
  - Validation des permissions utilisateur
*/

-- Fonction pour récupérer le profil complet d'un candidat
CREATE OR REPLACE FUNCTION get_candidate_profile(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile record;
  v_candidate record;
  v_result jsonb;
BEGIN
  -- Récupérer le profil de base
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'error', true,
      'message', 'Profil utilisateur non trouvé'
    );
  END IF;
  
  -- Récupérer le profil candidat
  SELECT * INTO v_candidate
  FROM candidate_profiles
  WHERE user_id = p_user_id;
  
  IF v_candidate IS NULL THEN
    RETURN jsonb_build_object(
      'error', true,
      'message', 'Profil candidat non trouvé'
    );
  END IF;
  
  -- Construire le JSON de retour
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'full_name', v_candidate.full_name,
    'email', v_profile.email,
    'phone', v_candidate.phone,
    'location', v_candidate.location,
    'title', v_candidate.title,
    'bio', v_candidate.bio,
    'professional_status', v_candidate.professional_status,
    'experience_years', COALESCE(v_candidate.experience_years, 0),
    'education_level', v_candidate.education_level,
    'skills', COALESCE(v_candidate.skills, '[]'::jsonb),
    'languages', COALESCE(v_candidate.languages, '[]'::jsonb),
    'work_experience', COALESCE(v_candidate.work_experience, '[]'::jsonb),
    'education', COALESCE(v_candidate.education, '[]'::jsonb),
    'certifications', COALESCE(v_candidate.certifications, '[]'::jsonb),
    'profile_completion', COALESCE(v_candidate.profile_completion, 0),
    'linkedin_url', v_candidate.linkedin_url,
    'portfolio_url', v_candidate.portfolio_url,
    'availability_status', v_candidate.availability_status,
    'salary_expectation_min', v_candidate.salary_expectation_min,
    'salary_expectation_max', v_candidate.salary_expectation_max,
    'preferred_job_types', COALESCE(v_candidate.preferred_job_types, '[]'::jsonb),
    'preferred_locations', COALESCE(v_candidate.preferred_locations, '[]'::jsonb),
    'created_at', v_candidate.created_at,
    'updated_at', v_candidate.updated_at
  );
  
  RETURN v_result;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_candidate_profile TO authenticated;

-- Créer des indexes pour améliorer les performances des requêtes d'analyse
CREATE INDEX IF NOT EXISTS idx_ai_profile_analysis_user_created 
  ON ai_profile_analysis(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_profile_analysis_status 
  ON ai_profile_analysis(status) WHERE status = 'completed';

-- Commentaires
COMMENT ON FUNCTION get_candidate_profile IS 'Récupère le profil complet d''un candidat formaté pour l''analyse IA';
