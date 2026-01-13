# Configuration de l'authentification Google

## Étape 1 : Configurer Google Cloud Console

1. Accédez à [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ (Google Identity)

### Créer les identifiants OAuth 2.0

1. Dans le menu latéral, allez à **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Choisissez **Web application**
4. Configurez :
   - **Name** : JobGuinée Auth
   - **Authorized JavaScript origins** :
     - `http://localhost:5173` (développement)
     - `https://votre-domaine.com` (production)
   - **Authorized redirect URIs** :
     - `http://localhost:5173/auth/callback` (développement)
     - `https://votre-domaine.com/auth/callback` (production)
     - `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback` (Supabase callback)

5. Cliquez sur **Create**
6. Notez le **Client ID** et **Client Secret** générés

## Étape 2 : Configurer Supabase

1. Connectez-vous à votre [dashboard Supabase](https://app.supabase.com/)
2. Sélectionnez votre projet
3. Allez dans **Authentication** > **Providers**
4. Trouvez **Google** dans la liste et cliquez dessus
5. Activez le provider Google (toggle sur ON)
6. Entrez :
   - **Client ID** : celui obtenu de Google
   - **Client Secret** : celui obtenu de Google
7. Cliquez sur **Save**

## Étape 3 : Configurer l'URL de callback dans votre application

L'URL de callback est déjà configurée dans le code :
- **Development** : `http://localhost:5173/auth/callback`
- **Production** : `https://votre-domaine.com/auth/callback`

## Étape 4 : Tester l'authentification

1. Lancez votre application en développement
2. Allez sur la page de connexion/inscription
3. Sélectionnez votre rôle (Candidat, Recruteur, ou Formateur)
4. Cliquez sur le bouton **Google**
5. Connectez-vous avec votre compte Google
6. Vous serez redirigé vers votre application avec un compte créé automatiquement

## Fonctionnement

### Flux d'authentification

1. L'utilisateur clique sur "Continuer avec Google"
2. Le rôle sélectionné est sauvegardé dans localStorage
3. L'utilisateur est redirigé vers Google pour l'authentification
4. Après authentification, Google redirige vers `/auth/callback`
5. Le système :
   - Récupère la session utilisateur
   - Crée ou récupère le profil
   - Applique le rôle sélectionné
   - Pour les recruteurs : crée automatiquement une entreprise
   - Pour les formateurs : crée automatiquement un profil formateur
6. L'utilisateur est redirigé vers la page d'accueil

### Gestion des profils

- **Nom complet** : Récupéré depuis le profil Google
- **Email** : Récupéré depuis le compte Google
- **Rôle** : Celui sélectionné avant de cliquer sur Google
- **Crédits** : 10 crédits et 5 crédits IA offerts à l'inscription

## Sécurité

- Les tokens OAuth sont gérés par Supabase
- Les sessions sont sécurisées
- RLS (Row Level Security) est appliqué sur toutes les tables
- Le Client Secret n'est jamais exposé côté client

## Troubleshooting

### Erreur "redirect_uri_mismatch"
- Vérifiez que l'URL de callback est exactement la même dans Google Cloud Console et votre application
- Assurez-vous d'avoir ajouté l'URL Supabase callback dans Google Console

### Profil non créé
- Le système réessaie automatiquement pendant 4 secondes
- Si le problème persiste, vérifiez les logs Supabase

### Rôle incorrect
- Le rôle est défini au moment du clic sur le bouton Google
- Assurez-vous de sélectionner le bon rôle avant de cliquer

## Configuration de production

Avant de déployer en production, assurez-vous de :

1. Ajouter votre domaine de production dans Google Cloud Console
2. Ajouter l'URL de callback de production dans Google Cloud Console
3. Vérifier que l'URL de callback dans le code correspond à votre domaine
4. Tester le flux complet en production
