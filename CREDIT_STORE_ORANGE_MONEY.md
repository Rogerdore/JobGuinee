# BOUTIQUE DE CRÉDITS IA - ORANGE MONEY

**Projet:** JobGuinée
**Date:** 10 Décembre 2025
**Version:** 2.0 - Orange Money Manuel
**Statut:** Production Ready

---

## VUE D'ENSEMBLE

La **Boutique de Crédits IA** a été entièrement refaite pour utiliser **exclusivement Orange Money avec validation manuelle**.

### Changements Majeurs

**AVANT (v1.0):**
- 4 méthodes de paiement (Orange Money, MTN Money, Visa, Mastercard)
- Intégration avec APIs de paiement tierces
- Paiements automatisés
- Dépendances: paymentProviders, payment.config, isDemoMode

**APRÈS (v2.0):**
- **1 seule méthode:** Orange Money (transfert manuel)
- **0 API externe**
- Validation manuelle par administrateur
- WhatsApp pour envoi preuve de paiement
- Workflow simplifié et sécurisé

---

## ARCHITECTURE

### Tables Database

#### 1. credit_packages

**Description:** Packs de crédits disponibles à l'achat

**Colonnes:**
- `id` (uuid)
- `package_name` (text) - Nom du pack
- `description` (text) - Description
- `credits_amount` (integer) - Crédits de base
- `bonus_credits` (integer) - Crédits bonus
- `price_amount` (numeric) - Prix en GNF
- `currency` (text) - Devise (GNF)
- `is_popular` (boolean) - Pack populaire
- `is_active` (boolean) - Pack actif
- `display_order` (integer) - Ordre d'affichage
- `created_at`, `updated_at`

#### 2. credit_purchases

**Description:** Historique complet des achats de crédits

**Colonnes:**
- `id` (uuid)
- `user_id` (uuid) - Utilisateur
- `package_id` (uuid) - Pack acheté
- `credits_amount` (integer) - Crédits achetés
- `bonus_credits` (integer) - Bonus reçu
- `total_credits` (integer) - Total
- `price_amount` (numeric) - Montant payé
- `currency` (text) - Devise
- `payment_method` (text) - "orange_money"
- `payment_reference` (text) - Référence unique (REF-XXXXXXXX)
- `payment_status` (text) - Status paiement
  - `pending` : En attente de paiement
  - `waiting_proof` : Paiement effectué, preuve envoyée
  - `completed` : Validé, crédits ajoutés
  - `failed` : Échec
  - `cancelled` : Annulé
- `purchase_status` (text) - Status achat
- `payment_proof_url` (text) - URL preuve (optionnel)
- `admin_notes` (text) - Notes admin
- `completed_at` (timestamptz) - Date validation
- `failed_reason` (text) - Raison annulation
- `created_at`, `updated_at`

**Indexes:**
- idx_credit_purchases_user (user_id)
- idx_credit_purchases_status (payment_status)
- idx_credit_purchases_created (created_at DESC)
- idx_credit_purchases_reference (payment_reference)

**RLS:**
- Utilisateur : voir ses propres achats
- Utilisateur : créer ses achats
- Utilisateur : modifier ses achats pending/waiting_proof
- Admin : voir tous les achats
- Admin : modifier tous les achats

#### 3. credit_store_settings

**Description:** Configuration de la boutique

**Colonnes:**
- `id` (uuid)
- `admin_phone_number` (text) - Numéro Orange Money
- `admin_whatsapp_number` (text) - Numéro WhatsApp
- `payment_instructions` (text) - Instructions affichées
- `is_enabled` (boolean) - Boutique active/inactive
- `created_at`, `updated_at`

**Singleton:** Une seule ligne

**Valeurs par défaut:**
```sql
admin_phone_number: '622000000'
admin_whatsapp_number: '622000000'
payment_instructions: 'Effectuez le transfert Orange Money vers le numéro indiqué ci-dessous, puis envoyez la capture d'écran de la confirmation via WhatsApp pour validation rapide.'
is_enabled: true
```

