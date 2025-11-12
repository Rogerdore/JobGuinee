## 🪙 Système de Gestion des Crédits Premium - Guide Complet

### 📋 Vue d'Ensemble

Le système de gestion des crédits premium est un système complet et configurable qui permet:
- ✅ Configuration des packages de crédits avec tarifs
- ✅ Configuration des coûts par service
- ✅ Achat et recharge de crédits
- ✅ Consommation automatique lors de l'utilisation
- ✅ Historique complet des transactions
- ✅ Tableau de bord admin et utilisateur

---

## 🗄️ Architecture Base de Données

### 1. Table: `credit_packages`

**Packages de crédits disponibles à l'achat (configurable par admin)**

```sql
CREATE TABLE credit_packages (
  id uuid PRIMARY KEY,
  name text NOT NULL,                    -- Ex: "Starter", "Pro"
  description text,                       -- Description marketing
  credits_amount integer NOT NULL,        -- Nombre de crédits
  price_amount decimal(10,2) NOT NULL,    -- Prix en GNF
  currency text DEFAULT 'GNF',            -- Devise
  bonus_credits integer DEFAULT 0,        -- Crédits bonus
  is_popular boolean DEFAULT false,       -- Badge "Populaire"
  is_active boolean DEFAULT true,         -- Actif/Inactif
  display_order integer DEFAULT 0,        -- Ordre d'affichage
  created_at timestamptz,
  updated_at timestamptz
);
```

**Packages par défaut insérés:**

| Package | Crédits | Prix (GNF) | Bonus | Total |
|---------|---------|------------|-------|-------|
| Starter | 100 | 50,000 | 0 | 100 |
| Basic | 500 | 200,000 | 50 | 550 |
| Pro | 1,500 | 500,000 | 200 | 1,700 |
| Premium | 3,000 | 900,000 | 500 | 3,500 |
| Ultimate | 5,000 | 1,400,000 | 1,000 | 6,000 |

### 2. Table: `service_credit_costs`

**Coût en crédits de chaque service (configurable par admin)**

```sql
CREATE TABLE service_credit_costs (
  id uuid PRIMARY KEY,
  service_code text UNIQUE NOT NULL,      -- Code unique du service
  service_name text NOT NULL,             -- Nom d'affichage
  service_description text,               -- Description
  credits_cost integer NOT NULL,          -- Coût en crédits
  is_active boolean DEFAULT true,         -- Actif/Inactif
  category text,                          -- Catégorie
  created_at timestamptz,
  updated_at timestamptz
);
```

**Services par défaut:**

| Service | Code | Crédits | Catégorie |
|---------|------|---------|-----------|
| Analyse IA de Profil | `profile_analysis` | 0 | IA & Analyse |
| Génération CV IA | `cv_generation` | 50 | Documents |
| Génération Lettre IA | `cover_letter_generation` | 30 | Documents |
| Matching IA Emplois | `job_matching` | 20 | IA & Analyse |
| Coaching Entretien IA | `interview_coaching` | 100 | Formation |
| Boost Visibilité Profil | `profile_visibility_boost` | 200 | Visibilité |
| Candidature Prioritaire | `featured_application` | 50 | Candidature |
| Message Direct Recruteur | `direct_message_recruiter` | 30 | Communication |
| Accès Infos Contact | `access_contact_info` | 40 | Communication |
| Candidatures Illimitées (30j) | `unlimited_applications` | 300 | Candidature |

### 3. Table: `user_credit_balances`

**Soldes de crédits par utilisateur**

```sql
CREATE TABLE user_credit_balances (
  id uuid PRIMARY KEY,
  user_id uuid UNIQUE NOT NULL,           -- Utilisateur
  total_credits integer DEFAULT 0,        -- Solde actuel
  credits_purchased integer DEFAULT 0,    -- Total acheté
  credits_bonus integer DEFAULT 0,        -- Total bonus
  credits_used integer DEFAULT 0,         -- Total utilisé
  last_purchase_at timestamptz,           -- Dernier achat
  created_at timestamptz,
  updated_at timestamptz
);
```

**Exemple de solde:**
```json
{
  "user_id": "uuid",
  "total_credits": 450,
  "credits_purchased": 500,
  "credits_bonus": 50,
  "credits_used": 100
}
```

