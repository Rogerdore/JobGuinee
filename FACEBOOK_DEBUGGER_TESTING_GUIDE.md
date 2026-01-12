# Facebook Debugger - Guide de Test des Aperçus OG

## 🎯 Objectif

Vérifier que Facebook peut scraper correctement les OG tags et afficher l'aperçu personnalisé de l'offre d'emploi.

---

## 📋 Prérequis

- [ ] Compte Facebook Developer (gratuit)
- [ ] Accès à https://developers.facebook.com/
- [ ] Un job ID valide en production
- [ ] Edge Function `job-og-preview` déployée

---

## ✅ Étape 1: Se connecter à Facebook Developer

1. Aller à https://developers.facebook.com/
2. Cliquer "Log In"
3. Utiliser vos identifiants Facebook
4. Accepter les conditions

---

## 🔍 Étape 2: Accéder au Facebook Debugger

1. Aller à https://developers.facebook.com/tools/debug/sharing/
2. Vous devriez voir une page avec:
   - Un champ "URL" au centre
   - Des options de "Scrape Again"
   - Un aperçu de l'article

---

## 📝 Étape 3: Tester avec une URL `/s/{job_id}`

### 3.1: Construire l'URL

```
https://jobguinee-pro.com/s/{job_id}

Exemple:
https://jobguinee-pro.com/s/550e8400-e29b-41d4-a716-446655440000
```

### 3.2: Coller dans le debugger

```
1. Dans le champ "URL":
   Coller: https://jobguinee-pro.com/s/550e8400-e29b-41d4-a716-446655440000

2. Cliquer "Fetch Information"

3. Attendre le scraping (30-60 secondes)
```

---

## 🧪 Étape 4: Vérifier les Résultats

### Vérification 1: OG Title

```
ATTENDU:
Property: og:title
Value: "Développeur Senior – Acme Corp | JobGuinée"

VÉRIFICATION:
✓ Le titre du job est présent
✓ Le nom de l'entreprise est présent
✓ "JobGuinée" est présent
```

### Vérification 2: OG Description

```
ATTENDU:
Property: og:description
Value: "Acme Corp recrute pour un CDI de Développeur Senior à Conakry..."

VÉRIFICATION:
✓ La description est personnalisée
✓ L'entreprise est mentionnée
✓ La localisation est présente
```

### Vérification 3: OG Image

```
ATTENDU:
Property: og:image
Value: "https://... image URL ..."

VÉRIFICATION:
✓ L'image s'affiche en aperçu
✓ Dimensions: 1200×630 (ou proche)
✓ Format: PNG ou JPG
✓ Image visible et claire
```

### Vérification 4: OG URL

```
ATTENDU:
Property: og:url
Value: "https://jobguinee-pro.com/s/550e8400-e29b-41d4-a716-446655440000"

VÉRIFICATION:
✓ L'URL pointe vers /s/
✓ L'URL contient le job_id correct
```

### Vérification 5: OG Type

```
ATTENDU:
Property: og:type
Value: "website"

VÉRIFICATION:
✓ Type correct (website, article, product, etc)
```

### Vérification 6: OG Site Name

```
ATTENDU:
Property: og:site_name
Value: "JobGuinée"

VÉRIFICATION:
✓ Nom du site correct
```

### Vérification 7: Twitter Card

```
ATTENDU:
Property: twitter:card
Value: "summary_large_image"

VÉRIFICATION:
✓ Twitter card type correct
```

---

## 🖼️ Étape 5: Vérifier l'Aperçu

Dans le debugger, vous devriez voir:

```
╔════════════════════════════════════════╗
║                                        ║
║     [IMAGE 1200×630]                   ║
║                                        ║
║     Développeur Senior – Acme Corp     ║
║                                        ║
║     Acme Corp recrute pour un CDI      ║
║     de Développeur Senior à Conakry... ║
║                                        ║
║     jobguinee-pro.com/s/...            ║
║                                        ║
╚════════════════════════════════════════╝
```

**Vérifications:**
- [ ] Image affichée correctement
- [ ] Titre visible et complet
- [ ] Description lisible
- [ ] URL visible en bas
- [ ] Pas de texte tronqué

