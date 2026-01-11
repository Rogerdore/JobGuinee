# DOCUMENTATION SYSTÈME D'AUDIT AUTOMATIQUE

## 📋 VUE D'ENSEMBLE

Le système d'audit automatique `audit-system-complete.js` vérifie la conformité totale du système Wallet + Statistiques + IA aux règles métier et principes fondamentaux de JobGuinée.

**Date de création**: 2026-01-11
**Version**: 1.0
**Auteur**: Système d'audit automatisé

---

## 🎯 OBJECTIF

Réaliser un audit post-déploiement automatique pour vérifier:
1. Structure de données complète et cohérente
2. Logs et traçabilité exhaustifs
3. Conformité aux règles métier
4. Absence de logique métier dans le frontend
5. Configuration correcte du système IA
6. Intégrité du système Wallet

---

## 🚀 UTILISATION

### Lancer l'audit complet
```bash
npm run audit:system
```

### Résultat
- Affichage console avec détails en temps réel
- Rapport JSON sauvegardé: `audit-report.json`
- Code de sortie: 0 (succès ≥80%) ou 1 (échec)

---

## 📊 RÉSULTATS AUDIT ACTUEL

### Score Global: **75%**
Tests réussis: **24/32**

### Détails par Catégorie

| Catégorie | Score | Statut | Tests Réussis |
|-----------|-------|--------|---------------|
| **Logs & Traçabilité** | 100% | ✔ CONFORME | 4/4 |
| **Règles Métier** | 100% | ✔ CONFORME | 6/6 |
| **Wallet** | 100% | ✔ CONFORME | 5/5 |
| **Frontend** | 67% | ❌ NON CONFORME | 2/3 |
| **IA** | 67% | ❌ NON CONFORME | 4/6 |
| **Structure Données** | 38% | ❌ NON CONFORME | 3/8 |

### ✅ Points Forts

#### Logs & Traçabilité (100%)
- ✅ Chaque view a un log correspondant
- ✅ Actions payantes ont wallet_log complet
- ✅ Cohérence balance_before/after
- ✅ Tous les logs ont timestamps

#### Règles Métier (100%)
- ✅ Fonction `increment_profile_view` existe
- ✅ Fonction `track_cv_download` existe
- ✅ Fonction `use_ai_credits` existe
- ✅ Aucune balance négative
- ✅ Scores IA entre 0-100
- ✅ Score IA a toujours version

#### Wallet (100%)
- ✅ Fonction `check_and_deduct_credits` existe
- ✅ Logs wallet ont statut valide
- ✅ Balance wallet = dernier log
- ✅ Réservations ≤ balance
- ✅ RLS wallet activé

#### Frontend (67%)
- ✅ Aucun incrément direct dans frontend
- ✅ Aucun calcul score IA dans frontend

#### IA (67%)
- ✅ Table `ia_service_config` existe
- ✅ Table `ai_service_usage_history` existe
- ✅ Tarifs services IA définis
- ✅ Vues analytics IA existent

### ❌ Écarts Détectés

#### Structure Données (38% - CRITIQUE)

**Problème 1: Table wallet**
```
Erreur: column wallet.created_at does not exist
```
**Impact**: Le script d'audit attend des colonnes spécifiques qui peuvent avoir des noms différents.

**Action**: Vérifier le schéma réel de la table wallet:
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'wallet';
```

**Problème 2: Table candidate_stats**
```
Erreur: column candidate_stats.profile_views does not exist
```
**Impact**: Les statistiques candidats ne sont peut-être pas stockées dans cette table.

**Action**: Vérifier l'existence et le schéma de `candidate_stats`:
```sql
-- Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'candidate_stats'
);

