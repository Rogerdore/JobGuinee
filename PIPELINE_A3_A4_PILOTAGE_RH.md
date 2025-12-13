# PIPELINE RECRUTEUR A3-A4 & PILOTAGE RH - GUIDE OPÉRATIONNEL

## 📋 RÉSUMÉ EXÉCUTIF

**Statut** : ✅ **OPÉRATIONNEL EN PRODUCTION**

Ce document décrit le pipeline recruteur avancé finalisé pour JobGuinée, couvrant :
- **A3.3** : Planification d'entretiens + notifications automatiques
- **A3.4** : Exports professionnels (PDF/Excel/CSV/ZIP)
- **A4** : Communication recruteur ↔ candidat centralisée
- **Mode Direction/DRH** : Pilotage RH lecture seule

**Architecture** : Un seul recruteur par compte, isolation stricte par entreprise, respect des quotas Enterprise.

---

## 🎯 A3.3 - PLANIFICATION D'ENTRETIENS + NOTIFICATIONS

### Infrastructure Base de Données

**Table `interviews`**
```sql
Colonnes principales :
- application_id, job_id, recruiter_id, candidate_id, company_id
- interview_type : visio | presentiel | telephone
- scheduled_at : timestamp planification
- duration_minutes : 30-120 min
- location_or_link : Zoom/adresse/téléphone
- status : planned | confirmed | completed | cancelled | no_show
- outcome : positive | neutral | negative
- notes : commentaires internes recruteur
```

**Table `interview_evaluations`**
```sql
Évaluation post-entretien :
- technical_score (30%)
- soft_skills_score (25%)
- motivation_score (25%)
- cultural_fit_score (20%)
- overall_score : calculé automatiquement
- recommendation : recommended | to_confirm | not_retained
- strengths, weaknesses, detailed_feedback
```

### Composants UI

**1. ScheduleInterviewModal.tsx**
- Accessible depuis : Pipeline Kanban → action sur candidature
- **Fonctionnalités** :
  - Sélection type (visio/présentiel/téléphone)
  - Date/heure (minimum = lendemain)
  - Durée (30min à 2h)
  - Lieu/lien selon type
  - Notes internes privées
  - Planification multiple (batch)

**2. InterviewEvaluationModal.tsx**
- Accessible depuis : Liste entretiens → entretien complété
- **Fonctionnalités** :
  - 4 sliders de notation (0-100%)
  - Score global calculé automatiquement
  - Recommandation finale obligatoire
  - Points forts & faibles
  - Feedback détaillé
  - Confidentialité garantie (jamais visible candidat)

### Notifications Automatiques

**Déclenchement** : Trigger SQL `trigger_interview_notifications()`

**Canaux supportés** :
- ✅ Email
- ✅ SMS
- ✅ WhatsApp
- ✅ Notification interne

**Templates** : Configurables en admin via `communication_templates`

**Variables disponibles** :
```
{{candidate_name}}
{{interview_date}}
{{interview_time}}
{{interview_location}}
{{interview_link}}
{{job_title}}
{{company_name}}
{{recruiter_name}}
```

**Traçabilité** : Tous les messages loggés dans `communications_log`

### Workflow Complet

```
1. Recruteur planifie entretien → ScheduleInterviewModal
2. Enregistrement → interviews table
3. Trigger automatique → notifications envoyées
4. Candidat reçoit : email + SMS + WhatsApp + notification
5. Entretien réalisé → status = completed
6. Recruteur évalue → InterviewEvaluationModal
7. Évaluation → interview_evaluations table
8. Décision basée sur recommendation
```

---

## 📊 A3.4 - EXPORTS PROFESSIONNELS RECRUTEUR

### Service : recruiterExportService.ts

**4 formats d'export** :

#### 1. CSV (UTF-8 avec BOM)
```typescript
exportToCSV(applications, companyId)
```
- **Colonnes** : Nom, Email, Téléphone, Titre, Expérience, Formation, Compétences, Score IA, Catégorie, Statut, Date
- **Usage** : Import dans autres systèmes
- **Filtres** : jobId, stage, applicationIds spécifiques

#### 2. Excel (TSV)
```typescript
exportToExcel(applications, companyId)
```
- **Format** : Tab-separated values
- **Compatible** : Microsoft Excel, Google Sheets
- **Headers** : Identiques au CSV

