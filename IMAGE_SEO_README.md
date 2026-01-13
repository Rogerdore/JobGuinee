# 🖼️ Système d'Optimisation d'Images SEO - JobGuinée

Système complet d'optimisation d'images pour améliorer le SEO, les performances et l'indexation Google Images.

## 📦 Installation

```bash
# Installer les dépendances
npm install sharp

# Rendre le script exécutable (Linux/Mac)
chmod +x scripts/optimize-images-batch.mjs
```

## 🚀 Démarrage Rapide

### 1. Optimiser des Images

```bash
# Placer vos images originales
mkdir -p public/images/originals
cp ~/mes-images/*.jpg public/images/originals/

# Lancer l'optimisation
node scripts/optimize-images-batch.mjs

# Résultat: Images optimisées dans public/images/optimized/
```

### 2. Utiliser le Composant Optimisé

```tsx
import OptimizedImage from '@/components/common/OptimizedImage';

export default function MyPage() {
  return (
    <OptimizedImage
      src="/images/jobguinee-hero-recherche-emploi.jpg"
      alt="Trouvez votre emploi en Guinée - JobGuinée"
      width={1920}
      height={1080}
      priority="high"
      responsive
      modernFormats
      schema
    />
  );
}
```

### 3. Générer le Sitemap d'Images

```tsx
import { ImageSitemapService } from '@/services/imageSitemapService';

// Générer le sitemap complet
const xml = await ImageSitemapService.generateAndSave();

// Sauvegarder dans public/
await fs.writeFile('public/image-sitemap.xml', xml);

// Soumettre à Google
// https://www.google.com/ping?sitemap=https://jobguinee.com/image-sitemap.xml
```

---

## 📁 Structure des Fichiers

```
project/
├── src/
│   ├── components/common/
│   │   └── OptimizedImage.tsx         # Composant React optimisé
│   └── services/
│       ├── imageOptimizationService.ts # Service d'optimisation
│       └── imageSitemapService.ts     # Génération sitemap
│
├── scripts/
│   └── optimize-images-batch.mjs      # Script d'optimisation batch
│
├── public/
│   ├── images/
│   │   ├── originals/                 # Images sources (HD)
│   │   └── optimized/                 # Images optimisées
│   └── image-sitemap.xml              # Sitemap des images
│
├── IMAGE_SEO_AUDIT_REPORT.md          # Rapport d'audit
├── IMAGE_SEO_IMPLEMENTATION_GUIDE.md  # Guide complet
├── IMAGE_OPTIMIZATION_CONFIG.ts       # Configuration centralisée
└── IMAGE_SEO_README.md                # Ce fichier
```

---

## 🎯 Fonctionnalités

### ✅ Optimisation d'Images

- ✓ Compression optimale (85% qualité, -60% poids)
- ✓ Formats modernes (WebP, AVIF)
- ✓ Images responsive (320w, 640w, 1024w, 1920w)
- ✓ Suppression métadonnées EXIF
- ✓ JPEG progressif
- ✓ Nommage SEO automatique

### ✅ Composants React

- ✓ Lazy loading natif + Intersection Observer
- ✓ Picture element avec fallbacks
- ✓ Placeholders (shimmer, blur)
- ✓ Schema.org ImageObject
- ✓ Préchargement images critiques
- ✓ Gestion erreurs gracieuse

### ✅ SEO

- ✓ Sitemap d'images XML
- ✓ Attributs alt optimisés
- ✓ Open Graph / Twitter Card
- ✓ Structured data (Schema.org)
- ✓ Convention de nommage SEO
- ✓ Validation automatique

---

## 🛠️ Utilisation Avancée

### Script d'Optimisation

```bash
# Optimiser un répertoire spécifique
node scripts/optimize-images-batch.mjs ~/Downloads public/images

# Voir l'aide
node scripts/optimize-images-batch.mjs --help

# Ajouter au package.json
npm run optimize-images
```

### Composants Spécialisés

```tsx
// Image Hero (priorité haute, preload)
import { HeroImage } from '@/components/common/OptimizedImage';

<HeroImage
  src="/images/hero.jpg"
  alt="Trouvez votre emploi en Guinée"
  width={1920}
  height={1080}
/>

// Logo (pas de responsive, SVG)
import { LogoImage } from '@/components/common/OptimizedImage';

<LogoImage
  src="/logo.svg"
  alt="JobGuinée - Plateforme emploi Guinée"
  width={200}
  height={50}
/>

// Image de contenu (lazy loading)
import { ContentImage } from '@/components/common/OptimizedImage';

<ContentImage
  src="/images/article.jpg"
  alt="Guide recrutement 2025"
  width={1200}
  height={630}
/>
```

### Service d'Optimisation

