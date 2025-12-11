# Documentation : Contrôle d'accès IA dans le Chatbot

## Vue d'ensemble

Ce système assure qu'aucun service IA ne peut être utilisé via le chatbot sans vérification préalable des droits d'accès. Il intègre le statut Premium, les quotas quotidiens, et le solde de crédits pour garantir un contrôle centralisé et cohérent.

## Architecture

### Composants principaux

1. **ChatbotIAAccessControl** (`src/services/chatbotIAAccessControl.ts`)
   - Module centralisé de contrôle d'accès
   - Vérifie les permissions avant tout accès à un service IA
   - Gère les messages d'erreur et les actions suggérées

2. **ChatbotNavigationService** (enrichi)
   - Détecte si une intention est liée à un service IA
   - Récupère le code service correspondant à une route

3. **ChatbotWindow** (mis à jour)
   - Appelle le contrôle d'accès avant navigation vers un service IA
   - Affiche les messages de refus avec boutons d'action

4. **ChatMessage** (enrichi)
   - Affiche les boutons d'action pour résoudre les blocages
   - Supporte les redirections vers achat crédits ou Premium

## Module ChatbotIAAccessControl

### Services IA reconnus

Le système reconnaît automatiquement ces routes comme services IA :

| Route | Code Service | Description |
|-------|-------------|-------------|
| `ai-cv-generator` | `ai_cv_builder` | Générateur de CV IA |
| `ai-cover-letter` | `ai_cover_letter` | Générateur de lettre de motivation |
| `ai-matching` | `ai_job_matching` | Analyse de compatibilité emploi |
| `ai-coach` | `ai_career_coaching` | Coaching carrière IA |
| `ai-career-plan` | `ai_career_plan` | Plan de carrière personnalisé |
| `ai-interview-simulator` | `ai_interview_simulator` | Simulateur d'entretien |
| `ai-alerts` | `ai_job_alerts` | Alertes emploi intelligentes |
| `ai-chat` | `ai_chatbot` | Chat IA conversationnel |
| `gold-profile` | `ai_gold_profile` | Profil Gold Premium |

### Interface EnhancedUserContext

```typescript
interface EnhancedUserContext {
  userId: string | null;
  isAuthenticated: boolean;
  isPremium: boolean;
  isPremiumActive: boolean;
  premiumExpiration: string | null;
  creditsBalance: number;
  daysRemainingPremium: number | null;
  userType: string | null;
}
```

**Champs clés :**
- `isPremium` : L'utilisateur a-t-il un abonnement Premium (actif ou expiré)
- `isPremiumActive` : L'abonnement Premium est-il actuellement valide
- `creditsBalance` : Nombre de crédits IA disponibles
- `daysRemainingPremium` : Jours restants avant expiration Premium

### Interface IAAccessResult

```typescript
interface IAAccessResult {
  allowed: boolean;
  reason:
    | 'access_granted'
    | 'not_authenticated'
    | 'insufficient_credits'
    | 'premium_quota_reached'
    | 'service_inactive'
    | 'premium_expired'
    | 'service_not_found';
  message: string;
  requiredCredits?: number;
  currentCredits?: number;
  dailyActionsUsed?: number;
  dailyLimit?: number;
  suggestedAction?: 'buy_credits' | 'subscribe_premium' | 'renew_premium' | 'wait_reset' | 'login';
}
```

**Actions suggérées :**
- `login` : Rediriger vers la page de connexion
- `buy_credits` : Acheter des crédits IA
- `subscribe_premium` : S'abonner à Premium PRO+
- `renew_premium` : Renouveler l'abonnement Premium expiré
- `wait_reset` : Attendre la réinitialisation du quota à minuit

## Méthodes principales

### `checkIAAccess(serviceCode, userContext)`

Vérifie si l'utilisateur peut accéder à un service IA.

**Logique de vérification (ordre) :**

1. **Authentification**
   - Si non connecté → `not_authenticated`
   - Suggère : `login`

2. **Existence du service**
   - Si service inconnu → `service_not_found`
   - Aucune action suggérée

3. **Activation du service**
   - Si service désactivé → `service_inactive`
   - Aucune action suggérée

