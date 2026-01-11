# Système de Statistiques Candidat - JobGuinée
## Documentation Technique Complète

## Vue d'ensemble

Le système de statistiques candidat fournit des indicateurs fiables, synchronisés et basés sur une seule source de vérité. Tous les compteurs sont calculés à partir de la base de données et mis à jour automatiquement lors d'actions réelles.

---

## Architecture

### Principe fondamental : SOURCE UNIQUE

**RÈGLE D'OR :** Tous les compteurs sont calculés exclusivement à partir de la base de données. Aucun compteur n'est calculé "à la volée" côté frontend.

```
Action utilisateur → Événement persisté en base → Compteur mis à jour → Dashboard affiche la valeur
```

---

## 1. Indicateurs Disponibles

### 1.1 Offres consultées
- **Source :** Table `job_views`
- **Tracking :** Automatique lors de l'ouverture d'une page détail d'offre
- **Calcul :** COUNT(DISTINCT job_id) - Une offre vue plusieurs fois compte pour 1
- **Service :** `candidateStatsService.trackJobView(userId, jobId)`

### 1.2 Candidatures
- **Source :** Table `applications`
- **Tracking :** Lors de la soumission d'une candidature
- **Calcul :** COUNT(*) WHERE candidate_id = user_id
- **Service :** `candidateStatsService.getApplicationsCount(userId)`

### 1.3 Vues du profil
- **Source :** Table `profile_views` via `candidate_profiles.profile_views_count`
- **Tracking :** Automatique lors de la consultation par un recruteur
- **Calcul :** Fonction RPC `get_candidate_profile_stats()`
- **Service :** `profileViewsService.recordProfileView()` (existant)

### 1.4 Profil acheté
- **Source :** Table `profile_purchases` via `candidate_profiles.profile_purchases_count`
- **Tracking :** Automatique via trigger lors d'un achat validé
- **Calcul :** COUNT(*) WHERE payment_status='completed' AND payment_verified_by_admin=true
- **Trigger :** `update_profile_purchases_count()`

### 1.5 Formations suivies
- **Source :** Table `formation_enrollments`
- **Tracking :** Lors de l'inscription à une formation
- **Calcul :** COUNT(*) WHERE status IN ('enrolled', 'in_progress', 'completed')
- **Service :** `candidateStatsService.enrollInFormation()`

### 1.6 Score IA
- **Source :** Colonne `ai_match_score` dans table `applications`
- **Calcul :** AVERAGE(ai_match_score) de toutes les candidatures
- **Affichage :** Pourcentage de compatibilité moyen
- **Service :** `candidateStatsService.getAIScore(userId)`

---

## 2. Service Centralisé : `candidateStatsService`

### 2.1 Fonctionnalités principales

#### `getAllStats(userId, profileId)`
Charge TOUTES les statistiques en un seul appel. Retourne:
```typescript
{
  jobViewsCount: number;          // Offres consultées
  applicationsCount: number;      // Candidatures
  profileViewsCount: number;      // Vues du profil
  profilePurchasesCount: number;  // Profil acheté
  formationsCount: number;        // Formations suivies
  aiScore: number;                // Score IA moyen (0-100)
  creditsBalance: number;         // Crédits disponibles
  isPremium: boolean;             // Statut premium
  unreadMessagesCount: number;    // Messages non lus
  profileStats: {
    profile_views_count: number;
    profile_purchases_count: number;
    this_month_views: number;
    this_month_purchases: number;
  }
}
```

#### `trackJobView(userId, jobId)`
Enregistre automatiquement une vue d'offre. Vérifie d'abord si l'offre a déjà été vue pour éviter les doublons.

```typescript
await candidateStatsService.trackJobView(user.id, jobId);
```

#### Autres méthodes
- `getJobViewsCount(userId)` - Compte les vues d'offres
- `getApplicationsCount(userId)` - Compte les candidatures
- `getFormationsCount(userId)` - Compte les formations
- `getAIScore(userId)` - Calcule le score IA moyen
- `getProfileStats(userId)` - Récupère stats profil CVthèque
- `enrollInFormation(userId, formationId)` - Inscrit à une formation
- `updateFormationProgress(userId, formationId, progress)` - Met à jour progression

---

## 3. Tables de Tracking

