# 🔧 DIAGNOSTIC : Erreur "Failed to fetch" sur jobguinee.com

## Étape 1 : Ouvrir la Console du Navigateur

1. Allez sur **https://jobguinee.com**
2. Appuyez sur **F12** (ou clic droit → Inspecter)
3. Allez dans l'onglet **Console**

---

## Étape 2 : Tester la Connexion Supabase

Copiez-collez ce code dans la Console et appuyez sur **Entrée** :

```javascript
// Test 1 : Vérifier l'URL Supabase
fetch('https://hhhjzgeidjgctuveopso.supabase.co/rest/v1/', {
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoaGp6Z2VpZGpnY3R1dmVvcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDc5NjUsImV4cCI6MjA4MDMyMzk2NX0.kaxpdgyYyGXiN93bThIceJ_p0j6hZQr5yz7obTtRSqA'
  }
})
.then(response => {
  console.log('✅ Connexion réussie!');
  console.log('Status:', response.status);
  console.log('StatusText:', response.statusText);
})
.catch(error => {
  console.error('❌ ERREUR:', error.message);
  if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
    console.error('🚨 PROBLÈME: Le domaine jobguinee.com n\'est pas autorisé dans Supabase!');
  }
});
```

---

## Étape 3 : Interpréter les Résultats

### Si vous voyez : ✅ "Connexion réussie!"
➡️ Supabase est accessible, mais l'authentification n'est pas configurée.
➡️ **Solution** : Suivez l'Étape 4 ci-dessous.

### Si vous voyez : ❌ "ERREUR: Failed to fetch"
➡️ Le domaine n'est PAS autorisé dans Supabase.
➡️ **Solution** : Suivez l'Étape 5 ci-dessous.

### Si vous voyez : ❌ "CORS policy"
➡️ Problème de CORS - domaine non autorisé.
➡️ **Solution** : Suivez l'Étape 5 ci-dessous.

---

## Étape 4 : Vérifier l'Authentification

Copiez-collez ce code dans la Console :

```javascript
// Test 2 : Vérifier l'API Auth
fetch('https://hhhjzgeidjgctuveopso.supabase.co/auth/v1/settings')
.then(response => response.json())
.then(data => {
  console.log('✅ Auth API accessible');
  console.log('Configuration:', data);
})
.catch(error => {
  console.error('❌ Auth API inaccessible:', error.message);
  console.error('Le domaine jobguinee.com doit être ajouté dans Supabase!');
});
```

---

## Étape 5 : SOLUTION - Autoriser jobguinee.com dans Supabase

### A. Connectez-vous à Supabase

1. Allez sur **https://supabase.com/dashboard**
2. Connectez-vous avec votre compte
3. Sélectionnez votre projet **JobGuinée**

### B. Vérifier l'URL du Projet

1. Dans le menu de gauche, cliquez sur **⚙️ Settings**
2. Cliquez sur **API**
3. Vérifiez le **Project URL** :
   - Doit être exactement : `https://hhhjzgeidjgctuveopso.supabase.co`
   - **ATTENTION** : Il y a peut-être une erreur dans vos fichiers `.env`

### C. Autoriser le Domaine

1. Toujours dans **⚙️ Settings**, cliquez sur **Authentication**
2. Faites défiler jusqu'à **URL Configuration**
3. Dans le champ **"Site URL"**, mettez :
   ```
   https://jobguinee.com
   ```

4. Dans le champ **"Redirect URLs"**, ajoutez ces lignes (une par ligne) :
   ```
   https://jobguinee.com
   https://jobguinee.com/**
   https://jobguinee.com/auth/callback
   https://www.jobguinee.com
   https://www.jobguinee.com/**
   https://www.jobguinee.com/auth/callback
   http://jobguinee.com
   http://www.jobguinee.com
   ```

5. Cliquez sur **SAVE** en bas de la page

6. ⏰ **ATTENDEZ 3-5 MINUTES** pour que les changements se propagent

### D. Vider le Cache et Tester

1. Sur jobguinee.com, appuyez sur **Ctrl + Shift + R** (ou Cmd + Shift + R sur Mac)
2. Essayez de vous connecter à nouveau

---

## Étape 6 : Vérifier les Variables d'Environnement en Production

### Problème détecté dans vos fichiers

Vous avez **2 URLs différentes** :

**Fichier `.env` (développement)** :
```
VITE_SUPABASE_URL=https://hhhjzgeidjqctuveopso.supabase.co
                                      ↑ avec 'q'
```

**Fichier `.env.production`** :
```
VITE_SUPABASE_URL=https://hhhjzgeidjgctuveopso.supabase.co
                                      ↑ avec 'g'
```

### Vérifier la bonne URL

1. Dans Supabase Dashboard → **Settings** → **API**
2. Copiez le **Project URL** exact
3. Mettez à jour `.env.production` avec la bonne URL

---

## Étape 7 : Rebuild et Redéployer

Une fois la bonne URL confirmée :

```bash
# Dans votre terminal local
npm run build

# Puis uploadez le dossier dist/ sur Hostinger
```

---

## 📋 CHECKLIST COMPLÈTE

- [ ] Ouvrir la Console du navigateur sur jobguinee.com (F12)
- [ ] Exécuter les tests JavaScript ci-dessus
- [ ] Noter les erreurs exactes
- [ ] Se connecter sur Supabase Dashboard
- [ ] Vérifier le Project URL dans Settings → API
- [ ] Corriger `.env.production` si nécessaire
- [ ] Aller dans Settings → Authentication → URL Configuration
- [ ] Ajouter jobguinee.com dans Site URL
- [ ] Ajouter toutes les URLs de redirection
- [ ] Cliquer SAVE
- [ ] Attendre 3-5 minutes
- [ ] Vider le cache du navigateur (Ctrl+Shift+R)
- [ ] Tester la connexion

---

## 🆘 Si ça ne marche toujours pas

### Informations à me fournir :

1. **Le message d'erreur EXACT** dans la Console (F12 → Console)
2. **Les requêtes réseau** :
   - F12 → Onglet **Network**
   - Cochez "Preserve log"
   - Essayez de vous connecter
   - Regardez les requêtes vers Supabase (filtrer par "supabase")
   - Cliquez sur une requête rouge
   - Copiez le message d'erreur

3. **Screenshot** de l'onglet Network montrant les requêtes vers Supabase

4. **Confirmation** que vous avez bien :
   - Ajouté jobguinee.com dans Supabase
   - Attendu 5 minutes après la sauvegarde
   - Vidé le cache du navigateur

---

## 💡 SOLUTION RAPIDE (si vous êtes pressé)

Si vous voulez tester rapidement sans attendre :

1. **Ouvrez Supabase Dashboard**
2. **Settings → Authentication → URL Configuration**
3. **Dans "Additional Redirect URLs"**, ajoutez simplement :
   ```
   https://jobguinee.com/**
   ```
4. **Save**
5. **Attendez 2 minutes**
6. **Videz le cache** (Ctrl+Shift+R) et testez

C'est généralement suffisant pour résoudre 90% des problèmes "Failed to fetch".
