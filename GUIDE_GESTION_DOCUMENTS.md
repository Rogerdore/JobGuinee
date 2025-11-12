# 📁 Guide de Gestion des Documents - JobGuinée

## 📋 Vue d'Ensemble

Le système de gestion des documents permet aux candidats de stocker, organiser et gérer tous leurs documents professionnels de manière sécurisée et centralisée.

## ✨ Fonctionnalités

### 📊 Types de Documents Supportés

1. **CV (Curriculum Vitae)**
   - Stockez plusieurs versions de votre CV
   - Définissez un CV principal pour les candidatures
   - Format: PDF, DOC, DOCX

2. **Lettres de Motivation**
   - Modèles personnalisés par type de poste
   - Réutilisables pour différentes candidatures

3. **Certificats & Diplômes**
   - Certifications professionnelles
   - Diplômes universitaires
   - Formations continues

4. **Portfolio**
   - Travaux et réalisations
   - Projets personnels ou professionnels

5. **Recommandations**
   - Lettres de recommandation
   - Attestations d'anciens employeurs

6. **Autres Documents**
   - Tout autre document pertinent

### 📝 Formats Acceptés

- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG
- **Limite de taille**: 10 MB par fichier

### 🎯 Fonctionnalités Principales

#### 1. Upload de Documents
- Glisser-déposer ou sélection de fichier
- Nommage personnalisé
- Description optionnelle
- Tags pour organisation
- Définition du type de document
- Marquage du CV principal

#### 2. Organisation
- Recherche par nom de fichier
- Filtrage par type de document
- Tags personnalisés pour catégorisation
- Tri chronologique

#### 3. Gestion
- Téléchargement de documents
- Suppression sécurisée
- Définition du CV principal
- Statistiques d'utilisation

#### 4. Sécurité
- Stockage crypté dans Supabase Storage
- Accès exclusif à vos documents
- Protection RLS (Row Level Security)
- Aucun partage sans autorisation

## 🚀 Comment Utiliser

### Accès au Gestionnaire

1. Connectez-vous à votre compte candidat
2. Accédez au Dashboard
3. Cliquez sur l'onglet "**Documents**"

### Ajouter un Document

1. **Cliquez sur "Ajouter un document"**
2. **Sélectionnez votre fichier**
   - Cliquez dans la zone de dépôt
   - Ou glissez-déposez votre fichier
3. **Remplissez les informations:**
   - Nom du document (requis)
   - Type de document (requis)
   - Description (optionnelle)
   - Tags (optionnels)
4. **Pour un CV:**
   - Cochez "Définir comme CV principal" si nécessaire
5. **Cliquez sur "Télécharger le document"**

### Gérer les Documents

#### Télécharger un Document
- Cliquez sur le bouton "**Télécharger**" (icône ⬇️)
- Le fichier sera téléchargé sur votre appareil

#### Définir un CV Principal
- Cliquez sur l'icône **étoile** (⭐) sur la carte du CV
- Un seul CV peut être principal à la fois
- Le CV principal est utilisé par défaut pour les candidatures rapides

#### Supprimer un Document
- Cliquez sur l'icône **poubelle** (🗑️)
- Confirmez la suppression
- ⚠️ **Action irréversible**

#### Rechercher un Document
- Utilisez la **barre de recherche** en haut
- Tapez le nom du document ou du fichier
- Filtrez par type avec le **menu déroulant**

## 📊 Tableau de Bord

### Statistiques Affichées

1. **Total Documents**
   - Nombre total de documents stockés

2. **Nombre de CV**
   - CV disponibles

3. **Certificats**
   - Diplômes et certificats combinés

4. **Espace Utilisé**
   - Taille totale en MB/GB

## 🔧 Architecture Technique

### Base de Données

#### Table `candidate_documents`

```sql
CREATE TABLE candidate_documents (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  document_name text NOT NULL,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  is_primary boolean DEFAULT false,
  description text,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Types de Documents:**
- `cv` - Curriculum Vitae
- `cover_letter` - Lettre de motivation
- `certificate` - Certificat
- `diploma` - Diplôme
- `portfolio` - Portfolio
- `recommendation` - Recommandation
- `other` - Autre

### Storage Bucket

**Bucket:** `candidate-documents`

**Structure:**
```
candidate-documents/
  └── {user_id}/
      ├── {timestamp}-{random}.pdf
      ├── {timestamp}-{random}.docx
      └── {timestamp}-{random}.jpg
```

**Policies:**
- Les utilisateurs peuvent uniquement accéder à leur propre dossier
- Upload limité à 10MB par fichier
- Types MIME restreints pour la sécurité

### Fonctions SQL Utiles

#### 1. Obtenir la Taille Totale
```sql
SELECT get_user_documents_size('{user_id}');
```

#### 2. Obtenir les Statistiques
```sql
SELECT * FROM get_user_documents_stats('{user_id}');
```

Retourne:
- `total_documents` - Nombre total
- `total_size` - Taille totale en bytes
- `cv_count` - Nombre de CV
- `certificate_count` - Nombre de certificats/diplômes
- `other_count` - Autres documents

### Triggers

#### 1. CV Principal Unique
Garantit qu'un seul CV peut être principal:
```sql
CREATE TRIGGER ensure_single_primary_cv_trigger
  BEFORE INSERT OR UPDATE ON candidate_documents
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_primary_cv();
```

#### 2. Mise à Jour Automatique
Met à jour `updated_at` automatiquement:
```sql
CREATE TRIGGER update_candidate_documents_updated_at_trigger
  BEFORE UPDATE ON candidate_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_candidate_documents_updated_at();
