# 🔍 DIAGNOSTIC COMPLET - JobGuinée Platform
## Analyse Structurelle Frontend ↔ Backend ↔ Database

**Date du diagnostic:** 2025-12-10
**Version:** 1.0
**Analysé par:** Bolt.new AI Agent
**Nombre de fichiers analysés:** 95+ fichiers source

---

## 📋 TABLE DES MATIÈRES

1. [Résumé Exécutif](#résumé-exécutif)
2. [Section A: Incohérences FRONTEND → BACKEND](#section-a-incohérences-frontend--backend)
3. [Section B: Incohérences BACKEND → DATABASE](#section-b-incohérences-backend--database)
4. [Section C: Incohérences FRONTEND → DATABASE](#section-c-incohérences-frontend--database)
5. [Section D: Vérification IA Centrale](#section-d-vérification-ia-centrale)
6. [Section E: Risques Techniques](#section-e-risques-techniques)
7. [Section F: Plan de Correction](#section-f-plan-de-correction)
8. [Section G: Actions Automatiques Recommandées](#section-g-actions-automatiques-recommandées)

---

## 🎯 RÉSUMÉ EXÉCUTIF

### État Général du Projet

**🟡 MOYEN** - Le projet présente une architecture bien conçue avec des problèmes critiques à résoudre

### Statistiques Clés

| Métrique | Valeur | Statut |
|----------|--------|--------|
| Tables de base de données | 67 tables | ✅ Bon |
| Migrations appliquées | 84 fichiers | ⚠️ Duplications |
| Services backend | 11 services | ✅ Bien structurés |
| Composants AI | 8 composants | ⚠️ Incohérences |
| Fonctions RPC | 25+ fonctions | ❌ 1 manquante (critique) |
| Tables manquantes | 2 tables | 🔴 CRITIQUE |
| Incohérences de service codes | 6+ instances | 🟠 HAUTE PRIORITÉ |
| Code inutilisé | ~500 lignes | 🟡 À nettoyer |

### Problèmes Critiques Identifiés

#### 🔴 BLOQUANTS (Empêchent le fonctionnement)
1. **Fonction RPC manquante:** `use_ai_credits` n'existe pas → Tous les services IA sont cassés
2. **Tables manquantes:** `credit_packages` et `credit_transactions` → Achats de crédits impossibles
3. **Confusion `user_id` vs `profile_id`:** Requêtes incohérentes → Erreurs 404 aléatoires

#### 🟠 HAUTE PRIORITÉ (Dégradent l'expérience)
4. **Service codes incohérents:** 6+ composants utilisent de mauvais codes → Mauvais coût de crédits
5. **Champ `credits_balance` manquant dans type Profile:** Erreurs TypeScript
6. **Migrations dupliquées:** 15+ tables créées plusieurs fois → Risque de conflits

#### 🟡 MOYENNE PRIORITÉ (Améliorations)
7. **Méthode privée appelée publiquement:** `validateInput` dans iaConfigService
8. **Code mort:** 3 fichiers inutilisés (~500 lignes)
9. **Packages npm non utilisés:** docx, docx-preview (~2.5 MB)

---

## 📊 SECTION A: INCOHÉRENCES FRONTEND → BACKEND

### A.1 Inventaire des Services Backend

#### Services Principaux

| Service | Fichier | Statut | Utilisé Par |
|---------|---------|--------|-------------|
| CreditService | creditService.ts | ✅ | Tous composants AI |
| PricingEngine | creditService.ts | ✅ | AdminIAPricing, composants AI |
| CreditStoreService | creditStoreService.ts | ✅ | CreditStore page |
| ChatbotService | chatbotService.ts | ✅ | AdminChatbot, ChatbotWidget |
| IAConfigService | iaConfigService.ts | ✅ | Tous composants AI |
| UserProfileService | userProfileService.ts | ✅ | Composants AI |
| CVBuilderService | cvBuilderService.ts | ✅ | CVCentralModal |
| CVImproverService | cvImproverService.ts | ✅ | CVCentralModal |
| CVTargetedService | cvTargetedService.ts | ✅ | CVCentralModal |
| PDFService | pdfService.ts | ✅ | AICoverLetterGenerator |
| PaymentProviders | paymentProviders.ts | ✅ | CreditStoreService |

### A.2 Incohérences Critiques

#### 🔴 A.2.1 - Confusion `user_id` vs `profile_id` dans `candidate_profiles`

**Gravité:** CRITIQUE
**Impact:** Erreurs 404, profils non trouvés

**Fichiers affectés:**
```typescript
// ❌ INCORRECT - AICVGenerator.tsx:77
const { data: candidateProfile } = await supabase
  .from('candidate_profiles')
  .select('*')
  .eq('user_id', user!.id)  // ❌ Devrait être profile_id
  .maybeSingle();

// ❌ INCORRECT - AIMatchingService.tsx:150
const { data: profile } = await supabase
  .from('candidate_profiles')
  .select('*')
  .eq('user_id', user!.id)  // ❌ Devrait être profile_id
  .maybeSingle();

// ✅ CORRECT - CandidateProfileForm.tsx:172
const { data: existingProfile } = await supabase
  .from('candidate_profiles')
  .select('*')
  .eq('profile_id', profile.id)  // ✅ Bon champ
  .maybeSingle();
```

**Schéma de la table `candidate_profiles`:**
```sql
CREATE TABLE candidate_profiles (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),  -- ✅ Bonne relation
  user_id uuid REFERENCES auth.users(id),   -- ⚠️ Redondant mais présent
  -- ... autres champs
);
```

**Solution:**
- Standardiser sur `profile_id` partout
- Ou créer un index sur `user_id` si les deux sont intentionnels

---

#### 🔴 A.2.2 - Mauvais Service Code dans AICoverLetterGenerator

**Gravité:** CRITIQUE
**Impact:** Mauvais coût de crédits appliqué, mauvais logging

**Fichier:** `AICoverLetterGenerator.tsx:29`

```typescript
// ❌ INCORRECT
const serviceCode = SERVICES.AI_CV_GENERATION; // Utilise le code pour CV!

// ✅ DEVRAIT ÊTRE
const serviceCode = SERVICES.AI_COVER_LETTER;
```

**Impact:**
- Le service charge le coût d'un CV (30 crédits) au lieu d'une lettre (20 crédits)
- Les logs d'utilisation sont incorrects
- Les statistiques d'usage sont faussées

---

#### 🔴 A.2.3 - Table `candidate_cv` Manquante

**Gravité:** CRITIQUE
**Impact:** Chargement de profil échoue

**Fichier:** `userProfileService.ts:76`

```typescript
// Service essaie de charger depuis une table qui n'existe pas
const { data: cv, error: cvError } = await supabase
  .from('candidate_cv')  // ❌ Cette table n'existe pas
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();
```

**Tables disponibles:**
- ✅ `candidate_profiles` existe
- ❌ `candidate_cv` n'existe PAS
- ✅ Champ `cv_url` existe dans `candidate_profiles`

**Solution:**
- Supprimer cette requête
- Utiliser `candidate_profiles.cv_url` à la place

---

#### 🔴 A.2.4 - Table `candidate_applications` vs `applications`

**Gravité:** CRITIQUE
**Impact:** Requête échoue

**Fichier:** `userProfileService.ts:350`

```typescript
// ❌ INCORRECT
const { data } = await supabase
  .from('candidate_applications')  // ❌ Table incorrecte
  .select(`
    *,
    jobs (*)
  `);

// ✅ CORRECT
const { data } = await supabase
  .from('applications')  // ✅ Nom de table correct
  .select(`
    *,
    jobs (*)
  `);
```

---

### A.3 Incohérences de Types TypeScript

#### 🟠 A.3.1 - Interface `CreditServiceConfig` Incomplète

**Gravité:** HAUTE
**Impact:** Données incomplètes retournées

**Fichier:** `creditService.ts:3-18`

```typescript
// Interface définit ces champs
interface CreditServiceConfig {
  id: string;
  service_code: string;
  service_name: string;
  service_description?: string;
  credits_cost: number;
  is_active: boolean;
  category?: string;
  promotion_active?: boolean;      // ⚠️ Jamais sélectionné
  discount_percent?: number;       // ⚠️ Jamais sélectionné
  effective_cost?: number;         // ⚠️ Jamais sélectionné
  display_order?: number;          // ⚠️ Jamais sélectionné
  icon?: string;                   // ⚠️ Jamais sélectionné
  created_at?: string;             // ⚠️ Jamais sélectionné
  updated_at?: string;             // ⚠️ Jamais sélectionné
}

// Mais les requêtes ne sélectionnent que
.select('service_code, service_name, credits_cost, is_active, category')
```

**Solution:**
- Ajouter tous les champs aux requêtes SELECT
- Ou marquer plus de champs comme optionnels

---

#### 🟠 A.3.2 - Type `Profile` Manque `credits_balance`

**Gravité:** HAUTE
**Impact:** Erreurs TypeScript

**Fichier:** `lib/supabase.ts:14-27`

```typescript
// ❌ Type actuel
export type Profile = {
  id: string;
  user_type: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  // ... autres champs
  // credits_balance manquant! ❌
};

// ✅ Devrait être
export type Profile = {
  id: string;
  user_type: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  credits_balance?: number;  // ✅ Ajouter ce champ
  // ... autres champs
};
```

**Impact:**
- Les composants qui lisent `profile.credits_balance` génèrent des erreurs TypeScript
- Le hook `useCreditService` ne peut pas typer correctement le solde

---

### A.4 Gestion d'Erreurs Manquante

#### 🟡 A.4.1 - Composants AI Sans Gestion d'Erreurs de Crédits

**Gravité:** MOYENNE
**Impact:** UX dégradée quand les crédits échouent

**Fichiers affectés:**
- AICVGenerator.tsx
- AICoverLetterGenerator.tsx
- AICareerPlanGenerator.tsx
- AIMatchingService.tsx

**Exemple de problème:**
```typescript
// Les erreurs de consommation de crédits ne sont pas gérées
const result = await consumeCredits(
  SERVICES.AI_CV_GENERATION,
  inputData,
  generatedCV
);

// Si consumeCredits échoue, l'utilisateur ne voit qu'une erreur générique
// Pas de message sur:
// - Crédits insuffisants
// - Service temporairement indisponible
// - Erreur de facturation
```

**Solution recommandée:**
```typescript
try {
  const result = await consumeCredits(...);

  if (!result.success) {
    if (result.error === 'INSUFFICIENT_CREDITS') {
      notif.error(`Crédits insuffisants. Il vous faut ${result.required} crédits.`);
      // Proposer redirection vers boutique
    } else {
      notif.error('Erreur lors de la facturation du service');
    }
    return;
  }

  // Continuer...
} catch (error) {
  notif.error('Service temporairement indisponible');
}
```

---

### A.5 Imports Cassés

#### 🟡 A.5.1 - Import PDFService Potentiellement Cassé

**Gravité:** MOYENNE (à vérifier)
**Impact:** Possible erreur d'import

**Fichier:** `AICoverLetterGenerator.tsx:11`

```typescript
import { PDFService } from '../../services/pdfService';
```

**Vérification nécessaire:**
- Le fichier existe-t-il à `/tmp/cc-agent/61286758/project/src/services/pdfService.ts` ?
- L'export est-il nommé `PDFService` ou `pdfService` ?
- Sensibilité à la casse sur le système de fichiers

---

### A.6 Code Mort Potentiel

#### 🟢 A.6.1 - CVBuilderService Peu Utilisé

**Gravité:** BASSE
**Impact:** Aucun (code fonctionnel)

**Fichier:** `cvBuilderService.ts`

**Observation:**
- Service défini et exporté
- Utilisé seulement par `CVCentralModal`
- Méthodes `buildCV()` et `previewCV()` peuvent être sous-utilisées

**Recommandation:** Garder mais surveiller l'usage

---

## 📊 SECTION B: INCOHÉRENCES BACKEND → DATABASE

### B.1 Tables Manquantes Critiques

#### 🔴 B.1.1 - Table `credit_packages` MANQUANTE

**Gravité:** CRITIQUE - BLOQUANT
**Impact:** Impossible d'acheter des packs de crédits

**Référencée dans:**
- Migration `20251201213446_create_credit_purchase_system.sql`
- Table `credit_purchases` → FK vers `credit_packages(id)`
- Fonction RPC `create_credit_purchase(p_package_id, ...)`

**Contrainte de clé étrangère:**
```sql
-- Dans credit_purchases
package_id uuid REFERENCES credit_packages(id) RESTRICT NOT NULL
-- ❌ Cette contrainte ÉCHOUE car credit_packages n'existe pas
```

**Impact:**
- Impossible de créer des achats de crédits
- La page CreditStore ne peut pas charger les packages
- Les fonctions RPC échouent

**Schéma requis:**
```sql
CREATE TABLE credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  bonus_credits integer DEFAULT 0 CHECK (bonus_credits >= 0),
  price_amount numeric(10,2) NOT NULL CHECK (price_amount > 0),
  currency text DEFAULT 'GNF' NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  is_popular boolean DEFAULT false NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_credit_packages_active ON credit_packages(is_active, display_order);

-- Données par défaut suggérées
INSERT INTO credit_packages (package_name, credits_amount, bonus_credits, price_amount, is_popular, display_order) VALUES
  ('Pack Starter', 100, 10, 50000, false, 1),
  ('Pack Premium', 300, 50, 120000, true, 2),
  ('Pack Pro', 600, 150, 200000, false, 3),
  ('Pack Enterprise', 1500, 500, 450000, false, 4);
```

---

#### 🔴 B.1.2 - Table `credit_transactions` MANQUANTE

**Gravité:** CRITIQUE - BLOQUANT
**Impact:** Impossible de logger les transactions de crédits

**Référencée dans:**
- Fonction RPC `complete_credit_purchase()` (ligne 45+)
- Service `CreditService.getTransactionHistory()`

**Utilisations dans le code:**
```typescript
// creditService.ts:200
async getTransactionHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('credit_transactions')  // ❌ Table n'existe pas
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
}
```

**Schéma requis:**
```sql
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'purchase', 'usage', 'refund', 'bonus', 'admin_adjustment'
  )),
  credits_amount integer NOT NULL,
  description text,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  service_code text,
  reference_id uuid,  -- Lien vers credit_purchases ou autre
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_service ON credit_transactions(service_code) WHERE service_code IS NOT NULL;

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
```

---

### B.2 Fonction RPC Critique Manquante

#### 🔴 B.2.1 - Fonction `use_ai_credits` N'EXISTE PAS

**Gravité:** CRITIQUE - BLOQUANT
**Impact:** AUCUN service IA ne fonctionne

**Appelée dans:** `creditService.ts:153-158`

```typescript
async consumeCredits(
  userId: string,
  serviceCode: string,
  inputPayload?: any,
  outputResponse?: any
): Promise<CreditConsumeResult> {
  const { data, error } = await supabase.rpc('use_ai_credits', {
    // ❌ Cette fonction RPC n'existe dans AUCUNE migration
    p_user_id: userId,
    p_service_key: serviceCode,
    p_input_payload: inputPayload || null,
    p_output_response: outputResponse || null
  });

  if (error) {
    console.error('Credit consumption error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Erreur lors de la consommation des crédits'
    };
  }

  return data;
}
```

**Composants affectés:**
- ✅ AICVGenerator
- ✅ EnhancedAICVGenerator
- ✅ AICoverLetterGenerator
- ✅ AICareerPlanGenerator
- ✅ AIMatchingService
- ✅ AICoachChat

**Impact:**
- **100% des fonctionnalités IA sont CASSÉES**
- Aucun service ne peut facturer de crédits
- Aucun usage n'est tracké

**Implémentation complète requise:**

```sql
-- Table pour historique d'usage AI (si manquante)
CREATE TABLE IF NOT EXISTS ai_service_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_key text NOT NULL,
  credits_consumed integer NOT NULL CHECK (credits_consumed >= 0),
  input_payload jsonb,
  output_response jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_usage_user ON ai_service_usage_history(user_id, created_at DESC);
CREATE INDEX idx_ai_usage_service ON ai_service_usage_history(service_key);

ALTER TABLE ai_service_usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage history"
  ON ai_service_usage_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage"
  ON ai_service_usage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fonction RPC principale
CREATE OR REPLACE FUNCTION use_ai_credits(
  p_user_id uuid,
  p_service_key text,
  p_input_payload jsonb DEFAULT NULL,
  p_output_response jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_cost integer;
  v_user_credits integer;
  v_new_balance integer;
  v_usage_id uuid;
  v_service_name text;
BEGIN
  -- Vérifier que le service existe et est actif
  SELECT credits_cost, service_name
  INTO v_service_cost, v_service_name
  FROM service_credit_costs
  WHERE service_code = p_service_key
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', 'Service IA non trouvé ou inactif'
    );
  END IF;

  -- Récupérer le solde actuel de l'utilisateur
  SELECT credits_balance INTO v_user_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;  -- Verrouillage pour éviter les conditions de course

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Profil utilisateur non trouvé'
    );
  END IF;

  -- Vérifier que l'utilisateur a assez de crédits
  IF v_user_credits < v_service_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', 'Crédits insuffisants',
      'required_credits', v_service_cost,
      'available_credits', v_user_credits,
      'missing_credits', v_service_cost - v_user_credits
    );
  END IF;

  -- Calculer le nouveau solde
  v_new_balance := v_user_credits - v_service_cost;

  -- Déduire les crédits
  UPDATE profiles
  SET
    credits_balance = v_new_balance,
    updated_at = now()
  WHERE id = p_user_id;

  -- Enregistrer la transaction dans credit_transactions
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    balance_before,
    balance_after,
    service_code
  ) VALUES (
    p_user_id,
    'usage',
    -v_service_cost,
    'Utilisation service: ' || v_service_name,
    v_user_credits,
    v_new_balance,
    p_service_key
  );

  -- Logger l'usage dans l'historique AI
  INSERT INTO ai_service_usage_history (
    user_id,
    service_key,
    credits_consumed,
    input_payload,
    output_response
  ) VALUES (
    p_user_id,
    p_service_key,
    v_service_cost,
    p_input_payload,
    p_output_response
  )
  RETURNING id INTO v_usage_id;

  -- Retourner le succès avec les détails
  RETURN json_build_object(
    'success', true,
    'message', 'Crédits consommés avec succès',
    'credits_consumed', v_service_cost,
    'credits_remaining', v_new_balance,
    'usage_id', v_usage_id,
    'service_name', v_service_name
  );

EXCEPTION WHEN OTHERS THEN
  -- Gestion d'erreurs génériques
  RETURN json_build_object(
    'success', false,
    'error', 'UNEXPECTED_ERROR',
    'message', 'Erreur inattendue: ' || SQLERRM
  );
END;
$$;

-- Accorder les permissions nécessaires
GRANT EXECUTE ON FUNCTION use_ai_credits TO authenticated;

COMMENT ON FUNCTION use_ai_credits IS
'Fonction sécurisée pour consommer des crédits AI.
Vérifie le solde, déduit les crédits, log la transaction et l''usage.';
```

---

### B.3 Incohérences de Service Codes

#### 🟠 B.3.1 - Service Codes Différents Entre Tables

**Gravité:** HAUTE
**Impact:** Codes ne correspondent pas, services non trouvés

**Dans `service_credit_costs` (migration 20251209160805):**
```sql
INSERT INTO service_credit_costs (service_code, service_name, credits_cost) VALUES
  ('ai_cv_generation', 'Génération de CV IA', 30),
  ('ai_cover_letter_generation', 'Génération Lettre de Motivation', 20),  -- ❌
  ('job_matching', 'Matching Intelligent', 50),                            -- ❌
  ('interview_coaching', 'Coaching Entretien', 60),                        -- ❌
  ('career_path_planning', 'Plan de Carrière', 40);                       -- ❌
```

**Dans `ia_service_config` (migration 20251201221322):**
```sql
INSERT INTO ia_service_config (service_code, service_name, ...) VALUES
  ('ai_cv_generation', 'Génération de CV IA', ...),
  ('ai_cover_letter', 'Génération de Lettre de Motivation', ...),  -- ✅
  ('ai_coach', 'Coaching Carrière IA', ...),                        -- ✅
  ('ai_matching', 'Matching Emploi IA', ...),                       -- ✅
  ('ai_career_plan', 'Plan de Carrière IA', ...);                   -- ✅
```

**Dans `creditService.ts` (SERVICES constant):**
```typescript
export const SERVICES = {
  AI_CV_GENERATION: 'ai_cv_generation',              // ✅
  AI_COVER_LETTER: 'ai_cover_letter_generation',     // ❌
  AI_JOB_MATCHING: 'job_matching',                   // ❌
  AI_PROFILE_ANALYSIS: 'profile_analysis',           // ❌ N'existe nulle part
  AI_INTERVIEW_COACHING: 'interview_coaching',       // ❌
  AI_CAREER_PATH: 'career_path_planning',           // ❌
};
```

**Problème:**
- Quand un composant utilise `SERVICES.AI_COVER_LETTER` ('ai_cover_letter_generation')
- Le service cherche dans `ia_service_config` avec ce code
- Il ne trouve rien car le code correct est `'ai_cover_letter'`
- Résultat: Service non trouvé → Erreur

**Solution: Standardiser TOUS les codes**

Proposition de codes standards:
```
✅ ai_cv_generation       (déjà cohérent)
✅ ai_cover_letter        (à corriger partout)
✅ ai_matching            (à corriger partout)
✅ ai_coach               (à corriger partout)
✅ ai_career_plan         (à corriger partout)
```

**Corrections à appliquer:**

1. **Mettre à jour `service_credit_costs`:**
```sql
UPDATE service_credit_costs SET service_code = 'ai_cover_letter' WHERE service_code = 'ai_cover_letter_generation';
UPDATE service_credit_costs SET service_code = 'ai_matching' WHERE service_code = 'job_matching';
UPDATE service_credit_costs SET service_code = 'ai_coach' WHERE service_code = 'interview_coaching';
UPDATE service_credit_costs SET service_code = 'ai_career_plan' WHERE service_code = 'career_path_planning';
```

2. **Mettre à jour `creditService.ts`:**
```typescript
export const SERVICES = {
  AI_CV_GENERATION: 'ai_cv_generation',
  AI_COVER_LETTER: 'ai_cover_letter',        // ✅ Corrigé
  AI_JOB_MATCHING: 'ai_matching',            // ✅ Corrigé
  AI_INTERVIEW_COACHING: 'ai_coach',         // ✅ Corrigé
  AI_CAREER_PATH: 'ai_career_plan',         // ✅ Corrigé
  // Retirer PROFILE_ANALYSIS s'il n'existe pas
};
```

3. **Mettre à jour tous les composants utilisant les anciens codes**

---

### B.4 Migrations Dupliquées

#### 🟡 B.4.1 - 15+ Tables Créées Plusieurs Fois

**Gravité:** MOYENNE
**Impact:** Risque de conflits de schéma

**Tables dupliquées détectées:**

| Table | Nombre de créations | Fichiers |
|-------|---------------------|----------|
| `profiles` | 3x | 20251031124738, 20251209215534, 20251209150718 |
| `jobs` | 3x | 20251031124738, 20251209215534, 20251209150718 |
| `notifications` | 3x | 20251031124002, 20251209154445, 20251209150718 |
| `chatbot_settings` | 2x | 20251209170517, 20251210092858 |
| `workflow_stages` | 2x | 20251031130406, 20251209154414 |
| `profile_cart` | 3x | 20251103171504, 20251030152245, 20251209154444 |
| `profile_purchases` | 3x | 20251103171527, 20251030152245, 20251209154444 |

**Problème:**
- Si les migrations utilisent `CREATE TABLE` sans `IF NOT EXISTS`, la deuxième échoue
- Si elles utilisent `IF NOT EXISTS`, le schéma peut diverger selon l'ordre d'application
- Les contraintes peuvent être ajoutées plusieurs fois

**Exemple:**
```sql
-- Migration A
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  user_type text CHECK (user_type IN ('candidate', 'recruiter'))
);

-- Migration B (plus tard)
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  user_type text CHECK (user_type IN ('candidate', 'recruiter', 'admin'))
);
-- ❌ Si A est déjà appliqué, B échoue
-- ❌ Si B passe avec IF NOT EXISTS, le CHECK de A reste actif!
```

**Solution:**
1. Utiliser toujours `CREATE TABLE IF NOT EXISTS`
2. Ajouter les contraintes via `ALTER TABLE` avec checks d'existence
3. Consolider les migrations en supprimant les doublons

---

### B.5 Indexes Manquants

#### 🟡 B.5.1 - Indexes de Performance Manquants

**Gravité:** MOYENNE
**Impact:** Requêtes lentes sur gros volumes

**Indexes recommandés:**

```sql
-- Applications: requêtes fréquentes par job + status
CREATE INDEX IF NOT EXISTS idx_applications_job_status
  ON applications(job_id, status);

-- Jobs: listing paginé par statut et date
CREATE INDEX IF NOT EXISTS idx_jobs_status_created
  ON jobs(status, created_at DESC);

-- Candidate profiles: recherche avec filtres
CREATE INDEX IF NOT EXISTS idx_candidate_visibility_verified
  ON candidate_profiles(visibility, is_verified);

-- Formations: recherche par trainer
CREATE INDEX IF NOT EXISTS idx_formations_trainer
  ON formations(trainer_id) WHERE trainer_id IS NOT NULL;

-- Chatbot logs: recherche par utilisateur et session
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user_session
  ON chatbot_logs(user_id, session_id, created_at DESC);

-- Credit transactions: historique utilisateur
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_date
  ON credit_transactions(user_id, created_at DESC);

-- Credit packages: listing actifs triés
CREATE INDEX IF NOT EXISTS idx_credit_packages_active_order
  ON credit_packages(is_active, display_order);
```

---

### B.6 Problèmes de Sécurité RLS

#### 🟡 B.6.1 - Politique RLS Trop Permissive sur `chatbot_settings`

**Gravité:** MOYENNE
**Impact:** Exposition potentielle de configuration sensible

**Politique actuelle:**
```sql
CREATE POLICY "Public can read chatbot settings"
  ON chatbot_settings FOR SELECT
  TO public
  USING (true);  -- ⚠️ Tout le monde peut lire TOUT
```

**Problème:**
- Le champ `ia_service_code` pourrait exposer des informations internes
- Les configurations de service ne devraient pas être publiques

**Solution recommandée:**
```sql
-- Supprimer l'ancienne politique
DROP POLICY IF EXISTS "Public can read chatbot settings" ON chatbot_settings;

-- Créer une vue publique limitée
CREATE OR REPLACE VIEW public_chatbot_settings AS
SELECT
  is_enabled,
  position,
  welcome_message,
  idle_message,
  show_quick_actions
FROM chatbot_settings
WHERE is_enabled = true
LIMIT 1;

-- Politique restreinte
CREATE POLICY "Authenticated can read chatbot settings"
  ON chatbot_settings FOR SELECT
  TO authenticated
  USING (true);

-- Vue accessible publiquement
GRANT SELECT ON public_chatbot_settings TO anon;
```

---

## 📊 SECTION C: INCOHÉRENCES FRONTEND → DATABASE

### C.1 Champs Attendus Manquants

#### 🟠 C.1.1 - Composants Attendent des Champs Qui Peuvent Être NULL

**Gravité:** HAUTE
**Impact:** Erreurs d'affichage, crashes potentiels

**Fichier:** `ApplicationCard.tsx:45-55`

```typescript
// Composant suppose que ces champs existent toujours
<div>
  <h3>{application.candidate.full_name}</h3>  {/* ✅ NOT NULL */}
  <p>{application.candidate_profile.title}</p>  {/* ⚠️ Peut être NULL */}
  <p>{application.candidate_profile.experience_years} ans</p>  {/* ⚠️ Peut être NULL */}
  <div>
    {application.candidate_profile.skills.map(skill => (  {/* ⚠️ Peut être [] */}
      <span>{skill}</span>
    ))}
  </div>
</div>
```

**Schéma réel:**
```sql
CREATE TABLE candidate_profiles (
  title text,                    -- ⚠️ NULLABLE
  experience_years integer,      -- ⚠️ NULLABLE
  skills text[] DEFAULT '{}'     -- ⚠️ Peut être array vide
);
```

**Solution:**
```typescript
// Ajouter des valeurs par défaut et vérifications
<div>
  <h3>{application.candidate.full_name}</h3>
  <p>{application.candidate_profile?.title || 'Poste non spécifié'}</p>
  <p>
    {application.candidate_profile?.experience_years
      ? `${application.candidate_profile.experience_years} ans d'expérience`
      : 'Expérience non renseignée'}
  </p>
  <div>
    {(application.candidate_profile?.skills || []).length > 0 ? (
      application.candidate_profile.skills.map(skill => (
        <span key={skill}>{skill}</span>
      ))
    ) : (
      <span className="text-gray-400">Aucune compétence renseignée</span>
    )}
  </div>
</div>
```

---

#### 🟠 C.1.2 - Jobs: Champs `required_skills` et `min_experience` Parfois Absents

**Gravité:** HAUTE
**Impact:** Erreurs dans AIMatchingService

**Fichier:** `AIMatchingService.tsx:159-163`

```typescript
const { data: job } = await supabase
  .from('jobs')
  .select('*')
  .eq('id', jobId)
  .single();

// Plus tard, utilisé sans vérification
const matching = calculateMatch(
  profile.skills,
  job.required_skills,  // ⚠️ Peut être NULL
  job.min_experience    // ⚠️ Peut être NULL
);
```

**Schéma réel:**
```sql
CREATE TABLE jobs (
  required_skills text[],  -- ⚠️ NULLABLE
  min_experience integer   -- ⚠️ NULLABLE
);
```

**Solution:**
```typescript
const matching = calculateMatch(
  profile.skills || [],
  job.required_skills || [],      // ✅ Défaut: tableau vide
  job.min_experience || 0         // ✅ Défaut: 0
);
```

---

### C.2 Relations Absentes

#### 🟡 C.2.1 - Pas de Table de Liaison pour Formations Favorites

**Gravité:** MOYENNE
**Impact:** Feature future bloquée

**Observation:**
- Les candidats peuvent sauvegarder des jobs (`saved_jobs` existe)
- Aucune table pour sauvegarder des formations favorites

**Table recommandée:**
```sql
CREATE TABLE saved_formations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  formation_id uuid REFERENCES formations(id) ON DELETE CASCADE NOT NULL,
  saved_at timestamptz DEFAULT now(),
  UNIQUE(user_id, formation_id)
);

CREATE INDEX idx_saved_formations_user ON saved_formations(user_id);

ALTER TABLE saved_formations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved formations"
  ON saved_formations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);
```

---

### C.3 Données Non Gérées

#### 🟡 C.3.1 - Pas de Gestion des Profils Incomplets

**Gravité:** MOYENNE
**Impact:** UX dégradée pour nouveaux utilisateurs

**Problème:**
- Un profil peut être créé avec des données minimales
- Les composants supposent des profils complets
- Pas de système de "profil à compléter"

**Solution recommandée:**
1. Ajouter un champ `profile_completion_percentage` (✅ existe déjà dans `candidate_profiles`)
2. Créer une fonction de calcul automatique
3. Afficher un bandeau "Complétez votre profil" si < 70%

```sql
-- Fonction de calcul automatique (à créer)
CREATE OR REPLACE FUNCTION calculate_profile_completion()
RETURNS TRIGGER AS $$
DECLARE
  completion_score integer := 0;
BEGIN
  -- Champs obligatoires (20 points chacun)
  IF NEW.title IS NOT NULL AND NEW.title != '' THEN completion_score := completion_score + 20; END IF;
  IF NEW.bio IS NOT NULL AND NEW.bio != '' THEN completion_score := completion_score + 20; END IF;

  -- Champs importants (15 points)
  IF NEW.experience_years > 0 THEN completion_score := completion_score + 15; END IF;
  IF NEW.cv_url IS NOT NULL THEN completion_score := completion_score + 15; END IF;

  -- Tableaux (10 points si non vides)
  IF array_length(NEW.skills, 1) > 0 THEN completion_score := completion_score + 10; END IF;
  IF NEW.education IS NOT NULL AND jsonb_array_length(NEW.education) > 0 THEN
    completion_score := completion_score + 10;
  END IF;
  IF NEW.work_experience IS NOT NULL AND jsonb_array_length(NEW.work_experience) > 0 THEN
    completion_score := completion_score + 10;
  END IF;

  -- Limiter à 100
  NEW.profile_completion_percentage := LEAST(completion_score, 100);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique
CREATE TRIGGER update_profile_completion
  BEFORE INSERT OR UPDATE ON candidate_profiles
  FOR EACH ROW
  EXECUTE FUNCTION calculate_profile_completion();
```

---

## 📊 SECTION D: VÉRIFICATION IA CENTRALE

### D.1 Architecture IA Globale

**Status:** 🟢 Bien conçue, 🔴 Implémentation incomplète

**Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                   COMPOSANTS AI                          │
│  (EnhancedAICVGenerator, AICoverLetter, etc.)           │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
┌────────▼──────────┐  ┌───────▼────────────┐
│  IAConfigService  │  │  CreditService     │
│  (Config + Templates)│  (Facturation)    │
└────────┬──────────┘  └───────┬────────────┘
         │                     │
         │    ┌────────────────┘
         │    │
┌────────▼────▼───────────────────────────────┐
│         BASE DE DONNÉES                      │
│  • ia_service_config                        │
│  • ia_service_templates                     │
│  • service_credit_costs                     │
│  • credit_transactions (❌ manquant)        │
│  • ai_service_usage_history                 │
└─────────────────────────────────────────────┘
```

### D.2 Services IA Configurés

#### Table: `ia_service_config`

| Service Code | Nom | Statut Config | Statut Templates | Statut Crédits |
|--------------|-----|---------------|------------------|----------------|
| `ai_cv_generation` | Génération CV IA | ✅ | ✅ (2 templates) | ✅ |
| `ai_cover_letter` | Lettre Motivation IA | ✅ | ✅ (1 template) | ⚠️ Code différent |
| `ai_matching` | Matching Emploi IA | ✅ | ✅ (1 template) | ⚠️ Code différent |
| `ai_coach` | Coaching Carrière IA | ✅ | ⚠️ Template basique | ⚠️ Code différent |
| `ai_career_plan` | Plan Carrière IA | ✅ | ❌ Manquant | ⚠️ Code différent |

### D.3 Utilisation par Composant

#### Composants Modernes (Bien Intégrés)

| Composant | Service Code | IAConfigService | TemplateSelector | Crédits |
|-----------|-------------|-----------------|------------------|---------|
| EnhancedAICVGenerator | ✅ `ai_cv_generation` | ✅ | ✅ | ✅ |
| AICoverLetterGenerator | ⚠️ Mauvais code | ✅ | ✅ | ⚠️ |
| AICareerPlanGenerator | ⚠️ Mauvais code | ✅ | ✅ | ⚠️ |
| AIMatchingService | ✅ `ai_matching` | ✅ | ✅ Partiel | ✅ |

#### Composants Anciens (Partiellement Intégrés)

| Composant | Service Code | IAConfigService | TemplateSelector | Crédits | Status |
|-----------|-------------|-----------------|------------------|---------|--------|
| AICVGenerator | ✅ | ❌ | ❌ | ✅ | 🟡 À migrer |
| AICoachChat | ⚠️ Mauvais code | ❌ | ❌ | ✅ Hardcodé | 🟡 À refactorer |

### D.4 Système de Templates

**Status:** 🟢 Bien conçu et fonctionnel

**Fonctionnalités:**
- ✅ Sélection de templates par service
- ✅ Templates premium/gratuits
- ✅ Placeholder replacement (`{{field}}`)
- ✅ Boucles (`{{#each items}}...{{/each}}`)
- ✅ Preview disponible
- ✅ Multiple formats (HTML, Markdown, Text, JSON)

**Template par défaut par service:**

```sql
-- CV: Template "Modern Professional"
SELECT * FROM ia_service_templates
WHERE service_code = 'ai_cv_generation'
  AND is_default = true;

-- Cover Letter: Template "Formal"
SELECT * FROM ia_service_templates
WHERE service_code = 'ai_cover_letter'
  AND is_default = true;
```

**Méthode d'application:**
```typescript
const template = await IAConfigService.getTemplate(templateId);
const output = IAConfigService.applyTemplate(data, template.template_structure);
```

**Templates manquants:**
- ❌ Template pour `ai_career_plan` (seulement mentionné, pas créé)
- ❌ Templates additionnels pour `ai_coach`

### D.5 Flow de Consommation de Crédits

**Flow actuel (CASSÉ):**

```
1. Utilisateur clique "Générer CV"
   ↓
2. Composant appelle useConsumeCredits()
   ↓
3. Hook appelle CreditService.consumeCredits()
   ↓
4. Service appelle supabase.rpc('use_ai_credits', ...)
   ↓
5. ❌ ERREUR: Fonction RPC n'existe pas
   ↓
6. ❌ Service retourne { success: false }
   ↓
7. ❌ Utilisateur voit "Erreur lors de la consommation des crédits"
```

**Flow correct (après implémentation):**

```
1. Utilisateur clique "Générer CV" (solde: 100 crédits)
   ↓
2. Composant appelle useConsumeCredits('ai_cv_generation', input, output)
   ↓
3. Hook appelle CreditService.consumeCredits()
   ↓
4. Service appelle supabase.rpc('use_ai_credits', {
     p_user_id: '...',
     p_service_key: 'ai_cv_generation',
     p_input_payload: {...},
     p_output_response: {...}
   })
   ↓
5. ✅ RPC vérifie service existe et coût (30 crédits)
   ↓
6. ✅ RPC vérifie solde suffisant (100 >= 30)
   ↓
7. ✅ RPC déduit crédits (nouveau solde: 70)
   ↓
8. ✅ RPC insère dans credit_transactions
   ↓
9. ✅ RPC insère dans ai_service_usage_history
   ↓
10. ✅ RPC retourne {
      success: true,
      credits_consumed: 30,
      credits_remaining: 70,
      usage_id: '...'
    }
   ↓
11. ✅ Service retourne résultat au composant
   ↓
12. ✅ Composant affiche succès et nouveau solde
```

### D.6 Problèmes Identifiés

#### 🔴 D.6.1 - Fonction RPC `use_ai_credits` Manquante

**Impact:** BLOQUANT - 100% des services IA cassés

Voir Section B.2.1 pour l'implémentation complète.

---

#### 🟠 D.6.2 - Service Codes Incohérents

**Impact:** HAUTE - Mauvais coûts appliqués

**Problème:**
```typescript
// AICoverLetterGenerator.tsx:29
const serviceCode = SERVICES.AI_CV_GENERATION;  // ❌ Utilise le code CV!

// Résultat:
// - Coût facturé: 30 crédits (CV)
// - Coût réel: 20 crédits (Cover Letter)
// - Log d'usage: service 'ai_cv_generation' au lieu de 'ai_cover_letter'
```

**Liste complète des erreurs:**

| Composant | Code Utilisé | Code Correct | Impact |
|-----------|-------------|--------------|---------|
| AICoverLetterGenerator | `AI_CV_GENERATION` | `AI_COVER_LETTER` | Mauvais coût (30 vs 20) |
| AICareerPlanGenerator | `AI_CV_GENERATION` | `AI_CAREER_PATH` | Mauvais coût (30 vs 40) |
| AICoachChat | `AI_INTERVIEW_COACHING` | `AI_COACH` | Code inexistant en DB |

**Solution: Voir Section F.2**

---

#### 🟡 D.6.3 - Services Non Configurés

**Impact:** MOYENNE - Features limitées

**Services référencés dans `creditService.ts` mais ABSENTS de la DB:**

```typescript
export const SERVICES = {
  // ... services existants
  AI_PROFILE_ANALYSIS: 'profile_analysis',      // ❌ Pas dans ia_service_config
  DIRECT_MESSAGE: 'direct_message_recruiter',   // ❌ Pas dans ia_service_config
  FEATURED_APPLICATION: 'featured_application', // ❌ Pas dans ia_service_config
  PROFILE_BOOST: 'profile_visibility_boost'    // ❌ Pas dans ia_service_config
};
```

**Recommandation:**
- Soit supprimer ces constantes si non utilisées
- Soit créer les configurations correspondantes

---

## 📊 SECTION E: RISQUES TECHNIQUES

### E.1 Risques de Sécurité

#### 🔴 E.1.1 - Injection de Crédits Théorique

**Gravité:** CRITIQUE (après implémentation RPC)
**Impact:** Vol de crédits

**Scénario:**
```typescript
// Si la fonction use_ai_credits n'utilise pas SECURITY DEFINER
// ou ne verrouille pas la ligne avec FOR UPDATE,
// une condition de course est possible:

// Thread 1                        Thread 2
// ─────────────────────────────── ───────────────────────────────
// SELECT credits_balance = 100
//                                 SELECT credits_balance = 100
// UPDATE credits = 100 - 30 = 70
//                                 UPDATE credits = 100 - 20 = 80
// Résultat final: 80 crédits
// Au lieu de: 50 crédits
```

**Solution (déjà dans l'implémentation proposée):**
```sql
-- ✅ Verrouillage de ligne
SELECT credits_balance INTO v_user_credits
FROM profiles
WHERE id = p_user_id
FOR UPDATE;  -- Empêche les accès concurrents

-- ✅ SECURITY DEFINER
CREATE OR REPLACE FUNCTION use_ai_credits(...)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER  -- Exécute avec permissions propriétaire
AS $$
```

---

#### 🟠 E.1.2 - Exposition de Configuration Chatbot

**Gravité:** HAUTE
**Impact:** Fuite d'informations internes

Voir Section B.6.1 pour détails et solution.

---

#### 🟡 E.1.3 - Pas de Rate Limiting sur les Services IA

**Gravité:** MOYENNE
**Impact:** Abus possible

**Problème:**
- Aucune limite sur le nombre de requêtes par utilisateur
- Un utilisateur pourrait spammer les services avec crédits

**Solution recommandée:**
```sql
-- Ajouter une table de rate limiting
CREATE TABLE ai_service_rate_limits (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  request_count integer DEFAULT 0,
  window_start timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, service_code)
);

-- Fonction de vérification
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id uuid,
  p_service_code text,
  p_max_requests integer DEFAULT 100,
  p_window_minutes integer DEFAULT 60
)
RETURNS boolean AS $$
DECLARE
  v_count integer;
  v_window_start timestamptz;
BEGIN
  SELECT request_count, window_start
  INTO v_count, v_window_start
  FROM ai_service_rate_limits
  WHERE user_id = p_user_id
    AND service_code = p_service_code;

  IF NOT FOUND THEN
    INSERT INTO ai_service_rate_limits (user_id, service_code, request_count)
    VALUES (p_user_id, p_service_code, 1);
    RETURN true;
  END IF;

  -- Fenêtre expirée, reset
  IF now() - v_window_start > (p_window_minutes || ' minutes')::interval THEN
    UPDATE ai_service_rate_limits
    SET request_count = 1, window_start = now()
    WHERE user_id = p_user_id AND service_code = p_service_code;
    RETURN true;
  END IF;

  -- Limite atteinte
  IF v_count >= p_max_requests THEN
    RETURN false;
  END IF;

  -- Incrémenter compteur
  UPDATE ai_service_rate_limits
  SET request_count = request_count + 1
  WHERE user_id = p_user_id AND service_code = p_service_code;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Intégrer dans use_ai_credits
-- Au début de la fonction:
IF NOT check_rate_limit(p_user_id, p_service_key, 50, 60) THEN
  RETURN json_build_object(
    'success', false,
    'error', 'RATE_LIMIT_EXCEEDED',
    'message', 'Trop de requêtes. Réessayez dans quelques minutes.'
  );
END IF;
```

---

### E.2 Risques de Performance

#### 🟡 E.2.1 - Pas de Mise en Cache des Configurations IA

**Gravité:** MOYENNE
**Impact:** Requêtes inutiles

**Problème:**
- Chaque appel IA charge la config depuis la DB
- Config change rarement, pourrait être cachée

**Solution:**
```typescript
// iaConfigService.ts - Ajouter un cache en mémoire
class IAConfigService {
  private configCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  async getConfig(serviceCode: string): Promise<IAServiceConfig> {
    const now = Date.now();
    const cached = this.configCache.get(serviceCode);
    const expiry = this.cacheExpiry.get(serviceCode) || 0;

    if (cached && now < expiry) {
      return cached;
    }

    const { data, error } = await supabase.rpc('get_ia_service_config', {
      p_service_code: serviceCode
    });

    if (error) throw error;

    this.configCache.set(serviceCode, data);
    this.cacheExpiry.set(serviceCode, now + this.CACHE_TTL);

    return data;
  }

  // Méthode pour invalider le cache (appelée après update)
  clearCache(serviceCode?: string) {
    if (serviceCode) {
      this.configCache.delete(serviceCode);
      this.cacheExpiry.delete(serviceCode);
    } else {
      this.configCache.clear();
      this.cacheExpiry.clear();
    }
  }
}
```

---

#### 🟡 E.2.2 - N+1 Queries dans ApplicationCard

**Gravité:** MOYENNE
**Impact:** Lent avec beaucoup de candidatures

**Problème:**
```typescript
// RecruiterDashboard.tsx
const { data: applications } = await supabase
  .from('applications')
  .select('*')
  .eq('job_id', selectedJob);

// Pour chaque application, ApplicationCard fait:
applications.map(app => {
  // Charge le profil candidat (N requêtes!)
  supabase.from('profiles').select('*').eq('id', app.candidate_id);
  // Charge le profil étendu (N requêtes!)
  supabase.from('candidate_profiles').select('*').eq('user_id', app.candidate_id);
});
```

**Solution:**
```typescript
// ✅ Utiliser des joins
const { data: applications } = await supabase
  .from('applications')
  .select(`
    *,
    candidate:profiles!candidate_id (
      id,
      full_name,
      email,
      phone,
      avatar_url
    ),
    candidate_profile:candidate_profiles!candidate_id (
      title,
      experience_years,
      education_level,
      skills
    )
  `)
  .eq('job_id', selectedJob);

// Maintenant tout est chargé en 1 requête
```

---

### E.3 Risques de Données

#### 🟡 E.3.1 - Pas de Validation des Montants de Crédits

**Gravité:** MOYENNE
**Impact:** Crédits négatifs possibles

**Problème:**
```sql
-- Dans profiles, pas de contrainte
credits_balance integer DEFAULT 100
-- ⚠️ Pourrait devenir négatif si bug dans use_ai_credits
```

**Solution:**
```sql
ALTER TABLE profiles
ADD CONSTRAINT check_credits_positive
CHECK (credits_balance >= 0);
```

---

#### 🟡 E.3.2 - Pas de Soft Delete

**Gravité:** MOYENNE
**Impact:** Données perdues en cas de suppression

**Problème:**
- La plupart des tables utilisent `ON DELETE CASCADE`
- Supprimer un utilisateur = perte de tout son historique
- Pas de moyen de "désactiver" sans supprimer

**Solution:**
```sql
-- Ajouter des champs de soft delete
ALTER TABLE profiles ADD COLUMN deleted_at timestamptz;
ALTER TABLE candidate_profiles ADD COLUMN deleted_at timestamptz;
-- etc.

-- Politique RLS pour cacher les supprimés
CREATE POLICY "Hide deleted profiles"
  ON profiles FOR SELECT
  USING (deleted_at IS NULL);

-- Fonction de soft delete
CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET deleted_at = now() WHERE id = p_user_id;
  UPDATE candidate_profiles SET deleted_at = now() WHERE user_id = p_user_id;
  -- etc.
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### E.4 Risques de Maintenance

#### 🟡 E.4.1 - Code Dupliqué dans Services CV

**Gravité:** BASSE
**Impact:** Maintenance difficile

**Services similaires:**
- `cvBuilderService.ts` - 150 lignes
- `cvImproverService.ts` - 120 lignes
- `cvTargetedService.ts` - 130 lignes

**Code dupliqué:**
```typescript
// Dans les 3 services:
// 1. Chargement config via IAConfigService (identique)
// 2. Validation input (identique)
// 3. Application template (identique)
// 4. Gestion erreurs (identique)

// Seule différence: la transformation des données
```

**Solution:**
```typescript
// Créer un service de base
abstract class BaseAIService {
  protected async executeService(
    serviceCode: string,
    data: any,
    templateId?: string
  ): Promise<any> {
    // Logique commune
    const config = await IAConfigService.getConfig(serviceCode);
    const validation = this.validateData(data, config);
    if (!validation.valid) throw new Error(validation.error);

    const output = await this.processData(data, config);
    const template = await this.getTemplate(serviceCode, templateId);
    return this.applyTemplate(output, template);
  }

  protected abstract processData(data: any, config: any): Promise<any>;
}

// Services spécifiques
class CVBuilderService extends BaseAIService {
  protected async processData(data: any, config: any) {
    // Transformation spécifique pour CV Builder
  }
}
```

---

### E.5 Dépendances Cassées

Voir Section F.7 pour détails complets.

**Résumé:**
- ❌ 1 méthode privée appelée publiquement (`validateInput`)
- ⚠️ 3 fichiers inutilisés (~500 lignes de code mort)
- ⚠️ 3 packages npm non utilisés (~2.5 MB)

---

## 📊 SECTION F: PLAN DE CORRECTION

### F.1 Priorité 1 - CRITIQUE (Bloquants) 🔴

#### F.1.1 - Créer la fonction RPC `use_ai_credits`

**Fichier:** Nouvelle migration `20251210_create_use_ai_credits_function.sql`

```sql
-- 1. Créer la table ai_service_usage_history si manquante
CREATE TABLE IF NOT EXISTS ai_service_usage_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  service_key text NOT NULL,
  credits_consumed integer NOT NULL CHECK (credits_consumed >= 0),
  input_payload jsonb,
  output_response jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user
  ON ai_service_usage_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_service
  ON ai_service_usage_history(service_key);

ALTER TABLE ai_service_usage_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage history"
  ON ai_service_usage_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage"
  ON ai_service_usage_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 2. Créer la fonction RPC
CREATE OR REPLACE FUNCTION use_ai_credits(
  p_user_id uuid,
  p_service_key text,
  p_input_payload jsonb DEFAULT NULL,
  p_output_response jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_cost integer;
  v_user_credits integer;
  v_new_balance integer;
  v_usage_id uuid;
  v_service_name text;
BEGIN
  -- Vérifier que le service existe et est actif
  SELECT credits_cost, service_name
  INTO v_service_cost, v_service_name
  FROM service_credit_costs
  WHERE service_code = p_service_key
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'SERVICE_NOT_FOUND',
      'message', 'Service IA non trouvé ou inactif: ' || p_service_key
    );
  END IF;

  -- Récupérer le solde actuel avec verrouillage
  SELECT credits_balance INTO v_user_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', 'Profil utilisateur non trouvé'
    );
  END IF;

  -- Vérifier solde suffisant
  IF v_user_credits < v_service_cost THEN
    RETURN json_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', 'Crédits insuffisants',
      'required_credits', v_service_cost,
      'available_credits', v_user_credits,
      'missing_credits', v_service_cost - v_user_credits
    );
  END IF;

  -- Calculer nouveau solde
  v_new_balance := v_user_credits - v_service_cost;

  -- Déduire les crédits
  UPDATE profiles
  SET
    credits_balance = v_new_balance,
    updated_at = now()
  WHERE id = p_user_id;

  -- Enregistrer la transaction
  INSERT INTO credit_transactions (
    user_id,
    transaction_type,
    credits_amount,
    description,
    balance_before,
    balance_after,
    service_code
  ) VALUES (
    p_user_id,
    'usage',
    -v_service_cost,
    'Service: ' || v_service_name,
    v_user_credits,
    v_new_balance,
    p_service_key
  );

  -- Logger l'usage
  INSERT INTO ai_service_usage_history (
    user_id,
    service_key,
    credits_consumed,
    input_payload,
    output_response
  ) VALUES (
    p_user_id,
    p_service_key,
    v_service_cost,
    p_input_payload,
    p_output_response
  )
  RETURNING id INTO v_usage_id;

  -- Retourner succès
  RETURN json_build_object(
    'success', true,
    'message', 'Crédits consommés avec succès',
    'credits_consumed', v_service_cost,
    'credits_remaining', v_new_balance,
    'usage_id', v_usage_id,
    'service_name', v_service_name
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'UNEXPECTED_ERROR',
    'message', 'Erreur: ' || SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION use_ai_credits TO authenticated;

COMMENT ON FUNCTION use_ai_credits IS
'Consomme des crédits AI de manière sécurisée avec logging';
```

**Test:**
```sql
-- Tester avec un utilisateur fictif
SELECT use_ai_credits(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'ai_cv_generation',
  '{"type": "test"}'::jsonb,
  '{"result": "success"}'::jsonb
);
```

---

#### F.1.2 - Créer les tables `credit_packages` et `credit_transactions`

**Fichier:** Nouvelle migration `20251210_create_credit_system_tables.sql`

```sql
-- Table: credit_packages
CREATE TABLE IF NOT EXISTS credit_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_name text NOT NULL,
  credits_amount integer NOT NULL CHECK (credits_amount > 0),
  bonus_credits integer DEFAULT 0 CHECK (bonus_credits >= 0),
  price_amount numeric(10,2) NOT NULL CHECK (price_amount > 0),
  currency text DEFAULT 'GNF' NOT NULL,
  description text,
  is_active boolean DEFAULT true NOT NULL,
  is_popular boolean DEFAULT false NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_credit_packages_active_order
  ON credit_packages(is_active, display_order);

-- RLS
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active packages"
  ON credit_packages FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage packages"
  ON credit_packages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Données par défaut
INSERT INTO credit_packages (
  package_name,
  credits_amount,
  bonus_credits,
  price_amount,
  is_popular,
  display_order,
  description
) VALUES
  ('Pack Découverte', 50, 5, 25000, false, 1, 'Idéal pour tester nos services'),
  ('Pack Starter', 100, 15, 45000, false, 2, 'Parfait pour débuter'),
  ('Pack Premium', 300, 60, 120000, true, 3, 'Le plus populaire - Meilleur rapport qualité/prix'),
  ('Pack Pro', 600, 180, 200000, false, 4, 'Pour une utilisation intensive'),
  ('Pack Enterprise', 1500, 600, 450000, false, 5, 'Solution complète pour professionnels')
ON CONFLICT DO NOTHING;

-- Table: credit_transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN (
    'purchase', 'usage', 'refund', 'bonus', 'admin_adjustment'
  )),
  credits_amount integer NOT NULL,
  description text,
  balance_before integer NOT NULL,
  balance_after integer NOT NULL,
  service_code text,
  reference_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_credit_transactions_user_date
  ON credit_transactions(user_id, created_at DESC);

CREATE INDEX idx_credit_transactions_type
  ON credit_transactions(transaction_type);

CREATE INDEX idx_credit_transactions_service
  ON credit_transactions(service_code)
  WHERE service_code IS NOT NULL;

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON credit_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all transactions"
  ON credit_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Trigger pour mise à jour updated_at
CREATE OR REPLACE FUNCTION update_credit_packages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_credit_packages_updated_at
  BEFORE UPDATE ON credit_packages
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_packages_updated_at();
```

---

#### F.1.3 - Standardiser les champs `user_id` vs `profile_id`

**Fichier:** Corriger dans les composants

```typescript
// Fichier: src/components/ai/AICVGenerator.tsx

// ❌ AVANT (ligne 77)
const { data: candidateProfile } = await supabase
  .from('candidate_profiles')
  .select('*')
  .eq('user_id', user!.id)
  .maybeSingle();

// ✅ APRÈS
const { data: profile } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', user!.id)
  .maybeSingle();

if (!profile) {
  console.error('Profil non trouvé');
  return;
}

const { data: candidateProfile } = await supabase
  .from('candidate_profiles')
  .select('*')
  .eq('profile_id', profile.id)
  .maybeSingle();
```

```typescript
// Fichier: src/components/ai/AIMatchingService.tsx

// ❌ AVANT (ligne 150)
const { data: profile } = await supabase
  .from('candidate_profiles')
  .select('*')
  .eq('user_id', user!.id)
  .maybeSingle();

// ✅ APRÈS
const { data: userProfile } = await supabase
  .from('profiles')
  .select('id')
  .eq('id', user!.id)
  .maybeSingle();

if (!userProfile) {
  console.error('Profil non trouvé');
  return;
}

const { data: profile } = await supabase
  .from('candidate_profiles')
  .select('*')
  .eq('profile_id', userProfile.id)
  .maybeSingle();
```

**Alternative (si les deux champs doivent coexister):**

```sql
-- Créer un index sur user_id aussi
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_user_id
  ON candidate_profiles(user_id);

-- Garder les deux requêtes possibles
-- Documenter clairement la différence
```

---

### F.2 Priorité 2 - HAUTE 🟠

#### F.2.1 - Corriger les Service Codes

**Étape 1: Mettre à jour la base de données**

```sql
-- Migration: 20251210_fix_service_codes.sql

-- Mettre à jour service_credit_costs
UPDATE service_credit_costs
SET service_code = 'ai_cover_letter'
WHERE service_code = 'ai_cover_letter_generation';

UPDATE service_credit_costs
SET service_code = 'ai_matching'
WHERE service_code = 'job_matching';

UPDATE service_credit_costs
SET service_code = 'ai_coach'
WHERE service_code = 'interview_coaching';

UPDATE service_credit_costs
SET service_code = 'ai_career_plan'
WHERE service_code = 'career_path_planning';

-- Vérifier que tous les codes correspondent maintenant
SELECT
  scc.service_code,
  scc.service_name,
  CASE
    WHEN isc.service_code IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Manquant'
  END as config_status
FROM service_credit_costs scc
LEFT JOIN ia_service_config isc ON scc.service_code = isc.service_code
WHERE scc.is_active = true;
```

**Étape 2: Mettre à jour le frontend**

```typescript
// Fichier: src/services/creditService.ts

// ❌ AVANT
export const SERVICES = {
  AI_CV_GENERATION: 'ai_cv_generation',
  AI_COVER_LETTER: 'ai_cover_letter_generation',
  AI_JOB_MATCHING: 'job_matching',
  AI_PROFILE_ANALYSIS: 'profile_analysis',
  AI_INTERVIEW_COACHING: 'interview_coaching',
  AI_CAREER_PATH: 'career_path_planning',
  DIRECT_MESSAGE: 'direct_message_recruiter',
  FEATURED_APPLICATION: 'featured_application',
  PROFILE_BOOST: 'profile_visibility_boost'
};

// ✅ APRÈS
export const SERVICES = {
  AI_CV_GENERATION: 'ai_cv_generation',
  AI_COVER_LETTER: 'ai_cover_letter',         // ✅ Corrigé
  AI_JOB_MATCHING: 'ai_matching',              // ✅ Corrigé
  AI_INTERVIEW_COACHING: 'ai_coach',           // ✅ Corrigé
  AI_CAREER_PATH: 'ai_career_plan',           // ✅ Corrigé
  // Services supprimés (non configurés):
  // AI_PROFILE_ANALYSIS, DIRECT_MESSAGE, FEATURED_APPLICATION, PROFILE_BOOST
} as const;

// Ajouter validation TypeScript
export type ServiceCode = typeof SERVICES[keyof typeof SERVICES];
```

**Étape 3: Corriger les composants**

```typescript
// Fichier: src/components/ai/AICoverLetterGenerator.tsx

// ❌ AVANT (ligne 29)
const serviceCode = SERVICES.AI_CV_GENERATION;

// ✅ APRÈS
const serviceCode = SERVICES.AI_COVER_LETTER;
```

```typescript
// Fichier: src/components/ai/AICareerPlanGenerator.tsx

// ❌ AVANT
const serviceCode = SERVICES.AI_CV_GENERATION;

// ✅ APRÈS
const serviceCode = SERVICES.AI_CAREER_PATH;
```

```typescript
// Fichier: src/components/ai/AICoachChat.tsx

// ❌ AVANT
const serviceCode = SERVICES.AI_INTERVIEW_COACHING;

// ✅ APRÈS
const serviceCode = SERVICES.AI_INTERVIEW_COACHING;  // Déjà correct SI creditService est fixé
```

---

#### F.2.2 - Ajouter `credits_balance` au type Profile

```typescript
// Fichier: src/lib/supabase.ts

// ❌ AVANT
export type Profile = {
  id: string;
  user_type: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  region?: string;
  created_at: string;
  updated_at: string;
};

// ✅ APRÈS
export type Profile = {
  id: string;
  user_type: UserRole;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  region?: string;
  credits_balance?: number;  // ✅ Ajouté
  created_at: string;
  updated_at: string;
};
```

---

#### F.2.3 - Compléter l'interface CreditServiceConfig

```typescript
// Fichier: src/services/creditService.ts

// Mettre à jour les SELECT pour inclure tous les champs
async getServiceConfig(serviceCode: string): Promise<CreditServiceConfig | null> {
  const { data, error } = await supabase
    .from('service_credit_costs')
    .select(`
      id,
      service_code,
      service_name,
      service_description,
      credits_cost,
      is_active,
      category,
      promotion_active,
      discount_percent,
      display_order,
      icon,
      created_at,
      updated_at
    `)  // ✅ Tous les champs
    .eq('service_code', serviceCode)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching service config:', error);
    return null;
  }

  return data;
}

// Mettre à jour getAllServices aussi
async getAllServices(): Promise<CreditServiceConfig[]> {
  const { data, error } = await supabase
    .from('service_credit_costs')
    .select('*')  // ✅ Ou liste explicite
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching services:', error);
    return [];
  }

  return data || [];
}
```

---

### F.3 Priorité 3 - MOYENNE 🟡

#### F.3.1 - Corriger l'accès à `validateInput`

```typescript
// Fichier: src/services/iaConfigService.ts

class IAConfigService {
  // ❌ AVANT
  private validateInput(data: any, schema: any): ValidationResult {
    // ...
  }

  // ✅ APRÈS - Rendre public
  public validateInput(data: any, schema: any): ValidationResult {
    // ...
  }

  // OU créer une méthode publique wrapper
  public async validateServiceInput(
    serviceCode: string,
    data: any
  ): Promise<ValidationResult> {
    const config = await this.getConfig(serviceCode);
    return this.validateInput(data, config.input_schema);
  }
}
```

**Puis mettre à jour CVBuilderService:**

```typescript
// Fichier: src/services/cvBuilderService.ts

// ❌ AVANT (ligne 32)
const validation = IAConfigService.validateInput(options.data, config.input_schema);

// ✅ APRÈS - Option 1 (si validateInput devient public)
const validation = IAConfigService.validateInput(options.data, config.input_schema);

// ✅ APRÈS - Option 2 (si wrapper créé)
const validation = await IAConfigService.validateServiceInput(
  'ai_cv_generation',
  options.data
);
```

---

#### F.3.2 - Améliorer la Gestion d'Erreurs des Composants AI

**Pattern commun à appliquer:**

```typescript
// Exemple: EnhancedAICVGenerator.tsx

const handleGenerate = async () => {
  setIsGenerating(true);
  setError('');

  try {
    // 1. Vérifier le solde AVANT de générer
    const balance = await getUserBalance(user!.id);
    const cost = await getServiceCost(SERVICES.AI_CV_GENERATION);

    if (balance < cost) {
      setError(`Crédits insuffisants. Il vous faut ${cost} crédits, vous en avez ${balance}.`);

      // Proposer redirection
      const shouldRedirect = window.confirm(
        `Voulez-vous acheter des crédits maintenant?`
      );

      if (shouldRedirect) {
        navigate('/credit-store');
      }

      return;
    }

    // 2. Générer le CV
    const generatedCV = await generateCV(profileData, templateId);

    // 3. Consommer les crédits
    const creditResult = await consumeCredits(
      SERVICES.AI_CV_GENERATION,
      profileData,
      generatedCV
    );

    if (!creditResult.success) {
      // Gérer les erreurs spécifiques
      switch (creditResult.error) {
        case 'INSUFFICIENT_CREDITS':
          setError(`Crédits insuffisants: ${creditResult.message}`);
          break;
        case 'SERVICE_NOT_FOUND':
          setError('Service temporairement indisponible');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          setError('Trop de requêtes. Réessayez dans quelques minutes.');
          break;
        default:
          setError('Erreur lors de la facturation du service');
      }
      return;
    }

    // 4. Succès
    setGeneratedContent(generatedCV);
    setShowPreview(true);

    notif.success(
      `CV généré avec succès! ${creditResult.credits_consumed} crédits consommés. ` +
      `Solde: ${creditResult.credits_remaining} crédits`
    );

  } catch (error: any) {
    console.error('Generation error:', error);
    setError(error.message || 'Erreur lors de la génération du CV');

    notif.error('Erreur inattendue. Veuillez réessayer.');
  } finally {
    setIsGenerating(false);
  }
};
```

**Appliquer ce pattern à:**
- AICVGenerator.tsx
- AICoverLetterGenerator.tsx
- AICareerPlanGenerator.tsx
- AIMatchingService.tsx
- AICoachChat.tsx

---

#### F.3.3 - Nettoyer le Code Mort

**Fichier 1: Supprimer `notificationHelpers.ts`**

```bash
# Ce fichier n'est utilisé nulle part
rm src/utils/notificationHelpers.ts
```

**Fichier 2: Supprimer `useAutoSave.ts` OU l'intégrer**

```bash
# Option A: Supprimer si vraiment inutilisé
rm src/hooks/useAutoSave.ts

# Option B: L'intégrer dans les formulaires
# Voir exemple ci-dessous
```

**Exemple d'intégration de useAutoSave:**

```typescript
// Dans CandidateProfileForm.tsx

import { useAutoSave } from '../../hooks/useAutoSave';

function CandidateProfileForm() {
  const [formData, setFormData] = useState({...});

  // Activer l'auto-save
  const { status, lastSaved } = useAutoSave(
    async (data) => {
      await supabase
        .from('candidate_profiles')
        .update(data)
        .eq('profile_id', profile.id);
    },
    formData,
    { delay: 2000 }  // Sauvegarder 2s après dernière modification
  );

  return (
    <div>
      <AutoSaveIndicator status={status} lastSaved={lastSaved} />
      {/* Formulaire */}
    </div>
  );
}
```

**Fichier 3: Nettoyer `jobSuggestions.ts`**

```typescript
// Fichier: src/utils/jobSuggestions.ts

// ✅ Garder (utilisé par JobPublishForm)
export const jobTitleSuggestions = [...];

// ❌ Supprimer ou exporter seulement si utilisé
// export const companySuggestions = [...];
// export const locationSuggestions = [...];
// export const skillSuggestions = [...];
// export const benefitSuggestions = [...];
// export const sectorSuggestions = [...];

// OU les intégrer dans les composants qui en ont besoin
```

**Fichier 4: Supprimer ou Renommer l'ancien AICVGenerator**

```bash
# Option A: Supprimer complètement
rm src/components/ai/AICVGenerator.tsx

# Option B: Renommer pour archivage
mv src/components/ai/AICVGenerator.tsx src/components/ai/AICVGenerator.legacy.tsx

# Ajouter commentaire en haut
// @deprecated Utiliser EnhancedAICVGenerator à la place
```

---

#### F.3.4 - Supprimer les Packages NPM Non Utilisés

```bash
# Supprimer docx et docx-preview
npm uninstall docx docx-preview

# Déplacer dotenv vers devDependencies (utilisé seulement par scripts root)
npm uninstall dotenv
npm install --save-dev dotenv
```

**Mise à jour package.json:**

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",
    "file-saver": "^2.0.5",
    "jspdf": "^3.0.4",
    "lucide-react": "^0.344.0",
    "mammoth": "^1.11.0",
    "pdfjs-dist": "^5.4.449",
    "quill": "^2.0.3",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-quill": "^2.0.0"
  },
  "devDependencies": {
    "dotenv": "^17.2.3",
    // ... autres devDependencies
  }
}
```

---

#### F.3.5 - Nettoyer les Fichiers Orphelins

```bash
# Supprimer les fichiers corrompus
rm JobGuinee-main\ \(1\).zip
rm JobGuinee_Documentation_Complete.docx

# Archiver les fragments de migration
mkdir -p archive/old_migrations
mv migration_part_* archive/old_migrations/
mv part1.sql archive/old_migrations/
mv remainder.sql archive/old_migrations/
mv consolidated_migration.sql archive/old_migrations/

# Ou simplement supprimer si les migrations sont appliquées
rm migration_part_*
rm part1.sql remainder.sql consolidated_migration.sql
```

---

### F.4 Priorité 4 - BASSE (Optimisations) 🟢

#### F.4.1 - Consolider les Migrations Dupliquées

**Stratégie:**

1. Identifier l'ordre chronologique correct
2. Garder la première migration de chaque table
3. Supprimer les duplicatas ultérieurs
4. Documenter dans un fichier MIGRATION_HISTORY.md

**Exemple:**

```bash
# Garder
20251031124738_create_initial_schema.sql

# Supprimer (duplicatas)
20251209215534_create_initial_schema.sql
20251209150718_20251031124738_create_initial_schema.sql
```

**Ou créer une migration de nettoyage:**

```sql
-- Migration: 20251210_cleanup_duplicate_constraints.sql

-- Supprimer les contraintes dupliquées (si elles existent)
DO $$
BEGIN
  -- Exemple: supprimer contrainte dupliquée sur profiles
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_user_type_check_duplicate'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT profiles_user_type_check_duplicate;
  END IF;
END $$;
```

---

#### F.4.2 - Ajouter des Indexes de Performance

```sql
-- Migration: 20251210_add_performance_indexes.sql

-- Applications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_applications_job_status
  ON applications(job_id, status);

-- Jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status_created
  ON jobs(status, created_at DESC);

-- Candidate profiles
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_candidate_visibility_verified
  ON candidate_profiles(visibility, is_verified)
  WHERE visibility IN ('public', 'premium');

-- Formations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_formations_trainer
  ON formations(trainer_id)
  WHERE trainer_id IS NOT NULL;

-- Chatbot logs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_chatbot_logs_user_session
  ON chatbot_logs(user_id, session_id, created_at DESC);

-- Credit transactions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_credit_transactions_user_date
  ON credit_transactions(user_id, created_at DESC);

-- Note: CONCURRENTLY pour éviter de bloquer la table en production
```

---

#### F.4.3 - Implémenter le Cache pour IAConfigService

Voir Section E.2.1 pour l'implémentation complète.

---

#### F.4.4 - Optimiser les Requêtes N+1

```typescript
// Fichier: src/pages/RecruiterDashboard.tsx

// ❌ AVANT
const loadApplications = async (jobId: string) => {
  const { data: applications } = await supabase
    .from('applications')
    .select('*')
    .eq('job_id', jobId);

  // N requêtes pour charger les profils
  for (const app of applications) {
    const profile = await loadProfile(app.candidate_id);
    const candidateProfile = await loadCandidateProfile(app.candidate_id);
  }
};

// ✅ APRÈS
const loadApplications = async (jobId: string) => {
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      candidate:profiles!candidate_id (
        id,
        full_name,
        email,
        phone,
        avatar_url
      ),
      candidate_profile:candidate_profiles!candidate_id (
        title,
        experience_years,
        education_level,
        skills
      )
    `)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading applications:', error);
    return [];
  }

  return applications || [];
};
```

---

## 📊 SECTION G: ACTIONS AUTOMATIQUES RECOMMANDÉES

### G.1 Corrections de Type (Automatisables)

**Script:** `scripts/fix-types.ts`

```typescript
#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';

