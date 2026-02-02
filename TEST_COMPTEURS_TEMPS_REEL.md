# Test des Compteurs en Temps Réel

## Résumé des Corrections

### 1. Fonction `get_candidate_stats` ✅
**Migration**: `fix_all_counters_with_real_data.sql`

La fonction compte maintenant depuis les **vraies tables** au lieu de `candidate_stats`:
- **Offres consultées**: `COUNT(DISTINCT job_id) FROM job_clicks`
- **Candidatures**: `COUNT(*) FROM applications`
- **Vues profil**: `COUNT(*) FROM profile_views`
- **Profils achetés**: `COUNT(*) FROM profile_purchases`
- **Formations**: `COUNT(*) FROM formation_enrollments`

### 2. Fonction `track_job_view_secure` ✅
**Migration**: `add_job_clicks_tracking_to_view_function.sql`

Enregistre maintenant dans `job_clicks` à chaque consultation avec:
- `job_id`: ID de l'offre consultée
- `user_id`: ID du candidat (NULL si anonyme)
- `session_id`: Identifiant de session
- Anti-spam: 1 heure entre deux vues de la même offre

### 3. Tracking Unifié ✅
**Fichiers modifiés**:
- `src/services/candidateStatsService.ts` - Logs détaillés
- `src/pages/JobDetail.tsx` - Déjà correct
- `src/pages/JobDetailComplete.tsx` - Corrigé pour utiliser `candidateStatsService`

## Test de Validation

### Candidat Test: Candidat2 Doré
**Email**: `doreroger1986@gmail.com`
**UUID**: `089942e6-acad-4e28-b5fe-089ad8c1fb33`

### Données de Test Créées
```sql
-- 5 offres consultées (différentes)
INSERT INTO job_clicks (job_id, user_id, session_id, clicked_at)
VALUES
  ('67c1c25f-7571-43d0-9198-b14b786aa3f2', '089942e6...', 'test_1', now()),
  ('67105a5c-0c40-46ca-8ee4-7fa45a5bed20', '089942e6...', 'test_2', now()),
  ('c5d7c79b-0dfa-4426-8ce2-1ae8a10c88b2', '089942e6...', 'test_3', now()),
  ('107bfc91-cebb-4da2-a239-6b3acfbe5339', '089942e6...', 'test_4', now()),
  ('8fc032bd-91ac-484b-8479-8e1041223809', '089942e6...', 'test_5', now());
```

### Résultat Attendu
Quand le candidat se connecte, le dashboard doit afficher:
- ✅ **Offres consultées**: 5
- ✅ **Candidatures**: 4
- ✅ **Vues profil**: 0
- ✅ **Profils achetés**: 0
- ✅ **Formations**: 0

## Comment Tester

1. **Se connecter** avec `doreroger1986@gmail.com`

2. **Ouvrir la console navigateur** (F12)

3. **Vérifier les logs**:
   ```
   🔄 Fetching candidate stats for user: 089942e6...
   📊 RPC Response: { data: {...}, error: null }
   ✅ Parsed candidate stats: { jobViewsCount: 5, ... }
   ```

4. **Cliquer sur le bouton Actualiser** (⟳) en haut à droite du dashboard

5. **Consulter une nouvelle offre**:
   - Aller sur la page des offres
   - Cliquer sur "Voir l'offre"
   - Retourner au dashboard
   - Cliquer sur Actualiser
   - Le compteur doit augmenter de 1

## Fonctionnement Automatique

### Consultation d'une offre
1. Utilisateur clique sur "Voir l'offre"
2. `JobDetail` ou `JobDetailComplete` appelle `candidateStatsService.trackJobView(jobId)`
3. Edge Function `track-job-view` est appelée
4. Fonction RPC `track_job_view_secure` vérifie l'anti-spam (1h)
5. Si OK, insère dans `job_clicks` avec `user_id` + `job_id`
6. Le compteur incrémente automatiquement

### Actualisation du dashboard
1. `CandidateDashboard` appelle `candidateStatsService.getAllStats(userId)`
2. Fonction RPC `get_candidate_stats` compte depuis `job_clicks`
3. Retourne les stats en temps réel
4. Interface met à jour l'affichage

## Avantages

✅ **Comptage exact**: Source unique de vérité (les vraies tables)
✅ **Temps réel**: Toujours à jour sans cache
✅ **Anti-spam**: Impossible de gonfler artificiellement les compteurs
✅ **Traçabilité**: Tous les clics sont loggés dans `candidate_stats_logs`
✅ **Performant**: Utilise des index sur les foreign keys
✅ **Unifié**: Un seul service pour tout le tracking

## Bouton d'Actualisation

Un bouton circulaire (⟳) a été ajouté en haut à droite du dashboard pour:
- Recharger manuellement les statistiques
- S'anime pendant le chargement
- Utile pour voir les changements immédiatement

## Logs Détaillés

Le service affiche maintenant des logs complets dans la console:
- 🔄 Requête en cours
- 📊 Réponse RPC
- ✅ Stats analysées
- ❌ Erreurs éventuelles

Cela facilite le débogage en production.
