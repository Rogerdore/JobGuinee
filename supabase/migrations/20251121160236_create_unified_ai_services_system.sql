/*
  # Système unifié de services IA - Configuration centralisée

  ## Description
  Mise à jour de la table `service_credit_costs` pour devenir le système centralisé
  de configuration de TOUS les services IA de la plateforme.

  ## Modifications
  
  ### Ajout de colonnes de configuration IA à service_credit_costs:
  - `service_key` (text, unique) - Clé unique du service (ex: analyse_profil)
  - `status` (boolean) - Service actif/inactif
  - `model` (text) - Modèle IA à utiliser (gemini-pro, gpt-4, etc.)
  - `prompt_template` (text) - Template de prompt avec variables {{var}}
  - `system_instructions` (text) - Instructions système pour l'IA
  - `knowledge_base` (text) - Base de connaissances spécifique
  - `temperature` (float) - Créativité du modèle (0.0-2.0)
  - `max_tokens` (integer) - Tokens maximum par réponse
  
  ### Table ai_results (renommée depuis ai_service_usage_history)
  Conserve l'historique complet avec les résultats:
  - Ajoute `input_payload` (jsonb) - Données envoyées
  - Ajoute `output_response` (jsonb) - Réponse complète de l'IA
  
  ## Services initialisés
  1. analyse_profil - Analyse IA de profil candidat
  2. generation_cv - Génération de CV professionnel
  3. lettre_motivation - Rédaction de lettre de motivation
  4. chatbot_job - Chatbot emploi 24/7
  5. coaching_ia - Coaching carrière personnalisé
  6. rapport_mensuel - Rapport mensuel automatisé
  7. alertes_ia - Alertes intelligentes (gratuit)
  8. badge_verifie - Badge profil vérifié

  ## Sécurité
  - RLS maintenu sur toutes les tables
  - Admins peuvent tout configurer
  - Users utilisent les services selon leurs crédits
*/

-- Ajouter les colonnes de configuration IA à service_credit_costs
DO $$
BEGIN
  -- service_key (clé unique pour identification)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'service_key') THEN
    ALTER TABLE service_credit_costs ADD COLUMN service_key text UNIQUE;
  END IF;

  -- status (actif/inactif)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'status') THEN
    ALTER TABLE service_credit_costs ADD COLUMN status boolean DEFAULT true;
  END IF;

  -- model (modèle IA à utiliser)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'model') THEN
    ALTER TABLE service_credit_costs ADD COLUMN model text DEFAULT 'gemini-pro';
  END IF;

  -- prompt_template (template de prompt)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'prompt_template') THEN
    ALTER TABLE service_credit_costs ADD COLUMN prompt_template text;
  END IF;

  -- system_instructions (instructions système)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'system_instructions') THEN
    ALTER TABLE service_credit_costs ADD COLUMN system_instructions text;
  END IF;

  -- knowledge_base (base de connaissances)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'knowledge_base') THEN
    ALTER TABLE service_credit_costs ADD COLUMN knowledge_base text;
  END IF;

  -- temperature (créativité 0.0-2.0)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'temperature') THEN
    ALTER TABLE service_credit_costs ADD COLUMN temperature numeric(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2);
  END IF;

  -- max_tokens (limite de tokens)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_credit_costs' AND column_name = 'max_tokens') THEN
    ALTER TABLE service_credit_costs ADD COLUMN max_tokens integer DEFAULT 2000 CHECK (max_tokens > 0);
  END IF;
END $$;

-- Ajouter les colonnes manquantes à ai_service_usage_history pour devenir ai_results
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_service_usage_history' AND column_name = 'input_payload') THEN
    ALTER TABLE ai_service_usage_history ADD COLUMN input_payload jsonb DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_service_usage_history' AND column_name = 'output_response') THEN
    ALTER TABLE ai_service_usage_history ADD COLUMN output_response jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Mettre à jour/Initialiser les services avec service_key et configuration IA

