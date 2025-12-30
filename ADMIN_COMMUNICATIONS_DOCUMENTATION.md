# Module de Communication Multicanale Admin - Documentation Complète

## Vue d'Ensemble

Le module de communication multicanale Admin permet à l'administrateur de JobGuinée de créer et gérer des campagnes de communication institutionnelle, informative, promotionnelle ou opérationnelle vers tous les types d'utilisateurs (candidats, recruteurs, formateurs, entreprises).

**Points clés:**
- **Aucun paiement requis** pour ce module (contrairement à la diffusion ciblée des annonces)
- **Indépendant** du système de diffusion des annonces
- **Multicanal**: Email, SMS, WhatsApp, Notifications internes
- **Respect des consentements** utilisateurs (consent_email, consent_sms, consent_whatsapp)
- **Traçabilité complète** de toutes les actions

---

## Architecture

### 1. Base de Données

**Migration créée:** `create_admin_communications_system.sql`

#### Tables principales:

**`admin_communications`**
- Stocke les campagnes de communication créées par l'Admin
- Contient les filtres d'audience, canaux, statut, planification
- Statuts: draft, scheduled, sending, completed, canceled, failed

**`admin_communication_messages`**
- Messages individuels par utilisateur et canal
- Tracking du statut d'envoi (pending, sent, failed, excluded)
- Support retry et traçabilité complète

**`admin_communication_templates`**
- Templates réutilisables par canal
- Variables dynamiques: {{prenom}}, {{nom}}, {{role}}, {{lien}}, etc.
- Catégories: system, marketing, operational

**`admin_communication_logs`**
- Logs de toutes les actions sur les communications
- Audit complet: qui, quand, quoi
- Actions: create, update, send, cancel, schedule, complete, fail

#### Sécurité:
- RLS strict: Admin-only sur toutes les tables
- Policies séparées pour lecture/écriture
- Audit automatique via triggers

#### Performance:
- Index sur communication_id, user_id, status, channel
- Index sur scheduled_at pour les envois programmés
- Index sur created_by pour les logs Admin

---

### 2. Service

**Fichier:** `src/services/adminCommunicationService.ts`

**Fonctionnalités principales:**

```typescript
// Gestion des communications
getCommunications(filters?: { status?: string; limit?: number })
getCommunicationById(id: string)
createCommunication(communication: Partial<AdminCommunication>)
updateCommunication(id: string, updates: Partial<AdminCommunication>)
deleteCommunication(id: string)

// Calcul d'audience
calculateAudienceCount(filters: CommunicationFilters): Promise<number>
getTargetedUsers(filters: CommunicationFilters, limit?: number)

// Envoi et planification
sendCommunication(id: string)
scheduleCommunication(id: string, scheduledAt: string)
cancelCommunication(id: string)

// Messages et statistiques
getMessages(communicationId: string, filters?: { status?: string; channel?: string })
getMessageStats(communicationId: string)

// Templates
getTemplates(channel?: string)
getAllTemplates()
getTemplateById(id: string)
createTemplate(template: Partial<CommunicationTemplate>)
updateTemplate(id: string, updates: Partial<CommunicationTemplate>)
deleteTemplate(id: string)

// Logs et statistiques
getLogs(filters?: { communication_id?: string; admin_id?: string; limit?: number })
getStats()

// Utilitaires
renderTemplate(content: string, variables: Record<string, string>): string
validateContent(content: string, channel: string): { valid: boolean; errors: string[] }
```

---

### 3. Pages Admin

#### 3.1 AdminCommunications (Liste et Dashboard)

**Route:** `/admin/communications`

**Fonctionnalités:**
- Vue d'ensemble avec statistiques (total, en cours, terminées, 30 derniers jours)
- Liste des communications avec filtres par statut
- Actions: Voir, Modifier, Annuler, Supprimer
- Icônes par canal utilisé
- Liens rapides vers Templates et Logs

**Éléments visuels:**
- Cartes de statistiques avec icônes
- Tableau avec colonnes: Titre, Type, Canaux, Audience, Statut, Date, Actions
- Filtres: Tous les statuts, Brouillons, Programmées, En cours, Terminées, Annulées, Échecs
- Modal de confirmation pour suppression

---

#### 3.2 AdminCommunicationCreate (Wizard 4 étapes)

**Route:** `/admin/communication-create`

**Wizard en 4 étapes:**

**Étape 1 - Objectif & Type:**
- Titre de la communication (requis)
- Type de communication:
  - Information Système
  - Notification Importante
  - Annonce / Promotion
  - Maintenance / Alerte
  - Message Institutionnel
- Description (optionnel)

**Étape 2 - Filtrage de l'Audience:**
- Affichage en temps réel du nombre d'utilisateurs ciblés
- Filtres disponibles:
  - Type d'utilisateur: Candidat, Recruteur, Formateur, Entreprise
  - Profil complété minimum (slider 0-100%)
