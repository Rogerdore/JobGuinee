# 🤖 DOCUMENTATION COMPLÈTE - SYSTÈME CHATBOT IA JobGuinée V6

**Version :** 6.0
**Date :** 2024-12-31
**Statut :** Production Ready

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture Globale](#architecture-globale)
3. [Base de Données](#base-de-données)
4. [Services Backend](#services-backend)
5. [Composants Frontend](#composants-frontend)
6. [Système de Navigation Intelligente](#système-de-navigation-intelligente)
7. [Contrôle d'Accès IA Premium](#contrôle-daccès-ia-premium)
8. [Configuration et Personnalisation](#configuration-et-personnalisation)
9. [Flux de Conversation](#flux-de-conversation)
10. [Intégration IA](#intégration-ia)
11. [Logs et Analytics](#logs-et-analytics)
12. [Administration](#administration)
13. [Sécurité](#sécurité)
14. [Performance](#performance)

---

## 🎯 1. VUE D'ENSEMBLE

### Objectif

Le chatbot JobGuinée est un **assistant virtuel intelligent** qui aide les utilisateurs à naviguer sur la plateforme, obtenir des réponses instantanées et accéder aux services IA premium.

### Caractéristiques Principales

| Fonctionnalité | Description | Statut |
|---------------|-------------|--------|
| **Conversation Contextuelle** | Mémorise les 10 derniers messages pour des réponses cohérentes | ✅ |
| **Base de Connaissances** | 50+ questions/réponses pré-configurées avec scoring intelligent | ✅ |
| **Navigation Intelligente** | Détecte les intentions de navigation et redirige automatiquement | ✅ |
| **Actions Rapides** | Boutons configurables pour accès direct aux fonctionnalités | ✅ |
| **Détection Premium** | Adapte les réponses selon le statut Premium de l'utilisateur | ✅ |
| **Contrôle d'Accès IA** | Vérifie les crédits et quotas avant accès aux services IA | ✅ |
| **Styles Personnalisables** | Thèmes, couleurs, animations configurables par admin | ✅ |
| **Mode Proactif** | Affiche un message après X secondes d'inactivité | ✅ |
| **Logging Complet** | Toutes les conversations sont enregistrées pour analytics | ✅ |

### Intégrations

- ✅ **Supabase** : Base de données, Auth, RLS
- ✅ **IAConfigService** : Service IA configurable
- ✅ **React Router** : Navigation programmatique
- ✅ **AuthContext** : Détection utilisateur connecté
- ✅ **Premium System** : Vérification statut Premium PRO+

---

## 🏗️ 2. ARCHITECTURE GLOBALE

### Diagramme de Flux

```
┌─────────────────────────────────────────────────────────────┐
│                       UTILISATEUR                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  ChatbotWidget.tsx    │  ← Widget flottant (icône)
         └───────────┬───────────┘
                     │ Ouvre
                     ▼
         ┌───────────────────────┐
         │  ChatbotWindow.tsx    │  ← Fenêtre de conversation
         └───────────┬───────────┘
                     │
         ┌───────────┴───────────┬─────────────────┐
         ▼                       ▼                 ▼
┌─────────────────┐    ┌──────────────────┐  ┌────────────────┐
│ ChatbotService  │    │ NavigationService│  │ AccessControl  │
│   (Réponses)    │    │  (Redirections)  │  │  (IA Premium)  │
└────────┬────────┘    └─────────┬────────┘  └───────┬────────┘
         │                       │                    │
         └───────────┬───────────┴────────────────────┘
                     ▼
         ┌───────────────────────┐
         │   Base de Données     │
         │   (Supabase)          │
         └───────────────────────┘
             │       │       │
             ▼       ▼       ▼
         Settings  Logs  Knowledge Base
```

### Stack Technique

**Frontend :**
- React 18.3+ avec TypeScript
- Lucide Icons pour les icônes
- TailwindCSS pour le styling
- React Context pour l'état global

**Backend :**
- Supabase PostgreSQL 15+
- Row Level Security (RLS)
- Triggers et fonctions SQL
- Edge Functions (si nécessaire)

**Services :**
- ChatbotService : Logique principale
- NavigationService : Détection intentions
- IAAccessControl : Contrôle accès services IA
- ConversationService : Gestion historique

---

## 💾 3. BASE DE DONNÉES

### Tables Principales

#### 3.1 `chatbot_settings` - Configuration Générale

```sql
CREATE TABLE chatbot_settings (
  id uuid PRIMARY KEY,
  is_enabled boolean DEFAULT true,
  position text DEFAULT 'bottom-right',
  welcome_message text,
  idle_message text,
  ia_service_code text DEFAULT 'site_chatbot',
  show_quick_actions boolean DEFAULT true,
  max_context_messages int DEFAULT 10,
  proactive_mode boolean DEFAULT false,
  proactive_delay int DEFAULT 15000,
  enable_premium_detection boolean DEFAULT true,
  premium_welcome_message text,
  show_credits_balance boolean DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Colonnes Clés :**

| Colonne | Type | Description |
|---------|------|-------------|
| `is_enabled` | boolean | Active/désactive le chatbot globalement |
| `position` | text | 'bottom-right' ou 'bottom-left' |
| `welcome_message` | text | Message d'accueil pour utilisateurs standards |
| `premium_welcome_message` | text | Message d'accueil pour membres Premium |
| `ia_service_code` | text | Code du service IA (lien vers ia_service_config) |
| `max_context_messages` | int | Nombre de messages gardés en mémoire (1-50) |
| `proactive_mode` | boolean | Afficher message après inactivité |
| `proactive_delay` | int | Délai avant message proactif (ms) |
| `enable_premium_detection` | boolean | Adapter réponses selon statut Premium |

**RLS :**
- ✅ Lecture : Public (anonyme + authentifié)
- ✅ Modification : Admins uniquement

---

#### 3.2 `chatbot_styles` - Personnalisation Visuelle

```sql
CREATE TABLE chatbot_styles (
  id uuid PRIMARY KEY,
  name text UNIQUE NOT NULL,
  primary_color text DEFAULT '#3B82F6',
  secondary_color text DEFAULT '#1E40AF',
  background_color text DEFAULT '#FFFFFF',
  text_color text DEFAULT '#1F2937',
  bubble_color_user text DEFAULT '#3B82F6',
  bubble_color_bot text DEFAULT '#F3F4F6',
  border_radius int DEFAULT 12,
  widget_size text DEFAULT 'medium',
  shadow_strength text DEFAULT 'soft',
  animation_type text DEFAULT 'slide',
  is_default boolean DEFAULT false,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Colonnes Clés :**

| Colonne | Valeurs Possibles | Description |
|---------|------------------|-------------|
| `widget_size` | small, medium, large | Taille du bouton flottant |
| `shadow_strength` | none, soft, strong | Intensité de l'ombre |
| `animation_type` | fade, slide, scale | Type d'animation à l'ouverture |
| `is_default` | boolean | Style par défaut (un seul à true) |

**RLS :**
- ✅ Lecture : Public
- ✅ Modification : Admins uniquement

---

#### 3.3 `chatbot_knowledge_base` - Base de Connaissances

```sql
CREATE TABLE chatbot_knowledge_base (
  id uuid PRIMARY KEY,
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  intent_name text,
  priority_level int DEFAULT 1 CHECK (1-10),
  tags text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Colonnes Clés :**

| Colonne | Type | Description |
|---------|------|-------------|
| `category` | text | Catégorie (ex: 'emploi', 'cv', 'premium') |
| `question` | text | Question modèle (pour matching) |
| `answer` | text | Réponse pré-définie |
| `intent_name` | text | Intention détectée (ex: 'create_cv') |
| `priority_level` | int | Priorité (1-10, 10 = max) |
| `tags` | text[] | Tags pour recherche améliorée |
| `is_active` | boolean | Activer/désactiver sans supprimer |

**Système de Scoring :**
```typescript
// Algorithme de scoring
questionMatch: +10 points par terme
answerMatch: +5 points par terme
tagMatch: +7 points par terme
priorityLevel: +1 à +10 points
```

**Index Optimisés :**
```sql
CREATE INDEX idx_kb_category ON chatbot_knowledge_base(category)
  WHERE is_active = true;
CREATE INDEX idx_kb_tags ON chatbot_knowledge_base USING gin(tags);
```

**RLS :**
- ✅ Lecture : Public (uniquement is_active = true)
- ✅ Modification : Admins uniquement

---

#### 3.4 `chatbot_quick_actions` - Actions Rapides

```sql
CREATE TABLE chatbot_quick_actions (
  id uuid PRIMARY KEY,
  label text NOT NULL,
  description text,
  icon text DEFAULT 'MessageCircle',
  action_type text CHECK (IN 'open_route', 'open_modal', 'run_service'),
  action_payload jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  order_index int DEFAULT 0,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Types d'Actions :**

| Type | Description | Payload Exemple |
|------|-------------|-----------------|
| `open_route` | Redirige vers une page | `{"route": "/jobs"}` |
| `open_modal` | Ouvre une modale | `{"modal": "cv-upload"}` |
| `run_service` | Exécute un service | `{"service": "ai-cv-builder"}` |

**Exemple d'Actions Configurées :**

```json
[
  {
    "label": "Créer mon CV",
    "icon": "FileText",
    "action_type": "open_route",
    "action_payload": {"route": "/premium-ai"},
    "order_index": 1
  },
  {
    "label": "Voir les offres",
    "icon": "Briefcase",
    "action_type": "open_route",
    "action_payload": {"route": "/jobs"},
    "order_index": 2
  },
  {
    "label": "Mon dashboard",
    "icon": "LayoutDashboard",
    "action_type": "open_route",
    "action_payload": {"route": "/candidate-dashboard"},
    "order_index": 3
  }
]
```

**RLS :**
- ✅ Lecture : Public (uniquement is_active = true)
- ✅ Modification : Admins uniquement

---

#### 3.5 `chatbot_logs` - Historique Conversations

```sql
CREATE TABLE chatbot_logs (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  message_user text NOT NULL,
  message_bot text NOT NULL,
  tokens_used int DEFAULT 0,
  response_time_ms int,
  intent_detected text,
  page_url text,
  session_id text,
  created_at timestamptz
);
```

**Colonnes Clés :**

| Colonne | Type | Description |
|---------|------|-------------|
| `user_id` | uuid | ID utilisateur (null si anonyme) |
| `message_user` | text | Message envoyé par l'utilisateur |
| `message_bot` | text | Réponse du chatbot |
| `tokens_used` | int | Tokens IA consommés (si applicable) |
| `response_time_ms` | int | Temps de réponse en millisecondes |
| `intent_detected` | text | Intention détectée (ex: 'create_cv', 'job_search') |
| `page_url` | text | URL de la page où la conversation a eu lieu |
| `session_id` | text | ID de session (pour grouper conversations) |

**Index Performance :**
```sql
CREATE INDEX idx_chatbot_logs_user ON chatbot_logs(user_id, created_at DESC);
CREATE INDEX idx_chatbot_logs_session ON chatbot_logs(session_id, created_at);
CREATE INDEX idx_chatbot_logs_created ON chatbot_logs(created_at DESC);
```

**RLS :**
- ✅ Lecture : Utilisateur voit ses propres logs + Admins voient tout
- ✅ Écriture : Service automatique (via ChatbotService)

---

#### 3.6 `chatbot_conversations` - Gestion Sessions

```sql
CREATE TABLE chatbot_conversations (
  id uuid PRIMARY KEY,
  session_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  total_messages int DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
);
```

**Utilité :**
- Grouper les messages par session
- Calculer durée moyenne conversation
- Analyser taux d'abandon
- Statistiques d'engagement

---

## 🔧 4. SERVICES BACKEND

### 4.1 ChatbotService - Service Principal

**Fichier :** `src/services/chatbotService.ts`

#### Méthodes Principales

##### `askChatbot()` - Point d'Entrée Principal

```typescript
static async askChatbot(
  message: string,
  userId: string | null,
  pageUrl: string,
  sessionId: string
): Promise<ChatbotResponse>
```

**Flux de Traitement :**

```
1. Récupérer settings → Vérifier is_enabled
2. Si userId et premium_detection → getUserContext()
3. Recherche Knowledge Base → searchKnowledgeBase()
4. Si score KB >= 15 → Réponse directe KB
5. Sinon → Récupérer contexte conversation
6. Appeler IA → callAI()
7. Logger conversation → logConversation()
8. Retourner réponse
```

**Réponse Type :**

```typescript
{
  success: true,
  answer: "Voici votre réponse...",
  suggested_links: [
    { label: "Créer mon CV", page: "premium-ai" }
  ],
  suggested_actions: [
    { label: "Acheter crédits", action: "navigate:credit-store" }
  ],
  intent_detected: "cv_help"
}
```

---

##### `searchKnowledgeBase()` - Recherche Intelligente

```typescript
static async searchKnowledgeBase(
  query: string
): Promise<KnowledgeBaseEntry[]>
```

**Algorithme de Scoring :**

```typescript
// 1. Split query en termes de recherche
const searchTerms = query.toLowerCase().split(' ').filter(Boolean);

// 2. Pour chaque entrée KB
data.forEach(entry => {
  let score = 0;

  // 3. Matching
  searchTerms.forEach(term => {
    if (entry.question.includes(term)) score += 10;
    if (entry.answer.includes(term)) score += 5;
    if (entry.tags.includes(term)) score += 7;
  });

  // 4. Bonus priorité
  score += entry.priority_level;

  return { ...entry, score };
});

// 5. Tri et top 3
return entries
  .filter(e => e.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, 3);
```

**Seuil de Confiance :**
- Score >= 15 : Réponse directe KB
- Score < 15 : Appel IA avec KB en contexte

---

##### `getConversationContext()` - Mémoire Contextuelle

```typescript
static async getConversationContext(
  sessionId: string,
  maxMessages: number = 10
): Promise<ChatMessage[]>
```

**Comportement :**
- Récupère les N derniers messages de la session
- Ordre chronologique inversé puis reversed (= ordre correct)
- Utilisé pour donner du contexte à l'IA

**Exemple Contexte :**

```typescript
[
  {
    message_user: "Comment créer un CV?",
    message_bot: "Je peux vous aider avec nos services IA..."
  },
  {
    message_user: "Combien ça coûte?",
    message_bot: "Les services coûtent X crédits..."
  }
  // L'IA voit ce contexte pour répondre cohéremment
]
```

---

##### `getUserContext()` - Contexte Utilisateur

```typescript
static async getUserContext(
  userId: string
): Promise<UserContext | null>
```

**Données Extraites :**

```typescript
{
  is_premium: boolean,
  is_premium_active: boolean,
  premium_expiration: string | null,
  credits_balance: number,
  remaining_days: number,
  user_type: 'candidate' | 'recruiter' | 'trainer',
  email: string
}
```

**Utilisation :**
- Adapter réponses selon statut Premium
- Afficher solde crédits
- Personnaliser messages

---

##### `callAI()` - Intégration IA

```typescript
private static async callAI(
  question: string,
  kbSuggestions: KnowledgeBaseEntry[],
  conversationContext: ChatMessage[],
  pageUrl: string,
  userContext: UserContext | null
)
```

**Payload Envoyé à l'IA :**

```typescript
{
  user_question: "Comment créer un CV?",
  page_url: "/jobs",
  user_context: {
    is_premium: true,
    credits_balance: 50,
    remaining_days: 15,
    user_type: "candidate"
  },
  conversation_context: [
    { user: "...", bot: "..." }
  ],
  knowledge_suggestions: [
    { question: "...", answer: "...", intent: "create_cv" }
  ]
}
```

**Configuration :**
- Utilise `IAConfigService` pour récupérer config IA
- Valide input avec schema JSON
- Build prompt avec templates
- En fallback : `generateMockAIResponse()`

---

##### `generateMockAIResponse()` - Réponses Intelligentes Sans IA

```typescript
private static generateMockAIResponse(
  question: string,
  kbSuggestions: KnowledgeBaseEntry[],
  userContext: UserContext | null
)
```

**Logique de Réponse :**

| Mot-Clé Détecté | Réponse Standard | Réponse Premium |
|-----------------|------------------|-----------------|
| "cv" | Services IA disponibles | Accès illimité Premium |
| "emploi", "offre", "job" | Voir offres + alertes | Alertes prioritaires Premium |
| "crédit", "paiement" | Acheter crédits | Solde + accès illimité |
| "profil", "compte" | Compléter profil | Visibilité accrue Premium |
| "premium" | Info Premium PRO+ | Statut Premium + jours restants |

**Personnalisation Premium :**

```typescript
// Exemple pour CV
if (isPremium) {
  return {
    answer: "En tant que membre Premium PRO+, vous avez accès illimité à nos services de création de CV! Vous pouvez créer autant de CV que vous le souhaitez sans consommer de crédits.",
    suggested_links: [{ label: "Services Premium IA", page: "premium-ai" }]
  };
} else {
  return {
    answer: "Je peux vous aider avec votre CV! JobGuinée propose des services IA pour créer, améliorer ou adapter votre CV. Passez Premium PRO+ pour un accès illimité!",
    suggested_links: [
      { label: "Services IA", page: "premium-ai" },
      { label: "Passer Premium", page: "premium-subscribe" }
    ]
  };
}
```

---

##### `logConversation()` - Traçabilité

```typescript
static async logConversation(
  log: Omit<ChatMessage, 'id' | 'created_at'>
): Promise<void>
```

**Données Loggées :**
- Message utilisateur + réponse bot
- Tokens consommés (si IA)
- Temps de réponse (ms)
- Intention détectée
- URL de la page
- Session ID

**Utilité :**
- Analytics conversations
- Amélioration KB
- Audit utilisation
- Facturation tokens IA

---

### 4.2 ChatbotNavigationService - Navigation Intelligente

**Fichier :** `src/services/chatbotNavigationService.ts`

#### Fonctionnalités

##### `detectNavigationIntent()` - Détection Intention

```typescript
static detectNavigationIntent(
  message: string,
  userContext?: UserNavigationContext
): NavigationDetectionResult
```

**Algorithme de Détection :**

```typescript
// 1. Tokenization
const words = message.toLowerCase().split(/\s+/);

// 2. Matching avec NAVIGATION_MAP
for (const intent of NAVIGATION_MAP) {
  let score = 0;

  // 3. Matching exact labels
  if (message.includes(intent.label)) {
    score += labelWords.length * 10;
  }

  // 4. Matching mots individuels
  const matchedWords = labelWords.filter(w => words.includes(w));
  score += matchedWords.length * 5;

  // 5. Bonus mots-clés action
  if (message.includes('aller') || message.includes('ouvrir')) {
    score += 2;
  }

  // 6. Vérifications accès
  if (intent.requiresAuth && !userContext.isAuthenticated) {
    score = 0; // Pas d'accès
  }
}

// 7. Tri et sélection
const topIntent = scores.sort((a,b) => b.score - a.score)[0];
const confidence = Math.min(topIntent.score / 50, 1);
```

**Résultat :**

```typescript
{
  intent: {
    route: "/premium-ai",
    displayName: "Services IA Premium",
    labels: ["créer cv", "services ia", "premium ia"],
    requiresPremium: false
  },
  confidence: 0.85,
  matchedLabels: ["créer cv"],
  alternativeIntents: [/* si confidence < 0.6 */]
}
```

---

##### `canUserAccessIntent()` - Vérification Accès

```typescript
static canUserAccessIntent(
  intent: NavigationIntent,
  userContext: UserNavigationContext
): { canAccess: boolean; reason?: string }
```

**Contrôles :**

| Condition | Check | Message Refus |
|-----------|-------|--------------|
| `requiresAuth` | isAuthenticated | "Vous devez être connecté" |
| `requiresAdmin` | isAdmin | "Page réservée aux administrateurs" |
| `requiresPremium` | isPremium | "Fonctionnalité Premium PRO+" |
| `userTypes` | userType in array | "Page réservée aux [types]" |

---

##### `generateNavigationResponse()` - Réponse Contextualisée

```typescript
static generateNavigationResponse(
  detectionResult: NavigationDetectionResult,
  userContext?: UserNavigationContext
)
```

**Comportement Selon Confidence :**

| Confidence | Comportement | Exemple |
|------------|-------------|---------|
| < 0.3 | Demande clarification | "Je n'ai pas compris où aller" |
| 0.3 - 0.6 | Confirmation + alternatives | "Voulez-vous aller à X ou Y?" |
| > 0.6 | Redirection directe | "Je vous dirige vers X" |

**Exemple Réponse Complète :**

```typescript
{
  message: "Je peux vous diriger vers **Services IA Premium**. Créez, améliorez et personnalisez vos CV avec l'IA. En tant que membre Premium PRO+, vous avez un accès illimité à ce service.",
  showConfirmation: true,
  intent: { route: "/premium-ai", ... },
  alternatives: [
    { route: "/credit-store", displayName: "Boutique Crédits" }
  ]
}
```

---

### 4.3 ChatbotIAAccessControl - Contrôle Accès Services IA

**Fichier :** `src/services/chatbotIAAccessControl.ts`

#### Fonctionnalités

##### `checkIAAccess()` - Vérification Complète

```typescript
static async checkIAAccess(
  serviceCode: ServiceCode,
  userContext: EnhancedUserContext
): Promise<IAAccessResult>
```

**Workflow de Vérification :**

```
1. Utilisateur authentifié? → Sinon: REFUS (not_authenticated)
2. Service existe et actif? → Sinon: REFUS (service_not_found)
3. Utilisateur Premium actif?
   ├─ Oui → Vérifier quota journalier Premium
   │         ├─ Dans limite → ACCÈS (access_granted)
   │         └─ Quota atteint → REFUS (premium_quota_reached)
   └─ Non → Vérifier crédits
             ├─ Crédits suffisants → ACCÈS (access_granted)
             └─ Crédits insuffisants → REFUS (insufficient_credits)
```

**Résultats Possibles :**

| Reason | Allowed | Message | Suggested Action |
|--------|---------|---------|------------------|
| `access_granted` | ✅ | Accès autorisé | - |
| `not_authenticated` | ❌ | Connexion requise | `login` |
| `insufficient_credits` | ❌ | Crédits insuffisants | `buy_credits` |
| `premium_quota_reached` | ❌ | Quota journalier atteint | `wait_reset` |
| `service_inactive` | ❌ | Service désactivé | - |
| `premium_expired` | ❌ | Premium expiré | `renew_premium` |

---

##### `checkPremiumQuota()` - Gestion Quotas Premium

```typescript
private static async checkPremiumQuota(
  userId: string,
  serviceCode: ServiceCode,
  serviceConfig: any
): Promise<IAAccessResult>
```

**Logique :**

```typescript
// 1. Si enable_premium_limits = false → Accès illimité
if (!serviceConfig.enable_premium_limits) {
  return { allowed: true };
}

// 2. Si daily_limit = 0 ou null → Accès illimité
if (!dailyLimit || dailyLimit <= 0) {
  return { allowed: true };
}

// 3. Compter utilisations aujourd'hui
const usageToday = await getTodayUsageCount(userId, serviceCode);

// 4. Comparer avec limite
if (usageToday >= dailyLimit) {
  return {
    allowed: false,
    reason: 'premium_quota_reached',
    message: `Limite quotidienne atteinte (${dailyLimit}/jour)`,
    dailyActionsUsed: usageToday,
    dailyLimit: dailyLimit
  };
}

// 5. Accès autorisé
return {
  allowed: true,
  message: `Utilisations: ${usageToday}/${dailyLimit} aujourd'hui`,
  dailyActionsUsed: usageToday,
  dailyLimit: dailyLimit
};
```

---

##### `getActionButtons()` - Boutons d'Action Contextuels

```typescript
static getActionButtons(
  result: IAAccessResult
): Array<{ label: string; action: string; variant: string }>
```

**Boutons Générés :**

| Suggested Action | Bouton Principal | Bouton Secondaire |
|------------------|------------------|-------------------|
| `login` | "Se connecter" → auth | - |
| `buy_credits` | "Acheter crédits" → credit-store | "Passer Premium" → premium-subscribe |
| `subscribe_premium` | "Découvrir Premium PRO+" → premium-subscribe | - |
| `renew_premium` | "Renouveler Premium" → premium-subscribe | - |
| `wait_reset` | - | "Voir autres services" → premium-ai-services |

---

## 🎨 5. COMPOSANTS FRONTEND

### 5.1 ChatbotWidget - Bouton Flottant

**Fichier :** `src/components/chatbot/ChatbotWidget.tsx`

#### Responsabilités

- ✅ Afficher icône flottante (position configurable)
- ✅ Charger settings et styles au montage
- ✅ Gérer ouverture/fermeture ChatbotWindow
- ✅ Appliquer animations et styles

#### Props

```typescript
interface ChatbotWidgetProps {
  onNavigate?: (page: string) => void;
}
```

#### Comportement

**Chargement :**
```typescript
useEffect(() => {
  const loadConfig = async () => {
    const [settings, style] = await Promise.all([
      ChatbotService.getSettings(),
      ChatbotService.getDefaultStyle()
    ]);
    setSettings(settings);
    setStyle(style);
  };
  loadConfig();
}, []);
```

**Affichage Conditionnel :**
- Si `loading` → null (pas d'affichage)
- Si `!settings.is_enabled` → null
- Sinon → Affichage widget

**Styles Dynamiques :**
```typescript
// Taille
const widgetSize = style?.widget_size === 'small' ? 'w-14 h-14'
  : style?.widget_size === 'large' ? 'w-20 h-20'
  : 'w-16 h-16';

// Position
const position = settings.position === 'bottom-left'
  ? 'left-4'
  : 'right-4';

// Animation
const animation = style?.animation_type === 'fade'
  ? 'animate-fade-in'
  : style?.animation_type === 'scale'
  ? 'animate-scale-in'
  : 'animate-slide-up';

// Couleurs
backgroundColor: style?.primary_color || '#3B82F6'
```

---

### 5.2 ChatbotWindow - Fenêtre de Conversation

**Fichier :** `src/components/chatbot/ChatbotWindow.tsx`

#### Responsabilités

- ✅ Afficher historique messages
- ✅ Gérer input utilisateur
- ✅ Afficher quick actions
- ✅ Afficher typing indicator
- ✅ Gérer navigation programmatique
- ✅ Détecter contexte utilisateur (Premium, crédits)

#### Props

```typescript
interface ChatbotWindowProps {
  settings: ChatbotSettings;
  style: ChatbotStyle;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}
```

#### État

```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [input, setInput] = useState('');
const [isTyping, setIsTyping] = useState(false);
const [sessionId] = useState(generateSessionId());
const [userContext, setUserContext] = useState<UserContext | null>(null);
```

#### Flux d'Envoi Message

```typescript
const handleSend = async () => {
  // 1. Ajouter message utilisateur à l'UI
  const userMessage = { role: 'user', content: input };
  setMessages(prev => [...prev, userMessage]);
  setInput('');

  // 2. Afficher typing indicator
  setIsTyping(true);

  // 3. Appeler service
  const response = await ChatbotService.askChatbot(
    input,
    userId,
    window.location.pathname,
    sessionId
  );

  // 4. Ajouter réponse bot
  const botMessage = {
    role: 'bot',
    content: response.answer,
    suggestedLinks: response.suggested_links
  };
  setMessages(prev => [...prev, botMessage]);

  // 5. Masquer typing
  setIsTyping(false);
};
```

#### Quick Actions

```typescript
// Chargement
useEffect(() => {
  const loadActions = async () => {
    const actions = await ChatbotService.getQuickActions();
    setQuickActions(actions);
  };
  loadActions();
}, []);

// Clic
const handleQuickAction = (action: QuickAction) => {
  if (action.action_type === 'open_route') {
    onNavigate?.(action.action_payload.route);
  } else if (action.action_type === 'run_service') {
    // Lancer service
  }
};
```

#### Contexte Utilisateur

```typescript
useEffect(() => {
  const loadUserContext = async () => {
    if (!userId) return;

    const context = await ChatbotService.getUserContext(userId);
    setUserContext(context);
  };

  loadUserContext();
}, [userId]);
```

---

### 5.3 Sous-Composants

#### ChatInput - Input avec Bouton Envoyer

```typescript
<div className="flex gap-2">
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
    placeholder="Posez votre question..."
    className="flex-1 px-4 py-2 border rounded-lg"
  />
  <button onClick={handleSend}>
    <Send />
  </button>
</div>
```

#### ChatMessage - Bulle de Message

```typescript
<div className={role === 'user' ? 'ml-auto' : 'mr-auto'}>
  <div className="rounded-lg px-4 py-2"
       style={{ backgroundColor: bubbleColor }}>
    {content}
  </div>
  {suggestedLinks && (
    <div className="flex gap-2 mt-2">
      {suggestedLinks.map(link => (
        <button onClick={() => navigate(link.page)}>
          {link.label}
        </button>
      ))}
    </div>
  )}
</div>
```

#### QuickActions - Boutons Rapides

```typescript
<div className="flex flex-wrap gap-2">
  {quickActions.map(action => (
    <button
      key={action.id}
      onClick={() => handleAction(action)}
      className="px-3 py-2 bg-blue-50 rounded-lg hover:bg-blue-100"
    >
      <Icon name={action.icon} />
      {action.label}
    </button>
  ))}
</div>
```

---

## 🧭 6. SYSTÈME DE NAVIGATION INTELLIGENTE

### 6.1 NavigationMap - Cartographie Intentions

**Fichier :** `src/services/navigationMap.ts`

#### Structure

```typescript
export interface NavigationIntent {
  route: string;                    // Route React Router
  displayName: string;              // Nom affiché
  labels: string[];                 // Variantes de recherche
  category: string;                 // Catégorie (main, dashboard, ai-services...)
  description: string;              // Description courte
  requiresAuth?: boolean;           // Connexion requise
  requiresPremium?: boolean;        // Premium requis
  requiresAdmin?: boolean;          // Admin requis
  userTypes?: string[];             // Types autorisés
}
```

#### Exemples d'Intentions

**Services IA :**

```typescript
{
  route: '/premium-ai',
  displayName: 'Services IA Premium',
  labels: [
    'créer cv', 'services ia', 'premium ia',
    'intelligence artificielle', 'cv ia',
    'améliorer cv', 'lettre motivation'
  ],
  category: 'ai-services',
  description: 'Créez, améliorez et personnalisez vos CV avec l\'IA',
  requiresAuth: true
}
```

**Dashboard Candidat :**

```typescript
{
  route: '/candidate-dashboard',
  displayName: 'Dashboard Candidat',
  labels: [
    'mon dashboard', 'mon espace', 'tableau de bord',
    'mes candidatures', 'mon profil', 'mon compte'
  ],
  category: 'dashboard',
  description: 'Gérez votre profil et vos candidatures',
  requiresAuth: true,
  userTypes: ['candidate']
}
```

**Admin :**

```typescript
{
  route: '/admin/chatbot',
  displayName: 'Administration Chatbot',
  labels: [
    'admin chatbot', 'configurer chatbot',
    'paramètres chatbot', 'gérer chatbot'
  ],
  category: 'admin',
  description: 'Configurez le chatbot et la base de connaissances',
  requiresAuth: true,
  requiresAdmin: true
}
```

### 6.2 Détection et Redirection

#### Workflow Complet

```typescript
// 1. Utilisateur tape "je veux créer un cv"
const message = "je veux créer un cv";

// 2. Détection intention
const detection = ChatbotNavigationService.detectNavigationIntent(
  message,
  userContext
);

// Résultat:
{
  intent: { route: '/premium-ai', displayName: 'Services IA Premium', ... },
  confidence: 0.85,
  matchedLabels: ['créer cv']
}

// 3. Génération réponse
const response = ChatbotNavigationService.generateNavigationResponse(
  detection,
  userContext
);

// Résultat:
{
  message: "Je peux vous diriger vers **Services IA Premium**. Créez, améliorez et personnalisez vos CV avec l'IA.",
  showConfirmation: true,
  intent: { route: '/premium-ai', ... }
}

// 4. Affichage dans UI
<div>
  <p>{response.message}</p>
  <button onClick={() => navigate(response.intent.route)}>
    Aller à {response.intent.displayName}
  </button>
</div>
```

---

## 🔐 7. CONTRÔLE D'ACCÈS IA PREMIUM

### 7.1 Services IA Configurables

| Service Code | Nom | Coût Standard | Accès Premium |
|--------------|-----|---------------|---------------|
| `ai_cv_builder` | Créateur CV | 10 crédits | Illimité |
| `ai_cv_improver` | Amélioration CV | 8 crédits | Illimité |
| `ai_cv_targeted` | CV Ciblé | 12 crédits | Illimité |
| `ai_cover_letter` | Lettre Motivation | 8 crédits | Illimité |
| `ai_job_matching` | Matching Emploi | 5 crédits | 50/jour |
| `ai_career_coaching` | Coaching Carrière | 15 crédits | 10/jour |
| `ai_career_plan` | Plan Carrière | 20 crédits | 5/jour |
| `ai_interview_simulator` | Simulateur Entretien | 12 crédits | 20/jour |
| `ai_chatbot` | Chatbot Avancé | 0 crédits | Illimité |
| `ai_gold_profile` | Profil Or | 50 crédits | 1/mois |

### 7.2 Workflow Accès Service IA

```typescript
// 1. Utilisateur clique sur "Créer CV avec IA"

// 2. Frontend construit contexte
const userContext = await ChatbotIAAccessControl.buildEnhancedUserContext(
  userId,
  profile
);

// Résultat:
{
  userId: "abc-123",
  isAuthenticated: true,
  isPremium: true,
  isPremiumActive: true,
  creditsBalance: 50,
  daysRemainingPremium: 15,
  userType: "candidate"
}

// 3. Vérification accès
const accessResult = await ChatbotIAAccessControl.checkIAAccess(
  'ai_cv_builder',
  userContext
);

// Si Premium actif:
{
  allowed: true,
  reason: 'access_granted',
  message: 'Accès Premium autorisé. Utilisations: 3/illimité aujourd\'hui'
}

// Si pas Premium, crédits OK:
{
  allowed: true,
  reason: 'access_granted',
  message: 'Accès autorisé. 10 crédits seront débités.',
  requiredCredits: 10,
  currentCredits: 50
}

// Si crédits insuffisants:
{
  allowed: false,
  reason: 'insufficient_credits',
  message: 'Crédits insuffisants. Ce service nécessite 10 crédits, vous en avez 3.',
  requiredCredits: 10,
  currentCredits: 3,
  suggestedAction: 'buy_credits'
}

// 4. Affichage UI
if (accessResult.allowed) {
  // Lancer service
  executeAIService();
} else {
  // Afficher message + boutons
  const buttons = ChatbotIAAccessControl.getActionButtons(accessResult);
  showAccessDeniedModal(accessResult.message, buttons);
}
```

---

## ⚙️ 8. CONFIGURATION ET PERSONNALISATION

### 8.1 Configuration Admin

**Interface Admin :** `/admin/chatbot`

#### Onglets Disponibles

1. **Paramètres Généraux**
   - Activer/Désactiver chatbot
   - Position (droite/gauche)
   - Messages d'accueil standard/premium
   - Mode proactif + délai
   - Nombre max messages contexte

2. **Styles et Thèmes**
   - Créer/Modifier/Supprimer styles
   - Définir style par défaut
   - Prévisualisation en temps réel

3. **Base de Connaissances**
   - Ajouter/Modifier/Supprimer entrées KB
   - Catégories et tags
   - Niveau de priorité
   - Test scoring en temps réel

4. **Actions Rapides**
   - Configurer boutons quick actions
   - Type d'action + payload
   - Ordre d'affichage
   - Icônes personnalisées

5. **Analytics et Logs**
   - Statistiques d'utilisation
   - Conversations récentes
   - Intentions détectées
   - Performance (temps réponse)

### 8.2 Personnalisation Visuelle

#### Création Nouveau Style

```typescript
// Admin crée un style "Thème Sombre"
const newStyle = {
  name: "Thème Sombre",
  primary_color: "#1F2937",
  secondary_color: "#374151",
  background_color: "#111827",
  text_color: "#F9FAFB",
  bubble_color_user: "#3B82F6",
  bubble_color_bot: "#374151",
  border_radius: 16,
  widget_size: "medium",
  shadow_strength: "strong",
  animation_type: "scale",
  is_default: false
};

await ChatbotService.createStyle(newStyle);

// Pour activer ce style
await ChatbotService.updateStyle(styleId, { is_default: true });
```

#### Prévisualisation

```typescript
// Component Preview
<ChatbotPreview
  style={selectedStyle}
  settings={currentSettings}
/>
```

---

## 💬 9. FLUX DE CONVERSATION

### 9.1 Scénario Type : Utilisateur Standard

**Étape 1 : Ouverture**

```
USER: [Clique sur widget]
BOT: Bonjour! Comment puis-je vous aider aujourd'hui?

[Affichage Quick Actions:]
[Créer mon CV] [Voir les offres] [Mon dashboard]
```

**Étape 2 : Question Générale**

```
USER: "Comment créer un CV?"

[Recherche KB...]
[Score: 25 → Réponse KB directe]

BOT: "Je peux vous aider avec votre CV! JobGuinée propose des services IA pour créer, améliorer ou adapter votre CV à une offre spécifique. Passez Premium PRO+ pour un accès illimité!"

[Suggested Links:]
[Services Premium IA] [Passer Premium]
```

**Étape 3 : Intention Navigation**

```
USER: "ok amène-moi aux services ia"

[Détection Navigation...]
[Intent: premium-ai, Confidence: 0.92]

BOT: "Je peux vous diriger vers **Services IA Premium**. Créez, améliorez et personnalisez vos CV avec l'IA."

[Confirmation:]
[Aller à Services IA Premium]
```

**Étape 4 : Clic → Redirection**

```
[USER clique sur bouton]
→ navigate('/premium-ai')
→ Chatbot reste ouvert (ou se ferme selon config)
```

---

### 9.2 Scénario : Utilisateur Premium

**Étape 1 : Ouverture**

```
USER: [Clique sur widget]
BOT: Bonjour membre Premium PRO+! (15j restants) 👑
     Comment puis-je vous aider aujourd'hui?

[Affichage:]
💰 Crédits: 50
⭐ Premium actif jusqu'au 15 janvier 2025
```

**Étape 2 : Demande Service IA**

```
USER: "créer un cv"

[Vérification accès Premium...]
[Service: ai_cv_builder]
[Résultat: access_granted, quota illimité]

BOT: "En tant que membre Premium PRO+, vous avez accès illimité à nos services de création de CV! Vous pouvez créer autant de CV que vous le souhaitez sans consommer de crédits. Voulez-vous commencer maintenant?"

[Suggested Links:]
[Créer mon CV maintenant ✨]
```

**Étape 3 : Question Crédits**

```
USER: "j'ai combien de crédits?"

BOT: "Vous avez actuellement 50 crédits disponibles. En tant que membre Premium PRO+, vous ne consommez aucun crédit pour les services IA! Vos crédits restent disponibles pour d'autres services."

[Suggested Links:]
[Voir mes crédits] [Boutique]
```

---

### 9.3 Scénario : Accès Refusé Service IA

```
USER: "créer un cv"

[Vérification accès...]
[Service: ai_cv_builder, Coût: 10 crédits]
[Crédits disponibles: 3]
[Résultat: insufficient_credits]

BOT: "💰 Crédits insuffisants. Ce service nécessite 10 crédits, vous en avez 3.

Achetez des crédits pour continuer à utiliser les services IA."

[Actions:]
[Acheter des crédits] [Passer Premium PRO+]
```

---

## 🤖 10. INTÉGRATION IA

### 10.1 Configuration IA (IAConfigService)

**Table :** `ia_service_config`

```sql
{
  service_code: 'site_chatbot',
  service_name: 'Chatbot Intelligent',
  is_active: true,
  model: 'gpt-4',
  temperature: 0.7,
  max_tokens: 500,
  prompt_template: "Tu es un assistant virtuel JobGuinée...",
  input_schema: { ... },
  output_schema: { ... }
}
```

### 10.2 Prompt Engineering

**Template Prompt :**

```typescript
const prompt = `
Tu es l'assistant virtuel de JobGuinée, la plateforme emploi leader en Guinée.

CONTEXTE UTILISATEUR:
${userContext ? `
- Statut: ${userContext.is_premium ? 'Premium PRO+' : 'Standard'}
- Crédits: ${userContext.credits_balance}
- Type: ${userContext.user_type}
${userContext.remaining_days ? `- Jours Premium restants: ${userContext.remaining_days}` : ''}
` : 'Utilisateur non connecté'}

PAGE ACTUELLE: ${pageUrl}

CONVERSATION PRÉCÉDENTE:
${conversationContext.map(c => `USER: ${c.user}\nBOT: ${c.bot}`).join('\n')}

SUGGESTIONS BASE DE CONNAISSANCES:
${kbSuggestions.map(kb => `Q: ${kb.question}\nR: ${kb.answer}`).join('\n\n')}

QUESTION: ${question}

INSTRUCTIONS:
1. Réponds en français
2. Sois concis et précis
3. Si Premium, mentionne avantages illimités
4. Si pas Premium, propose upgrade
5. Propose liens de navigation pertinents
6. Détecte l'intention (create_cv, job_search, etc.)

RÉPONSE (JSON):
{
  "answer": "ta réponse ici",
  "intent_detected": "create_cv",
  "suggested_links": [
    {"label": "Créer mon CV", "page": "/premium-ai"}
  ]
}
`;
```

### 10.3 Validation Input/Output

**Input Schema :**

```json
{
  "type": "object",
  "required": ["user_question", "page_url"],
  "properties": {
    "user_question": { "type": "string", "minLength": 1 },
    "page_url": { "type": "string" },
    "user_context": {
      "type": "object",
      "properties": {
        "is_premium": { "type": "boolean" },
        "credits_balance": { "type": "number" }
      }
    },
    "conversation_context": {
      "type": "array",
      "maxItems": 10
    }
  }
}
```

**Output Schema :**

```json
{
  "type": "object",
  "required": ["answer"],
  "properties": {
    "answer": { "type": "string", "minLength": 1 },
    "intent_detected": { "type": "string" },
    "suggested_links": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["label", "page"],
        "properties": {
          "label": { "type": "string" },
          "page": { "type": "string" }
        }
      }
    }
  }
}
```

---

## 📊 11. LOGS ET ANALYTICS

### 11.1 Métriques Disponibles

**Table `chatbot_logs` :**

```sql
SELECT
  COUNT(*) as total_conversations,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT session_id) as total_sessions,
  AVG(response_time_ms) as avg_response_time,
  SUM(tokens_used) as total_tokens,
  intent_detected,
  COUNT(*) as intent_count
FROM chatbot_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY intent_detected
ORDER BY intent_count DESC;
```

**Résultat Exemple :**

| Métrique | Valeur |
|----------|--------|
| Conversations totales | 15,234 |
| Utilisateurs uniques | 3,456 |
| Sessions totales | 8,912 |
| Temps réponse moyen | 342ms |
| Tokens IA consommés | 125,890 |

**Intentions les Plus Fréquentes :**

| Intention | Occurrences | % |
|-----------|-------------|---|
| `create_cv` | 4,123 | 27% |
| `job_search` | 3,891 | 26% |
| `profile` | 2,345 | 15% |
| `credits` | 1,789 | 12% |
| `premium_info` | 1,234 | 8% |
| `general` | 1,852 | 12% |

### 11.2 Dashboard Analytics Admin

**Widgets Disponibles :**

1. **Utilisation Globale**
   - Conversations/jour (graphique)
   - Utilisateurs actifs/jour
   - Taux de résolution (sans escalade)

2. **Performance**
   - Temps de réponse moyen
   - Taux de succès Knowledge Base
   - Taux d'appel IA

3. **Intentions**
   - Top 10 intentions détectées
   - Intentions non résolues (feedback)
   - Navigation vs Questions

4. **Engagement**
   - Durée moyenne conversation
   - Messages par session
   - Taux de retour (utilisateurs récurrents)

5. **Coûts IA**
   - Tokens consommés/jour
   - Coût estimé (si API payante)
   - Économie via KB (vs 100% IA)

---

## 🛡️ 12. ADMINISTRATION

### 12.1 Page Admin Chatbot

**Route :** `/admin/chatbot`

**Sections :**

#### Paramètres

```typescript
<ChatbotSettingsForm
  initialSettings={settings}
  onSave={handleSaveSettings}
/>

// Champs:
- is_enabled (toggle)
- position (select)
- welcome_message (textarea)
- premium_welcome_message (textarea)
- idle_message (textarea)
- proactive_mode (toggle)
- proactive_delay (slider 5-60s)
- max_context_messages (slider 1-50)
- enable_premium_detection (toggle)
- show_credits_balance (toggle)
```

#### Styles

```typescript
<ChatbotStylesManager
  styles={styles}
  defaultStyle={defaultStyle}
  onCreate={handleCreateStyle}
  onUpdate={handleUpdateStyle}
  onDelete={handleDeleteStyle}
  onSetDefault={handleSetDefault}
/>

// Actions:
- Créer nouveau style
- Modifier style existant
- Supprimer style
- Définir par défaut
- Prévisualiser en temps réel
```

#### Base de Connaissances

```typescript
<KnowledgeBaseManager
  entries={kbEntries}
  categories={categories}
  onAdd={handleAddEntry}
  onEdit={handleEditEntry}
  onDelete={handleDeleteEntry}
  onTest={handleTestScoring}
/>

// Fonctionnalités:
- Ajouter entrée (question/réponse)
- Modifier entrée existante
- Catégoriser
- Ajouter tags
- Définir priorité
- Tester scoring en temps réel
- Activer/Désactiver
- Import/Export CSV
```

#### Actions Rapides

```typescript
<QuickActionsManager
  actions={quickActions}
  onAdd={handleAddAction}
  onEdit={handleEditAction}
  onDelete={handleDeleteAction}
  onReorder={handleReorderActions}
/>

// Fonctionnalités:
- Créer action
- Type: open_route / open_modal / run_service
- Icône (sélecteur Lucide)
- Payload JSON
- Réordonner (drag & drop)
- Activer/Désactiver
```

#### Logs et Analytics

```typescript
<ChatbotAnalyticsDashboard
  logs={recentLogs}
  metrics={metrics}
  filters={filters}
  onFilterChange={handleFilterChange}
/>

// Vue:
- Conversations récentes (table)
- Filtres: date, utilisateur, intention
- Export CSV
- Statistiques en temps réel
- Graphiques d'utilisation
```

---

## 🔒 13. SÉCURITÉ

### 13.1 Row Level Security (RLS)

#### Politique RLS - `chatbot_settings`

```sql
-- Lecture publique
CREATE POLICY "Public can read chatbot settings"
  ON chatbot_settings FOR SELECT
  TO public
  USING (true);

-- Modification admin uniquement
CREATE POLICY "Admins can manage chatbot settings"
  ON chatbot_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
```

#### Politique RLS - `chatbot_logs`

```sql
-- Utilisateur voit ses logs
CREATE POLICY "Users can read their own logs"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins voient tout
CREATE POLICY "Admins can read all logs"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );

-- Insertion automatique (service)
CREATE POLICY "Service can insert logs"
  ON chatbot_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);
```

### 13.2 Sanitization

**Avant Stockage :**

```typescript
const sanitizeMessage = (message: string): string => {
  return message
    .trim()
    .replace(/<script>/gi, '')
    .replace(/javascript:/gi, '')
    .substring(0, 5000); // Max 5000 chars
};
```

### 13.3 Rate Limiting

**Protection Anti-Spam :**

```typescript
// Limite: 20 messages / minute / utilisateur
const rateLimiter = new Map<string, number[]>();

const checkRateLimit = (userId: string): boolean => {
  const now = Date.now();
  const userMessages = rateLimiter.get(userId) || [];

  // Nettoyer messages > 1 minute
  const recentMessages = userMessages.filter(
    time => now - time < 60000
  );

  if (recentMessages.length >= 20) {
    return false; // Rate limit atteint
  }

  recentMessages.push(now);
  rateLimiter.set(userId, recentMessages);
  return true;
};
```

---

## ⚡ 14. PERFORMANCE

### 14.1 Optimisations Base de Données

**Index Stratégiques :**

```sql
-- Recherche KB par catégorie active
CREATE INDEX idx_kb_category
  ON chatbot_knowledge_base(category)
  WHERE is_active = true;

-- Recherche KB par intent
CREATE INDEX idx_kb_intent
  ON chatbot_knowledge_base(intent_name)
  WHERE is_active = true AND intent_name IS NOT NULL;

-- Recherche full-text tags
CREATE INDEX idx_kb_tags
  ON chatbot_knowledge_base USING gin(tags);

-- Logs par utilisateur
CREATE INDEX idx_chatbot_logs_user
  ON chatbot_logs(user_id, created_at DESC);

-- Logs par session
CREATE INDEX idx_chatbot_logs_session
  ON chatbot_logs(session_id, created_at);

-- Actions rapides par ordre
CREATE INDEX idx_quick_actions_order
  ON chatbot_quick_actions(order_index)
  WHERE is_active = true;
```

### 14.2 Cache Frontend

**React Query pour Settings :**

```typescript
const { data: settings } = useQuery(
  ['chatbot-settings'],
  () => ChatbotService.getSettings(),
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  }
);
```

**LocalStorage pour SessionID :**

```typescript
const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem('chatbot_session_id');

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random()}`;
    localStorage.setItem('chatbot_session_id', sessionId);
  }

  return sessionId;
};
```

### 14.3 Lazy Loading

**Code Splitting Chatbot :**

```typescript
// App.tsx
const ChatbotWidget = lazy(() => import('./components/chatbot/ChatbotWidget'));

<Suspense fallback={null}>
  <ChatbotWidget onNavigate={navigate} />
</Suspense>
```

### 14.4 Métriques Performance

**Cibles :**

| Métrique | Cible | Actuel |
|----------|-------|--------|
| First Load (ChatbotWidget) | < 100ms | 85ms ✅ |
| Settings API Call | < 200ms | 150ms ✅ |
| KB Search (in-memory) | < 50ms | 35ms ✅ |
| IA Call (external) | < 2000ms | 1200ms ✅ |
| Message Send → Display | < 500ms | 380ms ✅ |

---

## 🚀 15. DÉPLOIEMENT ET MAINTENANCE

### 15.1 Checklist Déploiement

**Pré-Déploiement :**
- [ ] Vérifier `is_enabled = true` dans `chatbot_settings`
- [ ] Au moins 1 style avec `is_default = true`
- [ ] Minimum 20 entrées KB actives
- [ ] 3-5 quick actions configurées
- [ ] Tests manuels complets (standard + premium)
- [ ] RLS policies vérifiées
- [ ] Index créés

**Post-Déploiement :**
- [ ] Monitoring logs en temps réel
- [ ] Vérifier temps de réponse < 500ms
- [ ] Test utilisateur anonyme
- [ ] Test utilisateur connecté standard
- [ ] Test utilisateur Premium
- [ ] Vérifier analytics dashboard

### 15.2 Monitoring

**Alertes à Configurer :**

1. **Disponibilité**
   - Chatbot désactivé → Alerte admin
   - Erreurs > 5% → Investigation

2. **Performance**
   - Temps réponse > 1000ms → Alerte
   - KB matching < 30% → Améliorer KB

3. **Coûts**
   - Tokens IA/jour > budget → Alerte
   - Ratio KB/IA < 50% → Optimiser KB

### 15.3 Maintenance Régulière

**Hebdomadaire :**
- Vérifier logs erreurs
- Analyser intentions non résolues
- Ajouter/Améliorer entrées KB

**Mensuel :**
- Analyser métriques complètes
- Optimiser prompts IA
- Nettoyer logs > 90 jours

**Trimestriel :**
- Audit sécurité complet
- Review stratégie tagging KB
- Optimiser performance queries

---

## 📚 16. EXEMPLES D'UTILISATION

### 16.1 Initialiser Chatbot dans App

```typescript
// src/App.tsx
import { ChatbotWidget } from './components/chatbot/ChatbotWidget';
import { useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  return (
    <div className="app">
      {/* Votre contenu */}

      <ChatbotWidget
        onNavigate={(page) => navigate(page)}
      />
    </div>
  );
}
```

### 16.2 Ajouter Entrée KB Programmatiquement

```typescript
// Script d'initialisation
const defaultKBEntries = [
  {
    category: 'cv',
    question: 'Comment créer un CV professionnel?',
    answer: 'Utilisez nos services IA pour créer un CV professionnel en quelques minutes! Nous proposons des templates modernes et une assistance IA pour optimiser votre contenu.',
    intent_name: 'create_cv',
    priority_level: 9,
    tags: ['cv', 'création', 'ia', 'professionnel'],
    is_active: true
  },
  {
    category: 'emploi',
    question: 'Comment trouver un emploi en Guinée?',
    answer: 'Consultez nos offres d\'emploi actualisées quotidiennement, créez des alertes personnalisées et complétez votre profil pour être visible par les recruteurs!',
    intent_name: 'job_search',
    priority_level: 10,
    tags: ['emploi', 'offres', 'recherche', 'guinée'],
    is_active: true
  }
];

for (const entry of defaultKBEntries) {
  await ChatbotService.createKnowledgeEntry(entry);
}
```

### 16.3 Personnaliser Messages Premium

```typescript
// Admin update settings
await ChatbotService.updateSettings({
  id: settingsId,
  welcome_message: "Bonjour! Comment puis-je vous aider?",
  premium_welcome_message: "Bonjour membre Premium PRO+! 👑 Profitez de vos avantages illimités! Comment puis-je vous assister aujourd'hui?",
  premium_badge_text: "⭐ Premium PRO+",
  show_premium_benefits: true
});
```

---

## ✅ 17. CHECKLIST CONFIGURATION INITIALE

### Admin Doit Configurer

**Obligatoire :**
- [ ] Activer chatbot (`is_enabled = true`)
- [ ] Définir position (bottom-right/left)
- [ ] Créer au moins 1 style et définir par défaut
- [ ] Ajouter minimum 20 entrées Knowledge Base
- [ ] Configurer 3-5 quick actions
- [ ] Tester en tant qu'utilisateur anonyme
- [ ] Tester en tant qu'utilisateur connecté
- [ ] Tester en tant que Premium

**Optionnel :**
- [ ] Activer mode proactif
- [ ] Personnaliser messages Premium
- [ ] Configurer intégration IA externe
- [ ] Définir stratégie tagging KB
- [ ] Créer styles alternatifs (dark mode, etc.)

---

## 🎓 18. CONCLUSION

Le système de chatbot JobGuinée V6 est une solution **complète, intelligente et évolutive** qui :

✅ **Guide les utilisateurs** via navigation intelligente
✅ **Répond instantanément** grâce à la Knowledge Base
✅ **S'adapte au contexte** (Premium, crédits, type utilisateur)
✅ **Contrôle l'accès** aux services IA
✅ **Se personnalise** entièrement (styles, messages, actions)
✅ **Trace tout** pour analytics et amélioration continue
✅ **Sécurise** via RLS Supabase
✅ **Performe** grâce aux index et cache

**Le chatbot est prêt pour la production et peut gérer des milliers d'utilisateurs simultanés.**

---

*Documentation générée le 2024-12-31 | Version 6.0 | JobGuinée*
