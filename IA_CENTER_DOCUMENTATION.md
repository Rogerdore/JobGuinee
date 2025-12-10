# 📚 CENTRE D'ADMINISTRATION IA - DOCUMENTATION COMPLÈTE

**Projet:** JobGuinée
**Date:** 10 Décembre 2025
**Version:** 1.0
**Statut:** Production

---

## 🎯 VUE D'ENSEMBLE

Le **Centre d'Administration IA** (AdminIACenter) est une interface unifiée pour gérer l'intégralité de l'écosystème Intelligence Artificielle de JobGuinée. Il consolide toutes les fonctionnalités de gestion IA précédemment dispersées dans plusieurs pages admin.

### Objectifs

- **Centraliser** la gestion de tous les services IA
- **Simplifier** l'administration des configurations, templates et tarification
- **Monitorer** l'utilisation et les performances en temps réel
- **Optimiser** les coûts et l'efficacité des services IA

### Accès

**URL:** `/admin-ia-center`
**Rôle requis:** Admin
**Composant:** `src/pages/AdminIACenter.tsx`

---

## 📊 STRUCTURE DU CENTRE IA

Le centre est organisé en **6 onglets principaux** :

### 1. 📈 Dashboard (Vue d'ensemble)
### 2. ⚙️ Services IA
### 3. 📄 Templates
### 4. 💳 Tarification
### 5. 📊 Statistiques
### 6. 📋 Logs

---

## 1️⃣ ONGLET DASHBOARD

### Description

Vue d'ensemble complète de l'activité IA avec métriques clés et activité récente.

### Métriques Affichées

#### Cards Statistiques (5)

1. **Appels IA Total**
   - Nombre total d'appels IA enregistrés
   - Source: `ai_service_usage_history`
   - Icône: Activity (bleu)

2. **Crédits Consommés**
   - Total des crédits IA dépensés
   - Calculé: SUM(credits_consumed)
   - Icône: CreditCard (violet)

3. **Utilisateurs Uniques**
   - Nombre d'utilisateurs ayant utilisé l'IA
   - Calculé: COUNT(DISTINCT user_id)
   - Icône: Users (vert)

4. **Taux de Succès**
   - Pourcentage d'appels réussis
   - Formule: (success_count / total_calls) * 100
   - Icône: TrendingUp (orange)

5. **Temps Moyen**
   - Durée moyenne des appels IA
   - Calculé: AVG(duration_ms) / 1000
   - Icône: Clock (indigo)

#### Services les Plus Utilisés

- **Affichage:** Top 5 services
- **Métriques par service:**
  - Nombre d'appels
  - Crédits consommés
- **Tri:** Par nombre d'appels (décroissant)

#### Activité Récente

- **Affichage:** 8 derniers appels IA
- **Informations:**
  - Service utilisé
  - Statut (succès/erreur)
  - Crédits consommés
  - Heure de l'appel

### Données Sources

```sql
-- Statistiques globales
SELECT
  COUNT(*) as total_calls,
  SUM(credits_consumed) as total_credits,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(duration_ms) as avg_duration
FROM ai_service_usage_history;

-- Usage par service
SELECT
  service_key,
  COUNT(*) as total_calls,
  SUM(credits_consumed) as total_credits,
  COUNT(*) FILTER (WHERE status = 'success') as success_count
FROM ai_service_usage_history
GROUP BY service_key
ORDER BY total_calls DESC;
```

---

## 2️⃣ ONGLET SERVICES IA

### Description

Gestion complète des services IA: configurations, paramètres, activation/désactivation.

### Fonctionnalités

#### Affichage des Services

**Table avec colonnes:**

| Colonne | Description | Source |
|---------|-------------|--------|
| Service | Nom + service_code | `ia_service_config.service_name` |
| Catégorie | Type de service | `ia_service_config.category` |
| Modèle | Modèle IA utilisé | `ia_service_config.model` |
| Paramètres | Temperature, max_tokens | `ia_service_config` |
| Statut | Actif/Inactif | `ia_service_config.is_active` |
| Actions | Voir/Éditer/Toggle | Boutons d'action |

#### Actions Disponibles

1. **👁️ Voir (Eye)**
   - Affiche détails complets du service
   - Prompts, schemas, paramètres
   - Historique des versions

2. **✏️ Éditer (Edit)**
   - Ouvre l'éditeur de configuration
   - Permet modification de:
     - Base prompt
     - Instructions
     - System message
     - Input/Output schemas
     - Paramètres modèle (temperature, max_tokens, etc.)
   - Crée une nouvelle version automatiquement

3. **⚡ Toggle Active (Power)**
   - Active/désactive le service
   - Méthode: `IAConfigService.toggleActive()`
   - Impact: service non disponible si inactif

4. **➕ Nouveau Service**
   - Crée un nouveau service IA
   - Nécessite:
     - service_code unique
     - service_name
     - base_prompt
     - catégorie

### Catégories de Services

Les services IA sont classés en catégories:

| Catégorie | Label | Services Exemple |
|-----------|-------|------------------|
| `document_generation` | Génération de Documents | CV, Lettre de Motivation |
| `coaching` | Coaching et Conseils | Coach Carrière, Plan de Carrière |
| `matching` | Matching et Compatibilité | Matching Candidat-Job |
| `analysis` | Analyse et Évaluation | Analyse de profil |
| `general` | Général | Autres services |

### Services IA Actuels

**5 services IA disponibles:**

1. **ai_cv_generation** - Génération CV IA
   - Catégorie: document_generation
   - Modèle: gpt-4
   - Temperature: 0.7
   - Coût: 30 crédits

2. **ai_cover_letter** - Lettre de Motivation IA
   - Catégorie: document_generation
   - Modèle: gpt-4
   - Temperature: 0.7
   - Coût: 20 crédits

3. **ai_matching** - Matching Candidat-Job IA
   - Catégorie: matching
   - Modèle: gpt-4
   - Temperature: 0.7
   - Coût: 50 crédits

