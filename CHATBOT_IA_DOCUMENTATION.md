# CHATBOT IA - DOCUMENTATION COMPLÈTE

**Projet:** JobGuinée
**Date:** 10 Décembre 2025
**Version:** 1.0
**Statut:** Production Ready

---

## 📋 VUE D'ENSEMBLE

Le **Chatbot IA** de JobGuinée est un assistant virtuel intelligent, flottant et configurable qui aide les utilisateurs à naviguer sur le site, comprendre les services IA, et accomplir leurs tâches.

### Caractéristiques Principales

- Assistant virtuel intelligent connecté à l'IA centrale
- Widget flottant moderne (bas droite ou gauche)
- Entièrement configurable depuis l'admin
- Base de connaissances (FAQ) intégrée
- Actions rapides personnalisables
- Styles et couleurs personnalisables
- Historique des conversations
- Logs et analytics intégrés

### Technologies

- **Frontend:** React + TypeScript
- **Backend:** Supabase + PostgreSQL
- **IA:** IAConfigService (service_code: site_chatbot)
- **Service:** ChatbotService.ts
- **Base de données:** 5 tables dédiées

---

## 🏗️ ARCHITECTURE

### Composants Frontend

#### 1. ChatbotWidget.tsx

**Rôle:** Widget flottant (bouton d'ouverture/fermeture)

**Props:**
```typescript
interface ChatbotWidgetProps {
  onNavigate?: (page: string) => void;
}
```

**Fonctionnalités:**
- Charge settings et style depuis DB
- Gère ouverture/fermeture du chat
- Affiche icône configurable
- Position configurable (bottom-left/bottom-right)
- Animation d'apparition configurable
- Ombre configurable

**État:**
```typescript
const [isOpen, setIsOpen] = useState(false);
const [settings, setSettings] = useState<ChatbotSettings | null>(null);
const [style, setStyle] = useState<ChatbotStyle | null>(null);
```

#### 2. ChatbotWindow.tsx

**Rôle:** Fenêtre de chat principale

**Props:**
```typescript
interface ChatbotWindowProps {
  settings: ChatbotSettings;
  style: ChatbotStyle | null;
  onClose: () => void;
  onNavigate?: (page: string) => void;
}
```

**Fonctionnalités:**
- Affiche messages utilisateur et bot
- Gère session de conversation
- Affiche actions rapides
- Scroll automatique
- Indicateur "bot en train d'écrire"
- Liens suggérés dans les réponses

**Structure:**
```
Header (titre + bouton fermer)
↓
Quick Actions (si activé et < 2 messages)
↓
Messages (liste déroulante)
↓
Input (champ + bouton envoyer)
```

#### 3. ChatMessage.tsx

**Rôle:** Affichage d'un message (utilisateur ou bot)

**Fonctionnalités:**
- Style différent user vs bot
- Bulles de couleurs configurables
- Affiche liens suggérés
- Support markdown (optionnel)
- Timestamp

#### 4. ChatInput.tsx

**Rôle:** Champ de saisie + bouton envoyer

**Fonctionnalités:**
- Input contrôlé
- Envoi sur Enter
- Bouton désactivé si loading
- Placeholder configurable
- Style configurable

#### 5. QuickActions.tsx

**Rôle:** Affichage des actions rapides

**Props:**
```typescript
interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: QuickAction) => void;
}
```

**Fonctionnalités:**
- Affiche 2-4 actions principales
- Icônes Lucide React
- Click handler pour navigation ou actions
- Style badge/pill

### Services Backend

#### ChatbotService.ts

**Méthodes principales:**

```typescript
// Configuration
static async getSettings(): Promise<ChatbotSettings | null>
static async getDefaultStyle(): Promise<ChatbotStyle | null>
static async getQuickActions(): Promise<QuickAction[]>

// Conversation
static async askChatbot(
  message: string,
  userId: string | null,
  pageUrl: string,
  sessionId: string
): Promise<ChatbotResponse>

// Base de connaissances
static async searchKnowledgeBase(query: string): Promise<KnowledgeBaseEntry[]>

// Contexte
static async getConversationContext(
  sessionId: string,
  maxMessages: number
): Promise<ChatMessage[]>

// Logs
static async logConversation(log: Omit<ChatMessage, 'id' | 'created_at'>): Promise<void>

// Admin CRUD
static async updateSettings(settings: Partial<ChatbotSettings>): Promise<boolean>
static async getAllStyles(): Promise<ChatbotStyle[]>
static async createStyle(style: Omit<ChatbotStyle, 'id'>): Promise<boolean>
static async updateStyle(id: string, style: Partial<ChatbotStyle>): Promise<boolean>
static async getAllKnowledgeBase(): Promise<KnowledgeBaseEntry[]>
static async createKnowledgeEntry(entry: Omit<KnowledgeBaseEntry, 'id'>): Promise<boolean>
static async getAllQuickActions(): Promise<QuickAction[]>
static async createQuickAction(action: Omit<QuickAction, 'id'>): Promise<boolean>
static async getChatLogs(limit: number): Promise<ChatMessage[]>
```

**Intégration IA:**

La méthode `askChatbot()` fonctionne ainsi:

1. **Vérification settings** (chatbot activé?)
2. **Recherche KB** (base de connaissances)
   - Si réponse directe trouvée (score >= 15) → retourne KB
3. **Récupération contexte** (historique conversation)
4. **Appel IA via IAConfigService:**
   ```typescript
   const config = await IAConfigService.getConfig('site_chatbot');
   const inputData = {
     user_question: message,
     page_url: pageUrl,
     conversation_context: conversationContext,
     knowledge_suggestions: kbSuggestions
   };
   const builtPrompt = IAConfigService.buildPrompt(config, inputData);
   // Appel API IA (OpenAI, etc.)
   ```
5. **Parse réponse**
6. **Log conversation**
7. **Retour réponse + liens suggérés**

---

## 🗄️ BASE DE DONNÉES

### Table: chatbot_settings

**Description:** Configuration globale du chatbot

**Colonnes:**

| Colonne | Type | Description | Défaut |
|---------|------|-------------|--------|
| id | uuid | Primary key | gen_random_uuid() |
| is_enabled | boolean | Chatbot activé | true |
| position | text | Position widget | 'bottom-right' |
| welcome_message | text | Message bienvenue | 'Bonjour! Comment...' |
| idle_message | text | Message inactivité | 'Besoin d''aide?...' |
| ia_service_code | text | Service IA utilisé | 'site_chatbot' |
| show_quick_actions | boolean | Afficher actions rapides | true |
| max_context_messages | integer | Nb messages contexte | 10 |
| proactive_mode | boolean | Mode proactif | false |
| proactive_delay | integer | Délai message proactif (ms) | 15000 |
| created_at | timestamptz | Date création | now() |
| updated_at | timestamptz | Date MAJ | now() |

**Contraintes:**
- Un seul enregistrement (singleton)
- CHECK position IN ('bottom-left', 'bottom-right')

**RLS:**
- Public: lecture seule
- Admin: lecture + écriture

### Table: chatbot_styles

**Description:** Styles visuels du chatbot

**Colonnes:**

| Colonne | Type | Description | Défaut |
|---------|------|-------------|--------|
| id | uuid | Primary key | gen_random_uuid() |
| name | text | Nom du style | — |
| primary_color | text | Couleur principale | '#3B82F6' |
| secondary_color | text | Couleur secondaire | '#1E40AF' |
| background_color | text | Couleur fond | '#FFFFFF' |
| text_color | text | Couleur texte | '#1F2937' |
| bubble_color_user | text | Bulle utilisateur | '#3B82F6' |
| bubble_color_bot | text | Bulle bot | '#F3F4F6' |
| border_radius | integer | Rayon bordures (px) | 12 |
| widget_size | text | Taille widget | 'medium' |
| icon_type | text | Type icône | 'default' |
| icon_value | text | Valeur icône custom | null |
| enable_dark_mode | boolean | Mode sombre | false |
| shadow_strength | text | Force ombre | 'soft' |
| animation_type | text | Type animation | 'slide' |
| is_default | boolean | Style par défaut | false |
| created_at | timestamptz | Date création | now() |
| updated_at | timestamptz | Date MAJ | now() |

**Contraintes:**
- CHECK widget_size IN ('small', 'medium', 'large')
- CHECK shadow_strength IN ('none', 'soft', 'strong')
- CHECK animation_type IN ('fade', 'slide', 'scale')
- UNIQUE is_default = true (un seul défaut)

**RLS:**
- Public: lecture seule
- Admin: lecture + écriture

### Table: chatbot_quick_actions

**Description:** Actions rapides affichées dans le chat

**Colonnes:**

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Primary key |
| label | text | Label bouton |
| description | text | Description (tooltip) |
| icon | text | Icône Lucide React |
| action_type | text | Type d'action |
| action_payload | jsonb | Données action |
| is_active | boolean | Action active |
| order_index | integer | Ordre affichage |
| created_at | timestamptz | Date création |
| updated_at | timestamptz | Date MAJ |

**Types d'actions:**
- `open_route`: Navigation vers page
  ```json
  {"page": "ai-cv-generator"}
  ```
- `open_modal`: Ouvre modal (future extension)
  ```json
  {"modal": "cv_generator"}
  ```
- `run_service`: Exécute service backend (future)
  ```json
  {"service": "quick_cv_tips"}
  ```

**Exemples:**
```sql
{
  "label": "Générer mon CV IA",
  "icon": "FileText",
  "action_type": "open_route",
  "action_payload": {"page": "ai-cv-generator"}
}
```

**RLS:**
- Public: lecture (is_active = true)
- Admin: lecture + écriture

### Table: chatbot_knowledge_base

**Description:** Base de connaissances (FAQ) pour réponses directes

**Colonnes:**

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Primary key |
| category | text | Catégorie (cv, emploi, credits...) |
| question | text | Question type |
| answer | text | Réponse |
| intent_name | text | Intent NLU |
| priority_level | integer | Priorité (0-10) |
| tags | text[] | Tags recherche |
| is_active | boolean | Entrée active |
| created_at | timestamptz | Date création |
| updated_at | timestamptz | Date MAJ |

**Catégories:**
- `cv`: CV et documents
- `emploi`: Offres et candidatures
- `credits`: Crédits IA
- `profil`: Profil utilisateur
- `matching`: Matching IA
- `coach`: Coaching carrière
- `recruteur`: Espace recruteur
- `general`: Questions générales

**Scoring:**
- Question exacte : +10 points
- Mot dans answer : +5 points
- Tag match : +7 points
- Priority level : bonus

**Seuil réponse directe:** score >= 15

**RLS:**
- Public: lecture (is_active = true)
- Admin: lecture + écriture

### Table: chatbot_logs

**Description:** Historique complet des conversations

**Colonnes:**

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Utilisateur (null si anonyme) |
| message_user | text | Message utilisateur |
| message_bot | text | Réponse bot |
| tokens_used | integer | Tokens IA consommés |
| response_time_ms | integer | Temps réponse (ms) |
| intent_detected | text | Intent détecté |
| page_url | text | URL page |
| session_id | text | ID session |
| created_at | timestamptz | Date/heure |

**Indexes:**
- idx_chatbot_logs_user ON user_id
- idx_chatbot_logs_session ON session_id
- idx_chatbot_logs_created ON created_at DESC

**RLS:**
- Admin: lecture totale
- Utilisateur: lecture (user_id = auth.uid())

---

## ⚙️ SERVICE IA

### Configuration ia_service_config

**Service Code:** `site_chatbot`

**Configuration:**

```json
{
  "service_code": "site_chatbot",
  "service_name": "Assistant Chatbot Site",
  "service_description": "Assistant virtuel intelligent pour aider les utilisateurs",
  "base_prompt": "Tu es l'assistant intelligent de JobGuinée...",
  "instructions": "Règles importantes: 1. Français clair, 2. Concis...",
  "model": "gpt-4",
  "temperature": 0.7,
  "max_tokens": 500,
  "is_active": true,
  "category": "coaching"
}
```

**Input Schema:**

```json
{
  "type": "object",
  "required": ["user_question", "page_url"],
  "properties": {
    "user_question": {"type": "string"},
    "page_url": {"type": "string"},
    "conversation_context": {"type": "array"},
    "knowledge_suggestions": {"type": "array"},
    "user_profile": {"type": "object"}
  }
}
```

**Output Schema:**

```json
{
  "type": "object",
  "properties": {
    "answer": {"type": "string"},
    "suggested_links": {"type": "array"},
    "intent_detected": {"type": "string"}
  }
}
```

### Prompting

**Système:**
```
Tu es l'assistant JobGuinée.
Contexte: {page_url}.
Historique: {conversation_context}.
Base de connaissances: {knowledge_suggestions}.
```

**User Message:**
```
user_question: "Comment générer un CV?"
page_url: "/home"
conversation_context: [...]
knowledge_suggestions: [{question: "...", answer: "..."}]
```

**Réponse attendue:**
```json
{
  "answer": "JobGuinée propose le Générateur CV IA...",
  "suggested_links": [
    {"label": "Services Premium IA", "page": "premium-ai"}
  ],
  "intent_detected": "create_cv"
}
```

---

## 🎨 ADMINISTRATION

### Page AdminChatbot.tsx

**Route:** `/admin-chatbot`
**Accès:** Admin uniquement

### Onglets

#### 1. Général (Settings)

**Configuration:**
- ✅ Activer/désactiver chatbot
- ✅ Position (bottom-left / bottom-right)
- ✅ Message bienvenue
- ✅ Message inactivité
- ✅ Service IA utilisé
- ✅ Afficher actions rapides
- ✅ Nb messages contexte max
- ✅ Mode proactif (message automatique)
- ✅ Délai mode proactif

**Actions:**
- Bouton "Sauvegarder"
- Prévisualisation en temps réel (optionnel)

#### 2. Styles

**Gestion des styles visuels:**

**Liste styles:**
- Affiche tous les styles
- Badge "Défaut" sur le style actif
- Actions: Éditer, Supprimer, Définir comme défaut

**Édition style:**
- Nom du style
- Couleurs (8 couleurs configurables)
  - Primary color
  - Secondary color
  - Background color
  - Text color
  - User bubble color
  - Bot bubble color
- Border radius (slider 0-30px)
- Widget size (small/medium/large)
- Shadow strength (none/soft/strong)
- Animation type (fade/slide/scale)

**Prévisualisation:**
- Widget miniature en direct
- Mise à jour temps réel

**Bouton "Nouveau Style":**
- Crée un style à partir du défaut
- Permet customisation complète

#### 3. Base de Connaissances

**Liste FAQ:**
- Affichage par catégorie
- Filtrage par catégorie
- Recherche par mot-clé
- Badge actif/inactif

**Colonnes:**
- Catégorie
- Question
- Réponse (tronquée)
- Intent
- Priorité
- Tags
- Actions

**Actions:**
- ✏️ Éditer
- 🗑️ Supprimer
- 👁️ Prévisualiser
- 🔄 Activer/Désactiver

**Formulaire ajout/édition:**
```
Catégorie: [dropdown]
Question: [input]
Réponse: [textarea]
Intent Name: [input]
Priority Level: [slider 0-10]
Tags: [multi-select ou input comma-separated]
Actif: [checkbox]
```

**Bouton "Ajouter FAQ"**

#### 4. Actions Rapides

**Liste actions:**
- Ordre drag & drop (optionnel)
- Preview icône
- Label + description
- Type action
- Actif/inactif

**Formulaire ajout/édition:**
```
Label: [input]
Description: [input]
Icône: [dropdown Lucide icons]
Type Action: [radio: open_route | open_modal | run_service]

Si open_route:
  Page: [dropdown pages disponibles]

Si open_modal:
  Modal: [dropdown modales disponibles]

Si run_service:
  Service: [input]
  Params: [JSON editor]

Ordre: [number]
Actif: [checkbox]
```

**Bouton "Ajouter Action"**

#### 5. Historique (Logs)

**Table logs:**

**Colonnes:**
- Date/Heure
- Utilisateur (ID tronqué ou "Anonyme")
- Message utilisateur
- Réponse bot (tronquée)
- Temps réponse
- Intent détecté
- Page
- Session ID

**Filtres:**
- Par date (aujourd'hui, 7j, 30j, custom)
- Par utilisateur (ID)
- Par intent
- Par page

**Actions:**
- 👁️ Voir détails complets (modal)
- 📥 Exporter (CSV/JSON)

**Stats en haut:**
- Total conversations
- Temps réponse moyen
- Intents les plus fréquents
- Pages avec plus de questions

---

## 🚀 UTILISATION

### Intégration dans Layout

**Fichier:** `src/components/Layout.tsx`

```tsx
import ChatbotWidget from './chatbot/ChatbotWidget';

export default function Layout({ children, onNavigate }: LayoutProps) {
  return (
    <div>
      {/* Header */}
      {/* Navigation */}

      <main>{children}</main>

      {/* Footer */}

      {/* Chatbot Widget - visible sur toutes les pages */}
      <ChatbotWidget onNavigate={onNavigate} />
    </div>
  );
}
```

### Workflow Utilisateur

**1. Utilisateur ouvre le site**
- Widget flottant visible (si is_enabled = true)
- Position selon settings
- Style selon style par défaut

**2. Utilisateur clique sur widget**
- Fenêtre chat s'ouvre avec animation
- Message bienvenue affiché
- Actions rapides affichées (si activé)

**3. Utilisateur pose une question**
- Message ajouté à la conversation
- Indicateur "bot écrit..."
- Backend traite:
  1. Recherche KB
  2. Si match fort → réponse directe
  3. Sinon → appel IA
- Réponse affichée avec liens suggérés

**4. Utilisateur clique sur action rapide**
- Navigation vers page
- Ou ouverture modal
- Chat se ferme automatiquement

**5. Session persistée**
- Session ID unique par visiteur
- Historique conversation conservé
- Contexte utilisé pour réponses suivantes

### Actions Rapides par Défaut

**4 actions initialisées:**

1. **Générer mon CV IA**
   - Icône: FileText
   - Action: open_route → ai-cv-generator

2. **Voir les offres**
   - Icône: Briefcase
   - Action: open_route → jobs

3. **Acheter des crédits**
   - Icône: CreditCard
   - Action: open_route → credit-store

4. **Services Premium IA**
   - Icône: Sparkles
   - Action: open_route → premium-ai

### Base de Connaissances Initiale

**8 entrées FAQ:**

1. **Comment créer un CV?** (cv)
2. **Comment fonctionnent les crédits IA?** (credits)
3. **Comment postuler à une offre?** (emploi)
4. **Comment compléter mon profil?** (profil)
5. **Qu'est-ce que le Matching IA?** (matching)
6. **Comment générer une lettre?** (lettre)
7. **Qu'est-ce que le Coach Carrière?** (coach)
8. **Comment publier une offre?** (recruteur)

---

## 🔐 SÉCURITÉ & RLS

### Policies

**chatbot_settings:**
```sql
-- Public: lecture seule
CREATE POLICY "Public can view settings"
  ON chatbot_settings FOR SELECT
  TO public
  USING (true);

-- Admin: tout
CREATE POLICY "Admins can manage settings"
  ON chatbot_settings FOR ALL
  TO authenticated
  USING (user_is_admin());
```

**chatbot_styles:**
```sql
-- Public: lecture seule
CREATE POLICY "Public can view styles"
  ON chatbot_styles FOR SELECT
  TO public
  USING (true);

-- Admin: tout
CREATE POLICY "Admins can manage styles"
  ON chatbot_styles FOR ALL
  TO authenticated
  USING (user_is_admin());
```

**chatbot_quick_actions:**
```sql
-- Public: actions actives seulement
CREATE POLICY "Public can view active actions"
  ON chatbot_quick_actions FOR SELECT
  TO public
  USING (is_active = true);

-- Admin: tout
CREATE POLICY "Admins can manage actions"
  ON chatbot_quick_actions FOR ALL
  TO authenticated
  USING (user_is_admin());
```

**chatbot_knowledge_base:**
```sql
-- Public: KB active seulement
CREATE POLICY "Public can view active KB"
  ON chatbot_knowledge_base FOR SELECT
  TO public
  USING (is_active = true);

-- Admin: tout
CREATE POLICY "Admins can manage KB"
  ON chatbot_knowledge_base FOR ALL
  TO authenticated
  USING (user_is_admin());
```

**chatbot_logs:**
```sql
-- Admin: lecture totale
CREATE POLICY "Admins can view all logs"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (user_is_admin());

-- User: logs personnels
CREATE POLICY "Users can view own logs"
  ON chatbot_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Public/Authenticated: insertion (pour logging)
CREATE POLICY "Anyone can insert logs"
  ON chatbot_logs FOR INSERT
  TO public
  USING (true);
```

### Protection des Données

**Anonymisation:**
- User ID tronqué dans admin (8 premiers caractères)
- Sessions anonymes supportées (user_id = null)
- Pas de données sensibles dans logs

**Rate Limiting:**
Recommandé (à implémenter):
- Max 10 messages / minute / session
- Max 100 messages / heure / IP

---

## 📊 MÉTRIQUES & KPIs

### KPIs Chatbot

#### 1. Taux d'Engagement

**Métrique:** % utilisateurs qui interagissent avec chatbot

**Formule:**
```
(Utilisateurs ayant ouvert chat / Total visiteurs) * 100
```

**Objectif:** > 15%

#### 2. Taux de Résolution KB

**Métrique:** % questions résolues par KB (sans IA)

**Formule:**
```
(Réponses KB directes / Total questions) * 100
```

**Objectif:** > 40%

**Impact:** Économie tokens IA

#### 3. Temps de Réponse Moyen

**Métrique:** AVG(response_time_ms)

**Objectifs:**
- Réponse KB: < 200ms
- Réponse IA: < 3000ms

#### 4. Satisfaction Utilisateur

**Métrique:** Feedback positif / négatif

**À implémenter:**
- Boutons 👍 👎 après chaque réponse
- Enregistrement dans logs

**Objectif:** > 80% positif

#### 5. Conversations par Session

**Métrique:** AVG(messages par session)

**Benchmark:** 2-4 messages/session

**Si < 2:** Message bienvenue peu engageant
**Si > 6:** Réponses pas assez claires

#### 6. Top Intents

**Métrique:** COUNT par intent_name

**Analyse:**
- Quels sujets intéressent le plus
- Où améliorer KB
- Quels services promouvoir

### Dashboard Analytics

**Recommandé:**
- Page stats dédiée dans admin
- Charts temps réel
- Alertes si métriques anormales

**Métriques temps réel:**
- Conversations actives
- Messages/heure
- Erreurs IA/heure

---

## 🛠️ DÉPANNAGE

### Problème 1: Chatbot ne s'affiche pas

**Causes possibles:**
1. is_enabled = false dans settings
2. Pas de style défaut créé
3. Erreur chargement composant

**Solutions:**
```sql
-- Vérifier settings
SELECT * FROM chatbot_settings;

-- Vérifier style défaut
SELECT * FROM chatbot_styles WHERE is_default = true;

-- Vérifier erreurs console
-- Ouvrir DevTools > Console
```

### Problème 2: Réponses lentes

**Causes:**
- API IA externe lente
- Recherche KB non optimisée
- Trop de messages contexte

**Solutions:**
```sql
-- Réduire max_context_messages
UPDATE chatbot_settings SET max_context_messages = 5;

-- Vérifier index KB
CREATE INDEX IF NOT EXISTS idx_kb_question ON chatbot_knowledge_base USING gin(to_tsvector('french', question));
```

### Problème 3: Réponses non pertinentes

**Causes:**
- KB incomplète
- Prompt IA mal configuré
- Temperature trop élevée

**Solutions:**
1. Ajouter plus d'entrées KB
2. Améliorer base_prompt dans ia_service_config
3. Réduire temperature (0.5-0.7)

### Problème 4: Erreurs IA

**Diagnostic:**
```sql
-- Vérifier logs erreurs
SELECT * FROM chatbot_logs
WHERE message_bot LIKE '%erreur%'
ORDER BY created_at DESC
LIMIT 10;

-- Vérifier config IA
SELECT * FROM ia_service_config WHERE service_code = 'site_chatbot';
```

**Solutions:**
- Vérifier clés API
- Vérifier quotas API
- Activer fallback mock si nécessaire

---

## 📝 CHECKLIST DÉPLOIEMENT

### Avant Production

- [ ] Settings chatbot configurées
- [ ] Style défaut créé et testé
- [ ] KB initiale complète (min. 10 entrées)
- [ ] Actions rapides configurées
- [ ] Service IA site_chatbot actif
- [ ] RLS activé sur toutes tables
- [ ] Logs testés
- [ ] Widget visible sur toutes pages
- [ ] Responsive mobile testé
- [ ] Performance testée (temps réponse)
- [ ] Clés API IA configurées
- [ ] Rate limiting activé
- [ ] Monitoring en place
- [ ] Documentation admin créée

### Tests Manuels

**Test 1: Widget apparaît**
- Ouvrir homepage
- Vérifier widget visible
- Cliquer → fenêtre s'ouvre

**Test 2: Message bienvenue**
- Ouvrir chat
- Vérifier message bienvenue affiché
- Vérifier actions rapides affichées

**Test 3: Réponse KB**
- Question: "Comment créer un CV?"
- Vérifier réponse rapide (<500ms)
- Vérifier liens suggérés affichés

**Test 4: Réponse IA**
- Question: "Quelle est la meilleure stratégie pour..."
- Vérifier appel IA (indicateur loading)
- Vérifier réponse pertinente

**Test 5: Actions rapides**
- Cliquer "Générer mon CV IA"
- Vérifier navigation correcte
- Vérifier chat se ferme

**Test 6: Historique conversation**
- Poser 3 questions
- Vérifier contexte utilisé (réponses cohérentes)
- Vérifier logs créés

**Test 7: Admin**
- Accéder /admin-chatbot
- Modifier settings
- Vérifier changements appliqués
- Ajouter entrée KB
- Vérifier disponible dans chat

---

## 🔄 ÉVOLUTIONS FUTURES

### Phase 2

**Feedback Utilisateur:**
- Boutons 👍 👎 après réponses
- Commentaires optionnels
- Rating satisfaction

**Voice Input:**
- Reconnaissance vocale
- Text-to-speech réponses

**Rich Media:**
- Images dans réponses
- Vidéos tutoriels
- Carousels produits

### Phase 3

**Chatbot Proactif:**
- Détection inactivité
- Messages contextuels automatiques
- Suggestions basées sur page

**Multi-langue:**
- Détection langue utilisateur
- Réponses multi-langues
- KB traduite

**Analytics Avancés:**
- Funnel conversationnel
- A/B testing messages
- Heatmaps interactions

### Phase 4

**Intégrations:**
- WhatsApp/Messenger
- Email support
- CRM integration

**IA Avancée:**
- Fine-tuning modèle custom
- Vector search pour KB
- Sentiment analysis

---

## 📚 RESSOURCES

### Documentation Liée

- **IA_CENTER_DOCUMENTATION.md** - Centre Admin IA
- **IA_CONFIG_DOCUMENTATION.md** - IAConfigService
- **COMPLETE_IA_ECOSYSTEM_DOCUMENTATION.md** - Écosystème IA global

### APIs

**OpenAI:**
- Docs: https://platform.openai.com/docs
- Modèles: gpt-4, gpt-3.5-turbo

**Supabase:**
- Docs: https://supabase.com/docs
- RLS: https://supabase.com/docs/guides/auth/row-level-security

### Librairies

**Frontend:**
- React: https://react.dev
- Lucide Icons: https://lucide.dev
- Tailwind CSS: https://tailwindcss.com

**Backend:**
- Supabase JS: https://supabase.com/docs/reference/javascript

---

## 🆘 SUPPORT

### En Cas de Problème

1. **Vérifier console navigateur** (F12)
2. **Vérifier logs Supabase** (table chatbot_logs)
3. **Tester config IA** (SELECT * FROM ia_service_config WHERE service_code = 'site_chatbot')
4. **Vérifier settings** (SELECT * FROM chatbot_settings)

### Contact

**Email:** support@jobguinee.com
**Documentation:** /docs/chatbot
**Admin:** /admin-chatbot

---

**Fin de la Documentation Chatbot IA**

**Auteur:** Système Bolt.new
**Dernière MAJ:** 10 Décembre 2025
**Version:** 1.0
**Statut:** Production Ready ✅
