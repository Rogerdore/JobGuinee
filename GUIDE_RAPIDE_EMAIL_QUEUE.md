# Guide Rapide - Système de File d'Attente d'Emails

## Système Opérationnel

Le système complet d'emails automatiques est **maintenant en place et fonctionnel**.

---

## Comment Ça Marche

```
Événement → Trigger SQL → enqueue_email() → email_queue → Cron (2-3 min) → SMTP → Email
```

**Automatique à 100%** : Les triggers insèrent les emails dans la queue, le cron les traite.

---

## Événements Automatiques

| Événement | Email(s) Envoyé(s) | Délai |
|-----------|-------------------|-------|
| **Inscription candidat** | Email de bienvenue | Immédiat |
| **Inscription recruteur** | Email de bienvenue | Immédiat |
| **Candidature** | Confirmation (candidat) + Alerte (recruteur) | Immédiat |
| **Offre publiée** | Alertes emploi (candidats) | +5 min |

---

## Vérification Rapide

### 1. Vérifier que tout est en place

```sql
SELECT * FROM diagnose_email_queue();
```

**Résultat attendu** :
- Templates actifs : 5
- Triggers actifs : 12

### 2. Voir les emails en attente

```sql
SELECT
  to_email,
  template_key,
  queue_status,
  created_at
FROM v_email_queue_monitoring
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;
```

### 3. Statistiques du jour

```sql
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as en_attente,
  COUNT(*) FILTER (WHERE status = 'sent') as envoyés,
  COUNT(*) FILTER (WHERE status = 'failed') as échoués
FROM email_queue
WHERE created_at > CURRENT_DATE;
```

---

## Test Manuel

### Ajouter un email manuellement

```sql
SELECT enqueue_email(
  p_template_key := 'welcome_candidate',
  p_to_email := 'votre-email@exemple.com',
  p_to_name := 'Votre Nom',
  p_variables := jsonb_build_object(
    'candidate_name', 'Votre Nom',
    'app_url', 'https://jobguinee-pro.com'
  )
);
```

### Vérifier qu'il est dans la queue

```sql
SELECT * FROM v_email_queue_monitoring
WHERE to_email = 'votre-email@exemple.com';
```

**Status attendu** : `queue_status = 'READY'`

---

## Cron Externe

**URL** : `https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/process-email-queue`

**Configuration actuelle** : cron-job.org appelle cette URL toutes les 2-3 minutes

**Headers requis** :
```
Authorization: Bearer VOTRE_ANON_KEY
Content-Type: application/json
```

**Méthode** : POST

---

## Traitement Manuel (si nécessaire)

Si le cron ne fonctionne pas temporairement :

```bash
curl -X POST "https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/process-email-queue" \
  -H "Authorization: Bearer VOTRE_ANON_KEY" \
  -H "Content-Type: application/json"
```

---

## Surveillance

### Dashboard Quotidien

```sql
-- Vue d'ensemble du jour
SELECT
  COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_for <= now()) as prêts_à_envoyer,
  COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_for > now()) as planifiés,
  COUNT(*) FILTER (WHERE status = 'sent') as envoyés_aujourd_hui,
  COUNT(*) FILTER (WHERE status = 'failed') as échecs
FROM email_queue
WHERE created_at > CURRENT_DATE;
```

### Voir les Échecs

```sql
SELECT
  to_email,
  template_key,
  error_message,
  retry_count,
  created_at
FROM v_email_queue_monitoring
WHERE status = 'failed'
ORDER BY processed_at DESC
LIMIT 10;
```

---

## Problèmes Fréquents

### Emails restent en 'pending'

**Cause** : Le cron n'appelle pas l'Edge Function

**Solutions** :
1. Vérifier le cron sur cron-job.org
2. Appeler manuellement (voir ci-dessus)
3. Vérifier les logs de l'Edge Function

### Emails en 'failed'

**Causes courantes** :
- Mot de passe SMTP incorrect
- Email destinataire invalide
- SMTP Hostinger inaccessible

**Solution** :
```sql
-- Voir l'erreur exacte
SELECT error_message FROM email_queue
WHERE status = 'failed'
ORDER BY processed_at DESC
LIMIT 1;
```

---

## Maintenance

### Nettoyer les anciens emails (mensuel)

```sql
-- Supprimer les emails envoyés de plus de 30 jours
DELETE FROM email_queue
WHERE status = 'sent'
AND processed_at < now() - interval '30 days';
```

### Réessayer les emails échoués

```sql
-- Réinitialiser pour retry
UPDATE email_queue
SET
  status = 'pending',
  retry_count = 0,
  error_message = NULL,
  scheduled_for = now()
WHERE status = 'failed'
AND retry_count < max_retries;
```

---

## Templates d'Email

Gérer via l'interface admin : `/admin/email-templates`

**Templates disponibles** :
1. `welcome_candidate` - Bienvenue candidat
2. `welcome_recruiter` - Bienvenue recruteur
3. `application_confirmation` - Confirmation candidature
4. `new_application_alert` - Alerte nouvelle candidature
5. `job_alert_match` - Alerte offre correspondante

**Variables disponibles** : Voir `SYSTEME_EMAIL_QUEUE_DEFINITIF.md`

---

## Tests Complets

Exécuter le script de test :

```bash
# Dans Supabase SQL Editor
# Copier/coller le contenu de TEST_EMAIL_QUEUE_SYSTEM.sql
```

---

## Documentation Complète

Pour plus de détails, consulter :
- **`SYSTEME_EMAIL_QUEUE_DEFINITIF.md`** - Documentation technique complète
- **`TEST_EMAIL_QUEUE_SYSTEM.sql`** - Script de tests automatisés

---

## Support

En cas de problème :

1. **Diagnostic** : `SELECT * FROM diagnose_email_queue();`
2. **Monitoring** : `SELECT * FROM v_email_queue_monitoring WHERE status = 'failed' LIMIT 10;`
3. **Logs Edge Function** : Supabase Dashboard → Functions → process-email-queue → Logs

---

## Résumé : Vous Êtes Prêt

✅ Système complet installé et testé
✅ 4 Triggers automatiques opérationnels
✅ 5 Templates email actifs
✅ Cron configuré (2-3 min)
✅ SMTP Hostinger fonctionnel
✅ Monitoring et diagnostic en place

**Le système fonctionne automatiquement. Aucune action manuelle requise.**

**Prochaine étape** : Créer un compte réel pour recevoir votre premier email de bienvenue.