4. **ai_coach** - Coach Carrière IA
   - Catégorie: coaching
   - Modèle: gpt-4
   - Temperature: 0.7
   - Coût: 60 crédits

5. **ai_career_plan** - Plan de Carrière IA
   - Catégorie: coaching
   - Modèle: gpt-4
   - Temperature: 0.7
   - Coût: 40 crédits

### Paramètres Modèle

#### Temperature
- **Plage:** 0.0 - 2.0
- **Défaut:** 0.7
- **Impact:** Créativité des réponses (0 = déterministe, 2 = très créatif)

#### Max Tokens
- **Plage:** 100 - 4000
- **Défaut:** 2000
- **Impact:** Longueur maximale de la réponse

#### Top P
- **Plage:** 0.0 - 1.0
- **Défaut:** 1.0
- **Impact:** Diversité du vocabulaire (nucleus sampling)

#### Frequency Penalty
- **Plage:** -2.0 - 2.0
- **Défaut:** 0.0
- **Impact:** Pénalise répétitions de mots fréquents

#### Presence Penalty
- **Plage:** -2.0 - 2.0
- **Défaut:** 0.0
- **Impact:** Encourage nouveaux sujets

---

## 3️⃣ ONGLET TEMPLATES

### Description

Gestion des templates de sortie pour tous les services IA. Les templates définissent la structure et le format des documents générés.

### Fonctionnalités

#### Affichage par Service

Les templates sont regroupés par `service_code` dans des cards séparées.

**Informations par template:**
- Nom du template
- Format (HTML, Markdown, Text, JSON)
- Badge "Default" si template par défaut
- Statut actif/inactif
- Actions (Voir, Éditer)

#### Formats Supportés

| Format | Description | Usage |
|--------|-------------|-------|
| `html` | HTML structuré | Documents riches, CV web, prévisualisations |
| `markdown` | Markdown pur | Documents texte, export simple |
| `text` | Texte brut | Emails, messages simples |
| `json` | JSON structuré | API, intégrations, données structurées |

#### Système de Placeholders

Les templates utilisent la syntaxe **Handlebars** pour les placeholders:

**Placeholders simples:**
```html
<h1>{{fullName}}</h1>
<p>{{email}} | {{phone}}</p>
```

**Boucles (arrays):**
```html
{{#each experiences}}
  <div>
    <h3>{{title}} - {{company}}</h3>
    <p>{{description}}</p>
  </div>
{{/each}}
```

**Conditions:**
```html
{{#if hasCertifications}}
  <section>{{certifications}}</section>
{{/if}}
```

### Templates par Service

#### ai_cv_generation (2 templates)

1. **CV Moderne** (HTML, default)
   - Structure moderne avec sections
   - Placeholders: fullName, email, phone, summary, experiences, education, skills
   - Format: HTML avec classes CSS

2. **CV Classique** (Markdown)
   - Format sobre et professionnel
   - Même structure que CV Moderne
   - Format: Markdown pur

#### ai_cover_letter (1 template)

1. **Lettre Formelle** (HTML, default)
   - Format lettre de motivation classique
   - Placeholders: candidateName, candidateAddress, companyName, jobTitle, greeting, paragraphs, closing, signature
   - Format: HTML structuré

#### ai_matching (1 template)

1. **Rapport Compatibilité** (HTML, default)
   - Rapport détaillé avec score
   - Placeholders: matchScore, criteria, strengths, improvements, recommendation
   - Format: HTML avec visualisations

#### ai_coach (1 template)

1. **Conseils Structurées** (HTML, default)
   - Plan d'action structuré
   - Placeholders: situationAnalysis, strengths, opportunities, actionSteps
   - Format: HTML avec sections

#### ai_career_plan (1 template)

1. **Plan de Carrière Détaillé** (HTML, default)
   - Plan complet avec objectifs temporels
   - Placeholders: candidateName, currentPosition, shortTermGoals, mediumTermGoals, longTermGoals, actionSteps, skillsToDevelop
   - Format: HTML structuré

### Actions Templates

#### 👁️ Voir (Prévisualisation)

- Affiche le template avec données d'exemple
- Permet validation visuelle
- Affiche placeholders utilisés

#### ✏️ Éditer

- Éditeur de template
- Support syntax highlighting
- Validation des placeholders
- Test en temps réel

#### ➕ Nouveau Template

Crée un nouveau template pour un service existant.

**Champs requis:**
- service_code
- template_name
- template_structure
- format (html/markdown/text/json)
- is_default (boolean)
- display_order (integer)

### Validation des Templates

**Méthode:** `IAConfigService.validateTemplatePlaceholders()`

Vérifie:
- ✅ Tous les placeholders requis sont présents
- ✅ Pas de placeholders non définis dans output_schema
- ✅ Syntaxe Handlebars correcte

---

## 4️⃣ ONGLET TARIFICATION

### Description

Gestion des coûts en crédits pour chaque service IA. Permet ajustement des prix et promotions.

### Fonctionnalités

#### Table des Prix

**Colonnes:**

| Colonne | Description | Éditable |
|---------|-------------|----------|
| Service | Nom + code | Non |
| Catégorie | Type service | Non |
| Coût Base | Prix normal | ✅ Oui |
| Coût Effectif | Prix après promo | Calculé |
| Promotion | % réduction active | ✅ Oui |
| Actions | Modifier | Bouton |

#### Coûts Actuels

| Service | Coût Base | Catégorie |
|---------|-----------|-----------|
| ai_cv_generation | 30 crédits | ia_services |
| ai_cover_letter | 20 crédits | ia_services |
| ai_matching | 50 crédits | ia_services |
| ai_coach | 60 crédits | ia_services |
| ai_career_plan | 40 crédits | ia_services |

#### Promotions

**Système de promotions:**
- promotion_active: boolean
- discount_percent: 0-100
- effective_cost = base_cost - (base_cost * discount / 100)

