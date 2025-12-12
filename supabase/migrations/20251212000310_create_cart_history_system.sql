/*
  # Système d'Historique du Panier CVThèque

  1. Nouvelles Tables
    - `profile_cart_history`: Historique des paniers de profils
      - Stocke les sélections de profils des recruteurs
      - Permet de retrouver les profils précédemment sélectionnés
      - Conserve le prix au moment de la sélection

    - `direct_profile_purchases`: Achats directs de profils (sans pack)
      - Pour les recruteurs qui achètent à l'unité
      - Intégration avec Orange Money
      - Système de validation par preuve de paiement

  2. Sécurité
    - RLS activé sur toutes les tables
    - Les recruteurs ne peuvent voir que leur propre historique
    - Les admins peuvent voir et gérer tous les achats directs

  3. Fonctionnalités
    - Historique persistant des sélections
    - Achats directs avec paiement Orange Money
    - Traçabilité complète des transactions
*/

-- Table d'historique du panier
CREATE TABLE IF NOT EXISTS profile_cart_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  profile_snapshot jsonb NOT NULL,
  price_at_selection integer NOT NULL,
  experience_level text NOT NULL CHECK (experience_level IN ('junior', 'intermediate', 'senior')),
  added_to_cart_at timestamptz DEFAULT now(),
  removed_from_cart_at timestamptz,
  converted_to_purchase boolean DEFAULT false,
  purchase_id uuid,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Table des achats directs de profils
CREATE TABLE IF NOT EXISTS direct_profile_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_ids uuid[] NOT NULL,
  total_profiles integer NOT NULL,
  total_amount integer NOT NULL,
  breakdown jsonb NOT NULL,

  payment_method text DEFAULT 'orange_money',
  payment_reference text UNIQUE NOT NULL,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'waiting_proof', 'completed', 'failed', 'cancelled', 'refunded')),
  payment_proof_url text,
  payment_verified_at timestamptz,
  payment_verified_by uuid REFERENCES profiles(id),

  purchase_status text DEFAULT 'pending' CHECK (purchase_status IN ('pending', 'confirmed', 'completed', 'cancelled', 'refunded')),
  confirmation_code text UNIQUE,

  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,

  admin_notes text,
  validated_by uuid REFERENCES profiles(id),
  validated_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_cart_history_recruiter ON profile_cart_history(recruiter_id, added_to_cart_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_history_candidate ON profile_cart_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_cart_history_active ON profile_cart_history(recruiter_id, removed_from_cart_at) WHERE removed_from_cart_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_direct_purchases_recruiter ON direct_profile_purchases(recruiter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_purchases_status ON direct_profile_purchases(purchase_status, payment_status);
CREATE INDEX IF NOT EXISTS idx_direct_purchases_payment_ref ON direct_profile_purchases(payment_reference);

-- RLS
ALTER TABLE profile_cart_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_profile_purchases ENABLE ROW LEVEL SECURITY;

-- Politiques pour profile_cart_history
CREATE POLICY "Recruiters can view own cart history"
  ON profile_cart_history FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can insert own cart history"
  ON profile_cart_history FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update own cart history"
  ON profile_cart_history FOR UPDATE
  TO authenticated
  USING (recruiter_id = auth.uid())
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Admins can view all cart history"
  ON profile_cart_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Politiques pour direct_profile_purchases
CREATE POLICY "Recruiters can view own direct purchases"
  ON direct_profile_purchases FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can insert own direct purchases"
  ON direct_profile_purchases FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Recruiters can update own pending purchases"
  ON direct_profile_purchases FOR UPDATE
  TO authenticated
  USING (
    recruiter_id = auth.uid()
    AND purchase_status = 'pending'
  )
  WITH CHECK (recruiter_id = auth.uid());

CREATE POLICY "Admins can view all direct purchases"
  ON direct_profile_purchases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can update all direct purchases"
  ON direct_profile_purchases FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Fonction pour archiver le panier
CREATE OR REPLACE FUNCTION archive_current_cart(p_recruiter_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profile_cart_history
  SET removed_from_cart_at = now(),
      updated_at = now()
  WHERE recruiter_id = p_recruiter_id
    AND removed_from_cart_at IS NULL;
END;
$$;

-- Fonction pour valider un achat direct
CREATE OR REPLACE FUNCTION validate_direct_purchase(
  p_purchase_id uuid,
  p_admin_id uuid,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase direct_profile_purchases;
  v_profile_id uuid;
  v_result jsonb;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_admin_id AND user_type = 'admin'
  ) THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  SELECT * INTO v_purchase
  FROM direct_profile_purchases
  WHERE id = p_purchase_id;

  IF v_purchase IS NULL THEN
    RAISE EXCEPTION 'Achat non trouvé';
  END IF;

  IF v_purchase.purchase_status != 'pending' THEN
    RAISE EXCEPTION 'Achat déjà traité';
  END IF;

  UPDATE direct_profile_purchases
  SET
    purchase_status = 'confirmed',
    payment_status = 'completed',
    confirmation_code = 'DP' || UPPER(substring(md5(random()::text) from 1 for 8)),
    confirmed_at = now(),
    validated_by = p_admin_id,
    validated_at = now(),
    payment_verified_at = now(),
    payment_verified_by = p_admin_id,
    admin_notes = p_notes,
    updated_at = now()
  WHERE id = p_purchase_id
  RETURNING * INTO v_purchase;

  FOREACH v_profile_id IN ARRAY v_purchase.profile_ids
  LOOP
    INSERT INTO profile_purchases (
      buyer_id,
      candidate_id,
      amount_paid,
      payment_method,
      payment_reference,
      purchase_type,
      purchase_status,
      access_granted_at
    ) VALUES (
      v_purchase.recruiter_id,
      v_profile_id,
      (v_purchase.total_amount / v_purchase.total_profiles),
      v_purchase.payment_method,
      v_purchase.payment_reference,
      'direct_unit',
      'completed',
      now()
    );
  END LOOP;

  UPDATE profile_cart_history
  SET
    converted_to_purchase = true,
    purchase_id = p_purchase_id,
    updated_at = now()
  WHERE recruiter_id = v_purchase.recruiter_id
    AND candidate_id = ANY(v_purchase.profile_ids)
    AND removed_from_cart_at IS NULL;

  PERFORM archive_current_cart(v_purchase.recruiter_id);

  v_result := jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase.id,
    'confirmation_code', v_purchase.confirmation_code,
    'total_profiles', v_purchase.total_profiles,
    'total_amount', v_purchase.total_amount
  );

  RETURN v_result;
END;
$$;

-- Fonction pour annuler un achat direct
CREATE OR REPLACE FUNCTION cancel_direct_purchase(
  p_purchase_id uuid,
  p_recruiter_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM direct_profile_purchases
    WHERE id = p_purchase_id
    AND recruiter_id = p_recruiter_id
    AND purchase_status = 'pending'
  ) THEN
    RAISE EXCEPTION 'Achat non trouvé ou déjà traité';
  END IF;

  UPDATE direct_profile_purchases
  SET
    purchase_status = 'cancelled',
    payment_status = 'cancelled',
    cancelled_at = now(),
    cancellation_reason = p_reason,
    updated_at = now()
  WHERE id = p_purchase_id;

  RETURN true;
END;
$$;

-- Trigger
CREATE OR REPLACE FUNCTION update_cart_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cart_history_updated_at
  BEFORE UPDATE ON profile_cart_history
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_history_timestamp();

CREATE TRIGGER set_direct_purchases_updated_at
  BEFORE UPDATE ON direct_profile_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_cart_history_timestamp();
