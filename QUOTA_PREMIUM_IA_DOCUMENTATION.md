# Documentation Système de Quotas Premium IA

## 📋 Vue d'ensemble

Le système de quotas Premium IA permet de limiter le nombre d'utilisations quotidiennes des services IA pour les utilisateurs **Premium PRO+**, tout en leur offrant un accès illimité aux services sans consommer de crédits.

### Problème résolu
- Éviter l'abus des services IA Premium
- Contrôler les coûts d'API pour les services IA
- Offrir un équilibre entre accès illimité et utilisation raisonnable

---

## 🎯 Fonctionnement

### 1. Pour les utilisateurs Premium PRO+

**AVEC quota activé** :
- ✅ Accès illimité aux services IA **SANS consommer de crédits**
- ⚠️ Limité à X utilisations par jour (ex: 30/jour)
- 🔄 Quota réinitialisé automatiquement à minuit
- 🚫 Après avoir atteint la limite : message "Quota quotidien atteint"

**SANS quota activé** :
- ✅ Accès totalement illimité
- ✅ Aucune consommation de crédits
- ✅ Aucune restriction

### 2. Pour les utilisateurs non-premium

Le quota Premium n'affecte **PAS** les utilisateurs non-premium :
- Ils paient avec leurs crédits IA comme d'habitude
- Pas de limite quotidienne (tant qu'ils ont des crédits)

---

## 🗄️ Structure de la base de données

### Table `ia_service_config`

Nouvelles colonnes ajoutées :

| Colonne | Type | Description | Défaut |
|---------|------|-------------|--------|
| `enable_premium_limits` | BOOLEAN | Active/désactive le quota pour ce service | `false` |
| `premium_daily_limit` | INTEGER | Nombre maximum d'utilisations/jour | `30` |
| `credits_cost` | INTEGER | Coût en crédits pour non-premium | `5` |

**Exemple de configuration** :

```sql
UPDATE ia_service_config
SET
  enable_premium_limits = true,
  premium_daily_limit = 30,
  credits_cost = 10
WHERE service_code = 'ai_cv_builder';
```

### Table `ai_service_usage_history`

Nouvelle colonne ajoutée :

| Colonne | Type | Description |
|---------|------|-------------|
| `service_code` | TEXT | Code du service IA utilisé (pour comptage quotidien) |

**Index de performance** :
```sql
CREATE INDEX idx_ai_service_usage_user_service_date
ON ai_service_usage_history(user_id, service_code, created_at DESC);
```

---

## ⚙️ Configuration par défaut

Après la migration, les services IA ont ces quotas par défaut :

| Service | Quota activé | Limite/jour | Crédits |
|---------|--------------|-------------|---------|
| `ai_cv_builder` | ✅ Oui | 30 | 10 |
| `ai_cv_improver` | ✅ Oui | 30 | 10 |
| `ai_cv_targeted` | ✅ Oui | 30 | 10 |
| `ai_cover_letter` | ✅ Oui | 30 | 10 |
| `ai_job_matching` | ✅ Oui | 30 | 5 |
| `ai_career_plan` | ✅ Oui | 30 | 5 |
| `ai_career_coaching` | ✅ Oui | 30 | 15 |
| `ai_interview_simulator` | ✅ Oui | 30 | 15 |
| `ai_chatbot` | ✅ Oui | 30 | 1 |
| `ai_gold_profile` | ✅ Oui | 30 | 50 |

Ces valeurs peuvent être modifiées dans la page **Admin → Quotas Premium**.

---

## 🔧 Fonction RPC : `get_premium_remaining_actions`

### Description
Retourne les informations de quota pour un utilisateur Premium PRO+.

### Signature
```sql
get_premium_remaining_actions(
  p_user_id UUID,
  p_service_code TEXT DEFAULT NULL
)
```

### Retour
```typescript
{
  service_code: string;
  service_name: string;
  daily_limit: number;
  actions_today: number;
  remaining_actions: number;
  is_premium: boolean;
  premium_active: boolean;
  quota_enabled: boolean;
}
```

### Exemple d'utilisation

```typescript
// Obtenir les quotas de tous les services
const { data } = await supabase
  .rpc('get_premium_remaining_actions', {
    p_user_id: userId
  });

// Obtenir le quota d'un service spécifique
const { data } = await supabase
  .rpc('get_premium_remaining_actions', {
    p_user_id: userId,
    p_service_code: 'ai_cv_builder'
  });
```

---

## 🖥️ Interface Admin : Page de gestion

### Accès
**Route** : `admin-ia-premium-quota`
**Page** : `AdminIAPremiumQuota.tsx`
**Menu** : Admin → Quotas Premium (icône Crown)

### Fonctionnalités

#### 1. Tableau de bord statistiques
- 📊 Total actions aujourd'hui
- 👥 Utilisateurs actifs aujourd'hui
- 🛡️ Services avec quota activé
- 📈 Moyenne actions/utilisateur

#### 2. Table de gestion des services

Pour chaque service IA :
- ✅ **Toggle quota** : Activer/désactiver en 1 clic
- 📝 **Modifier** : Ouvrir modal de configuration
- 📊 **Stats temps réel** :
  - Actions effectuées aujourd'hui
  - Nombre d'utilisateurs actifs
  - Nombre d'utilisateurs à la limite

#### 3. Modal de modification

Permet de configurer :
1. **Activer les quotas Premium** (ON/OFF)
2. **Limite quotidienne** (0 = illimité)
3. **Coût en crédits** (pour non-premium)

---

## 🔒 Contrôle d'accès (Code TypeScript)

### Service `ChatbotIAAccessControl`

Le système de vérification des quotas est implémenté dans :
`src/services/chatbotIAAccessControl.ts`

#### Méthode principale : `checkIAAccess`

```typescript
const result = await ChatbotIAAccessControl.checkIAAccess(
  serviceCode,
  userContext
);

if (!result.allowed) {
  console.log(result.reason); // 'premium_quota_reached'
  console.log(result.message); // "Limite quotidienne atteinte..."
  console.log(result.dailyActionsUsed); // 30
  console.log(result.dailyLimit); // 30
}
```

#### Raisons de refus possibles

| Raison | Description |
|--------|-------------|
| `not_authenticated` | User non connecté |
| `insufficient_credits` | Pas assez de crédits (non-premium) |
| `premium_quota_reached` | Quota quotidien atteint (premium) |
| `service_inactive` | Service désactivé |
| `premium_expired` | Abonnement expiré |
| `service_not_found` | Service inexistant |

---

## 🎨 Interface Utilisateur

### Message de quota atteint (Chatbot)

Quand un utilisateur Premium atteint sa limite :

```
⏰ Limite quotidienne atteinte pour ce service (30 utilisations par jour).
Réinitialisée à minuit.

Votre quota sera réinitialisé à minuit.

[Bouton : Voir d'autres services]
```

### Badge Premium dans le chatbot

Les utilisateurs Premium voient :
- 👑 Badge "PRO+" à côté de leur nom
- 💰 Solde de crédits caché (car ils n'en consomment pas)
- 📊 Compteur d'actions utilisées/limite (si quota activé)

---

## 📊 Monitoring et Statistiques

### Requête SQL : Actions par service aujourd'hui

```sql
SELECT
  sc.service_name,
  COUNT(*) as actions_today,
  COUNT(DISTINCT uh.user_id) as users_today
FROM ai_service_usage_history uh
JOIN ia_service_config sc ON sc.service_code = uh.service_code
WHERE uh.created_at >= CURRENT_DATE
GROUP BY sc.service_name
ORDER BY actions_today DESC;
```

### Requête SQL : Utilisateurs ayant atteint leur limite

```sql
SELECT
  p.email,
  p.full_name,
  uh.service_code,
  COUNT(*) as actions_today,
  sc.premium_daily_limit
FROM ai_service_usage_history uh
JOIN profiles p ON p.id = uh.user_id
JOIN ia_service_config sc ON sc.service_code = uh.service_code
WHERE
  uh.created_at >= CURRENT_DATE
  AND p.is_premium = true
  AND p.premium_expiration > NOW()
  AND sc.enable_premium_limits = true
GROUP BY p.email, p.full_name, uh.service_code, sc.premium_daily_limit
HAVING COUNT(*) >= sc.premium_daily_limit
ORDER BY actions_today DESC;
```

---

## 🚀 Scénarios d'utilisation

### Scénario 1 : Utilisateur Premium PRO+ normal

1. User se connecte (Premium actif)
2. Utilise "Générateur CV IA" → ✅ Autorisé (1/30)
3. Utilise 29 fois de plus → ✅ Autorisé (30/30)
4. Essaye une 31e fois → ❌ Refusé "Quota atteint"
5. Minuit arrive → 🔄 Quota réinitialisé (0/30)

### Scénario 2 : Utilisateur non-premium

1. User se connecte (pas premium)
2. Utilise "Générateur CV IA" → ✅ Autorisé (-10 crédits)
3. Utilise 5 fois → ✅ Autorisé si crédits suffisants
4. Plus de crédits → ❌ Refusé "Crédits insuffisants"

### Scénario 3 : Admin désactive le quota

1. Admin va dans **Quotas Premium**
2. Désactive le quota pour `ai_cv_builder`
3. Les Premium PRO+ ont maintenant un accès **totalement illimité**

---

## 🛡️ Sécurité

### Politiques RLS (Row Level Security)

Les tables sont protégées par RLS :
- `ia_service_config` : Lecture publique, modification admin-only
- `ai_service_usage_history` : Lecture propre user, écriture contrôlée

### Fonction RPC sécurisée

```sql
-- Seulement accessible aux utilisateurs authentifiés
REVOKE ALL ON FUNCTION get_premium_remaining_actions FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_premium_remaining_actions TO authenticated;
```

### Validation côté serveur

Le système vérifie :
1. ✅ Authentification de l'utilisateur
2. ✅ Statut premium actif
3. ✅ Date d'expiration premium
4. ✅ Quota du service activé
5. ✅ Nombre d'actions aujourd'hui

---

## 🔄 Maintenance

### Réinitialisation manuelle d'un quota

Si un admin veut réinitialiser le quota d'un user spécifique :

```sql
DELETE FROM ai_service_usage_history
WHERE user_id = 'USER_ID_HERE'
  AND service_code = 'ai_cv_builder'
  AND created_at >= CURRENT_DATE;
```

### Désactiver tous les quotas temporairement

```sql
UPDATE ia_service_config
SET enable_premium_limits = false;
```

### Changer la limite globale

```sql
UPDATE ia_service_config
SET premium_daily_limit = 50
WHERE enable_premium_limits = true;
```

---

## 📝 Notes importantes

### ✅ CE QUE LE SYSTÈME FAIT

- Limite les utilisateurs Premium PRO+ à X actions/jour
- Réinitialise automatiquement à minuit
- N'affecte PAS les non-premium
- Permet configuration service par service
- Fournit stats en temps réel

### ❌ CE QUE LE SYSTÈME NE FAIT PAS

- Ne bloque PAS les non-premium (ils paient avec crédits)
- Ne supprime PAS les données après 24h
- N'envoie PAS d'emails de notification
- Ne fait PAS de rollover de quota

---

## 🔧 Dépannage

### Problème : Quota ne se réinitialise pas

**Cause** : Fuseau horaire mal configuré
**Solution** :
```sql
-- Vérifier le fuseau horaire de la DB
SHOW timezone;

-- Le changer si nécessaire
ALTER DATABASE postgres SET timezone TO 'UTC';
```

### Problème : Admin ne peut pas modifier

**Cause** : Permissions RLS
**Solution** : Vérifier que `user_type = 'admin'` dans `profiles`

### Problème : Compteur d'actions incorrect

**Cause** : Index manquant
**Solution** :
```sql
CREATE INDEX IF NOT EXISTS idx_ai_service_usage_user_service_date
ON ai_service_usage_history(user_id, service_code, created_at DESC);
```

---

## 📚 Fichiers modifiés/créés

### Migrations
- `supabase/migrations/complete_premium_quota_system.sql`

### Pages créées
- `src/pages/AdminIAPremiumQuota.tsx`

### Services modifiés
- `src/services/chatbotIAAccessControl.ts` (déjà existant, complété)

### Composants modifiés
- `src/components/AdminLayout.tsx` (ajout bouton menu)
- `src/App.tsx` (ajout route)

---

## 🎉 Conclusion

Le système de quotas Premium IA est maintenant **OPÉRATIONNEL** et permet :

✅ **Contrôle des coûts** tout en offrant un service premium
✅ **Flexibilité** : Activer/désactiver par service
✅ **Transparence** : Stats temps réel pour monitoring
✅ **User-friendly** : Messages clairs pour les utilisateurs
✅ **Évolutif** : Facile à ajuster selon les besoins

---

**Date de mise en production** : 11 décembre 2024
**Version** : 1.0
**Développeur principal** : JobGuinée Tech Team
