# ⚡ ACTIVATION BOLT ↔ GITHUB - ACTION IMMÉDIATE

## 🎯 Votre mission : Connecter Bolt à GitHub en 3 minutes

---

## 🚀 MÉTHODE RAPIDE (3 étapes)

### ÉTAPE 1 : Push initial vers GitHub
**Temps : 30 secondes**

Ouvrez le terminal Bolt et exécutez :

```bash
git push -u origin main --force
```

Si demandé :
- **Username** : `Rogerdore`
- **Password** : [Votre token GitHub ou mot de passe]

**✅ Résultat** : Votre code est maintenant sur GitHub !

---

### ÉTAPE 2 : Activer la synchronisation dans Bolt
**Temps : 1 minute**

#### Option A - Interface Bolt

1. Cliquez sur ⚙️ (Paramètres) en haut à droite
2. Section **"Version Control"** ou **"Git Integration"**
3. **Activez** : Enable Git
4. **Provider** : GitHub
5. **Repository** : `Rogerdore/JobGuinee`
6. **Branch** : `main`
7. **Cochez** : Auto-sync, Pull before work
8. **Décochez** : Local snapshots
9. **Sauvegardez**

#### Option B - Token GitHub (si besoin)

Si Bolt demande un token :

1. Allez sur : https://github.com/settings/tokens/new
2. Nom du token : `Bolt-JobGuinee`
3. Cochez : `repo` (toutes les permissions repo)
4. Durée : 90 jours ou "No expiration"
5. Cliquez **"Generate token"**
6. **Copiez le token** (vous ne le reverrez plus !)
7. Collez-le dans Bolt

---

### ÉTAPE 3 : Tester la connexion
**Temps : 30 secondes**

Dans le terminal Bolt :

```bash
# Test 1 : Vérifier le remote
git remote -v

# Test 2 : Vérifier la branche
git branch

# Test 3 : Pull (pour tester)
git pull origin main
```

**✅ Si tout est OK** : Vous verrez "Already up to date"

---

## 🎉 C'EST FAIT !

Vous avez maintenant :
- ✅ Bolt connecté à GitHub
- ✅ Synchronisation automatique
- ✅ Plus de bobines locales
- ✅ GitHub = source unique

---

## 📋 Workflow quotidien (ultra simple)

### Matin
```bash
git pull origin main
```
Ou laissez Bolt faire le pull automatique !

### Soir (ou après modifications)
```bash
git add .
git commit -m "Description des changements"
git push origin main
```

Ou cliquez sur **"Sync to GitHub"** dans Bolt !

---

## 🔴 IMPORTANT : Configuration déjà faite

Vous n'avez **RIEN à configurer manuellement** !

Tout est déjà prêt dans le projet :
- ✅ Git initialisé
- ✅ Remote configuré
- ✅ Commit créé
- ✅ `.bolt/config.json` configuré
- ✅ Build vérifié

**Il suffit d'exécuter les 3 étapes ci-dessus !**

---

## 🆘 Problème ?

### Erreur "Authentication failed"

**Solution 1** : Token GitHub
- Créez un token : https://github.com/settings/tokens/new
- Utilisez-le comme mot de passe

**Solution 2** : SSH
```bash
git remote set-url origin git@github.com:Rogerdore/JobGuinee.git
git push -u origin main
```

### Erreur "Conflict" ou "diverged"

**Solution** :
```bash
git push -u origin main --force
```
(C'est la première sync, on peut forcer)

### Bolt ne voit pas GitHub

**Solution** :
1. Fermez et rouvrez Bolt
2. Vérifiez dans Settings → Git que le repo est bien sélectionné
3. Essayez de faire un commit manuel pour forcer la connexion

---

## 🎯 Checklist finale

Après les 3 étapes, vérifiez :

- [ ] `git remote -v` montre : `origin  https://github.com/Rogerdore/JobGuinee.git`
- [ ] `git status` montre : `On branch main`
- [ ] Votre code est visible sur : https://github.com/Rogerdore/JobGuinee
- [ ] Badge vert dans Bolt (si disponible)
- [ ] Vous pouvez faire `git pull` et `git push` sans erreur

**Si tous les checks sont OK : FÉLICITATIONS !**

---

## 💡 Astuce Pro

Une fois connecté, vous pouvez :

1. **Voir l'historique** : `git log --oneline --graph`
2. **Créer des branches** : `git checkout -b feature/nouvelle-fonctionnalite`
3. **Revenir en arrière** : `git reset --hard <commit-hash>`
4. **Voir les différences** : `git diff`

---

## 🚀 COMMENCEZ MAINTENANT

**Ouvrez le terminal et tapez :**

```bash
git push -u origin main --force
```

**C'est parti !**

---

**Note** : Ce fichier fait partie de la configuration automatique. Tous les fichiers de configuration sont déjà en place, il ne reste que l'activation dans Bolt.