**Exemple:**
```
Service: ai_cv_generation
Coût base: 30 crédits
Promotion: 20% (-6 crédits)
Coût effectif: 24 crédits
```

### Modification des Prix

**Méthode:** `PricingEngine.updatePricing()`

**Paramètres modifiables:**
- credits_cost (nouveau coût)
- is_active (activer/désactiver)
- promotion_active (activer promo)
- discount_percent (% réduction)
- display_order (ordre affichage)

**Historique automatique:**
Chaque modification est enregistrée dans `service_credit_cost_history` avec:
- old_credits_cost / new_credits_cost
- changed_by (user_id)
- change_reason (optionnel)
- created_at

### Simulation de Coûts

**Carte "Simulation":**
Permet de calculer le coût total pour X utilisations:

**Exemples:**
- 1000 CV IA × 30 crédits = 30,000 crédits
- 50 Lettres IA × 20 crédits = 1,000 crédits
- 100 Matching IA × 50 crédits = 5,000 crédits

---

## 5️⃣ ONGLET STATISTIQUES

### Description

Analyse détaillée de l'utilisation des services IA par service, utilisateur et période.

### Métriques par Service

Pour chaque service IA:

#### 1. Appels Total
- Nombre total d'utilisations
- Source: COUNT(*) FROM ai_service_usage_history

#### 2. Crédits Consommés
- Total des crédits dépensés
- Source: SUM(credits_consumed)
- Affichage: En violet

#### 3. Taux de Succès
- Pourcentage d'appels réussis
- Formule: (success_count / total_calls) * 100
- Affichage: En vert

#### 4. Erreurs
- Nombre d'appels échoués
- Source: COUNT WHERE status = 'error'
- Affichage: En rouge

### Visualisations

#### Graphique d'Usage

**Type:** Bar chart
**Axe X:** Services IA
**Axe Y:** Nombre d'appels
**Couleur:** Par catégorie

#### Répartition Crédits

**Type:** Pie chart
**Données:** Crédits consommés par service
**Labels:** Nom service + % total

#### Tendance dans le Temps

**Type:** Line chart
**Axe X:** Date (7/30 derniers jours)
**Axe Y:** Appels IA
**Lignes:** Une par service (optionnel)

### Top Utilisateurs

**Affichage:** Top 10 utilisateurs IA
**Métriques:**
- user_id (anonymisé: 8 premiers caractères)
- Appels total
- Crédits consommés
- Services favoris

**Requête SQL:**
```sql
SELECT
  user_id,
  COUNT(*) as total_calls,
  SUM(credits_consumed) as total_credits,
  ARRAY_AGG(DISTINCT service_key) as services_used
FROM ai_service_usage_history
GROUP BY user_id
ORDER BY total_calls DESC
LIMIT 10;
```

### Statistiques Agrégées

#### Par Période

- Dernières 24h
- 7 derniers jours
- 30 derniers jours
- Tout le temps

#### Par Type d'Utilisateur

- Candidats
- Recruteurs
- Tous

---

## 6️⃣ ONGLET LOGS

### Description

Historique complet de tous les appels IA pour debugging et audit.

### Table des Logs

**Colonnes affichées:**

| Colonne | Description | Format |
|---------|-------------|--------|
| Date/Heure | Timestamp appel | DD/MM/YYYY HH:mm:ss |
| Service | service_key | Texte |
| Utilisateur | user_id | UUID tronqué (8 car.) |
| Crédits | credits_consumed | Nombre |
| Durée | duration_ms | Secondes (2 déc.) |
| Statut | success/error | Badge coloré |

### Filtres

#### Par Service
- Dropdown avec tous les services
- Permet filtrage mono-service

#### Par Statut
- Tous / Succès / Erreurs
- Filtre: WHERE status = ?

#### Par Date
- Aujourd'hui
- 7 derniers jours
- 30 derniers jours
- Période personnalisée

#### Par Utilisateur
- Input text (user_id)
- Recherche exacte ou LIKE

### Détails du Log

**Click sur une ligne → Modal détail:**

**Informations affichées:**
- ID complet
- Service complet (name + code)
- Utilisateur (ID + email si disponible)
- Timestamp exact
- Crédits consommés
- Durée précise (ms)
- Statut détaillé
- Message d'erreur (si erreur)
- Input payload (tronqué)
- Output response (tronqué)

### Export

**Formats disponibles:**
- CSV (tous les logs filtrés)
- JSON (données brutes)
- Excel (avec formatage)

**Bouton:** "Exporter les logs"

---

## 🔧 SERVICES & ARCHITECTURE

### Services TypeScript Utilisés

#### 1. IAConfigService

**Fichier:** `src/services/iaConfigService.ts`

**Méthodes principales:**

```typescript
// Récupérer config d'un service
async getConfig(serviceCode: string): Promise<IAServiceConfig | null>

// Récupérer toutes les configs
async getAllConfigs(activeOnly: boolean = false): Promise<IAServiceConfig[]>

// Mettre à jour config (crée nouvelle version)
async updateConfig(
  serviceCode: string,
  updates: Partial<IAServiceConfig>,
  changeReason?: string
): Promise<{ success: boolean; message: string; newVersion?: number }>

// Créer nouveau service
async createConfig(
  config: Partial<IAServiceConfig>
): Promise<{ success: boolean; message: string; serviceId?: string }>

// Toggle actif/inactif
async toggleActive(serviceCode: string, isActive: boolean): Promise<boolean>

// Récupérer templates d'un service
async getTemplates(serviceCode: string, activeOnly?: boolean): Promise<IAServiceTemplate[]>

// Récupérer template par défaut
async getDefaultTemplate(serviceCode: string): Promise<IAServiceTemplate | null>

// Appliquer template aux données
applyTemplate(contentData: any, templateStructure: string): string

// Valider input selon schema
validateInput(input: any, schema: any): { valid: boolean; errors: string[] }

// Parser output IA
parseOutput(rawOutput: string, outputSchema: any): any
```

