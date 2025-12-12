# Système de Tarification Matching IA Recruteur - JobGuinée

## Vue d'ensemble

Système complet de monétisation du service "Matching IA Recruteur" avec tarification flexible en crédits IA et équivalent GNF (1 crédit = 1 000 GNF).

## Architecture

### 1. Base de Données

#### Table `recruiter_matching_pricing`
Configuration des tarifs avec 3 modes de tarification :

**Colonnes :**
- `id` : UUID primary key
- `mode` : 'per_candidate' | 'batch' | 'subscription'
- `name` : Nom du tarif
- `description` : Description détaillée
- `credits_cost` : Coût en crédits IA
- `gnf_cost` : Équivalent GNF (calculé automatiquement : credits_cost * 1000)
- `candidate_count` : Nombre de candidats (pour batch/subscription)
- `is_active` : Boolean
- `display_order` : Ordre d'affichage
- `metadata` : JSONB pour configuration additionnelle

#### Table `recruiter_ai_subscriptions`
Abonnements IA mensuels pour les recruteurs :

**Colonnes :**
- `id` : UUID primary key
- `recruiter_id` : FK vers profiles
- `plan_type` : 'basic' | 'pro' | 'gold'
- `credits_included` : Crédits inclus dans l'abonnement
- `matching_quota` : Quota de matchings (null = illimité pour gold)
- `matching_used` : Matchings utilisés ce mois
- `start_date` : Date de début
- `end_date` : Date de fin
- `status` : 'active' | 'expired' | 'cancelled' | 'pending'
- `auto_renew` : Boolean
- `needs_admin_validation` : Boolean (pour plan Gold)

### 2. Modes de Tarification

#### MODE A : Par Candidat
Tarification individuelle avec dégressivité configurable

**Tarif par défaut :**
- 1 candidat = 10 crédits (10 000 GNF)
- Dégressivité configurable dans metadata :
  ```json
  {
    "degressive": [
      {"from": 1, "to": 10, "cost": 10},
      {"from": 11, "to": 50, "cost": 9},
      {"from": 51, "to": null, "cost": 8}
    ]
  }
  ```

#### MODE B : Par Batch
Packs de candidats avec économies substantielles

**Tarifs par défaut :**
- **Batch 10** : 80 crédits (80 000 GNF) - Économie 20%
- **Batch 25** : 180 crédits (180 000 GNF) - Économie 28%
- **Batch 50** : 320 crédits (320 000 GNF) - Économie 36%
- **Batch 100** : 600 crédits (600 000 GNF) - Économie 40%

#### MODE C : Abonnements IA
Forfaits mensuels avec quotas de matchings

**Plans disponibles :**

1. **Basic** (3 000 000 GNF/mois)
   - 300 matchings/mois
   - 3 000 crédits inclus
   - Support standard
   - Rapports basiques

2. **Pro** (7 500 000 GNF/mois)
   - 800 matchings/mois
   - 8 000 crédits inclus
   - Support prioritaire
   - Rapports avancés
   - Analytics IA

3. **Gold** (10 000 000 GNF/mois)
   - **Matchings illimités**
   - 10 000 crédits inclus
   - Account manager dédié
   - API accès
   - Formation équipe
   - **Validation admin requise**

### 3. Service TypeScript

**Fichier :** `src/services/recruiterMatchingPricingService.ts`

#### Classes et Interfaces

```typescript
interface MatchingPricingOption {
  id: string;
  mode: 'per_candidate' | 'batch' | 'subscription';
  name: string;
  description: string | null;
  credits_cost: number;
  gnf_cost: number;
  candidate_count: number | null;
  is_active: boolean;
  display_order: number;
  metadata: Record<string, any>;
}

interface RecruiterAISubscription {
  id: string;
  recruiter_id: string;
  plan_type: 'basic' | 'pro' | 'gold';
  credits_included: number;
  matching_quota: number | null;
  matching_used: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  auto_renew: boolean;
  needs_admin_validation: boolean;
}

interface CostEstimate {
  mode: string;
  candidateCount: number;
  creditsRequired: number;
  gnfEquivalent: number;
  hasActiveSubscription: boolean;
  subscriptionQuotaRemaining: number | null;
  canAfford: boolean;
  insufficientBy: number;
  useSubscription: boolean;
}
```