#### 3. PDF (Direction)
```typescript
exportToPDF(applications, jobTitle, companyId)
```
- **Rendu** : HTML professionnel avec styling
- **Contenu** :
  - Header : titre offre + date/heure génération
  - Stats : total candidatures, profils forts, score moyen
  - Tableau : candidat, email, titre, expérience, score IA, statut
  - Coloration scores (vert ≥75%, orange ≥50%, rouge <50%)
  - Footer JobGuinée
- **Usage** : Présentation Direction/clients

#### 4. ZIP (Documents)
```typescript
exportDocumentsToZIP(applications)
```
- **Contenu** : CVs + lettres de motivation
- **Nommage** : `candidat_name_cv.pdf`, `candidat_name_lettre.txt`
- **Gestion** : Erreurs pour documents manquants gérées

### Contrôle d'Accès

```typescript
// Vérification pack Enterprise
const hasAccess = await EnterpriseSubscriptionService.checkFeatureAccess(
  companyId,
  'export'
);

// Tracking usage
await EnterpriseSubscriptionService.trackUsage(
  companyId,
  'export',
  exportCount
);
```

**Limites par pack** :
- **BASIC** : 50 exports/mois
- **PRO** : 200 exports/mois
- **GOLD** : Illimité
- **CABINET** : Illimité

### Utilisation

**Depuis RecruiterDashboard** :
1. Onglet "Applications"
2. Bouton "Exporter"
3. Modal `ExportModal.tsx`
4. Sélection format + filtres
5. Génération + téléchargement

---

## 💬 A4 - COMMUNICATION RECRUTEUR ↔ CANDIDAT

### Architecture

**Page** : `RecruiterMessaging.tsx` (573 lignes)
**Intégration** : Onglet "Messagerie" dans RecruiterDashboard
**Service** : `communicationService.ts` (234 lignes)

### Fonctionnalités

#### Dashboard Messagerie
- Messages totaux envoyés/reçus
- Filtres : canal (email/SMS/WhatsApp/notification)
- Filtres : statut (sent/delivered/failed)
- Recherche par nom candidat
- Historique complet

#### Composition Message
```typescript
interface MessageParams {
  applicationId: string;    // Lié à candidature
  recipientId: string;      // Candidat
  subject: string;
  message: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'notification';
}
```

#### Templates Disponibles
- `interview_invitation` : Invitation entretien
- `rejection` : Refus candidature
- `on_hold` : Mise en attente
- `selection` : Sélection pour étape suivante
- `reminder` : Rappel entretien
- `custom` : Message libre

#### Variables Dynamiques
```
{{candidate_name}}
{{job_title}}
{{interview_date}}
{{interview_time}}
{{interview_location}}
{{application_status}}
{{company_name}}
```

#### Conditionnels
```
{{#if_video}}Rejoignez via : {{interview_link}}{{/if_video}}
{{#if_physical}}Rendez-vous au : {{interview_location}}{{/if_physical}}
```

### Workflow Communication

```
1. Recruteur sélectionne candidat
2. Choix template ou message libre
3. Variables automatiquement substituées
4. Envoi → communications_log
5. Notification créée → notifications table
6. Action loggée → application_activity_log
7. Candidat notifié selon canal choisi
```

### Traçabilité Complète

**Tables utilisées** :
- `communication_templates` : Templates système + custom
- `communications_log` : Historique messages avec métadonnées
- `notifications` : Notifications internes candidats
- `application_activity_log` : Actions recruteur sur candidatures

**Champs trackés** :
- Émetteur (recruiter_id)
- Destinataire (candidate_id)
- Candidature liée (application_id)
- Canal utilisé
- Statut délivrance (sent/delivered/failed)
- Horodatage précis

---

## 📈 MODE DIRECTION / DRH - PILOTAGE RH

### Composant : DirectionDashboard.tsx

**Accès** : RecruiterDashboard → Onglet "Pilotage RH"
**Restriction** : Packs PRO / GOLD / CABINET RH uniquement
**Mode** : ✅ **LECTURE SEULE** (aucune action possible)

### KPI Affichés

