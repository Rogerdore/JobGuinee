# 📋 PLAN DE COMPLÉTION - SYSTÈME DE PARTAGE SOCIAL

**Date:** 09 Janvier 2026
**Basé sur:** Audit complet du système existant
**Principe:** COMPLÉTER uniquement - ZÉRO duplication

---

## 🎯 RÉSUMÉ DE L'AUDIT

### ✅ CE QUI EXISTE DÉJÀ (60% COMPLET)

**Infrastructure Frontend Complète:**
- ✅ `ShareJobModal.tsx` - Modal de partage 4 plateformes
- ✅ `SocialSharePreview.tsx` - Aperçu visuel aligné réseaux
- ✅ `socialShareService.ts` - Service complet avec cascade d'images
- ✅ `useSocialShareMeta.ts` - Hook injection meta tags dynamiques
- ✅ `useJobMetaTags.ts` - Hook spécialisé offres
- ✅ Meta tags Open Graph + Twitter Cards complets
- ✅ Cascade d'images intelligente (spécifique → featured → company logo → JobGuinée logo)

**Base de Données:**
- ✅ Table `social_share_analytics` avec tracking
- ✅ Fonctions SQL: `get_job_share_stats()`, `get_most_shared_jobs()`
- ✅ Trigger auto-incrémente `jobs.shares_count`
- ✅ RLS configuré correctement
- ✅ Champ `jobs.auto_share` (boolean)

**Assets:**
- ✅ Structure `/public/assets/share/jobs/` créée
- ✅ Logo JobGuinée comme fallback universel
- ✅ Documentation complète dans README.md

### ❌ CE QUI MANQUE (40% À COMPLÉTER)

**🔴 CRITIQUE (Automatisation):**
1. Edge Function de génération d'images (Canvas 1200×630)
2. Edge Function de partage automatique
3. Trigger PostgreSQL activant l'automatisation
4. Table `social_platforms_config` pour credentials API

**🟠 IMPORTANT (Configuration & Analytics):**
5. Page Admin de configuration sociale
6. Dashboard Admin analytics de partage
7. Champ `share_type` (manual/auto) dans analytics
8. Templates de posts personnalisables

**🟡 SECONDAIRE (Améliorations):**
9. Scheduling de partages différés
10. Webhooks de retour des plateformes

---

## 🚀 PLAN D'IMPLÉMENTATION (PHASE PAR PHASE)

### PHASE 1️⃣ : BASE DONNÉES & CONFIGURATION

#### 1.1 Table Configuration Plateformes Sociales

**Fichier:** `supabase/migrations/[timestamp]_create_social_platforms_config.sql`

```sql
CREATE TABLE IF NOT EXISTS social_platforms_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('facebook', 'linkedin', 'twitter', 'whatsapp')),
  is_enabled boolean DEFAULT false,
  credentials jsonb DEFAULT '{}'::jsonb,
  post_template text DEFAULT '',
  auto_share_enabled boolean DEFAULT false,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(platform)
);

ALTER TABLE social_platforms_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON social_platforms_config
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  ));

CREATE POLICY "Public read enabled platforms" ON social_platforms_config
  FOR SELECT TO authenticated
  USING (is_enabled = true);

INSERT INTO social_platforms_config (platform, is_enabled, post_template) VALUES
('facebook', false, '🎯 {title}\n📍 {location}\n💼 {contract_type}\n\nPostulez: {url}\n\n#JobGuinée #EmploiGuinée'),
('linkedin', false, '🎯 Nouvelle opportunité: {title}\n📍 Localisation: {location}\n💼 Type: {contract_type}\n\nEn savoir plus: {url}\n\n#JobGuinée #Recrutement #Guinée'),
('twitter', false, '🎯 {title} - {location}\n💼 {contract_type}\n\n{url}\n\n#JobGuinée #EmploiGuinée'),
('whatsapp', false, '🎯 *{title}*\n📍 {location}\n💼 {contract_type}\n\n{url}');
```

#### 1.2 Extension Table Analytics

**Fichier:** `supabase/migrations/[timestamp]_add_share_type_to_analytics.sql`

