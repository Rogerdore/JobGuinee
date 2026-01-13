# Guide d'Utilisation des Fonctionnalités V2/V3 - Interface Utilisateur

## Vue d'ensemble

Ce guide explique comment accéder et utiliser toutes les nouvelles fonctionnalités V2/V3 visibles dans l'interface utilisateur.

---

## 🎯 Pour les Recruteurs

### 1. Export Calendrier des Entretiens (V2)

**Où trouver:**
- Dashboard Recruteur > Liste des entretiens
- Chaque carte d'entretien affiche un bouton "Exporter"

**Comment utiliser:**
1. Cliquez sur le bouton **"Exporter"** sur une carte d'entretien
2. Choisissez une option:
   - **Télécharger .ics** : Fichier compatible avec tous les calendriers
   - **Google Calendar** : S'ouvre directement dans Google Calendar
   - **Outlook** : S'ouvre directement dans Outlook

**Fonctionnalités:**
- ✅ Rappels automatiques intégrés (J-1 et 2h avant)
- ✅ Toutes les informations de l'entretien incluses
- ✅ Participants ajoutés automatiquement

**Composant:** `InterviewCard.tsx`

---

### 2. Évaluation Post-Entretien avec Scoring (V2)

**Où trouver:**
- Dashboard Recruteur > Liste des entretiens
- Bouton **"Évaluer"** visible uniquement pour les entretiens terminés

**Comment utiliser:**
1. Cliquez sur **"Évaluer"** sur un entretien terminé
2. Ajustez les scores avec les sliders:
   - **Compétences Techniques** (30%)
   - **Soft Skills** (25%)
   - **Motivation** (25%)
   - **Adéquation Culturelle** (20%)
3. Le **Score Global** est calculé automatiquement
4. Sélectionnez une recommandation:
   - 🟢 **Recommandé** : À recruter
   - 🟡 **À confirmer** : Besoin de vérifications
   - 🔴 **Non retenu** : Éliminé
5. Ajoutez des commentaires:
   - Points forts
   - Points d'amélioration
   - Feedback détaillé
   - Notes pour la décision finale
6. Cliquez sur **"Enregistrer l'évaluation"**

**Important:**
- ❌ Les évaluations ne sont JAMAIS visibles par les candidats
- ✅ Seuls les recruteurs de votre entreprise y ont accès
- ✅ Vous pouvez modifier vos propres évaluations

**Composant:** `InterviewEvaluationModal.tsx`

---

### 3. Comparaison des Candidats (V2)

**Où trouver:**
- Dashboard Recruteur > Détails d'une offre
- Bouton **"Comparer les candidats"**

**Comment utiliser:**
1. Accédez aux détails d'une offre d'emploi
2. Cliquez sur **"Comparer les candidats"**
3. Visualisez tous les candidats avec:
   - Score IA initial
   - Score d'entretien global
   - Scores détaillés (technique, soft skills, motivation, culture)
   - Recommandation
   - Statut dans le pipeline
4. Les candidats sont triés par score (meilleurs en premier)
5. Si vous avez un pack Enterprise PRO/GOLD/Cabinet RH:
   - Cliquez sur **"Rapport PDF"** pour télécharger le rapport institutionnel

**Fonctionnalités:**
- ✅ Vue consolidée de tous les candidats
- ✅ Comparaison visuelle des scores
- ✅ Identification rapide des meilleurs profils
- ✅ Export PDF pour Enterprise

**Composant:** `CandidateComparisonModal.tsx`

---

### 4. Rapport PDF Institutionnel (V3)

**Où trouver:**
- Modal "Comparaison des candidats" > Bouton **"Rapport PDF"**

**Prérequis:**
- ⭐ Pack **Enterprise PRO**, **Enterprise GOLD** ou **Cabinet RH**

**Contenu du rapport:**
- Statistiques globales du recrutement
- Candidatures reçues, shortlistés, entretiens
- Score IA moyen et score entretien moyen
- Temps moyen de recrutement
- Répartition par étape du pipeline
- Top 10 candidats avec tous leurs scores
- Format professionnel prêt à présenter

