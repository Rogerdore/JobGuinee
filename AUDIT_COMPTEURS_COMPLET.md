# AUDIT COMPLET DES COMPTEURS ET STATISTIQUES - JOBGUINÉE

**Date:** 13 Janvier 2026
**Auditeur:** Système automatisé
**Objectif:** Garantir que tous les compteurs affichés correspondent strictement à des données réelles enregistrées en base

---

## RÉSUMÉ EXÉCUTIF

### État Global: ⚠️ CORRECTIONS NÉCESSAIRES

L'architecture existante suit globalement un pattern **Backend-First** correct avec:
- ✅ Utilisation de RPC Supabase pour les statistiques
- ✅ Edge Functions pour le tracking avec anti-spam
- ✅ Pas de calculs localStorage détectés

**MAIS** présente **7 failles critiques** à corriger immédiatement.

---

## 1. INVENTAIRE COMPLET DES COMPTEURS

### 1.1 Compteurs Candidat (CandidateDashboard)

| Compteur | Nom Technique | Source | État |
|----------|--------------|--------|------|
| Offres vues | `job_views_count` | RPC `get_candidate_stats` | ✅ OK |
| Vues de profil | `profile_views_count` | RPC `get_candidate_stats` | ⚠️ Pas de check auto-vue |
| Profils achetés | `profile_purchases_count` | RPC `get_candidate_stats` | ✅ OK |
| Score IA | `ai_score` | RPC `get_candidate_stats` | ✅ OK |
| Solde crédits | `credits_balance` | RPC `get_candidate_stats` | ✅ OK |
| Messages non lus | `unread_messages_count` | Query locale | ✅ OK |

**Fichier:** `/src/pages/CandidateDashboard.tsx`
**Service:** `/src/services/candidateStatsService.ts` (ligne 35-69)

---

### 1.2 Compteurs Recruteur (RecruiterDashboard)

| Compteur | Nom Technique | Source | État |
|----------|--------------|--------|------|
| Total offres | `total_jobs` | RPC `get_recruiter_dashboard_metrics` | ✅ OK |
| Offres actives | `active_jobs` | RPC `get_recruiter_dashboard_metrics` | ✅ OK |
| Total candidatures | `total_applications` | RPC `get_recruiter_dashboard_metrics` | ⚠️ Pas incrémenté |
| Candidatures semaine | `this_week_applications` | RPC `get_recruiter_dashboard_metrics` | ⚠️ Pas incrémenté |
| Délai moyen embauche | `avg_time_to_hire_days` | RPC `get_recruiter_dashboard_metrics` | ✅ OK |
| Score matching moyen | `avg_matching_score` | RPC `get_recruiter_dashboard_metrics` | ✅ OK |
| Entretiens planifiés | `scheduled_interviews` | RPC `get_recruiter_dashboard_metrics` | ✅ OK |

**Fichier:** `/src/pages/RecruiterDashboard.tsx`
**Service:** `/src/services/recruiterDashboardService.ts` (ligne 38-106)

---

### 1.3 Compteurs Par Offre (JobDetail)

| Compteur | Nom Technique | Source | État |
|----------|--------------|--------|------|
| Vues offre | `views_count` | Table `jobs` + Edge Function tracking | ⚠️ Session ID manipulable |
| Candidatures offre | `applications_count` | Table `jobs` | ⚠️ Pas trigger auto |
| Commentaires | `comments_count` | Table `jobs` | ✅ OK (trigger existant) |
| Sauvegardes | `saves_count` | Table `jobs` | ✅ OK (trigger existant) |

**Fichier:** `/src/pages/JobDetail.tsx`
**Edge Function:** `/supabase/functions/track-job-view/index.ts`

---

### 1.4 Compteurs CVthèque (Profils)

| Compteur | Nom Technique | Source | État |
|----------|--------------|--------|------|
| Vues profil | `profile_views_count` | RPC `track_profile_preview_click` | ⚠️ Session ID manipulable |
| Achats profil | `profile_purchases_count` | Table `profile_purchases` | ✅ OK |
| Vues mois en cours | `this_month_views` | Non implémenté | ❌ MANQUANT |
| Achats mois en cours | `this_month_purchases` | Non implémenté | ❌ MANQUANT |

