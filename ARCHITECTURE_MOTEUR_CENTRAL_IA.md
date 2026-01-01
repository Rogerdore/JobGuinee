# Architecture du Moteur Central IA - JobGuinée

**Date:** 01 Janvier 2026
**Statut:** ✅ SYSTÈME CENTRALISÉ OPÉRATIONNEL

---

## 🎯 Réponse Rapide

### Question 1: Toutes les fonctionnalités IA sont-elles branchées au moteur central ?
**✅ OUI** - Toutes les 22 fonctionnalités IA utilisent le moteur central `IAConfigService`

### Question 2: Chaque fonctionnalité peut-elle être configurée dans l'admin ?
**✅ OUI** - 4 pages admin dédiées permettent la configuration complète

---

## 📊 Vue d'Ensemble du Système

### Architecture Centralisée

```
┌─────────────────────────────────────────────────────────────┐
│                   MOTEUR CENTRAL IA                          │
│                  (IAConfigService)                           │
├─────────────────────────────────────────────────────────────┤
│  • Configuration des prompts                                 │
│  • Paramètres des modèles (GPT-4, Claude, Gemini)          │
│  • Schémas de validation                                    │
│  • Gestion des templates                                    │
│  • Système de tarification                                  │
│  • Historique des versions                                  │
└─────────────────────────────────────────────────────────────┘
                           ⬇
        ┌──────────────────┼──────────────────┐
        ⬇                  ⬇                  ⬇
   [Candidats]        [Recruteurs]        [Formateurs]
   14 services        6 services          2 services
```

---

## 🗄️ Architecture Base de Données

### Tables Principales

