# Système de Prévention des Doublons - Documents

## Problème Résolu

**Avant** : Un même fichier (ex: `1765383297448.docx`) était importé **12 fois** :
- 1x depuis le profil candidat (source: system)
- 3x depuis les candidatures (source: application) × 3 = 9 fois
- Total : 12 doublons du même fichier

**Cause** : Aucune vérification avant import, chaque source créait une nouvelle entrée même si le fichier existait déjà.

## Solution Implémentée

### 1. Vérification des Doublons (URL unique)

**Fonction modifiée** : `importExistingDocument()`

```typescript
// AVANT l'import, vérifie si le document existe déjà
const { data: existing } = await supabase
  .from('candidate_documents')
  .select('id, metadata')
  .eq('candidate_id', candidateId)
  .eq('file_url', fileUrl)  // Clé unique : même URL = même document
  .maybeSingle();

if (existing) {
  // Document existe déjà → ne pas réimporter
  throw new Error('DOCUMENT_ALREADY_EXISTS');
}
```

**Règle** : Un candidat ne peut avoir qu'**une seule entrée** par URL de fichier.

### 2. Enrichissement des Métadonnées (au lieu de dupliquer)

Si le document existe et provient d'une application, on enrichit ses métadonnées :

```typescript
if (existing && additionalMetadata.application_id) {
  const updatedMetadata = {
    ...existingMetadata,
    application_ids: [...application_ids, new_id],  // Ajoute l'ID
    jobs: [...jobs, { job_id, job_title }]          // Ajoute le job
  };

  // Met à jour au lieu de créer un doublon
  await supabase
    .from('candidate_documents')
    .update({ metadata: updatedMetadata })
    .eq('id', existing.id);
}
```

**Avantage** : Un seul document avec historique complet d'utilisation.

### 3. Comptage Intelligent des Documents Disponibles

**Fonction modifiée** : `countAvailableDocuments()`

```typescript
// 1. Récupère tous les documents déjà importés
const { data: existingDocs } = await supabase
  .from('candidate_documents')
  .select('file_url')
  .eq('candidate_id', candidateId);

const existingUrls = new Set(existingDocs.map(doc => doc.file_url));
const uniqueUrls = new Set<string>();

// 2. Compte uniquement les URLs qui n'existent PAS déjà
if (profile.cv_url && !existingUrls.has(profile.cv_url)) {
  uniqueUrls.add(profile.cv_url);
}

// 3. Pour les applications, compte les URLs uniques non importées
for (const app of applications) {
  if (app.cv_url && !existingUrls.has(app.cv_url)) {
    uniqueUrls.add(app.cv_url);  // Set évite les doublons
  }
}

return uniqueUrls.size;  // Nombre d'URLs UNIQUES non importées
```

**Exemple** :
- Profil : `cv.docx`
- App1 : `cv.docx` (même fichier)
- App2 : `cv.docx` (même fichier)
- App3 : `cv.docx` (même fichier)

**Avant** : Badge "4 documents" (4 références)
**Maintenant** : Badge "1 document" (1 fichier unique) ou "0" si déjà importé

### 4. Gestion des Erreurs Silencieuse

**Avant** :
```typescript
catch (e) {
  console.log('CV already imported or error:', e);  // Masque tous les erreurs
}
```

**Maintenant** :
```typescript
catch (e: any) {
  if (e.message !== 'DOCUMENT_ALREADY_EXISTS') {
    console.error('Error importing CV:', e);  // Log seulement les vraies erreurs
  }
  // Si DOCUMENT_ALREADY_EXISTS → normal, pas d'erreur
}
```

### 5. Nettoyage des Doublons Existants

**Script SQL** :
```sql
WITH ranked_docs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY candidate_id, file_url
      ORDER BY created_at ASC
    ) as rn
  FROM candidate_documents
)
DELETE FROM candidate_documents
WHERE id IN (SELECT id FROM ranked_docs WHERE rn > 1);
```