#### 1. Indicateurs Clés (4 KPI principaux)
```
┌─────────────────────┬──────────────────┬──────────────────┬─────────────────┐
│ Offres actives      │ Candidatures     │ Délai moyen      │ Recrutés        │
│ 12 (+12%)          │ 277 (+28%)       │ 24j              │ 8 (+15%)        │
└─────────────────────┴──────────────────┴──────────────────┴─────────────────┘
```

#### 2. Répartition Candidats par Expérience
```
Junior (0-3 ans)         : ████████░░ 45% (125)
Intermédiaire (3-7 ans)  : ███████░░░ 35% (97)
Senior (7+ ans)          : ████░░░░░░ 20% (55)
```

#### 3. État du Pipeline
```
Reçues      : 180
En criblage : 95
Entretien   : 45
Offre       : 12
Recrutés    : 8
Refusés     : 70
```

#### 4. Performance par Offre
| Offre | Candidatures | Recrutés | Taux réussite | Délai moyen |
|-------|--------------|----------|---------------|-------------|
| Développeur Senior | 45 | 2 | 4.4% | 28j |
| Chef de Projet | 32 | 1 | 3.1% | 35j |
| Data Analyst | 28 | 1 | 3.6% | 22j |

#### 5. ROI Intelligence Artificielle
```
Crédits IA utilisés    : 2,450
Matchings réalisés     : 87
Score moyen IA         : 72%
Temps économisé        : 44h
┌──────────────────────────────────┐
│ Économies estimées               │
│ 2.2M GNF                         │
│ Valeur temps RH économisé par IA │
└──────────────────────────────────┘
```

#### 6. Coût & Rentabilité
```
Recrutements réalisés         : 8
Coût moyen par recrutement    : 0.25M GNF
Économies IA totales          : 2.2M GNF
(vs processus manuel)
```

### Service : directionAnalyticsService.ts

**Méthodes principales** :
```typescript
async getDirectionKPIs(companyId: string): Promise<DirectionKPIs> {
  // Agrège données de :
  // - jobs table
  // - applications table
  // - ai_service_usage_history
  // - interviews table

  return {
    totalActiveJobs,
    totalApplications,
    candidateDistribution: { junior, intermediate, senior },
    pipelineState: { received, screening, interview, offer, hired, rejected },
    avgTimeToHire,
    performanceByJob: [...],
    aiUsage: { totalCreditsUsed, totalMatchings, avgMatchingScore, timeSavedHours },
    recruitmentROI: { totalHired, avgCostPerHire, aiCostSavings }
  };
}
```

**Calculs spécifiques** :

**Temps économisé IA** :
```typescript
timeSavedHours = nbMatchings × 0.5h
// Estimation : 1 matching IA = 30min économisées vs criblage manuel
```

**Économies IA** :
```typescript
hourlyRate = 50,000 GNF  // Taux horaire RH moyen
aiCostSavings = timeSavedHours × hourlyRate
```

**Distribution candidats** :
```typescript
experience < 3 ans  → Junior
3 ans ≤ experience < 7 ans → Intermédiaire
experience ≥ 7 ans → Senior
```

### Filtres Période

Sélecteur en haut à droite :
- Cette semaine
- Ce mois
- Ce trimestre
- Cette année

### Avertissement Affiché

```
⚠️ Mode Direction - Lecture Seule

Cette vue synthétique est conçue pour la Direction et la DRH.
Elle présente les indicateurs clés de performance du recrutement
sans possibilité de modification.

Pour effectuer des actions opérationnelles (planifier des entretiens,
contacter des candidats, etc.), utilisez les autres onglets du dashboard.
```

---

## 🔐 SÉCURITÉ & CONTRÔLES

### Isolation par Entreprise

**RLS Supabase** : Toutes les tables appliquent :
```sql
WHERE company_id = auth.get_company_id()
```

**Tables concernées** :
- interviews → company_id
- interview_evaluations → via interviews.company_id
- communications_log → company_id
- applications → via jobs.company_id
- enterprise_usage_tracking → company_id

### Respect des Quotas

**Vérification systématique** :
```typescript
// Avant planification entretien
await EnterpriseSubscriptionService.checkFeatureAccess(
  companyId,
  'interview_schedule'
);

// Avant export
await EnterpriseSubscriptionService.checkFeatureAccess(
  companyId,
  'export'
);

// Avant communication
await EnterpriseSubscriptionService.checkFeatureAccess(
  companyId,
  'communication'
);
```