4. **Premium actif**
   - Si Premium actif → Vérifier quotas Premium
     - Si quota OK → `access_granted`
     - Si quota dépassé → `premium_quota_reached`, suggère `wait_reset`

5. **Premium expiré**
   - Si Premium expiré → `premium_expired`
   - Suggère : `renew_premium`

6. **Utilisateur gratuit**
   - Si service gratuit (0 crédits) → `access_granted`
   - Si crédits insuffisants → `insufficient_credits`
   - Suggère : `buy_credits` et `subscribe_premium`
   - Si crédits suffisants → `access_granted`

**Exemple d'utilisation :**

```typescript
const accessResult = await ChatbotIAAccessControl.checkIAAccess(
  'ai_cv_builder',
  enhancedUserContext
);

if (!accessResult.allowed) {
  console.log(accessResult.reason);
  console.log(accessResult.message);
  console.log(accessResult.suggestedAction);
}
```

### `buildEnhancedUserContext(userId, profile)`

Construit un contexte utilisateur enrichi à partir du profil.

**Calculs automatiques :**
- Vérifie si Premium est actif via `isPremiumActive()`
- Calcule les jours restants avant expiration
- Récupère le solde de crédits

**Exemple :**

```typescript
const enhanced = await ChatbotIAAccessControl.buildEnhancedUserContext(
  user.id,
  profile
);

console.log(enhanced.isPremiumActive); // true/false
console.log(enhanced.creditsBalance); // 250
console.log(enhanced.daysRemainingPremium); // 15
```

### `formatAccessMessage(result)`

Formate un message utilisateur lisible selon le résultat d'accès.

**Messages types :**

| Raison | Emoji | Message type |
|--------|-------|--------------|
| `access_granted` | ✓ | Message de confirmation |
| `not_authenticated` | 🔒 | Invitation à se connecter |
| `insufficient_credits` | 💰 | Alerte crédits avec suggestion d'achat |
| `premium_quota_reached` | ⏰ | Info quota avec heure de reset |
| `service_inactive` | ⚠️ | Service temporairement indisponible |
| `premium_expired` | 👑 | Invitation à renouveler Premium |
| `service_not_found` | ❌ | Service introuvable |

**Exemple :**

```typescript
const message = ChatbotIAAccessControl.formatAccessMessage(accessResult);

// "💰 Crédits insuffisants. Ce service nécessite 50 crédits, vous en avez 20.
//
// Achetez des crédits pour continuer à utiliser les services IA."
```

### `getActionButtons(result)`

Génère les boutons d'action appropriés selon le blocage.

**Boutons par cas :**

| Cas | Bouton principal | Bouton secondaire |
|-----|-----------------|-------------------|
| Non authentifié | Se connecter | - |
| Crédits insuffisants | Acheter des crédits | Passer Premium PRO+ |
| Premium expiré | Renouveler Premium | - |
| Quota atteint | Voir d'autres services | - |

**Exemple :**

```typescript
const buttons = ChatbotIAAccessControl.getActionButtons(accessResult);

// [
//   { label: "Acheter des crédits", action: "navigate:credit-store", variant: "primary" },
//   { label: "Passer Premium PRO+", action: "navigate:premium-subscribe", variant: "secondary" }
// ]
```

## Intégration dans ChatbotWindow

### 1. Chargement du contexte utilisateur

Au chargement du chatbot, le `EnhancedUserContext` est construit :

```typescript
const loadUserContext = async () => {
  if (user && settings.enable_premium_detection) {
    const context = await ChatbotService.getUserContext(user.id);
    setUserContext(context);

    const enhanced = await ChatbotIAAccessControl.buildEnhancedUserContext(
      user.id,
      profile
    );
    setEnhancedUserContext(enhanced);
  }
};
```

Le contexte se recharge automatiquement quand `user` ou `profile` changent.

### 2. Détection de navigation IA

Quand l'utilisateur demande d'ouvrir un service IA :

