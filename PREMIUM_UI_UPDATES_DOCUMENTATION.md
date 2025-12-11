# Documentation : Mise à jour UI Premium PRO+

## Vue d'ensemble

Cette documentation décrit les améliorations apportées à l'interface utilisateur pour les membres Premium PRO+ de JobGuinée. L'objectif est de rendre leur statut Premium clairement visible et de leur donner un accès immédiat et sans friction à tous les services IA.

## Principes de conception

### 1. Visibilité du statut Premium

Les utilisateurs Premium PRO+ doivent pouvoir identifier immédiatement leur statut privilégié :
- Badge Premium visible avec icône couronne
- Compteur de jours restants jusqu'à expiration
- Design distinctif avec dégradés dorés/orange
- Symbole d'infini (∞) pour l'accès illimité

### 2. Accès sans friction

Les utilisateurs Premium ne doivent JAMAIS rencontrer de barrières lors de l'utilisation des services IA :
- Aucune vérification de crédits
- Aucun message "Crédits insuffisants"
- Tous les boutons affichent "Utiliser le service"
- Badge "Accès illimité" sur toutes les cartes de services

### 3. Distinction visuelle claire

L'interface doit clairement différencier les utilisateurs Premium des utilisateurs gratuits :
- Couleurs spécifiques (vert émeraude pour Premium vs bleu pour gratuit)
- Badges et icônes dédiés
- Messages adaptés au contexte

## Fichiers modifiés

### 1. Fonction utilitaire Premium (`src/utils/premiumHelpers.ts`)

**Nouveau fichier** contenant les fonctions centralisées pour gérer le statut Premium.

#### Fonctions principales

##### `isPremiumActive(profile)`

Vérifie si un profil utilisateur a un abonnement Premium actif.

```typescript
export function isPremiumActive(profile: PremiumProfile | null | undefined): boolean
```

**Logique :**
1. Vérifie que le profil existe
2. Vérifie que `is_premium === true`
3. Vérifie que `premium_expiration` existe
4. Vérifie que la date d'expiration est dans le futur

**Utilisation :**
```typescript
import { isPremiumActive } from '../utils/premiumHelpers';

const isPremium = isPremiumActive(profile);
if (isPremium) {
  // Afficher l'UI Premium
}
```

##### `getDaysUntilExpiration(premiumExpiration)`

Calcule le nombre de jours restants avant l'expiration de l'abonnement Premium.

```typescript
export function getDaysUntilExpiration(premiumExpiration: string | null | undefined): number | null
```

**Retour :**
- `null` si pas de date d'expiration
- `0` si l'abonnement est expiré
- Nombre de jours restants (arrondi au supérieur)

##### `formatPremiumExpirationMessage(premiumExpiration)`

Génère un message lisible sur l'expiration de l'abonnement.

```typescript
export function formatPremiumExpirationMessage(premiumExpiration: string | null | undefined): string
```

**Exemples de retour :**
- "Expire aujourd'hui"
- "Expire dans 3 jours ⚠️"
- "Expire dans 15 jours"
- "Expire dans 2 mois"
- "Expire dans plus d'un an"

##### `getPremiumStatusColor(days)`

Retourne les couleurs Tailwind appropriées selon le nombre de jours restants.

```typescript
export function getPremiumStatusColor(days: number | null): {
  bg: string;
  text: string;
  border: string;
}
```

**Code couleur :**
| Jours restants | Couleur | Signification |
|----------------|---------|---------------|
| null | Gris | Inactif |
| ≤ 3 | Rouge | Critique |
| ≤ 7 | Orange | Avertissement |
| > 7 | Jaune/Orange | Normal |

### 2. Composant CreditBalance (`src/components/credits/CreditBalance.tsx`)

**Modifications majeures** pour afficher le statut Premium de manière proéminente.

#### Imports ajoutés

```typescript
import { Crown, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  isPremiumActive,
  getDaysUntilExpiration,
  formatPremiumExpirationMessage,
  getPremiumStatusColor
} from '../../utils/premiumHelpers';
```

#### Logique Premium

```typescript
const { profile } = useAuth();

const isPremium = isPremiumActive(profile);
const daysUntilExpiration = getDaysUntilExpiration(profile?.premium_expiration);
const premiumMessage = formatPremiumExpirationMessage(profile?.premium_expiration);
const premiumColors = getPremiumStatusColor(daysUntilExpiration);
```

#### Variant 'prominent' - Version Premium