---

## ⚡ Étape 6: Tester le "Scrape Again"

Si quelque chose ne s'affiche pas correctement:

1. Cliquer sur "Scrape Again" (bouton bleu)
2. Facebook va refetcher les OG tags
3. Attendre 30-60 secondes
4. L'aperçu devrait se mettre à jour

**Note:** Facebook cache les OG tags pendant 24h. Si vous modifiez une offre, utilisez "Scrape Again" pour forcer la mise à jour.

---

## 🔄 Étape 7: Vérifier l'Aperçu en Direct sur Facebook

### 7.1: Aller sur Facebook

1. Ouvrir https://facebook.com
2. Se connecter si nécessaire

### 7.2: Partager le lien

1. Cliquer sur "Créer une publication"
2. Coller l'URL: `https://jobguinee-pro.com/s/{job_id}`
3. Attendre que Facebook charge l'aperçu
4. Vérifier que l'aperçu s'affiche correctement

### 7.3: Vérifier l'Aperçu

L'aperçu devrait afficher:
- [ ] Image de l'offre
- [ ] Titre de l'offre
- [ ] Description personnalisée
- [ ] Lien vers jobguinee.com

### 7.4: Partager

1. Cliquer "Partager"
2. Choisir une destination (Feed, Messenger, etc)
3. Confirmer

### 7.5: Vérifier le Fil

1. Aller dans votre feed
2. Voir le lien partagé
3. L'aperçu devrait s'afficher complet
4. Cliquer sur le lien → devrait rediriger vers l'offre

---

## 📱 Étape 8: Tester sur LinkedIn

### 8.1: Aller sur LinkedIn

1. Ouvrir https://linkedin.com
2. Se connecter

### 8.2: Partager le lien

1. Cliquer "Démarrer une publication"
2. Coller l'URL: `https://jobguinee-pro.com/s/{job_id}`
3. Attendre le chargement de l'aperçu

### 8.3: Vérifier l'Aperçu LinkedIn

L'aperçu devrait afficher:
- [ ] Image (1200×630)
- [ ] Titre avec "Développeur Senior – Acme Corp"
- [ ] Description personnalisée
- [ ] Logo "JobGuinée"

**Note:** LinkedIn affiche parfois un aperçu différent de Facebook. C'est normal.

---

## 💬 Étape 9: Tester sur WhatsApp

### 9.1: Copier le lien

```
https://jobguinee-pro.com/s/{job_id}
```

### 9.2: Ouvrir WhatsApp

1. Ouvrir WhatsApp (Web ou Mobile)
2. Choisir un contact ou groupe
3. Coller le lien

### 9.3: Vérifier

Le message devrait afficher:
- [ ] Titre du job
- [ ] Image en aperçu
- [ ] Lien clickable

---

## 🐦 Étape 10: Tester sur Twitter/X

### 10.1: Aller sur Twitter

1. Ouvrir https://twitter.com/x.com
2. Se connecter

### 10.2: Tweeter le lien

1. Cliquer "Composer un Tweet"
2. Coller l'URL: `https://jobguinee-pro.com/s/{job_id}`
3. Attendre l'aperçu Twitter Card

### 10.3: Vérifier

Le tweet devrait afficher:
- [ ] Carte Twitter avec image
- [ ] Titre du job
- [ ] Description
- [ ] Lien clickable

---

## ✅ Checklist de Validation Complète

### OG Tags Visibles dans le Debugger

- [ ] `og:title` correct
- [ ] `og:description` correct
- [ ] `og:image` correct
- [ ] `og:url` correct
- [ ] `og:type` = website
- [ ] `og:site_name` = JobGuinée

### Aperçu Facebook

- [ ] Image affichée
- [ ] Titre complet
- [ ] Description complète
- [ ] Pas de texte tronqué

### Aperçu LinkedIn

- [ ] Image affichée (1200×630)
- [ ] Titre avec entreprise
- [ ] Description correcte

### Aperçu Twitter

- [ ] Carte Twitter affichée
- [ ] Image visible
- [ ] Titre et description visibles

### Aperçu WhatsApp

