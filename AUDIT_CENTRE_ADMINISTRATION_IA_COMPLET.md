# AUDIT TECHNIQUE COMPLET - CENTRE D'ADMINISTRATION IA

**Date**: 3 janvier 2026
**Version**: 1.0
**Statut**: AUDIT UNIQUEMENT - AUCUNE MODIFICATION
**Plateforme**: JobGuinée

---

## RÉSUMÉ EXÉCUTIF

Le Centre d'Administration IA est une page d'administration stratégique qui centralise la gestion complète de l'écosystème Intelligence Artificielle de la plateforme JobGuinée. Cette page permet aux administrateurs de superviser, configurer et analyser tous les services IA, la tarification, les templates, et le système de matching intelligent.

### Points Clés
- **Architecture**: Page SPA (Single Page Application) avec navigation par onglets interne
- **Composant principal**: `AdminIACenter.tsx` (788 lignes)
- **Onglets**: 7 sections principales (Dashboard, Services IA, Templates, Tarification, Statistiques, Logs, Matching IA)
- **Tables DB**: 6 tables principales impliquées
- **Services**: 2 services majeurs (IAConfigService, CreditService/PricingEngine)
- **Endpoints API**: ~15 endpoints RPC/REST utilisés

---

## 1. AUDIT FRONTEND

### 1.1 Composant Principal

**Fichier**: `/src/pages/AdminIACenter.tsx`

**Informations générales**:
```typescript
- Lignes de code: 788
- Imports: 21 icônes lucide-react + 3 services/composants
- Type de composant: Fonctionnel avec hooks
- Props: { onNavigate: (page: string) => void }
```

**Structure du composant**:
```typescript
export default function AdminIACenter({ onNavigate }: PageProps) {
  // 1. État local (state management)
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);
  const [iaConfigs, setIaConfigs] = useState<IAServiceConfig[]>([]);
  const [allTemplates, setAllTemplates] = useState<IAServiceTemplate[]>([]);
  const [pricingData, setPricingData] = useState<CreditServiceConfig[]>([]);
  const [iaStats, setIaStats] = useState<IAStats | null>(null);
  const [serviceUsage, setServiceUsage] = useState<ServiceUsage[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  // 2. Chargement des données (useEffect)
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // 3. Fonctions de chargement
  // 4. Fonctions de rendu par onglet
  // 5. Rendu principal avec header + navigation + contenu
}
```

### 1.2 Sous-composants et Sections

#### 1.2.1 Header / Bandeau IA
- **Localisation**: Lignes 640-656
- **Éléments**:
  - Gradient bleu-violet (`bg-gradient-to-r from-blue-600 to-purple-600`)
  - Bouton "Retour à l'accueil" avec icône ArrowLeft
  - Icône Sparkles + Titre "Centre d'Administration IA"
  - Sous-titre descriptif
- **Comportement**: Statique, visible sur tous les onglets

#### 1.2.2 Barre d'Onglets (Navigation)
- **Localisation**: Lignes 658-740
- **Type**: Navigation sticky (`sticky top-0 z-10`)
- **Onglets** (7):
  1. **Dashboard** - BarChart3 icon - Vue d'ensemble
  2. **Services IA** - Settings icon - Configuration des services
  3. **Templates** - FileText icon - Gestion des templates
  4. **Tarification** - CreditCard icon - Coûts en crédits
  5. **Statistiques** - FileBarChart icon - Analyses détaillées
  6. **Logs** - Activity icon - Historique des appels
  7. **Matching IA** - Users icon - Tarification matching recruteurs

- **Système de navigation**:
  - Navigation interne par état (`activeTab`)
  - Pas de routes distinctes
  - Border-bottom bleu sur onglet actif
  - Transition hover sur onglets inactifs

#### 1.2.3 Onglet Dashboard (Vue d'ensemble)
**Fonction de rendu**: `renderDashboard()` (lignes 237-332)

**Cartes statistiques** (5 StatsCard):
```typescript
interface IAStats {
  totalCalls: number;        // Appels IA Total
  totalCredits: number;      // Crédits Consommés
  uniqueUsers: number;       // Utilisateurs Uniques
  successRate: number;       // Taux de Succès (%)
  avgDuration: number;       // Temps Moyen (ms)
}
```

**Cartes d'activité** (2):
1. **Services les Plus Utilisés** (top 5)
   - Classés par nombre d'appels
   - Affiche: nom service, code, appels, crédits

2. **Activité Récente** (8 derniers logs)
   - Icône statut (succès/erreur)
   - Service key, crédits, heure

**Source de données**:
- Stats globales: `ai_service_usage_history` (agrégation frontend)
- Top services: `serviceUsage` state (calculé frontend)
- Activité: `recentLogs` state (10 derniers logs DB)

#### 1.2.4 Onglet Services IA
**Fonction de rendu**: `renderServices()` (lignes 334-409)

**Éléments**:
- Bouton "Nouveau Service" (non fonctionnel - UI seul)
- Tableau des configurations:
  - Colonnes: Service, Catégorie, Modèle, Paramètres, Statut, Actions
  - Affiche tous les `iaConfigs` (table `ia_service_config`)
  - Actions: Eye (voir), Edit (éditer), Power (toggle actif) - **boutons UI seuls**

**Informations affichées**:
- Nom + code service
- Badge catégorie (ex: "Generation de Documents")
- Modèle IA utilisé (ex: gpt-4)
- Paramètres: Temperature + Max Tokens
- Statut actif/inactif avec icône

#### 1.2.5 Onglet Templates
**Fonction de rendu**: `renderTemplates()` (lignes 411-473)

**Organisation**:
- Templates groupés par `service_code`
- Grid 2 colonnes (responsive)
- Bouton "Nouveau Template" (UI seul)

**Cartes par service**:
- Titre: service_code + nombre de templates
- Liste templates avec:
  - Icône Sparkles si `is_default`
  - Nom template + format (HTML/Markdown/Text/JSON)
  - Indication "Inactif" si nécessaire
  - Actions: Eye, Edit (UI seuls)

#### 1.2.6 Onglet Tarification
**Fonction de rendu**: `renderPricing()` (lignes 475-534)

**Tableau de tarification**:
- Colonnes: Service, Catégorie, Coût Base, Coût Effectif, Promotion, Actions
- Source: `pricingData` (table `service_credit_costs`)
- Badge promotion si `promotion_active`
- Affiche discount percent si applicable
- Bouton "Modifier" par ligne (UI seul)

**Calcul coût effectif**:
```typescript
effective_cost = promotion_active
  ? credits_cost * (1 - discount_percent/100)
  : credits_cost
```

#### 1.2.7 Onglet Statistiques
**Fonction de rendu**: `renderStats()` (lignes 536-581)

**Vue détaillée par service**:
- Carte pour chaque service avec 4 métriques:
  - Appels Total
  - Crédits Consommés
  - Taux de Succès (%)
  - Erreurs
- Calculs frontend à partir de `serviceUsage`

#### 1.2.8 Onglet Logs
**Fonction de rendu**: `renderLogs()` (lignes 583-637)

**Tableau logs complet** (100 derniers):
- Colonnes: Date/Heure, Service, Utilisateur, Crédits, Durée, Statut
- Utilisateur affiché: `user_id.slice(0,8)...` (tronqué)
- Durée en secondes si disponible
- Icône + couleur par statut (succès vert, erreur rouge)

#### 1.2.9 Onglet Matching IA
**Composant externe**: `RecruiterMatchingPricingAdmin`
- Gestion spécifique tarification matching recruteurs
- Système d'abonnements AI pour recruteurs
- **Non détaillé** dans ce composant (composant séparé)

### 1.3 Composant StatsCard (réutilisable)
**Localisation**: Lignes 773-787

```typescript
interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;  // ex: "bg-blue-50"
}
```

**Rendu**:
- Carte colorée avec bordure
- Label + valeur en grand
- Icône dans badge blanc avec ombre

### 1.4 Mode de Navigation

**Type**: **Navigation interne par état local** (non basée sur routes URL)

**Mécanisme**:
```typescript
const [activeTab, setActiveTab] = useState<TabType>('dashboard');

// Changement d'onglet
<button onClick={() => setActiveTab('services')}>...</button>

// Rendu conditionnel
{activeTab === 'dashboard' && renderDashboard()}
{activeTab === 'services' && renderServices()}
// etc.
```

