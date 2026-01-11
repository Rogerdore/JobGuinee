# EXTENSION MOTEUR IA CENTRAL - CVThèque (SANS DUPLICATION)

## 📋 RÉSUMÉ EXÉCUTIF

**Objectif**: Étendre le moteur IA central existant pour supporter pleinement le module CVThèque (scoring + recherche sémantique) **SANS créer de duplication**.

**Méthode**: Extension via vues, fonctions RPC, tables de configuration supplémentaires. **AUCUNE modification** des tables ou services existants.

**Résultat**: Moteur IA unique, plus puissant, compatible 100% avec l'existant, sans dette technique.

---

## ✅ PRINCIPE FONDAMENTAL: ZÉRO DUPLICATION

### Tables Existantes RÉUTILISÉES (pas touchées)
```
✓ ia_service_config           → Configs des services IA
✓ ia_service_templates         → Templates de génération
✓ ai_service_usage_history     → Historique d'usage IA
✓ service_credit_costs         → Tarifs en crédits
✓ wallet + wallet_logs         → Système de crédits
✓ profiles                     → Solde crédits utilisateurs
✓ candidate_stats              → Stats candidats (ai_score)
```

### Extensions AJOUTÉES (nouvelles uniquement)
```
+ v_ia_service_stats           → Vue analytics (lecture seule)
+ v_ia_user_consumption        → Vue consommation user (lecture seule)
+ v_ia_daily_metrics           → Vue métriques quotidiennes (lecture seule)
+ ia_service_quotas            → Table quotas par service/user_type
+ ia_consumption_alerts        → Table alertes dépassements
+ ia_cvtheque_config           → Table config avancée CVThèque
+ check_service_quota()        → RPC vérification quotas
+ get_ia_service_stats()       → RPC stats agrégées
+ get_user_ia_consumption()    → RPC conso utilisateur
```

---

## 🏗️ ARCHITECTURE EXTENSION

```
┌─────────────────────────────────────────────────────────────┐
│                    MOTEUR IA CENTRAL                         │
│  (iaConfigService + ia_service_config + use_ai_credits)     │
└────────────┬────────────────────────────────────────────────┘
             │
             ├──► SERVICE EXISTANTS (non modifiés)
             │    • cv_generation
             │    • job_description_generator
             │    • coaching_assistant
             │    • ... (autres services)
             │
             └──► NOUVEAUX SERVICES CVThèque (ajoutés)
                  • cv_profile_scoring (1 crédit)
                  • cv_semantic_search (5 crédits)
                       │
                       ├──► EXTENSIONS (nouvelles couches)
                       │    • ia_service_quotas (limites usage)
                       │    • ia_cvtheque_config (paramètres scoring)
                       │    • v_ia_service_stats (monitoring)
                       │    • check_service_quota() (validation)
                       │
                       └──► SERVICE FRONTEND UNIFIÉ
                            cvthequeIAService.ts
                            • Orchestre appels IA
                            • Vérifie quotas
                            • Consomme crédits
                            • Gère cache
```

---

## 📊 SERVICES IA CVThèque AJOUTÉS

### 1. Service: `cv_profile_scoring`

**Configuration** (dans `ia_service_config`):
```sql
service_code: 'cv_profile_scoring'
service_name: 'Scoring Automatique de Profils CV'
category: 'analysis'
credits_cost: 1 crédit
version: 1
is_active: true
```

**Input Schema**:
```json
{
  "required": ["experience_years", "education_level", "skills"],
  "properties": {
    "experience_years": {"type": "number"},
    "education_level": {"type": "string", "enum": ["bac", "licence", "master", "doctorat"]},
    "skills": {"type": "array", "items": {"type": "string"}},
    "is_verified": {"type": "boolean"},
    "is_gold": {"type": "boolean"},
    "profile_completion": {"type": "number"}
  }
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "score": {"type": "number"},
    "breakdown": {
      "experience_score": {"type": "number"},
      "education_score": {"type": "number"},
      "skills_score": {"type": "number"},
      "verification_score": {"type": "number"},
      "completion_score": {"type": "number"}
    },
    "reasoning": {"type": "string"}
  }
}
```

