# Module Formateur/Coach - Documentation Complète

## Vue d'ensemble

Le module formateur de JobGuinée est un système complet permettant de gérer deux types d'entités :
- **Personnes physiques** : Formateurs individuels, coaches, freelances
- **Personnes morales** : Organismes de formation, instituts, écoles, universités, entreprises

Le module inclut :
- Gestion complète des profils formateurs
- Système de publication de formations
- Système Premium avec mise en avant
- Services IA d'aide à la création
- Intégration paiement Orange Money
- Analytics et statistiques

## Architecture

### Base de données

#### Table `trainer_profiles`

Stocke les profils détaillés des formateurs (individus et organisations).

```sql
CREATE TABLE trainer_profiles (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id),
  user_id uuid REFERENCES auth.users(id),

  -- Type d'entité
  entity_type text CHECK (entity_type IN ('individual', 'organization')),

  -- Champs communs
  bio text,
  specializations text[],
  website_url text,
  location text,
  is_verified boolean DEFAULT false,
  verification_documents text[],

  -- Champs INDIVIDUAL
  full_name text,
  profession text,
  experience_years integer,
  certifications jsonb,
  photo_url text,

  -- Champs ORGANIZATION
  organization_name text,
  organization_type text,
  rccm text,
  agrement_number text,
  address text,
  domaines text[],
  logo_url text,
  contact_person text,
  contact_person_title text,

  -- Statistiques
  total_students integer DEFAULT 0,
  total_formations integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Sécurité RLS** :
- ✅ Profils vérifiés publics
- ✅ Formateurs voient leur propre profil
- ✅ Formateurs peuvent créer/modifier leur profil

#### Table `trainer_promoted_posts`

Gère les promotions et mises en avant des formations.

```sql
CREATE TABLE trainer_promoted_posts (
  id uuid PRIMARY KEY,
  trainer_id uuid REFERENCES profiles(id),
  formation_id uuid REFERENCES formations(id),

  pack_type text CHECK (pack_type IN (
    'boost_7j', 'boost_15j', 'boost_30j',
    'premium_month', 'premium_org_annual'
  )),

  price_amount numeric,
  payment_status text,
  promotion_status text,

  started_at timestamptz,
  expires_at timestamptz,

  views_count integer DEFAULT 0,
  clicks_count integer DEFAULT 0,
  enrollments_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);
```

**Sécurité RLS** :
- ✅ Formateurs voient leurs propres promotions
- ✅ Formateurs créent/modifient leurs promotions

#### Table `formations` (mise à jour)

Champs ajoutés pour la promotion :

```sql
ALTER TABLE formations ADD COLUMN mise_en_avant_until timestamptz;
ALTER TABLE formations ADD COLUMN promoted_by_pack_type text;
ALTER TABLE formations ADD COLUMN is_premium_formation boolean DEFAULT false;
ALTER TABLE formations ADD COLUMN premium_badge_text text;
```

### Services

#### `trainerService.ts`

Service principal pour la gestion des profils et promotions formateurs.

**Méthodes principales** :

```typescript
// Profils
getTrainerProfile(userId: string): Promise<TrainerProfile | null>
createOrUpdateTrainerProfile(userId, profileId, data): Promise<TrainerProfile>

// Promotions
getTrainerPromotions(trainerId: string): Promise<TrainerPromotion[]>
createPromotion(promotion): Promise<TrainerPromotion>
getActivePromotedFormations(limit): Promise<Formation[]>

// Packs Premium
getPromotionPacks(): Array<{code, name, price, duration_days, features}>
```

**Packs disponibles** :

| Pack | Prix (GNF) | Durée | Type |
|------|------------|-------|------|
| Boost 7j | 50,000 | 7 jours | Promotion |
| Boost 15j | 90,000 | 15 jours | Promotion |
| Boost 30j | 150,000 | 30 jours | Promotion |
| Premium Formateur | 250,000 | 30 jours | Abonnement |
| Premium Organisation | 2,500,000 | 365 jours | Abonnement |

#### `trainerAIService.ts`

Services IA dédiés aux formateurs.

**Méthodes** :

```typescript
// Génération de contenu
generateFormationDescription(data): Promise<string>
optimizeProgram(program): Promise<string>

// Recommandations
recommendPrice(data): Promise<{
  recommended_price, min_price, max_price, reasoning
}>
getVisibilityTips(formationId): Promise<string[]>

