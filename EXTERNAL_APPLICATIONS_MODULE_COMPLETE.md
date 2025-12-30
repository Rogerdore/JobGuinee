# Module Candidatures Externes JobGuinée - Documentation Complète

## Date: 30 Décembre 2025
## Status: ✅ MODULE COMPLET ET PRODUCTION-READY

---

## 🎯 VISION STRATÉGIQUE DU MODULE

### Principe Fondamental

**JobGuinée est la SOURCE CENTRALE du profil candidat.**

Le module "Candidatures Externes" permet aux candidats inscrits de :
- Utiliser leur profil JobGuinée comme dossier professionnel unique
- Postuler à des offres externes (hors plateforme)
- Envoyer des candidatures professionnelles par email
- Donner accès à leur profil sans créer de compte recruteur
- Suivre et organiser toutes leurs candidatures externes

**📌 GRATUITÉ CONDITIONNELLE :**
- Accès 100% GRATUIT pour profils ≥ 80% de complétion
- AUCUN paiement requis
- AUCUN pack premium bloquant
- Service à forte valeur ajoutée pour fidélisation

---

## 📊 ARCHITECTURE TECHNIQUE

### 1. BASE DE DONNÉES

#### Tables créées

##### 1.1 `external_applications`
Stocke toutes les candidatures externes des candidats.

**Champs principaux:**
- `id` - UUID unique
- `candidate_id` - Référence au profil candidat
- `job_title` - Titre de l'offre
- `company_name` - Nom de l'entreprise
- `job_url` - URL de l'offre (optionnel)
- `job_description` - Description (optionnel)
- `recruiter_email` - Email du recruteur (OBLIGATOIRE)
- `recruiter_name` - Nom du recruteur (optionnel)
- `cv_document_id` - Référence au CV joint
- `cover_letter_document_id` - Référence à la lettre de motivation
- `additional_document_ids` - Tableau d'IDs de documents additionnels
- `cv_source` - Origine du CV: `profile` | `document_center` | `uploaded`
- `custom_message` - Message personnalisé du candidat
- `public_profile_token` - Token d'accès au profil public
- `status` - Statut: `sent`, `in_progress`, `relance_sent`, `rejected`, `accepted`, `no_response`, `cancelled`
- `email_sent_successfully` - Boolean
- `last_relance_at` - Date de dernière relance
- `relance_count` - Nombre de relances envoyées
- `candidate_notes` - Notes personnelles
- `imported_from_url` - Boolean si import automatique

**Indexes:**
- `idx_external_applications_candidate` sur `candidate_id`
- `idx_external_applications_status` sur `status`
- `idx_external_applications_sent_at` sur `sent_at DESC`

##### 1.2 `public_profile_tokens`
Gère les tokens d'accès public aux profils candidats.

**Champs principaux:**
- `id` - UUID unique
- `candidate_id` - Référence au profil
- `token` - Token sécurisé unique (base64)
- `expires_at` - Date d'expiration
- `is_revoked` - Boolean révocation
- `created_for_application_id` - Référence à la candidature
- `view_count` - Compteur de vues
- `last_viewed_at` - Date dernière vue
- `allowed_sections` - Sections accessibles du profil
- `custom_message` - Message personnalisé

**Fonctionnalités:**
- Génération automatique de tokens sécurisés
- Expiration configurable (défaut: 90 jours)
- Révocation manuelle
- Tracking des consultations
- Accès sans authentification

##### 1.3 `external_application_documents`
Liaison entre candidatures et documents.

**Champs:**
- `external_application_id` - Référence à la candidature
- `document_id` - Référence au document
- `document_type` - Type: `cv`, `cover_letter`, `certificate`, `other`
- `display_order` - Ordre d'affichage

##### 1.4 `external_application_relances`
Historique des relances.

**Champs:**
- `external_application_id` - Référence à la candidature
- `message` - Contenu de la relance
- `sent_at` - Date d'envoi
- `email_sent_successfully` - Boolean
- `email_error_message` - Message d'erreur éventuel

##### 1.5 `external_applications_config`
Configuration globale du module (unique ligne).

**Champs configurables:**
- `module_enabled` - Boolean activation module
- `min_profile_completion` - % minimum requis (défaut: 80)
- `max_file_size_mb` - Taille max fichiers (défaut: 10 MB)
- `allowed_file_types` - Types autorisés (défaut: pdf, doc, docx, jpg, png)
- `max_applications_per_day` - Limite quotidienne (défaut: 10)
- `max_relances_per_application` - Max relances (défaut: 3)
- `min_days_between_relances` - Délai minimum (défaut: 7 jours)
- `token_validity_days` - Durée tokens (défaut: 90 jours)
- `application_email_template` - Template email candidature
- `relance_email_template` - Template email relance

#### Fonctions SQL

##### `check_external_application_access(p_candidate_id uuid)`
Vérifie l'accès au module.

**Retourne:** Boolean

**Logique:**
1. Vérifie si module activé
2. Récupère profile_completion_percentage
3. Vérifie si ≥ min_profile_completion

##### `generate_public_profile_token(p_candidate_id uuid, p_application_id uuid)`
Génère un token public unique et sécurisé.

**Retourne:** Text (token)

**Logique:**
1. Génère 32 bytes aléatoires
2. Encode en base64 URL-safe
3. Calcule date d'expiration
4. Insère dans public_profile_tokens
5. Retourne le token

##### `increment_token_view_count(p_token text)`
Incrémente atomiquement le compteur de vues.

**Actions:**
- +1 sur view_count
- Met à jour last_viewed_at
- Vérifie token non révoqué et non expiré

#### Sécurité RLS

**Toutes les tables ont RLS activé.**

**external_applications:**
- Candidats voient/créent/modifient leurs propres candidatures
- Admins voient toutes les candidatures

