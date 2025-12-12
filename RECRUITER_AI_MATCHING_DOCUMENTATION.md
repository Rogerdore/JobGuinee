# SYSTÈME DE MATCHING IA POUR RECRUTEURS

## Vue d'ensemble

Le système de Matching IA pour recruteurs permet d'analyser intelligemment la correspondance entre les candidats et les offres d'emploi, avec scoring détaillé, catégorisation automatique et recommandations personnalisées.

---

## Architecture du Système

### 1. Service IA Central : `ai_recruiter_matching`

**Base de données** : `ia_service_config`
- Service code : `ai_recruiter_matching`
- Catégorie : `recruiter_ai_services`
- Statut : Actif

**Configuration IA :**
- Modèle : GPT-4
- Température : 0.7 (équilibre créativité/précision)
- Max tokens : 2000
- Top_p : 1

**Prompts Système :**
```
Expert en recrutement analysant la correspondance candidat-offre
avec évaluation sur 4 axes :
- Compétences techniques (40%)
- Expérience professionnelle (30%)
- Formation & certifications (15%)
- Adéquation culturelle & soft skills (15%)
```

**Schéma d'entrée (Input Schema) :**
```json
{
  "job": {
    "title": string,
    "description": string,
    "required_skills": array,
    "experience_level": string,
    "education_level": string,
    "department": string
  },
  "candidates": [
    {
      "id": string,
      "name": string,
      "skills": array,
      "experience_years": number,
      "education": string,
      "work_history": string,
      "achievements": string
    }
  ]
}
```

**Schéma de sortie (Output Schema) :**
```json
{
  "results": [
    {
      "candidate_id": string,
      "candidate_name": string,
      "score": number (0-100),
      "category": "excellent" | "potential" | "weak",
      "analysis": {
        "summary": string,
        "strengths": array,
        "weaknesses": array,
        "recommendations": array
      },
      "score_breakdown": {
        "technical_skills": number,
        "experience": number,
        "education": number,
        "cultural_fit": number
      }
    }
  ],
  "summary": {
    "total_analyzed": number,
    "excellent_count": number,
    "potential_count": number,
    "weak_count": number,
    "top_recommendation": string
  }
}
```

---

### 2. Système de Crédits

**Base de données** : `service_credit_costs`
- Service code : `ai_recruiter_matching`
- Coût par défaut : **10 crédits par candidat analysé**
- Catégorie : `recruiter`
- Icône : `target`

**Flux de consommation :**
1. Recruteur sélectionne N candidats
2. Système calcule : `coût_total = 10 × N`
3. Vérification du solde via `profiles.credits_balance`
4. Si solde suffisant → déduction atomique via RPC `use_ai_credits()`
5. Transaction enregistrée dans `credit_transactions`
6. Usage enregistré dans `ai_service_usage_history`

**Règles importantes :**
- ❌ Les abonnements Premium **NE donnent PAS** de crédits IA gratuits
- ✅ Premium débloque **l'accès** au service de matching
- ✅ Mais chaque analyse **consomme des crédits**
- ✅ Les recruteurs doivent acheter des crédits séparément

---

### 3. Service TypeScript : `RecruiterAIMatchingService`

**Emplacement** : `/src/services/recruiterAIMatchingService.ts`

**Méthodes principales :**

#### `analyzeMatching(input, userId)`
Analyse un batch de candidats pour une offre donnée.

```typescript
const input = {
  job: { title, description, required_skills, ... },
  candidates: [{ id, name, skills, ... }]
};

const results = await RecruiterAIMatchingService.analyzeMatching(input, userId);
```

#### `batchAnalyzeApplications(jobId, applicationIds, userId)`
Analyse directement depuis les IDs d'applications.

```typescript
const results = await RecruiterAIMatchingService.batchAnalyzeApplications(
  'job-uuid',
  ['app-1', 'app-2', 'app-3'],
  'user-uuid'
);
```

**Fonctionnalités :**
- ✅ Charge la configuration IA depuis `IAConfigService`
- ✅ Valide l'input selon le schéma JSON
- ✅ Construit le prompt système dynamiquement
- ✅ Appelle le moteur IA (actuellement mock, prêt pour OpenAI/Claude)
- ✅ Parse et valide la sortie IA
- ✅ Normalise les résultats (scores 0-100, catégories)
- ✅ Gère les erreurs avec fallback local
- ✅ Enregistre l'usage pour analytics
- ✅ Met à jour `applications.ai_score` et `applications.ai_category`

