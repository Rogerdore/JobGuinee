# CHECKLIST CONFORMITÉ RGPD - SYSTÈME DE PARTAGE SOCIAL
## JobGuinée - Production

**Date:** 9 janvier 2026
**Responsable:** DPO JobGuinée
**Référence:** Art. 6, 13, 14, 15-22, 32 RGPD

---

## 📋 RÉSUMÉ CONFORMITÉ

| Critère | Statut | Priorité | Action |
|---------|--------|----------|--------|
| Base légale | ⚠️ PARTIEL | 🔴 HAUTE | Documenter intérêt légitime |
| Minimisation données | ⚠️ PARTIEL | 🟡 MOYENNE | Supprimer IP/User-Agent? |
| Transparence | ❌ MANQUE | 🔴 HAUTE | Mettre à jour politique |
| Droit d'accès | ✅ OK | ✅ FAIT | Logs admin accessibles |
| Droit suppression | ❌ MANQUE | 🔴 HAUTE | Procédure GDPR delete |
| Durée conservation | ❌ MANQUE | 🟡 MOYENNE | Définir 12-24 mois |
| Sécurité technique | ⚠️ FAIBLE | 🔴 HAUTE | Chiffrer credentials |
| Registre DPO | ❌ MANQUE | 🟡 MOYENNE | Documenter traitement |

---

## 1️⃣ ANALYSE DES DONNÉES TRAITÉES

### A. DONNÉES D'OFFRES D'EMPLOI (Non personnelles)

**Catégorie:** Informations professionnelles publiques

**Données partagées:**
- ✅ Titre de l'offre
- ✅ Nom de l'entreprise recruteuse
- ✅ Localisation du poste
- ✅ Type de contrat (CDI/CDD/Stage)
- ✅ Fourchette salariale (optionnelle)
- ✅ URL publique de l'offre

**Base légale:** Intérêt légitime (Art. 6.1.f RGPD)
- Promotion des offres d'emploi
- Facilitation du recrutement
- Visibilité employeurs

**Risques RGPD:** ✅ FAIBLE
- Aucune donnée personnelle sensible
- Données déjà publiques sur le site
- Pas de traçage individuel candidats

---

### B. MÉTADONNÉES TECHNIQUES (⚠️ Attention RGPD)

**Catégorie:** Données techniques de navigation

**Stockées dans `social_share_analytics`:**
- ⚠️ `ip_address` → **DONNÉE PERSONNELLE** (CJUE 2016)
- ⚠️ `user_agent` → **DONNÉE PERSONNELLE** (fingerprinting)
- ✅ `user_id` → Pseudonyme (OK si dissociable)
- ✅ `shared_at` → Timestamp (OK)
- ✅ `platform` → Réseau social (OK)

**Base légale actuelle:** ❌ ABSENTE
- Pas de consentement explicite
- Pas de mention politique confidentialité
- Intérêt légitime non documenté

**Risques RGPD:** 🟡 MOYEN
- IP = identification indirecte possible
- User-Agent = empreinte navigateur
- CNIL: conservation limitée (12 mois max)

**⚠️ RECOMMANDATION URGENTE:**
```sql
-- Option 1: Supprimer ces colonnes (plus simple)
ALTER TABLE social_share_analytics
DROP COLUMN ip_address,
DROP COLUMN user_agent;

-- Option 2: Anonymiser immédiatement
UPDATE social_share_analytics
SET ip_address = substring(ip_address from 1 for position('.' in ip_address) +
                 position('.' in substring(ip_address from position('.' in ip_address) + 1))) || '0.0',
    user_agent = substring(user_agent from 1 for 50);

-- Option 3: Ajouter consentement explicite
-- (complexe, nécessite refonte UX)
```

---

### C. CREDENTIALS PLATEFORMES (🔐 Sécurité critique)

**Catégorie:** Secrets d'accès API

**Stockées dans `social_platforms_config.credentials` (jsonb):**
- 🔐 Facebook: access_token, app_secret, page_id
- 🔐 LinkedIn: access_token, client_secret, organization_id
- 🔐 Twitter: bearer_token, api_secret, access_token_secret
- 🔐 WhatsApp: access_token, phone_number_id

**Problème actuel:** ❌ **STOCKAGE EN CLAIR**

**Risques:**
- Fuite base de données = compromission totale
- Injection SQL théorique = accès tokens
- Pas de rotation automatique
- Pas d'audit d'accès