**public_profile_tokens:**
- Candidats voient/créent/modifient leurs propres tokens
- Admins voient tous les tokens

**external_application_documents:**
- Candidats gèrent leurs propres documents de candidatures

**external_application_relances:**
- Candidats voient/créent leurs propres relances

**external_applications_config:**
- Lecture publique (authentifiés)
- Modification admin uniquement

---

### 2. SERVICES TYPESCRIPT

#### 2.1 `externalApplicationService.ts`

**Méthodes principales:**

```typescript
// Vérification d'accès
checkAccess(candidateId: string): Promise<{
  hasAccess: boolean;
  reason?: string;
  profileCompletion?: number;
}>

// Configuration
getConfig(): Promise<{
  success: boolean;
  data?: ExternalApplicationConfig;
}>

// CRUD Candidatures
createApplication(candidateId, params): Promise<...>
getCandidateApplications(candidateId): Promise<...>
getApplication(applicationId): Promise<...>
updateApplicationStatus(applicationId, status, notes?): Promise<...>

// Relances
sendRelance(applicationId, message): Promise<...>
private canSendRelance(application): Promise<...>

// Utilitaires
markEmailSent(applicationId, success, errorMessage?): Promise<...>
getStatistics(candidateId): Promise<{ total, sent, in_progress, accepted, rejected, no_response }>
private checkDailyLimits(candidateId): Promise<...>
private generatePublicProfileToken(candidateId): Promise<string>
```

**Fonctionnalités clés:**
- ✅ Vérification automatique profil ≥ 80%
- ✅ Limites anti-spam (10/jour par défaut)
- ✅ Génération automatique de tokens publics
- ✅ Validation des relances (max 3, délai 7 jours)
- ✅ Statistiques complètes

#### 2.2 `publicProfileTokenService.ts`

**Méthodes principales:**

```typescript
// Génération token
generateToken(candidateId, applicationId?): Promise<...>

// Accès profil public
getProfileByToken(token): Promise<{
  success: boolean;
  data?: PublicProfileData;
}>

// Validation
private validateToken(token): Promise<{
  valid: boolean;
  candidateId?: string;
}>

// Tracking
private incrementViewCount(token): Promise<void>

// Récupération données
private fetchCandidateProfile(candidateId): Promise<PublicProfileData>

// URL publique
getPublicProfileURL(token): string
```

**Fonctionnalités clés:**
- ✅ Tokens sécurisés base64 URL-safe
- ✅ Validation expiration + révocation
- ✅ Tracking automatique des vues
- ✅ Assemblage données profil complet
- ✅ URL publique formatée

#### 2.3 `externalJobImportService.ts`

**Méthodes principales:**

```typescript
// Import automatique
importJobFromURL(url: string): Promise<ImportResult>

// Extraction données
private extractJobData(url): Promise<ImportedJobData>

// Validation
private isValidURL(url): boolean
```

**Stratégies d'extraction:**
1. Métadonnées Open Graph (og:title, og:description)
2. Métadonnées HTML standard (title, meta description)
3. Parsing heuristique du HTML
4. Fallback vers saisie manuelle

**Données extraites:**
- `job_title` - Titre du poste
- `company_name` - Nom entreprise
- `job_description` - Description
- `recruiter_email` - Email (si détectable)
- `recruiter_name` - Nom recruteur (si détectable)

#### 2.4 `externalApplicationEmailService.ts`

**Méthodes principales:**

```typescript
// Envoi email candidature
sendApplicationEmail(applicationId): Promise<...>

// Envoi email relance
sendRelanceEmail(applicationId, relanceId): Promise<...>

// Génération contenu
generateApplicationEmail(params): Promise<{
  subject: string;
  body: string;
}>

// Templates
private getActiveTemplate(): Promise<...>
private replaceVariables(template, variables): string
private generateFallbackEmail(params): { subject, body }

// Construction email
private buildEmailHTML(body): string
private attachDocuments(applicationId): Promise<...>
```

**Variables de template disponibles:**

**Candidature initiale:**
- `{{candidate_name}}` - Nom complet du candidat
- `{{candidate_email}}` - Email du candidat
- `{{candidate_phone}}` - Téléphone du candidat
- `{{job_title}}` - Titre de l'offre
- `{{company_name}}` - Nom de l'entreprise
- `{{recruiter_name}}` - Nom du recruteur
- `{{profile_url}}` - Lien vers profil public
- `{{platform_url}}` - URL de JobGuinée
- `{{custom_message}}` - Message personnalisé
- `{{has_cv}}` - Boolean
- `{{has_cover_letter}}` - Boolean
- `{{has_other_documents}}` - Boolean

**Relance:**
- (Toutes les variables ci-dessus) +
- `{{sent_date}}` - Date candidature initiale
- `{{days_since}}` - Jours écoulés

**Conditions:**
```
{{#if variable}}...{{/if}}
```

#### 2.5 `candidateDocumentService.ts` (Existant, réutilisé)

**Méthodes réutilisées:**

```typescript
getDocuments(candidateId, type?): Promise<...>
uploadDocument(candidateId, file, type, title): Promise<...>
downloadDocument(documentId): Promise<...>
deleteDocument(documentId): Promise<...>
```

**Types de documents:**
- `cv` - Curriculum Vitae
- `cover_letter` - Lettre de motivation
- `certificate` - Certificat / Diplôme
- `other` - Autre document

---

### 3. PAGES & COMPOSANTS UI

#### 3.1 `/pages/ExternalApplication.tsx`

**Formulaire multi-étapes de candidature externe.**

**Étapes du formulaire:**

##### Étape 1: Import d'offre
- Champ URL de l'offre
- Bouton "Importer automatiquement"
- Extraction automatique des données
- Fallback vers saisie manuelle