-- Si elle existe, vérifier les colonnes
\d candidate_stats
```

**Problème 3: Table candidate_stats_logs**
```
Erreur: column candidate_stats_logs.old_value does not exist
```
**Impact**: Les logs de changements ne sont peut-être pas dans cette structure.

**Solutions possibles**:
1. La table s'appelle différemment (ex: `profile_stats_history`)
2. La structure des logs est différente
3. Les logs ne sont pas encore implémentés

#### Frontend (67%)

**Problème: RPC manquant**
```
RPC manquants: track_cv_download
```
**Impact**: Le service frontend n'utilise peut-être pas la bonne fonction RPC.

**Action**: Vérifier dans le code:
```bash
grep -r "track_cv_download" src/services/
```

**Solution**: S'assurer que tous les services qui trackent des actions utilisent les RPC backend appropriées.

#### IA (67%)

**Problème 1: Services CVThèque non configurés**
```
Services CVThèque IA configurés: 0/2 services trouvés
```
**Impact**: Les services `cv_profile_scoring` et `cv_semantic_search` ne sont pas dans `ia_service_config`.

**Action**: Vérifier si la migration a été appliquée:
```sql
SELECT service_code, service_name, is_active
FROM ia_service_config
WHERE service_code IN ('cv_profile_scoring', 'cv_semantic_search');
```

**Solution**:
```bash
# Appliquer la migration si nécessaire
supabase migration up
```

**Problème 2: Quotas non configurés**
```
Quotas IA configurés: Aucun trouvé
```
**Impact**: Le système de quotas n'est pas encore actif.

**Action**: Vérifier la table `ia_service_quotas`:
```sql
SELECT COUNT(*) FROM ia_service_quotas;
```

**Solution**: La migration `extend_ia_engine_monitoring_and_quotas` doit être appliquée:
```sql
-- Vérifier si la table existe
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_name = 'ia_service_quotas'
);
```

---

## 🔧 TESTS EFFECTUÉS

### 1️⃣ Structure de Données (8 tests)

```javascript
✅ Test 1.1: Vérifier existence table wallet
✅ Test 1.2: Vérifier existence table wallet_logs
❌ Test 1.3: Vérifier existence table candidate_stats
❌ Test 1.4: Vérifier existence table candidate_stats_logs
❌ Test 1.5: Vérifier colonnes wallet complètes
❌ Test 1.6: Vérifier colonnes candidate_stats complètes
✅ Test 1.7: Vérifier index wallet configurés
✅ Test 1.8: Vérifier absence doublons wallet
```

### 2️⃣ Logs & Traçabilité (4 tests)

```javascript
✅ Test 2.1: Vérifier que chaque view a un log
✅ Test 2.2: Vérifier que chaque action payante a un wallet_log
✅ Test 2.3: Vérifier cohérence balance_before/after
✅ Test 2.4: Vérifier timestamps logs
```

### 3️⃣ Règles Métier (6 tests)

```javascript
✅ Test 3.1: Fonction increment_profile_view existe
✅ Test 3.2: Fonction track_cv_download existe
✅ Test 3.3: Fonction use_ai_credits existe
✅ Test 3.4: Vérifier balance jamais négative
✅ Test 3.5: Vérifier ai_score entre 0 et 100
✅ Test 3.6: Score IA a toujours version
```

### 4️⃣ Frontend (3 tests)

```javascript
✅ Test 4.1: Rechercher incrément direct dans le code
✅ Test 4.2: Vérifier absence calcul score IA frontend
❌ Test 4.3: Vérifier utilisation RPC dans services
```

### 5️⃣ IA (6 tests)

```javascript
✅ Test 5.1: Table ia_service_config existe
❌ Test 5.2: Services CVThèque configurés
✅ Test 5.3: Table ai_service_usage_history existe
✅ Test 5.4: Tarifs services définis
❌ Test 5.5: Quotas configurés
✅ Test 5.6: Vues analytics existent
```

### 6️⃣ Wallet (5 tests)

```javascript
✅ Test 6.1: Fonction check_and_deduct_credits existe
✅ Test 6.2: Logs wallet ont statut valide
✅ Test 6.3: Correspondance wallet ↔ last log
✅ Test 6.4: Réservations cohérentes
✅ Test 6.5: RLS wallet activé
```

---

## 📝 RECOMMANDATIONS CORRECTIVES

### Priorité 1: CRITIQUE (Structure Données)

#### Action 1: Vérifier schéma base de données
```bash
# Se connecter à Supabase
npx supabase db inspect

# Ou via SQL
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('wallet', 'candidate_stats', 'candidate_stats_logs')
ORDER BY table_name, ordinal_position;
```

#### Action 2: Appliquer migrations manquantes
```bash
# Vérifier migrations appliquées
npx supabase migration list

# Appliquer migrations en attente
npx supabase db push
```

#### Action 3: Corriger script d'audit
Si les noms de tables/colonnes sont différents, mettre à jour `audit-system-complete.js`:

```javascript
// Exemple: Si la table s'appelle profile_statistics au lieu de candidate_stats
const { data, error } = await supabase
  .from('profile_statistics') // Nom corrigé
  .select('candidate_id, views_count, downloads_count') // Colonnes correctes
  .limit(1);
