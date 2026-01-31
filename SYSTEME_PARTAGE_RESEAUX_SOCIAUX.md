# Système de Partage Réseaux Sociaux - JobGuinée

## Vue d'ensemble

JobGuinée dispose d'un système complet de partage sur les réseaux sociaux permettant de partager les offres d'emploi sur **Facebook, LinkedIn, Twitter/X et WhatsApp**. Le système inclut :

- Partage manuel par les utilisateurs
- Partage automatique lors de la publication d'une offre
- Tracking et analytics des partages
- Open Graph Tags optimisés pour chaque plateforme
- Aperçu visuel avant partage

---

## Architecture du Système

### 1. Base de données

#### Table `social_share_analytics`
Enregistre tous les partages effectués :
- `job_id` : Référence à l'offre partagée
- `user_id` : Utilisateur ayant partagé (nullable pour partages anonymes)
- `platform` : facebook | linkedin | twitter | whatsapp
- `share_type` : manual | auto | scheduled
- `shared_at` : Date et heure du partage
- `metadata` : Informations supplémentaires (succès/échec pour auto-share)

#### Table `social_platforms_config`
Configuration de chaque plateforme sociale :
- `platform` : Nom de la plateforme
- `is_enabled` : Active/désactive la plateforme
- `auto_share_enabled` : Active/désactive le partage automatique
- `post_template` : Template du message de partage avec variables
- `credentials` : Clés API et tokens OAuth (chiffré)
- `settings` : Configuration supplémentaire

#### Table `social_post_templates`
Templates personnalisables par type d'offre :
- `name` : Nom du template
- `platform` : Plateforme cible
- `job_type` : Type d'offre (CDI, CDD, Stage, etc.)
- `template` : Contenu du template avec variables
- `is_active` : Active/désactive le template

#### Table `global_share_settings`
Configuration globale du système :
- `kill_switch` : Désactive complètement le partage automatique
- `max_shares_per_hour` : Limite de partages par heure
- `max_shares_per_day` : Limite de partages par jour

---

## 2. Services Frontend

### `socialShareService`

Service principal de gestion du partage social.

**Fonctionnalités :**
- `generateJobMetadata(job)` : Génère les métadonnées Open Graph
- `generateShareLinks(job)` : Crée les liens de partage pour chaque plateforme
- `openShareLink(platform, links)` : Ouvre la fenêtre de partage
- `trackShare(jobId, platform)` : Enregistre le partage dans la base
- `copyToClipboard(text)` : Copie le lien dans le presse-papier
- `getJobShareImage(job)` : Sélectionne l'image de partage avec fallback en cascade

**Cascade d'images :**
1. `featured_image_url` : Image uploadée par le recruteur
2. `company_logo_url` : Logo de l'entreprise
3. `/assets/share/jobs/{job_id}.png` : Image spécifique générée
4. `/assets/share/default-job.svg` : Image par défaut JobGuinée

### `socialShareAnalyticsService`

Service d'analytics pour les statistiques de partage.

**Fonctionnalités :**
- `getGlobalStats()` : Statistiques globales par type et plateforme
- `getJobStats(jobId)` : Stats d'une offre spécifique
- `getTopSharedJobs(limit)` : Top des offres les plus partagées
- `getAutoShareSuccessRate()` : Taux de succès du partage auto
- `getShareTrends(days)` : Tendances de partage sur N jours
- `getRecentShares(limit)` : Derniers partages effectués

### `socialShareConfigService`

Service de configuration des plateformes sociales.

**Fonctionnalités :**
- `getAllPlatforms()` : Liste toutes les plateformes
- `getEnabledPlatforms()` : Plateformes actives uniquement
- `updatePlatform(platform, updates)` : Met à jour une plateforme
- `togglePlatform(platform, isEnabled)` : Active/désactive une plateforme
- `toggleAutoShare(platform, enabled)` : Active/désactive l'auto-share
- `updateCredentials(platform, creds)` : Met à jour les clés API
- `updateTemplate(platform, template)` : Met à jour le template
- `testConnection(platform)` : Teste la connexion à l'API

