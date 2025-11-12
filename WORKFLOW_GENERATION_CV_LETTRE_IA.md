# 🚀 Workflow - Génération CV & Lettre IA

## 📋 Description Simple et Claire

Le service Premium IA de création de CV et lettre de motivation permet aux candidats de générer automatiquement des documents professionnels en quelques secondes, en utilisant les informations de leur profil.

---

## 🎯 Workflow Complet (Étape par Étape)

### 1️⃣ Accès au Service

**Chemin:**
```
Dashboard Candidat → Services Premium → "Créer mon CV et ma Lettre avec l'IA"
```

**Actions:**
- Le candidat clique sur le service dans la section Premium
- Redirection vers l'interface de génération

**Composant:** `AICVGenerator.tsx`

---

### 2️⃣ Vérification du Statut Premium

**Automatique et Transparent:**

Le système vérifie automatiquement:
```typescript
// Chargement des crédits disponibles
const { data } = await supabase.rpc('get_user_premium_status', {
  p_user_id: user.id
});

credits = {
  cv: data.credits.cv_generation?.available || 0,
  letter: data.credits.cover_letter_generation?.available || 0
}
```

**Affichage:**
- Badge "Crédits CV: X"
- Badge "Crédits Lettre: Y"
- En haut à droite de l'interface

**Si pas de crédits:**
- Bouton "Générer" désactivé
- Message: "Crédits insuffisants"
- Lien vers achat de crédits

---

### 3️⃣ Chargement des Informations du Profil

**Automatique au Backend:**

Lors de la génération, la fonction SQL récupère:
```sql
SELECT * FROM candidate_profiles WHERE id = p_user_id;
SELECT full_name, email FROM profiles WHERE id = p_user_id;
```

**Données récupérées:**
- ✅ Nom complet
- ✅ Email & téléphone
- ✅ Localisation
- ✅ Compétences (skills)
- ✅ Années d'expérience
- ✅ Niveau d'études
- ✅ Historique professionnel
- ✅ Formations
- ✅ Langues
- ✅ Certifications
- ✅ LinkedIn & Portfolio

**Formulaire pré-rempli:** NON
- Les données sont récupérées directement du profil
- Le candidat n'a besoin de rien remplir à nouveau

---

### 4️⃣ Complément ou Mise à Jour

**Interface de Génération:**

Le candidat peut **personnaliser**:

1. **Style de document** (obligatoire)
   - ⚪ Classique: Sobre et professionnel
   - 🔵 Moderne: Tendance et dynamique (par défaut)
   - 🟣 Créatif: Original et unique

2. **Poste visé** (facultatif pour CV, obligatoire pour lettre)
   - Champ texte libre
   - Ex: "Développeur Full Stack"
   - Ex: "Chef de projet informatique"

3. **Entreprise cible** (uniquement pour lettre, obligatoire)
   - Champ texte libre
   - Ex: "SOTELGUI"
   - Ex: "Orange Guinée"

**Information affichée:**
```
ℹ️ L'IA utilisera les informations de votre profil
   (compétences, expériences, formations) pour générer
   un document professionnel et personnalisé.
```

---

### 5️⃣ Lancement de la Génération IA

**Action:** Clic sur le bouton

**Bouton CV:**
```
🌟 Générer mon CV avec l'IA [1 crédit]
```

**Bouton Lettre:**
```
🌟 Générer ma Lettre avec l'IA [1 crédit]
```

**Traitement Backend:**

#### Pour un CV:
```typescript
// Frontend
const { data } = await supabase.rpc('generate_cv_with_ai', {
  p_user_id: user.id,
  p_style: 'modern',
  p_target_position: 'Développeur Full Stack',
  p_target_job_id: null
});

// Backend (PostgreSQL Function)
1. Vérifier et déduire 1 crédit (use_service_credits)
2. Récupérer profil candidat complet
3. Construire le contenu JSON structuré:
   {
     personalInfo: { fullName, email, phone, location... },
     summary: "Description professionnelle...",
     experience: { years, level, details[] },
     education: { level, details[] },
     skills: [],
     languages: [],
     certifications: []
   }
4. Sauvegarder dans ai_generated_documents
5. Retourner le document généré
```

#### Pour une Lettre:
```typescript
// Frontend
const { data } = await supabase.rpc('generate_cover_letter_with_ai', {
  p_user_id: user.id,
  p_target_position: 'Développeur Full Stack',
  p_target_company: 'SOTELGUI',
  p_target_job_id: null,
  p_style: 'modern'
});

// Backend (PostgreSQL Function)
1. Vérifier et déduire 1 crédit
2. Récupérer profil candidat
3. Générer le texte de la lettre (structure professionnelle)
4. Construire le contenu JSON avec le texte formaté
5. Sauvegarder dans ai_generated_documents
6. Retourner la lettre générée
```

**Durée:** 2-5 secondes

**Indicateur visuel:**
- Spinner animé
- Message: "Génération en cours..."
- Bouton désactivé

---

### 6️⃣ Affichage du Résultat

**Prévisualisation instantanée:**

