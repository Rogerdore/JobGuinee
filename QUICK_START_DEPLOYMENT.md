# ⚡ Guide de Démarrage Rapide - Déploiement JobGuinée

**Temps estimé : 15-20 minutes**

Ce guide vous permet de mettre en place le déploiement continu en quelques étapes simples.

---

## 🎯 Objectif

Configurer un pipeline automatique :
```
Bolt.new → GitHub → Hostinger
```

---

## ✅ Étape 1 : GitHub Repository (2 min)

### 1.1 Créer le repository

1. Aller sur [github.com](https://github.com)
2. Cliquer sur "New repository"
3. Nom : `jobguinee` (ou votre choix)
4. Privé ou Public : Selon votre choix
5. **Ne pas** initialiser avec README (déjà présent)
6. Créer

### 1.2 Vérifier la connexion depuis Bolt.new

Bolt.new devrait automatiquement pousser le code. Vérifier que :
- Les commits apparaissent sur GitHub
- La branche `main` existe

✅ **Repository configuré !**

---

## 🔐 Étape 2 : GitHub Secrets (5 min)

Sur GitHub, aller dans :
```
Repository → Settings → Secrets and variables → Actions → New repository secret
```

Ajouter ces 7 secrets (un par un) :

| Secret | Valeur |
|--------|--------|
| `VITE_SUPABASE_URL` | URL Supabase (ex: https://xxx.supabase.co) |
| `VITE_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `FTP_HOST` | Host FTP Hostinger (ex: ftp.jobguinee.com) |
| `FTP_USERNAME` | Username FTP |
| `FTP_PASSWORD` | Password FTP |
| `FTP_SERVER_DIR` | Chemin (ex: /public_html/) |
| `SITE_URL` | URL site (ex: https://jobguinee.com) |

### Où trouver ces informations ?

**Supabase** :
```
https://app.supabase.com → Votre projet → Settings → API
```

**Hostinger FTP** :
```
Panneau Hostinger → Fichiers → FTP Accounts
```

✅ **Secrets configurés !**

---

## 🌐 Étape 3 : Hostinger SSL (2 min)

1. Aller dans le panneau Hostinger
2. Chercher "SSL" ou "Certificats"
3. Installer un certificat Let's Encrypt (gratuit)
4. Attendre 2-5 minutes pour activation

✅ **HTTPS activé !**

---

## ✅ Étape 4 : Test de déploiement (5 min)

### 4.1 Déclencher un déploiement

Dans Bolt.new :
1. Modifier un fichier (ex: ajouter un commentaire dans `README.md`)
2. Sauvegarder
3. Le push vers GitHub est automatique

### 4.2 Suivre le déploiement

Sur GitHub :
```
Repository → Actions
```

Vous verrez le workflow s'exécuter :
- ⏳ En cours (cercle orange)
- ✅ Réussi (coche verte)
- ❌ Échoué (croix rouge)

**Durée normale : 3-5 minutes**

### 4.3 Vérifier le site

Aller sur votre URL : `https://jobguinee.com`

Le site devrait être accessible !

✅ **Premier déploiement réussi !**

---

## 🧪 Étape 5 : Vérification (3 min)

Tester ces éléments :

- [ ] Site accessible en HTTPS
- [ ] Page d'accueil se charge
- [ ] Navigation fonctionne
- [ ] Connexion fonctionne
- [ ] Aucune erreur dans la console (F12)

Si tout fonctionne : **🎉 Félicitations !**

---

## 🔄 Utilisation quotidienne

Désormais, à chaque modification dans Bolt.new :

1. **Vous modifiez** le code
2. **Vous sauvegardez**
3. **C'est tout !** 🚀

Le reste est automatique :
- Push vers GitHub
- Build automatique
- Tests automatiques
- Déploiement vers Hostinger
- Vérification automatique

**Temps : 3-5 minutes par déploiement**

---

## 🐛 Problèmes courants

### Le workflow échoue

1. Aller sur GitHub → Actions
2. Cliquer sur le workflow échoué
3. Lire les logs pour identifier l'erreur
4. Causes fréquentes :
   - Secret GitHub manquant ou incorrect
   - Erreur de build (vérifier localement avec `npm run build`)
   - Credentials FTP invalides

### Le site est en blanc

1. Vérifier que `FTP_SERVER_DIR` est correct
2. Vérifier les logs GitHub Actions
3. Essayer un déploiement manuel via FTP

### HTTPS ne fonctionne pas

1. Attendre 5-10 minutes (propagation SSL)
2. Vérifier le certificat dans Hostinger
3. Réinstaller le certificat si nécessaire

---

## 📚 Aller plus loin

Documentation complète disponible :

- [Guide de déploiement complet](./DEPLOYMENT_GUIDE.md) - Tous les détails
- [Checklist de déploiement](./DEPLOYMENT_CHECKLIST.md) - À suivre avant chaque déploiement
- [Scripts de déploiement](./scripts/deployment/README.md) - Documentation des scripts

---

## 🎯 Checklist finale

Vous avez terminé si :

- ✅ Repository GitHub créé
- ✅ 7 secrets GitHub configurés
- ✅ SSL Hostinger activé
- ✅ Premier déploiement réussi
- ✅ Site accessible et fonctionnel

---

## 🤝 Besoin d'aide ?

1. Consulter [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) section "Troubleshooting"
2. Vérifier GitHub Actions logs
3. Contacter le support technique

---

**🚀 Bon déploiement !**

Vous pouvez maintenant développer sereinement dans Bolt.new.
Chaque modification sera automatiquement déployée en production ! 🎉
