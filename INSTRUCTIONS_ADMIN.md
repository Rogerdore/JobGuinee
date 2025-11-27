# 🔐 Créer un compte administrateur

Suivez ces étapes simples pour créer votre compte administrateur :

## Étape 1 : Créer un compte via l'interface

1. Allez sur votre site JobGuinée
2. Cliquez sur **"Connexion"** puis **"S'inscrire"**
3. Remplissez le formulaire :
   - **Nom complet** : Administrateur (ou votre nom)
   - **Email** : votre-email@example.com
   - **Mot de passe** : Un mot de passe sécurisé
   - **Type de compte** : Sélectionnez **"Recruteur"**
4. Cliquez sur **"Créer mon compte"**

## Étape 2 : Promouvoir le compte en admin

### Option A : Via l'interface Supabase (recommandé)

1. Allez dans votre **tableau de bord Supabase** : https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Dans le menu de gauche, cliquez sur **"Table Editor"**
4. Sélectionnez la table **"profiles"**
5. Trouvez la ligne correspondant à votre compte (cherchez par email)
6. Cliquez sur la cellule **"user_type"**
7. Changez la valeur de `recruiter` à **`admin`**
8. Appuyez sur Entrée pour sauvegarder

### Option B : Via SQL

1. Dans Supabase, allez dans **"SQL Editor"**
2. Exécutez cette requête (remplacez l'email par le vôtre) :

```sql
UPDATE profiles
SET user_type = 'admin'
WHERE email = 'votre-email@example.com';
```

3. Cliquez sur **"Run"**

## Étape 3 : Se connecter et accéder au CMS

1. **Reconnectez-vous** sur le site (déconnectez-vous puis reconnectez-vous)
2. Cliquez sur votre **nom en haut à droite**
3. Vous verrez maintenant l'option **"Administration CMS"**
4. Cliquez dessus pour accéder au backoffice

## ✅ C'est tout !

Vous avez maintenant accès complet au CMS pour gérer :
- Paramètres généraux du site
- Branding (logo, couleurs)
- Informations de contact
- Réseaux sociaux
- Contenu de la page d'accueil
- Et bien plus...

## 🔒 Sécurité

- Seuls les comptes avec `user_type = 'admin'` peuvent accéder au CMS
- Les autres utilisateurs ne verront pas cette option
- Toutes les modifications sont protégées par RLS (Row Level Security)
