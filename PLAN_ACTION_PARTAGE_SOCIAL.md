# PLAN D'ACTION - SYSTÈME DE PARTAGE SOCIAL
## JobGuinée - Complétion & Conformité

**Date:** 9 janvier 2026
**Statut:** AUDIT TERMINÉ - PRÊT POUR IMPLÉMENTATION

---

## 🎯 RÉSUMÉ AUDIT

### Infrastructure existante: ✅ 80% FONCTIONNEL

Le système de partage social est **déjà largement implémenté**:
- ✅ 3 tables (social_platforms_config, social_share_analytics, social_post_templates)
- ✅ Trigger automatisé (auto_share_job_on_publish)
- ✅ Edge Function d'automatisation (auto-share-job)
- ✅ Services TypeScript complets
- ✅ Intégration 4 plateformes (Facebook, LinkedIn, Twitter, WhatsApp)

### Ce qui manque: ❌ 20% À COMPLÉTER

1. Colonnes audit dans social_share_analytics (action, status, error_message)
2. Table paramètres globaux (share_global_settings)
3. Interface Admin de gestion
4. Documentation RGPD formelle

### ⚠️ ATTENTION DUPLICATION

Les tables demandées (`share_settings`, `share_logs`) **dupliqueraient l'existant**.
→ Recommandation: ÉTENDRE les tables existantes au lieu de recréer.

---

## 📋 PLAN D'ACTION RECOMMANDÉ

### 🟢 PHASE 1: Extensions DB (Production Safe)

**Migration 1: Étendre social_share_analytics**

```sql
-- Ajouter colonnes pour audit détaillé
ALTER TABLE social_share_analytics
ADD COLUMN action text CHECK (action IN ('prepared', 'triggered', 'skipped', 'failed')),
ADD COLUMN status text CHECK (status IN ('success', 'error', 'skipped')),
ADD COLUMN error_message text;

-- Rétrocompatibilité: remplir les anciennes lignes
UPDATE social_share_analytics
SET
  action = 'triggered',
  status = CASE
    WHEN metadata->>'success' = 'true' THEN 'success'
    WHEN metadata->>'success' = 'false' THEN 'error'
    ELSE 'success'
  END,
  error_message = metadata->>'error'
WHERE action IS NULL;

-- Index pour performance
CREATE INDEX idx_social_share_analytics_status ON social_share_analytics(status);
CREATE INDEX idx_social_share_analytics_action ON social_share_analytics(action);
```

**Migration 2: Créer share_global_settings**

```sql
-- Table singleton pour paramètres globaux
CREATE TABLE share_global_settings (
  id uuid PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  automation_enabled boolean NOT NULL DEFAULT false,
  delay_minutes integer DEFAULT 0 CHECK (delay_minutes >= 0 AND delay_minutes <= 1440),
  default_image_url text,
  default_fallback_text text DEFAULT 'Nouvelle offre d''emploi disponible sur JobGuinée !',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row_only CHECK (id = '00000000-0000-0000-0000-000000000001'::uuid)
);

-- RLS: Admin uniquement
ALTER TABLE share_global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view global settings"
  ON share_global_settings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.user_type = 'admin'
  ));

CREATE POLICY "Admins can update global settings"
  ON share_global_settings FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.user_type = 'admin'
  ));

-- Insertion ligne unique
INSERT INTO share_global_settings (id) VALUES ('00000000-0000-0000-0000-000000000001');

-- Trigger updated_at
CREATE TRIGGER share_global_settings_updated_at
  BEFORE UPDATE ON share_global_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Migration 3: Modifier trigger pour respecter kill switch global**

```sql
CREATE OR REPLACE FUNCTION trigger_auto_share_job()
RETURNS TRIGGER AS $$
DECLARE
  v_platforms_enabled boolean;
  v_automation_enabled boolean;
  v_function_url text;
