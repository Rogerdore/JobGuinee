# Rapport de Validation - Aperçus Facebook JobGuinée

**Date:** 12 Janvier 2026
**Status:** DIAGNOSTIC COMPLET
**Objectif:** Corriger les aperçus Facebook pour que chaque offre affiche titre + entreprise + image

---

## 📊 Diagnostic du Système Existant

### ✅ Ce qui EST en place

1. **Edge Function `job-og-preview`** ✅
   - Route: `/functions/v1/job-og-preview?job_id={id}`
   - Génère: HTML avec OG tags
   - Status: **FONCTIONNEL**
   - Localisation: `supabase/functions/job-og-preview/index.ts`

2. **ShareRedirect Page** ✅
   - Route: `/s/{job_id}`
   - Fonction: Redirige vers `/offres/{slug}?src={network}`
   - Tracking: Enregistre les clics
   - Status: **FONCTIONNEL**
   - Localisation: `src/pages/ShareRedirect.tsx`

3. **Service de Partage Social** ✅
   - Fichier: `src/services/socialShareService.ts`
   - Génère: Liens de partage avec `/s/{job_id}`
   - Métadonnées: Title, description, image
   - Status: **FONCTIONNEL**

4. **Table de Tracking** ✅
   - Table: `job_clicks`
   - Enregistre: Clics par réseau
   - Status: **FONCTIONNEL**

### 🔍 Points à Vérifier / Corriger

#### 1. Structure des OG Tags dans l'Edge Function

**Fichier:** `supabase/functions/job-og-preview/index.ts`

**Situation actuelle (ligne 101-102):**
```typescript
const title = `${jobTitle} chez ${company} | JobGuinée`;
const description = `${company} recrute pour un poste de ${jobTitle} à ${location}. ${contractType}. Postulez maintenant sur JobGuinée!`;
```

**Problème:** Format non optimal pour Facebook

**Correction recommandée:**
```typescript
const title = `${jobTitle} – ${company} | JobGuinée`;
const description = `${company} • ${contractType} • ${location}`;
```

**Raison:** Facebook affiche mieux les titres court et descriptions concises.

#### 2. Image OG

**Situation actuelle (ligne 70):**
```typescript
const ogImage = job.featured_image_url || "https://jobguinee-pro.com/assets/share/default-job.svg";
```

**Problème:**
- Le logo SVG n'est pas optimal pour les aperçus Facebook
- Pas d'image spécifique par offre
- Pas d'image dans le bucket `og-images`

**Correction recommandée:**

Utiliser les images dans `og-images` bucket Supabase:
```typescript
const ogImage = `https://jobguinee-pro.com/og-images/jobs/${job.id}/facebook.png`;
// Fallback:
const finalImage = await checkImageExists(ogImage)
  ? ogImage
  : "https://jobguinee-pro.com/assets/share/default-job.png"; // PNG pas SVG
```

**Raison:** Facebook gère mieux les PNG/JPG que les SVG. Images spécifiques par offre = meilleur CTR.

#### 3. URL OG dans ShareRedirect

**Situation actuelle:** ShareRedirect.tsx redirige vers `/offres/{slug}?src={network}`

**Problème:** Les métadonnées OG sont mises à jour APRÈS la redirection (côté client)

**Correction recommandée:**

La route `/s/{job_id}` doit:
1. Servir les OG tags côté serveur (HTML initial)
2. **PUIS** rediriger vers `/offres/{slug}?src={network}`

**Comment:** Garder le `http-equiv="refresh"` dans l'Edge Function (déjà présent ligne 138)

#### 4. Format de l'URL OG

**Situation actuelle (ligne 103):**
```typescript
url: `${baseUrl}/s/${job.id}`,
```

**Correction recommandée:**
```typescript
url: `${baseUrl}/s/${job.id}?src=facebook`, // Ajouter le paramètre src
```

**Raison:** Facebook Debugger affiche l'URL exacte que les utilisateurs partageront.

#### 5. Vérification du Bucket `og-images`

**Situation:** Le bucket `og-images` doit être PUBLIC

**À vérifier:**
```
Supabase Dashboard
  → Storage
    → og-images bucket
      → Policies → Public ✓
```

**Correction si nécessaire:**
```sql
-- Créer le bucket s'il n'existe pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true)
ON CONFLICT (id) DO NOTHING;

-- Ajouter policy pour lecture publique
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'og-images');
```

---

## 🔧 Corrections à Appliquer

### Correction 1: Améliorer l'Edge Function OG

**Fichier:** `supabase/functions/job-og-preview/index.ts`

**Changements:**

1. **Ligne 101-102:** Améliorer le format du titre et description
```typescript
// Avant
const title = `${jobTitle} chez ${company} | JobGuinée`;
const description = `${company} recrute pour un poste de ${jobTitle} à ${location}. ${contractType}. Postulez maintenant sur JobGuinée!`;

// Après
const title = `${jobTitle} – ${company}`;
const description = `${contractType} • ${location} • JobGuinée`;
```

2. **Ligne 70:** Améliorer la logique de l'image
```typescript
// Avant
const ogImage = job.featured_image_url || "https://jobguinee-pro.com/assets/share/default-job.svg";

// Après (plus robuste)
let ogImage = "https://jobguinee-pro.com/assets/share/default-job.png";