**Quotas par défaut**:
| User Type  | Daily | Weekly | Monthly | Premium Unlimited |
|-----------|-------|--------|---------|-------------------|
| Candidate | 50    | 200    | 500     | Non               |
| Recruiter | 100   | 500    | 2000    | **Oui**           |
| Trainer   | 30    | 100    | 300     | Non               |
| Admin     | ∞     | ∞      | ∞       | Oui               |

### 2. Service: `cv_semantic_search`

**Configuration** (dans `ia_service_config`):
```sql
service_code: 'cv_semantic_search'
service_name: 'Recherche Sémantique CVThèque'
category: 'matching'
credits_cost: 5 crédits
version: 1
is_active: true
```

**Input Schema**:
```json
{
  "required": ["query"],
  "properties": {
    "query": {"type": "string", "minLength": 3},
    "current_filters": {"type": "object"}
  }
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "interpreted_query": {"type": "string"},
    "search_criteria": {
      "skills": {"type": "array"},
      "experience_min": {"type": "number"},
      "experience_max": {"type": "number"},
      "education_level": {"type": "string"},
      "location": {"type": "string"},
      "domain": {"type": "string"}
    },
    "suggested_keywords": {"type": "array"},
    "relevance_factors": {"type": "array"}
  }
}
```

**Quotas par défaut**:
| User Type  | Daily | Weekly | Monthly | Premium Unlimited |
|-----------|-------|--------|---------|-------------------|
| Candidate | 5     | 20     | 50      | Non               |
| Recruiter | 20    | 100    | 400     | **Oui**           |
| Trainer   | 10    | 40     | 150     | Non               |
| Admin     | ∞     | ∞      | ∞       | Oui               |

---

## 🔧 CONFIGURATION AVANCÉE CVThèque

Table: **`ia_cvtheque_config`** (singleton, 1 seule ligne)

**Champs configurables**:

```typescript
{
  // Poids scoring (personnalisables)
  scoring_weights: {
    experience: 40,      // 0-40 points
    education: 25,       // 0-25 points
    skills: 20,          // 0-20 points
    verification: 10,    // 0-10 points
    completion: 5        // 0-5 points
  },

  // Paramètres recherche
  search_max_results: 50,
  search_relevance_threshold: 0.6,
  search_boost_verified: true,
  search_boost_gold: true,

  // Performance
  enable_cache: true,
  cache_duration_minutes: 60,

  // Seuils scoring
  min_visible_score: 60,
  excellent_score_threshold: 85
}
```

**Accès**:
- **Lecture**: Tous les utilisateurs authentifiés
- **Écriture**: Admins uniquement

---

## 📈 MONITORING & ANALYTICS (VUES)

### Vue: `v_ia_service_stats`

Stats globales par service IA (agrégation sans duplication).

**Colonnes**:
```sql
service_code, service_name, category, is_active,
credits_cost, total_uses, unique_users,
total_credits_consumed, avg_credits_per_use,
first_use_at, last_use_at,
uses_last_24h, uses_last_7d, uses_last_30d
```

**Usage**:
```typescript
// Frontend (lecture seule)
const { data } = await supabase
  .from('v_ia_service_stats')
  .select('*')
  .order('total_uses', { ascending: false });
```

### Vue: `v_ia_user_consumption`

Consommation IA par utilisateur.

**Colonnes**:
```sql
user_id, user_type, current_balance,
total_ia_uses, total_credits_spent, services_used_count,
last_ia_use_at,
uses_today, credits_today,
uses_this_week, credits_this_week,
uses_this_month, credits_this_month
```

### Vue: `v_ia_daily_metrics`

Métriques quotidiennes (tendances 90 derniers jours).

**Colonnes**:
```sql
date, service_key, service_name,
daily_uses, daily_unique_users,
daily_credits_consumed, avg_credits_per_use
```

---

## 🚦 SYSTÈME DE QUOTAS

### Table: `ia_service_quotas`

Configuration des limites d'usage par service et type d'utilisateur.

