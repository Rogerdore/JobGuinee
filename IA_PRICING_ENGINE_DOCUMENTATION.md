# Moteur de Tarification IA - Documentation Complète

## Vue d'ensemble

Le Moteur de Tarification IA de JobGuinée est un système centralisé et entièrement administrable qui permet de gérer dynamiquement les coûts en crédits de tous les services IA de la plateforme.

## Caractéristiques Principales

### Gestion Centralisée
- Tous les prix sont stockés en base de données
- Aucun coût codé en dur dans l'application
- Mise à jour instantanée sans redéploiement

### Système de Promotions
- Activation/désactivation de promotions par service
- Pourcentages de remise configurables (0-100%)
- Calcul automatique des coûts effectifs

### Interface Admin Intuitive
- Tableau de bord complet avec statistiques
- Modification en temps réel des tarifs
- Ajout de nouveaux services IA à la volée
- Suivi des utilisations par service

## Architecture

### Base de Données

#### Table: `service_credit_costs`

```sql
- id (uuid)
- service_code (text, unique)
- service_name (text)
- service_description (text)
- credits_cost (integer)
- is_active (boolean)
- category (text)
- promotion_active (boolean)
- discount_percent (integer)
- display_order (integer)
- icon (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Fonctions SQL Disponibles

1. **get_all_ia_services()**
   - Retourne tous les services avec leurs détails
   - Calcule automatiquement le coût effectif (avec promotions)
   - Triés par display_order

2. **update_ia_service_pricing()**
   - Met à jour les paramètres d'un service
   - Valide les données entrées
   - Gère l'historique via updated_at

3. **add_new_ia_service()**
   - Crée un nouveau service IA
   - Vérifie l'unicité du code
   - Initialise tous les champs requis

4. **get_effective_cost(service_code)**
   - Retourne le coût effectif après application des promotions
   - Utilisé par les composants frontend

5. **get_service_statistics()**
   - Statistiques d'utilisation par service
   - Nombre total d'utilisations
   - Crédits consommés totaux
   - Utilisateurs uniques

### Backend TypeScript

#### PricingEngine Class (`/src/services/creditService.ts`)

```typescript
class PricingEngine {
  // Récupère tous les services avec prix
  static async fetchAllPricing(): Promise<CreditServiceConfig[]>

  // Obtient le coût effectif d'un service
  static async getServiceCost(serviceCode: string): Promise<number | null>

  // Récupère les détails complets d'un service
  static async getServiceDetails(serviceCode: string): Promise<CreditServiceConfig | null>

  // Met à jour la tarification d'un service
  static async updatePricing(params: PricingUpdateParams): Promise<Result>

  // Ajoute un nouveau service
  static async addService(params: NewServiceParams): Promise<Result>

  // Récupère les statistiques d'usage
  static async getStatistics(): Promise<ServiceStatistics[]>

  // Calcule le coût avec promotion
  static calculateEffectiveCost(baseCost, promotionActive, discountPercent): number
}
```

### React Hooks

#### usePricing Hooks (`/src/hooks/usePricing.ts`)

```typescript
// Récupère le coût d'un service (avec cache React)
const cost = useServiceCost(serviceCode);

// Récupère les détails complets d'un service
const service = useServiceDetails(serviceCode);

// Récupère tous les services
const services = useAllServices();
```

### Interface Admin

#### AdminIAPricing Page (`/src/pages/AdminIAPricing.tsx`)

**Sections principales:**

1. **Dashboard de statistiques**
   - Services actifs
   - Promotions en cours
   - Total des services

2. **Tableau des services**
   - Liste complète avec tous les détails
   - Statut (actif/inactif)
   - Promotions actives
   - Statistiques d'utilisation
   - Actions de modification

3. **Modal de modification**
   - Description du service
   - Coût en crédits
   - Ordre d'affichage
   - Icône
   - Statut actif/inactif
   - Gestion des promotions
   - Aperçu du coût effectif

4. **Modal d'ajout de service**
   - Code unique du service
   - Nom et description
   - Coût initial
   - Catégorie
   - Icône

## Utilisation dans les Composants

### Exemple: AICVGenerator

```typescript
import { useServiceCost } from '../../hooks/usePricing';
import { SERVICES } from '../../services/creditService';

