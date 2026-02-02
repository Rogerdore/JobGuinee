# 🎯 Système de Comptage en Temps Réel - Guide Complet

## Vue d'Ensemble

Le système de comptage en temps réel permet de suivre automatiquement et en direct les interactions des utilisateurs avec les offres d'emploi :
- ❤️ **Favoris** (saves_count)
- 💬 **Commentaires** (comments_count)
- 📤 **Partages** (shares_count)
- 👁️ **Vues** (views_count)
- 👥 **Candidatures** (applications_count)

## Architecture du Système

### 1. Comptage Automatique avec Triggers

Les compteurs sont mis à jour **automatiquement** via des triggers PostgreSQL :

```sql
-- Trigger pour les favoris
CREATE TRIGGER update_job_saves_count_trigger
  AFTER INSERT OR DELETE ON saved_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_job_saves_count();

-- Trigger pour les commentaires
CREATE TRIGGER update_job_comments_count_trigger
  AFTER INSERT OR DELETE ON job_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_job_comments_count();

-- Trigger pour les partages
CREATE TRIGGER update_job_shares_count_trigger
  AFTER INSERT ON social_share_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_job_shares_count();
```

### 2. Fonctions RPC pour Actions Utilisateur

Des fonctions RPC sécurisées gèrent les actions avec anti-spam intégré :

#### `track_job_save(p_job_id, p_action)`

Ajoute ou retire une offre des favoris.

```typescript
const { data, error } = await supabase.rpc('track_job_save', {
  p_job_id: jobId,
  p_action: 'save' // ou 'unsave'
});

// Réponse
{
  success: true,
  status: 'saved', // ou 'unsaved', 'already_saved', 'not_saved', 'unauthorized'
  message: 'Offre ajoutée aux favoris'
}
```

**Fonctionnalités :**
- ✅ Vérifie l'authentification
- ✅ Empêche les doublons
- ✅ Met à jour le compteur automatiquement (via trigger)
- ✅ Logs dans `candidate_stats_logs`

#### `track_job_share(p_job_id, p_platform, p_share_type, p_session_id)`

Enregistre un partage sur les réseaux sociaux.

```typescript
const { data, error } = await supabase.rpc('track_job_share', {
  p_job_id: jobId,
  p_platform: 'twitter', // 'facebook', 'linkedin', 'twitter', 'whatsapp'
  p_share_type: 'manual', // 'manual', 'auto', 'scheduled'
  p_session_id: sessionId
});

// Réponse
{
  success: true,
  status: 'shared', // ou 'blocked_spam'
  message: 'Partage enregistré',
  platform: 'twitter'
}
```

**Fonctionnalités :**
- ✅ Anti-spam : 1 partage par plateforme par heure
- ✅ Fonctionne pour utilisateurs connectés ET anonymes
- ✅ Fingerprinting unique pour anonymes
- ✅ Met à jour le compteur automatiquement (via trigger)
- ✅ Logs dans `candidate_stats_logs`

#### `get_job_stats(p_job_id)`

Récupère tous les compteurs d'une offre.

```typescript
const { data, error } = await supabase.rpc('get_job_stats', {
  p_job_id: jobId
});

// Réponse
{
  views_count: 125,
  saves_count: 18,
  comments_count: 7,
  shares_count: 42,
  applications_count: 15,
  is_saved: true // pour l'utilisateur connecté
}
```

#### `is_job_saved(p_job_id)`

Vérifie si l'utilisateur a sauvegardé l'offre.

```typescript
const { data, error } = await supabase.rpc('is_job_saved', {
  p_job_id: jobId
});

// Réponse: boolean
```

### 3. Service Frontend

Un service TypeScript simplifie l'utilisation :

```typescript
import { realtimeCountersService } from '@/services/realtimeCountersService';

// Récupérer les stats
const stats = await realtimeCountersService.getJobStats(jobId);

// Sauvegarder
const result = await realtimeCountersService.trackSave(jobId, 'save');

// Partager
const result = await realtimeCountersService.trackShare(
  jobId,
  'twitter',
  'manual'
);

// S'abonner aux mises à jour en temps réel
const unsubscribe = realtimeCountersService.subscribeToJobStats(
  jobId,
  (stats) => {
    console.log('Nouveaux compteurs:', stats);
  }
);
```

## Intégration Frontend