```tsx
import { ImageOptimizationService } from '@/services/imageOptimizationService';

// Générer un nom SEO
const filename = ImageOptimizationService.generateSEOFilename(
  'Offre emploi développeur',
  'webp',
  1920,
  ['guinée', 'conakry']
);
// Result: 'jobguinee-offre-emploi-développeur-guinée-conakry-1920w.webp'

// Générer un alt SEO
const alt = ImageOptimizationService.generateSEOAlt(
  'Développeur Web',
  'TechCorp Conakry',
  ['emploi IT', 'recrutement']
);
// Result: 'Développeur Web - TechCorp Conakry | emploi IT | recrutement'

// Valider une image
const validation = ImageOptimizationService.validateImageSEO({
  url: '/images/job.jpg',
  alt: 'Offre emploi',
  width: 1200,
  height: 630,
  format: 'jpg'
});
console.log(validation);
// { valid: true, errors: [], warnings: ['...'] }

// Générer Schema.org
const schema = ImageOptimizationService.generateImageSchema({
  url: 'https://jobguinee.com/images/hero.jpg',
  alt: 'Hero image',
  title: 'Emploi Guinée',
  width: 1920,
  height: 1080,
  format: 'jpg'
});
```

### Sitemap d'Images

```tsx
import { ImageSitemapService } from '@/services/imageSitemapService';

// Générer le sitemap complet
const xml = await ImageSitemapService.generateFullImageSitemap();

// Ajouter une image dynamiquement
await ImageSitemapService.addImageToSitemap({
  pageUrl: 'https://jobguinee.com/jobs/123',
  imageUrl: 'https://jobguinee.com/images/job-123.jpg',
  title: 'Développeur Web - TechCorp',
  caption: 'Offre emploi développeur web Conakry',
  geoLocation: 'Conakry, Guinée'
});

// Statistiques
const stats = await ImageSitemapService.getSitemapStats();
console.log(stats);
// { totalImages: 250, lastGenerated: '2025-01-10', pagesCovered: 45 }
```

---

## 📊 Convention de Nommage

### Format Standard

```
[marque]-[type]-[contexte]-[mots-clés]-[dimension].extension

Exemples :
✅ jobguinee-hero-accueil-recherche-emploi-guinee-1920w.webp
✅ jobguinee-logo-plateforme-recrutement.svg
✅ jobguinee-profile-candidat-developpeur-web-600w.jpg
✅ jobguinee-job-offre-ingenieur-conakry-1200w.webp
✅ jobguinee-formation-marketing-digital-800w.jpg
```

### Règles

1. **Tout en minuscules**
2. **Tirets (-) pour séparer** (pas underscore)
3. **Inclure la marque** (jobguinee)
4. **Mots-clés SEO** (emploi, guinée, recrutement)
5. **Largeur à la fin** (320w, 640w, 1920w)
6. **Extension appropriée** (.webp, .jpg, .avif)

### ❌ À Éviter

```
❌ image.jpg
❌ IMG_1234.jpg
❌ photo copy.jpg
❌ new-image-final-v2.png
❌ Avatar alpha.gif (espaces)
❌ image copy copy copy.png (duplications)
```

---

## 🧪 Tests et Validation

### Test en Ligne de Commande

```bash
# Vérifier les images de 20 bytes (placeholders)
find public -type f -size 20c

# Compter les images optimisées
find public/images/optimized -name "*.webp" | wc -l

# Vérifier la compression
du -sh public/images/originals
du -sh public/images/optimized
```

### Test dans le Navigateur

```javascript
// Dans la console du navigateur
import { ImageOptimizationService } from './services/imageOptimizationService';

// Auditer toutes les images de la page
document.querySelectorAll('img').forEach(img => {
  const validation = ImageOptimizationService.validateImageSEO({
    url: img.src,
    alt: img.alt,
    width: img.width,
    height: img.height
  });
  console.log(img.src, validation);
});
```

### Lighthouse CI

```bash
# Installer Lighthouse CI
npm install -g @lhci/cli

# Lancer l'audit
lhci autorun

# Vérifier les scores images
lhci assert --preset=lighthouse:recommended
```

---

## 📈 Performances Attendues

### Avant Optimisation

- ⏱️ LCP: ~5-6s
- 📦 Poids moyen: 500KB-2MB par image
- 📊 Lighthouse Images: 40-50/100
- 🐌 Format: JPEG/PNG uniquement

### Après Optimisation

- ⚡ LCP: <2.5s (-60%)
- 📦 Poids moyen: 50-150KB par image (-70%)
- 📊 Lighthouse Images: 90-100/100
- 🚀 Format: WebP/AVIF + fallback

### ROI SEO

- 📈 +25-40% trafic organique images
- 📈 +15-20% temps sur page
- 📉 -50% taux de rebond
- 📈 +30 positions Google Images

---

## 🔧 Configuration

### Personnaliser les Paramètres

