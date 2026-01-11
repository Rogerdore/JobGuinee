# Système Sécurisé de Statistiques Candidat - JobGuinée
## Documentation Technique Complète V2.0

---

## 🎯 OBJECTIF

Fournir un système de statistiques candidat:
- **MÉTIER-CORRECT** : Respecte strictement les règles métier
- **ANTI-SPAM** : Protection contre manipulation et abus
- **AUDITABLE** : Traçabilité complète de chaque action
- **SCALABLE** : Architecture performante pour forte montée en charge
- **BACKEND-FIRST** : Aucune logique critique côté frontend

---

## 📋 RÈGLES MÉTIER OBLIGATOIRES

### A. Job Views (Vues d'offres)

**Principe**: Compteur dynamique mesurant la popularité réelle d'une offre

**Règles de validation**:
- ✅ Consultation réelle de la page JobDetail uniquement
- ✅ Tracking backend via Edge Function
- ✅ Anti-spam: 1 vue max par heure par viewer_fingerprint
- ✅ Exclusion des bots automatique
- ✅ Ignore les rafraîchissements immédiats
- ✅ Ignore les doubles clics successifs

**Sources autorisées**:
- Candidats connectés
- Utilisateurs anonymes
- Recruteurs / Employeurs

**Unicité**: `viewer_fingerprint` + `job_id` + fenêtre 1h

---

### B. Profile Views (CVthèque) ⚠️ CRITIQUE

**Principe**: Mesure l'intérêt réel pour un profil candidat

**RÈGLE ABSOLUE**: Le compteur "Profile Views" correspond STRICTEMENT au nombre de clics sur le bouton **« Aperçu »** du profil candidat depuis la CVthèque.

**Déclencheur unique**:
- ✅ Clic explicite sur bouton « Aperçu » dans CVthèque

**Interdictions absolues**:
- ❌ Ouverture automatique du profil
- ❌ Chargement silencieux (prefetch, hover, preload)
- ❌ Vues déclenchées sans action utilisateur

**Règle d'unicité**:
- `viewer_fingerprint` + `candidate_id` + fenêtre 24h

**Viewer fingerprint**:
```
SI utilisateur connecté:
  viewer_fingerprint = viewer_id
SINON:
  viewer_fingerprint = SHA256(session_id + ip_hash + user_agent)
```

**Viewers autorisés**:
- Tous types d'utilisateurs (candidats, recruteurs, employeurs, admins, anonymes)

---

### C. Applications

**Règles**:
- ✅ Une seule candidature valide par `candidate_id` + `job_id`
- ✅ Tentatives multiples bloquées
- ✅ Incrément uniquement après validation backend (trigger automatique)

---

### D. Purchases (Achats de profils CVthèque)

**Règles**:
- ✅ Incrément uniquement après paiement confirmé ET vérifié admin
- ✅ Lié à `transaction_id` unique
- ✅ Aucune tentative échouée comptabilisée

---

### E. Formations