### 3.1 Table `job_views`
```sql
CREATE TABLE job_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_job_views_user_id ON job_views(user_id);
CREATE INDEX idx_job_views_job_id ON job_views(job_id);

-- RLS activée
ALTER TABLE job_views ENABLE ROW LEVEL SECURITY;
```

### 3.2 Table `profile_views`
```sql
CREATE TABLE profile_views (
  id UUID PRIMARY KEY,
  candidate_id UUID REFERENCES candidate_profiles(id),
  viewer_id UUID REFERENCES profiles(id),
  viewed_at TIMESTAMPTZ,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- Fonction d'incrémentation
CREATE FUNCTION increment_profile_views(
  p_candidate_id UUID,
  p_viewer_id UUID,
  p_session_id TEXT
) RETURNS void;
```

### 3.3 Table `formation_enrollments`
```sql
CREATE TABLE formation_enrollments (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  formation_id UUID REFERENCES formations(id),
  status TEXT CHECK (status IN ('enrolled', 'in_progress', 'completed', 'cancelled')),
  progress INTEGER CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, formation_id)
);
```

### 3.4 Colonnes de compteurs dans `candidate_profiles`
```sql
ALTER TABLE candidate_profiles
ADD COLUMN profile_views_count INTEGER DEFAULT 0,
ADD COLUMN profile_purchases_count INTEGER DEFAULT 0,
ADD COLUMN last_viewed_at TIMESTAMPTZ;
```

### 3.5 Colonne `ai_match_score` dans `applications`
```sql
ALTER TABLE applications
ADD COLUMN ai_match_score INTEGER CHECK (ai_match_score >= 0 AND ai_match_score <= 100);
```

---

## 4. Fonctions RPC Supabase

### 4.1 `get_candidate_profile_stats(p_user_id UUID)`
Retourne les statistiques de profil CVthèque :
```sql
CREATE FUNCTION get_candidate_profile_stats(p_user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'profile_views_count', COALESCE(cp.profile_views_count, 0),
    'profile_purchases_count', COALESCE(cp.profile_purchases_count, 0),
    'this_month_views', (SELECT COUNT(*) FROM profile_views WHERE ...),
    'this_month_purchases', (SELECT COUNT(*) FROM profile_purchases WHERE ...)
  ) FROM candidate_profiles cp WHERE cp.user_id = p_user_id;
$$ LANGUAGE plpgsql;
```

### 4.2 `increment_profile_views(p_candidate_id, p_viewer_id, p_session_id)`
Incrémente automatiquement le compteur de vues de profil :
```sql
CREATE FUNCTION increment_profile_views(...) AS $$
BEGIN
  -- Increment counter
  UPDATE candidate_profiles
  SET profile_views_count = profile_views_count + 1,
      last_viewed_at = now()
  WHERE id = p_candidate_id;

  -- Log view
  INSERT INTO profile_views (candidate_id, viewer_id, session_id)
  VALUES (p_candidate_id, p_viewer_id, p_session_id);
END;
$$ LANGUAGE plpgsql;
```

---

## 5. Intégration Dashboard Candidat

### 5.1 Chargement des statistiques

**AVANT (requêtes dispersées) :**
```typescript
const [apps, jobViews, formations, profileStats, ...] = await Promise.all([
  supabase.from('applications').select(...),
  supabase.from('job_views').select(...),
  supabase.from('formation_enrollments').select(...),
  // ... 7 requêtes différentes
]);
```

**APRÈS (service centralisé) :**
```typescript
const stats = await candidateStatsService.getAllStats(user.id, profile.id);

// stats contient TOUT en un seul objet
setJobViewsCount(stats.jobViewsCount);
setAiScore(stats.aiScore);
setProfileStats(stats.profileStats);
// ...
```

### 5.2 Affichage dans le dashboard

