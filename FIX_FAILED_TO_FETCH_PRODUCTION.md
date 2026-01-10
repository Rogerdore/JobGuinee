# CORRECTION : Erreur "Failed to fetch" en Production

## ❌ Problème

L'erreur **"Failed to fetch"** apparaît lors de la connexion sur jobguinee.com. Cela signifie que le frontend ne peut pas communiquer avec Supabase.

## 🔍 Causes Possibles

1. **Domaine non autorisé dans Supabase** (cause la plus probable)
2. **Variables d'environnement incorrectes**
3. **Problème CORS**
4. **URLs Supabase incorrectes**

---

## ✅ SOLUTION 1 : Autoriser le Domaine dans Supabase (PRIORITAIRE)

### Étape 1 : Accéder à Supabase Dashboard

1. Connectez-vous sur : https://supabase.com/dashboard
2. Sélectionnez votre projet JobGuinée

### Étape 2 : Configurer les URLs autorisées

1. Allez dans **Settings** (⚙️ en bas à gauche)
2. Cliquez sur **Authentication** dans le menu latéral
3. Faites défiler jusqu'à **URL Configuration**

### Étape 3 : Ajouter les URLs de production

Ajoutez ces URLs dans les champs appropriés :

**Site URL :**
```
https://jobguinee.com
```

**Redirect URLs (une par ligne) :**
```
https://jobguinee.com
https://jobguinee.com/**
https://jobguinee.com/auth/callback
https://www.jobguinee.com
https://www.jobguinee.com/**
http://jobguinee.com
http://www.jobguinee.com
```

**Additional Redirect URLs :**
Ajoutez également :
```
https://jobguinee.com/auth/callback
https://www.jobguinee.com/auth/callback
```

### Étape 4 : Sauvegarder

Cliquez sur **Save** en bas de la page.

⚠️ **IMPORTANT** : Attendez 2-3 minutes que les changements se propagent.

---

## ✅ SOLUTION 2 : Vérifier les Variables d'Environnement

### Problème détecté

Il y a une différence entre vos fichiers `.env` :

**.env (développement)** :
```
VITE_SUPABASE_URL=https://hhhjzgeidjqctuveopso.supabase.co
                                   ↑ (avec 'q')
```

**.env.production** :
```
VITE_SUPABASE_URL=https://hhhjzgeidjgctuveopso.supabase.co
                                   ↑ (avec 'g')
```

### Vérification

1. Allez sur Supabase Dashboard → Settings → API
2. Copiez l'URL exacte du projet :
   - **Project URL**
   - **anon/public key**

3. Remplacez dans `.env.production` :

```env
VITE_SUPABASE_URL=VOTRE_URL_EXACTE_ICI
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_EXACTE_ICI
```

---

## ✅ SOLUTION 3 : Vérifier la Configuration CORS

### Dans Supabase

1. Allez dans **Settings** → **API**
2. Vérifiez la section **CORS**
3. Assurez-vous que `*` est autorisé OU ajoutez explicitement :
   ```
   https://jobguinee.com
   https://www.jobguinee.com
   ```

---

## ✅ SOLUTION 4 : Vérifier le Déploiement

### Vérifier que les variables d'environnement sont utilisées

Votre hébergeur (Hostinger) doit utiliser le fichier `.env.production` lors du build.

### Option 1 : Rebuild avec les bonnes variables

```bash
# Copier les variables de production
cp .env.production .env

# Rebuild
npm run build

# Déployer
```

### Option 2 : Variables d'environnement sur Hostinger

Si Hostinger supporte les variables d'environnement :

1. Connectez-vous à votre panel Hostinger
2. Allez dans la section "Variables d'environnement" ou "Environment"
3. Ajoutez :
   - `VITE_SUPABASE_URL` = votre URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = votre clé anon

---

## 🧪 TEST : Vérifier la Configuration

### Test 1 : Vérifier l'URL Supabase dans le navigateur

1. Ouvrez https://jobguinee.com
2. Ouvrez la Console du navigateur (F12)
3. Allez dans l'onglet **Console**
4. Tapez :

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL)
```

Si cela affiche `undefined`, les variables d'environnement ne sont pas chargées.

### Test 2 : Vérifier la connexion Supabase

Dans la console, tapez :

```javascript
fetch('https://hhhjzgeidjgctuveopso.supabase.co/rest/v1/')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e))
```

- **200** = Supabase est accessible ✅
- **Erreur CORS** = Domaine non autorisé ❌
- **Network error** = URL incorrecte ❌

---

## 📋 CHECKLIST DE VÉRIFICATION

- [ ] Domaine ajouté dans Supabase Authentication → URL Configuration
- [ ] URL Supabase correcte dans `.env.production`
- [ ] ANON_KEY correcte dans `.env.production`
- [ ] Rebuild de l'application avec les bonnes variables
- [ ] Redéploiement sur Hostinger
- [ ] Attendre 2-3 minutes après les changements Supabase
- [ ] Vider le cache du navigateur (Ctrl+Shift+R)
- [ ] Tester la connexion

---

## 🚀 PROCÉDURE COMPLÈTE DE CORRECTION

### 1. Corriger dans Supabase
```
1. Aller sur https://supabase.com/dashboard
2. Settings → Authentication → URL Configuration
3. Ajouter https://jobguinee.com et toutes les variantes
4. Sauvegarder et attendre 2-3 minutes
```

### 2. Corriger les Variables d'Environnement
```bash
# Vérifier l'URL exacte dans Supabase Dashboard
# Mettre à jour .env.production avec l'URL exacte
```

### 3. Rebuild et Déployer
```bash
# Dans votre projet
cp .env.production .env
npm run build

# Déployer le dossier dist/ sur Hostinger
```

### 4. Tester
```
1. Vider le cache du navigateur (Ctrl+Shift+R)
2. Essayer de se connecter sur https://jobguinee.com
3. Vérifier dans la console qu'il n'y a plus d'erreurs
```

---

## 📞 Si le Problème Persiste

### Informations à collecter :

1. **Ouvrez la Console du navigateur (F12)** sur jobguinee.com
2. **Onglet Console** : Copier tous les messages d'erreur
3. **Onglet Network** :
   - Filtrer par "XHR" ou "Fetch"
   - Chercher les requêtes vers Supabase
   - Cliquer dessus et noter le statut (200, 404, CORS error, etc.)
4. **Vérifier** : L'URL exacte affichée dans les requêtes réseau

### Questions de diagnostic :

- Quel est le message d'erreur exact dans la Console ?
- Voyez-vous des requêtes vers Supabase dans l'onglet Network ?
- Quel est le code d'erreur HTTP (si visible) ?
- L'URL Supabase dans les requêtes correspond-elle à votre projet ?

---

## 🎯 SOLUTION RAPIDE

**Si vous voulez tester rapidement** :

1. **Supabase** : Ajoutez `https://jobguinee.com` dans Authentication → Redirect URLs
2. **Attendez 3 minutes**
3. **Videz le cache** : Ctrl+Shift+R sur jobguinee.com
4. **Testez** la connexion

C'est généralement la cause #1 des erreurs "Failed to fetch" en production.
