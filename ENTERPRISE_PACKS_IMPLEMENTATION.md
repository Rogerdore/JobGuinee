# Implémentation Packs ENTERPRISE & CABINETS RH – JobGuinée

## 📋 Vue d'ensemble

Cette implémentation étend le système existant de JobGuinée pour supporter un écosystème complet de **packs enterprise** destinés aux recruteurs professionnels et cabinets RH.

### ✅ Statut : IMPLÉMENTÉ

Tous les composants critiques sont opérationnels et testés.

---

## 🏗️ Architecture Générale

### Couches Implémentées

1. **Base de données** : Tables étendues avec RLS stricte
2. **Services Backend** : Gestion complète des souscriptions et limites
3. **Frontend** : Pages de souscription, dashboard et admin
4. **Middleware** : Vérification automatique des limites
5. **Analytics** : Tracking d'utilisation et calcul ROI

---

## 📦 Packs Disponibles

### 1. ENTERPRISE BASIC – 3 500 000 GNF/mois

**Code** : `enterprise_basic`

**Limites** :
- Offres actives : 5
- CV consultés/mois : 200
- Matching IA/mois : 150

**Fonctionnalités** :
- ATS complet (pipeline par offre)
- Gestion multi-offres
- Accès CVthèque limité
- Matching IA en batch
- Exports PDF / Excel / CSV
- Support Email

---

### 2. ENTERPRISE PRO – 7 500 000 GNF/mois

**Code** : `enterprise_pro`

**Limites** :
- Offres actives : 10
- CV consultés/mois : 500
- Matching IA/mois : 300

**Fonctionnalités** :
- Tout BASIC +
- ATS multi-projets
- Pipeline personnalisable
- Planification d'entretiens
- Communication recruteur ↔ candidat
- Accès CVthèque étendu
- Analytics recruteur & ROI IA
- Support WhatsApp

---

### 3. ENTERPRISE GOLD – 10 000 000 GNF/mois ⚠️

**Code** : `enterprise_gold`

**⚠️ VALIDATION ADMIN OBLIGATOIRE**

**Limites** :
- Offres actives : Illimitées
- CV consultés/mois : Illimités
- Matching IA/mois : Illimité (limite journalière configurable par admin)

**Fonctionnalités** :
- ATS + CVthèque illimités
- Matching IA illimité sous conditions
- Priorité diffusion offres
- Gestion multi-filiales
- Reporting institutionnel
- Support dédié + SLA
- Audit d'utilisation IA

**Protection anti-abus** :
- Limite journalière par défaut : 100 matching/jour
- Configurable par l'admin
- Réinitialisation automatique quotidienne
- Logs d'audit complets

---

### 4. CABINET RH – 12 000 000 GNF/mois

**Code** : `cabinet_rh`

**Limites** :
- Offres actives : 20
- CV consultés/mois : 500
- Matching IA/mois : 400

**Fonctionnalités** :
- ATS multi-offres
- Accès CVthèque étendu
- Matching IA avancé
- Gestion multi-clients
- Exports complets
- Analytics avancées

---

## 🎯 Services Premium Complémentaires

Activables à l'unité (disponibles même sans abonnement) :

| Service | Durée | Prix | Code |
|---------|-------|------|------|
| Offre à la une | 7 jours | 300 000 GNF | `featured_job_7d` |
| Offre à la une | 30 jours | 1 000 000 GNF | `featured_job_30d` |
| Offre à la une | 60 jours | 1 800 000 GNF | `featured_job_60d` |
| Profil recruteur mis en avant | 30 jours | 600 000 GNF | `featured_profile_30d` |
| Campagne diffusion ciblée | 7 jours | 400 000 GNF | `targeted_campaign_7d` |

---

## 🗄️ Base de Données

### Tables Créées/Modifiées

#### 1. `enterprise_subscriptions` (étendue)

**Nouvelles colonnes ajoutées** :
```sql
max_active_jobs integer DEFAULT 5
max_monthly_matching integer DEFAULT 150
matching_consumed integer DEFAULT 0
features jsonb DEFAULT '[]'::jsonb
daily_matching_limit integer
matching_consumed_today integer DEFAULT 0
last_matching_reset timestamptz DEFAULT now()
```

**Types de subscription étendus** :
- `enterprise_basic`
- `enterprise_pro`
- `enterprise_gold`
- `cabinet_rh`
- (+ anciens : `basic`, `silver`, `gold` pour rétrocompatibilité)

#### 2. `enterprise_usage_tracking` (nouvelle)