---

## 3. Composants React

### `ShareJobModal`

Modal de partage d'offre avec aperçu en direct.

**Fonctionnalités :**
- Aperçu visuel du partage (change selon la plateforme sélectionnée)
- Boutons de partage pour chaque plateforme avec tracking
- Copie du lien avec confirmation visuelle
- Design adaptatif selon la plateforme

**Props :**
```typescript
interface ShareJobModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}
```

### `SocialSharePreview`

Composant d'aperçu du partage social.

**Fonctionnalités :**
- Rendu simulé du partage sur chaque plateforme
- Gestion du chargement d'image avec fallbacks multiples
- Styles différenciés par plateforme (Facebook, LinkedIn, Twitter, Générique)
- Indicateur visuel en cas d'utilisation d'une image de fallback

**Props :**
```typescript
interface SocialSharePreviewProps {
  metadata: SocialShareMetadata;
  platform?: 'facebook' | 'linkedin' | 'twitter' | 'generic';
  className?: string;
}
```

---

## 4. Edge Functions

### `social-gateway`

Fonction serveur pour servir les Open Graph Tags aux crawlers sociaux.

**Route :** `/functions/v1/social-gateway/{job_id}`

**Fonctionnement :**
1. Récupère les données de l'offre depuis Supabase
2. Génère une page HTML avec tous les tags Open Graph
3. Redirige automatiquement les humains vers `/offres/{slug}`
4. Les crawlers voient la page avec les meta tags, pas les humains

**Meta Tags générés :**
- **Open Graph** : og:title, og:description, og:image, og:url, etc.
- **Twitter Card** : twitter:card, twitter:title, twitter:image, etc.
- **LinkedIn** : linkedin:title, linkedin:description, linkedin:image

### `auto-share-job`

Fonction de partage automatique (à implémenter).

**Fonctionnement prévu :**
1. Reçoit un `job_id` après publication
2. Vérifie les plateformes activées pour l'auto-share
3. Pour chaque plateforme active :
   - Utilise le template configuré
   - Remplace les variables ({title}, {company}, {location}, etc.)
   - Poste via l'API de la plateforme
   - Enregistre le résultat dans `social_share_analytics`

---

## 5. URLs et Routing

### URLs de partage

Le système utilise une URL spéciale pour le partage :

```
https://jobguinee-pro.com/share/{job_id}?src={platform}
```

**Avantages :**
- Tracking de la source de partage via paramètre `src`
- Crawlers reçoivent les Open Graph Tags optimisés
- Redirection automatique vers l'URL réelle pour les humains
- URL courte et facile à partager

### Redirection

Les utilisateurs humains sont immédiatement redirigés vers :
```
https://jobguinee-pro.com/offres/{slug}
```

---

## 6. Templates de Messages

### Variables disponibles

Les templates peuvent utiliser ces variables :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `{title}` | Titre de l'offre | "Développeur Full Stack" |
| `{company}` | Nom de l'entreprise | "TechCorp Guinée" |
| `{location}` | Localisation | "Conakry" |
| `{contract_type}` | Type de contrat | "CDI" |
| `{url}` | URL de partage | "https://jobguinee-pro.com/share/abc123" |
| `{salary_range}` | Fourchette salariale | "2M - 3M GNF" |
| `{description}` | Description courte | Première phrase de l'offre |

### Templates par défaut

#### Facebook
```
🎯 {title}
📍 {location}
💼 {contract_type}

Postulez maintenant: {url}

#JobGuinée #EmploiGuinée #Recrutement
```

#### LinkedIn
```
🎯 Nouvelle opportunité: {title}

📍 Localisation: {location}
💼 Type de contrat: {contract_type}
🏢 Entreprise: {company}

En savoir plus et postuler: {url}

#JobGuinée #Recrutement #Guinée #EmploiGuinée
```

#### Twitter/X
```
🎯 {title} - {location}
💼 {contract_type}
chez {company}

{url}

#JobGuinée #EmploiGuinée #Recrutement
```