```sql
ALTER TABLE social_share_analytics
ADD COLUMN IF NOT EXISTS share_type text DEFAULT 'manual' CHECK (share_type IN ('manual', 'auto', 'scheduled'));

ALTER TABLE social_share_analytics
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_share_analytics_share_type
ON social_share_analytics(share_type);

CREATE OR REPLACE FUNCTION get_share_stats_by_type(p_job_id uuid DEFAULT NULL)
RETURNS TABLE (
  share_type text,
  platform text,
  count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.share_type,
    s.platform,
    COUNT(*)::bigint
  FROM social_share_analytics s
  WHERE (p_job_id IS NULL OR s.job_id = p_job_id)
  GROUP BY s.share_type, s.platform
  ORDER BY s.share_type, COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 1.3 Table Templates de Posts

**Fichier:** `supabase/migrations/[timestamp]_create_social_post_templates.sql`

```sql
CREATE TABLE IF NOT EXISTS social_post_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('facebook', 'linkedin', 'twitter', 'whatsapp')),
  template text NOT NULL,
  is_default boolean DEFAULT false,
  variables jsonb DEFAULT '["title", "location", "contract_type", "url"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE social_post_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access templates" ON social_post_templates
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.user_type = 'admin'
  ));

CREATE POLICY "Public read templates" ON social_post_templates
  FOR SELECT TO authenticated
  USING (true);
```

---

### PHASE 2️⃣ : EDGE FUNCTIONS

#### 2.1 Génération d'Images de Partage

**Fichier:** `supabase/functions/generate-job-share-image/index.ts`

**Fonctionnalités:**
- Génère image 1200×630px avec Canvas
- Background dégradé bleu JobGuinée (#0E2F56 → #1E4976)
- Logo JobGuinée en haut
- Titre offre (gros, centré, max 2 lignes)
- Nom entreprise + localisation
- Badge type de contrat
- CTA "Postuler sur JobGuinée"
- Sauvegarde dans Storage Supabase `/share-images/jobs/`

**API:**
```typescript
POST /functions/v1/generate-job-share-image
Body: { job_id: string }
Response: { image_url: string, success: boolean }
```

#### 2.2 Automatisation du Partage

**Fichier:** `supabase/functions/auto-share-job/index.ts`

**Fonctionnalités:**
- Récupère config depuis `social_platforms_config`
- Génère l'image si elle n'existe pas (appelle fonction 2.1)
- Remplit les templates avec données de l'offre
- Appelle APIs sociales (si credentials configurés)
- Journalise dans `social_share_analytics` avec `share_type = 'auto'`

**API:**
```typescript
POST /functions/v1/auto-share-job
Body: { job_id: string, platforms?: string[] }
Response: {
  success: boolean,
  shared_on: string[],
  errors: object[]
}
```

**Intégrations API Sociales:**
- **Facebook:** `POST /v18.0/{page_id}/feed` (nécessite Page Access Token)
- **LinkedIn:** `POST /v2/ugcPosts` (nécessite OAuth2 Access Token)
- **Twitter/X:** `POST /2/tweets` (nécessite Bearer Token)
- **WhatsApp:** Pas d'API publique (génère lien uniquement)

---

### PHASE 3️⃣ : TRIGGERS & AUTOMATISATION

#### 3.1 Trigger PostgreSQL

**Fichier:** `supabase/migrations/[timestamp]_create_auto_share_trigger.sql`

```sql
CREATE OR REPLACE FUNCTION trigger_auto_share_job()
RETURNS TRIGGER AS $$
DECLARE
  v_platforms_config jsonb;