**RLS:**
- Public : lecture seule
- Admin : lecture + écriture

---

## FONCTIONS RPC

### 1. create_credit_purchase(p_package_id, p_payment_method)

**Description:** Crée un nouvel achat de crédits

**Paramètres:**
- `p_package_id` (uuid) - ID du pack
- `p_payment_method` (text) - "orange_money"

**Retour:**
```json
{
  "success": true,
  "message": "Achat créé avec succès",
  "purchase_id": "uuid",
  "payment_reference": "REF-XXXXXXXX",
  "amount": 50000,
  "currency": "GNF",
  "credits": 1000
}
```

**Actions:**
1. Vérifie auth utilisateur
2. Récupère package
3. Calcule total crédits (base + bonus)
4. Génère référence unique
5. Insère credit_purchases (status: pending)
6. Retourne données

### 2. complete_credit_purchase(p_purchase_id, p_admin_notes)

**Description:** Valide un achat et crédite l'utilisateur

**Réservé:** Admins uniquement

**Paramètres:**
- `p_purchase_id` (uuid) - ID achat
- `p_admin_notes` (text) - Notes admin (optionnel)

**Retour:**
```json
{
  "success": true,
  "message": "Achat validé et crédits ajoutés",
  "credits_added": 1000,
  "new_balance": 1500
}
```

**Actions:**
1. Vérifie auth admin
2. Récupère achat
3. Vérifie status (pas déjà complété)
4. **Crédite l'utilisateur** (profiles.credits_balance += total_credits)
5. Met à jour purchase (status: completed, completed_at, admin_notes)
6. Insère transaction dans credit_transactions
7. Retourne résultat

### 3. cancel_credit_purchase(p_purchase_id, p_reason)

**Description:** Annule un achat

**Paramètres:**
- `p_purchase_id` (uuid)
- `p_reason` (text) - Raison annulation

**Retour:**
```json
{
  "success": true,
  "message": "Achat annulé avec succès"
}
```

**Actions:**
1. Vérifie auth (admin ou propriétaire)
2. Vérifie status (pas déjà complété)
3. Met à jour purchase (status: cancelled, failed_reason)
4. Retourne résultat

---

## SERVICE: creditStoreService.ts

### Interfaces

```typescript
export interface CreditPackage {
  id: string;
  package_name: string;
  description: string | null;
  credits_amount: number;
  price_amount: number;
  currency: string;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  package_id: string;
  credits_amount: number;
  bonus_credits: number;
  total_credits: number;
  price_amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled';
  purchase_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_proof_url: string | null;
  admin_notes: string | null;
  completed_at: string | null;
  failed_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditStoreSettings {
  id: string;
  admin_phone_number: string;
  admin_whatsapp_number: string;
  payment_instructions: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}
```

### Méthodes Principales

**Configuration:**
- `getSettings()` - Récupère settings boutique
- `updateSettings(settings)` - Met à jour settings (admin)

**Packages:**
- `getAllPackages()` - Liste packs actifs
- `getPackageById(packageId)` - Récupère un pack

**Achats:**
- `createPurchase(packageId)` - Crée un achat
- `markAsWaitingProof(purchaseId)` - Marque comme "preuve envoyée"
- `completePurchase(purchaseId, notes)` - Valide achat (admin)
- `cancelPurchase(purchaseId, reason)` - Annule achat
- `getUserPurchases(limit)` - Historique utilisateur
- `getAllPurchases(status, limit)` - Tous achats (admin)
- `getPurchaseById(purchaseId)` - Détails achat

**Utilitaires:**
- `formatPrice(amount, currency)` - Formatte prix (GNF)
- `formatCredits(amount)` - Formatte crédits
- `getWhatsAppLink(phone, packName, email, ref)` - Génère lien WhatsApp

---

## FRONTEND