### 4. Table: `credit_transactions`

**Historique complet des transactions**

```sql
CREATE TABLE credit_transactions (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  transaction_type text NOT NULL,         -- purchase, usage, bonus, refund, admin_adjustment
  credits_amount integer NOT NULL,        -- Montant (+ ou -)
  service_code text,                      -- Si usage
  package_id uuid,                        -- Si achat
  price_paid decimal(10,2),               -- Prix payé
  currency text DEFAULT 'GNF',
  description text,
  metadata jsonb,                         -- Données additionnelles
  balance_before integer NOT NULL,        -- Solde avant
  balance_after integer NOT NULL,         -- Solde après
  created_at timestamptz
);
```

**Types de transactions:**
- `purchase`: Achat de package
- `usage`: Utilisation pour un service
- `bonus`: Crédit bonus ajouté
- `refund`: Remboursement
- `admin_adjustment`: Ajustement administrateur

---

## ⚙️ Fonctions SQL

### 1. `get_user_credit_balance(user_id)`

**Récupère le solde actuel d'un utilisateur**

```sql
SELECT get_user_credit_balance('user-uuid');
-- Retourne: 450 (integer)
```

**Comportement:**
- Retourne le solde actuel
- Crée le solde à 0 s'il n'existe pas

### 2. `purchase_credit_package(user_id, package_id, payment_method)`

**Achète un package de crédits**

```sql
SELECT purchase_credit_package(
  'user-uuid',
  'package-uuid',
  'mobile_money'
);
```

**Retour:**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "credits_added": 550,
  "new_balance": 550,
  "package_name": "Basic"
}
```

**Processus:**
1. Vérifie que le package existe et est actif
2. Récupère le solde actuel
3. Ajoute crédits + bonus
4. Met à jour le solde
5. Crée la transaction d'achat
6. Retourne le résultat

### 3. `use_credits_for_service(user_id, service_code, metadata)`

**Utilise des crédits pour un service**

```sql
SELECT use_credits_for_service(
  'user-uuid',
  'cv_generation',
  '{"job_id": "uuid"}'::jsonb
);
```

**Retour si succès:**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "credits_used": 50,
  "new_balance": 500,
  "service_name": "Génération CV IA"
}
```

**Retour si échec:**
```json
{
  "success": false,
  "error": "insufficient_credits",
  "message": "Crédits insuffisants",
  "required_credits": 50,
  "available_credits": 30
}
```

**Processus:**
1. Vérifie que le service existe et est actif
2. Récupère le solde actuel
3. Vérifie si assez de crédits
4. Déduit les crédits
5. Met à jour le solde
6. Crée la transaction d'usage
7. Retourne le résultat

---

## 🎛️ Panel Admin - Configuration

### Interface de Gestion

**Accès:** Dashboard Admin → Gestion des Crédits

**Sections:**
1. **Statistiques**
2. **Packages de Crédits**
3. **Coûts des Services**

### 1. Statistiques Globales

**Métriques affichées:**

```
┌─────────────────────────────────────┐
│  👥 Utilisateurs avec crédits       │
│  250                                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  🪙 Crédits en circulation          │
│  125,450                            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  💰 Revenu total (GNF)              │
│  45,000,000                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  📊 Transactions totales            │
│  1,847                              │
└─────────────────────────────────────┘
```

### 2. Gestion des Packages

**Liste des packages:**

```
┌────────────────────────────────────────────┐
│  PACKAGES DE CRÉDITS    [+ Nouveau]        │
├────────────────────────────────────────────┤
│                                            │
│  ┌──────────────────────────────────┐     │
│  │ Pro                    [Populaire]│     │
│  │ Pack professionnel pour actifs   │     │
│  │                                   │     │
│  │ Crédits: 1,500                    │     │
│  │ Bonus: +200                       │     │
│  │ Prix: 500,000 GNF                 │     │
│  │                                   │     │
│  │ Statut: Actif                     │     │
│  │ [✏️ Modifier] [🗑️ Supprimer]     │     │
│  └──────────────────────────────────┘     │
│                                            │
└────────────────────────────────────────────┘
```

**Formulaire de création/modification:**

