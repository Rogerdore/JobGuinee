# Documentation - Workflow Complet de Consommation des Crédits IA

## 🎯 Vue d'ensemble

Ce document décrit le système complet et unifié de consommation des crédits IA pour la plateforme JobGuinée. Le système permet une gestion centralisée, sécurisée et traçable de tous les services IA nécessitant des crédits.

---

## 📊 Architecture du Système

### Schéma Fonctionnel

```
┌─────────────────┐
│  Composant UI   │
│  (Bouton Action)│
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  useCreditService Hook  │
│  - consumeCredits()     │
│  - checkSufficient()    │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   CreditService Class   │
│   (TypeScript)          │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Supabase RPC Function  │
│  use_ai_credits()       │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Base de Données        │
│  - profiles             │
│  - credit_transactions  │
│  - service_credit_costs │
│  - ai_service_usage_    │
│    history              │
└─────────────────────────┘
```

---

## 🗂️ Structure des Fichiers

### Fichiers Créés

#### 1. `/src/services/creditService.ts`
**Service principal de gestion des crédits**

Classes et fonctions :
- `CreditService` : Classe principale avec méthodes statiques
- `getServiceConfig()` : Récupère la configuration d'un service
- `getUserBalance()` : Récupère le solde d'un utilisateur
- `checkSufficientCredits()` : Vérifie si l'utilisateur a assez de crédits
- `consumeCredits()` : Consomme les crédits pour un service
- `getTransactionHistory()` : Récupère l'historique des transactions
- `getAllServices()` : Liste tous les services disponibles
- `getUsageHistory()` : Historique d'utilisation des services IA

Constantes :
```typescript
export const SERVICES = {
  AI_CV_GENERATION: 'ai_cv_generation',
  AI_COVER_LETTER: 'ai_cover_letter_generation',
  AI_JOB_MATCHING: 'job_matching',
  AI_PROFILE_ANALYSIS: 'profile_analysis',
  AI_INTERVIEW_COACHING: 'interview_coaching',
  AI_CAREER_PATH: 'career_path_planning',
  PROFILE_VISIBILITY_BOOST: 'profile_visibility_boost',
  FEATURED_APPLICATION: 'featured_application',
  DIRECT_MESSAGE_RECRUITER: 'direct_message_recruiter'
} as const;
```

#### 2. `/src/hooks/useCreditService.ts`
**Hooks React pour faciliter l'utilisation**

Hooks disponibles :
- `useCreditBalance()` : Affiche le solde en temps réel
- `useConsumeCredits()` : Consomme des crédits avec gestion d'état
- `useCreditHistory()` : Affiche l'historique des transactions
- `useServicesList()` : Liste tous les services
- `useServiceCost()` : Récupère le coût d'un service spécifique

#### 3. `/src/components/credits/CreditBalance.tsx`
**Composant d'affichage du solde**

Props :
- `showDetails` : Affiche les détails du solde
- `className` : Classes CSS personnalisées

Fonctionnalités :
- Affichage en temps réel
- Bouton de rafraîchissement
- Alerte si solde faible (< 50 crédits)
- Gestion des états de chargement et d'erreur

#### 4. `/src/components/credits/ServiceCostBadge.tsx`
**Badge affichant le coût d'un service**

Props :
- `serviceCode` : Code du service
- `showName` : Afficher le nom du service
- `className` : Classes CSS personnalisées

#### 5. `/src/components/credits/CreditConfirmModal.tsx`
**Modal de confirmation avant consommation**

Props :
- `isOpen` : État d'ouverture
- `onClose` : Callback de fermeture
- `onConfirm` : Callback après confirmation
- `serviceCode` : Code du service
- `serviceName` : Nom du service
- `serviceCost` : Coût en crédits
- `description` : Description optionnelle
- `inputPayload` : Données d'entrée à enregistrer

Fonctionnalités :
- Vérification automatique du solde
- Affichage du solde avant/après
- Alertes si solde insuffisant
- Alertes si solde faible après consommation
- État de chargement pendant le traitement

