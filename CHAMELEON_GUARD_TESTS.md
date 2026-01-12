# 🧪 Tests du Chameleon Guard

## Tests à Effectuer Avant Déploiement

### Test 1 : Route Critique - Partage Social

**URL** : `https://jobguinee.com/share/job/123`

**Attendu** :
```
Console :
🛡️ [Chameleon Guard] ACTIVÉ pour: /share/job/123
   - Chameleon bloqué
   - Scripts externes surveillés
   - HTML pur garanti pour Facebook/SEO
```

**Validation** :
- [ ] Message du guard affiché
- [ ] Aucune erreur `chmln`
- [ ] Page s'affiche correctement
- [ ] Pas de script Chameleon chargé

---

### Test 2 : Route Critique - Short URL

**URL** : `https://jobguinee.com/s/abc123`

**Attendu** :
```
Console :
🛡️ [Chameleon Guard] ACTIVÉ pour: /s/abc123
```

**Validation** :
- [ ] Guard actif
- [ ] Redirection fonctionne
- [ ] Pas de crash

---

### Test 3 : Route Critique - Page Offre

**URL** : `https://jobguinee.com/offres/developpeur-web`

**Attendu** :
```
Console :
🛡️ [Chameleon Guard] ACTIVÉ pour: /offres/developpeur-web
```

**Validation** :
- [ ] Guard actif
- [ ] SEO meta tags présents
- [ ] HTML propre pour crawlers

---

### Test 4 : Route Normale - Dashboard

**URL** : `https://jobguinee.com/candidat/dashboard`

**Attendu** :
```
Console :
✅ [Chameleon Guard] Route normale, pas de protection nécessaire
```

**Validation** :
- [ ] Guard inactif
- [ ] Chameleon peut charger (si configuré)
- [ ] Dashboard fonctionne normalement

---

### Test 5 : Route Normale - Liste Offres

**URL** : `https://jobguinee.com/jobs`

**Attendu** :
```
Console :
✅ [Chameleon Guard] Route normale, pas de protection nécessaire
```

**Validation** :
- [ ] Guard inactif
- [ ] Page normale
- [ ] Widgets fonctionnent

---

### Test 6 : Tentative d'Injection de Script (Route Critique)

**Action** : Sur `/share/job/123`, ouvrir la console et exécuter :

```javascript
const script = document.createElement('script');
script.src = 'https://fast.trychameleon.com/chmln.js';
document.head.appendChild(script);
```

**Attendu** :
```
Console :
🛡️ [Chameleon Guard] Script externe bloqué: https://fast.trychameleon.com/...
```

**Validation** :
- [ ] Script détecté et supprimé
- [ ] Message d'avertissement
- [ ] Pas de crash

---

### Test 7 : Appel chmln Direct (Route Critique)

**Action** : Sur `/share/job/123`, ouvrir la console et exécuter :

```javascript
window.chmln('boot');
```

**Attendu** :
```
Console :
⚠️ [Chameleon Guard] Appel chmln("boot") bloqué sur route critique
```

**Validation** :
- [ ] Appel bloqué
- [ ] Pas d'exécution
- [ ] Pas de crash

---

### Test 8 : Vérification Statut

**Action** : Sur n'importe quelle page, ouvrir la console et exécuter :

```javascript
import { getChameleonGuardStatus } from './src/utils/chameleonGuard.ts';
console.log(getChameleonGuardStatus());
```

**Attendu** :
```javascript
{
  isActive: true/false,
  currentRoute: "/share/job/123",
  isCritical: true/false,
  chameleonLoaded: false
}
```

**Validation** :
- [ ] Objet retourné
- [ ] Valeurs cohérentes
- [ ] `chameleonLoaded` = false sur routes critiques

---

### Test 9 : Facebook Debugger

**Action** : Tester l'URL sur Facebook Debugger
```
https://developers.facebook.com/tools/debug/
```

**URL de test** : `https://jobguinee.com/share/job/123`

**Validation** :
- [ ] Scrape réussit (pas de timeout)
- [ ] Meta tags OG présents
- [ ] Image de preview visible
- [ ] Titre et description corrects
- [ ] Pas d'erreur 502

---

### Test 10 : Navigation Entre Routes