**Fichier:** `/src/components/cvtheque/CandidateProfileModal.tsx`
**Service:** `/src/services/profileViewsService.ts`

---

### 1.5 Compteurs Globaux (Page Jobs)

| Compteur | Nom Technique | Source | État |
|----------|--------------|--------|------|
| Offres publiées | `jobs` | Query `count: exact` | ✅ OK |
| Candidats inscrits | `candidates` | Query `count: exact` | ✅ OK |
| Entreprises | `companies` | Query `count: exact` | ✅ OK |

**Fichier:** `/src/pages/Jobs.tsx` (ligne 97-117)

---

## 2. FAILLES CRITIQUES IDENTIFIÉES

### 🔴 CRITIQUE #1: Session ID Manipulable

**Localisation:**
- `/src/services/candidateStatsService.ts:89`
- `/src/components/cvtheque/CandidateProfileModal.tsx:53`

**Code vulnérable:**
```typescript
// FRONTEND GÉNÈRE LE SESSION ID
const sessionId = `session_${Date.now()}_${Math.random().toString(36)}`;
```

**Exploitation:**
```javascript
// Un attaquant peut:
for (let i = 0; i < 100; i++) {
  const fakeSessionId = `session_${Date.now() + i}_${Math.random()}`;
  await trackJobView(jobId, fakeSessionId);
  // Contourne l'anti-spam de 1h/24h
}
```

**Impact:**
- ⚠️ Anti-spam contournable à volonté
- ⚠️ Gonflement artificiel des statistiques
- ⚠️ Impossible de tracer les vraies sessions

**Solution requise:**
- Générer session_id côté serveur uniquement
- Utiliser JWT + IP hash + User-Agent
- Bloquer si trop de sessions différentes du même client

---

### 🔴 CRITIQUE #2: Race Condition Double Candidature

**Localisation:**
- `/src/services/applicationSubmissionService.ts:219-262`

**Code vulnérable:**
```typescript
// CHECK existe
const existing = await this.checkExistingApplication(candidateId, jobId);
if (existing.exists) {
  return { success: false };
}

// TEMPS ÉCOULÉ = autre requête peut passer ici

// INSERT sans contrainte UNIQUE
const { data } = await supabase.from('applications').insert({...});
```

**Exploitation:**
- Double-clic rapide sur "Postuler"
- 2 onglets ouverts simultanément
- Network retry automatique

**Impact:**
- ❌ Création de doublons dans `applications`
- ❌ Notifications multiples au recruteur
- ❌ Stats faussées

**Solution requise:**
- Ajouter contrainte `UNIQUE(candidate_id, job_id)`
- Utiliser des transactions
- Implémenter un lock optimiste

---

### 🔴 CRITIQUE #3: Téléchargement CV Sans Tracking

**Localisation:**
- `/src/components/cvtheque/CandidateProfileModal.tsx:60-66`

**Code vulnérable:**
```typescript
const handleDownload = (url: string | undefined, filename: string) => {
  if (!url) return;
  window.open(url, '_blank');  // ❌ AUCUN TRACKING
};
```

**Impact:**
- ❌ Scraping massif des CVs possible
- ❌ Pas de logs de téléchargements
- ❌ Pas de vérification de paiement
- ❌ Impossible de détecter les abus

**Solution requise:**
- Edge Function `download-cv-tracker`
- URL signées temporaires
- Rate limiting par recruteur
- Watermarking des PDFs

---

### 🟠 HAUTE #4: Pas de Vérification Auto-Vue

**Localisation:**
- `/supabase/migrations/20260111183415_create_secure_candidate_stats_system.sql:373-546`

**Code manquant:**
```sql
-- DEVRAIT VÉRIFIER:
IF v_viewer_id = p_candidate_id THEN
  RETURN jsonb_build_object('success', false, 'message', 'Vous ne pouvez pas voir votre propre profil');
END IF;
```

**Impact:**
- ⚠️ Un candidat peut gonfler ses propres stats
- ⚠️ Fausse perception de popularité

**Solution requise:**
- Ajouter check `viewer_id != candidate_id`
- Bloquer silencieusement

