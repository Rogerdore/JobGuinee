# Module Candidatures Externes JobGuinée - Documentation Complète

## 📋 Vue d'ensemble

Le module **"Candidatures Externes avec Profil JobGuinée"** permet aux candidats inscrits de postuler à des offres d'emploi externes (hors plateforme JobGuinée) en utilisant leur profil JobGuinée comme dossier de candidature centralisé.

**Date de création**: 2025-12-30
**Version**: 1.0
**Statut**: ✅ Backend complet - Frontend en cours

---

## 🎯 Objectifs stratégiques

### Pour les candidats
- Postuler facilement à des offres externes
- Utiliser leur profil JobGuinée complet
- Gérer tous leurs documents depuis un seul endroit
- Suivre toutes leurs candidatures externes
- Relancer les recruteurs de manière professionnelle

### Pour la plateforme
- Fidélisation forte des candidats (hub central)
- Incitation à compléter le profil (≥80%)
- Différenciation stratégique majeure
- Amélioration continue de la qualité des profils
- Augmentation de l'engagement utilisateur

### Valeur ajoutée unique
- **GRATUIT** pour tous avec profil ≥ 80%
- Profil JobGuinée accessible sans compte recruteur
- Historique complet de toutes les candidatures
- Professionnalisation des candidatures
- Suivi et relances intégrés

---

## 🚀 Principes fondamentaux (non-négociables)

1. ✅ **JobGuinée = Source centrale** du profil candidat
2. ✅ **Profil = Dossier unique** (CV, documents, compétences)
3. ✅ **Lettre de motivation spécifique** par offre (pas dans le profil)
4. ✅ **Aucune interférence** avec candidatures internes
5. ✅ **Réutilisation de l'existant** (profils, documents, emails)
6. ✅ **Aucune duplication** de logique ou table
7. ✅ **GRATUIT** sous condition profil ≥ 80%

---

## 🗄️ Architecture base de données

### Tables créées

#### 1. `external_applications`
Stocke toutes les candidatures à des offres externes.

```sql
CREATE TABLE external_applications (
  id uuid PRIMARY KEY,
  candidate_id uuid REFERENCES profiles(id),

  -- Offre externe
  job_title text NOT NULL,
  company_name text NOT NULL,
  job_url text,
  job_description text,

  -- Recruteur externe
  recruiter_email text NOT NULL,
  recruiter_name text,

  -- Documents
  cv_document_id uuid REFERENCES candidate_documents(id),
  cover_letter_document_id uuid REFERENCES candidate_documents(id),
  additional_document_ids uuid[],
  cv_source text, -- 'profile' | 'document_center' | 'uploaded'

  -- Candidature
  custom_message text,
  public_profile_token uuid,
  status text DEFAULT 'sent',

  -- Envoi email
  sent_at timestamptz,
  email_sent_successfully boolean,
  email_error_message text,

  -- Relances
  last_relance_at timestamptz,
  relance_count integer DEFAULT 0,

  -- Métadonnées
  candidate_notes text,
  imported_from_url boolean DEFAULT false,
  import_method text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Statuts possibles**:
- `sent`: Candidature envoyée
- `in_progress`: En cours d'évaluation
- `relance_sent`: Relance envoyée
- `rejected`: Rejetée
- `accepted`: Acceptée
- `no_response`: Sans réponse
- `cancelled`: Annulée

#### 2. `public_profile_tokens`
Tokens d'accès public sécurisé aux profils.

```sql
CREATE TABLE public_profile_tokens (
  id uuid PRIMARY KEY,
  candidate_id uuid REFERENCES profiles(id),

  -- Token sécurisé
  token text UNIQUE NOT NULL,

  -- Expiration
  expires_at timestamptz NOT NULL,
  is_revoked boolean DEFAULT false,

  -- Tracking
  created_for_application_id uuid,
  view_count integer DEFAULT 0,
  last_viewed_at timestamptz,

  -- Configuration
  allowed_sections text[],
  custom_message text,

  created_at timestamptz,
  updated_at timestamptz
);
```

**Format token**: 43 caractères base64url-safe
**Durée par défaut**: 90 jours
**URL publique**: `https://jobguinee.com/public/cv/{token}`