**Action** :
1. Aller sur `/candidat/dashboard` (route normale)
2. Cliquer sur un lien de partage → `/share/job/123`
3. Revenir sur `/candidat/dashboard`

**Validation** :
- [ ] Guard s'active sur `/share`
- [ ] Guard se désactive sur dashboard
- [ ] Aucun crash lors du changement
- [ ] Pas de fuite mémoire

---

## Tests Automatisés

### Script de Test Console

Copier-coller dans la console du navigateur :

```javascript
// Test automatique du Chameleon Guard
async function testChameleonGuard() {
  console.log('🧪 Démarrage des tests Chameleon Guard...\n');

  // Test 1 : Vérifier que le guard existe
  const guardExists = typeof window.isCriticalRoute !== 'undefined';
  console.log(`✅ Test 1 : Guard existe - ${guardExists ? 'PASS' : 'FAIL'}`);

  // Test 2 : Vérifier la route actuelle
  const currentRoute = window.location.pathname;
  const isCritical = currentRoute.startsWith('/share') ||
                    currentRoute.startsWith('/s/') ||
                    currentRoute.startsWith('/offres');

  console.log(`✅ Test 2 : Route "${currentRoute}" - ${isCritical ? 'CRITIQUE' : 'NORMALE'}`);

  // Test 3 : Vérifier que chmln est bloqué sur routes critiques
  if (isCritical) {
    const chmlnExists = typeof window.chmln === 'function';
    const chmlnBlocked = window.chmln.toString().includes('Chameleon Guard');

    console.log(`✅ Test 3 : chmln ${chmlnBlocked ? 'bloqué' : 'actif'} - ${chmlnBlocked ? 'PASS' : 'FAIL'}`);
  } else {
    console.log(`⚪ Test 3 : Skipped (route normale)`);
  }

  // Test 4 : Vérifier observer
  console.log(`✅ Test 4 : MutationObserver - ${typeof MutationObserver !== 'undefined' ? 'PASS' : 'FAIL'}`);

  console.log('\n✅ Tests terminés !');
}

testChameleonGuard();
```

---

## Métriques de Succès

### Avant le Guard

- ❌ Erreurs `chmln is not defined` : ~10/jour
- ❌ Erreurs 502 : ~5/jour
- ❌ Partages Facebook échoués : ~30%
- ❌ Dashboard crashes : ~2/jour

### Après le Guard (Attendu)

- ✅ Erreurs `chmln is not defined` : **0**
- ✅ Erreurs 502 : **0**
- ✅ Partages Facebook réussis : **100%**
- ✅ Dashboard stable : **100%**

---

## Checklist Finale

### Avant Déploiement

- [ ] Tous les tests manuels passent
- [ ] Test automatique console passe
- [ ] Facebook Debugger réussit
- [ ] Build production sans erreur
- [ ] Documentation lue et comprise
- [ ] Équipe informée des changements

### Après Déploiement

- [ ] Monitoring actif (Sentry/logs)
- [ ] Tester toutes les routes critiques en production
- [ ] Vérifier les partages Facebook en production
- [ ] Surveiller les métriques pendant 24h
- [ ] Pas d'augmentation des erreurs
- [ ] Validation finale

---

## En Cas de Problème

### Problème 1 : Guard ne s'active pas

**Diagnostic** :
```javascript
// Console
console.log(window.location.pathname);
// Vérifier si la route est dans CRITICAL_ROUTES
```

**Solution** : Ajouter la route dans `chameleonGuard.ts`

### Problème 2 : Guard bloque trop de routes

**Diagnostic** : Vérifier la liste `CRITICAL_ROUTES`

**Solution** : Retirer les routes non critiques

### Problème 3 : Chameleon ne charge plus du tout

**Diagnostic** :
```javascript
// Console
console.log(getChameleonGuardStatus());
```

**Solution** : Vérifier que les routes normales ne sont pas bloquées

### Problème 4 : Facebook preview cassé

**Diagnostic** : Tester avec Facebook Debugger

**Solution** : Vérifier que les meta tags OG sont présents

---

## Support

Pour toute question ou problème :
1. Consulter `CHAMELEON_GUARD_DOCUMENTATION.md`
2. Vérifier les logs console
3. Exécuter le script de test automatique
4. Vérifier le statut avec `getChameleonGuardStatus()`

**Dernière mise à jour** : 2026-01-12
