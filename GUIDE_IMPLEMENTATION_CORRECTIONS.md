# GUIDE D'IMPLÉMENTATION – CORRECTIONS INDICATEURS CARTES

**Date**: 31 Janvier 2026
**Basé sur**: AUDIT_INDICATEURS_CARTES_OFFRES.md
**Objectif**: Appliquer les corrections recommandées sans casser l'existant

---

## PRIORITÉ 1: Uniformiser l'affichage des indicateurs

### Étape 1: Utiliser le composant JobCardStats

Le composant `src/components/jobs/JobCardStats.tsx` a été créé et est prêt à l'emploi.

**Dans Home.tsx:**

Remplacer les lignes 589-634 (section des stats) par:

```tsx
import JobCardStats from '../components/jobs/JobCardStats';

// Dans le rendu de la carte (ligne ~589)
<JobCardStats job={job} variant="full" showDate={true} />

<div className="flex items-center gap-2">
  <button
    onClick={(e) => handleToggleSave(job.id, e)}
    disabled={savingJob === job.id}
    className={`p-2.5 rounded-lg border-2 transition-all ${
      savedJobs[job.id]
        ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
    } ${savingJob === job.id ? 'opacity-50 cursor-not-allowed' : ''}`}
    title={savedJobs[job.id] ? 'Retirer des favoris' : 'Ajouter aux favoris'}
  >
    <Heart className={`w-5 h-5 ${savedJobs[job.id] ? 'fill-current' : ''}`} />
  </button>
  <button
    onClick={(e) => openComments(job, e)}
    className="p-2.5 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
    title="Voir les commentaires"
  >
    <MessageCircle className="w-5 h-5" />
  </button>
  <button
    onClick={(e) => shareJob(job, e)}
    className="p-2.5 rounded-lg border-2 border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
    title="Partager cette offre"
  >
    <Share2 className="w-5 h-5" />
  </button>
</div>
```

**Dans Jobs.tsx:**

Remplacer les lignes 611-632 (section des stats) par:

```tsx
import JobCardStats from '../components/jobs/JobCardStats';

// Dans le rendu de la carte (ligne ~611)
<JobCardStats job={job} variant="full" showDate={false} />
```

### Étape 2: Vérifier l'import

Assurez-vous que les imports sont corrects en haut des fichiers:

```tsx
// Home.tsx
import JobCardStats from '../components/jobs/JobCardStats';
import { Heart, Share2, MessageCircle } from 'lucide-react';

// Jobs.tsx
import JobCardStats from '../components/jobs/JobCardStats';
```

### Étape 3: Tester

1. Ouvrir la page d'accueil (Home)
2. Ouvrir la page Jobs
3. Vérifier que les indicateurs sont identiques

**Attendu:**
- Même design
- Mêmes données
- Affichage cohérent

---

## PRIORITÉ 2: Corriger la désynchronisation job_views

### Option A: Nettoyer la table obsolète (RECOMMANDÉ)

**Créer la migration:**

```bash
# Créer le fichier de migration
touch supabase/migrations/20260131_cleanup_obsolete_job_views.sql
```

**Contenu de la migration:**

```sql
/*
  # Nettoyage de la table job_views obsolète

  La table job_views n'est plus utilisée depuis le passage à l'Edge Function.
  L'historique complet est maintenant dans candidate_stats_logs.

  1. Vérification
    - Comparer le nombre de vues dans job_views vs candidate_stats_logs
    - S'assurer que candidate_stats_logs est la source de vérité

  2. Actions
    - Supprimer le trigger obsolète
    - Documenter la table comme obsolète
    - Garder la table pour historique (optionnel)
*/

-- Vérifier l'état actuel
DO $$
DECLARE
  v_job_views_count bigint;
  v_logs_count bigint;
BEGIN
  SELECT COUNT(*) INTO v_job_views_count FROM job_views;
  SELECT COUNT(*) INTO v_logs_count
  FROM candidate_stats_logs
  WHERE stat_type = 'job_view' AND status = 'success';

  RAISE NOTICE '====================================';
  RAISE NOTICE 'État de la synchronisation';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Vues dans job_views (obsolète): %', v_job_views_count;
  RAISE NOTICE 'Vues dans candidate_stats_logs (actif): %', v_logs_count;
  RAISE NOTICE '====================================';
END $$;

-- Supprimer le trigger obsolète
DROP TRIGGER IF EXISTS trigger_increment_job_view_count ON job_views;

-- Supprimer la fonction obsolète
DROP FUNCTION IF EXISTS increment_job_view_count();

-- Documenter la table comme obsolète
COMMENT ON TABLE job_views IS
'⚠️ OBSOLÈTE depuis janvier 2026
Cette table n''est plus alimentée. Les vues sont maintenant trackées dans candidate_stats_logs.
Table conservée pour historique uniquement.';

-- Log de fin
DO $$
BEGIN
  RAISE NOTICE '✅ Nettoyage terminé';
  RAISE NOTICE 'La table job_views est maintenant documentée comme obsolète';
  RAISE NOTICE 'Le trigger a été supprimé';
  RAISE NOTICE 'Les nouvelles vues continuent de fonctionner via Edge Function';
END $$;
```

