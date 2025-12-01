# Système de Configuration IA - Documentation Complète

## Vue d'Ensemble

Le système de configuration IA permet aux administrateurs de gérer dynamiquement les prompts, paramètres et schémas de validation pour tous les services d'intelligence artificielle de JobGuinée sans toucher au code.

## Architecture

### Base de Données

#### Table: `ia_service_config`

Table principale stockant la configuration active de chaque service IA.

```sql
CREATE TABLE ia_service_config (
  id uuid PRIMARY KEY,
  service_code text UNIQUE NOT NULL,  -- Identifiant unique du service
  service_name text NOT NULL,          -- Nom affiché
  service_description text,

  -- Configuration Prompts
  base_prompt text NOT NULL,           -- Prompt principal
  instructions text,                   -- Instructions additionnelles
  system_message text,                 -- Message système (override base+instructions)

  -- Schémas de validation
  input_schema jsonb,                  -- Schéma pour valider les entrées
  output_schema jsonb,                 -- Schéma pour structurer les sorties
  example_input jsonb,
  example_output jsonb,

  -- Paramètres modèle IA
  model text DEFAULT 'gpt-4',
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 2000,
  top_p numeric(3,2) DEFAULT 1.0,
  frequency_penalty numeric(3,2) DEFAULT 0.0,
  presence_penalty numeric(3,2) DEFAULT 0.0,

  -- Versioning et statut
  version integer DEFAULT 1,
  is_active boolean DEFAULT true,

  -- Metadata
  category text,
  tags text[],
  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
);
```

#### Table: `ia_service_config_history`

Historique immutable de toutes les modifications.

```sql
CREATE TABLE ia_service_config_history (
  id uuid PRIMARY KEY,
  service_id uuid NOT NULL,
  service_code text NOT NULL,
  previous_version integer,
  new_version integer NOT NULL,
  changes_summary text,
  field_changes jsonb,              -- Champs modifiés
  previous_config jsonb,            -- Config complète avant
  new_config jsonb,                 -- Config complète après
  changed_by uuid,
  change_reason text,
  created_at timestamptz
);
```

### Services Prédéfinis

Le système est initialisé avec 5 services IA:

1. **ai_cv_generation** - Génération CV IA
2. **ai_cover_letter** - Lettre de Motivation IA
3. **ai_coach** - Coach Carrière IA
4. **ai_matching** - Matching Candidat-Job IA
5. **ai_career_plan** - Plan de Carrière IA

## Service TypeScript: IAConfigService

Localisation: `/src/services/iaConfigService.ts`

### Méthodes Principales

#### 1. getConfig(serviceCode)

Récupère la configuration active d'un service.

```typescript
const config = await IAConfigService.getConfig('ai_cv_generation');

if (config) {
  console.log(config.base_prompt);
  console.log(config.model);
  console.log(config.temperature);
}
```

**Retourne**: `IAServiceConfig | null`

#### 2. getAllConfigs(activeOnly)

Liste toutes les configurations.

```typescript
// Toutes les configs
const allConfigs = await IAConfigService.getAllConfigs(false);

// Seulement actives
const activeConfigs = await IAConfigService.getAllConfigs(true);
```

#### 3. updateConfig(serviceCode, updates, changeReason)

Met à jour une configuration (crée nouvelle version).

```typescript
const result = await IAConfigService.updateConfig(
  'ai_cv_generation',
  {
    base_prompt: 'Nouveau prompt optimisé...',
    temperature: 0.8,
    max_tokens: 3000
  },
  'Amélioration qualité des CV générés'
);

if (result.success) {
  console.log(`Nouvelle version: ${result.newVersion}`);
}
```

**Important**: Chaque update incrémente automatiquement la version et sauvegarde dans l'historique.

#### 4. buildPrompt(config, userInput)

Construit le prompt final prêt pour l'IA.

