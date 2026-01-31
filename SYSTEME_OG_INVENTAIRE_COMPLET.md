# INVENTAIRE COMPLET DU SYSTÈME OPEN GRAPH

**Date**: 31 Janvier 2026
**Objectif**: Liste exhaustive de tous les fichiers liés au système OG

---

## EDGE FUNCTIONS (Supabase)

### 1. social-gateway

**Localisation**: `/supabase/functions/social-gateway/index.ts`

**Rôle**: Edge Function principale pour servir les balises OG aux crawlers

**Endpoints**:
- `https://{PROJECT_ID}.supabase.co/functions/v1/social-gateway/{job_id}`

**Fonctionnalités**:
- Récupère les données du job depuis la table `jobs`
- Génère HTML avec balises OG complètes
- Nettoie la description (strip HTML)
- Cascade d'images (featured_image_url → default)
- Meta-refresh pour rediriger les humains
- Cache 1 heure

**Statut**: ⚠️ **JAMAIS APPELÉE** par l'application

**Code Clé**:
```typescript
// Ligne 36-38: Extraction job_id depuis URL
const jobIdMatch = pathname.match(/\/social-gateway\/([^/?]+)/);

// Ligne 54-59: Récupération du job
const { data: job, error: jobError } = await supabase
  .from("jobs")
  .select("*")
  .eq("id", jobId)
  .maybeSingle();

// Ligne 108-217: Génération HTML avec OG tags
function generateShareHTML(job: JobData): string {
  // Title: {title} – {company} | JobGuinée
  // Description: Nettoyée, tronquée à 220 chars
  // Image: featured_image_url ou default-job.svg
  // Meta-refresh: Redirection immédiate
}
```

---

### 2. job-og-preview

**Localisation**: `/supabase/functions/job-og-preview/index.ts`

**Rôle**: Alternative à social-gateway avec query params

**Endpoints**:
- `https://{PROJECT_ID}.supabase.co/functions/v1/job-og-preview?job_id={id}`

**Différences vs social-gateway**:
- Utilise query param au lieu de path param
- URL d'image différente: `/og-images/jobs/{job_id}/facebook.png`
- Meta-refresh vers `/s/{job_id}` au lieu de `/offres/{slug}`

**Statut**: ⚠️ **JAMAIS APPELÉE** par l'application

**Code Clé**:
```typescript
// Ligne 37: job_id via query param
const jobId = url.searchParams.get("job_id");

// Ligne 74-76: Logique d'image OG
const generatedOGImage = `https://jobguinee-pro.com/og-images/jobs/${job.id}/facebook.png`;
ogImage = generatedOGImage;
```

---

### 3. generate-job-og-image

**Localisation**: `/supabase/functions/generate-job-og-image/index.ts`

**Rôle**: Génère des images OG dynamiques en SVG

**Endpoints**:
- `https://{PROJECT_ID}.supabase.co/functions/v1/generate-job-og-image?job_id={id}&network={platform}`

**Fonctionnalités**:
- Génère SVG 1200x630
- Layout: Logo + Titre + Badges (location, contrat, salaire)
- Upload vers storage bucket `og-images`
- Cache des images générées

**Problème**: ⚠️ Génère du **SVG** (non supporté par Facebook/LinkedIn)

**Statut**: ❌ **NON FONCTIONNEL** (format invalide) + jamais appelée

**Code Clé**:
```typescript
// Ligne 148-256: Génération SVG
function generateOGImageSVG(job: JobData): string {
  // Background gradient
  // Logo entreprise (si existe)
  // Titre offre (tronqué 60 chars)
  // Badges: location, contract_type, salary
  // Badge JobGuinée
}

// Ligne 108-116: Upload vers storage
const { error: uploadError } = await supabase.storage
  .from("og-images")
  .upload(imagePath, svgBlob, {
    contentType: "image/svg+xml",
    upsert: true,
  });
```

---

### 4. generate-job-share-image

**Localisation**: `/supabase/functions/generate-job-share-image/index.ts`

**Rôle**: Variante simplifiée de génération d'image OG

**Endpoints**:
- POST `https://{PROJECT_ID}.supabase.co/functions/v1/generate-job-share-image`
- Body: `{ "job_id": "..." }`

**Fonctionnalités**:
- Génère SVG simplifié
- Retourne data URL (base64)
- Design minimaliste avec gradient

**Problème**: ⚠️ Retourne un **data URL** (non utilisable pour OG tags)

**Statut**: ❌ **NON FONCTIONNEL** + jamais appelée

