/*
  # Create AI Recruiter Matching Service

  1. New Service Configuration
    - Add `ai_recruiter_matching` to `ia_service_config`
    - Configure prompts, schema, and LLM parameters
    - Set up proper input/output validation schemas

  2. Credit Cost Configuration
    - Add service to `service_credit_costs`
    - Set cost per matching analysis
    - Configure category and display settings

  3. Security
    - Service restricted to recruiter users
    - Credit consumption tracked in transactions
    - Usage logged in ai_service_usage_history

  This service enables recruiters to use AI for intelligent candidate matching
  with detailed scoring, analysis, and recommendations.
*/

-- Create AI Recruiter Matching Service Configuration
INSERT INTO ia_service_config (
  service_code,
  service_name,
  base_prompt,
  instructions,
  system_message,
  input_schema,
  output_schema,
  model,
  temperature,
  max_tokens,
  top_p,
  frequency_penalty,
  presence_penalty,
  version,
  is_active,
  category,
  tags
) VALUES (
  'ai_recruiter_matching',
  'Matching IA Recruteur',
  'Vous êtes un expert en recrutement et en analyse de profils candidats. Votre rôle est d''analyser la correspondance entre les candidats et une offre d''emploi pour aider les recruteurs à identifier les meilleurs talents.',
  'Analysez chaque candidat en profondeur en évaluant :

1. COMPÉTENCES TECHNIQUES (40%)
   - Correspondance exacte avec les compétences requises
   - Compétences transférables pertinentes
   - Niveau de maîtrise démontré

2. EXPÉRIENCE PROFESSIONNELLE (30%)
   - Années d''expérience dans le domaine
   - Pertinence des postes précédents
   - Progression de carrière
   - Réalisations concrètes

3. FORMATION & CERTIFICATIONS (15%)
   - Niveau d''études requis
   - Pertinence du parcours académique
   - Certifications professionnelles

4. ADÉQUATION CULTURELLE & SOFT SKILLS (15%)
   - Valeurs et motivations
   - Capacités de communication
   - Leadership et travail d''équipe
   - Adaptabilité

Pour chaque candidat, fournissez :
- Un score global de 0 à 100
- Une catégorie (excellent, potential, weak)
- Une justification détaillée
- Les forces principales
- Les points d''amélioration
- Des recommandations d''actions

Soyez objectif, précis et constructif dans vos analyses.',
  'Analysez les candidats suivants pour cette offre d''emploi et fournissez une évaluation complète de leur correspondance.',
  '{
    "type": "object",
    "required": ["job", "candidates"],
    "properties": {
      "job": {
        "type": "object",
        "required": ["title", "description"],
        "properties": {
          "title": {"type": "string"},
          "description": {"type": "string"},
          "required_skills": {
            "type": "array",
            "items": {"type": "string"}
          },
          "experience_level": {"type": "string"},
          "education_level": {"type": "string"},
          "department": {"type": "string"}
        }
      },
      "candidates": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["id", "name"],
          "properties": {
            "id": {"type": "string"},
            "name": {"type": "string"},
            "email": {"type": "string"},
            "phone": {"type": "string"},
            "title": {"type": "string"},
            "skills": {
              "type": "array",
              "items": {"type": "string"}
            },
            "experience_years": {"type": "number"},
            "education": {"type": "string"},
            "work_history": {"type": "string"},
            "achievements": {"type": "string"}
          }
        }
      }
    }
  }'::jsonb,
  '{
    "type": "object",
    "required": ["results"],
    "properties": {
      "results": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["candidate_id", "score", "category", "analysis"],
          "properties": {
            "candidate_id": {"type": "string"},
            "candidate_name": {"type": "string"},
            "score": {
              "type": "number",
              "minimum": 0,
              "maximum": 100
            },
            "category": {
              "type": "string",
              "enum": ["excellent", "potential", "weak"]
            },
            "analysis": {
              "type": "object",
              "required": ["summary", "strengths", "weaknesses", "recommendations"],
              "properties": {
                "summary": {"type": "string"},
                "strengths": {
                  "type": "array",
                  "items": {"type": "string"}
                },
                "weaknesses": {
                  "type": "array",
                  "items": {"type": "string"}
                },
                "recommendations": {
                  "type": "array",
                  "items": {"type": "string"}
                }
              }
            },
            "score_breakdown": {
              "type": "object",
              "properties": {
                "technical_skills": {"type": "number"},
                "experience": {"type": "number"},
                "education": {"type": "number"},
                "cultural_fit": {"type": "number"}
              }
            }
          }
        }
      },
      "summary": {
        "type": "object",
        "properties": {
          "total_analyzed": {"type": "number"},
          "excellent_count": {"type": "number"},
          "potential_count": {"type": "number"},
          "weak_count": {"type": "number"},
          "top_recommendation": {"type": "string"}
        }
      }
    }
  }'::jsonb,
  'gpt-4',
  0.7,
  2000,
  1,
  0,
  0,
  1,
  true,
  'recruiter_ai_services',
  ARRAY['matching', 'recruteur', 'analyse', 'scoring', 'candidat']
) ON CONFLICT (service_code) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  base_prompt = EXCLUDED.base_prompt,
  instructions = EXCLUDED.instructions,
  system_message = EXCLUDED.system_message,
  input_schema = EXCLUDED.input_schema,
  output_schema = EXCLUDED.output_schema,
  model = EXCLUDED.model,
  temperature = EXCLUDED.temperature,
  max_tokens = EXCLUDED.max_tokens,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  updated_at = now();

-- Create Credit Cost Configuration for AI Recruiter Matching
INSERT INTO service_credit_costs (
  service_code,
  service_name,
  service_description,
  credits_cost,
  is_active,
  category,
  display_order,
  icon
) VALUES (
  'ai_recruiter_matching',
  'Matching IA Recruteur',
  'Analyse intelligente de la correspondance entre candidats et offre d''emploi avec scoring détaillé et recommandations',
  10,
  true,
  'recruiter',
  150,
  'target'
) ON CONFLICT (service_code) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  service_description = EXCLUDED.service_description,
  credits_cost = EXCLUDED.credits_cost,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  display_order = EXCLUDED.display_order,
  icon = EXCLUDED.icon,
  updated_at = now();

-- Add helpful comment
COMMENT ON TABLE ia_service_config IS 'Central AI service configuration system - all AI services must be registered here';
COMMENT ON TABLE service_credit_costs IS 'Credit pricing for all services - used by use_ai_credits() function';