**Helpers :**
```typescript
RecruiterAIMatchingService.categorizeByScore(75) // → 'excellent'
RecruiterAIMatchingService.getCategoryLabel('excellent') // → 'Excellente correspondance'
RecruiterAIMatchingService.getCategoryColor('potential') // → 'yellow'
RecruiterAIMatchingService.getCategoryIcon('weak') // → '🔴'
```

---

### 4. Interface Utilisateur : `AIMatchingModal`

**Emplacement** : `/src/components/recruiter/AIMatchingModal.tsx`

**Flux utilisateur :**

1. **Sélection des candidats**
   - Checkbox individuel par candidat
   - Bouton "Tout sélectionner" / "Tout désélectionner"
   - Compteur dynamique de candidats sélectionnés

2. **Affichage du coût**
   ```
   [Coins] Coût : 10 crédits par candidat sélectionné
   Solde actuel : 150 crédits
   ```

3. **Gating Premium**
   - ❌ Si Free tier → Affichage d'un CTA Premium
   - ✅ Si Premium → Affichage du coût en crédits

4. **Confirmation des crédits**
   - Modal `CreditConfirmModal`
   - Service : "Matching IA Recruteur"
   - Coût : `10 × nombre_candidats`
   - Description détaillée

5. **Analyse en cours**
   - Barre de progression animée
   - "Analyse IA en cours... 3/10"
   - Message : "Analyse IA des compétences, expérience, formation et adéquation culturelle..."

6. **Résultats**
   - 3 catégories visuelles (Excellent 🟢, Potentiel 🟡, Faible 🔴)
   - Statistiques globales
   - Détails par candidat :
     - Score de 0 à 100
     - Évolution (ancien score → nouveau score)
     - Points forts avec ✓
     - Points d'attention avec ⚠
     - Recommandations avec →

**Gestion des erreurs :**
- Si l'IA échoue → Fallback sur analyse locale
- Message d'avertissement affiché
- Résultats quand même fournis

---

## Intégration avec le Système Existant

### ✅ Compatible avec IAConfigService
- Utilise `IAConfigService.getConfig('ai_recruiter_matching')`
- Utilise `IAConfigService.buildPrompt()`
- Utilise `IAConfigService.validateInput()`
- Utilise `IAConfigService.parseOutput()`

### ✅ Compatible avec le Système de Crédits
- Utilise `useServiceCost('ai_recruiter_matching')`
- Utilise `CreditConfirmModal` pour confirmation
- Appelle `use_ai_credits()` RPC pour déduction atomique
- Log automatique dans `ai_service_usage_history`

### ✅ Compatible avec Premium
- Vérification `subscription_tier === 'premium'`
- Gating au niveau de l'UI
- Crédits nécessaires même pour Premium

### ❌ Ne casse rien
- Le service `AI_JOB_MATCHING` précédent reste intact
- L'ancien code de matching local est conservé comme fallback
- Tous les tests et builds réussissent

---

## Catégories de Matching

### 🟢 Excellent (≥ 75%)
- **Label** : "Excellente correspondance"
- **Couleur** : Vert
- **Action** : Candidat fortement recommandé pour entretien
- **Affichage** : Badge vert avec gradient

### 🟡 Potentiel (50-74%)
- **Label** : "Correspondance potentielle"
- **Couleur** : Jaune
- **Action** : Candidat intéressant, évaluation approfondie nécessaire
- **Affichage** : Badge jaune avec gradient

### 🔴 Faible (< 50%)
- **Label** : "Faible correspondance"
- **Couleur** : Rouge
- **Action** : Profil ne correspondant pas aux critères principaux
- **Affichage** : Badge rouge avec gradient

---

## Administration

### Configuration Admin

**Page** : À CRÉER dans `AdminIAConfig`
**Chemin** : `/admin/ia-config`

**Paramètres modifiables :**
- ✏️ Prompt système (base_prompt)
- ✏️ Instructions métier détaillées
- ✏️ Modèle IA (gpt-4, gpt-3.5-turbo, claude-2)
- ✏️ Température (0.0 - 1.0)
- ✏️ Max tokens (500 - 4000)
- ✏️ Seuils de catégorisation (excellent/potential/weak)
- ✏️ Coût en crédits par candidat
- ✏️ Activer/Désactiver le service

**Historique des modifications :**
- Table : `ia_service_config_history`
- Tracking complet des changements
- Raison du changement obligatoire
- Versioning automatique

### Monitoring

**Métriques disponibles :**
- Nombre d'analyses par jour/mois
- Crédits consommés par service
- Top utilisateurs du matching
- Taux de satisfaction (scores moyens)
- Distribution des catégories (excellent/potential/weak)

