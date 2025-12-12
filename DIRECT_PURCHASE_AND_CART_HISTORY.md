# Système d'Achat Direct et Historique du Panier - CVThèque

## Date de Création
12 Décembre 2024

---

## Vue d'Ensemble

Ce document décrit le nouveau système d'achat direct de profils et d'historique du panier pour les recruteurs sans abonnement actif dans la CVThèque.

---

## Fonctionnalités Principales

### 1. Historique du Panier

Un système complet de sauvegarde et de suivi des sélections de profils:

- **Sauvegarde automatique** de tous les profils ajoutés au panier
- **Conservation du prix** au moment de la sélection
- **Historique persistant** des 100 dernières sélections
- **Récupération facile** des profils précédemment sélectionnés

### 2. Achats Directs

Les recruteurs sans pack actif peuvent acheter des profils à l'unité:

- **Paiement à l'unité** avec les prix par défaut
- **Validation par preuve de paiement** Orange Money
- **Traçabilité complète** des transactions
- **Validation administrative** sous 24h

### 3. Workflow de Checkout Amélioré

Un processus de validation en deux options:

**Option A: Validation Directe**
- Paiement immédiat via Orange Money
- Accès après validation admin
- Prix unitaires standards appliqués

**Option B: Achat de Pack**
- Redirection vers les packs CVThèque
- Économies jusqu'à 60%
- Sélection actuelle archivée dans l'historique

---

## Architecture du Système

### Base de Données

#### Table `profile_cart_history`

```sql
CREATE TABLE profile_cart_history (
  id uuid PRIMARY KEY,
  recruiter_id uuid REFERENCES profiles(id),
  candidate_id uuid REFERENCES candidate_profiles(id),
  profile_snapshot jsonb,           -- Snapshot complet du profil
  price_at_selection integer,       -- Prix au moment de l'ajout
  experience_level text,             -- junior, intermediate, senior
  added_to_cart_at timestamptz,
  removed_from_cart_at timestamptz,
  converted_to_purchase boolean,
  purchase_id uuid,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Utilité:**
- Conserve l'historique de toutes les sélections
- Permet de retrouver les profils précédemment consultés
- Stocke le prix au moment de la sélection
- Tracking de la conversion en achat

#### Table `direct_profile_purchases`

```sql
CREATE TABLE direct_profile_purchases (
  id uuid PRIMARY KEY,
  recruiter_id uuid REFERENCES profiles(id),
  profile_ids uuid[],               -- Liste des IDs de profils
  total_profiles integer,
  total_amount integer,             -- Montant total en GNF
  breakdown jsonb,                  -- Détail par niveau

  payment_method text,
  payment_reference text UNIQUE,
  payment_status text,              -- pending, waiting_proof, completed...
  payment_proof_url text,
  payment_verified_at timestamptz,
  payment_verified_by uuid,

  purchase_status text,             -- pending, confirmed, completed...
  confirmation_code text UNIQUE,

  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,

  admin_notes text,
  validated_by uuid,
  validated_at timestamptz,

  created_at timestamptz,
  updated_at timestamptz
);
```

**Utilité:**
- Gère les achats directs (sans pack)
- Tracking complet du paiement
- Validation administrative
- Historique des transactions

### Services

#### `cartHistoryService.ts`

Service gérant l'historique et les achats directs:

```typescript
// Gestion de l'historique
addToCartHistory()
removeFromCartHistory()
getActiveCart()
getCartHistory()
getPreviouslySelectedProfiles()
archiveCurrentCart()

