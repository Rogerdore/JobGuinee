# Système d'Images pour le Partage Social

## Logique de Cascade Intelligente

Lorsqu'une offre d'emploi est partagée sur **Facebook, WhatsApp, LinkedIn ou Twitter**, le système utilise cette **cascade intelligente** pour choisir l'image :

### 1️⃣ Image de Mise en Avant
Si le recruteur a uploadé une **image de mise en avant** (`featured_image_url`), celle-ci est utilisée en priorité.

### 2️⃣ Logo de l'Entreprise ⭐ PRIORITAIRE
Si aucune image de mise en avant, le système utilise le **logo de l'entreprise** (`company_logo_url` ou `companies.logo_url`).

### 3️⃣ Logo JobGuinée (Fallback)
Si aucun logo d'entreprise n'est disponible, le système utilise le **logo JobGuinée** par défaut.

## Implémentation

### Frontend (`socialShareService.ts`)
```typescript
getJobShareImage(job: Partial<Job> & { companies?: any }): string {
  // 1. Image de mise en avant
  if (job.featured_image_url) {
    return job.featured_image_url;
  }

  // 2. Logo de l'entreprise (prioritaire)
  if (job.company_logo_url) {
    return job.company_logo_url;
  }

  if (job.companies?.logo_url) {
    return job.companies.logo_url;
  }

  // 3. Logo JobGuinée par défaut
  return JOBGUINEE_LOGO;
}
```

### Backend (Edge Function)
La fonction `generate-job-og-image` utilise la même logique pour générer les images Open Graph dynamiquement.

## Structure des Fichiers

```
public/
├── logo_jobguinee.svg          # Logo JobGuinée (fallback)
└── assets/
    └── share/
        ├── default-job.png     # Image placeholder
        └── jobs/               # Images spécifiques par offre
            └── {job_id}.png
```

## Base de Données

### Colonnes dans `jobs`
- `featured_image_url` : Image de mise en avant (optionnel)
- `company_logo_url` : Logo de l'entreprise (stocké dans Storage)

### Storage Bucket
- `company-logos` : Stockage des logos d'entreprise
- `og-images` : Images Open Graph générées dynamiquement

## Exemple de Rendu

```
┌─────────────────────────────┐
│  [Logo Entreprise]          │ ← Logo de l'entreprise
│                              │
│  Développeur Full Stack     │ ← Titre de l'offre
│  TechCorp Guinée            │ ← Nom de l'entreprise
│                              │
│  📍 Conakry  💼 CDI         │ ← Badges
│  💰 5.000.000 - 8.000.000   │ ← Salaire
│                              │
│  [JobGuinée]                │ ← Badge JobGuinée
└─────────────────────────────┘
```

## Test du Système

### 1. Tester avec logo d'entreprise
```javascript
const job = {
  id: '123',
  title: 'Développeur Full Stack',
  company_name: 'TechCorp Guinée',
  company_logo_url: 'https://example.com/logo.png',
  location: 'Conakry'
};

const image = socialShareService.getJobShareImage(job);
// Résultat : https://example.com/logo.png
```

### 2. Tester sans logo (fallback)
```javascript
const job = {
  id: '456',
  title: 'Chef de Projet',
  company_name: 'Entreprise ABC',
  location: 'Kindia'
};

const image = socialShareService.getJobShareImage(job);
// Résultat : https://jobguinee-pro.com/logo_jobguinee.svg
```

## Déploiement

### ✅ État Actuel
- ✅ Frontend : Logique de cascade implémentée
- ✅ Backend : Edge Function déployée
- ✅ Build : Réussi
- ✅ Images : Logo JobGuinée disponible

### 🚀 Prochaines Étapes
1. Les recruteurs peuvent uploader leur logo d'entreprise dans leur profil
2. Le système utilisera automatiquement ce logo pour les partages sociaux
3. Si pas de logo, le logo JobGuinée sera utilisé

## Avantages

✅ **Professionnel** : Chaque entreprise a sa propre identité visuelle
✅ **Fallback robuste** : Toujours une image à afficher
✅ **Flexible** : Support d'images de mise en avant personnalisées
✅ **Performance** : Images optimisées pour les réseaux sociaux (1200x630)

## Notes Techniques

- Les logos sont vérifiés avant utilisation (`checkImageExists`)
- Format recommandé : PNG ou SVG
- Dimensions optimales : 1200x630 pour Open Graph
- Les images sont servies depuis Supabase Storage
- Edge Function génère des SVG convertibles en PNG