BEGIN
  IF NEW.auto_share = true
     AND NEW.status = 'published'
     AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'published')) THEN

    -- 🆕 Vérifier le kill switch global
    SELECT automation_enabled INTO v_automation_enabled
    FROM share_global_settings
    WHERE id = '00000000-0000-0000-0000-000000000001';

    IF NOT COALESCE(v_automation_enabled, false) THEN
      RAISE NOTICE 'Auto-share globally disabled for job_id: %', NEW.id;

      -- Logger comme "skipped"
      INSERT INTO social_share_analytics (
        job_id, platform, share_type, action, status
      ) VALUES (
        NEW.id, 'all', 'auto', 'skipped', 'skipped'
      );

      RETURN NEW;
    END IF;

    -- Vérifier plateformes actives
    SELECT EXISTS (
      SELECT 1 FROM social_platforms_config
      WHERE is_enabled = true AND auto_share_enabled = true
    ) INTO v_platforms_enabled;

    IF v_platforms_enabled THEN
      v_function_url := current_setting('app.supabase_url', true) || '/functions/v1/auto-share-job';

      IF v_function_url IS NULL OR v_function_url = '/functions/v1/auto-share-job' THEN
        v_function_url := 'https://' || current_setting('app.settings.project_ref', true) || '.supabase.co/functions/v1/auto-share-job';
      END IF;

      PERFORM net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        ),
        body := jsonb_build_object('job_id', NEW.id),
        timeout_milliseconds := 30000
      );

      RAISE NOTICE 'Auto-share triggered for job_id: %', NEW.id;
    ELSE
      RAISE NOTICE 'Auto-share skipped: no platforms enabled for job_id: %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in auto-share trigger for job_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
```

---

### 🟢 PHASE 2: Interface Admin

**Créer: src/pages/AdminSocialShareConfig.tsx**

Structure recommandée:

```typescript
// Sections:
// 1. Kill Switch Global (share_global_settings)
// 2. Configuration par Plateforme (social_platforms_config)
// 3. Templates de Posts (social_post_templates)
// 4. Historique & Audit (social_share_analytics)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { socialShareConfigService } from '../services/socialShareConfigService';
import { socialShareAnalyticsService } from '../services/socialShareAnalyticsService';

interface GlobalSettings {
  automation_enabled: boolean;
  delay_minutes: number;
  default_image_url: string;
  default_fallback_text: string;
}

export default function AdminSocialShareConfig() {
  // State management
  // 4 onglets: Global, Plateformes, Templates, Historique

  return (
    <div className="container">
      {/* Global Settings Section */}
      {/* Platforms Configuration */}
      {/* Templates Management */}
      {/* Analytics & Logs */}
    </div>
  );
}
```

**Intégrer dans AdminLayout:**

```typescript
// src/components/AdminLayout.tsx
// Ajouter dans le menu:
{
  name: 'Partage Social',
  href: '/admin/social-share',
  icon: Share2
}
```

---

### 🟢 PHASE 3: Documentation RGPD

**Fichiers créés:**
- ✅ SOCIAL_SHARE_RGPD_COMPLIANCE.md (checklist détaillée)

**Actions obligatoires:**

1. **Mettre à jour Politique de Confidentialité**
   - Ajouter section "Partage d'Offres d'Emploi"
   - Mentionner réseaux sociaux utilisés
   - Indiquer durée conservation logs

2. **Ajouter consentement formulaire**
   ```typescript
   // JobPublishForm.tsx
   <label className="flex items-center gap-2">
     <input
       type="checkbox"
       name="consent_auto_share"
       checked={formData.auto_share}
       onChange={handleConsentChange}
     />
     <span className="text-sm">
       J'accepte le partage automatique de cette offre sur les réseaux
       sociaux selon notre{' '}
       <a href="/politique-confidentialite" className="text-blue-600">
         politique de confidentialité
       </a>
     </span>
   </label>
   ```

3. **Implémenter fonction GDPR delete**
   ```sql
   CREATE OR REPLACE FUNCTION gdpr_anonymize_share_data(p_job_id uuid)
   RETURNS void AS $$
   BEGIN
     UPDATE social_share_analytics
     SET
       user_id = NULL,
       ip_address = NULL,
       user_agent = NULL,
       metadata = jsonb_build_object(
         'anonymized', true,
         'anonymized_at', now()
       )
     WHERE job_id = p_job_id;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
   ```

4. **Définir durée conservation**
   ```sql
   -- Cron job nettoyage (12 mois)
   CREATE OR REPLACE FUNCTION cleanup_old_share_analytics()
   RETURNS void AS $$
   BEGIN
     DELETE FROM social_share_analytics
     WHERE shared_at < now() - interval '12 months';
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   -- Planifier tous les jours à 2h
   SELECT cron.schedule(
     'cleanup-share-analytics-12m',
     '0 2 * * *',
     $$SELECT cleanup_old_share_analytics()$$
   );
   ```

---

### 🔴 PHASE 4: Sécurisation (URGENT)

**⚠️ CRITIQUE: Credentials en clair**

**Action 1: Chiffrer credentials existants**

```sql
-- Installer pg_crypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Créer colonne chiffrée
ALTER TABLE social_platforms_config
ADD COLUMN credentials_encrypted bytea;