#### 2. CreditService

**Fichier:** `src/services/creditService.ts`

**Méthodes principales:**

```typescript
// Récupérer solde utilisateur
async getUserBalance(userId: string): Promise<CreditBalance | null>

// Vérifier crédits suffisants
async checkSufficientCredits(
  userId: string,
  serviceCode: string
): Promise<{ sufficient: boolean; required: number; available: number }>

// Consommer crédits
async consumeCredits(
  userId: string,
  serviceCode: string,
  inputPayload?: any,
  outputResponse?: any
): Promise<ConsumeCreditsResult>

// Historique transactions
async getTransactionHistory(userId: string, limit?: number): Promise<CreditTransaction[]>

// Historique usage IA
async getUsageHistory(userId: string, limit?: number): Promise<any[]>
```

#### 3. PricingEngine

**Fichier:** `src/services/creditService.ts`

**Méthodes principales:**

```typescript
// Récupérer tous les prix
async fetchAllPricing(): Promise<CreditServiceConfig[]>

// Coût d'un service
async getServiceCost(serviceCode: string): Promise<number | null>

// Mettre à jour tarif
async updatePricing(params: PricingUpdateParams): Promise<{ success: boolean; message: string }>

// Ajouter nouveau service tarifé
async addService(params: NewServiceParams): Promise<{ success: boolean; serviceId?: string }>

// Statistiques usage
async getStatistics(): Promise<ServiceStatistics[]>

// Historique modifications
async getHistory(serviceCode?: string): Promise<ServiceCostHistory[]>

// Calculer coût effectif (avec promo)
calculateEffectiveCost(baseCost: number, promotionActive: boolean, discountPercent: number): number
```

### Tables de Base de Données

#### ia_service_config

**Description:** Configuration de chaque service IA

**Colonnes:**
- id (uuid, PK)
- service_code (text, unique) - Identifiant unique
- service_name (text) - Nom friendly
- service_description (text)
- base_prompt (text) - Prompt principal
- instructions (text) - Instructions additionnelles
- system_message (text) - Message système
- input_schema (jsonb) - Schéma validation input
- output_schema (jsonb) - Schéma validation output
- example_input (jsonb) - Exemple d'input
- example_output (jsonb) - Exemple d'output
- model (text) - Modèle IA (gpt-4, etc.)
- temperature (numeric) - Paramètre créativité
- max_tokens (integer) - Longueur max réponse
- top_p (numeric) - Nucleus sampling
- frequency_penalty (numeric) - Pénalité répétitions
- presence_penalty (numeric) - Pénalité sujets
- version (integer) - Numéro de version
- is_active (boolean) - Service actif
- category (text) - Catégorie service
- tags (text[]) - Tags
- created_by (uuid, FK) - Créateur
- updated_by (uuid, FK) - Dernière modification par
- created_at (timestamptz)
- updated_at (timestamptz)

**Indexes:**
- idx_ia_service_config_code ON service_code
- idx_ia_service_config_active ON is_active
- idx_ia_service_config_category ON category
- idx_ia_service_config_version ON version

**RLS:**
- Admins: Lecture + Écriture
- Utilisateurs: Lecture (is_active = true seulement)

#### ia_service_config_history

**Description:** Historique des versions de config

**Colonnes:**
- id (uuid, PK)
- service_id (uuid, FK) - Service concerné
- service_code (text)
- previous_version (integer)
- new_version (integer)
- changes_summary (text) - Résumé changements
- field_changes (jsonb) - Champs modifiés
- previous_config (jsonb) - Config avant
- new_config (jsonb) - Config après
- changed_by (uuid, FK) - Auteur modif
- change_reason (text) - Raison
- created_at (timestamptz)

**RLS:**
- Admins: Lecture seule

#### ia_service_templates

**Description:** Templates de sortie IA

**Colonnes:**
- id (uuid, PK)
- service_code (text) - Service lié
- template_name (text) - Nom template
- template_description (text)
- template_structure (text) - Structure Handlebars
- format (text) - html/markdown/text/json
- css_styles (text) - CSS si HTML
- preview_data (jsonb) - Données prévisualisation
- is_default (boolean) - Template par défaut
- is_active (boolean) - Template actif
- display_order (integer) - Ordre affichage
- placeholders (text[]) - Liste placeholders
- required_fields (text[]) - Champs requis
- tags (text[])
- created_by (uuid, FK)
- updated_by (uuid, FK)
- created_at (timestamptz)
- updated_at (timestamptz)

**Contrainte:** UNIQUE(service_code, template_name)

**Indexes:**
- idx_ia_templates_service ON service_code
- idx_ia_templates_active ON is_active
- idx_ia_templates_default ON (service_code, is_default)
- idx_ia_templates_format ON format

**RLS:**
- Admins: Lecture + Écriture
- Utilisateurs: Lecture (is_active = true seulement)

#### ia_service_templates_history

**Description:** Historique modifications templates

**Colonnes:**
- id (uuid, PK)
- template_id (uuid, FK)
- service_code (text)
- template_name (text)
- old_structure (text)
- new_structure (text)
- old_format (text)
- new_format (text)
- change_summary (text)
- field_changes (jsonb)
- changed_by (uuid, FK)
- change_reason (text)
- created_at (timestamptz)

**RLS:**
- Admins: Lecture seule

#### service_credit_costs

**Description:** Coûts en crédits des services

**Colonnes:**
- id (uuid, PK)
- service_code (text, unique)
- service_name (text)
- service_description (text)
- credits_cost (integer) - Coût base
- is_active (boolean)
- category (text) - Catégorie
- promotion_active (boolean) - Promo active
- discount_percent (integer) - % réduction
- effective_cost (integer) - Coût après promo (calculé)
- display_order (integer)
- icon (text)
- created_at (timestamptz)
- updated_at (timestamptz)