```typescript
const config = await IAConfigService.getConfig('ai_cv_generation');

const builtPrompt = IAConfigService.buildPrompt(config, {
  name: 'John Doe',
  experience: ['Dev 5 ans', 'Manager 2 ans'],
  skills: ['Python', 'React', 'Leadership']
});

// builtPrompt contient:
// - systemMessage: prompt système complet
// - userMessage: entrée formatée
// - model, temperature, maxTokens, etc.
```

#### 5. getConfigHistory(serviceCode)

Récupère l'historique des versions.

```typescript
const history = await IAConfigService.getConfigHistory('ai_cv_generation');

history.forEach(entry => {
  console.log(`v${entry.previous_version} → v${entry.new_version}`);
  console.log(entry.change_reason);
  console.log(entry.field_changes);
});
```

## Interface Admin

### Page: `/admin/ia-config`

Composant: `AdminIAConfig`

**Fonctionnalités**:

1. **Liste des configurations**
   - Vue carte par service
   - Filtrage par catégorie
   - Statut actif/inactif
   - Version actuelle

2. **Éditeur de configuration**
   - 3 onglets: Prompts / Schemas / Paramètres
   - Édition base_prompt et instructions
   - Édition input/output schemas (JSON)
   - Sliders pour paramètres IA
   - Raison du changement (audit)

3. **Historique des versions**
   - Liste chronologique inversée
   - Diff des changements
   - Raison de chaque modification
   - Utilisateur ayant fait le changement

4. **Toggle Actif/Inactif**
   - Activer/désactiver un service
   - Immédiat, sans créer nouvelle version

## Utilisation dans les Services IA

### Pattern Standard

Chaque service IA doit suivre ce pattern:

```typescript
import { IAConfigService } from '../services/iaConfigService';
import { CreditService } from '../services/creditService';

async function generateCV(userProfile: any) {
  // 1. Charger la config
  const config = await IAConfigService.getConfig('ai_cv_generation');

  if (!config) {
    throw new Error('Service configuration not found');
  }

  // 2. Vérifier et consommer crédits
  const consumeResult = await CreditService.consumeCredits('ai_cv_generation');

  if (!consumeResult.success) {
    throw new Error(consumeResult.message);
  }

  // 3. Construire le prompt
  const builtPrompt = IAConfigService.buildPrompt(config, {
    fullName: userProfile.name,
    experience: userProfile.experiences,
    education: userProfile.education,
    skills: userProfile.skills
  });

  // 4. Appel IA
  const response = await callOpenAI({
    model: builtPrompt.model,
    messages: [
      { role: 'system', content: builtPrompt.systemMessage },
      { role: 'user', content: builtPrompt.userMessage }
    ],
    temperature: builtPrompt.temperature,
    max_tokens: builtPrompt.maxTokens,
    top_p: builtPrompt.topP,
    frequency_penalty: builtPrompt.frequencyPenalty,
    presence_penalty: builtPrompt.presencePenalty
  });

  // 5. Parser la sortie
  const parsedOutput = IAConfigService.parseOutput(
    response.content,
    config.output_schema
  );

  return parsedOutput;
}
```

### Exemple Complet: AICVGenerator

```typescript
// /src/components/ai/AICVGenerator.tsx

import { useState } from 'react';
import { IAConfigService } from '../../services/iaConfigService';
import { CreditService } from '../../services/creditService';

export default function AICVGenerator() {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async (profileData: any) => {
    setGenerating(true);

    try {
      // Charger config
      const config = await IAConfigService.getConfig('ai_cv_generation');

      if (!config || !config.is_active) {
        alert('Service non disponible');
        return;
      }

      // Consommer crédits
      const creditResult = await CreditService.consumeCredits('ai_cv_generation');

      if (!creditResult.success) {
        alert(creditResult.message);
        return;
      }

      // Build prompt
      const prompt = IAConfigService.buildPrompt(config, profileData);

      // Call IA (votre implémentation)
      const cv = await callYourIAService(prompt);

      // Success
      alert('CV généré avec succès!');

    } catch (error) {
      console.error('Error generating CV:', error);
      alert('Erreur lors de la génération');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      {/* Votre UI */}
      <button onClick={() => handleGenerate(data)} disabled={generating}>
        {generating ? 'Génération...' : 'Générer CV'}
      </button>
    </div>
  );
}
```