**Appliquer la migration:**

Via Supabase Dashboard:
1. Aller dans SQL Editor
2. Coller le contenu de la migration
3. Exécuter

Via CLI (si configuré):
```bash
supabase db push
```

### Option B: Alimenter job_views (NON RECOMMANDÉ)

Si vous tenez absolument à maintenir job_views synchronisée:

**Modifier la fonction RPC:**

```sql
-- Dans supabase/migrations/[nouveau].sql

CREATE OR REPLACE FUNCTION track_job_view_secure(
  p_job_id uuid,
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_viewer_fingerprint text;
  v_last_view_at timestamptz;
BEGIN
  -- ... logique anti-spam existante ...

  -- Mise à jour du compteur
  UPDATE jobs
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_job_id;

  -- ⭐ AJOUT: Insertion dans job_views
  INSERT INTO job_views (user_id, job_id, viewed_at)
  VALUES (
    COALESCE(v_user_id, gen_random_uuid()),  -- Utilisateur ou ID temporaire
    p_job_id,
    now()
  );

  -- Logging dans candidate_stats_logs
  INSERT INTO candidate_stats_logs (...) VALUES (...);

  RETURN jsonb_build_object('success', true, ...);
END;
$$;
```

**Inconvénients:**
- Doublon d'information
- 2 INSERTs au lieu de 1 (performance)
- Complexité accrue

---

## PRIORITÉ 3: Ajouter favoris et commentaires dans Jobs.tsx

**Déjà fait !**

Si vous avez appliqué PRIORITÉ 1, les favoris et commentaires sont maintenant affichés dans Jobs.tsx via le composant `JobCardStats` avec `variant="full"`.

---

## PRIORITÉ 4: Ajouter Real-time updates (OPTIONNEL)

### Étape 1: Modifier le hook useRealtimeJobUpdates

**Fichier:** `src/hooks/useRealtimeJobUpdates.ts`

Ajouter l'écoute des changements de compteurs:

```typescript
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface UseRealtimeJobUpdatesProps {
  onJobUpdate: (jobId: string, updates: Partial<Job>) => void;
  enabled?: boolean;
  jobIds?: string[];  // Liste des jobs à surveiller
}

export function useRealtimeJobUpdates({
  onJobUpdate,
  enabled = true,
  jobIds = []
}: UseRealtimeJobUpdatesProps) {
  useEffect(() => {
    if (!enabled) return;

    // Créer un channel pour les mises à jour
    const channel = supabase
      .channel('job_stats_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          // Filtrer par IDs si fourni, sinon écouter tous les jobs
          ...(jobIds.length > 0 && { filter: `id=in.(${jobIds.join(',')})` })
        },
        (payload) => {
          // Extraire uniquement les compteurs modifiés
          const updates: any = {};

          if (payload.new.views_count !== payload.old.views_count) {
            updates.views_count = payload.new.views_count;
          }
          if (payload.new.applications_count !== payload.old.applications_count) {
            updates.applications_count = payload.new.applications_count;
          }
          if (payload.new.saves_count !== payload.old.saves_count) {
            updates.saves_count = payload.new.saves_count;
          }
          if (payload.new.comments_count !== payload.old.comments_count) {
            updates.comments_count = payload.new.comments_count;
          }

          // Appeler le callback seulement si des compteurs ont changé
          if (Object.keys(updates).length > 0) {
            onJobUpdate(payload.new.id, updates);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, onJobUpdate, jobIds]);
}
```

### Étape 2: Utiliser le hook dans les pages

**Dans Home.tsx et Jobs.tsx:**

```typescript
// Extraire les IDs des jobs affichés
const visibleJobIds = recentJobs.map(job => job.id);

// Utiliser le hook
useRealtimeJobUpdates({
  onJobUpdate: (jobId, updates) => {
    setRecentJobs(prevJobs =>
      prevJobs.map(job =>
        job.id === jobId ? { ...job, ...updates } : job
      )
    );
  },
  enabled: true,
  jobIds: visibleJobIds
});
```

### Étape 3: Tester