**Colonnes**:
```sql
service_code            → Référence au service IA
user_type               → candidate|recruiter|trainer|admin
max_daily_uses          → Limite quotidienne (NULL = illimité)
max_weekly_uses         → Limite hebdomadaire
max_monthly_uses        → Limite mensuelle
max_daily_credits       → Limite crédits quotidienne
max_weekly_credits      → Limite crédits hebdomadaire
max_monthly_credits     → Limite crédits mensuelle
premium_unlimited       → Bypass pour utilisateurs premium
is_active               → Activer/désactiver quota
```

**RLS**:
- **Lecture**: Tous les utilisateurs
- **Écriture**: Admins uniquement

### Fonction RPC: `check_service_quota()`

Vérifie si un utilisateur peut utiliser un service IA (appelée AVANT l'appel IA).

**Signature**:
```sql
check_service_quota(
  p_user_id uuid,
  p_service_code text
) RETURNS jsonb
```

**Output**:
```json
{
  "allowed": true,
  "usage": {
    "daily_uses": 5,
    "weekly_uses": 23,
    "monthly_uses": 87,
    "daily_credits": 25
  },
  "limits": {
    "max_daily_uses": 50,
    "max_weekly_uses": 200,
    "max_monthly_uses": 500,
    "max_daily_credits": null
  }
}
```

ou en cas de dépassement:
```json
{
  "allowed": false,
  "reason": "DAILY_QUOTA_EXCEEDED",
  "current": 50,
  "limit": 50
}
```

**Logique**:
1. Récupère user_type et statut premium
2. Récupère quotas configurés pour ce service/user_type
3. Si premium + `premium_unlimited = true` → autorise directement
4. Sinon, compte les usages depuis début jour/semaine/mois
5. Compare avec limites configurées
6. Retourne autorisation ou refus avec détails

---

## 🔔 ALERTES DE CONSOMMATION

### Table: `ia_consumption_alerts`

Log des dépassements de quotas et seuils.

**Colonnes**:
```sql
user_id                 → Utilisateur concerné
service_code            → Service IA
alert_type              → quota_exceeded|threshold_warning|low_credits
alert_level             → info|warning|critical
message                 → Description de l'alerte
current_value           → Valeur actuelle
threshold_value         → Seuil dépassé
is_notified             → Notification envoyée ?
notified_at             → Date notification
created_at              → Date alerte
```

**Cas d'usage**:
- Quota quotidien atteint → alerte `quota_exceeded`
- 80% du quota mensuel → alerte `threshold_warning`
- Solde crédits < 10 → alerte `low_credits`

**RLS**:
- **Lecture**: Utilisateur voit ses propres alertes
- **Écriture**: Système uniquement

---

## 💻 SERVICE FRONTEND UNIFIÉ

### Fichier: `src/services/cvthequeIAService.ts`

**Responsabilités**:
1. Orchestrer les appels aux services IA CVThèque
2. Vérifier les quotas AVANT appel IA
3. Déléguer la consommation de crédits au moteur central
4. Gérer le cache si configuré
5. Logger les erreurs

**Méthodes principales**:

```typescript
// Scoring d'un profil
async scoreProfile(
  userId: string,
  input: ScoringInput
): Promise<IAServiceResult<ScoringOutput>>

// Recherche sémantique
async searchCandidates(
  userId: string,
  input: SearchInput
): Promise<IAServiceResult<SearchOutput>>

// Stats consommation utilisateur
async getUserConsumption(
  userId?: string
): Promise<any>

// Stats globales services (admin)
async getServiceStats(
  serviceCode?: string,
  days?: number
): Promise<any>
```

**Workflow d'appel IA**:
```
1. cvthequeIAService.scoreProfile(userId, input)
2. → check_service_quota(userId, 'cv_profile_scoring')
3. → quotas OK ? continue : return error
4. → iaConfigService.getConfig('cv_profile_scoring')
5. → iaConfigService.buildPrompt(config, input)
6. → [APPEL IA RÉEL - OpenAI/autre]
7. → use_ai_credits(userId, 'cv_profile_scoring', input, output)
8. → return { success: true, data: output, credits_consumed: 1 }
```

**Avantages**:
- ✅ Une seule API frontend pour tout CVThèque IA
- ✅ Réutilise 100% le moteur central existant
- ✅ Quotas intégrés automatiquement
- ✅ Crédits débitésdepuis wallet existant
- ✅ Logs centralisés dans ai_service_usage_history

---

## 🔄 WORKFLOW COMPLET

### Exemple: Scoring d'un profil candidat

**Frontend**:
```typescript
import { cvthequeIAService } from '@/services/cvthequeIAService';

const result = await cvthequeIAService.scoreProfile(userId, {
  candidate_id: '123e4567-e89b-12d3-a456-426614174000',
  experience_years: 5,
  education_level: 'master',
  skills: ['JavaScript', 'React', 'Node.js'],
  is_verified: true,
  profile_completion: 90
});

if (result.success) {
  console.log('Score:', result.data.score);
  console.log('Crédits consommés:', result.credits_consumed);
  console.log('Crédits restants:', result.credits_remaining);
} else if (result.quota_exceeded) {
  alert('Quota quotidien atteint !');
} else {
  console.error('Erreur:', result.error);
}
```

**Backend (automatique)**:
```sql
-- 1. Vérification quota
SELECT check_service_quota(
  'user-uuid',
  'cv_profile_scoring'
);
-- ✓ allowed = true

-- 2. Récupération config service
SELECT * FROM ia_service_config
WHERE service_code = 'cv_profile_scoring';

-- 3. Appel IA (via iaConfigService.buildPrompt)
-- [Appel OpenAI GPT-4 avec prompt construit]

-- 4. Consommation crédits
SELECT use_ai_credits(
  'user-uuid',
  'cv_profile_scoring',
  '{"experience_years": 5, ...}'::jsonb,
  '{"score": 82, ...}'::jsonb
);
-- ✓ success = true, credits_consumed = 1

-- 5. Log dans ai_service_usage_history
INSERT INTO ai_service_usage_history (
  user_id, service_key, credits_consumed,
  input_payload, output_response
) VALUES (...);

-- 6. Débit dans wallet_logs
INSERT INTO wallet_logs (
  user_id, action_type, amount,
  balance_before, balance_after,
  service_code
) VALUES (...);
```

---

## 📚 FONCTIONS RPC AJOUTÉES

### 1. `get_ia_service_stats()`

Récupère stats agrégées services IA (admin).

**Signature**:
```sql
get_ia_service_stats(
  p_service_code text DEFAULT NULL,
  p_days integer DEFAULT 30
) RETURNS jsonb
```

**Cas d'usage**:
```typescript
// Stats globales tous services
const globalStats = await supabase.rpc('get_ia_service_stats');

// Stats d'un service spécifique (7 derniers jours)
const scoringStats = await supabase.rpc('get_ia_service_stats', {
  p_service_code: 'cv_profile_scoring',
  p_days: 7
});
```

### 2. `get_user_ia_consumption()`

Récupère consommation IA d'un utilisateur.

**Signature**:
```sql
get_user_ia_consumption(
  p_user_id uuid DEFAULT NULL
) RETURNS jsonb
```

**Cas d'usage**:
```typescript
// Ma propre consommation
const myConsumption = await supabase.rpc('get_user_ia_consumption');

// Consommation d'un utilisateur spécifique (admin)
const userConsumption = await supabase.rpc('get_user_ia_consumption', {
  p_user_id: 'user-uuid'
});
```

### 3. `check_service_quota()`

Vérifie si utilisateur peut utiliser un service IA.

**Signature**:
```sql
check_service_quota(
  p_user_id uuid,
  p_service_code text
) RETURNS jsonb
```

**Cas d'usage**:
```typescript
const quotaCheck = await supabase.rpc('check_service_quota', {
  p_user_id: userId,
  p_service_code: 'cv_semantic_search'
});

if (!quotaCheck.allowed) {
  alert(`Quota dépassé: ${quotaCheck.reason}`);
}
```

---

## ✅ CHECKLIST DE CONFORMITÉ

### Non-Duplication
- ✅ Aucune nouvelle table de crédits (réutilise `wallet`)
- ✅ Aucun nouveau système de logs (réutilise `ai_service_usage_history`)
- ✅ Aucune duplication de config IA (réutilise `ia_service_config`)
- ✅ Aucun nouveau système de tarifs (réutilise `service_credit_costs`)

### Extension Propre
- ✅ Vues en lecture seule (pas de modification données)
- ✅ Tables de config UNIQUEMENT (quotas, paramètres avancés)
- ✅ Fonctions RPC pour agrégation (pas de duplication logique)
- ✅ Service frontend unifié (un seul point d'entrée)

### Compatibilité
- ✅ Services existants fonctionnent toujours
- ✅ Nouveaux services suivent même pattern
- ✅ Admin IA unique (AdminIADashboard)
- ✅ Workflow crédits inchangé

### Sécurité
- ✅ RLS sur toutes les nouvelles tables
- ✅ SECURITY DEFINER sur RPC critiques
- ✅ Validation inputs via input_schema
- ✅ Vérification quotas AVANT appels IA

---

## 🎯 PROCHAINES ÉTAPES (RECOMMANDATIONS)

### 1. Intégration OpenAI Réelle
Actuellement les services IA retournent des mocks. Remplacer par vrais appels:
```typescript
// Dans cvthequeIAService.ts, ligne ~95 et ~165
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: prompt.model,
    messages: [
      { role: 'system', content: prompt.systemMessage },
      { role: 'user', content: prompt.userMessage }
    ],
    temperature: prompt.temperature,
    max_tokens: prompt.maxTokens
  })
});
```

### 2. Dashboard Admin Analytics IA
Créer page admin avec:
- Graphiques consommation par service (v_ia_daily_metrics)
- Top utilisateurs (v_ia_user_consumption)
- Configuration quotas (ia_service_quotas)
- Alertes actives (ia_consumption_alerts)

### 3. Notifications Quotas
Implémenter système de notifications quand:
- Quota atteint (alerte critical)
- 80% quota (alerte warning)
- Solde crédits faible (alerte low_credits)

### 4. Cache Résultats Scoring
Si `enable_cache = true` dans `ia_cvtheque_config`:
- Stocker scores dans table cache avec TTL
- Vérifier cache avant appel IA
- Invalider cache si profil modifié

### 5. Tests Automatisés
```typescript
describe('CVThèque IA Service', () => {
  it('should check quota before scoring', async () => {
    // Test vérification quota
  });

  it('should consume credits after successful call', async () => {
    // Test débit crédits
  });

  it('should create alert when quota exceeded', async () => {
    // Test création alerte
  });
});
```

---

## 📖 RÉSUMÉ FINAL

### Ce qui a été fait
1. ✅ **2 nouveaux services IA** ajoutés au moteur central (`cv_profile_scoring`, `cv_semantic_search`)
2. ✅ **3 vues analytics** pour monitoring sans duplication
3. ✅ **Système de quotas** configurable par service/user_type
4. ✅ **Alertes consommation** pour prévenir dépassements
5. ✅ **Configuration avancée CVThèque** (poids scoring, paramètres recherche)
6. ✅ **3 fonctions RPC** pour vérifications et stats
7. ✅ **Service frontend unifié** (`cvthequeIAService.ts`)
8. ✅ **Quotas par défaut** configurés pour tous types utilisateurs

### Ce qui N'A PAS été fait (volontaire)
- ❌ Création d'un moteur IA concurrent
- ❌ Duplication de tables crédits/logs
- ❌ Hardcoding logique IA dans CVThèque
- ❌ Page admin IA séparée
- ❌ Système de logs parallèle

### Principe respecté
**UN SEUL MOTEUR IA, PLUS PUISSANT, SANS DUPLICATION, COMPATIBLE EXISTANT.**

---

*Documentation générée le 2025-01-11*
*Moteur IA Central v2 - Extension CVThèque*
