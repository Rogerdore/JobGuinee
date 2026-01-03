# 🚀 Scripts de Déploiement JobGuinée

Ce dossier contient les scripts nécessaires pour le déploiement et la maintenance de JobGuinée.

## 📁 Scripts disponibles

### 1. `pre-deploy-check.sh`

**Description** : Vérifie que l'environnement est prêt avant le déploiement.

**Usage** :
```bash
./scripts/deployment/pre-deploy-check.sh
```

**Vérifie** :
- Installation de Node.js et npm
- Présence des dépendances
- Configuration des variables d'environnement
- Structure du projet
- Sécurité (pas de secrets exposés)
- Succès du build
- Type checking TypeScript
- Configuration Git
- Scripts npm

**Sortie** :
- ✅ PRÊT POUR LE DÉPLOIEMENT : Tout est OK
- ⚠️ DÉPLOIEMENT AVEC PRÉCAUTION : Problèmes mineurs
- ❌ NE PAS DÉPLOYER : Problèmes critiques

---

### 2. `deploy.sh`

**Description** : Script principal de déploiement (utilisé par GitHub Actions).

**Usage** :
```bash
# Avec variables d'environnement
FTP_HOST=ftp.example.com \
FTP_USERNAME=user \
FTP_PASSWORD=pass \
FTP_SERVER_DIR=/public_html/ \
./scripts/deployment/deploy.sh
```

**Actions** :
1. Vérifie l'environnement
2. Vérifie les variables d'environnement requises
3. Crée le fichier `.htaccess` pour SPA
4. Effectue des vérifications de sécurité
5. Affiche les statistiques du build
6. Prépare le déploiement FTP

**Note** : Le déploiement FTP réel est géré par GitHub Actions avec l'action `FTP-Deploy-Action`.

---

### 3. `verify-deployment.sh`

**Description** : Vérifie que le déploiement est réussi et fonctionnel.

**Usage** :
```bash
# Avec l'URL par défaut
./scripts/deployment/verify-deployment.sh

# Avec URL personnalisée
SITE_URL=https://votresite.com ./scripts/deployment/verify-deployment.sh
```

**Tests effectués** :
- ✓ Disponibilité de la page d'accueil
- ✓ Redirection HTTPS active
- ✓ Chargement des assets statiques
- ✓ Configuration SPA (fallback vers index.html)
- ✓ Headers de sécurité
- ✓ Temps de réponse (< 3 secondes)

**Sortie** :
- ✅ Tous les tests réussis : Déploiement OK
- ⚠️ Tests partiellement réussis : À vérifier
- ❌ Tests échoués : Problème critique

---

## 🔧 Configuration requise

### Variables d'environnement

Les scripts utilisent ces variables :

| Variable | Description | Requis pour |
|----------|-------------|-------------|
| `FTP_HOST` | Host FTP Hostinger | `deploy.sh` |
| `FTP_USERNAME` | Username FTP | `deploy.sh` |
| `FTP_PASSWORD` | Password FTP | `deploy.sh` |
| `FTP_SERVER_DIR` | Chemin de destination | `deploy.sh` |
| `SITE_URL` | URL du site en production | `verify-deployment.sh` |

### Dépendances système

- **Bash** >= 4.0
- **curl** (pour vérifications HTTP)
- **bc** (pour calculs, vérification de temps)
- **Node.js** >= 18
- **npm** >= 8

---

## 📋 Workflow recommandé

### 1. Avant le déploiement

```bash
# Vérifier que tout est prêt
./scripts/deployment/pre-deploy-check.sh
```

### 2. Déploiement

Le déploiement est automatique via GitHub Actions, mais vous pouvez tester localement :

```bash
# Build local
npm run build

# Test du script de déploiement (sans FTP réel)
./scripts/deployment/deploy.sh
```

### 3. Après le déploiement

```bash
# Vérifier le déploiement
SITE_URL=https://jobguinee.com ./scripts/deployment/verify-deployment.sh
```

---

## 🐛 Dépannage

### "Permission denied" lors de l'exécution

```bash
# Rendre les scripts exécutables
chmod +x scripts/deployment/*.sh
```

### "command not found: bc"

```bash
# Sur Ubuntu/Debian
sudo apt-get install bc

# Sur macOS
brew install bc
```

### "curl: command not found"

```bash
# Sur Ubuntu/Debian
sudo apt-get install curl

# Sur macOS
brew install curl
```

### Build échoue dans pre-deploy-check.sh

```bash
# Voir les logs détaillés
cat /tmp/build.log

# Tester manuellement
npm run build
```

---

## 📚 Documentation supplémentaire

- [Guide de déploiement complet](../../DEPLOYMENT_GUIDE.md)
- [Checklist de déploiement](../../DEPLOYMENT_CHECKLIST.md)
- [Configuration des variables d'environnement](../../.env.example.production)

---

## 🤝 Contribution

Pour modifier ou améliorer ces scripts :

1. Tester localement
2. Documenter les changements
3. Mettre à jour ce README si nécessaire
4. Commiter via Bolt.new

---

## 📞 Support

En cas de problème avec les scripts :

1. Vérifier les logs : `/tmp/build.log`, `/tmp/typecheck.log`
2. Consulter le guide de dépannage dans `DEPLOYMENT_GUIDE.md`
3. Contacter le support technique

---

**Note** : Ces scripts sont conçus pour être exécutés dans un environnement Linux/Unix (Bash). Pour Windows, utiliser WSL ou Git Bash.
