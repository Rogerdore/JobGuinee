# Guide - Système de Contrôle d'Accès UI/UX

## Vue d'ensemble

Système moderne de contrôle d'accès avec modals pédagogiques remplaçant les alertes basiques `alert()` par une expérience utilisateur fluide et guidée.

## Composants créés

### 1. AccessRestrictionModal
**Fichier** : `src/components/common/AccessRestrictionModal.tsx`

Modal moderne qui explique les restrictions d'accès et guide l'utilisateur vers les bonnes actions.

#### Types de restrictions supportés

**candidate-only** - Espace réservé aux candidats
- Icône : User (bleu)
- Message : "Cet espace est réservé aux candidats"
- CTA principal : "Créer un compte candidat"
- CTA secondaires : "Se connecter" / "Découvrir les offres"

**recruiter-only** - Espace réservé aux recruteurs
- Icône : Briefcase (vert)
- Message : "Cet espace est réservé aux recruteurs"
- CTA principal : "Créer un compte recruteur"
- CTA secondaires : "Se connecter" / "Découvrir les solutions B2B"

**premium-only** - Fonctionnalité Premium
- Icône : Shield (jaune)
- Message : "Fonctionnalité Premium requise"
- CTA principal : "Découvrir Premium"
- CTA secondaires : "Voir les tarifs"

**admin-only** - Accès administrateur
- Icône : Shield (rouge)
- Message : "Accès administrateur requis"
- CTA principal : "Retour à l'accueil"
- Contact support disponible

#### Utilisation basique

```tsx
import AccessRestrictionModal from '@/components/common/AccessRestrictionModal';

function MyComponent() {
  const [showModal, setShowModal] = useState(false);

  return (
    <AccessRestrictionModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      restrictionType="candidate-only"
      currentUserType={profile?.user_type}
      onNavigate={(page) => navigateToPage(page)}
    />
  );
}
```

#### Props

```typescript
interface AccessRestrictionModalProps {
  isOpen: boolean;                    // Contrôle l'affichage
  onClose: () => void;                // Fonction de fermeture
  restrictionType: 'candidate-only' | 'recruiter-only' | 'premium-only' | 'admin-only';
  currentUserType?: string;           // Type d'utilisateur actuel (affiché)
  onNavigate?: (page: string) => void; // Navigation vers les pages
}
```

### 2. useAccessControl Hook
**Fichier** : `src/hooks/useAccessControl.ts`

Hook React pour gérer facilement le contrôle d'accès.

#### Zones protégées configurées

```typescript
type RestrictedArea =
  | 'candidate-dashboard'        // Dashboard candidat
  | 'candidate-applications'     // Candidatures candidat
  | 'external-applications'      // Candidatures externes (80% profil requis)
  | 'recruiter-dashboard'        // Dashboard recruteur
  | 'cvtheque'                   // CVthèque (recruteur/admin)
  | 'job-moderation'            // Modération offres (admin)
  | 'admin-panel'               // Panel admin
  | 'premium-services'          // Services premium
  | 'ai-services'               // Services IA
```

#### Règles d'accès

Chaque zone a des règles définies :

```typescript
{
  'external-applications': {
    allowedUserTypes: ['candidate'],
    requiresProfileCompletion: 80  // 80% minimum
  },
  'cvtheque': {
    allowedUserTypes: ['recruiter', 'admin']
  },
  'premium-services': {
    allowedUserTypes: ['candidate', 'recruiter'],
    requiresPremium: true
  }
}
```

#### Utilisation