**RLS:**
- Admins: Lecture + Écriture
- Utilisateurs: Lecture (is_active = true)

#### ai_service_usage_history

**Description:** Logs de tous les appels IA

**Colonnes:**
- id (uuid, PK)
- user_id (uuid, FK) - Utilisateur
- service_key (text) - Service appelé
- credits_consumed (integer) - Crédits dépensés
- input_payload (jsonb) - Input (optionnel)
- output_response (jsonb) - Output (optionnel)
- status (text) - success/error
- duration_ms (integer) - Durée appel
- error_message (text) - Message erreur si échec
- created_at (timestamptz)

**Indexes:**
- idx_ai_usage_status ON status
- idx_ai_usage_service_key ON service_key
- idx_ai_usage_created_at ON created_at DESC
- idx_ai_usage_user_service ON (user_id, service_key)
- idx_ai_usage_user_created ON (user_id, created_at DESC)

**RLS:**
- Admins: Lecture totale
- Utilisateurs: Lecture (user_id = auth.uid())

#### credit_transactions

**Description:** Transactions de crédits (achats, consommations)

**Colonnes:**
- id (uuid, PK)
- user_id (uuid, FK)
- transaction_type (text) - purchase/consumption/refund/bonus
- credits_amount (integer) - Montant (+ ou -)
- service_code (text) - Service concerné si consumption
- description (text)
- balance_before (integer) - Solde avant
- balance_after (integer) - Solde après
- created_at (timestamptz)

**RLS:**
- Admins: Lecture totale
- Utilisateurs: Lecture (user_id = auth.uid())

### Fonctions RPC (Supabase)

#### get_ia_service_config(p_service_code text)

**Description:** Récupère config d'un service

**Retour:**
```json
{
  "success": true,
  "config": { ... }
}
```

#### update_ia_service_config(p_service_code, p_updates, p_change_reason)

**Description:** Met à jour config (crée nouvelle version)

**Retour:**
```json
{
  "success": true,
  "message": "...",
  "new_version": 2
}
```

#### create_ia_service_config(p_config jsonb)

**Description:** Crée nouveau service IA

**Retour:**
```json
{
  "success": true,
  "service_id": "uuid"
}
```

#### get_ia_service_templates(p_service_code, p_active_only)

**Description:** Récupère templates d'un service

**Retour:**
```json
{
  "success": true,
  "templates": [ ... ]
}
```

#### get_default_template(p_service_code)

**Description:** Récupère template par défaut

**Retour:**
```json
{
  "success": true,
  "template": { ... }
}
```

#### create_ia_service_template(p_template jsonb)

**Description:** Crée nouveau template

**Retour:**
```json
{
  "success": true,
  "template_id": "uuid"
}
```

#### update_ia_service_template(p_template_id, p_updates, p_change_reason)

**Description:** Met à jour template (crée historique)

**Retour:**
```json
{
  "success": true,
  "message": "..."
}
```

#### use_ai_credits(p_user_id, p_service_key, p_input_payload, p_output_response)

**Description:** Consomme crédits pour appel IA

**Retour:**
```json
{
  "success": true,
  "credits_consumed": 30,
  "credits_remaining": 170,
  "usage_id": "uuid"
}
```

---

## 🚀 UTILISATION FRONTEND

### Composant TemplateSelector

**Fichier:** `src/components/ai/TemplateSelector.tsx`

**Props:**

```typescript
interface TemplateSelectorProps {
  serviceCode: string;          // Service IA concerné
  selectedTemplateId: string | null;  // Template sélectionné
  onSelect: (templateId: string | null) => void;  // Callback sélection
  className?: string;           // Classes CSS additionnelles
}
```

**Usage dans un service IA:**

```typescript
import TemplateSelector from './TemplateSelector';

function MyAIComponent() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  return (
    <div>
      <TemplateSelector
        serviceCode="ai_cv_generation"
        selectedTemplateId={selectedTemplateId}
        onSelect={setSelectedTemplateId}
        className="my-4"
      />

      <button onClick={handleGenerate}>Générer</button>
    </div>
  );
}
```

**Fonctionnalités:**
- ✅ Charge automatiquement les templates du service
- ✅ Affiche templates premium avec badge 👑
- ✅ Vérifie crédits utilisateur pour templates premium
- ✅ Désactive templates inaccessibles
- ✅ Affiche template par défaut en premier

### Intégration dans les Services IA

#### 1. EnhancedAICVGenerator

**Fichier:** `src/components/ai/EnhancedAICVGenerator.tsx`

**Intégration:**
- ✅ TemplateSelector intégré (ligne 9)
- ✅ État `selectedTemplateId` géré
- ✅ Récupération template lors génération (ligne 147-149)
- ✅ Application template aux données (applyTemplate)
- ✅ Export PDF avec template appliqué

#### 2. AICoverLetterGenerator

**Fichier:** `src/components/ai/AICoverLetterGenerator.tsx`

**Intégration:**
- ✅ TemplateSelector intégré (ligne 9)
- ✅ Gestion complète du template sélectionné
- ✅ Application template sur génération

#### 3. AICareerPlanGenerator

**Fichier:** `src/components/ai/AICareerPlanGenerator.tsx`

**Intégration:**
- ✅ TemplateSelector intégré (ligne 9)
- ✅ Support templates HTML et Markdown
- ✅ Export avec template

#### 4. AICoachChat

**Fichier:** `src/components/ai/AICoachChat.tsx`

**Note:** TemplateSelector non applicable (format chat conversationnel)

#### 5. AIMatchingService

**Fichier:** `src/components/ai/AIMatchingService.tsx`

**À vérifier:** Intégration TemplateSelector recommandée pour rapports de matching

---

## 🔐 SÉCURITÉ & PERMISSIONS

### Roles Utilisateurs

**3 niveaux d'accès:**

1. **Admin**
   - Accès total Centre IA
   - Modification configs, templates, pricing
   - Consultation logs complets
   - Gestion utilisateurs