#### WhatsApp
```
🎯 *{title}*

📍 {location}
💼 {contract_type}
🏢 {company}

Postulez sur JobGuinée:
{url}
```

---

## 7. Analytics et Statistiques

### Métriques disponibles

Le système tracking automatiquement :

- **Partages totaux** par plateforme
- **Partages par offre** avec détail par plateforme
- **Top offres partagées** avec compteurs
- **Tendances de partage** sur 7/30/90 jours
- **Taux de succès** du partage automatique
- **Partages récents** avec détails utilisateur

### Compteurs en temps réel

Chaque offre possède un compteur `shares_count` mis à jour automatiquement via trigger :
- Incrémenté à chaque nouveau partage
- Décrémenté si un partage est supprimé
- Utilisé pour trier les offres populaires

### Accès aux stats

- **Admins** : Voient toutes les statistiques
- **Recruteurs** : Voient les stats de leurs offres uniquement
- **Utilisateurs** : Voient uniquement leurs propres partages

---

## 8. Configuration Admin

### Page de configuration (à créer)

L'interface admin devrait permettre :

1. **Gestion des plateformes**
   - Activer/désactiver chaque plateforme
   - Configurer les clés API et tokens OAuth
   - Tester la connexion à l'API

2. **Templates de messages**
   - Créer/modifier des templates par plateforme
   - Prévisualiser le rendu avec données test
   - Définir des templates par type d'offre

3. **Partage automatique**
   - Activer/désactiver globalement (kill switch)
   - Activer/désactiver par plateforme
   - Configurer les limites (partages/heure, partages/jour)

4. **Analytics**
   - Dashboard avec graphiques de partage
   - Top offres partagées
   - Performance par plateforme
   - Export des données

---

## 9. Sécurité et RLS

### Permissions

**Table `social_share_analytics` :**
- **INSERT** : Public (tout le monde peut enregistrer un partage)
- **SELECT** :
  - Utilisateurs : Leurs propres partages
  - Recruteurs : Partages de leurs offres
  - Admins : Tous les partages

**Table `social_platforms_config` :**
- **ALL** : Admins uniquement
- **SELECT** : Utilisateurs authentifiés (uniquement plateformes activées)

**Table `social_post_templates` :**
- **ALL** : Admins uniquement
- **SELECT** : Public (templates actifs uniquement)

### Credentials sécurisées

Les clés API sont stockées dans un champ JSONB `credentials` et :
- Jamais exposées dans les SELECT publics
- Accessibles uniquement par les admins
- Utilisées uniquement côté serveur (Edge Functions)

---

## 10. Flux de Partage

### Partage Manuel

1. Utilisateur clique sur "Partager" sur une offre
2. Modal s'ouvre avec aperçu du partage
3. Utilisateur sélectionne une plateforme
4. Système génère l'URL de partage avec tracking
5. Fenêtre de partage s'ouvre (popup ou redirect)
6. Partage enregistré dans `social_share_analytics`
7. Compteur `shares_count` incrémenté

### Partage Automatique

1. Recruteur publie une offre avec `auto_share = true`
2. Trigger PostgreSQL détecté
3. Appel à Edge Function `auto-share-job`
4. Pour chaque plateforme active :
   - Récupération du template
   - Remplacement des variables
   - Appel API de la plateforme
   - Enregistrement du résultat
5. Notification au recruteur (succès/échec)

---

## 11. Intégration dans l'Interface

### Pages où le partage est disponible

- **Page détail d'offre** : Bouton "Partager" principal
- **Liste d'offres** : Icône de partage sur chaque carte
- **Dashboard recruteur** : Stats de partage par offre
- **Dashboard admin** : Analytics globales

### Composants concernés

- `JobDetail.tsx` / `JobDetailComplete.tsx`
- `Jobs.tsx` (liste des offres)
- `RecruiterDashboard.tsx`
- `AdminSocialAnalytics.tsx` (page admin dédiée)

---

## 12. Configuration des APIs Sociales

### Facebook

**Prérequis :**
- Créer une App Facebook
- Obtenir un Page Access Token
- Permissions requises : `pages_manage_posts`, `pages_read_engagement`

