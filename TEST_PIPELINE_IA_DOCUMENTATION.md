# Test du Pipeline IA - Documentation

## Vue d'ensemble

Le test du pipeline IA complet a été implémenté et validé avec succès. Le système permet de tester l'intégralité du flux de recrutement depuis le matching IA jusqu'aux actions sur les candidatures.

## Composants testés

### 1. Matching IA
- ✅ Analyse des compétences des candidats
- ✅ Scoring automatique (0-100%)
- ✅ Catégorisation (excellent/potential/weak)
- ✅ Calcul des compétences correspondantes

### 2. Injection dans le pipeline
- ✅ Déplacement automatique des candidats excellents vers "Présélection IA"
- ✅ Conservation des candidats moyens en "Reçues"
- ✅ Mise à jour des scores et catégories IA
- ✅ Logging des actions dans l'historique

### 3. Actions du pipeline
- ✅ Ajout de notes aux candidatures
- ✅ Mise en shortlist
- ✅ Changement d'étape de workflow
- ✅ Notifications automatiques (via triggers)

### 4. Résumé et analytics
- ✅ Affichage du résumé des candidatures
- ✅ Tri par score IA
- ✅ Indicateurs visuels (emojis, étoiles)

## Scripts disponibles

### 1. test-ia-pipeline-complete.js
**Description**: Script complet qui crée tous les éléments (recruteur, entreprise, candidats, job, candidatures) et teste le pipeline de bout en bout.

**Note**: Ce script nécessite la fonction `confirm_test_user_email` pour confirmer automatiquement les emails. Il peut rencontrer des limites de rate limit lors de la création de multiples utilisateurs.

**Usage**:
```bash
node test-ia-pipeline-complete.js
```

### 2. test-ia-pipeline-simple.js (RECOMMANDÉ)
**Description**: Script simplifié qui utilise des données existantes pour tester le pipeline.

**Prérequis**:
- Un recruteur existant et connecté
- Une offre d'emploi
- Au moins une candidature

**Usage**:
```bash
node test-ia-pipeline-simple.js
```

**Configuration**: Modifier les constantes au début du fichier:
```javascript
const RECRUITER_EMAIL = 'votre-email@example.com';
const RECRUITER_PASSWORD = 'votre-mot-de-passe';
const RECRUITER_ID = 'uuid-du-recruteur';
const COMPANY_ID = 'uuid-de-l-entreprise';
```

## Fonctions SQL utiles

### Confirmer un email utilisateur
```sql
SELECT * FROM public.confirm_test_user_email('uuid-de-l-utilisateur');
```

### Créer des candidatures de test
```sql
WITH job_info AS (
  SELECT id as job_id FROM jobs
  WHERE company_id = 'uuid-entreprise'
  ORDER BY id DESC LIMIT 1
),
candidates AS (
  SELECT user_id, full_name
  FROM candidate_profiles
  WHERE visibility = 'public'
  LIMIT 3
)
INSERT INTO applications (job_id, candidate_id, workflow_stage, status, cover_letter)
SELECT
  j.job_id,
  c.user_id,
  'Reçues',
  'pending',
  'Candidature de test pour le matching IA.'
FROM job_info j
CROSS JOIN candidates c
WHERE NOT EXISTS (
  SELECT 1 FROM applications a
  WHERE a.job_id = j.job_id AND a.candidate_id = c.user_id
)
RETURNING id, candidate_id, workflow_stage;
```

### Confirmer tous les utilisateurs de test
```sql
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email LIKE '%test%@gmail.com'
AND email_confirmed_at IS NULL;
```

## Résultats du test

### Exemple de sortie réussie

```
================================================================================
🚀 TEST PIPELINE IA - VERSION SIMPLIFIÉE
================================================================================

🔐 Connexion du recruteur...
✅ Connecté: recruiter.test@gmail.com
💼 Vérification de l'offre d'emploi...
✅ Utilisation du job existant: Développeur Full Stack React/Node.js
📨 Récupération des candidatures...
✅ 1 candidature(s) trouvée(s)

🤖 Lancement du matching IA...
📊 Analyse de 1 candidats...

📈 Résultats du matching:
🟡 Candidat1: 50% (aucune compétence)

⚡ Injection des résultats dans le pipeline...
✅ Candidat1: Conservé en Reçues (50%)

📊 Résumé:
   - Présélection IA: 0
   - Conservés: 1

🔧 Test des actions du pipeline...
✅ Note ajoutée
✅ Ajouté à la shortlist
✅ Étape changée vers "Entretien RH"
   ℹ️  Notification automatique envoyée

================================================================================
📊 RÉSUMÉ DU TEST
================================================================================

1 candidature(s) au total

⭐ 🟡 Candidat1
      Score IA: 50% | Étape: Entretien RH

================================================================================
✅ Test du pipeline terminé avec succès!
================================================================================
```

