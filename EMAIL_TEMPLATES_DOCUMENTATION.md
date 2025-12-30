# Documentation - Système de Templates d'Emails pour Candidatures Externes

## Vue d'ensemble

Le système de templates d'emails permet aux administrateurs de personnaliser les emails envoyés automatiquement lors des candidatures externes sur JobGuinée. Ce système offre une flexibilité totale pour adapter le ton, le style et le contenu des emails selon le contexte professionnel.

## Fonctionnalités

### 1. Templates Prédéfinis

Trois templates professionnels sont disponibles par défaut :

#### 📩 Template Standard (Recommandé)
- **Usage** : Candidatures générales, entreprises privées, PME/PMI
- **Ton** : Professionnel et complet
- **Contenu** :
  - Présentation contextualisée
  - Message personnalisé du candidat
  - Liste des pièces jointes
  - Lien profil public sécurisé
  - Signature complète avec coordonnées
  - Branding JobGuinée

#### 📧 Template Court & Direct
- **Usage** : Startups, recruteurs pressés, candidatures rapides
- **Ton** : Concis et efficace
- **Contenu** :
  - Message minimaliste
  - Essentiel uniquement
  - Lien profil immédiatement visible

#### 🏛️ Template Formel (Institutions)
- **Usage** : Administrations, ONG, organisations internationales
- **Ton** : Très formel et respectueux
- **Contenu** :
  - Formules de politesse élaborées
  - Vocabulaire institutionnel
  - Présentation protocolaire

### 2. Templates Personnalisés

Les administrateurs peuvent créer des templates sur mesure pour répondre à des besoins spécifiques.

## Variables Disponibles

Le système utilise la syntaxe Handlebars pour les variables dynamiques :

### Variables Candidat
- `{{candidate_name}}` - Nom complet du candidat
- `{{candidate_email}}` - Email du candidat
- `{{candidate_phone}}` - Téléphone du candidat (optionnel)

### Variables Offre
- `{{job_title}}` - Titre du poste
- `{{company_name}}` - Nom de l'entreprise

### Variables Recruteur
- `{{recruiter_name}}` - Nom du recruteur (optionnel)

### Variables Système
- `{{profile_url}}` - Lien vers le profil public sécurisé
- `{{platform_url}}` - URL de la plateforme JobGuinée
- `{{custom_message}}` - Message personnalisé du candidat (optionnel)

### Variables Documents
- `{{has_cv}}` - Le candidat a joint un CV (booléen)
- `{{has_cover_letter}}` - Le candidat a joint une lettre (booléen)
- `{{has_other_documents}}` - Le candidat a joint d'autres documents (booléen)

## Syntaxe Conditionnelle

### Affichage conditionnel

```handlebars
{{#if recruiter_name}}
Bonjour {{recruiter_name}},
{{/if}}
```

### Exemples pratiques

```handlebars
{{#if has_cv}}
- mon CV
{{/if}}
{{#if has_cover_letter}}
- ma lettre de motivation
{{/if}}
{{#if has_other_documents}}
- d'autres documents utiles à ma candidature
{{/if}}
```

## Interface d'Administration

### Accès
**Admin > Templates Emails**

### Fonctionnalités

#### 📝 Création de template
1. Cliquer sur le formulaire de création
2. Remplir les champs :
   - Nom du template
   - Description
   - Type (standard, court, formel, personnalisé)
   - Objet de l'email
   - Corps de l'email
3. Cocher "Activer ce template par défaut" si souhaité
4. Cliquer sur "Créer"

#### ✏️ Modification de template
1. Cliquer sur l'icône "Modifier" d'un template
2. Modifier les champs souhaités
3. Cliquer sur "Mettre à jour"

**Note** : Les templates système (standard, court, formel) ne peuvent pas être supprimés mais peuvent être modifiés.

#### 🔍 Prévisualisation
- Cliquer sur l'icône "Œil" pour voir un aperçu avec des données d'exemple
- L'aperçu montre l'objet et le corps de l'email avec des valeurs réalistes