**⚠️ ACTION OBLIGATOIRE:**
```sql
-- Implémenter chiffrement pg_crypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Fonction de chiffrement
CREATE OR REPLACE FUNCTION encrypt_credentials(creds jsonb, key text)
RETURNS bytea AS $$
BEGIN
  RETURN pgp_sym_encrypt(creds::text, key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de déchiffrement
CREATE OR REPLACE FUNCTION decrypt_credentials(encrypted bytea, key text)
RETURNS jsonb AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted, key)::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Alternative:** Utiliser Supabase Vault (recommandé)

---

## 2️⃣ OBLIGATIONS LÉGALES RGPD

### ✅ Art. 6 - Base légale

**Statut:** ⚠️ PARTIEL

**Base légale applicable:** Intérêt légitime (Art. 6.1.f)

**Justification:**
- Promotion des offres = intérêt légitime employeurs
- Facilitation mise en relation candidats/recruteurs
- Pas d'atteinte disproportionnée droits candidats

**⚠️ ACTION REQUISE:**
Documenter dans le Registre des Traitements:
```
Traitement: Partage automatisé offres emploi réseaux sociaux
Base légale: Intérêt légitime (Art. 6.1.f)
Finalité: Promotion offres, augmentation visibilité
Données: Titre, entreprise, localisation, contrat, salaire, URL
Destinataires: Facebook, LinkedIn, Twitter, WhatsApp
Durée: 12 mois (analytics)
```

---

### ❌ Art. 13-14 - Transparence (Information)

**Statut:** ❌ MANQUE

**Obligation:**
Informer les personnes concernées (recruteurs publiant des offres):
- Que leurs offres seront partagées automatiquement
- Sur quels réseaux sociaux
- Avec quelles données
- Durée de conservation des logs

**⚠️ ACTION REQUISE:**

1. **Ajouter dans Politique de Confidentialité:**
```markdown
## Partage d'Offres d'Emploi

Lorsque vous publiez une offre d'emploi sur JobGuinée et activez
l'option "Partage automatique", nous partageons automatiquement
votre offre sur les réseaux sociaux suivants :
- Facebook (page entreprise)
- LinkedIn (profil entreprise)
- Twitter (compte officiel)
- WhatsApp (lien de partage)

Données partagées :
- Titre du poste
- Nom de votre entreprise
- Localisation
- Type de contrat
- Fourchette salariale (si indiquée)
- Lien vers l'offre complète

Nous conservons un historique de ces partages pendant 12 mois
à des fins d'audit et d'amélioration du service.

Vous pouvez désactiver cette fonctionnalité à tout moment dans
les paramètres de publication.
```

2. **Ajouter checkbox dans formulaire publication:**
```typescript
// JobPublishForm.tsx
<label>
  <input type="checkbox" name="auto_share" />
  J'accepte le partage automatique de cette offre sur les réseaux
  sociaux selon la politique de confidentialité