Pour les utilisateurs Premium, le variant 'prominent' affiche :

**Structure :**
```
┌──────────────────────────────────────┐
│ 👑 Premium PRO+ ✨                   │
│ Expire dans X jours                  │
│                                      │
│ ✨ Crédits IA                        │
│ ∞ (Accès illimité)                   │
│                                      │
│ ⚠️ [Alerte si < 7 jours]            │
└──────────────────────────────────────┘
```

**Code clé :**
```typescript
if (isPremium) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-2 {...} rounded-xl p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-md">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-orange-900">Premium PRO+</span>
          <Sparkles className="w-4 h-4 text-orange-500" />
          <div className="text-xs font-medium text-orange-700">
            {premiumMessage}
          </div>
        </div>
      </div>

      {/* Affichage crédits illimités */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg">
        <Sparkles className="w-5 h-5 text-orange-500" />
        <div>
          <div className="text-xs text-gray-600">Crédits IA</div>
          <span className="text-xl font-bold">∞</span>
          <span className="text-xs">(Accès illimité)</span>
        </div>
      </div>
    </div>
  );
}
```

**Alerte d'expiration :**
Si `daysUntilExpiration ≤ 7` :
```html
<div className="mt-3 text-xs text-orange-700 bg-orange-100 px-3 py-2 rounded-lg">
  ⚠️ Votre abonnement Premium expire bientôt. Pensez à le renouveler.
</div>
```

#### Variant 'compact' - Version Premium

Version condensée pour les emplacements restreints :

```typescript
if (isPremium) {
  return (
    <div className="flex items-center gap-2">
      <Crown className="w-4 h-4 text-orange-500" />
      <span className="font-semibold text-sm text-orange-900">
        Premium PRO+
      </span>
    </div>
  );
}
```

#### Variant 'default' - Version Premium

Version intermédiaire avec badge coloré :

```typescript
if (isPremium) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-300 rounded-lg">
        <Crown className="w-5 h-5 text-orange-600" />
        <span className="font-bold text-orange-900">Premium PRO+</span>
        <span className="text-xs text-orange-700">∞</span>
      </div>
    </div>
  );
}
```

### 3. Page Services IA (`src/pages/PremiumAIServices.tsx`)

**Modifications majeures** pour adapter l'affichage des services aux utilisateurs Premium.

#### Imports ajoutés

```typescript
import { Infinity } from 'lucide-react';
import { isPremiumActive } from '../utils/premiumHelpers';
```

#### Récupération du statut Premium

```typescript
const { user, profile } = useAuth();
const isPremium = isPremiumActive(profile);
```

#### Logique de désactivation modifiée

**AVANT :**
```typescript
const isDisabled = service.credits_cost > 0 && !enoughCredits;
```

**APRÈS :**
```typescript
const isDisabled = !isPremium && service.credits_cost > 0 && !enoughCredits;
```

**Impact :** Les utilisateurs Premium ne sont JAMAIS bloqués, même avec 0 crédit.

#### Badges sur les cartes de services

##### Badge "Accès illimité" (utilisateurs Premium)

Affiché en haut à droite sur **toutes** les cartes pour les Premium :

```typescript
{isPremium && (
  <div className="absolute top-4 right-4 z-10">
    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white text-xs font-bold shadow-lg">
      <Infinity className="w-3 h-3" />
      ACCÈS ILLIMITÉ
    </div>
  </div>
)}
```

**Design :**
- Dégradé vert émeraude
- Icône infini
- Ombre portée
- Position absolue top-right

##### Badge "PREMIUM" (utilisateurs gratuits uniquement)

Affiché uniquement pour les services premium quand l'utilisateur est gratuit :

```typescript
{!isPremium && isServicePremium && (
  <div className="absolute top-4 right-4 z-10">
    <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white text-xs font-bold shadow-lg">
      <Crown className="w-3 h-3" />
      PREMIUM
    </div>
  </div>
)}
```

#### Affichage du coût en crédits

##### Pour les utilisateurs Premium

Remplace l'affichage du coût par un badge "Accès illimité inclus" :

```typescript
{isPremium ? (
  <div className="mb-4">
    <div className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
      <Infinity className="w-5 h-5 text-green-600" />
      <span className="text-sm font-bold text-green-900">
        Accès illimité inclus
      </span>
    </div>
  </div>
) : (
  // Affichage normal avec coût en crédits
)}
```

