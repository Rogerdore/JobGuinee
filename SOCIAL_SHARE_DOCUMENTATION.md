# Documentation du Système de Partage Social et Preview Facebook

## Vue d'ensemble

Le système de partage social de JobGuinée permet aux utilisateurs de partager des offres d'emploi sur différentes plateformes (Facebook, LinkedIn, Twitter, WhatsApp) avec des previews optimisés.

## Architecture

### 1. Composants

#### `ShareJobModal.tsx`
Modal de partage qui affiche toutes les options de partage social.

**Fonctionnalités:**
- Partage sur Facebook avec preview optimisé
- Partage sur LinkedIn
- Partage sur Twitter/X
- Partage sur WhatsApp
- Copie de lien direct

**Props:**
```typescript
interface ShareJobModalProps {
  job: {
    id: string;
    title: string;
    description?: string;
    location?: string;
    contract_type?: string;
    companies?: { name: string; logo_url?: string };
  };
  onClose: () => void;
}
```

### 2. Utilitaires

#### `socialShareMeta.ts`
Gère la mise à jour dynamique des meta tags Open Graph et Twitter Card.

**Fonctions principales:**

##### `updateSocialMetaTags(data: ShareMetaData)`
Met à jour les meta tags dans le `<head>` pour optimiser les previews.

```typescript
interface ShareMetaData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
}
```

##### `generateJobShareMeta(job)`
Génère les meta tags optimisés pour une offre d'emploi spécifique.

##### Fonctions de partage:
- `shareFacebookJob(job)` - Ouvre le dialog de partage Facebook
- `shareLinkedInJob(job)` - Ouvre le dialog de partage LinkedIn
- `shareTwitterJob(job)` - Ouvre le dialog de partage Twitter
- `shareWhatsAppJob(job)` - Ouvre le partage WhatsApp

### 3. Hooks

#### `useJobMetaTags(job)`
Hook qui met à jour automatiquement les meta tags quand on affiche une offre.

**Utilisation:**
```typescript
import { useJobMetaTags } from '../hooks/useJobMetaTags';

function JobDetailPage({ job }) {
  useJobMetaTags(job);
  // ...
}
```

#### `useHomeMetaTags()`
Hook pour mettre à jour les meta tags de la page d'accueil.

## Meta Tags Open Graph

### Structure de base

```html
<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="JobGuinée">
<meta property="og:title" content="Titre de l'offre">
<meta property="og:description" content="Description de l'offre">
<meta property="og:url" content="https://jobguinee.com/job/123">
<meta property="og:image" content="https://jobguinee.com/logo.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Logo de l'entreprise">
<meta property="og:locale" content="fr_GN">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Titre de l'offre">
<meta name="twitter:description" content="Description de l'offre">
<meta name="twitter:image" content="https://jobguinee.com/logo.png">
```

### Recommandations pour les images

**Dimensions optimales:**
- Facebook: 1200 x 630 pixels (ratio 1.91:1)
- Twitter: 1200 x 600 pixels (ratio 2:1)
- LinkedIn: 1200 x 627 pixels (ratio 1.91:1)

**Format:**
- JPG ou PNG
- Poids: < 5 MB
- URL absolue (pas de chemins relatifs)

## Intégration

### 1. Page d'accueil (Home.tsx)

```typescript
import { useState } from 'react';
import ShareJobModal from '../components/common/ShareJobModal';
import { useHomeMetaTags } from '../hooks/useJobMetaTags';

export default function Home() {
  const [shareJobModal, setShareJobModal] = useState(null);
  useHomeMetaTags(); // Met à jour les meta tags de la homepage

  const shareJob = (job, e) => {
    e.stopPropagation();
    setShareJobModal(job);
  };

  return (
    <>
      {/* Contenu */}

      {/* Bouton de partage */}
      <button onClick={(e) => shareJob(job, e)}>
        <Share2 className="w-5 h-5" />
      </button>

      {/* Modal de partage */}
      {shareJobModal && (
        <ShareJobModal
          job={shareJobModal}
          onClose={() => setShareJobModal(null)}
        />
      )}
    </>
  );
}
```