1. Ouvrir deux onglets avec la même page
2. Dans l'onglet 1: Postuler à une offre
3. Dans l'onglet 2: Vérifier que le compteur "candidats" s'incrémente automatiquement

---

## SCRIPTS D'AUDIT

### Exécuter l'audit complet

```bash
# Via Supabase SQL Editor
# Copier/coller le contenu de audit-indicateurs-cartes.sql
```

**Le script va:**
1. Comparer compteurs stockés vs calculés
2. Identifier les désynchronisations
3. Afficher les statistiques globales
4. Lister les jobs problématiques

### Recalculer les compteurs

**Si l'audit révèle des désynchronisations:**

```sql
-- Recalculer applications_count
SELECT recalculate_applications_counters();

-- Recalculer saves_count
UPDATE jobs
SET saves_count = (
  SELECT COUNT(*) FROM saved_jobs WHERE saved_jobs.job_id = jobs.id
);

-- Recalculer comments_count
UPDATE jobs j
SET comments_count = (
  SELECT COUNT(*) FROM job_comments jc WHERE jc.job_id = j.id AND jc.parent_id IS NULL
);

-- Recalculer views_count
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

## CHECKLIST DE VALIDATION

### Après PRIORITÉ 1 (Uniformisation)

- [ ] Home.tsx affiche les mêmes indicateurs que Jobs.tsx
- [ ] Le design est cohérent entre les deux pages
- [ ] Tous les compteurs proviennent de la base de données
- [ ] Aucune régression visuelle

### Après PRIORITÉ 2 (Nettoyage job_views)

- [ ] Le trigger `trigger_increment_job_view_count` est supprimé
- [ ] La table `job_views` est documentée comme obsolète
- [ ] Les vues continuent de fonctionner normalement
- [ ] L'audit ne montre plus de désynchronisation

### Après PRIORITÉ 3 (Favoris + Commentaires)

- [ ] Les favoris s'affichent dans Jobs.tsx
- [ ] Les commentaires s'affichent dans Jobs.tsx
- [ ] Les valeurs sont correctes
- [ ] Le design est harmonieux

### Après PRIORITÉ 4 (Real-time) - OPTIONNEL

- [ ] Les compteurs se mettent à jour automatiquement
- [ ] Pas de surcharge réseau (filtrage par jobIds)
- [ ] Pas de bugs visuels (clignotements, etc.)

---

## TROUBLESHOOTING

### Les indicateurs ne s'affichent pas

**Cause:** Compteurs à 0 ou undefined

**Solution:**
```sql
-- Vérifier l'état des compteurs
SELECT id, title, views_count, applications_count, saves_count, comments_count
FROM jobs
WHERE status = 'published'
LIMIT 5;
```

Si tous les compteurs sont à 0, exécuter le script de recalcul.

### Désynchronisation persiste après recalcul

**Cause:** Triggers non actifs ou RLS policies trop restrictives

**Solution:**
```sql
-- Vérifier les triggers
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table IN ('applications', 'saved_jobs', 'job_comments')
ORDER BY event_object_table;
```

Si des triggers manquent, relancer les migrations concernées.

### Real-time ne fonctionne pas

**Cause:** Channel non configuré ou RLS trop strict

**Solution:**
1. Vérifier que Realtime est activé sur la table `jobs` dans Supabase Dashboard
2. Vérifier les RLS policies sur `jobs` (SELECT doit être public)
3. Vérifier la console du navigateur pour les erreurs

---

## TIMELINE RECOMMANDÉE

**Semaine 1:**
- [ ] Jour 1-2: Appliquer PRIORITÉ 1 (Uniformisation)
- [ ] Jour 3: Tester et valider
- [ ] Jour 4: Appliquer PRIORITÉ 2 (Nettoyage job_views)
- [ ] Jour 5: Exécuter audit complet et valider

**Semaine 2:**
- [ ] Jour 1-2: PRIORITÉ 3 (déjà fait si PRIORITÉ 1 appliquée)
- [ ] Jour 3-5: PRIORITÉ 4 (Real-time) si souhaité

**Semaine 3+:**
- [ ] Monitoring et optimisation

---

## SUPPORT

**Fichiers créés:**
- `AUDIT_INDICATEURS_CARTES_OFFRES.md` - Rapport complet
- `audit-indicateurs-cartes.sql` - Script SQL d'audit
- `src/components/jobs/JobCardStats.tsx` - Composant unifié
- `GUIDE_IMPLEMENTATION_CORRECTIONS.md` - Ce guide

**En cas de problème:**
1. Relire le rapport d'audit
2. Exécuter le script SQL d'audit
3. Vérifier les logs Supabase
4. Contacter le support technique

---

**Dernière mise à jour:** 31 Janvier 2026
**Version:** 1.0
