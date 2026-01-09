# 📢 Système de Partage Social - JobGuinée

## 📋 Vue d'Ensemble

Système complet de partage d'offres d'emploi sur les réseaux sociaux (Facebook, WhatsApp, LinkedIn, X/Twitter) avec preview professionnel et tracking analytics.

## 🎯 Fonctionnalités Principales

### 1. Partage Multi-Plateformes
- ✅ Facebook avec Open Graph
- ✅ LinkedIn avec preview professionnel
- ✅ X (Twitter) avec Twitter Cards
- ✅ WhatsApp avec texte formaté

### 2. Preview Dynamique
- Aperçu en temps réel de l'apparence sur chaque plateforme
- Image de partage 1200×630px
- Titre, description et URL optimisés
- Fallback automatique si l'image n'existe pas

### 3. Meta Tags Optimisés
- Open Graph pour Facebook
- Twitter Cards pour X
- Métadonnées dynamiques par offre
- SEO-friendly

### 4. Analytics & Tracking
- Table `social_share_analytics` pour suivre tous les partages
- Compteur `shares_count` sur chaque offre
- Statistiques par plateforme
- Dashboard recruteur avec métriques de partage

## 🏗️ Architecture

### Structure des Fichiers

```
src/
├── services/
│   └── socialShareService.ts       # Service principal de partage
├── hooks/
│   └── useSocialShareMeta.ts       # Hook pour gérer les meta tags
├── components/
│   └── common/
│       ├── ShareJobModal.tsx       # Modal de partage complet
│       └── SocialSharePreview.tsx  # Preview du partage
└── pages/
    └── JobDetail.tsx               # Intégration dans la page détail

public/
└── assets/
    └── share/
        ├── default-job.png         # Image fallback
        └── jobs/
            └── [job-id].png        # Images par offre
```

### Base de Données

**Table: `social_share_analytics`**
```sql
- id (uuid, primary key)
- job_id (uuid, référence jobs)
- user_id (uuid, nullable)
- platform (facebook|linkedin|twitter|whatsapp)
- shared_at (timestamptz)
- ip_address (text, nullable)
- user_agent (text, nullable)
```

**Colonne ajoutée: `jobs.shares_count`**
- Compteur automatique via trigger
- Mis à jour en temps réel

## 🔧 Services et APIs

### socialShareService

```typescript
import { socialShareService } from '../services/socialShareService';

// Générer les métadonnées
const metadata = socialShareService.generateJobMetadata(job);

// Générer les liens de partage
const links = socialShareService.generateShareLinks(job);

// Ouvrir le partage
socialShareService.openShareLink('facebook', links);

// Tracker le partage
await socialShareService.trackShare(jobId, 'facebook');

// Copier le lien
await socialShareService.copyToClipboard(url);

// Vérifier si l'image existe
const exists = await socialShareService.checkImageExists(imageUrl);

// Obtenir l'image avec fallback
const image = await socialShareService.getJobImageWithFallback(jobId);
```

### useSocialShareMeta Hook

```typescript
import { useSocialShareMeta } from '../hooks/useSocialShareMeta';

const metadata = socialShareService.generateJobMetadata(job);
useSocialShareMeta(metadata);
```

Ce hook met automatiquement à jour les balises `<meta>` dans le `<head>`.

## 📱 Composants

### ShareJobModal

Modal complet avec:
- Preview du partage
- Boutons pour chaque plateforme
- Copie du lien
- Tracking automatique

```typescript
<ShareJobModal
  job={job}
  isOpen={showShareModal}
  onClose={() => setShowShareModal(false)}
/>
```

### SocialSharePreview

Preview de l'apparence sur les réseaux sociaux:

```typescript
<SocialSharePreview
  metadata={metadata}
  platform="facebook" // ou 'linkedin', 'twitter', 'generic'
/>
```

## 🖼️ Images de Partage

### Spécifications

- **Dimensions**: 1200 × 630 pixels (ratio 1.91:1)
- **Format**: PNG ou JPG
- **Poids**: < 500 Ko
- **Emplacement**: `public/assets/share/jobs/[job-id].png`