```tsx
import { useAccessControl } from '@/hooks/useAccessControl';

function CandidatePage() {
  const {
    hasAccess,           // Boolean : a accès ou non
    checkAccess,         // Fonction pour vérifier l'accès
    enforceAccess,       // Fonction qui montre le modal si refusé
    showRestrictionModal,// State du modal
    restrictionType,     // Type de restriction
    closeModal,          // Fermer le modal
    currentUserType      // Type d'utilisateur actuel
  } = useAccessControl('candidate-dashboard');

  useEffect(() => {
    if (!hasAccess) {
      // Rediriger ou afficher un message
    }
  }, [hasAccess]);

  return (
    <>
      <AccessRestrictionModal
        isOpen={showRestrictionModal}
        onClose={closeModal}
        restrictionType={restrictionType}
        currentUserType={currentUserType}
        onNavigate={handleNavigation}
      />

      {hasAccess && (
        <div>Contenu protégé</div>
      )}
    </>
  );
}
```

### 3. Wrappers et Helpers
**Fichier** : `src/components/common/AccessControlExample.tsx`

Composants prêts à l'emploi pour protéger facilement pages et actions.

#### ProtectedPageWrapper

Protège une page complète.

```tsx
import { ProtectedPageWrapper } from '@/components/common/AccessControlExample';

function CandidateDashboard() {
  return (
    <ProtectedPageWrapper
      area="candidate-dashboard"
      onNavigate={handleNavigation}
    >
      <div>
        {/* Contenu du dashboard candidat */}
      </div>
    </ProtectedPageWrapper>
  );
}
```

Si l'utilisateur n'a pas accès, il verra automatiquement le modal de restriction.

#### ProtectedActionButton

Protège une action spécifique (bouton).

```tsx
import { ProtectedActionButton } from '@/components/common/AccessControlExample';

function MyComponent() {
  return (
    <ProtectedActionButton
      area="external-applications"
      onNavigate={handleNavigation}
      onClick={() => {
        // Cette action ne s'exécute que si l'utilisateur a accès
        console.log('Action autorisée');
      }}
      className="px-6 py-3 bg-green-600 text-white rounded-xl"
    >
      Postuler à une offre externe
    </ProtectedActionButton>
  );
}
```

Le modal s'affichera automatiquement si l'utilisateur clique sans avoir les permissions.

#### AccessGuard

Affiche conditionnellement du contenu.

```tsx
import { AccessGuard } from '@/components/common/AccessControlExample';

function MyComponent() {
  return (
    <div>
      <AccessGuard
        area="premium-services"
        fallback={
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p>Fonctionnalité Premium uniquement</p>
          </div>
        }
      >
        <div>
          {/* Contenu accessible uniquement aux premium */}
        </div>
      </AccessGuard>
    </div>
  );
}
```

## Exemples d'utilisation pratiques

### Exemple 1 : Protéger le Dashboard Candidat

```tsx
import { ProtectedPageWrapper } from '@/components/common/AccessControlExample';

export default function CandidateDashboard({ onNavigate }) {
  return (
    <ProtectedPageWrapper
      area="candidate-dashboard"
      onNavigate={onNavigate}
    >
      <div className="min-h-screen bg-gray-50">
        <h1>Dashboard Candidat</h1>
        {/* Contenu du dashboard */}
      </div>
    </ProtectedPageWrapper>
  );
}
```

### Exemple 2 : Bouton Candidature Externe avec Vérification 80%

```tsx
import { useAccessControl } from '@/hooks/useAccessControl';
import AccessRestrictionModal from '@/components/common/AccessRestrictionModal';
import { Send } from 'lucide-react';

function ExternalApplicationButton({ onNavigate }) {
  const {
    enforceAccess,
    showRestrictionModal,
    restrictionType,
    closeModal,
    currentUserType
  } = useAccessControl('external-applications');

  const handleClick = () => {
    const canProceed = enforceAccess();

    if (canProceed) {
      onNavigate('external-application');
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 flex items-center gap-2"
      >
        <Send className="w-5 h-5" />
        Postuler à une offre externe
      </button>

      <AccessRestrictionModal
        isOpen={showRestrictionModal}
        onClose={closeModal}
        restrictionType={restrictionType}
        currentUserType={currentUserType}
        onNavigate={onNavigate}
      />
    </>
  );
}
```

### Exemple 3 : Accès CVthèque (Recruteur uniquement)

