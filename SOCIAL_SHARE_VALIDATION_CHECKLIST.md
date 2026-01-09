# ✅ Checklist de Validation Production - Système de Partage Social

## 📋 Pré-Déploiement

### 1. Code & Build

- [ ] **Compilation sans erreurs**
  ```bash
  npm run build
  ```
  - Aucune erreur TypeScript
  - Aucun warning bloquant
  - Build terminé avec succès

- [ ] **Vérification des imports**
  - [ ] `socialShareService` importé correctement
  - [ ] `useSocialShareMeta` importé dans JobDetail
  - [ ] `ShareJobModal` et `SocialSharePreview` importés
  - [ ] Aucune dépendance circulaire

- [ ] **Structure des fichiers créée**
  ```bash
  ls -la public/assets/share/
  ls -la public/assets/share/jobs/
  ```
  - [ ] Dossier `public/assets/share/` existe
  - [ ] Dossier `public/assets/share/jobs/` existe
  - [ ] Fichier `.gitkeep` présent
  - [ ] README.md dans assets/share

### 2. Base de Données

- [ ] **Migration appliquée**
  ```sql
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_name = 'social_share_analytics'
  );
  ```
  - [ ] Table `social_share_analytics` existe
  - [ ] Colonne `shares_count` ajoutée à `jobs`
  - [ ] Fonctions `get_job_share_stats` et `get_most_shared_jobs` créées
  - [ ] Trigger `trigger_update_job_shares_count` actif

