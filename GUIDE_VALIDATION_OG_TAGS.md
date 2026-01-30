# GUIDE DE VALIDATION OG TAGS - JobGuinée

**Version**: 1.0
**Date**: 13 Janvier 2026
**Système**: Production Ready

---

## OBJECTIF

Ce guide vous permet de valider à 100% que le système d'aperçus sociaux de JobGuinée fonctionne parfaitement sur:
- ✅ Facebook
- ✅ LinkedIn
- ✅ Twitter (X)
- ✅ WhatsApp
- ✅ Telegram

**Résultat attendu**: Chaque lien partagé affiche un aperçu PARFAIT sans fallback générique.

---

## VALIDATION AUTOMATIQUE

### Étape 1: Lancer le script de validation

```bash
node scripts/validate-og-tags-complete.js
```

Le script va:
1. Sélectionner automatiquement 3 jobs publiés
2. Tester les 5 réseaux sociaux
3. Vérifier toutes les balises OG obligatoires
4. Tester le tracking des clics
5. Valider l'accessibilité des images
6. Générer un rapport détaillé en markdown

### Étape 2: Consulter le rapport

Ouvrez `VALIDATION_OG_TAGS_REPORT.md`

Vous verrez:
- ✅ Table de validation complète
- ✅ URLs de test pour chaque réseau
- ✅ Statistiques sociales
- ✅ Balises OG détectées
- ✅ État des images

---

## VALIDATION MANUELLE (ÉTAPE PAR ÉTAPE)

### PRÉREQUIS

1. Récupérez un `job_id` d'une offre publiée:

```sql
SELECT id, title, status
FROM jobs
WHERE status = 'published'
LIMIT 1;
```

Exemple: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

2. Vérifiez votre `SUPABASE_URL`:

```bash
echo $VITE_SUPABASE_URL
```

Exemple: `https://votre-projet.supabase.co`

---

### TEST 1: FACEBOOK

#### URL de test

```
{SUPABASE_URL}/functions/v1/job-og-preview/s/{job_id}?src=facebook
```

**Exemple concret**:
```
https://votre-projet.supabase.co/functions/v1/job-og-preview/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890?src=facebook
```

#### Validation avec Facebook Debugger

1. Allez sur: https://developers.facebook.com/tools/debug/

2. Collez votre URL complète

3. Cliquez sur "Debug"

4. **Vérifiez**:
   - ✅ `og:title` = "{Titre du poste} – {Entreprise}"
   - ✅ `og:description` = Description réelle (200-250 caractères)
   - ✅ `og:image` = Image correcte (logo ou visuel)
   - ✅ `og:image:width` = 1200
   - ✅ `og:image:height` = 630
   - ✅ `og:url` = URL complète
   - ✅ `og:type` = website
   - ✅ `og:site_name` = JobGuinée

5. Cliquez sur "Scrape Again" si nécessaire

#### Test réel

1. Sur Facebook, créez un nouveau post
2. Collez l'URL
3. **Résultat attendu**:
   - Aperçu apparaît automatiquement
   - Titre exact du poste
   - Description réelle
   - Image correcte
   - Lien cliquable

---

### TEST 2: LINKEDIN

#### URL de test

```
{SUPABASE_URL}/functions/v1/job-og-preview/s/{job_id}?src=linkedin
```

#### Validation avec LinkedIn Post Inspector

1. Allez sur: https://www.linkedin.com/post-inspector/

2. Collez votre URL complète

3. Cliquez sur "Inspect"

4. **Vérifiez**:
   - ✅ `og:title`
   - ✅ `og:description`
   - ✅ `og:image` (1200x630)
   - ✅ `article:publisher` = JobGuinée
   - ✅ `article:author` = {Entreprise}

#### Test réel

1. Sur LinkedIn, créez un nouveau post
2. Collez l'URL
3. **Résultat attendu**:
   - Aperçu professionnel
   - Métadonnées article correctes
   - Image haute qualité
   - Attribution entreprise visible