### Mise à Jour des Services Existants

#### savedJobsService.ts

```typescript
async toggleSaveJob(jobId: string): Promise<boolean> {
  const isSavedNow = await this.isSaved(jobId);
  const action = isSavedNow ? 'unsave' : 'save';

  const { data, error } = await supabase.rpc('track_job_save', {
    p_job_id: jobId,
    p_action: action
  });

  if (error) throw error;

  const result = data as { success: boolean; status: string; message: string };

  if (!result.success) {
    throw new Error(result.message);
  }

  return action === 'save';
}
```

#### socialShareService.ts

```typescript
async trackShare(jobId: string, platform: keyof SocialShareLinks): Promise<void> {
  const { realtimeCountersService } = await import('./realtimeCountersService');

  const result = await realtimeCountersService.trackShare(
    jobId,
    platform as 'facebook' | 'linkedin' | 'twitter' | 'whatsapp',
    'manual'
  );

  if (!result.success && result.status !== 'blocked_spam') {
    console.warn('Share tracking failed:', result.message);
  }
}
```

## Audit et Logs

Toutes les actions sont loggées dans `candidate_stats_logs` :

```sql
SELECT
  stat_type,
  status,
  created_at,
  metadata
FROM candidate_stats_logs
WHERE stat_type IN ('job_save', 'job_unsave', 'job_share')
ORDER BY created_at DESC
LIMIT 20;
```

Types de logs disponibles :
- `job_view` - Vue d'une offre
- `job_save` - Ajout aux favoris
- `job_unsave` - Retrait des favoris
- `job_comment` - Nouveau commentaire
- `job_uncomment` - Suppression commentaire
- `job_share` - Partage social

Statuts possibles :
- `success` - Action réussie
- `blocked_spam` - Bloqué par anti-spam
- `error` - Erreur technique

## Tests

### Page de Test Interactive

**URL :** `http://localhost:5173/test-compteurs-temps-reel.html`

Cette page permet de :
- ✅ Sélectionner une offre
- ✅ Voir les compteurs en temps réel
- ✅ Tester l'ajout/retrait des favoris
- ✅ Tester les partages sur différentes plateformes
- ✅ Observer l'anti-spam en action
- ✅ Voir les logs d'actions

### Tests SQL Directs

```sql
-- Test 1 : Sauvegarder une offre
SELECT track_job_save(
  p_job_id := 'uuid-de-loffre',
  p_action := 'save'
);

-- Test 2 : Vérifier le compteur
SELECT id, title, saves_count
FROM jobs
WHERE id = 'uuid-de-loffre';

-- Test 3 : Partager une offre
SELECT track_job_share(
  p_job_id := 'uuid-de-loffre',
  p_platform := 'twitter',
  p_share_type := 'manual',
  p_session_id := 'test_session_123'
);

-- Test 4 : Anti-spam (devrait être bloqué)
SELECT track_job_share(
  p_job_id := 'uuid-de-loffre',
  p_platform := 'twitter',
  p_share_type := 'manual',
  p_session_id := 'test_session_123'
);

-- Test 5 : Récupérer toutes les stats
SELECT get_job_stats('uuid-de-loffre');
```

## Anti-Spam

### Partages

- **Fenêtre :** 1 heure
- **Granularité :** Par plateforme (peut partager sur Facebook et Twitter dans la même heure)
- **Identification :**
  - Utilisateurs connectés : `user_id`
  - Anonymes : Fingerprint MD5(session_id + ip_hash + user_agent)

### Favoris

- Pas d'anti-spam nécessaire
- Contrainte d'unicité empêche les doublons : `UNIQUE(user_id, job_id)`

### Vues

- **Fenêtre :** 1 heure
- Voir `PROBLEME_COMPTAGE_RESOLU.md` pour détails

## Maintenance

### Recalculer Tous les Compteurs

Si les compteurs sont désynchronisés :

```sql
SELECT recalculate_all_job_counters();
```

Cette fonction :
1. Recalcule `saves_count` depuis `saved_jobs`
2. Recalcule `comments_count` depuis `job_comments`
3. Recalcule `shares_count` depuis `social_share_analytics`

### Nettoyer les Anciens Logs

```sql
-- Supprimer les logs de plus de 90 jours
DELETE FROM candidate_stats_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

## Performance

### Index Créés

```sql
-- Pour saved_jobs
CREATE INDEX idx_saved_jobs_user_job ON saved_jobs(user_id, job_id);

