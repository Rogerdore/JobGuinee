# SYSTÈME DE SÉCURITÉ IA - JOBGUINÉE

**Projet:** JobGuinée
**Date:** 10 Décembre 2025
**Version:** 1.0
**Statut:** Production Ready

---

## VUE D'ENSEMBLE

Le **Système de Sécurité IA** protège la plateforme JobGuinée contre les abus et le spam des services IA. Il intègre plusieurs couches de protection pour éviter la consommation excessive de crédits, les attaques par script et les surcoûts.

### Problèmes Résolus

**AVANT:**
- Aucune limite sur les appels IA par utilisateur
- Possibilité de spammer les services sans restriction
- Risque de script automatisé consommant des crédits
- Pas de détection d'abus
- Coûts IA incontrôlés

**APRÈS:**
- Rate limiting strict (minute/heure/jour)
- Détection automatique d'abus
- Suspension d'utilisateurs
- Logs de sécurité complets
- Dashboard admin pour surveillance
- Protection contre scripts

---

## ARCHITECTURE

### Tables de Sécurité

#### 1. ai_rate_limits

**Description:** Suivi en temps réel des appels IA par utilisateur

**Colonnes:**
- `id` (uuid)
- `user_id` (uuid) - Utilisateur
- `service_code` (text) - Service appelé (ai_cv_generation, etc.)
- `window_type` (text) - Type de fenêtre: 'minute', 'hour', 'day'
- `call_count` (integer) - Nombre d'appels dans la fenêtre
- `window_start` (timestamptz) - Début de la fenêtre
- `window_end` (timestamptz) - Fin de la fenêtre
- `created_at`, `updated_at`

**Contrainte unique:** `(user_id, service_code, window_type, window_start)`

**Indexes:**
- idx_ai_rate_limits_user (user_id)
- idx_ai_rate_limits_service (service_code)
- idx_ai_rate_limits_window (window_type, window_start)

**RLS:**
- Utilisateurs: voir leurs propres limites
- Système: gérer toutes les limites
- Admins: voir toutes les limites

#### 2. ai_security_logs

**Description:** Journal de tous les événements de sécurité IA

**Colonnes:**
- `id` (uuid)
- `user_id` (uuid) - Utilisateur concerné
- `user_email` (text) - Email (copie pour historique)
- `service_code` (text) - Service concerné
- `event_type` (text) - Type: 'allowed', 'blocked', 'warning', 'suspicious'
- `reason` (text) - Raison de l'événement
- `call_count_minute` (integer) - Appels dans la minute
- `call_count_hour` (integer) - Appels dans l'heure
- `call_count_day` (integer) - Appels dans la journée
- `ip_address` (text) - IP source (optionnel)
- `user_agent` (text) - User agent (optionnel)
- `request_payload` (jsonb) - Données de la requête
- `created_at`

**Indexes:**
- idx_ai_security_logs_user (user_id)
- idx_ai_security_logs_event (event_type)
- idx_ai_security_logs_created (created_at DESC)

**RLS:**
- Utilisateurs: voir leurs propres logs
- Système: créer des logs
- Admins: voir tous les logs

**Conservation:** 90 jours (nettoyage automatique)

#### 3. ai_user_restrictions

**Description:** Restrictions et suspensions par utilisateur

**Colonnes:**
- `id` (uuid)
- `user_id` (uuid) - Utilisateur (UNIQUE)
- `is_suspended` (boolean) - Utilisateur suspendu?
- `suspension_reason` (text) - Raison de suspension
- `suspension_until` (timestamptz) - Fin de suspension (NULL = permanent)
- `custom_rate_limit_minute` (integer) - Limite personnalisée/minute
- `custom_rate_limit_hour` (integer) - Limite personnalisée/heure
- `custom_rate_limit_day` (integer) - Limite personnalisée/jour
- `notes` (text) - Notes admin
- `created_at`, `updated_at`

**Indexes:**
- idx_ai_user_restrictions_user (user_id)
- idx_ai_user_restrictions_suspended (is_suspended)

**RLS:**
- Utilisateurs: voir leurs propres restrictions
- Admins: gérer toutes les restrictions

---

## FONCTIONS DE PROTECTION

### 1. check_ai_rate_limit(p_user_id, p_service_code)

**Description:** Vérifie si l'utilisateur peut faire un appel IA

**Paramètres:**
- `p_user_id` (uuid) - ID utilisateur
- `p_service_code` (text) - Code du service

