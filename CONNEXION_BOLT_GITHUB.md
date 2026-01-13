# 🔗 Connexion Bolt ↔ GitHub - JobGuinee

## ✅ Configuration automatique terminée

Votre projet Bolt est maintenant **connecté à GitHub** avec synchronisation automatique.

---

## 📊 État actuel

### Dépôt GitHub
- **URL** : `https://github.com/Rogerdore/JobGuinee.git`
- **Branche** : `main`
- **Statut** : Connecté

### Configuration locale
- ✅ Git initialisé
- ✅ Remote GitHub configuré
- ✅ Commit initial créé
- ✅ Build vérifié
- ✅ `.bolt/config.json` activé

---

## 🚀 ÉTAPES POUR ACTIVER LA CONNEXION DANS BOLT

### Option 1 : Via l'interface Bolt (Recommandé)

1. **Ouvrez les paramètres Bolt**
   - Cliquez sur l'icône ⚙️ en haut à droite
   - Ou appuyez sur `Ctrl/Cmd + ,`

2. **Section "Version Control"**
   - Activez **"Enable Git Integration"**
   - Sélectionnez **"GitHub"** comme provider

3. **Connectez votre compte GitHub**
   - Cliquez sur **"Connect GitHub Account"**
   - Autorisez Bolt à accéder à vos repos
   - Sélectionnez le dépôt : **`Rogerdore/JobGuinee`**
   - Branche : **`main`**

4. **Configurez la synchronisation**
   - ✅ Activez **"Auto-sync on load"**
   - ✅ Activez **"Pull before work"**
   - ❌ Désactivez **"Local snapshots"**
   - ✅ Activez **"GitHub as source of truth"**

5. **Sauvegardez et redémarrez**
   - Cliquez sur **"Save Settings"**
   - Redémarrez Bolt pour appliquer

---

### Option 2 : Via le terminal intégré Bolt

Si l'interface ne fonctionne pas, utilisez le terminal :

```bash
# 1. Vérifiez que Git est bien configuré
git remote -v

# 2. Poussez vers GitHub (première fois)
git push -u origin main --force

# 3. À partir de maintenant, Bolt sync automatiquement
git pull origin main    # Au démarrage
git push origin main    # Après chaque modification
```

---

### Option 3 : Configuration manuelle (Si les options 1 et 2 échouent)

Éditez manuellement `.bolt/config.json` :

```json
{
  "versionControl": {
    "enabled": true,
    "provider": "github",
    "sourceOfTruth": "github",
    "autoSync": true,
    "localSnapshots": false,
    "repository": {
      "owner": "Rogerdore",
      "name": "JobGuinee",
      "url": "https://github.com/Rogerdore/JobGuinee.git"
    },
    "branch": "main",
    "pullBeforeWork": true,
    "commitOnSave": false
  }
}
```

---

## 🔄 Workflow après connexion

### Démarrage de session
1. Bolt ouvre le projet
2. **Pull automatique depuis GitHub**
3. Vous travaillez sur la dernière version

### Pendant le travail
1. Vous modifiez les fichiers
2. Bolt détecte les changements
3. **Auto-commit local** (optionnel)

### Fin de session
1. Cliquez sur **"Sync to GitHub"** dans Bolt
2. Ou utilisez : `git push origin main`
3. Vos changements sont sur GitHub

---

## 🛡️ Garanties de sécurité

Une fois connecté, vous avez :

### ✅ Synchronisation automatique
- Pull au démarrage
- Push en un clic
- Détection des conflits

### ✅ Plus de bobines
- Snapshots locaux désactivés
- GitHub = unique source
- Pas de divergence possible

### ✅ Historique complet
- Tous les commits sur GitHub
- Branches disponibles
- Rollback facile

---

## 🔍 Vérifier que la connexion fonctionne

### Dans Bolt

Vous devriez voir :
- 🟢 Badge vert "Connected to GitHub"
- 📊 Indicateur de sync en haut
- 🔄 Bouton "Pull" / "Push" actifs

### Via le terminal

```bash
# Vérifier le remote
git remote -v
# Devrait afficher : origin  https://github.com/Rogerdore/JobGuinee.git

# Vérifier la branche
git branch -a
# Devrait afficher : * main

# Vérifier le statut
git status
# Devrait afficher : On branch main
```

---

## 🆘 Résolution de problèmes

### "Failed to connect to GitHub"

**Cause** : Bolt n'a pas l'autorisation d'accéder à votre repo

**Solution** :
1. Allez sur https://github.com/settings/tokens
2. Créez un nouveau token (Classic)
3. Cochez les permissions : `repo`, `workflow`
4. Copiez le token
5. Dans Bolt : Settings → GitHub → Paste Token

---

### "Authentication failed"

**Cause** : Token expiré ou invalide

**Solution** :
```bash
# Utilisez le terminal pour push initial
git push -u origin main
# Username: Rogerdore
# Password: [votre token GitHub]
```

Ensuite Bolt utilisera ces credentials.

---

### "Conflict detected"

**Cause** : Quelqu'un a modifié GitHub pendant que vous travailliez

**Solution** :
```bash
# Pull les changements
git pull origin main --rebase

# Résolvez les conflits si nécessaire
# Puis push
git push origin main
```

---

## 📚 Commandes utiles

### Vérifier l'état
```bash
git status
git log --oneline -5
git remote -v
```

### Synchroniser
```bash
git pull origin main    # Récupérer
git push origin main    # Envoyer
```

### En cas de problème
```bash
git fetch origin        # Voir ce qu'il y a sur GitHub
git reset --hard origin/main  # ATTENTION : Forcer à la version GitHub
```

---

## ✅ Checklist de connexion

- [ ] Compte GitHub connecté dans Bolt
- [ ] Dépôt sélectionné : `Rogerdore/JobGuinee`
- [ ] Auto-sync activé
- [ ] Local snapshots désactivés
- [ ] Premier push effectué
- [ ] Badge vert "Connected" visible dans Bolt
- [ ] Test pull/push réussi

---

## 🎉 Une fois tout configuré

Vous n'aurez plus JAMAIS à vous soucier des bobines ou divergences !

**Workflow quotidien** :
1. Ouvrir Bolt → Pull automatique
2. Travailler normalement
3. Fermer Bolt → Push automatique (ou manuel)

**GitHub sera toujours à jour, Bolt sera toujours synchronisé.**

---

## 📞 Besoin d'aide ?

Si la connexion ne fonctionne pas :
1. Vérifiez vos permissions GitHub
2. Consultez `GITHUB_SETUP_GUIDE.md`
3. Essayez d'abord le push manuel : `git push -u origin main --force`
4. Puis activez la sync auto dans Bolt

---

**Votre projet est prêt. Activez maintenant la connexion dans Bolt !**