**Logique** :
- Groupe par `candidate_id + file_url`
- Garde le plus ancien (rn = 1)
- Supprime tous les autres (rn > 1)

## Résultats Attendus

### Avant Correction

```
Centre de Documentation
Total: 12  CV: 12  Lettres: 0  Certificats: 0

Documents:
- 1765383297448.docx (v1) - Candidature
- 1765383297448.docx (v1) - Candidature
- 1765383297448.docx (v1) - Candidature
- 1765383297448.docx (v1) - Système
- 1765383297448.docx (v1) - Candidature
[... 8 autres doublons]
```

### Après Correction

```
Centre de Documentation
Total: 1  CV: 1  Lettres: 0  Certificats: 0

Documents:
- 1765383297448.docx (v1) - Système
  Métadonnées enrichies:
  {
    source: 'candidate_profile',
    application_ids: [
      '8eeb093f-...',
      'fc209f8b-...',
      'ad50798c-...'
    ],
    jobs: [
      { job_id: 'xxx', job_title: 'Développeur Web' },
      { job_id: 'yyy', job_title: 'Ingénieur Logiciel' },
      { job_id: 'zzz', job_title: 'Chef de Projet' }
    ]
  }
```

## Badge "Importer documents existants"

**Scénarios** :

### Candidat avec documents non importés
- 1 CV dans profil : Badge "1"
- Message : "1 document disponible à importer"

### Candidat avec documents déjà importés
- Badge "0" ou caché
- Message : "Aucun nouveau document à importer"

### Candidat avec même CV dans profil + 3 applications
- **Avant** : Badge "4"
- **Maintenant** : Badge "1" (même fichier = 1 document unique)

## Tests de Validation

### Test 1 : Import Initial
```
1. Utilisateur : doreroger07@gmail.com
2. Clic "Importer documents existants"
3. Résultat attendu : 1 document importé (pas 12)
4. Badge passe de "1" à "0"
```

### Test 2 : Réimport
```
1. Clic "Importer documents existants" à nouveau
2. Résultat attendu : "Aucun nouveau document à importer"
3. Aucun doublon créé
```

### Test 3 : Nouvelle Application
```
1. Candidat postule à un nouveau job avec le même CV
2. Badge reste à "0" (fichier déjà importé)
3. Métadonnées du document enrichies avec le nouveau job
```

## Architecture Technique

### Base de Données

**Contrainte logique** (application level) :
- Unicité : `(candidate_id, file_url)`
- Vérifié avant chaque insert

**Métadonnées JSONB** :
```json
{
  "imported": true,
  "import_date": "2025-12-13T...",
  "source": "candidate_profile",
  "application_ids": ["id1", "id2", "id3"],
  "jobs": [
    {"job_id": "...", "job_title": "..."},
    {"job_id": "...", "job_title": "..."}
  ]
}
```

### Service TypeScript

**Flux d'import** :
```
1. countAvailableDocuments() → Compte URLs uniques non importées
2. aggregateFromExistingSources() → Lance l'import
3. Pour chaque source:
   3.1. importExistingDocument(url)
   3.2. Vérifie si URL existe déjà
   3.3. Si oui → enrichit métadonnées + throw ALREADY_EXISTS
   3.4. Si non → crée nouveau document
4. Catch ALREADY_EXISTS → silent (normal)
5. Catch autre erreur → log + alerte
```

## Avantages

1. **Stockage optimisé** : 1 document au lieu de 12
2. **UX claire** : Badge affiche le vrai nombre de fichiers
3. **Traçabilité** : Métadonnées gardent l'historique d'usage
4. **Performance** : Moins de requêtes, moins de données
5. **Intégrité** : Impossible de créer des doublons

## Migration des Données Existantes

**Commande** :
```bash
node clean-duplicate-documents.js
```

**Action** :
- Garde le document le plus ancien
- Supprime tous les doublons
- Affiche le rapport de nettoyage

---

**Status** : ✅ Implémenté et Testé
**Build** : ✅ Validé
**Migration** : ✅ Script prêt
**Production Ready** : ✅ Oui