```

### Priorité 2: HAUTE (IA & Quotas)

#### Action 1: Appliquer migration extension IA
```bash
# Vérifier si la migration existe
ls -la supabase/migrations/*extend_ia_engine*

# Si elle existe mais n'est pas appliquée
npx supabase migration up
```

#### Action 2: Initialiser services CVThèque
Si la migration a été appliquée mais les services n'apparaissent pas:

```sql
-- Vérifier directement dans la DB
SELECT service_code, service_name
FROM ia_service_config
WHERE service_code LIKE 'cv_%';

-- Si vide, réappliquer la partie INSERT de la migration
-- (voir fichier: 20260111193254_add_cv_scoring_and_search_ia_services.sql)
```

### Priorité 3: MOYENNE (Frontend)

#### Action 1: Audit manuel code frontend
```bash
# Rechercher usages de track_cv_download
grep -r "track_cv_download" src/

# Vérifier les imports dans les services
grep -r "\.rpc(" src/services/ | grep -v "node_modules"
```

#### Action 2: Ajouter tests unitaires
Créer des tests automatisés pour vérifier que les services utilisent bien les RPC:

```typescript
// tests/services/cvDownload.test.ts
describe('CV Download Service', () => {
  it('should use RPC track_cv_download', () => {
    // Test d'intégration
  });
});
```

---

## 🔄 PROCESSUS D'AMÉLIORATION CONTINUE

### 1. Audit Régulier
Lancer l'audit après chaque:
- Déploiement en production
- Migration de base de données
- Ajout de fonctionnalité critique

```bash
# Dans CI/CD pipeline
npm run audit:system
if [ $? -ne 0 ]; then
  echo "❌ Audit échoué - déploiement annulé"
  exit 1
fi
```

### 2. Monitoring des Écarts
Suivre l'évolution du score global dans le temps:

| Date | Score | Écarts | Action |
|------|-------|--------|--------|
| 2026-01-11 | 75% | 8 tests échoués | Corrections planifiées |
| ... | ... | ... | ... |

### 3. Tests Complémentaires
Ajouter progressivement:
- Tests de performance (temps de réponse RPC)
- Tests de charge (quotas sous stress)
- Tests de sécurité (tentatives de bypass RLS)
- Tests d'intégrité des données (orphelins, doublons)

---

## 📚 ANNEXES

### A. Structure Attendue: Table wallet

```sql
CREATE TABLE wallet (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  balance integer NOT NULL DEFAULT 0,
  reserved_balance integer DEFAULT 0,
  last_transaction_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### B. Structure Attendue: Table candidate_stats

```sql
CREATE TABLE candidate_stats (
  candidate_id uuid PRIMARY KEY REFERENCES profiles(id),
  profile_views integer DEFAULT 0,
  cv_downloads integer DEFAULT 0,
  cv_views integer DEFAULT 0,
  contact_requests integer DEFAULT 0,
  ai_score numeric(5,2),
  ai_score_version integer,
  ai_score_breakdown jsonb,
  ai_score_last_updated timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### C. Structure Attendue: Table candidate_stats_logs

```sql
CREATE TABLE candidate_stats_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES profiles(id),
  stat_type text NOT NULL,
  old_value integer,
  new_value integer,
  changed_by uuid REFERENCES auth.users(id),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

### D. Fonctions RPC Requises

```sql
-- 1. Incrémenter vues profil
CREATE OR REPLACE FUNCTION increment_profile_view(
  p_candidate_id uuid,
  p_viewer_id uuid DEFAULT NULL
) RETURNS jsonb;

-- 2. Tracker téléchargement CV
CREATE OR REPLACE FUNCTION track_cv_download(
  p_candidate_id uuid,
  p_recruiter_id uuid
) RETURNS jsonb;

-- 3. Consommer crédits IA
CREATE OR REPLACE FUNCTION use_ai_credits(
  p_user_id uuid,
  p_service_key text,
  p_input_payload jsonb DEFAULT NULL,
  p_output_response jsonb DEFAULT NULL
) RETURNS jsonb;

-- 4. Vérifier et déduire crédits
CREATE OR REPLACE FUNCTION check_and_deduct_credits(
  p_user_id uuid,
  p_credits_needed integer
) RETURNS jsonb;
```

---

## 🎯 VERDICT FINAL

### État Actuel: ❌ **NON CONFORME** (75%)

Le système présente **75% de conformité** avec 24 tests réussis sur 32.

### Points Positifs
- ✅ **Wallet fonctionnel** (100%)
- ✅ **Logs exhaustifs** (100%)
- ✅ **Règles métier respectées** (100%)

### Points à Corriger
- ❌ Structure données incomplète (38%)
- ⚠️  Configuration IA partielle (67%)
- ⚠️  Frontend partiellement conforme (67%)

### Chemin vers la Conformité Totale

**Étape 1** (1-2h): Corriger structure données
- Vérifier schéma réel des tables
- Appliquer migrations manquantes
- Adapter script d'audit si nécessaire

**Étape 2** (30min): Activer système IA CVThèque
- Appliquer migration `extend_ia_engine_monitoring_and_quotas`
- Vérifier insertion services et quotas

**Étape 3** (1h): Audit frontend complet
- Vérifier tous les services utilisent RPC
- Ajouter tests unitaires
- Documenter patterns corrects

**Score cible**: ✅ **100% de conformité**

---

*Document généré automatiquement le 2026-01-11*
*Système d'Audit Automatique v1.0*
*JobGuinée - Quality Assurance*
