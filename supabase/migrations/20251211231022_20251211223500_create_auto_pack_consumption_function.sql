/*
  # Fonction Automatique de Consommation des Packs
  
  1. Nouvelle Fonction
    - `consume_pack_credits(recruiter_id, candidate_ids[])` - Consomme automatiquement les crédits des packs
      - Trouve les packs actifs appropriés pour chaque profil
      - Décrémente automatiquement les crédits
      - Crée les profile_purchases avec validation automatique (sans intervention admin)
      - Retourne le résultat de l'opération
  
  2. Règles de Validation Automatique
    - Si un pack actif couvre le type de profil → validation automatique
    - payment_verified_by_admin = true automatiquement
    - payment_status = 'completed' automatiquement
    - payment_method = 'pack_credit'
    - amount = prix unitaire du pack
  
  3. Algorithme FIFO par Type
    - Priorité 1: Pack spécifique au niveau d'expérience
    - Priorité 2: Pack mixte/entreprise
    - Si aucun pack disponible → erreur
*/

-- Fonction pour consommer automatiquement les crédits de pack
CREATE OR REPLACE FUNCTION consume_pack_credits(
  p_recruiter_id uuid,
  p_candidate_ids uuid[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_candidate_id uuid;
  v_experience_years integer;
  v_experience_level text;
  v_pack record;
  v_unit_price integer;
  v_success_count integer := 0;
  v_failed_count integer := 0;
  v_failed_profiles jsonb[] := ARRAY[]::jsonb[];
  v_result jsonb;
BEGIN
  -- Vérifier que l'utilisateur existe et est un recruteur
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = p_recruiter_id
    AND user_type = 'recruiter'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Utilisateur invalide ou non recruteur'
    );
  END IF;

  -- Traiter chaque profil candidat
  FOREACH v_candidate_id IN ARRAY p_candidate_ids
  LOOP
    BEGIN
      -- Récupérer les informations du candidat
      SELECT experience_years INTO v_experience_years
      FROM candidate_profiles
      WHERE id = v_candidate_id;

      IF v_experience_years IS NULL THEN
        v_failed_count := v_failed_count + 1;
        v_failed_profiles := array_append(
          v_failed_profiles,
          jsonb_build_object(
            'candidate_id', v_candidate_id,
            'reason', 'Profil candidat introuvable'
          )
        );
        CONTINUE;
      END IF;

      -- Déterminer le niveau d'expérience
      IF v_experience_years >= 6 THEN
        v_experience_level := 'senior';
      ELSIF v_experience_years >= 3 THEN
        v_experience_level := 'intermediate';
      ELSE
        v_experience_level := 'junior';
      END IF;

      -- Vérifier si le profil a déjà été acheté
      IF EXISTS (
        SELECT 1 FROM profile_purchases
        WHERE buyer_id = p_recruiter_id
        AND candidate_id = v_candidate_id
      ) THEN
        v_failed_count := v_failed_count + 1;
        v_failed_profiles := array_append(
          v_failed_profiles,
          jsonb_build_object(
            'candidate_id', v_candidate_id,
            'reason', 'Profil déjà acheté'
          )
        );
        CONTINUE;
      END IF;

      -- Trouver un pack actif approprié (FIFO par type)
      -- Priorité 1: Pack spécifique au niveau
      SELECT * INTO v_pack
      FROM cvtheque_pack_purchases
      WHERE buyer_id = p_recruiter_id
      AND experience_level = v_experience_level
      AND profiles_remaining > 0
      AND expires_at > now()
      ORDER BY purchased_at ASC
      LIMIT 1;

      -- Priorité 2: Pack mixte/entreprise
      IF v_pack IS NULL THEN
        SELECT * INTO v_pack
        FROM cvtheque_pack_purchases
        WHERE buyer_id = p_recruiter_id
        AND experience_level IS NULL
        AND profiles_remaining > 0
        AND expires_at > now()
        ORDER BY purchased_at ASC
        LIMIT 1;
      END IF;

      -- Si aucun pack trouvé, échouer
      IF v_pack IS NULL THEN
        v_failed_count := v_failed_count + 1;
        v_failed_profiles := array_append(
          v_failed_profiles,
          jsonb_build_object(
            'candidate_id', v_candidate_id,
            'reason', 'Aucun pack actif pour le niveau ' || v_experience_level
          )
        );
        CONTINUE;
      END IF;

      -- Calculer le prix unitaire
      v_unit_price := ROUND(v_pack.price_paid::numeric / v_pack.total_profiles::numeric);

      -- Créer l'achat avec validation automatique
      INSERT INTO profile_purchases (
        buyer_id,
        candidate_id,
        amount,
        payment_status,
        payment_method,
        transaction_id,
        payment_verified_by_admin,
        verified_by,
        verified_at,
        admin_notes,
        purchased_at
      ) VALUES (
        p_recruiter_id,
        v_candidate_id,
        v_unit_price,
        'completed',
        'pack_credit',
        'PACK-' || v_pack.id || '-' || extract(epoch from now())::bigint,
        true, -- Validation automatique
        NULL, -- Pas d'admin, c'est automatique
        now(),
        'Achat automatique via pack: ' || v_pack.pack_name,
        now()
      );

      -- Décrémenter le crédit du pack
      UPDATE cvtheque_pack_purchases
      SET profiles_remaining = profiles_remaining - 1
      WHERE id = v_pack.id;

      v_success_count := v_success_count + 1;

    EXCEPTION
      WHEN OTHERS THEN
        v_failed_count := v_failed_count + 1;
        v_failed_profiles := array_append(
          v_failed_profiles,
          jsonb_build_object(
            'candidate_id', v_candidate_id,
            'reason', SQLERRM
          )
        );
    END;
  END LOOP;

  -- Retourner le résultat
  v_result := jsonb_build_object(
    'success', true,
    'success_count', v_success_count,
    'failed_count', v_failed_count,
    'failed_profiles', to_jsonb(v_failed_profiles)
  );

  RETURN v_result;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION consume_pack_credits(uuid, uuid[]) TO authenticated;
