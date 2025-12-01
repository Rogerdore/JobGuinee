# 👨‍💻 Guide Développeur - JobGuinée

**Plateforme de recrutement en Guinée**
**Version**: v1.1 (Post-Optimisation)
**Date**: 1er Décembre 2025

---

## 🚀 Démarrage Rapide

### Installation
```bash
npm install
npm run dev
```

### Build Production
```bash
npm run build
npm run preview
```

### Variables d'Environnement
Créer un fichier `.env` :
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 📁 Structure du Projet

```
src/
├── components/
│   ├── ui/                    ✨ NOUVEAU - Composants réutilisables
│   │   ├── Button.tsx         # Boutons standardisés
│   │   ├── Input.tsx          # Champs de saisie
│   │   ├── Select.tsx         # Menus déroulants
│   │   ├── Card.tsx           # Conteneurs
│   │   ├── Badge.tsx          # Étiquettes
│   │   ├── Modal.tsx          # Modales
│   │   ├── Spinner.tsx        # Loading
│   │   └── index.ts           # Exports centralisés
│   │
│   ├── layout/                ✨ NOUVEAU - Layout modulaire
│   │   ├── Header.tsx         # Navigation principale
│   │   ├── Footer.tsx         # Pied de page
│   │   └── MobileMenu.tsx     # Menu mobile
│   │
│   ├── ai/                    # Services IA
│   ├── cvtheque/              # Composants CVthèque
│   ├── formations/            # Composants formations
│   ├── forms/                 # Formulaires
│   ├── notifications/         # Centre notifications
│   ├── recruiter/             # Composants recruteur
│   ├── Layout.tsx             # ✅ REFACTORISÉ (365 → 45 lignes)
│   └── AdminLayout.tsx        # Layout admin
│
├── contexts/
│   ├── AuthContext.tsx        # ✅ NETTOYÉ (console.log supprimés)
│   ├── CMSContext.tsx         # Gestion contenu
│   └── NotificationContext.tsx
│
├── pages/                     # 13 pages principales
│   ├── Home.tsx               # Accueil
│   ├── Auth.tsx               # Login/Signup
│   ├── Jobs.tsx               # Liste offres
│   ├── JobDetail.tsx          # Détail offre
│   ├── CandidateDashboard.tsx # Dashboard candidat
│   ├── RecruiterDashboard.tsx # Dashboard recruteur
│   ├── TrainerDashboard.tsx   # Dashboard formateur
│   ├── Formations.tsx         # Liste formations
│   ├── Blog.tsx               # Articles blog
│   ├── CVTheque.tsx           # Base CV
│   ├── CMSAdmin.tsx           # Admin CMS
│   ├── UserManagement.tsx     # Gestion users
│   └── PremiumAIServices.tsx  # Services IA
│
├── utils/
│   ├── logger.ts              # ✨ NOUVEAU - Logging conditionnel
│   ├── dateHelpers.ts
│   ├── notificationHelpers.ts
│   ├── profileCompletion.ts
│   └── sample*.ts             # Données de démo
│
└── lib/
    └── supabase.ts            # Client Supabase + Types
```

---

## 🎨 Système de Composants UI

### Imports
```typescript
import {
  Button,
  Input,
  Select,
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
  Badge,
  Modal, ModalFooter,
  Spinner, LoadingScreen
} from '@/components/ui';
```

### Exemples Rapides

#### Boutons
```tsx
<Button variant="primary" size="md">Enregistrer</Button>
<Button variant="secondary" loading={isLoading}>Publier</Button>
<Button variant="danger" icon={<Trash />}>Supprimer</Button>
```

#### Inputs
```tsx
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  required
/>
```

#### Cartes
```tsx
<Card hover padding="md">
  <CardHeader>
    <CardTitle>Titre</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Contenu</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**📘 Guide complet** : Voir `GUIDE_MIGRATION_COMPOSANTS.md`

---

## 🗄️ Base de Données (Supabase)

### Tables Principales

#### Utilisateurs
- `profiles` - Profils de base
- `candidate_profiles` - Profils candidats étendus
- `trainer_profiles` - Profils formateurs

#### Recrutement
- `jobs` - Offres d'emploi
- `companies` - Entreprises
- `applications` - Candidatures
- `workflow_stages` - Étapes ATS

#### CVthèque
- `profile_cart` - Panier de profils
- `profile_purchases` - Achats profils
- `profile_views` - Vues profils

#### Formations
- `formations` - Formations disponibles
- `formation_enrollments` - Inscriptions

#### IA & Premium
- `premium_services` - Services premium
- `premium_subscriptions` - Abonnements

#### Contenu
- `blog_posts` - Articles blog
- `resources` - Ressources
- `newsletter_subscribers` - Newsletter

#### Système
- `notifications` - Notifications users

### Types TypeScript
Tous les types sont définis dans `/src/lib/supabase.ts` :
```typescript
- UserRole
- Profile
- CandidateProfile
- Company
- Job
- Application
- Formation
- TrainerProfile
```

---

## 🔐 Authentification

### Contexte Auth
```typescript
const { user, profile, signIn, signUp, signOut, isAdmin } = useAuth();
```

### Rôles Utilisateurs
- `candidate` - Chercheur d'emploi
- `recruiter` - Recruteur
- `trainer` - Formateur/Coach
- `admin` - Administrateur

### Protection Routes
```typescript
if (!user) {
  onNavigate('login');
  return;
}

if (isAdmin) {
  // Actions admin
}
```

---

## 🧪 Logging & Debugging

### Logger Utilitaire
```typescript
import { logger } from '@/utils/logger';