#### Méthodes Principales

1. **getActivePricing()** : Récupère tous les tarifs actifs
2. **getPricingByMode(mode)** : Récupère les tarifs d'un mode spécifique
3. **getActiveSubscription(recruiterId)** : Récupère l'abonnement actif d'un recruteur
4. **estimateCost(recruiterId, candidateCount)** : Calcule le coût optimal pour un nombre de candidats
5. **consumeMatchingCredits(recruiterId, candidateCount, estimate)** : Consomme les crédits ou le quota
6. **createSubscription(recruiterId, planType, paymentMethod, amountPaid)** : Crée un nouvel abonnement
7. **updatePricing(pricingId, updates)** : Met à jour un tarif (admin)
8. **validateGoldSubscription(subscriptionId, approved)** : Valide un abonnement Gold (admin)

### 4. Interface Admin

**Fichier :** `src/components/admin/RecruiterMatchingPricingAdmin.tsx`

**Onglet :** Admin IA Center → "Matching IA"

#### Fonctionnalités

1. **Gestion des Tarifs**
   - Visualisation par mode (A, B, C)
   - Édition en ligne des coûts et descriptions
   - Activation/désactivation des tarifs
   - Calcul automatique de l'équivalent GNF

2. **Validation des Abonnements**
   - Liste des abonnements Gold en attente
   - Boutons Approuver / Refuser
   - Détails du recruteur et du paiement
   - Historique des validations

3. **Preview des Tarifs**
   - Calcul du coût par candidat pour les batches
   - Affichage des économies réalisées
   - Visualisation des features incluses

### 5. Interface Recruteur

**Fichier :** `src/components/recruiter/AIMatchingModal.tsx`

#### Workflow Utilisateur

1. **Sélection des Candidats**
   - Checkboxes pour chaque candidat
   - Bouton "Tout sélectionner/désélectionner"
   - Compteur de sélection

2. **Estimation Automatique**
   - Calcul automatique à chaque changement de sélection
   - Affichage du mode optimal (batch vs per candidate)
   - Vérification de l'abonnement actif
   - Affichage du coût en crédits et GNF

3. **Affichage du Coût**

   **Avec Abonnement Actif :**
   ```
   ✓ Abonnement IA actif
   • Plan Gold : Matchings illimités
   • Coût : 0 crédits (inclus dans l'abonnement)
   ```

   **Sans Abonnement / Crédits à la demande :**
   ```
   Mode optimal : Batch / Par candidat
   Candidats : 25
   Coût total : 180 crédits ≈ 180 000 GNF
   ```

   **Si Insuffisant :**
   ```
   ❌ Insuffisant
   Il vous manque 50 crédits
   [Bouton : Acheter 50 crédits IA]
   ```

4. **Lancement de l'Analyse**
   - Bouton désactivé si crédits insuffisants
   - Vérification finale avant consommation
   - Déduction automatique des crédits ou du quota
   - Lancement de l'analyse IA

### 6. Intégration dans RecruiterDashboard

**Page Premium Recruteur :**
- Onglet "Premium" du RecruiterDashboard
- Section "Services IA à la Demande"
- Affichage du service "Matching IA Recruteur"
- Coût : 10 crédits par candidat
- Lien vers la boutique de crédits

### 7. Logique de Calcul des Coûts

Le service calcule automatiquement le coût optimal selon cette priorité :

1. **Abonnement actif avec quota disponible** → Utilise le quota (0 crédit)
2. **Abonnement Gold** → Illimité (0 crédit)
3. **Batch le plus avantageux** → Compare tous les batches
4. **Tarif dégressif par candidat** → Applique la dégressivité si configurée
5. **Tarif standard** → 10 crédits par candidat

**Exemple de calcul pour 25 candidats :**
- Sans batch : 25 × 10 = 250 crédits
- Avec Batch 25 : 180 crédits ✓ (Économie de 70 crédits)