**Retour:**
```json
{
  "allowed": true/false,
  "reason": "RATE_LIMIT_MINUTE" | "USER_SUSPENDED" | null,
  "message": "Message d'erreur",
  "calls_minute": 5,
  "calls_hour": 42,
  "calls_day": 215,
  "limit_minute": 10,
  "limit_hour": 100,
  "limit_day": 500
}
```

**Limites par défaut:**
- **10 appels/minute** par service
- **100 appels/heure** par service
- **500 appels/jour** par service

**Logique:**

1. **Vérifie restrictions utilisateur** (ai_user_restrictions)
   - Si `is_suspended = true` ET (`suspension_until` NULL OU future)
   - BLOQUE avec raison "USER_SUSPENDED"
   - Log événement 'blocked'

2. **Applique limites personnalisées** (si définies)
   - Remplace limites par défaut
   - Permet ajustements par utilisateur

3. **Compte appels dans fenêtres**
   - Minute: depuis début minute actuelle
   - Heure: depuis début heure actuelle
   - Jour: depuis début jour actuel

4. **Vérifie limites** (dans l'ordre)
   - Si appels_minute >= limite_minute → BLOQUE "RATE_LIMIT_MINUTE"
   - Si appels_heure >= limite_heure → BLOQUE "RATE_LIMIT_HOUR"
   - Si appels_jour >= limite_jour → BLOQUE "RATE_LIMIT_DAY"

5. **Avertissement** (si proche limite)
   - Si >= 80% d'une limite
   - Log événement 'warning'

6. **Incrémente compteurs**
   - Upsert dans ai_rate_limits
   - 3 lignes: minute, hour, day

7. **Retourne autorisation**
   - allowed: true
   - Compteurs actuels et limites

### 2. log_ai_security_event(...)

**Description:** Enregistre un événement de sécurité

**Paramètres:**
- `p_user_id` (uuid)
- `p_service_code` (text)
- `p_event_type` (text) - 'allowed', 'blocked', 'warning', 'suspicious'
- `p_reason` (text)
- `p_call_count_minute` (integer)
- `p_call_count_hour` (integer)
- `p_call_count_day` (integer)
- `p_request_payload` (jsonb)

**Retour:** `uuid` (ID du log créé)

**Actions:**
1. Récupère email utilisateur depuis auth.users
2. Insère dans ai_security_logs
3. Retourne ID du log

### 3. use_ai_credits (MODIFIÉ)

**Description:** Fonction principale de consommation de crédits IA (avec sécurité intégrée)

**Ordre d'exécution:**

**1. CHECK RATE LIMIT** ⚡ (PREMIER CHECK)
```sql
v_rate_limit_check := check_ai_rate_limit(p_user_id, p_service_key);

IF NOT allowed THEN
  RETURN error response;
END IF;
```

**2. CHECK USER AUTH**
- Vérifie user_id non null
- Log 'blocked' si absent

**3. GET SERVICE CONFIG**
- Récupère service_credit_costs
- Vérifie is_active = true
- Log 'blocked' si inactif

**4. CHECK USER BALANCE**
- Récupère profiles.credits_balance
- Vérifie solde >= coût
- Log 'blocked' si insuffisant

**5. CONSUME CREDITS**
- Débite profiles.credits_balance
- Crée credit_transactions
- Enregistre ai_service_usage_history

**6. LOG SUCCESS**
- Log 'allowed' avec compteurs

**7. RETURN SUCCESS**
- Retourne résultat + rate_limit_info

**Messages d'erreur clairs:**
- "Vous avez dépassé le nombre de requêtes autorisées par minute. Veuillez patienter."
- "Vous avez dépassé le nombre de requêtes autorisées aujourd'hui. Veuillez réessayer demain."
- "Votre compte est suspendu. Raison: [raison]"
- "Crédits insuffisants. Requis: X, Disponible: Y"

### 4. cleanup_old_rate_limits()

**Description:** Nettoyage automatique des données anciennes

**Actions:**
- Supprime ai_rate_limits > 7 jours
- Supprime ai_security_logs > 90 jours

**Exécution:** Cron job quotidien (à configurer)

---

## SERVICES IA PROTÉGÉS

Tous les services suivants sont protégés par le système:

1. **ai_cv_generation** - Génération CV IA
2. **ai_cover_letter** - Lettres de motivation IA
3. **ai_matching** - Matching emploi IA
4. **ai_coach** - Coaching carrière IA
5. **ai_career_plan** - Plans de carrière IA
6. **profile_visibility_boost** - Boost visibilité
7. **featured_application** - Candidature vedette

Chaque service a ses propres compteurs de rate limiting.

---

## PAGE ADMIN: LOGS DE SÉCURITÉ

### Route

`/admin-security-logs` (à ajouter au routing)

### Fonctionnalités

**1. Statistiques en temps réel**
- Total des logs
- Autorisés (vert)
- Bloqués (rouge)
- Avertissements (jaune)
- Suspects (orange)

**2. Filtres par type**
- Tous
- Bloqués uniquement
- Avertissements
- Suspects
- Autorisés

**3. Table des logs**

Colonnes:
- Date/Heure
- Utilisateur (email + ID)
- Service
- Type (badge coloré)
- Raison
- Compteurs d'appels (min/h/jour)
- Actions

**4. Actions par log**

**Voir détails:**
- Modal avec infos complètes
- Compteurs détaillés
- Payload de la requête
- Timestamps

**Suspendre utilisateur:**
- Disponible pour logs 'blocked' et 'suspicious'
- Modal de suspension:
  - Durée: 1h / 24h / 7j / 30j / Permanent
  - Raison obligatoire
  - Notes optionnelles
- Création/mise à jour ai_user_restrictions

**5. Informations limites**
- Affichage des limites actuelles
- 10/minute, 100/heure, 500/jour

---

## SCÉNARIOS D'UTILISATION

### Utilisateur Normal

**Scénario:** Utilisation normale des services IA

**Flow:**
1. Utilisateur clique "Générer CV IA"
2. Frontend appelle `CreditService.consumeCredits(userId, 'ai_cv_generation')`
3. Backend exécute `use_ai_credits`
4. **Check rate limit:** 3 appels ce jour → OK (< 500)
5. **Check balance:** 100 crédits > 50 requis → OK
6. Débite 50 crédits
7. Log événement 'allowed'
8. Incrémente compteurs
9. Génère CV
10. Retourne succès

**Expérience utilisateur:** Fluide, transparente

### Script Abusif

**Scénario:** Tentative de spam automatisé

**Flow:**
1. Script lance 15 appels en 1 minute
2. Appel #11: `check_ai_rate_limit` détecte limite dépassée
3. BLOQUE avec "RATE_LIMIT_MINUTE"
4. Log événement 'blocked'
5. Crédits NON consommés
6. Retourne erreur au script

**Message:** "Vous avez dépassé le nombre de requêtes autorisées par minute. Veuillez patienter."

**Admin alerté:** Log visible dans dashboard

### Utilisateur Approchant Limite

**Scénario:** Utilisateur très actif

**Flow:**
1. Utilisateur fait 85 appels en 1 heure (85% de 100)
2. `check_ai_rate_limit` détecte 80%+ limite
3. AUTORISE l'appel
4. Log événement 'warning'
5. Appel se poursuit normalement

**Admin notifié:** Peut vérifier activité si suspect

### Utilisateur Suspendu

**Scénario:** Admin a suspendu un utilisateur

**Flow:**
1. Admin détecte abus dans logs
2. Clique "Suspendre" sur log
3. Définit durée (ex: 24h) et raison
4. Système crée ai_user_restrictions
5. Utilisateur tente appel IA
6. `check_ai_rate_limit` détecte suspension
7. BLOQUE immédiatement
8. Log événement 'blocked'
9. Message: "Votre compte est suspendu. Raison: [raison]"

**Frontend:** Affiche message clair

---

## WORKFLOW ADMIN

### Surveillance Quotidienne

**1. Accès dashboard**
- Navigue vers `/admin-security-logs`

**2. Vérification statistiques**
- Vérifie nombre de bloqués
- Repère pics d'avertissements
- Identifie activités suspectes

**3. Investigation logs bloqués**
- Filtre "Bloqués"
- Identifie utilisateurs récurrents
- Vérifie patterns abusifs

**4. Actions correctives**

**Si spam évident:**
- Clique "Suspendre"
- Durée: 7 jours ou permanent
- Raison: "Spam automatisé détecté"
- Valide

**Si erreur légitime:**
- Pas d'action
- Utilisateur pourra réessayer après fenêtre

**Si besoin limite personnalisée:**
- Accès direct DB ou future UI
- Modifie ai_user_restrictions
- Ajuste custom_rate_limit_*

### Investigation Utilisateur Spécifique

**1. Recherche logs**
- Filtre ou recherche par email
- Consulte historique complet

**2. Analyse patterns**
- Fréquence appels
- Services utilisés
- Heures d'activité

**3. Décision**
- Normal: aucune action
- Suspect: avertissement ou limite réduite
- Abusif: suspension

### Levée de Suspension

**1. Accès ai_user_restrictions**
- SQL direct ou future UI

**2. Modification**
```sql
UPDATE ai_user_restrictions
SET is_suspended = false,
    suspension_until = NULL,
    notes = 'Suspension levée le [date] - Raison: [raison]'
WHERE user_id = '[uuid]';
```

**3. Utilisateur peut réutiliser services**

---

## PERSONNALISATION PAR UTILISATEUR

### Limites Personnalisées

**Cas d'usage:**
- Utilisateur premium: limites augmentées
- Utilisateur problématique: limites réduites
- Partenaire: limites adaptées

**Configuration:**
```sql
INSERT INTO ai_user_restrictions (user_id, custom_rate_limit_minute, custom_rate_limit_hour, custom_rate_limit_day)
VALUES ('[uuid]', 20, 200, 1000)
ON CONFLICT (user_id) DO UPDATE SET
  custom_rate_limit_minute = EXCLUDED.custom_rate_limit_minute,
  custom_rate_limit_hour = EXCLUDED.custom_rate_limit_hour,
  custom_rate_limit_day = EXCLUDED.custom_rate_limit_day;
```

**Effet:** Les limites personnalisées remplacent les limites par défaut pour cet utilisateur uniquement.

---

## MÉTRIQUES & MONITORING

### KPIs de Sécurité

**1. Taux de blocage**
```
(Logs 'blocked' / Total logs) * 100
```
Objectif: < 5%

**2. Utilisateurs bloqués uniques/jour**
```
COUNT(DISTINCT user_id) WHERE event_type = 'blocked' AND date = today
```
Objectif: < 10

**3. Services les plus spammés**
```
SELECT service_code, COUNT(*)
FROM ai_security_logs
WHERE event_type = 'blocked'
GROUP BY service_code
ORDER BY COUNT(*) DESC;
```

**4. Heures de pics d'abus**
```
SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*)
FROM ai_security_logs
WHERE event_type = 'blocked'
GROUP BY hour
ORDER BY COUNT(*) DESC;
```

**5. Utilisateurs suspendus actifs**
```
SELECT COUNT(*)
FROM ai_user_restrictions
WHERE is_suspended = true
  AND (suspension_until IS NULL OR suspension_until > now());
```

### Requêtes Utiles

**Utilisateurs les plus actifs (24h):**
```sql
SELECT user_email, service_code, COUNT(*) as calls
FROM ai_security_logs
WHERE created_at > now() - interval '24 hours'
  AND event_type = 'allowed'
GROUP BY user_email, service_code
ORDER BY calls DESC
LIMIT 20;
```

**Tentatives de spam récentes:**
```sql
SELECT user_email, service_code, reason, call_count_minute, call_count_hour, created_at
FROM ai_security_logs
WHERE event_type = 'blocked'
  AND created_at > now() - interval '1 hour'
ORDER BY created_at DESC;
```

**Avertissements non suivis de blocage:**
```sql
SELECT l1.user_email, l1.service_code, l1.call_count_hour
FROM ai_security_logs l1
WHERE l1.event_type = 'warning'
  AND l1.created_at > now() - interval '6 hours'
  AND NOT EXISTS (
    SELECT 1 FROM ai_security_logs l2
    WHERE l2.user_id = l1.user_id
      AND l2.service_code = l1.service_code
      AND l2.event_type = 'blocked'
      AND l2.created_at > l1.created_at
  );
```

---

## CONFIGURATION & MAINTENANCE

### Limites Globales

**Modifier limites par défaut:**

Éditer fonction `check_ai_rate_limit`:
```sql
v_max_minute integer := 10;  -- Modifier ici
v_max_hour integer := 100;   -- Modifier ici
v_max_day integer := 500;    -- Modifier ici
```

**Recommandations:**
- Minute: 5-20 (protection immédiate)
- Heure: 50-200 (usage normal)
- Jour: 300-1000 (utilisateurs actifs)

### Nettoyage Automatique

**Setup cron job Supabase:**
```sql
-- Extension pg_cron (si disponible)
SELECT cron.schedule(
  'cleanup-ai-rate-limits',
  '0 2 * * *',  -- 2h du matin chaque jour
  'SELECT cleanup_old_rate_limits();'
);
```

**Alternative manuelle:**
```sql
-- Exécuter quotidiennement
SELECT cleanup_old_rate_limits();
```

### Monitoring Proactif

**Alertes recommandées:**

1. **Pic de blocages**
   - Si > 50 blocages en 1h
   - Action: Vérifier attaque en cours

2. **Nouveau pattern de spam**
   - Si même IP/user_agent répété
   - Action: Bloquer IP au niveau infra

3. **Utilisateur premium bloqué**
   - Si utilisateur payant touche limite
   - Action: Vérifier légitimité, ajuster limites

---

## COMPATIBILITÉ FRONTEND

### CreditService.consumeCredits()

**Aucun changement requis** dans le code frontend existant.

La fonction `consumeCredits` appelle `use_ai_credits` qui intègre maintenant les checks de sécurité automatiquement.

**Gestion erreurs améliorée:**

```typescript
const result = await CreditService.consumeCredits(userId, serviceCode);

if (!result.success) {
  switch (result.error) {
    case 'RATE_LIMIT_MINUTE':
    case 'RATE_LIMIT_HOUR':
    case 'RATE_LIMIT_DAY':
      alert(result.message); // Message clair pour l'utilisateur
      break;

    case 'USER_SUSPENDED':
      alert(result.message);
      // Optionnel: rediriger vers page info suspension
      break;

    case 'INSUFFICIENT_CREDITS':
      // Proposer achat crédits
      navigate('/credit-store');
      break;

    default:
      alert('Une erreur est survenue');
  }
}
```

**Info rate limiting (optionnel):**

Le résultat inclut maintenant `rate_limit_info`:
```json
{
  "success": true,
  "rate_limit_info": {
    "calls_minute": 3,
    "calls_hour": 15,
    "calls_day": 45,
    "limit_minute": 10,
    "limit_hour": 100,
    "limit_day": 500
  }
}
```

**Affichage UI (optionnel):**
```typescript
if (result.success && result.rate_limit_info) {
  const { calls_day, limit_day } = result.rate_limit_info;
  const percent = (calls_day / limit_day) * 100;

  if (percent > 80) {
    showWarning(`Vous avez utilisé ${calls_day}/${limit_day} appels IA aujourd'hui`);
  }
}
```

---

## TESTS & VALIDATION

### Test 1: Utilisateur Normal

**Objectif:** Vérifier fonctionnement normal

**Steps:**
1. Créer utilisateur test avec 1000 crédits
2. Appeler service IA 5 fois
3. Vérifier succès de chaque appel
4. Vérifier débit de crédits
5. Vérifier logs 'allowed' créés

**Résultat attendu:** Tous appels réussis, logs corrects

### Test 2: Rate Limit Minute

**Objectif:** Vérifier blocage sur dépassement minute

**Steps:**
1. Créer utilisateur test
2. Appeler service IA 11 fois rapidement (< 1 minute)
3. Appel #11 doit être bloqué
4. Vérifier message "dépassé nombre requêtes par minute"
5. Vérifier log 'blocked' avec reason 'RATE_LIMIT_MINUTE'
6. Attendre 1 minute
7. Réessayer appel → doit réussir

**Résultat attendu:** Blocage appel #11, déblocage après 1 min

### Test 3: Rate Limit Jour

**Objectif:** Vérifier blocage sur dépassement jour

**Steps:**
1. Créer utilisateur test avec 100000 crédits
2. Script: appeler service IA 501 fois (espacé pour éviter minute/heure)
3. Appel #501 doit être bloqué
4. Vérifier message "dépassé nombre requêtes aujourd'hui"
5. Vérifier log 'blocked' avec reason 'RATE_LIMIT_DAY'

**Résultat attendu:** Blocage appel #501

### Test 4: Utilisateur Suspendu

**Objectif:** Vérifier blocage suspension

**Steps:**
1. Créer utilisateur test
2. Suspendre via SQL:
   ```sql
   INSERT INTO ai_user_restrictions (user_id, is_suspended, suspension_reason, suspension_until)
   VALUES ('[uuid]', true, 'Test suspension', now() + interval '1 hour');
   ```
3. Tenter appel IA
4. Vérifier blocage immédiat
5. Vérifier message "Votre compte est suspendu"
6. Vérifier log 'blocked' avec reason 'User suspended'

**Résultat attendu:** Blocage complet

### Test 5: Limites Personnalisées

**Objectif:** Vérifier limites custom

**Steps:**
1. Créer utilisateur test
2. Définir limite custom (2/minute):
   ```sql
   INSERT INTO ai_user_restrictions (user_id, custom_rate_limit_minute)
   VALUES ('[uuid]', 2);
   ```
3. Appeler service IA 3 fois rapidement
4. Appel #3 doit être bloqué
5. Vérifier limit dans message = 2

**Résultat attendu:** Blocage appel #3 avec limite 2

### Test 6: Avertissement

**Objectif:** Vérifier logs warning

**Steps:**
1. Créer utilisateur test
2. Appeler service IA 9 fois (90% de 10/minute)
3. Vérifier log 'warning' créé avec reason "Approaching rate limit"

**Résultat attendu:** Log warning présent

---

## AMÉLIORATIONS FUTURES

### Phase 2

**1. Dashboard Analytics Temps Réel**
- Graphiques live des appels IA
- Carte thermique des périodes de pics
- Alertes automatiques admins

**2. Détection Patterns Avancée**
- Machine learning pour détecter anomalies
- Score de risque par utilisateur
- Auto-suspension sur patterns suspects

**3. API Rate Limiting Info**
- Endpoint dédié pour check limites
- Headers HTTP avec compteurs restants
- Prévention côté client

**4. Gestion IP**
- Tracking par IP en plus de user_id
- Blocage IP temporaire
- Whitelist/Blacklist IPs

### Phase 3

**1. Multi-Niveaux Utilisateurs**
- Free: limites strictes
- Premium: limites augmentées
- Enterprise: limites custom élevées

**2. Quotas Flexibles**
- Quotas mensuels
- Rollover crédits non utilisés
- Burst allowance temporaire

**3. Auto-Scaling Limites**
- Ajustement dynamique selon charge serveur
- Réduction limites si surcharge
- Augmentation si ressources disponibles

---

## FAQ ADMIN

### Q: Comment suspendre un utilisateur abusif?

**R:**
1. Accédez à `/admin-security-logs`
2. Identifiez l'utilisateur dans les logs
3. Cliquez "Suspendre" sur un de ses logs
4. Choisissez durée et raison
5. Validez

### Q: Comment modifier les limites par défaut?

**R:** Éditez la fonction `check_ai_rate_limit` dans Supabase et modifiez les variables `v_max_minute`, `v_max_hour`, `v_max_day`.

### Q: Comment voir qui est actuellement suspendu?

**R:**
```sql
SELECT user_id, suspension_reason, suspension_until
FROM ai_user_restrictions
WHERE is_suspended = true
  AND (suspension_until IS NULL OR suspension_until > now());
