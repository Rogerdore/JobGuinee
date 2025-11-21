/*
  # Mise à jour des packs de crédits - Minimum 100,000 GNF

  ## Description
  Suppression des anciens packs inférieurs à 100,000 GNF et création des nouveaux packs.
  
  ## Nouveaux packs créés:
  
  ### Pack Standard - 100,000 GNF
  - Crédits: 1000
  - Bonus: 150
  - Total: 1150 crédits
  
  ### Pack Premium - 200,000 GNF
  - Crédits: 2000
  - Bonus: 300
  - Total: 2300 crédits
  
  ### Pack Elite - 300,000 GNF
  - Crédits: 3000
  - Bonus: 500
  - Total: 3500 crédits
  
  ### Pack Ultra - 500,000 GNF
  - Crédits: 5000
  - Bonus: 1000
  - Total: 6000 crédits
  
  ## Conversion
  - 1000 GNF = 10 crédits
  - Les bonus sont ajoutés en supplément
  
  ## Modifications
  1. Désactivation des anciens packs < 100,000 GNF
  2. Création/mise à jour des nouveaux packs
  3. Mise à jour des descriptions et de l'ordre d'affichage
*/

-- Désactiver tous les anciens packs inférieurs à 100,000 GNF
UPDATE credit_packages
SET 
  is_active = false,
  updated_at = now()
WHERE price_amount < 100000 AND currency = 'GNF';

-- Supprimer physiquement les anciens packs pour éviter toute confusion
-- (Seulement si aucune transaction ne les référence)
DELETE FROM credit_packages
WHERE price_amount < 100000 
  AND currency = 'GNF'
  AND NOT EXISTS (
    SELECT 1 FROM credit_transactions 
    WHERE credit_transactions.package_id = credit_packages.id
  );

-- Créer ou mettre à jour le Pack Standard (100,000 GNF)
DO $$
DECLARE
  v_pack_id uuid;
BEGIN
  -- Vérifier si le pack existe déjà
  SELECT id INTO v_pack_id
  FROM credit_packages
  WHERE name = 'Pack Standard' AND price_amount = 100000;
  
  IF v_pack_id IS NOT NULL THEN
    -- Mettre à jour le pack existant
    UPDATE credit_packages
    SET
      description = 'Pack de démarrage idéal pour découvrir nos services Premium IA',
      credits_amount = 1000,
      price_amount = 100000,
      currency = 'GNF',
      bonus_credits = 150,
      is_popular = false,
      is_active = true,
      display_order = 1,
      updated_at = now()
    WHERE id = v_pack_id;
  ELSE
    -- Créer le nouveau pack
    INSERT INTO credit_packages (
      name, 
      description, 
      credits_amount, 
      price_amount, 
      currency, 
      bonus_credits, 
      is_popular, 
      is_active, 
      display_order
    ) VALUES (
      'Pack Standard',
      'Pack de démarrage idéal pour découvrir nos services Premium IA',
      1000,
      100000,
      'GNF',
      150,
      false,
      true,
      1
    );
  END IF;
END $$;

-- Créer ou mettre à jour le Pack Premium (200,000 GNF)
DO $$
DECLARE
  v_pack_id uuid;
BEGIN
  SELECT id INTO v_pack_id
  FROM credit_packages
  WHERE name = 'Pack Premium' AND price_amount = 200000;
  
  IF v_pack_id IS NOT NULL THEN
    UPDATE credit_packages
    SET
      description = 'Pack recommandé pour une utilisation régulière des services IA',
      credits_amount = 2000,
      price_amount = 200000,
      currency = 'GNF',
      bonus_credits = 300,
      is_popular = true,
      is_active = true,
      display_order = 2,
      updated_at = now()
    WHERE id = v_pack_id;
  ELSE
    INSERT INTO credit_packages (
      name, 
      description, 
      credits_amount, 
      price_amount, 
      currency, 
      bonus_credits, 
      is_popular, 
      is_active, 
      display_order
    ) VALUES (
      'Pack Premium',
      'Pack recommandé pour une utilisation régulière des services IA',
      2000,
      200000,
      'GNF',
      300,
      true,
      true,
      2
    );
  END IF;
END $$;

-- Créer ou mettre à jour le Pack Elite (300,000 GNF)
DO $$
DECLARE
  v_pack_id uuid;
BEGIN
  SELECT id INTO v_pack_id
  FROM credit_packages
  WHERE name = 'Pack Elite' AND price_amount = 300000;
  
  IF v_pack_id IS NOT NULL THEN
    UPDATE credit_packages
    SET
      description = 'Pack avancé pour les utilisateurs intensifs avec bonus généreux',
      credits_amount = 3000,
      price_amount = 300000,
      currency = 'GNF',
      bonus_credits = 500,
      is_popular = false,
      is_active = true,
      display_order = 3,
      updated_at = now()
    WHERE id = v_pack_id;
  ELSE
    INSERT INTO credit_packages (
      name, 
      description, 
      credits_amount, 
      price_amount, 
      currency, 
      bonus_credits, 
      is_popular, 
      is_active, 
      display_order
    ) VALUES (
      'Pack Elite',
      'Pack avancé pour les utilisateurs intensifs avec bonus généreux',
      3000,
      300000,
      'GNF',
      500,
      false,
      true,
      3
    );
  END IF;
END $$;

-- Créer ou mettre à jour le Pack Ultra (500,000 GNF)
DO $$
DECLARE
  v_pack_id uuid;
BEGIN
  SELECT id INTO v_pack_id
  FROM credit_packages
  WHERE name = 'Pack Ultra' AND price_amount = 500000;
  
  IF v_pack_id IS NOT NULL THEN
    UPDATE credit_packages
    SET
      description = 'Pack ultime avec le meilleur rapport qualité-prix pour professionnels',
      credits_amount = 5000,
      price_amount = 500000,
      currency = 'GNF',
      bonus_credits = 1000,
      is_popular = false,
      is_active = true,
      display_order = 4,
      updated_at = now()
    WHERE id = v_pack_id;
  ELSE
    INSERT INTO credit_packages (
      name, 
      description, 
      credits_amount, 
      price_amount, 
      currency, 
      bonus_credits, 
      is_popular, 
      is_active, 
      display_order
    ) VALUES (
      'Pack Ultra',
      'Pack ultime avec le meilleur rapport qualité-prix pour professionnels',
      5000,
      500000,
      'GNF',
      1000,
      false,
      true,
      4
    );
  END IF;
END $$;

-- Vérifier que tous les nouveaux packs sont bien actifs
UPDATE credit_packages
SET is_active = true, updated_at = now()
WHERE name IN ('Pack Standard', 'Pack Premium', 'Pack Elite', 'Pack Ultra')
  AND price_amount >= 100000;

-- Ajouter un commentaire pour traçabilité
COMMENT ON TABLE credit_packages IS 'Packs de crédits Premium - Minimum 100,000 GNF - Mis à jour le 2025-11-21';
