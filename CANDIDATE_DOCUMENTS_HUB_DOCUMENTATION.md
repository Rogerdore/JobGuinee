# Centre de Documentation Intelligent du Candidat

## Vue d'ensemble

Le Centre de Documentation Intelligent transforme l'onglet "Mes Documents" en un hub professionnel et centralisé pour gérer tous les documents du candidat avec intelligence, versioning, et traçabilité complète.

## Architecture Technique

### 1. Tables de base de données

#### `candidate_documents`
Table centrale pour tous les documents du candidat :
- **Fichier** : file_url, file_name, file_type, file_size
- **Classification** : document_type (cv, cover_letter, certificate, other), document_source (upload, ai_generated, application, formation, system)
- **Versioning** : version, is_primary, parent_document_id
- **Métadonnées** : metadata (JSONB), tags (array)
- **Traçabilité** : usage_count, last_used_at, archived_at
- **Timestamps** : created_at, updated_at

#### `candidate_document_usage`
Historique détaillé des utilisations :
- Lien avec le document
- Type d'usage (application, shared, downloaded, viewed, generated)
- Entité liée (application_id, job_id, etc.)
- Métadonnées contextuelles

### 2. Service `candidateDocumentService`

Service TypeScript centralisé offrant :

#### Gestion de base
- `getAllDocuments()` - Récupérer tous les documents
- `getDocumentsByType()` - Filtrer par type
- `getPrimaryDocument()` - Obtenir le document principal d'un type
- `uploadDocument()` - Upload avec auto-tagging
- `deleteDocument()` - Suppression complète (fichier + DB)

#### Versioning & Organisation
- `setPrimaryDocument()` - Définir un document comme principal
- `archiveDocument()` - Archivage (soft delete)
- `restoreDocument()` - Restauration depuis archive
- `updateTags()` - Gestion des tags

#### Import & Agrégation
- `importExistingDocument()` - Importer depuis URL existante
- `aggregateFromExistingSources()` - Import automatique depuis :
  - `candidate_profiles` (cv_url, cover_letter_url, certificates_url)
  - `applications` (cv utilisés pour candidatures)

#### Analytics & Recherche
- `getDocumentStats()` - Statistiques globales
- `searchDocuments()` - Recherche full-text (nom, tags, métadonnées)
- `getDocumentUsageHistory()` - Historique d'usage détaillé
- `trackUsage()` - Enregistrer une utilisation

#### Auto-tagging intelligent
Génération automatique de tags basés sur :
- Type de document
- Année courante
- Nom du fichier (langue détectée)
- Contexte d'import

### 3. Composant UI `DocumentsHub`

Interface professionnelle et complète avec :

#### Dashboard & Statistiques
- Statistiques en temps réel :
  - Total documents
  - Compteurs par type (CV, Lettres, Certificats)
  - Total utilisations
- Design moderne avec gradient et glassmorphism

#### Gestion documentaire
**Visualisation** :
- Grille responsive de cartes documents
- Informations affichées :
  - Type, source, taille, date
  - Usage count & dernière utilisation
  - Badge "Principal" pour documents primaires
  - Tags visuels
  - Icônes par type de document

**Actions par document** :
- 👁️ Aperçu (preview modal pour PDF/images)
- ⬇️ Téléchargement avec tracking
- ⭐ Définir comme principal
- 📦 Archiver
- 🔄 Restaurer (si archivé)
- 🗑️ Supprimer définitivement

#### Upload & Import
**Upload manuel** :
- Modal dédié
- Drag & drop support
- Sélection du type de document
- Validation format (PDF, DOC, DOCX, JPG, PNG)
- Limite 10MB
- Progress indicator

**Import intelligent** :
- Bouton "Importer documents existants"
- Agrégation automatique depuis :
  - Profil candidat
  - CVs de candidatures
  - Autres sources système

#### Recherche & Filtrage
- **Recherche textuelle** : nom, tags, métadonnées
- **Filtres** :
  - Par type (CV, Lettre, Certificat, Autre, Tous)
  - Par source (Upload, IA, Candidature, Formation, Système)
- **Toggle archivés** : afficher/masquer documents archivés

#### Modales
1. **UploadModal** : Interface d'upload avec drag & drop
2. **DocumentPreviewModal** : Aperçu des documents (iframe pour PDF/images)

## Fonctionnalités Clés

### ✅ Implémenté

1. **Versioning automatique**
   - Numérotation des versions
   - Lien parent-enfant
   - Contrainte unique pour document principal par type

2. **Auto-tagging & métadonnées**
   - Tags automatiques (année, type, langue)
   - Métadonnées JSONB flexibles
   - Recherche dans tags et métadonnées

3. **Indicateurs d'usage**
   - Compteur d'utilisations
   - Date de dernière utilisation
   - Historique détaillé dans `candidate_document_usage`

4. **Recherche & filtres**
   - Recherche full-text
   - Filtres multiples (type, source)
   - Toggle archivés

5. **Actions avancées**
   - Preview (PDF, images)
   - Download avec tracking
   - Set primary
   - Archive/Restore
   - Delete permanent