### 2. Page de détail d'offre (JobDetail.tsx)

```typescript
import { useJobMetaTags } from '../hooks/useJobMetaTags';

export default function JobDetail({ job }) {
  useJobMetaTags(job); // Met à jour les meta tags automatiquement

  return (
    <div>
      {/* Détails de l'offre */}
    </div>
  );
}
```

## Test du Preview Facebook

### 1. Facebook Sharing Debugger

Utilisez l'outil officiel de Facebook pour tester vos previews:

**URL:** https://developers.facebook.com/tools/debug/

**Étapes:**
1. Entrez l'URL de votre offre d'emploi
2. Cliquez sur "Debug"
3. Vérifiez que tous les meta tags sont correctement détectés
4. Cliquez sur "Scrape Again" pour forcer une mise à jour du cache

### 2. Vérifications importantes

✅ **À vérifier:**
- Le titre s'affiche correctement
- La description est complète (max 160 caractères)
- L'image s'affiche en haute résolution
- L'URL est correcte et accessible
- Le type est "article" pour les offres, "website" pour la homepage

### 3. Problèmes courants

**Problem:** L'image ne s'affiche pas
- **Solution:** Vérifiez que l'URL de l'image est absolue (commence par http:// ou https://)
- **Solution:** Vérifiez que l'image est accessible publiquement

**Problem:** Les meta tags ne se mettent pas à jour
- **Solution:** Utilisez le Facebook Debugger pour forcer un rafraîchissement
- **Solution:** Vérifiez que les meta tags sont bien dans le `<head>`

**Problem:** Le preview est vide ou générique
- **Solution:** Assurez-vous que les meta tags og:title, og:description et og:image sont présents
- **Solution:** Vérifiez que le serveur renvoie les meta tags lors du crawl

## Métriques et Analytics

### Suivi des partages

Pour suivre les partages, vous pouvez ajouter des paramètres UTM:

```typescript
const shareUrl = `${baseUrl}/job/${job.id}?utm_source=facebook&utm_medium=social&utm_campaign=job_share`;
```

### Events Analytics

Envoyez des events lorsque les utilisateurs partagent:

```typescript
// Google Analytics
gtag('event', 'share', {
  method: 'facebook',
  content_type: 'job',
  content_id: job.id
});

// Facebook Pixel
fbq('track', 'Share', {
  content_name: job.title,
  content_category: 'job_posting',
  content_id: job.id
});
```

## Bonnes Pratiques

### 1. Performance
- Mettez en cache les images des logos d'entreprise
- Utilisez des images optimisées (compression WebP avec fallback)
- Minifiez les meta descriptions

### 2. SEO
- Utilisez des titres descriptifs et uniques
- Incluez des mots-clés pertinents dans la description
- Assurez-vous que l'URL canonique est correcte

### 3. Accessibilité
- Ajoutez toujours un texte alt aux images (og:image:alt)
- Utilisez des descriptions claires et informatives
- Testez le partage sur mobile

### 4. Maintenance
- Vérifiez régulièrement les liens avec le Facebook Debugger
- Surveillez les erreurs 404 sur les images
- Mettez à jour les meta tags si vous changez de design

## Ressources Externes

### Documentation officielle
- [Facebook Open Graph](https://developers.facebook.com/docs/sharing/webmasters)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [LinkedIn Share](https://www.linkedin.com/help/linkedin/answer/46687)

### Outils de test
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Meta Tags Tester](https://metatags.io/)

## Support

Pour toute question ou problème avec le système de partage:
1. Vérifiez d'abord cette documentation
2. Testez avec les outils de debug officiels
3. Consultez les logs du navigateur pour les erreurs JavaScript
4. Vérifiez que les meta tags sont bien présents dans le HTML source

---

**Dernière mise à jour:** 7 janvier 2026
**Version:** 1.0.0