**Résultat visuel :**
```
┌────────────────────────────┐
│ ∞ Accès illimité inclus    │
└────────────────────────────┘
```

##### Pour les utilisateurs gratuits

Affichage standard du coût avec avertissement si crédits insuffisants :

```typescript
<div className="flex items-center justify-between mb-4">
  <div className="flex items-baseline gap-2">
    <span className="text-3xl font-bold text-orange-600">
      {service.credits_cost}
    </span>
    <span className="text-gray-600">crédits</span>
  </div>
</div>

{isDisabled && (
  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-sm text-red-700 font-medium text-center">
      Crédits insuffisants
    </p>
  </div>
)}
```

#### Boutons d'action

##### Bouton Premium (vert émeraude)

Pour les utilisateurs Premium, le bouton est **toujours actif** et vert :

```typescript
{isPremium ? (
  <>
    Utiliser le service
    <ArrowRight className="w-5 h-5" />
  </>
) : isDisabled ? (
  'Acheter des crédits'
) : (
  <>
    Utiliser le service
    <ArrowRight className="w-5 h-5" />
  </>
)}
```

**Classes CSS :**
```typescript
className={`w-full py-3 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
  isPremium
    ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white hover:from-green-700 hover:to-emerald-800'
    : isDisabled
    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 cursor-pointer'
    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
}`}
```

**Couleurs des boutons :**
| Statut | Couleur | Action |
|--------|---------|--------|
| Premium | Vert émeraude | Utiliser le service |
| Gratuit + crédits OK | Bleu | Utiliser le service |
| Gratuit + crédits insuffisants | Rouge | Acheter des crédits |

## Expérience utilisateur

### Parcours utilisateur Premium

#### 1. Accès à la page Services IA

```
┌─────────────────────────────────────────┐
│ ← Retour au Dashboard                   │
│                                         │
│     Services Premium d'Assistance IA    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 👑 Premium PRO+     ✨              │ │
│ │ Expire dans 25 jours                │ │
│ │                                     │ │
│ │ ✨ Crédits IA                       │ │
│ │ ∞ (Accès illimité)                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

#### 2. Vue des cartes de services

Chaque carte affiche :
```
┌────────────────────────────────┐
│             [ACCÈS ILLIMITÉ] ──┤ Badge vert émeraude
│                                │
│  🎯 Matching IA                │
│                                │
│  Analyse de compatibilité...  │
│                                │
│  ✓ Analyse complète            │
│  ✓ Score détaillé              │
│  ✓ Recommandations             │
│                                │
│ ┌────────────────────────────┐ │
│ │ ∞ Accès illimité inclus    │ │ Au lieu du coût
│ └────────────────────────────┘ │
│                                │
│ [  Utiliser le service  →  ]  │ Bouton vert
└────────────────────────────────┘
```

#### 3. Alerte d'expiration (si < 7 jours)

```
┌─────────────────────────────────────────┐
│ 👑 Premium PRO+     ✨                  │
│ Expire dans 3 jours ⚠️                  │
│                                         │
│ ∞ (Accès illimité)                      │
│                                         │
│ ⚠️ Votre abonnement Premium expire      │
│    bientôt. Pensez à le renouveler.    │
└─────────────────────────────────────────┘
```

### Parcours utilisateur gratuit

#### 1. Accès à la page Services IA

```
┌─────────────────────────────────────────┐
│     Services Premium d'Assistance IA    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 💰 Solde de crédits IA              │ │
│ │                                     │ │
│ │ 250 crédits                         │ │
│ │                         [Acheter]   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 2. Vue des cartes de services

Avec crédits suffisants :
```
┌────────────────────────────────┐
│             [PREMIUM] ─────────┤ Badge jaune-orange
│                                │
│  🎯 Matching IA                │
│                                │
│  50 crédits                    │
│                                │
│ [  Utiliser le service  →  ]  │ Bouton bleu
└────────────────────────────────┘
```

Avec crédits insuffisants :
```
┌────────────────────────────────┐
│  🎯 Matching IA                │
│                                │
│  50 crédits                    │
│                                │
│ ┌────────────────────────────┐ │
│ │ ⚠️ Crédits insuffisants    │ │
│ └────────────────────────────┘ │
│                                │
│ [  Acheter des crédits  ]     │ Bouton rouge
└────────────────────────────────┘
```

## Guide couleurs

### Palette Premium

