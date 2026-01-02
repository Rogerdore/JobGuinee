# Script de Migration Automatisée des Alertes

## Fichiers Migrés ✅

1. ✅ **AdminCreditPackages.tsx** - 8 alertes migrées
2. ✅ **AdminJobList.tsx** - 23 alertes migrées

## Règles de Migration Automatique

### Pour les alertes simples:

```typescript
// AVANT
alert('Opération réussie!');

// APRÈS
showSuccess('Opération réussie', 'L\'opération a été effectuée avec succès!');
```

### Pour les erreurs:

```typescript
// AVANT
alert('Erreur lors de...');

// APRÈS
showError('Erreur', 'Une erreur est survenue. Veuillez réessayer.');
```

### Pour les confirmations:

```typescript
// AVANT
if (!confirm('Êtes-vous sûr?')) return;
doAction();

// APRÈS
showConfirm('Confirmer', 'Êtes-vous sûr?', () => {
  doAction();
}, 'warning');
```

## Fichiers Prioritaires à Migrer

### Pages Admin (Haute Priorité)
- AdminPremiumSubscriptions.tsx (11 alertes)
- CMSAdmin.tsx (14 alertes)
- AdminDiffusionSettings.tsx (8 alertes)
- AdminFormationBoost.tsx (7 alertes)
- AdminCandidateVerifications.tsx (7 alertes)
- AdminCreditPurchases.tsx (7 alertes)
- AdminEmailTemplates.tsx (5 alertes)
- AdminEnterpriseSubscriptions.tsx (5 alertes)

### Pages Utilisateurs (Moyenne Priorité)
- Home.tsx (6 alertes)
- CreditStore.tsx (11 alertes)
- PremiumSubscribe.tsx (4 alertes)
- PremiumAIServices.tsx (3 alertes)

### Composants (Basse Priorité - automatique via Context)
Tous les composants peuvent utiliser `useModalContext()` directement.

## Instructions pour Chaque Type de Fichier

### 1. Ajouter l'import

```typescript
import { useModalContext } from '../contexts/ModalContext';
```

### 2. Déstructurer dans le composant

```typescript
const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
```

### 3. Remplacements standards

| Pattern | Remplacement |
|---------|--------------|
| `alert('...succès')` | `showSuccess('Titre', 'Message')` |
| `alert('Erreur...')` | `showError('Erreur', 'Message')` |
| `if (!confirm(...)) return;` | `showConfirm('Titre', 'Message', () => {...})` |

## Progress Tracking

Total: 184 alertes dans 42 fichiers
- ✅ Migrées: 31 (17%)
- ⏳ En attente: 153 (83%)

## Avantages de la Migration

1. **UX moderne**: Design professionnel au lieu d'alertes natives
2. **Pédagogie**: Messages clairs avec icônes et couleurs
3. **Cohérence**: Même style partout dans l'application
4. **Accessibilité**: Support clavier et screen readers
5. **Mobile-friendly**: Responsive et adaptatif

## Tests Recommandés

Après chaque migration:
1. Vérifier que toutes les alertes de succès apparaissent
2. Tester les confirmations (annuler et confirmer)
3. Vérifier les messages d'erreur
4. Tester sur mobile
5. Vérifier le support clavier (Escape)
