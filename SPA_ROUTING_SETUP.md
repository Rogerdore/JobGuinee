# Routage SPA - Configuration et Fonctionnement

## Problème Résolu

L'application JobGuinée est une Single Page Application (SPA). Les URLs profondes ne fonctionnaient pas en accès direct :
- Partage impossible sur les réseaux sociaux
- Refresh de page cassé
- Favoris et navigation navigateur non fonctionnels
- SEO bloqué

## Solution Mise en Place

### Architecture Hybride

Un système de routage hybride qui combine :
1. **React Router** pour les URLs critiques (partage, deep links)
2. **Système de navigation interne** existant pour les pages standards

### Composants Créés

#### 1. Router.tsx
Point d'entrée principal qui gère les routes critiques :
- `/share/:jobId` - Partage social avec tracking
- `/s/:jobId` - Version courte pour partage
- `/jobs/:jobId` - Deep link vers détail offre
- `/job/:jobId` - Alias
- `/offres/:jobId` - Alias français
- `/profile/:token` - Profil public
- `/public/:token` - Alias
- `/candidatures/:applicationId` - Candidature externe
- `/external/:applicationId` - Alias

#### 2. Configuration SPA

**Backend (.htaccess)**
```apache
RewriteEngine On
RewriteBase /

# Ne pas réécrire les fichiers existants
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Rediriger tout vers index.html
RewriteRule ^ index.html [L]
```

**Frontend (vite.config.ts)**
Le fichier .htaccess est automatiquement copié dans dist/ lors du build.

### Fonctionnement

#### Partage Social
1. Utilisateur clique sur "Partager"
2. URL générée : `/share/{job-id}?src=facebook`
3. Router détecte la route `/share/:jobId`
4. Composant `ShareRedirect` :
   - Track le partage dans la base de données
   - Track le clic
   - Redirige vers `/?page=job-detail&id={job-id}&src=facebook`
5. App.tsx détecte les paramètres et affiche la page

#### Deep Links
1. URL accédée : `/jobs/123` ou `/offres/poste-ingenieur`
2. Router détecte `/jobs/:jobId`
3. Composant `JobDetailRedirect` :
   - Redirige vers `/?page=job-detail&id=123`
4. App.tsx affiche le détail de l'offre

#### Refresh et Favoris
1. URL quelconque : `/admin/dashboard`
2. Le serveur (via .htaccess) retourne `index.html`
3. React Router démarre
4. Route `*` (catch-all) charge App.tsx
5. Le système de navigation interne prend le relais

## Test en Production

### URLs à Tester

1. **Partage Social**
   ```
   https://jobguinee.com/share/[job-id]?src=facebook
   https://jobguinee.com/s/[job-id]?src=linkedin
   ```

2. **Deep Links**
   ```
   https://jobguinee.com/jobs/[job-id]
   https://jobguinee.com/offres/[job-slug]
   ```

3. **Profils Publics**
   ```
   https://jobguinee.com/profile/[token]
   ```

4. **Refresh Page**
   - Aller sur n'importe quelle page
   - Appuyer sur F5
   - La page doit se recharger correctement

5. **Favoris**
   - Ajouter une page en favoris
   - Fermer le navigateur
   - Rouvrir depuis le favori
   - La page doit s'afficher

## Validation Open Graph

Les crawlers de Facebook, LinkedIn et Twitter peuvent maintenant :
1. Accéder aux URLs de partage
2. Lire les meta tags Open Graph
3. Afficher les aperçus riches

### Test des Crawlers

**Facebook Sharing Debugger**
```
https://developers.facebook.com/tools/debug/
```

**LinkedIn Post Inspector**
```
https://www.linkedin.com/post-inspector/
```

**Twitter Card Validator**
```
https://cards-dev.twitter.com/validator
```

## Analytics

Les partages sont trackés dans :
- Table `social_share_analytics`
- Table `job_clicks`

Dashboard : `/admin/social-analytics`

## Maintenance

### Ajouter une Nouvelle Route Deep Link

1. Éditer `src/Router.tsx`
2. Ajouter une nouvelle `<Route path="..." element={...} />`
3. Créer le composant de redirection si nécessaire
4. Rebuild et déployer

### Exemple
```tsx
<Route path="/formations/:formationId" element={<FormationRedirect />} />
```

## Compatibilité

- Développement : Vite dev server avec fallback automatique
- Production : Apache avec .htaccess
- Hébergement : Fonctionne avec tous les hébergeurs Apache (Hostinger, etc.)

## Troubleshooting

### Les URLs ne fonctionnent pas
1. Vérifier que `.htaccess` existe dans `dist/`
2. Vérifier que `mod_rewrite` est activé sur Apache
3. Vérifier les logs Apache pour les erreurs de réécriture

### Les partages ne trackent pas
1. Vérifier la connexion Supabase
2. Vérifier les logs de console dans le navigateur
3. Vérifier les RLS policies sur les tables

### Les redirections ne fonctionnent pas
1. Vérifier que React Router est installé : `npm list react-router-dom`
2. Vérifier les logs de console
3. Vérifier que `Router.tsx` est bien importé dans `main.tsx`

## Status

ROUTAGE SPA ACTIVÉ ET FONCTIONNEL
- Partage social opérationnel
- Deep links fonctionnels
- Refresh page opérationnel
- Favoris fonctionnels
- SEO activé
- Analytics tracking actif
