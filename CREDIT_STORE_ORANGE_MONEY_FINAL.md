# BOUTIQUE DE CRÉDITS IA - ORANGE MONEY
## JobGuinée - Système Complet

**Date:** 10 Décembre 2025
**Version:** 1.0 FINALE
**Statut:** Production Ready

---

## VUE D'ENSEMBLE

La **Boutique de Crédits IA** permet aux utilisateurs d'acheter des crédits pour utiliser les services IA de JobGuinée via **paiement manuel Orange Money**. Le système est entièrement opérationnel et sécurisé.

### Fonctionnalités Clés

- Achat de packs de crédits avec bonus
- Paiement exclusif par Orange Money (manuel)
- Workflow en 3 étapes avec validation admin
- Envoi preuve via WhatsApp
- Validation manuelle par administrateur
- Ajout automatique des crédits après validation
- Historique complet des transactions
- Configuration admin temps réel
- Sécurité RLS complète

---

## ARCHITECTURE COMPLÈTE

### 1. Tables de Base de Données

#### credit_packages
**Description:** Packs de crédits disponibles à l'achat

**Colonnes:**
- `id` (uuid, PK)
- `package_name` (text) - Nom du pack
- `credits_amount` (integer) - Crédits de base
- `bonus_credits` (integer) - Crédits bonus
- `price_amount` (numeric) - Prix en GNF
- `currency` (text) - Devise (GNF par défaut)
- `description` (text) - Description du pack
- `is_active` (boolean) - Pack actif/inactif
- `is_popular` (boolean) - Badge "Populaire"
- `display_order` (integer) - Ordre d'affichage
- `created_at`, `updated_at`

**RLS:**
- Tout le monde peut voir les packs actifs (SELECT)
- Admins peuvent gérer tous les packs (ALL)

**Données actuelles:** 5 packs configurés

#### credit_purchases
**Description:** Historique des achats de crédits

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users)
- `package_id` (uuid, FK credit_packages)
- `credits_amount` (integer) - Crédits de base achetés
- `bonus_credits` (integer) - Crédits bonus
- `total_credits` (integer) - Total (base + bonus)
- `price_amount` (numeric) - Montant payé
- `currency` (text) - Devise
- `payment_method` (text) - 'orange_money'
- `payment_reference` (text, UNIQUE) - REF-XXXXXXXX
- `payment_status` (text) - 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled'
- `purchase_status` (text) - 'pending' | 'processing' | 'completed' | 'cancelled'
- `payment_proof_url` (text) - URL preuve (optionnel)
- `admin_notes` (text) - Notes admin
- `completed_at` (timestamptz) - Date de validation
- `failed_reason` (text) - Raison échec/annulation
- `created_at`, `updated_at`

**RLS:**
- Users peuvent créer leurs propres achats (INSERT)
- Users peuvent voir leurs propres achats (SELECT)
- Users peuvent mettre à jour leurs achats en attente (UPDATE pending/waiting_proof)
- Admins peuvent voir tous les achats (SELECT)
- Admins peuvent mettre à jour tous les achats (UPDATE)

#### credit_store_settings
**Description:** Configuration globale de la boutique

**Colonnes:**
- `id` (uuid, PK)
- `admin_phone_number` (text) - Numéro Orange Money admin
- `admin_whatsapp_number` (text) - Numéro WhatsApp admin
- `payment_instructions` (text) - Instructions de paiement
- `is_enabled` (boolean) - Boutique active/inactive
- `created_at`, `updated_at`

**RLS:**
- Tout le monde peut voir les paramètres (SELECT)
- Admins peuvent gérer les paramètres (ALL)

**Données actuelles:** 1 entrée de configuration

#### credit_transactions
**Description:** Journal de toutes les transactions de crédits

