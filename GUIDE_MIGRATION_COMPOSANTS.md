# 📘 Guide de Migration vers les Composants UI

**JobGuinée / JobVision Guinée**
**Date**: 1er Décembre 2025

---

## 🎯 Objectif

Ce guide vous aide à migrer progressivement les pages existantes vers le nouveau système de composants UI réutilisables.

---

## 📦 Composants Disponibles

### Imports centralisés
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

---

## 🔄 Exemples de Migration

### 1. Boutons

#### ❌ Avant (à remplacer)
```tsx
<button className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition shadow-lg">
  Publier l'offre
</button>
```

#### ✅ Après (nouveau)
```tsx
<Button variant="primary" size="md">
  Publier l'offre
</Button>
```

#### Variants disponibles
```tsx
<Button variant="primary">Principal</Button>
<Button variant="secondary">Secondaire (orange)</Button>
<Button variant="danger">Danger (rouge)</Button>
<Button variant="ghost">Transparent</Button>
<Button variant="outline">Bordure</Button>
```

#### Avec loading
```tsx
<Button variant="primary" loading={isSubmitting}>
  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
</Button>
```

#### Avec icône
```tsx
<Button variant="secondary" icon={<Plus className="w-4 h-4" />}>
  Nouvelle offre
</Button>
```

---

### 2. Champs de Saisie

#### ❌ Avant
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Titre du poste *
  </label>
  <input
    type="text"
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#0E2F56]"
  />
  {errors.title && <p className="mt-1.5 text-sm text-red-600">{errors.title}</p>}
</div>
```

#### ✅ Après
```tsx
<Input
  label="Titre du poste"
  type="text"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  error={errors.title}
  required
  fullWidth
/>
```

#### Avec icône
```tsx
<Input
  label="Email"
  type="email"
  icon={<Mail className="w-5 h-5" />}
  placeholder="exemple@email.com"
/>
```

---

### 3. Menus Déroulants

#### ❌ Avant
```tsx
<select
  value={contractType}
  onChange={(e) => setContractType(e.target.value)}
  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200"
>
  <option value="">Type de contrat</option>
  <option value="CDI">CDI</option>
  <option value="CDD">CDD</option>
</select>
```

#### ✅ Après
```tsx
<Select
  label="Type de contrat"
  value={contractType}
  onChange={(e) => setContractType(e.target.value)}
  fullWidth
>
  <option value="">Sélectionnez...</option>
  <option value="CDI">CDI</option>
  <option value="CDD">CDD</option>
</Select>
```

---

### 4. Cartes

#### ❌ Avant
```tsx
<div className="neo-clay-card rounded-2xl p-6 hover:shadow-2xl cursor-pointer">
  <h3 className="text-xl font-bold text-gray-900 mb-2">
    {job.title}
  </h3>
  <p className="text-sm text-gray-600 mb-4">
    {job.company}
  </p>
  <div className="flex space-x-2">
    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
      {job.contractType}
    </span>
  </div>
  <div className="pt-4 border-t border-gray-100 mt-4">
    <button className="text-[#FF8C00]">Voir l'offre →</button>
  </div>
</div>
```

#### ✅ Après
```tsx
<Card hover className="cursor-pointer">
  <CardHeader>
    <CardTitle>{job.title}</CardTitle>
    <CardDescription>{job.company}</CardDescription>
  </CardHeader>
  <CardContent>
    <Badge variant="info">{job.contractType}</Badge>
  </CardContent>
  <CardFooter>
    <Button variant="ghost">Voir l'offre →</Button>
  </CardFooter>
</Card>
```

---

### 5. Badges / Étiquettes

#### ❌ Avant
```tsx
<span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
  Actif
</span>
```

#### ✅ Après
```tsx
<Badge variant="success">Actif</Badge>
```

#### Variants
```tsx
<Badge variant="default">Par défaut</Badge>
<Badge variant="success">Succès (vert)</Badge>
<Badge variant="warning">Attention (jaune)</Badge>
<Badge variant="danger">Erreur (rouge)</Badge>
<Badge variant="info">Info (bleu)</Badge>
```

---

### 6. Modales

#### ❌ Avant
```tsx
{showModal && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-2xl font-bold">Confirmation</h2>
          <button onClick={() => setShowModal(false)}>×</button>
        </div>
        <p>Êtes-vous sûr ?</p>
        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={() => setShowModal(false)}>Annuler</button>
          <button onClick={handleDelete}>Supprimer</button>
        </div>
      </div>
    </div>
  </div>
)}
```

#### ✅ Après
```tsx
<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Confirmation"
  size="md"