#### 3. `external_application_documents`
Liaison documents ↔ candidatures externes.

```sql
CREATE TABLE external_application_documents (
  id uuid PRIMARY KEY,
  external_application_id uuid REFERENCES external_applications(id),
  document_id uuid REFERENCES candidate_documents(id),
  document_type text, -- 'cv' | 'cover_letter' | 'certificate' | 'other'
  display_order integer,
  created_at timestamptz
);
```

#### 4. `external_application_relances`
Historique des relances envoyées.

```sql
CREATE TABLE external_application_relances (
  id uuid PRIMARY KEY,
  external_application_id uuid REFERENCES external_applications(id),
  message text NOT NULL,
  sent_at timestamptz,
  email_sent_successfully boolean,
  email_error_message text,
  created_at timestamptz
);
```

#### 5. `external_applications_config`
Configuration Admin du module.

```sql
CREATE TABLE external_applications_config (
  id uuid PRIMARY KEY,

  -- Activation
  module_enabled boolean DEFAULT true,

  -- Règles accès
  min_profile_completion integer DEFAULT 80,

  -- Fichiers
  max_file_size_mb integer DEFAULT 10,
  allowed_file_types text[],

  -- Limites anti-spam
  max_applications_per_day integer DEFAULT 10,
  max_relances_per_application integer DEFAULT 3,
  min_days_between_relances integer DEFAULT 7,

  -- Tokens
  token_validity_days integer DEFAULT 90,

  -- Templates
  application_email_template text,
  relance_email_template text,

  updated_at timestamptz,
  updated_by uuid
);
```

### Fonctions SQL créées

```sql
-- Vérifie l'accès au module
check_external_application_access(p_candidate_id uuid) RETURNS boolean

-- Génère un token public unique
generate_public_profile_token(p_candidate_id uuid, p_application_id uuid) RETURNS text

-- Incrémente les vues d'un token
increment_token_view_count(p_token text) RETURNS void
```

### Sécurité RLS

Toutes les tables ont Row Level Security activé:

**external_applications**:
- Candidats: lecture/écriture de leurs candidatures
- Admins: lecture de toutes

**public_profile_tokens**:
- Candidats: gestion de leurs tokens
- Admins: lecture de tous

**Configuration complète** dans tous les autres services.

---

## 🔧 Services créés

### 1. `externalJobImportService.ts`
Import automatique d'offres via URL.

**Méthodes principales**:
```typescript
importJobFromURL(url: string): Promise<ImportResult>
```

**Extraction**:
- Métadonnées Open Graph (og:title, og:description)
- Balises meta standard
- Parsing heuristique HTML
- Détection email recruteur

**Sources supportées**:
- LinkedIn, Indeed, Glassdoor
- Sites d'emploi génériques
- Sites entreprises

**Fallback**: Saisie manuelle si extraction échoue

### 2. `externalApplicationService.ts`
Gestion complète des candidatures externes.

**Méthodes principales**:
```typescript
// Accès
checkAccess(candidateId): Promise<{ hasAccess, reason, profileCompletion }>
getConfig(): Promise<{ success, data, error }>

// CRUD candidatures
createApplication(candidateId, params): Promise<{ success, data, error }>
getCandidateApplications(candidateId): Promise<{ success, data, error }>
getApplication(applicationId): Promise<{ success, data, error }>
updateApplicationStatus(applicationId, status, notes): Promise<{ success, error }>

// Relances
sendRelance(applicationId, message): Promise<{ success, error }>

// Email
markEmailSent(applicationId, success, errorMessage): Promise<{ success, error }>

// Statistiques
getStatistics(candidateId): Promise<{ total, sent, in_progress, accepted, rejected, no_response }>
```

**Vérifications automatiques**:
- Profil ≥ 80% complété
- Limite quotidienne (10/jour par défaut)
- Délai entre relances (7 jours par défaut)
- Maximum 3 relances par candidature

