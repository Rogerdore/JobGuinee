/*
  # Amélioration du système chatbot pour intégration Premium

  1. Modifications
    - Ajouter des champs Premium à chatbot_settings
    - enable_premium_detection: détecter automatiquement le statut Premium
    - premium_welcome_message: message pour utilisateurs Premium
    - premium_badge_text: texte du badge Premium
    - show_premium_benefits: afficher les avantages Premium dans le chatbot

  2. Sécurité
    - Pas de changement RLS nécessaire
*/

-- Ajouter les champs Premium à chatbot_settings
DO $$
BEGIN
  -- enable_premium_detection
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_settings' AND column_name = 'enable_premium_detection'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN enable_premium_detection boolean DEFAULT true;
  END IF;

  -- premium_welcome_message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_settings' AND column_name = 'premium_welcome_message'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN premium_welcome_message text DEFAULT 'Bonjour Premium! En tant qu''abonné Premium PRO+, vous avez accès à toutes mes fonctionnalités avancées sans consommer de crédits. Comment puis-je vous aider?';
  END IF;

  -- premium_badge_text
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_settings' AND column_name = 'premium_badge_text'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN premium_badge_text text DEFAULT 'PRO+';
  END IF;

  -- show_premium_benefits
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_settings' AND column_name = 'show_premium_benefits'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN show_premium_benefits boolean DEFAULT true;
  END IF;

  -- premium_upsell_message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_settings' AND column_name = 'premium_upsell_message'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN premium_upsell_message text DEFAULT 'Découvrez Premium PRO+ pour accéder à tous les services IA illimités sans consommer de crédits!';
  END IF;

  -- show_credits_balance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_settings' AND column_name = 'show_credits_balance'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN show_credits_balance boolean DEFAULT true;
  END IF;

  -- show_premium_expiration
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chatbot_settings' AND column_name = 'show_premium_expiration'
  ) THEN
    ALTER TABLE chatbot_settings ADD COLUMN show_premium_expiration boolean DEFAULT true;
  END IF;
END $$;

-- Mettre à jour les settings existants
UPDATE chatbot_settings
SET 
  enable_premium_detection = true,
  premium_welcome_message = 'Bonjour Premium! En tant qu''abonné Premium PRO+, vous avez accès à toutes mes fonctionnalités avancées sans consommer de crédits. Comment puis-je vous aider?',
  premium_badge_text = 'PRO+',
  show_premium_benefits = true,
  premium_upsell_message = 'Découvrez Premium PRO+ pour accéder à tous les services IA illimités sans consommer de crédits!',
  show_credits_balance = true,
  show_premium_expiration = true,
  updated_at = now()
WHERE enable_premium_detection IS NULL;