**Colonnes:**
- `id` (uuid, PK)
- `user_id` (uuid, FK auth.users)
- `transaction_type` (text) - 'purchase' | 'usage' | 'refund' | 'bonus' | 'admin_adjustment'
- `credits_amount` (integer) - Montant (positif ou négatif)
- `description` (text) - Description
- `balance_before` (integer) - Solde avant
- `balance_after` (integer) - Solde après
- `service_code` (text) - Code service IA (si usage)
- `reference_id` (uuid) - ID référence (purchase_id, etc.)
- `metadata` (jsonb) - Données supplémentaires
- `created_at`

**RLS:**
- Users peuvent voir leurs propres transactions (SELECT)
- Admins peuvent voir toutes les transactions (SELECT)

---

### 2. Fonctions RPC (PostgreSQL)

#### create_credit_purchase(p_package_id, p_payment_method)
**Description:** Créer un nouvel achat de crédits

**Paramètres:**
- `p_package_id` (uuid) - ID du pack acheté
- `p_payment_method` (text) - 'orange_money'

**Processus:**
1. Vérifie authentification utilisateur
2. Récupère les détails du pack
3. Vérifie que le pack est actif
4. Génère une référence unique (REF-XXXXXXXX)
5. Crée l'entrée dans credit_purchases
6. Retourne purchase_id, référence, montant

**Retour:**
```json
{
  "success": true/false,
  "message": "...",
  "purchase_id": "uuid",
  "payment_reference": "REF-XXXXXXXX",
  "amount": 50000,
  "currency": "GNF",
  "credits": 500
}
```

#### complete_credit_purchase(p_purchase_id, p_admin_notes)
**Description:** Valider un achat et ajouter les crédits

**Paramètres:**
- `p_purchase_id` (uuid) - ID de l'achat
- `p_admin_notes` (text) - Notes admin (optionnel)

**Processus:**
1. Vérifie que l'utilisateur est admin
2. Récupère les détails de l'achat
3. Vérifie que l'achat n'est pas déjà validé
4. Ajoute les crédits au profil utilisateur
5. Met à jour payment_status = 'completed'
6. Enregistre completed_at
7. Crée transaction dans credit_transactions
8. Retourne succès avec crédits ajoutés

**Retour:**
```json
{
  "success": true/false,
  "message": "...",
  "credits_added": 600,
  "new_balance": 700
}
```

**Sécurité:**
- Fonction idempotente (ne valide pas 2 fois)
- Vérifie permissions admin
- Transaction atomique

#### cancel_credit_purchase(p_purchase_id, p_reason)
**Description:** Annuler un achat

**Paramètres:**
- `p_purchase_id` (uuid) - ID de l'achat
- `p_reason` (text) - Raison annulation (optionnel)

**Processus:**
1. Vérifie que l'utilisateur est admin
2. Met à jour payment_status = 'cancelled'
3. Enregistre failed_reason
4. Retourne succès

**Retour:**
```json
{
  "success": true/false,
  "message": "..."
}
```

---

## WORKFLOW UTILISATEUR COMPLET

### Étape 1: Sélection Pack

**Page:** `/credit-store`

**Affichage:**
- Grille de packs modernes avec cards
- Chaque pack affiche:
  - Nom du pack
  - Description
  - Crédits de base (grand)
  - Crédits bonus avec % (vert)
  - Total crédits (orange)
  - Prix en GNF
  - Badge "Populaire" si applicable
- Section "À quoi servent les crédits IA?"
- CreditBalance en haut

**Action utilisateur:**
1. Clique sur "Acheter maintenant"
2. Vérifie qu'il est connecté
3. Vérifie que la boutique est active
4. Ouvre modal de paiement

### Étape 2: Modal - Informations Pack

**Contenu:**
- En-tête: "Paiement Orange Money"
- Détails du pack:
  - Nom + description
  - Crédits de base (card bleue)
  - Bonus (card verte)
  - Total (card orange)
  - Prix final (grand)
- Alert info: "Le paiement s'effectue exclusivement par Orange Money"

**Boutons:**
- Annuler
- Continuer (crée purchase)

**Action backend:**
```typescript
const result = await CreditStoreService.createPurchase(pack.id);
// Appelle RPC create_credit_purchase()
// Retourne purchase_id + référence
```