```

### Q: Comment donner des limites plus élevées à un utilisateur premium?

**R:**
```sql
INSERT INTO ai_user_restrictions (user_id, custom_rate_limit_minute, custom_rate_limit_hour, custom_rate_limit_day)
VALUES ('[uuid]', 20, 200, 1000)
ON CONFLICT (user_id) DO UPDATE SET
  custom_rate_limit_minute = EXCLUDED.custom_rate_limit_minute,
  custom_rate_limit_hour = EXCLUDED.custom_rate_limit_hour,
  custom_rate_limit_day = EXCLUDED.custom_rate_limit_day;
```

### Q: Les anciens logs sont-ils supprimés automatiquement?

**R:** Oui, si vous avez configuré le cron job. Sinon, exécutez manuellement `SELECT cleanup_old_rate_limits();` régulièrement.

### Q: Que faire si un utilisateur légitime est bloqué par erreur?

**R:** Les blocages de rate limiting se lèvent automatiquement après la fenêtre de temps (1 minute, 1 heure, 1 jour). Aucune action nécessaire. Si c'est une suspension admin, levez-la manuellement.

---

## SUPPORT & CONTACT

**Documentation:** /docs/ai-security
**Logs Admin:** `/admin-security-logs`
**Support Technique:** tech@jobguinee.com

---

**FIN DE LA DOCUMENTATION**

**Auteur:** Système Bolt.new
**Dernière MAJ:** 10 Décembre 2025
**Version:** 1.0 - Système de Sécurité IA
**Statut:** Production Ready