### 3. `publicProfileTokenService.ts`
Gestion des tokens d'accès public aux profils.

**Méthodes principales**:
```typescript
// Tokens
generateToken(candidateId, applicationId?): Promise<{ success, token, error }>
getCandidateTokens(candidateId): Promise<{ success, data, error }>
revokeToken(tokenId): Promise<{ success, error }>

// Accès public
getProfileByToken(token): Promise<{ success, data, error }>
getPublicProfileURL(token): string

// Admin
cleanupExpiredTokens(): Promise<{ success, deleted, error }>

// Stats
getTokenStatistics(candidateId): Promise<{ total, active, expired, revoked, total_views }>
```

**Sécurité token**:
- 43 caractères aléatoires sécurisés
- Expiration automatique (90 jours)
- Révocation manuelle possible
- Tracking des vues

### 4. `externalApplicationEmailService.ts`
Génération et envoi des emails.

**Méthodes principales**:
```typescript
// Génération
generateApplicationEmail(params): { subject, body }
generateRelanceEmail(params): { subject, body }

// Envoi
sendEmail(params): Promise<{ success, error }>
sendApplicationEmail(applicationId): Promise<{ success, error }>
sendRelanceEmail(applicationId, message): Promise<{ success, error }>
```

**Templates email inclus**:
- Email de candidature initiale
- Email de relance

---

## 📧 Templates email

### Email de candidature

**Objet**: `Candidature – {titre_offre} | {nom_candidat}`

**Corps**:
```
Bonjour {recruiter_name},

Je vous adresse ma candidature pour le poste de {job_title}
au sein de {company_name}.

Cette candidature vous est transmise via la plateforme JobGuinée.

{custom_message optionnel}

Vous trouverez en pièces jointes :
- Mon CV
- Ma lettre de motivation (si jointe)
- D'autres documents pertinents (si joints)

👉 Vous pouvez consulter mon profil professionnel complet,
sans création de compte, via le lien sécurisé ci-dessous :
{public_profile_url}

Cordialement,

{nom_candidat}
{email_candidat}
{telephone_candidat}

---
Envoyé via JobGuinée – Plateforme emploi & RH en Guinée
https://jobguinee.com
```

### Email de relance

**Objet**: `Relance – Candidature {titre_offre} | {nom_candidat}`

**Corps**:
```
Bonjour {recruiter_name},

Je me permets de revenir vers vous concernant ma candidature
pour le poste de {job_title} au sein de {company_name},
transmise le {date_envoi_original}.

{custom_message}

Je reste à votre disposition pour toute information
complémentaire et pour un éventuel entretien.

👉 Mon profil professionnel complet est toujours accessible :
{public_profile_url}

Cordialement,

{nom_candidat}
{email_candidat}

---
Envoyé via JobGuinée
```

---

## 🔐 Sécurité et conformité

### Protection des données
- Tokens sécurisés (base64url-safe, 43 caractères)
- Expiration automatique des tokens
- Révocation manuelle possible
- RLS complet sur toutes les tables
- Journalisation des accès

### Anti-spam
- Limite quotidienne de candidatures (10/jour)
- Délai minimum entre relances (7 jours)
- Maximum de relances par candidature (3)
- Validation email recruteur

### Accès public sécurisé
- Tokens non-devinables
- Expiration après 90 jours
- Pas d'indexation moteurs de recherche (robots.txt, meta noindex)
- Tracking des consultations
- Sections visibles configurables

### Conformité RGPD
- Consentement explicite pour partage profil
- Droit de révocation des tokens
- Historique des partages
- Suppression des données expirées

---

## 🎨 Workflows utilisateur

### Workflow 1: Postuler à une offre externe via URL