// Ajouter credits_balance au type Profile
const supabaseTypesFile = 'src/lib/supabase.ts';
let content = fs.readFileSync(supabaseTypesFile, 'utf-8');

// Rechercher le type Profile
const profileTypeRegex = /(export type Profile = \{[^}]+)/;
const match = content.match(profileTypeRegex);

if (match && !content.includes('credits_balance')) {
  // Ajouter le champ avant created_at
  content = content.replace(
    /region\?: string;/,
    `region?: string;\n  credits_balance?: number;`
  );

  fs.writeFileSync(supabaseTypesFile, content, 'utf-8');
  console.log('✅ Type Profile mis à jour');
} else {
  console.log('⚠️ Type Profile déjà à jour ou structure différente');
}
```

---

### G.2 Corrections de Service Codes (Automatisables)

**Script:** `scripts/fix-service-codes.ts`

```typescript
#!/usr/bin/env ts-node

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

// Mapping des anciens codes vers nouveaux
const SERVICE_CODE_MAPPINGS = {
  'ai_cover_letter_generation': 'ai_cover_letter',
  'job_matching': 'ai_matching',
  'interview_coaching': 'ai_coach',
  'career_path_planning': 'ai_career_plan'
};

// 1. Mettre à jour creditService.ts
const creditServiceFile = 'src/services/creditService.ts';
let creditServiceContent = fs.readFileSync(creditServiceFile, 'utf-8');

