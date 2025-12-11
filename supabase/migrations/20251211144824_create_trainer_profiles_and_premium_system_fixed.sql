/*
  # Création système complet formateurs/coaches avec Premium

  ## Vue d'ensemble
  Création d'un système complet pour gérer deux types de formateurs :
  - Personnes physiques (formateurs individuels, coaches, freelances)
  - Personnes morales (organismes, instituts, écoles, universités, entreprises)

  ## 1. Tables créées

  ### trainer_profiles
  - Profils détaillés des formateurs (individus et organisations)
  - Champs spécifiques selon entity_type
  - Documents de vérification et statut

  ### trainer_promoted_posts
  - Système de mise en avant des formations
  - Différents packs de promotion
  - Intégration avec le système de paiement existant

  ## 2. Modifications tables existantes

  ### formations
  - Ajout de champs de promotion (mise_en_avant_until, promoted_by_pack_type)
  - Badge Premium/Sponsorisé

  ## 3. Services IA Formateurs
  - Services dédiés pour optimiser les formations
  - Génération de contenu professionnel
  - Recommandations intelligentes

  ## 4. Sécurité
  - RLS activé sur toutes les tables
  - Policies restrictives par défaut
  - Validation des documents de vérification

  ## 5. Notes importantes
  - Utilise le système Orange Money existant (aucune duplication)
  - Compatible avec le système Premium PRO+ existant
  - Extensible pour futures fonctionnalités
*/

-- ============================================================================
-- 1. TABLE TRAINER_PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS trainer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Type d'entité
  entity_type text NOT NULL CHECK (entity_type IN ('individual', 'organization')),
  
  -- Champs communs
  bio text,
  specializations text[] DEFAULT '{}',
  website_url text,
  location text,
  is_verified boolean DEFAULT false,
  verification_documents text[] DEFAULT '{}',
  verification_notes text,
  verified_at timestamptz,
  
  -- Champs INDIVIDUAL
  full_name text,
  profession text,
  experience_years integer DEFAULT 0 CHECK (experience_years >= 0),
  certifications jsonb DEFAULT '[]',
  photo_url text,
  
  -- Champs ORGANIZATION
  organization_name text,
  organization_type text,
  rccm text,
  agrement_number text,
  address text,
  domaines text[] DEFAULT '{}',
  logo_url text,
  contact_person text,
  contact_person_title text,
  
  -- Statistiques
  total_students integer DEFAULT 0 CHECK (total_students >= 0),
  total_formations integer DEFAULT 0 CHECK (total_formations >= 0),
  average_rating numeric(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  total_reviews integer DEFAULT 0 CHECK (total_reviews >= 0),
  
  -- Meta
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Constraints
  UNIQUE(profile_id),
  UNIQUE(user_id),
  
  CHECK (
    (entity_type = 'individual' AND full_name IS NOT NULL) OR
    (entity_type = 'organization' AND organization_name IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_trainer_profiles_profile_id ON trainer_profiles(profile_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_user_id ON trainer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_entity_type ON trainer_profiles(entity_type);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_verified ON trainer_profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_created_at ON trainer_profiles(created_at DESC);

-- ============================================================================
-- 2. TABLE TRAINER_PROMOTED_POSTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS trainer_promoted_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE NOT NULL,
  
  pack_type text NOT NULL CHECK (pack_type IN (
    'boost_7j',
    'boost_15j',
    'boost_30j',
    'premium_month',
    'premium_org_annual'
  )),
  pack_name text NOT NULL,
  
  price_amount numeric NOT NULL CHECK (price_amount > 0),
  currency text DEFAULT 'GNF' NOT NULL,
  payment_method text DEFAULT 'orange_money',
  payment_reference text UNIQUE,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN (
    'pending',
    'waiting_proof',
    'completed',
    'failed',
    'cancelled'
  )),
  payment_proof_url text,
  
  promotion_status text DEFAULT 'pending' CHECK (promotion_status IN (
    'pending',
    'active',
    'expired',
    'cancelled'
  )),
  
  started_at timestamptz,
  expires_at timestamptz,
  
  views_count integer DEFAULT 0 CHECK (views_count >= 0),
  clicks_count integer DEFAULT 0 CHECK (clicks_count >= 0),
  enrollments_count integer DEFAULT 0 CHECK (enrollments_count >= 0),
  
  admin_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainer_promoted_trainer ON trainer_promoted_posts(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_promoted_formation ON trainer_promoted_posts(formation_id);
CREATE INDEX IF NOT EXISTS idx_trainer_promoted_status ON trainer_promoted_posts(promotion_status);
CREATE INDEX IF NOT EXISTS idx_trainer_promoted_expires ON trainer_promoted_posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_trainer_promoted_created ON trainer_promoted_posts(created_at DESC);

-- ============================================================================
-- 3. MISE À JOUR TABLE FORMATIONS
-- ============================================================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'mise_en_avant_until'
  ) THEN
    ALTER TABLE formations ADD COLUMN mise_en_avant_until timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'promoted_by_pack_type'
  ) THEN
    ALTER TABLE formations ADD COLUMN promoted_by_pack_type text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'is_premium_formation'
  ) THEN
    ALTER TABLE formations ADD COLUMN is_premium_formation boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'formations' AND column_name = 'premium_badge_text'
  ) THEN
    ALTER TABLE formations ADD COLUMN premium_badge_text text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_formations_mise_en_avant ON formations(mise_en_avant_until);