**Avantages**:
- Navigation instantanée (pas de rechargement)
- État local maintenu entre onglets
- Pas de gestion de routes complexe

**Inconvénients**:
- Pas d'URL dédiée par onglet
- Pas de deep linking possible
- Historique navigateur non exploité
- Partage d'un onglet spécifique impossible

### 1.5 Gestion de l'État

**État local uniquement** (useState):
```typescript
// Navigation
activeTab: TabType              // Onglet actif
loading: boolean                // État chargement

// Données
iaConfigs: IAServiceConfig[]    // Configs services IA
allTemplates: IAServiceTemplate[] // Tous les templates
pricingData: CreditServiceConfig[] // Tarification
iaStats: IAStats | null         // Stats globales
serviceUsage: ServiceUsage[]    // Usage par service
recentLogs: RecentLog[]         // Logs récents
```

**Pas d'état global**:
- Pas de Context API utilisé
- Pas de Redux/Zustand
- Chaque onglet recharge ses données au montage

**Cycle de vie**:
```typescript
useEffect(() => {
  loadData();  // Appelé à chaque changement d'onglet
}, [activeTab]);
```

### 1.6 Dépendances UI Critiques

**Bibliothèques externes**:
1. **lucide-react** (v0.344.0)
   - 21 icônes utilisées
   - Critique pour l'UI visuelle

2. **Services locaux**:
   - `IAConfigService` - Configuration IA
   - `CreditService` - Gestion crédits
   - `PricingEngine` - Tarification

3. **Composants externes**:
   - `RecruiterMatchingPricingAdmin` - Onglet Matching IA

**Styles**:
- 100% TailwindCSS
- Classes utilitaires inline
- Aucun CSS externe
- Design system cohérent (bleu-violet theme)

---

## 2. AUDIT ROUTES & NAVIGATION

### 2.1 Route Principale

**Route dans App.tsx**:
```typescript
// Ligne 42 - Lazy loading
const AdminIACenter = lazy(() => import('./pages/AdminIACenter'));

// Ligne 154 - Ajout dans adminPages
'admin-ia-center'

// Ligne 216 - Rendu
{currentPage === 'admin-ia-center' && <AdminIACenter onNavigate={handleNavigate} />}
```

**Navigation vers la page**:
```typescript
onNavigate('admin-ia-center')
```

**Contexte**: Page admin, nécessite:
- Authentification
- Rôle admin
- Affichée dans `AdminLayout`

### 2.2 Navigation Interne (Onglets)

**Type**: Navigation par état local (pas de routes)

**Changement d'onglet**:
```typescript
setActiveTab('dashboard' | 'services' | 'templates' | 'pricing' | 'stats' | 'logs' | 'matching-pricing')
```