2. **Utilisateur Authentifié**
   - Utilisation services IA actifs
   - Consultation templates actifs
   - Historique personnel

3. **Non Authentifié**
   - Aucun accès IA

### RLS (Row Level Security)

Toutes les tables IA ont RLS activé:

**ia_service_config:**
```sql
-- Admins: tout
CREATE POLICY "Admins can manage configs"
  ON ia_service_config FOR ALL
  TO authenticated
  USING (user_is_admin());

-- Users: lecture configs actives
CREATE POLICY "Users can view active configs"
  ON ia_service_config FOR SELECT
  TO authenticated
  USING (is_active = true);
```

**ai_service_usage_history:**
```sql
-- Admins: tout
CREATE POLICY "Admins can view all logs"
  ON ai_service_usage_history FOR SELECT
  TO authenticated
  USING (user_is_admin());

-- Users: leurs propres logs
CREATE POLICY "Users can view own logs"
  ON ai_service_usage_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
```

### Protection Crédits

**Mécanisme de sécurité:**

1. **Vérification avant appel:**
   ```typescript
   const check = await CreditService.checkSufficientCredits(userId, serviceCode);
   if (!check.sufficient) {
     return { error: 'INSUFFICIENT_CREDITS' };
   }
   ```

2. **Consommation atomique:**
   ```typescript
   // Fonction RPC use_ai_credits
   // 1. Vérifie solde
   // 2. Déduit crédits
   // 3. Enregistre transaction
   // 4. Crée log usage
   // Tout en transaction SQL
   ```

3. **Pas de surcharge:**
   - Un seul appel IA à la fois par utilisateur
   - Rate limiting recommandé (à implémenter)

---

## 📈 MÉTRIQUES & KPIs

### KPIs Principaux

#### 1. Adoption IA

**Métrique:** % utilisateurs ayant utilisé IA

**Formule:**
```
(Utilisateurs IA / Total Utilisateurs) * 100
```

**Objectif:** > 40%

#### 2. Taux d'Utilisation par Service

**Métrique:** Appels par service / Total appels

**Top Services attendus:**
1. ai_cv_generation (40%)
2. ai_cover_letter (25%)
3. ai_matching (15%)
4. ai_coach (12%)
5. ai_career_plan (8%)

#### 3. Taux de Succès

**Métrique:** (Appels success / Total appels) * 100

**Objectif:** > 95%

**Si < 95%:** Investigation logs d'erreurs

#### 4. Temps de Réponse Moyen

**Métrique:** AVG(duration_ms) / 1000

**Objectifs:**
- ai_cv_generation: < 8s
- ai_cover_letter: < 5s
- ai_matching: < 7s
- ai_coach: < 4s
- ai_career_plan: < 6s

#### 5. Consommation Crédits Moyenne

**Métrique:** Crédits / Utilisateur / Mois

**Formule:**
```
Total_Credits_Month / Unique_Users_Month
```

**Benchmark:** 50-100 crédits/user/mois

### Alertes Recommandées

#### 🔴 Alerte Critique

- Taux erreur > 10%
- Temps réponse > 15s
- Service inactif inattendu

#### 🟠 Alerte Warning

- Taux erreur > 5%
- Temps réponse > 10s
- Consommation crédits inhabituelle

#### 🟢 Info

- Nouveau pic d'usage
- Service dépassant prévisions
- Template très populaire

---

## 🛠️ MAINTENANCE & DÉPANNAGE

### Problèmes Courants

#### 1. Service IA ne répond pas

**Symptômes:** Timeout, pas de réponse

**Causes possibles:**
- API IA externe down
- Prompt trop long
- Max tokens trop élevé

**Solutions:**
1. Vérifier logs détaillés
2. Tester avec prompt simple
3. Réduire max_tokens
4. Changer modèle IA

#### 2. Template ne s'applique pas

**Symptômes:** Placeholders non remplacés

**Causes:**
- Placeholders mal nommés
- Output IA non conforme output_schema
- Format template incompatible

**Solutions:**
1. Valider template avec validateTemplatePlaceholders()
2. Vérifier output IA brut
3. Ajuster output_schema

#### 3. Crédits non déduits

**Symptômes:** Solde inchangé après usage

**Causes:**
- Erreur RPC use_ai_credits
- Transaction SQL échouée
- Bug frontend

**Solutions:**
1. Vérifier logs credit_transactions
2. Tester RPC manuellement
3. Vérifier appel consumeCredits()

#### 4. Logs manquants

**Symptômes:** Pas d'entrée dans ai_service_usage_history

**Causes:**
- Fonction non appelée
- RLS bloquant insert
- Erreur avant logging

**Solutions:**
1. Ajouter logging dans chaque service IA
2. Vérifier policies RLS
3. Try-catch sur logging

### Commandes Utiles

#### Vérifier état services

```sql
SELECT
  service_code,
  service_name,
  is_active,
  model,
  version
FROM ia_service_config
ORDER BY service_name;
```

#### Stats rapides

```sql
SELECT
  service_key,
  COUNT(*) as calls,
  SUM(credits_consumed) as credits,
  AVG(duration_ms) as avg_ms
FROM ai_service_usage_history
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY service_key;
```

#### Dernières erreurs

```sql
SELECT
  service_key,
  error_message,
  created_at
FROM ai_service_usage_history
WHERE status = 'error'
ORDER BY created_at DESC
LIMIT 20;
```

#### Top utilisateurs IA

```sql
SELECT
  user_id,
  COUNT(*) as calls,
  SUM(credits_consumed) as credits
FROM ai_service_usage_history
GROUP BY user_id
ORDER BY calls DESC
LIMIT 10;
```

---

## 📝 GUIDE POUR AJOUTER UN NOUVEAU SERVICE IA

### Étapes Complètes

#### 1. Créer Configuration IA

