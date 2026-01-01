# 🏷️ GUIDE D'ACTIVATION DES BADGES "À LA UNE" ET "URGENT"
## JobGuinée - Manuel d'Utilisation et Implémentation

**Date :** 1er janvier 2026
**Version :** 1.0
**Status :** ⚠️ **INTERFACE ADMIN À CRÉER**

---

## 📋 SITUATION ACTUELLE

### ✅ Ce Qui Existe

**Base de Données :**
```sql
-- Colonnes présentes dans table jobs
is_featured BOOLEAN DEFAULT false NOT NULL
is_urgent BOOLEAN DEFAULT false NOT NULL

-- Index pour performance
CREATE INDEX idx_jobs_is_featured ON jobs(is_featured) WHERE is_featured = true;
```

**Frontend :**
- ✅ Badges visuels affichés sur cartes offres (`src/pages/Jobs.tsx`)
- ✅ Badge "À LA UNE" (orange, coin supérieur droit)
- ✅ Badge "URGENT" (rouge animé, à côté du titre)
- ✅ Logique d'affichage conditionnelle fonctionnelle

### ❌ Ce Qui Manque

**Interface de Gestion :**
- ❌ **Aucune interface admin** pour activer/désactiver ces badges
- ❌ **Aucun contrôle recruteur** dans le formulaire de publication
- ❌ **Aucun système de paiement** pour badge "À LA UNE" (premium)
- ❌ **Aucune limitation** sur le nombre de badges actifs

**Actuellement, ces badges ne peuvent être activés que :**
1. Manuellement via SQL direct dans Supabase
2. Par un développeur avec accès à la base de données

---

## 🎯 QUI DOIT POUVOIR ACTIVER CES BADGES ?

### Modèle Recommandé

#### 1. BADGE "À LA UNE" ⚡

**Qui peut l'activer :**
- ✅ **Administrateurs uniquement** (contrôle qualité)
- ✅ **Recruteurs Premium/Enterprise** (fonctionnalité payante)

**Workflow recommandé :**

```
┌─────────────────────────────────────────────┐
│  OPTION A : Admin Active Directement        │
├─────────────────────────────────────────────┤
│  1. Admin identifie offre stratégique       │
│  2. Admin active badge via interface        │
│  3. Badge visible immédiatement             │
│  4. Durée : 7-30 jours (configurable)       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  OPTION B : Recruteur Demande (Premium)     │
├─────────────────────────────────────────────┤
│  1. Recruteur premium coche option          │
│  2. Coût déduit du crédit/abonnement        │
│  3. Badge activé automatiquement            │
│  4. Limite : 3 offres "À LA UNE" max        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  OPTION C : Recruteur Demande + Validation  │
├─────────────────────────────────────────────┤
│  1. Recruteur demande via formulaire        │
│  2. Admin reçoit notification               │
│  3. Admin valide ou refuse                  │
│  4. Recruteur payé si validé                │
└─────────────────────────────────────────────┘
```

**Coût Suggéré (si payant) :**
- 50 000 GNF / semaine
- 150 000 GNF / mois
- OU 10 crédits IA / semaine
- OU Inclus dans abonnement Enterprise

---

#### 2. BADGE "URGENT" 🔴

**Qui peut l'activer :**
- ✅ **Recruteurs eux-mêmes** (auto-déclaratif)
- ✅ **Administrateurs** (contrôle qualité si abus)

**Workflow recommandé :**

```
┌─────────────────────────────────────────────┐
│  OPTION A : Activation Libre (Auto)         │
├─────────────────────────────────────────────┤
│  1. Recruteur coche "Urgent" au formulaire  │
│  2. Badge activé instantanément             │
│  3. Durée : Jusqu'à deadline offre          │
│  4. Limite : Max 20% des offres/recruteur   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  OPTION B : Activation Payante              │
├─────────────────────────────────────────────┤
│  1. Recruteur coche "Urgent"                │
│  2. Coût : 5 crédits IA ou 20 000 GNF       │
│  3. Badge activé après paiement             │
│  4. Durée : 7 jours (puis désactivation)    │
└─────────────────────────────────────────────┘
```