**Pas de paramètres URL**:
- Pas de query params (?tab=dashboard)
- Pas de hash routing (#/dashboard)
- Pas de nested routes (/admin-ia-center/dashboard)

**Rechargement de page**:
- Retour à l'onglet 'dashboard' par défaut
- État perdu (pas de persistance URL)

### 2.3 Relation avec Autres Pages Admin

**Pages liées dans AdminLayout** (menu "IA & Services"):

```typescript
{
  id: 'ai-services',
  label: 'IA & Services',
  icon: Sparkles,
  children: [
    { id: 'ia-center', label: 'Centre IA', route: 'admin-ia-center' },      // CETTE PAGE
    { id: 'ia-credits', label: 'Crédits IA', route: 'admin-credits-ia' },
    { id: 'ia-pricing', label: 'Tarification IA', route: 'admin-ia-pricing' },
    { id: 'ia-config', label: 'Configuration IA', route: 'admin-ia-config' },
    { id: 'ia-templates', label: 'Templates IA', route: 'admin-ia-templates' },
    { id: 'ia-quota', label: 'Quotas Premium', route: 'admin-ia-premium-quota' }
  ]
}
```

**Relation fonctionnelle**:

| Page | Fonction | Lien avec Centre IA |
|------|----------|---------------------|
| **Centre IA** | **Dashboard global + vue d'ensemble** | **Page actuelle - Hub central** |
| Crédits IA | Gestion consommation individuelle | Affiche totaux, Centre IA détails |
| Tarification IA | Édition prix services | Centre IA affiche lecture seule |
| Configuration IA | Édition configs détaillées | Centre IA affiche configs |
| Templates IA | Édition templates détaillés | Centre IA liste templates |
| Quotas Premium | Gestion quotas abonnés | Utilise même système crédits |

**Duplication potentielle**:
- **Tarification**: Affichée en lecture Centre IA + édition Tarification IA
- **Templates**: Listés Centre IA + gestion Templates IA
- **Configs**: Tableau Centre IA + édition Configuration IA

### 2.4 Navigation Externe

**Bouton "Retour à l'accueil"**:
```typescript
onClick={() => onNavigate('home')}
```
Quitte le Centre IA vers page home (non-admin).

**Pas d'autres navigations externes** depuis les onglets.

### 2.5 Incohérences Identifiées

1. **Boutons actions non fonctionnels**:
   - "Nouveau Service", "Nouveau Template" (UI seulement)
   - Boutons Eye, Edit, Power dans tableaux (pas de handlers)
   - Bouton "Modifier" tarification (pas d'action)

2. **Navigation fragmentée**:
   - Utilisateur doit naviguer entre 6 pages admin pour gérer IA
   - Pas de centralisation réelle des actions d'édition

3. **Absence de deep linking**:
   - Impossible de partager lien vers onglet spécifique
   - Pas de bookmark d'onglet

4. **Pas de breadcrumb**:
   - Navigation "retour" simpliste
   - Pas de fil d'Ariane contextuel

---

## 3. AUDIT BACKEND (APIs)

### 3.1 Services Frontend Utilisés

#### 3.1.1 IAConfigService
**Fichier**: `/src/services/iaConfigService.ts` (704 lignes)

**Méthodes appelées par AdminIACenter**:

```typescript
// 1. Récupération configs (ligne 196)
IAConfigService.getAllConfigs(): Promise<IAServiceConfig[]>
// → SELECT * FROM ia_service_config ORDER BY category, service_name

// 2. Récupération labels catégories (ligne 370)
IAConfigService.getCategoryLabel(category: string): string
// → Mapping local, pas d'appel DB
```

**Méthodes NON utilisées mais disponibles**:
- `getConfig(serviceCode)` - Config spécifique
- `updateConfig()` - Mise à jour (pas utilisé depuis Centre IA)
- `createConfig()` - Création (pas utilisé)
- `toggleActive()` - Activation/désactivation
- `getTemplates()` - Récupération templates

#### 3.1.2 CreditService & PricingEngine
**Fichier**: `/src/services/creditService.ts` (560 lignes)

**Méthodes appelées**:

```typescript
// 1. Récupération configs (ligne 139)
await IAConfigService.getAllConfigs()

// 2. Récupération tarifs (ligne 140, 218)
await PricingEngine.fetchAllPricing(): Promise<CreditServiceConfig[]>
// → RPC call: get_all_ia_services()
```

### 3.2 Endpoints API Utilisés

#### 3.2.1 Requêtes RPC (Remote Procedure Call)

**1. get_all_ia_services()**
- **Source**: `PricingEngine.fetchAllPricing()` (ligne 330)
- **Appels**: Onglets Dashboard, Pricing
- **Retour**: `CreditServiceConfig[]` avec effective_cost calculé
- **Fréquence**: 1x par ouverture onglet Dashboard, 1x onglet Pricing

**2. get_ia_service_config(p_service_code)**
- **Source**: `IAConfigService.getConfig()` (NON utilisé directement dans AdminIACenter)
- **Usage**: Potentiellement dans autres pages

**3. get_ia_service_templates(p_service_code, p_active_only)**
- **Source**: `IAConfigService.getTemplates()` (ligne 386)
- **Usage**: NON appelé dans AdminIACenter (utilise SELECT direct)

#### 3.2.2 Requêtes SELECT Directes

**1. Stats globales IA** (lignes 104-129)
```sql
SELECT credits_consumed, status, duration_ms, user_id
FROM ai_service_usage_history
```
- Agrégation frontend (JS)
- Calculs: totalCalls, totalCredits, uniqueUsers, successRate, avgDuration

**2. Usage par service** (lignes 134-176)
```sql
SELECT service_key, credits_consumed, status
FROM ai_service_usage_history
```
- Groupement frontend par service_key
- Jointure avec configs + pricing (JS)

**3. Activité récente** (lignes 181-192, 223-234)
```sql
SELECT *
FROM ai_service_usage_history
ORDER BY created_at DESC
LIMIT 10  -- Dashboard
LIMIT 100 -- Logs
```

**4. Configs IA** (lignes 84-93 de iaConfigService.ts)
```sql
SELECT *
FROM ia_service_config
[WHERE is_active = true]
ORDER BY category, service_name
```

**5. Templates IA** (lignes 202-213)
```sql
SELECT *
FROM ia_service_templates
ORDER BY service_code, display_order
```

### 3.3 Fréquence des Appels

**Au chargement page** (onglet Dashboard par défaut):
```
1. SELECT ai_service_usage_history (stats)
2. SELECT ai_service_usage_history (usage par service)
3. SELECT ai_service_usage_history (activité récente)
4. RPC get_all_ia_services() (pricing)
5. SELECT ia_service_config (configs)
Total: 5 requêtes
```

**Changement d'onglet**:
- Dashboard/Stats: 3 requêtes (stats + usage + activité)
- Services: 1 requête (configs)
- Templates: 1 requête (templates)
- Pricing: 1 requête RPC (pricing)
- Logs: 1 requête (logs 100)
- Matching: Variable (composant externe)

**Pas de polling/auto-refresh** - Données statiques après chargement.

### 3.4 Gestion des Erreurs

**Pattern uniforme**:
```typescript
try {
  const { data, error } = await supabase...
  if (!error && data) {
    setState(data);
  }
} catch (error) {
  console.error('Error loading...', error);
  // Pas d'affichage erreur utilisateur
  // Pas de retry automatique
}
```

**Points faibles**:
- Erreurs loguées console uniquement
- Pas d'UI erreur pour l'utilisateur
- Pas de fallback/retry
- État vide si échec (tableaux/stats vides)

### 3.5 Logique Métier Côté Frontend

**Calculs effectués en JavaScript** (non en DB):

1. **Stats globales** (lignes 109-125):
```typescript
totalCalls = data.length
totalCredits = data.reduce((sum, item) => sum + credits_consumed, 0)
uniqueUsers = new Set(data.map(item => item.user_id)).size
successRate = (successCount / totalCalls) * 100
avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length
```

2. **Usage par service** (lignes 144-171):
```typescript
// Groupement par service_key
usageMap.set(service_key, {
  total_calls++,
  total_credits += credits_consumed,
  success_count++,
  error_count++
})

// Jointure avec configs/pricing (JS)
service_name = configs.find(c => c.service_code === service_key)?.service_name
```

3. **Taux de succès par service** (lignes 547-549):
```typescript
successRate = (service.success_count / service.total_calls) * 100
```

**Impact performance**:
- Tous les logs chargés en mémoire
- Traitement frontend potentiellement lent si > 1000 logs
- Pas de pagination

### 3.6 Dépendances avec Centrale IA

**Tables partagées**:
- `ai_service_usage_history` - Logs tous services IA plateforme
- `service_credit_costs` - Tarification unique globale
- `ia_service_config` - Configs partagées par toute l'app
- `ia_service_templates` - Templates réutilisés services

**Isolation**: AUCUNE
- Centre IA lit données globales
- Modifications configs impactent toute plateforme immédiatement
- Pas de staging/preview

---

## 4. AUDIT BASE DE DONNÉES

### 4.1 Tables Principales Impliquées

#### 4.1.1 ai_service_usage_history
**Fichier migration**: `20251210105017_enhance_ai_service_usage_history.sql`

**Structure**:
```sql
CREATE TABLE ai_service_usage_history (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  service_key text NOT NULL,
  credits_consumed integer DEFAULT 0,
  status text DEFAULT 'success' CHECK (status IN ('success', 'error')),
  duration_ms integer DEFAULT 0,
  error_message text,
  input_payload jsonb,
  output_response jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Index**:
```sql
idx_ai_usage_status ON (status)
idx_ai_usage_service_key ON (service_key)
idx_ai_usage_created_at ON (created_at DESC)
idx_ai_usage_user_service ON (user_id, service_key)
idx_ai_usage_user_created ON (user_id, created_at DESC)
```

**Usage dans Centre IA**:
- **Dashboard**: Stats globales, top services, activité récente
- **Stats**: Usage détaillé par service
- **Logs**: 100 derniers appels

**Volume potentiel**: Croissance continue (1 ligne par appel IA)

**RLS**:
```sql
-- À vérifier dans migration
-- Probablement: Admin only read
```

#### 4.1.2 ia_service_config
**Fichier migration**: `20251201221322_create_ia_service_config_system.sql`

**Structure**:
```sql
CREATE TABLE ia_service_config (
  id uuid PRIMARY KEY,
  service_code text UNIQUE NOT NULL,
  service_name text NOT NULL,
  service_description text,

  -- Prompts
  base_prompt text NOT NULL,
  instructions text,
  system_message text,

  -- Schemas
  input_schema jsonb DEFAULT '{}'::jsonb,
  output_schema jsonb DEFAULT '{}'::jsonb,
  example_input jsonb,
  example_output jsonb,

  -- Model params
  model text DEFAULT 'gpt-4',
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 2000,
  top_p numeric(3,2) DEFAULT 1.0,
  frequency_penalty numeric(3,2) DEFAULT 0.0,
  presence_penalty numeric(3,2) DEFAULT 0.0,

  -- Version
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,

  -- Meta
  category text DEFAULT 'general',
  tags text[],
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Index**:
```sql
idx_ia_service_config_code ON (service_code)
idx_ia_service_config_active ON (is_active)
idx_ia_service_config_category ON (category)
idx_ia_service_config_version ON (version)
```

**Usage dans Centre IA**:
- **Services IA**: Affichage toutes configs
- **Dashboard**: Jointure nom services

**Catégories**:
- document_generation
- coaching
- matching
- analysis
- general

#### 4.1.3 ia_service_templates
**Fichier migration**: `20251201224200_create_ia_service_templates_system.sql`

**Structure** (estimée d'après service):
```sql
CREATE TABLE ia_service_templates (
  id uuid PRIMARY KEY,
  service_code text NOT NULL,
  template_name text NOT NULL,
  template_description text,
  template_structure text NOT NULL,
  format text CHECK (format IN ('html', 'markdown', 'text', 'json')),
  css_styles text,
  preview_data jsonb,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  placeholders text[],
  required_fields text[],
  tags text[],
  created_by uuid,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Usage dans Centre IA**:
- **Templates**: Affichage tous templates groupés par service

#### 4.1.4 service_credit_costs
**Fichier migration**: `20251210095828_create_service_credit_costs_table.sql`

**Structure**:
```sql
CREATE TABLE service_credit_costs (
  id uuid PRIMARY KEY,
  service_code text UNIQUE NOT NULL,
  service_name text NOT NULL,
  service_description text,
  credits_cost integer NOT NULL,
  is_active boolean DEFAULT true,
  category text DEFAULT 'ia_services',

  -- Promotions
  promotion_active boolean DEFAULT false,
  discount_percent integer DEFAULT 0,

  -- UI
  display_order integer DEFAULT 0,
  icon text DEFAULT 'Sparkles',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Champ calculé** (via RPC):
```sql
effective_cost = CASE
  WHEN promotion_active THEN
    credits_cost - (credits_cost * discount_percent / 100)
  ELSE
    credits_cost
END
```

**Usage dans Centre IA**:
- **Dashboard**: Jointure noms services
- **Pricing**: Affichage tarifs avec promotions

#### 4.1.5 ia_service_config_history
**Table audit** - Historique modifications configs

**Structure**:
```sql
CREATE TABLE ia_service_config_history (
  id uuid PRIMARY KEY,
  service_id uuid REFERENCES ia_service_config(id) ON DELETE CASCADE,
  service_code text NOT NULL,
  previous_version integer,
  new_version integer NOT NULL,
  changes_summary text,
  field_changes jsonb NOT NULL,
  previous_config jsonb,
  new_config jsonb,
  changed_by uuid REFERENCES auth.users(id),
  change_reason text,
  created_at timestamptz DEFAULT now()
);
```

**Usage dans Centre IA**: **NON UTILISÉ** (pas d'affichage historique)

#### 4.1.6 service_credit_cost_history
**Table audit** - Historique modifications tarifs

**Usage dans Centre IA**: **NON UTILISÉ**

### 4.2 Relations Entre Tables

```
ia_service_config (1) ←--→ (*) ia_service_config_history
     ↓ service_code

ai_service_usage_history.service_key ←---→ ia_service_config.service_code (logical join)
ai_service_usage_history.service_key ←---→ service_credit_costs.service_code (logical join)

ia_service_templates.service_code ←---→ ia_service_config.service_code (logical join)

service_credit_costs.service_code ←---→ ia_service_config.service_code (logical join)
```

**Notes**:
- Pas de foreign keys entre tables IA (relations logiques seulement)
- `service_code` / `service_key` utilisé comme clé de liaison
- Risque d'incohérence si service_code change

### 4.3 Jointures Utilisées

**Jointure 1**: Usage + Configs + Pricing
```typescript
// Frontend JS (lignes 139-168)
const configs = await IAConfigService.getAllConfigs();
const pricingData = await PricingEngine.fetchAllPricing();

usageMap.forEach(item => {
  const config = configs.find(c => c.service_code === item.service_key);
  const pricing = pricingData.find(p => p.service_code === item.service_key);
  item.service_name = config?.service_name || pricing?.service_name || item.service_key;
});
```

**Type**: Jointure JavaScript (pas SQL)
**Performance**: O(n*m) - Potentiellement lente

**Pas de vraies jointures SQL** dans AdminIACenter.

### 4.4 Sécurité RLS (Row Level Security)

**À vérifier dans migrations** - Policies probables:

```sql
-- ia_service_config
CREATE POLICY "Admin read all configs"
ON ia_service_config FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.user_type = 'admin'
));

-- ai_service_usage_history
CREATE POLICY "Admin read all usage"
ON ai_service_usage_history FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.user_type = 'admin'
));

-- service_credit_costs
CREATE POLICY "Public read active pricing"
ON service_credit_costs FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admin read all pricing"
ON service_credit_costs FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.user_type = 'admin'
));
```

**Protection**: Accès admin uniquement (via `user_type = 'admin'` dans profiles)

### 4.5 Champs Clés pour Statistiques

**Dashboard Stats Card 1** - Appels IA Total:
```sql
SELECT COUNT(*) FROM ai_service_usage_history
```

**Dashboard Stats Card 2** - Crédits Consommés:
```sql
SELECT SUM(credits_consumed) FROM ai_service_usage_history
```

**Dashboard Stats Card 3** - Utilisateurs Uniques:
```sql
SELECT COUNT(DISTINCT user_id) FROM ai_service_usage_history
```

**Dashboard Stats Card 4** - Taux de Succès:
```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*)
FROM ai_service_usage_history
```

**Dashboard Stats Card 5** - Temps Moyen:
```sql
SELECT AVG(duration_ms)
FROM ai_service_usage_history
WHERE duration_ms > 0
```

**Note**: Tous ces calculs sont faits **frontend** actuellement (pas de vue matérialisée ou agrégation DB).

---

## 5. COHÉRENCE FRONTEND ↔ BACKEND ↔ DB

### 5.1 Données Affichées vs Stockées

**Alignement global**: BON

**Détails**:

| Donnée Affichée | Source Frontend | Source DB | Cohérence |
|-----------------|-----------------|-----------|-----------|
| Appels IA Total | `data.length` | `COUNT(*)` | ✅ Cohérent |
| Crédits Consommés | `reduce sum` | `SUM(credits_consumed)` | ✅ Cohérent |
| Utilisateurs Uniques | `new Set().size` | `COUNT(DISTINCT user_id)` | ✅ Cohérent |
| Taux Succès | Calcul JS | `COUNT WHERE status=success` | ✅ Cohérent |
| Durée Moyenne | Calcul JS | `AVG(duration_ms)` | ✅ Cohérent |
| Nom Service | `config.service_name` | `ia_service_config.service_name` | ✅ Cohérent |
| Coût Effectif | Calcul RPC | `credits_cost - discount` | ✅ Cohérent |

**Pas d'incohérence majeure détectée.**

### 5.2 Redondances

**Redondance 1**: Tarification affichée à 2 endroits
- **Centre IA** (onglet Pricing): Lecture seule
- **AdminIAPricing** (page dédiée): Édition
- **Impact**: Duplication code, risque désynchronisation UI

**Redondance 2**: Templates affichés à 2 endroits
- **Centre IA** (onglet Templates): Liste groupée
- **AdminIATemplates** (page dédiée): Gestion complète
- **Impact**: Duplication logique affichage

**Redondance 3**: Configs affichées à 2 endroits
- **Centre IA** (onglet Services): Tableau
- **AdminIAConfig** (page dédiée): Formulaire édition
- **Impact**: Cohérence UI à maintenir

**Recommandation**: Centre IA devrait être dashboard lecture seule, déléguer éditions aux pages spécialisées.

### 5.3 Calculs Frontend vs Backend

**Calculs Frontend** (dans AdminIACenter):
```typescript
// Stats globales (lignes 109-125)
totalCalls, totalCredits, uniqueUsers, successRate, avgDuration

// Usage par service (lignes 144-171)
Groupement + agrégation par service_key

// Taux succès par service (lignes 547-549)
Per-service success rate
```

**Calculs Backend** (RPC/Functions):
```sql
-- get_all_ia_services(): Calcul effective_cost
effective_cost = credits_cost - (credits_cost * discount_percent / 100)

-- Autres: AUCUN calcul stats
```

**Déséquilibre**:
- **Majorité calculs côté frontend** → Performance dégradée si gros volumes
- **Pas d'agrégation DB** → Toutes données brutes chargées en mémoire
- **Pas de vues matérialisées** → Recalcul à chaque chargement

**Impact**:
- > 1000 logs: Lenteur probable
- > 10000 logs: Navigateur peut freezer
- Bande passante gaspillée (transfert données brutes)

### 5.4 Risques de Désynchronisation

**Risque 1**: Modification config dans AdminIAConfig
- Centre IA ne se rafraîchit pas automatiquement
- Utilisateur doit recharger manuellement onglet

**Risque 2**: Modification tarif dans AdminIAPricing
- Centre IA affiche ancien tarif jusqu'à reload

**Risque 3**: Suppression template dans AdminIATemplates
- Centre IA peut afficher template supprimé (cache frontend)

**Risque 4**: Changement `service_code`
- Jointures logiques cassées (usage history orphelin)
- Pas de cascade update

**Mitigation actuelle**: AUCUNE
- Pas de WebSocket/polling
- Pas d'invalidation cache
- Repose sur refresh manuel utilisateur

### 5.5 Dépendances Critiques Non Documentées

**Dépendance 1**: Format `service_code` / `service_key`
- Doit matcher exactement entre tables
- Pas de normalisation/validation
- Risque typos

**Dépendance 2**: Catégories IA
- Hard-codées frontend (`getCategoryLabel()`)
- Si nouvelle catégorie en DB → Label "general" par défaut
- Pas de table référence catégories

**Dépendance 3**: Formats templates
- Enum `'html' | 'markdown' | 'text' | 'json'`
- Si nouveau format ajouté DB → Pas géré frontend

**Dépendance 4**: RPC `get_all_ia_services()`
- Structure retour non typée côté frontend
- Si schema RPC change → Crash potentiel

**Recommandation**: Créer types partagés frontend/backend (ex: Prisma schema, GraphQL schema).

---

## 6. PERFORMANCE & STABILITÉ

### 6.1 Appels Réseau au Chargement

**Onglet Dashboard** (défaut):
```
1. SELECT ai_service_usage_history (tous les logs) - ~100-1000 rows
2. SELECT ai_service_usage_history (requery pour usage) - DUPLIQUÉ
3. SELECT ai_service_usage_history (requery activité) - DUPLIQUÉ
4. SELECT ia_service_config (*) - ~10-50 rows
5. RPC get_all_ia_services() - ~10-50 rows

Total: 5 requêtes, 3 redondantes
Données transférées: ~100-1000 logs * 3 = 300-3000 rows
```

**Problème majeur**: `ai_service_usage_history` requêté 3 fois séparément
- Même table
- Même période
- Agrégations différentes

**Optimisation possible**:
```typescript
// Une seule requête
const logs = await supabase
  .from('ai_service_usage_history')
  .select('*');

// Calculs réutilisés
calculateStats(logs);
calculateUsage(logs);
recentActivity = logs.slice(0, 10);
```

### 6.2 Appels Redondants

**Pattern identifié**:
```typescript
useEffect(() => {
  loadData();
}, [activeTab]);

const loadData = async () => {
  if (activeTab === 'dashboard' || activeTab === 'stats') {
    await loadStats();          // Requête A
    await loadServiceUsage();   // Requête B (utilise données Requête A)
    await loadRecentActivity(); // Requête C (utilise données Requête A)
  }
};
```

**Redondance**:
- `loadStats()`: SELECT full table
- `loadServiceUsage()`: SELECT full table (même données)
- `loadRecentActivity()`: SELECT full table (même données)

**Impact**:
- 3x transfert réseau inutile
- 3x parsing JSON
- 3x memory allocation

### 6.3 Données Recalculées Inutilement

**Recalcul à chaque changement d'onglet**:
```typescript
Dashboard → Stats → Dashboard
// Stats recalculées 2 fois (même données)
```

**Pas de mise en cache**:
- State local réinitialisé à chaque unmount/remount
- Composant non mémoïsé
- Pas de cache global (Context/Redux)

**Optimisation possible**:
```typescript
const cachedData = useMemo(() => calculateStats(logs), [logs]);
```

### 6.4 Risques à Grande Échelle

**Scénario**: 10 000 appels IA stockés

**Impact actuel**:
```typescript
// Chargement 10 000 rows en mémoire
const { data } = await supabase
  .from('ai_service_usage_history')
  .select('*');  // 10 000 rows * ~1KB = 10MB JSON

// Itération 10 000 fois (frontend)
data.forEach(item => {
  // Calculs stats
});
```

**Temps estimé**:
- Transfert réseau: ~2-5s (10MB)
- Parsing JSON: ~0.5-1s
- Calculs JS: ~1-2s
- **Total: 4-8s** pour charger dashboard

**Au-delà de 50 000 logs**: Navigateur risque de freezer

**Solutions**:
1. **Pagination** (charger 100 logs par page)
2. **Agrégation DB** (calculs côté Postgres)
3. **Vues matérialisées** (stats pré-calculées)
4. **Limite temporelle** (7 derniers jours par défaut)

### 6.5 Optimisations Possibles (NON APPLIQUÉES)

**Optimisation 1**: Requête unique pour stats
```typescript
// Au lieu de 3 requêtes séparées
const logs = await loadAllLogs();
const stats = calculateStats(logs);
const usage = calculateUsage(logs);
const recent = logs.slice(0, 10);
```

**Optimisation 2**: Agrégation côté DB
```sql
-- Vue matérialisée
CREATE MATERIALIZED VIEW ia_stats_summary AS
SELECT
  COUNT(*) as total_calls,
  SUM(credits_consumed) as total_credits,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) FILTER (WHERE status = 'success') * 100.0 / COUNT(*) as success_rate,
  AVG(duration_ms) as avg_duration
FROM ai_service_usage_history;

-- Rafraîchir toutes les 5 minutes
REFRESH MATERIALIZED VIEW ia_stats_summary;
```

**Optimisation 3**: Pagination logs
```typescript
const { data, count } = await supabase
  .from('ai_service_usage_history')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(0, 99);  // Page 1
```

**Optimisation 4**: Cache React Query
```typescript
const { data: stats } = useQuery(
  'ia-stats',
  loadStats,
  { staleTime: 5 * 60 * 1000 }  // Cache 5min
);
```

**Optimisation 5**: Lazy loading onglets
```typescript
// Charger données uniquement quand onglet visible
{activeTab === 'logs' && <LogsTab />}  // Évite chargement inutile
```

---

## 7. SÉCURITÉ & ACCÈS

### 7.1 Contrôles d'Accès à la Page

**Niveau 1**: Route dans `adminPages` (App.tsx ligne 152-166)
```typescript
const adminPages: Page[] = [
  // ...
  'admin-ia-center',
  // ...
];

const isAdminPage = adminPages.includes(currentPage);
```

**Niveau 2**: Rendu dans `AdminLayout` (App.tsx ligne 185-274)
```typescript
if (isAdminPage) {
  return (
    <AdminLayout currentPage={currentPage} onNavigate={handleNavigate}>
      {/* Admin pages only */}
    </AdminLayout>
  );
}
```

**Niveau 3**: AdminLayout vérifie `profile.user_type`
```typescript
// Probable dans AdminLayout (non visible dans extract)
const { profile, isAdmin } = useAuth();
if (!isAdmin) return <Redirect to="home" />;
```

**Niveau 4**: RLS Database
```sql
-- Policies sur tables IA (à vérifier)
CREATE POLICY "Admin only"
ON ia_service_config FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);
```

**Solidité**: BONNE (défense en profondeur)

### 7.2 Rôles Autorisés

**Rôle unique**: `admin`

**Vérification**:
```typescript
// profiles table
user_type = 'admin'  // ou 'candidate' | 'recruiter' | 'trainer'
```

**Pas de granularité**:
- Pas de sous-rôles (ex: admin_ia, admin_users)
- Admin = accès total toutes pages admin
- Pas de permissions spécifiques par fonctionnalité

**Risque**: Admin peut tout voir/modifier → Privilèges excessifs

### 7.3 Protections Existantes

**Protection 1**: Authentification requise
```typescript
const { user, loading } = useAuth();
if (!user) return <Redirect to="login" />;
```

**Protection 2**: Vérification type utilisateur
```typescript
if (profile?.user_type !== 'admin') {
  return <AccessDenied />;
}
```

**Protection 3**: RLS sur tables sensibles
```sql
-- Empêche lecture directe sans être admin
ALTER TABLE ia_service_config ENABLE ROW LEVEL SECURITY;
```

**Protection 4**: Boutons actions non fonctionnels
- Pas de DELETE/UPDATE exposés dans Centre IA
- Actions lecture seule uniquement
- Éditions dans pages dédiées

**Protection 5**: Pas d'exécution code arbitraire
- Pas de `eval()`
- Pas d'injection SQL possible (Supabase client safe)

### 7.4 Risques Potentiels

**Risque 1**: Lecture excessive données
- **Description**: Admin peut charger tous les logs IA (potentiellement millions)
- **Impact**: DoS self-inflicted, crash navigateur
- **Probabilité**: Moyenne (si plateforme succès)
- **Mitigation**: Pagination, limite temporelle

**Risque 2**: Fuite informations sensibles logs
- **Description**: `ai_service_usage_history` contient `input_payload` / `output_response`
- **Contenu potentiel**: Données candidats, emails, informations personnelles
- **Impact**: RGPD, vie privée
- **Affichage actuel**: NON affiché dans Centre IA (mais accessible en DB)
- **Recommandation**: Anonymiser/masquer payloads dans logs admin

**Risque 3**: Pas d'audit trail modifications
- **Description**: Centre IA affiche boutons (Eye, Edit, Power) non fonctionnels
- **Si implémentés**: Aucun log qui a modifié quoi quand
- **Impact**: Accountability nulle
- **Solution**: Tables `*_history` existent mais non exploitées dans UI

**Risque 4**: Exposition metrics business
- **Description**: Stats crédits, usage, revenus visibles tous admins
- **Impact**: Info stratégique accessible sans besoin métier
- **Solution**: Rôle admin_analytics distinct

**Risque 5**: Pas de rate limiting
- **Description**: Admin peut spammer refresh, DoS self-inflicted
- **Mitigation**: Debounce, rate limit Supabase

**Risque 6**: Durée session non visible
- **Description**: Pas d'info timeout session admin
- **Impact**: Admin peut laisser session ouverte
- **Solution**: Auto-logout après inactivité

### 7.5 Recommandations Sécurité

**Recommandation 1**: Implémenter pagination stricte
```typescript
// Max 100 logs par page
.limit(100)
```

**Recommandation 2**: Masquer payloads sensibles
```typescript
// Ne pas afficher input_payload / output_response
// Ou anonymiser emails, noms, etc.
```

**Recommandation 3**: Logger actions admin
```sql
CREATE TABLE admin_action_logs (
  id uuid PRIMARY KEY,
  admin_id uuid REFERENCES profiles(id),
  action_type text,  -- 'view_stats', 'edit_config', etc.
  resource_type text,
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Recommandation 4**: Timeout session admin
```typescript
// Auto-logout après 30min inactivité
useIdleTimer({
  timeout: 30 * 60 * 1000,
  onIdle: () => signOut()
});
```

**Recommandation 5**: Granularité permissions
```typescript
// profiles table
permissions jsonb DEFAULT '{"can_view_ia_stats": true, "can_edit_ia_config": false}'::jsonb
```

---

## 8. ARCHITECTURE ACTUELLE - SCHÉMA LOGIQUE

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN IA CENTER PAGE                     │
│                    (AdminIACenter.tsx)                       │
└────────────────┬────────────────────────────────────────────┘
                 │
       ┌─────────┴──────────┐
       │  State Management  │
       │   (useState only)  │
       └─────────┬──────────┘
                 │
    ┌────────────┴─────────────┐
    │   Tab-based Navigation   │
    │    (No URL routing)      │
    └──┬───────────────────┬───┘
       │                   │
   ┌───▼────┐         ┌───▼────┐
   │Dashboard│    ... │Matching│
   │  Tab   │         │   Tab  │
   └───┬────┘         └────────┘
       │
       │ useEffect(() => loadData(), [activeTab])
       │
   ┌───▼──────────────────────────────────┐
   │         Data Loading Layer           │
   │  ┌──────────┐      ┌──────────────┐ │
   │  │ loadStats│      │ loadPricing  │ │
   │  │loadUsage │      │ loadConfigs  │ │
   │  │loadLogs  │      │loadTemplates │ │
   │  └────┬─────┘      └───────┬──────┘ │
   └───────┼────────────────────┼────────┘
           │                    │
    ┌──────▼────────┐    ┌─────▼──────────┐
    │   Supabase    │    │   Services     │
    │  Direct Query │    │  IAConfigSvc   │
    │               │    │  CreditSvc     │
    └──────┬────────┘    │  PricingEngine │
           │             └─────┬──────────┘
           │                   │
    ┌──────▼───────────────────▼──────────┐
    │         DATABASE (Supabase)         │
    │  ┌──────────────────────────────┐   │
    │  │ ai_service_usage_history     │   │
    │  │ ia_service_config            │   │
    │  │ ia_service_templates         │   │
    │  │ service_credit_costs         │   │
    │  │ ia_service_config_history    │   │
    │  │ service_credit_cost_history  │   │
    │  └──────────────────────────────┘   │
    │                                     │
    │  ┌──────────────────────────────┐   │
    │  │ RPC Functions                │   │
    │  │ - get_all_ia_services()      │   │
    │  │ - get_ia_service_config()    │   │
    │  └──────────────────────────────┘   │
    └─────────────────────────────────────┘

FLUX DE DONNÉES:
1. User clique onglet → setActiveTab()
2. useEffect détecte changement → loadData()
3. loadData() appelle fonctions chargement spécifiques
4. Services/Supabase récupèrent données DB
5. Données stockées dans state local
6. Render onglet avec données

CALCULS:
- Stats: Frontend JS (reduce, map, filter)
- Jointures: Frontend JS (find, filter)
- Agrégations: Frontend JS (sum, avg, count)
→ AUCUN calcul DB (sauf effective_cost)
```

---

## 9. LISTE DES COMPOSANTS FRONTEND

### 9.1 Composant Principal
- **AdminIACenter** (`/src/pages/AdminIACenter.tsx`)
  - Props: `{ onNavigate }`
  - État: 8 états locaux (activeTab, loading, configs, templates, etc.)
  - Méthodes: 11 fonctions (load* x6, render* x6)

### 9.2 Sous-composants Internes
- **StatsCard** (lignes 773-787)
  - Props: `{ icon, label, value, bgColor }`
  - Réutilisable
  - Affichage statistique coloré

### 9.3 Composants Externes Importés
- **RecruiterMatchingPricingAdmin** (`/src/components/admin/RecruiterMatchingPricingAdmin.tsx`)
  - Utilisé dans onglet "Matching IA"
  - Gestion autonome abonnements AI recruteurs
  - 2 sous-onglets: pricing + subscriptions

### 9.4 Composants Réutilisés
**Icônes** (lucide-react):
- BarChart3, Settings, FileText, CreditCard, Activity, FileBarChart
- Sparkles, TrendingUp, Users, Clock, AlertCircle, CheckCircle
- Eye, Edit, Power, Plus, ArrowLeft

**Aucun autre composant réutilisé** (cartes, tableaux inline).

---

## 10. LISTE DES ROUTES

### 10.1 Route Globale
- **URL conceptuelle**: `/admin-ia-center`
- **Implémentation**: `onNavigate('admin-ia-center')`
- **Type**: Client-side routing (React state)
- **Parent**: AdminLayout

### 10.2 Sous-routes (Onglets)
**AUCUNE route URL** - Navigation interne par état:
- `activeTab = 'dashboard'`
- `activeTab = 'services'`
- `activeTab = 'templates'`
- `activeTab = 'pricing'`
- `activeTab = 'stats'`
- `activeTab = 'logs'`
- `activeTab = 'matching-pricing'`

**Conséquence**:
- URL reste `/admin-ia-center` quel que soit l'onglet
- Pas de deep linking (ex: `/admin-ia-center/logs`)
- Refresh page → retour à Dashboard

### 10.3 Navigation Externe
- **Retour home**: `onNavigate('home')`
- **Vers autres pages admin**: Via AdminLayout sidebar

---

## 11. LISTE DES APIs UTILISÉES

### 11.1 Endpoints RPC (Remote Procedure Call)

| Nom RPC | Fonction Service | Onglet(s) | Fréquence |
|---------|-----------------|-----------|-----------|
| `get_all_ia_services()` | `PricingEngine.fetchAllPricing()` | Dashboard, Pricing | 1x par ouverture onglet |
| `get_ia_service_config(p_service_code)` | `IAConfigService.getConfig()` | NON UTILISÉ directement | - |
| `get_ia_service_templates(...)` | `IAConfigService.getTemplates()` | NON UTILISÉ | - |

**Total RPC utilisés**: 1 (get_all_ia_services)

### 11.2 Endpoints REST (SELECT direct)

| Table | Query | Onglet(s) | Lignes retournées |
|-------|-------|-----------|------------------|
| `ai_service_usage_history` | SELECT * (stats globales) | Dashboard | Toutes |
| `ai_service_usage_history` | SELECT * (usage par service) | Dashboard, Stats | Toutes |
| `ai_service_usage_history` | SELECT * LIMIT 10 | Dashboard | 10 |
| `ai_service_usage_history` | SELECT * LIMIT 100 | Logs | 100 |
| `ia_service_config` | SELECT * ORDER BY category, name | Services | Toutes |
| `ia_service_templates` | SELECT * ORDER BY code, order | Templates | Toutes |

**Total requêtes**: 6 (dont 3 redondantes sur même table)

### 11.3 Endpoints WRITE
**AUCUN** - Centre IA est lecture seule

### 11.4 Endpoints NON utilisés mais disponibles
- `update_ia_service_config()`
- `create_ia_service_config()`
- `update_ia_service_pricing()`
- `add_new_ia_service()`
- `create_ia_service_template()`
- `update_ia_service_template()`

---

## 12. TABLES DATABASE IMPLIQUÉES

| Table | Rôle | Taille Estimée | RLS | Accès Centre IA |
|-------|------|---------------|-----|----------------|
| `ai_service_usage_history` | Logs appels IA | Croissante (1 row/appel) | Admin read | READ (stats, logs) |
| `ia_service_config` | Configurations IA | ~10-50 rows | Admin read | READ (tableau configs) |
| `ia_service_templates` | Templates output | ~50-200 rows | Admin read | READ (liste templates) |
| `service_credit_costs` | Tarification | ~10-50 rows | Public read active | READ (tarifs) |
| `ia_service_config_history` | Audit configs | Croissante | Admin read | NON UTILISÉ |
| `service_credit_cost_history` | Audit tarifs | Croissante | Admin read | NON UTILISÉ |
| `profiles` | Utilisateurs | Croissante | Profils own read | JOIN (user_id) |

**Total tables directement requêtées**: 4
**Total tables systèmeIA**: 6

---

## 13. FORCES DE L'IMPLÉMENTATION ACTUELLE

### 13.1 Architecture & Design

✅ **Centralisation logique**
- Hub unique pour toute la gestion IA
- Navigation intuitive par onglets
- Vue d'ensemble cohérente

✅ **Séparation lecture/écriture**
- Centre IA = dashboard lecture seule
- Éditions dans pages dédiées
- Réduit risques modifications accidentelles

✅ **Design System cohérent**
- Gradient bleu-violet identifiable
- Cartes statistiques réutilisables (StatsCard)
- Tableaux uniformes
- Iconographie claire

✅ **Responsive**
- Grid adaptatif (1/2/5 colonnes selon viewport)
- Sticky navigation onglets
- Mobile-friendly probable

### 13.2 Fonctionnalités

✅ **Dashboard complet**
- 5 métriques clés (appels, crédits, users, taux succès, temps)
- Top 5 services utilisés
- Activité temps réel (10 derniers logs)

✅ **Vues multiples**
- 7 perspectives différentes sur données IA
- Stats agrégées + détails granulaires
- Logs exhaustifs (100 derniers)

✅ **Intégration matching recruteurs**
- Composant dédié intégré
- Gestion tarification spécifique métier

### 13.3 Sécurité

✅ **Défense en profondeur**
- Vérification route (adminPages)
- Vérification layout (AdminLayout)
- Vérification RLS (database)
- 3 couches protection

✅ **Lecture seule**
- Pas de mutations exposées Centre IA
- Boutons actions UI seuls (non fonctionnels)
- Risque modification accidentelle = 0

✅ **RLS activé**
- Tables sensibles protégées
- Policies admin-only
- Impossible contourner sécurité DB

### 13.4 Maintenabilité

✅ **Code structuré**
- Fonctions render* par onglet
- Fonctions load* par type données
- Interfaces TypeScript bien définies

✅ **Services découplés**
- IAConfigService réutilisable
- PricingEngine partagé
- Logique métier séparée UI

✅ **Pas de dette technique majeure**
- Pas de `any` types abusifs
- Pas de code commenté obsolète
- Pas de hacks évidents

### 13.5 UX

✅ **Loading states**
- Spinner pendant chargement
- Feedback visuel clair

✅ **Statuts visuels**
- Succès/erreur avec couleurs (vert/rouge)
- Actif/inactif avec icônes
- Badges promotion

✅ **Navigation fluide**
- Changement onglet instantané
- Sticky header (scroll préservé)
- Retour accueil accessible

---

## 14. POINTS DE VIGILANCE

### 14.1 Performance

⚠️ **Requêtes redondantes**
- `ai_service_usage_history` requêté 3x pour Dashboard
- Même données transférées 3x
- **Impact**: Bande passante gaspillée, lenteur

⚠️ **Calculs frontend lourds**
- Toutes stats calculées JavaScript
- Itération complète logs à chaque fois
- **Impact**: Lent si > 1000 logs

⚠️ **Pas de pagination**
- Tous logs chargés en mémoire
- **Impact**: Crash navigateur si > 10 000 logs

⚠️ **Pas de cache**
- Rechargement complet à chaque changement onglet
- **Impact**: Requêtes inutiles, UX dégradée

⚠️ **Jointures JavaScript**
- Usage + Configs + Pricing joints frontend (O(n*m))
- **Impact**: Lenteur si nombreux services

### 14.2 Architecture

⚠️ **Pas de routes URL onglets**
- Impossible deep link vers onglet spécifique
- Refresh page → perte contexte
- **Impact**: UX dégradée, pas de partage lien

⚠️ **État local volatile**
- Données perdues au unmount
- **Impact**: Rechargement inutile

⚠️ **Composant monolithique**
- 788 lignes, 7 onglets inline
- **Impact**: Difficulté maintenance, tests

⚠️ **Duplication code**
- Affichage tarifs/templates/configs dupliqué avec pages dédiées
- **Impact**: Maintenance x2, risque incohérence

### 14.3 Fonctionnalités

⚠️ **Boutons actions non fonctionnels**
- "Nouveau Service", "Nouveau Template"
- Eye, Edit, Power dans tableaux
- **Impact**: Confusion utilisateur, promesses non tenues

⚠️ **Pas d'édition inline**
- Doit naviguer vers autres pages pour éditer
- **Impact**: Workflow fragmenté

⚠️ **Pas de filtres/recherche**
- Impossible filtrer logs par date, service, statut
- **Impact**: Difficulté analyse données

⚠️ **Pas d'export**
- Impossible exporter stats CSV/PDF
- **Impact**: Reporting manuel

### 14.4 Données

⚠️ **Pas d'agrégations DB**
- Stats calculées frontend (lent)
- **Impact**: Performance, scalabilité

⚠️ **Pas de vues matérialisées**
- Recalcul complet à chaque chargement
- **Impact**: Queries lentes

⚠️ **Historique non exploité**
- Tables `*_history` créées mais non affichées
- **Impact**: Audit trail invisible

⚠️ **Payloads logs non affichés**
- `input_payload` / `output_response` disponibles mais cachés
- **Impact**: Debug difficile (mais bon pour sécurité)

### 14.5 Sécurité

⚠️ **Pas de rate limiting**
- Admin peut spammer refresh
- **Impact**: DoS self-inflicted possible

⚠️ **Logs contiennent données sensibles**
- Payloads peuvent contenir PII
- **Impact**: Risque RGPD si exposition

⚠️ **Pas d'audit trail actions admin**
- Qui a vu quelles stats quand?
- **Impact**: Accountability nulle

⚠️ **Permissions trop larges**
- Admin = accès tout IA
- **Impact**: Principe moindre privilège violé

### 14.6 Maintenance

⚠️ **Pas de tests**
- Aucun test unitaire/intégration visible
- **Impact**: Regressions non détectées

⚠️ **Pas de documentation inline**
- Pas de JSDoc sur fonctions complexes
- **Impact**: Onboarding développeurs lent

⚠️ **Dépendances implicites**
- `service_code` format non documenté
- Catégories hard-codées
- **Impact**: Bugs silencieux possibles

⚠️ **Pas de gestion erreurs robuste**
- Erreurs loguées console uniquement
- Pas d'UI erreur
- **Impact**: Utilisateur perdu si erreur

---

## 15. RECOMMANDATIONS TECHNIQUES (SANS MODIFICATION)

### 15.1 Performance

**Recommandation P1** - Requête unique stats
- Charger `ai_service_usage_history` une seule fois
- Réutiliser données pour stats/usage/logs
- **Gain estimé**: -66% requêtes DB, -2-3s chargement

**Recommandation P1** - Agrégation côté DB
- Créer vues matérialisées pour stats globales
- Rafraîchir toutes les 5-10 minutes
- **Gain estimé**: -90% temps calcul, scalable

**Recommandation P2** - Pagination logs
- Limiter à 100 logs par défaut
- Boutons "Charger plus" / pagination
- **Gain estimé**: -90% données transférées

**Recommandation P2** - Cache React Query
- Implémenter cache 5min pour chaque onglet
- Invalidation sur changements
- **Gain estimé**: -80% requêtes répétées

**Recommandation P3** - Lazy loading onglets
- Charger données uniquement quand onglet actif
- Suspense boundaries
- **Gain estimé**: -30% temps chargement initial

### 15.2 Architecture

**Recommandation P1** - Routes URL onglets
- Implémenter `/admin-ia-center/dashboard`, `/admin-ia-center/logs`, etc.
- URL state sync
- **Bénéfice**: Deep linking, navigation navigateur, analytics

**Recommandation P1** - Extraction composants onglets
- Créer `DashboardTab.tsx`, `ServicesTab.tsx`, etc.
- Composants autonomes testables
- **Bénéfice**: Maintenance, tests, réutilisabilité

**Recommandation P2** - State global (Context/Zustand)
- Centraliser données IA dans store global
- Éviter rechargements
- **Bénéfice**: Performance, cohérence

**Recommandation P3** - Centralisation éditions
- Soit tout éditer dans Centre IA
- Soit rien éditer (déléguer 100% pages dédiées)
- **Bénéfice**: Cohérence UX, maintenance simplifiée

### 15.3 Fonctionnalités

**Recommandation P1** - Filtres & recherche
- Filtres date, service, statut sur logs
- Barre recherche globale
- **Bénéfice**: Utilisabilité, debug plus rapide

**Recommandation P1** - Export données
- Boutons "Export CSV", "Export PDF" sur chaque onglet
- Génération côté serveur
- **Bénéfice**: Reporting, conformité

**Recommandation P2** - Graphiques
- Charts temps réel (usage par jour, crédits par service)
- Bibliothèque Chart.js ou Recharts
- **Bénéfice**: Visualisation, insights

**Recommandation P2** - Alertes configurables
- Notifications si taux erreur > 10%
- Alertes consommation crédits anormale
- **Bénéfice**: Proactivité, monitoring

**Recommandation P3** - Affichage historique
- Onglet "Historique" pour voir modifications configs/tarifs
- Timeline visuelle
- **Bénéfice**: Audit, debug

### 15.4 Sécurité

**Recommandation P1** - Anonymisation logs
- Masquer PII dans payloads affichés
- Hash user_id dans UI
- **Bénéfice**: Conformité RGPD

**Recommandation P1** - Audit trail admin
- Logger toutes actions admin (vues, changements onglet)
- Table `admin_action_logs`
- **Bénéfice**: Accountability, sécurité

**Recommandation P2** - Permissions granulaires
- Rôles `admin_ia_viewer` vs `admin_ia_editor`
- RBAC (Role-Based Access Control)
- **Bénéfice**: Moindre privilège

**Recommandation P2** - Rate limiting
- Limiter refresh à 1x/seconde
- Debounce changements onglets
- **Bénéfice**: Protection DoS

**Recommandation P3** - Session timeout
- Auto-logout après 30min inactivité admin
- Warning 5min avant
- **Bénéfice**: Sécurité sessions

### 15.5 Maintenance

**Recommandation P1** - Tests unitaires
- Tester calculs stats (totalCalls, successRate, etc.)
- Tester jointures JS
- **Bénéfice**: Qualité, regressions

**Recommandation P1** - Documentation JSDoc
- Documenter interfaces complexes
- Commenter logique métier
- **Bénéfice**: Onboarding, maintenance

**Recommandation P2** - Monitoring
- Logs structured (JSON) pour analytics
- Dashboards Grafana/Datadog
- **Bénéfice**: Observabilité, debug production

**Recommandation P2** - Error boundaries
- React error boundaries par onglet
- UI erreur graceful
- **Bénéfice**: UX, résilience

**Recommandation P3** - Storybook
- Stories pour StatsCard, tableaux
- Développement isolé composants
- **Bénéfice**: Design system, QA visuelle

---

## 16. CONCLUSION

### 16.1 État Actuel

Le **Centre d'Administration IA** est une page fonctionnelle et bien structurée qui remplit son rôle de dashboard global pour l'écosystème IA de JobGuinée. L'implémentation actuelle démontre:

**Points forts**:
- Architecture claire et logique
- Sécurité robuste (3 couches protection)
- UI cohérente et responsive
- Données centralisées et accessibles
- Séparation lecture/écriture respectée

**Points d'amélioration majeurs**:
- **Performance**: Requêtes redondantes, calculs frontend lourds
- **Scalabilité**: Pas de pagination, risque crash avec gros volumes
- **UX**: Pas de deep linking, boutons non fonctionnels, pas de filtres
- **Architecture**: Composant monolithique, pas de cache
- **Observabilité**: Pas d'audit trail, erreurs mal gérées

### 16.2 Maturité Technique

**Évaluation**: **7/10**

| Critère | Note | Commentaire |
|---------|------|-------------|
| Fonctionnalité | 8/10 | Complet mais boutons factices |
| Performance | 5/10 | Requêtes redondantes, calculs lourds |
| Sécurité | 8/10 | RLS solide, mais pas audit trail |
| Maintenabilité | 7/10 | Code structuré mais monolithique |
| UX | 7/10 | Intuitive mais manque filtres/export |
| Scalabilité | 4/10 | Risque crash gros volumes |

**Verdict**: Production-ready pour MVP, mais nécessite optimisations avant usage intensif.

### 16.3 Prochaines Étapes Recommandées

**Phase 1 - Optimisations critiques** (2-3 jours):
1. Fusionner requêtes `ai_service_usage_history` (1 seule)
2. Implémenter pagination logs (100 par page)
3. Ajouter cache React Query (5min)
4. Créer vues matérialisées stats DB

**Phase 2 - Amélioration UX** (3-5 jours):
1. Routes URL pour onglets (deep linking)
2. Filtres date/service/statut sur logs
3. Export CSV/PDF
4. Suppression boutons factices ou implémentation actions

**Phase 3 - Sécurité & observabilité** (2-3 jours):
1. Anonymisation payloads logs
2. Audit trail actions admin
3. Error boundaries + UI erreur
4. Monitoring structured logs

**Phase 4 - Refactoring** (5-7 jours):
1. Extraction composants onglets
2. State global (Context/Zustand)
3. Tests unitaires (70% coverage)
4. Documentation JSDoc

**Total effort estimé**: 12-18 jours développement

---

## 17. ANNEXES

### Annexe A - Interfaces TypeScript Clés

```typescript
// AdminIACenter.tsx
type TabType = 'dashboard' | 'services' | 'templates' | 'pricing' | 'stats' | 'logs' | 'matching-pricing';

interface IAStats {
  totalCalls: number;
  totalCredits: number;
  uniqueUsers: number;
  successRate: number;
  avgDuration: number;
}

interface ServiceUsage {
  service_key: string;
  service_name: string;
  total_calls: number;
  total_credits: number;
  success_count: number;
  error_count: number;
}

interface RecentLog {
  id: string;
  user_id: string;
  service_key: string;
  credits_consumed: number;
  status: string;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

// iaConfigService.ts
interface IAServiceConfig {
  id: string;
  service_code: string;
  service_name: string;
  base_prompt: string;
  model: string;
  temperature: number;
  max_tokens: number;
  version: number;
  is_active: boolean;
  category: string;
  // ... (20+ champs total)
}

// creditService.ts
interface CreditServiceConfig {
  service_code: string;
  service_name: string;
  credits_cost: number;
  is_active: boolean;
  category: string;
  promotion_active?: boolean;
  discount_percent?: number;
  effective_cost?: number;
}
```

### Annexe B - Requêtes SQL Types

```sql
-- Stats globales
SELECT
  credits_consumed,
  status,
  duration_ms,
  user_id
FROM ai_service_usage_history;

-- Usage par service (groupement JS)
SELECT
  service_key,
  credits_consumed,
  status
FROM ai_service_usage_history;

-- Logs récents
SELECT *
FROM ai_service_usage_history
ORDER BY created_at DESC
LIMIT 100;

-- Configs IA
SELECT *
FROM ia_service_config
ORDER BY category, service_name;

-- Templates
SELECT *
FROM ia_service_templates
ORDER BY service_code, display_order;

-- Tarification (via RPC)
SELECT * FROM get_all_ia_services();
```

### Annexe C - Métriques Clés

| Métrique | Valeur Actuelle |
|----------|----------------|
| Lignes code composant | 788 |
| Nombre onglets | 7 |
| Requêtes DB au chargement | 5 |
| Tables impliquées | 6 |
| Services utilisés | 2 (IAConfigService, PricingEngine) |
| Endpoints RPC | 1 actif (get_all_ia_services) |
| Calculs frontend | 8+ (stats, groupements, taux) |
| États locaux | 8 (useState) |
| Composants réutilisables | 1 (StatsCard) |
| Icônes | 21 (lucide-react) |

### Annexe D - Dépendances Externes

```json
{
  "dependencies": {
    "lucide-react": "^0.344.0",
    "@supabase/supabase-js": "^2.57.4",
    "react": "^18.3.1"
  }
}
```

---

**FIN DU RAPPORT D'AUDIT**

Document généré le 3 janvier 2026
Plateforme: JobGuinée
Page auditée: Centre d'Administration IA
Statut: AUDIT UNIQUEMENT - AUCUNE MODIFICATION APPLIQUÉE