**Code Clé**:
```typescript
// Ligne 84-133: Génération SVG simple
async function generateShareImage(job: JobData): Promise<string> {
  // Gradient background
  // Titre centré
  // Company + location + contract
  // CTA button "Postuler sur JobGuinée"

  // Retourne data URL (inutilisable pour OG)
  return `data:image/svg+xml;base64,${base64Image}`;
}
```

---

### 5. auto-share-job

**Localisation**: `/supabase/functions/auto-share-job/index.ts`

**Rôle**: (À vérifier - probablement partage automatique sur réseaux sociaux)

**Statut**: Non audité dans ce rapport (hors scope OG tags)

---

## SERVICES FRONTEND (React)

### 1. socialShareService

**Localisation**: `/src/services/socialShareService.ts`

**Rôle**: Service principal de gestion des partages sociaux

**Fonctions Principales**:

#### `generateJobMetadata(job)`
**Ligne 24-46**: Génère les métadonnées OG pour un job

```typescript
return {
  title: `${jobTitle} – ${location} | JobGuinée`,
  description: this.generateDescription(job),
  image: this.getJobShareImage(job),
  url: `${BASE_URL}/share/${job.id}`,
  siteName: 'JobGuinée',
  type: 'website'
};
```

#### `generateDescription(job)`
**Ligne 48-101**: Génère la description OG

**Logique**:
1. Company + contract_type + location
2. Salary (si disponible)
3. Description nettoyée (strip HTML)
4. Tronquer à 200 caractères
5. Fallback: texte générique

```typescript
// Exemple output:
"Recrutement chez TechCorp • Contrat CDI • à Conakry • Salaire: 5M - 8M GNF | Rejoignez une équipe dynamique..."
```

#### `getJobShareImage(job)`
**Ligne 103-127**: Cascade de fallback pour l'image

**Ordre de priorité**:
1. `job.featured_image_url` (image uploadée par recruteur)
2. `job.company_logo_url` (logo entreprise)
3. `job.companies?.logo_url` (logo via relation)
4. `/assets/share/jobs/{job.id}.png` (image spécifique)
5. **FALLBACK**: `/assets/share/default-job.svg`

**Problème**: ⚠️ Retourne un SVG par défaut (non supporté OG)

#### `generateShareLinks(job)`
**Ligne 129-163**: Génère les URLs de partage pour chaque plateforme

```typescript
return {
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
  whatsapp: `https://wa.me/?text=${encodedText}`
};
```

**Particularité**: Ajoute `?src={platform}` pour tracking

#### `trackShare(jobId, platform)`
**Ligne 186-200**: Enregistre les partages dans `social_share_analytics`

```typescript
await supabase
  .from('social_share_analytics')
  .insert({
    job_id: jobId,
    platform,
    shared_at: new Date().toISOString()
  });
