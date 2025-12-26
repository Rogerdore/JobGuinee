# GUIDE ADMINISTRATEUR SEO - JOBGUINÉE
**Système SEO Nouvelle Génération - Version 1.0**

Date de création : 26 décembre 2024
Audience : Administrateurs système, Gestionnaires SEO
Niveau : Intermédiaire à Avancé

---

## 📚 TABLE DES MATIÈRES

1. [Vue d'ensemble du système](#vue-densemble)
2. [Accès à l'interface admin](#accès-admin)
3. [Configuration globale SEO](#configuration-globale)
4. [Gestion des pages SEO](#gestion-pages)
5. [Gestion des mots-clés](#gestion-keywords)
6. [Générateur automatique](#générateur-auto)
7. [Sitemap XML](#sitemap)
8. [Contenu IA](#contenu-ia)
9. [Scoring et audit](#scoring-audit)
10. [Maillage interne](#maillage-interne)
11. [Liens externes](#liens-externes)
12. [Quick Wins](#quick-wins)
13. [Analytics](#analytics)
14. [Logs et historique](#logs)
15. [Workflows opérationnels](#workflows)
16. [Dépannage](#dépannage)
17. [Best practices](#best-practices)

---

## 🎯 VUE D'ENSEMBLE DU SYSTÈME {#vue-densemble}

### Architecture 3 Phases

Le système SEO JobGuinée est organisé en 3 phases progressives :

#### **Phase 1 : Fondations (IMPLÉMENTÉ)**
- Configuration SEO globale (site_name, default_title, etc.)
- Génération automatique meta tags
- Sitemap XML dynamique
- Schemas JSON-LD (JobPosting, Person, Course, etc.)
- Gestion manuelle mots-clés

#### **Phase 2 : Automatisation (IMPLÉMENTÉ)**
- Générateur auto pages SEO (jobs, secteurs, villes)
- Templates SEO intelligents
- Tracking positions mots-clés
- Analytics de base

#### **Phase 3 : Intelligence (IMPLÉMENTÉ)**
- Génération contenu IA sémantique
- Scoring avancé pages (0-100)
- Maillage interne intelligent
- Gestion backlinks & netlinking
- Quick Wins automatiques
- Analytics avancées & ROI

### Modules Principaux

```
┌─────────────────────────────────────────┐
│  ADMIN SEO - 12 ONGLETS                 │
├─────────────────────────────────────────┤
│ 1. Configuration   │ 7. IA Contenu     │
│ 2. Pages SEO       │ 8. Scoring        │
│ 3. Mots-clés       │ 9. Maillage       │
│ 4. Générateur      │ 10. Liens Externes│
│ 5. Sitemap         │ 11. Quick Wins    │
│ 6. Analytics       │ 12. Logs          │
└─────────────────────────────────────────┘
```

---

## 🔐 ACCÈS À L'INTERFACE ADMIN {#accès-admin}

### Prérequis
- Compte utilisateur avec `user_type = 'admin'`
- Authentifié sur la plateforme

### URL d'accès
```
https://jobguinee.com/admin
```
Puis navigation : **Admin → SEO Avancé**

### Vérification des permissions
L'accès est protégé par RLS (Row Level Security) :
```sql
-- Toutes les tables SEO ont cette policy
CREATE POLICY "Admins only" ON seo_config
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  ));
```

### Troubleshooting accès
Si l'interface ne s'affiche pas :
1. Vérifier le profil : `SELECT user_type FROM profiles WHERE id = auth.uid();`
2. Résultat doit être : `admin`
3. Sinon, mettre à jour : `UPDATE profiles SET user_type = 'admin' WHERE id = 'USER_ID';`

---

## ⚙️ CONFIGURATION GLOBALE SEO {#configuration-globale}

### Onglet "Configuration"

Paramètres site-wide qui s'appliquent à toutes les pages sans meta spécifique.

#### Champs obligatoires

| Champ | Description | Exemple | Longueur |
|-------|-------------|---------|----------|
| **site_name** | Nom de marque | JobGuinée | 20-40 char |
| **site_tagline** | Slogan | N°1 de l'emploi en Guinée | 30-60 char |
| **default_title** | Titre fallback | JobGuinée - Emploi & Recrutement Guinée | 50-60 char |
| **default_description** | Description fallback | Trouvez votre emploi en Guinée... | 150-160 char |
| **site_url** | URL canonical | https://jobguinee.com | Exact |
| **enable_indexation** | Activer robots | true | Boolean |

#### Champs optionnels (mais recommandés)

| Champ | Description | Format |
|-------|-------------|--------|
| **default_keywords** | Mots-clés par défaut | Array ['emploi guinée', 'job conakry'] |
| **logo_url** | Logo site | URL image PNG/SVG |
| **og_image** | Image Open Graph | URL 1200x630px |
| **twitter_handle** | Compte Twitter | @jobguinee |
| **facebook_page** | Page Facebook | URL complète |
| **linkedin_page** | Page LinkedIn | URL complète |
| **google_analytics_id** | GA4 Measurement ID | G-XXXXXXXXXX |
| **google_site_verification** | Meta Google | Code vérification |
| **robots_txt** | Contenu robots.txt | Texte brut |

#### Procédure de configuration initiale

1. **Accéder à Configuration**
   - Ouvrir Admin SEO
   - Cliquer onglet "Configuration"

2. **Remplir les champs obligatoires**
   - Nom du site : `JobGuinée`
   - Slogan : `Plateforme N°1 de l'emploi en Guinée`
   - Titre par défaut : `JobGuinée - Trouvez votre emploi en Guinée | Offres d'emploi`
   - Description : `Découvrez des milliers d'offres d'emploi en Guinée. Postulez en ligne, créez votre CV avec IA, accédez aux formations. JobGuinée, votre partenaire emploi.`
   - URL : `https://jobguinee.com`

3. **Activer l'indexation**
   - Cocher "Activer l'indexation"
   - **IMPORTANT** : Ne décocher que pour environnements de test

4. **Configurer mots-clés par défaut**
   ```json
   [
     "emploi guinée",
     "job guinée",
     "offre emploi conakry",
     "recrutement guinée",
     "plateforme emploi"
   ]
   ```

5. **Ajouter réseaux sociaux** (optionnel)
   - Twitter : `@jobguinee`
   - Facebook : `https://facebook.com/jobguinee`
   - LinkedIn : `https://linkedin.com/company/jobguinee`

6. **Cliquer "Enregistrer"**
   - Vérifier message de succès
   - Recharger page pour confirmer

#### Impact de la configuration

- **Title & Description** : Utilisés sur pages sans meta spécifique
- **Keywords** : Ajoutés à toutes les pages (complétant keywords spécifiques)
- **Indexation** : Contrôle balise `robots` (noindex si désactivé)
- **OG tags** : Partagés sur réseaux sociaux
- **Google verification** : Nécessaire pour Search Console

---

## 📄 GESTION DES PAGES SEO {#gestion-pages}

### Onglet "Pages SEO"

Liste toutes les pages SEO configurées avec leur meta information.

#### Vue d'ensemble

Tableau affichant :
- **Page** : URL path
- **Type** : job_detail, job_sector, job_city, b2b_page, blog_post, etc.
- **Titre** : Meta title
- **Priorité** : 0.0 à 1.0 (importance sitemap)
- **État** : Actif / Inactif

#### Actions disponibles

- **Actualiser** : Recharger la liste
- **Filtrer** : Par type (à venir)
- **Éditer** : Modifier meta (à venir)
- **Désactiver** : Retirer du sitemap (à venir)

#### Types de pages

| Type | Description | Génération |
|------|-------------|------------|
| `homepage` | Page d'accueil | Manuelle |
| `job_detail` | Fiche emploi individuelle | Auto (par offre) |
| `job_sector` | Page secteur (/jobs?sector=XXX) | Auto (par secteur unique) |
| `job_city` | Page ville (/jobs?location=XXX) | Auto (par ville unique) |
| `b2b_page` | Pages solutions B2B | Manuelle |
| `blog_post` | Articles de blog | Auto (par post) |
| `formation` | Pages formation | Auto (par formation) |
| `cvtheque` | CVthèque | Manuelle |
| `ai_services` | Services IA | Manuelle |

#### Ajouter une page manuellement (via code)

```typescript
import { seoService } from '@/services/seoService';

await seoService.setPageMeta({
  page_path: '/premium-subscribe',
  page_type: 'premium_page',
  title: 'Abonnement Premium JobGuinée - Services IA Illimités',
  description: 'Accédez à tous les services IA : CV générateur, matching, coaching. Dès 50,000 GNF/mois.',
  keywords: ['premium jobguinée', 'abonnement premium', 'services ia emploi'],
  og_title: 'Premium JobGuinée - Services IA',
  og_description: 'CV IA, matching intelligent, coaching carrière illimité.',
  og_type: 'website',
  canonical_url: '/premium-subscribe',
  robots: 'index, follow',
  priority: 0.8,
  change_freq: 'weekly',
  is_active: true
});
```

#### Bonnes pratiques pages

1. **Title**
   - 50-60 caractères optimal
   - Inclure mot-clé principal
   - Format : `[Mot-clé] - [Bénéfice] | JobGuinée`

2. **Description**
   - 155-165 caractères optimal
   - Inclure CTA ("Postulez", "Découvrez")
   - Mots-clés secondaires naturellement intégrés

3. **Keywords**
   - 5-7 keywords maximum par page
   - 1 principal, 3-5 secondaires, 1-2 longue traîne

4. **Priorité sitemap**
   - 1.0 : Homepage, pages B2B critiques
   - 0.8 : Jobs récents, formations populaires
   - 0.6 : Pages secteur/ville
   - 0.4 : Jobs anciens, blog archive

5. **Change frequency**
   - `always` : Jamais (éviter)
   - `hourly` : Pages temps réel
   - `daily` : Jobs, offres
   - `weekly` : Blog, formations
   - `monthly` : Pages statiques
   - `yearly` : CGU, mentions légales

---

## 🔑 GESTION DES MOTS-CLÉS {#gestion-keywords}

### Onglet "Mots-clés"

Suivi et monitoring des mots-clés prioritaires.

#### Vue cartes

Chaque mot-clé affiché sous forme de carte :
- **Keyword** : Le mot-clé exact
- **Type** : primary, secondary, long_tail
- **Target URL** : Page cible
- **Position actuelle** : Ranking Google (si suivi actif)
- **Suivi actif** : Badge vert si tracking activé

#### Ajouter un mot-clé (via base de données)

```sql
INSERT INTO seo_keywords (
  keyword,
  keyword_type,
  target_url,
  search_volume,
  difficulty,
  intent,
  country,
  language,
  is_tracked,
  current_rank,
  target_rank
) VALUES (
  'emploi banque guinée',
  'secondary',
  '/jobs?sector=banque',
  600,
  'medium',
  'transactional',
  'GN',
  'fr',
  true,
  25,
  5
);
```

#### Types de keywords

| Type | Usage | Exemple |
|------|-------|---------|
| **primary** | Keywords stratégiques volume élevé | emploi guinée, job conakry |
| **secondary** | Keywords moyens, niche | emploi banque guinée, recrutement ong |
| **long_tail** | Keywords longue traîne, précis | offre emploi développeur python conakry |

#### Intent mapping

| Intent | Signification | Contenu adapté |
|--------|---------------|----------------|
| **informational** | Cherche info | Guides, articles blog |
| **navigational** | Cherche marque/site | Homepage, pages marque |
| **transactional** | Prêt à agir | Job listings, formulaires |
| **commercial** | Compare solutions | Pages B2B, pricing |

#### Suivi des positions

**Actuellement** : Manuel (mise à jour périodique)

**Procédure manuelle** :
1. Rechercher keyword sur Google Guinée
2. Noter position JobGuinée dans résultats
3. Mettre à jour base :
```sql
UPDATE seo_keywords
SET
  current_rank = 12, -- Position trouvée
  previous_rank = current_rank, -- Sauver ancienne
  last_checked_at = NOW()
WHERE keyword = 'emploi mine guinée';
```

**À venir** : Intégration Google Search Console API

#### Priorités tracking

**Mots-clés à suivre absolument** (Top 20) :
1. emploi guinée
2. job guinée
3. offre d'emploi conakry
4. recrutement guinée
5. emploi conakry
6. cabinet recrutement guinée (B2B)
7. externalisation recrutement guinée (B2B)
8. emploi mine guinée
9. emploi banque guinée
10. emploi ong guinée
... (voir KEYWORD_STRATEGY_GUINEA_AFRICA.md pour liste complète)

---

## 🔄 GÉNÉRATEUR AUTOMATIQUE {#générateur-auto}

### Onglet "Générateur"

Génération automatique des meta tags et schemas pour toutes les pages.

#### Bouton "Générer toutes les pages"

**Ce qu'il fait** :
1. Scanne la base de données
2. Génère meta pour :
   - Toutes les offres d'emploi (jobs table)
   - Tous les secteurs uniques (jobs.sector)
   - Toutes les villes uniques (jobs.location)
   - Tous les articles de blog (cms_content type=blog)
   - Toutes les formations (formations table)
3. Crée/met à jour dans `seo_page_meta`
4. Génère schemas JSON-LD dans `seo_schemas`
5. Enregistre logs dans `seo_generation_logs`

**Durée** : 10-30 secondes selon volume données

#### Résultat attendu

Message de succès affichant :
```
150 pages générées avec succès!
Jobs: 85, Secteurs: 12, Villes: 6, Blog: 30, Formations: 17
```

#### Quand l'utiliser

- **Après ajout masse offres** : Nouvelles offres = nouvelles pages job_detail
- **Nouveaux secteurs/villes** : Première offre dans nouveau secteur/ville
- **Ajout articles blog** : Après publication nouveaux posts
- **Hebdomadaire** : Maintenance routine (actualise meta existants si changements)

#### Génération par type (détail)

##### Jobs (job_detail)
Pour chaque offre dans `jobs` table :
```typescript
{
  page_path: `/job-detail/${job.id}`,
  page_type: 'job_detail',
  title: `${job.title} - ${companyName} à ${job.location} | JobGuinée`,
  description: `Postulez à l'offre ${job.title} chez ${companyName}. ${job.contract_type}. Candidatez sur JobGuinée.`,
  keywords: [
    job.title.toLowerCase(),
    `emploi ${job.location.toLowerCase()}`,
    companyName.toLowerCase(),
    job.sector?.toLowerCase()
  ],
  entity_type: 'job',
  entity_id: job.id,
  priority: 0.8,
  change_freq: 'daily'
}
```

Schema JobPosting automatique avec :
- `title`, `description`, `datePosted`, `validThrough`
- `hiringOrganization` (nom entreprise, logo)
- `jobLocation` (ville, pays)
- `baseSalary` (si renseigné)
- `employmentType` (CDI → FULL_TIME, CDD → TEMPORARY, etc.)

##### Secteurs (job_sector)
Pour chaque secteur unique :
```typescript
{
  page_path: `/jobs?sector=${encodeURIComponent(sector)}`,
  page_type: 'job_sector',
  title: `Emplois ${sector} en Guinée - ${jobCount} Offres | JobGuinée`,
  description: `Découvrez ${jobCount} offres d'emploi ${sector} en Guinée. Postulez en ligne.`,
  keywords: [
    `emploi ${sector.toLowerCase()} guinée`,
    `job ${sector.toLowerCase()}`,
    `recrutement ${sector.toLowerCase()}`
  ],
  priority: 0.7,
  change_freq: 'daily'
}
```

##### Villes (job_city)
Pour chaque ville unique :
```typescript
{
  page_path: `/jobs?location=${encodeURIComponent(city)}`,
  page_type: 'job_city',
  title: `Emplois à ${city} - ${jobCount} Offres | JobGuinée`,
  description: `${jobCount} offres d'emploi à ${city}, Guinée. Trouvez votre emploi à ${city}.`,
  keywords: [
    `emploi ${city.toLowerCase()}`,
    `job ${city.toLowerCase()}`,
    `travail ${city.toLowerCase()}`
  ],
  priority: 0.7,
  change_freq: 'daily'
}
```

#### Logs de génération

Consultables dans onglet "Logs" :
- **Date/heure** : Timestamp génération
- **Type** : all, jobs, sectors, cities, blog, formations
- **Pages créées** : Nombre nouvelles pages
- **Pages mises à jour** : Nombre pages existantes actualisées
- **Pages échouées** : Nombre erreurs
- **Durée** : Temps d'exécution (ms)
- **Statut** : completed, failed, partial
- **Détails** : JSON avec breakdown

---

## 🗺️ SITEMAP XML {#sitemap}

### Onglet "Sitemap"

Gestion du sitemap XML pour soumission Google Search Console.

#### Affichage

**Statistiques** :
- **URLs totales** : Nombre total pages dans sitemap
- **Par type** : Breakdown (jobs: 85, blog: 30, formations: 17, etc.)
- **Dernière génération** : Date/heure dernier build

**Actions** :
- **Actualiser** : Recalculer stats
- **Télécharger sitemap.xml** : Download fichier XML

#### Structure sitemap généré

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://jobguinee.com/</loc>
    <lastmod>2024-12-26</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://jobguinee.com/job-detail/123</loc>
    <lastmod>2024-12-25</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- ... autres URLs ... -->
</urlset>
```

#### Soumission Google Search Console

**Procédure** :

1. **Télécharger sitemap.xml** depuis admin
2. **Uploader à la racine** du site web :
   - Chemin : `https://jobguinee.com/sitemap.xml`
   - Via FTP, cPanel, ou hébergeur

3. **Soumettre à Google** :
   - Accéder [Google Search Console](https://search.google.com/search-console)
   - Propriété : jobguinee.com
   - Menu : Sitemaps
   - "Ajouter un sitemap"
   - URL : `https://jobguinee.com/sitemap.xml`
   - Cliquer "Envoyer"

4. **Vérifier statut** :
   - Attendre 24-48h
   - Statut doit passer : "En attente" → "Réussite"
   - Pages découvertes affichées

#### Fréquence mise à jour

**Automatique** : Sitemap regénéré automatiquement à chaque appel (dynamique)

**Recommandé** : Resoumission Google tous les 7 jours si :
- Ajout > 50 nouvelles pages
- Modifications majeures structure site

#### Troubleshooting sitemap

**Problème** : "Sitemap introuvable (404)"
- **Solution** : Vérifier fichier bien uploadé à racine site
- **Test** : Ouvrir https://jobguinee.com/sitemap.xml dans navigateur

**Problème** : "Erreurs de syntaxe XML"
- **Solution** : Retélécharger depuis admin (source fiable)
- **Validation** : Utiliser https://www.xml-sitemaps.com/validate-xml-sitemap.html

**Problème** : "URLs en erreur 404"
- **Solution** : Pages désactivées ou supprimées restent dans sitemap
- **Action** : Supprimer pages obsolètes de `seo_page_meta` ou mettre `is_active = false`

---

## 🤖 CONTENU IA {#contenu-ia}

### Onglet "IA Contenu"

Génération de contenu SEO optimisé par IA sémantique.

#### Utilisation

1. **Saisir un sujet**
   - Exemples : "Développeur Python", "Emploi mine Boké", "Formation gestion"

2. **Sélectionner type de contenu**
   - Offre d'emploi
   - Page secteur
   - Page ville
   - Article de blog
   - Formation

3. **Cliquer "Générer du contenu"**

#### Résultat généré

**Affichage** :
- **Titre optimisé** : 50-60 caractères, incluant mot-clé principal
- **Description** : 155-165 caractères, CTA intégré
- **Mots-clés (7)** : Principal + secondaires + longue traîne
- **Structure H2 suggérée** : 5-7 sous-titres pour structure article/page
- **Score SEO** : 0-100 (qualité contenu généré)

**Exemple résultat pour "Développeur Python Conakry"** :

```
Titre : Développeur Python à Conakry - Offres d'Emploi 2024 | JobGuinée

Description : Découvrez les meilleures opportunités pour développeurs Python à Conakry. Postulez en ligne, salaires attractifs. Rejoignez JobGuinée aujourd'hui!

Mots-clés :
- développeur python conakry
- emploi développeur guinée
- job programmation conakry
- offre informatique guinée
- recrutement dev python
- python developer guinea
- tech jobs conakry

Structure H2 :
1. Pourquoi devenir développeur Python à Conakry ?
2. Compétences techniques requises en 2024
3. Salaire moyen développeur Python en Guinée
4. Entreprises qui recrutent des développeurs Python
5. Comment postuler sur JobGuinée ?
6. Formations Python disponibles à Conakry

Score SEO : 87/100
```

#### Idées de contenu

**Bouton "Idées de contenu"** :
- Génère 5 suggestions d'articles de blog ou pages
- Basé sur le sujet saisi
- Aide brainstorming éditorial

#### Applications pratiques

1. **Créer articles blog** : Utiliser structure H2 + titre/description
2. **Optimiser pages existantes** : S'inspirer keywords suggérés
3. **Planification éditoriale** : Idées contenu = roadmap blog
4. **A/B testing** : Tester plusieurs versions titres/descriptions

---

## 📊 SCORING ET AUDIT {#scoring-audit}

### Onglet "Scoring"

Audit SEO détaillé page par page avec score 0-100.

#### Utilisation

1. **Saisir URL page**
   - Format : `/job-detail/123` ou `/jobs?sector=IT`

2. **Cliquer "Analyser"**

#### Résultat audit

**Score global** : 0-100
- **< 50** : Critique (rouge)
- **50-70** : Moyen (jaune)
- **70-85** : Bon (vert clair)
- **85-100** : Excellent (vert foncé)

**Scores par catégorie** :
- **Technique** (0-100) : Title, meta, canonical, robots, H1
- **Contenu** (0-100) : Longueur texte, keywords, images alt
- **On-Page** (0-100) : Structure H2-H6, liens internes, formatting
- **Off-Page** (0-100) : Backlinks, autorité domaine (à venir)

**Forces** : Liste éléments bien optimisés (ex: "Title optimal 58 caractères")
**Faiblesses** : Liste éléments à corriger (ex: "Meta description manquante")

**Actions Prioritaires** :
- Classées par criticité (critical, high, medium, low)
- **Impact** : 0-10 (gain SEO attendu)
- **Effort** : 0-10 (temps/difficulté implémentation)
- **Description** : Explication claire action
- **ROI implicite** : Ratio impact/effort

**Exemple action** :
```
Priority: HIGH
Title: Ajouter meta description
Description: Cette page n'a pas de meta description. Ajouter 155-165 caractères incluant le mot-clé principal.
Impact: 8/10
Effort: 2/10
```

#### Statistiques globales

**En haut de l'onglet** :
- **Pages analysées** : Nombre total
- **Score moyen** : Moyenne tous scores
- **Erreurs critiques** : Somme critical issues
- **Avertissements** : Somme high/medium issues

#### Procédure audit complet site

1. **Identifier pages prioritaires** (Top 50) :
   - Homepage
   - Top 10 jobs
   - Pages B2B
   - Pages secteur/ville principales
   - Blog top articles

2. **Auditer une par une** :
   - Saisir URL
   - Noter score + faiblesses
   - Créer todo list corrections

3. **Prioriser corrections** :
   - D'abord : Toutes critical
   - Ensuite : High avec impact > 7
   - Puis : Medium avec effort < 5

4. **Implémenter fixes** :
   - Corriger code/base de données
   - Re-générer pages (Générateur auto)
   - Re-auditer pour vérifier amélioration

5. **Tracker progrès** :
   - Score moyen avant : X
   - Score moyen après : Y
   - Objectif : Score moyen site > 80

---

## 🔗 MAILLAGE INTERNE {#maillage-interne}

### Onglet "Maillage Interne"

Génération intelligente de liens internes pour améliorer SEO.

#### Statistiques globales

- **Liens totaux** : Nombre total liens internes site
- **Liens actifs** : Liens fonctionnels
- **Pages orphelines** : Pages sans aucun lien entrant (CRITIQUE)
- **Score PageRank** : Autorité moyenne pages (algorithme simplifié)

#### Générer suggestions pour une page

1. **Saisir URL page** : `/job-detail/123`
2. **Cliquer "Générer"**
3. **Résultat** : 10 suggestions de liens

**Chaque suggestion affiche** :
- **Score pertinence** : 0-100% (algorithme similarité)
- **Ancre de lien suggérée** : Texte du lien
- **Page cible** : URL vers laquelle pointer
- **Type de lien** : contextual, related, recommended, navigation
- **Raison** : Explication pourquoi ce lien est pertinent

**Exemple suggestion** :
```
Pertinence : 92%
Ancre : Découvrez d'autres emplois dans le secteur IT
Cible : /jobs?sector=IT
Type : related
Raison : Même secteur d'activité, aide utilisateur explorer offres similaires
```

#### Construire réseau complet

**Bouton "Construire le réseau complet"** :
- Scanne toutes les pages SEO
- Génère suggestions de liens pour chacune
- Stocke dans base `seo_internal_links` table
- Durée : 2-5 minutes selon taille site

**Résultat** :
- Réseau de liens optimaux créé
- Réduit pages orphelines
- Améliore distribution PageRank
- Facilite crawl Google

#### Implémentation des liens

**Actuellement** : Manuel
1. Copier suggestions
2. Éditer code pages concernées
3. Ajouter liens HTML avec ancres suggérées

**À venir** : Injection automatique liens via composants dynamiques

#### Best practices maillage

1. **Nombre de liens par page** :
   - Minimum : 3 liens internes
   - Optimal : 5-10 liens contextuels
   - Maximum : 15 liens (éviter dilution)

2. **Placement liens** :
   - Dans le corps du texte (contextual)
   - Section "Voir aussi" / "Articles reliés"
   - Footer navigation (liens site-wide OK)

3. **Ancres de liens** :
   - Descriptives ("Offres emploi IT Conakry" > "Cliquez ici")
   - Naturelles (intégration fluide texte)
   - Variées (éviter ancres identiques)

4. **Pages orphelines** :
   - **Tolérance : 0** (aucune page orpheline acceptable)
   - Lier depuis : Homepage, sitemap HTML, footer, articles connexes

---

## 🌐 LIENS EXTERNES {#liens-externes}

### Onglet "Liens Externes"

Gestion backlinks (liens entrants) et stratégie netlinking.

#### Sous-onglets

##### 1. Backlinks

**Affichage** :
- Liste backlinks actifs pointant vers JobGuinée
- **Source URL** : Page externe avec le lien
- **Target page** : Page JobGuinée ciblée
- **Ancre** : Texte du lien
- **Score qualité** : 0-100
- **DoFollow/NoFollow** : Type de lien
- **Statut** : active, lost, pending

**Profil global** (en haut) :
- Backlinks actifs : Nombre
- Domaines uniques : Nombre sites différents
- DA moyen : Domain Authority moyenne
- Score qualité : 0-100 (santé profil backlinks)

**Ajouter backlink manuellement** :
```sql
INSERT INTO seo_backlinks (
  source_url,
  source_domain,
  target_page,
  anchor_text,
  is_dofollow,
  quality_score,
  status
) VALUES (
  'https://example.com/article-emploi-guinee',
  'example.com',
  '/jobs',
  'JobGuinée - plateforme emploi Guinée',
  true,
  75,
  'active'
);
```

##### 2. Domaines

**Affichage** :
- Liste domaines référents
- **Domain Authority (DA)** : 0-100
- **Spam Score** : 0-100% (toxicité)
- **Total backlinks** : Nombre liens depuis ce domaine
- **Catégorie** : excellent, good, average, poor, toxic

**Objectif** :
- Privilégier domaines DA > 40
- Éviter domaines Spam Score > 60%

##### 3. Opportunités

**Affichage** :
- Sites potentiels pour obtenir backlinks
- **Target site** : Domaine cible
- **Score opportunité** : 0-100 (facilité + impact)
- **Difficulté** : 0-10 (effort obtention)
- **Priorité** : critical, high, medium, low
- **Statut** : identified, contacted, negotiation, acquired, rejected

**Stratégies obtention** :
- Guest posting (articles invités)
- Partenariats (échanges liens)
- Annuaires qualité (répertoires emploi)
- Médias locaux (interviews, communiqués presse)
- Institutions (universités, gouvernement)

##### 4. Liens Toxiques

**Affichage** :
- Backlinks identifiés comme toxiques/spam
- **Toxicity score** : 0-100
- **Raisons** : Liste critères toxicité
  - Spam score domaine élevé
  - Anchor text sur-optimisé
  - Site adult/gambling/pharmacy
  - Liens massifs automatisés

**Action désaveu** :
- **Bouton "Télécharger Disavow File"**
- Génère fichier `disavow.txt` format Google
- Contenu :
```
# Disavow file for jobguinee.com
# Generated on 2024-12-26

domain:badspamsite.com
domain:anotherspamsite.net
https://shadysite.org/page-with-toxic-link
```

**Soumettre à Google** :
1. Accéder [Disavow Tool](https://search.google.com/search-console/disavow-links)
2. Sélectionner propriété jobguinee.com
3. Uploader disavow.txt
4. Confirmer désaveu

---

## ⚡ QUICK WINS {#quick-wins}

### Onglet "Quick Wins"

Actions SEO à fort ROI (impact élevé, effort faible).

#### Affichage

Liste d'opportunités triées par **Score ROI** = Impact / Effort

**Chaque quick win affiche** :
- **ROI** : Ratio calculé (ex: 8.5 = très élevé)
- **Titre** : Nom action claire
- **Description** : Explication détaillée
- **Priorité** : critical, high, medium, low
- **Impact** : 0-10 (gain SEO attendu)
- **Effort** : 0-10 (temps implémentation)

#### Exemples quick wins typiques

1. **Ajouter meta descriptions manquantes**
   - Impact : 8/10
   - Effort : 2/10
   - ROI : 4.0

2. **Optimiser titres trop courts (<50 car)**
   - Impact : 7/10
   - Effort : 2/10
   - ROI : 3.5

3. **Ajouter alt text images sans alt**
   - Impact : 6/10
   - Effort : 3/10
   - ROI : 2.0

4. **Lier pages orphelines**
   - Impact : 9/10
   - Effort : 3/10
   - ROI : 3.0

5. **Activer URLs canoniques**
   - Impact : 10/10
   - Effort : 1/10
   - ROI : 10.0 (PRIORITÉ ABSOLUE)

#### Procédure quick wins

1. **Lancer détection** :
   - Ouvrir onglet Quick Wins
   - Cliquer "Actualiser"
   - Système scanne site

2. **Trier par ROI** :
   - Déjà trié automatiquement
   - Focus top 5 (ROI le plus élevé)

3. **Implémenter** :
   - Commencer par ROI > 5.0
   - Corriger immédiatement (effort faible)
   - Re-scanner pour vérifier disparition

4. **Mesurer impact** :
   - Noter score SEO moyen avant
   - Implémenter quick wins
   - Attendre 7 jours
   - Vérifier amélioration scores

#### Fréquence

**Recommandé** : Vérifier quick wins **hebdomadairement**
- Nouvelles pages = nouvelles opportunités
- Maintenance continue = SEO optimal

---

## 📈 ANALYTICS {#analytics}

### Onglet "Analytics"

Dashboard SEO complet avec métriques temps réel et ROI.

#### Sélecteur période

**Périodes disponibles** :
- 7 derniers jours
- 30 derniers jours (défaut)
- 90 derniers jours

#### Visibilité & Trafic SEO

**Métriques affichées** :
- **Sessions Organiques** : Visites depuis Google
  - Évolution : +X% vs période précédente
- **Impressions** : Affichages dans résultats Google
  - Évolution : +X%
- **Clics SEO** : Clics depuis Google
  - Évolution : +X%
- **CTR Moyen** : Taux de clic (clics/impressions)
  - Évolution : +X pts
- **Position Moyenne** : Ranking moyen tous mots-clés
  - Évolution : -X (négatif = amélioration)
- **Pages Indexées** : Pages dans index Google
  - Évolution : +X pages

#### Conversions & ROI

**Métriques affichées** :
- **Candidatures (SEO)** : Applications depuis trafic organique
  - Sur total : X sur Y
  - Évolution : +X%
- **Leads B2B (SEO)** : Leads entreprises depuis SEO
  - Sur total : X sur Y
  - Évolution : +X%
- **Upgrades Premium** : Souscriptions Premium depuis SEO
- **Taux Conversion** : % visiteurs SEO qui convertissent
  - Évolution : +X pts

#### ROI & Revenus SEO (Mensuel)

**Métriques affichées** :
- **Investissement SEO** : Coûts mensuels (salaires, outils)
  - Défaut : 2,000,000 GNF/mois
- **Revenus SEO** : Revenus générés par trafic organique
  - B2B : Leads × valeur client × taux closing
  - Premium : Abonnements attribués SEO
- **ROI** : Ratio revenus/investissement
  - >3:1 = Excellent
  - 2-3:1 = Bon
  - <2:1 = À améliorer
- **Coût par Lead** : Investissement / nombre leads

#### Top 10 Mots-Clés

**Affichage** :
- Keyword
- Position actuelle (#X)
- Évolution (badges +X ou -X)
- Impressions, Clics, CTR

**Indicateurs évolution** :
- Badge vert : Position améliorée
- Badge rouge : Position dégradée
- Pas de badge : Position stable

#### Top 10 Pages

**Affichage** :
- URL page
- Type page (badge)
- Score SEO (/100)
- Sessions, Taux rebond, Taux conversion

#### Sources de Trafic

**Graphique barres** :
- Organic Search (bleu) : 35% typiquement
- Direct (gris) : 25%
- Social (violet) : 15%
- Referral (vert) : 15%
- Email (orange) : 10%

**Objectif SEO** : Organic Search > 30%

#### Prochaines Étapes

**Actions recommandées** :
1. Connecter Google Search Console (données réelles)
2. Configurer Google Analytics 4 (tracking précis)
3. Activer événements (mesure ROI exact)

#### Limitation actuelle

**IMPORTANT** : Les données affichées sont actuellement **simulées** (mockées) car :
- Google Search Console pas encore connecté
- Google Analytics 4 pas encore configuré

**Pour activer données réelles** :
1. Créer compte Google Search Console
2. Vérifier propriété jobguinee.com
3. Intégrer API Search Console (dev requis)
4. Créer propriété Google Analytics 4
5. Installer tracking code (gtag.js)
6. Configurer événements conversions

---

## 📜 LOGS ET HISTORIQUE {#logs}

### Onglet "Logs"

Historique toutes les générations SEO automatiques.

#### Affichage

**Liste chronologique** (plus récent d'abord) :
- **Type génération** : all, jobs, sectors, cities, blog, formations
- **Date/heure** : Timestamp précis
- **Statut** : completed, failed, partial
- **Pages créées** : Nombre nouvelles pages
- **Pages mises à jour** : Nombre pages modifiées
- **Pages échouées** : Nombre erreurs
- **Durée** : Temps exécution (secondes)

#### Utilité

1. **Débogage** : Identifier générations échouées
2. **Audit** : Tracer qui a lancé quoi et quand
3. **Performance** : Vérifier temps exécution acceptable
4. **Statistiques** : Tendances volume pages générées

#### Détails d'un log

Cliquer sur un log (à venir) affiche JSON détails :
```json
{
  "jobs": {
    "total": 85,
    "created": 12,
    "updated": 73,
    "failed": 0
  },
  "sectors": {
    "total": 12,
    "created": 2,
    "updated": 10,
    "failed": 0
  },
  "cities": {
    "total": 6,
    "created": 0,
    "updated": 6,
    "failed": 0
  }
}
```

#### Rétention logs

**Actuellement** : Tous les logs conservés indéfiniment

**Recommandé** : Purger logs > 90 jours (maintenance périodique)

---

## 🔄 WORKFLOWS OPÉRATIONNELS {#workflows}

### Workflow hebdomadaire

**Lundi (15 min)** :
1. Ouvrir Admin SEO → Analytics
2. Noter métriques clés (sessions, conversions, ROI)
3. Identifier tendances (↗️ ou ↘️)

**Mercredi (30 min)** :
1. Onglet Quick Wins
2. Implémenter top 3 quick wins
3. Vérifier disparition après correction

**Vendredi (20 min)** :
1. Onglet Générateur
2. Lancer génération complète
3. Vérifier logs (aucune erreur)

### Workflow mensuel

**Début de mois (1h)** :
1. Onglet Scoring
2. Auditer 10 pages prioritaires
3. Créer todo list corrections
4. Prioriser par impact/effort

**Mi-mois (1h30)** :
1. Implémenter corrections audit
2. Re-générer pages modifiées
3. Re-auditer pour confirmer amélioration

**Fin de mois (45 min)** :
1. Onglet Analytics
2. Exporter rapport mensuel :
   - Sessions organiques
   - Conversions SEO
   - ROI
   - Top keywords positions
3. Présenter à direction

### Workflow trimestriel

**Trimestre (3h)** :
1. Onglet IA Contenu
2. Générer 10 idées articles blog
3. Rédiger et publier articles
4. Générer meta avec IA

**Trimestre (2h)** :
1. Onglet Mots-clés
2. Ajouter 10 nouveaux keywords stratégiques
3. Tracker positions manuellement (ou API)
4. Ajuster stratégie selon résultats

**Trimestre (2h)** :
1. Onglet Liens Externes
2. Identifier 5 opportunités netlinking
3. Contacter sites pour partenariats/guest posts
4. Suivre acquisition backlinks

---

## 🛠️ DÉPANNAGE {#dépannage}

### Problème : Onglet Admin SEO n'apparaît pas

**Symptôme** : Menu Admin visible, mais pas "SEO Avancé"

**Cause** : Utilisateur pas admin

**Solution** :
```sql
-- Vérifier profil utilisateur
SELECT user_type FROM profiles WHERE id = auth.uid();

-- Si résultat ≠ 'admin', mettre à jour
UPDATE profiles SET user_type = 'admin' WHERE id = 'USER_ID';
```

### Problème : Génération échoue

**Symptôme** : Message erreur lors génération automatique

**Causes possibles** :
1. Base de données inaccessible
2. Trop de données (timeout)
3. Offres d'emploi malformées (champs manquants)

**Solutions** :
1. Vérifier connexion Supabase (env variables)
2. Générer par petits lots (implémenter pagination)
3. Vérifier intégrité données jobs :
```sql
SELECT * FROM jobs
WHERE title IS NULL OR description IS NULL;
```

### Problème : Pages générées n'apparaissent pas

**Symptôme** : Génération réussie, mais pages absentes onglet Pages SEO

**Cause** : `is_active = false` ou filtre actif

**Solution** :
```sql
-- Vérifier pages créées récemment
SELECT * FROM seo_page_meta
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Activer si désactivées
UPDATE seo_page_meta SET is_active = true WHERE is_active = false;
```

### Problème : Scores toujours 0

**Symptôme** : Analytics affiche 0 partout

**Cause** : Données mockées, pas encore réelles

**Solution** :
1. Configurer Google Search Console (voir section Analytics)
2. Intégrer API Search Console
3. Attendre 48h accumulation données

### Problème : Sitemap vide

**Symptôme** : 0 URLs dans sitemap

**Cause** : Aucune page active dans `seo_page_meta`

**Solution** :
1. Générer pages (onglet Générateur)
2. Vérifier pages actives :
```sql
SELECT COUNT(*) FROM seo_page_meta WHERE is_active = true;
```
3. Si 0, lancer génération automatique

### Problème : Quick Wins vides

**Symptôme** : Message "Excellent travail, aucun quick win"

**Interprétation** :
- Soit SEO parfait (peu probable)
- Soit détection ne trouve rien (seuil trop strict)

**Solution** :
- Auditer manuellement pages avec onglet Scoring
- Ajuster seuils détection quick wins (dev requis)

---

## ✅ BEST PRACTICES {#best-practices}

### Configuration

1. **Ne jamais désactiver indexation en production**
   - `enable_indexation = true` toujours
   - Seulement `false` en dev/staging

2. **Remplir tous les champs optionnels**
   - Social tags améliorent partage
   - Google verification nécessaire Search Console

3. **Mettre à jour régulièrement**
   - Revoir default_title/description tous les 6 mois
   - Ajuster selon évolution marque

### Pages SEO

1. **Title unique par page**
   - Jamais dupliquer titles
   - Inclure variation mot-clé

2. **Description unique par page**
   - Personnaliser selon contenu page
   - CTA clair

3. **Keywords pertinents**
   - 5-7 keywords max
   - Éviter keyword stuffing

### Mots-clés

1. **Équilibrer volumes**
   - 30% head keywords (volume élevé, difficile)
   - 50% body keywords (volume moyen, faisable)
   - 20% long tail (volume faible, conversion élevée)

2. **Tracker positions**
   - Top 20 keywords minimum
   - Hebdomadaire ou mensuel

3. **Intent mapping**
   - Matcher intent utilisateur avec contenu
   - Transactional → job listings
   - Informational → blog articles

### Génération

1. **Fréquence**
   - Hebdomadaire si ajout quotidien offres
   - Après chaque batch import
   - Mensuel minimum

2. **Vérification post-génération**
   - Toujours checker logs
   - 0 failed acceptable
   - >10% failed = investiguer

### Contenu IA

1. **Humaniser contenu généré**
   - Ne pas copier-coller brut
   - Adapter ton marque JobGuinée
   - Ajouter exemples locaux

2. **Vérifier qualité**
   - Score >80 = bon
   - Score <60 = régénérer avec sujet plus précis

### Audit & Scoring

1. **Score minimum acceptable : 70/100**
   - Pages stratégiques (B2B, homepage) : >85
   - Pages emploi récentes : >75
   - Blog archive : >65

2. **Prioriser corrections**
   - Critical d'abord (toujours)
   - High avec ROI >5
   - Medium si effort <3

3. **Audit trimestriel complet**
   - Toutes les pages clés
   - Rapport évolution scores

### Maillage interne

1. **Pyramide liens**
   - Homepage link vers catégories principales (5-10 liens)
   - Catégories link vers sous-catégories et pages produit (10-15 liens)
   - Pages produit link vers catégories parentes et pages connexes (5-10 liens)

2. **Ancres naturelles**
   - Éviter sur-optimisation ("emploi guinée" dans toutes les ancres)
   - Varier : marque, URL, descriptif, générique
   - Intégration contextuelle

3. **Mise à jour continue**
   - Nouvelles pages = nouvelles opportunités lien
   - Relancer build réseau tous les 3 mois

### Liens externes

1. **Qualité > quantité**
   - 10 backlinks DA 60+ > 100 backlinks DA 20
   - Viser domaines autorité (gouvernement, éducation, médias)

2. **Diversité ancres**
   - Brand : "JobGuinée"
   - Exact match : "emploi guinée"
   - Partial match : "plateforme emploi Guinée"
   - Generic : "cliquez ici", "en savoir plus"
   - URL naked : "https://jobguinee.com"

3. **Désaveu proactif**
   - Surveiller nouveaux backlinks mensuellement
   - Désavouer spam immédiatement
   - Prévention > correction

### Analytics

1. **Baseline établissement**
   - Semaine 1 : Noter métriques initiales
   - Servira comparaison future

2. **Objectifs SMART**
   - Sessions organiques : +20% /trimestre
   - Conversions SEO : +15% /trimestre
   - ROI : Maintenir >3:1
   - Position moyenne : -5 positions /trimestre (amélioration)

3. **Reporting régulier**
   - Hebdo : KPIs internes
   - Mensuel : Rapport direction
   - Trimestriel : Stratégie ajustements

---

## 📞 SUPPORT & RESSOURCES

### Documentation connexe

- **SEO_AUDIT_REPORT.md** : Méthodologie audit complet
- **SEO_ROADMAP_6_MONTHS.md** : Roadmap implémentation 6 mois
- **KEYWORD_STRATEGY_GUINEA_AFRICA.md** : Stratégie mots-clés détaillée
- **SEO_CONVERSION_STRATEGY.md** : Optimisation conversion B2B/B2C
- **SEO_GLOBAL_ARCHITECTURE.md** : Architecture technique système

### Ressources externes

- [Google Search Central](https://developers.google.com/search) : Documentation officielle Google
- [Schema.org](https://schema.org) : Référence schemas JSON-LD
- [Moz Beginner's Guide to SEO](https://moz.com/beginners-guide-to-seo) : Formation gratuite
- [Ahrefs Blog](https://ahrefs.com/blog) : Best practices SEO
- [Search Engine Journal](https://www.searchenginejournal.com) : Actualités SEO

### Contact équipe technique

**En cas de bugs ou questions techniques** :
- Email : tech@jobguinee.com
- Documentation code : Voir commentaires services SEO (`src/services/seo*.ts`)

---

**Guide créé par : JobGuinée Tech Team**
**Dernière mise à jour : 26 décembre 2024**
**Version : 1.0**

🚀 **Bon SEO!**