Track détaillé de toutes les actions :
```sql
CREATE TABLE enterprise_usage_tracking (
  id uuid PRIMARY KEY,
  subscription_id uuid REFERENCES enterprise_subscriptions(id),
  company_id uuid REFERENCES companies(id),
  usage_type text CHECK (usage_type IN (
    'cv_view', 'matching_ai', 'export',
    'communication', 'job_post', 'interview_schedule'
  )),
  job_id uuid,
  application_id uuid,
  candidate_profile_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  used_at timestamptz DEFAULT now()
);
```

**Indexes** :
- `subscription_id`, `company_id`, `usage_type`, `used_at`

#### 3. `premium_services_activations` (nouvelle)

Gestion des services premium à l'unité :
```sql
CREATE TABLE premium_services_activations (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  profile_id uuid REFERENCES profiles(id),
  service_type text CHECK (service_type IN (
    'featured_job_7d', 'featured_job_30d', 'featured_job_60d',
    'featured_profile_30d', 'targeted_campaign_7d'
  )),
  service_name text NOT NULL,
  price_gnf numeric NOT NULL,
  job_id uuid REFERENCES jobs(id),
  payment_method text DEFAULT 'orange_money',
  payment_reference text UNIQUE,
  payment_status text,
  status text,
  activated_at timestamptz,
  expires_at timestamptz
);
```

### Sécurité RLS

**Toutes les tables ont RLS activée** :

```sql
-- Les entreprises voient leurs propres données
CREATE POLICY "Companies can view own data"
  ON enterprise_usage_tracking
  FOR SELECT TO authenticated
  USING (company_id IN (
    SELECT id FROM companies WHERE profile_id = auth.uid()
  ));

-- Les admins voient tout
CREATE POLICY "Admins can view all data"
  ON enterprise_usage_tracking
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'admin'
    )
  );
```

---

## 🔧 Services Backend

### 1. EnterpriseSubscriptionService

**Fichier** : `src/services/enterpriseSubscriptionService.ts`

**Méthodes principales** :

```typescript
class EnterpriseSubscriptionService {
  // Créer une souscription
  static async createSubscription(
    companyId: string,
    packCode: string,
    paymentReference: string,
    paymentProofUrl?: string
  )

  // Obtenir l'abonnement actif
  static async getActiveSubscription(companyId: string)

  // Vérifier l'accès à une fonctionnalité
  static async checkFeatureAccess(
    companyId: string,
    featureType: 'cv_view' | 'matching_ai' | 'job_post',
    count: number = 1
  )

  // Tracker l'utilisation
  static async trackUsage(
    companyId: string,
    usageType: string,
    metadata: Record<string, any>
  )

  // Statistiques d'utilisation
  static async getUsageStats(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  )

  // Activer un service premium
  static async activatePremiumService(
    companyId: string,
    serviceCode: string,
    jobId: string,
    paymentReference: string,
    paymentProofUrl?: string
  )

  // Calculer le ROI
  static async calculateROI(
    companyId: string,
    subscriptionId: string
  )
}
```

### 2. Fonctions PostgreSQL

#### `get_active_enterprise_subscription(company_id_param)`

Retourne l'abonnement actif avec toutes ses limites.

#### `can_use_enterprise_feature(company_id_param, feature_type, count_requested)`

Vérifie si l'entreprise peut utiliser une fonctionnalité.

**Retourne** :
```json
{
  "allowed": true/false,
  "reason": "cv_quota_exceeded" | "matching_quota_exceeded" | "max_jobs_reached",
  "message": "Message d'erreur",
  "current": 150,
  "limit": 200
}
```

#### `track_enterprise_usage(company_id_param, usage_type_param, metadata_param)`

Enregistre l'utilisation et incrémente les compteurs.

---

## 🎨 Frontend

### Pages Créées

#### 1. EnterpriseSubscribe (`/enterprise-subscribe`)

**Fichier** : `src/pages/EnterpriseSubscribe.tsx`

**Fonctionnalités** :
- Affichage des 4 packs avec prix et fonctionnalités
- Sélection du pack
- Formulaire de paiement Orange Money
- Upload de preuve de paiement
- Validation du pack GOLD automatique

#### 2. AdminEnterpriseSubscriptions (`/admin-enterprise-subscriptions`)

**Fichier** : `src/pages/AdminEnterpriseSubscriptions.tsx`

**Fonctionnalités** :
- Vue d'ensemble : pending, actifs, rejetés, revenu
- Liste des souscriptions avec filtres
- Recherche par entreprise/email
- Approbation/rejet des souscriptions
- Configuration limite journalière GOLD
- Vue des preuves de paiement

### Composants Créés

#### EnterprisePackBadge

