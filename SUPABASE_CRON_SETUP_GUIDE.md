# GUIDE DE CONFIGURATION CRON JOB - SUPABASE DASHBOARD
## Expiration Automatique des Badges JobGuinée V6

**Date:** 1er janvier 2026
**Version:** 1.0.0
**Durée estimée:** 5 minutes

---

## 📋 PRÉREQUIS

- ✅ Edge Function `job-badge-expiration-cron` déployée
- ✅ Accès administrateur au Supabase Dashboard
- ✅ Projet Supabase actif et configuré

---

## 🎯 OBJECTIF

Configurer l'exécution automatique de la fonction d'expiration des badges toutes les heures pour désactiver les badges expirés sans intervention manuelle.

---

## 📝 ÉTAPES DE CONFIGURATION

### Étape 1: Accéder au Supabase Dashboard

1. Ouvrez votre navigateur
2. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
3. Connectez-vous avec vos identifiants
4. Sélectionnez votre projet JobGuinée

### Étape 2: Naviguer vers Edge Functions

1. Dans le menu latéral gauche, cliquez sur **"Edge Functions"**
2. Vous devriez voir la liste de toutes vos fonctions déployées
3. Cherchez la fonction: `job-badge-expiration-cron`

![Navigation Edge Functions](https://supabase.com/docs/img/edge-functions-nav.png)

### Étape 3: Ouvrir les Paramètres de la Fonction

1. Cliquez sur **`job-badge-expiration-cron`** dans la liste
2. Cliquez sur l'onglet **"Settings"** ou **"Paramètres"**
3. Faites défiler jusqu'à la section **"Cron Jobs"** ou **"Scheduled Jobs"**

### Étape 4: Ajouter un Cron Schedule

1. Cliquez sur le bouton **"Add Cron Schedule"** ou **"Ajouter un Cron"**
2. Une modal ou un formulaire s'ouvre

### Étape 5: Configurer le Cron Expression

Remplissez les champs suivants:

#### **Cron Expression:**
```
0 * * * *
```

**Explication:** Toutes les heures à la minute 0 (ex: 00:00, 01:00, 02:00, etc.)

#### **Description (optionnel):**
```
Expiration automatique des badges URGENT et À LA UNE
```

#### **Timezone:**
```
Africa/Conakry (GMT+0)
```
Ou UTC si votre timezone n'est pas disponible

### Étape 6: Configurer les Options Avancées (Recommandé)

Si disponible, configurez ces paramètres additionnels:

- **Timeout:** `10 secondes` ou `10000ms`
- **Retry:** `3 tentatives`
- **Max Execution Time:** `30 secondes`

### Étape 7: Activer le Cron Job

1. Cochez la case **"Enable"** ou **"Activer"**
2. Cliquez sur **"Save"** ou **"Enregistrer"**
3. Confirmez si une modal de confirmation apparaît

### Étape 8: Vérifier l'Activation

Vous devriez voir:
- ✅ Un indicateur **"Active"** ou **"Actif"** en vert
- ✅ Le cron expression affiché: `0 * * * *`
- ✅ La prochaine exécution prévue (Next Run)

---

## 🧪 TEST MANUEL (RECOMMANDÉ)

Avant d'attendre la prochaine exécution automatique, testez manuellement:

### Option 1: Via Supabase Dashboard

1. Dans Edge Functions > `job-badge-expiration-cron`
2. Cliquez sur **"Invoke"** ou **"Exécuter"**
3. Laissez le payload vide ou avec `{}`
4. Cliquez sur **"Send Request"**
5. Vérifiez la réponse:
   ```json
   {
     "expired_count": 0,
     "message": "Successfully processed badge expirations"
   }
   ```

### Option 2: Via cURL

```bash
curl -L -X POST 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/job-badge-expiration-cron' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  --data '{}'
```

### Option 3: Via Script Node.js

```javascript
// test-cron-manually.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testCron() {
  console.log('Testing badge expiration cron...');

  const { data, error } = await supabase.functions.invoke(
    'job-badge-expiration-cron',
    { body: {} }
  );

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', data);
  }
}

testCron();
```

---

## 📊 MONITORING DU CRON JOB

### Vérifier les Logs d'Exécution

1. Allez dans **Edge Functions > job-badge-expiration-cron**
2. Onglet **"Logs"** ou **"Journaux"**
3. Filtrez par date/heure récente
4. Cherchez les entrées horaires

**Log attendu:**
```
[2026-01-01 14:00:00] Cron triggered
[2026-01-01 14:00:00] Calling expire_job_badges()
[2026-01-01 14:00:00] Expired 3 badges
[2026-01-01 14:00:00] Success: 200
```

### Vérifier dans la Base de Données

Exécutez cette requête SQL dans Supabase SQL Editor:

```sql
-- Vérifier les badges expirés récemment
SELECT
  id,
  badge_type,
  status,
  ends_at,
  admin_notes,
  updated_at
FROM job_badge_requests
WHERE status = 'expired'
  AND updated_at >= now() - INTERVAL '2 hours'
ORDER BY updated_at DESC;
```

**Résultat attendu:** Badges avec `admin_notes` contenant "Expired automatically by cron job"

---

## 🔧 TROUBLESHOOTING

### Problème 1: Cron ne s'exécute pas

**Symptômes:**
- Aucun log dans les dernières heures
- Badges expirés restent actifs

**Solutions:**
1. Vérifier que le cron est **activé** (toggle ON)
2. Vérifier l'expression cron: `0 * * * *`
3. Vérifier que la fonction est bien déployée
4. Tester manuellement la fonction
5. Vérifier les quotas Supabase (Free tier: limites)

### Problème 2: Fonction retourne une erreur

**Symptômes:**
- Logs montrent erreur 500 ou 400
- Message d'erreur dans les logs

**Solutions:**
1. Vérifier les logs détaillés de la fonction
2. Tester la fonction Postgres directement:
   ```sql
   SELECT * FROM expire_job_badges();
   ```
3. Vérifier les permissions RLS
4. Vérifier la clé API dans .env

### Problème 3: Exécution trop lente

**Symptômes:**
- Timeout errors
- Fonction prend > 10 secondes

**Solutions:**
1. Augmenter le timeout à 30 secondes
2. Optimiser la fonction avec indexes:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_badge_expiration
   ON job_badge_requests(status, ends_at)
   WHERE status = 'approved';
   ```
3. Limiter le nombre de badges traités par batch

### Problème 4: Badges non désactivés sur jobs

**Symptômes:**
- Status = 'expired' mais is_urgent/is_featured toujours TRUE

**Solutions:**
1. Vérifier la fonction `deactivate_job_badge()`
2. Exécuter manuellement:
   ```sql
   SELECT deactivate_job_badge(
     '[REQUEST_ID]',
     'Manual deactivation'
   );
   ```
3. Vérifier les RLS policies sur la table `jobs`

---

## 🔔 NOTIFICATIONS (OPTIONNEL)

Pour recevoir des alertes si le cron échoue, configurez:

### Option 1: Webhook Discord/Slack

Modifier `job-badge-expiration-cron/index.ts`:

```typescript
// En cas d'erreur, envoyer webhook
if (error) {
  await fetch('YOUR_WEBHOOK_URL', {
    method: 'POST',
    body: JSON.stringify({
      text: `⚠️ Badge expiration cron failed: ${error.message}`
    })
  });
}
```

### Option 2: Email via Supabase Auth

```typescript
// Utiliser Supabase Auth pour envoyer email admin
await supabase.auth.admin.sendEmail({
  email: 'admin@jobguinee.com',
  subject: 'Cron Job Failed',
  html: '<p>Badge expiration failed</p>'
});
```

---

## 📈 MÉTRIQUES À SURVEILLER

Créez un dashboard de monitoring avec ces requêtes:

```sql
-- Nombre de badges expirés par jour (derniers 7 jours)
SELECT
  DATE(updated_at) as date,
  COUNT(*) as expired_count
FROM job_badge_requests
WHERE status = 'expired'
  AND updated_at >= now() - INTERVAL '7 days'
GROUP BY DATE(updated_at)
ORDER BY date DESC;

-- Temps moyen entre expiration prévue et réelle
SELECT
  AVG(EXTRACT(EPOCH FROM (updated_at - ends_at)) / 60) as avg_delay_minutes
FROM job_badge_requests
WHERE status = 'expired'
  AND updated_at >= now() - INTERVAL '7 days';
```

---

## ✅ CHECKLIST FINALE

- [ ] Cron job créé dans Supabase Dashboard
- [ ] Expression cron: `0 * * * *`
- [ ] Cron job activé (toggle ON)
- [ ] Test manuel réussi
- [ ] Logs d'exécution visibles
- [ ] Badges expirés correctement désactivés
- [ ] Prochaine exécution planifiée visible
- [ ] Monitoring configuré
- [ ] Documentation lue et comprise

---

## 📞 SUPPORT

**Si problèmes persistent:**
1. Consulter [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
2. Vérifier [Supabase Status](https://status.supabase.com/)
3. Contacter support Supabase
4. Examiner les logs détaillés

**Pour questions sur JobGuinée:**
- Consulter `BADGES_SYSTEM_FINAL_DOCUMENTATION.md`
- Examiner le code source des fonctions
- Vérifier les migrations SQL

---

## 🎉 FÉLICITATIONS!

Votre système de badges dispose maintenant d'une expiration automatique!

**Prochaines étapes:**
- Monitorer les exécutions pendant 24-48h
- Ajuster si nécessaire
- Configurer des alertes
- Créer des rapports hebdomadaires

---

**Document créé le:** 1er janvier 2026
**Dernière mise à jour:** 1er janvier 2026
**Version:** 1.0.0
**Status:** ✅ Production Ready