### Étape 3: Modal - Paiement Orange Money

**Contenu:**
- Titre: "Instructions de paiement"

**Informations affichées:**
1. **Référence de paiement** (grand, copie possible)
   - Format: REF-XXXXXXXX
   - Affichage: carte orange

2. **Numéro Orange Money admin** (très grand)
   - Format: 622000000 (exemple)
   - Bouton "Copier le numéro"
   - Affichage: carte orange

3. **Montant à envoyer** (grand)
   - Format: 50 000 GNF
   - Affichage: carte orange

4. **Instructions personnalisées**
   - Texte depuis credit_store_settings.payment_instructions
   - Affichage: card bleue avec titre "Instructions importantes"

**Boutons (ordre):**
1. **"Envoyer la preuve via WhatsApp"** (vert)
   - Ouvre WhatsApp avec message pré-rempli:
     ```
     Preuve Paiement JobGuinée

     Pack: [nom]
     Utilisateur: [email]
     Référence: REF-XXXXXXXX

     Veuillez trouver ci-joint la capture d'écran...
     ```

2. **"J'ai effectué le paiement"** (orange)
   - Met à jour payment_status = 'waiting_proof'
   - Passe à l'étape confirmation

**Messages UX obligatoires:**
> "Merci d'effectuer votre paiement via Orange Money au numéro ci-dessous. Envoyez ensuite la preuve via WhatsApp."

### Étape 4: Modal - Confirmation

**Contenu:**
- Icône Check (vert, grand)
- Titre: "Paiement enregistré!"

**Message principal:**
> "Merci ! Votre paiement est en cours de vérification par l'équipe JobGuinée. Temps estimé : **5 à 20 minutes**."

**Card bleue (référence):**
- **Référence:** REF-XXXXXXXX
- "Conservez cette référence pour le suivi de votre achat."
- "Vos crédits seront automatiquement ajoutés à votre compte après validation."

**Card jaune (rappel):**
> **Important:** N'oubliez pas d'envoyer la preuve de paiement via WhatsApp pour accélérer la validation.

**Bouton:**
- "Fermer" (bleu)

---

## WORKFLOW ADMIN

### Page: AdminCreditStoreSettings

**Route:** `admin-credit-store-settings`

**Fonctionnalités:**

1. **Toggle Boutique Active**
   - Active/désactive la boutique globalement
   - Si désactivée, utilisateurs voient message "temporairement fermée"

2. **Numéro Orange Money**
   - Champ texte
   - Le numéro vers lequel les utilisateurs envoient le paiement
   - Validation: numéro valide

3. **Numéro WhatsApp**
   - Champ texte
   - Le numéro où les utilisateurs envoient la preuve
   - Validation: numéro valide

4. **Instructions de paiement**
   - Textarea (4 lignes)
   - Message personnalisé affiché dans la modal
   - Exemple par défaut fourni

5. **Bouton Sauvegarder**
   - Appelle `CreditStoreService.updateSettings()`
   - Mise à jour dans credit_store_settings

6. **Aperçu en temps réel**
   - Affiche état actuel (Active/Désactivée)
   - Affiche numéro OM (card orange)
   - Affiche numéro WhatsApp (card vert)
   - Affiche instructions (card bleue)

**Sécurité:**
- Accessible uniquement aux admins
- Modifie la seule entrée de credit_store_settings

### Page: AdminCreditPurchases

**Route:** `admin-credit-purchases`

**Fonctionnalités:**

1. **Statistiques rapides** (haut de page)
   - Total paiements
   - En attente
   - Validés
   - Annulés

2. **Filtres**
   - Tous
   - En attente (pending)
   - Preuve envoyée (waiting_proof) - **DÉFAUT**
   - Validés (completed)
   - Annulés (cancelled)

3. **Bouton Actualiser**
   - Recharge les données
   - Animation spin pendant loading

4. **Table des paiements**

