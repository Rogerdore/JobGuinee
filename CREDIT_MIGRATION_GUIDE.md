# 🔄 Guide de Migration - Système de Crédits IA

## 📌 Objectif

Ce guide aide les développeurs à migrer du code utilisant les anciennes fonctions de crédits vers le nouveau système unifié.

---

## 🆚 Avant / Après

### ❌ AVANT (À remplacer)

```typescript
// Ancien code utilisant consume_global_credits
const { data, error } = await supabase.rpc('consume_global_credits', {
  p_service_code: 'ai_cv_generation',
  p_metadata: {}
});

if (error || !data.success) {
  alert('Erreur');
  return;
}

console.log('Nouveau solde:', data.new_balance);
```

### ✅ APRÈS (Nouveau système)

```typescript
import { useConsumeCredits } from '../hooks/useCreditService';
import { SERVICES } from '../services/creditService';

const { consumeCredits } = useConsumeCredits();

const result = await consumeCredits(
  SERVICES.AI_CV_GENERATION,
  { userData: profileData }
);

if (!result.success) {
  alert(result.message);
  return;
}

console.log('Crédits restants:', result.credits_remaining);
```

---

## 📋 Table de Correspondance

### Fonctions SQL Anciennes → Nouvelle

| Ancienne Fonction | Nouvelle Fonction | Hook React |
|-------------------|-------------------|------------|
| `consume_global_credits` | `use_ai_credits` | `useConsumeCredits()` |
| `consume_service_credits` | `use_ai_credits` | `useConsumeCredits()` |
| `use_credits_for_service` | `use_ai_credits` | `useConsumeCredits()` |
| `use_service_credits` | `use_ai_credits` | `useConsumeCredits()` |
| `get_user_credit_balance` | `getUserBalance()` | `useCreditBalance()` |

---

## 🔧 Scénarios de Migration

### Scénario 1 : Appel RPC Direct

**AVANT :**
```typescript
const { data, error } = await supabase.rpc('consume_service_credits', {
  p_service_code: 'job_matching',
  p_metadata: { source: 'dashboard' }
});
```

**APRÈS :**
```typescript
import { CreditService, SERVICES } from '../services/creditService';

const result = await CreditService.consumeCredits(
  userId,
  SERVICES.AI_JOB_MATCHING,
  { source: 'dashboard' }
);
```

OU (avec hook) :
```typescript
import { useConsumeCredits } from '../hooks/useCreditService';
import { SERVICES } from '../services/creditService';

const { consumeCredits } = useConsumeCredits();

const result = await consumeCredits(
  SERVICES.AI_JOB_MATCHING,
  { source: 'dashboard' }
);
```

---

### Scénario 2 : Vérification du Solde

**AVANT :**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('credits_balance')
  .eq('id', userId)
  .single();

const balance = profile?.credits_balance || 0;
```

**APRÈS :**
```typescript
import { useCreditBalance } from '../hooks/useCreditService';

const { balance, loading } = useCreditBalance();

// balance.credits_available contient le solde
```

---

### Scénario 3 : Affichage du Solde dans l'UI

**AVANT :**
```typescript
const [balance, setBalance] = useState(0);

useEffect(() => {
  const fetchBalance = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', userId)
      .single();

    setBalance(data?.credits_balance || 0);
  };

  fetchBalance();
}, [userId]);

return <div>Crédits: {balance}</div>;
```

**APRÈS :**
```typescript
import CreditBalance from '../components/credits/CreditBalance';

return <CreditBalance />;
```

---

### Scénario 4 : Vérification Avant Consommation

**AVANT :**
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('credits_balance')
  .eq('id', userId)
  .single();

const { data: service } = await supabase
  .from('service_credit_costs')
  .select('credits_cost')
  .eq('service_code', 'ai_cv_generation')
  .single();

if (profile.credits_balance < service.credits_cost) {
  alert('Crédits insuffisants');
  return;
}

// Continuer...
```