export default function AICVGenerator() {
  // Récupère le coût dynamiquement depuis la DB
  const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 50;

  return (
    <CreditConfirmModal
      serviceCode={SERVICES.AI_CV_GENERATION}
      serviceCost={serviceCost}
      // ... autres props
    />
  );
}
```

### Exemple: AIMatchingModal (coût multiple)

```typescript
const costPerCandidate = useServiceCost(SERVICES.AI_JOB_MATCHING) || 30;
const totalCost = costPerCandidate * selectedCandidates.size;

<CreditConfirmModal
  serviceCost={totalCost}
  description={`Analysez ${selectedCandidates.size} candidatures`}
/>
```

## Services IA Intégrés

Tous ces services utilisent maintenant le moteur de tarification dynamique:

1. **AI_CV_GENERATION** - Génération de CV IA
2. **AI_COVER_LETTER** - Génération de lettre de motivation
3. **AI_JOB_MATCHING** - Matching candidat-emploi
4. **AI_PROFILE_ANALYSIS** - Analyse de profil
5. **AI_INTERVIEW_COACHING** - Coaching entretien
6. **AI_CAREER_PATH** - Planification de carrière

## Workflow de Tarification

### 1. Chargement du Prix

```
Composant IA
  → useServiceCost(serviceCode)
    → PricingEngine.getServiceCost()
      → SQL: get_effective_cost()
        → Calcul: cost - (cost * discount / 100)
          → Retour du coût effectif
```

### 2. Modification du Prix (Admin)

```
Admin modifie le prix
  → PricingEngine.updatePricing()
    → SQL: update_ia_service_pricing()
      → Validation des données
        → Mise à jour de la table
          → Trigger updated_at
            → Nouveau prix disponible immédiatement
```

### 3. Activation d'une Promotion

```
Admin active une promotion
  → Définit discount_percent (ex: 20%)
  → Active promotion_active = true
    → get_effective_cost() calcule automatiquement
      → Ancien prix: 100 crédits
      → Nouveau prix: 80 crédits (20% de réduction)
```

## Sécurité

### RLS Policies

```sql
-- Admins: accès complet
CREATE POLICY "Admins can manage services"
  ON service_credit_costs
  FOR ALL
  TO authenticated
  USING (user_type = 'admin')

-- Users: lecture des services actifs uniquement
CREATE POLICY "Users can view active services"
  ON service_credit_costs
  FOR SELECT
  TO authenticated
  USING (is_active = true)
```

### Validations

- **Coût**: Ne peut être négatif
- **Remise**: Entre 0 et 100%
- **Code service**: Unique et obligatoire
- **Nom service**: Obligatoire

## Performance

### Indexes

```sql
CREATE INDEX idx_service_credit_costs_service_code
  ON service_credit_costs(service_code);
CREATE INDEX idx_service_credit_costs_is_active
  ON service_credit_costs(is_active);
CREATE INDEX idx_service_credit_costs_category
  ON service_credit_costs(category);
CREATE INDEX idx_service_credit_costs_display_order
  ON service_credit_costs(display_order);
```

### Cache React

Les hooks `usePricing` implémentent un cache automatique via `useState` et `useEffect`, évitant les appels répétés à la base de données.

## Avantages du Système

### Flexibilité Commerciale
- Ajustement instantané des prix selon la demande
- Promotions flash sans code
- A/B testing des prix
- Prix différenciés par période

### Maintenance
- Zéro redéploiement pour changer un prix
- Code propre sans valeurs magiques
- Traçabilité complète (updated_at)
- Rollback facile en DB

### Évolutivité
- Ajout de nouveaux services en 30 secondes
- Structure extensible (nouveaux champs possibles)
- Catégorisation flexible
- Statistiques intégrées

### Monétisation
- Stratégies de pricing dynamiques
- Promotions temporaires
- Packages groupés possibles
- Analytics de conversion

## Guide de Déploiement

### 1. Migration Initiale

```bash
# La migration est déjà appliquée
# Fichier: supabase/migrations/enhance_ia_pricing_engine_system.sql
```

### 2. Vérification

```sql
-- Vérifier la table
SELECT * FROM service_credit_costs LIMIT 5;

