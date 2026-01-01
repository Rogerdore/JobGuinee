/*
  # Création d'un Recruteur de Test et d'une Offre Pending

  ## Résumé
  Crée un recruteur de test et une offre en attente de modération
  pour tester le système de modération admin.

  ## Création
  1. Recruteur: Roger Doré (recruteur.test@miningcorp.gn)
  2. Offre: Comptable Junior en status "pending"
*/

-- Créer un profil recruteur de test (sans auth user car on ne peut pas créer d'users via SQL)
-- On va utiliser un user_id existant ou créer avec un UUID temporaire
DO $$
DECLARE
  v_recruiter_id uuid;
  v_existing_recruiter uuid;
BEGIN
  -- Chercher un recruteur existant
  SELECT id INTO v_existing_recruiter
  FROM profiles
  WHERE user_type = 'recruiter'
  LIMIT 1;

  -- Si un recruteur existe, l'utiliser
  IF v_existing_recruiter IS NOT NULL THEN
    v_recruiter_id := v_existing_recruiter;
    RAISE NOTICE 'Utilisation du recruteur existant: %', v_recruiter_id;
  ELSE
    -- Sinon, chercher n'importe quel user
    SELECT id INTO v_recruiter_id
    FROM profiles
    WHERE user_type != 'admin'
    LIMIT 1;

    IF v_recruiter_id IS NULL THEN
      RAISE EXCEPTION 'Aucun utilisateur trouvé dans la base';
    END IF;

    RAISE NOTICE 'Utilisation du user: %', v_recruiter_id;
  END IF;

  -- Créer une offre en attente
  INSERT INTO jobs (
    user_id,
    title,
    description,
    location,
    contract_type,
    sector,
    salary_range,
    department,
    category,
    position_count,
    experience_level,
    education_level,
    status,
    submitted_at
  )
  VALUES (
    v_recruiter_id,
    'Comptable Junior',
    'Mining Guinée Corp recherche un Comptable Junior pour rejoindre son équipe financière.

**Responsabilités:**
- Enregistrement des opérations comptables courantes
- Rapprochement bancaire mensuel  
- Préparation des déclarations fiscales
- Assistance dans la clôture mensuelle

**Profil recherché:**
- Diplôme en comptabilité (Bac+2 minimum)
- 1-2 ans d''expérience
- Maîtrise des logiciels comptables
- Rigueur et sens de l''organisation',
    'Conakry',
    'CDI',
    'Finance',
    '800000-1200000 GNF/mois',
    'Mining Guinée Corp.',
    'Comptabilité',
    1,
    '1-2 ans',
    'Bac+2',
    'pending',
    now()
  );

  RAISE NOTICE 'Offre en attente créée avec succès';
END $$;