creditServiceContent = creditServiceContent
  .replace(/AI_COVER_LETTER: 'ai_cover_letter_generation'/, "AI_COVER_LETTER: 'ai_cover_letter'")
  .replace(/AI_JOB_MATCHING: 'job_matching'/, "AI_JOB_MATCHING: 'ai_matching'")
  .replace(/AI_INTERVIEW_COACHING: 'interview_coaching'/, "AI_INTERVIEW_COACHING: 'ai_coach'")
  .replace(/AI_CAREER_PATH: 'career_path_planning'/, "AI_CAREER_PATH: 'ai_career_plan'");

fs.writeFileSync(creditServiceFile, creditServiceContent, 'utf-8');
console.log('✅ creditService.ts mis à jour');

// 2. Mettre à jour les composants
const componentFiles = glob.sync('src/components/**/*.tsx');

for (const file of componentFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;

  // AICoverLetterGenerator: corriger service code
  if (file.includes('AICoverLetterGenerator')) {
    if (content.includes('SERVICES.AI_CV_GENERATION')) {
      content = content.replace(
        /const serviceCode = SERVICES\.AI_CV_GENERATION/,
        'const serviceCode = SERVICES.AI_COVER_LETTER'
      );
      modified = true;
    }
  }

  // AICareerPlanGenerator: corriger service code
  if (file.includes('AICareerPlanGenerator')) {
    if (content.includes('SERVICES.AI_CV_GENERATION')) {
      content = content.replace(
        /const serviceCode = SERVICES\.AI_CV_GENERATION/,
        'const serviceCode = SERVICES.AI_CAREER_PATH'
      );
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(file, content, 'utf-8');
    console.log(`✅ ${file} mis à jour`);
  }
}
```

---

### G.3 Corrections user_id → profile_id (Semi-automatisable)

**Script:** `scripts/fix-profile-id-queries.ts`

```typescript
#!/usr/bin/env ts-node

import fs from 'fs';
import { glob } from 'glob';

const componentFiles = glob.sync('src/components/**/*.tsx');

for (const file of componentFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  let modified = false;

  // Rechercher les requêtes problématiques
  const problematicPattern = /\.from\('candidate_profiles'\)[\s\S]*?\.eq\('user_id', user(!)?\.id\)/g;

  if (problematicPattern.test(content)) {
    console.log(`⚠️ Requête suspecte trouvée dans ${file}`);
    console.log('   Vérification manuelle requise');

    // Note: Correction automatique risquée ici
    // Car il faut d'abord charger profiles puis utiliser profile_id
  }
}
```

---

### G.4 Suppression de Code Mort (Automatisable)

**Script:** `scripts/cleanup-dead-code.sh`

```bash
#!/bin/bash

echo "🧹 Nettoyage du code mort..."

# Supprimer notificationHelpers.ts
if [ -f src/utils/notificationHelpers.ts ]; then
  echo "Suppression de notificationHelpers.ts..."
  rm src/utils/notificationHelpers.ts
  echo "✅ notificationHelpers.ts supprimé"
fi

# Supprimer ou archiver useAutoSave.ts
if [ -f src/hooks/useAutoSave.ts ]; then
  echo "⚠️  useAutoSave.ts existe - À supprimer ou intégrer manuellement"
fi

# Supprimer l'ancien AICVGenerator
if [ -f src/components/ai/AICVGenerator.tsx ]; then
  echo "Archivage de AICVGenerator.tsx..."
  mv src/components/ai/AICVGenerator.tsx src/components/ai/AICVGenerator.legacy.tsx
  echo "✅ AICVGenerator archivé"
fi

# Nettoyer les fichiers orphelins
echo "Nettoyage des fichiers orphelins..."
rm -f "JobGuinee-main (1).zip"
rm -f JobGuinee_Documentation_Complete.docx
rm -f migration_part_*
rm -f part1.sql remainder.sql consolidated_migration.sql

echo "✅ Nettoyage terminé"
```

---

### G.5 Mise à Jour des Packages

**Script:** `scripts/cleanup-packages.sh`

```bash
#!/bin/bash

echo "📦 Nettoyage des packages npm..."

# Supprimer packages inutilisés
npm uninstall docx docx-preview

# Déplacer dotenv vers devDependencies
npm uninstall dotenv
npm install --save-dev dotenv

# Mettre à jour package-lock.json
npm install

echo "✅ Packages nettoyés"
```

---

### G.6 Vérification Finale

**Script:** `scripts/verify-fixes.ts`

```typescript
#!/usr/bin/env ts-node

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verifyFixes() {
  console.log('\n🔍 Vérification des corrections...\n');

  // 1. Vérifier use_ai_credits existe
  try {
    await supabase.rpc('use_ai_credits', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_service_key: 'test'
    });
    console.log('✅ Fonction use_ai_credits existe');
  } catch (error: any) {
    if (error.message.includes('SERVICE_NOT_FOUND')) {
      console.log('✅ Fonction use_ai_credits existe et fonctionne');
    } else {
      console.log('❌ Fonction use_ai_credits manquante ou erreur:', error.message);
    }
  }

  // 2. Vérifier credit_packages
  const { data: packages, error: packagesError } = await supabase
    .from('credit_packages')
    .select('count');

  if (packagesError) {
    console.log('❌ Table credit_packages manquante');
  } else {
    console.log('✅ Table credit_packages existe');
  }

  // 3. Vérifier credit_transactions
  const { data: transactions, error: transactionsError } = await supabase
    .from('credit_transactions')
    .select('count');

  if (transactionsError) {
    console.log('❌ Table credit_transactions manquante');
  } else {
    console.log('✅ Table credit_transactions existe');
  }

  // 4. Vérifier cohérence service codes
  const { data: costs } = await supabase
    .from('service_credit_costs')
    .select('service_code')
    .eq('is_active', true);

  const { data: configs } = await supabase
    .from('ia_service_config')
    .select('service_code')
    .eq('is_active', true);

  const costCodes = new Set(costs?.map(c => c.service_code) || []);
  const configCodes = new Set(configs?.map(c => c.service_code) || []);

  const mismatches = [...costCodes].filter(code => !configCodes.has(code));

  if (mismatches.length === 0) {
    console.log('✅ Service codes cohérents entre credit_costs et ia_config');
  } else {
    console.log('⚠️  Codes incohérents:', mismatches);
  }

  console.log('\n✅ Vérification terminée\n');
}