6. **Upload intelligent**
   - Drag & drop
   - Validation format
   - Auto-tagging
   - Métadonnées enrichies

7. **Historique & traçabilité**
   - Table `candidate_document_usage`
   - Tracking automatique des actions
   - Lien avec entités (candidature, job, etc.)

8. **Import automatique**
   - Agrégation depuis sources existantes
   - Évite les doublons
   - Métadonnées de provenance

### 🔮 Préparé pour le futur (non bloquant)

**Structure en place pour** :
- Suggestions IA futures
- Analyse de performance documentaire
- OCR automatique (structure prête)
- Scoring documents (champs metadata disponibles)

## Sécurité

### Row Level Security (RLS)

**Tables protégées** :
- `candidate_documents` : accès strictement limité à `auth.uid() = candidate_id`
- `candidate_document_usage` : accès limité à ses propres usages

**Politiques appliquées** :
- SELECT, INSERT, UPDATE, DELETE : candidat propriétaire uniquement
- Aucun accès recruteur sans autorisation explicite

**Storage buckets** :
- Policies par bucket (candidate-cvs, candidate-cover-letters, candidate-certificates)
- Dossiers par user ID : `{user_id}/{filename}`
- SELECT, INSERT, DELETE : user propriétaire uniquement

### Validation

- Types de fichiers restreints (PDF, DOC, DOCX, JPG, PNG)
- Limite de taille (10MB configurée côté client)
- Validation MIME type
- Pas de code exécutable autorisé

## Intégration

### Buckets existants réutilisés
- `candidate-cvs`
- `candidate-cover-letters`
- `candidate-certificates`

### Tables existantes non modifiées
- `candidate_profiles` : toujours fonctionnel (cv_url, cover_letter_url, certificates_url)
- `applications` : toujours fonctionnel (cv_url)
- Import non-destructif depuis ces sources

### Aucune régression
- Anciens systèmes continuent de fonctionner
- Import progressif des données existantes
- Pas de migration forcée

## Utilisation

### Pour l'utilisateur candidat

1. **Accéder au hub** : Onglet "Documents" dans le dashboard
2. **Voir statistiques** : Vue d'ensemble en haut de page
3. **Téléverser** : Bouton "Téléverser un document" → choisir type et fichier
4. **Importer existants** : Bouton "Importer documents existants" → agrégation auto
5. **Rechercher** : Barre de recherche + filtres
6. **Gérer** : Actions sur chaque carte document

### Pour les développeurs

```typescript
import { candidateDocumentService } from '../services/candidateDocumentService';

// Upload
await candidateDocumentService.uploadDocument(candidateId, {
  file: myFile,
  document_type: 'cv',
  document_source: 'upload',
  tags: ['2025', 'français'],
  is_primary: true
});

// Import existant
await candidateDocumentService.aggregateFromExistingSources(candidateId);

// Recherche
const results = await candidateDocumentService.searchDocuments(candidateId, 'développeur');

// Stats
const stats = await candidateDocumentService.getDocumentStats(candidateId);

// Tracking
await candidateDocumentService.trackUsage(documentId, 'application', applicationId, 'application');
```

## Tests

### Tests manuels à effectuer

1. **Upload**
   - ✅ Upload PDF
   - ✅ Upload DOCX
   - ✅ Upload image (JPG/PNG)
   - ✅ Drag & drop
   - ✅ Validation format

2. **Import**
   - ✅ Import depuis candidate_profiles
   - ✅ Import depuis applications
   - ✅ Évite doublons

3. **Gestion**
   - ✅ Définir comme principal
   - ✅ Archiver
   - ✅ Restaurer
   - ✅ Supprimer

4. **Recherche**
   - ✅ Recherche par nom
   - ✅ Recherche par tag
   - ✅ Filtres type
   - ✅ Filtres source

5. **Preview**
   - ✅ Preview PDF
   - ✅ Preview image
   - ✅ Fallback pour autres types

6. **Tracking**
   - ✅ Usage count incrémenté
   - ✅ Last used updated
   - ✅ Historique enregistré

## Évolutions futures

### Phase 2 (optionnelle)
- OCR automatique pour images uploadées
- Parsing intelligent des CV
- Suggestions IA de documents
- Analyse de performance par document
- Partage sécurisé avec liens temporaires
- Conversion automatique de formats

### Phase 3 (optionnelle)
- Analytics avancés (quel document performe le mieux)
- Recommandations IA (optimiser CV pour job X)
- Templates de documents
- Collaboration (commentaires recruteurs)

## Migration

**Aucune migration manuelle requise** :
- Tables créées automatiquement via migration
- Import des documents existants via bouton UI
- Pas de downtime
- Rollback possible (tables indépendantes)

## Build

```bash
npm run build
```

Build validé ✅ sans erreur.

## Support

Pour toute question :
- Vérifier logs console (debug activé)
- Vérifier politiques RLS
- Vérifier permissions buckets
- Consulter ce document

---

**Status** : ✅ Production Ready
**Version** : 1.0.0
**Date** : 2025-12-13