---

### 🟠 HAUTE #5: Compteur Applications Non Incrémenté

**Localisation:**
- `/src/services/applicationSubmissionService.ts` (fonction absente)

**Code manquant:**
```typescript
// DEVRAIT APPELER:
await supabase.rpc('track_application_validated', {
  p_candidate_id: candidateId,
  p_job_id: jobId
});
```

**Impact:**
- ❌ `applications_count` dans `jobs` non mis à jour
- ❌ Dashboard recruteur affiche zéro candidatures
- ❌ candidate_stats.applications_count pas incrémenté

**Solution requise:**
- Trigger automatique sur INSERT `applications`
- OU appel RPC explicite
- Log dans `candidate_stats_logs`

---

### 🟡 MOYENNE #6: Fenêtre Anti-Spam Trop Courte

**Localisation:**
- `/supabase/migrations/...sql` (ligne 270)

**Code actuel:**
```sql
-- Anti-spam 1h pour job views
WHERE created_at > (now() - interval '1 hour')

-- Anti-spam 24h pour profile views
WHERE created_at > (now() - interval '24 hours')
```

**Impact:**
- ⚠️ UX dégradée (utilisateur légitime bloqué)
- ⚠️ 1h est trop court pour une vraie session
- ⚠️ Force refresh page = nouvelle vue

**Solution suggérée:**
- Job views: 6h minimum
- Profile views: OK 24h
- Stocker durée configurable en DB

---

### 🟡 MOYENNE #7: Refresh Modal = Re-tracking

**Localisation:**
- `/src/components/cvtheque/CandidateProfileModal.tsx:50-56`

**Code problématique:**
```typescript
useEffect(() => {
  if (isOpen && candidate.id) {
    // S'EXÉCUTE À CHAQUE RE-RENDER
    profileViewsService.recordProfileView(candidate.id, sessionId);
  }
}, [isOpen, candidate.id]);
```

**Impact:**
- ⚠️ Fermeture/Ouverture = double comptage
- ⚠️ Props change = nouveau tracking

**Solution requise:**
- useRef pour éviter re-exécution
- Flag localStorage pour session

---

## 3. ARCHITECTURE CIBLE

### 3.1 Tables de Base

```
✅ EXISTANT:
- candidate_stats (stats agrégées par candidat)
- candidate_stats_logs (tous les événements)
- jobs (avec compteurs views_count, applications_count)
- applications (candidatures)
- profile_purchases (achats CVthèque)
- profile_views (logs de vues)

❌ MANQUANT:
- recruiter_stats (stats agrégées par recruteur)
- recruiter_stats_logs (événements recruteur)
- cv_download_logs (logs téléchargements)
- session_tokens (sessions serveur sécurisées)
```

### 3.2 Fonctions RPC

```
✅ EXISTANT:
- get_candidate_stats(p_user_id)
- get_recruiter_dashboard_metrics(p_company_id)
- track_job_view_secure(p_job_id, p_session_id, ...)
- track_profile_preview_click(p_candidate_id, ...)
- increment_profile_views(p_candidate_id, ...)

⚠️ EXISTANT MAIS NON APPELÉ:
- track_application_validated(p_candidate_id, p_job_id, ...)

❌ MANQUANT:
- track_cv_download(p_candidate_id, p_recruiter_id, ...)
- generate_secure_session_token(p_user_id, p_ip_hash, ...)
- validate_session_token(p_token)
```

### 3.3 Edge Functions

```
✅ EXISTANT:
- track-job-view (anti-spam 1h)

❌ MANQUANT:
- download-cv-tracker (tracking + watermarking)
- profile-view-tracker (centraliser le tracking)
- session-manager (génération tokens sécurisés)
```

### 3.4 Triggers

```
✅ EXISTANT:
- update_job_comments_count (sur job_comments INSERT/DELETE)
- update_job_saves_count (sur saved_jobs INSERT/DELETE)
- increment_profile_views_on_purchase

❌ MANQUANT:
- update_job_applications_count (sur applications INSERT)
- update_candidate_applications_count (sur applications INSERT)
- log_all_stats_changes (audit trail)
```