**Colonnes:**
- Date (formatée fr-FR)
- Référence (REF-XXXXXXXX + user_id tronqué)
- Montant (formaté GNF)
- Crédits (total avec détail base + bonus)
- Statut (badge coloré)
- Actions

**Badges de statut:**
- pending: gris "En attente"
- waiting_proof: jaune "Preuve envoyée"
- completed: vert "Validé"
- cancelled: rouge "Annulé"
- failed: rouge "Échec"

**Actions par ligne:**
- **Voir détails** (bleu, icône Eye) - ouvre modal
- **Valider** (vert, icône Check) - si pending ou waiting_proof
- **Annuler** (rouge, icône X) - si pending ou waiting_proof

5. **Modal Détails**

**Contenu:**
- En-tête: référence du paiement
- Grid 2 colonnes:
  - Date création
  - Statut actuel (badge)
  - Montant (card bleue)
  - Crédits total (card verte)
- User ID (card grise, font-mono)
- Notes admin (si existantes, card bleue)
- Raison annulation (si existante, card rouge)
- Date validation (si completed, card verte)

**Actions dans modal:**
- **Valider le paiement** (vert) - appelle `completePurchase()`
- **Annuler** (rouge) - appelle `cancelPurchase()`

6. **Configuration actuelle**
   - Affiche numéro OM et WhatsApp actuels
   - Pour référence rapide de l'admin

**Process de validation:**
```typescript
// Admin clique "Valider"
const result = await CreditStoreService.completePurchase(purchaseId, notes);

// Backend:
// - Vérifie admin
// - Ajoute crédits au profil
// - Met à jour payment_status = 'completed'
// - Crée credit_transaction
// - Retourne crédits ajoutés + nouveau solde

// Frontend affiche:
alert(`Paiement validé! ${result.data.credits_added} crédits ajoutés.`);
```

**Process d'annulation:**
```typescript
// Admin clique "Annuler"
if (!confirm('Êtes-vous sûr de vouloir annuler ce paiement?')) return;

const result = await CreditStoreService.cancelPurchase(purchaseId, reason);

// Backend:
// - Vérifie admin
// - Met à jour payment_status = 'cancelled'
// - Enregistre failed_reason

// Frontend affiche:
alert('Paiement annulé');
```

---

## SERVICE TYPESCRIPT

### creditStoreService.ts

**Classes:**

#### CreditStoreService

**Méthodes principales:**

```typescript
// Configuration
static async getSettings(): Promise<CreditStoreSettings | null>
static async updateSettings(settings: Partial<CreditStoreSettings>): Promise<boolean>

// Packages
static async getAllPackages(): Promise<CreditPackage[]>
static async getPackageById(packageId: string): Promise<CreditPackage | null>

// Achats utilisateur
static async createPurchase(packageId: string): Promise<Result>
static async markAsWaitingProof(purchaseId: string): Promise<boolean>
static async getUserPurchases(limit?: number): Promise<CreditPurchase[]>

// Achats admin
static async getAllPurchases(status?: string, limit?: number): Promise<CreditPurchase[]>
static async completePurchase(purchaseId: string, adminNotes?: string): Promise<Result>
static async cancelPurchase(purchaseId: string, reason?: string): Promise<Result>
static async getPurchaseById(purchaseId: string): Promise<CreditPurchase | null>

// Utilitaires
static formatPrice(amount: number, currency: string = 'GNF'): string
static formatCredits(amount: number): string
static getWhatsAppLink(phoneNumber: string, packageName: string, userEmail: string, reference: string): string
```

**Exemple d'utilisation:**

```typescript
// Créer achat
const result = await CreditStoreService.createPurchase(packageId);
if (result.success) {
  console.log(result.data.payment_reference); // REF-XXXXXXXX
}

// Marquer comme payé
await CreditStoreService.markAsWaitingProof(purchaseId);

// Valider (admin)
const completion = await CreditStoreService.completePurchase(purchaseId, 'Preuve WhatsApp reçue');
if (completion.success) {
  alert(`${completion.data.credits_added} crédits ajoutés`);
}

// Formater prix
const price = CreditStoreService.formatPrice(50000, 'GNF'); // "50 000 GNF"

// Générer lien WhatsApp
const link = CreditStoreService.getWhatsAppLink(
  '622000000',
  'Pack Starter',
  'user@example.com',
  'REF-ABC123'
);
// https://wa.me/622000000?text=Preuve%20Paiement...
```