**Tables utilisées :**
- `ai_service_usage_history` : Logs d'usage détaillés
- `credit_transactions` : Transactions de crédits
- `applications` : Scores et catégories stockés

---

## Prochaines Évolutions

### Phase 2 : Intégration LLM Réelle

**Actuellement** : Mock responses (fallback local)
**Objectif** : Intégration OpenAI/Claude API

**Étapes :**
1. Ajouter clé API dans `.env`
   ```
   OPENAI_API_KEY=sk-...
   CLAUDE_API_KEY=sk-ant-...
   ```

2. Créer `llmIntegrationService.ts`
   ```typescript
   async function callOpenAI(prompt: BuiltPrompt): Promise<string> {
     const response = await fetch('https://api.openai.com/v1/chat/completions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         model: prompt.model,
         messages: [
           { role: 'system', content: prompt.systemMessage },
           { role: 'user', content: prompt.userMessage }
         ],
         temperature: prompt.temperature,
         max_tokens: prompt.maxTokens
       })
     });
     const data = await response.json();
     return data.choices[0].message.content;
   }
   ```

3. Remplacer dans `recruiterAIMatchingService.ts`
   ```typescript
   private static async callAIService(prompt: any): Promise<string> {
     // Remplacer le mock par :
     return await callOpenAI(prompt);
   }
   ```

### Phase 3 : Pipeline de Recrutement

**Tables à créer :**
```sql
-- Pipeline stages par offre
CREATE TABLE recruiter_pipeline_stages (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  stage_name TEXT, -- 'received', 'ai_screening', 'shortlist', 'interview', 'finalist', 'rejected'
  stage_order INT,
  stage_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mouvements dans le pipeline
CREATE TABLE application_stage_history (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES applications(id),
  from_stage TEXT,
  to_stage TEXT,
  moved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Vue Kanban :**
- Colonnes : Reçues | Présélection IA | Shortlist | Entretiens | Finalistes | Rejetés
- Drag & drop des candidats
- Filtres par score IA (🟢🟡🔴)
- Actions rapides (email, planifier entretien, rejeter)

### Phase 4 : Exports & Communication

**Exports :**
- PDF : Rapport de matching complet
- Excel : Tableau des scores et analyses
- CSV : Export brut pour traitement externe
- ZIP : Documents des candidats (CV, lettres de motivation)

**Communication multicanale :**
- Email : Templates de réponse automatique
- SMS : Notifications de statut
- WhatsApp Business : Échanges avec candidats
- Notifications internes : Alertes équipe RH

**Service à créer :**
```typescript
class RecruiterCommunicationService {
  static async sendBulkEmail(candidateIds: string[], template: string) {}
  static async sendSMS(candidateId: string, message: string) {}
  static async sendWhatsAppMessage(candidateId: string, message: string) {}
  static async exportToPDF(matchingResults: MatchingOutput) {}
  static async exportToExcel(matchingResults: MatchingOutput) {}
  static async zipCandidateDocuments(candidateIds: string[]) {}
}
```

---

## Sécurité & Conformité

### RLS (Row Level Security)

**Services IA :**
- ✅ Accès lecture : Tous les utilisateurs authentifiés
- ✅ Accès écriture : Admins uniquement
- ✅ Logs d'usage : Accès restreint à l'utilisateur propriétaire

**Crédits :**
- ✅ Transactions atomiques avec row locking
- ✅ Impossible de dépenser plus que le solde
- ✅ Audit trail complet

**Applications :**
- ✅ Recruteurs voient uniquement leurs candidatures
- ✅ Candidats ne voient pas les scores IA
- ✅ Admins voient tout pour support

### RGPD

- ❌ Ne pas logger de données personnelles sensibles (email, téléphone)
- ✅ Anonymisation des logs après 90 jours
- ✅ Export RGPD des données candidat disponible
- ✅ Suppression complète sur demande

---

## Tests & Débogage

### Test Manual

**Étapes :**
1. Créer un compte recruteur Premium
2. Ajouter des crédits IA (via boutique)
3. Publier une offre d'emploi
4. Ajouter des candidatures (manuellement ou via CVThèque)
5. Ouvrir le modal de matching
6. Sélectionner 3-5 candidats
7. Lancer l'analyse
8. Vérifier les résultats

**Commandes SQL de test :**
```sql
-- Ajouter 500 crédits à un recruteur
UPDATE profiles
SET credits_balance = credits_balance + 500
WHERE id = 'user-uuid';

-- Vérifier la configuration IA
SELECT * FROM ia_service_config
WHERE service_code = 'ai_recruiter_matching';

