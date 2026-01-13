# ✅ Checklist de Déploiement JobGuinée

## 📌 À utiliser avant chaque déploiement en production

---

## 🔧 Phase 1 : Préparation de l'environnement

### Configuration locale

- [ ] Fichier `.env` créé et rempli avec les vraies valeurs
- [ ] Variables Supabase configurées (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] `.env` est dans `.gitignore`
- [ ] Aucun secret dans le code source (`src/`)

### Dépendances

- [ ] `npm install` exécuté avec succès
- [ ] Aucune dépendance manquante
- [ ] `package-lock.json` à jour
- [ ] Aucune vulnérabilité critique (`npm audit`)

### Tests locaux

- [ ] `npm run dev` démarre sans erreur
- [ ] Application accessible sur `http://localhost:5173`
- [ ] Navigation entre les pages fonctionne
- [ ] Connexion/Inscription fonctionne
- [ ] Console sans erreurs critiques

---

## 🏗️ Phase 2 : Build et vérifications

### Build local

- [ ] `npm run build` réussit sans erreur
- [ ] Dossier `dist/` créé avec tous les fichiers
- [ ] `npm run preview` démarre et fonctionne
- [ ] Taille du build raisonnable (< 5MB pour `dist/`)

### Vérifications TypeScript

- [ ] `npm run typecheck` passe sans erreur bloquante
- [ ] Warnings TypeScript documentés si non résolus

### Vérifications de sécurité

- [ ] Aucune clé API dans `dist/` (vérifier avec `grep -r "sk-" dist/`)
- [ ] Aucune `SUPABASE_SERVICE_ROLE_KEY` dans `dist/`
- [ ] Variables sensibles uniquement dans `.env` ou GitHub Secrets
- [ ] Headers de sécurité configurés (`.htaccess`)

### Script de vérification automatique

- [ ] `./scripts/deployment/pre-deploy-check.sh` exécuté
- [ ] Toutes les vérifications critiques passées
- [ ] Warnings documentés et acceptés

---

## 🔐 Phase 3 : Configuration GitHub

### Repository

- [ ] Repository GitHub créé
- [ ] Remote configuré dans Bolt.new
- [ ] Branche principale (`main` ou `production`) définie
- [ ] `.gitignore` correctement configuré

### GitHub Secrets

Vérifier que tous les secrets suivants sont définis :

**Obligatoires :**
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `FTP_HOST`
- [ ] `FTP_USERNAME`
- [ ] `FTP_PASSWORD`
- [ ] `FTP_SERVER_DIR`
- [ ] `SITE_URL`

**Optionnels (selon fonctionnalités activées) :**
- [ ] `OPENAI_API_KEY` (si services IA activés)
- [ ] `ORANGE_MONEY_API_KEY` (si paiements Orange Money)
- [ ] `MTN_MOMO_API_KEY` (si paiements MTN)

### GitHub Actions

- [ ] Workflows présents dans `.github/workflows/`
- [ ] `ci-checks.yml` configuré
- [ ] `deploy-production.yml` configuré
- [ ] Test d'un workflow réussi (commit de test)

---

## 🌐 Phase 4 : Configuration Hostinger

### Accès et configuration

- [ ] Accès FTP vérifié (connexion manuelle réussie)
- [ ] Chemin de déploiement identifié (`/public_html/` ou autre)
- [ ] Node.js activé sur Hostinger (si nécessaire)
- [ ] Domaine correctement pointé

### SSL/HTTPS

