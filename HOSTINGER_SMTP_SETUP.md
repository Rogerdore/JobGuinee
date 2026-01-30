# CONFIGURATION SMTP HOSTINGER - JobGuinée-Pro

**Version**: 1.0 Production
**Date**: 30 Janvier 2026
**Statut**: Prêt pour Production

---

## CONFIGURATION APPLIQUÉE

Le système email de JobGuinée-Pro est maintenant configuré avec les paramètres SMTP Hostinger.

### Paramètres SMTP Actifs

```
Provider: SMTP (Hostinger)
Host: smtp.hostinger.com
Port: 465 (SSL/TLS)
Authentification: Obligatoire
Email: contact@jobguinee-pro.com
Nom: JobGuinée Pro
Reply-To: contact@jobguinee-pro.com
```

### Limites de sécurité

- Limite quotidienne: 1000 emails/jour
- Rate limit: 20 emails/minute
- Timeout connexion: 30 secondes
- Retry automatique: Non (évite les doublons)
- Logs système: Activés

---

## ACTIVATION EN 3 ÉTAPES

### Étape 1: Accéder à l'interface admin

1. Connectez-vous en tant qu'administrateur
2. Allez sur: **`https://jobguinee-pro.com/admin/email-config`**
3. La configuration SMTP Hostinger est déjà pré-remplie

### Étape 2: Ajouter le mot de passe

1. Dans la section "Configuration SMTP"
2. Champ **"Mot de passe"**: Entrez le mot de passe de `contact@jobguinee-pro.com`
3. Cliquez sur l'icône pour afficher/masquer le mot de passe (pour vérification)
4. Vérifiez que tous les champs sont corrects:
   ```
   Hôte SMTP: smtp.hostinger.com
   Port: 465
   Utilisateur: contact@jobguinee-pro.com
   Mot de passe: [votre mot de passe]
   ```

### Étape 3: Tester et activer

1. Dans la section "Test de Configuration"
2. Entrez votre email de test: `contact@jobguinee-pro.com`
3. Cliquez sur **"Envoyer un test"**
4. Vérifiez votre boîte de réception (peut prendre 1-2 minutes)
5. Si le test réussit, cochez **"Activer cette configuration"**
6. Cliquez sur **"Enregistrer"**

---

## EMAILS TRANSACTIONNELS CONFIGURÉS

Le système enverra automatiquement les emails suivants:

### 1. Inscription Candidat
**Template**: `welcome_candidate`
**Déclencheur**: Nouvel utilisateur candidat créé
**Contenu**:
- Message de bienvenue
- Lien vers les offres d'emploi
- Instructions de complétion du profil

### 2. Inscription Recruteur
**Template**: `welcome_recruiter`
**Déclencheur**: Nouvel utilisateur recruteur créé
**Contenu**:
- Message de bienvenue entreprise
- Lien vers le tableau de bord
- Instructions de publication d'offres

### 3. Confirmation Candidature
**Template**: `application_confirmation`
**Déclencheur**: Candidat postule à une offre
**Contenu**:
- Confirmation d'envoi
- Récapitulatif du poste
- Lien de suivi de candidature

### 4. Alerte Recruteur
**Template**: `new_application_alert`
**Déclencheur**: Nouvelle candidature reçue
**Contenu**:
- Notification nouvelle candidature
- Nom du candidat
- Lien vers la candidature

### 5. Alerte Emploi
**Template**: `job_alert_match`
**Déclencheur**: Nouvelle offre correspondante
**Contenu**:
- Détails du poste
- Informations entreprise
- Lien vers l'offre

---

## SÉCURITÉ ET PROTECTION

### Protections Implémentées

1. **Anti-spam**
   - Limite de 20 emails/minute
   - 1000 emails maximum par jour
   - Prévient le blacklistage du serveur

2. **Timeout & Connexion**
   - Timeout de 30 secondes
   - Reconnexion automatique si échec réseau
   - Pas de retry (évite les doublons)

3. **Credentials Sécurisés**
   - Mot de passe chiffré en base de données
   - Masqué dans l'interface (show/hide)
   - Jamais exposé dans les logs

4. **Logging Sécurisé**
   - Logs côté serveur uniquement
   - Pas d'informations sensibles
   - Historique accessible aux admins

5. **Gestion d'erreurs UX**
   - Messages en français pour l'utilisateur
   - Pas d'erreurs techniques brutes
   - Logs détaillés pour debug admin