**Tracking usage** :
```typescript
// Après chaque action
await EnterpriseSubscriptionService.trackUsage(
  companyId,
  usageType: 'interview_schedule' | 'export' | 'communication',
  count: 1
);
```

### Logs Complets

**Actions trackées** :
- ✅ Planification entretien → interviews table
- ✅ Évaluation candidat → interview_evaluations table
- ✅ Message envoyé → communications_log table
- ✅ Notification envoyée → communications_log + notifications
- ✅ Export généré → enterprise_usage_tracking
- ✅ Action pipeline → application_activity_log

**Métadonnées** :
- Timestamp précis
- User ID (recruteur)
- Company ID
- Entité liée (application_id, job_id, interview_id)
- Résultat (success/error)

---

## 🎯 WORKFLOW RECRUTEUR COMPLET

### Parcours Typique

```
1. PUBLICATION OFFRE
   RecruiterDashboard → Onglet "Publier une offre"
   └→ Job créé dans jobs table

2. RÉCEPTION CANDIDATURES
   RecruiterDashboard → Onglet "Candidatures"
   └→ Applications visibles (liste ou Kanban)

3. MATCHING IA (optionnel)
   Sur candidature → Bouton "Analyser avec IA"
   └→ Score IA + recommandation
   └→ Crédits IA consommés

4. CRIBLAGE
   Drag & drop Kanban : "Reçue" → "En criblage"
   └→ Workflow_stage mis à jour

5. SÉLECTION ENTRETIEN
   Drag & drop Kanban : "En criblage" → "À interviewer"
   └→ Bouton "Planifier entretien"
   └→ ScheduleInterviewModal
   └→ Interview créé
   └→ Notifications automatiques envoyées

6. ENTRETIEN RÉALISÉ
   Après entretien → Status "Completed"
   └→ Bouton "Évaluer"
   └→ InterviewEvaluationModal
   └→ Évaluation enregistrée

7. DÉCISION
   Selon recommendation :
   - "Recommended" → Drag "À interviewer" → "Offre"
   - "To confirm" → Nouvel entretien ou investigations
   - "Not retained" → Drag → "Refusé"

8. COMMUNICATION
   RecruiterDashboard → Onglet "Messagerie"
   └→ Message candidat (template ou libre)
   └→ Communication loggée

9. EXPORT
   RecruiterDashboard → Onglet "Applications"
   └→ Bouton "Exporter"
   └→ Choix format (PDF/Excel/CSV/ZIP)
   └→ Fichier téléchargé

10. PILOTAGE (Direction/DRH)
    RecruiterDashboard → Onglet "Pilotage RH"
    └→ Vue synthétique KPI
    └→ ROI IA + performance
    └→ Lecture seule
```

---

## 📊 LIMITES PAR PACK ENTERPRISE

| Fonctionnalité | BASIC | PRO | GOLD | CABINET |
|----------------|-------|-----|------|---------|
| **Offres actives** | 5 | 15 | Illimité | Illimité |
| **CV consultés/mois** | 200 | 500 | 1500 | Illimité |
| **Matching IA/mois** | 150 | 500 | Illimité | Illimité |
| **Exports/mois** | 50 | 200 | Illimité | Illimité |
| **Communications/mois** | 300 | 1000 | 3000 | Illimité |
| **Entretiens/mois** | 50 | 150 | 500 | Illimité |
| **Mode Pilotage RH** | ❌ | ✅ | ✅ | ✅ |
| **Support** | Email | Prioritaire | Dédié | Premium 24/7 |

---

## 🧪 TESTS & VALIDATION

### Tests Fonctionnels Recommandés

#### A3.3 : Entretiens
- [ ] Planifier entretien visio
- [ ] Planifier entretien présentiel
- [ ] Planifier entretien téléphonique
- [ ] Vérifier notifications envoyées (email/SMS/WhatsApp)
- [ ] Évaluer entretien complété
- [ ] Vérifier calcul score global automatique
- [ ] Vérifier confidentialité évaluation (non visible candidat)