// Gestion des achats directs
createDirectPurchase()
updatePaymentProof()
getDirectPurchases()
getDirectPurchaseById()
cancelDirectPurchase()
validateDirectPurchase() // Admin uniquement
getPendingDirectPurchases() // Admin uniquement
```

### Composants

#### `CheckoutConfirmation.tsx`

Modal de confirmation affichant:

1. **Récapitulatif de la sélection**
   - Nombre de profils par niveau
   - Montant par catégorie
   - Total général

2. **Options de validation**
   - Valider directement (paiement Orange Money)
   - Acheter un pack (avec avertissement d'annulation)

3. **Accès à l'historique**
   - Bouton pour voir les sélections précédentes

#### `CartHistoryModal.tsx`

Modal d'historique affichant:

1. **Filtres**
   - Tous les profils
   - Profils retirés
   - Profils achetés

2. **Liste historique**
   - Informations du profil
   - Prix au moment de la sélection
   - Date d'ajout/retrait
   - Statut (dans le panier, retiré, acheté)

3. **Actions**
   - Ré-ajouter au panier
   - Voir les détails

---

## Workflow Utilisateur

### Scénario 1: Recruteur AVEC Pack Actif

```
1. Recruteur ajoute des profils au panier
2. Clique sur "Procéder au paiement"
3. Système détecte le pack actif
4. Consommation automatique des crédits
5. Accès immédiat aux profils
```

**Note:** Comportement inchangé, déjà fonctionnel.

### Scénario 2: Recruteur SANS Pack Actif - Achat Direct

```
1. Recruteur ajoute des profils au panier (tous types)
2. Clique sur "Procéder au paiement"
3. Système détecte l'absence de pack
4. Sauvegarde automatique dans l'historique
5. Affichage du modal "CheckoutConfirmation"
6. Recruteur choisit "Valider la Commande"
7. Affichage des instructions Orange Money
8. Recruteur effectue le paiement
9. Confirmation du paiement
10. Création de l'achat direct
11. Redirection vers le modal de soumission de preuve
12. Admin valide sous 24h
13. Accès accordé aux profils
```

### Scénario 3: Recruteur SANS Pack - Achat de Pack

```
1. Recruteur ajoute des profils au panier
2. Clique sur "Procéder au paiement"
3. Système sauvegarde dans l'historique
4. Affichage du modal "CheckoutConfirmation"
5. Recruteur choisit "Acheter un Pack"
6. Avertissement: sélection sera annulée
7. Archivage du panier dans l'historique
8. Redirection vers le modal des packs
9. Recruteur achète un pack
10. Peut retrouver sa sélection dans l'historique
11. Ré-ajoute les profils souhaités
12. Validation avec le nouveau pack
```

### Scénario 4: Consultation de l'Historique

```
1. Recruteur clique sur "Voir l'Historique"
2. Affichage du modal d'historique
3. Filtrage disponible (tous, retirés, achetés)
4. Sélection d'un profil
5. Options:
   - Ré-ajouter au panier (si retiré)
   - Voir les détails (si acheté)
```

---

## Calcul des Prix

### Prix Unitaires par Défaut

```javascript
Junior (< 3 ans):        7 500 GNF
Intermédiaire (3-5 ans): 10 000 GNF
Senior (6+ ans):         20 000 GNF
```

### Exemple de Calcul

**Panier:**
- 2 profils Junior (2 ans chacun)
- 3 profils Intermédiaires (4 ans chacun)
- 1 profil Senior (8 ans)

**Calcul:**
```
Juniors:        2 × 7 500  = 15 000 GNF
Intermédiaires: 3 × 10 000 = 30 000 GNF
Seniors:        1 × 20 000 = 20 000 GNF
─────────────────────────────────────
Total:                      65 000 GNF
```

**Breakdown sauvegardé:**
```json
{
  "junior": { "count": 2, "price": 15000 },
  "intermediate": { "count": 3, "price": 30000 },
  "senior": { "count": 1, "price": 20000 }
}
```

---

## Processus de Paiement Orange Money

### Étapes

1. **Affichage des Instructions**
   - Numéro Orange Money: +224 620 00 00 00
   - Montant à envoyer
   - Référence de la commande

2. **Paiement par le Recruteur**
   - Envoi via Orange Money
   - Conservation de la preuve de paiement

3. **Confirmation**
   - Clic sur "J'ai Effectué le Paiement"
   - Création de l'achat direct en base

4. **Soumission de Preuve**
   - Upload de la capture d'écran
   - Statut: "waiting_proof"

5. **Validation Admin**
   - Vérification de la preuve
   - Validation de l'achat
   - Création des accès aux profils
   - Notification au recruteur

### Référence de Paiement

Format: `DP{timestamp}{random}`

Exemple: `DP1702377600ABC12`

- **DP** = Direct Purchase
- **Timestamp** = Date/heure de création
- **Random** = Code aléatoire

---

## Validation Administrative

### Page Admin: Achats Directs

Les admins peuvent:

1. **Voir tous les achats directs en attente**
2. **Consulter les détails**
   - Profils sélectionnés
   - Montant total
   - Breakdown par niveau
   - Preuve de paiement

3. **Valider un achat**
   - Vérification de la preuve
   - Génération du code de confirmation
   - Création des accès aux profils
   - Marquage dans l'historique

4. **Rejeter un achat**
   - Motif de rejet
   - Notification au recruteur
   - Possibilité de nouvelle tentative

### Fonction RPC: `validate_direct_purchase`

```sql
SELECT validate_direct_purchase(
  p_purchase_id := 'uuid-achat',
  p_admin_id := 'uuid-admin',
  p_notes := 'Paiement vérifié'
);
```

**Résultat:**
```json
{
  "success": true,
  "purchase_id": "uuid",
  "confirmation_code": "DP12ABC456",
  "total_profiles": 6,
  "total_amount": 65000
}
```

**Actions automatiques:**
1. Mise à jour du statut de l'achat
2. Création des `profile_purchases` pour chaque profil
3. Marquage de l'historique comme converti
4. Archivage du panier actuel
5. Génération du code de confirmation

---

## Sécurité (RLS)

### profile_cart_history

```sql
-- Les recruteurs voient leur propre historique
CREATE POLICY "Recruiters can view own cart history"
  ON profile_cart_history FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Les admins voient tout
