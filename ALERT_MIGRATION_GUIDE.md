# Guide de Migration des Alertes vers Modales Modernes

## Vue d'ensemble

Ce guide explique comment remplacer les alertes natives (`alert()`, `confirm()`) par des modales modernes et pédagogiques.

## Avantages des Modales Modernes

- **Design moderne** : Interface élégante avec animations fluides
- **Pédagogique** : Messages clairs avec icônes et couleurs adaptées
- **Personnalisable** : Types (success, error, warning, info) avec styles différents
- **Accessible** : Support clavier (Escape), focus management
- **Responsive** : S'adapte à tous les écrans

## Utilisation avec le Context (Recommandé)

### Import

```typescript
import { useModalContext } from '../contexts/ModalContext';
```

### Dans votre composant

```typescript
function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo, showConfirm } = useModalContext();

  // ... votre code
}
```

### Exemples de Remplacement

#### 1. Remplacer `alert()` simple

**AVANT:**
```typescript
alert('Opération réussie!');
```

**APRÈS:**
```typescript
showSuccess(
  'Opération réussie',
  'L\'opération a été effectuée avec succès!'
);
```

#### 2. Remplacer alert d'erreur

**AVANT:**
```typescript
alert('Erreur lors de la sauvegarde');
```

**APRÈS:**
```typescript
showError(
  'Erreur de sauvegarde',
  'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.'
);
```

#### 3. Remplacer `confirm()`

**AVANT:**
```typescript
if (!confirm('Êtes-vous sûr?')) return;
// Code à exécuter si confirmé
doSomething();
```

**APRÈS:**
```typescript
showConfirm(
  'Confirmer l\'action',
  'Êtes-vous sûr de vouloir effectuer cette action? Cette opération est irréversible.',
  () => {
    // Code à exécuter si confirmé
    doSomething();
  },
  'warning' // Type de modal
);
```

#### 4. Remplacer confirm avec async/await

**AVANT:**
```typescript
const deleteItem = async (id: string) => {
  if (!confirm('Supprimer cet élément?')) return;

  try {
    await api.delete(id);
    alert('Supprimé!');
  } catch (error) {
    alert('Erreur de suppression');
  }
};
```

**APRÈS:**
```typescript
const deleteItem = async (id: string) => {
  showConfirm(
    'Confirmer la suppression',
    'Êtes-vous sûr de vouloir supprimer cet élément? Cette action est irréversible.',
    async () => {
      try {
        await api.delete(id);
        showSuccess(
          'Élément supprimé',
          'L\'élément a été supprimé avec succès!'
        );
      } catch (error) {
        showError(
          'Erreur de suppression',
          'Une erreur est survenue lors de la suppression. Veuillez réessayer.'
        );
      }
    },
    'warning'
  );
};
```

## Utilisation avec le Hook (Alternative)

Si vous ne pouvez pas utiliser le Context, utilisez le hook directement:

```typescript
import ModernModal from '../components/modals/ModernModal';
import { useModal } from '../hooks/useModal';

function MyComponent() {
  const { modalState, showSuccess, showError, showConfirm, closeModal } = useModal();

  return (
    <>
      {/* Votre contenu */}

      <ModernModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        showCancel={modalState.showCancel}
        pedagogical={modalState.pedagogical}
      />
    </>
  );
}
```

## Types de Modales

### Success (Vert)
```typescript
showSuccess('Titre', 'Message de succès');
```

### Error (Rouge)
```typescript
showError('Titre', 'Message d\'erreur');
```

### Warning (Jaune/Orange)
```typescript
showWarning('Titre', 'Message d\'avertissement');
```

### Info (Bleu)
```typescript
showInfo('Titre', 'Message informatif');
```

## Messages Pédagogiques

Pour un message pédagogique détaillé:

```typescript
showWarning(
  'Attention',
  <>
    <p>Vous êtes sur le point de modifier des données importantes.</p>
    <ul className="list-disc ml-6 mt-2">
      <li>Cette action affectera tous les utilisateurs</li>
      <li>Les modifications sont immédiates</li>
      <li>Vous pouvez annuler dans les 5 minutes</li>
    </ul>
  </>,
  true // Mode pédagogique activé (par défaut)
);
```

## Désactiver le Mode Pédagogique

Si vous voulez une modale plus simple:

```typescript
showSuccess('Sauvegardé', 'Les données ont été sauvegardées', false);
```

## Checklist de Migration

Pour chaque fichier:

- [ ] Importer `useModalContext` (ou `useModal`)
- [ ] Déstructurer les fonctions nécessaires
- [ ] Remplacer tous les `alert()` par `showSuccess()`, `showError()`, etc.
- [ ] Remplacer tous les `confirm()` par `showConfirm()`
- [ ] Ajouter le composant `<ModernModal>` si nécessaire (pour hook)
- [ ] Tester toutes les actions

## Fichiers Modifiés

✅ `/src/pages/AdminCreditPackages.tsx` - Complété
⬜ 83 autres fichiers à migrer

## Support

Pour toute question, consultez:
- `/src/components/modals/ModernModal.tsx` - Composant de base
- `/src/hooks/useModal.ts` - Hook réutilisable
- `/src/contexts/ModalContext.tsx` - Context provider
