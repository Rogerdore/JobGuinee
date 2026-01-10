# 🔧 Guide de Résolution: "Failed to fetch"

## ❌ Problème

Vous voyez l'erreur **"Failed to fetch"** sur la page de connexion JobGuinée.

![Erreur Failed to fetch](https://via.placeholder.com/600x400/ff4444/ffffff?text=Failed+to+fetch)

---

## 🔍 Diagnostic Rapide

### Étape 1: Ouvrir la Page de Test

1. Démarrez votre application:
   ```bash
   npm run dev
   ```

2. Ouvrez dans votre navigateur:
   ```
   http://localhost:5173/test-connexion.html
   ```

3. La page effectuera automatiquement 4 tests:
   - ✅ Variables d'environnement
   - ✅ Connexion réseau Supabase
   - ✅ Service d'authentification
   - ✅ Recherche utilisateur

---

## 💡 Solutions par Cause

### Cause 1: Variables d'Environnement Manquantes

**Symptômes:**
- Le Test 1 échoue
- Message: "Variables d'environnement manquantes"

**Solution:**

1. Vérifiez que le fichier `.env` existe à la racine du projet

2. Vérifiez qu'il contient:
   ```env
   VITE_SUPABASE_URL=https://hhhjzgeidjgctuveopso.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Redémarrez le serveur:
   ```bash
   # Ctrl+C pour arrêter
   npm run dev
   ```

4. Rechargez la page avec F5

---

### Cause 2: Problème de Connexion Internet

**Symptômes:**
- Le Test 2 échoue
- Message: "Impossible de se connecter à Supabase"
- Erreur: "NetworkError" ou "fetch failed"

**Solution:**

1. **Vérifiez votre connexion internet**
   - Ouvrez https://www.google.com pour tester
   - Vérifiez que vous êtes bien connecté

2. **Désactivez les extensions du navigateur**
   - AdBlock, Privacy Badger, uBlock Origin peuvent bloquer Supabase
   - Ouvrez le navigateur en mode privé (Ctrl+Shift+N)
   - Testez à nouveau

3. **Vérifiez le firewall**
   - Certains firewalls d'entreprise bloquent Supabase
   - Demandez à votre administrateur réseau
   - Testez depuis un autre réseau (4G mobile)

4. **Videz le cache du navigateur**
   - Appuyez sur Ctrl+Shift+Delete
   - Cochez "Images et fichiers en cache"
   - Cliquez sur "Effacer les données"
   - Rechargez avec F5

---

### Cause 3: CORS ou Sécurité Navigateur

**Symptômes:**
- Erreur dans la console: "CORS policy"
- Tests 1 et 2 réussis, mais connexion échoue

**Solution:**

1. **Ouvrez la Console du Navigateur**
   - F12 ou Ctrl+Shift+I
   - Onglet "Console"
   - Regardez les erreurs en rouge

2. **Si vous voyez "CORS":**
   - C'est un problème de configuration Supabase
   - Allez sur https://supabase.com/dashboard
   - Vérifiez les "URL autorisées" dans Settings > API

3. **Essayez un autre navigateur:**
   - Chrome → Firefox
   - Edge → Chrome
   - Pour éliminer un problème de navigateur

---

### Cause 4: Utilisateur Inexistant

**Symptômes:**
- Tests 1, 2, 3 réussis
- Test 4 échoue: "Utilisateur introuvable"

**Solution:**

1. **Créez un nouveau compte**
   - Sur la page de connexion, cliquez "Pas encore de compte ? S'inscrire"
   - Remplissez le formulaire d'inscription
   - Utilisez l'email: `doreroger07@gmail.com`
   - Choisissez un mot de passe sécurisé

2. **Ou utilisez le compte de test**
   - Email: `test@jobguinee.gn`
   - Mot de passe: `Test123456!`

---

## 🚀 Solution Express (5 minutes)

Si vous voulez juste que ça marche rapidement:

```bash
# 1. Arrêter le serveur
Ctrl+C

# 2. Vérifier le .env
cat .env

# 3. Rebuilder
npm run build

# 4. Redémarrer
npm run dev

# 5. Ouvrir le navigateur en mode privé
Ctrl+Shift+N

# 6. Aller sur
http://localhost:5173

# 7. S'inscrire avec un nouveau compte
```

---

## 🔧 Commandes de Diagnostic

### Vérifier la configuration Supabase:
```bash
node verify-supabase-config.js
```

### Créer un utilisateur de test:
```bash
node create-test-user.js
```

### Tester la connexion:
```bash
node test-supabase-connection.js
```

---

## 📞 Toujours Bloqué ?

Si rien ne fonctionne:

1. **Vérifiez les logs du serveur**
   - Regardez le terminal où tourne `npm run dev`
   - Cherchez les erreurs en rouge

2. **Vérifiez la console du navigateur**
   - F12 → Console
   - Copiez les erreurs

3. **Vérifiez que Supabase est en ligne**
   - Allez sur https://status.supabase.com
   - Vérifiez qu'il n'y a pas de panne

4. **Testez avec curl**
   ```bash
   curl https://hhhjzgeidjgctuveopso.supabase.co/rest/v1/
   ```

   Si ça échoue → Problème réseau
   Si ça fonctionne → Problème dans l'app

---

## ✅ Checklist de Résolution

- [ ] Fichier `.env` existe et contient les bonnes clés
- [ ] Serveur redémarré après modification `.env`
- [ ] Internet fonctionne (test google.com)
- [ ] Extensions navigateur désactivées
- [ ] Cache navigateur vidé (Ctrl+Shift+Delete)
- [ ] Testé en navigation privée
- [ ] Page de test ouverte: `/test-connexion.html`
- [ ] Tous les tests passent au vert
- [ ] Utilisateur existe dans la base de données

---

## 🎯 Résultat Attendu

Quand tout fonctionne, vous devriez voir:

```
✅ Variables d'environnement: RÉUSSI
✅ Connexion réseau Supabase: RÉUSSI
✅ Service d'authentification: RÉUSSI
✅ Recherche utilisateur: RÉUSSI
```

Et la connexion devrait fonctionner sans erreur "Failed to fetch".

---

## 🆘 Support

Si le problème persiste:
- Vérifiez que votre projet Supabase existe bien
- Vérifiez que les clés ne sont pas expirées
- Contactez le support Supabase si nécessaire

---

*Guide créé le 10 janvier 2026*