#### Pour un CV:
```
┌────────────────────────────────┐
│   [Prévisualisation CV]        │
│                                │
│   Jean CAMARA                  │
│   Développeur Full Stack       │
│   jean@email.com • 628123456   │
│   Conakry, Guinée              │
│                                │
│   Profil                       │
│   [Résumé professionnel...]    │
│                                │
│   Compétences                  │
│   [JavaScript] [Python]...     │
│                                │
│   [📥 Télécharger PDF]         │
│   [📥 Télécharger Word]        │
└────────────────────────────────┘
```

#### Pour une Lettre:
```
┌────────────────────────────────┐
│   [Prévisualisation Lettre]    │
│                                │
│   SOTELGUI                     │
│   Objet: Développeur Full Stack│
│                                │
│   Madame, Monsieur,            │
│                                │
│   Je me permets de vous        │
│   adresser ma candidature...   │
│   [Texte complet]              │
│                                │
│   [📥 Télécharger PDF]         │
│   [📥 Télécharger Word]        │
└────────────────────────────────┘
```

**Actions disponibles:**
- ✅ Lire le document complet
- ✅ Télécharger en PDF
- ✅ Télécharger en Word
- ✅ Générer une nouvelle version (consomme 1 crédit)

---

### 7️⃣ Enregistrement Automatique

**Sauvegarde Immédiate:**

Le document est automatiquement enregistré dans:
```sql
TABLE: ai_generated_documents
```

**Données stockées:**
- ID unique du document
- Type (cv ou cover_letter)
- Titre généré automatiquement
- Contenu JSON complet
- Style choisi
- Poste visé
- Entreprise cible (lettre)
- Statut: 'generated'
- Métadonnées de génération
- Compteurs (téléchargements, vues)
- Timestamps

**Titre auto-généré:**
- CV: "Développeur Full Stack - 12/11/2025"
- Lettre: "Lettre de motivation - Développeur - 12/11/2025"

---

### 8️⃣ Notification