```typescript
const handleNavigationConfirm = async (intent: NavigationIntent) => {
  const isIAService = ChatbotNavigationService.isIAServiceIntent(intent);

  if (isIAService && enhancedUserContext) {
    const serviceCode = ChatbotNavigationService.getIAServiceCode(intent);

    if (serviceCode) {
      const accessResult = await ChatbotIAAccessControl.checkIAAccess(
        serviceCode as ServiceCode,
        enhancedUserContext
      );

      if (!accessResult.allowed) {
        // Afficher le message de refus
        const formattedMessage = ChatbotIAAccessControl.formatAccessMessage(accessResult);
        const actionButtons = ChatbotIAAccessControl.getActionButtons(accessResult);

        addBotMessage(
          formattedMessage,
          undefined,
          undefined,
          false,
          undefined,
          actionButtons.length > 0 ? actionButtons : undefined
        );
        return;
      }
    }
  }

  // Si autorisé, naviguer normalement
  if (onNavigate) {
    onNavigate(intent.route);
    addBotMessage(`✓ Je vous ai dirigé vers ${intent.displayName}.`);
  }
};
```

### 3. Affichage des boutons d'action

Le composant `ChatMessage` affiche les boutons si présents :

```tsx
{!isUser && message.actionButtons && message.actionButtons.length > 0 && (
  <div className="mt-3 flex flex-wrap gap-2">
    {message.actionButtons.map((button, index) => (
      <button
        key={index}
        onClick={() => {
          const [actionType, actionValue] = button.action.split(':');
          if (actionType === 'navigate' && onNavigate) {
            handleLinkClick(actionValue);
          }
        }}
        className={`flex-1 min-w-fit px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          button.variant === 'primary'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {button.label}
      </button>
    ))}
  </div>
)}
```

## Scénarios de vérification

### Scénario 1 : Utilisateur non connecté

**Contexte :**
```typescript
{
  userId: null,
  isAuthenticated: false,
  isPremium: false,
  isPremiumActive: false,
  creditsBalance: 0
}
```

**Tentative :** Accéder au générateur de CV

**Résultat :**
```typescript
{
  allowed: false,
  reason: 'not_authenticated',
  message: 'Vous devez être connecté pour utiliser ce service IA.',
  suggestedAction: 'login'
}
```

**Message chatbot :**
```
🔒 Vous devez être connecté pour utiliser ce service IA.

Connectez-vous pour accéder aux services IA.

[Se connecter]
```

### Scénario 2 : Utilisateur Premium PRO+ actif

**Contexte :**
```typescript
{
  userId: 'abc123',
  isAuthenticated: true,
  isPremium: true,
  isPremiumActive: true,
  creditsBalance: 50,
  daysRemainingPremium: 25
}
```

**Configuration service :**
- `enable_premium_limits = false` (pas de quota Premium)

**Tentative :** Accéder au générateur de CV

**Résultat :**
```typescript
{
  allowed: true,
  reason: 'access_granted',
  message: 'Accès Premium illimité au service "Générateur de CV IA".'
}
```

**Message chatbot :**
```
✓ Je vous ai dirigé vers Générateur de CV.
```

### Scénario 3 : Premium avec quota quotidien atteint

**Contexte :**
```typescript
{
  userId: 'abc123',
  isAuthenticated: true,
  isPremium: true,
  isPremiumActive: true,
  creditsBalance: 0,
  daysRemainingPremium: 25
}
```

**Configuration service :**
- `enable_premium_limits = true`
- `premium_daily_limit = 5`

**Usage aujourd'hui :** 5/5

**Tentative :** Accéder au générateur de CV

**Résultat :**
```typescript
{
  allowed: false,
  reason: 'premium_quota_reached',
  message: 'Limite quotidienne atteinte pour ce service (5 utilisations par jour). Réinitialisée à minuit.',
  dailyActionsUsed: 5,
  dailyLimit: 5,
  suggestedAction: 'wait_reset'
}
```

**Message chatbot :**
```
⏰ Limite quotidienne atteinte pour ce service (5 utilisations par jour). Réinitialisée à minuit.

Votre quota sera réinitialisé à minuit.

