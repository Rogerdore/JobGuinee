# Système SEO Nouvelle Génération - JobGuinée

## Vue d'ensemble

JobGuinée dispose maintenant d'un **système SEO complet et nouvelle génération** conçu pour maximiser la visibilité sur les moteurs de recherche (Google, Bing, etc.) et positionner la plateforme comme leader du recrutement en Guinée et en Afrique de l'Ouest.

### Objectifs du système
- ✅ Classer JobGuinée n°1 sur Google pour les recherches emploi en Guinée
- ✅ Générer automatiquement des pages SEO optimisées
- ✅ Intégrer l'IA pour le SEO sémantique et la génération de contenu
- ✅ Être 100% configurable depuis l'administration
- ✅ Être mesurable et évolutif

---

## Architecture du système

### 1. Base de données (MVB - Minimum Viable Base)

#### **seo_config** - Configuration globale
Table unique contenant la configuration SEO globale du site:
- Meta données par défaut (titre, description, mots-clés)
- URLs canoniques et réseaux sociaux
- Configuration technique (indexation, robots.txt)
- Analytics (Google Analytics, Search Console)

#### **seo_page_meta** - Meta données par page
Stocke les meta données SEO spécifiques pour chaque page/URL:
- Titre et description optimisés
- Mots-clés ciblés
- Open Graph et Twitter Cards
- Configuration avancée (canonical, robots, priorité)
- Relations avec les entités (jobs, profiles, etc.)

#### **seo_schemas** - Données structurées Schema.org
Gère les données structurées pour un meilleur affichage dans les résultats de recherche:
- JobPosting pour les offres d'emploi
- Organization pour l'entreprise
- Person pour les profils candidats
- Article pour les articles de blog
- Course pour les formations
- BreadcrumbList, FAQPage, WebSite

#### **seo_keywords** - Mots-clés suivis
Suivi des performances des mots-clés stratégiques:
- Type (primary, secondary, long_tail)
- Métriques (volume de recherche, position actuelle)
- URLs cibles

---

## Services SEO

### 1. **seoService.ts** - Service principal

#### Fonctionnalités
```typescript
// Récupérer la configuration globale
const config = await seoService.getConfig();

// Mettre à jour la configuration
await seoService.updateConfig({ site_name: 'JobGuinée' });

// Récupérer les meta d'une page
const pageMeta = await seoService.getPageMeta('/jobs');

// Définir les meta d'une page
await seoService.setPageMeta({
  page_path: '/jobs',
  page_type: 'jobs_list',
  title: 'Offres d\'Emploi en Guinée',
  description: 'Trouvez votre emploi idéal...',
  priority: 0.9
});

// Générer automatiquement les meta pour une offre d'emploi
const jobMeta = await seoService.generateJobMeta(job);
await seoService.setPageMeta(jobMeta);

// Mettre à jour le <head> du document
const metaTags = seoService.buildMetaTags(pageMeta, config);
seoService.updateDocumentHead(metaTags);
```

#### Génération automatique
- `generateJobMeta(job)` - Meta pour offres d'emploi
- `generateSectorPageMeta(sector, count)` - Pages par secteur
- `generateCityPageMeta(city, count)` - Pages par ville

### 2. **schemaService.ts** - Données structurées

#### Fonctionnalités
```typescript
// Récupérer les schemas actifs
const schemas = await schemaService.getSchemas('job', jobId);

// Définir un schema
await schemaService.setSchema({
  schema_type: 'JobPosting',
  entity_type: 'job',
  entity_id: jobId,
  schema_json: schemaData
});

// Générer un schema JobPosting
const jobSchema = schemaService.generateJobPostingSchema(job);

// Générer un schema Person
const personSchema = schemaService.generatePersonSchema(profile);

// Générer un schema Course
const courseSchema = schemaService.generateCourseSchema(formation);

// Injecter les schemas dans le <head>
schemaService.injectSchemas(schemas);
```

#### Types de schemas supportés
- **JobPosting** - Offres d'emploi
- **Person** - Profils candidats
- **Organization** - Entreprise/Site
- **Article** - Articles de blog
- **Course** - Formations
- **BreadcrumbList** - Fil d'Ariane
- **FAQPage** - Pages FAQ
- **WebSite** - Site web global

### 3. **useSEO Hook** - Hook React personnalisé

Simplifie l'intégration du SEO dans les composants:

```typescript
function MyPage() {
  const { config, pageMeta, loading } = useSEO({
    pagePath: '/jobs',
    customMeta: {
      title: 'Offres d\'Emploi',
      description: 'Trouvez votre emploi idéal'
    },
    schemas: [jobSchema, organizationSchema]
  });

  if (loading) return <div>Chargement...</div>;

  return <div>...</div>;
}
```