---

## MESSAGES UX OBLIGATOIRES

### Dans CreditStore.tsx

**En-tête boutique:**
> "Rechargez vos crédits pour profiter de tous nos services IA premium"

**Alert info (avant packs):**
> "Le paiement s'effectue par transfert Orange Money. Après votre transfert, envoyez la preuve via WhatsApp pour une validation rapide par notre équipe."

**Modal - Étape Info:**
> "Le paiement s'effectue exclusivement par **Orange Money**. Après le transfert, vous devrez envoyer la preuve via WhatsApp pour validation rapide."

**Modal - Étape Paiement:**
> "Merci d'effectuer votre paiement via Orange Money au numéro ci-dessous. Envoyez ensuite la preuve via WhatsApp."

**Bouton WhatsApp:**
> "Envoyer la preuve via WhatsApp"

**Bouton Payé:**
> "J'ai effectué le paiement"

**Modal - Étape Confirmation:**
> "Merci ! Votre paiement est en cours de vérification par l'équipe JobGuinée. Temps estimé : **5 à 20 minutes**."

> "Conservez cette référence pour le suivi de votre achat. Vos crédits seront automatiquement ajoutés à votre compte après validation."

> "**Important:** N'oubliez pas d'envoyer la preuve de paiement via WhatsApp pour accélérer la validation."

### Dans AdminCreditPurchases.tsx

**Alert validation:**
> "Paiement validé! [X] crédits ajoutés."

**Alert annulation:**
> "Paiement annulé"

**Confirm annulation:**
> "Êtes-vous sûr de vouloir annuler ce paiement?"

---

## SÉCURITÉ

### 1. Row Level Security (RLS)

**Toutes les tables ont RLS activé:**

**credit_packages:**
- Public: SELECT (seulement is_active = true)
- Admin: ALL

**credit_purchases:**
- User: INSERT (seulement leurs achats)
- User: SELECT (seulement leurs achats)
- User: UPDATE (seulement leurs achats pending/waiting_proof)
- Admin: SELECT (tous)
- Admin: UPDATE (tous)

**credit_store_settings:**
- Public: SELECT (tous)
- Admin: ALL

**credit_transactions:**
- User: SELECT (seulement leurs transactions)
- Admin: SELECT (tous)

### 2. Validation Backend

**create_credit_purchase():**
- Vérifie auth.uid()
- Vérifie package actif
- Génère référence unique
- Vérifie montant positif

**complete_credit_purchase():**
- Vérifie que user est admin
- Vérifie purchase existe
- Vérifie purchase pas déjà validé (idempotent)
- Transaction atomique (crédits + status + transaction)
- Ne valide que pending ou waiting_proof

**cancel_credit_purchase():**
- Vérifie que user est admin
- Ne peut pas annuler completed

### 3. Protection Frontend

**CreditStore:**
- Vérifie utilisateur connecté avant achat
- Vérifie boutique active
- Affiche messages d'erreur clairs

**AdminCreditPurchases:**
- Accessible uniquement aux admins
- Confirm avant annulation
- Boutons désactivés pendant traitement

### 4. Références Uniques

**Format:** REF-XXXXXXXX (8 caractères alphanumériques)

**Génération:**
- Timestamp + random
- Index UNIQUE sur payment_reference
- Garantit unicité en DB

---

## TESTS DE VALIDATION

### Test 1: Workflow Complet Utilisateur