---

## MONITORING & STATISTIQUES

### Vérifier les envois

```sql
-- Emails envoyés aujourd'hui
SELECT COUNT(*) as total_sent
FROM email_logs
WHERE sent_at::date = CURRENT_DATE
AND provider = 'smtp';

-- Taux de succès dernières 24h
SELECT
  COUNT(*) FILTER (WHERE status = 'sent') as success,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'sent')::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as success_rate
FROM email_logs
WHERE created_at > now() - interval '24 hours'
AND provider = 'smtp';

-- Derniers emails envoyés
SELECT
  recipient_email,
  email_type,
  status,
  sent_at,
  error_message
FROM email_logs
WHERE provider = 'smtp'
ORDER BY created_at DESC
LIMIT 10;
```

### Dashboard Admin

Accédez aux statistiques via:
- URL: `/admin/email-config`
- Section: "Statistiques"
- Période: 30 derniers jours

---

## UTILISATION DANS LE CODE

### Envoi manuel d'email

```typescript
import { emailService } from '../services/emailService';

// Avec template
await emailService.sendEmail({
  template_key: 'welcome_candidate',
  to_email: 'user@example.com',
  to_name: 'Jean Dupont',
  variables: {
    candidate_name: 'Jean Dupont',
    app_url: 'https://jobguinee-pro.com'
  }
});

// Email personnalisé
await emailService.sendEmail({
  to_email: 'user@example.com',
  to_name: 'Jean Dupont',
  subject: 'Votre compte est activé',
  html_body: '<h1>Bienvenue!</h1><p>Votre compte est maintenant actif.</p>',
  text_body: 'Bienvenue! Votre compte est maintenant actif.'
});
```

### Vérifier le statut d'envoi

```typescript
import { emailService } from '../services/emailService';

const logs = await emailService.getEmailLogs(50);
logs.forEach(log => {
  console.log(`${log.recipient_email}: ${log.status}`);
  if (log.error_message) {
    console.error(`Erreur: ${log.error_message}`);
  }
});
```

---

## TROUBLESHOOTING

### Problème: Email de test non reçu

**Solutions**:
1. Vérifiez le dossier spam/courrier indésirable
2. Attendez 2-3 minutes (délai possible)
3. Vérifiez le mot de passe de `contact@jobguinee-pro.com`
4. Consultez les logs: `/admin/email-config` → section Logs

### Problème: Erreur "Authentification SMTP échouée"

**Solutions**:
1. Vérifiez le mot de passe de la boîte mail Hostinger
2. Connectez-vous à Webmail Hostinger pour confirmer le mot de passe
3. Si besoin, réinitialisez le mot de passe via Hostinger
4. Mettez à jour dans `/admin/email-config`

### Problème: Erreur "Connexion impossible"

**Solutions**:
1. Vérifiez que `smtp.hostinger.com` est accessible
2. Test ping: `ping smtp.hostinger.com`
3. Vérifiez que le port 465 n'est pas bloqué par firewall
4. Contactez le support Hostinger si nécessaire

### Problème: Emails marqués comme spam

**Solutions**:
1. **Vérifiez les enregistrements DNS chez Hostinger**:
   - SPF: Autorise Hostinger à envoyer pour votre domaine
   - DKIM: Signature électronique
   - DMARC: Politique anti-spam

2. **Configuration DNS recommandée** (à ajouter chez Hostinger):
   ```
   Type: TXT
   Nom: @
   Valeur: v=spf1 include:_spf.hosting.hostinger.com ~all

   Type: TXT
   Nom: _dmarc
   Valeur: v=DMARC1; p=quarantine; rua=mailto:contact@jobguinee-pro.com
   ```

3. Évitez les mots spam dans les sujets (GRATUIT, URGENT, etc.)
4. Incluez toujours un lien de désinscription
5. Respectez la limite de 20 emails/minute

### Problème: "Rate limit exceeded"

**Solutions**:
1. Le système limite automatiquement à 20 emails/minute
2. Pour envoi en masse, utilisez la queue:
   ```typescript
   await emailService.queueEmail({
     template_key: 'job_alert_match',
     to_email: 'user@example.com',
     variables: {...},
     priority: 5,
     scheduled_for: '2026-02-01T10:00:00Z'
   });
   ```
3. Les emails en queue seront envoyés progressivement

---

## LIMITES HOSTINGER

### Quotas Email

