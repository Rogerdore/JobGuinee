# Guide de Troubleshooting - Aperçus Sociaux

## 🔍 Diagnostiquer les Problèmes

### Symptôme 1: Facebook n'affiche pas l'aperçu

**Causes possibles:**

#### 1a. Edge Function ne répond pas

```bash
# Tester la edge function
curl -v "https://jobguinee-pro.com/functions/v1/job-og-preview?job_id=550e8400-e29b-41d4-a716-446655440000"

# Devrait retourner 200 + HTML avec OG tags
```

**Solutions:**

```bash
# 1. Vérifier que la fonction est déployée
supabase functions list

# 2. Vérifier les logs
supabase functions list
supabase functions logs job-og-preview

# 3. Re-déployer si nécessaire
supabase functions deploy job-og-preview

# 4. Vérifier les environnements
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### 1b. URL est mauvaise

```bash
# ❌ MAUVAIS - utilise /offres/
https://jobguinee.com/offres/550e8400

# ✅ BON - utilise /s/
https://jobguinee.com/s/550e8400

# ✅ BON - avec paramètre réseau
https://jobguinee.com/s/550e8400?src=facebook
```

**Solution:** Vérifier dans `src/services/socialShareService.ts` que `generateShareLinks()` utilise `/s/` et non `/offres/`

#### 1c. Job n'existe pas ou est privé

```sql
-- Vérifier que le job existe
SELECT id, title, status
FROM jobs
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Devrait retourner 1 résultat avec status = 'approved'
```

**Solutions:**

```sql
-- Si job n'existe pas, en créer un
INSERT INTO jobs (title, company_name, location, contract_type, status)
VALUES ('Développeur', 'Acme', 'Conakry', 'CDI', 'approved');

-- Si job est 'draft', l'approuver
UPDATE jobs
SET status = 'approved'
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

#### 1d. Facebook cache l'ancienne version

**Solution:** Effacer le cache Facebook

1. Aller sur: https://developers.facebook.com/tools/debug/sharing/
2. Entrer l'URL
3. Cliquer "Scrape Again"
4. Attendre le rechargement (1-2 minutes)

#### 1e. OG tags n'ont pas la bonne structure

```bash
# Tester l'HTML retourné
curl "https://jobguinee.com/functions/v1/job-og-preview?job_id=550e8400" | grep -i "og:"

# Devrait afficher:
# <meta property="og:title" content="...">
# <meta property="og:description" content="...">
# <meta property="og:image" content="...">
# <meta property="og:url" content="...">
```

**Solutions:**

```bash
# 1. Vérifier la fonction source
cat supabase/functions/job-og-preview/index.ts

# 2. Vérifier le HTML généré
curl "https://jobguinee.com/functions/v1/job-og-preview?job_id=550e8400" | head -50

# 3. Vérifier que les meta tags sont dans <head>
curl "https://jobguinee.com/functions/v1/job-og-preview?job_id=550e8400" | grep "<head>" -A 20
```

---

### Symptôme 2: Les clics ne sont pas enregistrés

**Causes possibles:**

#### 2a. Table `job_clicks` n'existe pas

```sql
-- Vérifier que la table existe
\dt job_clicks

-- Ou
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_name = 'job_clicks'
);

-- Devrait retourner: true ou t
```

**Solution:** Créer la table

```sql
-- Appliquer la migration
-- File: supabase/migrations/[timestamp]_create_job_clicks_table.sql

CREATE TABLE IF NOT EXISTS job_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  source_network TEXT,
  session_id TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Activer RLS
ALTER TABLE job_clicks ENABLE ROW LEVEL SECURITY;

-- Ajouter policies
-- Après avoir ajouté les policies, faire:
-- supabase migration list
-- supabase migration up
```

#### 2b. RLS policies bloquent les inserts

```sql
-- Vérifier les policies
SELECT * FROM pg_policies
WHERE tablename = 'job_clicks';

-- Devrait montrer 4+ policies
-- Une doit permettre INSERT
```

**Solutions:**

