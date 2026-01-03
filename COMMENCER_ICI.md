# 🎯 COMMENCER ICI - Activation en 3 étapes

**Temps total : 10 minutes**

---

## 📍 Vous êtes ici

Le système de déploiement automatique **Bolt.new → GitHub → Hostinger** est **configuré et prêt**.

Il ne reste que **3 actions simples** pour l'activer.

---

## ✅ Étape 1 : Préparer vos informations (5 min)

### A. Informations Supabase

1. Aller sur : https://app.supabase.com
2. Ouvrir votre projet JobGuinée
3. **Settings → API**
4. Noter :
   ```
   URL du projet : https://__________.supabase.co
   Clé anon/public : eyJhbGc______________
   ```

### B. Informations Hostinger FTP

1. Aller sur votre panneau Hostinger
2. **Fichiers → Comptes FTP**
3. Noter :
   ```
   Host : ftp.votredomaine.com (ou IP)
   Username : _______________
   Password : _______________
   Dossier : /public_html/ (à confirmer)
   ```

### C. URL de votre site

```
https://jobguinee.com (ou votre domaine)
```

**✓ 7 informations notées → Étape 2**

---

## ✅ Étape 2 : Configurer GitHub Secrets (3 min)

1. Aller sur GitHub : `https://github.com/votre-org/jobguinee`
2. **Settings → Secrets and variables → Actions**
3. **New repository secret** (répéter 7 fois)

### Les 7 secrets à créer :

| Nom du secret | Valeur à copier |
|---------------|-----------------|
| `VITE_SUPABASE_URL` | URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `FTP_HOST` | Host FTP |
| `FTP_USERNAME` | Username FTP |
| `FTP_PASSWORD` | Password FTP |
| `FTP_SERVER_DIR` | `/public_html/` |
| `SITE_URL` | URL de votre site |

**⚠️ Important :** Les noms doivent être EXACTEMENT comme ci-dessus.

**✓ 7 secrets créés → Étape 3**

---

## ✅ Étape 3 : Premier déploiement (2 min)

### Dans Bolt.new

1. Ouvrir `README.md`
2. Ajouter à la fin :
   ```
   <!-- Test déploiement automatique -->
   ```
3. **Sauvegarder**

### Sur GitHub

1. **Actions** (onglet)
2. Voir le workflow qui démarre (cercle orange)
3. Attendre 3-5 minutes

### Résultat

- ✅ **Vert** = Déploiement réussi !
- ❌ **Rouge** = Cliquer pour voir les logs

**✓ Workflow vert → Terminé !**

---

## 🎉 Système activé !

### Vérifier votre site

Ouvrir : `https://jobguinee.com`

Le site devrait être :
- ✅ Accessible
- ✅ En HTTPS (cadenas vert)
- ✅ Fonctionnel

### À partir de maintenant

**Workflow de travail :**
1. Modifier dans Bolt.new
2. Sauvegarder
3. **Automatique** → GitHub → Build → Hostinger
4. Site mis à jour en 3-5 min ✅

**Aucune action manuelle !** 🚀

---

## 🐛 Si problème

### Le workflow échoue

1. Cliquer sur le workflow rouge
2. Lire les logs
3. Causes fréquentes :
   - Secret mal orthographié
   - Credentials FTP incorrects
   - Erreur de build (tester : `npm run build`)

### Le site ne charge pas

1. Vérifier `FTP_SERVER_DIR` (bon chemin ?)
2. Vérifier les secrets Supabase
3. Vider le cache navigateur (Ctrl+Shift+R)

### Besoin d'aide détaillée

**Guide complet :** [ACTIVATION_IMMEDIATE.md](./ACTIVATION_IMMEDIATE.md)

---

## 📚 Documentation disponible

Selon votre besoin :

| Document | Utilité |
|----------|---------|
| **COMMENCER_ICI.md** | Vous êtes ici - Activation rapide |
| **ACTIVATION_IMMEDIATE.md** | Guide détaillé avec explications |
| **DEPLOYMENT_GUIDE.md** | Guide complet (650 lignes) |
| **DEPLOYMENT_CHECKLIST.md** | Checklist de validation |
| **ETAT_ACTUEL.md** | Où en est le système |

---

## ⏱️ Récapitulatif temps

- **Étape 1** : Préparer infos → 5 min
- **Étape 2** : Configurer secrets → 3 min
- **Étape 3** : Tester déploiement → 2 min

**TOTAL : 10 minutes**

---

## ✅ Checklist ultra-rapide

Avant de commencer :
- [ ] J'ai accès à GitHub
- [ ] J'ai accès à Supabase
- [ ] J'ai accès à Hostinger
- [ ] J'ai 10 minutes devant moi

Pendant l'activation :
- [ ] 7 secrets créés sur GitHub
- [ ] Commit de test fait
- [ ] Workflow exécuté

Après activation :
- [ ] Site accessible en HTTPS
- [ ] Page d'accueil fonctionne
- [ ] Pas d'erreur en console

**Tout coché ? Système actif ! 🎉**

---

**👉 ACTION : Commencer l'Étape 1 maintenant**

---

*Note : Ce fichier est un raccourci. Pour plus de détails, voir ACTIVATION_IMMEDIATE.md*