### 1. CreditStore.tsx

**Route:** `/credit-store`

**Fonctionnalités:**

**Page principale:**
- Affiche balance crédits utilisateur
- Alerte "Paiement Orange Money uniquement"
- Grille de packs (cards modernes)
  - Badge "Populaire" si applicable
  - Crédits base + bonus
  - Pourcentage bonus
  - Total crédits
  - Prix en GNF
  - Bouton "Acheter maintenant"
- Section "À quoi servent les crédits?"

**Modal de paiement (3 étapes):**

**Étape 1: Info**
- Résumé du pack
- Crédits + bonus + total + prix
- Alerte mode de paiement
- Bouton "Continuer" → crée purchase

**Étape 2: Payment**
- Affiche référence de paiement (REF-XXXXXXXX)
- Affiche numéro Orange Money (copie)
- Affiche montant exact
- Instructions de paiement
- Bouton "Envoyer preuve WhatsApp" → ouvre WhatsApp
- Bouton "J'ai effectué le paiement" → marque waiting_proof

**Étape 3: Confirm**
- Message succès
- Référence à conserver
- Information validation en cours
- Bouton "Fermer"

**Sécurité:**
- Vérification connexion utilisateur
- Vérification boutique active
- Pas d'achat si désactivée

### 2. AdminCreditPurchases.tsx

**Route:** `/admin/credit-purchases` (à ajouter au routing)

**Fonctionnalités:**

**Liste achats:**
- Filtres par status (pending, waiting_proof, completed, cancelled)
- Table avec colonnes:
  - Date
  - Référence
  - Montant
  - Crédits
  - Status (badge coloré)
  - Actions
- Bouton refresh
- Actions par ligne:
  - Voir détails (modal)
  - Valider (si pending/waiting_proof)
  - Annuler (si pending/waiting_proof)

**Modal détails:**
- Toutes infos achat
- Date création
- Status
- Montant et crédits
- User ID
- Notes admin (si présentes)
- Raison annulation (si applicable)
- Date validation (si complété)
- Boutons actions si applicable

**Affichage config:**
- Numéros OM et WhatsApp actuels

### 3. AdminCreditStoreSettings.tsx

**Route:** `/admin/credit-store-settings` (à ajouter au routing)

**Fonctionnalités:**

**Formulaire config:**
- Toggle boutique active/inactive
- Numéro Orange Money (input)
- Numéro WhatsApp (input)
- Instructions paiement (textarea)
- Bouton sauvegarder

**Aperçu:**
- État boutique (actif/désactivé)
- Numéros configurés
- Instructions actuelles

**Validation:**
- Alertes si champs vides
- Confirmation sauvegarde

---

## WORKFLOW UTILISATEUR

### Achat de Crédits

**1. Utilisateur consulte boutique**
- Navigue vers `/credit-store`
- Voit solde actuel
- Consulte packs disponibles

**2. Sélectionne un pack**
- Clique "Acheter maintenant"
- Modal étape 1 s'ouvre
- Vérifie détails

**3. Crée l'achat**
- Clique "Continuer"
- Backend crée credit_purchase (pending)
- Génère référence REF-XXXXXXXX
- Modal passe à étape 2

**4. Effectue paiement Orange Money**
- Note le numéro OM affiché
- Copie numéro (bouton copier)
- Sort de l'app
- Effectue transfert Orange Money vers le numéro
- Prend capture d'écran confirmation

**5. Envoie preuve**
- Clique "Envoyer preuve via WhatsApp"
- S'ouvre WhatsApp avec message pré-rempli:
  ```
  Preuve Paiement JobGuinée

  Pack: [Nom Pack]
  Utilisateur: [Email]
  Référence: REF-XXXXXXXX

  Veuillez trouver ci-joint la capture d'écran de la confirmation Orange Money.
  ```
- Attache capture
- Envoie message