**Steps:**
1. Utilisateur va sur `/credit-store`
2. Sélectionne pack "Starter" (100 crédits, 50 000 GNF)
3. Clique "Acheter maintenant"
4. Modal s'ouvre sur étape Info
5. Clique "Continuer"
6. Étape Paiement affiche:
   - Référence: REF-ABC12345
   - Numéro OM: 622000000
   - Montant: 50 000 GNF
7. Clique "Copier numéro" → numéro copié
8. Clique "Envoyer preuve WhatsApp" → WhatsApp s'ouvre
9. Clique "J'ai effectué le paiement"
10. Étape Confirmation affiche message "5 à 20 minutes"
11. Clique "Fermer"

**Résultat attendu:**
- Achat créé avec status 'waiting_proof'
- Référence unique générée
- WhatsApp link correct
- Messages UX corrects

### Test 2: Validation Admin

**Steps:**
1. Admin va sur `/admin-credit-purchases`
2. Filtre "Preuve envoyée" actif
3. Voit l'achat de Test 1 dans la liste
4. Clique "Voir détails"
5. Modal affiche toutes les infos
6. Clique "Valider le paiement"
7. Alert "Paiement validé! 120 crédits ajoutés"
8. Achat disparaît de la liste "Preuve envoyée"
9. Apparaît dans "Validés"

**Résultat attendu:**
- Crédits ajoutés au profil utilisateur
- payment_status = 'completed'
- completed_at rempli
- credit_transaction créée

**Vérifications DB:**
```sql
-- Profil utilisateur
SELECT credits_balance FROM profiles WHERE id = '[user_id]';
-- Doit avoir augmenté de 120

-- Purchase
SELECT payment_status, completed_at FROM credit_purchases WHERE id = '[purchase_id]';
-- payment_status = 'completed', completed_at NOT NULL

-- Transaction
SELECT * FROM credit_transactions
WHERE user_id = '[user_id]'
  AND transaction_type = 'purchase'
  AND reference_id = '[purchase_id]';
-- 1 entrée avec credits_amount = 120
```

### Test 3: Annulation Admin

**Steps:**
1. Utilisateur crée un achat (Test 1)
2. Admin va sur `/admin-credit-purchases`
3. Clique "Annuler" sur l'achat
4. Confirm "Êtes-vous sûr..."
5. Alert "Paiement annulé"
6. Achat passe dans "Annulés"

**Résultat attendu:**
- payment_status = 'cancelled'
- Aucun crédit ajouté

### Test 4: Boutique Désactivée

**Steps:**
1. Admin va sur `/admin-credit-store-settings`
2. Désactive le toggle "Boutique active"
3. Sauvegarde
4. Utilisateur va sur `/credit-store`
5. Voit message "Boutique temporairement fermée"
6. Aucun pack visible
7. Aucun achat possible

**Résultat attendu:**
- Boutique inaccessible
- Message clair
- Pas de crash

### Test 5: Sécurité RLS

**Steps:**
1. User A crée achat
2. User B essaie de voir achats de User A via requête directe
3. User B ne voit rien
4. Admin voit achats de tout le monde

**Résultat attendu:**
- RLS bloque accès User B
- Admin voit tous les achats

---

## INTÉGRATION AVEC CENTRE IA

### Lien CreditStore ↔ Services IA

**Achat crédits:**
1. Utilisateur achète pack dans CreditStore
2. Admin valide paiement
3. Crédits ajoutés à `profiles.credits_balance`

**Utilisation crédits:**
1. Utilisateur utilise service IA (CV, LM, etc.)
2. Service appelle `use_ai_credits(user_id, service_code)`
3. Fonction débite crédits
4. Crée `credit_transaction` type 'usage'
5. Crée `ai_service_usage_history`

**Vérification solde:**
```typescript
// Avant d'appeler service IA
const check = await CreditService.checkSufficientCredits(userId, serviceCode);
if (!check.sufficient) {
  // Proposer achat crédits
  navigate('credit-store');
}
```

**Affichage solde:**
```tsx
// CreditBalance component (déjà implémenté)
<CreditBalance showDetails />
// Affiche solde actuel + bouton "Acheter crédits"
```

