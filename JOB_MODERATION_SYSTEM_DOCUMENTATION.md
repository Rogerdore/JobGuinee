# Système de Modération des Offres d'Emploi

## Vue d'ensemble

Un système complet de modération a été implémenté pour valider toutes les offres d'emploi avant leur publication publique. Les recruteurs soumettent leurs offres, qui sont ensuite examinées et approuvées/rejetées par les administrateurs.

---

## Architecture du Système

### 1. Base de Données

#### Nouveaux Statuts pour `jobs`
- `draft` - Brouillon non soumis
- `pending` - En attente de modération
- `published` - Approuvé et visible publiquement
- `rejected` - Rejeté par l'admin
- `closed` - Fermé/expiré

#### Nouveaux Champs dans `jobs`
```sql
- submitted_at       : Date de soumission
- moderated_at       : Date de modération
- moderated_by       : ID de l'admin modérateur
- rejection_reason   : Raison du rejet
- moderation_notes   : Notes internes de l'admin
```

#### Nouvelle Table `job_moderation_history`
Historique complet de toutes les actions de modération:
- Actions: submitted, approved, rejected, republished
- Traçabilité: moderator, timestamps, raisons, notes
- Accessible aux admins et aux recruteurs concernés

---

## Workflow du Système

### Processus de Publication

```
┌─────────────────────────────────────────┐
│  1. Recruteur crée une offre           │
│     Status: 'draft' ou 'pending'       │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  2. Soumission du formulaire            │
│     Status changé en: 'pending'         │
│     submitted_at = now()                │
└───────────────┬─────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  3. Admin examine l'offre               │
│     Page: /admin-job-moderation         │
└───────────────┬─────────────────────────┘
                ↓
        ┌───────┴───────┐
        ↓               ↓
┌───────────────┐  ┌──────────────┐
│  APPROUVER    │  │   REJETER    │
└───────┬───────┘  └──────┬───────┘
        ↓                  ↓
┌───────────────┐  ┌──────────────┐
│ Status:       │  │ Status:      │
│ 'published'   │  │ 'rejected'   │
│               │  │              │
│ Visible       │  │ Notification │
│ publiquement  │  │ + raison     │
└───────┬───────┘  └──────┬───────┘
        ↓                  ↓
┌─────────────────────────────────────────┐
│  Notification envoyée au recruteur      │
│  - Type: job_approved / job_rejected    │
│  - Stockée dans table notifications     │
└─────────────────────────────────────────┘
```

---

## Fonctions SQL

### 1. `submit_job_for_moderation(p_job_id)`
Soumet une offre draft ou rejetée pour modération.

**Retour:**
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "pending"
}
```

### 2. `approve_job(p_job_id, p_notes)`
Approuve une offre en attente.

**Paramètres:**
- `p_job_id` (uuid) - ID de l'offre
- `p_notes` (text, optionnel) - Notes internes

**Actions:**
- Change status en 'published'
- Enregistre moderator_id et moderated_at
- Crée entrée dans job_moderation_history
- Envoie notification au recruteur

**Retour:**
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "published",
  "recruiter_email": "email@domain.com"
}
```

### 3. `reject_job(p_job_id, p_reason, p_notes)`
Rejette une offre en attente.

**Paramètres:**
- `p_job_id` (uuid) - ID de l'offre
- `p_reason` (text, REQUIS) - Raison du rejet
- `p_notes` (text, optionnel) - Notes internes

**Actions:**
- Change status en 'rejected'
- Enregistre rejection_reason, moderator_id et moderated_at
- Crée entrée dans job_moderation_history
- Envoie notification au recruteur avec la raison

**Retour:**
```json
{
  "success": true,
  "job_id": "uuid",
  "status": "rejected",
  "recruiter_email": "email@domain.com"
}
```

---

## Interface Admin

### Page de Modération
**URL:** `/admin-job-moderation`
**Accès:** Menu Admin → "Modération Offres"

#### Fonctionnalités

**1. Vue d'ensemble**
- Compteur d'offres en attente
- Filtres: Statut (pending/all)
- Recherche: titre, entreprise, recruteur, localisation

**2. Carte d'Offre**
Affiche pour chaque offre:
- Badge de statut (En attente, Approuvé, Rejeté)
- Informations: titre, entreprise, localisation, type de contrat
- Date de soumission
- Informations recruteur (nom, email)
- Bouton d'expansion pour détails complets

**3. Détails Étendus**
- Description complète
- Secteur, expérience, niveau d'études, nombre de postes
- Champ notes de modération
- Boutons d'action: Approuver / Rejeter

**4. Modal de Rejet**
- Champ obligatoire: Raison du rejet
- Champ optionnel: Notes internes
- La raison est envoyée au recruteur

**5. Historique de Modération**
- Toutes les actions passées sur l'offre
- Dates, modérateurs, actions, raisons
- Accessible via bouton "Historique"

---

## Interface Recruteur

### Dashboard - Section Offres