---

## Administration SEO

### Accès
Naviguer vers: **Admin > SEO** (bouton avec icône Globe)

### Onglets disponibles

#### 1. **Configuration**
Gère les paramètres SEO globaux:
- Nom du site et slogan
- Titre et description par défaut
- URL du site
- Comptes réseaux sociaux (Twitter, Facebook, LinkedIn)
- Activation de l'indexation

**Actions:**
- Modifier les paramètres
- Sauvegarder la configuration

#### 2. **Pages SEO**
Liste toutes les pages avec meta données:
- Chemin de la page
- Type de page
- Titre SEO
- Priorité
- État (actif/inactif)

**Actions:**
- Voir toutes les pages indexées
- Actualiser la liste

#### 3. **Mots-clés**
Affiche tous les mots-clés suivis:
- Mot-clé
- Type (primary/secondary/long_tail)
- Position actuelle
- URL cible
- État du suivi

**Actions:**
- Voir les performances
- Ajouter/retirer des mots-clés

#### 4. **Générateur**
Génère automatiquement des pages SEO:

**Pages emplois** ✅
- Génère les meta données pour toutes les offres d'emploi publiées
- Bouton: "Générer les pages emplois"

**Pages secteurs** (À venir)
- Génère des pages optimisées par secteur d'activité

**Pages villes** (À venir)
- Génère des pages optimisées par ville

---

## Utilisation pratique

### 1. Configurer le SEO global

1. Aller dans **Admin > SEO > Configuration**
2. Modifier:
   - Nom du site: `JobGuinée`
   - Slogan: `La plateforme N°1 de l'emploi en Guinée`
   - Titre par défaut
   - Description par défaut
   - URL du site: `https://jobguinee.com`
3. Activer l'indexation
4. Cliquer sur **Enregistrer**

### 2. Générer les pages SEO des emplois

1. Aller dans **Admin > SEO > Générateur**
2. Cliquer sur **Générer les pages emplois**
3. Attendre la confirmation
4. Vérifier dans l'onglet **Pages SEO**

Cela crée automatiquement:
- Meta title optimisé pour chaque offre
- Meta description avec infos clés
- Mots-clés pertinents
- Données structurées JobPosting

### 3. Ajouter une page SEO manuellement

```typescript
// Dans votre code
await seoService.setPageMeta({
  page_path: '/cvtheque',
  page_type: 'static',
  title: 'CVthèque - Base de CV en Guinée | JobGuinée',
  description: 'Accédez à la plus grande base de CV en Guinée...',
  keywords: ['cv guinée', 'cvtheque', 'recrutement'],
  priority: 0.8,
  change_freq: 'weekly',
  is_active: true
});
```

### 4. Utiliser le SEO dans une page

```typescript
import { useSEO } from '../hooks/useSEO';

export default function Jobs() {
  useSEO({
    pagePath: '/jobs'
  });

  return (
    <div>
      {/* Votre contenu */}
    </div>
  );
}
```

Les meta tags sont automatiquement injectés dans le `<head>`.

---

## Mots-clés stratégiques

### Mots-clés principaux (Primary)
- `emploi guinée`
- `recrutement guinée`
- `offre emploi conakry`
- `job guinée`

### Mots-clés secondaires
- `cv guinée`
- `formation professionnelle guinée`

### À développer
- `stage guinée`
- `emploi [secteur] guinée`
- `emploi [ville]`
- `salaire [métier] guinée`

---

## Données structurées Schema.org

### Avantages
- Rich Snippets dans les résultats Google
- Meilleur CTR (taux de clics)
- Position zéro sur Google
- Affichage optimisé des offres d'emploi

### Implémentation automatique

**Pour une offre d'emploi:**
```typescript
const jobSchema = schemaService.generateJobPostingSchema(job);
await schemaService.setSchema({
  schema_type: 'JobPosting',
  entity_type: 'job',
  entity_id: job.id,
  schema_json: jobSchema,
  is_active: true
});
```

**Résultat dans Google:**
```
Titre de l'offre
Entreprise - Ville
💼 CDI | 📍 Conakry | 💰 Salaire négociable
Description...
```

---

## Sitemap.xml (À venir)

### Structure prévue
```
https://jobguinee.com/sitemap.xml
├── /
├── /jobs
│   ├── /job-detail/[id]
│   ├── /jobs?sector=[sector]
│   └── /jobs?location=[city]
├── /formations
├── /blog
│   └── /blog/[slug]
└── /cvtheque
```

