# AUDIT COMPLET – INDICATEURS DES CARTES D'OFFRES D'EMPLOI

**Date**: 31 Janvier 2026
**Scope**: Indicateurs affichés sur les cartes d'offres (Jobs.tsx, Home.tsx)
**Objectif**: Vérifier fiabilité, cohérence et logique de calcul sans casser l'architecture

---

## 1️⃣ INVENTAIRE TECHNIQUE DES INDICATEURS

| Indicateur | Champ Base de Données | Source | Type | Logique |
|------------|----------------------|--------|------|---------|
| **Date de publication** | `jobs.created_at` | Colonne `timestamptz` | Stocké | Backend lors de l'INSERT |
| **Nombre de vues** | `jobs.views_count` | Colonne `integer` | Calculé | Trigger automatique via `job_views` |
| **Nombre de candidats** | `jobs.applications_count` | Colonne `integer` | Calculé | Trigger automatique via `applications` |
| **Favoris** | `jobs.saves_count` | Colonne `integer` | Calculé | Trigger automatique via `saved_jobs` |
| **Commentaires** | `jobs.comments_count` | Colonne `integer` | Calculé | Trigger automatique via `job_comments` |

### Sources de données

**Tables principales:**
- `jobs` - Table principale avec les compteurs
- `job_views` - Tracking des vues (via Edge Function)
- `applications` - Table des candidatures
- `saved_jobs` - Table des favoris
- `job_comments` - Table des commentaires
- `candidate_stats_logs` - Table d'audit pour anti-spam

**Edge Functions:**
- `track-job-view` - Gère tracking des vues avec anti-spam

**Services Frontend:**
- `candidateStatsService.ts` - Appelle Edge Function pour vues
- `savedJobsService.ts` - Gère les favoris
- `jobCommentsService.ts` - Gère les commentaires

---

## 2️⃣ LOGIQUE DE CALCUL & MESURE

### 📅 Date de publication

**Source:** `jobs.created_at`

**Événement déclencheur:**
- INSERT dans la table `jobs`
- Valeur automatique via `DEFAULT now()`

**Calcul/Mesure:**
- Stockée directement à la création
- Affichée via `getTimeAgo()` (frontend)
- Pas de calcul dynamique

**Règles d'unicité:**
- Pas applicable (timestamp unique par création)

**Protections:**
- Valeur immuable après création
- Type `timestamptz` (timezone-aware)

**Statut:** ✅ FIABLE

---

### 👁️ Nombre de vues (`views_count`)

**Source:** `jobs.views_count`

**Événement déclencheur:**
```javascript
// Frontend (JobDetail.tsx:64)
trackJobView() -> candidateStatsService.trackJobView(jobId)
  -> Edge Function /track-job-view
  -> RPC track_job_view_secure()
  -> UPDATE jobs SET views_count = views_count + 1
```

**Calcul/Mesure:**
```sql
-- Fonction: track_job_view_secure()
-- Localisation: 20260111183415_create_secure_candidate_stats_system.sql

1. Création d'un fingerprint unique :
   - Utilisateur connecté: user_id
   - Utilisateur anonyme: hash(session_id + ip_hash + user_agent)

2. Vérification anti-spam (fenêtre 1 heure) :
   SELECT created_at FROM candidate_stats_logs
   WHERE stat_type = 'job_view'
     AND related_id = p_job_id
     AND viewer_fingerprint = v_viewer_fingerprint
     AND created_at > (now() - interval '1 hour')

3. Si spam détecté :
   - Log dans candidate_stats_logs avec status = 'blocked_spam'
   - Retour: { success: false, status: 'blocked_spam' }
   - PAS d'incrémentation du compteur

4. Si vue valide :
   - UPDATE jobs SET views_count = views_count + 1
   - INSERT dans candidate_stats_logs avec status = 'success'
```

**Règles d'unicité:**
- 1 vue par utilisateur/session par heure
- Fingerprinting multi-critères (IP hashée + User Agent + Session)

**Protections:**
- ✅ Anti-spam 1 heure (fenêtre temporelle)
- ✅ IP hashée (RGPD compliant)
- ✅ Logging complet pour audit
- ✅ Edge Function avec rate limiting