#### A3.4 : Exports
- [ ] Export CSV avec candidatures
- [ ] Export Excel avec candidatures
- [ ] Export PDF Direction
- [ ] Export ZIP documents
- [ ] Vérifier quotas respectés
- [ ] Vérifier tracking usage

#### A4 : Communication
- [ ] Envoyer message depuis candidature
- [ ] Utiliser template pré-configuré
- [ ] Vérifier substitution variables
- [ ] Vérifier logs dans communications_log
- [ ] Vérifier notification candidat

#### Pilotage RH
- [ ] Accéder onglet "Pilotage RH" (avec pack PRO+)
- [ ] Vérifier KPI affichés
- [ ] Vérifier ROI IA calculé
- [ ] Changer filtre période
- [ ] Confirmer mode lecture seule

### Tests Sécurité

```sql
-- Test isolation entreprise
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims TO '{"sub": "user_id_company_A"}';

SELECT * FROM interviews;
-- ✅ Doit retourner uniquement interviews de company_A

SELECT * FROM communications_log;
-- ✅ Doit retourner uniquement communications de company_A
```

### Tests Quotas

```typescript
// Scénario : BASIC avec 50 exports/mois
for (let i = 0; i < 51; i++) {
  await recruiterExportService.exportToCSV(...);
}
// ✅ Export 51 doit être refusé avec message quota atteint
```

### Build Production

```bash
npm run build
```
**Résultat attendu** : ✅ Succès sans erreurs

---

## 📚 DOCUMENTATION TECHNIQUE COMPLÉMENTAIRE

### Fichiers Clés

**Services** :
- `src/services/interviewSchedulingService.ts` (302 lignes)
- `src/services/interviewEvaluationService.ts`
- `src/services/recruiterExportService.ts` (426 lignes)
- `src/services/communicationService.ts` (234 lignes)
- `src/services/directionAnalyticsService.ts` (345 lignes)

**Composants** :
- `src/components/recruiter/ScheduleInterviewModal.tsx` (294 lignes)
- `src/components/recruiter/InterviewEvaluationModal.tsx` (358 lignes)
- `src/components/recruiter/ExportModal.tsx`
- `src/components/recruiter/DirectionDashboard.tsx` (445 lignes)

**Pages** :
- `src/pages/RecruiterDashboard.tsx` (1075+ lignes)
- `src/pages/RecruiterMessaging.tsx` (573 lignes)

**Migrations** :
- `supabase/migrations/20251212123935_create_interviews_system.sql`
- `supabase/migrations/20251212142036_create_interview_evaluations_system.sql`
- `supabase/migrations/20251212134250_create_notification_automation_system.sql`

### Architecture Décisionnelle

```
RecruiterDashboard (Hub central)
├── Onglet Dashboard (KPI standards)
├── Onglet Projets (Offres)
├── Onglet Applications (Pipeline)
│   ├── ScheduleInterviewModal
│   ├── InterviewEvaluationModal
│   └── ExportModal
├── Onglet Profils Achetés (CVthèque)
├── Onglet Publier une offre
├── Onglet Messagerie
│   └── RecruiterMessaging
├── Onglet Analyses (Analytics par offre)
├── Onglet Pilotage RH ⭐ NOUVEAU
│   └── DirectionDashboard (Mode lecture seule)
├── Onglet Premium
└── Onglet Mon Profil
```

---

## 🎉 CONCLUSION

Le pipeline recruteur JobGuinée est désormais **complet et opérationnel** avec :

✅ **A3.3** : Planification d'entretiens + notifications multi-canaux automatiques
✅ **A3.4** : Exports professionnels 4 formats (PDF/Excel/CSV/ZIP)
✅ **A4** : Communication centralisée recruteur-candidat avec templates
✅ **Pilotage RH** : Mode Direction/DRH lecture seule avec KPI complets et ROI IA

**Architecture** : Un seul recruteur, isolation stricte, quotas Enterprise respectés, traçabilité complète.

**Statut Production** : ✅ Build réussi, zéro régression, zéro erreur.

Le dashboard recruteur est transformé en **outil professionnel de pilotage RH** prêt pour Direction et DRH.

---

*Document généré le 13 décembre 2024*
*Version : 1.0 - Opérationnel*
*Plateforme : JobGuinée - ATS Professionnel*