logger.log('Debug info');      // Dev uniquement
logger.error('Error message');  // Toujours
logger.warn('Warning');         // Dev uniquement
logger.info('Info');            // Dev uniquement
```

**⚠️ IMPORTANT** : Ne jamais utiliser `console.log()` directement !

---

## 📊 État des Optimisations

### ✅ Complété
- [x] Système de composants UI (7 composants)
- [x] Refactorisation Layout (3 sous-composants)
- [x] Nettoyage console.log (AuthContext)
- [x] Logger utilitaire créé
- [x] Build vérifié et fonctionnel

### 🔄 En Cours
- [ ] Migration pages vers composants UI
- [ ] Nettoyage 77 console.log restants
- [ ] Refactorisation gros composants

### 📋 À Faire
- [ ] Validation Zod sur formulaires
- [ ] React Router pour routing natif
- [ ] Design tokens (couleurs, espacements)
- [ ] Tests unitaires
- [ ] Code splitting

**📄 Détails** : Voir `AUDIT_RAPPORT.md` et `OPTIMISATIONS_EFFECTUEES.md`

---

## 🎯 Conventions de Code

### Nomenclature
- **Composants** : PascalCase (`Button.tsx`)
- **Utilitaires** : camelCase (`dateHelpers.ts`)
- **Constants** : SCREAMING_SNAKE_CASE (`MAX_FILE_SIZE`)

### Imports
```typescript
// React
import { useState, useEffect } from 'react';

// Bibliothèques tierces
import { Briefcase } from 'lucide-react';

// Composants UI
import { Button, Input } from '@/components/ui';

// Composants locaux
import { Header } from './Header';

// Contexts
import { useAuth } from '@/contexts/AuthContext';

// Utils
import { logger } from '@/utils/logger';

// Types
import { Job, Company } from '@/lib/supabase';
```

### Props
```typescript
interface ComponentProps {
  title: string;              // Required
  description?: string;       // Optional
  onSave: () => void;         // Callback
  isLoading?: boolean;        // Boolean avec '?'
}
```

### État
```typescript
const [data, setData] = useState<Job[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

---

## 🚨 Règles Importantes

### ❌ À ÉVITER
```typescript
// Console.log direct
console.log('Debug');

// Classes Tailwind inline complexes
className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl..."

// Composants monolithiques
function MegaComponent() {
  // 800 lignes de code
}

// État global non géré
let globalData = [];
```

### ✅ À FAIRE
```typescript
// Logger utilitaire
import { logger } from '@/utils/logger';
logger.log('Debug');

// Composants UI
import { Button } from '@/components/ui';
<Button variant="primary">Clic</Button>

// Composants modulaires
function Header() { /* 50 lignes */ }
function Footer() { /* 50 lignes */ }

// Context pour état global
const { user } = useAuth();
```

---

## 🔧 Scripts NPM

```bash
npm run dev        # Dev server (port 5173)
npm run build      # Build production
npm run preview    # Prévisualiser build
npm run lint       # ESLint
npm run typecheck  # Vérifier types TypeScript
```

---

## 📚 Documentation Complète

1. **AUDIT_RAPPORT.md** - Audit initial complet du projet
2. **OPTIMISATIONS_EFFECTUEES.md** - Détails des améliorations
3. **GUIDE_MIGRATION_COMPOSANTS.md** - Guide de migration UI
4. **GOLD_PROFILE_GUIDE.md** - Guide profils Gold
5. **PREMIUM_AI_SERVICES.md** - Services IA Premium
6. **INSTRUCTIONS_ADMIN.md** - Instructions admin

---

## 🐛 Résolution de Problèmes

### Build échoue
```bash
# Nettoyer et réinstaller
rm -rf node_modules dist
npm install
npm run build
```

### Types TypeScript non reconnus
```bash
# Régénérer types
npm run typecheck
```

### Supabase non connecté
Vérifier `.env` :
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 📈 Métriques du Projet

### Code
- **Pages** : 13
- **Composants** : 29
- **Composants UI** : 7 (nouveaux)
- **Migrations DB** : 36
- **Lignes de code** : ~15,000

### Build
- **Bundle size** : 855 KB (201 KB gzip)
- **CSS** : 76 KB (11 KB gzip)
- **Build time** : ~7-8 secondes

### Performance
- **Lighthouse Score** : À mesurer
- **First Contentful Paint** : À mesurer
- **Time to Interactive** : À mesurer

---

## 🤝 Contribution

### Avant de committer
1. ✅ `npm run lint` passe
2. ✅ `npm run typecheck` passe
3. ✅ `npm run build` réussit
4. ✅ Fonctionnalités testées manuellement
5. ✅ Pas de console.log (utiliser logger)

### Message de commit
```
feat: Ajout composant Button réutilisable
fix: Correction bug authentification
refactor: Refactorisation Layout en sous-composants
docs: Mise à jour guide migration
```

---

## 📞 Contact & Support

**Email** : contact@jobguinee.com
**Site** : rogerdore-jobguinee-uwda.bolt.host

---

## 📝 Changelog

### v1.1 (1er Décembre 2025)
- ✨ Ajout système composants UI (7 composants)
- ♻️ Refactorisation Layout en 3 sous-composants
- 🧹 Nettoyage console.log (AuthContext)
- 🔧 Ajout logger utilitaire
- 📝 Documentation complète

### v1.0 (Octobre-Novembre 2025)
- 🎉 Lancement initial
- 13 pages principales
- Base de données Supabase (36 migrations)
- Gestion 4 types utilisateurs
- Services IA Premium

---

**Dernière mise à jour** : 1er Décembre 2025
**Maintenu par** : Équipe JobGuinée