#### 6. `/src/components/credits/CreditServiceExample.tsx`
**Composant de démonstration**

Utilisations démontrées :
- Consommation avec modal de confirmation
- Consommation directe sans confirmation
- Exemples de code pour les développeurs

---

## 🔧 Base de Données

### Tables Utilisées

#### 1. `profiles`
Solde de crédits de l'utilisateur
```sql
credits_balance INTEGER DEFAULT 0
```

#### 2. `service_credit_costs`
Configuration des services IA
```sql
- id (uuid)
- service_code (text) - Code unique du service
- service_name (text) - Nom affiché
- credits_cost (integer) - Coût en crédits
- is_active (boolean) - Service actif/inactif
- category (text) - Catégorie du service
```

#### 3. `credit_transactions`
Historique de toutes les transactions
```sql
- id (uuid)
- user_id (uuid)
- transaction_type (text) - 'usage', 'purchase', 'admin_add', etc.
- credits_amount (integer) - Montant (négatif pour usage)
- service_code (text) - Service concerné
- description (text)
- balance_before (integer)
- balance_after (integer)
- created_at (timestamp)
```

#### 4. `ai_service_usage_history`
Historique détaillé des utilisations IA
```sql
- id (uuid)
- user_id (uuid)
- service_code (text)
- service_name (text)
- credits_consumed (integer)
- balance_before (integer)
- balance_after (integer)
- input_payload (jsonb) - Données d'entrée
- output_response (jsonb) - Données de sortie
- metadata (jsonb)
- created_at (timestamp)
```

### Fonction SQL Principale

#### `use_ai_credits(p_user_id, p_service_key, p_input_payload, p_output_response)`

**Cette fonction existe déjà et est optimisée.**

Workflow :
1. Récupère la configuration du service depuis `service_credit_costs`
2. Vérifie que le service est actif
3. Récupère le solde de l'utilisateur
4. Vérifie que le solde est suffisant
5. Déduit les crédits de `profiles.credits_balance`
6. Enregistre la transaction dans `credit_transactions`
7. Enregistre l'utilisation dans `ai_service_usage_history`
8. Retourne le résultat avec nouveau solde

Retour JSON :
```json
{
  "success": true,
  "credits_remaining": 150,
  "credits_consumed": 50,
  "usage_id": "uuid",
  "service_name": "Génération de CV IA",
  "message": "Service exécuté avec succès"
}
```

En cas d'erreur :
```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDITS",
  "message": "Crédits insuffisants. Requis: 50, Disponible: 30",
  "required_credits": 50,
  "available_credits": 30
}
```

---

## 🚀 Guide d'Utilisation

### Utilisation Basique (Avec Modal de Confirmation)

```typescript
import { useState } from 'react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import CreditConfirmModal from '../../components/credits/CreditConfirmModal';

function MyAIComponent() {
  const [showConfirm, setShowConfirm] = useState(false);
  const { consumeCredits } = useConsumeCredits();

  const handleGenerateCV = async (success: boolean, result?: any) => {
    if (success) {
      console.log('Crédits consommés:', result.credits_consumed);
      console.log('Crédits restants:', result.credits_remaining);

      // Continuer avec la génération du CV
      await actuallyGenerateCV();
    } else {
      alert(result.message);
    }
  };

  return (
    <>
      <button onClick={() => setShowConfirm(true)}>
        Générer un CV avec l'IA
      </button>

      <CreditConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleGenerateCV}
        serviceCode={SERVICES.AI_CV_GENERATION}
        serviceName="Génération de CV IA"
        serviceCost={50}
        description="Créez un CV professionnel avec l'IA"
      />
    </>
  );
}
```

### Utilisation Directe (Sans Modal)