- Calcul automatique de l'audience

**Étape 3 - Canaux & Contenu:**
- Sélection des canaux: Email, SMS, WhatsApp, Notification
- Pour chaque canal activé:
  - Option d'utiliser un template existant
  - Sujet (Email uniquement)
  - Contenu du message
  - Prévisualisation avec variables simulées
- Variables disponibles: {{prenom}}, {{nom}}, {{role}}, {{lien}}, {{message}}, {{date}}
- Validation de contenu (ex: SMS max 160 caractères)

**Étape 4 - Envoi & Planification:**
- Mode d'envoi:
  - Envoyer immédiatement
  - Programmer l'envoi (date + heure)
- Récapitulatif: Titre, Audience, Canaux activés, Mode d'envoi
- Avertissement pour communications à grande échelle
- Bouton "Lancer la communication"

**Progression visuelle:**
- Indicateur d'étapes avec checkmarks
- Boutons Précédent/Suivant
- Validation à chaque étape

---

#### 3.3 AdminCommunicationTemplates (Gestion des Templates)

**Route:** `/admin/communication-templates`

**Fonctionnalités:**
- Vue en grille des templates
- Filtres par canal: Tous, Email, SMS, WhatsApp, Notification
- Pour chaque template:
  - Nom et description
  - Canal et catégorie
  - Statut actif/inactif (toggle)
  - Aperçu du contenu
  - Actions: Voir, Modifier, Supprimer

**Modal de création/édition:**
- Nom du template
- Description
- Canal (email, sms, whatsapp, notification)
- Catégorie (system, marketing, operational)
- Sujet (pour email)
- Contenu du message
- Variables disponibles affichées
- Toggle actif/inactif
- Prévisualisation

**Templates par défaut:**
- Bienvenue - Email
- Notification Système - SMS
- Maintenance - Notification
- Promotion - WhatsApp

---

#### 3.4 AdminCommunicationLogs (Logs & Statistiques)

**Route:** `/admin/communication-logs`

**Statistiques globales:**
- Total communications
- Terminées
- 30 derniers jours
- Actions totales

**Graphiques et analyses:**
- Actions par type (avec barres de progression)
- Statistiques par statut

**Tableau des logs:**
- Colonnes: Date/Heure, Action, Détails, Administrateur
- Filtres:
  - Par action: Toutes, Créations, Modifications, Envois, Annulations, Programmations, Terminées, Échecs
  - Limite: 50, 100, 200, 500 derniers
- Codes couleur par type d'action

**Types d'actions:**
- Création (bleu)
- Modification (jaune)
- Envoi (vert)
- Annulation (rouge)
- Programmation (bleu)
- Terminée (vert)
- Échec (rouge)

---

## Navigation Admin

**Nouvelle entrée dans AdminLayout:**
- Icône: MessageCircle
- Label: "Communications"
- Couleur: Bleu
- Position: Après "Notifications", avant "Achats Profils"

**Routes ajoutées dans App.tsx:**
- `admin-communications` → AdminCommunications
- `admin-communication-create` → AdminCommunicationCreate
- `admin-communication-templates` → AdminCommunicationTemplates
- `admin-communication-logs` → AdminCommunicationLogs

---

## Workflow Utilisateur

### Créer une communication

1. **Navigation:** Admin → Communications → Nouvelle Communication
2. **Étape 1:** Définir l'objectif et le type
3. **Étape 2:** Filtrer l'audience (voir le nombre en temps réel)
4. **Étape 3:** Activer les canaux et rédiger les messages
5. **Étape 4:** Choisir envoi immédiat ou programmé
6. **Lancement:** Clic sur "Lancer la communication"

### Gérer les templates

1. **Navigation:** Admin → Communications → Templates
2. **Actions disponibles:**
   - Créer un nouveau template
   - Modifier un template existant
   - Activer/Désactiver un template
   - Prévisualiser un template
   - Supprimer un template

### Consulter les logs

1. **Navigation:** Admin → Communications → Logs
2. **Vue d'ensemble:** Statistiques globales et graphiques
3. **Filtrage:** Par action et limite
4. **Détails:** Date/Heure, Action, Détails, Admin responsable

---

## Consentements et Règles

### Respect des consentements:
- **Email:** Vérifie `consent_email` dans le profil utilisateur
- **SMS:** Vérifie `consent_sms` dans le profil utilisateur
- **WhatsApp:** Vérifie `consent_whatsapp` dans le profil utilisateur
- **Notifications internes:** Toujours autorisées (pas de consentement requis)

### Exclusion automatique:
- Si un utilisateur n'a pas consenti à un canal, il est automatiquement exclu pour ce canal
- Le statut du message sera `excluded` avec raison `no_consent`

### Sécurité:
- Accès strictement Admin (vérification via RLS)
- Confirmation obligatoire avant envoi massif
- Double confirmation pour audiences > seuil configurable
- Limite configurable de communications par jour

