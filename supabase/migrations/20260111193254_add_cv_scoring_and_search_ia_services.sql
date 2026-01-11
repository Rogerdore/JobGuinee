/*
  # Ajout Services IA pour CVThèque - Centralisation

  1. Nouveaux Services IA
    - `cv_profile_scoring`: Service de scoring automatique des profils candidats
    - `cv_semantic_search`: Service de recherche sémantique IA dans la CVThèque
  
  2. Configuration
    - Scoring: Calcul basé sur expérience, éducation, compétences, vérification
    - Recherche: Matching sémantique entre requête recruteur et profils candidats
    - Coût en crédits IA configuré
  
  3. Intégration Moteur Central
    - Utilise ia_service_config existant
    - Respecte le système de crédits IA
    - Logs via ai_service_usage_history
  
  4. Sécurité
    - Validation des entrées via input_schema
    - Output structuré via output_schema
    - Pas de duplication de logique
*/

-- Insérer le service de scoring des profils CV
INSERT INTO ia_service_config (
  service_code,
  service_name,
  service_description,
  base_prompt,
  instructions,
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
  'cv_profile_scoring',
  'Scoring Automatique de Profils CV',
  'Calcule un score IA (0-100) pour évaluer la qualité et l''attractivité d''un profil candidat basé sur plusieurs critères.',
  'Tu es un expert RH spécialisé dans l''évaluation de profils candidats. Ta mission est de calculer un score objectif de 0 à 100 pour un profil candidat.',
  'Analyse les critères suivants:
1. Expérience professionnelle (poids: 40%)
2. Niveau d''éducation (poids: 25%)
3. Compétences techniques (poids: 20%)
4. Vérification du profil (poids: 10%)
5. Complétude du profil (poids: 5%)

Retourne un score de 60 minimum (profils visibles), jusqu''à 100 (profils exceptionnels).',
  '{
    "required": ["experience_years", "education_level", "skills"],
    "properties": {
      "experience_years": {
        "type": "number",
        "label": "Années d''expérience"
      },
      "education_level": {
        "type": "string",
        "label": "Niveau d''éducation",
        "enum": ["bac", "licence", "master", "doctorat"]
      },
      "skills": {
        "type": "array",
        "label": "Compétences",
        "items": {"type": "string"}
      },
      "is_verified": {
        "type": "boolean",
        "label": "Profil vérifié"
      },
      "is_gold": {
        "type": "boolean",
        "label": "Profil Gold"
      },
      "profile_completion": {
        "type": "number",
        "label": "Taux de complétion du profil (%)"
      }
    }
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "score": {
        "type": "number",
        "label": "Score global (0-100)"
      },
      "breakdown": {
        "type": "object",
        "label": "Détail du scoring",
        "properties": {
          "experience_score": {"type": "number"},
          "education_score": {"type": "number"},
          "skills_score": {"type": "number"},
          "verification_score": {"type": "number"},
          "completion_score": {"type": "number"}
        }
      },
      "reasoning": {
        "type": "string",
        "label": "Explication du score"
      }
    }
  }'::jsonb,
  'gpt-4',
  0.3,
  500,
  1.0,
  0.0,
  0.0,
  1,
  true,
  'analysis',
  ARRAY['cvtheque', 'scoring', 'evaluation', 'recrutement']
) ON CONFLICT (service_code) DO NOTHING;

-- Insérer le service de recherche sémantique CVThèque
INSERT INTO ia_service_config (
  service_code,
  service_name,
  service_description,
  base_prompt,
  instructions,
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
  'cv_semantic_search',
  'Recherche Sémantique CVThèque',
  'Recherche intelligente de candidats basée sur l''intention et le contexte de la requête du recruteur, au-delà des mots-clés exacts.',
  'Tu es un assistant RH expert en matching candidat-poste. Tu analyses la requête d''un recruteur et retournes les critères de recherche optimisés pour trouver les meilleurs candidats.',
  'Analyse la requête du recruteur et extrait:
1. Compétences techniques recherchées
2. Niveau d''expérience souhaité
3. Domaine/secteur d''activité
4. Soft skills importants
5. Localisation géographique
6. Niveau d''éducation minimum

Interprète l''intention derrière la requête, pas seulement les mots-clés.',
  '{
    "required": ["query"],
    "properties": {
      "query": {
        "type": "string",
        "label": "Requête du recruteur",
        "minLength": 3
      },
      "current_filters": {
        "type": "object",
        "label": "Filtres déjà appliqués (optionnel)"
      }
    }
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "interpreted_query": {
        "type": "string",
        "label": "Interprétation de la requête"
      },
      "search_criteria": {
        "type": "object",
        "label": "Critères de recherche extraits",
        "properties": {
          "skills": {"type": "array"},
          "experience_min": {"type": "number"},
          "experience_max": {"type": "number"},
          "education_level": {"type": "string"},
          "location": {"type": "string"},
          "domain": {"type": "string"}
        }
      },
      "suggested_keywords": {
        "type": "array",
        "label": "Mots-clés suggérés pour affiner"
      },
      "relevance_factors": {
        "type": "array",
        "label": "Facteurs de pertinence identifiés"
      }
    }
  }'::jsonb,
  'gpt-4',
  0.4,
  800,
  1.0,
  0.0,
  0.0,
  1,
  true,
  'matching',
  ARRAY['cvtheque', 'recherche', 'matching', 'semantic', 'recrutement']
) ON CONFLICT (service_code) DO NOTHING;

-- Ajouter les coûts en crédits pour ces services
INSERT INTO service_credit_costs (
  service_code,
  service_name,
  credits_cost,
  is_active,
  category
) VALUES 
  ('cv_profile_scoring', 'Scoring Automatique de Profils CV', 1, true, 'analysis'),
  ('cv_semantic_search', 'Recherche Sémantique CVThèque', 5, true, 'matching')
ON CONFLICT (service_code) DO UPDATE SET
  credits_cost = EXCLUDED.credits_cost,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  updated_at = now();