### 8. Sécurité et RLS

#### Policies

**recruiter_matching_pricing :**
- Admins : Gestion complète
- Tous : Lecture des tarifs actifs uniquement

**recruiter_ai_subscriptions :**
- Admins : Gestion complète
- Recruteurs : Lecture et création de leurs propres abonnements
- Pas de modification directe (sauf via admin)

#### Triggers

1. **updated_at** : Mise à jour automatique du timestamp
2. **calculate_gnf_cost** : Calcul automatique de gnf_cost = credits_cost × 1000

### 9. Workflow de Souscription

#### Abonnement Basic/Pro (Auto-validé)

1. Recruteur sélectionne un plan
2. Paiement via Orange Money / LengoPay / DigitalPay
3. Création automatique avec status='active'
4. Activation immédiate

#### Abonnement Gold (Validation Admin)

1. Recruteur sélectionne plan Gold
2. Paiement de 10 000 000 GNF
3. Création avec status='pending', needs_admin_validation=true
4. **Admin review** dans l'onglet "Abonnements en attente"
5. Admin approuve ou refuse
6. Si approuvé : status='active', quota illimité activé
7. Si refusé : status='cancelled', remboursement manuel

### 10. Données par Défaut

Les tarifs suivants sont créés automatiquement lors de la migration :

```sql
-- Mode A: Par candidat (avec dégressivité)
10 crédits/candidat (1-10), 9 crédits/candidat (11-50), 8 crédits/candidat (51+)

-- Mode B: Batches
Batch 10  : 80 crédits  (8 crédits/candidat)
Batch 25  : 180 crédits (7.2 crédits/candidat)
Batch 50  : 320 crédits (6.4 crédits/candidat)
Batch 100 : 600 crédits (6 crédits/candidat)

-- Mode C: Abonnements
Basic : 3M GNF/mois - 300 matchings
Pro   : 7.5M GNF/mois - 800 matchings
Gold  : 10M GNF/mois - Illimité
```

## Utilisation

### Pour l'Admin

1. Accéder à **Admin IA Center** → Onglet **"Matching IA"**
2. Modifier les tarifs dans les sections A, B, C
3. Valider les abonnements Gold en attente
4. Consulter l'historique des modifications

### Pour le Recruteur

1. Accéder à **RecruiterDashboard** → Onglet **"Premium"**
2. Voir le service "Matching IA Recruteur" (10 crédits)
3. Acheter des crédits ou souscrire à un abonnement
4. Utiliser le service dans **"Applications"** → Bouton IA
5. Sélectionner les candidats à analyser
6. Voir l'estimation automatique du coût
7. Lancer l'analyse

## Avantages du Système

✅ **Flexibilité** : 3 modes de tarification adaptés à tous les besoins
✅ **Transparence** : Coût affiché en crédits ET en GNF
✅ **Optimisation** : Calcul automatique du mode le plus avantageux
✅ **Évolutif** : Tarifs configurables par l'admin
✅ **Sécurisé** : RLS strict, validation admin pour Gold
✅ **Intelligent** : Gestion automatique des quotas d'abonnement
✅ **User-friendly** : Estimation en temps réel, blocage si insuffisant

## Prochaines Étapes Possibles

1. **Analytics** : Dashboard de consommation pour les recruteurs
2. **Renouvellement automatique** : Auto-renew des abonnements
3. **Alertes** : Notification quand quota proche de la limite
4. **Promotions** : Système de codes promo et réductions
5. **API** : Endpoints pour intégrations tierces (plan Gold)
6. **Historique** : Logs détaillés de chaque matching effectué

## Support

Pour toute question ou problème :
- **Admin** : Consulter les logs dans Admin IA Center → Logs
- **Recruteur** : Contacter le support via le chatbot IA
- **Technique** : Vérifier la table `ai_service_usage_history` pour les détails d'utilisation

---

**Version** : 1.0
**Date** : 12 décembre 2024
**Système** : JobGuinée - Plateforme RH Intelligente
