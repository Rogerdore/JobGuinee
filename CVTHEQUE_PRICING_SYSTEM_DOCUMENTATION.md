# Système de Tarification CVThèque - Documentation Complète

## Vue d'ensemble

Le système de tarification CVThèque est une solution complète, professionnelle et **totalement indépendante des services IA**, permettant aux recruteurs et entreprises d'acheter des packs d'accès à la base de données de CV.

**Caractéristiques principales** :
- 3 types de packs mono-niveau (Junior, Intermédiaire, Senior)
- 3 packs mixtes (Mix 20, 50, 100)
- 2 packs entreprise (Basic, Silver)
- 1 abonnement GOLD (validation admin obligatoire)
- Système de paiement Orange Money intégré
- Interface admin complète
- Aucun lien avec le système IA

## Architecture

### Base de données

#### Table `cvtheque_pricing_packs`

Stocke tous les packs disponibles pour la CVThèque.

```sql
CREATE TABLE cvtheque_pricing_packs (
  id uuid PRIMARY KEY,
  pack_name text NOT NULL UNIQUE,
  pack_type text CHECK (pack_type IN ('junior', 'intermediate', 'senior', 'mixed', 'enterprise', 'gold')),
  total_profiles integer CHECK (total_profiles > 0),
  price_gnf numeric CHECK (price_gnf > 0),
  description text,
  features jsonb,
  is_active boolean DEFAULT true,
  order_index integer DEFAULT 0,
  experience_level text,
  mix_composition jsonb,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Colonnes importantes** :
- `pack_type` : Type de pack (junior/intermediate/senior/mixed/enterprise/gold)
- `experience_level` : Niveau d'expérience pour packs mono-niveau
- `mix_composition` : Composition pour packs mixtes (ex: `{"junior": 8, "intermediate": 8, "senior": 4}`)
- `is_active` : Active/désactive le pack
- `order_index` : Ordre d'affichage

**Sécurité RLS** :
- ✅ Tous les utilisateurs authentifiés voient les packs actifs

#### Table `enterprise_subscriptions`

Gère les abonnements entreprises (Basic, Silver, GOLD).

```sql
CREATE TABLE enterprise_subscriptions (
  id uuid PRIMARY KEY,
  company_id uuid REFERENCES companies(id),
  profile_id uuid REFERENCES profiles(id),
  subscription_type text CHECK (subscription_type IN ('basic', 'silver', 'gold')),
  price_gnf numeric,
  status text CHECK (status IN ('pending', 'active', 'rejected', 'expired', 'cancelled')),
  requires_validation boolean DEFAULT false,
  approved_by uuid,
  approval_notes text,
  approved_at timestamptz,
  rejection_reason text,
  payment_method text,
  payment_reference text UNIQUE,
  payment_status text,
  payment_proof_url text,
  start_date timestamptz,
  end_date timestamptz,
  monthly_cv_quota integer,
  cv_consumed integer DEFAULT 0,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Colonnes importantes** :
- `requires_validation` : TRUE pour GOLD, FALSE pour Basic/Silver
- `monthly_cv_quota` : Nombre de CV/mois (NULL = illimité pour GOLD)
- `cv_consumed` : Nombre de CV consommés dans le mois
- `approved_by` : Admin qui a validé (pour GOLD)

**Sécurité RLS** :
- ✅ Utilisateurs voient leurs propres abonnements
- ✅ Utilisateurs créent/modifient leurs abonnements

#### Table `cvtheque_pack_purchases`

Suivi des achats de packs par les recruteurs.

```sql
CREATE TABLE cvtheque_pack_purchases (
  id uuid PRIMARY KEY,
  buyer_id uuid REFERENCES profiles(id),
  pack_id uuid REFERENCES cvtheque_pricing_packs(id),
  pack_name text,
  pack_type text,
  total_profiles integer,
  price_paid numeric,
  profiles_remaining integer,
  profiles_consumed integer DEFAULT 0,
  payment_method text,
  payment_reference text UNIQUE,
  payment_status text,
  payment_proof_url text,
  purchase_status text CHECK (purchase_status IN ('pending', 'active', 'expired', 'cancelled')),
  activated_at timestamptz,
  expires_at timestamptz,
  admin_notes text,
  created_at timestamptz,
  updated_at timestamptz
);
```

**Colonnes importantes** :
- `profiles_remaining` : Crédits CV restants
- `profiles_consumed` : Crédits CV consommés
- `purchase_status` : pending → active (après validation paiement)

**Sécurité RLS** :
- ✅ Acheteurs voient leurs propres achats

#### Modifications tables existantes

**Table `profiles`** :
```sql
ALTER TABLE profiles ADD COLUMN cvtheque_credits integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN gold_active boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN gold_expiration timestamptz;
```

**Table `companies`** :
```sql
ALTER TABLE companies ADD COLUMN current_subscription text;
ALTER TABLE companies ADD COLUMN subscription_expiration timestamptz;
```

### Fonctions SQL

#### `consume_cvtheque_pack_credit()`

Consomme un crédit CV d'un pack actif.

```sql
SELECT consume_cvtheque_pack_credit(
  'buyer_user_id',
  'candidate_profile_id'
);
```

**Logique** :
1. Recherche un pack actif avec crédits restants
2. Décrémente `profiles_remaining`
3. Incrémente `profiles_consumed`
4. Crée une entrée dans `profile_purchases`
5. Retourne TRUE si succès, FALSE si pas de crédit

#### `auto_expire_enterprise_subscriptions()`

Expire automatiquement les abonnements arrivés à terme.

```sql
SELECT auto_expire_enterprise_subscriptions();
```

**À exécuter via cron quotidien** : Met à jour les statuts et tables companies.

## Tarification Officielle

### Packs Mono-Niveau

#### Junior (0-2 ans d'expérience)

| Pack | Profils | Prix (GNF) | Prix unitaire |
|------|---------|-----------|---------------|
| Junior 20 | 20 | 150,000 | 7,500 |
| Junior 50 | 50 | 300,000 | 6,000 |

#### Intermédiaire (3-5 ans d'expérience)

| Pack | Profils | Prix (GNF) | Prix unitaire |
|------|---------|-----------|---------------|
| Intermédiaire 20 | 20 | 200,000 | 10,000 |
| Intermédiaire 50 | 50 | 460,000 | 9,200 |

#### Senior (6+ ans d'expérience)

| Pack | Profils | Prix (GNF) | Prix unitaire |
|------|---------|-----------|---------------|
| Senior 20 | 20 | 400,000 | 20,000 |
| Senior 50 | 50 | 890,000 | 17,800 |

### Packs Mixtes

| Pack | Total | Junior | Intermédiaire | Senior | Prix (GNF) |
|------|-------|--------|---------------|--------|-----------|
| Mix 20 | 20 | 8 | 8 | 4 | 220,000 |
| Mix 50 | 50 | 20 | 20 | 10 | 550,000 |
| Mix 100 | 100 | 40 | 40 | 20 | 1,050,000 |

### Packs Entreprise

#### Basic Entreprise
- **Prix** : 1,200,000 GNF/mois
- **Quota** : 60 profils/mois (tous niveaux)
- **Activation** : Automatique après paiement
- **Fonctionnalités** :
  - Accès complet aux coordonnées
  - Support prioritaire
  - Statistiques de base

#### Silver Entreprise
- **Prix** : 2,800,000 GNF/mois
- **Quota** : 150 profils/mois (tous niveaux)
- **Activation** : Automatique après paiement
- **Fonctionnalités** :
  - Accès complet aux coordonnées
  - Support prioritaire
  - Statistiques avancées
  - Multi-utilisateurs

#### GOLD Entreprise (Validation obligatoire)
- **Prix** : 10,000,000 GNF/mois
- **Quota** : **ILLIMITÉ**
- **Activation** : **Validation manuelle par admin requise**
- **Workflow** :
  1. Demande soumise par l'entreprise
  2. Status: `pending`
  3. Admin examine et valide/rejette
  4. Si validé → Status: `active`, accès illimité
  5. Si rejeté → Status: `rejected`, raison fournie
- **Fonctionnalités** :
  - Accès ILLIMITÉ à toute la CVThèque
  - Support VIP 24/7
  - Statistiques avancées et analytics
  - API dédiée
  - Multi-utilisateurs
  - Gestionnaire de compte dédié

## Services

### `cvthequePricingService.ts`

Service principal pour gérer les packs, achats et abonnements.

#### Méthodes Packs

```typescript
// Récupérer tous les packs actifs
getAllPacks(): Promise<CVThequePack[]>

// Récupérer un pack par ID
getPackById(packId: string): Promise<CVThequePack | null>

// Récupérer packs par type
getPacksByType(packType: string): Promise<CVThequePack[]>
```

#### Méthodes Achats

```typescript
// Acheter un pack
purchasePack(buyerId: string, packId: string, paymentProofUrl?: string): Promise<PackPurchase>

// Récupérer les packs d'un utilisateur
getUserPacks(userId: string): Promise<PackPurchase[]>

// Récupérer les packs actifs
getActivePacks(userId: string): Promise<PackPurchase[]>

// Consommer un crédit CV
consumePackCredit(buyerId: string, candidateId: string): Promise<boolean>
```

#### Méthodes Abonnements

```typescript
// Créer un abonnement entreprise
createEnterpriseSubscription(
  companyId: string,
  profileId: string,
  subscriptionType: 'basic' | 'silver' | 'gold',
  paymentProofUrl?: string
): Promise<EnterpriseSubscription>

// Vérifier si GOLD actif
isGoldActive(profileId: string): Promise<boolean>

// Vérifier si crédits disponibles
hasAvailableCredits(profileId: string): Promise<boolean>
```

#### Méthodes Admin

```typescript
// Mettre à jour un pack
updatePack(packId: string, updates: Partial<CVThequePack>): Promise<CVThequePack>

// Approuver un abonnement GOLD
approveSubscription(subscriptionId: string, adminId: string, notes?: string): Promise<EnterpriseSubscription>

// Rejeter un abonnement
rejectSubscription(subscriptionId: string, reason: string): Promise<EnterpriseSubscription>

// Activer un achat de pack
activatePackPurchase(purchaseId: string): Promise<PackPurchase>
```

## Composants

### `CVThequePacksModal.tsx`

Modal d'achat de packs pour les recruteurs.

**Props** :
```typescript
interface CVThequePacksModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}
```

**Fonctionnalités** :
- ✅ Affichage des packs par catégorie (Mono-Niveau, Mixtes, Entreprise)
- ✅ Filtrage par onglets
- ✅ Badge "VALIDATION OBLIGATOIRE" pour GOLD
- ✅ Intégration paiement Orange Money
- ✅ Upload preuve de paiement

**Utilisation** :
```typescript
import CVThequePacksModal from '../components/cvtheque/CVThequePacksModal';

<CVThequePacksModal
  userId={profile.id}
  onClose={() => setShowPacks(false)}
  onSuccess={loadData}
/>
```

## Pages Admin

### `AdminCVThequePricing.tsx`

Page de gestion des tarifs CVThèque.

**Fonctionnalités** :
- ✅ Liste de tous les packs
- ✅ Modification des prix
- ✅ Modification du nombre de profils
- ✅ Modification de la description
- ✅ Activation/Désactivation des packs
- ✅ Changement de l'ordre d'affichage

**Navigation** : `/admin-cvtheque-pricing`

### `AdminEnterpriseSubscriptions.tsx`

Page de gestion des abonnements entreprises.

**Fonctionnalités** :
- ✅ Liste de tous les abonnements
- ✅ Filtres (Tous, En attente, Actifs, Rejetés)
- ✅ **Validation des demandes GOLD**
- ✅ Rejet avec raison
- ✅ Visualisation preuve de paiement
- ✅ Affichage détaillé de chaque abonnement

**Navigation** : `/admin-enterprise-subscriptions`

**Actions disponibles** :
- ✅ Approuver un abonnement GOLD (avec notes)
- ✅ Rejeter un abonnement (avec raison)
- ✅ Voir historique complet

## Workflows

### Achat Pack Standard (Junior, Intermédiaire, Senior, Mixte)

```
1. Recruteur browse CVThèque
   ↓
2. Clique "Acheter un pack"
   ↓
3. Sélectionne un pack (ex: Intermédiaire 20)
   ↓
4. Modal paiement Orange Money s'affiche
   ↓
5. Effectue paiement OM
   ↓
6. Upload preuve de paiement
   ↓
7. Création cvtheque_pack_purchases
   - Status: 'pending'
   - Payment_status: 'waiting_proof'
   ↓
8. Admin valide le paiement
   ↓
9. Status → 'active', Payment_status → 'completed'
   ↓
10. Recruteur reçoit crédits CV
    - profiles_remaining: 20
    ↓
11. Chaque téléchargement CV décrémente
    ↓
12. Function consume_cvtheque_pack_credit()
    - Crée profile_purchases entry
    - profiles_remaining--
    - profiles_consumed++
```

### Abonnement Entreprise (Basic / Silver)

```
1. Entreprise accède à CVThèque
   ↓
2. Sélectionne abonnement Basic ou Silver
   ↓
3. Paiement Orange Money
   ↓
4. Création enterprise_subscriptions
   - Status: 'active' (automatique)
   - monthly_cv_quota: 60 (Basic) ou 150 (Silver)
   ↓
5. Activation immédiate
   ↓
6. Consommation mensuelle
   - cv_consumed incrémenté à chaque téléchargement
   - Limite: monthly_cv_quota
   ↓
7. Fin de mois
   - cv_consumed reset à 0
   ↓
8. Expiration (30 jours)
   - auto_expire_enterprise_subscriptions()
   - Status → 'expired'
```

### Abonnement GOLD (Validation obligatoire)

```
1. Entreprise demande abonnement GOLD
   ↓
2. Création enterprise_subscriptions
   - Status: 'pending'
   - requires_validation: true
   - monthly_cv_quota: NULL (illimité)
   ↓
3. Entreprise effectue paiement OM
   ↓
4. Upload preuve de paiement
   - payment_status: 'waiting_proof'
   ↓
5. Admin voit dans /admin-enterprise-subscriptions
   - Badge "VALIDATION REQUISE"
   ↓
6. Admin examine la demande
   ↓
7a. APPROBATION
    - Admin clique "Approuver"
    - Saisit notes (optionnel)
    - approveSubscription() appelée
      * Status → 'active'
      * approved_by = admin_id
      * approved_at = now()
      * start_date = now()
      * end_date = now() + 30 jours
    - Entreprise reçoit accès ILLIMITÉ
    ↓
7b. REJET
    - Admin clique "Rejeter"
    - Saisit raison obligatoire
    - rejectSubscription() appelée
      * Status → 'rejected'
      * rejection_reason = raison fournie
    - Entreprise notifiée
    ↓
8. Si approuvé, utilisation illimitée
   - hasAvailableCredits() → toujours TRUE
   - isGoldActive() → TRUE
   - Aucune limite de téléchargements
   ↓
9. Expiration après 30 jours
   - auto_expire_enterprise_subscriptions()
   - Status → 'expired'
   - gold_active → false
```

## Intégration avec CVThèque existante

### Dans `CVTheque.tsx`

**Afficher le bouton "Acheter un pack"** :

```typescript
import CVThequePacksModal from '../components/cvtheque/CVThequePacksModal';
import { cvthequePricingService } from '../services/cvthequePricingService';

const [showPacksModal, setShowPacksModal] = useState(false);
const [hasCredits, setHasCredits] = useState(false);

useEffect(() => {
  checkCredits();
}, [profile]);

const checkCredits = async () => {
  if (!profile?.id) return;
  const available = await cvthequePricingService.hasAvailableCredits(profile.id);
  setHasCredits(available);
};

// Dans le render
{!hasCredits && (
  <button onClick={() => setShowPacksModal(true)}>
    Acheter un pack
  </button>
)}

{showPacksModal && (
  <CVThequePacksModal
    userId={profile.id}
    onClose={() => setShowPacksModal(false)}
    onSuccess={checkCredits}
  />
)}
```

**Lors du téléchargement d'un CV** :

```typescript
const handleDownloadCV = async (candidateId: string) => {
  // Vérifier si GOLD actif
  const isGold = await cvthequePricingService.isGoldActive(profile.id);

  if (isGold) {
    // Accès illimité - téléchargement direct
    downloadCV(candidateId);
    return;
  }

  // Consommer un crédit de pack
  const consumed = await cvthequePricingService.consumePackCredit(profile.id, candidateId);

  if (consumed) {
    downloadCV(candidateId);
  } else {
    alert('Vous n\'avez plus de crédits. Achetez un pack !');
    setShowPacksModal(true);
  }
};
```

**Afficher le badge GOLD** :

```typescript
const [isGoldActive, setIsGoldActive] = useState(false);

useEffect(() => {
  checkGold();
}, [profile]);

const checkGold = async () => {
  if (!profile?.id) return;
  const gold = await cvthequePricingService.isGoldActive(profile.id);
  setIsGoldActive(gold);
};

// Dans le header
{isGoldActive && (
  <div className="flex items-center space-x-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full">
    <Crown className="w-5 h-5" />
    <span className="font-bold">Accès GOLD Illimité</span>
  </div>
)}
```

## Admin - Guide d'utilisation

### Gérer les packs (AdminCVThequePricing)

**Modifier un pack** :
1. Accéder à `/admin-cvtheque-pricing`
2. Localiser le pack à modifier
3. Cliquer "Modifier"
4. Changer Prix, Nombre de profils, Description, Ordre
5. Cliquer "Enregistrer"

**Activer/Désactiver un pack** :
1. Cliquer sur le bouton "Activer" / "Désactiver"
2. Pack désactivé → invisible pour les recruteurs

**Ordre d'affichage** :
- Plus l'`order_index` est petit, plus le pack apparaît en premier
- Recommandé : 1, 2, 3, 4...

### Gérer les abonnements (AdminEnterpriseSubscriptions)

**Valider une demande GOLD** :
1. Accéder à `/admin-enterprise-subscriptions`
2. Filtrer par "En attente"
3. Localiser la demande GOLD (badge "VALIDATION REQUISE")
4. Vérifier :
   - Nom de l'entreprise
   - Contact
   - Preuve de paiement (cliquer sur le lien)
5. Cliquer "Approuver"
6. Saisir notes d'approbation (optionnel)
7. Confirmer
8. L'abonnement devient actif pour 30 jours

**Rejeter une demande** :
1. Localiser la demande
2. Cliquer "Rejeter"
3. Saisir raison obligatoire (ex: "Paiement incomplet", "Informations invalides")
4. Confirmer
5. L'entreprise sera notifiée

**Suivi des abonnements actifs** :
- Filtrer par "Actifs"
- Voir consommation CV (cv_consumed / monthly_cv_quota)
- Vérifier date d'expiration

## Maintenance

### Tâches périodiques

**Quotidien** :
```sql
-- Expirer les abonnements
SELECT auto_expire_enterprise_subscriptions();
```

**Hebdomadaire** :
- Vérifier les demandes GOLD en attente
- Valider les paiements en attente
- Analyser les statistiques de vente

**Mensuel** :
- Renouvellement automatique des abonnements (à implémenter)
- Rapport de revenus par type de pack
- Analyse tendances d'achat

### Monitoring

**Métriques clés** :
```sql
-- Nombre de packs actifs vendus
SELECT COUNT(*) FROM cvtheque_pack_purchases WHERE purchase_status = 'active';

-- Abonnements GOLD actifs
SELECT COUNT(*) FROM enterprise_subscriptions WHERE subscription_type = 'gold' AND status = 'active';

-- Revenus mensuels
SELECT SUM(price_paid) FROM cvtheque_pack_purchases WHERE created_at >= date_trunc('month', now());

-- Consommation moyenne par type de pack
SELECT pack_type, AVG(profiles_consumed) FROM cvtheque_pack_purchases GROUP BY pack_type;
```

## Sécurité

### Row Level Security (RLS)

**Toutes les tables ont RLS activé** :
- ✅ cvtheque_pricing_packs : Lecture publique (packs actifs uniquement)
- ✅ enterprise_subscriptions : Utilisateurs voient leurs abonnements
- ✅ cvtheque_pack_purchases : Acheteurs voient leurs achats

### Validation

**Contraintes CHECK** :
- Prix > 0
- Total profils > 0
- Statuts valides uniquement
- Crédits consommés >= 0

### Anti-fraude

**Protections** :
- ✅ payment_reference UNIQUE : Pas de duplication paiement
- ✅ GOLD validation obligatoire : Admin doit approuver
- ✅ RLS strict : Utilisateurs isolés
- ✅ Fonction consume_credit atomique : Pas de race conditions

## Différences avec le système IA

| Aspect | CVThèque Pricing | Services IA |
|--------|------------------|-------------|
| **Objectif** | Acheter accès aux CV | Utiliser services IA |
| **Monnaie** | Packs de CV | Crédits IA |
| **Tables** | cvtheque_pricing_packs, enterprise_subscriptions | ia_service_config, credit_purchases |
| **Validation** | GOLD nécessite validation admin | Automatique |
| **Expiration** | 30 jours pour abonnements | Crédits IA jamais expirés |
| **Illimité** | GOLD uniquement | Premium PRO+ (désactivé) |
| **Paiement** | Orange Money | Orange Money |

**IMPORTANT** : Les deux systèmes sont **totalement indépendants**. Aucun croisement, aucune dépendance.

## API Endpoints (Suggérés)

### Packs

```
GET    /api/cvtheque/packs                   # Liste packs actifs
GET    /api/cvtheque/packs/:id               # Détails pack
POST   /api/cvtheque/packs/:id/purchase      # Acheter pack
```

### Abonnements

```
POST   /api/cvtheque/subscriptions           # Créer abonnement
GET    /api/cvtheque/subscriptions/active    # Abonnement actif
POST   /api/cvtheque/subscriptions/:id/consume # Consommer crédit
```

### Admin

```
GET    /api/admin/cvtheque/packs             # Tous les packs
PUT    /api/admin/cvtheque/packs/:id         # Modifier pack
POST   /api/admin/subscriptions/:id/approve  # Approuver GOLD
POST   /api/admin/subscriptions/:id/reject   # Rejeter GOLD
```

## Tests recommandés

### Tests unitaires

```typescript
describe('cvthequePricingService', () => {
  it('should get all active packs');
  it('should purchase pack successfully');
  it('should consume credit correctly');
  it('should detect GOLD active');
  it('should approve GOLD subscription');
});
```

### Tests d'intégration

```typescript
describe('CVTheque Pricing Workflow', () => {
  it('should complete pack purchase workflow');
  it('should validate GOLD subscription workflow');
  it('should expire subscriptions automatically');
  it('should prevent overdraft credits');
});
```

## Évolutions futures

### Phase 2
- [ ] Renouvellement automatique abonnements
- [ ] Packs personnalisés (sur demande)
- [ ] Système de remises/promotions
- [ ] Facturation automatique

### Phase 3
- [ ] Paiement par carte bancaire
- [ ] Abonnements trimestriels/annuels
- [ ] Programme fidélité
- [ ] API publique pour intégrations

### Phase 4
- [ ] Analytics avancés recruteurs
- [ ] Recommandations packs IA-driven
- [ ] Pack famille (plusieurs entreprises)
- [ ] Crédits reportables

## Support & Contact

**Pour les recruteurs** :
- Documentation : https://jobguinee.com/docs/cvtheque-pricing
- Support : support@jobguinee.com
- WhatsApp : +224 XXX XXX XXX

**Pour les admins** :
- Guide admin : Voir section "Admin - Guide d'utilisation"
- Escalade : admin@jobguinee.com

---

**Version** : 1.0.0
**Dernière mise à jour** : Décembre 2024
**Auteur** : Équipe JobGuinée
**License** : Propriétaire