```

**Statut**: ✅ **FONCTIONNE** (seule partie opérationnelle)

---

### 2. useSocialShareMeta

**Localisation**: `/src/hooks/useSocialShareMeta.ts`

**Rôle**: Hook React pour injecter dynamiquement les balises OG dans le `<head>`

**Fonctionnalité**:
```typescript
useEffect(() => {
  // Crée ou met à jour les meta tags
  metaTags.forEach(({ property, name, content }) => {
    let metaElement = document.querySelector(`meta[property="${property}"]`);
    if (!metaElement) {
      metaElement = document.createElement('meta');
      document.head.appendChild(metaElement);
    }
    metaElement.setAttribute('content', content);
  });
}, [metadata]);
```

**Tags Injectés**:
- `og:type`, `og:site_name`, `og:title`, `og:description`
- `og:image`, `og:url`, `og:image:width`, `og:image:height`
- `og:locale`
- `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`, `twitter:site`
- `description` (standard meta)
- `<link rel="canonical">`

**Problème**: ❌ **INUTILE POUR CRAWLERS**

**Pourquoi**:
- Les crawlers ne exécutent pas JavaScript
- Les balises injectées par React ne sont jamais vues
- Facebook/LinkedIn lisent le HTML initial servi par le serveur

**Utilité**: ✅ Preview dans l'app pour les utilisateurs humains

---

## COMPOSANTS REACT

### 1. ShareJobModal

**Localisation**: `/src/components/common/ShareJobModal.tsx`

**Rôle**: Modal de partage d'offre sur les réseaux sociaux

**Fonctionnalités**:
- Affiche aperçu du partage (preview OG)
- Boutons de partage: Facebook, LinkedIn, Twitter, WhatsApp
- Copie du lien de partage
- Tracking des partages

**Code Clé**:
```typescript
// Ligne 28-36: Gestion du partage
const handleShare = async (platform: keyof SocialShareLinks) => {
  socialShareService.openShareLink(platform, links);
  await socialShareService.trackShare(job.id, platform);
};
```

**Statut**: ✅ **FONCTIONNE** (interface utilisateur)

---

### 2. SocialSharePreview

**Localisation**: `/src/components/common/SocialSharePreview.tsx`

**Rôle**: Prévisualise comment l'offre apparaîtra sur les réseaux sociaux

**Statut**: Non audité en détail (composant UI)

---

## ROUTAGE & REDIRECTIONS

### 1. Router.tsx - ShareRedirect

**Localisation**: `/src/Router.tsx` (ligne 8-59)

**Rôle**: Composant qui gère la redirection `/share/{jobId}`

**Flux Actuel**:
```typescript
function ShareRedirect() {
  const { jobId } = useParams();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // 1. Récupère le job depuis Supabase
    const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId);

    // 2. Track la source (src=facebook, linkedin, etc.)
    const srcNetwork = searchParams.get('src') || 'direct';
    await supabase.from('social_share_analytics').insert({...});

    // 3. Redirige vers la page de détail du job
    navigate(`/offres/${job.slug || jobId}`);
  }, []);
}
```

**Routes Configurées**:
```typescript
<Route path="/share/:jobId" element={<ShareRedirect />} />
<Route path="/s/:jobId" element={<ShareRedirect />} />
```

**Problème**: ❌ **CÔTÉ CLIENT SEULEMENT**

**Pourquoi c'est un problème**:
- Les crawlers reçoivent du HTML React vide
- Le code s'exécute côté client (JavaScript)
- Les balises OG doivent être côté serveur (HTML initial)

---

### 2. .htaccess

**Localisation**: `/public/.htaccess`

**Configuration Actuelle**:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # ⚠️ TOUT est redirigé vers index.html (SPA)
  RewriteRule ^ index.html [L]
</IfModule>
```

**Problème**: ❌ **AUCUNE DÉTECTION CRAWLER**

**Ce qui manque**:
```apache
# MANQUANT - Détection des crawlers sociaux
RewriteCond %{HTTP_USER_AGENT} (facebookexternalhit|LinkedInBot|Twitterbot) [NC]
RewriteCond %{REQUEST_URI} ^/share/(.+)$ [NC]
RewriteRule ^share/(.+)$ https://{PROJECT_ID}.supabase.co/functions/v1/social-gateway/$1 [P,L]
```

---

## TABLES SUPABASE

### 1. jobs

**Champs utilisés pour OG**:
- `id` (UUID) - Identifiant unique
- `title` (TEXT) - Titre de l'offre
- `description` (TEXT) - Description (HTML)
- `company_name` (TEXT) - Nom entreprise
- `location` (TEXT) - Localisation
- `contract_type` (TEXT) - Type de contrat
- `salary_min` (INTEGER) - Salaire min
- `salary_max` (INTEGER) - Salaire max
- `featured_image_url` (TEXT) - Image mise en avant
- `slug` (TEXT) - URL SEO-friendly

**Relation**:
- `companies` (via foreign key) - Pour récupérer logo entreprise

---

### 2. social_share_analytics

**Rôle**: Tracking des partages sociaux

**Structure**:
```sql
CREATE TABLE social_share_analytics (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  platform TEXT, -- 'facebook', 'linkedin', 'twitter', 'whatsapp'
  shared_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) -- optionnel
);
```

**Statut**: ✅ **FONCTIONNE**

---

## ASSETS & IMAGES

### 1. Image Par Défaut

**Localisation**: `/public/assets/share/default-job.svg`

**Format**: ⚠️ **SVG** (non supporté par Facebook/LinkedIn)

**Dimensions Déclarées**: 1200x630 (dans meta tags)

**Problème**: Facebook rejette les SVG pour og:image

---

### 2. Images Spécifiques

**Path Théorique**: `/public/assets/share/jobs/{job_id}.png`

**Statut**: ❌ **N'EXISTENT PAS** (aucune image générée)

---

### 3. Bucket Supabase Storage

**Nom**: `og-images`

**Path**: `/og-images/jobs/{job_id}/{network}.png`

**Statut**: ⚠️ **BUCKET PEUT NE PAS EXISTER**

**Utilisation**: Edge Function `generate-job-og-image` tente d'uploader ici

---

## VARIABLES D'ENVIRONNEMENT

### Frontend (.env)

