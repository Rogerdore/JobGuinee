# Système de Notification pour les Achats de Crédits IA

## Problème Résolu

Avant cette mise à jour, lorsqu'un utilisateur achetait des crédits IA via Orange Money :
1. L'utilisateur envoyait la preuve de paiement via WhatsApp
2. L'admin validait ou rejetait le paiement
3. **L'utilisateur n'était JAMAIS notifié du résultat**

Cela causait une mauvaise expérience utilisateur car les acheteurs ne savaient pas si leurs crédits avaient été validés.

## Solution Implémentée

### 1. Nouveaux Types de Notification

Deux nouveaux types de notification ont été ajoutés :

- `credits_validated` : Notification envoyée quand le paiement est validé
- `credits_rejected` : Notification envoyée quand le paiement est rejeté

### 2. Notification Automatique lors de la Validation

Quand l'admin valide un paiement via `complete_credit_purchase()` :

```sql
-- Notification automatique créée dans la base de données
INSERT INTO notifications (
  profile_id,
  type,
  title,
  message,
  metadata,
  is_read
) VALUES (
  user_id,
  'credits_validated',
  'Paiement validé - XXX crédits IA ajoutés',
  'Excellente nouvelle! Votre paiement a été validé...',
  {...},
  false
);
```

**Contenu de la notification :**
- 💳 Référence du paiement
- 💰 Montant payé
- ✨ Nombre de crédits ajoutés
- 📊 Nouveau solde de crédits
- 📝 Notes de l'administrateur (optionnel)

### 3. Notification Automatique lors du Rejet

Quand l'admin rejette un paiement via `cancel_credit_purchase()` :

```sql
-- Notification automatique créée dans la base de données
INSERT INTO notifications (
  profile_id,
  type,
  title,
  message,
  metadata,
  is_read
) VALUES (
  user_id,
  'credits_rejected',
  'Paiement non validé - REF-XXX',
  'Nous ne pouvons pas valider votre paiement...',
  {...},
  false
);
```

**Contenu de la notification :**
- 💳 Référence du paiement
- 💰 Montant
- ❌ Crédits demandés
- 📝 Raison du rejet (optionnel)
- Instructions pour contacter le support

## Workflow Complet

### Côté Utilisateur

1. **Achat de crédits**
   - Sélectionne un pack de crédits
   - Effectue le paiement Orange Money
   - Envoie la preuve via WhatsApp
   - Statut : `waiting_proof`

2. **Attente de validation**
   - Peut consulter ses achats en attente
   - Voit le statut "Preuve envoyée"

3. **Réception de notification**
   - **Si validé** : Reçoit une notification de succès avec le nouveau solde
   - **Si rejeté** : Reçoit une notification avec la raison du rejet

### Côté Admin

1. **Page de validation** : `/admin/credit-purchases`
   - Liste tous les achats par statut
   - Filtre : Tous / En attente / Preuve envoyée / Validés / Annulés

2. **Actions disponibles**
   - ✅ Valider : Ajoute les crédits + Envoie notification de succès
   - ❌ Rejeter : Annule l'achat + Envoie notification de rejet
   - 👁️ Voir détails : Affiche toutes les informations

3. **Avec notes optionnelles**
   - L'admin peut ajouter des notes lors de la validation
   - L'admin peut indiquer la raison lors du rejet

## Fichiers Modifiés

### 1. Service de Notification
**Fichier** : `src/services/notificationService.ts`

- Ajout des types `credits_validated` et `credits_rejected`
- Ajout des templates de notification avec messages formatés
- Nouvelle fonction `sendCreditNotification()` pour l'envoi

### 2. Migration Base de Données
**Migration** : `add_credit_purchase_notifications.sql`

- Modification de `complete_credit_purchase()` pour créer une notification
- Modification de `cancel_credit_purchase()` pour créer une notification
- Utilisation de `SECURITY DEFINER` pour permettre l'insertion

### 3. Interface Admin
**Fichier** : `src/pages/AdminCreditPurchases.tsx`

Aucune modification nécessaire. L'interface existante fonctionne déjà avec le nouveau système.

## Canaux de Notification

Les notifications sont envoyées sur :
- **Notification interne** : Visible dans le centre de notifications
- **Email** : Envoyé à l'adresse de l'utilisateur (si configuré)

## Sécurité

- Seuls les admins peuvent valider/rejeter les paiements (vérification `user_type = 'admin'`)
- Les notifications sont créées avec `SECURITY DEFINER` pour autoriser l'insertion
- Les utilisateurs ne peuvent voir que leurs propres achats et notifications
- RLS (Row Level Security) activé sur toutes les tables

## Avantages

1. **Transparence** : Les utilisateurs savent toujours le statut de leur achat
2. **Réactivité** : Notification instantanée lors de la validation
3. **Clarté** : Messages détaillés avec toutes les informations
4. **Support** : Instructions claires en cas de rejet
5. **Traçabilité** : Toutes les notifications sont enregistrées

## Tests

Pour tester le système :

1. Connectez-vous en tant qu'utilisateur
2. Achetez des crédits depuis `/credit-store`
3. Connectez-vous en tant qu'admin
4. Allez sur `/admin/credit-purchases`
5. Validez ou rejetez l'achat
6. Reconnectez-vous en tant qu'utilisateur
7. Vérifiez le centre de notifications (icône cloche)

## Notes Techniques

- Les notifications sont créées directement en base de données pour la fiabilité
- Pas de dépendance aux services externes (tout est dans Supabase)
- Les templates utilisent un système de variables : `{{variable_name}}`
- Support des blocs conditionnels : `{{#if_condition}}...{{/if_condition}}`