```tsx
import { ProtectedPageWrapper } from '@/components/common/AccessControlExample';

export default function CVTheque({ onNavigate }) {
  return (
    <ProtectedPageWrapper
      area="cvtheque"
      onNavigate={onNavigate}
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">CVthèque JobGuinée</h2>
            <p className="text-gray-600">Réservée aux recruteurs partenaires</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        {/* Contenu CVthèque */}
      </div>
    </ProtectedPageWrapper>
  );
}
```

### Exemple 4 : Fonctionnalité Premium conditionnelle

```tsx
import { AccessGuard } from '@/components/common/AccessControlExample';
import { Crown } from 'lucide-react';

function AIServicesSection({ onNavigate }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Services IA</h2>

      <AccessGuard
        area="premium-services"
        fallback={
          <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-yellow-600" />
              <h3 className="text-lg font-bold">Services Premium</h3>
            </div>
            <p className="text-gray-700 mb-4">
              Débloquez l'accès à nos services IA avancés avec un abonnement Premium.
            </p>
            <button
              onClick={() => onNavigate('premium-subscribe')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold"
            >
              Découvrir Premium
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Services IA disponibles */}
        </div>
      </AccessGuard>
    </div>
  );
}
```

### Exemple 5 : Remplacer un `alert()` existant

**Avant** :
```tsx
function handleAction() {
  if (profile?.user_type !== 'candidate') {
    alert('Cet espace est réservé aux candidats');
    return;
  }
  // Action...
}
```

**Après** :
```tsx
function MyComponent() {
  const {
    enforceAccess,
    showRestrictionModal,
    restrictionType,
    closeModal,
    currentUserType
  } = useAccessControl('candidate-dashboard');

  const handleAction = () => {
    const canProceed = enforceAccess();

    if (canProceed) {
      // Action autorisée
    }
    // Le modal s'affiche automatiquement si refusé
  };

  return (
    <>
      <button onClick={handleAction}>Action</button>

      <AccessRestrictionModal
        isOpen={showRestrictionModal}
        onClose={closeModal}
        restrictionType={restrictionType}
        currentUserType={currentUserType}
        onNavigate={handleNavigation}
      />
    </>
  );
}
```

## Design et UX

### Structure du modal

1. **Header avec icône**
   - Icône grande et colorée selon le type
   - Fond avec couleur adaptée
   - Bouton de fermeture (X) en haut à droite

2. **Titre principal**
   - Clair et explicite
   - Taille 2xl, gras
   - Centré

3. **Message principal**
   - Explication courte
   - Centré
   - Font medium

4. **Zone d'explication**
   - Bandeau bleu avec icône AlertCircle
   - Texte pédagogique détaillé
   - Bordure et fond doux

5. **Info utilisateur (optionnel)**
   - Affiche le type de compte actuel
   - Fond gris discret

6. **Actions (CTA)**
   - CTA principal : Vert, grande taille, avec icône
   - CTA secondaires : Blanc avec bordure, empilés
   - Bouton "Annuler" discret en bas

7. **Footer**
   - Lien vers le support
   - Fond gris clair

### Couleurs et design

**CTA Principal** : `bg-green-600 hover:bg-green-700`
**CTA Secondaires** : `bg-white border-2 border-gray-300`
**Bouton Annuler** : Texte gris, pas de fond

**Icônes par type** :
- Candidat : Bleu `bg-blue-100 text-blue-600`
- Recruteur : Vert `bg-green-100 text-green-600`
- Premium : Jaune `bg-yellow-100 text-yellow-600`
- Admin : Rouge `bg-red-100 text-red-600`

### Animations

- Apparition : Fade-in avec backdrop blur
- Icônes : Légère animation au hover
- Boutons : Transition smooth sur hover

## Configuration avancée

### Ajouter une nouvelle zone protégée

1. **Ajouter le type dans `useAccessControl.ts`** :

```typescript
type RestrictedArea =
  | 'candidate-dashboard'
  | 'my-new-area';  // Nouvelle zone
```

2. **Définir la règle d'accès** :

