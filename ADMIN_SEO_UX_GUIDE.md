# Guide Administrateur - Centre de Pilotage SEO Phase 2

## Vue d'ensemble

Le **Centre de Pilotage SEO** de JobGuinée est votre tableau de bord stratégique pour dominer le référencement RH en Guinée et en Afrique. Il intègre les modules Phase 2 (Core Web Vitals, Marketplace, CVthèque, B2B) et prépare la Phase 3 (IA sémantique, scoring avancé).

---

## ONGLETS PHASE 2 (ACTIFS)

### 1. Vue Globale

**Accès** : Premier onglet par défaut

**Objectif** : Avoir une vision stratégique instantanée de votre SEO

**Indicateurs affichés** :
- **Pages SEO Totales** : Nombre total de pages indexables créées (actives/inactives)
- **LCP Moyen** : Temps de chargement moyen (Core Web Vitals) - Cible < 2.5s
- **Alertes Actives** : Nombre d'alertes performance non résolues
- **Score SEO Moyen** : Score général calculé sur toutes les pages

**Actions rapides** :
- Accès direct aux modules Marketplace, CVthèque et B2B
- Consultation des 5 dernières alertes critiques
- Visualisation de l'état global de santé SEO

---

### 2. SEO Marketplace Emploi

**Accès** : Onglet "SEO Marketplace"

**Objectif** : Générer et gérer automatiquement les landing pages SEO pour emplois

**Fonctionnalités** :

#### a) Génération automatique
Cliquez sur **"Générer les pages"** pour créer automatiquement :
- Pages par **métier** (ex: `/emplois/developpeur`)
- Pages par **secteur** (ex: `/emplois/secteur/tech`)
- Pages par **ville** (ex: `/emplois/ville/conakry`)
- Pages par **niveau** (ex: `/emplois/niveau/junior`)

Le système :
- Analyse automatiquement les offres d'emploi actives
- Identifie les métiers, secteurs et villes les plus populaires
- Génère des meta tags optimisés
- Crée des schema.org JobPosting
- Configure les canonical URLs

#### b) Gestion des pages
- **Recherche** : Filtrez par nom de page
- **Filtres** : Tous / Métier / Secteur / Ville / Niveau
- **Activation/Désactivation** : Contrôlez la visibilité de chaque page
- **Statistiques** : Consultez le nombre d'offres et de vues par page

#### c) Tableau de bord
Colonnes :
- **Page** : Titre et slug de la page
- **Type** : Badge indiquant le type (métier/secteur/ville/niveau)
- **Offres** : Nombre d'offres d'emploi correspondantes
- **Vues** : Nombre de visites de la page
- **Statut** : Active (indexée) / Inactive (non indexée)
- **Actions** : Activer / Désactiver

---

### 3. Performance & Core Web Vitals

**Accès** : Onglet "Performance & Mobile"

**Objectif** : Monitorer en temps réel les performances de vos pages

**Métriques collectées** (via RUM - Real User Monitoring) :

#### Core Web Vitals (Google)
- **LCP (Largest Contentful Paint)** : Temps de chargement du contenu principal
  - 🟢 Bon : < 2.5s
  - 🟠 Moyen : 2.5s - 4s
  - 🔴 Mauvais : > 4s

- **CLS (Cumulative Layout Shift)** : Stabilité visuelle
  - 🟢 Bon : < 0.1
  - 🟠 Moyen : 0.1 - 0.25
  - 🔴 Mauvais : > 0.25

- **INP (Interaction to Next Paint)** : Réactivité aux interactions
  - 🟢 Bon : < 200ms
  - 🟠 Moyen : 200ms - 500ms
  - 🔴 Mauvais : > 500ms

- **TTFB (Time to First Byte)** : Temps de réponse serveur
- **FCP (First Contentful Paint)** : Temps d'affichage du premier contenu

#### Périodes d'analyse
Sélectionnez :
- Dernière heure
- Dernières 24h
- 7 derniers jours
- 30 derniers jours

#### Alertes Performance
Le système crée automatiquement des alertes lorsqu'une page :
- Dépasse les seuils CWV (LCP > 4s, CLS > 0.25, INP > 500ms)
- A un score mobile < 50
- Présente des problèmes critiques

