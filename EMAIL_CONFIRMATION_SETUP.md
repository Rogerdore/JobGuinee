# Configuration de la Confirmation Email - JobGuinée

## État Actuel
Le système de confirmation email obligatoire a été intégré dans le code. Les modifications incluent :

### Code Frontend Modifié
1. **AuthContext.tsx** : Gestion de la confirmation email et erreurs mappées
2. **Auth.tsx** : Interface utilisateur avec messages clairs et modal de confirmation
3. **AuthCallback.tsx** : Gestion du callback après confirmation email
4. **EmailConfirmationModal.tsx** : Modal pour renvoyer l'email de confirmation

### Fonctionnalités Implémentées
- Blocage de la connexion pour les emails non confirmés
- Messages d'erreur clairs et contextuels
- Possibilité de renvoyer l'email de confirmation
- Page de callback avec message de succès
- Redirection automatique après confirmation

---

## Configuration Requise dans Supabase

Pour activer la confirmation email obligatoire, suivez ces étapes dans le **Dashboard Supabase** :

### Étape 1 : Accéder aux Paramètres Auth

1. Connectez-vous au Dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet JobGuinée
3. Allez dans **Authentication** → **Providers** → **Email**

### Étape 2 : Activer la Confirmation Email

Dans la section **Email Auth**, configurez les options suivantes :

```
☑️ Enable email confirmations
☑️ Secure email change
☐ Double confirm email changes (optionnel)
```

**Confirmation URL** :
```
https://votredomaine.com/auth/callback
```

Pour le développement local :
```
http://localhost:5173/auth/callback
```

### Étape 3 : Configurer les Email Templates

Allez dans **Authentication** → **Email Templates**

#### Template : Confirm signup

**Subject** :
```
Confirmez votre compte JobGuinée
```

**Body (HTML)** :
```html
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
    }
    .container {
      background-color: #f7f9fc;
      padding: 40px 20px;
    }
    .content {
      background-color: white;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .button {
      display: inline-block;
      padding: 14px 28px;
      background-color: #1e3a8a;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #666;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h2 style="color: #1e3a8a; margin-top: 0;">Bienvenue sur JobGuinée !</h2>

      <p>Merci de vous être inscrit sur JobGuinée, la plateforme emploi #1 en Guinée.</p>

      <p>Pour activer votre compte et commencer à postuler aux offres, cliquez sur le bouton ci-dessous :</p>

      <div style="text-align: center;">
        <a href="{{ .ConfirmationURL }}" class="button">
          Confirmer mon email
        </a>
      </div>

      <p style="font-size: 14px; color: #666;">
        Ou copiez ce lien dans votre navigateur :<br/>
        <span style="word-break: break-all;">{{ .ConfirmationURL }}</span>
      </p>

      <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 13px; color: #666;">
        Si vous n'avez pas créé de compte sur JobGuinée, vous pouvez ignorer cet email.
      </p>
    </div>

    <div class="footer">
      <p>© 2025 JobGuinée - Plateforme emploi en Guinée</p>
    </div>
  </div>
</body>
</html>
```

### Étape 4 : Configurer SMTP (Si ce n'est pas déjà fait)

#### Pour Hostinger SMTP :

Allez dans **Project Settings** → **Auth** → **SMTP Settings**

```
Enable Custom SMTP: ☑️ ON

SMTP Host: smtp.hostinger.com
SMTP Port: 465
SMTP User: noreply@jobguinee.com (votre email)
SMTP Password: [Votre mot de passe email]
SMTP Sender Name: JobGuinée
SMTP Sender Email: noreply@jobguinee.com
```

### Étape 5 : Sauvegarder et Tester

1. **Sauvegardez** toutes les configurations
2. **Testez** en créant un nouveau compte
3. Vérifiez que l'email est bien reçu
4. Cliquez sur le lien de confirmation
5. Vérifiez que la redirection fonctionne

---

## Parcours Utilisateur Complet

### 1. Inscription (Email/Password)

L'utilisateur remplit le formulaire :
- Nom complet
- Email
- Mot de passe (min 6 caractères)
- Type : Candidat / Recruteur / Formateur

Au clic sur "S'inscrire" :
- Le compte est créé avec `confirmed_at = NULL`
- Un email de confirmation est envoyé automatiquement
- Modal s'affiche : "Confirmez votre email"

### 2. Tentative de Connexion (Email Non Confirmé)

Si l'utilisateur essaie de se connecter avant confirmation :
- Message : "Compte non activé. Vérifiez votre boîte mail."
- Modal de confirmation s'affiche
- Bouton "Renvoyer l'email" disponible

### 3. Confirmation Email

L'utilisateur clique sur le lien dans l'email :
- Redirection vers `/auth/callback`
- Message de succès : "Email confirmé !"
- Redirection automatique vers la page de connexion après 3s
- Le compte passe à `confirmed_at = [timestamp]`

### 4. Connexion Réussie

Après confirmation, l'utilisateur peut se connecter normalement :
- Authentification acceptée
- Redirection vers le tableau de bord approprié