CREATE POLICY "Admins can view all cart history"
  ON profile_cart_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type = 'admin'
    )
  );
```

### direct_profile_purchases

```sql
-- Les recruteurs voient leurs propres achats
CREATE POLICY "Recruiters can view own direct purchases"
  ON direct_profile_purchases FOR SELECT
  TO authenticated
  USING (recruiter_id = auth.uid());

-- Les recruteurs peuvent créer leurs achats
CREATE POLICY "Recruiters can insert own direct purchases"
  ON direct_profile_purchases FOR INSERT
  TO authenticated
  WITH CHECK (recruiter_id = auth.uid());

-- Les admins peuvent tout voir et modifier
CREATE POLICY "Admins can update all direct purchases"
  ON direct_profile_purchases FOR UPDATE
  TO authenticated
  USING (admin check)
  WITH CHECK (admin check);
```

---

## Notifications

### Au Recruteur

**Après création de l'achat:**
```
Commande créée !
Référence: DP1702377600ABC12

Veuillez effectuer le paiement via Orange Money
et soumettre votre preuve.
```

**Après validation admin:**
```
Achat validé !
Code de confirmation: DP12ABC456

Vous avez maintenant accès à 6 profils dans la CVThèque.
```

**En cas de rejet:**
```
Achat non validé
Motif: [raison fournie par l'admin]

Veuillez vérifier votre paiement et réessayer.
```

### À l'Admin

**Nouveau paiement en attente:**
```
Nouvelle preuve de paiement à vérifier

Recruteur: [email]
Montant: 65 000 GNF
Référence: DP1702377600ABC12
```

---

## Avantages du Système

### Pour les Recruteurs

1. **Flexibilité**
   - Achat à l'unité possible
   - Pas besoin de pack pour commencer

2. **Historique**
   - Retrouver les profils consultés
   - Ne pas perdre les sélections

3. **Transparence**
   - Prix clairs dès la sélection
   - Suivi de l'état de la commande

4. **Choix éclairé**
   - Comparaison prix unitaire vs pack
   - Décision au moment du checkout

### Pour la Plateforme

1. **Conversion**
   - Réduction de l'abandon de panier
   - Incitation aux packs

2. **Traçabilité**
   - Historique complet des transactions
   - Audit trail des paiements

3. **Contrôle**
   - Validation manuelle des paiements
   - Prévention de la fraude

4. **Revenue**
   - Monétisation des achats unitaires
   - Prix optimisés par niveau

---

## Métriques à Suivre

### KPIs Principaux

1. **Taux de Conversion Checkout**
   ```
   = (Achats directs validés / Affichages CheckoutConfirmation) × 100
   ```

2. **Ratio Achat Direct vs Pack**
   ```
   Nombre d'achats directs / Nombre d'achats de packs
   ```

3. **Panier Moyen**
   ```
   Montant moyen par achat direct
   ```

4. **Taux d'Utilisation Historique**
   ```
   = (Profils ré-ajoutés depuis historique / Total profils historique) × 100
   ```

5. **Délai de Validation**
   ```
   Temps moyen entre création et validation admin
   ```

### Objectifs

- Taux de conversion checkout: **> 60%**
- Délai moyen de validation: **< 12h**
- Taux d'utilisation historique: **> 20%**
- Ratio direct/pack: **1:3** (inciter aux packs)

---

## Maintenance et Support

### Tâches Admin Quotidiennes

1. **Vérifier les achats en attente**
   ```sql
   SELECT * FROM direct_profile_purchases
   WHERE purchase_status = 'pending'
   AND payment_status = 'waiting_proof'
   ORDER BY created_at ASC;
   ```

2. **Valider les paiements**
   - Vérifier les preuves de paiement
   - Valider via l'interface admin
   - Notifier les recruteurs

3. **Gérer les litiges**
   - Paiements non reçus
   - Montants incorrects
   - Références manquantes

### Support WhatsApp

Numéro: +224 620 00 00 00

**Messages types:**

**Après paiement:**
```
Bonjour, j'ai effectué le paiement pour la référence DP1702377600ABC12.
Montant: 65 000 GNF
```

**Problème de paiement:**
```
Bonjour, j'ai un problème avec mon paiement.
Référence: DP1702377600ABC12
[Description du problème]
```

---

## Tests Recommandés

### Test 1: Achat Direct Complet

```
1. Connexion recruteur sans pack
2. Ajout de 3 profils au panier (mix de niveaux)
3. Clic sur "Procéder au paiement"
4. Vérifier affichage CheckoutConfirmation
5. Choisir "Valider la Commande"
6. Vérifier instructions Orange Money
7. Confirmer le paiement
8. Vérifier création dans direct_profile_purchases
9. Vérifier sauvegarde dans profile_cart_history
10. Admin valide l'achat
11. Vérifier création des profile_purchases
12. Vérifier accès aux profils
```

### Test 2: Achat de Pack avec Archivage

```
1. Recruteur ajoute profils au panier
2. Clic sur "Procéder au paiement"
3. Choisir "Acheter un Pack"
4. Vérifier avertissement d'annulation
5. Confirmer
6. Vérifier archivage dans historique
7. Acheter un pack
8. Ouvrir l'historique
9. Retrouver les profils archivés
10. Ré-ajouter au panier
11. Valider avec le pack
```

### Test 3: Historique

```
1. Ajouter plusieurs profils au panier
2. Retirer certains profils
3. Ouvrir l'historique
4. Vérifier filtres (tous, retirés, achetés)
5. Ré-ajouter un profil retiré
6. Vérifier mise à jour du panier
```

### Test 4: Annulation

```
1. Créer un achat direct
2. Annuler avant validation
3. Vérifier statut cancelled
4. Vérifier historique mis à jour
```

---

## Améliorations Futures

### Phase 2

1. **Paiement en ligne**
   - Intégration API Orange Money
   - Paiement instantané sans preuve manuelle

2. **Notifications automatiques**
   - Email après création d'achat
   - SMS après validation

3. **Remboursements**
   - Workflow de remboursement
   - Suivi des remboursements

4. **Analytics avancées**
   - Dashboard admin complet
   - Rapports de ventes
   - Prévisions

### Phase 3

1. **Favoris**
   - Marquer des profils favoris
   - Liste de souhaits persistante

2. **Recommandations**
   - Profils similaires
   - Basé sur l'historique

3. **Alertes**
   - Nouveaux profils correspondants
   - Baisse de prix

---

## Conclusion

Ce système offre une flexibilité maximale aux recruteurs tout en maintenant un contrôle qualité via la validation administrative. L'historique du panier assure qu'aucune sélection n'est perdue, et le workflow de checkout guide clairement vers la meilleure option économique.

Le système est évolutif et peut être amélioré progressivement avec les retours utilisateurs.

---

**Dernière mise à jour:** 12 Décembre 2024
**Version:** 1.0
**Statut:** ✅ Actif en Production