## Schemas de Validation

### Input Schema

Format JSON Schema pour valider les entrées utilisateur.

**Exemple pour ai_cv_generation**:

```json
{
  "type": "object",
  "required": ["fullName", "email"],
  "properties": {
    "fullName": {
      "type": "string",
      "label": "Nom complet",
      "minLength": 2
    },
    "email": {
      "type": "string",
      "label": "Email",
      "format": "email"
    },
    "phone": {
      "type": "string",
      "label": "Téléphone"
    },
    "summary": {
      "type": "string",
      "label": "Résumé professionnel",
      "minLength": 50
    },
    "experience": {
      "type": "array",
      "label": "Expériences",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "company": { "type": "string" },
          "duration": { "type": "string" },
          "description": { "type": "string" }
        }
      }
    },
    "education": {
      "type": "array",
      "label": "Formation",
      "items": {
        "type": "object"
      }
    },
    "skills": {
      "type": "array",
      "label": "Compétences",
      "items": {
        "type": "string"
      }
    }
  }
}
```

### Output Schema

Format attendu de la réponse IA.

**Exemple**:

```json
{
  "type": "object",
  "properties": {
    "sections": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "content": { "type": "string" }
        }
      }
    },
    "formatted_text": { "type": "string" },
    "metadata": {
      "type": "object",
      "properties": {
        "word_count": { "type": "number" },
        "sections_count": { "type": "number" }
      }
    }
  }
}
```

## Bonnes Pratiques de Prompting

### 1. Structure Claire

```
Tu es un [ROLE EXPERT].

Contexte:
[Description du contexte métier]

Objectif:
[Ce que l'IA doit produire]

Contraintes:
- [Contrainte 1]
- [Contrainte 2]

Format de sortie:
[Structure attendue]
```

### 2. Prompts Spécifiques RH

**Pour CV**:
```
Tu es un expert en rédaction de CV professionnels avec 15 ans d'expérience.

Crée un CV optimisé pour les ATS (Applicant Tracking Systems) et attractif pour les recruteurs.

Règles:
- Utilise un ton professionnel mais pas robotique
- Mets en valeur les réalisations chiffrées
- Structure claire: Résumé / Expérience / Formation / Compétences
- Maximum 2 pages
- Adapte le vocabulaire au secteur

Format JSON:
{
  "sections": [...],
  "formatted_text": "..."
}
```

**Pour Matching**:
```
Tu es un expert en recrutement et matching candidat-poste.

Analyse la compatibilité entre le profil candidat et l'offre d'emploi.

Évalue sur:
1. Compétences techniques (40%)
2. Expérience pertinente (30%)
3. Formation (15%)
4. Soft skills (15%)

Donne:
- Score global /100
- Détail par critère
- Points forts (3 min)
- Axes d'amélioration (3 max)
- Recommandation (OUI/NON/PEUT-ÊTRE)

Sois objectif et constructif.
```

### 3. Paramètres Recommandés

| Service | Temperature | Max Tokens | Usage |
|---------|-------------|------------|-------|
| CV Generation | 0.7 | 2500 | Créativité modérée |
| Cover Letter | 0.8 | 1500 | Plus créatif |
| Matching | 0.3 | 1000 | Très factuel |
| Coaching | 0.9 | 2000 | Très créatif |
| Career Plan | 0.6 | 3000 | Équilibré |

## Ajouter un Nouveau Service IA

### 1. Créer la Configuration

Via l'admin ou programmatiquement:

