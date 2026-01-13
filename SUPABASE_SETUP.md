# Guide de Configuration Supabase

## ✅ Statut Actuel

Votre projet est **déjà connecté** à Supabase avec :
- ✅ 7 tables principales créées
- ✅ 47 migrations appliquées
- ✅ Authentification configurée
- ✅ Politiques de sécurité (RLS) activées

## 🔄 Connecter une Nouvelle Base de Données

Si vous souhaitez connecter une **autre** base de données Supabase :

### Étape 1 : Créer un Projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte (si nécessaire)
3. Cliquez sur "New Project"
4. Remplissez les informations :
   - **Nom du projet** : JobGuinee
   - **Database Password** : Choisissez un mot de passe fort
   - **Région** : Choisissez la plus proche (ex: Frankfurt pour l'Europe)
5. Cliquez sur "Create new project" (patientez 2-3 minutes)

### Étape 2 : Récupérer les Identifiants

1. Dans votre projet Supabase, allez à **Settings** ⚙️
2. Cliquez sur **API** dans le menu latéral
3. Copiez ces deux valeurs :
   - **Project URL** (sous "Project URL")
   - **anon public** key (sous "Project API keys")

### Étape 3 : Mettre à Jour le Fichier .env

Ouvrez le fichier `.env` à la racine du projet et remplacez :

```env
VITE_SUPABASE_URL=votre_project_url_ici
VITE_SUPABASE_ANON_KEY=votre_anon_key_ici
```

### Étape 4 : Appliquer les Migrations

Vous avez **2 options** :

#### Option A : Via l'Interface Supabase (Recommandé)

1. Dans votre projet Supabase, allez à **Database** > **Migrations**
2. Connectez votre dépôt GitHub :
   - Cliquez sur "Connect to GitHub"
   - Autorisez Supabase
   - Sélectionnez votre dépôt
3. Les migrations dans `supabase/migrations/` seront détectées
4. Cliquez sur "Run migrations" pour les appliquer

#### Option B : Copier-Coller Manuellement

1. Dans Supabase, allez à **SQL Editor**
2. Ouvrez chaque fichier dans `supabase/migrations/` (dans l'ordre)
3. Copiez le contenu SQL
4. Collez et exécutez dans l'éditeur SQL
5. Commencez par :
   - `20251031124738_create_initial_schema.sql`
   - `20251103093639_add_admin_user_type_to_profiles.sql`
   - `20251031125117_fix_profile_creation_trigger.sql`
   - `20251031130013_fix_profile_trigger_null_handling.sql`
   - ... et les autres dans l'ordre chronologique

### Étape 5 : Vérifier la Connexion

Exécutez le script de vérification :

```bash
node setup-database.js
```

Vous devriez voir :
- ✅ Connexion réussie
- ✅ Toutes les tables créées

### Étape 6 : Créer un Utilisateur de Test

```bash
node create-test-user.js
```

Identifiants :
- Email: `candidat2@gmail.com`
- Mot de passe: `password123`

## 🔐 Sécurité

### ⚠️ Important : Ne JAMAIS Pousser le .env sur GitHub

Le fichier `.env` contient vos clés secrètes. Il est déjà dans `.gitignore`, mais vérifiez :

```bash
# Vérifier que .env n'est pas tracké
git status

# Si .env apparaît, annulez :
git reset HEAD .env
```

### 📋 Variables d'Environnement en Production

Pour déployer sur Vercel, Netlify ou autre :

1. Allez dans les paramètres de votre plateforme
2. Ajoutez les variables d'environnement :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anon

## 🔗 Connexion GitHub → Supabase

### Avantages

- ✅ Détection automatique des nouvelles migrations
- ✅ Synchronisation du code et de la base de données
- ✅ Historique des changements

### Configuration

1. Dashboard Supabase → **Settings** → **Integrations**
2. Trouvez **GitHub** et cliquez "Connect"
3. Autorisez l'accès à votre compte GitHub
4. Sélectionnez le dépôt **JobGuinee**
5. Les migrations seront détectées automatiquement

## 📊 Gestion de la Base de Données

### Voir les Données

1. Dashboard Supabase → **Table Editor**
2. Sélectionnez une table (ex: `profiles`)
3. Vous pouvez voir, ajouter, modifier les données

### Exécuter des Requêtes SQL

1. Dashboard Supabase → **SQL Editor**
2. Écrivez votre requête, par exemple :

```sql
SELECT * FROM profiles LIMIT 10;
```

3. Cliquez "Run" ou Ctrl+Enter

### Voir les Logs

1. Dashboard Supabase → **Logs**
2. Choisissez le type :
   - **API Logs** : Requêtes à l'API
   - **Auth Logs** : Authentifications
   - **Database Logs** : Requêtes SQL

## 🆘 Dépannage

### Erreur "Invalid API key"

- Vérifiez que vous avez copié la bonne clé (anon public, pas service_role)
- Vérifiez qu'il n'y a pas d'espaces avant/après dans le .env

### Erreur "relation does not exist"

- Les migrations ne sont pas appliquées
- Suivez l'étape 4 pour appliquer les migrations

### Erreur de connexion réseau

- Vérifiez votre connexion internet
- Vérifiez que l'URL Supabase est correcte
- Essayez de recharger le projet Supabase (parfois il se met en pause)

## 📞 Support

- Documentation Supabase : https://supabase.com/docs
- Discord Supabase : https://discord.supabase.com
- GitHub Issues : Créez un issue sur votre dépôt

## 🎯 Prochaines Étapes

1. ✅ Base de données connectée
2. 🔄 Connectez GitHub à Supabase
3. 👤 Créez des utilisateurs de test
4. 🚀 Lancez l'application avec `npm run dev`
5. 📱 Testez toutes les fonctionnalités
