/*
  # Mise à jour de la tarification des services Premium IA

  ## Description
  Mise à jour complète des coûts des services IA selon les nouvelles spécifications.
  
  ## Modifications apportées
  
  ### Services mis à jour avec nouveaux coûts en crédits:
  1. **Analyse IA de profil** → 50 crédits (était: 0)
  2. **Génération CV IA** → 100 crédits (était: 50)
  3. **Lettre de Motivation IA** → 40 crédits (était: 30)
  4. **Alertes IA ciblées** → 0 crédit (gratuit - inchangé)
  5. **Chatbot Travail & Emploi (accès 24h)** → 100 crédits (inchangé)
  6. **Rapport Mensuel IA** → 200 crédits (nouveau)
  7. **Coaching carrière IA** → 200 crédits (était: 100)
  8. **Badge Profil Vérifié** → 3 crédits/jour (nouveau - déduction automatique)

  ## Notes importantes
  - Le Badge Vérifié fonctionne avec déduction quotidienne automatique (3 crédits/jour)
  - Les services gratuits (Alertes IA) restent à 0 crédit
  - Conversion maintenue: 1000 GNF = 10 crédits
  - Aucun autre service n'est modifié
*/

-- Mettre à jour les coûts des services existants dans service_credit_costs
UPDATE service_credit_costs
SET 
  credits_cost = 50,
  service_description = 'Analyse complète du profil avec recommandations personnalisées par IA',
  updated_at = now()
WHERE service_code = 'profile_analysis';

UPDATE service_credit_costs
SET 
  credits_cost = 100,
  service_description = 'Création automatique d''un CV professionnel optimisé avec l''IA',
  updated_at = now()
WHERE service_code = 'cv_generation';

UPDATE service_credit_costs
SET 
  credits_cost = 40,
  service_description = 'Génération automatique d''une lettre de motivation personnalisée',
  updated_at = now()
WHERE service_code = 'cover_letter_generation';

-- S'assurer que les alertes restent gratuites
UPDATE service_credit_costs
SET 
  credits_cost = 0,
  service_description = 'Alertes intelligentes personnalisées pour nouvelles offres d''emploi',
  updated_at = now()
WHERE service_code = 'smart_alerts';

-- Mettre à jour le coaching carrière
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM service_credit_costs WHERE service_code = 'career_coaching') THEN
    UPDATE service_credit_costs
    SET 
      credits_cost = 200,
      service_description = 'Sessions de coaching carrière avec simulations d''entretien IA et feedback personnalisé',
      updated_at = now()
    WHERE service_code = 'career_coaching';
  ELSE
    INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, is_active, category)
    VALUES ('career_coaching', 'Coaching carrière IA', 'Sessions de coaching carrière avec simulations d''entretien IA et feedback personnalisé', 200, true, 'Formation');
  END IF;
END $$;

-- Ajouter/Mettre à jour le service Chatbot (accès 24h)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM service_credit_costs WHERE service_code = 'chatbot_queries') THEN
    UPDATE service_credit_costs
    SET 
      credits_cost = 100,
      service_name = 'Chatbot Travail & Emploi (accès 24h)',
      service_description = 'Accès complet au chatbot IA pendant 24 heures pour réponses Code du Travail guinéen',
      updated_at = now()
    WHERE service_code = 'chatbot_queries';
  ELSE
    INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, is_active, category)
    VALUES ('chatbot_queries', 'Chatbot Travail & Emploi (accès 24h)', 'Accès complet au chatbot IA pendant 24 heures pour réponses Code du Travail guinéen', 100, true, 'IA & Analyse');
  END IF;
END $$;

-- Ajouter/Mettre à jour le Rapport Mensuel IA
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM service_credit_costs WHERE service_code = 'monthly_report') THEN
    UPDATE service_credit_costs
    SET 
      credits_cost = 200,
      service_description = 'Rapport mensuel détaillé avec statistiques de candidatures et analyse de performance',
      updated_at = now()
    WHERE service_code = 'monthly_report';
  ELSE
    INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, is_active, category)
    VALUES ('monthly_report', 'Rapport Mensuel IA', 'Rapport mensuel détaillé avec statistiques de candidatures et analyse de performance', 200, true, 'IA & Analyse');
  END IF;
END $$;

-- Ajouter le Badge Profil Vérifié (3 crédits/jour - déduction automatique)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM service_credit_costs WHERE service_code = 'verified_badge') THEN
    UPDATE service_credit_costs
    SET 
      credits_cost = 3,
      service_name = 'Badge Profil Vérifié (par jour)',
      service_description = 'Badge de certification visible sur votre profil - Déduction automatique de 3 crédits/jour',
      updated_at = now()
    WHERE service_code = 'verified_badge';
  ELSE
    INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, is_active, category)
    VALUES ('verified_badge', 'Badge Profil Vérifié (par jour)', 'Badge de certification visible sur votre profil - Déduction automatique de 3 crédits/jour', 3, true, 'Visibilité');
  END IF;
END $$;

-- Créer un index sur service_code pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_service_credit_costs_service_code 
  ON service_credit_costs(service_code) 
  WHERE is_active = true;

-- Commentaire pour traçabilité
COMMENT ON TABLE service_credit_costs IS 'Tarification des services Premium IA - Mis à jour le 2025-11-21';