-- 1. Analyse de profil
UPDATE service_credit_costs
SET 
  service_key = 'analyse_profil',
  status = true,
  model = 'gemini-pro',
  prompt_template = 'Analysez le profil candidat suivant et fournissez une évaluation détaillée:\n\nProfil:\n{{profile_data}}\n\nFournissez:\n1. Points forts (3-5 éléments)\n2. Points à améliorer (2-4 éléments)\n3. Recommandations personnalisées\n4. Score global sur 100',
  system_instructions = 'Vous êtes un expert RH spécialisé dans l''analyse de profils professionnels. Soyez constructif, précis et encourageant.',
  temperature = 0.7,
  max_tokens = 1500
WHERE service_code = 'profile_analysis';

-- 2. Génération de CV
UPDATE service_credit_costs
SET 
  service_key = 'generation_cv',
  status = true,
  model = 'gemini-pro',
  prompt_template = 'Générez un CV professionnel optimisé ATS basé sur ces informations:\n\n{{profile_data}}\n\nPoste ciblé: {{target_position}}\nFormat: {{format}}\n\nCréez un CV structuré, professionnel et impactant.',
  system_instructions = 'Vous êtes un expert en rédaction de CV. Créez des CV professionnels, structurés, optimisés pour les ATS, en mettant en valeur les compétences et expériences pertinentes.',
  knowledge_base = 'Un CV efficace doit:\n- Être concis (1-2 pages)\n- Utiliser des verbes d''action\n- Quantifier les réalisations\n- Adapter le contenu au poste\n- Être optimisé ATS',
  temperature = 0.6,
  max_tokens = 2500
WHERE service_code = 'cv_generation';

-- 3. Lettre de motivation
UPDATE service_credit_costs
SET 
  service_key = 'lettre_motivation',
  status = true,
  model = 'gemini-pro',
  prompt_template = 'Rédigez une lettre de motivation personnalisée:\n\nProfil candidat:\n{{candidate_profile}}\n\nOffre d''emploi:\n{{job_description}}\n\nTon: {{tone}}\n\nCréez une lettre convaincante et authentique.',
  system_instructions = 'Vous êtes un expert en communication professionnelle. Rédigez des lettres de motivation personnalisées, convaincantes et authentiques qui mettent en valeur la motivation et l''adéquation du candidat.',
  temperature = 0.8,
  max_tokens = 1000
WHERE service_code = 'cover_letter_generation';

-- 4. Chatbot emploi
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM service_credit_costs WHERE service_code = 'chatbot_job') THEN
    INSERT INTO service_credit_costs (
      service_code, service_name, service_description, credits_cost, is_active, category,
      service_key, status, model, prompt_template, system_instructions, temperature, max_tokens
    ) VALUES (
      'chatbot_job',
      'Chatbot Emploi 24/7',
      'Assistant virtuel pour questions emploi et Code du Travail guinéen',
      100,
      true,
      'IA & Analyse',
      'chatbot_job',
      true,
      'gemini-pro',
      'Question de l''utilisateur: {{user_question}}\n\nContexte: {{context}}\n\nFournissez une réponse claire, précise et utile.',
      'Vous êtes un assistant expert en emploi et Code du Travail guinéen. Répondez de manière claire, professionnelle et aidante. Citez les articles de loi quand pertinent.',
      0.7,
      800
    );
  ELSE
    UPDATE service_credit_costs SET
      service_key = 'chatbot_job',
      status = true,
      model = 'gemini-pro',
      prompt_template = 'Question de l''utilisateur: {{user_question}}\n\nContexte: {{context}}\n\nFournissez une réponse claire, précise et utile.',
      system_instructions = 'Vous êtes un assistant expert en emploi et Code du Travail guinéen. Répondez de manière claire, professionnelle et aidante. Citez les articles de loi quand pertinent.',
      temperature = 0.7,
      max_tokens = 800
    WHERE service_code = 'chatbot_job';
  END IF;