---

### TEST 3: TWITTER (X)

#### URL de test

```
{SUPABASE_URL}/functions/v1/job-og-preview/s/{job_id}?src=twitter
```

#### Validation avec Twitter Card Validator

1. Allez sur: https://cards-dev.twitter.com/validator

2. Collez votre URL complète

3. **Vérifiez**:
   - ✅ `twitter:card` = summary_large_image
   - ✅ `twitter:title`
   - ✅ `twitter:description`
   - ✅ `twitter:image`
   - ✅ `twitter:site` = @JobGuinee

4. La prévisualisation s'affiche à droite

#### Test réel

1. Sur X, créez un nouveau post
2. Collez l'URL
3. **Résultat attendu**:
   - Large image card
   - Titre et description visibles
   - Mention @JobGuinee

---

### TEST 4: WHATSAPP

#### URL de test

```
{SUPABASE_URL}/functions/v1/job-og-preview/s/{job_id}?src=whatsapp
```

#### Test (mobile requis)

1. Sur votre téléphone, ouvrez WhatsApp
2. Envoyez l'URL à un contact ou groupe de test
3. **Résultat attendu**:
   - Aperçu s'affiche automatiquement (peut prendre 5-10 secondes)
   - Image visible
   - Titre et description
   - Lien cliquable

**Note**: WhatsApp utilise les mêmes balises OG que Facebook

---

### TEST 5: TELEGRAM

#### URL de test

```
{SUPABASE_URL}/functions/v1/job-og-preview/s/{job_id}?src=telegram
```

#### Test

1. Sur Telegram, envoyez l'URL dans un chat
2. **Résultat attendu**:
   - Aperçu instantané
   - Image et métadonnées
   - Bouton "Instant View" (optionnel)

---

## VALIDATION DU TRACKING

### Vérifier que les clics sont trackés

1. Après chaque test, vérifiez dans la base de données:

```sql
-- Voir les clics dans social_share_clicks
SELECT
  source_network,
  COUNT(*) as clicks,
  MAX(clicked_at) as last_click
FROM social_share_clicks
WHERE job_id = '{votre_job_id}'
GROUP BY source_network;

-- Voir les clics dans job_clicks
SELECT
  source_network,
  clicked_at,
  user_agent
FROM job_clicks
WHERE job_id = '{votre_job_id}'
ORDER BY clicked_at DESC
LIMIT 10;

-- Voir les compteurs dans la table jobs
SELECT
  id,
  title,
  clicks_count,
  social_clicks,
  views_count
FROM jobs
WHERE id = '{votre_job_id}';
```

2. **Résultat attendu**:

```json
{
  "clicks_count": 5,
  "social_clicks": {
    "facebook": 1,
    "linkedin": 1,
    "twitter": 1,
    "whatsapp": 1,
    "telegram": 1
  },
  "views_count": 0
}
```

### Tester l'anti-spam

1. Cliquez 2 fois de suite sur la même URL
2. Vérifiez que seul 1 clic est enregistré (fenêtre de 24h)

---

## VALIDATION DES IMAGES OG

### Vérifier l'existence des images

```sql
-- Lister les images générées
SELECT name, created_at
FROM storage.objects
WHERE bucket_id = 'og-images'
  AND name LIKE 'jobs/{votre_job_id}%';
```

### Tester l'accessibilité

Pour chaque image:

```bash
curl -I {SUPABASE_URL}/storage/v1/object/public/og-images/jobs/{job_id}/facebook.png
```

**Résultat attendu**: `HTTP/2 200`

### Générer une image OG manuellement

```bash
curl "{SUPABASE_URL}/functions/v1/generate-job-og-image?job_id={job_id}&network=facebook"
```

