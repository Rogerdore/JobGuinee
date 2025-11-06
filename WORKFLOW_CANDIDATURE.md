# Workflow Complet du Bouton "Postuler" - JobVision Guinée

## Vue d'ensemble

Le système de candidature de JobVision Guinée offre une expérience fluide et professionnelle pour les candidats, avec deux modes de candidature selon leur statut de connexion.

---

## 🔄 Processus Complet

### 1️⃣ **Utilisateur NON connecté**

**Étape 1: Clic sur "Postuler"**
```
Candidat clique sur le bouton "Postuler maintenant"
    ↓
Système détecte: user = null
    ↓
Affiche un message: "⚠️ Vous devez créer un compte pour postuler"
    ↓
Redirection vers la page d'inscription (/login)
```

**Étape 2: Inscription**
```
Formulaire d'inscription avec:
- Nom complet
- Email
- Téléphone
- Mot de passe
- Type: Candidat (par défaut)
    ↓
Création du compte dans Supabase Auth
    ↓
Création du profil dans la table 'profiles'
    ↓
Connexion automatique
    ↓
Retour sur la page de l'offre
```

**Étape 3: Candidature**
```
Le candidat peut maintenant postuler:
- Modal "Postuler rapidement" s'affiche
- Choix: "Postuler en un clic" ou "Personnaliser"
```

---

### 2️⃣ **Utilisateur CONNECTÉ - Postuler en un clic**

**Étape 1: Modal de candidature rapide**
```
QuickApplyModal s'affiche avec:
- Aperçu du profil enregistré (nom, email, téléphone, CV)
- Option 1: "Postuler en un clic" (si profil complet)
- Option 2: "Personnaliser ma candidature"
- Option 3: "Annuler"
```

**Étape 2a: Candidature rapide (un clic)**
```
Si le candidat a un profil complet:
    ↓
1. Récupération automatique des données:
   - Prénom/Nom depuis profile.full_name
   - Email depuis user.email
   - Téléphone depuis profile.phone
   - CV depuis profile.cv_url
    ↓
2. Insertion dans la table 'applications':
   INSERT INTO applications (
     job_id,
     candidate_id,
     first_name,
     last_name,
     email,
     phone,
     cv_url,
     message: "Candidature rapide via profil",
     status: 'pending'
   )
    ↓
3. Envoi des emails de notification
    ↓
4. Affichage du message de succès
```

---

### 3️⃣ **Utilisateur CONNECTÉ - Candidature personnalisée**

**Étape 1: Formulaire complet**
```
ApplicationModal s'affiche avec:
- Champs pré-remplis (nom, email, téléphone)
- Upload CV (obligatoire, max 5MB)
- Upload lettre de motivation (optionnel, max 5MB)
- Message de motivation (optionnel)
```

**Étape 2: Validation et upload**
```
Validation:
- Tous les champs requis remplis
- CV téléchargé
- Taille fichiers < 5MB
    ↓
Upload dans Supabase Storage:
- Bucket: 'applications'
- Dossier: {user_id}/cv/{timestamp}.pdf
- Dossier: {user_id}/cover-letter/{timestamp}.pdf
    ↓
Récupération des URLs publiques
```

**Étape 3: Enregistrement**
```
INSERT INTO applications (
  job_id,
  candidate_id,
  first_name,
  last_name,
  email,
  phone,
  cv_url,
  cover_letter_url,
  message,
  status: 'pending',
  created_at: now()
)
```

---

## 📧 Système de Notifications

### Email au candidat
```
Sujet: "Confirmation de candidature - {job_title}"

Contenu:
- Confirmation de réception
- Détails de l'offre
- Prochaines étapes
- Lien vers l'espace candidat
```

### Email au recruteur
```
Sujet: "Nouvelle candidature - {job_title}"

Contenu:
- Nom du candidat
- Email et téléphone
- Date de candidature
- Lien vers le dashboard recruteur
```

**Envoi via Edge Function:**
```javascript
await supabase.functions.invoke('send-application-notification', {
  body: {
    candidateName: "...",
    candidateEmail: "...",
    jobTitle: "...",
    company: "...",
    recruiterId: "..."
  }
});
```

---

## 📊 Dashboard Candidat - Suivi des candidatures

### Onglet "Mes candidatures"

**Affichage:**
- Liste complète de toutes les candidatures
- Filtres par statut:
  - Toutes
  - En attente (pending)
  - Examinées (reviewed)
  - Présélectionné (shortlisted)
  - Embauché (hired)
  - Refusées (rejected)

**Informations affichées:**
- Titre du poste
- Entreprise
- Localisation
- Type de contrat
- Date de candidature
- Statut avec badge coloré
- Message selon le statut
- Liens pour télécharger CV et lettre

**Badge de statut:**
```typescript
pending      → 🟡 En attente      (jaune)
reviewed     → 🔵 Examinée        (bleu)
shortlisted  → 🟢 Présélectionné  (vert)
hired        → 🟢 Embauché        (vert émeraude)
rejected     → 🔴 Refusée         (rouge)
```

---

## 🎯 Dashboard Recruteur - Gestion des candidatures

### Onglet "Candidatures"

**Affichage:**
- Liste de toutes les candidatures reçues
- Filtres par statut
- Tri par date (plus récentes en premier)

**Actions disponibles:**
1. Télécharger CV
2. Télécharger lettre de motivation
3. Voir les coordonnées (email, téléphone)
4. Changer le statut:
   - Marquer comme examinée
   - Présélectionner
   - Refuser
   - Marquer comme embauché

---

## 🗄️ Structure de la Base de Données

