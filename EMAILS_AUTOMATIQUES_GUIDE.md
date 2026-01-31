# Guide des Emails Automatiques - JobGuinée

## Système Complet d'Emails Automatiques

Tous les emails automatiques sont maintenant **entièrement configurés** et fonctionnent via votre SMTP Hostinger !

---

## Événements Qui Déclenchent des Emails Automatiquement

### 1. Inscription (Nouveau Compte)

**Événement** : Un utilisateur crée un compte

**Emails envoyés** :
- **Email de bienvenue** (candidat ou recruteur selon le type)

**Template utilisé** :
- `welcome_candidate` pour les candidats
- `welcome_recruiter` pour les recruteurs

**Variables disponibles** :
```json
{
  "candidate_name": "Nom du candidat",
  "candidate_email": "email@exemple.com",
  "app_url": "https://jobguinee-pro.com"
}
```

**Délai d'envoi** : Immédiat (dans les 2-3 minutes)

---

### 2. Candidature à une Offre

**Événement** : Un candidat postule à une offre d'emploi

**Emails envoyés** :
1. **Confirmation au candidat** - "Votre candidature a été envoyée"
2. **Alerte au recruteur** - "Nouvelle candidature reçue"

**Templates utilisés** :
- `application_confirmation` (pour le candidat)
- `new_application_alert` (pour le recruteur)

**Variables disponibles** :
```json
{
  "candidate_name": "Jean Dupont",
  "job_title": "Développeur Web",
  "company_name": "TechCorp",
  "application_reference": "APP-2026-001234",
  "app_url": "https://jobguinee-pro.com"
}
```

**Délai d'envoi** : Immédiat (dans les 2-3 minutes)

---

### 3. Publication d'une Offre Correspondante

**Événement** : Un recruteur publie une nouvelle offre qui correspond aux alertes emploi des candidats

**Emails envoyés** :
- **Alerte emploi** à tous les candidats ayant activé des alertes correspondantes

**Template utilisé** : `job_alert_match`

**Variables disponibles** :
```json
{
  "candidate_name": "Jean Dupont",
  "job_title": "Développeur Web",
  "company_name": "TechCorp",
  "location": "Conakry",
  "job_type": "CDI",
  "salary_range": "800,000 - 1,200,000 GNF",
  "app_url": "https://jobguinee-pro.com",
  "job_url": "https://jobguinee-pro.com/jobs/12345"
}
```

**Critères de correspondance** :
- Mots-clés dans le titre ou description
- Localisation
- Type de contrat
- Niveau d'expérience

**Délai d'envoi** : 5 minutes après publication (pour éviter le spam)

---

## Architecture du Système

```
┌─────────────────────────────────────────────────────────┐
│                      ÉVÉNEMENT                           │
│  (Inscription, Candidature, Publication Offre)           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Trigger SQL          │
         │  (Automatique)        │
         └──────────┬────────────┘
                    │
                    ▼
         ┌───────────────────────┐
         │  email_queue          │
         │  (Table)              │
         │  - to_email           │
         │  - template_id        │
         │  - variables          │
         │  - status: pending    │
         └──────────┬────────────┘
                    │
                    ▼
         ┌───────────────────────┐
         │  Edge Function        │
         │  process-email-queue  │
         │  (Cron ou Manuel)     │
         └──────────┬────────────┘
                    │
                    ▼
         ┌───────────────────────┐
         │  Edge Function        │
         │  send-email           │
         └──────────┬────────────┘
                    │
                    ▼
         ┌───────────────────────┐
         │  SMTP Hostinger       │
         │  smtp.hostinger.com   │
         └──────────┬────────────┘
                    │
                    ▼
              📧 Email envoyé
```

---

## Comment Traiter la Queue d'Emails

Les emails sont ajoutés automatiquement à la queue `email_queue` par les triggers, mais ils doivent être **traités** pour être envoyés.

### Option 1 : Traitement Manuel (Pour Tester)

```sql
-- Voir les emails en attente
SELECT
  to_email,
  status,
  created_at,
  template_id
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

Ensuite, appelez l'Edge Function pour traiter la queue :

```bash
curl -X POST "https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/process-email-queue" \
  -H "Authorization: Bearer VOTRE_ANON_KEY"
