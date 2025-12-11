# Documentation : Système de Vidéo et Guides Page d'Accueil

## Vue d'ensemble

Le système de Vidéo et Guides permet aux administrateurs de configurer dynamiquement une section sur la page d'accueil de JobGuinée comprenant :
- Une vidéo de présentation (YouTube, Vimeo ou fichier uploadé)
- Des guides utilisateurs catégorisés et filtrés selon le rôle de l'utilisateur
- Une interface d'administration complète pour gérer le contenu

## Architecture

### 1. Base de Données

#### Table: `homepage_video_settings`
Configuration de la vidéo de présentation et paramètres de la section.

```sql
CREATE TABLE homepage_video_settings (
  id uuid PRIMARY KEY,
  is_enabled boolean DEFAULT true,              -- Active/désactive la section
  video_url text,                                -- URL YouTube/Vimeo
  video_file_url text,                           -- URL fichier vidéo uploadé
  thumbnail_url text,                            -- Image miniature
  title text DEFAULT 'Découvrez JobGuinée',      -- Titre de la section
  description text,                              -- Description
  layout text DEFAULT 'left',                    -- Position: 'left' ou 'right'
  background_color text DEFAULT '#F9FAFB',       -- Couleur de fond
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Table: `homepage_guides`
Liste des guides utilisateurs avec filtrage par catégorie.

```sql
CREATE TABLE homepage_guides (
  id uuid PRIMARY KEY,
  title text NOT NULL,                          -- Titre du guide
  description text,                             -- Description courte
  category text NOT NULL,                       -- candidate, recruiter, trainer, ia, general
  icon text DEFAULT 'FileText',                 -- Icône Lucide React
  file_url text NOT NULL,                       -- URL PDF ou lien externe
  file_type text DEFAULT 'pdf',                 -- 'pdf' ou 'external_link'
  is_active boolean DEFAULT true,               -- Active/désactive
  display_order integer DEFAULT 0,              -- Ordre d'affichage
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 2. Sécurité RLS

**Lecture publique** : Tous les utilisateurs peuvent consulter les guides actifs
**Modification** : Réservée aux administrateurs uniquement

```sql
-- Lecture publique
CREATE POLICY "Public can view active guides"
  ON homepage_guides FOR SELECT TO public
  USING (is_active = true);

-- Modification admin uniquement
CREATE POLICY "Admin can manage guides"
  ON homepage_guides FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
```

## Fichiers Créés

### Services
- **`src/services/homepageContentService.ts`** : Service de gestion des données
  - `getVideoSettings()` : Récupère configuration vidéo
  - `updateVideoSettings()` : Met à jour configuration vidéo
  - `getAllGuides()` : Récupère tous les guides (admin)
  - `getActiveGuides(userRole)` : Récupère guides filtrés par rôle
  - `createGuide()` : Crée un nouveau guide
  - `updateGuide()` : Met à jour un guide
  - `deleteGuide()` : Supprime un guide
  - `reorderGuides()` : Réordonne les guides
  - `uploadVideo()` : Upload fichier vidéo
  - `uploadThumbnail()` : Upload miniature
  - `uploadGuidePDF()` : Upload PDF

### Composants
- **`src/components/home/VideoGuidesSection.tsx`** : Section affichée sur la page d'accueil
  - Affichage responsive de la vidéo et des guides
  - Lecture vidéo YouTube/Vimeo/MP4
  - Filtrage automatique des guides par rôle utilisateur
  - Support drag & drop (futur)

### Pages Admin
- **`src/pages/AdminHomepageContent.tsx`** : Interface d'administration
  - Onglet **Vidéo** : Configuration vidéo et miniature
  - Onglet **Guides** : Gestion CRUD des guides
  - Upload de fichiers (vidéo, images, PDF)
  - Preview en temps réel

### Migrations
- **`supabase/migrations/create_homepage_video_guides_system.sql`**
  - Création tables `homepage_video_settings` et `homepage_guides`
  - Configuration RLS
  - Données d'exemple

## Utilisation Admin

### Accéder à l'interface
1. Connexion avec compte administrateur
2. Menu Admin > **Contenu Accueil** (icône vidéo orange)
3. Deux onglets disponibles : Vidéo et Guides

### Configuration Vidéo

#### Paramètres généraux
- **Section activée** : Toggle pour activer/désactiver la section
- **Titre** : Titre affiché en haut de la section
- **Description** : Sous-titre descriptif
- **Position vidéo** : Gauche ou Droite
- **Couleur de fond** : Code hexadécimal (#F9FAFB par défaut)

#### Vidéo
Deux options :
1. **URL externe** : YouTube ou Vimeo
   - Entrer l'URL complète (ex: `https://youtube.com/watch?v=ABC123`)
   - Lecture intégrée automatique

2. **Upload fichier** :
   - Format MP4, WebM, OGG
   - Taille max : selon configuration Supabase
   - Stockage : Bucket `homepage-videos`

#### Miniature
- Upload image PNG/JPG
- Affichée avant lecture vidéo
- Stockage : Bucket `homepage-thumbnails`

### Gestion des Guides

#### Ajouter un guide
1. Cliquer **+ Ajouter un guide**
2. Remplir le formulaire :
   - **Titre** : Nom du guide (requis)
   - **Description** : Courte description
   - **Catégorie** : candidate, recruiter, trainer, ia, general (requis)
   - **Icône** : Sélectionner parmi les icônes disponibles
   - **URL** : Lien externe ou fichier PDF
   - **Type** : PDF ou Lien externe
   - **Guide actif** : Checkbox pour activer/désactiver
3. Cliquer **Sauvegarder**

#### Modifier un guide
1. Cliquer icône **Modifier** (crayon)
2. Modifier les champs souhaités
3. Cliquer **Sauvegarder**

#### Supprimer un guide
1. Cliquer icône **Supprimer** (poubelle)
2. Confirmer la suppression
3. Le guide est définitivement supprimé

#### Réorganiser les guides
L'ordre d'affichage est défini par le champ `display_order`
(Drag & drop à implémenter)

## Logique de Filtrage

### Règles d'affichage des guides

| Rôle Utilisateur | Catégories affichées |
|------------------|---------------------|
| **Non connecté** | general |
| **Candidat** | candidate, ia, general |
| **Recruteur** | recruiter, general |
| **Formateur/Organisme** | trainer, general |

### Implémentation
```typescript
const allowedCategories = ['general'];
if (userRole === 'candidate') {
  allowedCategories.push('candidate', 'ia');
} else if (userRole === 'recruiter') {
  allowedCategories.push('recruiter');
} else if (userRole === 'trainer') {
  allowedCategories.push('trainer');
}
```

## Intégration Chatbot

Le chatbot peut répondre aux questions sur les guides :

### Questions reconnues
- "Comment utiliser le site ?"
- "Où trouver les guides ?"
- "Comment créer mon CV ?"

### Réponses configurées
Le chatbot redirige vers la section des guides en expliquant leur emplacement et leur utilité.

### Base de connaissances
```sql
INSERT INTO chatbot_knowledge_base (category, question, answer, intent_name)
VALUES
('general', 'Comment utiliser le site ?',
 'Je peux vous guider! Consultez nos guides utilisateurs sur la page d''accueil...',
 'guide_usage');
```

## Affichage Frontend

### Position
La section s'affiche sur la page d'accueil juste **avant** la section "Explorez par secteur".

### Responsive
- **Desktop** : Grille 2 colonnes (vidéo | guides)
- **Tablet** : Grille 2 colonnes adaptée
- **Mobile** : Empilement vertical

### Layout vidéo
- **Left** (gauche) : Vidéo à gauche, guides à droite
- **Right** (droite) : Guides à gauche, vidéo à droite

### Interactions
- **Clic sur guide** : Ouvre lien externe ou télécharge PDF
- **Clic sur miniature** : Lance lecture vidéo
- **Vidéo YouTube/Vimeo** : Lecture intégrée avec iframe
- **Vidéo uploadée** : Lecteur HTML5 natif

## Stockage Supabase

### Buckets requis
```sql
-- Créer manuellement si nécessaire
CREATE BUCKET homepage-videos PUBLIC;
CREATE BUCKET homepage-thumbnails PUBLIC;
CREATE BUCKET homepage-guides PUBLIC;
```

### Permissions
- **homepage-videos** : Upload admin, lecture publique
- **homepage-thumbnails** : Upload admin, lecture publique
- **homepage-guides** : Upload admin, lecture publique

## Maintenance

### Vérifier la configuration
```sql
-- Voir config vidéo actuelle
SELECT * FROM homepage_video_settings;

-- Voir tous les guides
SELECT id, title, category, is_active, display_order
FROM homepage_guides
ORDER BY display_order;
```

### Désactiver temporairement
```sql
-- Désactiver la section
UPDATE homepage_video_settings SET is_enabled = false;

-- Désactiver un guide spécifique
UPDATE homepage_guides SET is_active = false WHERE id = 'guide-id';
```

### Réinitialiser
```sql
-- Réinitialiser configuration par défaut
DELETE FROM homepage_video_settings;
INSERT INTO homepage_video_settings (title, description, layout)
VALUES ('Découvrez JobGuinée', 'La plateforme N°1 de l''emploi en Guinée', 'left');
```

## Tests

### Vérifications
1. ✅ Section visible sur page d'accueil (si activée)
2. ✅ Vidéo YouTube lit correctement
3. ✅ Vidéo Vimeo lit correctement
4. ✅ Vidéo uploadée lit correctement
5. ✅ Miniature affichée avant lecture
6. ✅ Guides filtrés selon rôle utilisateur
7. ✅ Clic sur guide ouvre lien/télécharge
8. ✅ Admin peut modifier configuration
9. ✅ Admin peut ajouter/modifier/supprimer guides
10. ✅ Responsive mobile/tablet/desktop
11. ✅ Chatbot redirige vers guides

### Scénarios de test

#### Candidat connecté
- Doit voir : guides candidate, ia, general
- Ne doit pas voir : recruiter, trainer

#### Recruteur connecté
- Doit voir : guides recruiter, general
- Ne doit pas voir : candidate, trainer, ia

#### Utilisateur non connecté
- Doit voir : guides general uniquement

## Évolutions Futures

### Fonctionnalités suggérées
1. **Drag & drop** pour réordonner guides
2. **Preview** vidéo dans admin
3. **Analytics** : Nombre de vues vidéo/guides
4. **Multi-langues** : Guides en plusieurs langues
5. **Versions** : Historique des modifications
6. **Planification** : Publier à date future
7. **A/B Testing** : Tester différentes versions

### Optimisations
- Lazy loading vidéo
- Compression images automatique
- CDN pour fichiers statiques
- Cache guides actifs

## Dépannage

### La vidéo ne s'affiche pas
- Vérifier URL vidéo valide
- Vérifier fichier uploadé accessible
- Vérifier bucket Supabase configuré
- Vérifier `is_enabled = true`

### Les guides ne s'affichent pas
- Vérifier `is_active = true`
- Vérifier catégorie correspond au rôle
- Vérifier RLS policies actives
- Vérifier données en DB

### Erreur upload
- Vérifier taille fichier
- Vérifier format accepté
- Vérifier buckets Supabase créés
- Vérifier permissions storage

## Support

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier logs navigateur (F12)
3. Vérifier logs Supabase
4. Contacter équipe développement

---

**Date de création** : 2025-12-11
**Version** : 1.0.0
**Auteur** : JobGuinée Dev Team