- [ ] Certificat SSL installé (Let's Encrypt recommandé)
- [ ] HTTPS actif et fonctionnel
- [ ] Redirection HTTP → HTTPS configurée

### Configuration Apache

- [ ] Fichier `.htaccess` préparé pour SPA
- [ ] mod_rewrite activé
- [ ] Règles de cache configurées
- [ ] Headers de sécurité configurés

---

## 🚀 Phase 5 : Déploiement

### Avant le déploiement

- [ ] Backup de la version actuelle (si applicable)
- [ ] Communication aux utilisateurs si maintenance prévue
- [ ] Horaire de déploiement choisi (heures creuses recommandées)

### Déploiement automatique

- [ ] Commit final poussé vers GitHub
- [ ] Workflow GitHub Actions déclenché
- [ ] Build réussi sur GitHub Actions
- [ ] Upload FTP réussi
- [ ] Aucune erreur dans les logs GitHub Actions

### Durées attendues

- [ ] Build : 2-3 minutes
- [ ] Upload : 1-2 minutes
- [ ] Total : < 5 minutes

---

## ✅ Phase 6 : Vérification post-déploiement

### Tests automatiques

- [ ] Script `verify-deployment.sh` exécuté
- [ ] Tous les tests automatiques passés
- [ ] Site accessible publiquement

### Tests manuels critiques

**Accessibilité :**
- [ ] Site accessible : `https://jobguinee.com`
- [ ] HTTPS actif (cadenas vert dans le navigateur)
- [ ] Pas d'erreur de certificat

**Pages principales :**
- [ ] Page d'accueil se charge
- [ ] Page Offres d'emploi accessible
- [ ] Page de connexion accessible
- [ ] Page d'inscription accessible

**Fonctionnalités critiques :**
- [ ] Navigation entre les pages fonctionne
- [ ] Routing SPA fonctionne (refresh sur une page interne)
- [ ] Connexion utilisateur fonctionne
- [ ] Inscription utilisateur fonctionne
- [ ] Chatbot Alpha est visible

**Assets et ressources :**
- [ ] Images se chargent correctement
- [ ] CSS appliqué correctement
- [ ] JavaScript fonctionne (pas d'erreur en console)
- [ ] Fonts chargées

**Performance :**
- [ ] Temps de chargement < 3 secondes (PageSpeed Insights)
- [ ] Pas de timeout ou d'erreurs serveur
- [ ] Compression gzip/brotli active

**Responsive :**
- [ ] Site fonctionnel sur mobile (tester)
- [ ] Site fonctionnel sur tablette (tester)
- [ ] Site fonctionnel sur desktop (tester)

### Tests par type d'utilisateur

**Visiteur anonyme :**
- [ ] Peut voir les offres d'emploi
- [ ] Peut s'inscrire
- [ ] Peut se connecter

**Candidat :**
- [ ] Peut compléter son profil
- [ ] Peut postuler à une offre
- [ ] Peut utiliser les services IA (si premium)

**Recruteur :**
- [ ] Peut publier une offre
- [ ] Peut voir les candidatures
- [ ] Peut gérer son compte

**Admin :**
- [ ] Peut accéder au panneau admin
- [ ] Peut modérer les offres
- [ ] Peut gérer les utilisateurs

### Console et erreurs

- [ ] Aucune erreur JavaScript dans la console (F12)
- [ ] Aucune erreur de chargement de ressources (404)
- [ ] Aucune erreur CORS
- [ ] Aucune erreur Supabase

---

## 📊 Phase 7 : Monitoring post-déploiement

### Premières 15 minutes

- [ ] Surveiller les logs GitHub Actions
- [ ] Vérifier les métriques de trafic (si analytics actif)
- [ ] Surveiller les erreurs Supabase (Dashboard Supabase)

### Première heure

- [ ] Tester les principales fonctionnalités à nouveau
- [ ] Vérifier qu'aucune régression n'est apparue
- [ ] Lire les retours utilisateurs si disponibles

### Premier jour

- [ ] Analyser les métriques de performance
- [ ] Vérifier les logs d'erreurs
- [ ] Documenter les problèmes éventuels

---

## 🔄 Phase 8 : En cas de problème

### Si le build échoue

- [ ] Lire les logs GitHub Actions
- [ ] Identifier l'erreur
- [ ] Corriger dans Bolt.new
- [ ] Re-tester localement
- [ ] Re-pousser vers GitHub

### Si le déploiement échoue

- [ ] Vérifier les credentials FTP dans GitHub Secrets
- [ ] Vérifier la connexion FTP manuellement
- [ ] Contacter le support Hostinger si nécessaire

### Si le site est cassé après déploiement

**Option 1 : Correction rapide**
- [ ] Identifier et corriger le bug rapidement
- [ ] Pousser le correctif
- [ ] Attendre le nouveau déploiement

**Option 2 : Rollback**
- [ ] Rollback via Git (voir `DEPLOYMENT_GUIDE.md`)
- [ ] Ou restaurer via FTP depuis backup
- [ ] Investiguer le problème à tête reposée

**Option 3 : Page de maintenance**
- [ ] Afficher page de maintenance temporaire
- [ ] Corriger le problème
- [ ] Re-déployer

---

## 📝 Phase 9 : Documentation post-déploiement

### À documenter

- [ ] Version déployée (commit hash)
- [ ] Date et heure du déploiement
- [ ] Durée totale du déploiement
- [ ] Problèmes rencontrés et solutions
- [ ] Temps d'indisponibilité (si applicable)

### Communication

- [ ] Notifier l'équipe du succès du déploiement
- [ ] Communiquer aux utilisateurs si nécessaire
- [ ] Mettre à jour la documentation si changements

---

## 🎯 Critères de succès

Le déploiement est considéré comme réussi si :

- ✅ Site accessible publiquement
- ✅ HTTPS actif
- ✅ Toutes les pages principales fonctionnent
- ✅ Connexion/Inscription fonctionnent
- ✅ Aucune erreur critique en console
- ✅ Performance acceptable (< 3s)
- ✅ Responsive sur tous les devices
- ✅ Toutes les fonctionnalités critiques testées

---

## 📞 Contacts d'urgence

En cas de problème critique :

- **Support Hostinger** : https://support.hostinger.com
- **Supabase Status** : https://status.supabase.com
- **GitHub Status** : https://www.githubstatus.com

---

## 🔖 Liens utiles

- [Guide de déploiement complet](./DEPLOYMENT_GUIDE.md)
- [Configuration des variables d'environnement](./.env.example.production)
- [Scripts de déploiement](./scripts/deployment/)
- [Workflows GitHub Actions](./.github/workflows/)

---

## ✅ Validation finale

Date : ______________

Déployé par : ______________

Version : ______________

Commit hash : ______________

Toutes les vérifications ci-dessus ont été effectuées : ✅

Signature : ______________

---

**🎉 Déploiement validé et complet !**