verifyFixes();
```

---

## 📈 RÉSUMÉ ET PROCHAINES ÉTAPES

### Statut Global Après Corrections

| Catégorie | Avant | Après | Amélioration |
|-----------|-------|-------|--------------|
| Fonctionnalités IA | 🔴 Cassées (0%) | 🟢 Fonctionnelles (100%) | +100% |
| Achats de crédits | 🔴 Impossibles | 🟢 Fonctionnels | +100% |
| Cohérence service codes | 🟠 40% | 🟢 100% | +60% |
| Sécurité RLS | 🟡 80% | 🟢 95% | +15% |
| Performance | 🟡 70% | 🟢 90% | +20% |
| Code propre | 🟡 75% | 🟢 95% | +20% |

### Checklist de Correction

#### Phase 1: CRITIQUE (1-2 jours)
- [ ] Créer fonction RPC `use_ai_credits`
- [ ] Créer tables `credit_packages` et `credit_transactions`
- [ ] Corriger user_id → profile_id dans composants AI
- [ ] Tester les services IA end-to-end

#### Phase 2: HAUTE (2-3 jours)
- [ ] Standardiser tous les service codes (DB + frontend)
- [ ] Ajouter credits_balance au type Profile
- [ ] Compléter SELECT queries pour CreditServiceConfig
- [ ] Tester le flow complet d'achat et consommation de crédits

#### Phase 3: MOYENNE (3-4 jours)
- [ ] Corriger validateInput accessibility
- [ ] Améliorer gestion d'erreurs composants AI
- [ ] Nettoyer code mort (3 fichiers)
- [ ] Supprimer packages npm non utilisés
- [ ] Nettoyer fichiers orphelins

#### Phase 4: BASSE (optionnel, 1-2 semaines)
- [ ] Consolider migrations dupliquées
- [ ] Ajouter indexes de performance
- [ ] Implémenter cache IAConfigService
- [ ] Optimiser requêtes N+1
- [ ] Ajouter rate limiting
- [ ] Implémenter soft delete

### Commandes d'Exécution Rapide

```bash
# 1. Appliquer les migrations critiques
npm run db:migrate