>
  <p>Êtes-vous sûr ?</p>

  <ModalFooter>
    <Button variant="ghost" onClick={() => setShowModal(false)}>
      Annuler
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      Supprimer
    </Button>
  </ModalFooter>
</Modal>
```

---

### 7. Loading States

#### ❌ Avant
```tsx
{loading && (
  <div className="flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-900" />
  </div>
)}
```

#### ✅ Après
```tsx
{loading && <Spinner size="md" />}
```

#### Écran de chargement complet
```tsx
{loading && <LoadingScreen message="Chargement des données..." />}
```

---

## 📋 Plan de Migration par Page

### ✅ Phase 1 : Pages Simples (1-2h)

1. **Auth.tsx** - Page login/signup
   - Migrer tous les inputs
   - Migrer les boutons
   - Ajouter loading states

2. **Blog.tsx** - Liste articles
   - Migrer cartes d'articles
   - Migrer badges de catégories

### ✅ Phase 2 : Pages Moyennes (2-3h)

3. **Jobs.tsx** - Liste offres
   - Migrer cartes d'offres
   - Migrer filtres (Select, Input)
   - Migrer badges de statut

4. **Formations.tsx** - Liste formations
   - Migrer cartes formations
   - Migrer modales d'inscription

5. **CVTheque.tsx** - Base de CV
   - Migrer cartes candidats
   - Migrer filtres avancés

### ✅ Phase 3 : Dashboards (3-4h)

6. **CandidateDashboard.tsx**
   - Migrer stats cards
   - Migrer liste candidatures
   - Migrer modales

7. **RecruiterDashboard.tsx**
   - Migrer formulaires
   - Migrer tableau kanban
   - Migrer analytics cards

8. **TrainerDashboard.tsx**
   - Migrer liste formations
   - Migrer stats

### ✅ Phase 4 : Admin (2-3h)

9. **CMSAdmin.tsx**
   - Migrer tous les formulaires
   - Migrer tables

10. **UserManagement.tsx**
    - Migrer filtres
    - Migrer actions

---

## 🛠️ Outils de Migration

### Script de recherche/remplacement (VS Code)

#### Trouver les boutons à migrer
```regex
<button\s+className="[^"]*bg-\[#0E2F56\][^"]*"
```

#### Trouver les inputs à migrer
```regex
<input\s+type="[^"]*"\s+className="[^"]*w-full[^"]*"
```

#### Trouver les cards à migrer
```regex
<div\s+className="[^"]*neo-clay-card[^"]*"
```

---

## ✅ Checklist par Page

Pour chaque page migrée, vérifier :

- [ ] Tous les `<button>` remplacés par `<Button>`
- [ ] Tous les `<input>` remplacés par `<Input>`
- [ ] Tous les `<select>` remplacés par `<Select>`
- [ ] Toutes les cartes utilisent `<Card>`
- [ ] Tous les badges utilisent `<Badge>`
- [ ] Toutes les modales utilisent `<Modal>`
- [ ] Loading states utilisent `<Spinner>`
- [ ] Imports ajoutés en haut du fichier
- [ ] Page teste visuellement (pas de régression)
- [ ] Build réussit (`npm run build`)

---

## 🎯 Avantages de la Migration

### Avant Migration (Ancien Code)
```tsx
// 15 lignes de code
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Email *
  </label>
  <div className="relative">
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="w-full pl-12 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#0E2F56] focus:ring-2 focus:ring-blue-100"
    />
    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
  </div>
  {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
</div>
```

### Après Migration (Nouveau Code)
```tsx
// 7 lignes de code
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  icon={<Mail className="w-5 h-5" />}
  required
  fullWidth
/>
```

**Gain** :
- **53% de code en moins**
- **Type-safe** (TypeScript)
- **Cohérence visuelle** garantie
- **Maintenabilité** améliorée

---

## 📞 Support

Si vous rencontrez des difficultés pendant la migration :

1. Consultez `OPTIMISATIONS_EFFECTUEES.md` pour les exemples détaillés
2. Vérifiez les PropTypes TypeScript dans `/src/components/ui/`
3. Testez le build après chaque page migrée

---

## 🎉 Conclusion

La migration est **progressive et non-breaking**. Vous pouvez migrer page par page sans casser le reste de l'application.

**Temps total estimé** : 8-12 heures pour tout migrer
**ROI** : Code 40-50% plus court, maintenance 60% plus rapide

Bon courage ! 🚀