**APRÈS :**
```typescript
import { useConsumeCredits } from '../hooks/useCreditService';
import { SERVICES } from '../services/creditService';

const { checkSufficient } = useConsumeCredits();

const check = await checkSufficient(SERVICES.AI_CV_GENERATION);

if (!check.sufficient) {
  alert(check.message);
  return;
}

// Continuer...
```

---

### Scénario 5 : Afficher le Coût d'un Service

**AVANT :**
```typescript
const [cost, setCost] = useState(0);

useEffect(() => {
  const fetchCost = async () => {
    const { data } = await supabase
      .from('service_credit_costs')
      .select('credits_cost')
      .eq('service_code', 'job_matching')
      .single();

    setCost(data?.credits_cost || 0);
  };

  fetchCost();
}, []);

return <span>{cost} crédits</span>;
```

**APRÈS :**
```typescript
import ServiceCostBadge from '../components/credits/ServiceCostBadge';
import { SERVICES } from '../services/creditService';

return <ServiceCostBadge serviceCode={SERVICES.AI_JOB_MATCHING} />;
```

---

## 🎯 Migration par Fichier

### Fichier Type : Service IA (Exemple CV Generator)

**Structure AVANT :**
```typescript
// AICVGenerator.tsx
import { supabase } from '../lib/supabase';

const handleGenerate = async () => {
  // Vérifier les crédits manuellement
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits_balance')
    .eq('id', userId)
    .single();

  if (!profile || profile.credits_balance < 50) {
    alert('Crédits insuffisants');
    return;
  }

  // Appeler l'ancien RPC
  const { data, error } = await supabase.rpc('consume_global_credits', {
    p_service_code: 'ai_cv_generation',
    p_metadata: {}
  });

  if (error) {
    alert('Erreur');
    return;
  }

  // Continuer avec génération CV
  await generateCV();
};
```

**Structure APRÈS :**
```typescript
// AICVGenerator.tsx
import { useState } from 'react';
import { useConsumeCredits } from '../hooks/useCreditService';
import { SERVICES } from '../services/creditService';
import CreditConfirmModal from '../components/credits/CreditConfirmModal';

const [showConfirm, setShowConfirm] = useState(false);

const handleGenerateClick = () => {
  setShowConfirm(true);
};

const handleConfirm = async (success: boolean, result?: any) => {
  if (!success) {
    alert(result.message);
    return;
  }

  // Crédits déjà consommés avec succès
  console.log('Crédits restants:', result.credits_remaining);

  // Continuer avec génération CV
  await generateCV();
};

return (
  <>
    <button onClick={handleGenerateClick}>
      Générer mon CV
    </button>

    <CreditConfirmModal
      isOpen={showConfirm}
      onClose={() => setShowConfirm(false)}
      onConfirm={handleConfirm}
      serviceCode={SERVICES.AI_CV_GENERATION}
      serviceName="Génération de CV IA"
      serviceCost={50}
      description="Créez un CV professionnel avec l'IA"
    />
  </>
);
```

---

## 🔍 Recherche et Remplacement

### Étapes pour Migrer un Fichier

1. **Identifier les appels RPC anciens**
   ```bash
   # Rechercher dans le projet
   grep -r "consume_global_credits" src/
   grep -r "consume_service_credits" src/
   grep -r "use_credits_for_service" src/
   ```

2. **Remplacer les imports**
   ```typescript
   // Ajouter en haut du fichier
   import { useConsumeCredits } from '../hooks/useCreditService';
   import { SERVICES } from '../services/creditService';
   ```

3. **Remplacer l'initialisation**
   ```typescript
   // Dans le composant
   const { consumeCredits, consuming } = useConsumeCredits();
   ```

4. **Remplacer les appels**
   - Voir les exemples ci-dessus selon le scénario