#### 🎯 Activation
- Un seul template peut être actif à la fois
- Le template actif est utilisé pour toutes les nouvelles candidatures externes
- Cliquer sur l'icône "Check" pour activer/désactiver un template

#### 🗑️ Suppression
- Seuls les templates personnalisés peuvent être supprimés
- Les templates système sont protégés contre la suppression

### Panneau d'Aide

Le panneau latéral affiche :
- Liste complète des variables disponibles
- Exemples de valeurs pour chaque variable
- Bouton "Copier" pour insérer rapidement une variable
- Guide de la syntaxe conditionnelle

## Intégration Technique

### Service Backend

Le service `externalApplicationEmailService.ts` :
1. Récupère le template actif depuis la base de données
2. Remplace les variables par les valeurs réelles
3. Traite les conditions `{{#if}}...{{/if}}`
4. Génère l'email final
5. Enregistre l'envoi dans les logs

### Base de Données

**Table** : `external_application_email_templates`

**Colonnes** :
- `id` - Identifiant unique
- `name` - Nom du template
- `template_type` - Type (standard/short/formal/custom)
- `subject_template` - Template de l'objet
- `body_template` - Template du corps
- `description` - Description
- `is_active` - Template actif (booléen)
- `is_default` - Template système non supprimable (booléen)
- `available_variables` - Variables disponibles (JSON)
- `created_at` - Date de création
- `updated_at` - Date de modification

### Sécurité

**RLS (Row Level Security)** :
- Lecture : Tous les utilisateurs authentifiés
- Création : Admins uniquement
- Modification : Admins uniquement
- Suppression : Admins uniquement (sauf templates système)

## Cas d'Usage

### Exemple 1 : Adaptation culturelle
Créer un template avec un ton plus informel pour les startups tech :

```
Objet : Candidature {{job_title}} 👋

Salut l'équipe {{company_name}} !

Je candidate pour le poste de {{job_title}}.

Mon profil complet est dispo ici : {{profile_url}}

À très vite !
{{candidate_name}}
```

### Exemple 2 : Secteur formel
Pour les institutions internationales :

```
Objet : Dossier de candidature – {{job_title}}

Excellence,

J'ai l'insigne honneur de porter à votre haute bienveillance ma candidature au poste de {{job_title}} au sein de votre auguste institution {{company_name}}.

[...]
```

### Exemple 3 : Message multilingue
Créer plusieurs templates pour différentes langues si nécessaire.

## Bonnes Pratiques

### ✅ À Faire
- Tester le template avec l'aperçu avant activation
- Utiliser les variables pour la personnalisation
- Garder un ton professionnel adapté au contexte guinéen
- Inclure toujours le lien profil public
- Maintenir une signature claire avec coordonnées

### ❌ À Éviter
- Templates trop longs (privilégier la concision)
- Oublier les variables dynamiques
- Supprimer le branding JobGuinée
- Utiliser un langage trop familier pour contexte formel
- Oublier les conditions pour les éléments optionnels

## Dépannage

### Le template ne s'active pas
- Vérifier qu'aucun autre template n'est déjà actif
- Vérifier les permissions administrateur

### Les variables ne sont pas remplacées
- Vérifier la syntaxe : `{{nom_variable}}` (avec doubles accolades)
- Vérifier l'orthographe exacte de la variable

### Le template système ne se modifie pas
- Les templates système peuvent être modifiés mais pas supprimés
- Vérifier que vous ne tentez pas de supprimer un template système

## Migration depuis l'ancien système

L'ancien système de templates codés en dur a été automatiquement migré vers la base de données. Les trois templates par défaut correspondent aux anciens templates.

## Support

Pour toute question ou problème :
- Consulter cette documentation
- Vérifier les logs d'envoi dans la table `email_log`
- Contacter l'équipe technique JobGuinée

---

**Version** : 1.0
**Dernière mise à jour** : 30 Décembre 2025
**Plateforme** : JobGuinée - Système RH & Emploi en Guinée
