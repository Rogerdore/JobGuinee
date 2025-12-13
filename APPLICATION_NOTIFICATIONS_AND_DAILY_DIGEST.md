# Système complet de notifications et emails pour candidatures

## Vue d'ensemble

Ce système transforme l'action "Postuler" d'un simple insert en base de données en un événement RH complet avec notifications immédiates, emails professionnels et rapports quotidiens pour les recruteurs.

## Architecture

### 1. Base de données

#### Nouvelles tables

##### `applications` (extension)
- `application_reference` : Numéro de candidature unique (format : APP-YYYYMMDD-XXXX)
- Généré automatiquement par trigger
- Index pour recherche rapide

##### `recruiter_notification_settings`
Configuration des notifications pour chaque recruteur :
- Notifications immédiates (email, SMS, WhatsApp)
- Rapport quotidien (activé/désactivé, heure, timezone)
- Format du rapport (résumé ou détaillé)
- Options d'inclusion (scores IA, liens directs, envoi si zéro candidature)

##### `email_logs`
Traçabilité complète des emails :
- Type d'email (confirmation candidat, alerte recruteur, rapport quotidien)
- Statut d'envoi (pending, sent, delivered, failed)
- Contenu complet (sujet, corps)
- Liens vers entités (application, job, company)
- Métadonnées de tracking

##### `daily_digest_log`
Log des rapports quotidiens :
- Prévention des doubles envois (contrainte unique : recruiter_id + date)
- Statistiques des candidatures incluses
- Référence à l'email log

#### Fonctions DB

##### `generate_application_reference()`
Génère un numéro de référence unique :
- Format : APP-YYYYMMDD-XXXX
- Incrémente automatiquement
- Protection anti-collision

##### `set_application_reference()`
Trigger BEFORE INSERT sur applications :
- Génère automatiquement application_reference si null

### 2. Services backend

#### `applicationSubmissionService.ts`
Service centralisé pour gérer les candidatures :

**Fonctionnalités :**
- Anti-doublon : vérifie qu'une candidature n'existe pas déjà
- Génération du score IA
- Création de la candidature en DB
- Envoi notifications candidat (interne + email)
- Envoi notifications recruteur (interne + email si activé)
- Retour structuré avec référence et prochaines étapes

**API principale :**
```typescript
submitApplication(data: ApplicationSubmissionData): Promise<ApplicationSubmissionResult>
```

**Templates emails inclus :**
1. **Confirmation candidat** : Email professionnel avec référence, détails du poste, prochaines étapes
2. **Alerte recruteur** : Email immédiat avec infos candidat, score IA, lien direct vers pipeline

### 3. Edge Function (Cron)

#### `recruiter-daily-digest`
Fonction déployée sur Supabase Edge Functions :

**Déclenchement :**
- Programmé pour s'exécuter toutes les heures (0-23h)
- Traite les recruteurs configurés pour l'heure actuelle

**Processus :**
1. Récupère les paramètres des recruteurs pour l'heure courante
2. Vérifie qu'un digest n'a pas déjà été envoyé aujourd'hui
3. Agrège les candidatures reçues dans la journée (00:00-23:59)
4. Génère l'email selon le format configuré (résumé ou détaillé)
5. Crée le log email + log digest
6. Prévient les doubles envois

**Formats de rapport :**
- **Résumé** : Nombre de candidatures par offre
- **Détaillé** : Liste complète avec nom, email, poste, référence, score IA, lien direct

### 4. Frontend

#### JobDetail.tsx (mise à jour)
**Anciennes fonctionnalités :**
- Alert JavaScript basique
- Insert direct en base

**Nouvelles fonctionnalités :**
- Utilise `applicationSubmissionService`
- Modal de confirmation moderne et professionnel
- Affichage du numéro de référence
- Liste des prochaines étapes
- Boutons d'action (voir candidatures, autres offres)

**UX candidat :**
1. Candidat clique sur "Postuler"
2. Formulaire de lettre de motivation
3. Envoi de la candidature
4. Modal de confirmation avec :
   - Référence de candidature (format APP-YYYYMMDD-XXXX)
   - Prochaines étapes
   - Confirmation d'email envoyé

#### AdminRecruiterNotifications.tsx (nouveau)
Page d'administration pour configurer les notifications de chaque recruteur :

**Fonctionnalités :**
- Liste tous les recruteurs
- Pour chaque recruteur :
  - Notifications immédiates (email, SMS, WhatsApp)
  - Rapport quotidien (activation, heure, format)
  - Options avancées (scores IA, liens directs, envoi si zéro)
- Sauvegarde automatique à chaque modification

**Navigation :**
- Accessible via AdminLayout > Bouton "Notifications"
- URL : `/admin-recruiter-notifications`

## Workflow complet

### Quand un candidat postule

```
1. Frontend (JobDetail.tsx)
   ↓
2. applicationSubmissionService.submitApplication()
   ↓
3. Vérification anti-doublon
   ↓
4. Création candidature en DB
   ↓ (trigger automatique)
5. Génération application_reference
   ↓
6. Notification interne candidat
   ↓
7. Email confirmation candidat
   ↓
8. Récupération paramètres recruteur
   ↓
9. Notification interne recruteur
   ↓
10. Email immédiat recruteur (si activé)
    ↓
11. Log dans email_logs
    ↓
12. Retour au frontend avec référence
    ↓
13. Affichage modal de confirmation
```

### Rapport quotidien recruteur