```
Dashboard candidat
  ↓
Bouton "Postuler à une offre externe"
  ↓
Vérification accès (profil ≥ 80%)
  ↓
[SI NON] → Message + Redirection complétion profil
[SI OUI] → Formulaire candidature
  ↓
Étape 1: Import offre
  - Coller URL de l'offre
  - Extraction automatique des données
  - [Fallback] Saisie manuelle
  ↓
Étape 2: Vérification/Complétion
  - Titre offre ✓
  - Entreprise ✓
  - Email recruteur ✓
  - Description offre (optionnel)
  ↓
Étape 3: Sélection CV
  [Option A] Utiliser CV du profil
  [Option B] Sélectionner depuis Centre documents
  [Option C] Uploader nouveau CV
  ↓
Étape 4: Lettre de motivation
  [Option A] Créer nouvelle lettre (éditeur riche)
  [Option B] Sélectionner lettre existante
  [Option C] Ne pas joindre
  ↓
Étape 5: Message personnalisé (optionnel)
  ↓
Étape 6: Aperçu candidature
  - Voir email généré
  - Voir documents joints
  - Voir lien profil public
  ↓
Envoi
  ↓
Email envoyé au recruteur + Enregistrement candidature
  ↓
Redirection vers historique
```

### Workflow 2: Consulter historique

```
Dashboard candidat
  ↓
Section "Mes candidatures externes"
  ↓
Liste des candidatures
  ├─ Voir détails
  ├─ Modifier statut
  ├─ Ajouter notes
  ├─ Relancer recruteur
  └─ Voir email envoyé
```

### Workflow 3: Relancer un recruteur

```
Historique → Candidature
  ↓
Bouton "Relancer"
  ↓
Vérifications:
  - Délai minimum respecté? (7 jours)
  - Maximum relances atteint? (3)
  ↓
[SI OK] → Formulaire relance
  - Message personnalisé
  - Aperçu email
  ↓
Envoi relance
  ↓
Mise à jour candidature
  - status = 'relance_sent'
  - relance_count++
  - last_relance_at = now()
```

### Workflow 4: Accès profil public (recruteur externe)

```
Recruteur externe reçoit email
  ↓
Clique sur lien profil:
https://jobguinee.com/public/cv/{token}
  ↓
Validation token:
  - Token existe?
  - Token révoqué?
  - Token expiré?
  ↓
[SI VALIDE] → Affichage profil public
  - Informations personnelles
  - Résumé professionnel
  - Expériences
  - Formations
  - Compétences
  - Langues
  - Certifications
  - Documents téléchargeables
  - Liens (LinkedIn, Portfolio, etc.)
  ↓
Incrémentation compteur de vues
  ↓
[SI INVALIDE] → Page erreur + CTA inscription JobGuinée
```

---

## 📊 Configuration Admin

### Page: `/admin/candidatures-externes`

**Sections**:

#### 1. Activation du module
- Toggle ON/OFF global

#### 2. Règles d'accès
- Seuil profil minimum (%)
- Message personnalisé si bloqué

#### 3. Fichiers et limites
- Taille maximale fichiers (MB)
- Types autorisés (pdf, doc, docx, jpg, png)

#### 4. Anti-spam
- Candidatures max/jour
- Relances max/candidature
- Jours min entre relances

#### 5. Durée tokens
- Validité en jours (défaut: 90)

#### 6. Templates email
- Email candidature
- Email relance
- Variables disponibles
- Prévisualisation

#### 7. Statistiques globales
- Candidatures externes totales
- Candidatures aujourd'hui
- Taux de complétion profil moyen
- Tokens actifs
- Vues profils publics

---

## 📈 Statistiques et métriques

### Par candidat
- Total candidatures externes
- Par statut (sent, in_progress, accepted, rejected, etc.)
- Tokens générés
- Vues profils publics totales
- Taux de réponse

### Globales (Admin)
- Candidatures externes vs internes
- Évolution complétion profils
- Utilisation tokens publics
- Taux de conversion externe → inscription recruteur
- Top entreprises ciblées
- Relances moyennes par candidature

---

## 🚀 Évolutions futures

### Court terme (2-4 semaines)
1. **Interface candidat complète**
   - Formulaire candidature externe
   - Historique avec filtres
   - Dashboard statistiques

2. **Page profil public**
   - Design professionnel
   - Export PDF
   - Partage social

