# GUIDE DE CONFIGURATION EMAIL - JobGuinée

**Version**: 1.0
**Date**: 30 Janvier 2026
**Système**: Production Ready

---

## OBJECTIF

Ce guide vous permet de configurer votre fournisseur email pour JobGuinée. Le système supporte plusieurs providers professionnels et permet d'envoyer:
- Emails de bienvenue (candidats et recruteurs)
- Confirmations de candidature
- Alertes emploi
- Notifications système
- Emails marketing

---

## PROVIDERS SUPPORTÉS

### 1. SendGrid (Recommandé)
- Fiable et professionnel
- 100 emails/jour gratuits
- Dashboard analytics complet
- Support technique réactif

### 2. Resend (Moderne)
- Interface simple et moderne
- 100 emails/jour gratuits
- API excellente
- Parfait pour démarrer

### 3. Mailgun (Puissant)
- Très flexible
- 5,000 emails/mois gratuits (3 mois)
- Features avancées
- Excellent pour scaling

### 4. SMTP / Gmail
- Configuration personnalisée
- Gratuit si vous avez Gmail
- Limite: 500 emails/jour

### 5. AWS SES (Entreprise)
- Très économique à grande échelle
- Configuration technique
- Nécessite compte AWS

### 6. Brevo (Marketing)
- 300 emails/jour gratuits
- Outils marketing intégrés
- SMS inclus

---

## CONFIGURATION RAPIDE

### Accéder à l'interface admin

1. Connectez-vous en tant qu'administrateur
2. Allez sur `/admin/email-config`
3. Choisissez votre provider
4. Entrez vos credentials
5. Testez la configuration
6. Activez

---

## SENDGRID (RECOMMANDÉ)

### Étape 1: Créer un compte

1. Allez sur https://signup.sendgrid.com/
2. Créez un compte gratuit
3. Vérifiez votre email

### Étape 2: Créer une clé API

1. Dans le dashboard, allez dans **Settings** → **API Keys**
2. Cliquez sur **Create API Key**
3. Nom: `JobGuinee Production`
4. Permissions: **Full Access**
5. Copiez la clé (vous ne pourrez plus la voir!)

### Étape 3: Vérifier votre domaine (optionnel mais recommandé)

1. Allez dans **Settings** → **Sender Authentication**
2. Cliquez sur **Authenticate Your Domain**
3. Suivez les instructions pour ajouter les DNS records
4. Attendez la validation (peut prendre 24-48h)

### Étape 4: Configuration dans JobGuinée

```
Provider: SendGrid
API Key: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
From Email: noreply@jobguinee.com (ou votre domaine vérifié)
From Name: JobGuinée
Reply-To Email: contact@jobguinee.com
```

### Étape 5: Test

Cliquez sur "Envoyer un test" et vérifiez votre boîte de réception.

---

## RESEND

### Étape 1: Créer un compte

1. Allez sur https://resend.com/signup
2. Créez un compte gratuit
3. Vérifiez votre email

### Étape 2: Créer une clé API

1. Dans le dashboard, allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Nom: `JobGuinee Production`
4. Permissions: **Sending access**
5. Copiez la clé

### Étape 3: Ajouter un domaine (optionnel)

1. Allez dans **Domains**
2. Cliquez sur **Add Domain**
3. Entrez votre domaine: `jobguinee.com`
4. Ajoutez les DNS records fournis
5. Attendez la vérification

### Étape 4: Configuration dans JobGuinée

```
Provider: Resend
API Key: re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
From Email: noreply@jobguinee.com
From Name: JobGuinée
Reply-To Email: contact@jobguinee.com
```

---

## MAILGUN

### Étape 1: Créer un compte

1. Allez sur https://signup.mailgun.com/new/signup
2. Créez un compte gratuit (carte bancaire requise mais non débitée)
3. Vérifiez votre email

### Étape 2: Obtenir les credentials

1. Dans le dashboard, allez dans **Sending** → **Domain settings**
2. Sélectionnez votre domaine sandbox (pour tester)
3. Notez:
   - **Domain**: `sandboxXXXX.mailgun.org`
   - **API Key**: Dans **Settings** → **API Keys**

### Étape 3: Configuration dans JobGuinée

```
Provider: Mailgun
API Key: key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
API Domain: sandboxXXXX.mailgun.org
From Email: noreply@sandboxXXXX.mailgun.org
From Name: JobGuinée
```

### Étape 4: Passer en production

1. Ajoutez votre propre domaine
2. Configurez les DNS records
3. Attendez la validation
4. Mettez à jour le domaine dans la config

---

## SMTP / GMAIL

### Étape 1: Activer l'accès app Gmail

1. Allez sur https://myaccount.google.com/security
2. Activez la **validation en deux étapes**
3. Allez dans **Mots de passe des applications**
4. Créez un mot de passe pour "Application personnalisée"
5. Nom: `JobGuinee`
6. Copiez le mot de passe (16 caractères)