**Notification Push (dans l'app):**
```javascript
await supabase.from('notifications').insert({
  user_id: user.id,
  title: 'CV généré avec succès',
  message: 'Votre CV professionnel est prêt à être téléchargé!',
  type: 'success'
});
```

**Affichage:**
- 🔔 Badge notification dans l'en-tête
- Centre de notifications mis à jour
- Message toast (optionnel)

**Email (futur):**
- Sujet: "Votre CV est prêt - JobGuinée"
- Lien vers "Mes Documents IA"

---

## 📁 Section "Mes Documents IA"

**Accès:**
```
Dashboard Candidat → Mes Documents IA
```

**Composant:** `MyAIDocuments.tsx`

### Fonctionnalités

**1. Liste des Documents**
- Tous les CV et lettres générés
- Tri par date (plus récent en premier)
- Filtres: Tous / CV / Lettres

**2. Informations par Document**
- 📄 Type (CV ou Lettre)
- 📌 Titre
- 💼 Poste visé
- 🏢 Entreprise (si lettre)
- 📅 Date de création
- 📥 Nombre de téléchargements
- 🎨 Style (classique, moderne, créatif)

**3. Actions Disponibles**
- 👁️ Prévisualiser
- 📥 Télécharger PDF
- 📥 Télécharger Word
- 🗑️ Supprimer

**4. Aperçu Dynamique**
- Panneau latéral avec aperçu du document sélectionné
- Boutons d'action rapides

---

## 🔄 Workflow Visuel Complet

```
┌──────────────────────────────────────────────────┐
│  1. CANDIDAT CLIQUE SUR "CRÉER CV/LETTRE IA"     │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  2. VÉRIFICATION AUTOMATIQUE DES CRÉDITS         │
│     ✓ Affichage: "Crédits CV: 1" "Crédits: 50"  │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  3. CHARGEMENT AUTO DES DONNÉES DU PROFIL        │
│     (Nom, compétences, expériences, etc.)        │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  4. CANDIDAT PERSONNALISE                        │
│     • Choisit le style (Classique/Moderne/       │
│       Créatif)                                   │
│     • Entre le poste visé (optionnel pour CV)    │
│     • Entre l'entreprise (obligatoire lettre)    │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  5. CLIC SUR "GÉNÉRER AVEC L'IA"                 │
│     → Appel fonction SQL generate_cv_with_ai()   │
│     → Durée: 2-5 secondes                        │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  6. BACKEND: GÉNÉRATION IA                       │
│     a) Déduction de 1 crédit                     │
│     b) Récupération profil complet               │
│     c) Construction du contenu structuré         │
│     d) Sauvegarde dans ai_generated_documents    │
│     e) Retour du document généré                 │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  7. AFFICHAGE PRÉVISUALISATION                   │
│     • Document visible immédiatement             │
│     • Boutons: Télécharger PDF / Word            │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  8. ENREGISTREMENT AUTOMATIQUE                   │
│     ✓ Sauvegardé dans "Mes Documents IA"         │
│     ✓ Accessible à tout moment                   │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  9. NOTIFICATION                                 │
│     🔔 "Votre CV est prêt!"                      │
│     📧 Email (optionnel)                         │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│  10. CANDIDAT TÉLÉCHARGE                         │
│     • PDF pour envoi email                       │
│     • Word pour modification manuelle            │
│     ✓ Compteur téléchargements incrémenté        │
└──────────────────────────────────────────────────┘
```

---

## 💾 Architecture Technique

### Base de Données

**Table: `ai_generated_documents`**
```sql
CREATE TABLE ai_generated_documents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  document_type text CHECK (IN ('cv', 'cover_letter')),
  title text NOT NULL,
  content jsonb NOT NULL,
  formatted_content text,
  style text CHECK (IN ('classic', 'modern', 'creative')),
  target_position text,
  target_company_name text,
  target_job_id uuid REFERENCES jobs(id),

  -- Métadonnées
  generation_params jsonb,
  ai_model_used text DEFAULT 'gpt-4',
  credits_used integer DEFAULT 1,

  -- Statut
  status text CHECK (IN ('draft', 'generated', 'downloaded', 'archived')),
  version integer DEFAULT 1,

  -- Statistiques
  download_count integer DEFAULT 0,
  last_downloaded_at timestamptz,
  view_count integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Fonctions SQL

**1. Générer un CV**
```sql
SELECT generate_cv_with_ai(
  p_user_id := '{user_id}',
  p_style := 'modern',
  p_target_position := 'Développeur Full Stack',
  p_target_job_id := null
);
```

**2. Générer une Lettre**
```sql
SELECT generate_cover_letter_with_ai(
  p_user_id := '{user_id}',
  p_target_position := 'Développeur',
  p_target_company := 'SOTELGUI',
  p_target_job_id := null,
  p_style := 'modern'
);
```

**3. Récupérer Documents**
```sql
SELECT * FROM get_user_ai_documents(
  p_user_id := '{user_id}',
  p_document_type := 'cv',  -- ou 'cover_letter' ou null
  p_limit := 20
);
```

**4. Incrémenter Téléchargement**
```sql
SELECT increment_document_download('{document_id}');
```

### Composants React

**1. AICVGenerator.tsx**
- Interface principale de génération
- Onglets CV / Lettre
- Formulaire de personnalisation
- Prévisualisation en temps réel
- Gestion des crédits

**2. MyAIDocuments.tsx**
- Liste des documents générés
- Filtres (Tous / CV / Lettres)
- Aperçu document
- Actions (télécharger, supprimer)
- Statistiques

---

## 🎨 Interface Utilisateur

### Design

**Couleurs:**
- CV: Bleu (#1e3a8a)
- Lettre: Vert (#059669)
- Premium: Orange (#f97316)

**Styles de Documents:**
- Classique: Gris (#6b7280)
- Moderne: Bleu (#3b82f6)
- Créatif: Violet (#a855f7)

**Icônes:**
- 📄 FileText: CV
- ✉️ Mail: Lettre
- ✨ Sparkles: IA
- 📥 Download: Télécharger
- 👁️ Eye: Prévisualiser

### Responsive

- ✅ Mobile: 1 colonne (formulaire + preview)
- ✅ Tablette: 2 colonnes
- ✅ Desktop: Layout optimisé

---

## 🔐 Sécurité

**Row Level Security (RLS):**
```sql
-- Utilisateurs voient uniquement leurs documents
CREATE POLICY "Users can view own AI documents"
  ON ai_generated_documents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
```

**Validation:**
- ✅ Vérification crédits avant génération
- ✅ Déduction atomique des crédits
- ✅ Isolation complète des données
- ✅ Pas d'accès cross-user

---

## 📊 Statistiques

**Métriques Suivies:**
- Nombre de CV générés
- Nombre de lettres générées
- Taux de téléchargement
- Documents par utilisateur
- Styles préférés

**Requêtes:**
```sql
-- Total documents par type
SELECT
  document_type,
  COUNT(*) as total
FROM ai_generated_documents
GROUP BY document_type;

-- Styles les plus populaires
SELECT
  style,
  COUNT(*) as usage_count
FROM ai_generated_documents
GROUP BY style
ORDER BY usage_count DESC;

-- Utilisateurs actifs
SELECT COUNT(DISTINCT user_id)
FROM ai_generated_documents
WHERE created_at >= now() - interval '30 days';
```

---

## ✅ Résumé

**Processus complet en 10 étapes:**

1. ✅ Accès au service
2. ✅ Vérification crédits (automatique)
3. ✅ Chargement profil (automatique)
4. ✅ Personnalisation (style, poste, entreprise)
5. ✅ Génération IA (2-5 secondes)
6. ✅ Prévisualisation instantanée
7. ✅ Enregistrement automatique
8. ✅ Notification
9. ✅ Téléchargement (PDF/Word)
10. ✅ Accès permanent dans "Mes Documents IA"

**Fluide, automatisé et professionnel!** 🚀

---

**Version:** 1.0.0
**Date:** 12 Novembre 2025
**Status:** ✅ Production Ready
