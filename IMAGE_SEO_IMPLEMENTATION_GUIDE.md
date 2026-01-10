# 📘 Guide d'Implémentation - Optimisation Images SEO

Ce guide fournit des exemples de code concrets pour chaque technique d'optimisation d'images SEO.

---

## 📋 Table des Matières

1. [Nommage SEO des Fichiers](#1-nommage-seo-des-fichiers)
2. [Compression et Formats Modernes](#2-compression-et-formats-modernes)
3. [Images Responsives avec srcset](#3-images-responsives-avec-srcset)
4. [Lazy Loading](#4-lazy-loading)
5. [Sitemap d'Images](#5-sitemap-dimages)
6. [Schema.org ImageObject](#6-schemaorg-imageobject)
7. [Préchargement (Preload)](#7-préchargement-preload)
8. [Attributs Alt Optimaux](#8-attributs-alt-optimaux)
9. [Picture Element](#9-picture-element)
10. [CDN et Cache](#10-cdn-et-cache)

---

## 1. Nommage SEO des Fichiers

### ❌ Mauvais Exemples
```
image.png
IMG_1234.jpg
photo copy.jpg
new-image-final-v2.png
```

### ✅ Bons Exemples
```tsx
import { ImageOptimizationService } from './services/imageOptimizationService';

// Générer un nom SEO-friendly
const filename = ImageOptimizationService.generateSEOFilename(
  'Recherche emploi candidat',
  'jpg',
  1920,
  ['guinée', 'conakry', 'recrutement']
);
// Result: 'jobguinee-recherche-emploi-candidat-guinée-conakry-recrutement-1920w.jpg'

// Autres exemples
ImageOptimizationService.generateSEOFilename('Logo entreprise', 'svg')
// Result: 'jobguinee-logo-entreprise.svg'

ImageOptimizationService.generateSEOFilename('Offre développeur web', 'webp', 1200)
// Result: 'jobguinee-offre-développeur-web-1200w.webp'
```

### Convention de Nommage Complète

```
[marque]-[type]-[contexte]-[mots-clés]-[dimension].extension

Composants :
- marque: toujours "jobguinee"
- type: hero, logo, profile, job, formation, blog
- contexte: page ou section (recherche, candidat, recruteur)
- mots-clés: termes SEO pertinents (emploi, guinée, conakry)
- dimension: largeur en pixels (320w, 640w, 1920w)
- extension: jpg, png, webp, avif, svg, gif

Exemples complets :
✅ jobguinee-hero-accueil-recherche-emploi-guinee-1920w.webp
✅ jobguinee-logo-plateforme-recrutement.svg
✅ jobguinee-profile-candidat-developpeur-web-600w.jpg
✅ jobguinee-job-offre-ingenieur-conakry-1200w.webp
✅ jobguinee-formation-marketing-digital-guinee-800w.jpg
```

---

## 2. Compression et Formats Modernes

### Script de Conversion Batch (Node.js + Sharp)

```javascript
// scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const widths = [320, 640, 1024, 1920];

  for (const width of widths) {
    // JPEG optimisé
    await sharp(inputPath)
      .resize(width)
      .jpeg({ quality: 85, progressive: true, mozjpeg: true })
      .toFile(path.join(outputDir, `${filename}-${width}w.jpg`));

    // WebP (70-80% plus léger)
    await sharp(inputPath)
      .resize(width)
      .webp({ quality: 85, effort: 6 })
      .toFile(path.join(outputDir, `${filename}-${width}w.webp`));

    // AVIF (encore plus léger)
    await sharp(inputPath)
      .resize(width)
      .avif({ quality: 80, effort: 6 })
      .toFile(path.join(outputDir, `${filename}-${width}w.avif`));
  }

  console.log(`✅ Optimized: ${filename}`);
}

// Utilisation
async function optimizeAllImages() {
  const inputDir = './public/images/originals';
  const outputDir = './public/images/optimized';

  const files = await fs.readdir(inputDir);

  for (const file of files) {
    if (/\.(jpg|jpeg|png)$/i.test(file)) {
      await optimizeImage(
        path.join(inputDir, file),
        outputDir
      );
    }
  }
}

optimizeAllImages();
```

### Compression en Ligne de Commande

```bash
# Installer les outils
npm install -g sharp-cli squoosh-cli

# Convertir en WebP
for file in *.jpg; do
  sharp -i "$file" -o "${file%.jpg}.webp" --webp
done

# Optimiser PNG
for file in *.png; do
  pngquant --quality=65-80 "$file" --output "${file%.png}-optimized.png"
done

# Batch avec Squoosh
npx @squoosh/cli --webp auto *.jpg
```

---

## 3. Images Responsives avec srcset

### Exemple Basique

```tsx
<img
  src="/images/jobguinee-hero-1024w.jpg"
  srcSet="
    /images/jobguinee-hero-320w.jpg 320w,
    /images/jobguinee-hero-640w.jpg 640w,
    /images/jobguinee-hero-1024w.jpg 1024w,
    /images/jobguinee-hero-1920w.jpg 1920w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 80vw,
    (max-width: 1920px) 60vw,
    50vw
  "
  alt="Plateforme emploi Guinée - JobGuinée"
  width={1920}
  height={1080}
  loading="lazy"
/>
```

### Avec le Composant Optimisé

```tsx
import OptimizedImage from '@/components/common/OptimizedImage';

export default function HeroSection() {
  return (
    <OptimizedImage
      src="/images/jobguinee-hero-recherche-emploi.jpg"
      alt="Trouvez votre emploi de rêve en Guinée avec JobGuinée"
      width={1920}
      height={1080}
      priority="high"
      responsive
      modernFormats
      schema
      className="w-full h-auto"
    />
  );
}
```

### Génération Automatique des Sizes

```tsx
import { ImageOptimizationService } from '@/services/imageOptimizationService';

const responsiveSet = ImageOptimizationService.generateResponsiveSizes(
  '/images/jobguinee-hero.jpg',
  [320, 640, 1024, 1920]
);

console.log(responsiveSet);
/*
{
  srcset: '/images/jobguinee-hero-320w.jpg 320w, /images/jobguinee-hero-640w.jpg 640w, ...',
  sizes: '(max-width: 640px) 100vw, ...',
  src: '/images/jobguinee-hero-1024w.jpg',
  webpSrcset: '/images/jobguinee-hero-320w.webp 320w, ...',
  avifSrcset: '/images/jobguinee-hero-320w.avif 320w, ...'
}
*/
```

---

## 4. Lazy Loading

### Méthode 1 : Lazy Loading Natif (Recommandé)

```tsx
// Images au-dessus du fold (visibles immédiatement)
<img
  src="/logo.svg"
  alt="JobGuinée Logo"
  loading="eager"
  fetchpriority="high"
/>

// Images en-dessous du fold
<img
  src="/image.jpg"
  alt="Description"
  loading="lazy"
  fetchpriority="low"
/>
```

### Méthode 2 : Intersection Observer

```tsx
import { useEffect, useRef, useState } from 'react';

function LazyImage({ src, alt, ...props }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Charger 50px avant d'entrer
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={imgRef}
      src={isInView ? src : undefined}
      alt={alt}
      onLoad={() => setIsLoaded(true)}
      className={isLoaded ? 'opacity-100' : 'opacity-0'}
      {...props}
    />
  );
}
```

### Méthode 3 : Avec Placeholder (LQIP - Low Quality Image Placeholder)

```tsx
function ImageWithPlaceholder({ src, alt, placeholder }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative">
      {/* Placeholder blur */}
      {!loaded && (
        <img
          src={placeholder}
          alt=""
          className="absolute inset-0 blur-lg"
          aria-hidden
        />
      )}

      {/* Image principale */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={`transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />
    </div>
  );
}

// Utilisation
<ImageWithPlaceholder
  src="/images/hero-1920w.jpg"
  placeholder="/images/hero-20w.jpg"
  alt="Hero"
/>
```

---

## 5. Sitemap d'Images

### Génération Automatique

```tsx
import { ImageSitemapService } from '@/services/imageSitemapService';

// Générer le sitemap complet
async function generateSitemap() {
  const xml = await ImageSitemapService.generateAndSave();
  console.log('Sitemap généré:', xml);
}

// Ajouter une image dynamiquement
async function addNewJobImage(job) {
  await ImageSitemapService.addImageToSitemap({
    pageUrl: `https://jobguinee.com/jobs/${job.id}`,
    imageUrl: job.featured_image,
    title: `${job.title} - ${job.company_name}`,
    caption: job.description.substring(0, 100),
    geoLocation: job.location,
  });
}

// Obtenir les statistiques
async function getStats() {
  const stats = await ImageSitemapService.getSitemapStats();
  console.log(stats);
  // { totalImages: 250, lastGenerated: '2025-01-10', pagesCovered: 45 }
}
```

### Structure XML du Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://jobguinee.com/jobs/123</loc>
    <image:image>
      <image:loc>https://jobguinee.com/images/job-developpeur-web.jpg</image:loc>
      <image:title>Développeur Web - TechCorp</image:title>
      <image:caption>Offre d'emploi développeur web à Conakry</image:caption>
      <image:geo_location>Conakry, Guinée</image:geo_location>
      <image:license>https://creativecommons.org/licenses/by/4.0/</image:license>
    </image:image>
  </url>
</urlset>
```

### Soumettre à Google Search Console

```bash
# 1. Sauvegarder le sitemap
curl https://jobguinee.com/api/image-sitemap > public/image-sitemap.xml

# 2. Soumettre à Google
# Via Search Console UI ou API:
curl -X POST \
  "https://www.google.com/ping?sitemap=https://jobguinee.com/image-sitemap.xml"
```

---

## 6. Schema.org ImageObject

### Implémentation Basique

```tsx
function JobImage({ job }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": job.image_url,
    "url": job.image_url,
    "name": `${job.title} - ${job.company_name}`,
    "description": job.description,
    "width": {
      "@type": "QuantitativeValue",
      "value": 1200,
      "unitCode": "E37"
    },
    "height": {
      "@type": "QuantitativeValue",
      "value": 630,
      "unitCode": "E37"
    },
    "encodingFormat": "image/jpeg",
    "creator": {
      "@type": "Organization",
      "name": job.company_name
    },
    "copyrightNotice": "© JobGuinée 2025",
    "contentLocation": {
      "@type": "Place",
      "name": job.location
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <img src={job.image_url} alt={`${job.title} - ${job.company_name}`} />
    </>
  );
}
```

### Génération Automatique avec le Service

```tsx
import { ImageOptimizationService } from '@/services/imageOptimizationService';

const metadata = {
  url: 'https://jobguinee.com/images/job-123.jpg',
  alt: 'Développeur Web - TechCorp',
  title: 'Offre emploi développeur web',
  caption: 'Rejoignez notre équipe de développeurs à Conakry',
  width: 1200,
  height: 630,
  format: 'jpg' as const,
  author: 'TechCorp',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  geoLocation: 'Conakry, Guinée'
};

const schema = ImageOptimizationService.generateImageSchema(metadata);

// Injecter dans le <head>
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
/>
```

---

## 7. Préchargement (Preload)

### Images Hero Critiques

```tsx
// Dans le <head> ou via next/head
export default function HomePage() {
  return (
    <>
      <Head>
        {/* Preload hero image (LCP) */}
        <link
          rel="preload"
          as="image"
          href="/images/jobguinee-hero-1920w.webp"
          type="image/webp"
          fetchpriority="high"
        />

        {/* Preload logo */}
        <link
          rel="preload"
          as="image"
          href="/logo_jobguinee.svg"
          type="image/svg+xml"
        />
      </Head>

      <img
        src="/images/jobguinee-hero-1920w.webp"
        alt="Hero"
        fetchpriority="high"
        loading="eager"
      />
    </>
  );
}
```

### Preload Responsive

```tsx
<Head>
  <link
    rel="preload"
    as="image"
    href="/images/hero-1920w.webp"
    imagesrcset="
      /images/hero-320w.webp 320w,
      /images/hero-640w.webp 640w,
      /images/hero-1024w.webp 1024w,
      /images/hero-1920w.webp 1920w
    "
    imagesizes="100vw"
    fetchpriority="high"
  />
</Head>
```

---

## 8. Attributs Alt Optimaux

### ❌ Mauvais Exemples
```tsx
<img src="image.jpg" alt="Image" />
<img src="logo.png" alt="Logo" />
<img src="photo.jpg" alt="" /> {/* Pas d'alt du tout */}
<img src="job.jpg" alt="job posting developer position company tech" /> {/* Bourrage de mots-clés */}
```

### ✅ Bons Exemples

```tsx
// Logo
<img
  src="/logo.svg"
  alt="JobGuinée - Plateforme n°1 emploi et recrutement en Guinée"
/>

// Offre d'emploi
<img
  src="/job-123.jpg"
  alt="Développeur Web Full-Stack - TechCorp Conakry | Emploi IT Guinée"
/>

// Profil candidat
<img
  src="/profile-456.jpg"
  alt="Jean Dupont - Ingénieur Logiciel senior 10 ans exp. | Profil candidat Guinée"
/>

// Image décorative (pas de valeur SEO)
<img
  src="/decoration.svg"
  alt=""
  role="presentation"
  aria-hidden="true"
/>
```

### Génération Automatique

```tsx
import { ImageOptimizationService } from '@/services/imageOptimizationService';

const alt = ImageOptimizationService.generateSEOAlt(
  'Développeur Web',
  'TechCorp Conakry',
  ['emploi guinée', 'recrutement IT', 'développeur']
);
// Result: "Développeur Web - TechCorp Conakry | emploi guinée | recrutement IT | développeur"
```

---

## 9. Picture Element

### Art Direction (Images Différentes selon Taille)

```tsx
<picture>
  {/* Mobile : image verticale */}
  <source
    media="(max-width: 640px)"
    srcSet="/images/hero-mobile-portrait.webp"
    type="image/webp"
  />

  {/* Tablet : image carrée */}
  <source
    media="(max-width: 1024px)"
    srcSet="/images/hero-tablet-square.webp"
    type="image/webp"
  />

  {/* Desktop : image horizontale */}
  <img
    src="/images/hero-desktop-landscape.webp"
    alt="Trouvez votre emploi en Guinée"
    width={1920}
    height={1080}
  />
</picture>
```

### Formats Modernes avec Fallback

```tsx
<picture>
  {/* Format AVIF (meilleur, mais support limité) */}
  <source
    srcSet="
      /images/job-320w.avif 320w,
      /images/job-640w.avif 640w,
      /images/job-1024w.avif 1024w,
      /images/job-1920w.avif 1920w
    "
    sizes="(max-width: 640px) 100vw, 80vw"
    type="image/avif"
  />

  {/* Format WebP (bon support) */}
  <source
    srcSet="
      /images/job-320w.webp 320w,
      /images/job-640w.webp 640w,
      /images/job-1024w.webp 1024w,
      /images/job-1920w.webp 1920w
    "
    sizes="(max-width: 640px) 100vw, 80vw"
    type="image/webp"
  />

  {/* Fallback JPEG (universel) */}
  <img
    src="/images/job-1024w.jpg"
    srcSet="
      /images/job-320w.jpg 320w,
      /images/job-640w.jpg 640w,
      /images/job-1024w.jpg 1024w,
      /images/job-1920w.jpg 1920w
    "
    sizes="(max-width: 640px) 100vw, 80vw"
    alt="Offre emploi développeur web Conakry"
    width={1200}
    height={630}
    loading="lazy"
  />
</picture>
```

---

## 10. CDN et Cache

### Configuration Headers (.htaccess pour Apache)

```apache
# Cache des images (1 an)
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/avif "access plus 1 year"
</IfModule>

# Compression des images
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE image/svg+xml
</IfModule>

# Headers de cache
<IfModule mod_headers.c>
  <FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|avif)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
```

### Configuration Nginx

```nginx
# Cache des images
location ~* \.(jpg|jpeg|png|gif|webp|svg|avif)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# Compression gzip pour SVG
location ~* \.svg$ {
    gzip on;
    gzip_types image/svg+xml;
    gzip_comp_level 9;
}
```

### CDN avec Cloudflare

```tsx
// Utiliser les transformations Cloudflare
function getCDNImageUrl(originalUrl: string, width: number, quality: number = 85) {
  return `/cdn-cgi/image/width=${width},quality=${quality},format=auto/${originalUrl}`;
}

// Utilisation
<img
  src={getCDNImageUrl('/images/hero.jpg', 1920, 85)}
  alt="Hero"
/>
```

---

## 🧪 Tests et Validation

### Script de Validation SEO

```tsx
import { ImageOptimizationService } from '@/services/imageOptimizationService';

async function auditImages() {
  const images = document.querySelectorAll('img');
  const results: any[] = [];

  images.forEach(img => {
    const metadata = {
      url: img.src,
      alt: img.alt,
      width: img.width,
      height: img.height,
      format: img.src.split('.').pop() as any
    };

    const validation = ImageOptimizationService.validateImageSEO(metadata);
    results.push({
      src: img.src,
      ...validation
    });
  });

  console.table(results);
}

// Exécuter dans la console
auditImages();
```

### Lighthouse CI

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "uses-optimized-images": ["error", {"minScore": 0.9}],
        "uses-webp-images": ["error", {"minScore": 0.9}],
        "offscreen-images": ["error", {"minScore": 0.9}],
        "modern-image-formats": ["error", {"minScore": 0.9}],
        "unsized-images": ["error", {"maxLength": 0}]
      }
    }
  }
}
```

---

## 📊 Checklist de Validation

```
Configuration
[ ] Convention de nommage appliquée à toutes les images
[ ] Formats modernes générés (WebP, AVIF)
[ ] Versions responsive créées (320w, 640w, 1024w, 1920w)
[ ] Compression optimale appliquée
[ ] Métadonnées EXIF supprimées

HTML/React
[ ] Attributs alt pertinents sur toutes les images
[ ] Width et height définis (éviter CLS)
[ ] Loading="lazy" sur images hors viewport
[ ] Fetchpriority="high" sur images critiques
[ ] srcset et sizes implémentés
[ ] Picture element pour art direction

SEO
[ ] Sitemap images généré et soumis
[ ] Schema.org ImageObject ajouté
[ ] Open Graph images configurées
[ ] Twitter Card images configurées
[ ] Robots.txt permet l'indexation

Performance
[ ] Preload sur images hero
[ ] Cache HTTP configuré (1 an)
[ ] CDN configuré
[ ] LCP < 2.5s
[ ] Lighthouse Images > 90
```

---

## 🚀 Déploiement

### Script de Build

```json
// package.json
{
  "scripts": {
    "optimize-images": "node scripts/optimize-images.js",
    "generate-sitemap": "node scripts/generate-image-sitemap.js",
    "build": "npm run optimize-images && vite build && npm run generate-sitemap"
  }
}
```

### GitHub Actions

```yaml
# .github/workflows/optimize-images.yml
name: Optimize Images

on:
  push:
    paths:
      - 'public/images/**'

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install sharp

      - name: Optimize images
        run: node scripts/optimize-images.js

      - name: Commit optimized images
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add public/images/
          git commit -m "Optimize images" || echo "No changes"
          git push
```

---

## 📚 Ressources Supplémentaires

- [Google Image SEO Guidelines](https://developers.google.com/search/docs/advanced/guidelines/google-images)
- [Web.dev Image Optimization](https://web.dev/fast/#optimize-your-images)
- [MDN Responsive Images](https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding/Responsive_images)
- [Squoosh App](https://squoosh.app/) - Test compression
- [Sharp Documentation](https://sharp.pixelplumbing.com/)

---

**Dernière mise à jour :** 10 Janvier 2025