**Configuration :**
```json
{
  "page_id": "123456789",
  "app_id": "987654321",
  "app_secret": "secret_key",
  "access_token": "long_lived_token"
}
```

### LinkedIn

**Prérequis :**
- Créer une Application LinkedIn
- Obtenir OAuth 2.0 credentials
- Permissions requises : `w_member_social`, `r_organization_social`

**Configuration :**
```json
{
  "client_id": "client_id",
  "client_secret": "client_secret",
  "access_token": "oauth_token",
  "organization_id": "company_page_id"
}
```

### Twitter/X

**Prérequis :**
- Créer un Developer Account
- Obtenir API Keys et Bearer Token
- Permissions : Elevated Access recommandé

**Configuration :**
```json
{
  "api_key": "api_key",
  "api_secret": "api_secret",
  "bearer_token": "bearer_token",
  "access_token": "oauth_token",
  "access_token_secret": "oauth_secret"
}
```

### WhatsApp Business

**Prérequis :**
- Compte WhatsApp Business
- Meta Business Account
- WhatsApp Business API Access

**Configuration :**
```json
{
  "business_account_id": "account_id",
  "phone_number_id": "phone_id",
  "access_token": "api_token"
}
```

---

## 13. Tests et Validation

### Tests recommandés

1. **Partage manuel**
   - Vérifier que le modal s'ouvre correctement
   - Tester chaque plateforme
   - Vérifier que le tracking fonctionne
   - Tester la copie de lien

2. **Open Graph Tags**
   - Tester avec Facebook Sharing Debugger
   - Tester avec LinkedIn Post Inspector
   - Tester avec Twitter Card Validator
   - Vérifier les images de partage

3. **Partage automatique**
   - Publier une offre avec auto_share = true
   - Vérifier l'appel à l'Edge Function
   - Vérifier les posts sur les plateformes
   - Vérifier l'enregistrement dans analytics

4. **Analytics**
   - Vérifier les compteurs en temps réel
   - Tester les requêtes de statistiques
   - Vérifier les permissions RLS
   - Tester l'export de données

---

## 14. Améliorations Futures

### Court terme
- [ ] Page admin de configuration complète
- [ ] Implémentation complète du partage automatique
- [ ] Dashboard d'analytics avec graphiques
- [ ] Tests automatisés E2E

### Moyen terme
- [ ] Génération automatique d'images OG personnalisées
- [ ] Planification de posts (scheduled shares)
- [ ] A/B testing de templates
- [ ] Partage sur Instagram et TikTok

### Long terme
- [ ] IA pour optimiser les messages de partage
- [ ] Suggestions automatiques de timing
- [ ] Analyse de performance par hashtag
- [ ] Campagnes de partage sponsorisées

---

## 15. Documentation des APIs

### Supabase Functions

```typescript
// Enregistrer un partage
await supabase
  .from('social_share_analytics')
  .insert({
    job_id: 'uuid',
    platform: 'facebook',
    share_type: 'manual'
  });

// Obtenir les stats d'une offre
const { data } = await supabase
  .rpc('get_job_share_stats', { p_job_id: 'uuid' });

// Top offres partagées
const { data } = await supabase
  .rpc('get_most_shared_jobs', { p_limit: 10 });
```

### Services

```typescript
// Générer les métadonnées
const metadata = socialShareService.generateJobMetadata(job);

// Créer les liens de partage
const links = socialShareService.generateShareLinks(job);

// Ouvrir le partage
socialShareService.openShareLink('facebook', links);

// Tracker le partage
await socialShareService.trackShare(jobId, 'linkedin');
```

---

## Support et Maintenance

Pour toute question ou problème avec le système de partage :

1. Vérifier les logs dans la console Supabase
2. Tester les credentials API des plateformes
3. Vérifier les meta tags avec les outils de validation
4. Consulter la documentation des APIs sociales

**Contacts :**
- Support technique : support@jobguinee.com
- Documentation API : docs.jobguinee.com
- Status système : status.jobguinee.com