**Actions** :
- Résolvez une alerte en cliquant sur "Résoudre"
- Les alertes résolues sont archivées pour historique

#### Scores Mobile
Consultez les scores mobile-friendly de vos pages principales :
- **Score Mobile Global** : /100
- **Performance** : Vitesse de chargement mobile
- **Accessibilité** : Conformité WCAG

---

### 4. Configuration

**Accès** : Onglet "Configuration"

**Objectif** : Paramétrer les réglages SEO globaux

**Paramètres configurables** :
- **Site Title** : Titre général du site
- **Site Description** : Description META globale
- **Default Keywords** : Mots-clés par défaut
- **Canonical Domain** : Domaine canonique (https://jobguinee.com)
- **Language** : Langue principale (FR/EN)
- **Robots** : index/noindex - follow/nofollow
- **OG Image** : Image OpenGraph par défaut
- **Twitter Card Type** : Type de carte Twitter
- **Google Analytics ID** : ID GA4
- **Google Search Console** : Code de vérification
- **Structured Data** : Configuration schema.org

**Bouton** : "Enregistrer la configuration"

---

### 5. Pages & Métadonnées

**Accès** : Onglet "Pages & Méta"

**Objectif** : Gérer les métadonnées de toutes vos pages

**Liste des pages** :
- Pages emplois
- Pages formations
- Pages CVthèque
- Pages B2B
- Pages statiques

**Actions par page** :
- **Éditer** : Modifier Title, Description, Keywords, Slug
- **Aperçu SERP Google** : Prévisualiser l'affichage dans les résultats
- **Canonical URL** : Définir l'URL canonique
- **Langues** : Gérer les versions FR/EN
- **Status** : Activer/Désactiver l'indexation

---

## ONGLETS PHASE 3 (PRÉPARATION)

### 6. IA Contenu

**Badge** : "Phase 3"

**Objectif futur** : Générer automatiquement du contenu SEO avec validation admin

**Fonctionnalités planifiées** :
- Suggestions IA de titles et meta descriptions
- Génération de contenu RH (guides, articles)
- Optimisation sémantique des textes existants
- **Validation manuelle obligatoire** avant publication

---

### 7. Scoring SEO

**Badge** : "Phase 3"

**Objectif futur** : Évaluer et améliorer le score SEO de chaque page

**Fonctionnalités planifiées** :
- Score SEO détaillé par page (/100)
- Analyse technique (title, meta, H1, images alt, etc.)
- Analyse sémantique (mots-clés, LSI, TF-IDF)
- Recommandations d'amélioration priorisées
- Historique des scores

---

### 8. Maillage Interne

**Badge** : "Phase 3"

**Objectif futur** : Optimiser les liens internes automatiquement

**Fonctionnalités planifiées** :
- Analyse du maillage interne actuel
- Suggestions de liens internes pertinents
- Équilibrage du PageRank interne
- Détection des pages orphelines

---

### 9. Liens Externes

**Badge** : "Phase 3"

**Objectif futur** : Gérer et auditer les liens externes

**Fonctionnalités planifiées** :
- Audit des backlinks
- Détection des liens brisés
- Analyse des domaines référents
- Score d'autorité de domaine

---

### 10. Quick Wins

**Badge** : "Phase 3"

**Objectif futur** : Actions SEO à fort impact, rapides à implémenter

**Fonctionnalités planifiées** :
- Liste des optimisations simples à réaliser
- Priorisation par impact/effort
- One-click fixes pour corrections automatiques
- Suivi des quick wins réalisés

---

## ONGLETS EXISTANTS (PHASE 1)

### 11. Mots-clés

**Objectif** : Suivre les mots-clés stratégiques

**Fonctionnalités** :
- Liste des mots-clés trackés
- Volume de recherche
- Difficulté SEO
- Position actuelle
- Type (principal/secondaire/longue traîne)

---

### 12. Générateur

**Objectif** : Générer en masse les pages SEO

**Bouton** : "Générer toutes les pages"
- Lance la génération pour jobs, secteurs, villes
- Log des générations dans l'onglet "Logs"

---

### 13. Sitemap

**Objectif** : Gérer le sitemap XML

**Fonctionnalités** :
- Statistiques du sitemap (nombre d'URLs, pages actives)
- Bouton "Télécharger le sitemap"
- Dernière génération
- Soumission automatique à Google Search Console (à configurer)

---

### 14. Analytics

**Objectif** : Consulter les statistiques SEO

**Fonctionnalités** :
- Trafic organique
- Pages les plus visitées
- Requêtes populaires
- Taux de clic (CTR)
- Position moyenne

---

### 15. Logs

**Objectif** : Historique des opérations SEO

**Informations affichées** :
- Type de génération (all/jobs/sectors/cities)
- Nombre de pages créées/mises à jour/échouées
- Durée de l'opération
- Utilisateur déclencheur
- Statut (completed/failed)
- Date et heure

---

## WORKFLOW RECOMMANDÉ

### 1. Configuration Initiale
1. **Configuration** : Paramétrez votre domaine, GA, etc.
2. **Mots-clés** : Ajoutez vos mots-clés cibles
3. **Générateur** : Lancez la première génération de pages

### 2. Monitoring Quotidien
1. **Vue Globale** : Consultez les indicateurs clés
2. **Performance** : Vérifiez les alertes CWV
3. **Marketplace** : Activez/désactivez des pages selon les besoins

### 3. Optimisation Hebdomadaire
1. **Analytics** : Analysez les performances
2. **Pages & Méta** : Optimisez les meta tags des meilleures pages
3. **Logs** : Vérifiez les générations automatiques

### 4. Stratégie Mensuelle
1. **Vue Globale** : Évaluez les tendances sur 30 jours
2. **Marketplace** : Régénérez les pages pour intégrer nouvelles offres
3. **Performance** : Résolvez toutes les alertes critiques
4. **Sitemap** : Vérifiez l'indexation Google Search Console

---

## BONNES PRATIQUES

### ✅ À FAIRE
- **Régénérer les pages Marketplace** chaque semaine (nouvelles offres)
- **Résoudre les alertes Performance** dès leur apparition
- **Activer progressivement** les pages SEO (éviter pic de contenu)
- **Tester sur mobile** avant d'activer une page
- **Suivre les Core Web Vitals** pour détecter les régressions
- **Valider manuellement** tout contenu IA (Phase 3)

### ❌ À ÉVITER
- Ne jamais activer toutes les pages d'un coup
- Ne pas ignorer les alertes critiques > 7 jours
- Ne pas modifier les canonical URLs sans raison
- Ne pas désactiver le RUM (monitoring performance)
- Ne pas publier de contenu IA sans validation

---

## INDICATEURS DE SUCCÈS

### KPIs SEO à suivre

**Trafic organique** :
- Objectif : +50% en 6 mois
- Source : Google Analytics

**Position moyenne** :
- Objectif : Top 3 sur mots-clés principaux
- Source : Google Search Console

**Pages indexées** :
- Objectif : 500+ pages indexées
- Source : GSC / Sitemap

**Core Web Vitals** :
- Objectif : 90% des pages en "Bon"
- Source : CWV Report

**Taux de conversion organique** :
- Objectif : 3% (candidats) / 5% (recruteurs)
- Source : GA4 + B2B tracking

---

## SUPPORT & MAINTENANCE

### En cas de problème

1. **Alertes non résolues** : Vérifier les logs de performance
2. **Pages non indexées** : Vérifier Configuration > Robots
3. **Scores CWV dégradés** : Analyser les dernières modifications
4. **Génération échouée** : Consulter l'onglet Logs

### Mises à jour

Le système SEO est automatiquement mis à jour.
- Phase 2 : Active (Vue Globale, Marketplace, Performance)
- Phase 3 : Disponible progressivement (IA, Scoring, Maillage)

---

## CONTACT

Pour toute question technique :
- Consulter la documentation complète : `SEO_PHASE_3_ROADMAP.md`
- Support technique : [contact@jobguinee.com](mailto:contact@jobguinee.com)

---

**JobGuinée** - Dominez le référencement RH en Afrique 🚀