##### Étape 2: Détails de l'offre
- Titre du poste (OBLIGATOIRE)
- Entreprise (OBLIGATOIRE)
- Email recruteur (OBLIGATOIRE)
- Nom recruteur (optionnel)
- URL de l'offre (optionnel, pré-rempli)
- Description (optionnel)

##### Étape 3: Choix du CV
**3 options EXCLUSIVES:**

1. **Utiliser le CV du profil**
   - Récupère automatiquement le CV principal
   - Option par défaut

2. **Sélectionner depuis le Centre de documents**
   - Liste des CV disponibles
   - Aperçu du CV sélectionné
   - Téléchargement possible

3. **Uploader un nouveau CV**
   - Upload fichier (PDF, DOC, DOCX)
   - Validation taille max
   - Enregistrement dans Centre de documents
   - Utilisation pour cette candidature

**Règles:**
- Le CV est OBLIGATOIRE
- Le CV principal du profil n'est PAS modifié automatiquement
- Tracking de la source (profile/document_center/uploaded)

##### Étape 4: Lettre de motivation
**3 options:**

1. **Créer une nouvelle lettre**
   - Éditeur de texte riche (RichTextEditor)
   - Mise en forme complète
   - Sauvegarde dans Centre de documents
   - Utilisation pour cette candidature

2. **Sélectionner une lettre existante**
   - Liste des lettres disponibles
   - Ouverture dans éditeur
   - Modification possible avant envoi
   - Sauvegarde comme nouvelle version si modifiée

3. **Ne pas joindre de lettre**
   - Autorisé si offre ne l'exige pas

**Principe fondamental:**
- ❌ PAS de lettre de motivation par défaut dans le profil
- ✅ Chaque lettre est spécifique à une offre
- ✅ Réutilisation possible des lettres précédentes
- ✅ Édition avant chaque envoi

##### Étape 5: Message personnalisé
- Champ texte optionnel
- Message ajouté dans le corps de l'email
- Permet de personnaliser la candidature

##### Étape 6: Aperçu & envoi
- Récapitulatif complet
- Prévisualisation de l'email
- Vérification documents joints
- Affichage du lien profil public
- Bouton "Envoyer la candidature"

**Gestion des erreurs:**
- Validation à chaque étape
- Messages d'erreur clairs
- Blocage si profil < 80%
- Vérification limites quotidiennes
- Gestion échecs upload

**Fonctionnalités additionnelles:**
- Indicateur de progression (1/6, 2/6, etc.)
- Navigation libre entre étapes
- Sauvegarde temporaire en cours
- Retour arrière possible

#### 3.2 `/pages/ExternalApplications.tsx`

**Page historique et suivi des candidatures externes.**

**Fonctionnalités principales:**

##### Vue d'ensemble
- Liste complète des candidatures
- Tri par date (plus récentes en premier)
- Filtres multiples
- Barre de recherche

##### Statistiques globales
**Cartes KPI:**
- Total candidatures
- Envoyées
- En cours
- Acceptées
- Refusées
- Sans réponse

##### Filtres
**Par statut:**
- Toutes
- Envoyée
- En cours
- Relance envoyée
- Acceptée
- Refusée
- Sans réponse

**Par recherche:**
- Titre de l'offre
- Nom de l'entreprise

##### Cards candidature
**Informations affichées:**
- Logo entreprise (si disponible)
- Titre du poste
- Nom de l'entreprise
- Date d'envoi
- Statut avec badge coloré
- Email recruteur
- Compteur relances

**Actions rapides:**
- Voir détails
- Modifier statut
- Relancer recruteur
- Ajouter notes
- Voir email envoyé
- Copier lien profil public

##### Modal détails
**Onglet Informations:**
- Toutes les données de la candidature
- Documents joints avec aperçu
- Message personnalisé
- Lien profil public

**Onglet Historique:**
- Timeline des événements
- Dates de relances
- Changements de statut
- Notes ajoutées

**Actions:**
- Modification du statut
- Envoi de relance
- Ajout de notes personnelles
- Téléchargement documents

##### Relances
**Modal relance:**
- Vérification limites (max 3)
- Vérification délai (min 7 jours)
- Champ message personnalisé
- Template pré-rempli
- Envoi avec confirmation

**Règles:**
- Max 3 relances par candidature
- Min 7 jours entre relances
- Tracking automatique
- Notification succès/échec

#### 3.3 `/pages/PublicProfile.tsx`

**Page profil public accessible sans authentification.**

**Accès:**
- URL: `https://jobguinee.com/public-profile?token={secure_token}`
- Aucune authentification requise
- Token validé à chaque visite
- Tracking automatique des vues

**Contenu affiché:**

##### En-tête
- Photo de profil
- Nom complet
- Titre professionnel
- Localisation
- Badge "Profil vérifié JobGuinée"

##### Coordonnées
- Email
- Téléphone
- LinkedIn (si renseigné)
- Portfolio (si renseigné)
- GitHub (si renseigné)

##### Résumé professionnel
- Présentation / Bio
- Compétences clés
- Objectifs professionnels

##### Expériences professionnelles
- Liste chronologique
- Poste / Entreprise
- Dates
- Description des missions
- Réalisations

##### Formation
- Diplômes
- Établissements
- Dates
- Mentions

##### Compétences
- Compétences techniques
- Compétences transversales
- Niveaux de maîtrise

##### Langues
- Langues parlées
- Niveaux

##### Certifications
- Titres
- Organismes
- Dates
- Fichiers téléchargeables

##### Documents téléchargeables
- CV
- Lettres de motivation
- Certificats
- Autres documents
- Boutons de téléchargement

**Fonctionnalités:**
- Design responsive
- Impression possible
- Export PDF (futur)
- Non indexable par moteurs de recherche
- Watermark JobGuinée

**Gestion d'erreurs:**
- Token invalide → Message explicite
- Token expiré → Redirection
- Token révoqué → Message
- Profil incomplet → Message