**Nouveaux Statuts Visibles:**
- 🟢 **Publié** - Approuvé, visible publiquement
- ⏳ **En attente** - Soumis, en cours de modération
- ❌ **Rejeté** - Refusé par l'admin
- 📝 **Brouillon** - Non soumis

### Notifications

Les recruteurs reçoivent des notifications dans leur interface:

**Approbation:**
```
Titre: Offre approuvée
Message: Votre offre "Titre" a été approuvée et est maintenant visible publiquement.
```

**Rejet:**
```
Titre: Offre rejetée
Message: Votre offre "Titre" a été rejetée. Raison: [raison fournie par l'admin]
```

### Message de Soumission

Après publication d'une offre:
```
✅ Offre soumise avec succès !

⏳ Votre offre est en attente de validation par notre équipe.
Vous recevrez une notification une fois qu'elle sera approuvée et visible publiquement.
```

---

## Politiques de Sécurité (RLS)

### Table `jobs`

**Public (non authentifié):**
- Peut voir uniquement les offres avec status = 'published'

**Recruteurs:**
- Voient toutes leurs offres (tous statuts)
- Peuvent créer des offres (automatiquement en 'pending')
- Peuvent modifier leurs offres en status 'draft' ou 'rejected'

**Admins:**
- Voient toutes les offres (tous statuts)
- Peuvent modifier toutes les offres
- Seuls autorisés à approuver/rejeter

### Table `job_moderation_history`

**Admins:**
- Peuvent tout voir et insérer

**Recruteurs:**
- Voient uniquement l'historique de leurs offres

---

## Tests et Validation

### Scénarios de Test

**1. Soumission d'Offre**
- Créer offre → Vérifier status = 'pending'
- Vérifier message de confirmation
- Vérifier offre non visible sur /jobs

**2. Approbation**
- Admin approuve offre
- Vérifier status = 'published'
- Vérifier offre visible sur /jobs
- Vérifier notification recruteur

**3. Rejet**
- Admin rejette avec raison
- Vérifier status = 'rejected'
- Vérifier offre non visible sur /jobs
- Vérifier notification recruteur avec raison
- Vérifier recruteur peut modifier et resoumettre

**4. Historique**
- Vérifier entrées créées à chaque action
- Vérifier traçabilité complète

**5. Sécurité**
- Public ne voit que published
- Recruteur ne peut pas auto-approuver
- Seul admin peut approuver/rejeter

---

## Migration Appliquée

**Fichier:** `add_job_moderation_system.sql`

**Contenu:**
- Ajout des nouveaux statuts à la contrainte CHECK
- Ajout des colonnes de modération à jobs
- Création de job_moderation_history
- Mise à jour des politiques RLS
- Création des fonctions approve_job, reject_job, submit_job_for_moderation

---

## Modifications Frontend

### Fichiers Créés
- `src/pages/AdminJobModeration.tsx` - Interface admin complète

### Fichiers Modifiés

**1. `src/pages/RecruiterDashboard.tsx`**
- Ligne 366: `status: 'pending'` au lieu de `'published'`
- Ligne 398: Nouveau message de confirmation
- Lignes 767-778: Affichage des nouveaux statuts

**2. `src/App.tsx`**
- Import de AdminJobModeration
- Ajout du type 'admin-job-moderation'
- Ajout de la route

**3. `src/components/AdminLayout.tsx`**
- Import de CheckCircle
- Ajout du bouton "Modération Offres"

---

## Impact et Bénéfices

### Avantages

**Contrôle Qualité:**
- Validation manuelle de chaque offre
- Prévention des offres inappropriées
- Vérification de la conformité

**Traçabilité:**
- Historique complet des décisions
- Identification des modérateurs
- Raisons documentées

**Communication:**
- Feedback automatique aux recruteurs
- Raisons de rejet explicites
- Notifications en temps réel

**Sécurité:**
- Politiques RLS strictes
- Séparation des rôles claire
- Audit trail complet

### Impact sur l'Expérience

**Recruteurs:**
- Délai d'attente pour validation
- Transparence sur le statut
- Possibilité de correction si rejeté

**Candidats:**
- Offres de meilleure qualité
- Contenu vérifié
- Pas d'offres frauduleuses

**Administrateurs:**
- Interface claire et efficace
- Workflow simple
- Historique accessible

---

## Prochaines Améliorations Possibles

### Court Terme
1. Edge function pour envoi d'emails en plus des notifications in-app
2. Templates de raisons de rejet prédéfinies
3. Système de priorité pour les offres urgentes

### Moyen Terme
1. Dashboard analytique de modération
2. Temps moyen de traitement
3. Statistiques d'approbation/rejet
4. Système de score de qualité d'offre

### Long Terme
1. Pré-modération automatique avec IA
2. Détection de contenu inapproprié
3. Suggestion d'améliorations
4. Modération collaborative

---

## Support et Contact

Pour toute question sur le système de modération:
- Documentation technique dans la migration SQL
- Code source dans `src/pages/AdminJobModeration.tsx`
- Tests à effectuer selon les scénarios ci-dessus

---

**Date d'Implémentation:** 15 décembre 2024
**Version:** 1.0
**Status:** ✅ Production Ready