```typescript
const result = await IAConfigService.createConfig({
  service_code: 'ai_interview_prep',
  service_name: 'Préparation Entretien IA',
  service_description: 'Aide à la préparation d\'entretiens',
  category: 'coaching',
  base_prompt: `Tu es un coach expert en préparation d'entretiens.

Aide le candidat à préparer son entretien en:
- Analysant le poste
- Proposant des questions probables
- Suggérant des réponses types
- Donnant des conseils pratiques`,

  instructions: `Sois encourageant et pratique.
Fournis des exemples concrets.
Adapte selon le niveau d'expérience.`,

  input_schema: {
    type: 'object',
    required: ['jobTitle', 'companyName'],
    properties: {
      jobTitle: { type: 'string', label: 'Poste visé' },
      companyName: { type: 'string', label: 'Entreprise' },
      experienceLevel: { type: 'string', label: 'Niveau d\'expérience' }
    }
  },

  output_schema: {
    type: 'object',
    properties: {
      questions: { type: 'array' },
      answers: { type: 'array' },
      tips: { type: 'array' }
    }
  },

  model: 'gpt-4',
  temperature: 0.8,
  max_tokens: 2500
});
```

### 2. Ajouter dans service_credit_costs

```sql
INSERT INTO service_credit_costs (service_code, service_name, credits_cost)
VALUES ('ai_interview_prep', 'Préparation Entretien IA', 80);
```

### 3. Créer le Composant UI

```typescript
// /src/components/ai/AIInterviewPrep.tsx

export default function AIInterviewPrep() {
  const handleGenerate = async (input: any) => {
    const config = await IAConfigService.getConfig('ai_interview_prep');
    const creditResult = await CreditService.consumeCredits('ai_interview_prep');

    // ... logique génération
  };

  return (
    // ... UI
  );
}
```

## Monitoring et Analytics

### Métriques Utiles

```sql
-- Services les plus utilisés
SELECT
  service_code,
  COUNT(*) as usage_count,
  AVG(credits_amount) as avg_credits
FROM credit_transactions
WHERE service_code IS NOT NULL
  AND created_at > now() - interval '30 days'
GROUP BY service_code
ORDER BY usage_count DESC;

-- Versions actives
SELECT
  service_code,
  service_name,
  version,
  updated_at
FROM ia_service_config
WHERE is_active = true
ORDER BY category, service_name;

-- Historique des changements (derniers 7 jours)
SELECT
  service_code,
  new_version,
  change_reason,
  created_at
FROM ia_service_config_history
WHERE created_at > now() - interval '7 days'
ORDER BY created_at DESC;
```

## Sécurité

### RLS Policies

- **Lecture configs actives**: Tous utilisateurs authentifiés
- **Modification configs**: Admins uniquement
- **Lecture historique**: Admins uniquement
- **Écriture historique**: Automatique via trigger

### Validation

- Input schema validé avant envoi IA
- Output schema pour parser réponse
- Rollback automatique si échec
- Logs complets de toutes modifications

## Troubleshooting

### Service config non trouvé

```typescript
const config = await IAConfigService.getConfig('service_code');

if (!config) {
  console.error('Config not found or inactive');
  // Fallback ou erreur utilisateur
}
```

### Validation input échoue

```typescript
try {
  const prompt = IAConfigService.buildPrompt(config, userInput);
} catch (error) {
  console.error('Validation failed:', error.message);
  // Afficher erreurs à l'utilisateur
}
```

### Version conflict

L'update crée toujours nouvelle version, pas de conflit possible.

## Extensibilité Future

### Multi-Langues

Ajouter champs `base_prompt_en`, `base_prompt_fr`, etc.

### A/B Testing

Créer configs alternatives et router aléatoirement.

### Templates

Créer table `ia_prompt_templates` avec snippets réutilisables.

### Fine-tuning

Stocker exemples d'entraînement dans `example_input/output`.

---

**Le système de configuration IA est maintenant complet, modulaire et prêt pour la production!**