-- Tester les fonctions
SELECT * FROM get_all_ia_services();
SELECT get_effective_cost('ai_cv_generation');
```

### 3. Configuration Admin

```
1. Se connecter en tant qu'admin
2. Naviguer vers "Tarification IA"
3. Vérifier que tous les services sont présents
4. Ajuster les coûts si nécessaire
```

## Monitoring et Analytics

### Statistiques Disponibles

```typescript
const stats = await PricingEngine.getStatistics();

// Pour chaque service:
stats.forEach(stat => {
  console.log(stat.service_name);
  console.log('Utilisations:', stat.total_usage_count);
  console.log('Crédits consommés:', stat.total_credits_consumed);
  console.log('Utilisateurs uniques:', stat.unique_users_count);
  console.log('Dernière utilisation:', stat.last_used_at);
});
```

### Métriques Importantes

- **Taux d'utilisation** par service
- **Revenu** (crédits consommés)
- **Popularité** (utilisateurs uniques)
- **Conversion** (activations après affichage du prix)

## Feuille de Route

### Phase 2 (Future)
- [ ] Packages de services groupés
- [ ] Prix différenciés par niveau d'abonnement
- [ ] Promotions programmées (début/fin auto)
- [ ] Codes promo individuels
- [ ] Historique des changements de prix
- [ ] Export des statistiques (CSV/Excel)
- [ ] Graphiques d'évolution des prix
- [ ] Alertes admin (service sous-utilisé)

### Phase 3 (Future)
- [ ] Machine Learning pour prix optimaux
- [ ] Pricing dynamique basé sur la demande
- [ ] Tests A/B automatisés
- [ ] Recommandations de prix
- [ ] Intégration système de facturation

## Support et Maintenance

### Ajouter un Nouveau Service IA

1. **Via l'interface Admin** (recommandé)
   ```
   - Aller sur "Tarification IA"
   - Cliquer "Nouveau Service"
   - Remplir le formulaire
   - Valider
   ```

2. **Via SQL** (pour scripts)
   ```sql
   SELECT add_new_ia_service(
     'new_service_code',
     'Nom du Service',
     'Description détaillée',
     75, -- coût en crédits
     'ia_services',
     'Sparkles'
   );
   ```

3. **Dans le code**
   ```typescript
   // Ajouter dans SERVICES constant
   export const SERVICES = {
     // ... existants
     NEW_SERVICE: 'new_service_code'
   };
   ```

### Modifier un Prix

1. **Interface Admin** (temps réel)
2. **SQL direct** (bulk)
   ```sql
   SELECT update_ia_service_pricing(
     'ai_cv_generation',
     p_credits_cost := 60
   );
   ```

### Activer une Promotion

```sql
SELECT update_ia_service_pricing(
  'ai_cv_generation',
  p_promotion_active := true,
  p_discount_percent := 30 -- -30%
);
```

## Résolution de Problèmes

### Le prix ne se met pas à jour

1. Vérifier que `is_active = true`
2. Vérifier les RLS policies
3. Vider le cache navigateur
4. Vérifier la console pour erreurs

### Service non trouvé

1. Vérifier `service_code` exact
2. Vérifier existence dans la DB
3. Vérifier constante SERVICES

### Erreur de calcul

1. Vérifier `discount_percent` (0-100)
2. Vérifier `credits_cost` positif
3. Tester `get_effective_cost()` en SQL

## Conclusion

Le Moteur de Tarification IA de JobGuinée est un système de niveau SaaS professionnel qui offre:

- **Flexibilité maximale** pour les stratégies commerciales
- **Maintenance simplifiée** sans redéploiement
- **Évolutivité garantie** pour nouveaux services
- **Monétisation optimisée** via promotions et analytics
- **Expérience admin** intuitive et puissante

Ce système positionne JobGuinée au même niveau que les leaders du marché (Notion, Jasper, Copy.ai) en termes de gestion tarifaire dynamique.