### Structure URL

```
https://jobguinee-pro.com/assets/share/jobs/[job-id].png
https://jobguinee-pro.com/assets/share/default-job.png (fallback)
```

### Fallback Automatique

Si l'image spécifique n'existe pas:
1. Le système détecte l'erreur 404
2. Charge automatiquement `default-job.png`
3. Affiche un badge "Fallback" dans le preview

### Création d'Images

**Option 1: Manuelle**
- Utiliser Canva ou Figma
- Template 1200×630px
- Exporter en PNG < 500 Ko

**Option 2: Automatique (Future)**
- Edge Function qui génère l'image
- Canvas API côté serveur
- Cache pour réutilisation

## 🔗 Liens de Partage

### URLs Générées

**Facebook:**
```
https://www.facebook.com/sharer/sharer.php?u=[URL_ENCODEE]
```

**LinkedIn:**
```
https://www.linkedin.com/sharing/share-offsite/?url=[URL_ENCODEE]
```

**X (Twitter):**
```
https://twitter.com/intent/tweet?text=[TEXTE]&url=[URL]
```

**WhatsApp:**
```
https://wa.me/?text=[TITRE]%0A[URL]
```

## 🏷️ Meta Tags Générés

### Open Graph (Facebook)

```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="JobGuinée" />
<meta property="og:title" content="[TITRE] – [VILLE] | JobGuinée" />
<meta property="og:description" content="[DESCRIPTION]" />
<meta property="og:image" content="https://jobguinee-pro.com/assets/share/jobs/[ID].png" />
<meta property="og:url" content="https://jobguinee-pro.com/offres/[ID]" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="fr_FR" />
```

### Twitter Cards

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="[TITRE] – [VILLE] | JobGuinée" />
<meta name="twitter:description" content="[DESCRIPTION]" />
<meta name="twitter:image" content="https://jobguinee-pro.com/assets/share/jobs/[ID].png" />
<meta name="twitter:site" content="@JobGuinee" />
```

## 📊 Analytics

### Fonctions SQL Disponibles

**1. Statistiques d'une offre:**
```sql
SELECT * FROM get_job_share_stats('[job-id]');
```

Retourne:
- platform (facebook, linkedin, etc.)
- share_count (nombre de partages)
- last_shared_at (dernier partage)

**2. Offres les plus partagées:**
```sql
SELECT * FROM get_most_shared_jobs(10);
```

Retourne:
- job_id, job_title, company_name
- total_shares
- facebook_shares, linkedin_shares, twitter_shares, whatsapp_shares

### Dashboard Recruteur

Les recruteurs peuvent voir:
- Nombre total de partages par offre
- Répartition par plateforme
- Évolution temporelle
- Comparaison entre offres

## 🔒 Sécurité (RLS)

### Policies

**INSERT (Public):**
- Tout le monde peut tracker un partage
- Permet le suivi des partages anonymes

**SELECT (Restricted):**
- Utilisateurs: leurs propres partages
- Recruteurs: partages de leurs offres
- Admins: tous les partages

## 🚀 Déploiement

### 1. Assets

```bash
# Placer les images dans public/assets/share/
cp image.png public/assets/share/jobs/[job-id].png

# Après build, vérifier
ls dist/assets/share/jobs/
```

### 2. Variables d'Environnement

```env
VITE_APP_URL=https://jobguinee-pro.com
```

### 3. Migration Base de Données

La migration `create_social_share_analytics_table` a déjà été appliquée.

### 4. Build et Déploiement

```bash
npm run build
# Vérifier dist/assets/share/
# Déployer sur Hostinger
```

## 🧪 Tests de Validation

### 1. Test Local

```bash
# Lancer en dev
npm run dev

# Ouvrir une offre
http://localhost:5173/offres/[id]