---

## 4. FLUX CORRECTS PAR TYPE DE COMPTEUR

### 4.1 Vue d'Offre (Job View)

```
Frontend (JobDetail)
  ↓
candidateStatsService.trackJobView(jobId)
  ↓
Edge Function: /functions/v1/track-job-view
  ↓ (Génère session_id serveur + IP hash)
  ↓
RPC: track_job_view_secure(job_id, server_session_id, ip_hash, user_agent)
  ↓ (Vérifie anti-spam 6h)
  ↓
UPDATE jobs SET views_count = views_count + 1
  +
INSERT INTO candidate_stats_logs (stat_type='job_view', status='success')
  +
UPDATE candidate_stats SET job_views_count = job_views_count + 1 (si connecté)
  ↓
RETURN success
```

### 4.2 Vue de Profil (Profile View)

```
Frontend (CandidateProfileModal)
  ↓
profileViewsService.recordProfileView(candidateId)
  ↓
Edge Function: /functions/v1/profile-view-tracker (NOUVEAU)
  ↓ (Génère session_id serveur + vérifications)
  ↓
RPC: track_profile_preview_click(candidate_id, viewer_id, server_session_id)
  ↓ (Vérifie: viewer_id != candidate_id)
  ↓ (Vérifie: anti-spam 24h)
  ↓ (Vérifie: recruteur a acheté le profil)
  ↓
UPDATE candidate_profiles SET profile_views_count = profile_views_count + 1
  +
INSERT INTO candidate_stats_logs (stat_type='profile_view', status='success')
  +
UPDATE candidate_stats SET profile_views_count = profile_views_count + 1
  ↓
RETURN success
```

### 4.3 Candidature (Application)

```
Frontend (JobApplicationModal)
  ↓
applicationSubmissionService.submitApplication(data)
  ↓
RPC: submit_application_secure(candidate_id, job_id, ...) (NOUVEAU)
  ↓ (Transaction BEGIN)
  ↓ (Vérifie UNIQUE avec FOR UPDATE)
  ↓
INSERT INTO applications (candidate_id, job_id, ...)
  RETURNING id
  ↓ (TRIGGER AUTOMATIQUE déclenché)
  ↓
Trigger: update_job_applications_count()
  → UPDATE jobs SET applications_count = applications_count + 1
  ↓
Trigger: update_candidate_applications_count()
  → UPDATE candidate_stats SET applications_count = applications_count + 1
  ↓
INSERT INTO candidate_stats_logs (stat_type='application', status='success')
  ↓
INSERT INTO notifications (type='new_application', recruiter_id=...)
  ↓
(Transaction COMMIT)
  ↓
RETURN application_id
```

### 4.4 Téléchargement CV (Download CV)

```
Frontend (CandidateProfileModal)
  ↓
cvDownloadService.requestDownload(candidateId) (NOUVEAU)
  ↓
Edge Function: /functions/v1/download-cv-tracker (NOUVEAU)
  ↓ (Vérifie: utilisateur = recruteur)
  ↓ (Vérifie: profil acheté)
  ↓ (Rate limiting: max 50 downloads/jour)
  ↓
RPC: track_cv_download(candidate_id, recruiter_id, ...)
  ↓
INSERT INTO cv_download_logs (candidate_id, recruiter_id, downloaded_at)
  +
UPDATE candidate_stats SET cv_downloads_count = cv_downloads_count + 1
  +
UPDATE recruiter_stats SET cvs_downloaded_count = cvs_downloaded_count + 1
  ↓
GENERATE signed_url avec expiration 10 minutes
  ↓
RETURN { url: signed_url, expires_at: ... }
  ↓
Frontend télécharge depuis signed_url
```

---

## 5. MIGRATIONS REQUISES

### Migration #1: Contraintes et Indexes

```sql
-- UNIQUE constraint pour éviter doublons
ALTER TABLE applications
ADD CONSTRAINT applications_candidate_job_unique
UNIQUE (candidate_id, job_id);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_applications_job_id_status
ON applications(job_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_candidate_id_created
ON applications(candidate_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_stats_logs_fingerprint
ON candidate_stats_logs(viewer_fingerprint, created_at DESC);
```

