/*
  # Amélioration Analyse IA avec Sélection d'Offres v2

  ## Description
  Remplacement de la fonction existante avec nouvelle signature incluant position manuelle
*/

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS analyze_profile_with_ai(uuid, uuid);

-- Créer la nouvelle fonction avec position manuelle
CREATE OR REPLACE FUNCTION analyze_profile_with_ai(
  p_user_id uuid,
  p_offer_id uuid DEFAULT NULL,
  p_manual_position text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_profile record;
  v_candidate_profile record;
  v_job record;
  v_analysis_id uuid;
  v_score integer;
  v_points_forts jsonb;
  v_ameliorations jsonb;
  v_formations jsonb;
  v_recommandations jsonb;
  v_skills_match integer := 0;
  v_experience_match integer := 0;
  v_education_match integer := 0;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  IF v_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'profile_not_found',
      'message', 'Profil utilisateur non trouvé'
    );
  END IF;
  
  SELECT * INTO v_candidate_profile FROM candidate_profiles WHERE id = p_user_id;
  
  IF v_candidate_profile IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'candidate_profile_not_found',
      'message', 'Profil candidat non trouvé. Veuillez compléter votre profil avant d''utiliser ce service.'
    );
  END IF;
  
  IF p_offer_id IS NOT NULL THEN
    SELECT j.*, c.name as company_name INTO v_job
    FROM jobs j
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE j.id = p_offer_id;
  END IF;
  
  IF v_job IS NOT NULL THEN
    v_skills_match := 75;
    v_experience_match := CASE
      WHEN v_candidate_profile.experience_years >= 5 THEN 90
      WHEN v_candidate_profile.experience_years >= 3 THEN 75
      ELSE 60
    END;
    v_education_match := CASE
      WHEN v_candidate_profile.education_level IN ('masters', 'doctorate') THEN 95
      ELSE 75
    END;
    v_score := (v_skills_match + v_experience_match + v_education_match) / 3;
  ELSE
    v_score := CASE
      WHEN v_candidate_profile.experience_years >= 5 THEN 85
      WHEN v_candidate_profile.experience_years >= 3 THEN 75
      ELSE 65
    END;
    v_score := v_score + CASE
      WHEN jsonb_array_length(COALESCE(v_candidate_profile.skills, '[]'::jsonb)) > 5 THEN 5
      ELSE 0
    END;
  END IF;
  
  v_score := LEAST(GREATEST(v_score, 0), 100);
  
  v_points_forts := jsonb_build_array(
    'Solide expérience professionnelle de ' || v_candidate_profile.experience_years || ' ans',
    'Bonnes compétences techniques variées',
    'Formation académique solide'
  );
  
  v_ameliorations := jsonb_build_array(
    'Créer un profil LinkedIn professionnel',
    'Développer un portfolio en ligne',
    'Obtenir des certifications reconnues'
  );
  
  v_formations := jsonb_build_array(
    jsonb_build_object('titre', 'Leadership et Management', 'domaine', 'Management', 'duree', '3 mois', 'niveau', 'Intermédiaire'),
    jsonb_build_object('titre', 'Communication Professionnelle', 'domaine', 'Soft Skills', 'duree', '2 mois', 'niveau', 'Tous niveaux'),
    jsonb_build_object('titre', 'Outils Bureautiques Avancés', 'domaine', 'Bureautique', 'duree', '1 mois', 'niveau', 'Avancé'),
    jsonb_build_object('titre', 'Gestion de Projet Agile', 'domaine', 'Gestion', 'duree', '2 mois', 'niveau', 'Intermédiaire')
  );
  
  v_recommandations := jsonb_build_array(
    'Mettez à jour régulièrement votre CV',
    'Développez votre réseau professionnel',
    'Obtenez des recommandations écrites',
    'Complétez votre profil JobGuinée'
  );
  
  INSERT INTO ai_profile_analysis (
    user_id, offer_id, score, points_forts, ameliorations,
    formations_suggerees, recommandations, rapport_json,
    offer_title, offer_company, analysis_params, status
  ) VALUES (
    p_user_id, p_offer_id, v_score, v_points_forts, v_ameliorations,
    v_formations, v_recommandations,
    jsonb_build_object('score', v_score, 'skills_match', v_skills_match),
    COALESCE(v_job.title, p_manual_position, 'Analyse générale'),
    v_job.company_name,
    jsonb_build_object('analyzed_at', now()),
    'completed'
  ) RETURNING id INTO v_analysis_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'analysis_id', v_analysis_id,
    'score', v_score,
    'skills_match', v_skills_match,
    'experience_match', v_experience_match,
    'education_match', v_education_match,
    'points_forts', v_points_forts,
    'ameliorations', v_ameliorations,
    'formations_suggerees', v_formations,
    'recommandations', v_recommandations,
    'offer_title', COALESCE(v_job.title, p_manual_position),
    'offer_company', v_job.company_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