```sql
-- Vérifier la policy INSERT
SELECT definition FROM pg_policies
WHERE tablename = 'job_clicks'
AND policyname LIKE '%insert%' OR policyname LIKE '%INSERT%';

-- Si elle manque, l'ajouter
CREATE POLICY "Anyone can insert clicks"
  ON job_clicks
  FOR INSERT
  WITH CHECK (true);

-- Si elle existe mais bloque, l'améliorer
-- (Au lieu de WITH CHECK (false), mettre WITH CHECK (true))
```

#### 2c. Hook `useSocialShareTracking` ne s'exécute pas

```javascript
// Vérifier dans la console du navigateur
console.log(window.location.search);
// Devrait afficher: ?src=facebook

// Vérifier que le hook est importé
// Dans JobDetail.tsx:
// import { useSocialShareTracking } from '...'
// useSocialShareTracking();
```

**Solutions:**

```typescript
// 1. Vérifier que JobDetail.tsx importe le hook
import { useSocialShareTracking } from '../hooks/useSocialShareTracking';

// 2. Vérifier que le hook est appelé
export default function JobDetail() {
  useSocialShareTracking(); // ← Doit être présent
  // ... reste du composant
}

// 3. Vérifier que le hook a accès à job.id
// Dans JobDetail.tsx:
const { jobId } = useParams();
// Le hook reçoit jobId automatiquement? Ou l'ajouter:
useSocialShareTracking(jobId);
```

#### 2d. Erreur de permission dans la base de données

```bash
# Vérifier les logs
supabase functions logs track-job-click

# Devrait montrer les erreurs si quelque chose va mal
```

**Solutions:**

```bash
# Vérifier que l'utilisateur a les permissions
# Vérifier que la RLS policy laisse passer les inserts:

# Tester manuellement une insertion
curl -X POST \
  https://jobguinee.com/functions/v1/... \
  -H "Content-Type: application/json" \
  -d '{"job_id":"550e8400", "network":"facebook"}'

# Devrait retourner 200 et pas 403
```

---

### Symptôme 3: L'image OG ne s'affiche pas

**Causes possibles:**

#### 3a. URL de l'image est invalide

```javascript
// Dans la console
document.querySelector('meta[property="og:image"]')?.content
// Devrait retourner une URL valide

// Tester l'URL
fetch('https://... image url ...')
  .then(r => console.log('Status:', r.status))
```

**Solutions:**

```sql
-- Vérifier que le job a une image
SELECT id, title, featured_image_url
FROM jobs
WHERE id = '550e8400';

-- Si featured_image_url est NULL, en ajouter une
UPDATE jobs
SET featured_image_url = 'https://... valid image url ...'
WHERE id = '550e8400';

-- Tester que l'URL retourne 200
curl -I 'https://... image url ...'
# Devrait avoir: HTTP/1.1 200 OK
```

#### 3b. Image est trop grande ou mauvais format

```bash
# Vérifier la taille et format
file /path/to/image.png
# Devrait afficher: PNG image, 1200 x 630

# Optimiser
convert image.png -resize 1200x630 image-optimized.png
```

#### 3c. Image n'est pas publiquement accessible

```bash
# Tester l'accès
curl -v "https://... image url ..."

# Devrait retourner 200, pas 403/404

# Si c'est dans un bucket, vérifier les permissions
# Via Supabase dashboard:
# Storage → Policies → Devrait être public
```

**Solutions:**

```sql
-- Vérifier les permissions du bucket
-- Via Supabase dashboard:
-- Storage → Policies

-- Ou via SQL:
SELECT * FROM storage.objects
WHERE bucket_id = 'images'
LIMIT 5;

-- Vérifier que le fichier existe et est public
-- Upload une nouvelle image si nécessaire
```

---

### Symptôme 4: Lien de partage utilise `/offres/` au lieu de `/s/`

**Cause:** `socialShareService.ts` n'a pas été mise à jour

**Solution:**

```bash
# Vérifier le fichier
grep "generateShareLinks" src/services/socialShareService.ts

# Devrait contenir:
# const shareUrl = `${BASE_URL}/s/${job.id}`;

# Et PAS:
# const jobUrl = `${BASE_URL}/offres/${job.id}`;

# Si problème, corriger:
# Remplacer:
# const jobUrl = `${BASE_URL}/offres/${job.id}`;
# Par:
# const shareUrl = `${BASE_URL}/s/${job.id}`;
```