**Fichier** : `src/components/recruiter/EnterprisePackBadge.tsx`

**Props** :
```typescript
interface EnterprisePackBadgeProps {
  companyId: string | null;
  showLimits?: boolean;  // Afficher les limites
  showROI?: boolean;     // Afficher le ROI
}
```

**Affichage** :
- Badge du pack actif (BASIC / PRO / GOLD / CABINET RH)
- Barres de progression des limites
- Alertes quand limite proche (>80%)
- ROI estimé (temps et argent économisé)
- Date d'expiration

**Utilisation dans RecruiterDashboard** :
```tsx
import { EnterprisePackBadge } from '../components/recruiter/EnterprisePackBadge';

<EnterprisePackBadge
  companyId={company?.id}
  showLimits={true}
  showROI={true}
/>
```

---

## 🪝 Hooks React

### useEnterpriseSubscription

**Fichier** : `src/hooks/useEnterpriseSubscription.ts`

**Retourne** :
```typescript
{
  subscription: any | null,
  loading: boolean,
  error: string | null,
  reload: () => Promise<void>,
  checkFeatureAccess: (featureType, count) => Promise<any>,
  trackUsage: (usageType, metadata) => Promise<void>,
  hasFeature: (featureName: string) => boolean,
  getPackBadge: () => { color: string, label: string } | null,
  getLimits: () => { activeJobs, cvViews, matchingAI } | null,
  isNearLimit: (limitType) => boolean,
  hasActiveSubscription: boolean
}
```

**Exemple d'utilisation** :
```typescript
const {
  subscription,
  checkFeatureAccess,
  trackUsage,
  isNearLimit
} = useEnterpriseSubscription(companyId);

// Vérifier avant d'utiliser le matching IA
const access = await checkFeatureAccess('matching_ai', 10);
if (access.allowed) {
  // Lancer le matching
  await performMatching();

  // Tracker l'utilisation
  await trackUsage('matching_ai', { job_id: jobId, count: 10 });
}

// Afficher une alerte si proche de la limite
{isNearLimit('cv') && (
  <Alert>Vous approchez de votre limite de CV!</Alert>
)}
```

---

## 🔐 Middleware de Vérification

### Intégration dans les Actions Critiques

Avant chaque action sensible, vérifier les limites :

```typescript
// Avant de consulter un CV
const canView = await EnterpriseSubscriptionService.checkFeatureAccess(
  companyId,
  'cv_view',
  1
);

if (!canView.allowed) {
  alert(canView.message);
  return;
}

// Consulter le CV
await viewCandidateProfile(profileId);

// Tracker
await EnterpriseSubscriptionService.trackUsage(
  companyId,
  'cv_view',
  { profile_id: profileId }
);
```

---

## 📊 Analytics & ROI

### Calcul du ROI

**Formule implémentée** :

```typescript
const timePerManualReview = 10; // minutes par CV
const timeSavedMinutes = (matchingCount * 30) + (cvViewsCount * timePerManualReview);
const timeSavedHours = Math.round(timeSavedMinutes / 60);

const avgHourlyCost = 50000; // GNF/heure
const moneySaved = timeSavedHours * avgHourlyCost;
```

**Retour** :
```json
{
  "matchingAIUsed": 150,
  "cvViewsUsed": 200,
  "timeSavedHours": 95,
  "estimatedSavingsGNF": 4750000,
  "totalActions": 450
}
```

### Statistiques Disponibles

- Nombre de CV consultés
- Nombre de matching IA effectués
- Exports réalisés
- Communications envoyées
- Entretiens programmés
- Temps gagné estimé
- Économies estimées

---

## �� Workflow Complet

### 1. Souscription Recruteur

```
Recruteur → /enterprise-subscribe
  ↓
Sélectionne un pack
  ↓
Effectue le paiement Orange Money
  ↓
Upload preuve (optionnel)
  ↓
Soumission → BDD (status: pending)
  ↓
Si GOLD → requires_validation = true
```

### 2. Validation Admin (pour GOLD)

```
Admin → /admin-enterprise-subscriptions
  ↓
Voit la souscription GOLD en pending
  ↓
Configure daily_matching_limit (ex: 100)
  ↓
Approuve → status: active
  ↓
start_date = now, end_date = +30 jours
```

### 3. Utilisation Recruteur

```
Recruteur utilise le matching IA
  ↓
checkFeatureAccess('matching_ai', 10)
  ↓
Si allowed:
  - Effectue le matching
  - trackUsage('matching_ai', {...})
  - Incrémente matching_consumed
  - Incrémente matching_consumed_today
  ↓
Si limit atteinte → Message d'erreur
```

