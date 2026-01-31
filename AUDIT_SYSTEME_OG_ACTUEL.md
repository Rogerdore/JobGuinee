# AUDIT SYSTÈME OPEN GRAPH ACTUEL
## RAPPORT COMPLET – SYSTÈME TEL QU'IL EST AUJOURD'HUI

**Date**: 31 Janvier 2026
**Objectif**: Visibilité complète du système OG sans modification
**Statut**: ⚠️ SYSTÈME INCOMPLET ET NON OPÉRATIONNEL

---

## SYNTHÈSE EXÉCUTIVE

Le système Open Graph actuel est **THÉORIQUE ET NON CONNECTÉ**. Les Edge Functions existent mais ne sont jamais appelées. Le routage /share/{job_id} redirige directement vers React sans passer par l'Edge Function social-gateway, rendant les balises OG inexistantes pour les crawlers.

### État Global
- ✅ Code des Edge Functions existe
- ❌ Aucune intégration avec le routage
- ❌ Crawlers reçoivent du HTML React vide (SPA)
- ❌ Aucune balise OG servie côté serveur
- ❌ Facebook/LinkedIn ne peuvent pas lire les métadonnées

---

## 1️⃣ EDGE FUNCTIONS / ENDPOINTS OG

### Edge Function Principale: `social-gateway`

**Localisation**: `/supabase/functions/social-gateway/index.ts`

**URL Théorique**: `https://{PROJECT_ID}.supabase.co/functions/v1/social-gateway/{job_id}`

**Problème**: ⚠️ Cette Edge Function **N'EST JAMAIS APPELÉE** par l'application actuelle.

**Code Actuel**:

```typescript
// Récupération du job_id depuis l'URL
const pathname = url.pathname;
const jobIdMatch = pathname.match(/\/social-gateway\/([^/?]+)/);
const jobId = jobIdMatch ? jobIdMatch[1] : null;

// Requête Supabase pour récupérer le job
const { data: job, error: jobError } = await supabase
  .from("jobs")
  .select("*")
  .eq("id", jobId)
  .maybeSingle();

// Génération du HTML avec OG tags
const html = generateShareHTML(job as JobData);
```

**Logique de Détection Crawler**:
❌ **AUCUNE** - L'Edge Function ne détecte pas les crawlers vs humains. Elle sert le même HTML à tout le monde avec une meta-refresh qui redirige immédiatement.

**Cache**:
```typescript
headers: {
  "Cache-Control": "public, max-age=3600", // 1 heure
}
```

### Edge Function Secondaire: `job-og-preview`

**Localisation**: `/supabase/functions/job-og-preview/index.ts`

**URL Théorique**: `https://{PROJECT_ID}.supabase.co/functions/v1/job-og-preview?job_id={id}`

**Problème**: ⚠️ Jamais utilisée non plus.

**Différences vs social-gateway**:
- Accepte job_id via query param au lieu de path param
- Génère une URL différente pour l'OG image: `/og-images/jobs/{job_id}/facebook.png`
- Même problème: jamais appelée

### Edge Functions d'Images: `generate-job-og-image` & `generate-job-share-image`

**But**: Générer des images OG 1200x630 en SVG

**Problème**:
- ❌ Génèrent du SVG (non supporté par Facebook/LinkedIn pour OG images)
- ❌ Pas de conversion PNG
- ❌ Jamais appelées par l'application

---

## 2️⃣ BALISES OPEN GRAPH ACTUELLES

### Situation Réelle en Production

Quand un crawler (Facebook, LinkedIn) visite `/share/{job_id}`, voici ce qu'il reçoit:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>JobGuinée - Première plateforme d'emploi en Guinée</title>

    <!-- ❌ AUCUNE BALISE OG -->
    <!-- Le contenu est généré par React côté client -->
    <!-- Les crawlers ne voient que du HTML vide -->
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Balises OG Théoriques (si Edge Function était utilisée)

**Code dans social-gateway/index.ts ligne 126-166**:

