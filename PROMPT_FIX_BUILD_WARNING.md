# 🔧 Prompt Bolt : Correction Warning Build Supabase

## ⚠️ Problème Détecté

Le build affiche un warning concernant `/src/lib/supabase.ts` qui est importé à la fois de manière **statique** et **dynamique** par différents fichiers, ce qui empêche Vite d'optimiser correctement le bundling.

```
(!) /tmp/cc-agent/61845223/project/src/lib/supabase.ts is dynamically imported
by RecruiterMatchingPricingAdmin.tsx, socialShareService.ts
but also statically imported by [many other files]
```

---

## 📋 Prompt pour Bolt

Copiez-collez ce prompt dans Bolt :

```
OBJECTIF : Corriger le warning de build Vite concernant les imports mixtes (statiques + dynamiques) de supabase.ts

PROBLÈME :
- Le fichier src/lib/supabase.ts est importé dynamiquement par certains fichiers
- Et importé statiquement par d'autres
- Cela empêche Vite d'optimiser correctement le code splitting

SOLUTION :
Remplacer TOUS les imports dynamiques de supabase par des imports statiques standards.

FICHIERS À CORRIGER :

1. src/components/admin/RecruiterMatchingPricingAdmin.tsx
2. src/services/socialShareService.ts

INSTRUCTIONS DÉTAILLÉES :

Pour CHAQUE fichier listé ci-dessus :

1. Lire le fichier
2. Chercher les patterns d'import dynamique :
   - `const { supabase } = await import('../../lib/supabase')`
   - `const { supabase } = await import('../lib/supabase')`
   - `import('...lib/supabase')`

3. Remplacer par un import statique standard en haut du fichier :
   - `import { supabase } from '../../lib/supabase';` (ajuster le chemin selon la profondeur du fichier)

4. Supprimer les blocs try-catch autour de l'import dynamique si présents

5. Si l'import était dans une fonction async, garder la fonction async mais déplacer l'import en haut du fichier

EXEMPLE DE TRANSFORMATION :

❌ AVANT (import dynamique) :
```typescript
async function fetchData() {
  try {
    const { supabase } = await import('../../lib/supabase');
    const { data } = await supabase.from('table').select();
    return data;
  } catch (error) {
    console.error(error);
  }
}
```

✅ APRÈS (import statique) :
```typescript
import { supabase } from '../../lib/supabase';

async function fetchData() {
  try {
    const { data } = await supabase.from('table').select();
    return data;
  } catch (error) {
    console.error(error);
  }
}
```

VÉRIFICATIONS IMPORTANTES :

1. ✅ Vérifier que le chemin d'import est correct selon la position du fichier
2. ✅ Garder toute la logique métier intacte
3. ✅ Ne pas toucher aux autres imports
4. ✅ Préserver la gestion d'erreurs existante
5. ✅ Tester que le code compile sans erreur

APRÈS LES MODIFICATIONS :

1. Vérifier qu'il n'y a plus d'imports dynamiques de supabase :
   - Rechercher dans tous les fichiers : `import('.*supabase')`

2. Lancer le build pour confirmer :
   ```bash
   npm run build
   ```

3. Le warning doit avoir disparu

NE PAS :
- ❌ Modifier src/lib/supabase.ts lui-même
- ❌ Changer la logique métier des fichiers
- ❌ Toucher aux imports statiques existants de supabase
- ❌ Modifier d'autres fichiers que ceux listés

RÉSULTAT ATTENDU :
- Build sans warning concernant supabase.ts
- Tous les imports de supabase sont statiques et en haut des fichiers
- L'application fonctionne exactement comme avant
```

---

## 🎯 Alternative : Prompt Court

Si vous préférez un prompt plus concis :

