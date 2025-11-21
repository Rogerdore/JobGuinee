# 🤖 Système IA Centralisé - Documentation Complète

## 📋 Vue d'ensemble

Le système IA centralisé permet de gérer **TOUS** les services IA de la plateforme depuis un point unique de configuration.

### ✨ Avantages
- ✅ **Configuration centralisée** : Tous les prompts, modèles et paramètres IA dans une seule interface Admin
- ✅ **Gestion des crédits automatisée** : Déduction automatique et traçabilité complète
- ✅ **Historique complet** : Enregistrement de chaque appel (input + output)
- ✅ **Multi-providers** : Support OpenAI, Anthropic Claude et Google Gemini
- ✅ **Scalable** : Ajouter de nouveaux services sans toucher au code

---

## 🏗️ Architecture

### 1. Base de Données

#### Table `service_credit_costs` (Configuration Services)
```sql
id                    uuid PRIMARY KEY
service_code          text UNIQUE
service_key           text UNIQUE          -- Clé d'identification (ex: analyse_profil)
service_name          text                 -- Nom affiché
service_description   text                 -- Description
credits_cost          integer              -- Coût en crédits
is_active             boolean              -- Service actif/inactif
status                boolean              -- Statut ON/OFF
category              text                 -- Catégorie
model                 text                 -- Modèle IA (gemini-pro, gpt-4, etc.)
prompt_template       text                 -- Template avec {{variables}}
system_instructions   text                 -- Instructions système
knowledge_base        text                 -- Base de connaissances spécifique
temperature           numeric(3,2)         -- Créativité (0.0-2.0)
max_tokens            integer              -- Limite tokens
```

#### Table `ai_service_usage_history` (Historique)
```sql
id                    uuid PRIMARY KEY
user_id               uuid                 -- Utilisateur
service_code          text                 -- Code du service
service_name          text                 -- Nom du service
credits_consumed      integer              -- Crédits consommés
balance_before        integer              -- Solde avant
balance_after         integer              -- Solde après
input_payload         jsonb                -- Données envoyées (NEW)
output_response       jsonb                -- Réponse IA complète (NEW)
metadata              jsonb                -- Métadonnées additionnelles
created_at            timestamptz          -- Date/heure
```

### 2. Fonction Backend

#### `use_ai_credits(p_user_id, p_service_key, p_input_payload, p_output_response)`

Fonction PostgreSQL centralisée qui :
1. ✅ Vérifie que le service existe et est actif
2. ✅ Vérifie le solde de crédits de l'utilisateur
3. ✅ Déduit les crédits
4. ✅ Enregistre la transaction dans `credit_transactions`
5. ✅ Enregistre l'utilisation complète dans `ai_service_usage_history`
6. ✅ Retourne le résultat en JSON

**Retour** :
```json
{
  "success": true,
  "credits_remaining": 1450,
  "credits_consumed": 50,
  "usage_id": "uuid...",
  "service_name": "Analyse IA de profil",
  "message": "Service exécuté avec succès"
}
```

### 3. Edge Function `/api/ai-service`

#### Endpoint centralisé
```
POST /functions/v1/ai-service
```

**Request** :
```json
{
  "user_id": "uuid...",
  "service_key": "analyse_profil",
  "payload": {
    "profile_data": "{ ... }",
    "any_variable": "value"
  }
}
```

**Workflow** :
1. ✅ Authentification de l'utilisateur
2. ✅ Récupération de la configuration du service (`service_credit_costs`)
3. ✅ Récupération de la configuration IA globale (`chatbot_config`)
4. ✅ Construction du prompt en remplaçant les `{{variables}}`
5. ✅ Appel à l'API IA (Gemini/OpenAI/Claude) selon le provider configuré
6. ✅ Appel à `use_ai_credits()` pour déduction et historique
7. ✅ Retour du résultat

**Response (Succès)** :
```json
{
  "success": true,
  "response": {
    "content": "Analyse du profil...",
    "model": "gemini-pro",
    "provider": "gemini",
    "usage": { ... }
  },
  "credits_remaining": 1450,
  "credits_consumed": 50,
  "service_name": "Analyse IA de profil",
  "usage_id": "uuid..."
}
```

**Response (Crédits insuffisants)** :
```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDITS",
  "message": "Crédits insuffisants. Requis: 50, Disponible: 20",
  "required_credits": 50,
  "available_credits": 20
}
```

---

## 🎛️ Utilisation Frontend

### Option 1 : Utility Helper (Recommandé)