### Migration #2: Tables Manquantes

```sql
-- Table pour sessions sécurisées
CREATE TABLE session_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  token text UNIQUE NOT NULL,
  ip_hash text,
  user_agent text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Table pour logs téléchargements CV
CREATE TABLE cv_download_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES candidate_profiles(user_id),
  recruiter_id uuid NOT NULL REFERENCES recruiter_profiles(user_id),
  cv_url text NOT NULL,
  ip_hash text,
  downloaded_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

-- Table stats recruteurs
CREATE TABLE recruiter_stats (
  recruiter_id uuid PRIMARY KEY REFERENCES recruiter_profiles(user_id),
  jobs_posted_count int DEFAULT 0,
  applications_received_count int DEFAULT 0,
  cvs_downloaded_count int DEFAULT 0,
  profiles_purchased_count int DEFAULT 0,
  interviews_scheduled_count int DEFAULT 0,
  hires_count int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
```

### Migration #3: Triggers Automatiques

```sql
-- Trigger pour incrémenter applications_count dans jobs
CREATE OR REPLACE FUNCTION update_job_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE jobs
  SET applications_count = COALESCE(applications_count, 0) + 1
  WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_applications_count
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION update_job_applications_count();

-- Trigger pour incrémenter candidate_stats.applications_count
CREATE OR REPLACE FUNCTION update_candidate_applications_count()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO candidate_stats (candidate_id, applications_count, updated_at)
  VALUES (NEW.candidate_id, 1, now())
  ON CONFLICT (candidate_id) DO UPDATE
  SET applications_count = candidate_stats.applications_count + 1,
      updated_at = now();

  -- Log l'événement
  INSERT INTO candidate_stats_logs (
    candidate_id, stat_type, source, related_id, status, created_at
  ) VALUES (
    NEW.candidate_id, 'application', 'applications_trigger', NEW.job_id, 'success', now()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_candidate_applications_count
AFTER INSERT ON applications
FOR EACH ROW
EXECUTE FUNCTION update_candidate_applications_count();
```

### Migration #4: RPC Sécurisées

```sql
-- RPC pour générer un token de session sécurisé
CREATE OR REPLACE FUNCTION generate_secure_session_token(
  p_ip_hash text,
  p_user_agent text
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id uuid;
  v_token text;
  v_expires_at timestamptz;
BEGIN
  v_user_id := auth.uid();
  v_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := now() + interval '24 hours';

  INSERT INTO session_tokens (user_id, token, ip_hash, user_agent, expires_at)
  VALUES (v_user_id, v_token, p_ip_hash, p_user_agent, v_expires_at);

  RETURN jsonb_build_object(
    'token', v_token,
    'expires_at', v_expires_at
  );
END;
$$;

-- RPC pour tracker un téléchargement CV
CREATE OR REPLACE FUNCTION track_cv_download(
  p_candidate_id uuid,
  p_recruiter_id uuid,
  p_cv_url text,
  p_ip_hash text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_download_count int;
BEGIN
  -- Vérifier que le recruteur a acheté le profil
  IF NOT EXISTS (
    SELECT 1 FROM profile_purchases
    WHERE candidate_id = p_candidate_id
      AND recruiter_id = p_recruiter_id
      AND status = 'completed'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Profil non acheté'
    );
  END IF;

  -- Rate limiting: max 50 downloads/jour
  SELECT COUNT(*) INTO v_download_count
  FROM cv_download_logs
  WHERE recruiter_id = p_recruiter_id
    AND downloaded_at > (now() - interval '24 hours');

  IF v_download_count >= 50 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Limite de téléchargements atteinte'
    );
  END IF;

  -- Log le téléchargement
  INSERT INTO cv_download_logs (candidate_id, recruiter_id, cv_url, ip_hash)
  VALUES (p_candidate_id, p_recruiter_id, p_cv_url, p_ip_hash);

  -- Incrémenter les stats
  INSERT INTO candidate_stats (candidate_id, cv_downloads_count, updated_at)
  VALUES (p_candidate_id, 1, now())
  ON CONFLICT (candidate_id) DO UPDATE
  SET cv_downloads_count = candidate_stats.cv_downloads_count + 1,
      updated_at = now();

  INSERT INTO recruiter_stats (recruiter_id, cvs_downloaded_count, updated_at)
  VALUES (p_recruiter_id, 1, now())
  ON CONFLICT (recruiter_id) DO UPDATE
  SET cvs_downloaded_count = recruiter_stats.cvs_downloaded_count + 1,
      updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;
```