```
Corriger le warning Vite build : supabase.ts est importé à la fois statiquement et dynamiquement.

Fichiers à corriger :
1. src/components/admin/RecruiterMatchingPricingAdmin.tsx
2. src/services/socialShareService.ts

Dans ces fichiers, remplacer les imports dynamiques :
`const { supabase } = await import('../../lib/supabase')`

Par des imports statiques en haut du fichier :
`import { supabase } from '../../lib/supabase';`

Ajuster le chemin relatif selon la position du fichier.
Garder toute la logique métier intacte.
Puis lancer npm run build pour vérifier.
```

---

## 📝 Notes Techniques

### Pourquoi ce warning ?

Vite/Rollup ne peut pas optimiser correctement le code splitting quand un module est importé de deux manières différentes :
- **Import statique** : chargé au démarrage, inclus dans le chunk principal
- **Import dynamique** : chargé à la demande, crée un chunk séparé

Quand les deux coexistent pour le même module, Vite ne sait pas comment organiser le code.

### Pourquoi utiliser des imports statiques ?

Pour `supabase.ts` :
- ✅ Utilisé dans presque toute l'application
- ✅ Petit fichier (juste la config client)
- ✅ Besoin dès le démarrage pour l'authentification
- ✅ Pas de bénéfice à le charger dynamiquement

### Quand utiliser des imports dynamiques ?

Les imports dynamiques sont utiles pour :
- 📦 Grosses librairies utilisées rarement (ex: éditeur PDF)
- 🔀 Routes lazy-loaded
- 🎨 Composants conditionnels lourds

Mais pas pour les utilitaires essentiels comme supabase.

---

## ✅ Vérification Post-Correction

Après avoir appliqué les corrections dans Bolt :

1. **Chercher les imports dynamiques restants** :
   ```bash
   grep -r "import('.*supabase')" src/
   ```
   Résultat attendu : Aucune correspondance

2. **Build** :
   ```bash
   npm run build
   ```
   Résultat attendu : Pas de warning sur supabase.ts

3. **Test rapide** :
   - Ouvrir l'application
   - Tester la connexion
   - Vérifier qu'il n'y a pas d'erreur console

---

## 🚨 En Cas de Problème

Si après la correction, l'application ne fonctionne plus :

### Erreur : "Cannot find module"
**Cause** : Chemin d'import incorrect

**Solution** : Vérifier le chemin relatif
```typescript
// Si le fichier est dans src/components/admin/
import { supabase } from '../../lib/supabase'; // Correct

// Si le fichier est dans src/services/
import { supabase } from '../lib/supabase'; // Correct
```

### Erreur : "supabase is not defined"
**Cause** : Import oublié ou mal placé

**Solution** : S'assurer que l'import est bien en haut du fichier
```typescript
// ✅ En haut du fichier
import { supabase } from '../lib/supabase';
import { useState } from 'react';

// ❌ Pas dans une fonction
function MyComponent() {
  import { supabase } from '../lib/supabase'; // ERREUR
}
```

### Erreur : "Top-level await"
**Cause** : Ancien code avec await dans l'import qu'on a oublié de retirer

**Solution** : Retirer le `await` de l'import
```typescript
// ❌ Avec le statique, pas de await
const { supabase } = await import('../lib/supabase');

// ✅ Import statique classique
import { supabase } from '../lib/supabase';
```

---

## 📊 Impact

### Avant
- ⚠️ Warning de build
- 🐌 Bundling non optimisé
- 📦 Chunks potentiellement dupliqués

### Après
- ✅ Build propre sans warning
- ⚡ Bundling optimisé par Vite
- 📦 Code mieux organisé
- 🎯 Chargement plus prévisible

---

## 🎓 Ressources

- [Vite Code Splitting](https://vitejs.dev/guide/features.html#dynamic-import)
- [ES Modules Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
- [Dynamic Import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)

---

## ✨ Bonne Pratique

Pour éviter ce problème à l'avenir :

**Règle simple** : Les modules utilitaires essentiels comme `supabase.ts`, `config.ts`, etc. doivent **TOUJOURS** être importés statiquement.

Réservez les imports dynamiques pour :
- Composants lourds conditionnels
- Routes lazy-loaded
- Grosses librairies optionnelles