**Initialisation:**
```sql
-- Recalcul possible via:
UPDATE jobs
SET views_count = (SELECT COUNT(*) FROM job_views WHERE job_views.job_id = jobs.id)
```

**Statut:** ✅ FIABLE AVEC RÉSERVE

**⚠️ PROBLÈME IDENTIFIÉ:**
- La table `job_views` existe mais le trigger `increment_job_view_count` (migration 20260108102823) insère dans `job_views` MAIS n'est peut-être pas utilisé par l'Edge Function
- L'Edge Function appelle directement UPDATE sur `jobs.views_count` sans passer par `job_views`
- Risque de désynchronisation entre `job_views` (historique) et `jobs.views_count` (compteur)

---

### 👤 Nombre de candidats (`applications_count`)

**Source:** `jobs.applications_count`

**Événement déclencheur:**
```sql
-- Trigger: trigger_update_job_applications_count
-- Localisation: 20260113110636_20260113083100_fix_counters_constraints_and_triggers.sql

AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_count()
```

**Calcul/Mesure:**
```sql
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Incrémenter le compteur dans la table jobs
  UPDATE jobs
  SET applications_count = COALESCE(applications_count, 0) + 1,
      updated_at = now()
  WHERE id = NEW.job_id;

  RETURN NEW;
END;
$$;
```

**Règles d'unicité:**
```sql
-- Contrainte UNIQUE empêche les doublons
ALTER TABLE applications
ADD CONSTRAINT applications_candidate_job_unique
UNIQUE (candidate_id, job_id);
```