### Étape 2: Configuration dans JobGuinée

```
Provider: SMTP / Gmail
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: votre-email@gmail.com
SMTP Password: xxxx xxxx xxxx xxxx (mot de passe app)
From Email: votre-email@gmail.com
From Name: JobGuinée
```

### Limites Gmail

- 500 emails/jour maximum
- Pas recommandé pour production à grande échelle
- Parfait pour tester

---

## AWS SES

### Prérequis

- Compte AWS actif
- Accès AWS IAM
- Connaissances techniques AWS

### Étape 1: Configurer SES

1. Connectez-vous à AWS Console
2. Recherchez **SES** (Simple Email Service)
3. Vérifiez votre domaine ou email
4. Demandez à sortir du sandbox mode (si production)

### Étape 2: Créer des credentials IAM

1. Allez dans **IAM** → **Users**
2. Créez un utilisateur: `jobguinee-ses`
3. Permissions: `AmazonSESFullAccess`
4. Créez une clé d'accès
5. Copiez Access Key ID et Secret Access Key

### Étape 3: Configuration dans JobGuinée

```
Provider: AWS SES
API Key: AKIA... (Access Key ID:Secret Access Key format)
API Region: us-east-1 (ou votre région)
From Email: noreply@jobguinee.com
From Name: JobGuinée
```

---

## BREVO (SENDINBLUE)

### Étape 1: Créer un compte

1. Allez sur https://app.brevo.com/account/register
2. Créez un compte gratuit
3. Vérifiez votre email

### Étape 2: Obtenir la clé API

1. Dans le dashboard, allez dans **SMTP & API**
2. Onglet **API Keys**
3. Créez une nouvelle clé
4. Nom: `JobGuinee`
5. Copiez la clé

### Étape 3: Configuration dans JobGuinée

```
Provider: Brevo
API Key: xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
From Email: votre-email@votredomaine.com
From Name: JobGuinée
```

---

## TEMPLATES D'EMAILS

Le système inclut 5 templates par défaut:

### 1. welcome_candidate
Envoyé lors de l'inscription d'un candidat
Variables: `{{candidate_name}}`, `{{candidate_email}}`, `{{app_url}}`

### 2. welcome_recruiter
Envoyé lors de l'inscription d'un recruteur
Variables: `{{company_name}}`, `{{recruiter_name}}`, `{{recruiter_email}}`, `{{app_url}}`

### 3. application_confirmation
Confirmation de candidature pour le candidat
Variables: `{{candidate_name}}`, `{{job_title}}`, `{{company_name}}`, `{{app_url}}`

### 4. new_application_alert
Notification pour le recruteur
Variables: `{{job_title}}`, `{{candidate_name}}`, `{{application_id}}`, `{{app_url}}`

### 5. job_alert_match
Alerte emploi pour candidat
Variables: `{{candidate_name}}`, `{{job_title}}`, `{{company_name}}`, `{{job_location}}`, `{{job_id}}`, `{{app_url}}`

---

## UTILISATION DANS LE CODE

### Envoyer un email avec template

```typescript
import { emailService } from '../services/emailService';

// Email de bienvenue candidat
await emailService.sendWelcomeEmail(
  'Jean Dupont',
  'jean@example.com'
);

// Confirmation de candidature
await emailService.sendApplicationConfirmation(
  'Jean Dupont',
  'jean@example.com',
  'Développeur Full Stack',
  'TechCorp'
);

// Alerte emploi
await emailService.sendJobAlert(
  'Jean Dupont',
  'jean@example.com',
  'Développeur Full Stack',
  'TechCorp',
  'Conakry',
  'job-uuid-here'
);
```

### Envoyer un email personnalisé

```typescript
import { emailService } from '../services/emailService';

await emailService.sendEmail({
  to_email: 'user@example.com',
  to_name: 'Jean Dupont',
  subject: 'Votre compte a été activé',
  html_body: '<h1>Félicitations!</h1><p>Votre compte est maintenant actif.</p>',
  text_body: 'Félicitations! Votre compte est maintenant actif.'
});
```

### Utiliser la queue (envoi différé)

```typescript
import { emailService } from '../services/emailService';

await emailService.queueEmail({
  template_key: 'welcome_candidate',
  to_email: 'user@example.com',
  to_name: 'Jean Dupont',
  variables: {
    candidate_name: 'Jean Dupont',
    app_url: window.location.origin
  },
  priority: 1, // 1 = haute priorité, 10 = basse
  scheduled_for: '2026-02-01T10:00:00Z' // Optionnel
});
```

---

## STATISTIQUES & MONITORING

### Voir les statistiques

```typescript
import { emailService } from '../services/emailService';

const stats = await emailService.getEmailStats(30); // Derniers 30 jours

console.log(stats);
// {
//   total_sent: 1250,
//   total_delivered: 1230,
//   total_opened: 890,
//   total_clicked: 245,
//   total_failed: 20
// }
```