5. **Tester**
   - Vérifier que la consommation fonctionne
   - Vérifier la gestion d'erreur
   - Vérifier l'affichage du solde

---

## ⚠️ Pièges Courants

### Piège 1 : Nom du Service

**❌ ERREUR :**
```typescript
consumeCredits('cv_generation', data);
// Service code incorrect
```

**✅ CORRECT :**
```typescript
import { SERVICES } from '../services/creditService';
consumeCredits(SERVICES.AI_CV_GENERATION, data);
```

### Piège 2 : Gestion Asynchrone

**❌ ERREUR :**
```typescript
consumeCredits(serviceCode, data);
generateCV(); // Exécuté avant la consommation
```

**✅ CORRECT :**
```typescript
const result = await consumeCredits(serviceCode, data);
if (result.success) {
  await generateCV();
}
```

### Piège 3 : État de Chargement

**❌ ERREUR :**
```typescript
<button onClick={handleAction}>
  Générer
</button>
// Pas de disabled pendant l'action
```

**✅ CORRECT :**
```typescript
const { consumeCredits, consuming } = useConsumeCredits();

<button onClick={handleAction} disabled={consuming}>
  {consuming ? 'Traitement...' : 'Générer'}
</button>
```

---

## 📊 Checklist de Migration

Pour chaque fichier à migrer :

- [ ] Identifier tous les appels RPC anciens
- [ ] Ajouter les imports nécessaires
- [ ] Remplacer les appels par le nouveau système
- [ ] Ajouter la gestion d'erreur appropriée
- [ ] Ajouter les états de chargement
- [ ] Tester la consommation
- [ ] Tester avec solde insuffisant
- [ ] Vérifier l'affichage du solde
- [ ] Supprimer le code ancien
- [ ] Commit les changements

---

## 🧪 Tests de Non-Régression

Après migration, tester :

1. **Consommation normale**
   - Crédits suffisants
   - Service actif
   - Utilisateur authentifié

2. **Cas d'erreur**
   - Crédits insuffisants
   - Service inactif
   - Utilisateur non authentifié

3. **UI**
   - Solde affiché correctement
   - États de chargement
   - Messages d'erreur clairs

4. **Traçabilité**
   - Vérifier `credit_transactions`
   - Vérifier `ai_service_usage_history`

---

## 🎓 Conseils

### Pour une Migration Rapide

1. **Commencer par les nouveaux développements**
   - Utiliser le nouveau système directement
   - Pas besoin de toucher l'ancien code immédiatement

2. **Migrer progressivement**
   - Fichier par fichier
   - Tester après chaque migration

3. **Utiliser les composants**
   - `CreditConfirmModal` pour UX consistante
   - `CreditBalance` pour affichage uniforme

4. **S'inspirer de l'exemple**
   - Voir `/src/components/credits/CreditServiceExample.tsx`
   - Copier les patterns qui fonctionnent

---

## 📞 Support Migration

### Questions Fréquentes

**Q : Dois-je migrer tout le code existant ?**
R : Non, migrez au fur et à mesure. Le nouveau système coexiste avec l'ancien.

**Q : Les anciennes fonctions SQL vont-elles être supprimées ?**
R : Oui, mais après une période de transition. Migrez dès que possible.

**Q : Comment gérer les services qui n'ont pas de constante ?**
R : Ajoutez la constante dans `SERVICES` ou utilisez le `service_code` en string.

**Q : Puis-je utiliser le service sans les hooks React ?**
R : Oui, utilisez directement `CreditService.consumeCredits()`.

---

## ✅ Validation Post-Migration

Après avoir migré un fichier :

- [ ] Le code compile sans erreur
- [ ] Les tests passent
- [ ] La consommation fonctionne en dev
- [ ] L'UI est cohérente
- [ ] Pas de régression fonctionnelle
- [ ] Documentation mise à jour si nécessaire

---

**Date :** 1er Décembre 2025
**Version :** 1.0
**Statut :** Guide Prêt