- [ ] **RLS Configuré**
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE tablename = 'social_share_analytics';
  ```
  - [ ] RLS activé sur `social_share_analytics`
  - [ ] Policy "Anyone can track shares" existe
  - [ ] Policy "Users can view own shares" existe
  - [ ] Policy "Admins can view all shares" existe
  - [ ] Policy "Recruiters can view shares of their jobs" existe

- [ ] **Indexes créés**
  ```sql
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'social_share_analytics';
  ```
  - [ ] `idx_social_share_analytics_job_id`
  - [ ] `idx_social_share_analytics_platform`
  - [ ] `idx_social_share_analytics_shared_at`
  - [ ] `idx_social_share_analytics_job_platform`

### 3. Assets & Images

- [ ] **Image par défaut**
  - [ ] Créer `public/assets/share/default-job.png`
  - [ ] Dimensions: 1200×630px
  - [ ] Poids: < 500 Ko
  - [ ] Format: PNG
  - [ ] Contenu: Logo + "Offre d'emploi en Guinée"

- [ ] **Accessibilité des assets après build**
  ```bash
  ls dist/assets/share/
  ```
  - [ ] Fichiers copiés dans `dist/`
  - [ ] Paths corrects

### 4. Variables d'Environnement

- [ ] **Fichier .env**
  ```env
  VITE_APP_URL=https://jobguinee-pro.com
  ```
  - [ ] Variable `VITE_APP_URL` définie
  - [ ] URL correcte (production)
  - [ ] HTTPS activé

- [ ] **Fichier .env.production**
  - [ ] Copie de .env avec valeurs production
  - [ ] Pas de valeurs localhost

## 🧪 Tests Locaux (Dev)

### 1. Interface Utilisateur

- [ ] **Bouton de partage visible**
  - [ ] Ouvrir http://localhost:5173/offres/[id]
  - [ ] Bouton "Partager cette offre" visible
  - [ ] Icône Share2 présente
  - [ ] Couleur orange (#FF8C00)

- [ ] **Modal de partage**
  - [ ] Clic sur "Partager" ouvre le modal
  - [ ] Header avec titre visible
  - [ ] Bouton de fermeture (X) fonctionne
  - [ ] Clic en dehors ferme le modal

- [ ] **Preview du partage**
  - [ ] Aperçu visible dans le modal
  - [ ] Image chargée (ou fallback si absente)
  - [ ] Titre affiché correctement
  - [ ] Description visible
  - [ ] URL affichée

- [ ] **Boutons de partage**
  - [ ] Facebook - bleu #1877F2
  - [ ] LinkedIn - bleu ciel #0077B5
  - [ ] X (Twitter) - noir/gris
  - [ ] WhatsApp - vert #25D366
  - [ ] Tous les boutons cliquables

- [ ] **Copie de lien**
  - [ ] Input readonly avec URL complète
  - [ ] Bouton "Copier" fonctionne
  - [ ] Message "Copié !" s'affiche
  - [ ] Icône Check apparaît

### 2. Fonctionnalités

- [ ] **Génération de métadonnées**
  ```javascript
  const metadata = socialShareService.generateJobMetadata(job);
  console.log(metadata);
  ```
  - [ ] Titre formaté: "[TITRE] – [VILLE] | JobGuinée"
  - [ ] Description < 200 caractères
  - [ ] Image URL correcte
  - [ ] URL de l'offre correcte

- [ ] **Génération de liens**
  ```javascript
  const links = socialShareService.generateShareLinks(job);
  console.log(links);
  ```
  - [ ] Facebook: `facebook.com/sharer/sharer.php?u=...`
  - [ ] LinkedIn: `linkedin.com/sharing/share-offsite/?url=...`
  - [ ] Twitter: `twitter.com/intent/tweet?text=...&url=...`
  - [ ] WhatsApp: `wa.me/?text=...`

- [ ] **Ouverture des liens**
  - [ ] Facebook: popup 600×600
  - [ ] LinkedIn: popup 600×600
  - [ ] Twitter: popup 600×600
  - [ ] WhatsApp: redirection mobile ou popup desktop

- [ ] **Tracking des partages**
  ```sql
  SELECT COUNT(*) FROM social_share_analytics;
  ```
  - [ ] Insertion dans la table après partage
  - [ ] `job_id` correct
  - [ ] `platform` correct
  - [ ] `shared_at` enregistré
  - [ ] Compteur `jobs.shares_count` incrémenté

### 3. Meta Tags

- [ ] **Injection dans le DOM**
  - [ ] Inspecter le `<head>` avec DevTools
  - [ ] Balise `<meta property="og:title">` présente
  - [ ] Balise `<meta property="og:description">` présente
  - [ ] Balise `<meta property="og:image">` présente
  - [ ] Balise `<meta property="og:url">` présente
  - [ ] Balise `<meta name="twitter:card">` présente
  - [ ] Balise `<link rel="canonical">` présente

- [ ] **Valeurs correctes**
  - [ ] Titre = titre de l'offre
  - [ ] Description = description de l'offre
  - [ ] Image = URL absolue
  - [ ] URL = URL de l'offre

## 🌐 Tests Production

### 1. Déploiement

- [ ] **Build production**
  ```bash
  npm run build
  ```
  - [ ] Pas d'erreurs
  - [ ] Dossier `dist/` créé
  - [ ] Assets copiés dans `dist/assets/share/`

- [ ] **Déploiement Hostinger**
  - [ ] Fichiers uploadés
  - [ ] Site accessible: https://jobguinee-pro.com
  - [ ] Pas d'erreur 404

### 2. URLs et Assets

- [ ] **Images accessibles**
  ```bash
  curl -I https://jobguinee-pro.com/assets/share/default-job.png
  ```
  - [ ] Status: 200 OK
  - [ ] Content-Type: image/png
  - [ ] Pas de redirection

- [ ] **Page d'offre accessible**
  ```bash
  curl https://jobguinee-pro.com/offres/[id]
  ```
  - [ ] Status: 200 OK
  - [ ] HTML retourné
  - [ ] Pas d'erreur 500

### 3. Debuggers Officiels

- [ ] **Facebook Debugger**
  - [ ] Aller sur https://developers.facebook.com/tools/debug/
  - [ ] Coller: `https://jobguinee-pro.com/offres/[id]`
  - [ ] Cliquer "Scrape"
  - [ ] ✅ Image visible
  - [ ] ✅ Titre correct
  - [ ] ✅ Description correcte
  - [ ] ✅ URL canonique
  - [ ] ✅ Aucun warning critique
  - [ ] Cliquer "Scrape Again" si besoin