### Voir les logs

```typescript
import { emailService } from '../services/emailService';

const logs = await emailService.getEmailLogs(50); // 50 derniers emails

logs.forEach(log => {
  console.log(`${log.recipient_email}: ${log.status}`);
});
```

### Dashboard SQL

```sql
-- Emails envoyés aujourd'hui
SELECT COUNT(*) FROM email_logs
WHERE sent_at::date = CURRENT_DATE;

-- Taux de livraison 7 derniers jours
SELECT
  COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'delivered')::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as delivery_rate
FROM email_logs
WHERE created_at > now() - interval '7 days';

-- Top templates utilisés
SELECT
  email_type,
  COUNT(*) as sent_count,
  COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened_count
FROM email_logs
WHERE created_at > now() - interval '30 days'
GROUP BY email_type
ORDER BY sent_count DESC;
```

---

## TROUBLESHOOTING

### Problème: Email de test non reçu

**Solutions**:
1. Vérifiez vos spams
2. Attendez 5 minutes (délais possibles)
3. Vérifiez que le domaine est vérifié
4. Consultez les logs dans l'interface admin

### Problème: Erreur "Invalid API Key"

**Solutions**:
1. Vérifiez que vous avez copié la clé complète
2. Régénérez une nouvelle clé API
3. Vérifiez que la clé a les bonnes permissions

### Problème: Emails marqués comme spam

**Solutions**:
1. Vérifiez votre domaine (SPF, DKIM, DMARC)
2. Utilisez un domaine vérifié
3. Évitez les mots spam dans le sujet
4. Ajoutez un lien de désinscription
5. Respectez le RGPD

### Problème: Rate limit atteint

**Solutions**:
1. Augmentez les limites dans la config
2. Upgradez votre plan provider
3. Utilisez la queue avec scheduled_for
4. Répartissez les envois sur plusieurs heures

---

## BEST PRACTICES

### 1. Domaine personnalisé

Utilisez toujours votre propre domaine vérifié:
- `noreply@jobguinee.com`
- Pas `noreply@sendgrid.net`

### 2. Reply-To

Configurez un email de réponse réel:
- `contact@jobguinee.com`

### 3. Templates

- Utilisez toujours des templates
- Ne hardcodez pas le HTML
- Variables plutôt que concatenation
- Testez sur plusieurs clients (Gmail, Outlook, mobile)

### 4. RGPD

- Ajoutez un lien de désinscription
- Respectez les préférences utilisateur
- Ne vendez jamais les emails
- Gardez les logs 30 jours max (RGPD)

### 5. Monitoring

- Surveillez le taux de livraison (> 95%)
- Surveillez le taux d'ouverture (> 20%)
- Surveillez les bounces (< 2%)
- Agissez si taux de spam > 0.1%

---

## LIMITES PAR PROVIDER

| Provider | Gratuit/mois | Limite/jour | Limite/heure |
|----------|--------------|-------------|--------------|
| SendGrid | 100/jour | 100 | 10 |
| Resend | 3,000 | 100 | 10 |
| Mailgun | 5,000 (3 mois) | 300 | 30 |
| Gmail SMTP | 15,000 | 500 | 50 |
| AWS SES | 62,000 | Illimité* | Illimité* |
| Brevo | 9,000 | 300 | 30 |

*AWS SES: après vérification et sortie du sandbox

---

## COÛTS APRÈS GRATUIT

| Provider | Prix pour 10k emails | Prix pour 100k emails |
|----------|----------------------|----------------------|
| SendGrid | $19.95/mois | $89.95/mois |
| Resend | $20/mois | $80/mois |
| Mailgun | $35/mois | $90/mois |
| AWS SES | $1 | $10 |
| Brevo | $25/mois | $65/mois |

---

## MIGRATION ENTRE PROVIDERS

Pour changer de provider:

1. Configurez le nouveau provider (sans activer)
2. Testez la configuration
3. Si OK, activez le nouveau
4. L'ancien sera automatiquement désactivé
5. Surveillez les premières heures

---

## SUPPORT

Pour toute question:

1. Consultez ce guide d'abord
2. Vérifiez les logs dans l'interface admin
3. Testez avec l'email de test
4. Consultez la doc du provider

---

## CHECKLIST DE PRODUCTION

Avant de lancer en production:

- [ ] Provider configuré et actif
- [ ] Domaine vérifié (SPF, DKIM)
- [ ] Test envoyé et reçu
- [ ] Templates personnalisés
- [ ] From Email avec votre domaine
- [ ] Reply-To configuré
- [ ] Limites configurées (daily_limit, rate_limit)
- [ ] Logs activés
- [ ] Monitoring en place
- [ ] RGPD conforme (opt-out)

---

**FIN DU GUIDE**

Le système email est maintenant configuré et prêt pour la production!