```
┌────────────────────────────────────────────┐
│  NOUVEAU PACKAGE                      [X]  │
├────────────────────────────────────────────┤
│  Nom: [____________________________]       │
│                                            │
│  Description:                              │
│  [________________________________]        │
│  [________________________________]        │
│                                            │
│  Crédits: [_______]  Bonus: [_______]     │
│                                            │
│  Prix (GNF): [__________]  Ordre: [___]   │
│                                            │
│  ☐ Populaire    ☑ Actif                   │
│                                            │
│  [Annuler]  [💾 Enregistrer]              │
└────────────────────────────────────────────┘
```

**Champs:**
- Nom (text, requis)
- Description (textarea)
- Crédits (number, requis)
- Bonus (number, default 0)
- Prix (decimal, requis)
- Devise (select, default GNF)
- Ordre d'affichage (number)
- Populaire (checkbox)
- Actif (checkbox)

### 3. Gestion des Coûts Services

**Tableau des services:**

```
┌────────────────────────────────────────────────────────────────────────┐
│  COÛTS DES SERVICES                              [+ Nouveau]           │
├────────────────────────────────────────────────────────────────────────┤
│  Service             │ Code              │ Catégorie  │ Coût │ Statut │
├──────────────────────┼───────────────────┼────────────┼──────┼────────┤
│  Génération CV IA    │ cv_generation     │ Documents  │ 50⚡ │ Actif  │
│  Créer un CV pro...  │                   │            │      │ [✏️]   │
├──────────────────────┼───────────────────┼────────────┼──────┼────────┤
│  Génération Lettre   │ cover_letter_...  │ Documents  │ 30⚡ │ Actif  │
│  Lettre de motiv...  │                   │            │      │ [✏️]   │
├──────────────────────┼───────────────────┼────────────┼──────┼────────┤
│  Coaching Entretien  │ interview_coaching│ Formation  │ 100⚡│ Actif  │
│  Préparation aux...  │                   │            │      │ [✏️]   │
└────────────────────────────────────────────────────────────────────────┘
```

**Formulaire de modification:**

```
┌────────────────────────────────────────────┐
│  MODIFIER SERVICE                     [X]  │
├────────────────────────────────────────────┤
│  Code Service (non modifiable):            │
│  [cv_generation]                           │
│                                            │
│  Nom du Service:                           │
│  [Génération CV IA______________]          │
│                                            │
│  Description:                              │
│  [________________________________]        │
│  [________________________________]        │
│                                            │
│  Coût (crédits): [50___]                   │
│                                            │
│  Catégorie: [Documents ▼]                  │
│                                            │
│  ☑ Service actif                           │
│                                            │
│  [Annuler]  [💾 Enregistrer]              │
└────────────────────────────────────────────┘
```

**Catégories disponibles:**
- IA & Analyse
- Documents
- Formation
- Visibilité
- Candidature
- Communication
- Autre

---

## 💳 Interface Utilisateur - Achat de Crédits

### Page d'Achat

**Affichage des packages:**