```
1. Cron déclenché toutes les heures
   ↓
2. Edge Function recruiter-daily-digest
   ↓
3. Récupération recruteurs configurés (heure = current_hour)
   ↓
4. Pour chaque recruteur :
   ↓
   a. Vérification anti-doublon (déjà envoyé aujourd'hui ?)
   ↓
   b. Agrégation candidatures du jour
   ↓
   c. Génération email (résumé ou détaillé)
   ↓
   d. Création email_logs
   ↓
   e. Création daily_digest_log
   ↓
5. Logs de résultat (processed, failed)
```

## Configuration

### Pour un recruteur

1. **Accès admin** : Se connecter en tant qu'admin
2. **Navigation** : Aller dans AdminLayout > Notifications
3. **Configuration** :
   - Activer/désactiver les notifications immédiates
   - Activer le rapport quotidien
   - Choisir l'heure d'envoi (0-23h)
   - Sélectionner le format (résumé/détaillé)
   - Options : scores IA, liens directs, envoi si zéro

### Cron (Supabase)

Le cron doit être configuré dans Supabase Dashboard :
1. Aller dans "Edge Functions"
2. Sélectionner "recruiter-daily-digest"
3. Configurer le schedule : `0 * * * *` (toutes les heures)

## Sécurité (RLS)

### `recruiter_notification_settings`
- Recruteurs voient et modifient uniquement leurs paramètres
- Admin voit et modifie tout

### `email_logs`
- Utilisateurs voient uniquement leurs emails (recipient_id = auth.uid())
- Admin voit tout
- Système peut créer des logs

### `daily_digest_log`
- Recruteurs voient uniquement leurs rapports
- Admin voit tout
- Système peut créer des logs

## Emails envoyés

### 1. Confirmation candidat

**Sujet :** `Candidature reçue – [Poste] – Réf [APP-YYYYMMDD-XXXX]`

**Contenu :**
- Accusé de réception
- Détails du poste
- Référence de candidature
- Prochaines étapes
- Conseils

**Déclencheur :** Immédiat après candidature

### 2. Alerte recruteur immédiate

**Sujet :** `Nouvelle candidature – [Poste] – [Nom candidat]`

**Contenu :**
- Nom et coordonnées du candidat
- Poste concerné
- Référence de candidature
- Score IA
- Lien direct vers le pipeline

**Déclencheur :** Immédiat après candidature (si activé)

### 3. Rapport quotidien recruteur

**Sujet :** `Rapport quotidien – X candidature(s) reçue(s) – [Date]`

**Contenu (résumé) :**
- Nombre total de candidatures
- Répartition par offre

**Contenu (détaillé) :**
- Liste complète des candidatures
- Pour chaque : nom, email, poste, référence, score IA, lien pipeline

**Déclencheur :** Heure configurée par recruteur

## Tests

### Test manuel - Candidature

1. Créer un recruteur avec une offre
2. Configurer les notifications du recruteur (admin)
3. En tant que candidat, postuler à l'offre
4. Vérifier :
   - Modal de confirmation apparaît
   - Référence candidature affichée (format APP-YYYYMMDD-XXXX)
   - Notification interne candidat créée
   - Notification interne recruteur créée
   - Email logs créés

### Test manuel - Rapport quotidien

1. Configurer un recruteur avec digest activé
2. Créer plusieurs candidatures dans la journée
3. Déclencher manuellement l'Edge Function :
   ```bash
   curl -X POST https://[project-id].supabase.co/functions/v1/recruiter-daily-digest
   ```
4. Vérifier :
   - Email log créé
   - Daily digest log créé
   - Pas de doublon si relancé

### Test anti-doublon

1. Tenter de postuler 2 fois au même poste
2. Vérifier : message d'erreur "Vous avez déjà postulé à cette offre"

## Maintenance

### Logs à surveiller

1. **email_logs** : taux d'échec, latence
2. **daily_digest_log** : échecs d'envoi
3. **Edge Function logs** : erreurs de cron

### Optimisations possibles

1. **Email provider réel** : Intégrer SendGrid/AWS SES
2. **SMS provider** : Twilio pour notifications SMS
3. **WhatsApp Business API** : Pour notifications WhatsApp
4. **Retry logic** : Réessayer les emails en échec
5. **Analytics** : Dashboard de statistiques d'envoi

## Fichiers créés/modifiés

### Base de données
- `supabase/migrations/add_application_notification_system.sql`

### Services
- `src/services/applicationSubmissionService.ts` (nouveau)

### Edge Functions
- `supabase/functions/recruiter-daily-digest/index.ts` (nouveau)

### Frontend
- `src/pages/JobDetail.tsx` (modifié)
- `src/pages/AdminRecruiterNotifications.tsx` (nouveau)
- `src/components/AdminLayout.tsx` (modifié)
- `src/App.tsx` (modifié)

## URLs importantes

- **Page admin notifications** : `/admin-recruiter-notifications`
- **Edge Function** : `https://[project-id].supabase.co/functions/v1/recruiter-daily-digest`
- **Dashboard recruteur** : `/recruiter-dashboard?tab=pipeline&application=[id]`

## Support

Pour toute question ou problème :
1. Vérifier les logs Supabase (Database > Logs)
2. Vérifier les logs Edge Function (Edge Functions > [function] > Logs)
3. Consulter la table `email_logs` pour le statut des emails
4. Consulter la table `daily_digest_log` pour l'historique des rapports

## Évolutions futures

1. **Personnalisation templates** : Interface admin pour modifier les templates d'emails
2. **Multi-langue** : Support français/anglais
3. **Statistiques** : Dashboard de performance des emails
4. **A/B testing** : Tester différents templates
5. **Preferences candidat** : Permettre au candidat de choisir ses canaux de notification