| Élément | Couleur Tailwind | Hex | Usage |
|---------|------------------|-----|-------|
| Badge Premium | `from-yellow-400 to-orange-500` | #FBBF24 → #F97316 | Badge principal |
| Badge Accès illimité | `from-green-500 to-emerald-600` | #10B981 → #059669 | Services accessibles |
| Fond Premium | `from-yellow-50 to-orange-50` | #FEFCE8 → #FFF7ED | Arrière-plan |
| Texte Premium | `text-orange-900` | #7C2D12 | Texte principal |
| Bordure Premium | `border-yellow-300` | #FDE047 | Bordures |
| Bouton Premium | `from-green-600 to-emerald-700` | #059669 → #047857 | Boutons d'action |

### Palette Standard

| Élément | Couleur Tailwind | Hex | Usage |
|---------|------------------|-----|-------|
| Bouton Standard | `from-blue-600 to-blue-700` | #2563EB → #1D4ED8 | Boutons standards |
| Crédits bas | `text-red-600` | #DC2626 | Alerte crédits |
| Badge gratuit | `bg-green-100` | #DCFCE7 | Services gratuits |

## Tests recommandés

### Scénarios de test Premium

#### Test 1 : Affichage du badge Premium

**Setup :** Utilisateur avec `is_premium = true` et `premium_expiration` dans le futur

**Vérifications :**
- [ ] Le badge "Premium PRO+" apparaît sur CreditBalance (variant prominent)
- [ ] Le symbole ∞ est visible
- [ ] Le message "Expire dans X jours" est correct
- [ ] Les couleurs dorées/oranges sont appliquées

#### Test 2 : Accès illimité aux services

**Setup :** Utilisateur Premium avec 0 crédits

**Vérifications :**
- [ ] Badge "ACCÈS ILLIMITÉ" visible sur toutes les cartes
- [ ] Aucun message "Crédits insuffisants"
- [ ] Tous les boutons affichent "Utiliser le service"
- [ ] Tous les boutons sont verts
- [ ] Les services s'ouvrent correctement au clic

#### Test 3 : Alerte d'expiration

**Setup :** Utilisateur Premium expirant dans 3 jours

**Vérifications :**
- [ ] L'alerte orange apparaît dans CreditBalance
- [ ] Le message mentionne l'expiration prochaine
- [ ] L'icône ⚠️ est visible
- [ ] Les couleurs d'avertissement sont appliquées

#### Test 4 : Expiration Premium

**Setup :** Utilisateur avec `premium_expiration` dans le passé

**Vérifications :**
- [ ] `isPremiumActive()` retourne `false`
- [ ] L'affichage revient à la version gratuite
- [ ] Le compteur de crédits réapparaît
- [ ] Les services nécessitent des crédits

### Scénarios de test Standard

#### Test 5 : Utilisateur gratuit avec crédits

**Setup :** Utilisateur gratuit avec 200 crédits

**Vérifications :**
- [ ] Solde de crédits affiché correctement
- [ ] Bouton "Acheter" visible
- [ ] Services ≤ 200 crédits accessibles (bouton bleu)
- [ ] Badge "PREMIUM" sur services premium uniquement

#### Test 6 : Utilisateur gratuit sans crédits

**Setup :** Utilisateur gratuit avec 0 crédits

**Vérifications :**
- [ ] Alerte "Solde faible" visible
- [ ] Message "Crédits insuffisants" sur services payants
- [ ] Boutons "Acheter des crédits" (rouges) sur services inaccessibles
- [ ] Services gratuits toujours accessibles

### Tests de régression

#### Test 7 : Fonctionnalité backend intacte

**Vérifications :**
- [ ] Les crédits sont toujours consommés pour les gratuits
- [ ] L'historique de consommation est conservé
- [ ] Les services IA fonctionnent normalement
- [ ] Les transactions de crédits sont enregistrées

#### Test 8 : Navigation et interactions

**Vérifications :**
- [ ] Le chatbot propose toujours la navigation
- [ ] Les services s'ouvrent dans les bonnes pages
- [ ] Le bouton "Acheter des crédits" redirige vers credit-store
- [ ] Retour au dashboard fonctionne

## Maintenance

### Ajout d'un nouveau service IA

Lorsqu'un nouveau service IA est ajouté à `premium_services` :

1. **Aucune modification UI requise**
   - Le système détecte automatiquement les nouveaux services
   - Les badges Premium s'appliquent automatiquement
   - La logique d'accès fonctionne sans changement