```typescript
import CentralizedAIService from '@/utils/centralizedAIService';

// Analyser un profil
const result = await CentralizedAIService.analyseProfile({
  nom: "Jean Dupont",
  competences: ["React", "Node.js"],
  experience: "5 ans"
});

if (result.success) {
  console.log('Analyse:', result.response.content);
  console.log('Crédits restants:', result.credits_remaining);
} else {
  console.error('Erreur:', result.message);
}

// Générer un CV
const cvResult = await CentralizedAIService.generateCV(
  profileData,
  "Développeur Full Stack",
  "html"
);

// Générer une lettre de motivation
const letterResult = await CentralizedAIService.generateCoverLetter(
  candidateProfile,
  jobDescription,
  "formal"
);

// Chatbot
const chatResult = await CentralizedAIService.chatbotQuery(
  "Comment préparer un entretien d'embauche ?",
  "Candidat junior"
);

// Vérifier les crédits
const credits = await CentralizedAIService.getUserCredits();
console.log('Crédits disponibles:', credits);

// Récupérer l'historique
const history = await CentralizedAIService.getUserUsageHistory(10);
```

### Option 2 : Appel Direct

```typescript
const { data: { session } } = await supabase.auth.getSession();
const { data: { user } } = await supabase.auth.getUser();

const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: user.id,
      service_key: 'analyse_profil',
      payload: {
        profile_data: JSON.stringify(profileData)
      }
    })
  }
);

const result = await response.json();
```

---

## 🔧 Configuration Admin

### Page : AIServicesConfigAdmin

**Route** : `/admin/ai-services-config`

**Fonctionnalités** :
- ✅ Liste tous les services IA
- ✅ Modifier chaque service individuellement :
  - Nom et description
  - Coût en crédits
  - Modèle IA (Gemini Pro, GPT-4, Claude, etc.)
  - Température (créativité)
  - Max tokens
  - Instructions système
  - Template de prompt avec variables `{{var}}`
  - Base de connaissances spécifique
- ✅ Activer/Désactiver un service (ON/OFF)
- ✅ **Tester un service** directement depuis l'admin

### Test d'un Service

Le bouton "Tester" permet de :
1. Remplacer automatiquement les variables `{{var}}` par `[TEST_VAR]`
2. Appeler l'API IA en mode test
3. Afficher le résultat complet (succès/erreur)
4. Vérifier que le prompt, le modèle et les paramètres fonctionnent

---

## 📊 Historique Admin

### Page : AIUsageHistoryAdmin

**Route** : `/admin/ai-usage-history`

**Fonctionnalités** :
- ✅ Statistiques globales :
  - Total utilisations
  - Total crédits consommés
  - Nombre d'utilisateurs actifs
  - Service le plus utilisé