// Gestion crédits
consumeAICredits(userId, serviceCode, amount): Promise<void>
```

**Services IA configurés** :

| Code | Nom | Coût | Description |
|------|-----|------|-------------|
| `trainer_formation_description` | Génération Description | 15 crédits | Génère une description professionnelle |
| `trainer_program_optimizer` | Optimisation Programme | 20 crédits | Optimise et structure le programme |
| `trainer_price_recommender` | Recommandation Prix | 10 crédits | Recommande un prix optimal |
| `trainer_visibility_tips` | Conseils Visibilité | 10 crédits | Fournit des conseils de visibilité |

### Composants

#### `TrainerPremiumPlans.tsx`

Composant modal pour l'achat de packs Premium.

**Props** :

```typescript
interface TrainerPremiumPlansProps {
  trainerId: string;
  formationId?: string;
  entityType: 'individual' | 'organization';
  onClose: () => void;
  onSuccess: () => void;
}
```

**Fonctionnalités** :
- ✅ Affichage des packs filtrés par type d'entité
- ✅ Intégration paiement Orange Money
- ✅ Gestion upload preuve de paiement
- ✅ Création automatique de la promotion

**Utilisation** :

```typescript
<TrainerPremiumPlans
  trainerId={profile.id}
  formationId={selectedFormation?.id}
  entityType={trainerProfile.entity_type}
  onClose={() => setShowPremium(false)}
  onSuccess={loadData}
/>
```

## Flux utilisateur

### Inscription formateur

1. **Choix du rôle** : L'utilisateur sélectionne "Formateur" lors de l'inscription
2. **Création compte** : Le système crée automatiquement un profil trainer de type "individual"
3. **Complétion profil** : Dans le dashboard, le formateur complète son profil
4. **Choix entité** : Le formateur peut changer son type d'entité (individual → organization)

### Publication de formation

1. **Création formation** : Le formateur crée une nouvelle formation
2. **Choix promotion** (optionnel) : Sélection d'un pack de mise en avant
3. **Paiement** : Paiement via Orange Money
4. **Validation** : Admin valide le paiement
5. **Activation** : La promotion devient active automatiquement

### Système de promotion

**Workflow automatique** :

```
1. Formateur achète pack → status: 'pending'
2. Upload preuve paiement → status: 'waiting_proof'
3. Admin valide paiement → status: 'completed'
4. Trigger activate promotion → promotion_status: 'active'
5. Formation mise en avant jusqu'à expires_at
6. Auto-expiration → promotion_status: 'expired'
```

**Trigger automatique** :

```sql
CREATE TRIGGER update_formation_promotion_trigger
  AFTER UPDATE OF promotion_status ON trainer_promoted_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_formation_promotion();
```

## Fonctionnalités Premium

### Pour individus (Formateur)

**Pack Premium Formateur (250K GNF/mois)** :
- ✅ Badge PREMIUM sur toutes les formations
- ✅ Publication illimitée de formations
- ✅ Statistiques avancées
- ✅ Support prioritaire
- ✅ Accès outils IA inclus
- ✅ Mise en avant automatique

### Pour organisations

**Pack Premium Organisation (2.5M GNF/an)** :
- ✅ Badge PREMIUM ORG
- ✅ Publication illimitée
- ✅ Multi-utilisateurs (gestion d'équipe)
- ✅ Tableau de bord institutionnel
- ✅ API d'intégration
- ✅ Gestionnaire de compte dédié
- ✅ Formation de l'équipe
- ✅ Statistiques avancées
- ✅ Support prioritaire 24/7

## Intégrations

### Paiement Orange Money

Le système réutilise le flux Orange Money existant :

```typescript
import { OrangeMoneyPaymentInfo } from '../payments/OrangeMoneyPaymentInfo';

<OrangeMoneyPaymentInfo
  amount={pack.price}
  packageName={pack.name}
  onPaymentProofUploaded={handleSuccess}
  loading={loading}
/>
```

**Aucune duplication** : Le module trainer utilise les mêmes tables et composants que le système de crédits existant.

### Services IA

Les services IA sont configurés dans `ia_service_config` et réutilisent le système de crédits :

```typescript
// Appel service IA
const description = await trainerAIService.generateFormationDescription({
  title: 'Formation Excel Avancé',
  category: 'Bureautique',
  level: 'Avancé',
  duration: '40 heures'
});

// Consommation crédits automatique
await trainerAIService.consumeAICredits(
  user.id,
  'trainer_formation_description',
  15
);
```

## Navigation

### Bouton "Devenir Formateur"

**Logique implémentée dans Home.tsx** :

```typescript
onClick={() => {
  if (user && profile?.user_type === 'trainer') {
    onNavigate('trainer-dashboard');
  } else {
    setShowTrainerLoginModal(true);
  }
}}
```

**Scénarios** :
- Non connecté → Modal inscription avec rôle trainer
- Candidat/Recruteur → Modal proposition changement rôle
- Déjà formateur → Redirection dashboard

### Helper Navigation

```typescript
import { handleTrainerNavigation } from '../utils/trainerNavigationHelper';