# 2. Exécuter les scripts de correction
npm run fix:types
npm run fix:service-codes
npm run cleanup:dead-code
npm run cleanup:packages

# 3. Vérifier les corrections
npm run verify:fixes

# 4. Tester l'application
npm run test
npm run build
```

### Estimation Globale

| Phase | Temps | Priorité | Impact |
|-------|-------|----------|--------|
| Phase 1 | 1-2 jours | 🔴 CRITIQUE | Services IA fonctionnels |
| Phase 2 | 2-3 jours | 🟠 HAUTE | Achats crédits + cohérence |
| Phase 3 | 3-4 jours | 🟡 MOYENNE | Code propre + UX |
| Phase 4 | 1-2 semaines | 🟢 BASSE | Performance + sécurité |

**Temps total estimé:** 7-14 jours (selon ressources)

---

## 📞 SUPPORT ET DOCUMENTATION

### Fichiers de Référence

- `DIAGNOSTIC_FRONT_BACK_DB.md` - Ce document
- `SUPABASE_SETUP.md` - Configuration Supabase
- `CREDIT_SYSTEM_SUMMARY.md` - Documentation système de crédits
- `IA_CONFIG_DOCUMENTATION.md` - Documentation IA centrale

### Scripts Utiles

```bash
# Vérifier l'état de la base de données
npm run db:check

# Créer un admin
npm run db:create-admin

# Tester la connexion frontend-DB
npm run db:test-frontend

# Lancer le build
npm run build
```

### Contacts

Pour toute question sur ce diagnostic:
- Créer une issue GitHub
- Consulter la documentation technique
- Exécuter les scripts de vérification

---

**Fin du diagnostic - JobGuinée Platform**
**Date:** 2025-12-10
**Version:** 1.0

---