-- Fonction migration
CREATE OR REPLACE FUNCTION migrate_encrypt_credentials()
RETURNS void AS $$
DECLARE
  v_record record;
  v_key text := current_setting('app.encryption_key'); -- Variable environnement
BEGIN
  FOR v_record IN
    SELECT id, credentials
    FROM social_platforms_config
    WHERE credentials_encrypted IS NULL
  LOOP
    UPDATE social_platforms_config
    SET credentials_encrypted = pgp_sym_encrypt(
      credentials::text,
      v_key
    )
    WHERE id = v_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exécuter migration
SELECT migrate_encrypt_credentials();

-- Supprimer colonne en clair (après validation)
-- ALTER TABLE social_platforms_config DROP COLUMN credentials;
```

**Action 2: Audit trail accès credentials**

```sql
CREATE TABLE social_credentials_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  accessed_by uuid NOT NULL REFERENCES auth.users(id),
  access_type text CHECK (access_type IN ('view', 'update', 'test', 'use')),
  success boolean DEFAULT true,
  ip_address inet,
  accessed_at timestamptz DEFAULT now()
);

ALTER TABLE social_credentials_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access logs"
  ON social_credentials_access_log FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid()) AND profiles.user_type = 'admin'
  ));
```

---

## 📊 CHECKLIST FINALE PRODUCTION

### Avant déploiement:

- [ ] Migration 1: Étendre social_share_analytics (colonnes audit)
- [ ] Migration 2: Créer share_global_settings
- [ ] Migration 3: Mettre à jour trigger avec kill switch
- [ ] Migration 4: Chiffrer credentials (pg_crypto)
- [ ] Migration 5: Créer fonction GDPR delete
- [ ] Migration 6: Planifier cleanup logs (cron)

### Interface Admin:

- [ ] Créer AdminSocialShareConfig.tsx
- [ ] Intégrer dans AdminLayout (menu)
- [ ] Tester activation/désactivation globale
- [ ] Tester configuration plateformes
- [ ] Tester visualisation historique

### Documentation:

- [ ] Mettre à jour Politique de Confidentialité
- [ ] Ajouter consentement formulaire publication
- [ ] Valider checklist RGPD avec DPO/Juridique
- [ ] Documenter Registre des Traitements

### Tests:

- [ ] Test trigger avec automation_enabled = false (doit skip)
- [ ] Test trigger avec automation_enabled = true (doit publier)
- [ ] Test logs avec nouvelles colonnes (action, status, error_message)
- [ ] Test fonction GDPR delete (anonymisation)
- [ ] Test cleanup automatique (dry run)

### Sécurité:

- [ ] Vérifier chiffrement credentials
- [ ] Tester audit trail accès
- [ ] Valider RLS sur nouvelles tables
- [ ] Scanner vulnérabilités (npm audit)

---

## 🎯 ESTIMATION EFFORT

| Phase | Effort | Priorité | Bloquant |
|-------|--------|----------|----------|
| Phase 1: Extensions DB | 2h | 🔴 HAUTE | Oui |
| Phase 2: Interface Admin | 8h | 🟡 MOYENNE | Non |
| Phase 3: Documentation RGPD | 4h | 🔴 HAUTE | Oui |
| Phase 4: Sécurisation | 6h | 🔴 HAUTE | Oui |

**Total: ~20h de développement**

---

## ✅ VALIDATION

**Audit terminé:** ✅
**Plan d'action défini:** ✅
**Risques identifiés:** ✅
**Conformité RGPD:** ⚠️ À compléter

**Prêt pour implémentation:** OUI

---

**Questions ou validation nécessaire avant de procéder ?**