```
┌──────────────────────────────────────────────────────┐
│  ACHETER DES CRÉDITS                                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐            │
│  │ Starter │  │  Basic  │  │   Pro    │  [Populaire]│
│  │         │  │         │  │          │            │
│  │  100    │  │   500   │  │  1,500   │            │
│  │ crédits │  │ crédits │  │ crédits  │            │
│  │         │  │  +50    │  │  +200    │            │
│  │         │  │ BONUS   │  │  BONUS   │            │
│  │         │  │         │  │          │            │
│  │ 50,000  │  │ 200,000 │  │ 500,000  │            │
│  │  GNF    │  │   GNF   │  │   GNF    │            │
│  │         │  │         │  │          │            │
│  │[Acheter]│  │[Acheter]│  │ [Acheter]│            │
│  └─────────┘  └─────────┘  └──────────┘            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### Modal de Paiement

```
┌────────────────────────────────────────┐
│  CONFIRMER L'ACHAT                [X] │
├────────────────────────────────────────┤
│  Package: Pro                          │
│  Crédits: 1,500 + 200 bonus = 1,700   │
│  Prix: 500,000 GNF                     │
│                                        │
│  Méthode de paiement:                  │
│  ○ Orange Money                        │
│  ○ MTN Mobile Money                    │
│  ○ Carte bancaire                      │
│                                        │
│  [Annuler]  [Confirmer l'achat]       │
└────────────────────────────────────────┘
```

### Confirmation

```
┌────────────────────────────────────────┐
│  ✅ ACHAT RÉUSSI                       │
├────────────────────────────────────────┤
│  Vous avez acheté le package Pro       │
│                                        │
│  1,700 crédits ajoutés                 │
│  Nouveau solde: 1,750 crédits          │
│                                        │
│  Transaction ID: #1234567890           │
│                                        │
│  [Voir mes crédits]                    │
└────────────────────────────────────────┘
```

---

## 📊 Tableau de Bord Utilisateur

### Solde de Crédits

```
┌────────────────────────────────────────┐
│  MES CRÉDITS                           │
├────────────────────────────────────────┤
│                                        │
│  Solde actuel:  1,750 ⚡               │
│  ═══════════════════════════            │
│                                        │
│  Total acheté: 1,500                   │
│  Bonus reçus:  250                     │
│  Utilisés:     -                       │
│                                        │
│  [Acheter des crédits]                 │
│                                        │
└────────────────────────────────────────┘
```

### Historique des Transactions

```
┌───────────────────────────────────────────────────────────────┐
│  HISTORIQUE DES TRANSACTIONS                                  │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  12/11/2025 14:30                                             │
│  ✅ Achat: Package Pro                                        │
│  +1,700 crédits                        Nouveau solde: 1,750   │
│  Prix: 500,000 GNF (Orange Money)                             │
│                                                               │
│  12/11/2025 10:15                                             │
│  ⚡ Usage: Génération CV IA                                   │
│  -50 crédits                           Nouveau solde: 50      │
│                                                               │
│  11/11/2025 16:45                                             │
│  ✅ Achat: Package Starter                                    │
│  +100 crédits                          Nouveau solde: 100     │
│  Prix: 50,000 GNF (MTN Money)                                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔄 Intégration dans les Services

### Exemple: Génération CV IA

**Avant l'utilisation:**

```typescript
// 1. Vérifier le coût du service
const { data: serviceCost } = await supabase
  .from('service_credit_costs')
  .select('credits_cost')
  .eq('service_code', 'cv_generation')
  .single();

// 2. Vérifier le solde
const balance = await supabase.rpc('get_user_credit_balance', {
  p_user_id: user.id
});

// 3. Afficher à l'utilisateur
if (balance < serviceCost.credits_cost) {
  alert(`Crédits insuffisants. Requis: ${serviceCost.credits_cost}, Disponibles: ${balance}`);
  return;
}
```

**Lors de l'utilisation:**

```typescript
// Utiliser les crédits
const { data: result } = await supabase.rpc('use_credits_for_service', {
  p_user_id: user.id,
  p_service_code: 'cv_generation',
  p_metadata: {
    target_position: 'Développeur',
    style: 'modern'
  }
});

if (!result.success) {
  alert(result.message);
  return;
}

// Continuer avec la génération du CV
// ...
```

**Affichage du coût:**

```
┌────────────────────────────────────────┐
│  Générer mon CV avec l'IA              │
│                                        │
│  Coût: 50 crédits ⚡                   │
│  Solde actuel: 1,750 ⚡                │
│  Après utilisation: 1,700 ⚡           │
│                                        │
│  [Générer (50 crédits)]               │
└────────────────────────────────────────┘
```

---

## 📋 Correspondance Crédits/Montants

### Tarification Packages

**Tableau de correspondance:**

| Package | Crédits Base | Bonus | Total | Prix (GNF) | Prix/Crédit |
|---------|--------------|-------|-------|------------|-------------|
| Starter | 100 | 0 | 100 | 50,000 | 500 |
| Basic | 500 | 50 | 550 | 200,000 | 364 |
| Pro | 1,500 | 200 | 1,700 | 500,000 | 294 |
| Premium | 3,000 | 500 | 3,500 | 900,000 | 257 |
| Ultimate | 5,000 | 1,000 | 6,000 | 1,400,000 | 233 |

**Observation:**
- Plus le package est gros, moins le crédit coûte cher
- Les bonus encouragent les achats en volume
- Prix/crédit: de 500 GNF (Starter) à 233 GNF (Ultimate)

### Valeur des Services

**En GNF (selon package Starter - 500 GNF/crédit):**

| Service | Crédits | Valeur GNF | Valeur Réelle |
|---------|---------|------------|---------------|
| Analyse Profil | 0 | 0 | Gratuit |
| CV IA | 50 | 25,000 | Service pro |
| Lettre IA | 30 | 15,000 | Service pro |
| Matching | 20 | 10,000 | Recherche |
| Coaching | 100 | 50,000 | Formation |
| Boost Visibilité | 200 | 100,000 | Marketing |
| Candidature Prioritaire | 50 | 25,000 | Premium |
| Message Recruteur | 30 | 15,000 | Contact |
| Infos Contact | 40 | 20,000 | Données |
| Candidatures Illimitées | 300 | 150,000 | Abonnement 30j |

---

## 📊 Consommation par Service

### Services Gratuits (0 crédit)
- ✅ Analyse IA de Profil

### Services Economy (20-40 crédits)
- ✅ Matching IA Emplois (20)
- ✅ Génération Lettre IA (30)
- ✅ Message Direct Recruteur (30)
- ✅ Accès Infos Contact (40)

### Services Standard (50 crédits)
- ✅ Génération CV IA (50)
- ✅ Candidature Prioritaire (50)

### Services Premium (100-200 crédits)
- ✅ Coaching Entretien IA (100)
- ✅ Boost Visibilité Profil (200)

### Services Illimités (300 crédits)
- ✅ Candidatures Illimitées 30j (300)

---

## 🔐 Sécurité

### Row Level Security (RLS)

**Packages:**
```sql
-- Tout le monde peut voir les packages actifs
CREATE POLICY "view_active" ON credit_packages
  FOR SELECT USING (is_active = true);

-- Seuls les admins peuvent modifier
CREATE POLICY "admin_manage" ON credit_packages
  FOR ALL USING (is_admin());
```

**Soldes:**
```sql
-- Utilisateurs voient leur propre solde
CREATE POLICY "view_own" ON user_credit_balances
  FOR SELECT USING (auth.uid() = user_id);

-- Admins voient tous les soldes
CREATE POLICY "admin_view_all" ON user_credit_balances
  FOR SELECT USING (is_admin());
```

**Transactions:**
```sql
-- Utilisateurs voient leurs transactions
CREATE POLICY "view_own" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);
```

### Validation

**Fonctions sécurisées:**
- ✅ `SECURITY DEFINER` sur toutes les fonctions
- ✅ Vérification des soldes avant déduction
- ✅ Transactions atomiques
- ✅ Logs complets des opérations

---

## 📈 Statistiques et Monitoring

### Requêtes Utiles

**Revenus par période:**
```sql
SELECT
  DATE_TRUNC('month', created_at) as mois,
  SUM(price_paid) as revenu
FROM credit_transactions
WHERE transaction_type = 'purchase'
GROUP BY mois
ORDER BY mois DESC;
```

**Services les plus utilisés:**
```sql
SELECT
  service_code,
  COUNT(*) as utilisations,
  SUM(ABS(credits_amount)) as credits_total
FROM credit_transactions
WHERE transaction_type = 'usage'
GROUP BY service_code
ORDER BY utilisations DESC;
```

**Utilisateurs actifs:**
```sql
SELECT COUNT(DISTINCT user_id)
FROM credit_transactions
WHERE created_at >= now() - interval '30 days';
```

---

## ✅ Résumé

Le système de gestion des crédits premium offre:

### Pour les Admins:
- ✅ Configuration complète des packages
- ✅ Configuration des coûts par service
- ✅ Statistiques en temps réel
- ✅ Gestion flexible et évolutive

### Pour les Utilisateurs:
- ✅ Packages clairs avec bonus
- ✅ Achat simple et sécurisé
- ✅ Transparence des coûts
- ✅ Historique complet

### Avantages Système:
- ✅ 100% configurable
- ✅ Sécurisé (RLS complet)
- ✅ Traçable (historique complet)
- ✅ Évolutif (nouveaux services faciles)
- ✅ Automatisé (déductions auto)

---

**Version:** 1.0.0
**Date:** 12 Novembre 2025
**Status:** ✅ PRODUCTION READY