```

## 🔐 Sécurité

### Row Level Security (RLS)

✅ **Activé sur toutes les tables**

**Policies:**

1. **SELECT**: Les utilisateurs voient uniquement leurs documents
   ```sql
   auth.uid() = user_id
   ```

2. **INSERT**: Les utilisateurs créent uniquement leurs documents
   ```sql
   auth.uid() = user_id
   ```

3. **UPDATE**: Les utilisateurs modifient uniquement leurs documents
   ```sql
   auth.uid() = user_id
   ```

4. **DELETE**: Les utilisateurs suppriment uniquement leurs documents
   ```sql
   auth.uid() = user_id
   ```

### Storage Security

**Policies Storage:**
- Upload: Uniquement dans son propre dossier
- Read: Uniquement ses propres fichiers
- Delete: Uniquement ses propres fichiers

**Structure de Chemin:**
```
{user_id}/{filename}
```

## 💡 Bonnes Pratiques

### Pour les Candidats

1. **Nommage des Documents**
   - Utilisez des noms descriptifs
   - Exemple: "CV_2024_Developpeur" au lieu de "CV1"

2. **Organisation par Tags**
   - Ajoutez des tags pertinents
   - Exemple: ["Tech", "Senior", "2024"]

3. **Versions des CV**
   - Gardez plusieurs versions pour différents postes
   - Un CV générique et des CV spécialisés

4. **Documents à Jour**
   - Mettez régulièrement à jour vos documents
   - Supprimez les versions obsolètes

5. **CV Principal**
   - Définissez votre meilleur CV comme principal
   - Utilisé automatiquement pour candidatures rapides

### Pour les Développeurs

1. **Validation des Fichiers**
   - Vérifiez la taille avant upload
   - Validez le type MIME côté serveur

2. **Gestion des Erreurs**
   - Loggez toutes les erreurs d'upload
   - Informez l'utilisateur en cas d'échec

3. **Nettoyage**
   - Supprimez les fichiers orphelins
   - Nettoyez le storage lors de la suppression BDD

4. **Performance**
   - Utilisez des miniatures pour les images
   - Compressez les PDF si possible

## 📈 Statistiques d'Utilisation

### Métriques Disponibles

```sql
-- Nombre total de documents par type
SELECT
  document_type,
  COUNT(*) as count,
  SUM(file_size) as total_size
FROM candidate_documents
GROUP BY document_type;

-- Utilisateurs les plus actifs
SELECT
  user_id,
  COUNT(*) as document_count,
  SUM(file_size) as total_size
FROM candidate_documents
GROUP BY user_id
ORDER BY document_count DESC
LIMIT 10;

-- Documents récents
SELECT
  document_name,
  document_type,
  created_at
FROM candidate_documents
ORDER BY created_at DESC
LIMIT 20;
```

## 🐛 Dépannage

### Problème: Upload échoue

**Solutions:**
1. Vérifiez la taille du fichier (< 10MB)
2. Vérifiez le format (PDF, DOC, DOCX, JPG, PNG)
3. Vérifiez votre connexion internet
4. Réessayez après quelques secondes

### Problème: Document non visible

**Vérifications:**
1. Le document est-il bien uploadé ? (vérifier BDD)
2. Les policies storage sont-elles correctes ?
3. L'utilisateur est-il authentifié ?
4. Le chemin du fichier correspond-il à l'user_id ?

### Problème: Impossible de supprimer

**Causes possibles:**
1. Permissions insuffisantes
2. Fichier déjà supprimé du storage
3. Erreur de référence BDD

**Solution:**
```sql
-- Nettoyer les entrées orphelines
DELETE FROM candidate_documents
WHERE file_url NOT LIKE '%' || user_id::text || '%';
```

## 🔄 Intégration avec Candidatures

### Utilisation Automatique

Lorsqu'un candidat postule avec la **candidature rapide**:
1. Le système utilise automatiquement le **CV principal**
2. Si aucun CV principal, propose de télécharger un CV
3. Le CV est attaché à la candidature

### Utilisation Manuelle

Dans le formulaire de candidature standard:
1. Le candidat peut sélectionner un document existant
2. Ou télécharger un nouveau document
3. Le document est lié à la candidature

## 📱 Interface Mobile

Le gestionnaire de documents est **responsive**:
- ✅ Affichage adapté sur mobile
- ✅ Upload depuis appareil mobile
- ✅ Prise de photo pour documents
- ✅ Navigation tactile optimisée

## 🚀 Améliorations Futures

### Phase 1 (Actuel)
- ✅ Upload de documents
- ✅ Organisation par type
- ✅ Tags personnalisés
- ✅ CV principal
- ✅ Recherche et filtrage

### Phase 2
- 🔜 Prévisualisation des documents (PDF viewer)
- 🔜 Édition de métadonnées en masse
- 🔜 Dossiers personnalisés
- 🔜 Partage temporaire sécurisé

### Phase 3
- 🔜 Génération de CV automatique à partir du profil
- 🔜 OCR pour extraction de données
- 🔜 Analyse IA de CV
- 🔜 Suggestions d'amélioration

### Phase 4
- 🔜 Templates de CV
- 🔜 Signature électronique
- 🔜 Versioning automatique
- 🔜 Synchronisation cloud externe

## 📞 Support

Pour toute question:
- **Email**: support@jobguinee.com
- **Documentation**: docs.jobguinee.com
- **Chat**: Disponible dans l'application

---

**Version**: 1.0.0
**Date**: 12 Novembre 2025
**Dernière mise à jour**: 12 Novembre 2025