```typescript
const accessRules: Record<RestrictedArea, AccessRule> = {
  'my-new-area': {
    allowedUserTypes: ['candidate', 'recruiter'],
    requiresPremium: true,
    requiresProfileCompletion: 80
  }
};
```

3. **Utiliser la protection** :

```tsx
<ProtectedPageWrapper area="my-new-area">
  {/* Contenu protégé */}
</ProtectedPageWrapper>
```

### Personnaliser un message de restriction

Modifier `restrictionConfig` dans `AccessRestrictionModal.tsx` :

```typescript
'candidate-only': {
  icon: User,
  iconBg: 'bg-blue-100',
  iconColor: 'text-blue-600',
  title: 'Votre titre personnalisé',
  message: 'Votre message personnalisé',
  explanation: 'Explication détaillée personnalisée',
  primaryAction: {
    label: 'Action principale',
    icon: User,
    page: 'target-page'
  },
  secondaryActions: [
    {
      label: 'Action secondaire',
      page: 'autre-page'
    }
  ]
}
```

## Migration depuis les `alert()` existants

### Rechercher les occurrences

```bash
grep -r "alert(" src/
```

### Remplacer progressivement

Pour chaque `alert()` trouvé :

1. Identifier le type de restriction
2. Remplacer par le hook `useAccessControl`
3. Ajouter le composant `AccessRestrictionModal`
4. Tester le parcours utilisateur

### Exemple de migration

**Code existant** :
```tsx
if (!user) {
  alert('Vous devez être connecté');
  return;
}

if (profile?.user_type !== 'candidate') {
  alert('Cet espace est réservé aux candidats');
  return;
}
```

**Code migré** :
```tsx
const { enforceAccess, showRestrictionModal, restrictionType, closeModal } =
  useAccessControl('candidate-dashboard');

const handleAction = () => {
  const canProceed = enforceAccess();
  if (canProceed) {
    // Action
  }
};

return (
  <>
    <button onClick={handleAction}>Action</button>
    <AccessRestrictionModal
      isOpen={showRestrictionModal}
      onClose={closeModal}
      restrictionType={restrictionType}
      currentUserType={profile?.user_type}
      onNavigate={navigate}
    />
  </>
);
```

## Avantages de ce système

### Pour l'utilisateur
✅ Messages clairs et pédagogiques
✅ CTA visibles pour les bonnes actions
✅ Pas de blocage brutal
✅ Design moderne et professionnel
✅ Guidage vers la solution

### Pour le développeur
✅ Code réutilisable
✅ Configuration centralisée
✅ Facile à maintenir
✅ TypeScript strict
✅ Consistance dans toute l'app

### Pour le produit
✅ Augmentation des conversions
✅ Meilleure rétention
✅ Moins de frustration
✅ Parcours utilisateur optimisé
✅ Meilleure compréhension des restrictions

## Tests recommandés

### Tests fonctionnels
- [ ] Modal s'affiche correctement
- [ ] CTA principal fonctionne
- [ ] CTA secondaires fonctionnent
- [ ] Fermeture du modal fonctionne
- [ ] Navigation vers les bonnes pages
- [ ] Affichage du type d'utilisateur actuel

### Tests par type d'utilisateur
- [ ] Candidat accède au dashboard candidat
- [ ] Recruteur bloqué sur dashboard candidat
- [ ] Admin accède à toutes les zones
- [ ] Non-connecté voit le modal de connexion

### Tests responsive
- [ ] Modal responsive sur mobile
- [ ] Boutons accessibles
- [ ] Texte lisible
- [ ] Overlay fonctionne

## Conclusion

Ce système remplace les `alert()` basiques par une expérience utilisateur moderne et guidée, augmentant la conversion et améliorant la satisfaction utilisateur.

**Tous les composants sont prêts à l'emploi** et peuvent être utilisés immédiatement dans l'application JobGuinée.

---

**Version** : 1.0
**Date** : 30 Décembre 2025
**Plateforme** : JobGuinée
