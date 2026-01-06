# 🔐 Guide Configuration Google OAuth

## ❌ ERREUR ACTUELLE
"hhhjzgeidjqctuveopso.supabase.co n'autorise pas la connexion"
→ Google OAuth n'est PAS configuré dans Supabase

---

## ✅ SOLUTION COMPLÈTE (10 minutes)

### ÉTAPE 1 : Créer une Application Google OAuth

1. **Aller sur Google Cloud Console** :
   - 🔗 https://console.cloud.google.com/

2. **Créer un nouveau projet** (si besoin) :
   - Cliquez sur le menu déroulant en haut à gauche
   - Cliquez sur "NOUVEAU PROJET"
   - Nom : `JobGuinee App`
   - Cliquez sur "CRÉER"

3. **Activer Google+ API** :
   - Menu → APIs & Services → Library
   - Recherchez "Google+ API"
   - Cliquez sur "ACTIVER"

4. **Configurer l'écran de consentement OAuth** :
   - Menu → APIs & Services → OAuth consent screen
   - Type : **External** (pour tester avec n'importe quel compte Google)
   - Cliquez sur "CRÉER"

   **Remplir les informations** :
   - App name : `JobGuinee`
   - User support email : votre email
   - Developer contact : votre email
   - Cliquez sur "SAVE AND CONTINUE"

   **Scopes** (étape 2) :
   - Cliquez sur "SAVE AND CONTINUE" (pas besoin de scopes supplémentaires)

   **Test users** (étape 3) :
   - Ajoutez votre email pour tester
   - Cliquez sur "SAVE AND CONTINUE"

5. **Créer les credentials OAuth** :
   - Menu → APIs & Services → Credentials
   - Cliquez sur "+ CREATE CREDENTIALS"
   - Sélectionnez "OAuth 2.0 Client ID"

   **Configuration** :
   - Application type : **Web application**
   - Name : `JobGuinee Web Client`

   **Authorized JavaScript origins** :
   - Ajoutez : `http://localhost:5173`
   - Ajoutez : `https://hhhjzgeidjqctuveopso.supabase.co`

   **Authorized redirect URIs** :
   - Ajoutez : `http://localhost:5173/auth/callback`
   - Ajoutez : `https://hhhjzgeidjqctuveopso.supabase.co/auth/v1/callback`

   - Cliquez sur "CREATE"

6. **COPIEZ vos credentials** :
   ```
   Client ID : 123456789-abcdefghijk.apps.googleusercontent.com
   Client Secret : GOCSPX-abcdefghijklmnop
   ```
   ⚠️ **NE FERMEZ PAS** cette fenêtre, vous en aurez besoin !

---

### ÉTAPE 2 : Configurer Google OAuth dans Supabase

1. **Aller sur Supabase Dashboard** :
   - 🔗 https://supabase.com/dashboard/project/hhhjzgeidjqctuveopso

2. **Activer Google Provider** :
   - Menu → Authentication → Providers
   - Cherchez "Google" dans la liste
   - Cliquez sur "Google" pour l'ouvrir

3. **Configuration** :
   - **Activez** "Enable Sign in with Google"
   - **Client ID** : Collez votre Client ID de Google
   - **Client Secret** : Collez votre Client Secret de Google
   - **Redirect URL** (vérifiez) : `https://hhhjzgeidjqctuveopso.supabase.co/auth/v1/callback`
   - Cliquez sur "SAVE"

---

## 🧪 TESTER L'AUTHENTIFICATION

1. **Retournez sur votre application** :
   - http://localhost:5173

2. **Testez la connexion** :
   - Cliquez sur "Se connecter"
   - Sélectionnez votre rôle (Candidat/Recruteur/Formateur)
   - Cliquez sur "Ou continuer avec Google"
   - **Vous devriez être redirigé vers Google !**

3. **Connexion Google** :
   - Sélectionnez votre compte Google
   - Autorisez l'application
   - Vous serez redirigé vers l'application connecté ✅

---

## ❓ DÉPANNAGE

### Erreur "redirect_uri_mismatch"
→ Les URLs de redirection dans Google Cloud Console ne correspondent pas
→ Vérifiez que vous avez bien ajouté :
- `http://localhost:5173/auth/callback`
- `https://hhhjzgeidjqctuveopso.supabase.co/auth/v1/callback`

### Erreur "Access blocked: This app's request is invalid"
→ L'écran de consentement OAuth n'est pas configuré
→ Retournez à l'étape 1.4

### Profil non créé après connexion
→ Le système réessaie automatiquement pendant 9 secondes
→ Vérifiez les logs dans la console (F12) pour plus de détails

---

## 📝 RÉCAPITULATIF DES URLs

| Environnement | URL de base | URL de callback |
|---------------|-------------|-----------------|
| **Local** | `http://localhost:5173` | `http://localhost:5173/auth/callback` |
| **Supabase** | `https://hhhjzgeidjqctuveopso.supabase.co` | `https://hhhjzgeidjqctuveopso.supabase.co/auth/v1/callback` |

---

## ✅ CHECKLIST FINALE

- [ ] Projet Google Cloud créé
- [ ] Google+ API activée
- [ ] Écran de consentement OAuth configuré
- [ ] Credentials OAuth créées
- [ ] URLs de redirection ajoutées dans Google Cloud Console
- [ ] Google Provider activé dans Supabase
- [ ] Client ID et Secret ajoutés dans Supabase
- [ ] Test de connexion réussi

---

## 📞 BESOIN D'AIDE ?

Si après avoir suivi ces étapes vous avez encore des erreurs :
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs Supabase (Dashboard → Logs)
3. Assurez-vous que toutes les URLs sont correctes