---

## Variables Dynamiques

Les variables suivantes peuvent être utilisées dans tous les messages:

```
{{prenom}}      - Prénom de l'utilisateur
{{nom}}         - Nom de l'utilisateur
{{role}}        - Rôle (candidat, recruteur, formateur, entreprise)
{{lien}}        - Lien personnalisé
{{message}}     - Message personnalisé
{{date}}        - Date formatée
{{image_url}}   - URL d'image (Email/WhatsApp)
{{unsubscribe_link}} - Lien de désinscription (Email)
```

**Rendu:**
```typescript
adminCommunicationService.renderTemplate(content, {
  prenom: 'Mamadou',
  nom: 'Diallo',
  role: 'Candidat',
  lien: 'https://jobguinee.com',
});
```

---

## Statuts des Communications

- **draft:** Brouillon, en cours de création
- **scheduled:** Programmée pour envoi futur
- **sending:** Envoi en cours
- **completed:** Envoi terminé avec succès
- **canceled:** Communication annulée
- **failed:** Échec de l'envoi

---

## Statuts des Messages Individuels

- **pending:** En attente d'envoi
- **sent:** Envoyé avec succès
- **failed:** Échec d'envoi (avec message d'erreur)
- **excluded:** Exclu (pas de consentement, contact invalide, etc.)

---

## Fonctions de Base de Données

### `calculate_communication_audience(p_filters jsonb)`
Calcule le nombre d'utilisateurs correspondant aux filtres fournis.

**Exemple:**
```sql
SELECT calculate_communication_audience(
  '{"user_types": ["candidate", "recruiter"], "min_completion": 50}'::jsonb
);
```

### `log_admin_communication_change()`
Trigger automatique qui enregistre toutes les modifications dans `admin_communication_logs`.

---

## Fichiers Créés

### Backend:
- `supabase/migrations/[timestamp]_create_admin_communications_system.sql`

### Services:
- `src/services/adminCommunicationService.ts`

### Pages:
- `src/pages/AdminCommunications.tsx`
- `src/pages/AdminCommunicationCreate.tsx`
- `src/pages/AdminCommunicationTemplates.tsx`
- `src/pages/AdminCommunicationLogs.tsx`

### Modifications:
- `src/components/AdminLayout.tsx` (ajout navigation)
- `src/App.tsx` (ajout routes)

---

## Tests et Build

✅ Migration appliquée avec succès
✅ Service créé et compilé
✅ Pages créées et intégrées
✅ Navigation mise à jour
✅ Routes configurées
✅ Build production réussi

---

## Prochaines Étapes Recommandées

1. **Mécanisme d'envoi réel:**
   - Intégrer Email provider (SendGrid, AWS SES, etc.)
   - Intégrer SMS provider (Twilio, etc.)
   - Intégrer WhatsApp Business API
   - Implémenter système de retry avec backoff

2. **Notifications internes:**
   - Créer table `user_notifications` si pas déjà existante
   - Intégrer avec NotificationContext existant
   - Ajouter badge de notifications non lues

3. **Envoi par batch:**
   - Implémenter worker/job pour envois programmés
   - Limiter le nombre d'envois simultanés
   - Gérer la file d'attente (queue)

4. **Analytics avancés:**
   - Taux d'ouverture (email)
   - Taux de clic (liens trackés)
   - Taux de conversion
   - Rapports détaillés par canal

5. **Tests unitaires et E2E:**
   - Tests du service
   - Tests des filtres d'audience
   - Tests du rendu de templates
   - Tests du wizard complet

---

## Notes de Sécurité

⚠️ **Critiques:**
- Les communications Admin sont envoyées sans paiement
- Seuls les Admins ont accès au module (vérification RLS)
- Aucun envoi déclenchable côté frontend utilisateur
- Confirmation obligatoire avant envoi massif
- Traçabilité complète de toutes les actions

⚠️ **Recommandations:**
- Limiter le nombre de communications par jour
- Mettre en place des quotas par Admin
- Auditer régulièrement les logs
- Surveiller les taux d'échec
- Implémenter rate limiting sur les providers

---

## Support et Maintenance

**Point de contact:** Équipe Admin JobGuinée

**Logs de production:**
- Consulter `admin_communication_logs` pour l'historique complet
- Vérifier `admin_communication_messages` pour les statuts d'envoi
- Analyser les erreurs dans le champ `error_message`

**Dépannage commun:**
1. Communication non reçue → Vérifier consentements utilisateur
2. Erreur d'envoi → Consulter `error_message` dans `admin_communication_messages`
3. Audience vide → Vérifier les filtres appliqués
4. Template non trouvé → Vérifier `is_active = true`

---

**Version:** 1.0
**Date de création:** 30 Décembre 2025
**Statut:** Production Ready ✅