BEGIN
  IF NEW.auto_share = true
     AND NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR OLD.status != 'published') THEN

    SELECT jsonb_agg(platform) INTO v_platforms_config
    FROM social_platforms_config
    WHERE is_enabled = true AND auto_share_enabled = true;

    IF v_platforms_config IS NOT NULL AND jsonb_array_length(v_platforms_config) > 0 THEN
      PERFORM net.http_post(
        url := current_setting('app.supabase_url') || '/functions/v1/auto-share-job',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key')
        ),
        body := jsonb_build_object(
          'job_id', NEW.id,
          'platforms', v_platforms_config
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_share_job_on_publish
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION trigger_auto_share_job();
```

**Note:** Nécessite l'extension `pg_net` activée:
```sql
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

---

### PHASE 4️⃣ : INTERFACES ADMIN

#### 4.1 Page Configuration Sociale

**Fichier:** `src/pages/AdminSocialShareConfig.tsx`

**Sections:**
1. **Activation des Plateformes**
   - Toggle ON/OFF par plateforme
   - Activation du partage automatique
   - Statut de connexion (credentials valides/invalides)

2. **Configuration Credentials**
   - Formulaires sécurisés pour:
     - Facebook: Page ID, App ID, App Secret, Access Token
     - LinkedIn: Client ID, Client Secret, Access Token
     - Twitter: API Key, API Secret, Bearer Token
   - Test de connexion (appel API de validation)
   - Date d'expiration des tokens

3. **Templates de Posts**
   - Éditeur par plateforme
   - Variables disponibles: `{title}`, `{location}`, `{contract_type}`, `{company}`, `{url}`, `{salary}`
   - Prévisualisation en temps réel
   - Sauvegarde

4. **Paramètres Globaux**
   - Délai avant partage automatique (0-60 minutes)
   - Activer/désactiver génération d'images
   - Qualité des images (standard/haute)
   - Logs verbeux (dev)

**Route:** `/admin/social-share-config`

#### 4.2 Dashboard Analytics

**Fichier:** `src/pages/AdminSocialShareAnalytics.tsx`

**Widgets:**
1. **Stats Globales**
   - Total partages (manual + auto)
   - Partages par plateforme (camembert)
   - Tendance sur 7/30 jours (courbe)

2. **Top Offres Partagées**
   - Utilise `get_most_shared_jobs(10)`
   - Tableau: Titre, Entreprise, Total partages, Par plateforme

3. **Partages par Type**
   - Manual vs Auto (graphique barres)
   - Utilise `get_share_stats_by_type()`

4. **Analyse Temporelle**
   - Heatmap: Jour de la semaine × Heure
   - Meilleurs moments pour partager

5. **Taux de Conversion**
   - Partages → Vues offre
   - Partages → Candidatures (si linkable)

**Route:** `/admin/social-share-analytics`

---

### PHASE 5️⃣ : SERVICES & HELPERS

#### 5.1 Service de Configuration

**Fichier:** `src/services/socialShareConfigService.ts`

```typescript
import { supabase } from '../lib/supabase';

export interface PlatformConfig {
  platform: 'facebook' | 'linkedin' | 'twitter' | 'whatsapp';
  is_enabled: boolean;
  auto_share_enabled: boolean;
  post_template: string;
  credentials: {
    [key: string]: string;
  };
}

export const socialShareConfigService = {
  async getAllPlatforms(): Promise<PlatformConfig[]> {
    const { data, error } = await supabase
      .from('social_platforms_config')
      .select('*')
      .order('platform');

    if (error) throw error;
    return data;
  },

  async updatePlatform(platform: string, updates: Partial<PlatformConfig>): Promise<void> {
    const { error } = await supabase
      .from('social_platforms_config')
      .update(updates)
      .eq('platform', platform);

    if (error) throw error;
  },

  async testConnection(platform: string): Promise<boolean> {
    // Appelle Edge Function de test
    const { data, error } = await supabase.functions.invoke('test-social-connection', {
      body: { platform }
    });

    return data?.success ?? false;
  },

  async getTemplate(platform: string): Promise<string> {
    const { data, error } = await supabase
      .from('social_platforms_config')
      .select('post_template')
      .eq('platform', platform)
      .maybeSingle();

    if (error) throw error;
    return data?.post_template ?? '';
  }
};
```

#### 5.2 Service Analytics

**Fichier:** `src/services/socialShareAnalyticsService.ts`

```typescript
import { supabase } from '../lib/supabase';

export interface ShareStats {
  platform: string;
  count: number;
  share_type: 'manual' | 'auto';
}

export const socialShareAnalyticsService = {
  async getGlobalStats() {
    const { data, error } = await supabase
      .rpc('get_share_stats_by_type');

    if (error) throw error;
    return data;
  },

  async getTopSharedJobs(limit = 10) {
    const { data, error } = await supabase
      .rpc('get_most_shared_jobs', { limit });

    if (error) throw error;
    return data;
  },

  async getJobShareHistory(jobId: string) {
    const { data, error } = await supabase
      .from('social_share_analytics')
      .select('*')
      .eq('job_id', jobId)
      .order('shared_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getShareTrends(days = 30) {
    const { data, error } = await supabase
      .from('social_share_analytics')
      .select('platform, shared_at')
      .gte('shared_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('shared_at');

    if (error) throw error;
    return data;
  }
};
```

---

### PHASE 6️⃣ : AMÉLIORATIONS UI EXISTANTES

#### 6.1 Mise à Jour JobPublishForm

**Fichier:** `src/components/recruiter/JobPublishForm.tsx`

**Modifications minimales:**
- ✅ Checkbox `auto_share` existe déjà
- ➕ Ajouter tooltip explicatif: "Le partage automatique sera effectué uniquement sur les plateformes activées par l'administrateur"
- ➕ Afficher quelles plateformes sont actives (lecture depuis `social_platforms_config`)

#### 6.2 Dashboard Recruteur

**Fichier:** `src/components/recruiter/DashboardStats.tsx`

**Ajout carte:**
```tsx
<StatsCard
  title="Partages Sociaux"
  value={shareStats.total}
  icon={<Share2 />}
  trend={shareStats.trend}
  details={`Facebook: ${shareStats.facebook} | LinkedIn: ${shareStats.linkedin}`}
/>
```

---

## 📊 ORDRE D'IMPLÉMENTATION RECOMMANDÉ

### Sprint 1 : Infrastructure (1-2 jours)
1. ✅ Créer migrations DB (tables config, analytics update, templates)
2. ✅ Créer services TypeScript (socialShareConfigService, analyticsService)
3. ✅ Activer extension pg_net si nécessaire

### Sprint 2 : Edge Functions (2-3 jours)
4. ✅ Edge Function génération d'images (Canvas)
5. ✅ Edge Function automatisation partage
6. ✅ Edge Function test connexion
7. ✅ Trigger PostgreSQL auto_share

### Sprint 3 : Admin UI (2-3 jours)
8. ✅ Page AdminSocialShareConfig (4 sections)
9. ✅ Page AdminSocialShareAnalytics (5 widgets)
10. ✅ Ajouter routes dans AdminLayout

### Sprint 4 : Intégration & Tests (1-2 jours)
11. ✅ Mettre à jour JobPublishForm
12. ✅ Ajouter stats dashboard recruteur
13. ✅ Tests end-to-end automatisation
14. ✅ Build production

---

## ⚠️ POINTS D'ATTENTION

### Sécurité
- **Credentials API:** Chiffrer en base (pg_crypto) ou utiliser Supabase Vault
- **RLS:** Accès admin uniquement pour config
- **Rate Limiting:** Limiter appels Edge Functions (éviter spam)

### Performance
- **Images:** Générer async, ne pas bloquer publication
- **Cache:** Mettre en cache config plateformes (5 minutes)
- **Batch:** Possibilité de partager en batch (plusieurs offres)

### Limites API Sociales
- **Facebook:** 200 appels/heure/user
- **LinkedIn:** 100 appels/jour pour posts
- **Twitter:** 300 posts/3h (Free tier)
- **Solution:** Queue system avec retry

### UX
- **Notification:** Informer recruteur du succès/échec partage
- **Preview:** Permettre preview avant auto-partage
- **Opt-out:** Possibilité de désactiver auto-partage après publication

---

## 🎯 CRITÈRES DE SUCCÈS

### Fonctionnels
- ✅ Checkbox `auto_share` déclenche partage automatique
- ✅ Images générées automatiquement (1200×630)
- ✅ Partages enregistrés dans analytics avec type
- ✅ Admin peut activer/désactiver plateformes
- ✅ Admin peut voir stats complètes

### Techniques
- ✅ ZÉRO crash React
- ✅ ZÉRO duplication de code
- ✅ Build production réussi
- ✅ Tests Edge Functions OK
- ✅ Triggers PostgreSQL fonctionnels

### Business
- ✅ Augmentation visibilité offres
- ✅ Gain de temps recruteurs
- ✅ Métriques trackées
- ✅ ROI mesurable

---

## 📚 DOCUMENTATION À CRÉER

1. **Guide Administrateur:** Configuration des plateformes sociales
2. **Guide Recruteur:** Utilisation du partage automatique
3. **Guide Technique:** Architecture Edge Functions + Triggers
4. **Troubleshooting:** Problèmes courants et solutions

---

**PRINCIPE DIRECTEUR:** Compléter l'existant, ne rien dupliquer, zéro régression.

**STATUT:** Prêt pour implémentation par phases.