```

### Option 2 : Automatique via Cron (Recommandé pour Production)

**Important** : Vous devez configurer un cron job qui appelle l'Edge Function `process-email-queue` toutes les minutes.

**Avec Supabase Dashboard** :
1. Allez dans Database → Cron Jobs
2. Créez un nouveau cron job :
   ```sql
   -- Appeler l'Edge Function toutes les minutes
   -- (Vous devrez créer une fonction qui appelle l'Edge Function via HTTP)
   ```

**Avec un service externe** (ex: Uptime Robot, Cron-job.org) :
1. Créez un cron job qui fait un POST vers :
   ```
   https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/process-email-queue
   ```
2. Fréquence : **Toutes les 1-5 minutes**
3. Headers requis : `Authorization: Bearer VOTRE_ANON_KEY`

### Option 3 : Via un Script Node.js Local (Pour Développement)

Créez un fichier `process-emails-cron.js` :

```javascript
const SUPABASE_URL = 'https://hhhjzgeidjqctuveopso.supabase.co';
const SUPABASE_ANON_KEY = 'votre_anon_key';

async function processEmails() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/process-email-queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('✅ Emails traités:', result);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter toutes les minutes
setInterval(processEmails, 60000);
processEmails(); // Premier appel immédiat
```

Lancez avec :
```bash
node process-emails-cron.js
```

---

## Vérifier que Tout Fonctionne

### Test 1 : Email de Bienvenue

1. Créez un nouveau compte sur votre site
2. Vérifiez la queue :
   ```sql
   SELECT * FROM email_queue
   WHERE status = 'pending'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
3. Vous devriez voir un email en attente
4. Appelez `process-email-queue` (voir options ci-dessus)
5. Vérifiez votre boîte email (et spam)

### Test 2 : Email de Candidature

1. Connectez-vous en tant que candidat
2. Postulez à une offre
3. Vérifiez la queue :
   ```sql
   SELECT * FROM email_queue
   WHERE status = 'pending'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
4. Vous devriez voir **2 emails** :
   - Un pour le candidat (confirmation)
   - Un pour le recruteur (alerte)
5. Appelez `process-email-queue`
6. Vérifiez les boîtes email

### Test 3 : Alerte Emploi

1. Créez une alerte emploi en tant que candidat
2. Publiez une offre correspondante en tant que recruteur
3. Vérifiez la queue :
   ```sql
   SELECT * FROM email_queue
   WHERE status = 'pending'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
4. Vous devriez voir un email d'alerte
5. Appelez `process-email-queue`
6. Vérifiez l'email

---

## Statistiques et Monitoring

### Voir les Stats de la Queue

```sql
-- Vue des statistiques
SELECT * FROM email_queue_stats;

-- Détails par statut
SELECT
  status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE created_at > now() - interval '1 hour') as last_hour,
  COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') as last_24h
FROM email_queue
GROUP BY status;

-- Derniers emails envoyés
SELECT
  to_email,
  status,
  error_message,
  created_at,
  processed_at
FROM email_queue
WHERE status IN ('sent', 'failed')
ORDER BY processed_at DESC
LIMIT 20;
```

### Taux de Succès

```sql
-- Taux de succès des dernières 24h
SELECT
  COUNT(*) FILTER (WHERE status = 'sent') as envoyés,
  COUNT(*) FILTER (WHERE status = 'failed') as échoués,
  COUNT(*) FILTER (WHERE status = 'pending') as en_attente,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::numeric /
    NULLIF(COUNT(*) FILTER (WHERE status IN ('sent', 'failed'))::numeric, 0) * 100,
    2
  ) as taux_succès_pourcent
FROM email_queue
WHERE created_at > now() - interval '24 hours';
```

---

## Templates d'Email Disponibles

| Template Key | Événement | Destinataire |
|--------------|-----------|--------------|
| `welcome_candidate` | Inscription candidat | Candidat |
| `welcome_recruiter` | Inscription recruteur | Recruteur |
| `application_confirmation` | Candidature envoyée | Candidat |
| `new_application_alert` | Nouvelle candidature | Recruteur |
| `job_alert_match` | Offre correspondante | Candidats avec alertes |

---

## Modifier les Templates d'Email

Pour personnaliser le contenu des emails :

1. Allez sur `/admin/email-templates`
2. Sélectionnez le template à modifier
3. Modifiez le sujet, corps HTML, et corps texte
4. Utilisez les variables entre `{{}}` (ex: `{{candidate_name}}`)
5. Cliquez sur "Enregistrer"

**Variables disponibles** : Voir la section de chaque événement ci-dessus

---

## Troubleshooting

### Les emails ne sont pas dans la queue

**Vérifier** :
```sql
-- Vérifier que les triggers existent
SELECT
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger
WHERE tgname LIKE '%email%'
ORDER BY tgrelid::regclass::text;
```

**Solution** : Si les triggers sont manquants, ils ont été créés par la migration. Vérifiez les logs.

### Les emails restent en "pending"

**Cause** : L'Edge Function `process-email-queue` n'est pas appelée

**Solution** : Configurez un cron job (voir Option 2 ci-dessus)

### Les emails sont en "failed"

**Vérifier** :
```sql
SELECT
  to_email,
  error_message,
  retry_count
FROM email_queue
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 10;
```

**Solutions** :
- Vérifiez le mot de passe SMTP
- Vérifiez que `smtp.hostinger.com` est accessible
- Consultez les logs de l'Edge Function `send-email`

---

## Résumé : Tout est Automatique Maintenant !

✅ **Inscription** → Email de bienvenue automatique
✅ **Candidature** → Email confirmation + alerte recruteur automatiques
✅ **Offre publiée** → Alertes emploi automatiques
✅ **SMTP Hostinger** → Tous les emails utilisent votre serveur

**La seule chose à faire** : Configurer un cron job pour appeler `process-email-queue` toutes les 1-5 minutes.

**Alternative sans cron** : Appelez manuellement l'Edge Function après chaque événement important (moins optimal mais fonctionne).