**Résultat attendu**:
```json
{
  "success": true,
  "image_url": "https://...supabase.co/storage/v1/object/public/og-images/jobs/{job_id}/facebook.png",
  "cached": false
}
```

---

## CHECKLIST DE VALIDATION COMPLÈTE

Cochez chaque élément:

### Edge Functions

- [ ] `job-og-preview` est déployée et accessible
- [ ] `generate-job-og-image` est déployée et accessible
- [ ] Les deux fonctions répondent en < 2 secondes

### Base de données

- [ ] Table `social_share_clicks` existe
- [ ] Table `job_clicks` existe
- [ ] Colonne `jobs.social_clicks` (jsonb) existe
- [ ] Colonne `jobs.clicks_count` (integer) existe
- [ ] RPC `track_social_click()` fonctionne
- [ ] RPC `get_job_social_stats()` fonctionne
- [ ] RPC `get_job_social_stats_complete()` fonctionne
- [ ] Trigger `increment_job_social_clicks` fonctionne

### Storage

- [ ] Bucket `og-images` existe
- [ ] Bucket est public en lecture
- [ ] RLS autorise admins à écrire
- [ ] Images sont accessibles via URL publique

### Balises OG (pour chaque réseau)

- [ ] `og:title` présent et exact
- [ ] `og:description` présent et réel (pas de fallback)
- [ ] `og:image` présent et accessible
- [ ] `og:url` présent et correct
- [ ] `og:type` = website
- [ ] `og:site_name` = JobGuinée
- [ ] `og:locale` = fr_GN
- [ ] `twitter:card` = summary_large_image
- [ ] `twitter:title` présent
- [ ] `twitter:description` présent
- [ ] `twitter:image` présent

### Tracking

- [ ] Clic Facebook → enregistré dans DB
- [ ] Clic LinkedIn → enregistré dans DB
- [ ] Clic Twitter → enregistré dans DB
- [ ] Clic WhatsApp → enregistré dans DB
- [ ] Clic Telegram → enregistré dans DB
- [ ] `jobs.clicks_count` incrémenté
- [ ] `jobs.social_clicks.{network}` incrémenté
- [ ] Anti-spam fonctionne (1 clic/24h/user/job)

### Tests réels

- [ ] Partagé sur Facebook → aperçu parfait
- [ ] Partagé sur LinkedIn → aperçu professionnel
- [ ] Partagé sur Twitter → card large image
- [ ] Partagé sur WhatsApp → aperçu mobile correct
- [ ] Partagé sur Telegram → aperçu instantané

---

## RÉSOLUTION DES PROBLÈMES

### Problème 1: Aperçu ne s'affiche pas

**Diagnostic**:
```bash
curl -I "{SUPABASE_URL}/functions/v1/job-og-preview/s/{job_id}?src=facebook"
```

**Solutions**:
- Vérifier que l'Edge Function est déployée
- Vérifier que le job existe et est publié
- Vérifier les logs: `supabase functions logs job-og-preview`

### Problème 2: Image cassée

**Diagnostic**:
```bash
curl -I "{SUPABASE_URL}/storage/v1/object/public/og-images/jobs/{job_id}/facebook.png"
```

**Solutions**:
- Générer l'image: `curl "{SUPABASE_URL}/functions/v1/generate-job-og-image?job_id={job_id}"`
- Vérifier RLS sur bucket `og-images`
- Vérifier que le job a un logo ou featured_image_url

### Problème 3: Clics non trackés

**Diagnostic**:
```sql
SELECT * FROM social_share_clicks WHERE job_id = '{job_id}' ORDER BY clicked_at DESC LIMIT 5;
```

**Solutions**:
- Tester RPC manuellement: `SELECT track_social_click('{job_id}'::uuid, 'test');`
- Vérifier les permissions RLS
- Vérifier les logs de l'Edge Function

### Problème 4: Facebook cache l'ancien aperçu

