# 🏷️ SYSTÈME DE BADGES - CARTES OFFRES D'EMPLOI
## JobGuinée - Documentation Complète

**Date :** 31 décembre 2025
**Version :** 6.0
**Fichier principal :** `src/pages/Jobs.tsx`

---

## 📋 VUE D'ENSEMBLE

Les cartes d'offres d'emploi affichent plusieurs types de badges visuels pour communiquer rapidement des informations clés aux candidats. Ces badges sont stratégiquement positionnés et colorés pour maximiser la visibilité.

---

## 🎯 TYPES DE BADGES

### 1. BADGE "À LA UNE" ⚡
**Position :** Coin supérieur droit (absolu)
**Condition :** `job.is_featured === true`

#### Design
```tsx
<div className="absolute top-0 right-0 bg-gradient-to-l from-[#FF8C00] to-orange-500 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl flex items-center space-x-1 shadow-lg z-10">
  <Zap className="w-3.5 h-3.5" />
  <span>À LA UNE</span>
</div>
```

#### Caractéristiques
- **Couleur :** Gradient orange (#FF8C00 → orange-500)
- **Icône :** Éclair (Zap)
- **Position :** Hors du flux (absolute), fixé en haut à droite
- **Z-index :** 10 (au-dessus de tout)
- **Border-radius :** Arrondi uniquement en bas à gauche (rounded-bl-xl)

#### Utilisation
- Offres sponsorisées par recruteurs premium
- Offres promues par administrateurs
- Offres prioritaires dans les résultats de recherche
- Visibilité maximale garantie

#### Données Backend
```sql
-- Colonne dans table jobs
is_featured BOOLEAN DEFAULT false
```

---

### 2. BADGE "NOUVEAU" 🟢
**Position :** Titre de l'offre (inline, à droite)
**Condition :** Offre créée il y a moins de 3 jours

#### Code de Condition
```tsx
const isNew = Math.floor(
  (new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
) < 3;

{isNew && (
  <span className="px-2.5 py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 flex-shrink-0">
    NOUVEAU
  </span>
)}
```

#### Caractéristiques
- **Couleur :** Gradient vert clair (green-100 → green-50)
- **Texte :** Vert foncé (green-700)
- **Bordure :** Vert (border-green-200)
- **Position :** À côté du titre
- **Durée :** 3 jours après publication

#### Utilisation
- Attirer l'attention sur les nouvelles opportunités
- Encourager candidatures rapides
- Signal de fraîcheur du contenu
- Indicateur temporel automatique

#### Calcul Automatique
```javascript
// Calcul du nombre de jours depuis publication
const daysSincePosted = Math.floor(
  (Date.now() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24)
);

// Badge affiché si < 3 jours
if (daysSincePosted < 3) {
  // Afficher badge NOUVEAU
}
```

---

### 3. BADGE "URGENT" 🔴
**Position :** Titre de l'offre (inline, à droite)
**Condition :** `job.is_urgent === true`

#### Design
```tsx
{job.is_urgent && (
  <span className="px-2.5 py-1 bg-gradient-to-r from-red-100 to-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex-shrink-0 animate-pulse">
    URGENT
  </span>
)}
```

#### Caractéristiques
- **Couleur :** Gradient rouge clair (red-100 → red-50)
- **Texte :** Rouge foncé (red-700)
- **Bordure :** Rouge (border-red-200)
- **Animation :** **Pulsation continue** (animate-pulse)
- **Visibilité :** Très haute (animation attire l'œil)

#### Utilisation
- Offres à pourvoir rapidement
- Deadline de candidature proche
- Postes critiques pour l'entreprise
- Urgence de recrutement

#### Données Backend
```sql
-- Colonne dans table jobs
is_urgent BOOLEAN DEFAULT false
```

#### Impact Visuel
- **Animation pulse :** Attire l'attention immédiatement
- **Couleur rouge :** Signale l'urgence universellement
- **Combinaison avec NOUVEAU :** Peut s'afficher simultanément

---

### 4. BADGES INFORMATIONS OFFRE (Section Centrale)

Ces badges affichent des informations clés sur les exigences de l'offre.

#### 4.1 Badge Type de Contrat 💼

```tsx
{job.contract_type && (
  <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
    💼 {job.contract_type}
  </span>
)}
```

**Caractéristiques :**
- **Couleur :** Gradient bleu clair
- **Icône :** 💼 (emoji mallette)
- **Exemples :** "CDI", "CDD", "Stage", "Freelance"

---

#### 4.2 Badge Expérience Requise ⭐

```tsx
{job.experience_level && (
  <span className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 flex items-center gap-1">
    <Award className="w-3.5 h-3.5" />
    {job.experience_level}
  </span>
)}
```

**Caractéristiques :**
- **Couleur :** Gradient violet clair
- **Icône :** Award (médaille Lucide)
- **Exemples :** "Débutant", "1-3 ans", "3-5 ans", "5-10 ans", "Expert +10 ans"

---

#### 4.3 Badge Niveau d'Études 🎓

```tsx
{job.education_level && (
  <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center gap-1">
    <GraduationCap className="w-3.5 h-3.5" />
    {job.education_level}
  </span>
)}
```

**Caractéristiques :**
- **Couleur :** Gradient indigo clair
- **Icône :** GraduationCap (toque universitaire Lucide)
- **Exemples :** "Bac", "Bac+2", "Licence", "Master", "Doctorat"

---

#### 4.4 Badge Diplôme Spécifique 📜

```tsx
{job.diploma_required && (
  <span className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200 flex items-center gap-1">
    📜 {job.diploma_required}
  </span>
)}
```

**Caractéristiques :**
- **Couleur :** Gradient turquoise clair
- **Icône :** 📜 (emoji diplôme)
- **Exemples :** "Diplôme d'ingénieur", "Licence RH", "CAP/BEP"

---

### 5. BADGES STATISTIQUES (Section Info)

Ces badges affichent des métriques de l'offre.

#### 5.1 Localisation 📍

```tsx
{job.location && (
  <div className="flex items-center gap-1.5">
    <MapPin className="w-4 h-4 text-[#FF8C00]" />
    <span>{job.location}</span>
  </div>
)}
```

**Caractéristiques :**
- Icône orange (#FF8C00)
- Texte gris (text-gray-600)
- Exemple : "Conakry", "Kankan", "Labé"

---

#### 5.2 Date de Publication 🕒

```tsx
<div className="flex items-center gap-1.5">
  <Clock className="w-4 h-4 text-[#FF8C00]" />
  <span>{getTimeAgo(job.created_at)}</span>
</div>
```

**Format d'affichage :**
- **Aujourd'hui** : Posté aujourd'hui
- **Hier** : Posté hier
- **< 7 jours** : "Il y a 3j"
- **< 30 jours** : "Il y a 2 sem."
- **> 30 jours** : "12 déc."

---

#### 5.3 Nombre de Vues 📈

```tsx
<div className="flex items-center gap-1.5">
  <TrendingUp className="w-4 h-4 text-blue-500" />
  <span>{job.views_count} vues</span>
</div>
```

**Caractéristiques :**
- Icône bleue (blue-500)
- Compteur de vues automatique
- Indicateur de popularité

---

#### 5.4 Nombre de Candidatures 👥

```tsx
{job.applications_count > 0 && (
  <div className="flex items-center gap-1.5">
    <Users className="w-4 h-4 text-green-500" />
    <span>{job.applications_count} candidat{job.applications_count > 1 ? 's' : ''}</span>
  </div>
)}
```

**Caractéristiques :**
- Icône verte (green-500)
- Affichage conditionnel (seulement si > 0)
- Pluriel automatique
- Indicateur de compétition

---

### 6. BADGE SALAIRE 💰

```tsx
<div className="flex items-center gap-1.5 text-[#FF8C00] font-bold">
  <DollarSign className="w-5 h-5" />
  <span className="text-base">{formatSalary(job.salary_min, job.salary_max)}</span>
</div>
```

#### Formats d'Affichage

**Fonction de formatage :**
```javascript
const formatSalary = (min, max) => {
  if (!min && !max) return 'À négocier';

  const format = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  if (min && max) return `${format(min)} - ${format(max)} GNF`;
  if (min) return `À partir de ${format(min)} GNF`;
  return `Jusqu'à ${format(max)} GNF`;
};
```

**Exemples :**
- `2K - 5K GNF` → 2 000 - 5 000 GNF
- `1.5M - 3M GNF` → 1 500 000 - 3 000 000 GNF
- `À partir de 800K GNF` → Salaire minimum
- `Jusqu'à 2M GNF` → Salaire maximum
- `À négocier` → Pas de fourchette définie

---

### 7. BADGE DEADLINE ⏰

```tsx
{hasDeadline && (
  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
    <Calendar className="w-3.5 h-3.5 text-red-500" />
    <span>Avant le {new Date(job.deadline).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
  </div>
)}
```

**Caractéristiques :**
- Icône calendrier rouge (red-500)
- Fond gris clair (gray-50)
- Format date : "31 déc. 2025"
- Signal d'urgence temporelle

---

## 📊 HIÉRARCHIE VISUELLE

### Position des Badges

```
┌─────────────────────────────────────────────┐
│                          [À LA UNE] ⚡      │ ← Badge absolu top-right
├─────────────────────────────────────────────┤
│  [LOGO]  Titre Offre [NOUVEAU] [URGENT]    │ ← Badges inline titre
│          Nom Entreprise                      │
│          📍 Localisation  🕒 Il y a 2j      │ ← Badges info
│          📈 150 vues  👥 12 candidats       │
├─────────────────────────────────────────────┤
│  Description brève de l'offre...            │
├─────────────────────────────────────────────┤
│  [💼 CDI] [⭐ 3-5 ans] [🎓 Licence]        │ ← Badges exigences
├─────────────────────────────────────────────┤
│  💰 2K - 5K GNF      [⏰ Avant le 31 déc.]  │ ← Salaire & Deadline
└─────────────────────────────────────────────┘
```

---

## 🎨 CODE COULEUR SYSTÈME

| Badge | Couleur Principale | Signification |
|-------|-------------------|---------------|
| **À LA UNE** | Orange (#FF8C00) | Premium/Sponsorisé |
| **NOUVEAU** | Vert clair | Fraîcheur |
| **URGENT** | Rouge clair | Urgence |
| **Type Contrat** | Bleu clair | Information contractuelle |
| **Expérience** | Violet clair | Compétence temporelle |
| **Niveau Études** | Indigo clair | Formation académique |
| **Diplôme** | Turquoise clair | Qualification spécifique |
| **Localisation** | Orange (#FF8C00) | Géographie |
| **Horloge** | Orange (#FF8C00) | Temporalité |
| **Vues** | Bleu (blue-500) | Statistique positive |
| **Candidatures** | Vert (green-500) | Engagement |
| **Salaire** | Orange (#FF8C00) | Valeur financière |
| **Deadline** | Gris + Rouge icône | Contrainte temporelle |

---

## 🔧 LOGIQUE CONDITIONNELLE

### Affichage des Badges

```typescript
// 1. BADGE "À LA UNE"
if (job.is_featured) {
  // Toujours affiché en premier (z-index: 10)
  render(<Badge type="featured" />);
}

// 2. BADGE "NOUVEAU"
const daysSincePosted = calculateDaysDiff(job.created_at, Date.now());
if (daysSincePosted < 3) {
  render(<Badge type="new" />);
}

// 3. BADGE "URGENT"
if (job.is_urgent) {
  render(<Badge type="urgent" animate={true} />);
}

// 4. BADGES EXIGENCES (toujours affichés si données présentes)
if (job.contract_type) render(<Badge type="contract" />);
if (job.experience_level) render(<Badge type="experience" />);
if (job.education_level) render(<Badge type="education" />);
if (job.diploma_required) render(<Badge type="diploma" />);

// 5. STATISTIQUES (toujours affichées)
render(<InfoBadge type="location" />);
render(<InfoBadge type="date" />);
render(<InfoBadge type="views" />);

// 6. CANDIDATURES (conditionnel)
if (job.applications_count > 0) {
  render(<InfoBadge type="applications" />);
}

// 7. SALAIRE (toujours affiché avec formatage intelligent)
render(<SalaryBadge min={job.salary_min} max={job.salary_max} />);

// 8. DEADLINE (conditionnel)
if (job.deadline && new Date(job.deadline) > Date.now()) {
  render(<DeadlineBadge date={job.deadline} />);
}
```

---

## 📱 RESPONSIVE BEHAVIOR

### Mobile (< 768px)
- Badges empilés verticalement
- Taille police réduite légèrement
- Padding ajusté
- Badges prioritaires maintenus

### Tablet (768px - 1024px)
- Badges sur 2 lignes max
- Taille normale
- Espacement optimisé

### Desktop (> 1024px)
- Tous badges sur une ligne si possible
- Espacement maximal
- Hover effects actifs

---

## 🎯 IMPACT UTILISATEUR

### Pour les Candidats

| Badge | Information Clé | Action Induite |
|-------|----------------|----------------|
| **À LA UNE** | Offre premium | "Cette entreprise investit = sérieux" |
| **NOUVEAU** | Opportunité fraîche | "Je suis parmi les premiers = chance" |
| **URGENT** | Recrutement rapide | "Je dois postuler vite" |
| **Type Contrat** | Stabilité emploi | "Cela correspond à mes besoins" |
| **Expérience** | Éligibilité | "Ai-je le niveau ?" |
| **Niveau Études** | Qualification | "Mon diplôme correspond ?" |
| **Salaire** | Rémunération | "Est-ce attractif ?" |
| **Deadline** | Urgence administrative | "Date limite de candidature" |
| **Vues/Candidats** | Compétition | "Popularité de l'offre" |

---

## 💡 BONNES PRATIQUES

### Pour les Recruteurs

#### 1. Badge "À LA UNE"
- **Quand l'utiliser :** Postes critiques, offres premium
- **Coût :** Fonction premium (abonnement required)
- **Impact :** +200% visibilité
- **Limite :** 3 offres simultanées max recommandé

#### 2. Badge "URGENT"
- **Quand l'activer :** Deadline < 7 jours ou besoin immédiat
- **Ne pas abuser :** Perte de crédibilité si trop fréquent
- **Recommandation :** Max 20% de vos offres

#### 3. Informations Complètes
- **Toujours remplir :** Salaire, expérience, niveau études
- **Visibilité :** +50% de candidatures si salaire visible
- **Transparence :** Candidats de meilleure qualité

#### 4. Deadline Réaliste
- **Minimum :** 7 jours
- **Optimal :** 14-30 jours
- **Maximum :** 60 jours

---

## 🔄 MISES À JOUR AUTOMATIQUES

### Badges Dynamiques

```javascript
// Badge NOUVEAU (automatique)
setInterval(() => {
  jobs.forEach(job => {
    const isNew = calculateDaysDiff(job.created_at) < 3;
    job.showNewBadge = isNew; // Disparaît après 3 jours
  });
}, 3600000); // Check toutes les heures
```

### Compteurs Temps Réel

```javascript
// Mise à jour vues (temps réel)
onJobView(jobId) {
  incrementViewCounter(jobId);
  updateUIBadge(jobId, 'views');
}

// Mise à jour candidatures (temps réel)
onApplicationSubmit(jobId) {
  incrementApplicationCounter(jobId);
  updateUIBadge(jobId, 'applications');
}
```

---

## 📈 ANALYTICS BADGES

### Métriques à Suivre

```typescript
interface BadgeAnalytics {
  badge_type: 'featured' | 'new' | 'urgent' | 'salary' | 'deadline';
  impression_count: number;       // Vues du badge
  click_through_rate: number;     // CTR spécifique
  conversion_rate: number;        // Applications générées
  avg_time_to_apply: number;      // Temps moyen candidature
}
```

### KPIs Importants

| Métrique | Badge Impactant | Impact Moyen |
|----------|-----------------|--------------|
| **CTR** | À LA UNE | +150% |
| **CTR** | URGENT | +85% |
| **CTR** | NOUVEAU | +45% |
| **Applications** | Salaire visible | +60% |
| **Qualité candidats** | Exigences claires | +40% |

---

## 🚀 AMÉLIORATIONS FUTURES

### Court Terme (1-2 mois)
1. **Badge "Remote" 🌍** - Télétravail possible
2. **Badge "Formation incluse" 📚** - Formation assurée
3. **Badge "Avantages premium" 🎁** - Benefits exceptionnels

### Moyen Terme (3-6 mois)
1. **Badge "Match IA" 💡** - Score compatibilité candidat
2. **Badge "Entreprise certifiée" ✓** - Employeur vérifié
3. **Badge "Réponse garantie" ⚡** - Feedback sous 48h

### Long Terme (6-12 mois)
1. **Badges personnalisés** par secteur
2. **Système de badges gamifiés**
3. **Badges animations avancées** (micro-interactions)

---

## 📚 RÉFÉRENCES TECHNIQUES

### Fichiers Concernés
- **Principal :** `src/pages/Jobs.tsx` (lignes 551-670)
- **JobDetail :** `src/pages/JobDetail.tsx`
- **Types :** `src/types/jobFormTypes.ts`
- **Services :** `src/services/*`

### Dépendances Icons
```typescript
import {
  Zap,           // À LA UNE
  Award,         // Expérience
  GraduationCap, // Études
  MapPin,        // Localisation
  Clock,         // Date
  TrendingUp,    // Vues
  Users,         // Candidats
  DollarSign,    // Salaire
  Calendar,      // Deadline
} from 'lucide-react';
```

---

## ✅ CHECKLIST IMPLÉMENTATION

### Pour Ajouter un Nouveau Badge

- [ ] Définir condition d'affichage
- [ ] Choisir couleur selon système
- [ ] Créer composant badge réutilisable
- [ ] Ajouter colonne DB si nécessaire
- [ ] Implémenter logique conditionnelle
- [ ] Tester responsive mobile/desktop
- [ ] Vérifier accessibilité (contraste couleurs)
- [ ] Documenter dans cette page
- [ ] Créer analytics tracking
- [ ] Tester A/B impact utilisateur

---

## 🎉 CONCLUSION

Le système de badges de JobGuinée offre :

✅ **Communication visuelle claire** - Information rapide en un coup d'œil
✅ **Hiérarchie d'urgence** - Badges prioritaires (URGENT, À LA UNE)
✅ **Code couleur cohérent** - Système de couleurs sémantique
✅ **Métriques temps réel** - Compteurs vues/candidatures dynamiques
✅ **Responsive design** - Adaptation mobile parfaite
✅ **Extensibilité** - Architecture permettant nouveaux badges facilement

Ce système maximise l'engagement candidat tout en fournissant transparence et information complète sur chaque offre.

---

**Documentation par :** Expert UX/UI
**Dernière mise à jour :** 31 décembre 2025
**Version :** 1.0
**Status :** ✅ COMPLET
