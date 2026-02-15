# Rapport d'analyse technique — JobGuinée

_Date: 2026-02-15_

## 1) Périmètre et méthode

Analyse statique rapide du dépôt avec les axes suivants :
- structure générale du projet,
- qualité de build et de typage,
- qualité linting,
- risques de configuration/exploitation.

Commandes exécutées :
- `npm run typecheck`
- `npm run lint`
- `npm run audit:system`
- script Python local pour compter les extensions de fichiers.

## 2) Constat global

Le projet est une application **React + TypeScript + Vite** avec une surface fonctionnelle large (front, utilitaires, edge functions Supabase). La base documentaire est très fournie.

Les scripts principaux disponibles sont cohérents (`dev`, `build`, `lint`, `typecheck`, `audit:system`), mais l'état actuel de la qualité ne permet pas une validation CI stricte sans correction préalable des erreurs TypeScript/ESLint.

## 3) Résultats clés

### 3.1 Build qualité (TypeScript)

- Le contrôle TypeScript échoue.
- Cause critique identifiée : `src/utils/chameleonGuardExamples.ts` contient du JSX dans un fichier `.ts`, ce qui provoque des erreurs de parsing en cascade.

**Impact** : blocage de pipeline typecheck, bruit d'erreurs élevé et risque de non-détection de régressions réelles.

### 3.2 Qualité de code (ESLint)

- Le lint échoue massivement : **1832 problèmes** détectés (dont **1681 erreurs**).
- Patterns dominants : `no-explicit-any`, variables non utilisées, dépendances de hooks incomplètes.

**Impact** : dette technique élevée, maintenance plus coûteuse, fragilité des évolutions rapides.

### 3.3 Audit système

- Le script `audit:system` échoue faute de variables d'environnement Supabase (`Variables Supabase manquantes`).

**Impact** : impossible d'obtenir un diagnostic fonctionnel complet en environnement local non configuré.

### 3.4 Volumétrie codebase

- ~**951 fichiers** (hors `.git` et `node_modules`), avec dominante `.sql`, `.tsx`, `.ts` et `.md`.

**Impact** : projet mature et dense ; nécessite une stratégie de qualité progressive par lots.

## 4) Risques prioritaires

1. **Risque CI immédiat** : typecheck/lint non passants.
2. **Risque de régression** : volume de `any` élevé, donc moindre sécurité de typage.
3. **Risque d'exploitation** : audits incomplets sans jeu de variables d'env standardisé.
4. **Risque de productivité** : trop de signal parasite dans les retours outils.

## 5) Plan d'action recommandé

### Priorité P0 (immédiat)

1. Corriger `src/utils/chameleonGuardExamples.ts` :
   - soit renommer en `.tsx`,
   - soit retirer le JSX pour garder un fichier TS pur.
2. Réexécuter `npm run typecheck` pour assainir l'erreur racine.

### Priorité P1 (court terme)

1. Mettre en place un plan de réduction ESLint en lots :
   - lot 1 : `no-unused-vars`,
   - lot 2 : `react-hooks/exhaustive-deps`,
   - lot 3 : réduction progressive des `any` sur zones cœur métier.
2. Définir un seuil cible par sprint (ex: -20% d'erreurs lint / sprint).

### Priorité P2 (stabilisation)

1. Standardiser un `.env` de validation (non sensible) pour permettre `audit:system` en local.
2. Ajouter un check CI incrémental : "pas de nouvelle dette" (ratchet) même si dette historique restante.

## 6) Conclusion

Le socle applicatif est riche et structuré, mais l'état de qualité automatique est actuellement en **mode dégradé**. La correction du point bloquant TypeScript et un plan de réduction progressive ESLint permettront de revenir rapidement à un cycle de livraison plus fiable.
