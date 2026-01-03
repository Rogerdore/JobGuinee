# 🇬🇳 JobGuinée - Plateforme d'Emploi en Guinée

**Plateforme complète de recrutement et de gestion RH pour la Guinée**

[![Déploiement Automatique](https://img.shields.io/badge/déploiement-automatique-brightgreen)](./DEPLOYMENT_GUIDE.md)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-blue)](./.github/workflows/)
[![Documentation](https://img.shields.io/badge/docs-complète-orange)](./DEPLOYMENT_FILES_INDEX.md)

---

## 🚀 Déploiement Automatique

Ce projet est configuré avec un pipeline de déploiement continu automatique :

```
Bolt.new → GitHub → Hostinger
```

### Démarrage rapide (15 min)

👉 **[Guide de Démarrage Rapide](./QUICK_START_DEPLOYMENT.md)**

### Documentation complète

- 📖 **[Guide de Déploiement Complet](./DEPLOYMENT_GUIDE.md)** - Configuration détaillée
- ✅ **[Checklist de Déploiement](./DEPLOYMENT_CHECKLIST.md)** - Validation avant déploiement
- 📊 **[Résumé du Système](./DEPLOYMENT_SUMMARY.md)** - Vue d'ensemble
- 📁 **[Index des Fichiers](./DEPLOYMENT_FILES_INDEX.md)** - Navigation

---

## 💻 Développement Local

### Prérequis

- **Node.js** >= 18
- **npm** >= 8
- Compte **Supabase** (base de données)

### Installation

```bash
# 1. Cloner le projet (si depuis GitHub)
git clone https://github.com/votre-org/jobguinee.git
cd jobguinee

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos vraies valeurs Supabase

# 4. Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Scripts disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualiser le build
npm run typecheck    # Vérification TypeScript
npm run lint         # Vérification ESLint
```

---

## 🏗️ Architecture

### Stack Technique

- **Frontend** : React + TypeScript + Vite
- **Styling** : Tailwind CSS
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Supabase Auth
- **CI/CD** : GitHub Actions
- **Hébergement** : Hostinger

### Fonctionnalités Principales

- 🔐 **Authentification complète** (candidats, recruteurs, admins)
- 📝 **Publication d'offres** avec modération
- 🤖 **Services IA** (génération CV, lettres, matching)
- 💳 **Paiements** Orange Money & MTN Mobile Money
- 📊 **Tableau de bord** recruteur avec ATS complet
- 🎓 **Formations** et coaching professionnel
- 📈 **Analytics** et reporting
- 🌐 **SEO** optimisé pour Google Guinée

---

## 🔧 Configuration Production

### Variables d'environnement

Voir les fichiers d'exemple :
- **Développement** : [.env.example](./.env.example)
- **Production** : [.env.example.production](./.env.example.production)

### Secrets GitHub

Configuration requise dans `Settings → Secrets and variables → Actions` :

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | URL Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme Supabase |
| `FTP_HOST` | Host FTP Hostinger |
| `FTP_USERNAME` | Username FTP |
| `FTP_PASSWORD` | Password FTP |
| `FTP_SERVER_DIR` | Dossier de destination |
| `SITE_URL` | URL du site |

👉 **[Guide complet de configuration](./DEPLOYMENT_GUIDE.md)**

---

## 🚀 Workflow de Déploiement

### Automatique (recommandé)

1. Modifier le code dans **Bolt.new**
2. Sauvegarder (push automatique vers GitHub)
3. GitHub Actions build et déploie automatiquement
4. Site mis à jour en **3-5 minutes** ✅

### Manuel (si nécessaire)

```bash
# 1. Build local
npm run build

# 2. Vérification pré-déploiement
./scripts/deployment/pre-deploy-check.sh

# 3. Déploiement FTP manuel (avec vos credentials)
# Voir DEPLOYMENT_GUIDE.md pour les détails
```

---

## 📋 Structure du Projet

```
jobguinee/
├── .github/workflows/      # CI/CD automatisé
├── public/                 # Assets statiques
├── scripts/deployment/     # Scripts de déploiement
├── src/
│   ├── components/         # Composants React
│   ├── pages/              # Pages de l'application
│   ├── services/           # Services et API
│   ├── contexts/           # Contexts React
│   ├── hooks/              # Hooks personnalisés
│   └── utils/              # Utilitaires
├── supabase/migrations/    # Migrations base de données
└── [Documentation de déploiement]
```

---

## 🐛 Dépannage

### Build échoue

```bash
# Vérifier localement
npm run build

# Voir les erreurs TypeScript
npm run typecheck

# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Problèmes de déploiement

Consulter le **[Guide de Dépannage](./DEPLOYMENT_GUIDE.md#troubleshooting)**

### Vérifier le déploiement

```bash
# Exécuter le script de vérification
SITE_URL=https://jobguinee.com ./scripts/deployment/verify-deployment.sh
```

---

## 📚 Documentation Technique

### Fonctionnalités Détaillées

Le projet contient une documentation technique extensive :

- `ADMIN_*` - Modules administration
- `CHATBOT_*` - Système de chatbot IA
- `CREDIT_*` - Système de crédits
- `CV_*` - Générateur de CV
- `SEO_*` - Optimisation SEO
- Et bien d'autres...

### Base de Données

Migrations Supabase disponibles dans `supabase/migrations/`

Plus de 100 migrations documentées couvrant :
- Authentification et profils
- Système de jobs
- ATS complet
- Paiements
- Analytics
- Et plus

---

## 🔐 Sécurité

- ✅ HTTPS obligatoire en production
- ✅ Variables sensibles dans GitHub Secrets
- ✅ RLS (Row Level Security) sur toutes les tables
- ✅ Validation des inputs
- ✅ Protection CORS
- ✅ Headers de sécurité configurés

**Important** : Ne jamais commiter le fichier `.env` !

---

## 📊 Performance

### Métriques Cibles

- **Temps de chargement** : < 3 secondes
- **Build size** : ~5 MB (compressé)
- **Déploiement** : 3-5 minutes
- **Disponibilité** : 99.9%

### Optimisations

- Code splitting automatique
- Lazy loading des composants
- Compression gzip/brotli
- Cache des assets
- CDN pour les ressources statiques

---

## 🤝 Contribution

Ce projet est développé principalement via **Bolt.new**.

### Workflow de développement

1. Modifications dans Bolt.new
2. Tests locaux
3. Push automatique vers GitHub
4. Déploiement automatique

### Standards de code

- TypeScript strict
- ESLint configuré
- Composants fonctionnels
- Hooks React
- Tailwind CSS pour le styling

---

## 📞 Support

### Documentation

- [Guide de Déploiement](./DEPLOYMENT_GUIDE.md)
- [Checklist de Déploiement](./DEPLOYMENT_CHECKLIST.md)
- [Scripts de Déploiement](./scripts/deployment/README.md)

### Ressources

- **Supabase Docs** : https://supabase.com/docs
- **GitHub Actions** : https://docs.github.com/actions
- **Hostinger Support** : https://support.hostinger.com

---

## 📄 Licence

Tous droits réservés - JobGuinée © 2026

---

## 🎉 Statut du Projet

**Version** : 1.0.0
**Statut** : ✅ Production Ready
**Déploiement** : 🚀 Automatique
**Documentation** : 📖 Complète

---

**Développé avec ❤️ pour la Guinée**
