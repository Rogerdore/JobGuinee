/*
  # Ajout Service IA Parser de CV

  1. Nouveau Service IA
    - `ai_cv_parser`: Service d'analyse et parsing automatique de CV

  2. Configuration
    - Extraction automatique des informations du CV
    - Coût: 10 crédits IA
    - Parsing intelligent des expériences, formations, compétences

  3. Intégration Moteur Central
    - Utilise ia_service_config existant
    - Respecte le système de crédits IA
    - Logs via ai_service_usage_history

  4. Sécurité
    - Validation des entrées via input_schema
    - Output structuré via output_schema
*/

-- Insérer le service de parsing de CV
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
  'ai_cv_parser',
  'Analyse et Parsing de CV',
  'Extrait automatiquement les informations structurées d''un CV (identité, expériences, formations, compétences, etc.).',
  'Tu es un expert en analyse de CV. Ta mission est d''extraire toutes les informations structurées d''un CV pour faciliter le remplissage automatique de formulaires.',
  'Analyse le texte du CV et extrait:
1. Informations personnelles (nom, email, téléphone, localisation)
2. Titre/poste actuel
3. Résumé professionnel
4. Expériences professionnelles (poste, entreprise, période, missions)
5. Formations (diplôme, établissement, année)
6. Compétences techniques
7. Langues et niveaux
8. Certifications
9. Liens professionnels (LinkedIn, GitHub, portfolio)

Retourne des données structurées et validées.',
  '{
    "required": ["cv_text"],
    "properties": {
      "cv_text": {
        "type": "string",
        "label": "Texte extrait du CV",
        "minLength": 50
      }
    }
  }'::jsonb,
  '{
    "type": "object",
    "properties": {
      "full_name": {"type": "string"},
      "title": {"type": "string"},
      "email": {"type": "string"},
      "phone": {"type": "string"},
      "location": {"type": "string"},
      "summary": {"type": "string"},
      "experiences": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "position": {"type": "string"},
            "company": {"type": "string"},
            "period": {"type": "string"},
            "missions": {"type": "array", "items": {"type": "string"}}
          }
        }
      },
      "education": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "degree": {"type": "string"},
            "institution": {"type": "string"},
            "year": {"type": "string"}
          }
        }
      },
      "skills": {"type": "array", "items": {"type": "string"}},
      "languages": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "language": {"type": "string"},
            "level": {"type": "string"}
          }
        }
      },
      "linkedin_url": {"type": "string"},
      "github_url": {"type": "string"},
      "portfolio_url": {"type": "string"}
    }
  }'::jsonb,
  'gpt-4',
  0.3,
  2000,
  1.0,
  0.0,
  0.0,
  1,
  true,
  'analysis',
  ARRAY['cv', 'parsing', 'extraction', 'candidat', 'profil']
) ON CONFLICT (service_code) DO NOTHING;

-- Ajouter le coût en crédits pour ce service
INSERT INTO service_credit_costs (
  service_code,
  service_name,
  credits_cost,
  is_active,
  category
) VALUES
  ('ai_cv_parser', 'Analyse et Parsing de CV', 10, true, 'analysis')
ON CONFLICT (service_code) DO UPDATE SET
  credits_cost = EXCLUDED.credits_cost,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  updated_at = now();