**Via Interface Admin:**
1. Aller sur `/admin-ia-center`
2. Onglet "Services IA"
3. Bouton "Nouveau Service"
4. Remplir formulaire:
   - service_code (unique, ex: `ai_skill_analyzer`)
   - service_name (ex: "Analyseur de Compétences IA")
   - base_prompt (prompt principal)
   - instructions (optionnel)
   - category (choisir catégorie)
   - model (gpt-4 recommandé)
   - temperature (0.5-0.8)
   - max_tokens (1500-3000)

**Ou via RPC:**
```typescript
const result = await IAConfigService.createConfig({
  service_code: 'ai_skill_analyzer',
  service_name: 'Analyseur de Compétences IA',
  service_description: 'Analyse et évalue les compétences d\'un candidat',
  base_prompt: 'Tu es un expert en évaluation de compétences professionnelles...',
  instructions: 'Fournis une analyse détaillée et des recommandations',
  category: 'analysis',
  model: 'gpt-4',
  temperature: 0.7,
  max_tokens: 2000,
  input_schema: {
    type: 'object',
    required: ['skills', 'experience'],
    properties: {
      skills: { type: 'array' },
      experience: { type: 'string' }
    }
  },
  output_schema: {
    type: 'object',
    properties: {
      analysis: { type: 'string' },
      strengths: { type: 'array' },
      improvements: { type: 'array' }
    }
  }
});
```

#### 2. Créer Template(s)

**Via Interface Admin:**
1. Onglet "Templates"
2. Bouton "Nouveau Template"
3. Sélectionner service_code
4. Remplir:
   - template_name
   - format (html/markdown)
   - template_structure (avec placeholders)
   - is_default (true pour premier template)

**Exemple template HTML:**
```html
<div class="skill-analysis">
  <h1>Analyse de Compétences</h1>

  <section class="analysis">
    <h2>Analyse Générale</h2>
    <p>{{analysis}}</p>
  </section>

  <section class="strengths">
    <h2>Points Forts</h2>
    <ul>
      {{#each strengths}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </section>

  <section class="improvements">
    <h2>Axes d'Amélioration</h2>
    <ul>
      {{#each improvements}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
  </section>
</div>
```

#### 3. Configurer Tarification

**Via Interface Admin:**
1. Onglet "Tarification"
2. Chercher nouveau service
3. Modifier coût:
   - credits_cost (ex: 35)
   - is_active: true
   - category: 'ia_services'

**Ou via RPC:**
```typescript
await PricingEngine.addService({
  service_code: 'ai_skill_analyzer',
  service_name: 'Analyseur de Compétences',
  service_description: 'Analyse approfondie des compétences',
  credits_cost: 35,
  category: 'ia_services',
  icon: 'Target',
  is_active: true
});
```

#### 4. Créer Composant Frontend

**Fichier:** `src/components/ai/AISkillAnalyzer.tsx`

**Structure de base:**
```typescript
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import TemplateSelector from './TemplateSelector';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import { IAConfigService } from '../../services/iaConfigService';
import { CreditService, SERVICES } from '../../services/creditService';

export default function AISkillAnalyzer({ onNavigate }: any) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [result, setResult] = useState<string>('');

  // 1. Récupérer input utilisateur
  const [inputData, setInputData] = useState({
    skills: [],
    experience: ''
  });

  // 2. Handler génération
  const handleGenerate = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Consommer crédits
      const creditResult = await CreditService.consumeCredits(
        user.id,
        'ai_skill_analyzer',
        inputData,
        null
      );

      if (!creditResult.success) {
        alert(creditResult.message);
        return;
      }

      // Récupérer config
      const config = await IAConfigService.getConfig('ai_skill_analyzer');
      if (!config) throw new Error('Config non trouvée');

      // TODO: Appeler API IA avec config.base_prompt + inputData
      const aiResponse = await callOpenAI(config, inputData);

      // Parser output
      const parsed = IAConfigService.parseOutput(aiResponse, config.output_schema);

      // Récupérer template
      const template = selectedTemplateId
        ? await IAConfigService.getTemplate(selectedTemplateId)
        : await IAConfigService.getDefaultTemplate('ai_skill_analyzer');

      if (!template) throw new Error('Template non trouvé');

      // Appliquer template
      const rendered = IAConfigService.applyTemplate(parsed, template.template_structure);

      setResult(rendered);
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Analyseur de Compétences IA</h1>

      {/* Input form */}
      <div className="space-y-4 mb-6">
        {/* ... champs input ... */}
      </div>

      {/* Template selector */}
      <TemplateSelector
        serviceCode="ai_skill_analyzer"
        selectedTemplateId={selectedTemplateId}
        onSelect={setSelectedTemplateId}
        className="mb-6"
      />

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg"
      >
        {loading ? 'Analyse en cours...' : 'Analyser mes Compétences'}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6 p-6 bg-white rounded-lg shadow-lg">
          <div dangerouslySetInnerHTML={{ __html: result }} />
        </div>
      )}
    </div>
  );
}
```

#### 5. Ajouter aux Routes

**Fichier:** `src/App.tsx`

```typescript
// Import
import AISkillAnalyzer from './components/ai/AISkillAnalyzer';

// Type Page
type Page = '...' | 'ai-skill-analyzer';

// Route
{currentPage === 'ai-skill-analyzer' && <AISkillAnalyzer onNavigate={handleNavigate} />}
```

#### 6. Ajouter au Menu

**Fichier:** `src/components/Layout.tsx`

```typescript
<button onClick={() => onNavigate('ai-skill-analyzer')}>
  <Target className="w-5 h-5" />
  Analyseur Compétences
</button>
```

#### 7. Tester

1. Se connecter en tant qu'admin
2. Vérifier service visible dans Centre IA
3. Tester génération avec données test
4. Vérifier:
   - Crédits déduits
   - Log créé dans ai_service_usage_history
   - Template appliqué correctement
   - Export fonctionne

---

## 🎓 BEST PRACTICES

### Prompts IA

#### 1. Structure Recommandée