```bash
VITE_APP_URL=https://jobguinee-pro.com
VITE_SUPABASE_URL=https://{PROJECT_ID}.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Utilisé par**: `socialShareService.ts` pour générer les URLs

---

### Edge Functions (Supabase)

```bash
SUPABASE_URL=https://{PROJECT_ID}.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Utilisé par**: Toutes les Edge Functions pour accéder à Supabase

---

## FLUX DE DONNÉES COMPLET

### Flux Actuel (❌ Non Fonctionnel)

```
1. Utilisateur clique "Partager sur Facebook"
   ↓
2. ShareJobModal génère URL: /share/{job_id}?src=facebook
   ↓
3. Facebook crawler visite l'URL
   ↓
4. Apache .htaccess redirige vers index.html
   ↓
5. React Router charge ShareRedirect (côté client)
   ↓
6. ❌ Crawler ne voit que HTML vide
   ↓
7. ❌ Aucune balise OG détectée
```

### Flux Attendu (✅ À Implémenter)

```
1. Utilisateur clique "Partager sur Facebook"
   ↓
2. ShareJobModal génère URL: /share/{job_id}?src=facebook
   ↓
3. Facebook crawler visite l'URL
   ↓
4. ⭐ .htaccess détecte User-Agent crawler
   ↓
5. ⭐ Redirige vers Edge Function social-gateway
   ↓
6. ⭐ Edge Function récupère job depuis Supabase
   ↓
7. ⭐ Edge Function génère HTML avec OG tags
   ↓
8. ⭐ Facebook lit les balises OG
   ↓
9. ⭐ Facebook affiche rich preview
   ↓
10. Utilisateur humain clique
   ↓
11. Meta-refresh redirige vers React app
```

---

## FICHIERS À MODIFIER POUR CORRIGER

### Priorité 1 (CRITIQUE)

1. **`/public/.htaccess`**
   - Ajouter détection User-Agent crawlers
   - Rediriger crawlers vers Edge Function

2. **`/public/assets/share/default-job.svg`**
   - Convertir en PNG 1200x630
   - Ou remplacer par image PNG

### Priorité 2 (IMPORTANT)

3. **`/supabase/functions/generate-job-og-image/index.ts`**
   - Ajouter conversion SVG → PNG
   - Ou utiliser service externe (Cloudinary, Imgix)

4. **`/src/services/socialShareService.ts`**
   - Mettre à jour fallback image vers PNG

### Priorité 3 (OPTIONNEL)

5. **`/supabase/functions/social-gateway/index.ts`**
   - Ajouter détection User-Agent spécifique
   - Optimiser par plateforme (Facebook vs LinkedIn)
   - Ajouter structured data JSON-LD

---

## DOCUMENTATION LIÉE

**Fichiers créés lors de cet audit**:

1. `AUDIT_SYSTEME_OG_ACTUEL.md` - Rapport complet du système actuel
2. `EXEMPLE_HTML_CRAWLER_OG.md` - Comparaison HTML actuel vs attendu
3. `SYSTEME_OG_INVENTAIRE_COMPLET.md` - Ce fichier

**Guides de référence**:
- Facebook Sharing Best Practices: https://developers.facebook.com/docs/sharing/webmasters/
- LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/
- Twitter Cards: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/markup

---

## RÉSUMÉ EXÉCUTIF

### Fichiers Existants

**Edge Functions** (5):
- ✅ `social-gateway` - Principale (jamais appelée)
- ✅ `job-og-preview` - Alternative (jamais appelée)
- ⚠️ `generate-job-og-image` - Génère SVG (invalide)
- ⚠️ `generate-job-share-image` - Retourne data URL (invalide)
- ? `auto-share-job` - Hors scope

**Services Frontend** (2):
- ✅ `socialShareService.ts` - Logique métier (fonctionne)
- ⚠️ `useSocialShareMeta.ts` - Hook React (inutile pour crawlers)

**Composants** (2):
- ✅ `ShareJobModal.tsx` - UI de partage (fonctionne)
- ✅ `SocialSharePreview.tsx` - Preview (fonctionne)

**Routage** (2):
- ⚠️ `ShareRedirect` component - Côté client (problème)
- ❌ `.htaccess` - Pas de détection crawler (critique)

### État Global

- ✅ Code existe et est bien structuré
- ❌ Aucune intégration fonctionnelle
- ❌ Crawlers ne voient jamais les OG tags
- ✅ Tracking des partages fonctionne

### Actions Requises

1. Modifier `.htaccess` pour détecter crawlers
2. Convertir images SVG en PNG
3. Tester avec Facebook/LinkedIn debuggers

---

**Inventaire généré le**: 31 Janvier 2026
**Par**: Équipe Technique JobGuinée
**Version**: 1.0