END $$;

-- 5. Coaching carrière
UPDATE service_credit_costs
SET 
  service_key = 'coaching_ia',
  status = true,
  model = 'gemini-pro',
  prompt_template = 'Session de coaching carrière:\n\nProfil: {{user_profile}}\nObjectif: {{career_goal}}\nSituation: {{current_situation}}\n\nFournissez:\n1. Analyse de la situation\n2. Plan d''action concret (3-5 étapes)\n3. Ressources recommandées\n4. Timeline réaliste',
  system_instructions = 'Vous êtes un coach carrière expérimenté. Fournissez des conseils pratiques, réalistes et encourageants. Créez des plans d''action concrets et mesurables.',
  temperature = 0.8,
  max_tokens = 2000
WHERE service_code = 'career_coaching';

-- 6. Rapport mensuel
UPDATE service_credit_costs
SET 
  service_key = 'rapport_mensuel',
  status = true,
  model = 'gemini-pro',
  prompt_template = 'Générez un rapport mensuel d''activité:\n\nDonnées du mois:\n{{monthly_data}}\n\nCandidatures: {{applications_count}}\nEntretiens: {{interviews_count}}\nRéponses: {{responses_count}}\n\nAnalysez les performances et donnez des recommandations.',
  system_instructions = 'Vous êtes un analyste RH. Créez des rapports clairs avec insights actionnables, graphiques de progression et recommandations stratégiques.',
  temperature = 0.6,
  max_tokens = 2000
WHERE service_code = 'monthly_report';

-- 7. Alertes IA (gratuit)
UPDATE service_credit_costs
SET 
  service_key = 'alertes_ia',
  status = true,
  model = 'gemini-pro',
  prompt_template = 'Analysez si cette offre correspond au profil:\n\nProfil utilisateur:\n{{user_profile}}\n\nOffre d''emploi:\n{{job_offer}}\n\nScore de correspondance (0-100) et justification.',
  system_instructions = 'Vous êtes un système de matching emploi. Évaluez la correspondance entre profil et offre de manière objective et précise.',
  temperature = 0.5,
  max_tokens = 500
WHERE service_code = 'smart_alerts';

-- 8. Badge vérifié
UPDATE service_credit_costs
SET 
  service_key = 'badge_verifie',
  status = true,
  model = NULL,
  prompt_template = NULL,
  system_instructions = NULL,
  temperature = NULL,
  max_tokens = NULL
WHERE service_code = 'verified_badge';

-- Créer des index pour performances
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_service_key 
  ON service_credit_costs(service_key) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_service_credit_costs_status 
  ON service_credit_costs(status) WHERE status = true;

-- Commentaires
COMMENT ON COLUMN service_credit_costs.service_key IS 'Clé unique d''identification du service (ex: analyse_profil)';
COMMENT ON COLUMN service_credit_costs.status IS 'Service actif (true) ou inactif (false)';
COMMENT ON COLUMN service_credit_costs.model IS 'Modèle IA à utiliser (gemini-pro, gpt-4, claude-3, etc.)';
COMMENT ON COLUMN service_credit_costs.prompt_template IS 'Template de prompt avec variables {{variable}}';
COMMENT ON COLUMN service_credit_costs.system_instructions IS 'Instructions système pour configurer le comportement de l''IA';
COMMENT ON COLUMN service_credit_costs.knowledge_base IS 'Base de connaissances spécifique au service';
COMMENT ON COLUMN service_credit_costs.temperature IS 'Température du modèle (0=précis, 2=créatif)';
COMMENT ON COLUMN service_credit_costs.max_tokens IS 'Nombre maximum de tokens par réponse';

COMMENT ON TABLE service_credit_costs IS 'Configuration centralisée de TOUS les services IA - Éditable via Admin';
COMMENT ON TABLE ai_service_usage_history IS 'Historique complet d''utilisation avec inputs/outputs de chaque service IA';
