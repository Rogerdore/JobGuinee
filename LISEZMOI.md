# 👋 Bienvenue sur JobGuinée v1.1

**Plateforme de recrutement digitale pour la Guinée**

---

## 🚀 Démarrage Ultra-Rapide

```bash
# Installation
npm install

# Lancer en dev
npm run dev

# Build production
npm run build
```

**URL dev** : http://localhost:5173
**URL prod** : rogerdore-jobguinee-uwda.bolt.host

---

## 📚 Documentation (Commencez ici !)

### 🆕 Nouveau sur le projet ?
👉 **[README_DEVELOPPEUR.md](README_DEVELOPPEUR.md)** (40 min de lecture)
- Structure du projet
- Installation et configuration
- Conventions de code
- Composants disponibles

### 👔 Manager / Chef de projet ?
👉 **[RESUME_EXECUTIF.md](RESUME_EXECUTIF.md)** (20 min de lecture)
- Vision globale
- Métriques et ROI
- Prochaines étapes

### 🎨 Développeur UI/UX ?
👉 **[GUIDE_MIGRATION_COMPOSANTS.md](GUIDE_MIGRATION_COMPOSANTS.md)** (45 min de lecture)
- Nouveaux composants UI réutilisables
- Exemples de migration
- Plan page par page

### 🏗️ Architecte / Tech Lead ?
👉 **[AUDIT_RAPPORT.md](AUDIT_RAPPORT.md)** (90 min de lecture)
- Audit complet du projet
- Analyse détaillée
- Recommandations

### 🗺️ Perdu dans la doc ?
👉 **[DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)**
- Index complet
- Parcours de lecture
- Recherche rapide

---

## ✨ Quoi de Neuf en v1.1 ?

### 🎨 Système de Composants UI
**7 composants réutilisables** créés :
```typescript
import { Button, Input, Card, Badge, Modal, Select, Spinner } from '@/components/ui';
```

**Exemple** :
```tsx
<Button variant="primary" loading={isLoading}>
  Enregistrer
</Button>
```

### 🏗️ Layout Refactorisé
**Layout.tsx** divisé en 3 composants :
- Header (navigation)
- Footer (pied de page)
- MobileMenu (menu mobile)

**Résultat** : 88% de code en moins (365 → 45 lignes)

### 📚 Documentation Complète
**2,300+ lignes** de documentation ajoutées :
- Guides développeurs
- Guides migration
- Audit complet
- Recommandations

---

## 🎯 Composants UI Disponibles

| Composant | Usage | Variants |
|-----------|-------|----------|
| **Button** | Actions | primary, secondary, danger, ghost, outline |
| **Input** | Saisie | Avec label, erreur, icône |
| **Select** | Dropdown | Style standardisé |
| **Card** | Conteneur | Padding variants, hover |
| **Badge** | Étiquettes | default, success, warning, danger, info |
| **Modal** | Popup | 4 tailles (sm, md, lg, xl) |
| **Spinner** | Loading | 3 tailles (sm, md, lg) |

**Doc complète** : [OPTIMISATIONS_EFFECTUEES.md](OPTIMISATIONS_EFFECTUEES.md)

---

## 📦 Structure du Projet

```
src/
├── components/
│   ├── ui/              ✨ NOUVEAU - Composants réutilisables
│   ├── layout/          ✨ NOUVEAU - Header, Footer, MobileMenu
│   ├── ai/              Services IA
│   ├── cvtheque/        Composants CVthèque
│   ├── formations/      Composants formations
│   ├── forms/           Formulaires
│   ├── notifications/   Notifications
│   └── recruiter/       Composants recruteur
│
├── pages/               13 pages principales
├── contexts/            Auth, CMS, Notifications
├── utils/               Utilitaires + logger ✨
└── lib/                 Supabase client
```

---

## 🔧 Conventions Rapides

### Imports Composants UI
```typescript
import { Button, Input, Card } from '@/components/ui';
```

### Logging
```typescript
import { logger } from '@/utils/logger';
logger.log('Debug'); // Dev uniquement
logger.error('Erreur'); // Toujours
```

### Nomenclature
- **Composants** : PascalCase (`Button.tsx`)
- **Utilitaires** : camelCase (`logger.ts`)
- **Constants** : SCREAMING_SNAKE_CASE

---

## ✅ Checklist Nouveau Développeur

**Jour 1** :
- [ ] Lire ce fichier (5 min)
- [ ] Lire [README_DEVELOPPEUR.md](README_DEVELOPPEUR.md) (40 min)
- [ ] Setup environnement (.env, npm install)
- [ ] Lancer `npm run dev`

**Jour 2** :
- [ ] Tester les composants UI
- [ ] Créer un composant test
- [ ] Premier commit

**Jour 3** :
- [ ] Lire [GUIDE_MIGRATION_COMPOSANTS.md](GUIDE_MIGRATION_COMPOSANTS.md)
- [ ] Migrer une petite page
- [ ] Code review

---

## 📊 Métriques Projet

| Métrique | Valeur |
|----------|--------|
| **Pages** | 13 |
| **Composants** | 29 |
| **Composants UI** | 7 (nouveaux) |
| **Migrations DB** | 36 |
| **Build size** | 855 KB (201 KB gzip) |
| **Build time** | ~8 secondes |

---

## 🎯 Prochaines Étapes

### Phase 1 : Migration UI (8-12h)
Migrer les pages vers les composants UI :
- Auth, Jobs, Blog, Formations
- Dashboards (Candidat, Recruteur, Trainer)
- Admin (CMS, Users)

**ROI** : Code 40% plus court, maintenance 60% plus rapide

### Phase 2 : Nettoyage (2-3h)
- 77 console.log restants
- 6 numéros de téléphone factices
- Refactoriser 3 gros composants

### Phase 3 : Modernisation (4-6h)
- React Router
- Validation Zod
- Tests unitaires

**Détails** : [RESUME_EXECUTIF.md](RESUME_EXECUTIF.md)

---

## 🐛 Problème ?

### Build échoue
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Types non reconnus
```bash
npm run typecheck
```

### Supabase non connecté
Vérifier `.env` :
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 📞 Support

- **Email** : contact@jobguinee.com
- **Docs** : [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)
- **Issues** : GitHub

---

## 📝 Fichiers Importants

| Fichier | Quoi | Lecture |
|---------|------|---------|
| [README_DEVELOPPEUR.md](README_DEVELOPPEUR.md) | Guide complet | 40 min |
| [RESUME_EXECUTIF.md](RESUME_EXECUTIF.md) | Synthèse | 20 min |
| [GUIDE_MIGRATION_COMPOSANTS.md](GUIDE_MIGRATION_COMPOSANTS.md) | Migration UI | 45 min |
| [AUDIT_RAPPORT.md](AUDIT_RAPPORT.md) | Audit détaillé | 90 min |
| [OPTIMISATIONS_EFFECTUEES.md](OPTIMISATIONS_EFFECTUEES.md) | Détails techniques | 90 min |
| [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md) | Navigation | 10 min |

---

## 🎉 C'est Parti !

**Temps pour être productif** : 1-2 jours

**Première tâche recommandée** : Lire [README_DEVELOPPEUR.md](README_DEVELOPPEUR.md)

**Besoin d'aide ?** Consultez [DOCUMENTATION_INDEX.md](DOCUMENTATION_INDEX.md)

---

**Version** : 1.1.0
**Dernière mise à jour** : 1er Décembre 2025
**Mainteneur** : Équipe JobGuinée

**Bon coding ! 🚀**
