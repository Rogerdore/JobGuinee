# Fix - Validation des Achats de Crédits IA par l'Admin

## Problème Identifié

L'admin ne pouvait pas valider les achats de crédits IA. Une erreur "UNAUTHORIZED" s'affichait lors du clic sur le bouton de validation.

## Cause du Problème

La fonction `complete_credit_purchase` vérifie que l'utilisateur connecté a le type `admin` dans la base de données. Le problème était que:

1. La page `AdminCreditPurchases` n'utilisait **pas** le contexte d'authentification (`AuthContext`)
2. Aucune vérification de session n'était faite avant l'appel à la fonction
3. Si la session était expirée, l'appel échouait silencieusement

## Solution Implémentée

### 1. Ajout du contexte d'authentification

```typescript
import { useAuth } from '../contexts/AuthContext';
const { user, profile, isAdmin } = useAuth();
```

### 2. Vérification de l'authentification avant chargement

```typescript
useEffect(() => {
  if (user && profile) {
    if (!isAdmin) {
      setAuthError('Vous devez être administrateur pour accéder à cette page');
    } else {
      setAuthError(null);
      loadData();
    }
  }
}, [statusFilter, user, profile, isAdmin]);
```

### 3. Vérification de session avant validation

```typescript
const handleValidate = async (purchaseId: string, notes?: string) => {
  // Vérifier que la session est active
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    showError('Erreur', 'Session expirée. Veuillez vous reconnecter.');
    return;
  }

  // Continuer avec la validation...
};
```

### 4. Affichage des erreurs d'authentification

Deux écrans d'erreur ont été ajoutés:

- **Accès refusé** : Si l'utilisateur n'est pas admin
- **Authentification requise** : Si l'utilisateur n'est pas connecté

### 5. Logs de débogage

Des logs console ont été ajoutés pour faciliter le diagnostic:

```typescript
console.log('[AdminCreditPurchases] Validating purchase:', purchaseId);
console.log('[AdminCreditPurchases] Current user:', user?.email);
console.log('[AdminCreditPurchases] Profile type:', profile?.user_type);
console.log('[AdminCreditPurchases] Is admin:', isAdmin);
```

## Comment Tester

### Étape 1 : Vérifier le compte admin

1. Ouvrir la console du navigateur (F12)
2. Se connecter avec un compte admin (par exemple: `doreroger07@yahoo.fr`)
3. Vérifier dans les logs que `Is admin: true`

### Étape 2 : Accéder à la page de validation

1. Aller sur la page "Validation des Paiements"
2. Vérifier que la liste des achats s'affiche correctement
3. Vous devriez voir les achats avec statut "Preuve envoyée" par défaut

### Étape 3 : Valider un achat

1. Cliquer sur l'icône œil pour voir les détails d'un achat
2. Cliquer sur le bouton vert "Valider le paiement"
3. Vérifier les logs dans la console:
   - Session exists: true
   - Session user: [email de l'admin]
4. Si validation réussie, vous verrez:
   - Message de succès: "Paiement validé! X crédits ajoutés"
   - L'achat disparaît de la liste
   - Les crédits sont ajoutés au solde de l'utilisateur

### Étape 4 : Vérifier les crédits ajoutés

```sql
-- Vérifier le solde de l'utilisateur
SELECT id, email, credits_balance
FROM profiles
WHERE id = '[user_id_de_l_achat]';

-- Vérifier la transaction
SELECT *
FROM credit_transactions
WHERE reference_id = '[purchase_id]';
```

## Cas d'Erreur Possibles

### Erreur "Session expirée"

**Cause** : La session Supabase a expiré
**Solution** : Se déconnecter puis se reconnecter

### Erreur "Accès refusé"

**Cause** : Le compte n'a pas le type "admin" dans la base
**Solution** : Exécuter la requête SQL suivante:

```sql
UPDATE profiles
SET user_type = 'admin'
WHERE email = 'votre_email@example.com';
```

### Erreur "FORBIDDEN"

**Cause** : La fonction `complete_credit_purchase` ne détecte pas l'admin
**Solution** : Vérifier dans la base de données:

```sql
SELECT id, email, user_type
FROM profiles
WHERE id = auth.uid();
```

## Prochaines Étapes

Si le problème persiste après ces corrections:

1. Ouvrir la console du navigateur
2. Noter tous les logs qui commencent par `[AdminCreditPurchases]`
3. Vérifier l'email de l'utilisateur connecté
4. Vérifier le `user_type` dans la base de données

## Fichiers Modifiés

- `src/pages/AdminCreditPurchases.tsx` : Ajout vérifications d'authentification et logs de débogage

## Fonction Base de Données

La fonction `complete_credit_purchase` reste inchangée:

```sql
-- Migration: supabase/migrations/20260102170627_add_credit_purchase_notifications.sql
CREATE OR REPLACE FUNCTION complete_credit_purchase(
  p_purchase_id uuid,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
```

**Vérifications dans la fonction**:
1. `auth.uid()` retourne l'ID de l'utilisateur connecté
2. Vérifie que `user_type = 'admin'` dans la table `profiles`
3. Si non admin → retourne `"error": "FORBIDDEN"`
4. Si admin → ajoute les crédits et marque comme complété