```typescript
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';

function MyComponent() {
  const { consumeCredits, consuming } = useConsumeCredits();

  const handleAction = async () => {
    const inputData = {
      profile: userData,
      preferences: userPreferences
    };

    const result = await consumeCredits(
      SERVICES.AI_JOB_MATCHING,
      inputData
    );

    if (result.success) {
      console.log('✅ Crédits consommés avec succès');
      console.log('Nouveau solde:', result.credits_remaining);

      // Continuer avec votre logique
      await performMatching(inputData);
    } else {
      console.error('❌ Erreur:', result.message);

      if (result.error === 'INSUFFICIENT_CREDITS') {
        // Rediriger vers la page d'achat de crédits
        navigate('/buy-credits');
      }
    }
  };

  return (
    <button
      onClick={handleAction}
      disabled={consuming}
    >
      {consuming ? 'Traitement...' : 'Lancer le matching IA'}
    </button>
  );
}
```

### Vérification Préalable

```typescript
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';

function MyComponent() {
  const { checkSufficient } = useConsumeCredits();

  const handleClick = async () => {
    const check = await checkSufficient(SERVICES.AI_CV_GENERATION);

    if (!check.sufficient) {
      alert(`Vous avez besoin de ${check.required} crédits mais vous n'en avez que ${check.available}`);
      // Proposer d'acheter des crédits
      return;
    }

    // Continuer...
  };

  return <button onClick={handleClick}>Générer CV</button>;
}
```

### Afficher le Solde

```typescript
import CreditBalance from '../../components/credits/CreditBalance';

function Header() {
  return (
    <header>
      <CreditBalance showDetails className="ml-auto" />
    </header>
  );
}
```

### Afficher le Coût d'un Service

```typescript
import ServiceCostBadge from '../../components/credits/ServiceCostBadge';
import { SERVICES } from '../../services/creditService';

function ServiceCard() {
  return (
    <div className="service-card">
      <h3>Génération de CV IA</h3>
      <ServiceCostBadge
        serviceCode={SERVICES.AI_CV_GENERATION}
        showName
      />
    </div>
  );
}
```

---

## 🔐 Sécurité

### Vérifications Automatiques

1. **Authentification**
   - La fonction SQL vérifie `auth.uid()`
   - Impossible de consommer des crédits sans être connecté

2. **Validation du Service**
   - Le service doit exister dans `service_credit_costs`
   - Le service doit être actif (`is_active = true`)

3. **Validation du Solde**
   - Vérification stricte : `solde >= coût`
   - Retour d'erreur explicite si insuffisant

4. **Traçabilité Complète**
   - Chaque opération enregistrée dans `credit_transactions`
   - Chaque utilisation enregistrée dans `ai_service_usage_history`
   - Horodatage automatique
   - Enregistrement des payloads input/output

### Bonnes Pratiques

✅ **À FAIRE :**
- Toujours utiliser `SERVICES` constants
- Vérifier `result.success` avant de continuer
- Enregistrer les `input_payload` et `output_response` pour audit
- Gérer les erreurs `INSUFFICIENT_CREDITS` en proposant l'achat
- Rafraîchir le solde après chaque opération

❌ **À ÉVITER :**
- Ne jamais hardcoder les codes de service
- Ne pas ignorer les erreurs
- Ne pas bypasser la vérification de crédits
- Ne pas modifier manuellement `credits_balance`

---

## 📈 Services Disponibles

| Service Code | Nom | Coût | Catégorie |
|-------------|-----|------|-----------|
| `ai_cv_generation` | Génération de CV IA | Variable | IA & Analyse |
| `ai_cover_letter_generation` | Lettre de motivation IA | Variable | IA & Analyse |
| `job_matching` | Matching Emplois IA | 20 | IA & Analyse |
| `profile_analysis` | Analyse de profil | Variable | IA & Analyse |
| `interview_coaching` | Coaching Entretien IA | 100 | Formation |
| `career_path_planning` | Plan de carrière IA | Variable | Formation |
| `profile_visibility_boost` | Boost Visibilité | 200 | Visibilité |
| `featured_application` | Candidature Prioritaire | 50 | Candidature |
| `direct_message_recruiter` | Message Direct Recruteur | 30 | Communication |

**Note :** Les coûts peuvent être configurés dynamiquement via la table `service_credit_costs`.

---

## 🛠️ Gestion des Erreurs

### Codes d'Erreur

| Code | Description | Action Recommandée |
|------|-------------|-------------------|
| `SERVICE_NOT_FOUND` | Service inexistant | Vérifier le code du service |
| `SERVICE_INACTIVE` | Service désactivé | Notifier l'utilisateur |
| `INSUFFICIENT_CREDITS` | Crédits insuffisants | Proposer l'achat de crédits |
| `NOT_AUTHENTICATED` | Utilisateur non connecté | Rediriger vers login |
| `RPC_ERROR` | Erreur SQL | Logger et notifier support |
| `INTERNAL_ERROR` | Erreur interne | Logger et afficher message générique |

### Gestion d'Erreur Type

```typescript
const result = await consumeCredits(serviceCode, inputData);