**CTA Recruteur:**
- Message d'invitation inscription
- Lien vers création compte recruteur
- Avantages CVthèque JobGuinée

#### 3.4 `/pages/AdminExternalApplications.tsx`

**Page admin de configuration du module.**

**Sections:**

##### 1. Statistiques globales
**Métriques affichées:**
- Total candidatures externes
- Candidatures aujourd'hui
- Tokens actifs
- Total vues profils publics
- Moyenne complétion profils

**Graphiques:**
- Évolution candidatures (7 jours)
- Répartition par statut
- Top entreprises destinataires

##### 2. Configuration module
**Paramètres:**

**Activation:**
- Toggle ON/OFF du module
- Impact immédiat sur accès candidats

**Règles d'accès:**
- % Minimum complétion profil (défaut: 80)
- Slider 0-100%
- Avertissement si < 80%

**Limites fichiers:**
- Taille max en MB (défaut: 10)
- Types autorisés (multi-select)
- Validation en temps réel

**Limites anti-spam:**
- Max candidatures/jour (défaut: 10)
- Input numérique
- Min: 1, Max: 50

**Relances:**
- Max relances/candidature (défaut: 3)
- Délai min entre relances en jours (défaut: 7)

**Tokens profil public:**
- Durée validité en jours (défaut: 90)
- Min: 1, Max: 365

##### 3. Templates email
**Éditeur template candidature:**
- Champ texte multiligne
- Syntaxe {{variable}}
- Aperçu rendu
- Bouton "Restaurer défaut"
- Liste variables disponibles

**Éditeur template relance:**
- Même fonctionnalités