- [ ] **LinkedIn Post Inspector**
  - [ ] Aller sur https://www.linkedin.com/post-inspector/
  - [ ] Coller: `https://jobguinee-pro.com/offres/[id]`
  - [ ] ✅ Preview visible
  - [ ] ✅ Image 1200×630 détectée
  - [ ] ✅ Titre et description corrects

- [ ] **Twitter Card Validator**
  - [ ] Aller sur https://cards-dev.twitter.com/validator
  - [ ] Coller: `https://jobguinee-pro.com/offres/[id]`
  - [ ] ✅ Card type: "summary_large_image"
  - [ ] ✅ Preview correct

### 4. Test Réel sur WhatsApp

- [ ] **Mobile**
  - [ ] Envoyer l'URL dans une conversation
  - [ ] Preview automatique s'affiche
  - [ ] Image visible
  - [ ] Titre et description présents

- [ ] **WhatsApp Web**
  - [ ] Envoyer l'URL
  - [ ] Preview s'affiche
  - [ ] Cliquable

### 5. Partages Réels

- [ ] **Facebook**
  - [ ] Cliquer sur le bouton Facebook
  - [ ] Popup s'ouvre
  - [ ] Preview correct dans la popup
  - [ ] Publier (test sur page privée)
  - [ ] Vérifier le rendu dans le fil

- [ ] **LinkedIn**
  - [ ] Cliquer sur le bouton LinkedIn
  - [ ] Popup s'ouvre
  - [ ] Preview correct
  - [ ] Publier (test sur profil privé)
  - [ ] Vérifier le rendu

- [ ] **Twitter/X**
  - [ ] Cliquer sur le bouton Twitter
  - [ ] Popup s'ouvre
  - [ ] Texte pré-rempli
  - [ ] URL présente
  - [ ] Tweeter (test)
  - [ ] Card visible dans le tweet

- [ ] **WhatsApp**
  - [ ] Cliquer sur le bouton WhatsApp
  - [ ] Application/web ouvre
  - [ ] Message pré-rempli
  - [ ] Envoyer à contact test
  - [ ] Preview s'affiche

## 📊 Analytics & Tracking

### 1. Vérification du Tracking

- [ ] **Insertion dans la base**
  ```sql
  SELECT * FROM social_share_analytics
  ORDER BY shared_at DESC LIMIT 10;
  ```
  - [ ] Données insérées après partage
  - [ ] `job_id` correct
  - [ ] `platform` correct
  - [ ] `user_id` (si connecté) ou NULL
  - [ ] `shared_at` récent

- [ ] **Compteur mis à jour**
  ```sql
  SELECT id, title, shares_count
  FROM jobs
  WHERE id = '[job-id]';
  ```
  - [ ] `shares_count` > 0
  - [ ] Incrémenté après chaque partage

### 2. Fonctions Analytics

- [ ] **get_job_share_stats**
  ```sql
  SELECT * FROM get_job_share_stats('[job-id]');
  ```
  - [ ] Retourne les stats par plateforme
  - [ ] Compteurs corrects
  - [ ] `last_shared_at` présent

- [ ] **get_most_shared_jobs**
  ```sql
  SELECT * FROM get_most_shared_jobs(5);
  ```
  - [ ] Retourne les 5 offres les plus partagées
  - [ ] Total par plateforme correct
  - [ ] Tri décroissant

### 3. RLS et Permissions

- [ ] **Utilisateur non connecté**
  - [ ] Peut partager (INSERT fonctionne)
  - [ ] Ne peut pas voir les stats (SELECT bloqué)

- [ ] **Utilisateur connecté**
  - [ ] Peut voir ses propres partages
  - [ ] Ne peut pas voir les partages des autres

- [ ] **Recruteur**
  - [ ] Peut voir les partages de ses offres
  - [ ] Ne peut pas voir les partages des autres offres

- [ ] **Admin**
  - [ ] Peut voir tous les partages
  - [ ] Accès complet aux stats

## 🐛 Tests d'Erreurs

### 1. Gestion des Erreurs

- [ ] **Image manquante**
  - [ ] Tester avec job sans image
  - [ ] Fallback `default-job.png` chargé
  - [ ] Badge "Fallback" visible
  - [ ] Aucune erreur console