**Solution**:
1. Allez sur https://developers.facebook.com/tools/debug/
2. Collez l'URL
3. Cliquez sur "Scrape Again"
4. Attendez 10 secondes
5. Rafraîchissez la page

---

## URLS DE RÉFÉRENCE

### Outils de validation

- **Facebook Debugger**: https://developers.facebook.com/tools/debug/
- **LinkedIn Inspector**: https://www.linkedin.com/post-inspector/
- **Twitter Validator**: https://cards-dev.twitter.com/validator

### Documentation

- **Open Graph Protocol**: https://ogp.me/
- **Twitter Cards**: https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards
- **WhatsApp Sharing**: https://faq.whatsapp.com/5913398998672934

### Supabase

- **Edge Functions**: https://supabase.com/docs/guides/functions
- **Storage**: https://supabase.com/docs/guides/storage
- **RLS**: https://supabase.com/docs/guides/auth/row-level-security

---

## EXEMPLES D'URLS COMPLÈTES

Remplacez `{SUPABASE_URL}` par votre URL Supabase:

### Test Facebook
```
https://votre-projet.supabase.co/functions/v1/job-og-preview/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890?src=facebook
```

### Test LinkedIn
```
https://votre-projet.supabase.co/functions/v1/job-og-preview/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890?src=linkedin
```

### Test Twitter
```
https://votre-projet.supabase.co/functions/v1/job-og-preview/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890?src=twitter
```

### Test WhatsApp
```
https://votre-projet.supabase.co/functions/v1/job-og-preview/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890?src=whatsapp
```

### Test Telegram
```
https://votre-projet.supabase.co/functions/v1/job-og-preview/s/a1b2c3d4-e5f6-7890-abcd-ef1234567890?src=telegram
```

---

## VALIDATION EN PRODUCTION

### Avant le déploiement

1. ✅ Tous les tests passent localement
2. ✅ Script de validation retourne 100%
3. ✅ Images OG accessibles
4. ✅ Tracking fonctionne
5. ✅ Build réussit sans erreurs

### Après le déploiement

1. Tester immédiatement avec Facebook Debugger
2. Partager un lien test sur tous les réseaux
3. Vérifier les logs Edge Functions pendant 1h
4. Monitorer les clics trackés
5. Vérifier les compteurs dans `jobs.social_clicks`

---

## MONITORING CONTINU

### Requêtes SQL de monitoring

```sql
-- Top 10 jobs par clics sociaux
SELECT
  j.id,
  j.title,
  j.clicks_count,
  j.social_clicks
FROM jobs j
WHERE j.status = 'published'
ORDER BY j.clicks_count DESC
LIMIT 10;

-- Clics par réseau (derniers 7 jours)
SELECT
  source_network,
  COUNT(*) as clicks,
  COUNT(DISTINCT job_id) as jobs_clicked
FROM social_share_clicks
WHERE clicked_at > now() - interval '7 days'
GROUP BY source_network
ORDER BY clicks DESC;

-- Taux de conversion social (clics → candidatures)
SELECT
  source_network,
  COUNT(*) as clicks,
  COUNT(*) FILTER (WHERE converted_to_application = true) as conversions,
  ROUND(COUNT(*) FILTER (WHERE converted_to_application = true)::numeric / COUNT(*)::numeric * 100, 2) as conversion_rate
FROM social_share_clicks
WHERE clicked_at > now() - interval '30 days'
GROUP BY source_network;
```

---

## CONTACT & SUPPORT

Pour toute question sur le système OG tags:

1. Consultez d'abord `SOCIAL_SHARING_COMPLETE.md`
2. Lancez le script de validation automatique
3. Vérifiez les logs Edge Functions
4. Consultez ce guide

---

**FIN DU GUIDE**

**Rappel**: Chaque lien partagé doit afficher un aperçu PARFAIT. Aucune approximation. Aucun fallback générique. Ce système est CRITIQUE pour le business.

✅ **Système validé et production-ready!**
