# Guide Visual: Preview de Partage Facebook

## Aperçu du Système

Lorsqu'un utilisateur partage une offre d'emploi sur Facebook, LinkedIn ou Twitter, un **preview enrichi** s'affiche automatiquement avec:

- ✅ Le titre de l'offre
- ✅ Une description concise
- ✅ Le logo de l'entreprise
- ✅ L'URL du poste

---

## Comment ça fonctionne

### 1. Page d'accueil - Bouton de partage

```
┌─────────────────────────────────────────┐
│  💼 Développeur Full Stack              │
│  🏢 SMB-Winning                         │
│  📍 Conakry                             │
│  💰 CDI                                 │
│                                         │
│  ⏰ Publié il y a 2 jours               │
│                                         │
│  [❤️ 5]  [🔗 Partager] ←── Nouveau!   │
└─────────────────────────────────────────┘
```

### 2. Modal de partage

Quand l'utilisateur clique sur "Partager", une belle modal s'ouvre:

```
╔════════════════════════════════════════╗
║    Partager cette offre               ║
╠════════════════════════════════════════╣
║                                        ║
║  📋 Développeur Full Stack             ║
║     SMB-Winning • Conakry             ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ 📘 Facebook                    │   ║
║  │    Partager sur Facebook       │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ 💼 LinkedIn                    │   ║
║  │    Partager sur LinkedIn       │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ 🐦 Twitter / X                 │   ║
║  │    Partager sur Twitter        │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ┌────────────────────────────────┐   ║
║  │ 💬 WhatsApp                    │   ║
║  │    Partager sur WhatsApp       │   ║
║  └────────────────────────────────┘   ║
║                                        ║
║  ─────────────────────────────────    ║
║                                        ║
║  Ou copier le lien:                   ║
║  ┌────────────────────────┬──────┐   ║
║  │ https://jobguinee.com  │ [📋] │   ║
║  └────────────────────────┴──────┘   ║
║                                        ║
║  ℹ️ Preview optimisé pour Facebook    ║
║     Les infos s'afficheront avec une  ║
║     belle carte visuelle              ║
╚════════════════════════════════════════╝
```

### 3. Preview Facebook

Quand quelqu'un partage sur Facebook, voici ce qui s'affiche:

```
╔════════════════════════════════════════════════╗
║  👤 Mamadou Camara a partagé                  ║
║     Il y a quelques secondes                  ║
╠════════════════════════════════════════════════╣
║                                                ║
║  "Superbe opportunité chez SMB-Winning!"      ║
║                                                ║
║  ┌──────────────────────────────────────────┐ ║
║  │                                          │ ║
║  │  [IMAGE: Logo SMB-Winning ou Hero GIF]  │ ║
║  │         1200 x 630 pixels                │ ║
║  │                                          │ ║
║  ├──────────────────────────────────────────┤ ║
║  │ JOBGUINEE.COM                            │ ║
║  │                                          │ ║
║  │ 💼 Développeur Full Stack                │ ║
║  │                                          │ ║
║  │ CDI à Conakry - SMB-Winning             │ ║
║  │ Rejoignez une équipe dynamique...       │ ║
║  │                                          │ ║
║  │ [Postuler maintenant →]                 │ ║
║  └──────────────────────────────────────────┘ ║
║                                                ║
║  [👍 J'aime] [💬 Commenter] [↗️ Partager]     ║
╚════════════════════════════════════════════════╝
```

---

## Meta Tags Générés

Pour chaque offre partagée, le système génère automatiquement ces meta tags:

```html
<!-- Open Graph (Facebook, LinkedIn) -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="JobGuinée">
<meta property="og:title" content="Développeur Full Stack">
<meta property="og:description" content="CDI à Conakry - SMB-Winning. Rejoignez une équipe dynamique...">
<meta property="og:url" content="https://jobguinee.com/job/abc123">
<meta property="og:image" content="https://jobguinee.com/companies/smb-logo.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="fr_GN">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Développeur Full Stack">
<meta name="twitter:description" content="CDI à Conakry - SMB-Winning">
<meta name="twitter:image" content="https://jobguinee.com/companies/smb-logo.png">
```

---

## Test en Production

### Étape 1: Publier une offre

1. Connectez-vous en tant que recruteur
2. Publiez une offre d'emploi avec tous les détails
3. Assurez-vous que le logo de l'entreprise est bien téléchargé

### Étape 2: Tester le partage

1. Allez sur la page d'accueil
2. Cliquez sur le bouton "Partager" d'une offre
3. Sélectionnez "Facebook"
4. Vérifiez que le preview s'affiche correctement

### Étape 3: Valider avec Facebook Debugger

1. Ouvrez: https://developers.facebook.com/tools/debug/
2. Entrez l'URL de votre offre: `https://jobguinee.com/job/[ID]`
3. Cliquez sur "Debug"
4. Vérifiez les résultats:

```
✅ Title: [Titre de l'offre]
✅ Description: [Description courte]
✅ Image: [URL de l'image, 1200x630]
✅ Type: article
✅ Locale: fr_GN
```

5. Si nécessaire, cliquez sur "Scrape Again" pour forcer la mise à jour