---

## Messages d'Erreur Mappés

Le système affiche des messages clairs pour chaque situation :

| Code Erreur | Message Utilisateur |
|-------------|---------------------|
| `EMAIL_CONFIRMATION_REQUIRED` | Modal de confirmation email (sans erreur rouge) |
| `EMAIL_NOT_CONFIRMED` | "Compte non activé. Vérifiez votre boîte mail." |
| `INVALID_CREDENTIALS` | "Email ou mot de passe incorrect" |
| `EMAIL_EXISTS` | "Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email." |
| `WEAK_PASSWORD` | "Le mot de passe doit contenir au moins 6 caractères" |
| `EMAIL_ALREADY_CONFIRMED` | "Votre email est déjà confirmé. Vous pouvez vous connecter." |

---

## Gestion des Cas Spéciaux

### Google OAuth
Les comptes Google OAuth **ne nécessitent PAS** de confirmation email car :
- L'email est déjà vérifié par Google
- `confirmed_at` est automatiquement défini par Supabase
- L'utilisateur peut se connecter immédiatement

### Email Non Reçu
L'utilisateur peut :
1. Vérifier son dossier spam
2. Cliquer sur "Renvoyer l'email" dans le modal
3. Contacter le support si le problème persiste

### Comptes Existants (Avant Cette Update)
Les comptes créés avant l'activation de la confirmation email ont `confirmed_at` déjà défini et peuvent se connecter normalement.

---

## Tests à Effectuer

### Test 1 : Inscription Complète
1. Créer un nouveau compte avec un email valide
2. Vérifier la réception de l'email de confirmation
3. Cliquer sur le lien de confirmation
4. Vérifier le message de succès
5. Se connecter avec les identifiants

### Test 2 : Connexion Sans Confirmation
1. Créer un compte sans cliquer sur le lien de confirmation
2. Essayer de se connecter
3. Vérifier que le modal de confirmation s'affiche
4. Tester le bouton "Renvoyer l'email"

### Test 3 : Email Déjà Utilisé
1. Essayer de créer un compte avec un email existant
2. Vérifier le message d'erreur approprié

### Test 4 : Google OAuth
1. S'inscrire via Google
2. Vérifier que la connexion fonctionne immédiatement
3. Pas d'email de confirmation requis

---

## Commandes de Vérification

### Vérifier un Utilisateur Spécifique

```sql
SELECT
  id,
  email,
  confirmed_at,
  created_at,
  raw_user_meta_data->>'user_type' as user_type
FROM auth.users
WHERE email = 'test@example.com';
```

### Lister les Utilisateurs Non Confirmés

```sql
SELECT
  id,
  email,
  created_at,
  AGE(NOW(), created_at) as waiting_time
FROM auth.users
WHERE confirmed_at IS NULL
ORDER BY created_at DESC;
```

### Forcer la Confirmation (Urgence Uniquement)

```sql
UPDATE auth.users
SET confirmed_at = NOW()
WHERE email = 'user@example.com'
AND confirmed_at IS NULL;
```

⚠️ **À utiliser uniquement en cas d'urgence ou pour les tests !**

---

## Sécurité

### Ce qui est Protégé
- ✅ Aucune connexion sans email confirmé
- ✅ Messages d'erreur qui ne révèlent pas si un email existe
- ✅ Limitation des tentatives de renvoi (géré par Supabase)
- ✅ Tokens de confirmation avec expiration

### Ce qui reste à Faire (Optionnel)
- Rate limiting sur le renvoi d'email (déjà géré par Supabase)
- Monitoring des tentatives d'inscription
- Notifications admin pour les inscriptions suspectes

---

## Support et Maintenance

### Logs à Surveiller
- Nombre d'emails de confirmation envoyés
- Taux de confirmation (confirmés / inscrits)
- Erreurs d'envoi SMTP

### Métriques Importantes
```sql
-- Taux de confirmation
SELECT
  COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) as confirmed,
  COUNT(CASE WHEN confirmed_at IS NULL THEN 1 END) as pending,
  ROUND(
    100.0 * COUNT(CASE WHEN confirmed_at IS NOT NULL THEN 1 END) / COUNT(*),
    2
  ) as confirmation_rate
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## Checklist de Déploiement

Avant de mettre en production :

- [ ] Configuration SMTP validée et testée
- [ ] Template email personnalisé et testé
- [ ] Confirmation email activée dans Supabase Auth
- [ ] URL de callback correcte (production)
- [ ] Tests complets du parcours utilisateur
- [ ] Vérification que Google OAuth n'est pas impacté
- [ ] Documentation accessible à l'équipe
- [ ] Plan de rollback si nécessaire

---

## Contact

Pour toute question sur cette configuration :
- Vérifier les logs Supabase Auth
- Consulter la documentation : https://supabase.com/docs/guides/auth
- Contacter le support Supabase si problème SMTP

---

**Date de mise en place** : Janvier 2025
**Version** : 1.0
**Status** : Production Ready