```typescript
// IMAGE_OPTIMIZATION_CONFIG.ts

export const IMAGE_CONFIG = {
  RESPONSIVE_WIDTHS: [320, 640, 1024, 1920, 2560], // Modifier les tailles
  QUALITY: {
    jpg: 85,  // Modifier la qualité (0-100)
    webp: 85,
    avif: 80
  },
  NAMING: {
    prefix: 'jobguinee',  // Modifier le préfixe
    keywords: {
      default: ['emploi', 'guinée', 'recrutement']
    }
  }
};
```

### Variables d'Environnement

```bash
# .env
IMAGE_CDN_ENABLED=true
IMAGE_CDN_URL=https://cdn.jobguinee.com
IMAGE_QUALITY_JPG=85
IMAGE_QUALITY_WEBP=85
IMAGE_RESPONSIVE_WIDTHS=320,640,1024,1920
```

---

## 🚀 Déploiement

### 1. Build en Production

```bash
# Optimiser toutes les images
npm run optimize-images

# Build le projet
npm run build

# Générer le sitemap
node scripts/generate-sitemap.js
```

### 2. Ajouter au package.json

```json
{
  "scripts": {
    "optimize-images": "node scripts/optimize-images-batch.mjs",
    "generate-sitemap": "node scripts/generate-image-sitemap.js",
    "build": "npm run optimize-images && vite build",
    "postbuild": "npm run generate-sitemap"
  }
}
```

### 3. CI/CD (GitHub Actions)

```yaml
# .github/workflows/optimize-images.yml
name: Optimize Images
on:
  push:
    paths: ['public/images/originals/**']

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install sharp
      - run: npm run optimize-images
      - run: git add public/images/optimized/
      - run: git commit -m "Optimize images" || echo "No changes"
      - run: git push
```

---

## 📚 Ressources

### Documentation

- [IMAGE_SEO_AUDIT_REPORT.md](./IMAGE_SEO_AUDIT_REPORT.md) - Audit complet
- [IMAGE_SEO_IMPLEMENTATION_GUIDE.md](./IMAGE_SEO_IMPLEMENTATION_GUIDE.md) - Guide détaillé
- [IMAGE_OPTIMIZATION_CONFIG.ts](./IMAGE_OPTIMIZATION_CONFIG.ts) - Configuration

### Liens Externes

- [Google Image SEO](https://developers.google.com/search/docs/advanced/guidelines/google-images)
- [Web.dev Images](https://web.dev/fast/#optimize-your-images)
- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [Squoosh App](https://squoosh.app/)

---

## ✅ Checklist de Déploiement

### Images

- [ ] Tous les placeholders remplacés (20 bytes → vraies images)
- [ ] Convention de nommage appliquée
- [ ] Formats WebP/AVIF générés
- [ ] Versions responsive créées (4 tailles minimum)
- [ ] Compression optimale (qualité 80-85%)
- [ ] Métadonnées EXIF supprimées

### Code

- [ ] Composant OptimizedImage utilisé partout
- [ ] Attributs alt pertinents (10-125 caractères)
- [ ] Lazy loading implémenté (95%+ des images)
- [ ] Width/height définis (éviter CLS)
- [ ] Priority="high" sur images hero/logo
- [ ] Picture element pour formats modernes

### SEO

- [ ] Sitemap images créé et soumis à GSC
- [ ] Schema.org ImageObject ajouté
- [ ] Open Graph images configurées
- [ ] Twitter Card images configurées
- [ ] Robots.txt autorise indexation

### Performance

- [ ] Preload sur images critiques (2 max)
- [ ] Cache HTTP configuré (1 an)
- [ ] CDN configuré (optionnel)
- [ ] LCP < 2.5s
- [ ] Lighthouse Images > 90/100

---

## 🆘 Dépannage

### Images ne s'affichent pas

```bash
# Vérifier que les fichiers existent
ls -lh public/images/optimized/

# Vérifier les permissions
chmod 644 public/images/optimized/*

# Vérifier la console navigateur pour erreurs
```

### Sitemap ne se génère pas

```bash
# Vérifier les permissions base de données
# Vérifier les logs Supabase
# Régénérer manuellement:
node scripts/generate-sitemap.js
```

### Script d'optimisation échoue

```bash
# Vérifier que Sharp est installé
npm list sharp

# Réinstaller si nécessaire
npm install sharp

# Vérifier Node.js version (>= 14)
node --version
```

---

## 📞 Support

Pour toute question ou problème :

1. Consulter [IMAGE_SEO_IMPLEMENTATION_GUIDE.md](./IMAGE_SEO_IMPLEMENTATION_GUIDE.md)
2. Vérifier la checklist ci-dessus
3. Tester avec Lighthouse
4. Consulter la console navigateur

---

**Dernière mise à jour :** 10 Janvier 2025
**Version :** 1.0.0