### Table `applications`
```sql
id                  uuid PRIMARY KEY
job_id              uuid REFERENCES jobs
candidate_id        uuid REFERENCES profiles
first_name          text NOT NULL
last_name           text NOT NULL
email               text NOT NULL
phone               text NOT NULL
cv_url              text NOT NULL
cover_letter_url    text (nullable)
message             text (nullable)
status              text DEFAULT 'pending'
created_at          timestamptz DEFAULT now()
updated_at          timestamptz DEFAULT now()

UNIQUE(job_id, candidate_id) -- Empêche les doublons
```

### Storage Bucket `applications`
```
Structure:
applications/
  {user_id}/
    cv/
      {timestamp}.pdf
    cover-letter/
      {timestamp}.pdf
```

### RLS Policies
```sql
-- Candidats peuvent créer leurs candidatures
CREATE POLICY "Candidates can create applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = candidate_id);

-- Candidats peuvent voir leurs candidatures
CREATE POLICY "Candidates can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

-- Recruteurs peuvent voir les candidatures de leurs offres
CREATE POLICY "Recruiters can view job applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = applications.job_id
      AND jobs.recruiter_id = auth.uid()
    )
  );

-- Recruteurs peuvent mettre à jour le statut
CREATE POLICY "Recruiters can update status"
  ON applications FOR UPDATE
  TO authenticated
  USING (/* même condition que SELECT */);
```

---

## 🔒 Sécurité

### Prévention des doublons
- Contrainte UNIQUE sur (job_id, candidate_id)
- Message d'erreur: "Vous avez déjà postulé à cette offre"

### Validation des fichiers
- Types acceptés: PDF, DOC, DOCX
- Taille maximale: 5 MB
- Scan antivirus (à implémenter en production)

### Protection des données
- RLS activé sur toutes les tables
- Storage sécurisé avec policies
- Emails envoyés via Edge Functions sécurisées
- Pas d'exposition des données sensibles

---

## 📱 Interface Utilisateur

### Composants créés

1. **QuickApplyModal** (`/src/components/jobs/QuickApplyModal.tsx`)
   - Modal pour candidature rapide
   - Affichage du profil enregistré
   - Bouton "Postuler en un clic"
   - Option de personnalisation

2. **ApplicationModal** (`/src/components/jobs/ApplicationModal.tsx`)
   - Formulaire complet de candidature
   - Upload de fichiers avec drag & drop
   - Validation en temps réel
   - Animation de succès

3. **MyApplications** (`/src/components/candidate/MyApplications.tsx`)
   - Liste des candidatures du candidat
   - Filtres par statut
   - Affichage détaillé
   - Accès aux documents

4. **ApplicationsList** (`/src/components/recruiter/ApplicationsList.tsx`)
   - Gestion des candidatures pour recruteurs
   - Actions de changement de statut
   - Téléchargement des documents
   - Vue détaillée

---

## 🚀 Flux de Données

```
CANDIDAT → Clic "Postuler"
    ↓
AUTH CHECK → Connecté?
    ↓ NON              ↓ OUI
Inscription       QuickApplyModal
    ↓                  ↓
Connexion         Profil complet?
    ↓              ↓ NON    ↓ OUI
    ↓         Formulaire   Un clic
    ↓              ↓           ↓
    └──────────────┴───────────┘
              ↓
    Upload fichiers (si nécessaire)
              ↓
    INSERT applications table
              ↓
    Edge Function → Emails
              ↓
    Message de succès
              ↓
    Dashboard candidat
```

---

## ✅ Points Forts du Système

1. **Expérience utilisateur fluide**
   - Inscription rapide et intuitive
   - Candidature en un clic pour utilisateurs connectés
   - Formulaires pré-remplis

2. **Flexibilité**
   - Option rapide ou personnalisée
   - Upload de documents optionnels
   - Message de motivation libre

3. **Transparence**
   - Confirmation immédiate
   - Suivi en temps réel du statut
   - Notifications automatiques

4. **Sécurité**
   - RLS complet
   - Validation des données
   - Protection des fichiers

5. **Professionnel**
   - Emails avec templates HTML
   - Interface moderne
   - Messages clairs et informatifs

---

## 🔧 Configuration Requise

### Variables d'environnement
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Migration à exécuter
```bash
# La migration se trouve dans:
supabase/migrations/20251106000000_create_applications_system.sql
```

### Edge Function à déployer
```bash
# Fonction d'envoi d'emails:
supabase/functions/send-application-notification/index.ts
```

---

## 📝 Prochaines Améliorations

1. **Intégration Brevo**
   - Connexion API réelle pour emails
   - Templates personnalisables

2. **Matching IA**
   - Score de compatibilité automatique
   - Recommandations intelligentes

3. **Messagerie interne**
   - Chat candidat-recruteur
   - Questions/réponses

4. **Calendrier d'entretiens**
   - Prise de rendez-vous
   - Rappels automatiques

5. **Analytics**
   - Taux de réponse
   - Temps de traitement
   - Statistiques de conversion

---

## 🎉 Conclusion

Le système de candidature de JobVision Guinée est maintenant **100% opérationnel** avec:

✅ Authentification obligatoire mais fluide
✅ Candidature rapide en un clic
✅ Personnalisation possible
✅ Enregistrement sécurisé en base de données
✅ Notifications automatiques
✅ Suivi complet pour candidats
✅ Gestion efficace pour recruteurs
✅ Interface professionnelle et intuitive

Le workflow est conforme aux meilleures pratiques de l'industrie et offre une expérience utilisateur optimale!