**Limites mensuelles:**
- Enterprise BASIC: 5 rapports/mois
- Enterprise PRO: 20 rapports/mois
- Enterprise GOLD: 100 rapports/mois
- Cabinet RH: 200 rapports/mois

**Service:** `institutionalReportingService.ts`

---

## ⚙️ Pour les Administrateurs

### 5. Gestion des Automations (V3)

**Où trouver:**
- Menu Admin > Bouton **"Automations"** (icône éclair ⚡)
- URL: `/admin-automation-rules`

**Comment utiliser:**

#### A. Sélectionner une entreprise
1. Choisissez l'entreprise dans le menu déroulant en haut
2. Les règles d'automation de cette entreprise s'affichent

#### B. Configurer les Relances Candidats
- **Activer/Désactiver** : Toggle en haut à droite de la carte
- **Configuration** :
  - Délai première relance (1-10 jours)
  - Délai deuxième relance (1-15 jours)
  - Nombre max de relances (1, 2 ou 3)
- Les relances sont envoyées automatiquement si le candidat ne répond pas

#### C. Configurer les Rappels d'Entretien
- **Activer/Désactiver** : Toggle en haut à droite de la carte
- **Options** :
  - ☑️ Envoyer rappel J-1
  - ☑️ Envoyer rappel 2h avant
  - ☑️ Notifier le candidat
  - ☑️ Notifier le recruteur
- Les rappels sont créés automatiquement lors de la planification d'un entretien

#### D. Configurer les Notifications de Fermeture
- **Activer/Désactiver** : Toggle en haut à droite de la carte
- **Options** :
  - ☑️ Notifier les candidats en attente
  - ☑️ Archiver automatiquement les candidatures
- Les notifications sont envoyées automatiquement quand une offre est clôturée

**Règles par défaut:**
Chaque nouvelle entreprise reçoit automatiquement des règles activées avec des paramètres par défaut optimaux.

**Page:** `AdminAutomationRules.tsx`

---

## 📊 Architecture des Composants

### Nouveaux Composants Frontend

```
src/
├── components/
│   └── recruiter/
│       ├── InterviewCard.tsx              # Carte entretien avec export calendrier
│       ├── InterviewEvaluationModal.tsx   # Modal d'évaluation post-entretien
│       └── CandidateComparisonModal.tsx   # Comparaison candidats + rapport PDF
├── pages/
│   └── AdminAutomationRules.tsx           # Page admin des automations
└── services/
    ├── calendarExportService.ts           # Service export ICS
    ├── interviewEvaluationService.ts      # Service évaluations
    ├── institutionalReportingService.ts   # Service rapports PDF
    └── recruitmentAutomationService.ts    # Service automations
```

---

## 🔄 Flux d'Utilisation Typiques

### Flux 1: Planification et Suivi d'Entretien

1. **Recruteur** planifie un entretien via le modal existant
2. ⚡ **Automation** : Rappels J-1 et 2h avant créés automatiquement
3. **Candidat et Recruteur** reçoivent les rappels
4. **Recruteur** exporte l'entretien vers son calendrier (Google/Outlook/ICS)
5. Entretien réalisé → **Recruteur** clique sur **"Évaluer"**
6. **Recruteur** saisit les scores et commentaires
7. L'évaluation est enregistrée de manière confidentielle

### Flux 2: Décision d'Embauche

1. **Recruteur** ouvre les détails d'une offre
2. Clique sur **"Comparer les candidats"**
3. Visualise tous les candidats avec scores IA et entretiens
4. Identifie les meilleurs profils (recommandés en vert)
5. Si Enterprise : Génère le **rapport PDF** pour la direction
6. Prend la décision d'embauche basée sur les données objectives

### Flux 3: Configuration des Automations