Les compteurs sont affichés dans plusieurs endroits :
1. **Header dashboard** (cartes de statistiques)
2. **Onglet principal** (vue d'ensemble)
3. **Sections détaillées** (candidatures, formations, etc.)

Tous utilisent maintenant la MÊME source : les variables d'état mises à jour par `candidateStatsService.getAllStats()`.

---

## 6. Tracking Automatique

### 6.1 Vues d'offres (JobDetail.tsx)

```typescript
import { candidateStatsService } from '../services/candidateStatsService';

useEffect(() => {
  if (user) {
    trackJobView();
  }
}, [jobId, user]);

const trackJobView = async () => {
  if (!user || !jobId || jobId.startsWith('sample-')) return;

  try {
    await candidateStatsService.trackJobView(user.id, jobId);
  } catch (error) {
    console.debug('Job view tracking:', error);
  }
};
```

**Comportement :**
- Vérifie d'abord si l'offre a déjà été vue
- N'insère que si c'est une nouvelle vue
- Silencieux : ne bloque jamais l'UI
- Pas de tracking pour les offres sample (démo)

### 6.2 Vues de profil (CVTheque)

```typescript
import { profileViewsService } from '../services/profileViewsService';

const handleViewProfile = async (candidateId: string) => {
  await profileViewsService.recordProfileView(candidateId);
  // ... afficher le profil
};
```

**Comportement :**
- Appelle la fonction RPC `increment_profile_views()`
- Met à jour automatiquement le compteur dans `candidate_profiles`
- Enregistre dans `profile_views` pour l'historique

### 6.3 Achats de profil (Trigger automatique)

```sql
CREATE TRIGGER trigger_update_profile_purchases_count
  AFTER INSERT OR UPDATE OF payment_status, payment_verified_by_admin
  ON profile_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_purchases_count();
```

**Comportement :**
- Déclenché automatiquement lors d'un achat validé
- Aucune action manuelle nécessaire
- Garantit la cohérence des compteurs

---

## 7. Score IA

### 7.1 Calcul du score

Le score IA est calculé comme la **moyenne des scores de compatibilité** de toutes les candidatures ayant un `ai_match_score` non null.

```typescript
async getAIScore(userId: string): Promise<number> {
  const { data } = await supabase
    .from('applications')
    .select('ai_match_score')
    .eq('candidate_id', userId)
    .not('ai_match_score', 'is', null);

  if (!data || data.length === 0) return 0;

  const scores = data.map(app => app.ai_match_score);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return Math.round(average);
}
```

### 7.2 Affichage du score

Le score est affiché dans plusieurs contextes :

**1. Statistiques principales (header) :**
```jsx
<div className="text-3xl font-bold">{aiScore}%</div>
```

**2. Recommandations IA :**
```jsx
{aiScore > 0 && (
  <p>
    Votre score moyen de compatibilité est de {aiScore}%
    {aiScore < 80 && ' Suivez une formation pour améliorer vos chances!'}
  </p>
)}
```

**3. Détails des candidatures :**
```jsx
{app.ai_match_score ? (
  <span>Score IA: {app.ai_match_score}%</span>
) : (
  <span>Score disponible</span>
)}
```

### 7.3 Attribution du score

Le score IA est attribué lors de :
- Utilisation du service de matching IA Premium
- Analyse automatique de compatibilité
- Services d'optimisation CV

---

## 8. Performance & Optimisation

### 8.1 Indexes

Tous les indexes nécessaires sont créés pour assurer des performances optimales :

```sql
-- job_views
CREATE INDEX idx_job_views_user_id ON job_views(user_id);
CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_viewed_at ON job_views(viewed_at);

-- profile_views
CREATE INDEX idx_profile_views_candidate_id ON profile_views(candidate_id);
CREATE INDEX idx_profile_views_viewer_id ON profile_views(viewer_id);
CREATE INDEX idx_profile_views_viewed_at ON profile_views(viewed_at DESC);

-- formation_enrollments
CREATE INDEX idx_formation_enrollments_user_id ON formation_enrollments(user_id);
CREATE INDEX idx_formation_enrollments_status ON formation_enrollments(status);
```

### 8.2 Requêtes optimisées

Le service `getAllStats()` utilise `Promise.all()` pour charger toutes les statistiques en parallèle, minimisant le temps de chargement.

```typescript
const [jobViewsData, applicationsData, formationsData, ...] = await Promise.all([
  // 5 requêtes en parallèle au lieu de 5 séquentielles
]);
```

### 8.3 Cache côté frontend

Les statistiques sont mises en cache dans l'état React et rechargées uniquement lorsque nécessaire :
- Au montage du composant
- Après une action utilisateur (candidature, inscription formation, etc.)
- Via real-time pour les messages non lus

---

## 9. Sécurité (RLS)

Toutes les tables de tracking ont RLS activée :

```sql
-- Exemple pour job_views
CREATE POLICY "Users can view own job views"
  ON job_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job views"
  ON job_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

**Règles de sécurité :**
- Un candidat ne voit QUE ses propres statistiques
- Admins peuvent voir toutes les statistiques (via policies spécifiques)
- Recruteurs voient uniquement leur historique de consultation de profils

---

## 10. Tests & Validation

### 10.1 Tests manuels

**Scénario 1 : Vues d'offres**
1. Se connecter en tant que candidat
2. Ouvrir une page détail d'offre
3. Vérifier que `job_views` contient une entrée
4. Rafraîchir le dashboard
5. Vérifier que le compteur "Offres consultées" a augmenté

**Scénario 2 : Score IA**
1. Créer des candidatures avec `ai_match_score` différents
2. Rafraîchir le dashboard
3. Vérifier que le score affiché = moyenne des scores

**Scénario 3 : Vues de profil**
1. Se connecter en tant que recruteur
2. Consulter un profil candidat dans CVthèque
3. Se reconnecter en tant que candidat
4. Vérifier que le compteur "Vues du profil" a augmenté

### 10.2 Vérifications SQL

```sql
-- Vérifier les vues d'offres pour un user
SELECT COUNT(DISTINCT job_id) FROM job_views WHERE user_id = 'USER_ID';

-- Vérifier le score IA moyen
SELECT AVG(ai_match_score) FROM applications
WHERE candidate_id = 'USER_ID' AND ai_match_score IS NOT NULL;

-- Vérifier les vues de profil
SELECT profile_views_count, last_viewed_at
FROM candidate_profiles WHERE user_id = 'USER_ID';
```

---

## 11. Troubleshooting

### Problème : Compteur ne se met pas à jour

**Diagnostic :**
1. Vérifier que l'action a bien créé une entrée en base
2. Vérifier les RLS policies (SELECT sur la table)
3. Vérifier les logs console pour erreurs

**Solution :**
```typescript
// Forcer le rechargement des stats
await loadData();
```

### Problème : Score IA à 0%

**Diagnostic :**
1. Vérifier que les candidatures ont un `ai_match_score` non null
2. Vérifier la requête SQL dans candidateStatsService

**Solution :**
```sql
-- Vérifier les scores existants
SELECT id, ai_match_score FROM applications
WHERE candidate_id = 'USER_ID';
```

### Problème : Doublons dans job_views

**Diagnostic :**
Le service `trackJobView()` vérifie déjà l'existence avant insertion.

**Solution :**
```sql
-- Nettoyer les doublons manuellement si nécessaire
DELETE FROM job_views a USING job_views b
WHERE a.id > b.id AND a.user_id = b.user_id AND a.job_id = b.job_id;
```

---

## 12. Évolutions Futures

### Court terme (1-2 mois)
- [ ] Dashboard analytics avancé (graphiques de tendances)
- [ ] Comparaison de stats avec moyennes du secteur
- [ ] Notifications quand un compteur important change

### Moyen terme (3-6 mois)
- [ ] Export PDF des statistiques
- [ ] Historique des statistiques (évolution temporelle)
- [ ] Recommandations IA basées sur les stats

### Long terme (6-12 mois)
- [ ] Machine Learning pour prédiction de réussite
- [ ] Benchmarking avec autres candidats (anonymisé)
- [ ] Gamification (badges, niveaux basés sur stats)

---

## Conclusion

Le système de statistiques candidat est maintenant :
- ✅ **Fiable** : Basé sur des données réelles en base
- ✅ **Cohérent** : Une seule source de vérité
- ✅ **Automatisé** : Tracking automatique des actions
- ✅ **Performant** : Requêtes optimisées et indexes
- ✅ **Sécurisé** : RLS activée partout
- ✅ **Scalable** : Architecture prête pour forte montée en charge

**Fichiers clés :**
- Service : `src/services/candidateStatsService.ts`
- Dashboard : `src/pages/CandidateDashboard.tsx`
- JobDetail : `src/pages/JobDetail.tsx`
- ProfileViews : `src/services/profileViewsService.ts`

**Migrations :**
- `20251210230505_fix_candidate_dashboard_indicators.sql`
- `20260110114533_add_profile_views_and_purchases_tracking.sql`

**Version :** 1.0.0
**Date :** 2026-01-11
**Statut :** ✅ Production Ready