**Protections:**
- ✅ Contrainte UNIQUE (candidate_id, job_id)
- ✅ Trigger automatique (pas d'intervention frontend)
- ✅ SECURITY DEFINER (bypass RLS)
- ✅ COALESCE pour null safety

**Recalcul:**
```sql
-- Fonction utilitaire disponible
SELECT recalculate_applications_counters();
```

**Initialisation:**
```sql
UPDATE jobs j
SET applications_count = (
  SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id
);
```

**Statut:** ✅ FIABLE ET ROBUSTE

---

### ❤️ Favoris (`saves_count`)

**Source:** `jobs.saves_count`

**Événement déclencheur:**
```sql
-- Trigger: trigger_update_saves_count
-- Localisation: 20260107090515_add_saves_count_to_jobs.sql

AFTER INSERT OR DELETE ON saved_jobs
FOR EACH ROW
EXECUTE FUNCTION update_job_saves_count()
```

**Calcul/Mesure:**
```sql
CREATE OR REPLACE FUNCTION update_job_saves_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE jobs
    SET saves_count = saves_count + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE jobs
    SET saves_count = GREATEST(saves_count - 1, 0)
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Règles d'unicité:**
```sql
-- Contrainte dans saved_jobs
UNIQUE(user_id, job_id)
```

**Protections:**
- ✅ Contrainte UNIQUE empêche doublons
- ✅ GREATEST(count - 1, 0) empêche valeurs négatives
- ✅ Trigger bidirectionnel (INSERT/DELETE)
- ✅ SECURITY DEFINER

**Frontend:**
```typescript
// Services: savedJobsService.ts
toggleSaveJob() -> RPC toggle_save_job()
  -> INSERT ou DELETE dans saved_jobs
  -> Trigger automatique
```

**Initialisation:**
```sql
UPDATE jobs
SET saves_count = (
  SELECT COUNT(*) FROM saved_jobs WHERE saved_jobs.job_id = jobs.id
)
WHERE saves_count = 0;
```

**Statut:** ✅ FIABLE ET ROBUSTE

---

### 💬 Commentaires (`comments_count`)

**Source:** `jobs.comments_count`

**Événement déclencheur:**
```sql
-- Trigger: trigger_update_job_comments_count
-- Localisation: 20260108084016_add_job_comments_count_trigger.sql

AFTER INSERT OR DELETE ON job_comments
FOR EACH ROW
EXECUTE FUNCTION update_job_comments_count()
```

**Calcul/Mesure:**
```sql
CREATE OR REPLACE FUNCTION update_job_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne mettre à jour que pour les commentaires parents (parent_id IS NULL)
  IF (TG_OP = 'INSERT' AND NEW.parent_id IS NULL) THEN
    UPDATE jobs
    SET comments_count = COALESCE(comments_count, 0) + 1
    WHERE id = NEW.job_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE' AND OLD.parent_id IS NULL) THEN
    UPDATE jobs
    SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
    WHERE id = OLD.job_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Règles d'unicité:**
- Pas de contrainte d'unicité (plusieurs commentaires par utilisateur)
- Seuls les commentaires parents comptent (pas les réponses)

**Protections:**
- ✅ Filtrage parent_id IS NULL (évite double comptage)
- ✅ GREATEST empêche valeurs négatives
- ✅ COALESCE pour null safety
- ✅ SECURITY DEFINER

**Frontend:**
```typescript
// Services: jobCommentsService.ts
createComment() -> INSERT INTO job_comments -> Trigger automatique
```

**Initialisation:**
```sql
UPDATE jobs j
SET comments_count = (
  SELECT COUNT(*)
  FROM job_comments jc
  WHERE jc.job_id = j.id AND jc.parent_id IS NULL
);
```

**Statut:** ✅ FIABLE

---

## 3️⃣ COHÉRENCE DES DONNÉES

### Cohérence Frontend/Backend

| Indicateur | Frontend (Carte) | Frontend (Détail) | Backend (DB) | Cohérent? |
|------------|------------------|-------------------|--------------|-----------|
| Date | `getTimeAgo(job.created_at)` | `new Date(job.created_at)` | `jobs.created_at` | ✅ OUI |
| Vues | `job.views_count` | Affiché dans statistiques | `jobs.views_count` | ✅ OUI |
| Candidats | `job.applications_count` | `hasApplied` check | `jobs.applications_count` | ✅ OUI |
| Favoris | `savedJobs[job.id]` | `isSaved` hook | `jobs.saves_count` | ⚠️ PARTIEL |
| Commentaires | `job.comments_count` | Modal avec liste | `jobs.comments_count` | ✅ OUI |

**⚠️ PROBLÈME - Favoris:**
- Le compteur `saves_count` existe côté backend
- Mais le frontend affiche uniquement un booléen (sauvegardé ou non)
- Le compteur n'est PAS affiché sur les cartes dans `Jobs.tsx`
- Il EST affiché dans `Home.tsx` (ligne 609-612)
- **Incohérence visuelle** entre les deux pages

### Cohérence entre pages

| Page | Vues | Candidats | Favoris | Commentaires |
|------|------|-----------|---------|--------------|
| **Home.tsx** (cartes) | ❌ NON affiché | ❌ NON affiché | ✅ Affiché | ✅ Affiché |
| **Jobs.tsx** (cartes) | ✅ Affiché | ✅ Affiché | ❌ NON affiché | ❌ NON affiché |
| **JobDetail.tsx** | Trackée au chargement | Vérifié (hasApplied) | Bouton toggle | Modal |

**🔴 PROBLÈME MAJEUR:**
Incohérence totale de l'affichage entre Home.tsx et Jobs.tsx !

### Données Mock/Sample

**Sample Jobs:**
```typescript
// src/utils/sampleJobsData.ts
// Utilisés quand la DB est vide
// Ces jobs ont des compteurs fictifs ou undefined
```

**Impact:**
- En développement ou DB vide, compteurs peuvent être `undefined` ou 0
- Le code frontend gère correctement avec `job.views_count || 0`

---

## 4️⃣ ANALYSE DES ANOMALIES

### 🔴 CRITIQUE 1: Incohérence d'affichage entre pages

**Problème:**
- `Home.tsx` affiche: Favoris + Commentaires
- `Jobs.tsx` affiche: Vues + Candidats
- Aucune cohérence

**Impact:**
- Confusion utilisateur
- Crédibilité de la plateforme
- Difficulté à comparer les offres

**Cause:**
- Développement en silo
- Pas de design system unifié
- Choix arbitraires par page

**Localisation:**
- `src/pages/Home.tsx:609-625`
- `src/pages/Jobs.tsx:622-631`

---

### 🔴 CRITIQUE 2: Désynchronisation potentielle views_count

**Problème:**
L'Edge Function `track-job-view` incrémente directement `jobs.views_count` SANS insérer dans `job_views`.

**Preuve:**
```typescript
// supabase/functions/track-job-view/index.ts:51
await supabase.rpc('track_job_view_secure', { p_job_id, ... })

// track_job_view_secure() fait:
UPDATE jobs SET views_count = views_count + 1  // ✅ OK

// MAIS job_views n'est JAMAIS alimentée ! ❌
```

**Impact:**
- La table `job_views` reste vide ou incomplète
- Impossible de recalculer `views_count` depuis `job_views`
- Historique des vues perdu

**Cause:**
- Refonte du système de tracking (passage à Edge Function)
- Table `job_views` devenue obsolète mais toujours référencée
- Trigger `increment_job_view_count` existe mais n'est jamais déclenché

---

### 🟠 IMPORTANT 1: Favoris non affichés dans Jobs.tsx

**Problème:**
Le compteur `saves_count` existe et fonctionne, mais n'est pas affiché dans `Jobs.tsx`.

**Impact:**
- Perte d'une métrique sociale importante
- Les candidats ne voient pas la popularité d'une offre

**Cause:**
- Choix de design (afficher vues + candidats au lieu de favoris)

**Localisation:**
- `src/pages/Jobs.tsx:622-631`

---

### 🟠 IMPORTANT 2: Commentaires non affichés dans Jobs.tsx

**Problème:**
Le compteur `comments_count` existe mais n'est pas affiché dans la liste principale des offres.

**Impact:**
- Les utilisateurs ne voient pas l'engagement sur une offre
- Pas d'incitation à consulter/participer

**Localisation:**
- `src/pages/Jobs.tsx:622-631`

---

### 🟢 AMÉLIORATION 1: Pas de Real-time updates

**Problème:**
Les compteurs ne se mettent pas à jour en temps réel sur les cartes ouvertes.

**Impact:**
- Un utilisateur peut voir `5 candidats` alors qu'il y en a 10
- Nécessite un refresh manuel

**Note:**
Le hook `useRealtimeJobUpdates` existe (ligne 76-85) mais met seulement à jour les jobs dans l'état local. Les compteurs ne sont pas spécifiquement écoutés.

---

## 5️⃣ PROPOSITIONS DE CORRECTION

### 🔴 PRIORITÉ 1: Uniformiser l'affichage des indicateurs

**Objectif:** Afficher les MÊMES indicateurs sur Home.tsx et Jobs.tsx

**Solution Progressive:**

**Option A - Affichage minimal (recommandé):**
```typescript
// Sur TOUTES les cartes (Home + Jobs)
- Date de publication
- Nombre de vues
- Nombre de candidats
```

**Option B - Affichage complet:**
```typescript
// Sur TOUTES les cartes
- Date de publication
- Nombre de vues
- Nombre de candidats
- Favoris (compteur)
- Commentaires (compteur)
```

**Implémentation:**
1. Créer un composant `<JobCardStats job={job} />` réutilisable
2. L'utiliser dans Home.tsx et Jobs.tsx
3. Design system unifié

**Code suggéré:**
```typescript
// src/components/jobs/JobCardStats.tsx
interface JobCardStatsProps {
  job: Job & { companies: Company };
  variant?: 'compact' | 'full';
}

export function JobCardStats({ job, variant = 'compact' }: JobCardStatsProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <div className="flex items-center gap-1.5">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        <span>{job.views_count || 0} vues</span>
      </div>

      {job.applications_count > 0 && (
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4 text-green-500" />
          <span>{job.applications_count} candidat{job.applications_count > 1 ? 's' : ''}</span>
        </div>
      )}

      {variant === 'full' && (
        <>
          {job.saves_count > 0 && (
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-red-500" />
              <span>{job.saves_count}</span>
            </div>
          )}

          {job.comments_count > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-purple-500" />
              <span>{job.comments_count}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

**Pas de suppression:** Aucune donnée perdue, juste réorganisation visuelle

---

### 🔴 PRIORITÉ 2: Corriger la désynchronisation views_count

**Problème:** `job_views` n'est jamais alimentée par l'Edge Function

**Solution A - Supprimer job_views (recommandé):**

Rationale: La table est obsolète, l'historique est déjà dans `candidate_stats_logs`

**Étapes:**
1. Vérifier que `candidate_stats_logs` contient bien tous les logs de vues
2. Supprimer la table `job_views`
3. Supprimer le trigger `increment_job_view_count`
4. Documenter que l'historique est dans `candidate_stats_logs`

**Migration:**
```sql
-- migration: 20260131_cleanup_obsolete_job_views.sql

/*
  # Nettoyage de la table job_views obsolète

  La table job_views n'est plus utilisée depuis le passage à l'Edge Function.
  L'historique complet est maintenant dans candidate_stats_logs.
*/

-- Vérifier que candidate_stats_logs contient les vues récentes
DO $$
DECLARE
  v_logs_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_logs_count
  FROM candidate_stats_logs
  WHERE stat_type = 'job_view';

  RAISE NOTICE 'Nombre de vues dans candidate_stats_logs: %', v_logs_count;
END $$;

-- Supprimer le trigger
DROP TRIGGER IF EXISTS trigger_increment_job_view_count ON job_views;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS increment_job_view_count();

-- Supprimer la table (OPTIONNEL - Garder pour historique si besoin)
-- DROP TABLE IF EXISTS job_views CASCADE;
-- Pour l'instant, on la garde mais on la documente comme obsolète

COMMENT ON TABLE job_views IS
'OBSOLÈTE: Table conservée pour historique. Les nouvelles vues sont dans candidate_stats_logs.';
```

**Solution B - Alimenter job_views (non recommandé):**

Ajouter un INSERT dans `track_job_view_secure()` APRÈS le UPDATE:
```sql
-- Après UPDATE jobs SET views_count = ...
INSERT INTO job_views (user_id, job_id, viewed_at)
VALUES (COALESCE(v_user_id, gen_random_uuid()), p_job_id, now());
```

Inconvénients:
- Doublon d'information (déjà dans candidate_stats_logs)
- Performance dégradée (2 INSERTs au lieu de 1)
- Complexité accrue

---

### 🟠 PRIORITÉ 3: Ajouter les compteurs manquants dans Jobs.tsx

**Solution:**
Utiliser le composant `JobCardStats` créé en PRIORITÉ 1 avec `variant="full"`

**Impact:** Zéro code cassé, juste ajout visuel

---

### 🟢 PRIORITÉ 4: Ajouter Real-time updates

**Solution:**
Étendre le hook `useRealtimeJobUpdates` pour écouter les changements de compteurs.

**Code suggéré:**
```typescript
// src/hooks/useRealtimeJobUpdates.ts (modifier)
supabase
  .channel('job_updates')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'jobs',
      filter: `id=in.(${jobIds.join(',')})`,  // Suivre seulement les jobs affichés
    },
    (payload) => {
      const updates = {
        views_count: payload.new.views_count,
        applications_count: payload.new.applications_count,
        saves_count: payload.new.saves_count,
        comments_count: payload.new.comments_count,
      };
      onJobUpdate(payload.new.id, updates);
    }
  )
  .subscribe();