### Génération automatique
- Mise à jour quotidienne
- Priorisation intelligente
- Change frequency adaptatif

---

## Robots.txt

Configuration par défaut:
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Sitemap: https://jobguinee.com/sitemap.xml
```

Modifiable depuis **Admin > SEO > Configuration**.

---

## Performances SEO

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

### Optimisations techniques
- Lazy loading des images
- Compression WebP/AVIF
- Cache intelligent
- Meta tags dynamiques
- URLs propres

---

## Roadmap SEO

### Phase 1 - MVB ✅ (Complété)
- [x] Structure de base de données
- [x] Services SEO (meta, schema)
- [x] Interface admin
- [x] Génération automatique pages emplois
- [x] Hook React useSEO

### Phase 2 - Extension (En cours)
- [ ] Générateur de sitemap dynamique
- [ ] Pages secteurs automatiques
- [ ] Pages villes automatiques
- [ ] Monitoring des positions

### Phase 3 - IA & Sémantique (À venir)
- [ ] SEO Semantic Engine avec IA
- [ ] Génération de contenu IA
- [ ] Suggestions automatiques de mots-clés
- [ ] Analyse sémantique des contenus

### Phase 4 - Avancé (À venir)
- [ ] Maillage interne intelligent
- [ ] A/B testing des meta tags
- [ ] Analytics SEO avancés
- [ ] Intégration Google Search Console

---

## Bonnes pratiques

### 1. Titre SEO
- Longueur: 50-60 caractères
- Inclure le mot-clé principal
- Ajouter "| JobGuinée" à la fin
- Être descriptif et accrocheur

Exemple:
```
Offre d'emploi Développeur Web à Conakry | JobGuinée
```

### 2. Description SEO
- Longueur: 150-160 caractères
- Inclure les mots-clés principaux
- Appel à l'action
- Informations clés

Exemple:
```
Postulez à l'offre Développeur Web chez TechCorp à Conakry. CDI, 3 ans d'expérience. Candidatez en ligne sur JobGuinée, la plateforme N°1 de l'emploi en Guinée.
```

### 3. Mots-clés
- 3-7 mots-clés par page
- Mix de génériques et long-tail
- Pertinents au contenu
- Inclure "guinée" ou ville

### 4. URLs
- Courtes et descriptives
- Utiliser des tirets `-`
- Pas de caractères spéciaux
- Inclure mot-clé principal

Exemples:
```
✅ /jobs/developpeur-web-conakry
✅ /emploi-informatique-guinee
❌ /jobs?id=12345&ref=abc
❌ /emploi_développeur_conakry
```

---

## Suivi des performances

### Métriques clés
1. **Positions Google** - Suivre les mots-clés prioritaires
2. **Trafic organique** - Google Analytics
3. **Taux de clics (CTR)** - Google Search Console
4. **Impressions** - Visibilité dans les résultats
5. **Pages indexées** - Couverture du site

### Outils recommandés
- Google Search Console
- Google Analytics
- Bing Webmaster Tools
- Screaming Frog (audit technique)

---

## Support et maintenance

### Vérifications régulières
- **Quotidien**: Génération automatique pages emplois
- **Hebdomadaire**: Vérifier pages indexées
- **Mensuel**: Analyser performances mots-clés
- **Trimestriel**: Audit SEO complet

### Points d'attention
- URLs cassées (404)
- Contenu dupliqué
- Meta tags manquants
- Schemas invalides
- Vitesse de chargement

---

## FAQ

### Comment ajouter un nouveau mot-clé?
Actuellement en base de données. Interface admin à venir.

### Les pages sont-elles générées automatiquement?
Oui pour les offres d'emploi. Secteurs et villes en développement.

### Puis-je modifier les meta d'une page spécifique?
Oui, via l'interface admin ou directement en base.

### Le sitemap est-il automatique?
En développement. Pour l'instant, géré manuellement.

### Comment vérifier l'indexation Google?
- Google Search Console
- Recherche `site:jobguinee.com` sur Google

---

## Résumé

JobGuinée dispose maintenant d'un **système SEO professionnel et évolutif** qui:

✅ Génère automatiquement des pages optimisées
✅ Injecte les meta tags et schemas nécessaires
✅ Est 100% administrable via interface
✅ Suit les meilleures pratiques SEO 2024
✅ Est prêt pour l'intégration IA

Le système est opérationnel et en production. Les prochaines phases ajouteront des fonctionnalités avancées (sitemap automatique, IA sémantique, monitoring).

---

**Documentation créée le:** 15 décembre 2024
**Version:** 1.0 (MVB)
**Auteur:** Système SEO JobGuinée