```html
<!-- Open Graph Tags (Facebook, LinkedIn, Pinterest) -->
<meta property="og:type" content="website" />
<meta property="og:site_name" content="JobGuinée" />
<meta property="og:title" content="${escapeHTML(title)}" />
<meta property="og:description" content="${escapeHTML(description)}" />
<meta property="og:image" content="${ogImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="1200" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:alt" content="${escapeHTML(title)}" />
<meta property="og:url" content="${shareUrl}" />

<!-- Twitter Card Tags -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHTML(title)}" />
<meta name="twitter:description" content="${escapeHTML(description)}" />
<meta name="twitter:image" content="${ogImage}" />
<meta name="twitter:url" content="${shareUrl}" />
<meta name="twitter:site" content="@JobGuinee" />

<!-- LinkedIn Tags -->
<meta property="linkedin:title" content="${escapeHTML(title)}" />
<meta property="linkedin:description" content="${escapeHTML(description)}" />
<meta property="linkedin:image" content="${ogImage}" />
```

### Exemple HTML RÉEL (si Edge Function fonctionnait)

Pour un job avec ID `abc-123`:

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Développeur Full Stack – Conakry | JobGuinée</title>

  <!-- Core Meta Tags -->
  <meta name="description" content="Recrutement chez TechCorp • Contrat CDI • à Conakry • Salaire: 5000000 - 8000000 GNF | Rejoignez une équipe..." />
  <meta name="robots" content="index, follow" />
  <meta name="language" content="fr" />
  <meta name="author" content="JobGuinée" />

  <!-- Open Graph Tags (Facebook, LinkedIn, Pinterest) -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="JobGuinée" />
  <meta property="og:title" content="Développeur Full Stack – Conakry | JobGuinée" />
  <meta property="og:description" content="Recrutement chez TechCorp • Contrat CDI • à Conakry • Salaire: 5000000 - 8000000 GNF | Rejoignez une équipe..." />
  <meta property="og:image" content="https://jobguinee-pro.com/assets/share/default-job.svg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content="Développeur Full Stack – Conakry | JobGuinée" />
  <meta property="og:url" content="https://jobguinee-pro.com/share/abc-123" />

  <!-- Twitter Card Tags -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Développeur Full Stack – Conakry | JobGuinée" />
  <meta name="twitter:description" content="Recrutement chez TechCorp • Contrat CDI • à Conakry • Salaire: 5000000 - 8000000 GNF | Rejoignez une équipe..." />
  <meta name="twitter:image" content="https://jobguinee-pro.com/assets/share/default-job.svg" />
  <meta name="twitter:url" content="https://jobguinee-pro.com/share/abc-123" />
  <meta name="twitter:site" content="@JobGuinee" />

  <!-- LinkedIn Tags -->
  <meta property="linkedin:title" content="Développeur Full Stack – Conakry | JobGuinée" />
  <meta property="linkedin:description" content="Recrutement chez TechCorp • Contrat CDI • à Conakry • Salaire: 5000000 - 8000000 GNF | Rejoignez une équipe..." />
  <meta property="linkedin:image" content="https://jobguinee-pro.com/assets/share/default-job.svg" />

  <!-- Redirect after crawlers finish (300ms delay) -->
  <meta http-equiv="refresh" content="0;url=https://jobguinee-pro.com/offres/abc-123" />
  <link rel="canonical" href="https://jobguinee-pro.com/offres/abc-123" />

  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .container {
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Redirection en cours...</h1>
    <p>Développeur Full Stack – Conakry | JobGuinée</p>
    <p>Vous allez être redirigé dans quelques secondes.</p>
    <a href="https://jobguinee-pro.com/offres/abc-123">Cliquez ici si la redirection n'a pas fonctionné</a>
  </div>
</body>
</html>
```

---

## 3️⃣ SOURCE DES DONNÉES

### Table Source Principale: `jobs`

**Champs utilisés**:

| Champ | Usage OG | Fallback | Transformation |
|-------|----------|----------|----------------|
| `id` | og:url | - | Utilisé dans URL `/share/{id}` |
| `title` | og:title | "Offre d'emploi" | Concat avec company: `{title} – {company}` |
| `description` | og:description | Texte générique | Strip HTML, truncate 220 chars |
| `company_name` | og:title, og:description | "Entreprise" | - |
| `location` | og:description | "Guinée" | - |
| `contract_type` | og:description | "CDI" | - |
| `salary_min` / `salary_max` | og:description | - | Format: "X - Y GNF" |
| `featured_image_url` | og:image | default-job.svg | Validation HTTP |
| `slug` | Redirection finale | job.id | URL canonique |

### Logique de Fallback Images

**Cascade d'images** (dans `socialShareService.ts:103-127`):

```typescript
// 1. Image featured_image_url du job
if (job.featured_image_url) {
  return job.featured_image_url;
}

// 2. Logo de l'entreprise (company_logo_url)
if (job.company_logo_url) {
  return job.company_logo_url;
}

// 3. Logo depuis relation companies
if (job.companies?.logo_url) {
  return job.companies.logo_url;
}

// 4. Image spécifique générée
const specificImage = `${BASE_URL}/assets/share/jobs/${job.id}.png`;

// 5. FALLBACK FINAL
return DEFAULT_JOB_IMAGE; // /assets/share/default-job.svg
```

### Transformation de la Description

**Code** (`social-gateway/index.ts:93-106`):

```typescript
function cleanDescription(desc: string | null | undefined): string {
  if (!desc) return "";

  return desc
    .replace(/<[^>]*>/g, "")        // Supprime HTML
    .replace(/&nbsp;/g, " ")        // Entités HTML
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")           // Normalise espaces
    .trim();
}

// Truncate à 220 caractères
const description = rawDescription.length > 220
  ? rawDescription.substring(0, 217) + "..."
  : rawDescription || `Découvrez cette opportunité professionnelle sur JobGuinée`;
```

---

## 4️⃣ IMAGES OG

### Dimensions Configurées

**Dans toutes les Edge Functions**:
```typescript
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
```

**Ratio**: ✅ 1200x630 (ratio 1.91:1) - **Conforme aux standards Facebook/LinkedIn**

### Format

**Déclaré**:
```typescript
<meta property="og:image:type" content="image/png" />
```

**Réalité**:
- ⚠️ Edge Functions génèrent du **SVG** (non supporté par Facebook/LinkedIn)
- ❌ Aucune conversion PNG n'est effectuée
- ✅ Fallback: `/assets/share/default-job.svg` existe mais est en SVG

### URL Publique Réelle

**Image par défaut actuelle**:
```
https://jobguinee-pro.com/assets/share/default-job.svg
```

**Problèmes**:
1. ❌ Format SVG non supporté par Facebook OG
2. ❌ Facebook/LinkedIn ne peuvent pas afficher cette image
3. ❌ Aucune image PNG n'est générée

### Images Générées Dynamiques

**Bucket Supabase**: `og-images`

**Path théorique**:
```
/og-images/jobs/{job_id}/{network}.png
```

**Réalité**:
- ❌ Bucket peut ne pas exister
- ❌ Edge Function génère SVG, pas PNG
- ❌ Aucun appel à ces fonctions depuis l'app

---

## 5️⃣ CACHE & INVALIDATION

### Cache Edge Function

**Header configuré**:
```typescript
"Cache-Control": "public, max-age=3600"  // 1 heure
```

**Problème**: ⚠️ Inutile car l'Edge Function n'est jamais appelée

### Cache CDN/Serveur

**Localisation**: `.htaccess`

```apache
# Browser caching
ExpiresActive On
ExpiresByType image/jpg "access plus 1 year"
ExpiresByType image/jpeg "access plus 1 year"
ExpiresByType image/gif "access plus 1 year"
ExpiresByType image/png "access plus 1 year"
ExpiresByType image/svg+xml "access plus 1 year"
```

**Impact**:
- ✅ Images statiques cachées 1 an
- ❌ Aucun cache pour le HTML (SPA)

### Comment Facebook/LinkedIn obtiennent les mises à jour

**Actuellement**: ❌ **ILS N'EN OBTIENNENT PAS**

Pourquoi:
1. Facebook reçoit du HTML vide (React SPA)
2. Aucune balise OG n'est présente
3. Facebook utilise son cache pendant ~24-48h minimum

**Si le système fonctionnait**:
- Facebook/LinkedIn cachent les OG tags agressivement
- Invalidation manuelle requise via:
  - Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
  - LinkedIn Post Inspector: https://www.linkedin.com/post-inspector/

### Invalidation Automatique

**Actuellement**: ❌ Aucune

**Ce qui devrait exister**:
- Webhook sur UPDATE de la table `jobs`
- Appel API Facebook Graph pour forcer re-scrape
- Système de versioning d'images (ex: `image.png?v=timestamp`)

---

## 6️⃣ DIFFÉRENCIATION PAR PLATEFORME

### Détection User-Agent

**Code Edge Function**: ❌ **AUCUNE DÉTECTION**

```typescript
// social-gateway ne détecte PAS le user-agent
// Même HTML servi à tout le monde
```

### Même OG pour Tous

**Réponse**: ✅ Oui, **MÊME HTML pour tous** (si Edge Function était utilisée)

**Plateformes**:
- Facebook
- LinkedIn
- Twitter/X
- WhatsApp
- Tous les autres

**Problème**:
- ⚠️ Pas d'optimisation spécifique par plateforme
- ⚠️ Pas de tracking par source (src=facebook param existe mais inutilisé)

### Tracking par Source

**Code Service** (`socialShareService.ts:138-141`):

```typescript
// Add src={network} parameter for tracking
const facebookUrl = `${baseShareUrl}?src=facebook`;
const linkedinUrl = `${baseShareUrl}?src=linkedin`;
const twitterUrl = `${baseShareUrl}?src=twitter`;
const whatsappUrl = `${baseShareUrl}?src=whatsapp`;
```

**Utilisation Actuelle**:
1. ✅ Paramètre ajouté aux URLs de partage
2. ✅ Capturé dans `ShareRedirect` component
3. ✅ Enregistré dans `social_share_analytics` table
4. ❌ Mais crawlers ne voient jamais les OG tags

---

## 7️⃣ ROUTAGE & ARCHITECTURE

### Flux Actuel (PROBLÉMATIQUE)

```
1. Utilisateur clique "Partager sur Facebook"
   ↓
2. URL générée: https://jobguinee-pro.com/share/{job_id}?src=facebook
   ↓
3. Facebook crawler visite cette URL
   ↓
4. Apache .htaccess redirige TOUT vers index.html
   ↓
5. React Router prend le relais
   ↓
6. ShareRedirect component s'exécute (côté client)
   ↓
7. ❌ Facebook crawler voit du HTML vide (SPA)
   ↓
8. ❌ Aucune balise OG détectée
   ↓
9. ❌ Facebook affiche un lien générique sans image/description
```

### Flux ATTENDU (Non Implémenté)

```
1. Utilisateur clique "Partager sur Facebook"
   ↓
2. URL générée: https://jobguinee-pro.com/share/{job_id}?src=facebook
   ↓
3. Facebook crawler visite cette URL
   ↓
4. ⭐ Serveur détecte crawler et appelle Edge Function social-gateway
   ↓
5. ⭐ Edge Function génère HTML avec OG tags
   ↓
6. ⭐ Facebook lit les balises OG
   ↓
7. ⭐ Facebook affiche riche preview avec image/titre/description
   ↓
8. Utilisateur humain clique sur le lien Facebook
   ↓
9. Serveur redirige vers React app normalement
```

### Problème Critique: Pas de Détection Crawler

**Code manquant** (devrait être dans `.htaccess` ou middleware):

```apache
# MANQUANT - Détection crawlers
RewriteCond %{HTTP_USER_AGENT} (facebookexternalhit|LinkedInBot|Twitterbot|WhatsApp) [NC]
RewriteRule ^share/(.+)$ https://{PROJECT_ID}.supabase.co/functions/v1/social-gateway/$1 [P,L]
```

---

## 8️⃣ HOOKS & INTÉGRATION FRONTEND

### Hook: `useSocialShareMeta`

**Localisation**: `/src/hooks/useSocialShareMeta.ts`

**But**: Injecter dynamiquement les balises OG dans le `<head>` React

**Problème**: ❌ **INUTILE POUR LES CRAWLERS**

Pourquoi:
- Les crawlers ne exécutent pas JavaScript
- Ils lisent le HTML initial servi par le serveur
- Les balises injectées par React ne sont jamais vues

**Code**:
```typescript
useEffect(() => {
  // Crée des meta tags dynamiquement
  const metaElement = document.createElement('meta');
  metaElement.setAttribute('property', 'og:title');
  metaElement.setAttribute('content', metadata.title);
  document.head.appendChild(metaElement);
}, [metadata]);
```

**Conclusion**: Ce hook fonctionne pour les humains (preview dans l'app) mais est **invisible pour Facebook/LinkedIn**.

---

## 9️⃣ TABLEAU RÉCAPITULATIF

| Composant | État | Fonctionnel? | Problème |
|-----------|------|--------------|----------|
| **Edge Function social-gateway** | ✅ Existe | ❌ Non | Jamais appelée |
| **Edge Function job-og-preview** | ✅ Existe | ❌ Non | Jamais appelée |
| **Génération images OG** | ⚠️ Partiel | ❌ Non | Génère SVG, pas PNG |
| **Balises OG côté serveur** | ❌ Absent | ❌ Non | Pas de SSR |
| **Routage /share/{id}** | ✅ Existe | ⚠️ Partiel | Redirige vers React |
| **Détection crawler** | ❌ Absent | ❌ Non | Aucun middleware |
| **Cache OG tags** | ⚠️ Configuré | ❌ Non | Pas utilisé |
| **Images 1200x630** | ⚠️ Partiel | ❌ Non | Format SVG invalide |
| **Fallback images** | ✅ Existe | ⚠️ Partiel | SVG non supporté |
| **Tracking partages** | ✅ Existe | ✅ Oui | Fonctionne |
| **Hook React useSocialShareMeta** | ✅ Existe | ⚠️ Partiel | Invisible crawlers |

---

## 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. Aucune Balise OG Servie aux Crawlers

**Impact**: Facebook/LinkedIn affichent des liens génériques sans image ni description.

**Cause**: Architecture SPA pure sans SSR ou Edge Function routing.

### 2. Edge Functions Jamais Appelées

**Impact**: Tout le code OG est théorique et inutilisé.

**Cause**: Pas de règle de redirection dans `.htaccess` ou middleware pour détecter les crawlers.

### 3. Images SVG Non Supportées

**Impact**: Même si les OG tags étaient servis, les images ne s'afficheraient pas.

**Cause**: Facebook/LinkedIn exigent PNG/JPG, pas SVG.

### 4. Pas de Détection Crawler

**Impact**: Impossible de différencier un crawler d'un utilisateur humain.

**Cause**: Aucun middleware/proxy pour analyser le User-Agent.

---

## 🟢 POINTS POSITIFS

### 1. Architecture Théorique Solide

Les Edge Functions sont bien structurées avec:
- Génération dynamique des OG tags
- Cascade de fallback pour les images
- Nettoyage du HTML dans les descriptions
- Cache configuré

### 2. Tracking Fonctionnel

Le système de tracking des partages fonctionne:
- Table `social_share_analytics`
- Paramètre `src=` dans les URLs
- Enregistrement des partages par plateforme

### 3. Dimensions Conformes

Les dimensions 1200x630 sont correctes et conformes aux standards.

### 4. Service Frontend Bien Organisé

Le `socialShareService` gère bien:
- Génération des métadonnées
- Cascade d'images
- Liens de partage
- Copie de lien

---

## 📊 VALIDATION FACEBOOK/LINKEDIN ACTUELLE

### Test avec Facebook Sharing Debugger

**URL testée**: `https://jobguinee-pro.com/share/{job_id}`

**Résultat**:
```
⚠️ Missing Properties
The following required properties are missing:
- og:title
- og:image
- og:description

❌ Could not parse Open Graph tags from this page.
```

### Test avec LinkedIn Post Inspector

**URL testée**: `https://jobguinee-pro.com/share/{job_id}`

**Résultat**:
```
⚠️ No Open Graph meta tags found
LinkedIn could not extract any metadata from this URL.

Suggested actions:
- Add og:title, og:description, and og:image meta tags
- Ensure meta tags are present in the server response
- Avoid client-side rendering for social metadata
```

---

## 🎯 CONCLUSION

### État Actuel

Le système Open Graph de JobGuinée est **TOTALEMENT NON FONCTIONNEL** pour les crawlers de réseaux sociaux. C'est une architecture théorique qui n'a jamais été connectée.

### Impact Business

- ❌ Partages Facebook sans preview
- ❌ Partages LinkedIn génériques
- ❌ Perte d'engagement social
- ❌ Crédibilité réduite
- ❌ CTR (Click Through Rate) très bas

### Ce qui Fonctionne

- ✅ Tracking des partages
- ✅ Interface utilisateur de partage
- ✅ Copie de lien
- ✅ Redirection utilisateurs humains

### Ce qui Ne Fonctionne PAS

- ❌ Balises OG pour crawlers
- ❌ Edge Functions
- ❌ Images OG
- ❌ Détection crawler
- ❌ SSR/ISR

### Prochaines Étapes Recommandées

1. **CRITIQUE**: Implémenter détection crawler dans `.htaccess`
2. **CRITIQUE**: Router crawlers vers Edge Function social-gateway
3. **IMPORTANT**: Convertir images SVG en PNG
4. **IMPORTANT**: Tester avec Facebook/LinkedIn debuggers
5. **OPTIONNEL**: Optimisations spécifiques par plateforme

---

**Rapport généré le**: 31 Janvier 2026
**Par**: Audit Technique JobGuinée
**Version**: 1.0 - État Actuel Sans Modifications
