# 📋 Documentation Complète des Workflows - JobGuinee

**Version:** 1.0
**Date:** 30 Décembre 2025
**Auteur:** Système JobGuinee

---

## 📑 Table des Matières

1. [Workflows Candidats](#1-workflows-candidats)
2. [Workflows Recruteurs](#2-workflows-recruteurs)
3. [Workflows Formateurs](#3-workflows-formateurs)
4. [Workflows Administrateurs](#4-workflows-administrateurs)
5. [Workflows IA et Crédits](#5-workflows-ia-et-crédits)
6. [Workflows Paiements](#6-workflows-paiements)
7. [Workflows Premium](#7-workflows-premium)
8. [Workflows Système](#8-workflows-système)

---

## 1. Workflows Candidats

### 1.1 Workflow d'Inscription et Création de Profil

```
[Utilisateur] → [Formulaire Inscription] → [Auth Supabase] → [Création Profil]
     ↓                                                              ↓
[Email]                                                    [candidate_profiles]
     ↓                                                              ↓
[Validation]                                              [Crédits Initiaux]
     ↓                                                              ↓
[Connexion]                                               [Dashboard Candidat]
```

#### Étapes détaillées:
1. **Saisie des informations**
   - Email, mot de passe, nom, prénom
   - Validation frontend (format email, force mot de passe)

2. **Création compte Auth**
   - Table: `auth.users`
   - Trigger automatique vers profil

3. **Création profil candidat**
   - Table: `candidate_profiles`
   - Champs: full_name, email, phone, location, etc.
   - Attribution: 50 crédits gratuits

4. **Configuration initiale**
   - Préférences de notification
   - Paramètres de visibilité CVthèque

#### Services impliqués:
- `AuthContext.tsx`
- `userProfileService.ts`
- `creditService.ts`

---

### 1.2 Workflow de Complétion de Profil

```
[Dashboard] → [Formulaire Profil] → [Auto-Save] → [Validation] → [Calcul %]
     ↓              ↓                    ↓             ↓            ↓
[Indicateur]   [Sections]         [useAutoSave]   [Champs]   [Completion %]
     ↓              ↓                                              ↓
[Suggestions]  [Expérience]                                  [Badge Status]
               [Formation]
               [Compétences]
               [Documents]
```

#### Sections du profil:
1. **Informations Personnelles** (20%)
   - Nom, email, téléphone
   - Localisation, date de naissance
   - Photo de profil

2. **Expérience Professionnelle** (30%)
   - Postes occupés
   - Entreprises
   - Dates et descriptions

3. **Formation** (20%)
   - Diplômes
   - Établissements
   - Dates d'obtention

4. **Compétences** (15%)
   - Compétences techniques
   - Compétences linguistiques
   - Niveaux de maîtrise

5. **Documents** (15%)
   - CV (obligatoire)
   - Lettres de motivation
   - Certificats

#### Calcul de complétion:
```typescript
completion_percentage = (
  personal_info * 0.20 +
  experience * 0.30 +
  education * 0.20 +
  skills * 0.15 +
  documents * 0.15
) * 100
```

#### Services impliqués:
- `CandidateProfileForm.tsx`
- `useAutoSave.ts`
- `profileCompletion.ts`

---

### 1.3 Workflow de Candidature à une Offre

```
[Recherche Job] → [Détails Offre] → [Bouton Postuler] → [Vérifications]
                                            ↓
                                    [Profil Complet?]
                                        ↓     ↓
                                      OUI    NON
                                        ↓     ↓
                              [Modal Application] [Redirection Profil]
                                        ↓
                            [Sélection Documents]
                                        ↓
                            [CV requis + LM optionnelle]
                                        ↓
                            [Validation Fast Track]
                                        ↓
                            [Création Application]
                                        ↓
                            [Notification Recruteur]
                                        ↓
                            [Suivi Candidature]
```

#### Étapes détaillées:

**Phase 1: Vérifications préalables**
- Profil complété à 70% minimum
- CV présent dans Documents Hub
- Lettre de motivation si requise
- Pas de candidature en double

**Phase 2: Modal de candidature**
- Sélection du CV (obligatoire)
- Sélection lettre de motivation (si requise)
- Message de motivation (optionnel)
- Confirmation des informations

**Phase 3: Validation Fast Track**
```sql
-- Vérifications automatiques
- Email valide
- Téléphone valide
- Documents lisibles
- Profil cohérent avec l'offre
```

**Phase 4: Création application**
- Table: `applications`
- Status initial: `pending`
- Injection dans pipeline recruteur
- Création tracking candidat

**Phase 5: Notifications**
- Email candidat: confirmation
- Email recruteur: nouvelle candidature
- Notification in-app pour les deux

#### Tables impliquées:
- `applications`
- `candidate_documents`
- `application_tracking`
- `notifications`

#### Services impliqués:
- `applicationSubmissionService.ts`
- `fastApplicationValidator.ts`
- `candidateApplicationTrackingService.ts`
- `notificationService.ts`

---

### 1.4 Workflow de Suivi de Candidature

```
[Dashboard Candidat] → [Section Applications] → [Liste Candidatures]
                              ↓
                    [Pour chaque candidature]
                              ↓
                [Status Badge + Timeline] → [Modal Détails]
                              ↓
                    [Historique Actions]
                              ↓
                    [Communications]
                              ↓
                    [Prochaines Étapes]
```

#### Status possibles:
1. **pending** - En attente de traitement
2. **reviewing** - En cours d'examen
3. **shortlisted** - Présélectionné
4. **interview_scheduled** - Entretien programmé
5. **interviewed** - Entretien effectué
6. **offer_made** - Offre proposée
7. **hired** - Embauché
8. **rejected** - Refusé
9. **withdrawn** - Candidature retirée

#### Timeline des événements:
```typescript
[Candidature] → [Vue par recruteur] → [Présélection] → [Entretien] → [Décision]
    T0              T+2h                  T+2j            T+7j         T+14j
```

#### Tracking en temps réel:
- **Vue candidat**: statut actuel + historique
- **Vue recruteur**: actions effectuées
- **Notifications**: changements de statut
- **Messages**: communication directe

#### Services impliqués:
- `candidateApplicationTrackingService.ts`
- `notificationService.ts`

---

### 1.5 Workflow de Services IA Candidat

```
[Dashboard] → [Section IA] → [Sélection Service] → [Vérif Crédits]
                                    ↓                      ↓
                          [Liste Services]          [Solde suffisant?]
                                    ↓                   ↓      ↓
                          [CV Builder]              OUI     NON
                          [CV Improver]               ↓      ↓
                          [CV Targeted]         [Exécution] [Store]
                          [Cover Letter]              ↓
                          [Interview Sim]       [Déduction]
                          [Career Plan]               ↓
                                              [Résultat + Save]
```

#### Services IA disponibles:

**1. CV Builder** (20 crédits)
- Création CV from scratch
- Template professionnel
- Suggestions contextuelles

**2. CV Improver** (15 crédits)
- Analyse CV existant
- Suggestions d'amélioration
- Reformulation professionnelle

**3. CV Targeted** (25 crédits)
- Adaptation à une offre
- Optimisation mots-clés
- Score de matching

**4. Cover Letter Generator** (15 crédits)
- Génération personnalisée
- Adaptation au poste
- Ton professionnel

**5. Interview Simulator** (30 crédits)
- Questions adaptées au poste
- Feedback sur réponses
- Conseils d'amélioration

**6. Career Plan Generator** (40 crédits)
- Analyse profil complet
- Plan de carrière 5 ans
- Formations recommandées

#### Workflow d'utilisation:
```sql
-- 1. Vérification des crédits
SELECT credits_balance FROM candidate_profiles WHERE id = user_id;

-- 2. Déduction des crédits
UPDATE candidate_profiles
SET credits_balance = credits_balance - service_cost
WHERE id = user_id;

-- 3. Enregistrement historique
INSERT INTO ai_service_usage_history (user_id, service_name, credits_used, result);

-- 4. Vérification quotas premium
IF user_is_premium THEN
  CHECK premium_quota_remaining
END IF;
```

#### Services impliqués:
- `creditService.ts`
- `cvBuilderService.ts`
- `cvImproverService.ts`
- `cvTargetedService.ts`
- `interviewSimulatorService.ts`

---

### 1.6 Workflow de Hub Documents

```
[Dashboard] → [Documents Hub] → [Liste Documents]
                  ↓
        [3 Catégories Principales]
                  ↓
    ┌──────────┬─────────────┬──────────────┐
    ↓          ↓             ↓              ↓
[CV existants] [Lettres]  [Certificats] [Autres]
    ↓          ↓             ↓
[Upload]   [Upload]     [Upload]
    ↓          ↓             ↓
[Parser]   [Preview]    [Stockage]
    ↓          ↓             ↓
[Auto-Fill] [Édition]   [Gestion]
    ↓
[Profil]
```

#### Fonctionnalités Hub:

**1. Import automatique**
- CV uploadé → parsing automatique
- Extraction données → profil
- Mise à jour auto-save

**2. Gestion versions**
- Plusieurs CV possibles
- Version par défaut
- Versions ciblées par secteur

**3. Lettres de motivation**
- Templates préremplis
- Génération IA
- Personnalisation par offre

**4. Certificats**
- Upload documents
- Vérification admin (optionnel)
- Badge vérification

#### Tables impliquées:
- `candidate_documents`
- `storage.buckets` (cv-uploads, cover-letters, certificates)

#### Services impliqués:
- `candidateDocumentService.ts`
- `cvUploadParserService.ts`

---

### 1.7 Workflow de Messagerie Candidat

```
[Dashboard] → [Messages] → [Conversations] → [Sélection]
                                  ↓              ↓
                          [Par Recruteur]   [Discussion]
                                  ↓              ↓
                          [Filtres]         [Messages]
                                               ↓
                                         [Nouveau Message]
                                               ↓
                                         [Pièces Jointes]
                                               ↓
                                         [Envoi]
```

#### Types de messages:
1. **Messages recruteurs**
   - Demandes d'information
   - Confirmations entretien
   - Propositions d'emploi

2. **Messages système**
   - Changements de statut
   - Rappels
   - Recommandations

#### Services impliqués:
- `candidateMessagingService.ts`
- `notificationService.ts`

---

## 2. Workflows Recruteurs

### 2.1 Workflow d'Inscription Recruteur

```
[Formulaire] → [Informations Entreprise] → [Vérification] → [Création Compte]
     ↓                    ↓                      ↓                ↓
[Email]          [Nom Entreprise]         [Validation]    [recruiter_profiles]
[Poste]          [Secteur]                [Documents]           ↓
[Téléphone]      [Taille]                      ↓           [companies]
                 [Site web]              [Approbation]          ↓
                                                          [Crédits Initiaux]
```

#### Étapes détaillées:

**Phase 1: Informations personnelles**
- Nom, prénom, email
- Poste dans l'entreprise
- Téléphone professionnel

**Phase 2: Informations entreprise**
- Nom de l'entreprise
- Secteur d'activité
- Taille (1-10, 11-50, 51-200, 200+)
- Site web
- Description

**Phase 3: Vérification (optionnelle)**
- Document RCCM
- Justificatif d'identité
- Validation admin

**Phase 4: Attribution**
- 100 crédits gratuits
- Accès CVthèque (limité)
- Dashboard recruteur

#### Tables impliquées:
- `recruiter_profiles`
- `companies`
- `credit_packages` (pack initial)

---

### 2.2 Workflow de Publication d'Offre

```
[Dashboard] → [Publier Offre] → [Formulaire Multi-Étapes] → [Validation]
                                          ↓
                            ┌──────────────┼──────────────┐
                            ↓              ↓              ↓
                    [Étape 1: Base]  [Étape 2]    [Étape 3]
                            ↓              ↓              ↓
                    [Titre/Contrat]  [Détails]    [Critères]
                            ↓              ↓              ↓
                    [Auto-Save]      [Auto-Save]  [Auto-Save]
                            ↓
                    [Modération IA]
                            ↓
                    ┌───────┴────────┐
                    ↓                ↓
            [Approuvée]        [À Réviser]
                    ↓                ↓
            [Publication]    [Suggestions]
                    ↓
            [Visible Jobs]
```

#### Étapes du formulaire:

**Étape 1: Informations de base** (obligatoire)
- Titre du poste
- Type de contrat (CDI, CDD, Stage, etc.)
- Localisation
- Secteur d'activité

**Étape 2: Description détaillée** (obligatoire)
- Description du poste
- Missions principales
- Profil recherché
- Avantages

**Étape 3: Critères** (recommandé)
- Niveau d'expérience
- Niveau d'études
- Compétences requises
- Salaire (optionnel)
- Date limite candidature

#### Modération IA:
```javascript
// Vérifications automatiques
- Pas de contenu discriminatoire
- Conformité légale
- Clarté des informations
- Réalisme du profil demandé

// Score de qualité
quality_score = (
  completeness * 0.30 +
  clarity * 0.25 +
  attractiveness * 0.25 +
  realism * 0.20
)

// Décision
if (quality_score >= 75) → Approuvée
if (quality_score >= 50) → Suggestions
if (quality_score < 50) → À réviser
```

#### Auto-save:
- Sauvegarde toutes les 30 secondes
- Sauvegarde au changement de champ
- Indicateur visuel de sauvegarde
- Récupération en cas de perte

#### Services impliqués:
- `JobPublishForm.tsx`
- `useAutoSave.ts`
- `jobModerationService` (migration 20251215144625)

---

### 2.3 Workflow de Gestion des Candidatures (ATS)

```
[Dashboard] → [Mes Candidatures] → [Vue Tableau/Kanban]
                                            ↓
                                    [Filtres & Recherche]
                                            ↓
                            ┌───────────────┼───────────────┐
                            ↓               ↓               ↓
                    [Pipeline A1]    [Pipeline A2]    [Pipeline A3]
                            ↓               ↓               ↓
                    [Nouvelles]      [Review]         [Analyse]
                            ↓               ↓               ↓
                    [Actions]        [Actions]        [Actions]
```

#### Pipeline ATS à 3 niveaux:

**A1: Réception et Tri Initial**
```
[Nouvelle Candidature]
    ↓
[Validation Fast Track]
    ↓
[Scoring Automatique]
    ↓
┌───┴───┐
↓       ↓
[Auto-Accept] [À Réviser]
```

**A2: Révision et Présélection**
```
[Révision Manuelle]
    ↓
[Comparaison Candidats]
    ↓
[Matching IA] (Premium)
    ↓
[Shortlist]
```

**A3: Entretiens et Décision**
```
[Programmation Entretien]
    ↓
[Évaluation]
    ↓
[Décision Finale]
    ↓
┌───┴────┐
↓        ↓
[Offre]  [Rejet]
```

#### Actions par statut:

**pending** (A1):
- Voir profil complet
- Approuver/Rejeter rapidement
- Demander informations
- Ajouter notes

**reviewing** (A2):
- Comparer avec autres candidats
- Utiliser matching IA
- Présélectionner
- Envoyer questionnaire

**shortlisted** (A2):
- Programmer entretien
- Envoyer invitation
- Partager avec équipe
- Export données

**interview_scheduled** (A3):
- Confirmer RDV
- Préparer questions
- Ajouter au calendrier
- Envoyer rappels

**interviewed** (A3):
- Saisir évaluation
- Comparer évaluations équipe
- Décider suite
- Communiquer décision

#### Vue Kanban:
```
┌─────────┬─────────┬──────────┬──────────┬─────────┐
│Nouvelles│ Review  │Présélec. │Entretien │Décision │
├─────────┼─────────┼──────────┼──────────┼─────────┤
│ Card 1  │ Card 4  │ Card 7   │ Card 10  │ Card 12 │
│ Card 2  │ Card 5  │ Card 8   │ Card 11  │ Card 13 │
│ Card 3  │ Card 6  │ Card 9   │          │         │
└─────────┴─────────┴──────────┴──────────┴─────────┘
    ↓         ↓          ↓          ↓          ↓
  Drag & Drop entre colonnes
```

#### Tables impliquées:
- `applications`
- `workflow_stages`
- `application_actions_history`
- `interview_schedules`
- `interview_evaluations`

#### Services impliqués:
- `recruiterDashboardService.ts`
- `applicationActionsService.ts`
- `interviewSchedulingService.ts`
- `interviewEvaluationService.ts`

---

### 2.4 Workflow de Matching IA Recruteur

```
[Offre Publiée] → [Activer Matching IA] → [Configuration]
                                                ↓
                                        [Critères Matching]
                                                ↓
                                        ┌───────┴────────┐
                                        ↓                ↓
                                [Automatique]      [Personnalisé]
                                        ↓                ↓
                                [Recherche CVthèque]    [Filtres]
                                        ↓                ↓
                                    [Analyse IA]
                                        ↓
                                [Score Matching]
                                        ↓
                                [Rapport Détaillé]
                                        ↓
                                [Top Candidats]
```

#### Configuration du matching:

**Mode Automatique** (recommandé):
- Analyse automatique de l'offre
- Extraction critères clés
- Recherche optimisée
- Top 20 candidats

**Mode Personnalisé**:
- Filtres manuels
- Poids des critères
- Exclusions spécifiques
- Nombre de résultats

#### Critères de matching:
```javascript
matching_score = (
  skills_match * 0.30 +           // Compétences
  experience_match * 0.25 +       // Expérience
  education_match * 0.15 +        // Formation
  location_match * 0.10 +         // Localisation
  availability_match * 0.10 +     // Disponibilité
  salary_match * 0.10             // Prétentions
) * 100

// Classification
score >= 80 → Excellent match
score >= 60 → Bon match
score >= 40 → Match moyen
score < 40 → Faible match
```

#### Rapport de matching:
```
[Pour chaque candidat]
    ↓
[Score Global: 85%]
    ↓
[Détails par critère:]
- Compétences: 90% ✓
- Expérience: 85% ✓
- Formation: 80% ✓
- Localisation: 100% ✓
- Disponibilité: 70%
- Salaire: 85% ✓
    ↓
[Points forts]
[Points à vérifier]
    ↓
[Actions suggérées]
```

#### Coût en crédits:
- **Matching Standard**: 50 crédits
- **Matching Avancé**: 100 crédits
- **Premium**: Inclus dans abonnement

#### Services impliqués:
- `recruiterAIMatchingService.ts`
- `recruiterMatchingPricingService.ts`
- `pipelineInjectionService.ts`

---

### 2.5 Workflow CVthèque Recruteur

```
[Dashboard] → [CVthèque] → [Recherche/Filtres] → [Résultats Anonymes]
                                                         ↓
                                                [Sélection Profil]
                                                         ↓
                                                [Aperçu Limité]
                                                         ↓
                                            ┌────────────┴────────────┐
                                            ↓                         ↓
                                    [Ajouter au Panier]    [Acheter Direct]
                                            ↓                         ↓
                                    [Panier: X profils]      [Paiement]
                                            ↓                         ↓
                                    [Vérifier Pack]         [Déblocage]
                                            ↓
                                    [Checkout]
                                            ↓
                                    [Paiement]
                                            ↓
                                    [Déblocage Multiple]
                                            ↓
                                    [Profils Achetés]
```

#### Système d'anonymisation:
**Vue anonyme:**
- Titre professionnel
- Années d'expérience (tranche)
- Secteur d'activité
- Localisation (ville)
- Compétences principales
- Niveau d'études
- Score profil
- Badge vérification

**Données masquées:**
- Nom complet → "Candidat #12345"
- Email → Masqué
- Téléphone → Masqué
- Employeurs précis → Secteur seulement
- Photo → Avatar générique

#### Packs CVthèque:

**Pack Starter** (5,000 GNF/profil)
- 5 profils
- Validité 30 jours
- Support email

**Pack Business** (4,000 GNF/profil)
- 20 profils
- Validité 60 jours
- Support prioritaire
- Matching IA inclus

**Pack Enterprise** (3,000 GNF/profil)
- 50+ profils
- Validité 90 jours
- Support dédié
- Matching IA illimité
- Analytics avancées

#### Workflow d'achat:
```sql
-- 1. Vérifier pack actif
SELECT * FROM cvtheque_packs
WHERE recruiter_id = user_id
AND profiles_remaining > 0
AND expires_at > NOW();

-- 2a. Si pack existe → Consommation auto
UPDATE cvtheque_packs
SET profiles_remaining = profiles_remaining - 1;

-- 2b. Si pas de pack → Achat direct
INSERT INTO profile_purchases (recruiter_id, candidate_id, amount_paid);

-- 3. Déblocage profil
INSERT INTO purchased_profiles (recruiter_id, candidate_id);

-- 4. Notification candidat
INSERT INTO notifications (user_id, type, content);
```

#### Services impliqués:
- `cvthequePricingService.ts`
- `creditStoreService.ts`
- `cartHistoryService.ts`

---

### 2.6 Workflow de Communication Recruteur

```
[Dashboard] → [Communication] → [Sélection Destinataires]
                                        ↓
                            ┌───────────┼───────────┐
                            ↓           ↓           ↓
                    [Un Candidat] [Groupe]  [Tous pour offre]
                            ↓           ↓           ↓
                    [Template ou Custom]
                            ↓
                    [Personnalisation]
                            ↓
                    [Variables Auto]
                            ↓
                    [Prévisualisation]
                            ↓
                    [Envoi]
                            ↓
                    [Tracking]
```

#### Templates de communication:

**1. Accusé de réception**
```
Bonjour {candidate_name},

Nous avons bien reçu votre candidature pour le poste de {job_title}.

Votre profil est actuellement en cours d'examen par notre équipe.

Cordialement,
{recruiter_name}
{company_name}
```

**2. Demande d'informations**
```
Bonjour {candidate_name},

Nous souhaitons obtenir des précisions sur votre candidature...
```

**3. Invitation entretien**
```
Bonjour {candidate_name},

Nous avons le plaisir de vous inviter à un entretien...

Date: {interview_date}
Heure: {interview_time}
Lieu: {interview_location}
```

**4. Refus candidature**
```
Bonjour {candidate_name},

Après étude attentive de votre profil, nous avons le regret...
```

**5. Proposition d'emploi**
```
Bonjour {candidate_name},

Nous avons le plaisir de vous proposer le poste de {job_title}...
```

#### Variables automatiques:
- `{candidate_name}` - Nom du candidat
- `{job_title}` - Titre du poste
- `{company_name}` - Nom entreprise
- `{recruiter_name}` - Nom recruteur
- `{application_date}` - Date candidature
- `{interview_date}` - Date entretien
- `{interview_time}` - Heure entretien
- `{interview_location}` - Lieu entretien

#### Tracking des communications:
- Date d'envoi
- Statut (envoyé, lu, répondu)
- Temps de réponse
- Historique complet

#### Services impliqués:
- `communicationService.ts`
- `notificationService.ts`

---

### 2.7 Workflow d'Analytics Recruteur

```
[Dashboard] → [Analytics] → [Vue Globale]
                                ↓
                    ┌───────────┼───────────┐
                    ↓           ↓           ↓
            [Performance]  [Pipeline]  [ROI]
                    ↓           ↓           ↓
            [Metrics]    [Conversion]  [Coûts]
                    ↓
            [Exports]
```

#### Métriques principales:

**Performance Offres:**
- Nombre de vues
- Nombre de candidatures
- Taux de conversion
- Temps moyen de recrutement
- Qualité des candidatures

**Pipeline:**
- Candidatures par statut
- Taux de progression
- Taux d'abandon
- Goulots d'étranglement

**ROI:**
- Coût par candidature
- Coût par embauche
- ROI des services IA
- Économies vs recrutement classique

#### Rapports disponibles:

**1. Rapport Hebdomadaire**
```
- Nouvelles candidatures: X
- Entretiens réalisés: Y
- Embauches: Z
- Offres en cours: N
```

**2. Rapport Mensuel**
```
- Performance globale
- Top 5 offres
- Analyse pipeline
- Recommandations
```

**3. Rapport Annuel**
```
- Vue d'ensemble année
- Évolution mensuelle
- Benchmarks secteur
- Plan d'action
```

#### Export formats:
- PDF (rapport formaté)
- Excel (données brutes)
- CSV (import autre outil)

#### Services impliqués:
- `recruiterAnalyticsService.ts`
- `directionAnalyticsService.ts`
- `recruiterExportService.ts`

---

## 3. Workflows Formateurs

### 3.1 Workflow d'Inscription Formateur

```
[Formulaire] → [Type Organisation] → [Informations] → [Vérification] → [Création]
                        ↓
            ┌───────────┼───────────┐
            ↓           ↓           ↓
    [Indépendant] [Organisation] [Coach]
            ↓           ↓           ↓
    [Profil Solo] [Multi-formateurs] [Services]
```

#### Types d'organisation:

**1. Formateur Indépendant**
- Profil personnel
- Portfolio formations
- Gestion directe
- Paiements directs

**2. Centre de Formation**
- Profil organisation
- Équipe de formateurs
- Catalogue formations
- Gestion avancée

**3. Coach Privé**
- Services individualisés
- Réservation en ligne
- Tarifs personnalisés
- Suivi clients

#### Services impliqués:
- `trainerService.ts`

---

### 3.2 Workflow de Publication Formation

```
[Dashboard] → [Publier Formation] → [Type Formation]
                                          ↓
                        ┌─────────────────┼─────────────────┐
                        ↓                 ↓                 ↓
                [En Présentiel]    [En Ligne]      [Hybride]
                        ↓                 ↓                 ↓
                [Lieu/Dates]       [Plateforme]    [Les Deux]
                        ↓
                [Détails Formation]
                        ↓
                [Modules/Programme]
                        ↓
                [Tarification]
                        ↓
            ┌───────────┴───────────┐
            ↓                       ↓
    [Gratuite]                [Payante]
            ↓                       ↓
    [Publication]          [Config Paiement]
                                    ↓
                            [Publication]
```

#### Informations requises:

**Base:**
- Titre formation
- Description détaillée
- Objectifs pédagogiques
- Public cible
- Prérequis
- Durée
- Niveau

**Programme:**
- Modules
- Contenu détaillé
- Supports fournis
- Évaluation

**Pratique:**
- Type (présentiel/ligne/hybride)
- Dates et horaires
- Lieu (si présentiel)
- Plateforme (si en ligne)
- Capacité max

**Tarification:**
- Gratuit ou payant
- Prix
- Réductions possibles
- Conditions

#### Services impliqués:
- `trainerService.ts`
- `FormationPublishForm.tsx`

---

### 3.3 Workflow de Gestion des Inscriptions

```
[Dashboard] → [Mes Formations] → [Sélection Formation] → [Liste Inscrits]
                                                               ↓
                                                    [Statuts Participants]
                                                               ↓
                                    ┌──────────────────────────┼──────────┐
                                    ↓                          ↓          ↓
                            [En attente]                [Confirmés]  [Terminés]
                                    ↓                          ↓          ↓
                            [Validation]               [Communication] [Certificats]
```

#### Gestion des participants:

**Phase 1: Inscription**
- Réception demande
- Vérification prérequis
- Confirmation place

**Phase 2: Avant formation**
- Communication infos pratiques
- Envoi documents préparatoires
- Rappels

**Phase 3: Pendant formation**
- Liste présence
- Évaluation continue
- Support

**Phase 4: Après formation**
- Évaluation finale
- Certificat
- Suivi post-formation

---

### 3.4 Workflow de Services IA Formateur (Premium)

```
[Premium Formateur] → [IA Center] → [Services Disponibles]
                                           ↓
                        ┌──────────────────┼──────────────┐
                        ↓                  ↓              ↓
            [Générateur Programme]  [Optimisation]  [Analytics]
                        ↓                  ↓              ↓
            [Programme Détaillé]    [Suggestions]   [Insights]
```

#### Services IA Premium:

**1. Générateur de Programme** (30 crédits)
- Création programme complet
- Objectifs pédagogiques
- Progression logique
- Évaluations suggérées

**2. Optimisation de Contenu** (20 crédits)
- Analyse contenu existant
- Suggestions d'amélioration
- Mise à jour tendances
- Enrichissement

**3. Analytics Formations** (25 crédits)
- Analyse performance
- Feedback participants
- Points d'amélioration
- Benchmarks

---

## 4. Workflows Administrateurs

### 4.1 Workflow de Modération d'Offres

```
[Admin Dashboard] → [Modération Jobs] → [Offres en attente]
                                              ↓
                                    [Sélection Offre]
                                              ↓
                                    [Analyse IA + Manuelle]
                                              ↓
                            ┌─────────────────┼─────────────────┐
                            ↓                 ↓                 ↓
                    [Approuver]         [Demander]        [Rejeter]
                            ↓          [Modifications]          ↓
                    [Publication]            ↓            [Notification]
                            ↓          [Notification]           ↓
                    [Notification]           ↓            [Feedback]
                                    [Attente Corrections]
```

#### Critères de modération:

**Vérifications automatiques (IA):**
- Contenu approprié
- Conformité légale
- Clarté informations
- Réalisme profil demandé

**Vérifications manuelles:**
- Véracité entreprise
- Cohérence offre
- Qualité description
- Respect charte

#### Actions possibles:
- **Approuver**: Publication immédiate
- **Demander modifications**: Feedback précis
- **Rejeter**: Avec explication
- **Suspendre**: Investigation

---

### 4.2 Workflow de Gestion des Crédits IA

```
[Admin Dashboard] → [Crédits IA] → [Configuration]
                                         ↓
                        ┌────────────────┼────────────────┐
                        ↓                ↓                ↓
                [Coûts Services]  [Packs Crédits]  [Quotas Premium]
                        ↓                ↓                ↓
                [Modification]    [Création Pack]   [Limites]
```

#### Configuration des coûts:
```sql
-- Services candidats
CV Builder: 20 crédits
CV Improver: 15 crédits
CV Targeted: 25 crédits
Cover Letter: 15 crédits
Interview Sim: 30 crédits
Career Plan: 40 crédits

-- Services recruteurs
Matching Standard: 50 crédits
Matching Avancé: 100 crédits
Job Generator: 30 crédits
Analytics IA: 40 crédits

-- Services formateurs
Programme Generator: 30 crédits
Content Optimizer: 20 crédits
Analytics Formations: 25 crédits
```

#### Gestion des packs:
- Création nouveaux packs
- Modification tarifs
- Promotions temporaires
- Packs personnalisés entreprises

---

### 4.3 Workflow de Configuration Premium

```
[Admin Dashboard] → [Premium Config] → [Types Abonnements]
                                              ↓
                            ┌─────────────────┼─────────────────┐
                            ↓                 ↓                 ↓
                    [Candidat]          [Recruteur]        [Formateur]
                            ↓                 ↓                 ↓
                    [Quotas IA]        [Features]          [Features]
                    [Prix]             [Prix]              [Prix]
```

#### Configuration quotas:

**Premium Candidat:**
```javascript
{
  monthly_credits: 200,
  ai_services: {
    cv_builder: { quota: 5, unlimited: false },
    cv_improver: { quota: 10, unlimited: false },
    cv_targeted: { quota: 5, unlimited: false },
    cover_letter: { quota: 10, unlimited: false },
    interview_simulator: { quota: 3, unlimited: false },
    career_plan: { quota: 2, unlimited: false }
  },
  features: [
    'priority_support',
    'advanced_matching',
    'profile_boost'
  ]
}
```

**Premium Recruteur:**
```javascript
{
  monthly_credits: 500,
  ai_services: {
    matching_standard: { quota: 20, unlimited: false },
    matching_advanced: { quota: 5, unlimited: false },
    job_generator: { quota: 10, unlimited: false },
    analytics: { quota: -1, unlimited: true }
  },
  cvtheque: {
    profiles_per_month: 50,
    unlimited_preview: true
  },
  features: [
    'priority_support',
    'advanced_analytics',
    'automation_rules',
    'team_collaboration'
  ]
}
```

---

### 4.4 Workflow de Vérification Candidats

```
[Admin Dashboard] → [Vérifications] → [Demandes en attente]
                                            ↓
                                [Sélection Candidat]
                                            ↓
                                [Documents soumis]
                                            ↓
                            ┌───────────────┼───────────────┐
                            ↓               ↓               ↓
                        [Identité]      [Diplômes]     [Expérience]
                            ↓               ↓               ↓
                        [Vérifier]      [Vérifier]     [Vérifier]
                                            ↓
                                    [Décision]
                                            ↓
                            ┌───────────────┴───────────────┐
                            ↓                               ↓
                        [Valider]                      [Rejeter]
                            ↓                               ↓
                    [Badge Vérifié]                  [Notification]
```

#### Types de vérification:

**1. Identité**
- CNI ou Passeport
- Justificatif de domicile
- Photo récente

**2. Diplômes**
- Scans originaux
- Vérification auprès établissements
- Équivalences

**3. Expérience**
- Attestations de travail
- Lettres de recommandation
- Contacts références

#### Badges de vérification:
- ✓ Identité vérifiée
- ✓ Diplômes vérifiés
- ✓ Expérience vérifiée
- ★ Profil Premium
- 🏆 Profil Gold

---

### 4.5 Workflow de Gestion B2B

```
[Admin Dashboard] → [B2B Leads] → [Demandes Entreprises]
                                         ↓
                            [Triage & Qualification]
                                         ↓
                            ┌────────────┴────────────┐
                            ↓                         ↓
                    [Prospect Qualifié]         [Non Qualifié]
                            ↓                         ↓
                    [Assignation]                [Archive]
                            ↓
                    [Contact Commercial]
                            ↓
                    [Négociation]
                            ↓
                    [Création Offre]
                            ↓
                    [Signature Contrat]
                            ↓
                    [Setup Compte Enterprise]
```

#### Solutions B2B proposées:

**1. Pack Recrutement Enterprise**
- CVthèque illimitée
- Matching IA premium
- Multi-utilisateurs
- API d'intégration
- Support dédié

**2. Pack Formation Corporate**
- Formations sur mesure
- LMS intégré
- Suivi collaborateurs
- Reporting RH

**3. Pack Sourcing**
- Chasse de têtes
- Base de données exclusive
- Accompagnement personnalisé

#### Services impliqués:
- `b2bLeadsService.ts`
- `enterpriseSubscriptionService.ts`

---

### 4.6 Workflow de Configuration SEO

```
[Admin Dashboard] → [SEO Config] → [Configuration Globale]
                                          ↓
                        ┌─────────────────┼─────────────────┐
                        ↓                 ↓                 ↓
                [Meta Tags]         [Schema]           [Sitemap]
                        ↓                 ↓                 ↓
                [Génération]        [Auto-Gen]         [Auto-Gen]
                        ↓
                [Analytics]
```

#### Configuration SEO par type:

**Jobs:**
```javascript
{
  title: "{job_title} - {company_name} | JobGuinee",
  description: "Postulez pour {job_title} chez {company_name} à {location}...",
  schema: "JobPosting",
  keywords: [...job_keywords, ...sector_keywords]
}
```

**Formations:**
```javascript
{
  title: "{formation_title} - Formation {type} | JobGuinee",
  description: "Formation {title} par {trainer_name}. Devenez {objective}...",
  schema: "Course",
  keywords: [...formation_keywords, ...skill_keywords]
}
```

#### Services impliqués:
- `seoService.ts`
- `seoAutoGeneratorService.ts`
- `sitemapService.ts`

---

## 5. Workflows IA et Crédits

### 5.1 Workflow d'Utilisation des Crédits IA

```
[Utilisateur] → [Service IA] → [Vérification Crédits]
                                        ↓
                            ┌───────────┴───────────┐
                            ↓                       ↓
                    [Solde Suffisant]       [Solde Insuffisant]
                            ↓                       ↓
                    [Vérif Premium]          [Modal Achat]
                            ↓                       ↓
                    ┌───────┴────────┐        [Redirection Store]
                    ↓                ↓
            [Quota Dispo]    [Quota Épuisé]
                    ↓                ↓
            [Exécution]      [Déduction Crédits]
                    ↓                ↓
            [Résultat]       [Historique]
```

#### Logique de déduction:

**Ordre de priorité:**
1. **Quota Premium** (si abonnement actif)
   - Utilisation gratuite dans limite quota
   - Pas de déduction crédits

2. **Crédits Généraux**
   - Si quota épuisé ou pas d'abonnement
   - Déduction selon coût service

3. **Échec**
   - Ni quota ni crédits
   - Proposition d'achat

#### Code de déduction:
```sql
-- Fonction use_ai_credits
CREATE OR REPLACE FUNCTION use_ai_credits(
  p_user_id UUID,
  p_service_name TEXT,
  p_credits_required INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  credits_used INTEGER,
  used_premium_quota BOOLEAN,
  new_balance INTEGER,
  message TEXT
) AS $$
DECLARE
  v_profile_type TEXT;
  v_current_balance INTEGER;
  v_is_premium BOOLEAN;
  v_quota_remaining INTEGER;
BEGIN
  -- 1. Récupérer infos utilisateur
  SELECT user_type, credits_balance
  INTO v_profile_type, v_current_balance
  FROM candidate_profiles WHERE id = p_user_id;

  -- 2. Vérifier statut premium
  SELECT EXISTS(
    SELECT 1 FROM premium_subscriptions
    WHERE user_id = p_user_id
    AND status = 'active'
    AND end_date > NOW()
  ) INTO v_is_premium;

  -- 3. Si premium, vérifier quota
  IF v_is_premium THEN
    SELECT quota_remaining INTO v_quota_remaining
    FROM premium_ia_quotas
    WHERE user_id = p_user_id
    AND service_name = p_service_name;

    -- 3a. Utiliser quota si disponible
    IF v_quota_remaining > 0 THEN
      UPDATE premium_ia_quotas
      SET quota_remaining = quota_remaining - 1
      WHERE user_id = p_user_id AND service_name = p_service_name;

      RETURN QUERY SELECT true, 0, true, v_current_balance, 'Quota premium utilisé';
    END IF;
  END IF;

  -- 4. Sinon, utiliser crédits généraux
  IF v_current_balance >= p_credits_required THEN
    UPDATE candidate_profiles
    SET credits_balance = credits_balance - p_credits_required
    WHERE id = p_user_id;

    RETURN QUERY SELECT true, p_credits_required, false,
      v_current_balance - p_credits_required, 'Crédits utilisés';
  ELSE
    RETURN QUERY SELECT false, 0, false, v_current_balance, 'Crédits insuffisants';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

### 5.2 Workflow d'Achat de Crédits

```
[Store Crédits] → [Sélection Pack] → [Checkout] → [Paiement]
                                                       ↓
                                        ┌──────────────┴──────────────┐
                                        ↓                             ↓
                                [Orange Money]              [MTN Mobile Money]
                                        ↓                             ↓
                                [Instruction]                  [Instruction]
                                        ↓                             ↓
                                [Paiement Externe]            [Paiement Externe]
                                        ↓                             ↓
                                [Upload Preuve]               [Upload Preuve]
                                        ↓
                                [Validation Admin]
                                        ↓
                            ┌───────────┴───────────┐
                            ↓                       ↓
                    [Validé]                  [Rejeté]
                            ↓                       ↓
                    [Ajout Crédits]          [Remboursement]
                            ↓
                    [Notification]
```

#### Packs disponibles:

**Pack Starter** - 50 crédits
- Prix: 50,000 GNF
- Économie: 0%
- 1,000 GNF/crédit

**Pack Standard** - 150 crédits
- Prix: 135,000 GNF
- Économie: 10%
- 900 GNF/crédit

**Pack Pro** - 300 crédits
- Prix: 240,000 GNF
- Économie: 20%
- 800 GNF/crédit

**Pack Enterprise** - 1000 crédits
- Prix: 700,000 GNF
- Économie: 30%
- 700 GNF/crédit

#### Processus de validation:
1. **Achat**: Sélection pack + mode paiement
2. **Instructions**: Numéro et montant à payer
3. **Paiement**: Transaction externe
4. **Preuve**: Upload capture/reçu
5. **Validation**: Admin vérifie (24-48h)
6. **Attribution**: Crédits ajoutés au compte

#### Services impliqués:
- `creditStoreService.ts`
- `creditService.ts`
- `paymentProviders.ts`

---

### 5.3 Workflow des Quotas Premium

```
[Abonnement Premium] → [Activation] → [Attribution Quotas]
                                            ↓
                            [Quotas par service]
                                            ↓
                    [Utilisation services]
                                            ↓
                    [Décompte quota]
                                            ↓
                    ┌───────────────────────┴───────────────────┐
                    ↓                                           ↓
            [Quota disponible]                         [Quota épuisé]
                    ↓                                           ↓
            [Utilisation gratuite]                  [Déduction crédits]
                    ↓
            [Renouvellement mensuel]
```

#### Quotas mensuels par plan:

**Premium Candidat (10,000 GNF/mois):**
```javascript
{
  cv_builder: 5,
  cv_improver: 10,
  cv_targeted: 5,
  cover_letter: 10,
  interview_simulator: 3,
  career_plan: 2
}
```

**Premium Recruteur (50,000 GNF/mois):**
```javascript
{
  matching_standard: 20,
  matching_advanced: 5,
  job_generator: 10,
  analytics: -1  // illimité
}
```

**Premium Formateur (30,000 GNF/mois):**
```javascript
{
  program_generator: 10,
  content_optimizer: 15,
  analytics_formations: -1  // illimité
}
```

#### Renouvellement:
```sql
-- Cron job quotidien
-- Reset quotas si nouvelle période
UPDATE premium_ia_quotas
SET quota_remaining = quota_limit,
    last_reset_at = NOW()
WHERE user_id IN (
  SELECT user_id FROM premium_subscriptions
  WHERE status = 'active'
  AND last_reset_at < DATE_TRUNC('month', NOW())
);
```

---

### 5.4 Workflow de Sécurité IA

```
[Requête Service IA] → [Validation Sécurité]
                              ↓
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
    [Rate Limiting]    [Content Filter]    [Auth Check]
            ↓                 ↓                 ↓
    [Limite OK?]       [Contenu OK?]      [User OK?]
            ↓                 ↓                 ↓
        [PASS]            [PASS]            [PASS]
            ↓
    [Exécution Service]
            ↓
    [Log Sécurité]
```

#### Vérifications de sécurité:

**1. Rate Limiting**
```javascript
// Limites par utilisateur
const limits = {
  free: {
    requests_per_hour: 10,
    requests_per_day: 50
  },
  premium: {
    requests_per_hour: 50,
    requests_per_day: 500
  }
};
```

**2. Content Filtering**
```javascript
// Détection contenu inapproprié
const bannedPatterns = [
  /contenu discriminatoire/,
  /contenu illégal/,
  /spam/,
  /tentative injection/
];
```

**3. Authentication**
```javascript
// Vérification utilisateur authentifié
- Token valide
- Session active
- Permissions appropriées
```

#### Logs de sécurité:
```sql
-- Table ai_security_logs
INSERT INTO ai_security_logs (
  user_id,
  service_name,
  action,
  status,
  ip_address,
  user_agent,
  metadata
) VALUES (...);
```

---

## 6. Workflows Paiements

### 6.1 Workflow Orange Money

```
[Achat] → [Sélection Orange Money] → [Instructions] → [Paiement Externe]
                                            ↓
                                [Numéro: *144*4*4#]
                                [Montant: XXXX GNF]
                                [Référence: JG-XXXXX]
                                            ↓
                                [Transaction Mobile]
                                            ↓
                                [Reçu SMS]
                                            ↓
                                [Upload Preuve]
                                            ↓
                                [Validation Admin]
                                            ↓
                                [Attribution]
```

#### Informations requises:
- Numéro Orange Money payeur
- Montant exact
- Référence commande
- Capture d'écran ou numéro transaction

---

### 6.2 Workflow MTN Mobile Money

```
[Achat] → [Sélection MTN] → [Instructions] → [Paiement Externe]
                                   ↓
                        [Numéro: *156#]
                        [Montant: XXXX GNF]
                        [Référence: JG-XXXXX]
                                   ↓
                        [Transaction Mobile]
                                   ↓
                        [Reçu SMS]
                                   ↓
                        [Upload Preuve]
                                   ↓
                        [Validation Admin]
                                   ↓
                        [Attribution]
```

---

### 6.3 Workflow de Validation Paiement

```
[Admin Dashboard] → [Paiements en attente] → [Sélection]
                                                   ↓
                                        [Détails Transaction]
                                                   ↓
                                        [Vérification]
                                                   ↓
                                ┌──────────────────┴──────────────────┐
                                ↓                                     ↓
                        [Tout OK]                              [Problème]
                                ↓                                     ↓
                        [Validation]                          [Contact Client]
                                ↓                                     ↓
                        [Attribution]                         [Résolution]
                                ↓
                        [Notification Client]
```

#### Vérifications:
- Montant correct
- Référence valide
- Preuve de paiement authentique
- Pas de doublon
- Délai raisonnable

---

## 7. Workflows Premium

### 7.1 Workflow d'Abonnement Premium

```
[Page Premium] → [Sélection Plan] → [Checkout] → [Paiement]
                                                      ↓
                                            [Validation]
                                                      ↓
                                            [Activation Abonnement]
                                                      ↓
                                    ┌─────────────────┼─────────────────┐
                                    ↓                 ↓                 ↓
                            [Attribution]      [Features]        [Quotas]
                            [Crédits]          [Activées]        [Initialisés]
```

#### Plans disponibles:

**Premium Candidat - 10,000 GNF/mois**
- 200 crédits/mois
- Services IA avec quotas
- Profile boost CVthèque
- Support prioritaire

**Premium Recruteur - 50,000 GNF/mois**
- 500 crédits/mois
- Matching IA avancé
- 50 profils CVthèque/mois
- Analytics avancées
- Automation rules

**Premium Formateur - 30,000 GNF/mois**
- 300 crédits/mois
- Services IA formateur
- Analytics formations
- Support prioritaire

---

### 7.2 Workflow de Renouvellement Premium

```
[7 jours avant expiration] → [Email Rappel]
                                    ↓
                            [Client Renouvelle?]
                                    ↓
                        ┌───────────┴───────────┐
                        ↓                       ↓
                    [OUI]                     [NON]
                        ↓                       ↓
                [Paiement]                [Expiration]
                        ↓                       ↓
                [Renouvellement]          [Dégradation]
                        ↓                       ↓
                [Crédits +]               [Features OFF]
                [Quotas Reset]            [Crédits Restent]
```

#### Gestion expiration:
- J-7: Premier rappel
- J-3: Deuxième rappel
- J-1: Dernier rappel
- J0: Expiration
- J+1: Dégradation vers compte gratuit

---

### 7.3 Workflow Enterprise

```
[Contact B2B] → [Qualification] → [Offre Sur Mesure]
                                        ↓
                                [Négociation]
                                        ↓
                                [Signature Contrat]
                                        ↓
                                [Setup Compte]
                                        ↓
                        ┌───────────────┴───────────────┐
                        ↓                               ↓
                [Multi-utilisateurs]           [Configuration]
                        ↓                               ↓
                [Invitations]                   [Features Custom]
                        ↓                               ↓
                [Activation]                    [Limites Custom]
```

#### Features Enterprise:
- Utilisateurs illimités
- Crédits partagés
- CVthèque illimitée
- API access
- Support dédié
- Analytics institutionnels
- Branding personnalisé
- SSO (option)

---

## 8. Workflows Système

### 8.1 Workflow de Notifications

```
[Événement Système] → [Trigger] → [Création Notification]
                                         ↓
                        ┌────────────────┼────────────────┐
                        ↓                ↓                ↓
                [In-App]            [Email]           [SMS]
                        ↓                ↓                ↓
                [BD notifications]  [Queue Email]    [Queue SMS]
                        ↓                ↓                ↓
                [Badge Count]       [Envoi]          [Envoi]
```

#### Types de notifications:

**Candidats:**
- Nouvelle offre correspondante
- Changement statut candidature
- Message recruteur
- Rappel complétion profil
- Offres premium

**Recruteurs:**
- Nouvelle candidature
- Candidature qualifiée
- Entretien à venir
- Deadline offre proche
- Rapport hebdomadaire

**Formateurs:**
- Nouvelle inscription
- Évaluation reçue
- Formation à venir
- Rapport mensuel

#### Services impliqués:
- `notificationService.ts`
- Edge Function: `recruiter-daily-digest`
- Edge Function: `interview-reminders-processor`

---

### 8.2 Workflow de Digest Quotidien Recruteur

```
[Cron Quotidien 8h] → [Pour chaque recruteur]
                              ↓
                    [Agrégation données 24h]
                              ↓
                ┌─────────────┴─────────────┐
                ↓                           ↓
        [Nouvelles candidatures]     [Entretiens à venir]
                ↓                           ↓
        [Candidatures urgentes]      [Actions requises]
                ↓
        [Génération Email]
                ↓
        [Envoi]
```

#### Contenu du digest:
```
Bonjour {recruiter_name},

Voici votre résumé quotidien:

📊 Hier:
- X nouvelles candidatures
- Y entretiens réalisés
- Z offres publiées

⚠️ Actions requises:
- A candidatures non traitées depuis 3+ jours
- B entretiens à programmer

📅 Aujourd'hui:
- C entretiens programmés
- D deadlines d'offres

[Accéder au dashboard]
```

---

### 8.3 Workflow de Rappels Entretien

```
[Cron toutes les heures] → [Check entretiens à venir]
                                    ↓
                        [24h avant | 2h avant]
                                    ↓
                        ┌───────────┴───────────┐
                        ↓                       ↓
                [Candidat]                [Recruteur]
                        ↓                       ↓
                [Email + SMS]            [Email + Notification]
                        ↓
                [Confirmation]
```

#### Rappels:
- **J-1**: Email détaillé
- **H-2**: SMS rappel
- **H-0.5**: Notification in-app

---

### 8.4 Workflow SEO Auto-Generation

```
[Nouvelle Offre/Formation] → [Trigger] → [Extraction Données]
                                              ↓
                                    [Génération Meta Tags]
                                              ↓
                                    [Génération Schema.org]
                                              ↓
                                    [Génération Keywords]
                                              ↓
                                    [Update Sitemap]
                                              ↓
                                    [Indexation]
```

#### Services impliqués:
- `seoAutoGeneratorService.ts`
- `schemaService.ts`
- `sitemapService.ts`

---

### 8.5 Workflow de Backup Base de Données

```
[Cron Quotidien 2h] → [Dump BD] → [Compression] → [Stockage]
                                                       ↓
                                            [Cloud Storage]
                                                       ↓
                                            [Vérification]
                                                       ↓
                                            [Rotation 30j]
```

#### Stratégie de backup:
- **Quotidien**: Backup complet
- **Hebdomadaire**: Backup archivé
- **Mensuel**: Backup long terme
- **Rétention**: 30 jours quotidiens, 12 semaines, 12 mois

---

### 8.6 Workflow de Monitoring Performance

```
[Monitoring Continu] → [Métriques Collectées]
                              ↓
            ┌─────────────────┼─────────────────┐
            ↓                 ↓                 ↓
    [Performance]        [Erreurs]          [Usage]
            ↓                 ↓                 ↓
    [Temps réponse]      [Logs]            [Stats]
    [Requêtes BD]        [Alerts]          [Quotas]
            ↓
    [Dashboard Monitoring]
            ↓
    [Alertes si seuils]
```

#### Métriques surveillées:
- Temps de réponse API
- Taux d'erreur
- Utilisation CPU/RAM
- Espace disque
- Connexions BD
- Trafic réseau

---

## 📊 Récapitulatif des Workflows

### Par Acteur:

**Candidats**: 7 workflows principaux
- Inscription/Profil
- Candidature
- Suivi
- Services IA
- Documents
- Messagerie
- Premium

**Recruteurs**: 7 workflows principaux
- Inscription
- Publication offres
- ATS/Candidatures
- Matching IA
- CVthèque
- Communication
- Analytics

**Formateurs**: 4 workflows principaux
- Inscription
- Publication formations
- Inscriptions
- Services IA

**Administrateurs**: 6 workflows principaux
- Modération
- Crédits IA
- Premium
- Vérifications
- B2B
- SEO

### Par Fonctionnalité:

**IA & Crédits**: 4 workflows
- Utilisation
- Achat
- Quotas Premium
- Sécurité

**Paiements**: 3 workflows
- Orange Money
- MTN Mobile Money
- Validation

**Premium**: 3 workflows
- Abonnement
- Renouvellement
- Enterprise

**Système**: 6 workflows
- Notifications
- Digest quotidien
- Rappels
- SEO auto
- Backup
- Monitoring

---

## 🔄 Intégrations entre Workflows

### Exemple: Candidature Complète

```
[Candidat postule]
    ↓
[Workflow Candidature] → Crée application
    ↓
[Workflow Notification] → Notifie recruteur
    ↓
[Workflow ATS] → Ajoute au pipeline
    ↓
[Workflow Tracking] → Initialise suivi candidat
    ↓
[Workflow Email] → Confirmation candidat
```

### Exemple: Service IA

```
[Candidat demande service]
    ↓
[Workflow Sécurité IA] → Valide requête
    ↓
[Workflow Crédits] → Vérifie/déduit
    ↓
[Service IA] → Exécute
    ↓
[Workflow Historique] → Log usage
    ↓
[Workflow Notification] → Informe résultat
```

---

## 📈 Métriques et KPIs par Workflow

### Workflows Candidats:
- Taux de complétion profil
- Taux de candidature
- Temps moyen candidature
- Usage services IA
- Taux de réponse

### Workflows Recruteurs:
- Temps moyen traitement
- Taux de conversion pipeline
- Usage matching IA
- ROI recrutement
- Satisfaction candidats

### Workflows Formateurs:
- Taux de remplissage
- Satisfaction participants
- Taux de complétion
- Taux de recommandation

### Workflows Système:
- Disponibilité (uptime)
- Temps de réponse
- Taux d'erreur
- Usage ressources

---

**Fin de la documentation des workflows**

Pour toute question ou besoin de précision sur un workflow spécifique, consultez la documentation technique complète ou contactez l'équipe technique.