---

## 6. EDGE FUNCTIONS REQUISES

### Edge Function: download-cv-tracker

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { candidate_id, cv_url } = await req.json();
    const authHeader = req.headers.get('Authorization');

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') ?? ''
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hasher l'IP
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    const encoder = new TextEncoder();
    const ipData = encoder.encode(clientIp);
    const hashBuffer = await crypto.subtle.digest('SHA-256', ipData);
    const ipHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Appeler RPC de tracking
    const { data, error } = await supabase.rpc('track_cv_download', {
      p_candidate_id: candidate_id,
      p_recruiter_id: user.id,
      p_cv_url: cv_url,
      p_ip_hash: ipHash
    });

    if (error || !data?.success) {
      return new Response(
        JSON.stringify({ error: data?.error || error?.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Générer URL signée temporaire (10 minutes)
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('candidate-documents')
      .createSignedUrl(cv_url, 600); // 10 minutes

    if (signedError) {
      return new Response(
        JSON.stringify({ error: 'Erreur génération URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        signed_url: signedUrlData.signedUrl,
        expires_at: new Date(Date.now() + 600000).toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 7. REFACTORING FRONTEND

### 7.1 Service: cvDownloadService.ts (NOUVEAU)

```typescript
import { supabase } from '../lib/supabase';

export const cvDownloadService = {
  async requestDownload(candidateId: string, cvUrl: string): Promise<{
    success: boolean;
    signedUrl?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return { success: false, error: 'Non authentifié' };
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/download-cv-tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          candidate_id: candidateId,
          cv_url: cvUrl
        })
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        signedUrl: result.signed_url,
        expiresAt: result.expires_at
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};
```

### 7.2 Correction: CandidateProfileModal.tsx

```typescript
// AVANT (VULNÉRABLE):
const handleDownload = (url: string | undefined, filename: string) => {
  if (!url) return;
  window.open(url, '_blank');  // ❌ Pas de tracking
};

// APRÈS (SÉCURISÉ):
const handleDownload = async (url: string | undefined, filename: string) => {
  if (!url) {
    alert('Document non disponible');
    return;
  }

  setDownloading(true);
  try {
    const result = await cvDownloadService.requestDownload(candidate.id, url);

    if (!result.success) {
      alert(result.error || 'Erreur lors du téléchargement');
      return;
    }

    // Ouvrir l'URL signée temporaire
    window.open(result.signedUrl, '_blank');
  } catch (error: any) {
    console.error('Download error:', error);
    alert('Erreur lors du téléchargement');
  } finally {
    setDownloading(false);
  }
};
```

### 7.3 Correction: candidateStatsService.ts (Session ID)

```typescript
// AVANT (VULNÉRABLE):
async trackJobView(jobId: string, sessionId?: string) {
  const response = await fetch(`${supabaseUrl}/functions/v1/track-job-view`, {
    body: JSON.stringify({
      job_id: jobId,
      session_id: sessionId || `session_${Date.now()}_${Math.random()}`  // ❌
    })
  });
}

// APRÈS (SÉCURISÉ):
async trackJobView(jobId: string) {
  // Ne plus envoyer de session_id depuis le frontend
  // L'Edge Function le générera côté serveur
  const response = await fetch(`${supabaseUrl}/functions/v1/track-job-view`, {
    body: JSON.stringify({
      job_id: jobId
      // Pas de session_id = Edge Function le génère
    })
  });
}
```

### 7.4 Correction: track-job-view Edge Function

```typescript
// Générer session_id côté serveur
const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
const userAgent = req.headers.get('user-agent') || 'unknown';
const timestamp = Date.now();

// Hash unique basé sur IP + User-Agent + User ID
const sessionData = `${clientIp}-${userAgent}-${user?.id || 'anonymous'}-${timestamp}`;
const encoder = new TextEncoder();
const data = encoder.encode(sessionData);
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const sessionId = Array.from(new Uint8Array(hashBuffer))
  .map(b => b.toString(16).padStart(2, '0'))
  .join('');

// Utiliser ce sessionId serveur
const { data, error } = await supabase.rpc('track_job_view_secure', {
  p_job_id: job_id,
  p_session_id: sessionId,  // ✅ Généré côté serveur
  p_ip_hash: ipHash,
  p_user_agent: userAgent
});
```

---

## 8. VALIDATION ET TESTS

### 8.1 Script de Validation SQL

```sql
-- Vérifier que tous les compteurs sont cohérents
SELECT
  'jobs.views_count' as compteur,
  SUM(views_count) as total_compteur,
  (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND status = 'success') as total_logs,
  CASE
    WHEN SUM(views_count) = (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'job_view' AND status = 'success')
    THEN '✅ OK'
    ELSE '❌ DÉSYNCHRONISÉ'
  END as etat
FROM jobs

UNION ALL

SELECT
  'jobs.applications_count' as compteur,
  SUM(applications_count) as total_compteur,
  (SELECT COUNT(*) FROM applications) as total_logs,
  CASE
    WHEN SUM(applications_count) = (SELECT COUNT(*) FROM applications)
    THEN '✅ OK'
    ELSE '❌ DÉSYNCHRONISÉ'
  END as etat
FROM jobs

UNION ALL

SELECT
  'candidate_profiles.profile_views_count' as compteur,
  SUM(profile_views_count) as total_compteur,
  (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'profile_view' AND status = 'success') as total_logs,
  CASE
    WHEN SUM(profile_views_count) = (SELECT COUNT(*) FROM candidate_stats_logs WHERE stat_type = 'profile_view' AND status = 'success')
    THEN '✅ OK'
    ELSE '❌ DÉSYNCHRONISÉ'
  END as etat
FROM candidate_profiles;
```

### 8.2 Tests Automatiques

```typescript
// tests/counters.test.ts
describe('Compteurs et Statistiques', () => {

  test('Job view: Ne compte qu\'une seule vue par session', async () => {
    const jobId = 'test-job-id';

    // Premier tracking
    const result1 = await trackJobView(jobId);
    expect(result1.success).toBe(true);

    // Deuxième tracking immédiat (même session)
    const result2 = await trackJobView(jobId);
    expect(result2.success).toBe(false);
    expect(result2.status).toBe('blocked_spam');
  });

  test('Application: Empêche les doublons', async () => {
    const data = { candidateId: 'test-candidate', jobId: 'test-job', ... };

    // Première candidature
    const result1 = await submitApplication(data);
    expect(result1.success).toBe(true);

    // Deuxième candidature (doublon)
    const result2 = await submitApplication(data);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('déjà postulé');
  });

  test('CV Download: Vérifie l\'achat avant téléchargement', async () => {
    const candidateId = 'unpurchased-candidate';

    const result = await requestDownload(candidateId, 'cv.pdf');
    expect(result.success).toBe(false);
    expect(result.error).toContain('non acheté');
  });

  test('Profile view: Bloque l\'auto-vue', async () => {
    const candidateId = 'self-viewer-id';

    // Simuler que le viewer est le candidat lui-même
    const result = await recordProfileView(candidateId);
    expect(result.success).toBe(false);
    expect(result.message).toContain('propre profil');
  });
});
```

---

## 9. CHECKLIST POST-DÉPLOIEMENT

### Phase 1: Migrations (30 min)

- [ ] Appliquer migration contraintes UNIQUE
- [ ] Appliquer migration tables manquantes
- [ ] Appliquer migration triggers automatiques
- [ ] Appliquer migration RPC sécurisées
- [ ] Vérifier que toutes les migrations sont réussies

### Phase 2: Edge Functions (20 min)

- [ ] Déployer download-cv-tracker
- [ ] Mettre à jour track-job-view (session ID serveur)
- [ ] Tester chaque Edge Function individuellement
- [ ] Vérifier les CORS headers

### Phase 3: Frontend (40 min)

- [ ] Créer cvDownloadService.ts
- [ ] Corriger CandidateProfileModal.tsx (download)
- [ ] Corriger candidateStatsService.ts (session ID)
- [ ] Corriger profileViewsService.ts (auto-vue)
- [ ] Corriger applicationSubmissionService.ts (trigger)
- [ ] Build et test en local

### Phase 4: Tests (30 min)

- [ ] Exécuter script de validation SQL
- [ ] Tester job view anti-spam
- [ ] Tester profile view anti-auto-vue
- [ ] Tester application doublon prevention
- [ ] Tester CV download tracking
- [ ] Vérifier tous les compteurs dans les dashboards

### Phase 5: Monitoring (15 min)

- [ ] Activer logs pour toutes les Edge Functions
- [ ] Créer alertes pour désynchronisations
- [ ] Documenter les nouveaux endpoints
- [ ] Former l'équipe sur les changements

**DURÉE TOTALE ESTIMÉE: 2h15**

---

## 10. TABLEAU DE COMPARAISON AVANT/APRÈS

| Aspect | AVANT (Audit) | APRÈS (Corrections) |
|--------|---------------|---------------------|
| **Session ID** | ❌ Généré frontend, manipulable | ✅ Généré serveur, sécurisé |
| **Double candidature** | ❌ Possible (race condition) | ✅ Bloquée (UNIQUE constraint) |
| **Tracking download CV** | ❌ Inexistant | ✅ Edge Function + logs |
| **Auto-vue profil** | ❌ Possible | ✅ Bloquée backend |
| **Compteur applications** | ❌ Manuel, oublié | ✅ Trigger automatique |
| **Transactions** | ❌ Absentes | ✅ Implémentées |
| **Logs centralisés** | ⚠️ Partiels | ✅ Complets (candidate_stats_logs) |
| **Anti-spam fenêtre** | ⚠️ 1h trop court | ✅ 6h configurable |
| **URLs storage** | ❌ Publiques permanentes | ✅ Signées temporaires (10min) |
| **Rate limiting** | ❌ Absent | ✅ 50 downloads/jour |

---

## 11. MÉTRIQUES DE SUCCÈS

### Indicateurs à Surveiller Post-Déploiement

1. **Taux de blocage anti-spam**: < 5% des vues légitimes
2. **Erreurs doublons candidatures**: 0 en production
3. **Désynchronisation compteurs**: 0% (validation SQL quotidienne)
4. **Temps de réponse Edge Functions**: < 200ms
5. **Logs manquants**: 0 événement non logué

### Alertes à Configurer

- ⚠️ Désynchronisation compteur > 1%
- ⚠️ Taux d'erreur Edge Functions > 5%
- ⚠️ Tentatives de manipulation session_id détectées
- ⚠️ Rate limiting déclenché > 10 fois/jour

---

## 12. CONCLUSION

### État Actuel
L'architecture existante est **globalement correcte** avec un pattern Backend-First, mais présente **7 failles critiques** qui permettent:
- Manipulation des statistiques
- Création de doublons
- Scraping non tracé
- Compteurs désynchronisés

### Corrections Requises
Les corrections proposées garantissent:
- ✅ **Traçabilité**: Tous les événements loggués
- ✅ **Fiabilité**: Compteurs toujours synchronisés
- ✅ **Sécurité**: Session ID serveur, contraintes UNIQUE
- ✅ **Conformité**: Rate limiting, URLs signées
- ✅ **Auditabilité**: candidate_stats_logs complet

### Prochaines Étapes
1. Appliquer les migrations (Phase 1)
2. Déployer les Edge Functions (Phase 2)
3. Refactoriser le frontend (Phase 3)
4. Valider avec tests (Phase 4)
5. Monitorer en production (Phase 5)

**AUCUNE DONNÉE NE SERA SUPPRIMÉE**
**AUCUNE FONCTIONNALITÉ NE SERA CASSÉE**
**AMÉLIORATION PROGRESSIVE ET SÉCURISÉE**

---

**Fin du Rapport d'Audit**
**Document généré le:** 13 Janvier 2026
**Version:** 1.0