switch (result.error) {
  case 'INSUFFICIENT_CREDITS':
    // Proposer d'acheter des crédits
    navigate('/premium-ai?action=buy');
    break;

  case 'SERVICE_INACTIVE':
    alert('Ce service est temporairement indisponible');
    break;

  case 'NOT_AUTHENTICATED':
    navigate('/login');
    break;

  default:
    alert(result.message);
}
```

---

## 📊 Monitoring & Analytics

### Données Disponibles

1. **Transactions par utilisateur**
```typescript
const transactions = await CreditService.getTransactionHistory(userId, 100);
```

2. **Historique d'utilisation des services**
```typescript
const usages = await CreditService.getUsageHistory(userId, 50);
```

3. **Statistiques globales**
Via la table `credit_transactions` :
- Total des crédits distribués
- Total des crédits consommés
- Services les plus utilisés
- Taux de conversion

### Requêtes SQL Utiles

**Services les plus utilisés :**
```sql
SELECT
  service_code,
  COUNT(*) as usage_count,
  SUM(credits_consumed) as total_credits
FROM ai_service_usage_history
GROUP BY service_code
ORDER BY usage_count DESC;
```

**Utilisateurs à faible solde :**
```sql
SELECT id, email, full_name, credits_balance
FROM profiles
WHERE credits_balance < 50
AND user_type = 'candidate'
ORDER BY credits_balance ASC;
```

---

## 🔄 Workflow Complet Détaillé

### Étape 1 : Initialisation
```typescript
// L'utilisateur clique sur un bouton service IA
<button onClick={handleUseService}>
  Utiliser le service
</button>
```

### Étape 2 : Vérification (Optionnelle)
```typescript
const check = await checkSufficient(serviceCode);
if (!check.sufficient) {
  // Afficher message d'erreur
  // Proposer achat de crédits
  return;
}
```

### Étape 3 : Consommation
```typescript
const result = await consumeCredits(
  serviceCode,
  inputPayload,  // Données envoyées au service
  outputResponse // Résultat du service (après génération)
);
```

### Étape 4 : Traitement du Résultat
```typescript
if (result.success) {
  // ✅ Succès
  // - Crédits déduits
  // - Transaction enregistrée
  // - Usage tracé
  // - Nouveau solde disponible dans result.credits_remaining

  proceedWithService();
} else {
  // ❌ Échec
  handleError(result.error, result.message);
}
```

### Étape 5 : Rafraîchissement UI
```typescript
// Le hook useCreditBalance se met à jour automatiquement
// après la consommation réussie
```

---

## 🎨 Personnalisation

### Ajouter un Nouveau Service

1. **Ajouter dans la base de données :**
```sql
INSERT INTO service_credit_costs (
  service_code,
  service_name,
  credits_cost,
  is_active,
  category
) VALUES (
  'new_service_code',
  'Nom du Service',
  75,
  true,
  'IA & Analyse'
);
```

2. **Ajouter la constante :**
```typescript
// Dans src/services/creditService.ts
export const SERVICES = {
  // ... services existants
  NEW_SERVICE: 'new_service_code'
} as const;
```

3. **Utiliser :**
```typescript
await consumeCredits(SERVICES.NEW_SERVICE, inputData);
```

---

## 🧪 Tests

### Test Manuel

Utilisez le composant `CreditServiceExample` :
```typescript
import CreditServiceExample from './components/credits/CreditServiceExample';