```

**Avantage:** Mise à jour automatique sans refresh

---

## 6️⃣ TABLEAU RÉCAPITULATIF

| Indicateur | Fonctionne | Problème identifié | Cause | Correction recommandée | Priorité |
|------------|------------|-------------------|-------|----------------------|----------|
| **Date de publication** | ✅ OUI | Aucun | - | Aucune | - |
| **Nombre de vues** | ⚠️ PARTIEL | Désynchronisation `job_views` | Table obsolète non alimentée | Supprimer `job_views` ou documenter comme obsolète | 🔴 CRITIQUE |
| **Nombre de candidats** | ✅ OUI | Aucun | - | Aucune | - |
| **Favoris** | ✅ OUI (backend) | Non affiché dans Jobs.tsx | Choix de design | Ajouter à l'affichage | 🟠 IMPORTANT |
| **Commentaires** | ✅ OUI (backend) | Non affiché dans Jobs.tsx | Choix de design | Ajouter à l'affichage | 🟠 IMPORTANT |
| **Cohérence inter-pages** | ❌ NON | Indicateurs différents Home vs Jobs | Développement en silo | Composant unifié `<JobCardStats />` | 🔴 CRITIQUE |
| **Real-time** | ❌ NON | Pas de mise à jour automatique | Hook incomplet | Étendre `useRealtimeJobUpdates` | 🟢 AMÉLIORATION |

---

## 7️⃣ PRIORISATION DES ACTIONS

### 🔴 CRITIQUE (À faire immédiatement)

**1. Uniformiser l'affichage des indicateurs**
- Impact: Crédibilité plateforme, UX
- Effort: Moyen (1 jour)
- Risque: Aucun (ajout visuel seulement)

**2. Corriger désynchronisation job_views**
- Impact: Cohérence des données, maintenance
- Effort: Faible (quelques heures)
- Risque: Faible (table peu utilisée)

### 🟠 IMPORTANT (À planifier)

**3. Ajouter favoris et commentaires dans Jobs.tsx**
- Impact: Engagement utilisateur, complétude
- Effort: Faible (réutilisation composant)
- Risque: Aucun

### 🟢 AMÉLIORATION (Nice to have)

**4. Ajouter Real-time updates**
- Impact: Modernité, UX premium
- Effort: Moyen (1 jour)
- Risque: Moyen (gestion de la performance)

---

## 8️⃣ SCRIPTS D'AUDIT DISPONIBLES

### Vérifier l'état actuel des compteurs

```sql
-- Comparer compteurs avec réalité
SELECT
  j.id,
  j.title,
  j.views_count as compteur_vues,
  (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND related_id = j.id AND status = 'success') as vues_reelles,
  j.applications_count as compteur_candidatures,
  (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as candidatures_reelles,
  j.saves_count as compteur_favoris,
  (SELECT COUNT(*) FROM saved_jobs WHERE job_id = j.id) as favoris_reels,
  j.comments_count as compteur_commentaires,
  (SELECT COUNT(*) FROM job_comments WHERE job_id = j.id AND parent_id IS NULL) as commentaires_reels
FROM jobs j
WHERE j.status = 'published'
ORDER BY j.created_at DESC
LIMIT 10;
```

### Recalculer tous les compteurs

```sql
-- Recalculer applications_count
SELECT recalculate_applications_counters();

-- Recalculer saves_count
UPDATE jobs
SET saves_count = (SELECT COUNT(*) FROM saved_jobs WHERE saved_jobs.job_id = jobs.id);

-- Recalculer comments_count
UPDATE jobs j
SET comments_count = (
  SELECT COUNT(*) FROM job_comments jc
  WHERE jc.job_id = j.id AND jc.parent_id IS NULL
);

-- Recalculer views_count depuis candidate_stats_logs
UPDATE jobs j
SET views_count = (
  SELECT COUNT(*)
  FROM candidate_stats_logs csl
  WHERE csl.stat_type = 'job_view'
    AND csl.related_id = j.id
    AND csl.status = 'success'
);
```

---

## 9️⃣ CONCLUSION

### Points Positifs ✅

1. **Architecture robuste**: Triggers automatiques, SECURITY DEFINER, contraintes UNIQUE
2. **Anti-spam efficace**: Fenêtre temporelle 1h, fingerprinting multi-critères
3. **Audit trail**: Table `candidate_stats_logs` pour traçabilité complète
4. **Applications count**: Système parfait, aucun problème
5. **Saves count**: Système parfait avec protection contre valeurs négatives
6. **Comments count**: Filtre intelligent (parent_id IS NULL)

### Points à Améliorer ⚠️

1. **Incohérence visuelle**: Différents indicateurs entre Home et Jobs
2. **Table job_views**: Obsolète mais toujours référencée
3. **Indicateurs manquants**: Favoris et commentaires absents de Jobs.tsx
4. **Pas de Real-time**: Nécessite refresh manuel

### Recommandation Générale

Le système est **GLOBALEMENT FIABLE** mais souffre d'**incohérences visuelles** et d'une **table obsolète** à nettoyer.

**Actions prioritaires:**
1. Créer composant unifié `<JobCardStats />`
2. Nettoyer ou documenter `job_views`
3. Déployer les corrections visuelles

**Timeline suggéré:**
- Semaine 1: CRITIQUE 1 + CRITIQUE 2
- Semaine 2: IMPORTANT 3
- Semaine 3+: AMÉLIORATION 4 (optionnel)

---

**Rapport généré le:** 31 Janvier 2026
**Auteur:** Audit Système JobGuinée
**Version:** 1.0