- [ ] Lien partageable
- [ ] Image chargée
- [ ] Titre et description

### Test End-to-End

- [ ] Cliquer sur l'aperçu → redirection vers l'offre
- [ ] URL de redirection: `/offres/{slug}?src={network}`
- [ ] Page chargée correctement
- [ ] Offre affichée
- [ ] Postuler fonctionne

---

## 🐛 Problèmes Courants et Solutions

### Problème 1: "Unable to scrape the URL"

**Cause:** Facebook ne peut pas accéder à l'URL

**Solutions:**

```bash
# 1. Vérifier que l'URL est publique (pas localhost)
# ✓ https://jobguinee-pro.com/s/...
# ✗ https://localhost:3000/s/...

# 2. Vérifier que la page charge rapidement
curl -I "https://jobguinee-pro.com/s/550e8400"
# Devrait retourner: HTTP/1.1 200 OK

# 3. Vérifier les firewall/IP whitelist
# Si JobGuinée est sur IP whitelist, ajouter Facebook:
# - 66.220.144.0/20
# - 69.63.176.0/20
# Plus d'infos: https://developers.facebook.com/docs/sharing/webmasters/crawler
```

### Problème 2: Pas d'image dans l'aperçu

**Cause:** `og:image` URL invalide ou inaccessible

**Solutions:**

```bash
# 1. Vérifier que l'image URL est valide
curl -I "https://... image url ..."
# Devrait retourner: HTTP/1.1 200 OK

# 2. Vérifier dimensions: 1200×630
identify "image.png"

# 3. Vérifier permissions (doit être publique, pas private)
# Via Supabase Storage: Public checkbox coché

# 4. Vérifier format (PNG/JPG, pas WebP)
file image.png
```

### Problème 3: Description tronquée

**Cause:** `og:description` > 200 caractères

**Solution:**

```bash
# Limiter la description à 200 caractères
echo "Long description" | cut -c 1-200
```

### Problème 4: Titre tronqué

**Cause:** `og:title` > 60 caractères

**Solution:**

```bash
# Limiter le titre à 60 caractères
echo "Long title" | cut -c 1-60
```

### Problème 5: Cache Facebook obsolète

**Cause:** Facebook a cacché l'ancien aperçu

**Solution:**

1. Utiliser "Scrape Again" dans le debugger
2. Ou attendre 24h
3. Ou vider le cache de navigateur
4. Ou changer l'URL (ajouter `?v=2`)

---

## 📊 Rapporter les Résultats

Après avoir complété tous les tests, documenter:

```markdown
# Rapport de Test - Aperçus Sociaux

## Date
12 Janvier 2026

## Résultats

| Réseau | OG Tags | Aperçu | E2E | Status |
|--------|---------|--------|-----|--------|
| Facebook | ✓ | ✓ | ✓ | ✅ |
| LinkedIn | ✓ | ✓ | ✓ | ✅ |
| Twitter | ✓ | ✓ | ✓ | ✅ |
| WhatsApp | ✓ | ✓ | ✓ | ✅ |

## Notes

- Tous les OG tags s'affichent correctement
- Images chargent bien (< 2s)
- Clics enregistrés dans la base de données
- CTR tracking fonctionnel

## Approbation

- [ ] Developer: _________
- [ ] QA: _________
- [ ] DevOps: _________

Status: ✅ READY FOR PRODUCTION
```

---

## 🎓 Ressources Additionnelles

### Documentation Officielle

- [Facebook Debugger Tool](https://developers.facebook.com/tools/debug/sharing/)
- [Open Graph Protocol](https://ogp.me/)
- [Sharing Debugger Guide](https://developers.facebook.com/docs/sharing/webmasters/crawler)

### Outils Utiles

- [OG Tag Preview Generator](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Bonnes Pratiques

- Image: 1200×630px, < 5MB
- Title: < 60 caractères
- Description: < 200 caractères
- URL: HTTPS, accessible publiquement
- Cache: 24h, utiliser "Scrape Again"

---

**Version:** 1.0 | Date: 12 Janvier 2026
**Auteur:** Équipe JobGuinée
**Status:** Production Ready ✅