---

## Exemples de Partage

### 📘 Facebook
```
👤 Aïssatou Diallo
Il y a 5 minutes

"Excellente opportunité dans les mines ! 💎"

┌─────────────────────────────────────┐
│ [Image: Logo WCS Mining]            │
├─────────────────────────────────────┤
│ JOBGUINEE.COM                       │
│                                     │
│ Ingénieur Géologue - WCS Mining    │
│                                     │
│ CDI à Boké • Expérience: 3-5 ans   │
│ Salaire attractif + avantages      │
└─────────────────────────────────────┘

[👍 25 J'aime] [💬 12 Commentaires] [↗️ 8 Partages]
```

### 💼 LinkedIn
```
Mamadou Camara • Ingénieur Informatique
Il y a 1 heure

Superbe poste en tech à Conakry ! 🚀

┌──────────────────────────────────────┐
│ [Image: Logo Orange Guinée]          │
├──────────────────────────────────────┤
│ Chef de Projet Digital               │
│ jobguinee.com                        │
│                                      │
│ Orange Guinée recrute un Chef de... │
└──────────────────────────────────────┘

[👍 Recommander] [💬 Commenter] [↗️ Partager]
```

### 🐦 Twitter / X
```
@FatoumataBah
Il y a 2h

Excellente opportunité en finance ! 💰

#JobGuinée #EmploiGuinée #Finance

┌──────────────────────────────────────┐
│ [Image: Miniature]                   │
│                                      │
│ Comptable Senior - CBG              │
│ jobguinee.com                       │
└──────────────────────────────────────┘

[💬 5] [🔄 12] [❤️ 28] [📊 1.2K vues]
```

### 💬 WhatsApp
```
📱 Message WhatsApp:

*Ingénieur Informatique*

🏢 Total Energies Guinée
📍 Conakry
💼 CDI
💰 Salaire compétitif

Postulez maintenant sur JobGuinée:
https://jobguinee.com/job/xyz789

[Lien avec preview de l'image]
```

---

## Checklist de Vérification

Avant de partager en production, assurez-vous que:

### ✅ Images
- [ ] Le logo de l'entreprise est en haute résolution (min 400x400)
- [ ] L'image fait au moins 1200x630 pixels
- [ ] Le format est JPG ou PNG
- [ ] Le poids est inférieur à 5 MB
- [ ] L'image est accessible publiquement (pas de 404)

### ✅ Meta Tags
- [ ] og:title est présent et descriptif
- [ ] og:description est présent (max 160 caractères)
- [ ] og:image pointe vers une URL absolue
- [ ] og:url est l'URL canonique de la page
- [ ] og:type est "article" pour les offres

### ✅ Tests
- [ ] Testé avec Facebook Sharing Debugger
- [ ] Testé sur mobile et desktop
- [ ] Vérifié que l'image s'affiche correctement
- [ ] Vérifié que le texte est lisible
- [ ] Testé le clic sur la preview (redirection correcte)

---

## Troubleshooting

### L'image ne s'affiche pas sur Facebook

**Causes possibles:**
1. L'URL de l'image n'est pas absolue
2. L'image n'est pas accessible publiquement
3. L'image est trop petite (< 200x200)
4. Le serveur bloque le crawler Facebook

**Solutions:**
```typescript
// ❌ Mauvais - URL relative
image: '/logo.png'

// ✅ Bon - URL absolue
image: 'https://jobguinee.com/assets/logo.png'
```

### Le titre ou la description ne se met pas à jour

**Solution:**
1. Allez sur Facebook Sharing Debugger
2. Entrez l'URL
3. Cliquez sur "Scrape Again"
4. Attendez quelques minutes

### Le preview est générique

**Cause:** Les meta tags ne sont pas présents dans le HTML

**Solution:**
```typescript
// Assurez-vous d'utiliser le hook
import { useJobMetaTags } from '../hooks/useJobMetaTags';

function JobDetail({ job }) {
  useJobMetaTags(job); // ✅ Important!
  // ...
}
```

---

## Métriques de Succès

Suivez ces métriques pour mesurer l'impact du partage social:

### KPIs Principaux
- **Taux de partage:** % d'utilisateurs qui partagent une offre
- **Clics depuis les réseaux sociaux:** Trafic entrant depuis Facebook, LinkedIn, etc.
- **Conversions:** Candidatures suite à un partage
- **Engagement:** Likes, commentaires, re-partages

### Objectifs
- 🎯 5% des visiteurs partagent au moins une offre
- 🎯 20% du trafic provient des réseaux sociaux
- 🎯 15% des candidatures proviennent de partages

---

## Support et Ressources

### Documentation
- [Guide complet du système de partage](./SOCIAL_SHARE_DOCUMENTATION.md)
- [Facebook Open Graph Protocol](https://ogp.me/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards)

### Outils
- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [Meta Tags Preview](https://metatags.io/)

### Contact
Pour toute question sur le système de partage, consultez d'abord cette documentation puis testez avec les outils officiels.

---

**Version:** 1.0.0
**Dernière mise à jour:** 7 janvier 2026
**Auteur:** Équipe Technique JobGuinée