**6. Marque comme payé**
- Revient sur l'app
- Clique "J'ai effectué le paiement"
- Backend met purchase.payment_status = "waiting_proof"
- Modal passe à étape 3

**7. Confirmation**
- Message succès affiché
- Référence rappelée
- Information validation en cours
- Ferme modal

**8. Attend validation admin**
- Purchase reste en "waiting_proof"
- Admin reçoit message WhatsApp
- Admin valide dans interface

**9. Réception crédits**
- Admin valide → crédits ajoutés automatiquement
- Utilisateur voit nouveau solde
- Peut utiliser services IA

---

## WORKFLOW ADMINISTRATEUR

### Validation Paiements

**1. Réception preuve WhatsApp**
- Admin reçoit message WhatsApp
- Voit capture paiement Orange Money
- Voit référence REF-XXXXXXXX

**2. Accède interface admin**
- Navigue vers `/admin/credit-purchases`
- Filtre "Preuve envoyée" (waiting_proof)
- Voit liste achats en attente

**3. Vérifie paiement**
- Trouve achat par référence
- Clique "Voir détails"
- Compare:
  - Montant transféré vs montant dû
  - Numéro expéditeur
  - Date/heure
  - Référence

**4. Valide ou Annule**

**Si paiement correct:**
- Clique "Valider le paiement"
- Backend:
  - Crédite utilisateur (profiles.credits_balance += total_credits)
  - Met purchase.payment_status = "completed"
  - Enregistre transaction
- Message succès
- Achat disparaît du filtre "waiting_proof"

**Si paiement incorrect:**
- Clique "Annuler"
- Saisit raison (montant incorrect, faux paiement, etc.)
- Backend met purchase.payment_status = "cancelled"
- Achat marqué annulé

**5. Suivi**
- Consulte historique (filtre "Validés" ou "Annulés")
- Exporte données si besoin (future feature)

### Configuration Boutique

**1. Accède settings**
- Navigue vers `/admin/credit-store-settings`

**2. Modifie config**
- Change numéros OM/WhatsApp si nécessaire
- Ajuste instructions
- Active/désactive boutique

**3. Sauvegarde**
- Clique "Sauvegarder"
- Backend met à jour credit_store_settings
- Changements appliqués immédiatement

---

## SÉCURITÉ

### Prévention Fraude

**1. Références uniques**
- Chaque achat a REF-XXXXXXXX unique
- Impossible de dupliquer
- Tracé dans DB

**2. Validation manuelle**
- Admin vérifie capture
- Compare montant exact
- Vérifie provenance

**3. Status stricts**
- Un achat ne peut être validé qu'une fois
- Statuts irréversibles (completed)
- Logs horodatés

**4. RLS strict**
- Utilisateur voit seulement ses achats
- Seuls admins peuvent valider
- Modification limitée aux pending/waiting_proof

### Protection Données

**1. Pas de données bancaires**
- Aucune carte enregistrée
- Aucun numéro OM stocké (utilisateur)
- Seulement numéro admin

**2. Traçabilité**
- Tous achats loggés
- admin_notes pour justification
- Timestamps création/validation

**3. Annulation sécurisée**
- Raison obligatoire
- Admin ou propriétaire uniquement
- Impossible si déjà complété

---

## AVANTAGES DU SYSTÈME

### Pour JobGuinée

**1. Simplicité**
- Pas d'API tierce à gérer
- Pas de frais d'intégration
- Pas de webhooks à maintenir

**2. Fiabilité**
- Pas de downtime API externe
- Validation humaine = 0% faux positif
- Contrôle total

**3. Coût**
- 0 frais API
- 0 commission plateforme (sauf OM)
- Économie substantielle

**4. Légal**
- Conforme réglementation guinéenne
- Pas de PCI-DSS nécessaire
- Simple comptabilité

### Pour Utilisateurs

**1. Familiarité**
- Orange Money très populaire en Guinée
- Processus connu
- Confiance établie