</label>
```

---

### ⚠️ Art. 15-22 - Droits des personnes

#### ✅ Droit d'accès (Art. 15)
**Statut:** OK (admin peut consulter logs)

#### ❌ Droit à l'effacement (Art. 17)
**Statut:** MANQUE

**⚠️ ACTION REQUISE:**
```sql
-- Fonction GDPR-compliant pour suppression
CREATE OR REPLACE FUNCTION gdpr_delete_share_data(p_job_id uuid)
RETURNS void AS $$
BEGIN
  -- Anonymiser les logs au lieu de supprimer
  UPDATE social_share_analytics
  SET
    user_id = NULL,
    ip_address = NULL,
    user_agent = NULL,
    metadata = jsonb_build_object('anonymized', true, 'date', now())
  WHERE job_id = p_job_id;

  -- Logger l'action RGPD
  INSERT INTO gdpr_actions_log (action, table_name, record_id, performed_at)
  VALUES ('anonymize_share_data', 'social_share_analytics', p_job_id, now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### ⚠️ Droit à la limitation (Art. 18)
**Statut:** PARTIEL

**Implémentation:**
- Désactivation auto_share = OK
- Arrêt traitement immédiat = OK
- Conservation logs = ⚠️ Définir durée

---

### ⚠️ Art. 32 - Sécurité

**Statut:** ⚠️ FAIBLE

**Mesures actuelles:**
- ✅ RLS activé (Row Level Security)
- ✅ HTTPS uniquement
- ✅ Authentification requise
- ❌ Credentials NON chiffrés
- ❌ Pas de monitoring accès
- ❌ Pas de rotation tokens

**⚠️ ACTIONS REQUISES:**

1. **Chiffrer credentials** (voir section C)

2. **Implémenter audit trail:**
```sql
CREATE TABLE credentials_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  accessed_by uuid NOT NULL REFERENCES auth.users(id),
  access_type text CHECK (access_type IN ('read', 'update', 'test')),
  ip_address inet,
  accessed_at timestamptz DEFAULT now()
);
```

3. **Rotation automatique tokens:**
```sql
-- Alerter si token expire dans < 7 jours
CREATE OR REPLACE FUNCTION check_token_expiration()
RETURNS TABLE(platform text, expires_in interval) AS $$
  SELECT
    platform,
    (credentials->>'token_expires_at')::timestamptz - now() as expires_in
  FROM social_platforms_config
  WHERE (credentials->>'token_expires_at')::timestamptz < now() + interval '7 days';
$$ LANGUAGE sql SECURITY DEFINER;
```

---

## 3️⃣ DURÉE DE CONSERVATION

**Principe RGPD:** Limitation de la durée (Art. 5.1.e)

**Recommandations CNIL:**
- Logs de connexion: 12 mois max
- Données techniques: 6 mois max
- Analytics: 25 mois max (comparaison annuelle)

**⚠️ DÉCISION À PRENDRE:**

```sql
-- Exemple: Rétention 12 mois
CREATE OR REPLACE FUNCTION cleanup_old_share_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM social_share_analytics
  WHERE shared_at < now() - interval '12 months';

  RAISE NOTICE 'Cleaned up logs older than 12 months';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cron job quotidien
SELECT cron.schedule(
  'cleanup-share-logs',
  '0 2 * * *',  -- Tous les jours à 2h
  $$SELECT cleanup_old_share_logs()$$
);
```

---

## 4️⃣ REGISTRE DES TRAITEMENTS

**Obligation:** Art. 30 RGPD (DPO)

**Fiche traitement à compléter:**

```yaml
Traitement: PARTAGE_OFFRES_RESEAUX_SOCIAUX
Responsable: JobGuinée SAS
DPO: [Email DPO]
Base légale: Intérêt légitime (Art. 6.1.f)

Finalités:
  - Promotion des offres d'emploi
  - Augmentation visibilité recruteurs
  - Facilitation recrutement

Catégories de données:
  - Informations offres (non personnelles)
  - Métadonnées techniques (IP, User-Agent) [OPTIONNEL]
  - Credentials API (sécurité)

Personnes concernées:
  - Recruteurs publiant des offres
  - Entreprises annonceurs

Destinataires:
  - Facebook Inc. (USA) - Clauses contractuelles types
  - LinkedIn Corporation (USA) - Clauses contractuelles types
  - Twitter Inc. (USA) - Clauses contractuelles types
  - Meta Platforms (WhatsApp) - Clauses contractuelles types

Transferts hors UE:
  - Oui → USA (décision d'adéquation 2023 + clauses types)

Durée conservation:
  - Logs partages: 12 mois
  - Credentials: Tant que compte actif
  - Métadonnées: 6 mois

Mesures sécurité:
  - RLS PostgreSQL
  - HTTPS obligatoire
  - Chiffrement credentials (à implémenter)
  - Authentification forte
  - Audit trail

Droits personnes:
  - Accès: Via admin panel
  - Rectification: Modification offre
  - Effacement: Fonction GDPR (à implémenter)
  - Opposition: Désactivation auto_share
  - Limitation: Désactivation immédiate

Analyses d'impact (AIPD):
  - Non requise (risque faible)
  - Données non sensibles
  - Pas de profilage automatisé
```

---

## 5️⃣ CHECKLIST MISE EN CONFORMITÉ

### 🔴 PRIORITÉ HAUTE (< 1 mois)

- [ ] **Chiffrer credentials** (pg_crypto ou Vault)
- [ ] **Mettre à jour Politique de Confidentialité**
- [ ] **Ajouter checkbox consentement** (formulaire publication)
- [ ] **Implémenter fonction GDPR delete**
- [ ] **Définir durée conservation** (12 mois recommandé)
- [ ] **Documenter Registre des Traitements**

### 🟡 PRIORITÉ MOYENNE (< 3 mois)

- [ ] **Supprimer/Anonymiser IP & User-Agent**
- [ ] **Implémenter rotation tokens**
- [ ] **Créer audit trail accès credentials**
- [ ] **Automatiser cleanup logs anciens**
- [ ] **Former équipe admin** (droits RGPD)

### 🟢 PRIORITÉ BASSE (Nice to have)

- [ ] Analyse d'Impact (AIPD) formelle
- [ ] Certification ISO 27001
- [ ] Audit externe RGPD
- [ ] Dashboard conformité DPO

---

## 6️⃣ CONTACTS & RESSOURCES

**DPO JobGuinée:**
- Email: dpo@jobguinee.com
- Téléphone: [À compléter]

**Ressources:**
- CNIL: https://www.cnil.fr/
- RGPD texte: https://eur-lex.europa.eu/
- Guide CNIL recrutement: https://www.cnil.fr/fr/le-recrutement-et-la-gestion-du-personnel

**Références légales:**
- RGPD Art. 6 (Base légale)
- RGPD Art. 13-14 (Information)
- RGPD Art. 15-22 (Droits)
- RGPD Art. 32 (Sécurité)
- RGPD Art. 30 (Registre)

---

**VALIDATION JURIDIQUE REQUISE**
Ce document technique doit être validé par le DPO et/ou conseil juridique avant mise en production.

---

**FIN CHECKLIST RGPD**