2. **Vérifier uniquement :**
   - Le `credits_cost` est défini correctement
   - Le champ `type` est 'free' ou 'premium'
   - L'icône est dans `iconMap` ou utilise l'icône par défaut

### Modification du statut Premium d'un utilisateur

Pour activer Premium pour un utilisateur :

```sql
UPDATE profiles
SET
  is_premium = true,
  premium_expiration = NOW() + INTERVAL '30 days'
WHERE id = 'user_id';
```

Pour désactiver Premium :

```sql
UPDATE profiles
SET
  is_premium = false,
  premium_expiration = NULL
WHERE id = 'user_id';
```

**Note :** L'UI se met à jour automatiquement au prochain refresh du profil.

### Prolongation d'abonnement

Pour prolonger un abonnement Premium existant :

```sql
UPDATE profiles
SET premium_expiration = premium_expiration + INTERVAL '30 days'
WHERE id = 'user_id' AND is_premium = true;
```

## Dépannage

### Problème : Le badge Premium n'apparaît pas

**Causes possibles :**
1. `profile` n'est pas chargé correctement
2. `is_premium` est `false`
3. `premium_expiration` est `null` ou dans le passé

**Solution :**
```typescript
console.log('Profile:', profile);
console.log('isPremium:', isPremiumActive(profile));
console.log('Expiration:', profile?.premium_expiration);
```

Vérifier dans la base de données :
```sql
SELECT id, is_premium, premium_expiration
FROM profiles
WHERE id = 'user_id';
```

### Problème : Les services restent bloqués pour Premium

**Causes possibles :**
1. La variable `isPremium` n'est pas calculée correctement
2. Le composant n'a pas accès au profil

**Solution :**
Vérifier dans PremiumAIServices.tsx :
```typescript
console.log('User Premium Status:', isPremium);
console.log('Service disabled:', isDisabled);
```

Le `isDisabled` doit être `false` pour tous les services si `isPremium === true`.

### Problème : Le compteur de jours est incorrect

**Causes possibles :**
1. Décalage de fuseau horaire
2. Format de date incorrect

**Solution :**
Vérifier le calcul :
```typescript
const days = getDaysUntilExpiration(profile?.premium_expiration);
console.log('Days until expiration:', days);
console.log('Expiration date:', new Date(profile?.premium_expiration || ''));
console.log('Current date:', new Date());
```

## Migration depuis l'ancienne UI

Si vous migrez depuis une version antérieure :

1. **Aucune migration de données nécessaire**
   - Les champs `is_premium` et `premium_expiration` existent déjà
   - Aucun nouveau champ de base de données

2. **Vérifier la compatibilité**
   - Tous les anciens abonnements Premium restent actifs
   - Les dates d'expiration sont respectées
   - Les crédits existants sont préservés

3. **Tests post-migration**
   - Tester avec un compte Premium existant
   - Vérifier que les badges s'affichent
   - Confirmer l'accès illimité aux services

## Évolutions futures

### Court terme

1. **Notifications d'expiration**
   - Email 7 jours avant expiration
   - Notification in-app 3 jours avant

2. **Page de renouvellement**
   - Lien direct depuis l'alerte d'expiration
   - Parcours de paiement optimisé

3. **Historique Premium**
   - Tableau des abonnements passés
   - Dates de début/fin
   - Durées totales

### Moyen terme

1. **Niveaux Premium multiples**
   - Premium Basic, Pro, Enterprise
   - Badges différenciés par niveau
   - Avantages variables

2. **Badge Premium personnalisé**
   - Choix de couleur (or, platine, diamant)
   - Icônes spéciales pour anciens membres
   - Badges d'anniversaire

3. **Dashboard Premium dédié**
   - Statistiques d'utilisation IA
   - Économies réalisées vs crédits
   - Recommandations personnalisées

## Conclusion

Ces améliorations UI Premium transforment l'expérience utilisateur pour les membres Premium PRO+ :

✅ **Visibilité immédiate** du statut Premium avec badge couronne
✅ **Accès sans friction** à tous les services IA
✅ **Différenciation claire** entre Premium et gratuit
✅ **Alertes intelligentes** pour renouvellement
✅ **Design cohérent** avec l'identité de la marque
✅ **Code maintenable** avec fonctions utilitaires réutilisables

Les utilisateurs Premium bénéficient désormais d'une expérience privilégiée qui justifie leur investissement dans l'abonnement PRO+.