**Variables affichées:**
- Documentation inline
- Exemples d'utilisation
- Conditions {{#if}}

##### 4. Actions admin
**Boutons:**
- Sauvegarder configuration
- Réinitialiser aux valeurs par défaut
- Exporter statistiques (CSV)
- Consulter logs système

**Messages de feedback:**
- Succès sauvegarde
- Erreurs validation
- Confirmations actions critiques

#### 3.5 `/components/candidate/ExternalApplicationCTA.tsx`

**Composant CTA pour accès module dans dashboard candidat.**

**États:**

##### 1. Profil < 80% (BLOQUÉ)
**Apparence:**
- Card gris/orange
- Icône cadenas 🔒
- Message "Débloquer ce service"
- Barre progression profil
- Message encouragement
- Bouton désactivé "Débloquer ce service 🔒"

**Au clic:**
- Ouverture ConfirmationModal
- Titre: "Complétez votre profil pour débloquer"
- Message pédagogique
- Bouton primaire: "Compléter mon profil"
- Bouton secondaire: "Plus tard"

**Logique UX:**
- Indication % manquant (ex: "Encore 25% pour débloquer")
- Liste suggestions ("Complétez votre CV, expériences, diplômes")
- Ton positif et motivant

##### 2. Profil ≥ 80% (DÉBLOQUÉ)
**Apparence:**
- Card vert/bleu
- Icône envoi ✉️
- Message "Postuler à une offre externe"
- Description du service
- Bouton actif vert "Postuler maintenant"
- Badge "✓ Service gratuit"

**Au clic:**
- Navigation vers /external-application
- Accès immédiat au formulaire

**Modal félicitations (1ère fois):**
- Affichage automatique au premier accès après déblocage
- Titre: "🎉 Félicitations !"
- Message: "Votre profil est maintenant complété à 80%. Vous pouvez postuler..."
- Bouton primaire: "Postuler à une offre externe"
- Bouton secondaire: "Fermer"
- Session storage pour éviter répétition

**Design:**
- Gradient attractif
- Micro-animations hover
- Icons lucide-react
- Responsive mobile/desktop

---

## 📧 TEMPLATES EMAIL

### Template Candidature Initiale

**Objet:**
```
Candidature – {{job_title}} | {{candidate_name}}
```

**Corps:**
```
Bonjour {{#if recruiter_name}}{{recruiter_name}}{{/if}},

Je vous adresse ma candidature pour le poste de **{{job_title}}** au sein de **{{company_name}}**.

Cette candidature vous est transmise via la plateforme **JobGuinée**, le portail emploi et RH de référence en Guinée.

Vous trouverez en pièces jointes :
- mon CV{{#if has_cover_letter}}
- ma lettre de motivation{{/if}}{{#if has_other_documents}}
- d'autres documents utiles à ma candidature{{/if}}

{{#if custom_message}}
**Message du candidat :**
{{custom_message}}

{{/if}}
👉 **Vous pouvez consulter mon profil professionnel complet** (sans création de compte) via le lien sécurisé ci-dessous :

🔗 {{profile_url}}

Ce lien vous permet d'accéder à :
✓ Mon parcours professionnel détaillé
✓ Mes compétences et certifications
✓ Mes documents téléchargeables
✓ Mes coordonnées complètes

Cordialement,

{{candidate_name}}
📧 {{candidate_email}}{{#if candidate_phone}}
📱 {{candidate_phone}}{{/if}}

---
*Envoyé via JobGuinée - Plateforme emploi & RH en Guinée*
*🌐 {{platform_url}}*
```

### Template Relance

**Objet:**
```
Relance candidature – {{job_title}} | {{candidate_name}}
```

**Corps:**
```
Bonjour {{#if recruiter_name}}{{recruiter_name}}{{/if}},

Je me permets de revenir vers vous concernant ma candidature au poste de **{{job_title}}** au sein de **{{company_name}}**, que je vous ai envoyée le {{sent_date}}.

Je reste très intéressé(e) par cette opportunité et serais ravi(e) d'échanger avec vous sur mon profil et mes motivations.

{{#if custom_message}}
{{custom_message}}

{{/if}}
Pour rappel, vous pouvez consulter mon profil complet via ce lien :
🔗 {{profile_url}}

Je reste à votre disposition pour tout complément d'information.

Dans l'attente de votre retour,

Cordialement,

{{candidate_name}}
📧 {{candidate_email}}{{#if candidate_phone}}
📱 {{candidate_phone}}{{/if}}

---
*Envoyé via JobGuinée - Plateforme emploi & RH en Guinée*
*🌐 {{platform_url}}*
```

---

## 🔄 WORKFLOWS UTILISATEUR

### Workflow Candidat - Candidature Complète

```
1. Candidat connecté sur JobGuinée
   ↓
2. Dashboard candidat → CTA "Postuler à une offre externe"
   ↓
3. Vérification profil_completion >= 80%
   ├─ OUI → Accès formulaire
   └─ NON → Modal "Complétez votre profil" → Redirection formulaire profil
   ↓
4. Formulaire multi-étapes
   ├─ Étape 1: Import URL offre (optionnel)
   ├─ Étape 2: Détails offre (titre, entreprise, email recruteur)
   ├─ Étape 3: Choix CV (profile / document_center / upload)
   ├─ Étape 4: Lettre motivation (new / existing / none)
   ├─ Étape 5: Message personnalisé (optionnel)
   └─ Étape 6: Aperçu & validation
   ↓
5. Soumission candidature
   ├─ Upload documents si nécessaire
   ├─ Génération token profil public
   ├─ Création enregistrement external_applications
   └─ Envoi email au recruteur externe
   ↓
6. Confirmation succès → Redirection historique candidatures
   ↓
7. Page ExternalApplications
   ├─ Liste toutes les candidatures
   ├─ Filtres par statut
   ├─ Recherche par entreprise/poste
   └─ Actions: détails, relance, notes, modification statut
```

### Workflow Recruteur Externe - Consultation Profil

```
1. Recruteur reçoit email candidature
   ├─ Pièces jointes (CV, lettre, certificats)
   └─ Lien profil public sécurisé
   ↓
2. Clic sur lien profil public
   ↓
3. Validation token
   ├─ Valid + non expiré + non révoqué → OK
   └─ Invalide → Message erreur + CTA inscription JobGuinée
   ↓
4. Affichage profil complet (PublicProfile)
   ├─ Informations personnelles
   ├─ Parcours professionnel
   ├─ Formation
   ├─ Compétences
   ├─ Documents téléchargeables
   └─ Coordonnées contact
   ↓
5. Incrémentation view_count automatique
   ↓
6. Recruteur peut:
   ├─ Télécharger documents
   ├─ Imprimer profil
   ├─ Contacter candidat directement
   └─ S'inscrire sur JobGuinée pour accès CVthèque complète
```

### Workflow Candidat - Relance

```
1. Candidat sur page ExternalApplications
   ↓
2. Sélection candidature → Action "Relancer"
   ↓
3. Vérification limites relance
   ├─ Relance_count < max (3)
   └─ Days_since_last_relance >= min (7)
   ↓
4. Modal relance
   ├─ Template pré-rempli
   ├─ Édition message personnalisé
   └─ Bouton "Envoyer relance"
   ↓
5. Envoi relance
   ├─ Création enregistrement external_application_relances
   ├─ Update external_applications (last_relance_at, relance_count, status)
   └─ Envoi email recruteur avec template relance
   ↓
6. Confirmation succès + Mise à jour liste candidatures
```

### Workflow Admin - Configuration Module

```
1. Admin connecté → Menu Admin
   ↓
2. "Candidatures Externes" → AdminExternalApplications
   ↓
3. Visualisation statistiques
   ├─ Total candidatures
   ├─ Tokens actifs
   ├─ Vues profils
   └─ Graphiques évolution
   ↓
4. Configuration paramètres
   ├─ Activation/désactivation module
   ├─ % Min complétion profil
   ├─ Limites fichiers
   ├─ Limites anti-spam
   ├─ Durée tokens
   └─ Templates email
   ↓
5. Sauvegarde configuration
   ↓
6. Application immédiate aux nouveaux accès candidats
```

---

## 🎨 DESIGN & UX

### Principes de Design

1. **Clarté et Simplicité**
   - Formulaire multi-étapes progressif
   - Une action principale par écran
   - Indicateurs de progression clairs
   - Labels explicites

2. **Feedback Immédiat**
   - Validation en temps réel
   - Messages d'erreur contextuels
   - Confirmations d'actions
   - Loading states

3. **Guidance Utilisateur**
   - Tooltips explicatifs
   - Exemples inline
   - Messages pédagogiques
   - CTA clairs

4. **Accessibilité**
   - Contrastes suffisants
   - Tailles de police lisibles
   - Navigation clavier
   - Screen reader friendly

5. **Responsive Design**
   - Mobile first
   - Breakpoints adaptés
   - Touch-friendly
   - Optimisation tablettes

### Palette de Couleurs

**Statuts candidatures:**
- Envoyée → Bleu (#3B82F6)
- En cours → Jaune (#EAB308)
- Relance → Violet (#A855F7)
- Acceptée → Vert (#10B981)
- Refusée → Rouge (#EF4444)
- Sans réponse → Gris (#6B7280)

**Actions:**
- Primaire → Orange (#EA580C) - Brand JobGuinée
- Succès → Vert (#059669)
- Danger → Rouge (#DC2626)
- Neutre → Gris (#4B5563)

**Backgrounds:**
- Principal → Blanc (#FFFFFF)
- Secondaire → Gris clair (#F9FAFB)
- Cards → Blanc avec ombre
- Hover → Gris très clair (#F3F4F6)

---

## 📊 MÉTRIQUES & ANALYTICS

### KPIs Plateforme

**Volume:**
- Nombre total candidatures externes
- Candidatures/jour, /semaine, /mois
- Croissance mensuelle
- Candidatures par candidat (moyenne)

**Engagement:**
- Taux adoption du module (% candidats actifs)
- Taux complétion profil 80%+ (avant/après)
- Nombre moyen étapes avant abandon
- Temps moyen complétion formulaire

**Qualité:**
- Taux succès envoi emails
- Taux ouverture tokens profils publics
- Nombre moyen vues par token
- Taux acceptation candidatures (déclaré)

**Relances:**
- Nombre moyen relances/candidature
- Taux réponse après relance
- Délai moyen entre relances

### KPIs Business

**Acquisition:**
- Nouveaux candidats suite au module
- Taux inscription recruteurs via profils publics
- Conversions CTA "Créer compte recruteur"

**Rétention:**
- Candidats actifs sur le module (MAU)
- Taux retour candidats (7j, 30j)
- Fréquence utilisation module

**Valeur:**
- Augmentation qualité profils
- Réduction taux abandon candidatures internes
- Augmentation satisfaction candidats (NPS)

---

## 🔒 SÉCURITÉ & CONFORMITÉ

### Mesures de Sécurité

**Authentification:**
- Sessions sécurisées Supabase Auth
- RLS complet sur toutes les tables
- Validation ownership à chaque requête

**Tokens Profil Public:**
- Génération cryptographiquement sécurisée
- Base64 URL-safe encoding
- Expiration automatique (90j défaut)
- Révocation manuelle possible
- Tracking consultations

**Protection Données:**
- Chiffrement en transit (HTTPS)
- Chiffrement au repos (Supabase)
- Accès limités par rôle (RLS)
- Logs audits complets

**Anti-Spam:**
- Limites quotidiennes (10/jour)
- Limites relances (3 max)
- Délais minimum (7j)
- Détection abus (monitoring)

**Validation Entrées:**
- Sanitization emails
- Validation formats fichiers
- Contrôle tailles uploads
- Protection XSS/injection

### Conformité RGPD

**Consentement:**
- Acceptation CGU lors inscription
- Information utilisation données
- Opt-in explicit pour emails

**Droits Utilisateurs:**
- Accès données (export)
- Rectification (édition profil)
- Suppression (delete account)
- Opposition (désactivation module)

**Transparence:**
- Politique de confidentialité claire
- Information durée conservation
- Explication tokens publics
- Contact DPO disponible

**Portabilité:**
- Export données candidatures (JSON)
- Export historique (CSV)
- Téléchargement documents

---

## 🚀 DÉPLOIEMENT & MAINTENANCE

### Checklist Déploiement

**Base de données:**
- ✅ Migrations appliquées
- ✅ RLS configuré
- ✅ Indexes créés
- ✅ Fonctions SQL testées
- ✅ Configuration par défaut insérée

**Backend:**
- ✅ Services TypeScript déployés
- ✅ Tests unitaires passés
- ✅ Validation endpoints API
- ✅ Logs configurés
- ✅ Monitoring actif

**Frontend:**
- ✅ Build production réussi
- ✅ Tests e2e passés
- ✅ Responsive vérifié
- ✅ Performance optimisée
- ✅ SEO audit OK

**Configuration:**
- ✅ Variables environnement
- ✅ Templates email par défaut
- ✅ Limites anti-spam
- ✅ Durée tokens
- ✅ Formats fichiers autorisés

### Monitoring Production

**Métriques à surveiller:**

**Performance:**
- Temps réponse API candidatures (<200ms)
- Temps génération tokens (<100ms)
- Temps upload documents (<2s)
- Temps envoi emails (<5s)

**Disponibilité:**
- Uptime module (>99.9%)
- Taux succès envoi emails (>95%)
- Taux erreurs API (<1%)
- Taux génération tokens réussie (100%)

**Business:**
- Candidatures/jour
- Nouveaux candidats qualifiés/jour
- Tokens actifs
- Vues profils publics

**Erreurs:**
- Échecs envoi emails
- Tokens expirés consultés
- Dépassements limites quotidiennes
- Erreurs upload fichiers

### Maintenance Régulière

**Quotidien:**
- Vérification logs erreurs
- Monitoring métriques clés
- Alertes incidents

**Hebdomadaire:**
- Analyse statistiques module
- Revue feedback candidats
- Optimisations requêtes lentes

**Mensuel:**
- Nettoyage tokens expirés
- Archive anciennes candidatures (>1 an)
- Rapport analytics complet
- Mise à jour templates si besoin

**Trimestriel:**
- Audit sécurité complet
- Review limites anti-spam
- Optimisation performances
- Formation équipe support

---

## 📚 GUIDE UTILISATEUR

### Pour les Candidats

#### Comment accéder au module ?

1. **Complétez votre profil à 80% minimum**
   - Ajoutez votre CV
   - Renseignez vos expériences professionnelles
   - Ajoutez votre formation
   - Listez vos compétences
   - Complétez vos coordonnées

2. **Accédez au module depuis votre dashboard**
   - Cliquez sur le bouton "Postuler à une offre externe"
   - Le module est 100% gratuit une fois débloqué

#### Comment créer une candidature ?

1. **Importez l'offre (optionnel)**
   - Copiez l'URL de l'offre externe
   - Collez-la dans le champ prévu
   - Cliquez sur "Importer automatiquement"
   - Les informations sont pré-remplies automatiquement

2. **Complétez les détails**
   - Titre du poste
   - Nom de l'entreprise
   - Email du recruteur (obligatoire)
   - URL de l'offre

3. **Choisissez votre CV**
   - Utilisez le CV de votre profil
   - OU sélectionnez un CV depuis vos documents
   - OU uploadez un nouveau CV

4. **Ajoutez une lettre de motivation**
   - Créez une nouvelle lettre avec l'éditeur
   - OU sélectionnez une lettre existante
   - OU ne joignez pas de lettre

5. **Ajoutez un message personnalisé (optionnel)**
   - Quelques lignes pour vous démarquer

6. **Vérifiez l'aperçu et envoyez**
   - Relisez votre candidature
   - Vérifiez les documents joints
   - Cliquez sur "Envoyer"

#### Comment suivre mes candidatures ?

1. **Accédez à l'historique**
   - Menu → "Mes candidatures externes"

2. **Consultez vos statistiques**
   - Total envoyées
   - En cours
   - Acceptées / Refusées

3. **Filtrez et recherchez**
   - Par statut
   - Par entreprise / poste

4. **Gérez chaque candidature**
   - Modifiez le statut
   - Ajoutez des notes
   - Relancez le recruteur

#### Comment relancer un recruteur ?

1. **Vérifications automatiques**
   - Max 3 relances par candidature
   - Min 7 jours entre chaque relance

2. **Personnalisez votre relance**
   - Message pré-rempli
   - Modifiable à votre convenance

3. **Envoyez**
   - La relance est envoyée au recruteur
   - Votre historique est mis à jour

### Pour les Administrateurs

#### Configuration du module

1. **Accédez à la page admin**
   - Menu Admin → "Candidatures Externes"

2. **Consultez les statistiques**
   - Candidatures totales
   - Candidatures aujourd'hui
   - Tokens actifs
   - Vues profils

3. **Configurez les paramètres**
   - Activation/désactivation module
   - % Minimum complétion profil
   - Limites fichiers (taille, types)
   - Limites anti-spam
   - Durée tokens profils publics

4. **Personnalisez les templates email**
   - Template candidature initiale
   - Template relance
   - Variables disponibles documentées

5. **Sauvegardez les modifications**
   - Impact immédiat sur nouveaux accès

#### Gestion et support

**Requêtes courantes candidats:**

**Q: Pourquoi ne puis-je pas accéder au module ?**
R: Votre profil doit être complété à 80% minimum. Vérifiez votre barre de progression.

**Q: Combien de candidatures puis-je envoyer par jour ?**
R: Par défaut 10. Configurable par l'Admin.

**Q: Le recruteur peut-il voir toutes mes informations ?**
R: Oui, via le lien profil public. Le profil affiché respecte les sections autorisées.

**Q: Combien de temps le lien profil reste-t-il actif ?**
R: 90 jours par défaut. Configurable par l'Admin.

**Q: Puis-je relancer autant de fois que je veux ?**
R: Non. Maximum 3 relances, avec 7 jours minimum entre chaque.

**Incidents à monitorer:**

- Échecs envoi emails → Vérifier config SMTP
- Tokens expirés consultés → Augmenter durée si nécessaire
- Dépassements limites → Vérifier abus potentiels
- Erreurs upload → Vérifier limites serveur

---

## 🎯 RÉSULTATS ATTENDUS

### Objectifs à 30 jours

**Adoption:**
- 30% des candidats actifs utilisent le module
- 500+ candidatures externes envoyées
- 80%+ des candidats atteignent 80% complétion profil

**Qualité:**
- Taux succès envoi emails > 95%
- Taux ouverture tokens profils > 60%
- 0 incident sécurité

**Satisfaction:**
- NPS module > 50
- Retours positifs candidats
- 0 plainte recruteurs externes

### Objectifs à 90 jours

**Croissance:**
- 50% des candidats actifs utilisent le module
- 2000+ candidatures externes envoyées
- 100+ recruteurs externes convertis en utilisateurs JobGuinée

**Impact Business:**
- +40% profils candidats complets
- +20% engagement candidats
- +15% inscription recruteurs (attribution module)

**Optimisation:**
- 3+ A/B tests réalisés sur templates email
- Réduction 20% du taux abandon formulaire
- Amélioration UX basée sur feedback

### Objectifs à 6 mois

**Maturité:**
- 70% des candidats actifs utilisent le module
- 5000+ candidatures externes envoyées
- 500+ recruteurs externes convertis

**Excellence:**
- Taux succès candidatures déclarées > 15%
- Taux satisfaction candidats > 90%
- Module = différenciation #1 vs concurrents

**Innovation:**
- Import automatique offres via AI
- Matching IA candidat-offre externe
- Recommandations personnalisées

---

## 🔮 ROADMAP FUTURE

### Q1 2026 - Améliorations Core

**Features:**
- Import bulk offres depuis fichier CSV
- Export historique candidatures PDF
- Notifications push nouvelles offres compatibles
- Intégration calendrier entretiens

**Optimisations:**
- Cache tokens profil publics
- Compression images profil automatique
- Lazy loading sections profil public
- Amélioration parsing automatique offres

### Q2 2026 - IA & Automation

**Features:**
- Génération automatique lettres motivation via IA
- Suggestions amélioration candidatures
- Prédiction taux succès candidature
- Matching automatique offres externes

**Analytics:**
- Dashboard analytics avancé
- Prédictions tendances
- Recommandations personnalisées
- Benchmarking candidats similaires

### Q3 2026 - Intégrations

**Partenariats:**
- Intégration sites emploi partenaires
- API publique import offres
- Widget candidature externe embeddable
- Intégration LinkedIn (import profil)

**Connecteurs:**
- Zapier / Make integration
- Webhooks événements candidatures
- API REST publique documentée
- SDK JavaScript

### Q4 2026 - Internationalisation

**Expansion:**
- Multilingue (français, anglais, arabe)
- Adaptation marchés voisins (Mali, Sénégal)
- Templates email multilingues
- Devise multiple pour salaires

**Conformité:**
- Certifications ISO
- Audit sécurité externe
- Conformité RGPD+ africain
- Assurance données

---

## 📄 FICHIERS TECHNIQUES

### Services créés/utilisés

**Nouveaux services:**
- ✅ `src/services/externalApplicationService.ts` (13.9 KB)
- ✅ `src/services/publicProfileTokenService.ts` (8.3 KB)
- ✅ `src/services/externalJobImportService.ts` (7.2 KB)
- ✅ `src/services/externalApplicationEmailService.ts` (12.4 KB)

**Services réutilisés:**
- ✅ `src/services/candidateDocumentService.ts`
- ✅ `src/services/userProfileService.ts`

### Pages créées

- ✅ `src/pages/ExternalApplication.tsx` (31.40 KB)
- ✅ `src/pages/ExternalApplications.tsx` (16.05 KB)
- ✅ `src/pages/PublicProfile.tsx` (12.19 KB)
- ✅ `src/pages/AdminExternalApplications.tsx` (12.43 KB)

### Composants créés

- ✅ `src/components/candidate/ExternalApplicationCTA.tsx` (4.2 KB)

### Composants réutilisés

- ✅ `src/components/forms/RichTextEditor.tsx`
- ✅ `src/components/candidate/DocumentsHub.tsx`
- ✅ `src/components/common/ConfirmationModal.tsx`

### Migrations créées

- ✅ `supabase/migrations/20251230150915_create_external_applications_system.sql`
- ✅ `supabase/migrations/20251230000000_add_default_email_templates_for_external_applications.sql`

### Tailles build production

```
ExternalApplication.tsx      → 31.40 kB (gzip: 7.89 kB)
ExternalApplications.tsx     → 16.05 kB (gzip: 3.93 kB)
PublicProfile.tsx            → 12.19 kB (gzip: 2.89 kB)
AdminExternalApplications.tsx → 12.43 kB (gzip: 3.16 kB)
```

**Build réussi :** ✅ 32.32s

---

## ✅ CHECKLIST FINALE VALIDATION

### Base de données
- [x] Toutes les tables créées
- [x] RLS activé et configuré sur toutes les tables
- [x] Indexes de performance créés
- [x] Fonctions SQL testées et fonctionnelles
- [x] Configuration par défaut insérée
- [x] Templates email par défaut insérés

### Services Backend
- [x] externalApplicationService.ts complet
- [x] publicProfileTokenService.ts complet
- [x] externalJobImportService.ts complet
- [x] externalApplicationEmailService.ts complet
- [x] Tous les services testés
- [x] Gestion d'erreurs complète

### Pages Frontend
- [x] ExternalApplication.tsx complète (formulaire multi-étapes)
- [x] ExternalApplications.tsx complète (historique)
- [x] PublicProfile.tsx complète (profil public)
- [x] AdminExternalApplications.tsx complète (config admin)
- [x] Toutes les pages responsive
- [x] Tous les états de chargement gérés
- [x] Toutes les erreurs gérées

### Composants
- [x] ExternalApplicationCTA.tsx complet
- [x] Intégration dans CandidateDashboard
- [x] RichTextEditor fonctionnel
- [x] DocumentsHub intégré
- [x] Tous les modals fonctionnels

### Fonctionnalités Core
- [x] Vérification profil ≥ 80%
- [x] Blocage UX si profil < 80%
- [x] Import automatique offres via URL
- [x] Formulaire complet 6 étapes
- [x] Gestion CV (profile/document_center/upload)
- [x] Gestion lettres motivation (new/existing/none)
- [x] Messages personnalisés
- [x] Génération tokens profil public
- [x] Envoi emails candidatures
- [x] Système de relances
- [x] Historique candidatures
- [x] Statistiques

### Sécurité
- [x] RLS complet
- [x] Tokens sécurisés
- [x] Validation entrées
- [x] Protection anti-spam
- [x] Limites quotidiennes
- [x] Logs audits

### Tests & Build
- [x] Build production réussi
- [x] Aucune erreur TypeScript
- [x] Aucune erreur ESLint
- [x] Tous les imports valides
- [x] Toutes les routes fonctionnelles

### Documentation
- [x] Documentation technique complète
- [x] Guide utilisateur candidats
- [x] Guide admin
- [x] Templates email documentés
- [x] Variables documentées
- [x] Workflows documentés

---

## 🎉 CONCLUSION

Le **Module Candidatures Externes JobGuinée** est maintenant **100% COMPLET et PRODUCTION-READY**.

### Points Forts du Module

✅ **Gratuité Conditionnelle** - Service gratuit pour profils qualifiés (≥80%)
✅ **Facilité d'Utilisation** - Formulaire guidé multi-étapes intuitif
✅ **Flexibilité** - Choix dynamique des documents à joindre
✅ **Professionnalisme** - Templates email soignés et personnalisables
✅ **Traçabilité** - Historique complet et suivi détaillé
✅ **Sécurité** - RLS complet, tokens sécurisés, limites anti-spam
✅ **Autonomie Candidats** - Gestion complète de leurs candidatures externes
✅ **Différenciation Stratégique** - Service unique sur le marché guinéen
✅ **Acquisition Recruteurs** - CTA inscription via profils publics
✅ **Fidélisation Candidats** - Service à forte valeur ajoutée

### Impact Business Attendu

**Court terme (30j):**
- +50% profils candidats complets
- 500+ candidatures externes envoyées
- Engagement candidats boosté

**Moyen terme (90j):**
- 2000+ candidatures externes
- 100+ recruteurs convertis
- NPS module > 50

**Long terme (6 mois):**
- 5000+ candidatures externes
- 500+ recruteurs convertis
- Différenciation #1 marché

### Prochaines Étapes

1. ✅ **Déploiement Production** - Le module est prêt
2. 📢 **Communication** - Annonce aux candidats existants
3. 📊 **Monitoring** - Suivi métriques clés
4. 🔄 **Itération** - Amélioration continue basée sur feedback
5. 🚀 **Évolution** - Roadmap Q1-Q4 2026

---

**Version Module:** 1.0.0
**Date de Finalisation:** 30 Décembre 2025
**Statut:** ✅ Production-Ready
**Équipe:** JobGuinée

**🎊 MODULE CANDIDATURES EXTERNES COMPLET ET OPÉRATIONNEL ! 🎊**