---

### Symptôme 5: ShareRedirect ne redirige pas vers `/offres/`

**Cause:** ShareRedirect.tsx ne redirige pas correctement

**Solution:**

```bash
# Vérifier le fichier
grep "window.location" src/pages/ShareRedirect.tsx

# Devrait avoir:
# window.location.href = redirectUrl;

# Vérifier que redirectUrl est construit correctement
# Devrait être: /offres/slug?src=network
```

---

## 🧪 Tests de Validation

### Test 1: Valider OG Tags sur Facebook

```bash
# 1. Préparer l'URL
JOB_ID="550e8400-e29b-41d4-a716-446655440000"
URL="https://jobguinee.com/s/$JOB_ID"

# 2. Scraper les OG tags
curl "$URL" | grep "og:" | head -10

# Résultat attendu:
# <meta property="og:title" content="Titre du job">
# <meta property="og:description" content="Description">
# <meta property="og:image" content="...">
# <meta property="og:url" content="...">

# 3. Si pas de résultats, vérifier la edge function
curl "https://jobguinee.com/functions/v1/job-og-preview?job_id=$JOB_ID"
```

### Test 2: Valider le tracking des clics

```sql
-- 1. Insérer un test clic
INSERT INTO job_clicks (job_id, source_network, session_id)
VALUES ('550e8400', 'facebook', 'test-' || NOW()::text);

-- 2. Vérifier qu'il a été inséré
SELECT * FROM job_clicks
WHERE job_id = '550e8400'
AND source_network = 'facebook'
ORDER BY created_at DESC
LIMIT 1;

-- 3. Compter par réseau
SELECT source_network, COUNT(*)
FROM job_clicks
WHERE job_id = '550e8400'
GROUP BY source_network;
```

### Test 3: Vérifier les compteurs

```sql
-- 1. Vérifier que les colonnes existent
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'jobs'
AND column_name LIKE '%count%';

-- Devrait afficher:
-- clicks_count
-- views_count
-- shares_count

-- 2. Vérifier les valeurs
SELECT id, title, clicks_count, shares_count, views_count
FROM jobs
WHERE clicks_count > 0 OR shares_count > 0
LIMIT 5;
```

---

## 📊 Monitoring en Continu

### Vérifier que tout fonctionne quotidiennement

```bash
#!/bin/bash
# daily-check.sh

echo "=== Daily Social Preview Health Check ==="
echo ""

# 1. Vérifier Edge Function
echo "1. Checking Edge Function..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  "https://jobguinee.com/functions/v1/job-og-preview?job_id=550e8400")

if [ "$RESPONSE" = "200" ]; then
  echo "✓ Edge Function OK"
else
  echo "✗ Edge Function ERROR (HTTP $RESPONSE)"
fi

# 2. Vérifier Database
echo "2. Checking Database..."
CLICKS=$(psql -c "SELECT COUNT(*) FROM job_clicks WHERE created_at > NOW() - INTERVAL '24 hours';" | tail -1)
echo "✓ Clics today: $CLICKS"

# 3. Vérifier Performance
echo "3. Checking Response Time..."
TIME=$(curl -s -o /dev/null -w "%{time_total}" \
  "https://jobguinee.com/functions/v1/job-og-preview?job_id=550e8400")
echo "✓ Response time: ${TIME}s"

echo ""
echo "=== Check Complete ==="
```

---

## 🆘 Escalation

### Qui contacter selon le problème

**Edge Function issues:**
- DevOps / Backend team
- Check Supabase logs

**Database issues:**
- Database admin
- Check RLS policies
- Check migrations

**Frontend issues:**
- Frontend team
- Check ShareRedirect.tsx
- Check ShareJobModal.tsx

**Performance issues:**
- DevOps + Database admin
- Check indexes
- Check query logs

**Security issues:**
- Security team
- Review RLS
- Audit access logs

---

## 📚 Resources

### Outils de Debug

- [Facebook Debugger](https://developers.facebook.com/tools/debug/sharing/)
- [Supabase Logs](https://supabase.com/docs/guides/functions/logging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Postman](https://www.postman.com/)

### Documentation

- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Version:** 1.0 | Date: 12 Janvier 2026