## Algorithme de matching

L'algorithme de matching utilise les critères suivants:

1. **Score de base**: 50 points
2. **Compétences correspondantes**: +8 points par compétence matchée
3. **Expérience**:
   - 3 ans ou plus: +15 points
   - 5 ans ou plus: +10 points supplémentaires
4. **Score final**: Limité entre 0 et 100

### Catégorisation
- 🟢 **Excellent**: Score ≥ 75%
- 🟡 **Potentiel**: Score ≥ 50%
- 🔴 **Faible**: Score < 50%

### Injection dans le pipeline
- **Excellent**: Déplacé vers "Présélection IA"
- **Potentiel**: Conservé en "Reçues"
- **Faible**: Conservé en "Reçues"

## Triggers et notifications automatiques

Les triggers PostgreSQL suivants sont actifs:

### 1. trigger_interview_notifications
Déclenché lors de: `INSERT` ou `UPDATE` sur la table `interviews`

Actions:
- Envoie une notification au candidat lors de la planification d'un entretien
- Met à jour les notifications lors du changement de statut

### 2. trigger_pipeline_communications
Déclenché lors de: `UPDATE` sur la table `applications` (changement de `workflow_stage`)

Actions:
- Envoie automatiquement un message au candidat
- Utilise les templates de communication
- Log l'envoi dans `communications_log`

## Tables impliquées

### Applications
- `id`: UUID de la candidature
- `job_id`: ID de l'offre
- `candidate_id`: ID du candidat
- `workflow_stage`: Étape actuelle
- `ai_score`: Score IA (0-100)
- `ai_category`: Catégorie IA
- `is_shortlisted`: En shortlist?
- `status`: Statut global

### Application Activity Log
- `id`: UUID de l'entrée
- `application_id`: ID de la candidature
- `actor_id`: ID de l'acteur
- `action_type`: Type d'action
- `metadata`: Données additionnelles
- `created_at`: Date de création

### Application Notes
- `id`: UUID de la note
- `application_id`: ID de la candidature
- `recruiter_id`: ID du recruteur
- `note_text`: Contenu de la note
- `is_private`: Note privée?

## Services backend utilisés

### 1. RecruiterAIMatchingService
```typescript
// Analyser un lot de candidatures
const results = await RecruiterAIMatchingService.batchAnalyzeApplications(
  jobId,
  applicationIds,
  userId
);
```

### 2. pipelineInjectionService
```typescript
// Injecter les résultats dans le pipeline
const result = await pipelineInjectionService.injectMatchingResults(
  matchingResults,
  config
);
```

### 3. applicationActionsService
```typescript
// Ajouter une note
await applicationActionsService.addNote(applicationId, noteText, isPrivate);

// Mettre en shortlist
await applicationActionsService.shortlistApplication(applicationId);
```

## Dépannage

### Erreur: email rate limit exceeded
**Cause**: Trop de créations d'utilisateurs en peu de temps.

**Solution**:
1. Attendre quelques minutes
2. Utiliser le script simplifié avec des utilisateurs existants
3. Confirmer manuellement les emails via SQL

### Erreur: new row violates row-level security policy
**Cause**: L'utilisateur connecté n'a pas les droits pour effectuer l'opération.

**Solution**:
1. Vérifier que l'utilisateur est bien authentifié
2. Vérifier que l'utilisateur a le bon rôle (recruiter/candidate)
3. Pour les tests, créer les données via SQL

### Erreur: Could not find the column
**Cause**: Le schéma de la base de données a changé ou la colonne n'existe pas.

**Solution**:
1. Vérifier la structure de la table avec:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'nom_de_la_table';
```
2. Adapter le code pour utiliser les bonnes colonnes

## Prochaines étapes

1. ✅ Pipeline de matching IA fonctionnel
2. ✅ Actions du recruteur implémentées
3. ✅ Notifications automatiques configurées
4. ⏳ Interface utilisateur pour le matching IA
5. ⏳ Tableaux de bord analytics
6. ⏳ Rapports de matching détaillés

## Support

Pour toute question ou problème:
1. Vérifier les logs des scripts
2. Consulter cette documentation
3. Vérifier les migrations SQL dans `supabase/migrations/`
4. Consulter les services dans `src/services/`