- [ ] **Job sans données complètes**
  - [ ] Tester avec job minimal (titre seulement)
  - [ ] Description par défaut générée
  - [ ] Pas de crash

- [ ] **Réseau lent**
  - [ ] Throttling 3G
  - [ ] Spinner de chargement visible
  - [ ] Timeout géré

- [ ] **Erreur de copie**
  - [ ] Désactiver clipboard API
  - [ ] Fallback textarea fonctionne
  - [ ] Message d'erreur si échec

### 2. Compatibilité

- [ ] **Navigateurs Desktop**
  - [ ] Chrome/Edge (dernière version)
  - [ ] Firefox (dernière version)
  - [ ] Safari (macOS)

- [ ] **Navigateurs Mobile**
  - [ ] Chrome Mobile (Android)
  - [ ] Safari Mobile (iOS)
  - [ ] Samsung Internet

- [ ] **Responsive**
  - [ ] Modal adapté sur mobile
  - [ ] Boutons accessibles
  - [ ] Preview lisible

## 📈 Performance

### 1. Vitesse de Chargement

- [ ] **Images optimisées**
  - [ ] Poids < 500 Ko
  - [ ] Format WebP si possible (fallback PNG)
  - [ ] Lazy loading

- [ ] **Modal**
  - [ ] Ouverture instantanée
  - [ ] Fermeture fluide
  - [ ] Pas de lag

### 2. SEO & Meta

- [ ] **Google Search Console**
  - [ ] Soumettre l'URL
  - [ ] Vérifier l'indexation
  - [ ] Rich snippets détectés

- [ ] **Lighthouse Audit**
  - [ ] Score SEO > 90
  - [ ] Meta tags détectés
  - [ ] Structured data valide

## 🔐 Sécurité

### 1. XSS Prevention

- [ ] **Sanitization**
  - [ ] Titres échappés
  - [ ] Descriptions nettoyées
  - [ ] URLs encodées

### 2. CSRF Protection

- [ ] **Tokens**
  - [ ] Supabase auth tokens utilisés
  - [ ] Pas de requêtes non authentifiées sensibles

### 3. Rate Limiting

- [ ] **Anti-spam**
  - [ ] Limiter les partages par IP (si implémenté)
  - [ ] Vérifier les abus potentiels

## 📝 Documentation

- [ ] **README à jour**
  - [ ] `SOCIAL_SHARE_SYSTEM_DOCUMENTATION.md` complet
  - [ ] Exemples de code clairs
  - [ ] Captures d'écran (optionnel)

- [ ] **Commentaires code**
  - [ ] Services commentés
  - [ ] Fonctions documentées
  - [ ] Types TypeScript complets

## ✅ Validation Finale

### Checklist de Lancement

- [ ] ✅ Tous les tests locaux passent
- [ ] ✅ Tous les tests production passent
- [ ] ✅ Facebook Debugger valide
- [ ] ✅ LinkedIn Post Inspector valide
- [ ] ✅ Twitter Card Validator valide
- [ ] ✅ WhatsApp preview fonctionne
- [ ] ✅ Analytics tracking opérationnel
- [ ] ✅ Aucune erreur console
- [ ] ✅ Performance optimale
- [ ] ✅ Sécurité vérifiée
- [ ] ✅ Documentation complète

### Sign-Off

- [ ] **Développeur**
  - Date: __________
  - Signature: __________

- [ ] **QA/Testeur**
  - Date: __________
  - Signature: __________

- [ ] **Product Owner**
  - Date: __________
  - Signature: __________

---

## 🚨 En Cas de Problème

### Support

- Vérifier les logs: `console.log` et `console.error`
- Vérifier la base de données: `social_share_analytics`
- Contacter l'équipe technique

### Rollback

Si problème critique:
1. Désactiver le bouton de partage temporairement
2. Investiguer la cause
3. Corriger en développement
4. Redéployer après validation

---

**Version:** 1.0.0
**Date:** 09 Janvier 2026
**Auteur:** Équipe Technique JobGuinée