-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE trainer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_promoted_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profils formateurs vérifiés publics"
  ON trainer_profiles FOR SELECT
  TO authenticated
  USING (is_verified = true);

CREATE POLICY "Formateurs peuvent voir leur propre profil"
  ON trainer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Utilisateurs peuvent créer profil formateur"
  ON trainer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Formateurs peuvent modifier leur profil"
  ON trainer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Formateurs peuvent supprimer leur profil"
  ON trainer_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Formateurs voient leurs promotions"
  ON trainer_promoted_posts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = trainer_id
      AND profiles.id = (SELECT id FROM profiles WHERE profiles.id = auth.uid())
    )
  );

CREATE POLICY "Formateurs créent des promotions"
  ON trainer_promoted_posts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = trainer_id
      AND profiles.id = (SELECT id FROM profiles WHERE profiles.id = auth.uid())
    )
  );

CREATE POLICY "Formateurs modifient leurs promotions"
  ON trainer_promoted_posts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = trainer_id
      AND profiles.id = (SELECT id FROM profiles WHERE profiles.id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = trainer_id
      AND profiles.id = (SELECT id FROM profiles WHERE profiles.id = auth.uid())
    )
  );

-- ============================================================================
-- 5. FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION create_trainer_profile_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_type = 'trainer' AND NOT EXISTS (
    SELECT 1 FROM trainer_profiles WHERE user_id = NEW.id
  ) THEN
    INSERT INTO trainer_profiles (
      profile_id,
      user_id,
      entity_type,
      full_name
    ) VALUES (
      NEW.id,
      NEW.id,
      'individual',
      NEW.full_name
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS create_trainer_profile_trigger ON profiles;
CREATE TRIGGER create_trainer_profile_trigger
  AFTER INSERT OR UPDATE OF user_type ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_trainer_profile_on_signup();

CREATE OR REPLACE FUNCTION update_formation_promotion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.promotion_status = 'active' AND (OLD IS NULL OR OLD.promotion_status != 'active') THEN
    UPDATE formations
    SET 
      mise_en_avant_until = NEW.expires_at,
      promoted_by_pack_type = NEW.pack_type,
      is_premium_formation = CASE 
        WHEN NEW.pack_type IN ('premium_month', 'premium_org_annual') THEN true
        ELSE false
      END,
      premium_badge_text = CASE
        WHEN NEW.pack_type = 'premium_org_annual' THEN 'PREMIUM ORG'
        WHEN NEW.pack_type = 'premium_month' THEN 'PREMIUM'
        ELSE 'SPONSORISÉ'
      END
    WHERE id = NEW.formation_id;
  END IF;
  
  IF NEW.promotion_status = 'expired' AND OLD.promotion_status = 'active' THEN
    UPDATE formations
    SET 
      mise_en_avant_until = NULL,
      promoted_by_pack_type = NULL,
      is_premium_formation = false,
      premium_badge_text = NULL
    WHERE id = NEW.formation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_formation_promotion_trigger ON trainer_promoted_posts;
CREATE TRIGGER update_formation_promotion_trigger
  AFTER INSERT OR UPDATE OF promotion_status ON trainer_promoted_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_formation_promotion();

CREATE OR REPLACE FUNCTION auto_expire_trainer_promotions()
RETURNS void AS $$
BEGIN
  UPDATE trainer_promoted_posts
  SET promotion_status = 'expired'
  WHERE promotion_status = 'active'
    AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. DONNÉES INITIALES
-- ============================================================================

INSERT INTO premium_services (name, description, category, type, price, icon, features, is_active)
VALUES
  (
    'Mise en avant 7 jours',
    'Boostez votre formation pendant 7 jours',
    'trainer_promotion',
    'premium',
    50000,
    'TrendingUp',
    '["Badge SPONSORISÉ", "Position prioritaire", "Visibilité accrue 7j", "Stats détaillées"]'::jsonb,
    true
  ),
  (
    'Mise en avant 15 jours',
    'Boostez votre formation pendant 15 jours',
    'trainer_promotion',
    'premium',
    90000,
    'TrendingUp',
    '["Badge SPONSORISÉ", "Position prioritaire", "Visibilité accrue 15j", "Stats détaillées", "Économie 10%"]'::jsonb,
    true
  ),
  (
    'Mise en avant 30 jours',
    'Boostez votre formation pendant 30 jours',
    'trainer_promotion',
    'premium',
    150000,
    'TrendingUp',
    '["Badge SPONSORISÉ", "Position prioritaire", "Visibilité accrue 30j", "Stats détaillées", "Économie 25%"]'::jsonb,
    true
  ),
  (
    'Pack Premium Formateur',
    'Abonnement mensuel pour formateurs individuels',
    'trainer_premium',
    'premium',
    250000,
    'Award',
    '["Badge PREMIUM", "Publication illimitée", "Stats avancées", "Support prioritaire", "Outils IA inclus"]'::jsonb,
    true
  ),
  (
    'Pack Premium Organisation',
    'Abonnement annuel pour organismes',
    'trainer_premium',
    'premium',
    2500000,
    'Building',
    '["Badge PREMIUM ORG", "Publication illimitée", "Multi-utilisateurs", "Tableau de bord institutionnel", "API intégration", "Gestionnaire dédié"]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO ia_service_config (
  service_code,
  service_name,
  service_description,
  base_prompt,
  category,
  model,
  temperature,
  max_tokens,
  is_active,
  credits_cost
)
VALUES
  (
    'trainer_formation_description',
    'Génération Description Formation',
    'Génère une description professionnelle',
    'Tu es un expert en rédaction de contenus de formation. Génère une description claire, professionnelle et engageante.',
    'trainer',
    'gpt-4',
    0.7,
    800,
    true,
    15
  ),
  (
    'trainer_program_optimizer',
    'Optimisation Programme Formation',
    'Optimise et structure le programme',
    'Tu es un expert en ingénierie pédagogique. Optimise le programme de formation en le structurant de manière claire et progressive.',
    'trainer',
    'gpt-4',
    0.6,
    1000,
    true,
    20
  ),
  (
    'trainer_price_recommender',
    'Recommandation Prix Formation',
    'Recommande un prix optimal',
    'Tu es un expert en stratégie tarifaire. Analyse la formation et recommande un prix optimal.',
    'trainer',
    'gpt-4',
    0.5,
    500,
    true,
    10
  ),
  (
    'trainer_visibility_tips',
    'Conseils Visibilité Formation',
    'Fournit des conseils personnalisés',
    'Tu es un expert en marketing digital. Fournis des conseils concrets pour améliorer la visibilité.',
    'trainer',
    'gpt-4',
    0.7,
    600,
    true,
    10
  )
ON CONFLICT (service_code) DO NOTHING;

INSERT INTO service_credit_costs (service_code, service_name, service_description, credits_cost, category, is_active)
VALUES
  ('trainer_formation_description', 'Génération Description', 'IA génère une description professionnelle', 15, 'Formateurs', true),
  ('trainer_program_optimizer', 'Optimisation Programme', 'IA optimise le programme', 20, 'Formateurs', true),
  ('trainer_price_recommender', 'Recommandation Prix', 'IA recommande le prix optimal', 10, 'Formateurs', true),
  ('trainer_visibility_tips', 'Conseils Visibilité', 'IA fournit des conseils', 10, 'Formateurs', true)
ON CONFLICT (service_code) DO UPDATE SET
  service_name = EXCLUDED.service_name,
  credits_cost = EXCLUDED.credits_cost,
  category = EXCLUDED.category;