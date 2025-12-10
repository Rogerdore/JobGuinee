# Problème d'authentification : "Database error querying schema"

## Résumé du problème

Lors de la tentative de connexion avec l'email `doreroger07@yahoo.fr`, l'erreur suivante se produit:
```
AuthApiError: Database error querying schema
Status: 500
Code: unexpected_failure
```

## Diagnostic effectué

### 1. Tables manquantes créées ✅
Les tables suivantes ont été créées avec succès:
- `site_settings` - Paramètres globaux du site
- `notification_preferences` - Préférences de notification utilisateur
- `cms_sections` - Sections CMS

### 2. Vérifications effectuées ✅

- ✅ L'utilisateur existe dans `auth.users`
- ✅ L'email est confirmé (`email_confirmed_at` est défini)
- ✅ Le mot de passe est défini (`encrypted_password` existe)
- ✅ L'utilisateur n'est pas banni
- ✅ Le profil existe dans la table `profiles`
- ✅ Les préférences de notification existent
- ✅ Les triggers ont été recréés avec une meilleure gestion des erreurs

### 3. Identité manquante ajoutée ✅

Une entrée dans `auth.identities` a été créée pour l'utilisateur car elle était manquante.

## Cause probable du problème

L'erreur "Database error querying schema" est une erreur **interne à Supabase Auth**, pas à notre code applicatif. Cela peut être causé par:

1. **Problème de cache Supabase** - Le cache du schéma auth n'est pas à jour
2. **Migrations incomplètes** - Certaines migrations au niveau du schéma auth interne de Supabase n'ont pas été correctement appliquées
3. **Problème de configuration** - La configuration Supabase Auth nécessite une réinitialisation

## Solutions à essayer

### Solution 1: Redémarrer le projet Supabase (Recommandé)

1. Allez sur le [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** > **General**
4. Cliquez sur **Pause Project**
5. Attendez quelques minutes
6. Cliquez sur **Restore Project**

### Solution 2: Réinitialiser le mot de passe via le Dashboard

1. Allez sur le [Dashboard Supabase](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Users**
4. Trouvez l'utilisateur `doreroger07@yahoo.fr`
5. Cliquez sur les trois points > **Reset Password**
6. Copiez le lien de réinitialisation généré
7. Ouvrez le lien dans un navigateur et définissez un nouveau mot de passe

### Solution 3: Recréer l'utilisateur via le Dashboard

Si les solutions précédentes ne fonctionnent pas:

1. Sauvegardez d'abord les données de profil de l'utilisateur
2. Supprimez l'utilisateur du Dashboard Supabase
3. Recréez l'utilisateur avec le même email via le Dashboard
4. Définissez le mot de passe: `Rogerdore1986@`
5. Restaurez les données du profil si nécessaire

### Solution 4: Utiliser la fonction SQL de réinitialisation

Une fonction SQL `admin_reset_user_password` a été créée et peut être utilisée:

```sql
SELECT admin_reset_user_password('doreroger07@yahoo.fr', 'NouveauMotDePasse123!');
```

## Travaux effectués

1. ✅ Création des tables manquantes (site_settings, notification_preferences, cms_sections)
2. ✅ Ajout de l'identité manquante dans auth.identities
3. ✅ Correction et amélioration des triggers de création d'utilisateur
4. ✅ Création d'une fonction de réinitialisation de mot de passe
5. ✅ Ajout de politiques RLS pour toutes les nouvelles tables
6. ✅ Initialisation des données par défaut

## État actuel

- ✅ Toutes les tables nécessaires existent
- ✅ Les triggers fonctionnent correctement
- ✅ Les RLS policies sont en place
- ⚠️ L'authentification Supabase nécessite une intervention au niveau du Dashboard

## Prochaines étapes

1. Essayez la **Solution 1** (Redémarrage du projet) en premier
2. Si cela ne fonctionne pas, essayez la **Solution 2** (Réinitialisation du mot de passe)
3. En dernier recours, utilisez la **Solution 3** (Recréation de l'utilisateur)

## Contact Support Supabase

Si le problème persiste après avoir essayé toutes les solutions, contactez le support Supabase:
- [Discord Supabase](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- Email: support@supabase.io

## Scripts de test disponibles

Deux scripts ont été créés pour tester l'authentification:

1. `test-login.js` - Teste la connexion avec l'utilisateur existant
2. `test-create-and-login.js` - Teste la création d'un nouvel utilisateur et la connexion

Pour les exécuter:
```bash
node test-login.js
node test-create-and-login.js
```