-- Pour job_comments
CREATE INDEX idx_job_comments_job_user ON job_comments(job_id, user_id);

-- Pour social_share_analytics
CREATE INDEX idx_social_share_job_platform
  ON social_share_analytics(job_id, platform, created_at DESC);

CREATE INDEX idx_social_share_user_job
  ON social_share_analytics(user_id, job_id)
  WHERE user_id IS NOT NULL;
```

### Optimisations

1. **Triggers** : Mise à jour immédiate sans overhead
2. **RPC** : Logique côté serveur = moins de requêtes
3. **Index** : Requêtes rapides même avec millions d'enregistrements
4. **Logs** : Insertion asynchrone, pas de blocage

## Sécurité

### Row Level Security (RLS)

```sql
-- Les utilisateurs peuvent uniquement gérer leurs propres favoris
CREATE POLICY "Users can manage own saved jobs"
  ON saved_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Les partages sont publics en lecture, inserts via RPC uniquement
CREATE POLICY "Public read access"
  ON social_share_analytics
  FOR SELECT
  TO public
  USING (true);
```

### Validation

- ✅ Authentification requise pour favoris
- ✅ Contraintes CHECK sur plateformes et types
- ✅ SECURITY DEFINER sur fonctions RPC
- ✅ Logs d'erreurs complets

## Compatibilité

### Utilisateurs

| Action | Connecté | Anonyme |
|--------|----------|---------|
| Voir les compteurs | ✅ | ✅ |
| Sauvegarder | ✅ | ❌ |
| Partager | ✅ | ✅ |
| Commenter | ✅ | ❌* |

*Selon configuration RLS des commentaires

### Plateformes de Partage

| Plateforme | Code | Support |
|------------|------|---------|
| Facebook | `facebook` | ✅ |
| LinkedIn | `linkedin` | ✅ |
| Twitter/X | `twitter` | ✅ |
| WhatsApp | `whatsapp` | ✅ |

## Dépannage

### Les compteurs ne s'incrémentent pas

1. Vérifier les triggers :
```sql
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'saved_jobs'::regclass;
```

2. Vérifier les logs :
```sql
SELECT * FROM candidate_stats_logs
WHERE stat_type = 'job_save'
ORDER BY created_at DESC
LIMIT 10;
```

3. Recalculer manuellement :
```sql
SELECT recalculate_all_job_counters();
```

### Anti-spam trop restrictif

Modifier la fenêtre dans les fonctions RPC :

```sql
-- Changer "1 hour" en "30 minutes" par exemple
AND created_at > (now() - interval '30 minutes')
```

### Erreurs de partage

Vérifier les contraintes :
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'social_share_analytics'::regclass;
```

## Fichiers Modifiés

### Migrations
- `create_realtime_counters_system.sql` - Triggers et fonctions principales
- `fix_realtime_counters_system.sql` - Corrections contraintes
- `fix_share_function_constraints.sql` - Adaptation aux contraintes existantes

### Services
- `src/services/realtimeCountersService.ts` - Nouveau service
- `src/services/socialShareService.ts` - Mise à jour
- `src/services/savedJobsService.ts` - Mise à jour

### Tests
- `public/test-compteurs-temps-reel.html` - Page de test interactive

### Documentation
- `COMPTEURS_TEMPS_REEL_GUIDE.md` - Ce guide
- `PROBLEME_COMPTAGE_RESOLU.md` - Fix des vues

## Prochaines Étapes Possibles

1. **Notifications temps réel** - Alerter les recruteurs quand compteurs augmentent
2. **Analytics avancés** - Graphiques d'évolution des compteurs
3. **Gamification** - Badges pour utilisateurs actifs (partageurs, commentateurs)
4. **Export données** - Rapports pour recruteurs sur engagement
5. **A/B Testing** - Tester impact des compteurs visibles vs cachés

## Support

Pour toute question ou problème :
1. Consulter les logs : `candidate_stats_logs`
2. Vérifier la page de test : `/test-compteurs-temps-reel.html`
3. Exécuter les tests SQL ci-dessus
4. Vérifier les migrations appliquées

---

**Date de création :** 02/02/2026
**Version :** 1.0
**Statut :** Production Ready ✅