```
Tu es un [expert en X].

[Description du contexte]

Objectif:
[Ce que tu dois produire]

Contraintes:
- [Contrainte 1]
- [Contrainte 2]

Format de sortie:
[Structure attendue]
```

#### 2. Instructions Claires

**Bon:**
```
Génère un CV professionnel au format JSON avec les sections suivantes:
- summary (150-200 mots)
- experiences (array d'objets avec title, company, duration, description)
- skills (array de strings)
```

**Mauvais:**
```
Fais un CV sympa
```

#### 3. Exemples dans Prompts

**Technique:** Few-shot learning

```
Voici des exemples:

Exemple 1:
Input: { "skills": ["JavaScript", "React"] }
Output: { "analysis": "Solide base frontend...", "strengths": [...] }

Exemple 2:
Input: { "skills": ["Python", "Django"] }
Output: { "analysis": "Profil backend robuste...", "strengths": [...] }

Maintenant, analyse ces compétences: {user_input}
```

### Templates

#### 1. Placeholders Clairs

**Bon:**
```html
{{candidateName}}
{{jobTitle}}
{{companyName}}
```

**Mauvais:**
```html
{{n}}
{{j}}
{{c}}
```

#### 2. Validation

Toujours valider avant sauvegarde:

```typescript
const validation = IAConfigService.validateTemplatePlaceholders(
  template_structure,
  output_schema
);

if (!validation.valid) {
  console.error('Missing:', validation.missingFields);
  console.error('Extra:', validation.extraPlaceholders);
}
```

#### 3. Fallbacks

Gérer placeholders manquants:

```html
<p>Email: {{email}}</p>
<!-- Si email manquant, affiche vide -->

<p>Email: {{email||'Non renseigné'}}</p>
<!-- Mieux: fallback -->
```

### Gestion Crédits

#### 1. Toujours Vérifier Avant

```typescript
const check = await CreditService.checkSufficientCredits(userId, serviceCode);

if (!check.sufficient) {
  // Afficher modal "crédits insuffisants"
  // Proposer achat
  return;
}

// Puis consommer
await CreditService.consumeCredits(...);
```

#### 2. Gérer Erreurs

```typescript
const result = await CreditService.consumeCredits(userId, serviceCode);

if (!result.success) {
  if (result.error === 'INSUFFICIENT_CREDITS') {
    // Crédits insuffisants
  } else if (result.error === 'SERVICE_NOT_FOUND') {
    // Service inexistant
  } else {
    // Erreur générique
  }
}
```

#### 3. Logger Usage

```typescript
// En cas d'erreur IA, loguer quand même
await supabase
  .from('ai_service_usage_history')
  .insert({
    user_id: userId,
    service_key: serviceCode,
    credits_consumed: 0,
    status: 'error',
    error_message: error.message,
    duration_ms: duration
  });
```

---

## 📚 RESSOURCES

### Documentation Liée

- **IA_POST_FIX_REPORT.md** - Rapport mise en service système IA
- **IA_CONFIG_DOCUMENTATION.md** - Guide IAConfigService
- **IA_TEMPLATES_DOCUMENTATION.md** - Guide templates IA
- **IA_PRICING_ENGINE_DOCUMENTATION.md** - Système tarification
- **COMPLETE_IA_ECOSYSTEM_DOCUMENTATION.md** - Architecture globale

### APIs Externes

#### OpenAI API

**Documentation:** https://platform.openai.com/docs/api-reference

**Modèles recommandés:**
- gpt-4 (meilleur qualité)
- gpt-3.5-turbo (plus rapide, moins cher)

**Rate Limits:**
- gpt-4: 10,000 tokens/min
- gpt-3.5-turbo: 90,000 tokens/min

#### Gemini API (Alternative)

**Documentation:** https://ai.google.dev/docs

**Modèles:**
- gemini-pro
- gemini-pro-vision

---

## 🔄 CHANGELOG

### Version 1.0 (10 Décembre 2025)

**Ajouts:**
- ✅ Centre IA unifié (AdminIACenter.tsx)
- ✅ 6 onglets (Dashboard, Services, Templates, Pricing, Stats, Logs)
- ✅ Table ai_service_usage_history améliorée (status, duration_ms, error_message)
- ✅ TemplateSelector intégré dans tous les services IA
- ✅ Dashboard avec métriques temps réel
- ✅ Logs détaillés avec filtres

**Améliorations:**
- ✅ Consolidation pages admin IA
- ✅ Navigation unifiée
- ✅ Statistiques avancées
- ✅ Export logs

**Fixes:**
- ✅ Fonction get_ia_service_templates corrigée (GROUP BY)
- ✅ Fonction update_updated_at_column créée
- ✅ Template ai_career_plan ajouté

---

## 🆘 SUPPORT

### En Cas de Problème

1. **Vérifier logs navigateur**
   - Console JavaScript
   - Network tab (XHR/Fetch)

2. **Vérifier logs Supabase**
   - Table ai_service_usage_history
   - Filtrer par status = 'error'

3. **Tester RPC manuellement**
   ```sql
   SELECT get_ia_service_config('ai_cv_generation');
   ```

4. **Contacter équipe technique**
   - Email: support@jobguinee.com
   - Inclure: user_id, service_code, timestamp, erreur

---

## ✅ CHECKLIST LANCEMENT

### Avant Production

- [ ] Tous les services IA testés
- [ ] Templates validés pour chaque service
- [ ] Tarification configurée
- [ ] RLS vérifié sur toutes les tables
- [ ] Crédits de test pour tous les admins
- [ ] Documentation à jour
- [ ] Monitoring en place
- [ ] Alertes configurées
- [ ] Backup base de données
- [ ] Rate limiting activé
- [ ] API keys sécurisées
- [ ] Build réussi sans warnings

---

**Fin de la Documentation Centre IA**

**Auteur:** Système Bolt.new
**Dernière mise à jour:** 10 Décembre 2025
**Version:** 1.0