handleTrainerNavigation({
  user,
  profile,
  onNavigate,
  onShowModal: () => setShowModal(true)
});
```

## Sécurité

### Row Level Security (RLS)

Toutes les tables ont RLS activé avec policies restrictives :

**trainer_profiles** :
- ✅ Lecture : Profils vérifiés publics, propriétaire voit le sien
- ✅ Insertion : Utilisateur crée son propre profil
- ✅ Mise à jour : Utilisateur modifie son propre profil
- ✅ Suppression : Utilisateur supprime son propre profil

**trainer_promoted_posts** :
- ✅ Lecture : Formateur voit ses propres promotions
- ✅ Insertion/Mise à jour : Formateur gère ses promotions

### Validation

**Contraintes CHECK** :
- `entity_type` : 'individual' ou 'organization'
- `pack_type` : Pack valide uniquement
- `payment_status` : Statuts définis
- `promotion_status` : Statuts définis
- Champs requis selon entity_type

**Triggers** :
- Création automatique profil trainer lors inscription
- Synchronisation formation ↔ promotion
- Auto-expiration promotions

## Analytics & Statistiques

### Métriques formateur

```typescript
interface TrainerStats {
  total_students: number;      // Total étudiants
  total_formations: number;    // Formations créées
  average_rating: number;      // Note moyenne
  total_reviews: number;       // Nombre d'avis
}
```

### Métriques promotion

```typescript
interface PromotionStats {
  views_count: number;         // Vues formation
  clicks_count: number;        // Clics sur formation
  enrollments_count: number;   // Inscriptions générées
}
```

### Fonction auto-expiration

```sql
CREATE FUNCTION auto_expire_trainer_promotions()
RETURNS void AS $$
BEGIN
  UPDATE trainer_promoted_posts
  SET promotion_status = 'expired'
  WHERE promotion_status = 'active'
    AND expires_at < now();
END;
$$;
```

**À exécuter périodiquement** (cron job recommandé).

## API Endpoints (Suggérés)

### Profils

```
GET    /api/trainers                     # Liste formateurs vérifiés
GET    /api/trainers/:id                 # Détails formateur
POST   /api/trainers                     # Créer profil
PUT    /api/trainers/:id                 # Mettre à jour profil
DELETE /api/trainers/:id                 # Supprimer profil
```

### Promotions

```
GET    /api/trainers/:id/promotions      # Liste promotions formateur
POST   /api/trainers/:id/promotions      # Créer promotion
GET    /api/formations/promoted          # Formations en avant
```

### Services IA

```
POST   /api/ai/trainer/description       # Générer description
POST   /api/ai/trainer/optimize          # Optimiser programme
POST   /api/ai/trainer/price             # Recommander prix
POST   /api/ai/trainer/visibility        # Conseils visibilité
```

## Tests recommandés

### Tests unitaires

```typescript
// trainerService.test.ts
describe('TrainerService', () => {
  it('should create individual trainer profile');
  it('should create organization trainer profile');
  it('should filter packs by entity type');
  it('should calculate promotion expiration');
});

// trainerAIService.test.ts
describe('TrainerAIService', () => {
  it('should generate formation description');
  it('should recommend appropriate price');
  it('should consume AI credits correctly');
});
```

### Tests d'intégration

```typescript
describe('Trainer Promotion Workflow', () => {
  it('should create promotion with payment');
  it('should activate promotion after validation');
  it('should expire promotion automatically');
  it('should update formation badges');
});
```

## Maintenance

### Tâches périodiques

**Quotidien** :
- Exécuter `auto_expire_trainer_promotions()`
- Vérifier paiements en attente
- Mettre à jour statistiques formateurs

**Hebdomadaire** :
- Nettoyer promotions expirées
- Générer rapports analytics
- Vérifier cohérence données

**Mensuel** :
- Renouveler abonnements Premium
- Analyser ROI promotions
- Optimiser prix packs

### Monitoring

**Métriques clés** :
- Nombre formateurs actifs
- Taux conversion promotions
- Revenus promotions/Premium
- Utilisation services IA
- Taux satisfaction formateurs

## Évolutions futures

### Phase 2
- [ ] Système de certification formateurs
- [ ] Reviews et notes par étudiants
- [ ] Messagerie formateur-étudiant
- [ ] Calendrier disponibilités

### Phase 3
- [ ] Live streaming formations
- [ ] Marketplace templates formations
- [ ] Programme affiliation
- [ ] API publique

### Phase 4
- [ ] Mobile app formateurs
- [ ] Gamification (badges, niveaux)
- [ ] Intelligence analytics avancée
- [ ] Intégration paiements internationaux

## Support & Contact

**Pour les formateurs** :
- Documentation : https://jobguinee.com/docs/trainers
- Support : support@jobguinee.com
- WhatsApp : +224 XXX XXX XXX

**Pour les développeurs** :
- GitHub : [private repo]
- API Docs : https://api.jobguinee.com/docs
- Slack : #trainer-module

---

**Version** : 1.0.0
**Dernière mise à jour** : Décembre 2024
**Auteur** : Équipe JobGuinée
**License** : Propriétaire