#### 1. **ia_service_config** - Configuration des Services IA

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

  -- Schémas
  input_schema jsonb,
  output_schema jsonb,

  -- Paramètres du modèle
  model text DEFAULT 'gpt-4',
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 2000,
  top_p numeric(3,2) DEFAULT 1.0,
  frequency_penalty numeric(3,2),
  presence_penalty numeric(3,2),

  -- Métadonnées
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,
  category text DEFAULT 'general',
  tags text[]
);
```

#### 2. **ia_service_templates** - Templates de Documents

```sql
CREATE TABLE ia_service_templates (
  id uuid PRIMARY KEY,
  service_code text NOT NULL,
  template_name text NOT NULL,
  template_structure text NOT NULL,
  format text, -- html, markdown, text, json
  is_default boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  min_credits_required integer DEFAULT 0,
  display_order integer
);
```

#### 3. **service_credit_costs** - Tarification

```sql
CREATE TABLE service_credit_costs (
  service_code text PRIMARY KEY,
  service_name text NOT NULL,
  credits_cost integer NOT NULL,
  effective_cost integer,
  promotion_active boolean DEFAULT false,
  discount_percent integer DEFAULT 0,
  is_active boolean DEFAULT true
);
```

#### 4. **ia_service_config_history** - Historique des Versions

```sql
CREATE TABLE ia_service_config_history (
  id uuid PRIMARY KEY,
  service_id uuid REFERENCES ia_service_config(id),
  previous_version integer,
  new_version integer,
  field_changes jsonb,
  change_reason text,
  changed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
```

---

## 🔧 Service Central: IAConfigService

### Fichier: `src/services/iaConfigService.ts`

#### Méthodes Principales

```typescript
export class IAConfigService {
  // Récupérer la configuration d'un service
  static async getConfig(serviceCode: string): Promise<IAServiceConfig | null>

  // Récupérer toutes les configurations
  static async getAllConfigs(activeOnly: boolean = false): Promise<IAServiceConfig[]>

  // Mettre à jour une configuration (créer nouvelle version)
  static async updateConfig(
    serviceCode: string,
    updates: Partial<IAServiceConfig>,
    changeReason?: string
  ): Promise<{ success: boolean; newVersion?: number }>

  // Créer un nouveau service
  static async createConfig(config: Partial<IAServiceConfig>)

  // Construire un prompt complet
  static buildPrompt(config: IAServiceConfig, userInput: any): BuiltPrompt

  // Valider les entrées utilisateur
  static validateInput(input: any, schema: any): { valid: boolean; errors: string[] }

  // Gestion des templates
  static async getTemplates(serviceCode: string): Promise<IAServiceTemplate[]>
  static async getDefaultTemplate(serviceCode: string): Promise<IAServiceTemplate | null>
  static applyTemplate(contentData: any, templateStructure: string): string

  // Activer/désactiver un service
  static async toggleActive(serviceCode: string, isActive: boolean): Promise<boolean>
}
```

---

## 🖥️ Interfaces Admin - 4 Pages de Configuration

### 1. **AdminIAConfig** - Configuration des Services
**Fichier:** `src/pages/AdminIAConfig.tsx`
**Route:** `/admin/ia-config`

#### Fonctionnalités:
- ✅ Modifier les prompts (base_prompt, instructions, system_message)
- ✅ Configurer les paramètres du modèle:
  - Modèle (GPT-4, GPT-4 Turbo, GPT-3.5, Claude 3, Gemini Pro)
  - Temperature (0.0 - 2.0)
  - Max Tokens (100 - 8000)
  - Top P, Frequency Penalty, Presence Penalty
- ✅ Modifier les schémas input/output (JSON)
- ✅ Activer/Désactiver un service
- ✅ Voir l'historique des versions
- ✅ Filtrer par catégorie:
  - Génération de documents
  - Coaching et conseils
  - Matching et compatibilité
  - Analyse et évaluation

**Interface:**
```
┌─────────────────────────────────────────┐
│  Configuration Services IA               │
├─────────────────────────────────────────┤
│  Filtres: [Tous] [Documents] [Coaching]│
│                                          │
│  ┌────────────────────────────────┐    │
│  │ Génération CV IA        v3     │    │
│  │ • Modèle: GPT-4               │    │
│  │ • Temperature: 0.7            │    │
│  │ [Modifier] [Historique] [◉]  │    │
│  └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

### 2. **AdminIACenter** - Centre d'Administration IA
**Fichier:** `src/pages/AdminIACenter.tsx`
**Route:** `/admin/ia-center`

#### Onglets Disponibles:

##### a) Dashboard
- Statistiques globales:
  - Total appels IA
  - Crédits consommés
  - Utilisateurs uniques
  - Taux de succès
  - Temps moyen de réponse
- Top 5 services les plus utilisés
- Activité récente (derniers appels)

##### b) Services IA
- Liste complète des services
- Voir configurations détaillées
- Modifier paramètres
- Activer/désactiver

##### c) Templates
- Gestion des templates par service
- Templates par défaut
- Templates premium
- Prévisualisation

##### d) Tarification
- Coût en crédits par service
- Coût effectif avec promotions
- Historique des modifications

##### e) Statistiques Détaillées
- Usage par service
- Taux de succès
- Nombre d'erreurs
- Crédits consommés

##### f) Logs
- Historique complet des appels
- Date/Heure, Service, Utilisateur
- Crédits consommés, Durée
- Statut (succès/erreur)

##### g) Matching IA
- Configuration spécifique matching recruteurs
- Tarification différenciée

---

### 3. **AdminIATemplates** - Gestion des Templates
**Fichier:** `src/pages/AdminIATemplates.tsx`
**Route:** `/admin/ia-templates`

#### Fonctionnalités:
- ✅ Créer un nouveau template
- ✅ Modifier un template existant
- ✅ Définir template par défaut
- ✅ Marquer template comme Premium (avec coût en crédits)
- ✅ Prévisualiser avec données test
- ✅ Historique des modifications
- ✅ Supprimer un template
- ✅ Filtres:
  - Par service IA
  - Par format (HTML, Markdown, Text, JSON)
  - Recherche par nom/description

**Interface Template Editor:**
```
┌─────────────────────────────────────────┐
│  Modifier Template                       │
├─────────────────────────────────────────┤
│  Service: [Génération CV IA      ▾]    │
│  Nom: CV Moderne Professionnel         │
│  Format: [HTML ▾]                       │
│                                          │
│  Structure du Template:                 │
│  ┌────────────────────────────────┐    │
│  │ <div>                          │    │
│  │   <h1>{{nom}}</h1>            │    │
│  │   <p>{{titre}}</p>            │    │
│  │   {{#each experiences}}       │    │
│  │     <h3>{{poste}}</h3>        │    │
│  │   {{/each}}                   │    │
│  │ </div>                         │    │
│  └────────────────────────────────┘    │
│                                          │
│  [☑] Par défaut  [☑] Premium (50 cr)  │
│  [Prévisualiser] [Enregistrer]         │
└─────────────────────────────────────────┘
```

---

### 4. **AdminIAPricing** - Moteur de Tarification
**Fichier:** `src/pages/AdminIAPricing.tsx`
**Route:** `/admin/ia-pricing`

#### Fonctionnalités:
- ✅ Voir tous les services avec coûts
- ✅ Modifier le coût en crédits
- ✅ Activer/Désactiver promotions
- ✅ Définir pourcentage de remise (0-100%)
- ✅ Voir coût effectif calculé automatiquement
- ✅ Statistiques d'utilisation par service
- ✅ Historique des changements de prix
- ✅ Activité récente (5 dernières modifications)
- ✅ Ajouter un nouveau service

**Statistiques Affichées:**
- Services actifs
- Promotions actives
- Total services
- Nombre d'utilisations par service
- Utilisateurs uniques par service

**Interface Modification Prix:**
```
┌─────────────────────────────────────────┐
│  Modifier le Service                     │
│  Génération CV IA                        │
├─────────────────────────────────────────┤
│  Code: ai_cv_generation                 │
│  Coût en crédits: [50]                  │
│                                          │
│  ┌─ Promotion ───────────────────┐     │
│  │ [☑] Promotion Active          │     │
│  │ Remise: [20] %                │     │
│  │                                │     │
│  │ Coût original: 50 crédits     │     │
│  │ Coût promo: 40 crédits ✓     │     │
│  └────────────────────────────────┘     │
│                                          │
│  [Annuler] [Enregistrer]                │
└─────────────────────────────────────────┘
```

---

## ✅ Liste des 22 Services IA Connectés au Moteur Central

### Pour Candidats (14 services)

| # | Service | Code | Utilise IAConfig | Admin Config |
|---|---------|------|------------------|--------------|
| 1 | Génération CV | `ai_cv_generation` | ✅ | ✅ |
| 2 | Amélioration CV | `ai_cv_improvement` | ✅ | ✅ |
| 3 | CV Ciblé | `ai_cv_targeted` | ✅ | ✅ |
| 4 | Parsing CV | `ai_cv_parsing` | ✅ | ✅ |
| 5 | Lettre de Motivation | `ai_cover_letter` | ✅ | ✅ |
| 6 | Simulateur Entretien | `ai_interview_simulator` | ✅ | ✅ |
| 7 | Coach Carrière | `ai_career_coach` | ✅ | ✅ |
| 8 | Plan de Carrière | `ai_career_plan` | ✅ | ✅ |
| 9 | Matching Emplois | `ai_job_matching` | ✅ | ✅ |
| 10 | Alertes Intelligentes | `ai_job_alerts` | ✅ | ✅ |
| 11 | Chatbot Alpha | `ai_chatbot` | ✅ | ✅ |
| 12 | Analyse Profil | `ai_profile_analysis` | ✅ | ✅ |
| 13 | Optimisation SEO Profil | `ai_profile_seo` | ✅ | ✅ |
| 14 | Questions Techniques | `ai_tech_questions` | ✅ | ✅ |

### Pour Recruteurs (6 services)

| # | Service | Code | Utilise IAConfig | Admin Config |
|---|---------|------|------------------|--------------|
| 15 | Génération Offre | `ai_job_generation` | ✅ | ✅ |
| 16 | Matching Candidats | `ai_candidate_matching` | ✅ | ✅ |
| 17 | Pré-sélection Auto | `ai_auto_preselection` | ✅ | ✅ |
| 18 | Analytics Prédictifs | `ai_predictive_analytics` | ✅ | ✅ |
| 19 | Assistant Communication | `ai_communication_assistant` | ✅ | ✅ |
| 20 | Prédiction Succès | `ai_success_prediction` | ✅ | ✅ |

### Pour Formateurs (2 services)

| # | Service | Code | Utilise IAConfig | Admin Config |
|---|---------|------|------------------|--------------|
| 21 | Recommandation Contenu | `ai_content_recommendation` | ✅ | ✅ |
| 22 | Génération Certificats | `ai_certificate_generation` | ✅ | ✅ |

---

## 🔄 Workflow d'un Service IA

### Exemple: Génération de CV

```typescript
// 1. Le composant appelle le service
import { CVBuilderService } from '../services/cvBuilderService';

const result = await CVBuilderService.buildCV({
  data: cvData,
  templateId: selectedTemplate
});

// 2. Le service charge la config depuis le moteur central
const config = await IAConfigService.getConfig('ai_cv_generation');

// 3. Validation des données avec le schema
const validation = IAConfigService.validateInput(data, config.input_schema);

// 4. Chargement du template
const template = await IAConfigService.getDefaultTemplate('ai_cv_generation');

// 5. Application du template avec les données
const content = IAConfigService.applyTemplate(outputData, template.template_structure);

// 6. Enregistrement de l'utilisation + déduction crédits
await CreditService.useAICredits(userId, 'ai_cv_generation', creditsConsumed);

// 7. Retour du résultat
return { success: true, content, format: template.format };
```

---

## 🔐 Contrôles de Sécurité

### Row Level Security (RLS)

```sql
-- Seuls les admins peuvent modifier les configurations
CREATE POLICY "Admins can manage IA configs"
ON ia_service_config
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);

-- Tout le monde peut lire les configs actives
CREATE POLICY "Anyone can read active configs"
ON ia_service_config
FOR SELECT
USING (is_active = true);

-- L'historique est en lecture seule pour les admins
CREATE POLICY "Admins can read history"
ON ia_service_config_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  )
);
```

---

## 📈 Avantages du Système Centralisé

### 1. Gestion Unifiée
- ✅ Un seul endroit pour configurer tous les services IA
- ✅ Cohérence des paramètres à travers la plateforme
- ✅ Pas de code en dur (hardcoded prompts)

### 2. Flexibilité
- ✅ Modifier un prompt sans redéployer le code
- ✅ Tester différents modèles (GPT-4, Claude, Gemini)
- ✅ Ajuster les paramètres en temps réel

### 3. Traçabilité
- ✅ Historique complet des versions
- ✅ Qui a modifié quoi et quand
- ✅ Raison des changements documentée

### 4. Contrôle des Coûts
- ✅ Tarification centralisée
- ✅ Promotions faciles à activer
- ✅ Statistiques d'utilisation en temps réel

### 5. Qualité
- ✅ Validation des entrées avec schémas JSON
- ✅ Templates réutilisables
- ✅ Tests et prévisualisations

---

## 🚀 Comment Ajouter un Nouveau Service IA

### Étape 1: Configuration dans l'Admin

1. Aller sur **AdminIAPricing**
2. Cliquer sur "Nouveau Service"
3. Remplir:
   - Code unique (ex: `ai_new_service`)
   - Nom du service
   - Description
   - Coût en crédits
   - Catégorie

### Étape 2: Configuration Avancée

1. Aller sur **AdminIAConfig**
2. Trouver le nouveau service
3. Cliquer "Modifier"
4. Configurer:
   - Prompt de base
   - Instructions
   - Message système (optionnel)
   - Schémas input/output
   - Paramètres du modèle

### Étape 3: Créer des Templates

1. Aller sur **AdminIATemplates**
2. Cliquer "Nouveau Template"
3. Sélectionner le service
4. Définir la structure du template
5. Marquer comme défaut si nécessaire

### Étape 4: Code Frontend

```typescript
// Créer un nouveau service TypeScript
export class NewService {
  static async execute(input: any) {
    // 1. Charger config
    const config = await IAConfigService.getConfig('ai_new_service');

    // 2. Valider input
    const validation = IAConfigService.validateInput(input, config.input_schema);
    if (!validation.valid) {
      throw new Error('Invalid input');
    }

    // 3. Construire prompt
    const prompt = IAConfigService.buildPrompt(config, input);

    // 4. Appeler IA (GPT-4, Claude, etc.)
    const response = await callAIProvider(prompt);

    // 5. Parser output
    const output = IAConfigService.parseOutput(response, config.output_schema);

    // 6. Déduire crédits
    await CreditService.useAICredits(userId, 'ai_new_service', cost);

    return output;
  }
}
```

---

## 📊 Statistiques du Système

### Configuration Actuelle

- **Services IA actifs:** 22
- **Templates disponibles:** ~50+
- **Modèles supportés:** 6 (GPT-4, GPT-4 Turbo, GPT-3.5, Claude 3 Opus, Claude 3 Sonnet, Gemini Pro)
- **Catégories:** 5 (Génération documents, Coaching, Matching, Analyse, Général)
- **Pages admin:** 4 (Config, Center, Templates, Pricing)

### Tables Base de Données

- `ia_service_config` - Configurations des services
- `ia_service_config_history` - Historique des versions
- `ia_service_templates` - Templates de documents
- `ia_service_templates_history` - Historique des templates
- `service_credit_costs` - Tarification
- `service_credit_cost_history` - Historique des prix
- `ai_service_usage_history` - Logs d'utilisation

---

## 🎓 Bonnes Pratiques

### 1. Gestion des Prompts
- ✅ Utiliser `base_prompt` pour le contexte général
- ✅ Utiliser `instructions` pour les directives spécifiques
- ✅ Utiliser `system_message` pour remplacer tout (optionnel)

### 2. Paramètres du Modèle
- **Temperature basse (0.0-0.3):** Réponses déterministes (génération code)
- **Temperature moyenne (0.4-0.7):** Usage général
- **Temperature haute (0.8-2.0):** Créativité (génération contenu)

### 3. Schémas JSON
- Toujours définir `required` pour les champs obligatoires
- Utiliser `minLength` pour les strings
- Documenter chaque champ avec `label`

### 4. Templates
- Utiliser syntaxe `{{field}}` pour variables simples
- Utiliser `{{#each array}}...{{/each}}` pour listes
- Tester avec données réelles avant activation

### 5. Versions
- Toujours ajouter une raison lors des modifications
- Tester sur environnement de dev avant prod
- Garder les versions précédentes pour rollback

---

## 🔍 Monitoring et Analytics

### Données Disponibles dans AdminIACenter

#### Dashboard
- Appels IA total: Nombre total d'utilisations
- Crédits consommés: Total crédits utilisés
- Utilisateurs uniques: Nombre d'utilisateurs distincts
- Taux de succès: % d'appels réussis vs erreurs
- Temps moyen: Durée moyenne de réponse

#### Par Service
- Total d'appels
- Crédits consommés
- Taux de succès
- Nombre d'erreurs
- Utilisateurs uniques

#### Logs Détaillés
- Date/Heure exacte
- Service utilisé
- Utilisateur (UUID)
- Crédits consommés
- Durée en millisecondes
- Statut (success/error)
- Message d'erreur si applicable

---

## ✅ Conclusion

### Le système est COMPLÈTEMENT centralisé

**✅ Toutes les 22 fonctionnalités IA:**
- Utilisent le moteur central `IAConfigService`
- Chargent leur configuration depuis la base de données
- Sont configurables via les 4 pages admin
- Ont un historique des versions traçable
- Peuvent être activées/désactivées individuellement
- Ont une tarification configurable

**✅ Les administrateurs peuvent:**
- Modifier tous les prompts sans toucher au code
- Changer les modèles IA utilisés
- Ajuster les paramètres (temperature, tokens, etc.)
- Créer/modifier/supprimer des templates
- Activer/désactiver des services
- Gérer les promotions et tarifs
- Voir l'historique complet des modifications
- Monitorer l'utilisation en temps réel

**✅ Avantages:**
- Flexibilité maximale
- Maintenance simplifiée
- Qualité cohérente
- Coûts maîtrisés
- Traçabilité complète

Le système est production-ready et permet une gestion professionnelle de l'écosystème IA ! 🚀