- ✅ Filtres :
  - Par utilisateur (recherche)
  - Par service
  - Par période (aujourd'hui, 7j, 30j, tout)
- ✅ Export CSV
- ✅ Affichage détaillé :
  - Date/heure
  - Utilisateur (nom + email)
  - Service utilisé
  - Crédits consommés
  - Solde avant/après

**Future Enhancement** : Ajouter visualisation des inputs/outputs

---

## 🚀 Services Disponibles

### 1. **analyse_profil** (50 crédits)
Analyse complète d'un profil candidat avec recommandations

**Variables** : `{{profile_data}}`

### 2. **generation_cv** (100 crédits)
Génération de CV professionnel optimisé ATS

**Variables** : `{{profile_data}}`, `{{target_position}}`, `{{format}}`

### 3. **lettre_motivation** (40 crédits)
Rédaction de lettre de motivation personnalisée

**Variables** : `{{candidate_profile}}`, `{{job_description}}`, `{{tone}}`

### 4. **chatbot_job** (100 crédits - accès 24h)
Assistant virtuel emploi et Code du Travail guinéen

**Variables** : `{{user_question}}`, `{{context}}`

### 5. **coaching_ia** (200 crédits)
Coaching carrière avec plan d'action personnalisé

**Variables** : `{{user_profile}}`, `{{career_goal}}`, `{{current_situation}}`

### 6. **rapport_mensuel** (200 crédits)
Rapport mensuel automatisé avec analyses

**Variables** : `{{monthly_data}}`, `{{applications_count}}`, `{{interviews_count}}`, `{{responses_count}}`

### 7. **alertes_ia** (0 crédit - GRATUIT)
Matching intelligent profil/offre d'emploi

**Variables** : `{{user_profile}}`, `{{job_offer}}`

### 8. **badge_verifie** (3 crédits/jour)
Badge profil vérifié avec déduction quotidienne automatique

---

## ➕ Ajouter un Nouveau Service

### 1. Dans la Base de Données

```sql
INSERT INTO service_credit_costs (
  service_code,
  service_key,
  service_name,
  service_description,
  credits_cost,
  is_active,
  status,
  category,
  model,
  prompt_template,
  system_instructions,
  temperature,
  max_tokens
) VALUES (
  'nouveau_service',
  'nouveau_service',
  'Nouveau Service IA',
  'Description du service',
  75,
  true,
  true,
  'IA & Analyse',
  'gemini-pro',
  'Votre prompt avec {{variable1}} et {{variable2}}',
  'Vous êtes un expert...',
  0.7,
  2000
);
```

### 2. Dans le Helper (optionnel mais recommandé)

```typescript
// Dans src/utils/centralizedAIService.ts
static async nouveauService(
  variable1: string,
  variable2: string
): Promise<AIServiceResponse> {
  return this.callService('nouveau_service', {
    variable1: variable1,
    variable2: variable2
  });
}
```

### 3. Utilisation

```typescript
const result = await CentralizedAIService.nouveauService(
  "valeur1",
  "valeur2"
);
```

**C'est tout !** Aucun changement dans l'Edge Function nécessaire.

---

## 🔒 Sécurité

### RLS (Row Level Security)

✅ **service_credit_costs** :
- Admins : Accès complet (lecture/écriture)
- Users : Lecture seule des services actifs

✅ **ai_service_usage_history** :
- Admins : Voir tout l'historique
- Users : Voir uniquement leur propre historique

### Validation

✅ L'Edge Function vérifie :
- Authentification de l'utilisateur
- Correspondance user_id avec le token
- Service actif et disponible
- Crédits suffisants avant appel IA

---

## 📈 Monitoring

### Requêtes Utiles

#### Statistiques globales
```sql
SELECT
  service_name,
  COUNT(*) as total_usages,
  SUM(credits_consumed) as total_credits,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(credits_consumed) as avg_credits
FROM ai_service_usage_history
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY service_name
ORDER BY total_usages DESC;
```

#### Top utilisateurs
```sql
SELECT
  p.full_name,
  p.email,
  COUNT(*) as usages,
  SUM(h.credits_consumed) as total_credits_spent
FROM ai_service_usage_history h
JOIN profiles p ON p.id = h.user_id
WHERE h.created_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.full_name, p.email
ORDER BY total_credits_spent DESC
LIMIT 10;
```

---

## 🎯 Bonnes Pratiques

### 1. Templates de Prompts
- ✅ Utilisez des variables claires : `{{profile_data}}`, `{{job_title}}`
- ✅ Soyez spécifique dans les instructions
- ✅ Testez avec différents types de données

### 2. Modèles IA
- **Gemini Pro** : Bon rapport qualité/prix, rapide
- **Gemini 1.5 Pro** : Plus puissant, analyses complexes
- **GPT-4** : Excellent pour l'anglais, coûteux
- **Claude 3** : Excellent pour le français, créatif

### 3. Température
- **0.0 - 0.3** : Précis, déterministe (analyses, rapports)
- **0.5 - 0.8** : Équilibré (CV, lettres)
- **0.9 - 2.0** : Créatif, varié (brainstorming)

### 4. Max Tokens
- **500-1000** : Réponses courtes (chatbot, alertes)
- **1500-2000** : Contenu moyen (analyses, coaching)
- **2500-4000** : Contenu long (CV, rapports)

---

## 🐛 Dépannage

### Erreur "SERVICE_NOT_FOUND"
→ Vérifier que `service_key` existe et que `is_active = true` et `status = true`

### Erreur "INSUFFICIENT_CREDITS"
→ L'utilisateur n'a pas assez de crédits. Afficher un message pour recharger.

### Erreur "AI configuration not found"
→ Vérifier que la table `chatbot_config` a une entrée avec `enabled = true` et `api_key` configurée

### Erreur Gemini/OpenAI
→ Vérifier la clé API dans `chatbot_config` et que le modèle est correct

---

## ✅ Checklist Mise en Production

- [ ] Clé API Gemini/OpenAI configurée dans Admin → ChatBot Config
- [ ] Tous les services ont `is_active = true` et `status = true`
- [ ] Prompts testés pour chaque service
- [ ] Crédits de bienvenue activés pour nouveaux utilisateurs
- [ ] Page Admin accessible uniquement aux admins
- [ ] Monitoring des erreurs activé
- [ ] Export CSV historique testé
- [ ] Documentation partagée avec l'équipe

---

## 🎓 Conclusion

Ce système centralisé transforme la gestion des services IA en permettant :
- **Aucun code à modifier** pour ajouter/modifier un service
- **Configuration visuelle** via l'interface Admin
- **Traçabilité complète** de chaque utilisation
- **Scalabilité** infinie

**Le système est maintenant professionnel, propre et maintenable !** 🚀