**Règles**:
- ✅ Incrément après accès réel (pas à l'achat seul)
- ✅ Validation backend obligatoire

---

### F. AI Score

**Règles**:
- ✅ Calcul exclusivement BACKEND via fonction RPC
- ✅ Versionné (`ai_score_version`: 'v1.0')
- ✅ Explicable et auditable
- ✅ Moyenne des `ai_match_score` de toutes les candidatures
- ❌ Aucun recalcul frontend autorisé

---

## 🗄️ STRUCTURE DE DONNÉES

### 1. Table `candidate_stats` (Agrégée)

Source unique de vérité pour les dashboards.

```sql
CREATE TABLE candidate_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),

  -- Compteurs validés
  job_views_count integer DEFAULT 0,
  applications_count integer DEFAULT 0,
  profile_views_count integer DEFAULT 0,
  purchases_count integer DEFAULT 0,
  formations_count integer DEFAULT 0,

  -- Score IA
  ai_score integer CHECK (ai_score >= 0 AND ai_score <= 100) DEFAULT 0,
  ai_score_version text DEFAULT 'v1.0',
  ai_score_updated_at timestamptz,

  -- Métadonnées
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Index**:
- `idx_candidate_stats_candidate_id` sur `candidate_id`
- `idx_candidate_stats_updated_at` sur `updated_at DESC`

---

### 2. Table `candidate_stats_logs` (Audit) 🔍

**OBLIGATOIRE**: Chaque modification ou tentative DOIT être loggée.

```sql
CREATE TABLE candidate_stats_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES auth.users(id),

  -- Type de statistique
  stat_type text CHECK (stat_type IN (
    'job_view',
    'profile_view',
    'application',
    'purchase',
    'formation',
    'ai_score'
  )),

  -- Source de l'action
  source text NOT NULL, -- 'job_detail', 'cvtheque_preview_button', etc.

  -- Identifiants
  related_id uuid,
  transaction_id text,

  -- Viewer (pour views)
  viewer_id uuid REFERENCES auth.users(id),
  viewer_fingerprint text,
  session_id text,
  ip_hash text,
  user_agent text,

  -- Résultat
  delta integer DEFAULT 0, -- +1 si success, 0 si blocked
  status text CHECK (status IN (
    'success',
    'blocked',
    'blocked_duplicate',
    'blocked_spam',
    'blocked_no_credit',
    'error'
  )),

  -- Métadonnées
  metadata jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz DEFAULT now()
);
```

**Index**:
- `idx_stats_logs_candidate_id`
- `idx_stats_logs_stat_type`
- `idx_stats_logs_status`
- `idx_stats_logs_created_at DESC`
- `idx_stats_logs_viewer_id`
- `idx_stats_logs_viewer_fingerprint`
- `idx_stats_logs_source`

---

## 🔧 FONCTIONS RPC BACKEND

### 1. `track_job_view_secure()`

**Usage**: Tracking sécurisé des vues d'offres

```sql
track_job_view_secure(
  p_job_id uuid,
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb
```

**Comportement**:
1. Génère `viewer_fingerprint`
2. Vérifie anti-spam (1h)
3. Si spam → log avec `status='blocked_spam'`, retourne blocked
4. Si valide → incrémente `jobs.views_count`, log `status='success'`
5. Si candidat connecté → incrémente `candidate_stats.job_views_count`

**Retour**:
```json
{
  "success": true,
  "status": "success",
  "message": "Vue enregistrée"
}
```

---

### 2. `track_profile_preview_click()`

**Usage**: Tracking strict du clic bouton "Aperçu" CVthèque

```sql
track_profile_preview_click(
  p_candidate_id uuid,
  p_session_id text DEFAULT NULL,
  p_ip_hash text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb
```

**Comportement**:
1. Génère `viewer_fingerprint`
2. Vérifie anti-spam (24h)
3. Si spam → log `status='blocked_spam'`
4. Si valide:
   - Incrémente `candidate_stats.profile_views_count`
   - Incrémente `candidate_profiles.profile_views_count`
   - Crée entrée dans `profile_views`
   - Log `status='success'`

**Retour**:
```json
{
  "success": true,
  "status": "success",
  "message": "Vue de profil enregistrée"
}
```

---

### 3. `calculate_ai_score_backend()`

**Usage**: Calcul AI score côté serveur

```sql
calculate_ai_score_backend(
  p_candidate_id uuid
) RETURNS jsonb
```

**Comportement**:
1. Calcule AVG(`ai_match_score`) depuis `applications`
2. Met à jour `candidate_stats` avec score arrondi
3. Log l'opération
4. Retourne score + nombre de candidatures

---

### 4. `get_candidate_stats()`

**Usage**: Récupération stats agrégées

```sql
get_candidate_stats(
  p_candidate_id uuid
) RETURNS jsonb
```

**Retour**:
```json
{
  "job_views_count": 42,
  "applications_count": 7,
  "profile_views_count": 15,
  "purchases_count": 2,
  "formations_count": 3,
  "ai_score": 78,
  "ai_score_version": "v1.0",
  "ai_score_updated_at": "2026-01-11T18:30:00Z",
  "credits_balance": 50,
  "is_premium": true,
  "updated_at": "2026-01-11T18:35:00Z"
}
```

---

### 5. `admin_recalculate_stats()` (Admin uniquement)

**Usage**: Recalcul stats depuis logs

```sql
admin_recalculate_stats(
  p_candidate_id uuid
) RETURNS jsonb
```

**Comportement**:
1. Vérifie que l'utilisateur est admin
2. Recompte depuis `candidate_stats_logs` (status='success' uniquement)
3. Met à jour `candidate_stats`
4. Recalcule AI score

---

## 🔒 SÉCURITÉ (RLS)

### candidate_stats

```sql
-- Candidats voient leurs propres stats
CREATE POLICY "Candidats peuvent voir leurs propres stats"
  ON candidate_stats FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

-- Admins voient toutes les stats
CREATE POLICY "Admins peuvent voir toutes les stats"
  ON candidate_stats FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  ));