# Cliquer sur "Partager cette offre"
# Vérifier le preview
# Tester les boutons de partage
```

### 2. Validation Meta Tags

**Inspecteur de Code Source:**
```bash
curl https://jobguinee-pro.com/offres/[id] | grep "og:image"
```

Doit montrer les balises meta dans le HTML.

### 3. Debuggers Officiels

**Facebook Debugger:**
- URL: https://developers.facebook.com/tools/debug/
- Coller: https://jobguinee-pro.com/offres/[id]
- Vérifier l'image, titre, description

**LinkedIn Post Inspector:**
- URL: https://www.linkedin.com/post-inspector/
- Coller l'URL
- Vérifier le preview

**Twitter Card Validator:**
- URL: https://cards-dev.twitter.com/validator
- Coller l'URL
- Vérifier la "Large Image Card"

### 4. Test WhatsApp

- Envoyer l'URL dans une conversation test
- Vérifier que le preview s'affiche

## 🐛 Troubleshooting

### Problème: L'image ne s'affiche pas

**Solutions:**
1. Vérifier que l'image existe à l'URL exacte
2. Vérifier la taille (1200×630)
3. Vérifier le poids (< 500 Ko)
4. Tester avec `curl -I [URL_IMAGE]`
5. Forcer le refresh du cache avec `?v=2`

### Problème: Preview ne se met pas à jour

**Solutions:**
1. Vider le cache Facebook: "Scrape Again"
2. Attendre 24h pour expiration du cache
3. Ajouter un paramètre version: `?v=2`

### Problème: Meta tags non visibles

**Cause:**
- React injecte les tags après le chargement
- Les crawlers ne voient que le HTML initial

**Solution:**
- Utiliser le hook `useSocialShareMeta`
- Le hook met à jour le DOM immédiatement
- Pour une solution SSR complète, envisager Next.js

## 📈 Métriques de Succès

### KPIs à Suivre

1. **Taux de partage par offre**
   - Objectif: 5-10% des vues

2. **Plateforme préférée**
   - Suivre quelle plateforme convertit le mieux

3. **Offres virales**
   - Identifier les offres les plus partagées
   - Analyser les caractéristiques communes

4. **ROI du partage**
   - Candidatures provenant de partages
   - Qualité des candidats

## 🔄 Évolutions Futures

### Phase 2

1. **Génération Automatique d'Images**
   - Edge Function pour créer les images à la volée
   - Template dynamique avec données de l'offre

2. **Partage par Email**
   - Bouton "Envoyer par email"
   - Template email professionnel

3. **Partage sur Telegram**
   - Support de Telegram
   - Groupes spécialisés

4. **QR Code**
   - Génération de QR Code
   - Affichage physique possible

### Phase 3

1. **Attribution Tracking**
   - Suivre les candidatures issues de partages
   - Gamification (badges, récompenses)

2. **Partage Intelligent**
   - Suggestions de quand partager
   - Meilleur moment pour maximum de visibilité

3. **A/B Testing**
   - Tester différentes images
   - Optimiser les titres et descriptions

## 📚 Ressources

### Documentation Officielle

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Outils Utiles

- [Canva](https://canva.com) - Création d'images
- [Meta Tags](https://metatags.io/) - Test preview
- [Social Sizes](https://socialsizes.io/) - Dimensions recommandées

## 💡 Bonnes Pratiques

1. **Images:**
   - Toujours respecter 1200×630
   - Texte lisible même sur mobile
   - Logo visible mais discret
   - CTA clair

2. **Titres:**
   - Max 60 caractères
   - Inclure lieu et entreprise
   - Action-oriented

3. **Descriptions:**
   - Max 200 caractères
   - Résumé concis
   - Points clés visibles

4. **URLs:**
   - Toujours en HTTPS
   - URLs courtes et propres
   - Pas de paramètres inutiles

## 🎓 Formation Équipe

### Pour les Recruteurs

1. Encourager le partage des offres
2. Utiliser les analytics pour optimiser
3. Partager sur les bons canaux
4. Mesurer l'impact

### Pour les Admins

1. Créer les images de partage
2. Monitorer les statistiques
3. Optimiser les performances
4. Gérer les problèmes techniques

---

**Version:** 1.0.0
**Date:** 09 Janvier 2026
**Auteur:** Équipe Technique JobGuinée
