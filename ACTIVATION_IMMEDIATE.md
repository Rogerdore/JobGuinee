# 🚀 Activation Immédiate du Déploiement Automatique

**Temps estimé : 10 minutes**

Suivez ces étapes dans l'ordre pour activer le déploiement automatique.

---

## ✅ Étape 1 : Vérifier que GitHub est connecté (1 min)

### Dans Bolt.new

1. Vérifier que le projet est bien connecté à GitHub
2. Les modifications sont automatiquement poussées
3. Vérifier sur GitHub que les nouveaux fichiers sont présents :
   - `.github/workflows/`
   - `scripts/deployment/`
   - `DEPLOYMENT_GUIDE.md`

**✓ Si vous voyez ces fichiers sur GitHub → Passez à l'étape 2**

---

## ✅ Étape 2 : Récupérer les informations Supabase (2 min)

### Aller sur Supabase

1. Ouvrir : https://app.supabase.com
2. Sélectionner votre projet JobGuinée
3. Aller dans **Settings → API**

### Noter ces 2 valeurs

```
VITE_SUPABASE_URL = https://xxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**✓ Valeurs notées → Passez à l'étape 3**

---

## ✅ Étape 3 : Récupérer les informations Hostinger (3 min)

### Aller sur Hostinger

1. Se connecter au panneau Hostinger
2. Aller dans **Fichiers → Comptes FTP**

### Noter ces 4 valeurs

```
FTP_HOST = ftp.votredomaine.com (ou IP FTP)
FTP_USERNAME = votre_username@votredomaine.com
FTP_PASSWORD = votre_mot_de_passe
FTP_SERVER_DIR = /public_html/ (ou votre chemin)
```

### Déterminer le bon chemin

Le `FTP_SERVER_DIR` dépend de votre configuration :
- Domaine principal : `/public_html/`
- Sous-domaine : `/public_html/sousdomaine/`
- Domaine addon : `/domains/votredomaine.com/public_html/`

**Astuce** : Connectez-vous en FTP avec un client (FileZilla) pour voir la structure.

### Votre URL de site

```
SITE_URL = https://jobguinee.com (votre domaine)
```

**✓ 7 valeurs notées → Passez à l'étape 4**

---

## ✅ Étape 4 : Configurer les Secrets GitHub (3 min)

### Sur GitHub

1. Aller sur votre repository : `https://github.com/votre-org/jobguinee`
2. Cliquer sur **Settings** (onglet en haut)
3. Dans la barre latérale : **Secrets and variables → Actions**
4. Cliquer sur **New repository secret**

### Ajouter les 7 secrets (un par un)

Pour chaque secret :
1. Cliquer sur "New repository secret"
2. Entrer le nom EXACTEMENT comme indiqué
3. Coller la valeur
4. Cliquer sur "Add secret"

**Secret 1 :**
```
Name: VITE_SUPABASE_URL
Value: https://xxxxxxxxxx.supabase.co
```

**Secret 2 :**
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Secret 3 :**
```
Name: FTP_HOST
Value: ftp.votredomaine.com
```

**Secret 4 :**
```
Name: FTP_USERNAME
Value: votre_username@votredomaine.com
```

**Secret 5 :**
```
Name: FTP_PASSWORD
Value: votre_mot_de_passe
```

**Secret 6 :**
```
Name: FTP_SERVER_DIR
Value: /public_html/
```

**Secret 7 :**
```
Name: SITE_URL
Value: https://jobguinee.com
```

### Vérifier

Vous devriez voir 7 secrets dans la liste :
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- FTP_HOST
- FTP_USERNAME
- FTP_PASSWORD
- FTP_SERVER_DIR
- SITE_URL

**✓ 7 secrets configurés → Passez à l'étape 5**

---

## ✅ Étape 5 : Premier déploiement de test (2 min)

### Dans Bolt.new

1. Ouvrir le fichier `README.md`
2. Ajouter une ligne de test à la fin :
   ```
   <!-- Test déploiement automatique -->
   ```
3. Sauvegarder

### Sur GitHub

1. Aller sur votre repository
2. Cliquer sur l'onglet **Actions**
3. Vous devriez voir un workflow en cours (cercle orange animé)

### Suivre le déploiement

Le workflow prend 3-5 minutes :
- ⏳ **En cours** (orange) : Patient...
- ✅ **Succès** (vert) : Déploiement réussi !
- ❌ **Échec** (rouge) : Voir les logs pour comprendre

**Si échec** : Cliquer sur le workflow → Voir les logs → Identifier l'erreur

**✓ Workflow vert → Passez à l'étape 6**

---

## ✅ Étape 6 : Vérifier le site (1 min)

### Ouvrir votre site

1. Aller sur : `https://jobguinee.com` (votre domaine)
2. Le site devrait être accessible
3. Vérifier :
   - [ ] Page d'accueil se charge
   - [ ] HTTPS actif (cadenas vert)
   - [ ] Pas d'erreur dans la console (F12)
   - [ ] Navigation fonctionne

### Si le site ne charge pas

**Problème 1 : Site en blanc**
→ Vérifier le `FTP_SERVER_DIR` dans les secrets GitHub

**Problème 2 : Erreurs CORS**
→ Vérifier les URLs Supabase dans les secrets

**Problème 3 : 404 partout**
→ Vérifier que le `.htaccess` est présent (voir logs FTP)

**✓ Site accessible et fonctionnel → TERMINÉ !**

---

## 🎉 Félicitations !

Votre système de déploiement automatique est activé !

### À partir de maintenant

**Workflow quotidien :**
1. Modifier le code dans Bolt.new
2. Sauvegarder
3. **C'est tout !** 🚀

**Le système s'occupe de :**
- Push vers GitHub ✓
- Build automatique ✓
- Tests automatiques ✓
- Déploiement FTP ✓
- Vérifications ✓

**Temps de déploiement : 3-5 minutes**

---

## 📊 Monitoring

### Voir les déploiements

Sur GitHub → Actions → Vous verrez tous les déploiements :
- Qui a déployé
- Quand
- Statut (succès/échec)
- Logs complets

### Recevoir des notifications

GitHub → Settings → Notifications → Personnaliser les alertes

---

## 🐛 Si problème

### Le workflow échoue constamment

1. Vérifier les secrets GitHub (tous présents et corrects ?)
2. Tester le build localement : `npm run build`
3. Consulter : [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting)

### Le site ne se met pas à jour

1. Vérifier que le workflow GitHub est vert
2. Vider le cache du navigateur (Ctrl + Shift + R)
3. Vérifier les credentials FTP

### Besoin d'aide

Consulter les guides complets :
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 📝 Checklist finale

Cochez tout avant de considérer l'activation terminée :

- [ ] Repository GitHub connecté à Bolt.new
- [ ] 7 secrets configurés dans GitHub
- [ ] Premier workflow exécuté avec succès
- [ ] Site accessible en HTTPS
- [ ] Page d'accueil fonctionne
- [ ] Connexion fonctionne
- [ ] Aucune erreur critique

**Tout coché ?** → **Système activé ! 🚀**

---

## 🎯 Prochaines utilisations

Désormais, pour chaque modification :

1. **Dans Bolt.new** : Modifier le code
2. **Sauvegarder** : Push automatique
3. **Attendre 3-5 min** : Déploiement automatique
4. **Vérifier** : Site mis à jour

**Aucune manipulation manuelle nécessaire !**

---

**Date d'activation** : _____________

**Activé par** : _____________

**Statut** : ✅ Système de déploiement automatique ACTIF
