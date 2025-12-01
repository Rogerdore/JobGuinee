# Boutique Crédits IA - Documentation Complète

## Vue d'Ensemble

La Boutique Crédits IA est un système complet de monétisation permettant aux utilisateurs d'acheter des crédits pour utiliser les services d'intelligence artificielle de JobGuinée.

## Architecture

### Base de Données

#### Table: `credit_packages`

Définit les packs de crédits disponibles à l'achat:

```sql
- id (uuid)
- name (text) - Nom du pack
- description (text) - Description
- credits_amount (integer) - Crédits de base
- price_amount (numeric) - Prix
- currency (text) - Devise (GNF par défaut)
- bonus_credits (integer) - Crédits bonus
- is_popular (boolean) - Badge "Populaire"
- is_active (boolean) - Actif/Inactif
- display_order (integer) - Ordre d'affichage
- created_at, updated_at
```

#### Table: `credit_purchases`

Enregistre tous les achats de crédits:

```sql
- id (uuid)
- user_id (uuid) - Acheteur
- package_id (uuid) - Pack acheté
- credits_amount (integer) - Crédits achetés
- bonus_credits (integer) - Bonus reçus
- total_credits (integer) - Total (généré)
- price_amount (numeric) - Prix payé
- currency (text) - Devise
- payment_method (text) - Méthode de paiement
- payment_reference (text) - Référence unique
- payment_provider_id (text) - ID provider
- payment_status (text) - Statut paiement
- purchase_status (text) - Statut achat
- completed_at (timestamptz) - Date complétion
- failed_reason (text) - Raison échec
- created_at, updated_at
```

### Fonctions SQL

#### 1. create_credit_purchase()

Initialise un nouvel achat:

```sql
SELECT create_credit_purchase(
  p_package_id := 'uuid-du-pack',
  p_payment_method := 'orange_money'
);
```

**Retourne:**
```json
{
  "success": true,
  "purchase_id": "uuid",
  "payment_reference": "CP-20251201-abc123",
  "amount": 100000,
  "currency": "GNF",
  "credits": 1150
}
```

#### 2. complete_credit_purchase()

Finalise l'achat et ajoute les crédits:

```sql
SELECT complete_credit_purchase(
  p_purchase_id := 'uuid',
  p_payment_provider_id := 'OM-12345'
);
```

**Retourne:**
```json
{
  "success": true,
  "credits_added": 1150,
  "new_balance": 2150
}
```

#### 3. cancel_credit_purchase()

Annule un achat en attente:

```sql
SELECT cancel_credit_purchase(
  p_purchase_id := 'uuid',
  p_reason := 'Paiement échoué'
);
```

### Service TypeScript: CreditStoreService

Localisation: `/src/services/creditStoreService.ts`

#### Méthodes Disponibles

```typescript
// Récupérer tous les packs actifs
const packages = await CreditStoreService.getAllPackages();

// Récupérer un pack par ID
const pack = await CreditStoreService.getPackageById(packageId);

// Créer un achat
const result = await CreditStoreService.createPurchase(
  packageId,
  'orange_money'
);

// Finaliser un achat
const result = await CreditStoreService.completePurchase(
  purchaseId,
  paymentProviderId
);

// Annuler un achat
const result = await CreditStoreService.cancelPurchase(
  purchaseId,
  'Raison'
);

// Historique des achats utilisateur
const purchases = await CreditStoreService.getUserPurchases(50);

// Statut d'un achat
const status = await CreditStoreService.getPurchaseStatus(purchaseId);

// Helpers de formatage
CreditStoreService.formatPrice(100000, 'GNF'); // "100 000 GNF"
CreditStoreService.formatCredits(1500); // "1 500"
```

## Workflow Complet d'Achat

### 1. Affichage des Packs

L'utilisateur visite `/credit-store` et voit tous les packs disponibles:

```typescript
const packages = await CreditStoreService.getAllPackages();
```

Chaque pack affiche:
- Nom et description
- Crédits de base + bonus
- Prix
- Badge "Populaire" si applicable
- Pourcentage d'économies

### 2. Sélection et Paiement

1. Utilisateur clique "Acheter maintenant"
2. Modal s'ouvre avec détails du pack
3. Choix de la méthode de paiement:
   - Orange Money
   - MTN Money
   - Visa
   - Mastercard

### 3. Création de l'Achat

```typescript
const result = await CreditStoreService.createPurchase(
  selectedPackage.id,
  selectedMethod
);

if (result.success) {
  // payment_reference généré automatiquement
  // Format: CP-YYYYMMDD-xxxxxxxx
  console.log(result.data.payment_reference);
}
```

### 4. Traitement du Paiement

**Mode DEMO (Actuel):**
Simulation automatique après 2 secondes

**Mode PRODUCTION (À implémenter):**

```typescript
// Redirection vers provider
window.location.href = getPaymentURL(
  result.data.payment_reference,
  result.data.amount,
  paymentMethod
);

// Callback après paiement
// URL: /payment/callback?ref=CP-20251201-abc123&status=success

// Vérifier statut via webhook ou polling
const status = await CreditStoreService.getPurchaseStatus(purchaseId);
```

### 5. Finalisation et Activation

```typescript
if (paymentConfirmed) {
  const complete = await CreditStoreService.completePurchase(
    purchaseId,
    providerTransactionId
  );

  if (complete.success) {
    // Crédits ajoutés automatiquement
    // Transaction enregistrée
    // Notification envoyée
    showAlert(`${complete.data.credits_added} crédits ajoutés!`);
  }
}
```