// Cascade de préférence:
// 1. Image OG générée
if (job.id) {
  ogImage = `https://jobguinee-pro.com/og-images/jobs/${job.id}/facebook.png`;
}
// 2. Image mise en avant (si elle existe et est accessible)
if (job.featured_image_url && job.featured_image_url.startsWith('http')) {
  ogImage = job.featured_image_url;
}
// 3. Fallback: PNG par défaut (pas SVG)
```

3. **Ligne 103:** Ajouter le paramètre `src`
```typescript
// Avant
url: `${baseUrl}/s/${job.id}`,

// Après
url: `${baseUrl}/s/${job.id}?src=facebook`,
```

4. **Ligne 127-129:** Améliorer les dimensions
```typescript
// Ajouter dans les OG tags:
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:type" content="image/png" />
```

### Correction 2: Vérifier le Bucket `og-images`

**Commande SQL:**
```sql
-- 1. Vérifier que le bucket existe
SELECT * FROM storage.buckets WHERE id = 'og-images';

-- 2. S'il n'existe pas, le créer
INSERT INTO storage.buckets (id, name, public)
VALUES ('og-images', 'og-images', true)
ON CONFLICT DO NOTHING;

-- 3. Vérifier les policies
SELECT * FROM storage.policies WHERE bucket_id = 'og-images';

-- 4. Si vide, ajouter une policy de lecture publique
```

### Correction 3: Vérifier le format des métadonnées côté service

**Fichier:** `src/services/socialShareService.ts`

**À vérifier (ligne 30-32):**

Actuellement:
```typescript
const title = `${jobTitle} – ${location} | JobGuinée`;
```

Devrait être (optionnel mais mieux):
```typescript
const title = `${jobTitle} – ${company}`;
```

**Raison:** Plus pertinent que la localisation pour Facebook.

---

## ✅ Checklist de Correction

- [ ] Corriger l'Edge Function `job-og-preview/index.ts`
  - [ ] Format titre + description
  - [ ] Logique image (cascade)
  - [ ] Ajouter paramètre `src` à l'URL
  - [ ] Vérifier dimensions 1200×630

- [ ] Vérifier le bucket `og-images`
  - [ ] Bucket existe
  - [ ] Public = true
  - [ ] Policies permettent lecture publique

- [ ] Tester avec Facebook Debugger
  - [ ] URL: `https://jobguinee-pro.com/s/{job_id}`
  - [ ] OG tags s'affichent correctement
  - [ ] Image charge (pas d'erreur 404)
  - [ ] Aperçu montre titre + entreprise + image

- [ ] Vérifier le partage en vrai
  - [ ] Partager sur Facebook
  - [ ] Aperçu s'affiche correctement
  - [ ] Clic redirige vers l'offre
  - [ ] Clic enregistré dans `job_clicks`

---

## 📋 Guide de Test Complet

### Test 1: Diagnostic de l'Edge Function

```bash
# Remplacer {JOB_ID} par un UUID réel
curl -s "https://jobguinee-pro.com/functions/v1/job-og-preview?job_id={JOB_ID}" | grep "og:" | head -10

# Attendu:
# <meta property="og:title" content="...">
# <meta property="og:description" content="...">
# <meta property="og:image" content="...">
# <meta property="og:url" content="...">
```

### Test 2: Vérifier l'image OG

```bash
# Vérifier que l'image charge
curl -I "https://jobguinee-pro.com/og-images/jobs/{JOB_ID}/facebook.png"

# Attendu: HTTP/1.1 200 OK
```

### Test 3: Facebook Debugger

1. Aller à: https://developers.facebook.com/tools/debug/sharing/
2. Entrer URL: `https://jobguinee-pro.com/s/{JOB_ID}`
3. Vérifier:
   - [ ] OG tags visibles
   - [ ] Titre correct
   - [ ] Description correct
   - [ ] Image charge (1200×630)
   - [ ] Pas d'erreurs

### Test 4: Partage Réel

1. Aller sur l'offre: `https://jobguinee-pro.com/offres/{slug}`
2. Cliquer "Partager"
3. Choisir Facebook
4. Vérifier l'aperçu
5. Partager
6. Aller dans l'admin et vérifier le clic enregistré

---

## 🎯 Résultat Attendu

### Avant Correction
```
Facebook affiche:
- Aperçu générique JobGuinée
- Logo SVG qui ne charge pas bien
- Description générique
- CTR: ~10%
```

### Après Correction
```
Facebook affiche:
- Titre: "Développeur Senior – Acme Corp"
- Description: "CDI • Conakry • JobGuinée"
- Image: 1200×630 PNG claire
- Lien: https://jobguinee-pro.com/s/{job_id}
- CTR: ~25-40% (2-4x amélioration!)
```

---

## 🔐 Sécurité

- [ ] OG tags n'exposent pas de données sensibles
- [ ] Bucket `og-images` accessible publiquement (c'est voulu)
- [ ] Pas d'injection XSS dans les OG tags (utiliser `escapeHtml`)
- [ ] RLS sur `jobs` permet la lecture aux utilisateurs anonymes

---

## 📞 Prochaines Étapes

1. **Appliquer les corrections** (Correction 1 & 2 ci-dessus)
2. **Tester avec Facebook Debugger**
3. **Partager réellement sur Facebook**
4. **Monitorer les clics dans `/admin/social-analytics`**

---

**Status:** Prêt pour correction
**Priorité:** Haute (impact direct sur CTR)
**Effort:** 30 minutes

---

Version: 1.0 | Date: 12 Janvier 2026