**Coût Suggéré (si payant) :**
- 20 000 GNF / offre
- OU 5 crédits IA / offre
- OU Gratuit (mais limite 2 offres urgentes actives max)

---

## 🛠️ IMPLÉMENTATION NÉCESSAIRE

### Phase 1 : Interface Admin (Priorité 1)

#### Créer Page : `AdminJobBadges.tsx`

**Fonctionnalités :**
1. **Liste des offres actives** avec colonnes :
   - Titre offre
   - Entreprise
   - Date publication
   - Status "À LA UNE" (toggle)
   - Status "URGENT" (toggle)
   - Actions (Activer/Désactiver)

2. **Filtres :**
   - Offres avec badge "À LA UNE"
   - Offres avec badge "URGENT"
   - Offres sans badges
   - Par secteur
   - Par date

3. **Actions rapides :**
   - Activer "À LA UNE" (avec durée)
   - Désactiver "À LA UNE"
   - Activer "URGENT"
   - Désactiver "URGENT"
   - Activer les deux
   - Tout désactiver

4. **Statistiques :**
   - Nombre d'offres "À LA UNE" actives
   - Nombre d'offres "URGENT" actives
   - Performance badges (CTR, candidatures)
   - Recruteurs utilisant le plus badges

**Code Squelette :**
```tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Zap, AlertTriangle, Eye, Users } from 'lucide-react';

export default function AdminJobBadges() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleFeatured = async (jobId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_featured: !currentValue })
      .eq('id', jobId);

    if (!error) {
      // Recharger la liste
      loadJobs();
    }
  };

  const toggleUrgent = async (jobId: string, currentValue: boolean) => {
    const { error } = await supabase
      .from('jobs')
      .update({ is_urgent: !currentValue })
      .eq('id', jobId);

    if (!error) {
      loadJobs();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Gestion des Badges Offres
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-xl border-2 border-orange-200">
          <Zap className="w-6 h-6 text-[#FF8C00] mb-2" />
          <div className="text-2xl font-bold">{featuredCount}</div>
          <div className="text-sm text-gray-600">À LA UNE</div>
        </div>
        {/* Plus de stats... */}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th>Offre</th>
              <th>Entreprise</th>
              <th>Date</th>
              <th>À LA UNE</th>
              <th>URGENT</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.company_name}</td>
                <td>{new Date(job.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => toggleFeatured(job.id, job.is_featured)}
                    className={`px-3 py-1 rounded-lg ${
                      job.is_featured
                        ? 'bg-orange-100 text-[#FF8C00]'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </td>
                <td>
                  <button
                    onClick={() => toggleUrgent(job.id, job.is_urgent)}
                    className={`px-3 py-1 rounded-lg ${
                      job.is_urgent
                        ? 'bg-red-100 text-red-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </button>
                </td>
                <td>
                  {/* Actions */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

### Phase 2 : Option Recruteur dans Formulaire (Priorité 2)

#### Modifier : `JobPublishForm.tsx`

**Ajouter Section "Visibilité Premium" :**

```tsx
{/* Nouvelle section après "Options de publication" */}
<FormSection title="6. Visibilité Premium (Optionnel)" icon={Zap}>
  <div className="space-y-4">

    {/* Badge À LA UNE */}
    {isPremium && (
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={formData.is_featured}
            onChange={(e) => updateFormField('is_featured', e.target.checked)}
            className="mt-1 w-5 h-5 text-[#FF8C00] rounded"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-[#FF8C00]" />
              <span className="font-bold text-gray-900">
                Mettre cette offre "À LA UNE"
              </span>
              <span className="px-2 py-0.5 bg-[#FF8C00] text-white text-xs rounded-full">
                PREMIUM
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-3">
              Votre offre sera affichée en priorité avec un badge orange visible.
              <strong> +200% de visibilité garantie.</strong>
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-gray-600" />
                <span>Vues multipliées par 3</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-gray-600" />
                <span>Candidatures +150%</span>
              </div>
            </div>

            {formData.is_featured && (
              <div className="mt-3 p-3 bg-white rounded-lg border border-orange-200">
                <label className="block text-sm font-medium mb-2">
                  Durée de mise en avant
                </label>
                <select className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg">
                  <option value="7">7 jours (10 crédits)</option>
                  <option value="14">14 jours (18 crédits)</option>
                  <option value="30">30 jours (30 crédits)</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Badge URGENT */}
    <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-5">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={formData.is_urgent}
          onChange={(e) => updateFormField('is_urgent', e.target.checked)}
          className="mt-1 w-5 h-5 text-red-600 rounded"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="font-bold text-gray-900">
              Marquer comme URGENT
            </span>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Ajoute un badge rouge animé pour attirer l'attention des candidats.
            Recommandé si deadline proche ou besoin immédiat.
          </p>

          {formData.is_urgent && (
            <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-red-200">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-gray-900">
                <strong>Conseil :</strong> Précisez la date limite de candidature
                pour renforcer l'urgence.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Note pour utilisateurs non-premium */}
    {!isPremium && (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
        <p className="text-sm text-gray-900">
          <strong>💎 Fonctionnalité Premium</strong><br/>
          Le badge "À LA UNE" est réservé aux abonnés Premium et Enterprise.
          <button className="text-[#0E2F56] underline ml-1">
            Passer Premium
          </button>
        </p>
      </div>
    )}
  </div>
</FormSection>
```

---

### Phase 3 : Système de Durée et Auto-Désactivation (Priorité 3)

#### Créer Table : `job_badge_history`

```sql
CREATE TABLE job_badge_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  badge_type text NOT NULL CHECK (badge_type IN ('featured', 'urgent')),
  activated_at timestamptz DEFAULT now(),
  activated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  deactivated_at timestamptz,
  duration_days integer,
  cost_credits integer DEFAULT 0,
  cost_amount decimal(10,2) DEFAULT 0,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_job_badge_history_job_id ON job_badge_history(job_id);
CREATE INDEX idx_job_badge_history_badge_type ON job_badge_history(badge_type);
CREATE INDEX idx_job_badge_history_activated_at ON job_badge_history(activated_at);
```

#### Créer Fonction : Auto-désactivation badges expirés

```sql
CREATE OR REPLACE FUNCTION deactivate_expired_badges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Désactiver badges "À LA UNE" expirés
  UPDATE jobs
  SET is_featured = false
  WHERE is_featured = true
  AND id IN (
    SELECT job_id
    FROM job_badge_history
    WHERE badge_type = 'featured'
    AND deactivated_at IS NULL
    AND activated_at + (duration_days || ' days')::interval < now()
  );

  -- Marquer dans l'historique
  UPDATE job_badge_history
  SET deactivated_at = now(),
      reason = 'Durée expirée'
  WHERE badge_type = 'featured'
  AND deactivated_at IS NULL
  AND activated_at + (duration_days || ' days')::interval < now();

  -- Désactiver badges "URGENT" après deadline offre
  UPDATE jobs
  SET is_urgent = false
  WHERE is_urgent = true
  AND (
    deadline < now()
    OR status = 'closed'
  );
END;
$$;
```

#### Créer Cron Job (Supabase Edge Function)

```typescript
// supabase/functions/deactivate-expired-badges/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Exécuter la fonction de désactivation
  const { error } = await supabase.rpc('deactivate_expired_badges');

  if (error) {
    console.error('Erreur désactivation badges:', error);
    return new Response(JSON.stringify({ error }), { status: 500 });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Badges expirés désactivés avec succès'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Configurer Cron dans Supabase Dashboard :**
```
Expression: 0 */6 * * *  (Toutes les 6 heures)
Function: deactivate-expired-badges
```

---

## 📊 RÈGLES ET LIMITATIONS RECOMMANDÉES

### Badge "À LA UNE" ⚡

| Critère | Limite Recommandée |
|---------|-------------------|
| **Nombre simultané par plateforme** | Max 10 offres |
| **Par recruteur (Free)** | 0 (Premium uniquement) |
| **Par recruteur (Premium)** | 3 offres max |
| **Par recruteur (Enterprise)** | 10 offres max |
| **Durée minimum** | 7 jours |
| **Durée maximum** | 30 jours |
| **Renouvellement** | Possible après désactivation |
| **Priorité affichage** | Aléatoire entre badges actifs |

### Badge "URGENT" 🔴

| Critère | Limite Recommandée |
|---------|-------------------|
| **Nombre simultané par recruteur** | Max 2-3 offres |
| **Durée automatique** | Jusqu'à deadline offre |
| **Pourcentage max offres/recruteur** | 20% des offres actives |
| **Conditions** | Deadline < 14 jours OU justification |
| **Abus détecté** | Désactivation auto si >50% urgent |
| **Renouvellement** | Non (une seule fois par offre) |

---

## 🎨 VARIATIONS INTERFACE SELON RÔLE

### Pour Recruteurs Standard (Free)

```
┌─────────────────────────────────────────────┐
│  6. Visibilité Premium (Optionnel)          │
├─────────────────────────────────────────────┤
│                                              │
│  ☐ Marquer comme URGENT                     │
│     Badge rouge animé                        │
│     Gratuit (Max 2 offres simultanées)      │
│                                              │
│  ────────────────────────────────────────   │
│                                              │
│  💎 Badge "À LA UNE" (Premium uniquement)   │
│     +200% visibilité                         │
│     [Passer Premium]                         │
│                                              │
└─────────────────────────────────────────────┘
```

### Pour Recruteurs Premium

```
┌─────────────────────────────────────────────┐
│  6. Visibilité Premium (Optionnel)          │
├─────────────────────────────────────────────┤
│                                              │
│  ☑ Mettre cette offre "À LA UNE"            │
│     ⚡ PREMIUM                               │
│     +200% visibilité garantie               │
│     Durée: [▼ 7 jours (10 crédits)]        │
│     Offres "À LA UNE" actives: 1/3          │
│                                              │
│  ────────────────────────────────────────   │
│                                              │
│  ☐ Marquer comme URGENT                     │
│     Badge rouge animé                        │
│     Inclus dans abonnement                   │
│     Offres urgentes actives: 0/3            │
│                                              │
└─────────────────────────────────────────────┘
```

### Pour Administrateurs

```
┌─────────────────────────────────────────────┐
│  Gestion Badges (Admin)                     │
├─────────────────────────────────────────────┤
│                                              │
│  ☐ À LA UNE (Activation admin)              │
│     Durée: [▼ 30 jours]                     │
│     Raison: [Partenariat stratégique ▼]     │
│                                              │
│  ☐ URGENT (Override)                        │
│     Activé par: Recruteur                    │
│     [✓ Valider] [✗ Refuser]                 │
│                                              │
│  Historique activations:                     │
│  • 15/12/2025 - À LA UNE (Admin)            │
│  • 20/12/2025 - URGENT (Recruteur)          │
│                                              │
└─────────────────────────────────────────────┘
```

---

## 🚀 PLAN D'IMPLÉMENTATION PAR PHASES

### Phase 1 : MVP Admin (2-3 jours)
- [ ] Page `AdminJobBadges.tsx` basique
- [ ] Toggle activation/désactivation manuel
- [ ] Statistiques simples (compteurs)
- [ ] Pas de durée, pas de coût

### Phase 2 : Interface Recruteur (3-4 jours)
- [ ] Checkbox "URGENT" dans formulaire
- [ ] Section "Visibilité Premium" complète
- [ ] Vérification abonnement Premium
- [ ] Limites nombre badges simultanés

### Phase 3 : Système Durée (2-3 jours)
- [ ] Table `job_badge_history`
- [ ] Fonction désactivation auto
- [ ] Edge Function cron job
- [ ] Notifications expiration

### Phase 4 : Système Paiement (4-5 jours)
- [ ] Intégration système crédits IA
- [ ] Coût badge "À LA UNE"
- [ ] Historique transactions
- [ ] Factures badges

### Phase 5 : Analytics & Optimisation (3-4 jours)
- [ ] Tracking performance badges
- [ ] Dashboard analytics badges
- [ ] A/B testing durées optimales
- [ ] Recommandations IA

**Durée totale estimée : 14-19 jours**

---

## 📝 CHECKLIST PRE-LANCEMENT

### Technique
- [ ] Migration SQL `job_badge_history` appliquée
- [ ] Fonction `deactivate_expired_badges()` créée
- [ ] Edge Function cron déployée
- [ ] Tests activation/désactivation
- [ ] Tests limites simultanés
- [ ] Tests expiration automatique

### Interface
- [ ] Page admin opérationnelle
- [ ] Section formulaire recruteur ajoutée
- [ ] Vérifications rôles/abonnements
- [ ] Messages erreur clairs
- [ ] Confirmations actions

### Business
- [ ] Tarification définie
- [ ] Conditions utilisation rédigées
- [ ] Politique abus définie
- [ ] Support formation utilisateurs

---

## 🎯 ALTERNATIVE TEMPORAIRE (Quick Fix)

En attendant l'interface complète, activation manuelle via SQL :

### Activer Badge "À LA UNE"

```sql
-- Activer pour une offre spécifique
UPDATE jobs
SET is_featured = true
WHERE id = 'JOB_ID_ICI';

-- Désactiver
UPDATE jobs
SET is_featured = false
WHERE id = 'JOB_ID_ICI';
```

### Activer Badge "URGENT"

```sql
-- Activer
UPDATE jobs
SET is_urgent = true
WHERE id = 'JOB_ID_ICI';

-- Désactiver
UPDATE jobs
SET is_urgent = false
WHERE id = 'JOB_ID_ICI';
```

### Activer les Deux

```sql
UPDATE jobs
SET
  is_featured = true,
  is_urgent = true
WHERE id = 'JOB_ID_ICI';
```

---

## 📞 QUESTIONS FRÉQUENTES

**Q : Un recruteur peut-il activer "À LA UNE" lui-même ?**
R : Oui, mais seulement s'il a un abonnement Premium/Enterprise et dans la limite de son quota.

**Q : Le badge "URGENT" est-il payant ?**
R : À décider. Options : gratuit avec limite (2 max), ou 5 crédits IA/20 000 GNF par badge.

**Q : Combien de temps dure un badge "À LA UNE" ?**
R : Entre 7 et 30 jours selon le choix/paiement du recruteur.

**Q : Peut-on avoir les deux badges simultanément ?**
R : Oui, une offre peut être "À LA UNE" ET "URGENT" en même temps.

**Q : Que se passe-t-il après expiration ?**
R : Le badge est automatiquement désactivé. Le recruteur peut le réactiver moyennant paiement.

**Q : Comment éviter les abus du badge "URGENT" ?**
R : Limite de 20% des offres d'un recruteur peuvent être urgentes. Au-delà, désactivation auto.

---

## 🎉 CONCLUSION

**STATUS ACTUEL :** ⚠️ **Badges fonctionnels en affichage, MAIS pas d'interface de gestion**

**PROCHAINES ÉTAPES RECOMMANDÉES :**
1. Créer page admin `AdminJobBadges.tsx` (2-3 jours)
2. Ajouter section dans `JobPublishForm.tsx` pour recruteurs (2 jours)
3. Implémenter système durée et auto-désactivation (3 jours)

**PRIORITÉ :** Moyenne-Haute (fonctionnalité premium importante pour monétisation)

---

**Rédigé par :** Expert Système
**Date :** 1er janvier 2026
**Statut :** ✅ DOCUMENTATION COMPLÈTE