---

## ROUTING COMPLET

### Pages Utilisateur

**`/credit-store`** → CreditStore.tsx
- Accessible à tous les utilisateurs connectés
- Affiche packs + modal de paiement
- Gère workflow complet d'achat

### Pages Admin

**`/admin-credit-store-settings`** → AdminCreditStoreSettings.tsx
- Configuration boutique
- Numéros OM et WhatsApp
- Toggle actif/inactif

**`/admin-credit-purchases`** → AdminCreditPurchases.tsx
- Liste des achats
- Validation/Annulation
- Modal détails

**`/admin-security-logs`** → AdminSecurityLogs.tsx
- Logs de sécurité IA (bonus du système)
- Surveillance abus
- Suspension utilisateurs

---

## CONFIGURATION PRODUCTION

### 1. Paramètres à Configurer

**Dans credit_store_settings:**
```sql
UPDATE credit_store_settings SET
  admin_phone_number = '622XXXXXX', -- VRAI NUMÉRO OM
  admin_whatsapp_number = '622XXXXXX', -- VRAI NUMÉRO WHATSAPP
  payment_instructions = 'Effectuez le transfert Orange Money vers le numéro indiqué. Envoyez ensuite la capture d''écran de la confirmation via WhatsApp au numéro fourni.',
  is_enabled = true;
```

### 2. Créer des Packs

**Exemples de packs:**
```sql
-- Pack Starter
INSERT INTO credit_packages (package_name, credits_amount, bonus_credits, price_amount, description, is_popular, display_order)
VALUES ('Starter', 100, 20, 50000, 'Idéal pour débuter', false, 1);

-- Pack Populaire
INSERT INTO credit_packages (package_name, credits_amount, bonus_credits, price_amount, description, is_popular, display_order)
VALUES ('Populaire', 500, 150, 200000, 'Le meilleur rapport qualité-prix', true, 2);

-- Pack Pro
INSERT INTO credit_packages (package_name, credits_amount, bonus_credits, price_amount, description, is_popular, display_order)
VALUES ('Pro', 1000, 400, 350000, 'Pour les professionnels', false, 3);

-- Pack Premium
INSERT INTO credit_packages (package_name, credits_amount, bonus_credits, price_amount, description, is_popular, display_order)
VALUES ('Premium', 2500, 1250, 800000, 'Le pack ultime', false, 4);

-- Pack Entreprise
INSERT INTO credit_packages (package_name, credits_amount, bonus_credits, price_amount, description, is_popular, display_order)
VALUES ('Entreprise', 5000, 3000, 1500000, 'Pour les grandes structures', false, 5);
```

### 3. Formation Admins