- **Par jour**: 1000 emails (configuré à 1000)
- **Par minute**: ~20-30 emails (configuré à 20 pour sécurité)
- **Taille max**: 50 MB par email (non limité côté code)
- **Pièces jointes**: Supportées (non implémenté actuellement)

### Recommandations

1. **< 100 emails/jour**: Configuration actuelle parfaite
2. **100-500 emails/jour**: Surveillez les quotas
3. **> 500 emails/jour**: Envisagez SendGrid/Resend pour scaling
4. **> 1000 emails/jour**: Obligatoire d'upgrader vers service dédié

---

## MIGRATION VERS AUTRE PROVIDER (SI BESOIN)

Si vous dépassez les limites Hostinger, migration facile vers:

### Option 1: SendGrid (Recommandé pour scaling)
- 100 emails/jour gratuits
- Puis $19.95/mois pour 40k emails
- Configuration en 5 minutes
- Meilleur taux de délivrabilité

### Option 2: Resend (Moderne)
- 3000 emails/mois gratuits
- API excellente
- Dashboard moderne
- Parfait pour startups

### Option 3: AWS SES (Entreprise)
- $1 pour 10k emails
- Scaling illimité
- Configuration technique
- Nécessite compte AWS

### Comment migrer

1. Créez un compte sur le nouveau provider
2. Allez dans `/admin/email-config`
3. Choisissez le nouveau provider dans le dropdown
4. Configurez les credentials
5. Testez
6. Activez → L'ancien est automatiquement désactivé
7. Les emails continuent sans interruption

---

## CHECKLIST DE PRODUCTION

Avant le lancement:

- [x] Configuration SMTP Hostinger créée
- [x] Edge Function avec support SMTP 465/SSL déployée
- [x] 5 templates transactionnels actifs
- [x] Protections anti-spam configurées
- [x] Logging sécurisé activé
- [x] Interface admin opérationnelle
- [ ] Mot de passe SMTP configuré
- [ ] Test email envoyé et reçu
- [ ] Configuration activée
- [ ] DNS SPF/DKIM vérifiés (recommandé)
- [ ] Monitoring quotas activé

---

## VÉRIFICATION DNS (RECOMMANDÉ)

### Vérifier vos enregistrements DNS actuels

1. Allez sur: https://mxtoolbox.com/SuperTool.aspx
2. Entrez: `jobguinee-pro.com`
3. Vérifiez:
   - **SPF**: Doit inclure Hostinger
   - **DKIM**: Doit être configuré
   - **DMARC**: Doit avoir une politique

### Si manquant, ajoutez chez Hostinger

1. Connectez-vous à votre compte Hostinger
2. Allez dans: **Domaines** → **jobguinee-pro.com** → **DNS**
3. Ajoutez les enregistrements recommandés ci-dessus
4. Attendez 24-48h pour propagation DNS
5. Re-testez sur MXToolbox

---

## SUPPORT

### Problèmes techniques

1. Consultez les logs: `/admin/email-config`
2. Vérifiez les quotas: Requête SQL ci-dessus
3. Testez la connexion: Bouton "Envoyer un test"

### Contact Support

- **Hostinger**: https://www.hostinger.com/cpanel-login
- **JobGuinée Tech**: contact@jobguinee-pro.com
- **Documentation**: EMAIL_SETUP_GUIDE.md (guide complet)

---

## RÉSUMÉ TECHNIQUE

### Architecture

```
[Application]
    ↓
[emailService.ts]
    ↓
[Edge Function: send-email]
    ↓
[SMTP Hostinger]
    ↓
[email_logs table]
```

### Flux d'envoi

1. Application appelle `emailService.sendEmail()`
2. Edge Function récupère config active (SMTP Hostinger)
3. Connexion TLS au port 465
4. Authentification SMTP
5. Envoi du message
6. Log du résultat en base
7. Retour succès/erreur à l'application

### Sécurité multicouche

- **Transport**: TLS/SSL (port 465)
- **Auth**: LOGIN SMTP avec credentials
- **Storage**: Credentials chiffrés en base
- **Rate limiting**: 20 emails/minute max
- **Timeout**: 30 secondes max
- **Logs**: Côté serveur uniquement

---

**FIN - Configuration SMTP Hostinger Prête pour Production**

Le système est maintenant configuré pour envoyer des emails transactionnels
via votre infrastructure Hostinger existante, de manière sécurisée et fiable.

Il suffit d'ajouter le mot de passe dans l'interface admin et d'activer.