**2. Accessibilité**
- Pas besoin de carte bancaire
- Pas besoin de compte en ligne
- Juste un numéro OM

**3. Support**
- Communication WhatsApp directe
- Réponse rapide admin
- Aide personnalisée

**4. Sécurité**
- Paiement via opérateur télécom
- Preuve irréfutable
- Traçabilité complète

---

## CONFIGURATION INITIALE

### 1. Settings par défaut

Les settings sont créés automatiquement avec:
```sql
admin_phone_number: '622000000'
admin_whatsapp_number: '622000000'
payment_instructions: 'Effectuez le transfert Orange Money vers le numéro indiqué ci-dessous, puis envoyez la capture d'écran de la confirmation via WhatsApp pour validation rapide.'
is_enabled: true
```

**Action requise:** Admin doit modifier les numéros par défaut

### 2. Créer des packs de crédits

Exemple de packs recommandés:

```sql
-- Pack Starter
INSERT INTO credit_packages (package_name, description, credits_amount, bonus_credits, price_amount, currency, is_popular, is_active, display_order)
VALUES (
  'Pack Starter',
  'Idéal pour tester nos services IA',
  100,
  0,
  50000,
  'GNF',
  false,
  true,
  1
);

-- Pack Standard (POPULAIRE)
INSERT INTO credit_packages (package_name, description, credits_amount, bonus_credits, price_amount, currency, is_popular, is_active, display_order)
VALUES (
  'Pack Standard',
  'Le plus populaire - Parfait pour une recherche active',
  500,
  50,
  200000,
  'GNF',
  true,
  true,
  2
);

-- Pack Premium
INSERT INTO credit_packages (package_name, description, credits_amount, bonus_credits, price_amount, currency, is_popular, is_active, display_order)
VALUES (
  'Pack Premium',
  'Pour les utilisateurs intensifs - Meilleur rapport qualité/prix',
  1000,
  150,
  350000,
  'GNF',
  false,
  true,
  3
);

-- Pack Pro
INSERT INTO credit_packages (package_name, description, credits_amount, bonus_credits, price_amount, currency, is_popular, is_active, display_order)
VALUES (
  'Pack Pro',
  'Solution complète pour professionnels',
  2000,
  400,
  600000,
  'GNF',
  false,
  true,
  4
);
```

### 3. Ajouter routes au routing

Dans `App.tsx`, ajouter:

```typescript
// Admin routes
{currentPage === 'admin-credit-purchases' && isAdmin && (
  <AdminCreditPurchases />
)}

{currentPage === 'admin-credit-store-settings' && isAdmin && (
  <AdminCreditStoreSettings />
)}
```

### 4. Ajouter liens menu admin

Dans le menu admin (AdminLayout ou autre):

```typescript
<button onClick={() => onNavigate('admin-credit-purchases')}>
  <ShoppingCart className="w-5 h-5" />
  Validation Paiements
</button>

<button onClick={() => onNavigate('admin-credit-store-settings')}>
  <Settings className="w-5 h-5" />
  Config Boutique
</button>
```

---

## FAQ ADMIN

### Q: Comment changer les numéros?

**R:** Accédez à `/admin-credit-store-settings`, modifiez les champs, cliquez "Sauvegarder".

### Q: Comment valider un paiement?

**R:**
1. Recevez preuve WhatsApp
2. Allez sur `/admin-credit-purchases`
3. Filtrez "Preuve envoyée"
4. Trouvez achat par référence
5. Vérifiez capture
6. Cliquez "Valider"

### Q: Que faire si montant incorrect?

**R:** Cliquez "Annuler", indiquez raison "Montant incorrect", contactez utilisateur via WhatsApp.

### Q: Peut-on annuler un achat validé?

**R:** Non, un achat validé est définitif. Les crédits sont déjà ajoutés.

### Q: Comment désactiver la boutique?

**R:** Dans settings, décochez "Boutique active", sauvegardez. Les utilisateurs verront "Boutique fermée".