**Points à expliquer:**
1. Comment accéder à `/admin-credit-purchases`
2. Comment valider un paiement (vérifier preuve WhatsApp d'abord)
3. Quand annuler un paiement (montant incorrect, pas de preuve, etc.)
4. Comment vérifier les preuves WhatsApp
5. Temps de réponse attendu (5-20 minutes)

### 4. Monitoring

**Requêtes utiles:**

```sql
-- Achats en attente validation
SELECT COUNT(*) FROM credit_purchases WHERE payment_status = 'waiting_proof';

-- Achats validés aujourd'hui
SELECT COUNT(*), SUM(price_amount)
FROM credit_purchases
WHERE payment_status = 'completed'
  AND completed_at > CURRENT_DATE;

-- Top utilisateurs achats
SELECT user_id, COUNT(*), SUM(total_credits)
FROM credit_purchases
WHERE payment_status = 'completed'
GROUP BY user_id
ORDER BY SUM(total_credits) DESC
LIMIT 10;

-- Statistiques par pack
SELECT p.package_name, COUNT(*), SUM(cp.price_amount)
FROM credit_purchases cp
JOIN credit_packages p ON p.id = cp.package_id
WHERE cp.payment_status = 'completed'
GROUP BY p.package_name
ORDER BY COUNT(*) DESC;
```

---

## MESSAGES D'ERREUR

### Frontend

**Boutique désactivée:**
> "La boutique de crédits est actuellement indisponible. Veuillez réessayer plus tard."

**Utilisateur non connecté:**
> "Vous devez être connecté pour acheter des crédits"

**Erreur création achat:**
> "Erreur lors de la création de l'achat"

**Erreur validation admin:**
> "Erreur lors de la validation"

**Erreur annulation:**
> "Erreur lors de l'annulation"

### Backend (RPC)

**Package inactif:**
> "Ce pack n'est plus disponible"

**Package introuvable:**
> "Pack non trouvé"

**Purchase déjà validée:**
> "Cet achat a déjà été validé"

**Purchase introuvable:**
> "Achat introuvable"

**Utilisateur non admin:**
> "Permissions insuffisantes"

---

## AMÉLIORATIONS FUTURES

### Phase 2

1. **Notifications push/email**
   - Notification quand crédits ajoutés
   - Email de confirmation

2. **Historique achats utilisateur**
   - Page dédiée
   - Filtres et recherche

3. **Codes promo**
   - Réductions sur packs
   - Crédits bonus supplémentaires

4. **Packs personnalisés**
   - Admin peut créer packs custom
   - UI admin pour gestion packs

5. **Dashboard statistiques**
   - Graphiques revenus
   - Tendances achats
   - KPIs

### Phase 3

1. **API Orange Money**
   - Intégration automatique
   - Validation instantanée
   - Moins de travail manuel

2. **Webhooks**
   - Notification admin instant
   - Slack/Discord integration

3. **Facturation automatique**
   - Génération PDF factures
   - Export comptable

---

## SUPPORT & MAINTENANCE

### Problèmes Courants

**1. Crédits pas ajoutés après validation:**
- Vérifier que complete_credit_purchase() s'est bien exécuté
- Vérifier credit_transactions table
- Vérifier profiles.credits_balance

**2. Utilisateur ne voit pas ses achats:**
- Vérifier RLS policies
- Vérifier que user_id correspond

**3. Admin ne peut pas valider:**
- Vérifier que user_type = 'admin'
- Vérifier que payment_status = 'pending' ou 'waiting_proof'

**4. Référence dupliquée:**
- Très rare (collision)
- Supprimer duplicata et relancer achat

### Logs à Consulter

**credit_purchases:**
- created_at, updated_at
- payment_status transitions

**credit_transactions:**
- Toutes les transactions crédits
- Vérifier balance_before/after

**ai_security_logs:**
- Abus possibles
- Patterns suspects

---

## CONCLUSION

Le système de boutique Orange Money est **100% fonctionnel** et **production-ready**.

### Checklist Finale

✅ Tables DB créées et peuplées
✅ Fonctions RPC implémentées et testées
✅ RLS configuré et sécurisé
✅ Page CreditStore complète avec modal 3 étapes
✅ WhatsApp integration
✅ AdminCreditStoreSettings opérationnel
✅ AdminCreditPurchases avec validation/annulation
✅ Messages UX clairs et en français
✅ Routing complet dans App.tsx
✅ Build sans erreurs
✅ Documentation complète

### Prochaines Actions

1. **Configurer production:**
   - Mettre vrai numéro OM
   - Mettre vrai numéro WhatsApp
   - Personnaliser instructions

2. **Former admins:**
   - Processus validation
   - Vérification preuves
   - Gestion annulations

3. **Tester avec vrais utilisateurs:**
   - 5-10 transactions test
   - Vérifier workflow complet
   - Ajuster si nécessaire

4. **Monitorer:**
   - Temps de validation moyen
   - Taux d'annulation
   - Satisfaction utilisateurs

---

**FIN DE LA DOCUMENTATION**

**Projet:** JobGuinée - Boutique Crédits IA
**Système:** Orange Money Paiement Manuel
**Auteur:** Bolt.new AI System
**Date:** 10 Décembre 2025
**Version:** 1.0 FINALE
**Statut:** ✅ PRODUCTION READY