1. **Admin** accède au menu Automations
2. Sélectionne une entreprise
3. Active/désactive les règles selon les besoins
4. Ajuste les paramètres (délais, options)
5. Les automations s'appliquent immédiatement
6. Consulte les logs d'exécution pour suivi

---

## 🎨 Design et UX

### Codes Couleurs

**Recommandations:**
- 🟢 Vert : Recommandé
- 🟡 Jaune : À confirmer
- 🔴 Rouge : Non retenu

**Scores:**
- 🟢 Vert (80-100%) : Excellent
- 🟡 Jaune (60-79%) : Bon
- 🟠 Orange (40-59%) : Moyen
- 🔴 Rouge (0-39%) : Faible

**Automations:**
- 🔵 Bleu : Relances candidats
- 🟢 Vert : Rappels entretiens
- 🟠 Orange : Notifications fermeture

### Icônes

- ⭐ Star : Évaluations
- 📅 Calendar : Calendrier/Entretiens
- ⚡ Zap : Automations
- 📊 TrendingUp : Comparaisons
- 📄 Download : Exports

---

## 🔒 Sécurité et Confidentialité

### Évaluations Post-Entretien
- ❌ **JAMAIS** visibles par les candidats
- ✅ Accessibles uniquement par les recruteurs de l'entreprise
- ✅ Modification uniquement par le créateur
- ✅ Logs complets de toutes les actions

### Rapports PDF
- ✅ Accès restreint aux packs Enterprise PRO/GOLD/Cabinet RH
- ✅ Limites mensuelles strictes par pack
- ✅ Tracking de chaque génération
- ✅ Données anonymisées si nécessaire

### Automations
- ✅ Configuration par entreprise
- ✅ Logs d'exécution complets
- ✅ Activation/désactivation instantanée
- ✅ Aucune action destructive

---

## 📱 Compatibilité

### Export Calendrier
- ✅ Google Calendar
- ✅ Microsoft Outlook
- ✅ Apple Calendar
- ✅ Tout calendrier compatible .ics

### Rapports PDF
- ✅ Téléchargement direct
- ✅ Compatible tous navigateurs
- ✅ Imprimable
- ✅ Format A4 standard

### Responsive
- ✅ Desktop (optimisé)
- ✅ Tablette
- ⚠️ Mobile (basique)

---

## 🐛 Dépannage

### "Le bouton Exporter est désactivé"
→ L'entretien est passé. L'export n'est possible que pour les entretiens futurs.

### "Pas de bouton Évaluer"
→ Le bouton n'apparaît que pour les entretiens avec statut "Terminé".

### "Erreur lors de la génération du rapport"
→ Vérifiez que vous avez un pack Enterprise PRO/GOLD/Cabinet RH actif et que vous n'avez pas dépassé votre limite mensuelle.

### "Les automations ne s'exécutent pas"
→ Vérifiez que les règles sont activées dans la page Admin > Automations.

---

## 📚 Ressources

- **Documentation technique** : `V2_V3_PIPELINE_EXTENSIONS.md`
- **Services backend** : `/src/services/*`
- **Composants UI** : `/src/components/recruiter/*`
- **Page admin** : `/src/pages/AdminAutomationRules.tsx`

---

**Dernière mise à jour** : 12 décembre 2024
**Version** : Frontend V2/V3
**Statut** : ✅ Production Ready

---

## 🎯 Points d'Entrée Visuels

Pour vous aider à trouver rapidement les nouvelles fonctionnalités:

1. **Dashboard Recruteur** → Cartes d'entretiens → Boutons "Exporter" et "Évaluer"
2. **Dashboard Recruteur** → Détails offre → Bouton "Comparer les candidats"
3. **Menu Admin** (en haut) → Bouton "Automations" (icône éclair ⚡)
4. **Modal Comparaison** → Bouton "Rapport PDF" (si Enterprise)

Toutes les fonctionnalités sont maintenant **visuellement accessibles** et **prêtes à l'emploi** ! 🎉
