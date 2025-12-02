/*
  # Consolidate IA Service Input/Output Schemas

  1. Updates
    - Add comprehensive input_schema for each service
    - Add comprehensive output_schema for each service
    - Schemas match template placeholders

  2. Services Updated
    - ai_cv_generation
    - ai_cover_letter
    - ai_coach
    - ai_matching
    - ai_career_plan
*/

-- CV Generation Schemas
UPDATE ia_service_config
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "nom": {"type": "string", "label": "Nom complet"},
      "titre": {"type": "string", "label": "Titre professionnel"},
      "email": {"type": "string", "label": "Email"},
      "telephone": {"type": "string", "label": "Téléphone"},
      "lieu": {"type": "string", "label": "Localisation"},
      "resume": {"type": "string", "label": "Résumé professionnel"},
      "competences": {"type": "array", "items": {"type": "string"}, "label": "Compétences"},
      "experiences": {
        "type": "array",
        "label": "Expériences professionnelles",
        "items": {
          "type": "object",
          "properties": {
            "poste": {"type": "string"},
            "entreprise": {"type": "string"},
            "periode": {"type": "string"},
            "missions": {"type": "array", "items": {"type": "string"}}
          }
        }
      },
      "formations": {
        "type": "array",
        "label": "Formations",
        "items": {
          "type": "object",
          "properties": {
            "diplome": {"type": "string"},
            "ecole": {"type": "string"},
            "annee": {"type": "string"}
          }
        }
      }
    },
    "required": ["nom", "titre"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "nom": {"type": "string"},
      "titre": {"type": "string"},
      "email": {"type": "string"},
      "telephone": {"type": "string"},
      "resume": {"type": "string"},
      "competences": {"type": "array", "items": {"type": "string"}},
      "experiences": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "poste": {"type": "string"},
            "entreprise": {"type": "string"},
            "periode": {"type": "string"},
            "missions": {"type": "array", "items": {"type": "string"}}
          }
        }
      },
      "formations": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "diplome": {"type": "string"},
            "ecole": {"type": "string"},
            "annee": {"type": "string"}
          }
        }
      }
    }
  }'::jsonb
WHERE service_code = 'ai_cv_generation';

-- Cover Letter Schemas
UPDATE ia_service_config
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "nom": {"type": "string", "label": "Nom du candidat"},
      "poste_cible": {"type": "string", "label": "Poste visé"},
      "entreprise": {"type": "string", "label": "Nom de l entreprise"},
      "date": {"type": "string", "label": "Date"},
      "extrait_offre": {"type": "string", "label": "Extrait de l offre"},
      "competences_candidat": {"type": "array", "items": {"type": "string"}, "label": "Compétences clés"},
      "ton": {"type": "string", "label": "Ton souhaité", "enum": ["formel", "moderne", "enthousiaste"]}
    },
    "required": ["nom", "entreprise", "poste_cible"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "date": {"type": "string"},
      "entreprise": {"type": "string"},
      "poste": {"type": "string"},
      "nom": {"type": "string"},
      "introduction": {"type": "string"},
      "corps": {"type": "string"},
      "motivation": {"type": "string"}
    }
  }'::jsonb
WHERE service_code = 'ai_cover_letter';

-- Coach Interview Schemas
UPDATE ia_service_config
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "poste_cible": {"type": "string", "label": "Poste visé"},
      "questions_reponses": {
        "type": "array",
        "label": "Questions d entretien",
        "items": {
          "type": "object",
          "properties": {
            "question": {"type": "string"},
            "reponse": {"type": "string"}
          }
        }
      },
      "contexte": {"type": "string", "label": "Contexte entreprise"}
    },
    "required": ["poste_cible", "questions_reponses"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "evaluation": {"type": "string"},
      "questions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question": {"type": "string"},
            "reponse": {"type": "string"},
            "analyse": {"type": "string"}
          }
        }
      },
      "recommendations": {"type": "string"}
    }
  }'::jsonb
WHERE service_code = 'ai_coach';

-- Matching Schemas
UPDATE ia_service_config
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "profil_candidat": {
        "type": "object",
        "label": "Profil candidat",
        "properties": {
          "competences": {"type": "array", "items": {"type": "string"}},
          "experience_annees": {"type": "number"},
          "formations": {"type": "array", "items": {"type": "string"}}
        }
      },
      "offre_emploi": {
        "type": "object",
        "label": "Offre emploi",
        "properties": {
          "titre": {"type": "string"},
          "competences_requises": {"type": "array", "items": {"type": "string"}},
          "experience_requise": {"type": "number"}
        }
      }
    },
    "required": ["profil_candidat", "offre_emploi"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "score": {"type": "number"},
      "points_forts": {"type": "array", "items": {"type": "string"}},
      "faiblesses": {"type": "array", "items": {"type": "string"}},
      "resume": {"type": "string"}
    }
  }'::jsonb
WHERE service_code = 'ai_matching';

-- Career Plan Schemas
UPDATE ia_service_config
SET 
  input_schema = '{
    "type": "object",
    "properties": {
      "profil_actuel": {
        "type": "object",
        "label": "Situation actuelle",
        "properties": {
          "poste": {"type": "string"},
          "competences": {"type": "array", "items": {"type": "string"}},
          "experience_annees": {"type": "number"}
        }
      },
      "objectif": {"type": "string", "label": "Objectif professionnel"},
      "horizon": {"type": "string", "label": "Horizon temporel", "enum": ["6_mois", "1_an", "3_ans", "5_ans"]},
      "contraintes": {"type": "string", "label": "Contraintes éventuelles"}
    },
    "required": ["profil_actuel", "objectif"]
  }'::jsonb,
  output_schema = '{
    "type": "object",
    "properties": {
      "objectif": {"type": "string"},
      "etapes": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "titre": {"type": "string"},
            "description": {"type": "string"}
          }
        }
      },
      "formations": {"type": "array", "items": {"type": "string"}},
      "competences": {"type": "array", "items": {"type": "string"}},
      "echeancier": {"type": "string"}
    }
  }'::jsonb
WHERE service_code = 'ai_career_plan';