3. **Admin complet**
   - Configuration avancée
   - Statistiques temps réel
   - Modération si nécessaire

### Moyen terme (1-2 mois)
1. **Import avancé**
   - Support plus de sites
   - IA extraction améliorée
   - Parsing PDF offres

2. **Templates personnalisables**
   - Bibliothèque lettres motivation
   - Templates email personnalisés
   - Signatures électroniques

3. **Intégrations**
   - Calendrier candidatures
   - Rappels automatiques
   - Export données (CSV, Excel)

### Long terme (3-6 mois)
1. **IA avancée**
   - Matching candidat ↔ offre externe
   - Suggestions amélioration candidature
   - Prédiction taux de succès

2. **Recruteurs externes**
   - Compte recruteur externe light
   - Accès étendu aux profils
   - Communication intégrée

3. **Marketplace**
   - Services premium candidats
   - Coaching candidature
   - Révision CV/lettres pro

---

## 💡 Cas d'usage réels

### Cas 1: Candidat junior
**Profil**: Jeune diplômé, profil 85% complété
**Besoin**: Postuler à 5 offres vues sur LinkedIn

**Solution**:
1. Copie URLs LinkedIn
2. Import automatique des offres
3. Sélection CV depuis Centre documents
4. Lettres motivation personnalisées par offre
5. Envoi professionnel avec lien profil
6. Suivi centralisé

**Résultat**: Candidatures professionnelles en 10 min/offre

### Cas 2: Candidat expérimenté
**Profil**: 10 ans d'expérience, profil 95% complété
**Besoin**: Cibler entreprises spécifiques

**Solution**:
1. Recherche offres sur sites entreprises
2. Import ou saisie manuelle
3. CV adapté par secteur
4. Lettre motivation rédigée avec IA
5. Relances automatiques après 10 jours
6. Notes privées par candidature

**Résultat**: Organisation professionnelle, aucune candidature oubliée

### Cas 3: Recruteur externe
**Profil**: Reçoit candidature via email
**Besoin**: Évaluer candidat sans compte

**Solution**:
1. Clique lien profil dans email
2. Accès immédiat sans inscription
3. Voit profil complet structuré
4. Télécharge CV et documents
5. Évalue compétences et expériences

**Résultat**: Décision rapide, expérience positive JobGuinée

---

## ✅ Checklist implémentation

### Backend ✅ COMPLET
- [x] Tables créées (5 tables)
- [x] RLS configuré
- [x] Fonctions SQL (3 fonctions)
- [x] Service import offres
- [x] Service candidatures externes
- [x] Service tokens publics
- [x] Service emails
- [x] Build réussi sans erreur

### Frontend ⏳ EN COURS
- [ ] Formulaire candidature externe
- [ ] Page historique candidatures
- [ ] Page profil public
- [ ] Intégration dashboard candidat
- [ ] Admin configuration
- [ ] Tests utilisateur

### Documentation ✅
- [x] Documentation technique complète
- [ ] Guide utilisateur candidat
- [ ] Guide Admin
- [ ] FAQ

---

## 🏆 Impact business attendu

### Candidats
- ✅ Hub central de toutes leurs candidatures
- ✅ Professionnalisation de leurs démarches
- ✅ Gain de temps considérable
- ✅ Meilleure organisation
- ✅ Augmentation taux de réponse

### Plateforme JobGuinée
- ✅ Différenciation unique sur le marché
- ✅ Fidélisation forte (lock-in positif)
- ✅ Amélioration qualité profils (+80%)
- ✅ Nouveau canal acquisition (recruteurs externes)
- ✅ Positionnement premium

### Recruteurs externes
- ✅ Accès facile aux profils qualifiés
- ✅ Pas de création compte obligatoire
- ✅ Expérience positive → inscription future
- ✅ Découverte plateforme JobGuinée

---

**Module Candidatures Externes JobGuinée v1.0**
**Backend Production-Ready ✅**
**Créé le 2025-12-30**
**Documentation complète - Système innovant et différenciant**
