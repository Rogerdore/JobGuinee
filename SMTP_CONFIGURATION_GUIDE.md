# Guide de Configuration SMTP - JobGuinée

## Situation Actuelle

### Problème : 2 systèmes d'emails séparés

```
┌─────────────────────────────────────────────────────────────┐
│                     INSCRIPTION UTILISATEUR                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────┴────────────────────┐
        │                                        │
   ┌────▼────┐                             ┌────▼────┐
   │ AVANT   │                             │ APRÈS   │
   └────┬────┘                             └────┬────┘
        │                                        │
   [Supabase Auth]                         [Votre Service]
   Email confirmation                      Email de bienvenue
   ❌ Pas configurable                     ✅ SMTP Hostinger
   ❌ Email non reçu                       ✅ Emails envoyés
```

## Pourquoi Supabase Auth n'utilise pas votre SMTP ?

**Supabase Auth est un service managé** :
- Les emails sont envoyés par les serveurs de Supabase
- Vous **NE POUVEZ PAS** configurer un SMTP personnalisé
- C'est une limitation de Supabase hébergé

**Options avec Supabase Auth** :
1. ❌ Utiliser leur SMTP par défaut (ne fonctionne pas toujours)
2. ✅ **Désactiver la confirmation email** (solution actuelle)
3. ✅ Utiliser votre propre service d'emails (solution actuelle)

---

## Solution Mise en Place

### Architecture Actuelle

```
┌─────────────────────────────────────────────────────────────┐
│                  INSCRIPTION UTILISATEUR                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  ┌─────────────────┐
                  │  Supabase Auth  │
                  │  (signUp)       │
                  └────────┬────────┘
                           │
                  ✅ Connexion immédiate
                  (pas de confirmation)
                           │
                  ┌────────▼────────┐
                  │  Trigger SQL    │
                  │  (après insert) │
                  └────────┬────────┘
                           │
                  ┌────────▼────────┐
                  │  Email Queue    │
                  │  + Template     │
                  └────────┬────────┘
                           │
              ┌────────────▼────────────────┐
              │  Edge Function              │
              │  process-email-queue        │
              └────────────┬────────────────┘
                           │
              ┌────────────▼────────────────┐
              │  SMTP HOSTINGER             │
              │  smtp.hostinger.com:465     │
              │  contact@jobguinee-pro.com  │
              └─────────────────────────────┘
                           │
                  📧 Email de bienvenue
```

---

## Configuration SMTP Hostinger (Pour votre service)

### Étape 1 : Accéder à l'interface Admin

```bash
URL: https://jobguinee-pro.com/admin/email-config
```

**Identifiants Admin** :
- Email : doreroger04@gmail.com (ou votre admin)
- Connectez-vous avec votre compte admin

### Étape 2 : Vérifier/Configurer le SMTP

La configuration est **déjà pré-remplie** dans la base de données :

```sql
-- Vérifier la configuration actuelle
SELECT
  provider_type,
  is_active,
  smtp_host,
  smtp_port,
  smtp_user,
  from_email,
  from_name
FROM email_provider_config
WHERE is_active = true;
```

**Résultat actuel** :
```
provider_type: smtp
is_active: true
smtp_host: smtp.hostinger.com
smtp_port: 465
smtp_user: contact@jobguinee-pro.com
from_email: contact@jobguinee-pro.com
from_name: JobGuinée Pro
```

### Étape 3 : S'assurer que le mot de passe est correct

Le mot de passe est déjà dans la base : `Rogerdore1986@`

**Pour le vérifier/modifier** :
1. Allez sur `/admin/email-config`
2. Vérifiez que le mot de passe est correct
3. Testez l'envoi d'un email de test

---

## Créer les Templates d'Email

Les templates d'email doivent exister pour que le système fonctionne.

<function_calls>
<invoke name="mcp__supabase__execute_sql">
<parameter name="query">
-- Vérifier si les templates existent
SELECT template_key, subject, is_active
FROM email_templates
WHERE template_key IN ('welcome_candidate', 'welcome_recruiter')
ORDER BY template_key;