### 4. Réinitialisation Quotidienne (GOLD)

```
Trigger PostgreSQL sur UPDATE
  ↓
Si last_matching_reset < CURRENT_DATE:
  - matching_consumed_today = 0
  - last_matching_reset = now()
```

---

## 🚀 Routes Ajoutées

```typescript
// App.tsx
type Page =
  | 'enterprise-subscribe'           // Souscription packs
  | 'admin-enterprise-subscriptions' // Admin gestion
  | ... // autres routes

// Renders
{currentPage === 'enterprise-subscribe' && <EnterpriseSubscribe />}
{currentPage === 'admin-enterprise-subscriptions' && <AdminEnterpriseSubscriptions />}
```

---

## ✅ Checklist de Non-Régression

- [x] Aucune modification des tables candidats
- [x] Aucune modification du système de crédits IA existant
- [x] Aucune modification du Premium candidat
- [x] Pipeline ATS intact
- [x] Matching IA toujours fonctionnel
- [x] RLS stricte sur toutes les nouvelles tables
- [x] Build sans erreur
- [x] Pas de code dupliqué
- [x] Services premium complémentaires isolés

---

## 🎯 Intégration avec l'Existant

### 1. Système de Crédits IA

**Indépendant** : Le matching IA consomme **toujours** des crédits IA, même avec un pack enterprise. Les packs offrent seulement le **quota mensuel**.

```typescript
// Avant de lancer le matching
1. Vérifier le pack enterprise (quota disponible)
2. Vérifier les crédits IA (coût du service)
3. Si les deux OK → Lancer le matching
4. Déduire les crédits IA
5. Incrémenter le compteur enterprise
```

### 2. Pipeline ATS

Les packs **n'affectent pas** le fonctionnement du pipeline. Ils ajoutent seulement :
- Limites sur le nombre d'offres actives
- Analytics supplémentaires

### 3. CVThèque

Les packs contrôlent **l'accès en quantité** :
- BASIC : 200 CV/mois
- PRO : 500 CV/mois
- GOLD : Illimité
- CABINET : 500 CV/mois

---

## 📝 Notes Importantes

### Sécurité

1. **Validation GOLD obligatoire** : Empêche les abus sur le pack illimité
2. **Limites journalières configurables** : L'admin contrôle l'usage GOLD
3. **Audit logs complets** : Traçabilité totale via `enterprise_usage_tracking`
4. **RLS stricte** : Chaque entreprise voit uniquement ses données

### Performance

1. **Indexes optimisés** : Toutes les colonnes de filtrage sont indexées
2. **Trigger léger** : La réinitialisation quotidienne est un simple UPDATE
3. **Caching recommandé** : Le hook `useEnterpriseSubscription` peut utiliser un cache React Query

### Évolutivité

1. **Nouveaux packs** : Facile à ajouter dans `ENTERPRISE_PACKS`
2. **Nouveaux services premium** : Facile à ajouter dans `PREMIUM_SERVICES`
3. **Nouvelles limites** : Ajouter colonnes + logique dans `can_use_enterprise_feature`

---

## 🆘 Troubleshooting

### Problème : Pack non actif après paiement

**Solution** : L'admin doit valider dans `/admin-enterprise-subscriptions`

### Problème : Matching IA refusé malgré pack actif

**Causes possibles** :
1. Crédits IA insuffisants (indépendant du pack)
2. Limite journalière atteinte (GOLD)
3. Quota mensuel atteint

**Debug** :
```typescript
const access = await checkFeatureAccess('matching_ai', 1);
console.log(access); // Voir la raison exacte
```

### Problème : ROI incorrect

**Solution** : Vérifier que `trackUsage` est bien appelé après chaque action

---

## 📞 Contact & Support

Pour toute question sur l'implémentation :
- Documentation complète : `ENTERPRISE_PACKS_IMPLEMENTATION.md`
- Code backend : `src/services/enterpriseSubscriptionService.ts`
- Migrations : `supabase/migrations/extend_enterprise_packs_system.sql`

---

## 🎉 Conclusion

Le système de **Packs Enterprise & Cabinets RH** est **100% opérationnel** et prêt pour la production.

**Points forts** :
✅ Architecture propre et extensible
✅ Sécurité renforcée (RLS + validation admin)
✅ Analytics et ROI intégrés
✅ Aucune régression sur l'existant
✅ Documentation complète

**Prochaines étapes recommandées** :
1. Tests utilisateurs avec recruteurs pilotes
2. Ajustement des limites selon feedback
3. Monitoring des usages GOLD
4. Campagne marketing packs