### Actions Automatiques lors de la Finalisation

1. **Mise à jour du solde utilisateur**
   ```sql
   UPDATE profiles
   SET credits_balance = credits_balance + total_credits
   WHERE id = user_id;
   ```

2. **Enregistrement transaction**
   ```sql
   INSERT INTO credit_transactions (...)
   VALUES ('credit_purchase', total_credits, ...);
   ```

3. **Mise à jour statut achat**
   ```sql
   UPDATE credit_purchases
   SET purchase_status = 'completed',
       payment_status = 'completed',
       completed_at = now();
   ```

## Interface Utilisateur

### Page CreditStore

Localisation: `/src/pages/CreditStore.tsx`

**Fonctionnalités:**
- Grid responsive de packs
- Affichage solde en temps réel
- Modal de paiement intégré
- Gestion des alertes success/error
- Support mobile complet

**Design:**
- Gradient backgrounds
- Cards avec hover effects
- Badges "Populaire" distinctifs
- Affichage clair des bonus
- Prix formatés selon devise

### Modal de Paiement

**Contenu:**
- Récapitulatif du pack sélectionné
- Total crédits (base + bonus)
- Prix à payer
- Sélection méthode paiement visuelle
- Boutons action clairs

## Intégration Providers de Paiement

### Orange Money (À implémenter)

```typescript
async function processOrangeMoneyPayment(
  amount: number,
  reference: string,
  phoneNumber: string
) {
  // API Orange Money
  const response = await fetch('https://api.orange.com/...', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + ORANGE_API_KEY },
    body: JSON.stringify({
      amount,
      reference,
      phone: phoneNumber,
      callback_url: CALLBACK_URL
    })
  });

  return response.json();
}
```

### MTN Money (À implémenter)

```typescript
async function processMTNPayment(
  amount: number,
  reference: string,
  phoneNumber: string
) {
  // API MTN Mobile Money
  // Similar structure
}
```

### Cartes Bancaires (À implémenter)

```typescript
async function processCardPayment(
  amount: number,
  reference: string,
  cardDetails: CardInfo
) {
  // Stripe, PayPal ou gateway local
}
```

## Sécurité

### RLS Policies

```sql
-- Utilisateurs voient leurs achats
CREATE POLICY "Users can view own purchases"
  ON credit_purchases FOR SELECT
  USING (user_id = auth.uid());

-- Utilisateurs créent leurs achats
CREATE POLICY "Users can create purchases"
  ON credit_purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admins gèrent tout
CREATE POLICY "Admins can manage purchases"
  ON credit_purchases FOR ALL
  USING (user_type = 'admin');
```

### Validation

- Montants ne peuvent être négatifs
- Statuts suivent workflow strict
- Références de paiement uniques
- Achats finalisés immutables

### Anti-Fraude

- Un achat = un utilisateur authentifié
- Vérification status avant finalisation
- Impossible de finaliser 2x
- Logs complets dans transactions

## Monitoring et Analytics

### Métriques Importantes

```sql
-- Revenus totaux
SELECT
  SUM(price_amount) as total_revenue,
  COUNT(*) as total_purchases,
  COUNT(DISTINCT user_id) as unique_customers
FROM credit_purchases
WHERE purchase_status = 'completed';

-- Pack le plus vendu
SELECT
  p.name,
  COUNT(*) as sales_count,
  SUM(cp.price_amount) as revenue
FROM credit_purchases cp
JOIN credit_packages p ON p.id = cp.package_id
WHERE cp.purchase_status = 'completed'
GROUP BY p.id, p.name
ORDER BY sales_count DESC;

-- Taux de conversion
SELECT
  payment_method,
  COUNT(*) FILTER (WHERE purchase_status = 'completed') as completed,
  COUNT(*) FILTER (WHERE purchase_status = 'failed') as failed,
  ROUND(
    COUNT(*) FILTER (WHERE purchase_status = 'completed')::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as conversion_rate
FROM credit_purchases
GROUP BY payment_method;
```

## Gestion Admin (À créer)

### Page AdminCreditPacks

Fonctionnalités recommandées:
- Liste tous les packs
- Créer/modifier/désactiver packs
- Voir statistiques de vente
- Historique des achats
- Gestion des remboursements
- Export données

## Extensibilité Future

### Promotions et Codes Promo

```sql
-- Table pour codes promo
CREATE TABLE promo_codes (
  code text PRIMARY KEY,
  discount_percent integer,
  valid_until timestamptz,
  max_uses integer,
  uses_count integer DEFAULT 0
);
```

### Abonnements Récurrents

```sql
-- Table pour abonnements
CREATE TABLE credit_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid,
  package_id uuid,
  interval text, -- monthly, yearly
  next_billing_date timestamptz,
  status text -- active, cancelled, expired
);
```

### Programme de Fidélité

```sql
-- Points de fidélité
ALTER TABLE profiles
ADD COLUMN loyalty_points integer DEFAULT 0;

-- Historique points
CREATE TABLE loyalty_history (
  user_id uuid,
  points integer,
  reason text,
  created_at timestamptz
);
```

## Conclusion

La Boutique Crédits IA est un système complet de monétisation qui offre:

- **Flexibilité**: Multiples packs et méthodes de paiement
- **Sécurité**: RLS, validation, anti-fraude
- **Performance**: Workflow optimisé, minimal queries
- **Évolutivité**: Architecture prête pour extensions
- **UX**: Interface moderne et intuitive
- **Traçabilité**: Logs complets de toutes transactions

Le système est prêt pour la production avec l'intégration des providers de paiement réels.