// Dans votre App ou page de test
<CreditServiceExample />
```

### Test Unitaire (Recommandé)

```typescript
import { CreditService } from './services/creditService';

describe('CreditService', () => {
  it('should fetch user balance', async () => {
    const balance = await CreditService.getUserBalance(userId);
    expect(balance).toBeDefined();
    expect(balance.credits_available).toBeGreaterThanOrEqual(0);
  });

  it('should check sufficient credits', async () => {
    const check = await CreditService.checkSufficientCredits(
      userId,
      'job_matching'
    );
    expect(check).toHaveProperty('sufficient');
    expect(check).toHaveProperty('required');
    expect(check).toHaveProperty('available');
  });
});
```

---

## 📝 Fonctions SQL Existantes (Nettoyage Recommandé)

### Fonctions Redondantes Détectées

Ces fonctions existent mais sont **doublons** de `use_ai_credits` :

1. ~~`consume_global_credits`~~ → Utiliser `use_ai_credits`
2. ~~`consume_service_credits`~~ → Utiliser `use_ai_credits`
3. ~~`use_credits_for_service`~~ (2 versions) → Utiliser `use_ai_credits`
4. ~~`use_service_credits`~~ (2 versions) → Utiliser `use_ai_credits`

### Recommandation

**Supprimer ces fonctions** et uniformiser sur `use_ai_credits` qui est la plus complète et la mieux documentée.

---

## ✅ Checklist d'Intégration

Avant d'utiliser un service IA dans votre composant :

- [ ] Importer `useConsumeCredits` ou `CreditService`
- [ ] Importer la constante `SERVICES`
- [ ] Vérifier que le service existe dans `service_credit_costs`
- [ ] Implémenter la vérification du solde (optionnel)
- [ ] Appeler `consumeCredits()` avec le bon service code
- [ ] Gérer le cas `result.success === false`
- [ ] Gérer spécifiquement `INSUFFICIENT_CREDITS`
- [ ] Enregistrer les `input_payload` et `output_response`
- [ ] Tester le workflow complet

---

## 🚀 Résumé des Avantages

### ✅ Centralisé
- Un seul service TypeScript
- Une seule fonction SQL principale
- Un seul point de maintenance

### ✅ Sécurisé
- Authentification automatique
- Validation stricte du solde
- Traçabilité complète

### ✅ Réutilisable
- Hooks React prêts à l'emploi
- Composants UI inclus
- Facile à intégrer partout

### ✅ Traçable
- Historique complet dans `credit_transactions`
- Détails d'usage dans `ai_service_usage_history`
- Input/Output enregistrés pour audit

### ✅ Maintenable
- Code TypeScript typé
- Documentation complète
- Exemples d'utilisation

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs console**
   - Tous les appels loggent les erreurs

2. **Vérifier la base de données**
   - `service_credit_costs` : Le service existe-t-il ?
   - `profiles.credits_balance` : Le solde est-il correct ?

3. **Tester avec l'exemple**
   - Utilisez `CreditServiceExample` pour isoler le problème

4. **Vérifier Supabase**
   - La fonction `use_ai_credits` est-elle créée ?
   - Les RLS policies sont-elles correctes ?

---

## 📅 Historique des Versions

### v1.0 - 1er Décembre 2025
- ✅ Création du service `CreditService`
- ✅ Création des hooks React
- ✅ Création des composants UI
- ✅ Utilisation de la fonction SQL `use_ai_credits` existante
- ✅ Documentation complète

---

**Système prêt pour la production** ✅