-- Vérifier le coût en crédits
SELECT * FROM service_credit_costs
WHERE service_code = 'ai_recruiter_matching';

-- Voir l'historique d'usage
SELECT * FROM ai_service_usage_history
WHERE service_key = 'ai_recruiter_matching'
ORDER BY created_at DESC
LIMIT 10;
```

### Logs de Débogage

**Frontend :**
```typescript
console.log('AIMatchingModal - isPremium:', isPremium);
console.log('Starting AI analysis with service:', 'ai_recruiter_matching');
console.log('Analysis results:', matchingResults);
```

**Backend (RPC) :**
```sql
-- Activer les logs Supabase dans le dashboard
-- Aller dans : Logs > Functions > use_ai_credits
```

---

## FAQ

### Q: Pourquoi 10 crédits par candidat ?
**R:** C'est un coût modéré qui permet :
- De couvrir les frais API (OpenAI ~ $0.002 par analyse)
- D'encourager l'usage raisonné (pas de spam)
- De maintenir la rentabilité du service

### Q: Premium donne-t-il des crédits gratuits ?
**R:** Non. Premium débloque l'accès aux fonctionnalités avancées (matching IA, CVThèque, analytics), mais les crédits doivent être achetés séparément.

### Q: Que se passe-t-il si les crédits sont insuffisants ?
**R:** Le modal `CreditConfirmModal` affiche une erreur et propose un lien vers la boutique de crédits. L'analyse ne démarre pas.

### Q: Le matching fonctionne-t-il sans IA ?
**R:** Oui ! Un système de fallback local (basé sur compétences, expérience, formation) s'active automatiquement en cas d'erreur IA.

### Q: Les scores IA sont-ils visibles par les candidats ?
**R:** Non. Les scores et analyses sont strictement réservés aux recruteurs. Les candidats ne voient que leur statut de candidature.

### Q: Peut-on personnaliser les prompts IA ?
**R:** Oui, via la page Admin IA Config. Les admins peuvent modifier les prompts, ajuster la température, changer de modèle, etc.

### Q: Le système respecte-t-il le RGPD ?
**R:** Oui. Les données sont stockées dans l'UE (Supabase EU), les logs sont anonymisés après 90 jours, et les candidats peuvent demander l'export ou suppression de leurs données.

---

## Résumé des Fichiers Créés/Modifiés

### Nouveaux Fichiers
- ✅ `/supabase/migrations/[timestamp]_create_ai_recruiter_matching_service.sql`
- ✅ `/src/services/recruiterAIMatchingService.ts`
- ✅ `/RECRUITER_AI_MATCHING_DOCUMENTATION.md`

### Fichiers Modifiés
- ✅ `/src/components/recruiter/AIMatchingModal.tsx`
  - Import de `RecruiterAIMatchingService`
  - Remplacement de la logique locale par appel IA
  - Gestion des erreurs avec fallback
  - Mise à jour des coûts en crédits

### Fichiers Inchangés (compatibilité garantie)
- ✅ `/src/services/iaConfigService.ts`
- ✅ `/src/services/creditService.ts`
- ✅ `/src/hooks/useCreditService.ts`
- ✅ `/src/hooks/usePricing.ts`
- ✅ `/src/components/credits/CreditConfirmModal.tsx`
- ✅ `/src/pages/RecruiterDashboard.tsx`

---

## Checklist de Déploiement

- [x] Migration appliquée en base de données
- [x] Service TypeScript créé et testé
- [x] Modal mis à jour avec le nouveau service
- [x] Build réussi sans erreurs
- [ ] Tests manuels en environnement de dev
- [ ] Intégration OpenAI/Claude API (Phase 2)
- [ ] Configuration admin créée (À FAIRE)
- [ ] Pipeline Kanban créé (Phase 3)
- [ ] Exports PDF/Excel ajoutés (Phase 4)
- [ ] Tests de charge (100+ candidats simultanés)
- [ ] Documentation utilisateur rédigée
- [ ] Formation équipe support

---

## Support & Contact

**Équipe Technique :**
- Lead Developer : [Nom]
- DevOps : [Nom]
- Product Manager : [Nom]

**Ressources :**
- Documentation IAConfigService : `/IA_CONFIG_DOCUMENTATION.md`
- Documentation Crédits IA : `/CREDITS_README.md`
- Documentation Premium : `/PREMIUM_AI_SERVICES.md`

---

*Document créé le : 12 décembre 2025*
*Dernière mise à jour : 12 décembre 2025*
*Version : 1.0*