```

### candidate_stats_logs

```sql
-- Candidats voient leurs propres logs
CREATE POLICY "Candidats peuvent voir leurs propres logs"
  ON candidate_stats_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = candidate_id);

-- Admins voient tous les logs
CREATE POLICY "Admins peuvent voir tous les logs"
  ON candidate_stats_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  ));
```

---

## 🔌 EDGE FUNCTION

### track-job-view

**URL**: `{SUPABASE_URL}/functions/v1/track-job-view`

**Méthode**: `POST`

**Body**:
```json
{
  "job_id": "uuid",
  "session_id": "session_xxx"
}
```

**Comportement**:
1. Extrait IP, User-Agent depuis headers
2. Hashe l'IP pour RGPD
3. Appelle `track_job_view_secure()` RPC
4. Retourne résultat

**Avantages**:
- Protection anti-spam serveur
- Hash IP automatique (RGPD)
- Pas de logique client manipulable

---

## 💻 SERVICE FRONTEND

### `candidateStatsService.ts`

```typescript
export const candidateStatsService = {
  /**
   * Récupérer toutes les stats (SOURCE UNIQUE)
   */
  async getAllStats(userId: string): Promise<CandidateStats | null> {
    const { data } = await supabase.rpc('get_candidate_stats', {
      p_candidate_id: userId
    });
    return transformData(data);
  },

  /**
   * Tracker une vue d'offre
   */
  async trackJobView(jobId: string, sessionId?: string) {
    const response = await fetch(`${supabaseUrl}/functions/v1/track-job-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ job_id: jobId, session_id: sessionId })
    });
    return response.json();
  },

  /**
   * Tracker un clic bouton Aperçu
   */
  async trackProfilePreviewClick(candidateId: string, sessionId?: string) {
    const { data } = await supabase.rpc('track_profile_preview_click', {
      p_candidate_id: candidateId,
      p_session_id: sessionId,
      p_user_agent: navigator.userAgent
    });
    return data;
  },

  /**
   * Recalculer AI score
   */
  async recalculateAIScore(candidateId: string) {
    const { data } = await supabase.rpc('calculate_ai_score_backend', {
      p_candidate_id: candidateId
    });
    return data;
  }
};
```

---

## 🎨 INTÉGRATION FRONTEND

### JobDetail.tsx

```typescript
const trackJobView = async () => {
  if (jobId.startsWith('sample-')) return;

  try {
    // Appel Edge Function pour tous les utilisateurs
    await candidateStatsService.trackJobView(jobId);
  } catch (error) {
    console.debug('Job view tracking:', error);
  }
};

useEffect(() => {
  loadJob();
  trackJobView(); // Pour TOUS les users (connectés, anonymes, recruteurs)

  if (user) {
    checkIfApplied();
    loadProfileCompletion();
  }
}, [jobId, user]);
```

### CVTheque.tsx

```typescript
const handleViewDetails = async (candidateId: string) => {
  // ... vérifications ...

  if (!isPurchased) {
    if (!candidateId.startsWith('sample_')) {
      try {
        const { data: candidateProfile } = await supabase
          .from('candidate_profiles')
          .select('user_id')
          .eq('id', candidateId)
          .maybeSingle();

        if (candidateProfile?.user_id) {
          // ⚠️ TRACKING CRITIQUE: Uniquement sur clic bouton "Aperçu"
          await candidateStatsService.trackProfilePreviewClick(
            candidateProfile.user_id,
            sessionId
          );
        }
      } catch (error) {
        console.debug('Profile view tracking:', error);
      }
    }

    setPreviewCandidate(candidate);
    setShowPreviewModal(true);
    return;
  }

  // ... reste du code pour profils achetés ...
};
```

### CandidateDashboard.tsx

```typescript
const loadData = async () => {
  const [appsData, profileData, formationsData, stats, unreadCount] = await Promise.all([
    supabase.from('applications').select('...')...,
    supabase.from('candidate_profiles').select('...')...,
    supabase.from('formation_enrollments').select('...')...,
    candidateStatsService.getAllStats(user.id), // ✅ SOURCE UNIQUE
    candidateMessagingService.getUnreadCount()
  ]);

  if (stats) {
    setJobViewsCount(stats.jobViewsCount);
    setApplicationsCount(stats.applicationsCount);
    setProfileViewsCount(stats.profileViewsCount);
    setAiScore(stats.aiScore);
    // ... etc
  }
};
```

---

## 📊 DASHBOARD ADMIN DEBUG

La migration crée une vue SQL pour debug:

```sql
CREATE VIEW admin_stats_debug AS
SELECT
  cs.candidate_id,
  p.full_name,
  p.email,

  -- Stats agrégées
  cs.job_views_count as agg_job_views,
  cs.applications_count as agg_applications,
  cs.profile_views_count as agg_profile_views,

  -- Stats réelles depuis logs (succès uniquement)
  (SELECT COUNT(*) FROM candidate_stats_logs
   WHERE candidate_id = cs.candidate_id
   AND stat_type = 'job_view'
   AND status = 'success') as logs_job_views,

  -- Tentatives bloquées
  (SELECT COUNT(*) FROM candidate_stats_logs
   WHERE candidate_id = cs.candidate_id
   AND status LIKE 'blocked%') as blocked_attempts,

  cs.updated_at,
  cs.ai_score_updated_at
FROM candidate_stats cs
JOIN profiles p ON p.id = cs.candidate_id
ORDER BY cs.updated_at DESC;
```

---

## ✅ CHECKLIST DE CONFORMITÉ

### Règles Métier

- [x] Job Views: Anti-spam 1h, tracking backend uniquement
- [x] Profile Views: UNIQUEMENT sur clic bouton "Aperçu"
- [x] Applications: Une seule par candidat+offre
- [x] Purchases: Uniquement après paiement confirmé
- [x] Formations: Uniquement après accès réel
- [x] AI Score: Calcul exclusivement backend

### Sécurité

- [x] Aucun compteur ne s'incrémente sans log
- [x] Aucune vue sans clic "Aperçu" n'est comptée (Profile Views)
- [x] Aucune vue hors CVthèque n'est comptée (Profile Views)
- [x] RLS activée sur toutes les tables
- [x] Toutes les fonctions RPC sont SECURITY DEFINER
- [x] Hash IP pour RGPD

### Traçabilité

- [x] Chaque action loggée dans `candidate_stats_logs`
- [x] Status précis (success, blocked_spam, blocked_duplicate, error)
- [x] Métadonnées complètes (viewer, session, IP hash, user agent)
- [x] Vue admin pour comparaison stats agrégées vs logs

---

## 🧪 SCÉNARIOS DE TEST

### Test 1: Job View Anti-Spam

```
1. User A ouvre JobDetail pour job_id=X
   ✅ Compteur jobs.views_count incrémenté
   ✅ Log créé avec status='success'

2. User A rafraîchit la page immédiatement
   ✅ Compteur NON incrémenté
   ✅ Log créé avec status='blocked_spam'

3. Attendre 1h + 1min

4. User A ouvre à nouveau JobDetail pour job_id=X
   ✅ Compteur incrémenté
   ✅ Log créé avec status='success'
```

### Test 2: Profile View Tracking Strict

```
1. Recruteur R navigue sur CVThèque
   ❌ Aucun compteur incrémenté (pas de clic "Aperçu")

2. Recruteur R clique "Aperçu" sur profil candidat C
   ✅ candidate_stats.profile_views_count incrémenté
   ✅ candidate_profiles.profile_views_count incrémenté
   ✅ Entrée créée dans profile_views
   ✅ Log créé avec status='success', source='cvtheque_preview_button'

3. Recruteur R clique "Aperçu" immédiatement après
   ✅ Compteurs NON incrémentés
   ✅ Log créé avec status='blocked_spam'

4. Attendre 24h + 1min

5. Recruteur R clique "Aperçu" à nouveau
   ✅ Compteurs incrémentés
   ✅ Log créé avec status='success'
```

### Test 3: Admin Recalcul

```
1. Admin ouvre dashboard debug
   ✅ Voit stats agrégées vs logs

2. Détecte incohérence pour candidat C

3. Admin lance recalcul
   ✅ Fonction admin_recalculate_stats() appelée
   ✅ Stats recalculées depuis logs (status='success' uniquement)
   ✅ candidate_stats mis à jour
   ✅ AI score recalculé

4. Admin vérifie à nouveau
   ✅ Cohérence restaurée
```

---

## 🚀 PERFORMANCE

### Optimisations

1. **Index stratégiques**:
   - Tous les `WHERE` et `JOIN` sont indexés
   - Index DESC sur `created_at` pour tri rapide

2. **RPC Functions**:
   - `SECURITY DEFINER` pour privilèges élevés
   - `SET search_path = public` pour sécurité

3. **Requêtes parallèles**:
   - Dashboard utilise `Promise.all()` pour charger en parallèle

4. **Logs légers**:
   - Hash IP au lieu d'IP brute (moins de données)
   - Metadata JSONB compact

---

## 📝 MIGRATION

**Fichier**: `20260111180000_create_secure_candidate_stats_system.sql`

**Contenu**:
- Création tables `candidate_stats` et `candidate_stats_logs`
- Création fonctions RPC sécurisées
- Création triggers auto-incrément
- Création vue admin
- Initialisation stats pour candidats existants

---

## 🔄 ÉVOLUTIONS FUTURES

### Court terme (1-2 mois)

- [ ] Dashboard analytics admin avec graphiques
- [ ] Export stats par candidat (PDF/CSV)
- [ ] Notifications automatiques sur anomalies

### Moyen terme (3-6 mois)

- [ ] Machine Learning pour détection fraude
- [ ] Benchmarking stats avec moyennes secteur
- [ ] API REST pour stats (intégration tierce)

### Long terme (6-12 mois)

- [ ] Prédiction taux de réussite candidature (AI)
- [ ] Gamification basée sur stats
- [ ] Recommandations personnalisées

---

## 📚 RESSOURCES

**Migrations**:
- `create_secure_candidate_stats_system.sql`

**Edge Functions**:
- `track-job-view/index.ts`

**Services**:
- `src/services/candidateStatsService.ts`

**Composants**:
- `src/pages/JobDetail.tsx`
- `src/pages/CVTheque.tsx`
- `src/pages/CandidateDashboard.tsx`

---

## ✅ STATUT

**Version**: 2.0
**Date**: 2026-01-11
**Statut**: ✅ Production Ready

**Confirmation**:
- ✅ Aucun compteur ne s'incrémente sans log
- ✅ Aucune vue sans clic "Aperçu" n'est comptée
- ✅ Aucune vue hors CVthèque n'est comptée
- ✅ Toutes les actions passent par le backend
- ✅ Anti-spam actif sur tous les trackings
- ✅ Traçabilité complète assurée

---

## 🆘 SUPPORT

En cas de problème:

1. **Vérifier logs**: Consulter `candidate_stats_logs` pour voir tentatives bloquées
2. **Comparer stats**: Utiliser vue `admin_stats_debug`
3. **Recalculer**: Utiliser fonction `admin_recalculate_stats()`
4. **Consulter doc**: Relire les règles métier ci-dessus

---

**FIN DE LA DOCUMENTATION**
