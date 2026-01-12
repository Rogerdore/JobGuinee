# 🛡️ Chameleon Guard - Protection Anti-Crash

## Problème Résolu

Chameleon (chmln.js) causait des crashes critiques sur l'application :

### Symptômes
- ❌ Crash de l'app avec `chmln("boot")`
- ❌ Erreurs 502 en production
- ❌ Pages Facebook vides (pas de preview)
- ❌ Dashboard candidat cassé
- ❌ Partages sociaux ne fonctionnent pas

### Cause
Chameleon chargeait sur **toutes** les routes, y compris celles qui doivent rester en HTML pur pour Facebook, les crawlers SEO, et la stabilité.

---

## Solution Implémentée

### Architecture

```
src/utils/chameleonGuard.ts       → Logique de protection
src/hooks/useChameleonGuard.ts    → Hook React
src/main.tsx                      → Initialisation au démarrage
```

### Routes Protégées

Les routes suivantes sont **protégées** (pas de Chameleon) :

| Route | Raison |
|-------|--------|
| `/share` | Partage social Facebook |
| `/s/` | Short URLs de partage |
| `/offres` | Pages d'offres (SEO critique) |
| `/job/` | Détail des offres |
| `/public` | Profils publics partagés |

### Protections Actives

1. **Blocage de la fonction globale**
   ```javascript
   window.chmln = function() { /* bloqué */ }
   ```

2. **Blocage de l'objet Chameleon**
   ```javascript
   window.Chameleon = undefined (read-only)
   ```

3. **Surveillance des scripts**
   - Détecte les scripts ajoutés au DOM
   - Supprime automatiquement les scripts Chameleon
   - Empêche l'injection dynamique

---

## Utilisation

### 1. Protection Automatique (Déjà Actif)

Au démarrage de l'app (`main.tsx`), le guard s'active automatiquement :

```typescript
import { initializeChameleonGuard } from './utils/chameleonGuard';

// S'exécute AVANT React
initializeChameleonGuard();
```

### 2. Dans les Composants React

```typescript
import { useChameleonGuard } from '../hooks/useChameleonGuard';

function MyComponent() {
  const { isCritical, canLoadThirdPartyWidgets, callChameleon } = useChameleonGuard();

  if (isCritical) {
    // Route critique : pas de widgets tiers
    return <div>HTML Pur pour SEO</div>;
  }

  // Route normale : on peut charger Chameleon
  useEffect(() => {
    callChameleon('boot');
  }, []);
}
```

### 3. Hook Simple

```typescript
import { useIsCriticalRoute } from '../hooks/useChameleonGuard';

function MyComponent() {
  const isCritical = useIsCriticalRoute();

  return isCritical ? <StaticHTML /> : <InteractiveWidget />;
}
```

### 4. Utilisation Directe

```typescript
import { isCriticalRoute, safeChmln } from '../utils/chameleonGuard';

// Vérifier manuellement
if (!isCriticalRoute()) {
  // Appel safe de Chameleon
  safeChmln('track', 'event_name');
}
```

---

## Logs Console

### Route Critique Détectée

```
🛡️ [Chameleon Guard] ACTIVÉ pour: /share/job/abc123
   - Chameleon bloqué
   - Scripts externes surveillés
   - HTML pur garanti pour Facebook/SEO
```

### Route Normale

```
✅ [Chameleon Guard] Route normale, pas de protection nécessaire
```

### Script Bloqué

```
⚠️ [Chameleon Guard] Script externe bloqué: https://fast.trychameleon.com/...
⚠️ [Chameleon Guard] Appel chmln("boot") bloqué sur route critique
```

---

## Tests

### Test 1 : Route de Partage

```bash
# Naviguer vers
https://jobguinee.com/share/job/123

# Console devrait afficher
🛡️ [Chameleon Guard] ACTIVÉ pour: /share/job/123
```

**Résultat attendu** :
- Pas d'erreur chmln
- Page s'affiche correctement
- Preview Facebook fonctionne

### Test 2 : Route Normale (Dashboard)

```bash
# Naviguer vers
https://jobguinee.com/candidat/dashboard

# Console devrait afficher
✅ [Chameleon Guard] Route normale, pas de protection nécessaire
```

**Résultat attendu** :
- Chameleon peut charger
- Dashboard fonctionne normalement
- Widgets actifs

### Test 3 : Vérifier le Statut

```javascript
// Dans la console du navigateur
import { getChameleonGuardStatus } from './utils/chameleonGuard';

console.log(getChameleonGuardStatus());
// {
//   isActive: true/false,
//   currentRoute: "/share/job/123",
//   isCritical: true/false,
//   chameleonLoaded: false
// }
```

---

## Ajouter une Nouvelle Route Protégée

Éditer `/src/utils/chameleonGuard.ts` :

```typescript
const CRITICAL_ROUTES = [
  '/share',
  '/s/',
  '/offres',
  '/job/',
  '/public',
  '/nouvelle-route',  // ← Ajouter ici
];
```

---

## Désactiver le Guard (Debugging)

Si vous devez temporairement désactiver le guard :

1. **Commentez dans main.tsx** :
   ```typescript
   // initializeChameleonGuard(); // Désactivé temporairement
   ```

2. **Ou utilisez une variable d'environnement** :
   ```typescript
   if (import.meta.env.PROD) {
     initializeChameleonGuard();
   }
   ```

---

## FAQ

### Q : Chameleon ne marche plus sur mon dashboard ?
**R** : Le dashboard (`/candidat/dashboard`) n'est PAS une route critique. Vérifiez que le guard ne s'active pas par erreur.

### Q : Comment savoir si le guard est actif ?
**R** : Regardez la console : `🛡️ [Chameleon Guard] ACTIVÉ` apparaît sur les routes critiques.

### Q : Puis-je appeler Chameleon manuellement ?
**R** : Oui, utilisez `safeChmln()` qui vérifie automatiquement la route :
```typescript
import { safeChmln } from '../utils/chameleonGuard';
safeChmln('track', 'my_event');
```

### Q : Le partage Facebook ne fonctionne toujours pas ?
**R** : Le guard empêche Chameleon de crasher. Pour le partage Facebook :
1. Vérifiez les meta tags OG
2. Utilisez le Facebook Debugger
3. Assurez-vous que l'URL est accessible

---

## Métriques de Succès

Après déploiement, vous devriez observer :

✅ **Stabilité**
- Zéro erreur `chmln is not defined`
- Zéro erreur 502
- Pas de page blanche

✅ **Partage Social**
- Preview Facebook fonctionne
- Métadonnées correctes
- Images visibles

✅ **Performance**
- Routes critiques chargent plus vite
- Pas de scripts tiers inutiles
- SEO non impacté

---

## Maintenance

### Vérification Hebdomadaire

1. Tester les routes critiques
2. Vérifier les logs console
3. Tester le partage Facebook
4. Monitorer les erreurs Sentry/logs

### Mise à Jour

Si Chameleon change d'URL ou de méthode d'initialisation :

1. Mettre à jour `blockSuspiciousScripts()` dans `chameleonGuard.ts`
2. Ajouter les nouveaux patterns à bloquer
3. Tester sur toutes les routes critiques

---

## Contact

Pour toute question ou problème :
- Vérifier les logs console
- Tester avec `getChameleonGuardStatus()`
- Consulter cette documentation

**Dernière mise à jour** : 2026-01-12
**Version** : 1.0.0
**Status** : ✅ Production Ready