---

## FAQ UTILISATEUR

### Q: Quel numéro utiliser pour payer?

**R:** Le numéro affiché dans la modal de paiement (étape 2). Copiez-le avec le bouton.

### Q: Dois-je envoyer la preuve?

**R:** Oui, obligatoire pour validation. Envoyez capture via WhatsApp avec le bouton prévu.

### Q: Combien de temps pour validation?

**R:** Généralement sous 24h. Validation manuelle par admin.

### Q: J'ai payé mais pas cliqué "J'ai payé", que faire?

**R:** Pas de souci, envoyez quand même preuve WhatsApp avec référence. Admin validera.

### Q: Puis-je annuler un achat?

**R:** Oui, avant validation. Contactez admin via WhatsApp avec référence.

### Q: Les crédits expirent?

**R:** Non, les crédits IA n'expirent pas.

---

## MONITORING & MÉTRIQUES

### KPIs à Suivre

**1. Taux de conversion**
```
(Achats complétés / Achats créés) * 100
```
Objectif: > 80%

**2. Temps de validation moyen**
```
AVG(completed_at - created_at) pour achats complétés
```
Objectif: < 24h

**3. Taux d'annulation**
```
(Achats annulés / Total achats) * 100
```
Objectif: < 10%

**4. Revenus par jour/semaine/mois**
```
SUM(price_amount) WHERE payment_status = 'completed'
GROUP BY date
```

**5. Pack le plus populaire**
```
COUNT(*) GROUP BY package_id
```

### Requêtes Utiles

**Achats en attente de validation:**
```sql
SELECT COUNT(*), SUM(price_amount)
FROM credit_purchases
WHERE payment_status = 'waiting_proof';
```

**Revenus du jour:**
```sql
SELECT SUM(price_amount) as revenue_today
FROM credit_purchases
WHERE payment_status = 'completed'
  AND DATE(completed_at) = CURRENT_DATE;
```

**Utilisateurs actifs (ayant acheté):**
```sql
SELECT COUNT(DISTINCT user_id)
FROM credit_purchases
WHERE payment_status = 'completed';
```

---

## AMÉLIORATIONS FUTURES

### Phase 2

**1. Upload preuve dans app**
- Ajouter champ upload image
- Stocker dans Supabase Storage
- Éviter WhatsApp si préféré

**2. Notifications**
- Notif push quand crédits ajoutés
- Email confirmation achat
- SMS confirmation (optionnel)

**3. Historique utilisateur**
- Page "Mes achats" dans dashboard
- Voir status en temps réel
- Télécharger reçus

**4. Analytics admin**
- Dashboard statistiques
- Graphiques revenus
- Rapports exportables

### Phase 3

**1. Automatisation partielle**
- API Orange Money (si disponible)
- Validation semi-automatique
- Fallback manuel toujours possible

**2. Multi-opérateurs**
- Ajouter MTN Money
- Moov Money
- Choix utilisateur

**3. Promotions**
- Codes promo
- Réductions temporaires
- Packs spéciaux

---

## SUPPORT

### En Cas de Problème

**Problème: Paiements non validés**
- Vérifier WhatsApp messages reçus
- Vérifier filtres admin interface
- Vérifier permissions admin

**Problème: Crédits non ajoutés**
- Vérifier logs credit_transactions
- Vérifier profiles.credits_balance
- Vérifier complete_credit_purchase logs

**Problème: Boutique ne charge pas**
- Vérifier credit_store_settings existe
- Vérifier is_enabled = true
- Vérifier RLS policies

### Contact Support

**Admin:** support@jobguinee.com
**WhatsApp:** [Numéro configuré]
**Documentation:** /docs/credit-store

---

**FIN DE LA DOCUMENTATION**

**Auteur:** Système Bolt.new
**Dernière MAJ:** 10 Décembre 2025
**Version:** 2.0 - Orange Money Manuel
**Statut:** Production Ready