[Voir d'autres services]
```

### Scénario 4 : Premium expiré

**Contexte :**
```typescript
{
  userId: 'abc123',
  isAuthenticated: true,
  isPremium: true,
  isPremiumActive: false,
  premiumExpiration: '2024-11-01',
  creditsBalance: 0
}
```

**Tentative :** Accéder au générateur de CV (coût 50 crédits)

**Résultat :**
```typescript
{
  allowed: false,
  reason: 'premium_expired',
  message: 'Votre abonnement Premium a expiré. Veuillez le renouveler pour continuer à utiliser les services IA sans crédits.',
  suggestedAction: 'renew_premium'
}
```

**Message chatbot :**
```
👑 Votre abonnement Premium a expiré. Veuillez le renouveler pour continuer à utiliser les services IA sans crédits.

Renouvelez votre abonnement Premium PRO+ pour un accès illimité.

[Renouveler Premium]
```

### Scénario 5 : Utilisateur gratuit avec crédits suffisants

**Contexte :**
```typescript
{
  userId: 'abc123',
  isAuthenticated: true,
  isPremium: false,
  isPremiumActive: false,
  creditsBalance: 200
}
```

**Tentative :** Accéder au générateur de CV (coût 50 crédits)

**Résultat :**
```typescript
{
  allowed: true,
  reason: 'access_granted',
  message: 'Accès autorisé. 50 crédits seront débités lors de l\'utilisation.',
  requiredCredits: 50,
  currentCredits: 200
}
```

**Message chatbot :**
```
✓ Je vous ai dirigé vers Générateur de CV.
```

### Scénario 6 : Utilisateur gratuit sans crédits

**Contexte :**
```typescript
{
  userId: 'abc123',
  isAuthenticated: true,
  isPremium: false,
  isPremiumActive: false,
  creditsBalance: 20
}
```

**Tentative :** Accéder au générateur de CV (coût 50 crédits)

**Résultat :**
```typescript
{
  allowed: false,
  reason: 'insufficient_credits',
  message: 'Crédits insuffisants. Ce service nécessite 50 crédits, vous en avez 20.',
  requiredCredits: 50,
  currentCredits: 20,
  suggestedAction: 'buy_credits'
}
```

**Message chatbot :**
```
💰 Crédits insuffisants. Ce service nécessite 50 crédits, vous en avez 20.

Achetez des crédits pour continuer à utiliser les services IA.

[Acheter des crédits]  [Passer Premium PRO+]
```

### Scénario 7 : Service IA désactivé

**Contexte :**
```typescript
{
  userId: 'abc123',
  isAuthenticated: true,
  isPremium: true,
  isPremiumActive: true,
  creditsBalance: 1000
}
```

**Configuration service :**
- `is_active = false`

**Tentative :** Accéder au générateur de CV

**Résultat :**
```typescript
{
  allowed: false,
  reason: 'service_inactive',
  message: 'Le service "Générateur de CV IA" est temporairement désactivé.'
}
```

**Message chatbot :**
```
⚠️ Le service "Générateur de CV IA" est temporairement désactivé.

Nous travaillons à le rétablir au plus vite.
```

## Flux complet d'une demande IA

```
┌──────────────────────────────────────────────┐
│ 1. Utilisateur : "Ouvre le générateur de CV"│
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 2. ChatbotNavigationService détecte          │
│    l'intention de navigation                 │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 3. isIAServiceIntent() → true                │
│    getIAServiceCode() → 'ai_cv_builder'      │
└──────────────────┬───────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│ 4. checkIAAccess(serviceCode, userContext)  │
│    - Authentification ?                      │
│    - Service actif ?                         │
│    - Premium actif ?                         │
│    - Quota disponible ?                      │
│    - Crédits suffisants ?                    │
└──────────────────┬───────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼                   ▼
    [AUTORISÉ]          [REFUSÉ]
         │                   │
         │                   ▼
         │      ┌──────────────────────────┐
         │      │ formatAccessMessage()    │
         │      │ getActionButtons()       │
         │      └──────────┬───────────────┘
         │                 │
         │                 ▼
         │      ┌──────────────────────────┐
         │      │ Afficher message + boutons│
         │      └──────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 5. Navigation vers la page du service       │
│    onNavigate(intent.route)                  │
└──────────────────────────────────────────────┘
```

## Configuration des quotas Premium

Pour activer les quotas Premium sur un service spécifique :

```sql
UPDATE ia_service_config
SET
  enable_premium_limits = true,
  premium_daily_limit = 10
WHERE service_code = 'ai_cv_builder';
```

**Paramètres :**
- `enable_premium_limits` : Active/désactive les quotas Premium pour ce service
- `premium_daily_limit` : Nombre d'utilisations quotidiennes autorisées
- Si `premium_daily_limit = 0` ou `NULL` : Illimité même si quotas activés

**Usage recommandé :**
- Services légers (CV, lettre) : Quotas désactivés (illimité)
- Services coûteux (matching avancé, coaching long) : Quotas activés (10-20/jour)

## Vérification de l'historique d'usage

Pour voir l'usage quotidien d'un utilisateur :

```sql
SELECT
  service_code,
  COUNT(*) as usage_count,
  DATE(created_at) as usage_date
FROM ai_service_usage_history
WHERE user_id = 'abc123'
  AND created_at >= CURRENT_DATE
GROUP BY service_code, DATE(created_at);
```

## Messages chatbot personnalisés

### Messages d'accès refusé

Tous les messages sont formatés avec emoji + message explicatif + solution :

**Template général :**
```
[EMOJI] [Message explicatif]

[Explication contextuelle ou conseil]

[Bouton Action Principal]  [Bouton Action Secondaire]
```

**Exemples :**

#### Non authentifié
```
🔒 Vous devez être connecté pour utiliser ce service IA.

Connectez-vous pour accéder aux services IA.

[Se connecter]
```

#### Crédits insuffisants
```
💰 Crédits insuffisants. Ce service nécessite 50 crédits, vous en avez 20.

Achetez des crédits pour continuer à utiliser les services IA.

[Acheter des crédits]  [Passer Premium PRO+]
```

#### Quota Premium atteint
```
⏰ Limite quotidienne atteinte pour ce service (10 utilisations par jour). Réinitialisée à minuit.

Votre quota sera réinitialisé à minuit.

[Voir d'autres services]
```

#### Premium expiré
```
👑 Votre abonnement Premium a expiré. Veuillez le renouveler pour continuer à utiliser les services IA sans crédits.

Renouvelez votre abonnement Premium PRO+ pour un accès illimité.

[Renouveler Premium]
```

#### Service désactivé
```
⚠️ Le service "Générateur de CV IA" est temporairement désactivé.

Nous travaillons à le rétablir au plus vite.
```

## Tests recommandés

### Test 1 : Utilisateur non connecté

**Setup :** Déconnecté

**Actions :**
1. "Ouvre le générateur de CV"

**Vérifications :**
- [ ] Message "Vous devez être connecté" affiché
- [ ] Bouton "Se connecter" visible
- [ ] Clic sur bouton redirige vers `/auth`
- [ ] Aucune navigation vers le service

### Test 2 : Premium actif sans quotas

**Setup :** Premium actif, `enable_premium_limits = false`

**Actions :**
1. "Ouvre le générateur de CV"

**Vérifications :**
- [ ] Navigation immédiate vers le service
- [ ] Message "Je vous ai dirigé vers..."
- [ ] Aucun message de blocage

### Test 3 : Premium avec quota dépassé

**Setup :**
- Premium actif
- `enable_premium_limits = true`, `premium_daily_limit = 5`
- 5 utilisations déjà effectuées aujourd'hui

**Actions :**
1. "Ouvre le générateur de CV"

**Vérifications :**
- [ ] Message "Limite quotidienne atteinte" affiché
- [ ] Info "5 utilisations par jour" visible
- [ ] Bouton "Voir d'autres services" présent
- [ ] Aucune navigation vers le service

### Test 4 : Utilisateur gratuit avec crédits

**Setup :** Gratuit, 200 crédits, service coûte 50 crédits

**Actions :**
1. "Ouvre le générateur de CV"

**Vérifications :**
- [ ] Navigation immédiate vers le service
- [ ] Message "Je vous ai dirigé vers..."
- [ ] Aucun message de blocage

### Test 5 : Utilisateur gratuit sans crédits

**Setup :** Gratuit, 20 crédits, service coûte 50 crédits

**Actions :**
1. "Ouvre le générateur de CV"

**Vérifications :**
- [ ] Message "Crédits insuffisants" affiché
- [ ] Info "nécessite 50 crédits, vous en avez 20" visible
- [ ] Bouton "Acheter des crédits" présent
- [ ] Bouton "Passer Premium PRO+" présent
- [ ] Clic sur "Acheter" redirige vers `/credit-store`
- [ ] Aucune navigation vers le service

### Test 6 : Premium expiré

**Setup :** Premium expiré, 0 crédits

**Actions :**
1. "Ouvre le générateur de CV"

**Vérifications :**
- [ ] Message "Votre abonnement Premium a expiré" affiché
- [ ] Bouton "Renouveler Premium" présent
- [ ] Clic redirige vers `/premium-subscribe`
- [ ] Aucune navigation vers le service

### Test 7 : Service désactivé

**Setup :** Premium actif, service `is_active = false`

**Actions :**
1. "Ouvre le générateur de CV"

**Vérifications :**
- [ ] Message "Service temporairement désactivé" affiché
- [ ] Aucun bouton d'action (situation hors contrôle utilisateur)
- [ ] Aucune navigation vers le service

## Maintenance

### Ajouter un nouveau service IA

1. **Ajouter la route dans `ChatbotIAAccessControl`**

```typescript
static readonly IA_SERVICE_ROUTES: Record<string, ServiceCode> = {
  'ai-cv-generator': 'ai_cv_builder',
  'ai-new-service': 'ai_new_service', // Nouvelle ligne
  // ...
};
```

2. **Ajouter le type dans ServiceCode**

```typescript
export type ServiceCode =
  | 'ai_cv_builder'
  | 'ai_new_service' // Nouveau
  | ...;
```

3. **Créer la configuration en base**

```sql
INSERT INTO ia_service_config (
  service_code,
  service_name,
  credits_cost,
  enable_premium_limits,
  premium_daily_limit,
  is_active
) VALUES (
  'ai_new_service',
  'Nouveau Service IA',
  30,
  false,
  0,
  true
);
```

4. **Ajouter l'intention de navigation**

Dans `src/services/navigationMap.ts` :

```typescript
'ai-new-service': {
  key: 'ai-new-service',
  route: 'ai-new-service',
  displayName: 'Nouveau Service IA',
  description: 'Description du nouveau service',
  labels: ['nouveau', 'nouveau service', 'service ia'],
  category: 'ai-services',
  requiresAuth: true
}
```

Le contrôle d'accès s'appliquera automatiquement.

### Modifier le coût en crédits d'un service

```sql
UPDATE ia_service_config
SET credits_cost = 75
WHERE service_code = 'ai_cv_builder';
```

Le chatbot utilisera automatiquement le nouveau coût.

### Désactiver temporairement un service

```sql
UPDATE ia_service_config
SET is_active = false
WHERE service_code = 'ai_cv_builder';
```

Le chatbot bloquera l'accès avec le message "Service temporairement désactivé".

## Dépannage

### Problème : Les utilisateurs Premium sont bloqués

**Causes possibles :**
1. `is_premium_active` est `false` (expiration dans le passé)
2. Quota Premium atteint pour le service
3. Service désactivé

**Solution :**

Vérifier le profil :
```sql
SELECT
  id,
  email,
  is_premium,
  premium_expiration,
  credits_balance
FROM profiles
WHERE id = 'user_id';
```

Vérifier l'expiration :
```javascript
const isPremiumActive = isPremiumActive({
  is_premium: true,
  premium_expiration: '2024-12-31'
});
console.log(isPremiumActive); // true si date future
```

Vérifier le quota :
```sql
SELECT COUNT(*) as usage_today
FROM ai_service_usage_history
WHERE user_id = 'user_id'
  AND service_code = 'ai_cv_builder'
  AND created_at >= CURRENT_DATE;
```

### Problème : Les boutons d'action ne fonctionnent pas

**Causes possibles :**
1. Format d'action incorrect
2. `onNavigate` non passé au composant
3. Erreur dans le split de l'action

**Solution :**

Vérifier le format d'action :
```typescript
// Correct
{ action: 'navigate:credit-store' }

// Incorrect
{ action: 'credit-store' }
{ action: 'navigate-credit-store' }
```

Vérifier la présence de `onNavigate` :
```tsx
<ChatMessage
  message={message}
  onNavigate={onNavigate} // Doit être défini
  // ...
/>
```

### Problème : Le chatbot ne détecte pas les services IA

**Causes possibles :**
1. Route non dans `IA_SERVICE_ROUTES`
2. Intention mal configurée dans `navigationMap`

**Solution :**

Tester la détection :
```typescript
const isIA = ChatbotIAAccessControl.isIAService('ai-cv-generator');
console.log(isIA); // true

const serviceCode = ChatbotIAAccessControl.getServiceCode('ai-cv-generator');
console.log(serviceCode); // 'ai_cv_builder'
```

Si `false` ou `null`, ajouter la route dans `IA_SERVICE_ROUTES`.

## Sécurité

### Protection côté serveur

**IMPORTANT :** Le contrôle d'accès du chatbot est côté client. Il empêche la navigation mais ne protège pas l'exécution backend.

**Chaque service IA doit :**
1. Vérifier l'authentification
2. Vérifier les crédits/Premium côté serveur
3. Enregistrer l'usage dans `ai_service_usage_history`
4. Débiter les crédits si nécessaire

**Exemple dans un service IA :**

```typescript
async function generateCV(userId: string) {
  // 1. Vérifier que l'utilisateur existe
  const profile = await getProfile(userId);
  if (!profile) throw new Error('Unauthorized');

  // 2. Vérifier les droits d'accès
  const enhanced = await ChatbotIAAccessControl.buildEnhancedUserContext(
    userId,
    profile
  );

  const access = await ChatbotIAAccessControl.checkIAAccess(
    'ai_cv_builder',
    enhanced
  );

  if (!access.allowed) {
    throw new Error(`Access denied: ${access.reason}`);
  }

  // 3. Exécuter le service
  const cv = await aiGenerateCV();

  // 4. Enregistrer l'usage
  await recordUsage(userId, 'ai_cv_builder');

  // 5. Débiter les crédits si non-Premium
  if (!enhanced.isPremiumActive) {
    await debitCredits(userId, 50);
  }

  return cv;
}
```

### Validation des entrées

Le chatbot utilise les données de `ia_service_config` pour les coûts et quotas.

**Contraintes en base :**
```sql
ALTER TABLE ia_service_config
ADD CONSTRAINT credits_cost_positive CHECK (credits_cost >= 0),
ADD CONSTRAINT daily_limit_positive CHECK (premium_daily_limit >= 0 OR premium_daily_limit IS NULL);
```

## Évolutions futures

### Court terme

1. **Analytics d'usage**
   - Dashboard admin des services IA les plus demandés via chatbot
   - Taux de conversion (demande → utilisation effective)
   - Taux de blocage par raison

2. **Messages personnalisés par service**
   - Message de refus spécifique à chaque service
   - Suggestions de services alternatifs si bloqué

3. **Prédiction de crédits**
   - "Ce service coûte 50 crédits. Après utilisation, il vous restera 150 crédits."

### Moyen terme

1. **Quotas flexibles**
   - Quotas différents selon le niveau Premium (Basic, Pro, Enterprise)
   - Quotas par catégorie de service (CV, Coaching, etc.)

2. **Mode essai gratuit**
   - 1 utilisation gratuite par service IA pour nouveaux utilisateurs
   - Message "Essai gratuit utilisé, passez Premium ou achetez des crédits"

3. **File d'attente Premium**
   - Si quota atteint, proposer de rejoindre une file d'attente
   - Notification quand quota réinitialisé

## Conclusion

Le système de contrôle d'accès IA du chatbot assure :

✅ **Protection centralisée** : Un seul point de vérification pour tous les services IA
✅ **Expérience utilisateur claire** : Messages explicites avec actions suggérées
✅ **Flexibilité Premium** : Gestion des quotas quotidiens configurables
✅ **Cohérence** : Mêmes règles qu'ailleurs dans l'application
✅ **Extensibilité** : Ajout simple de nouveaux services IA

Les utilisateurs Premium bénéficient d'un accès privilégié via le chatbot, tandis que les utilisateurs gratuits sont guidés vers l'achat de crédits ou la souscription Premium en cas de blocage.
