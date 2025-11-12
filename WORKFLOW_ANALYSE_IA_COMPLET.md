# 🧭 Workflow Complet - Analyse IA de Profil

## Description Simple et Structurée

Ce document décrit le workflow complet de la fonctionnalité **Analyse IA de Profil**, de bout en bout, tel qu'implémenté dans JobGuinée.

---

## 1️⃣ Déclenchement du Service

**Action utilisateur:**
Le candidat, depuis son tableau de bord, clique sur le bouton **"⚡ Utiliser le service"** de la carte **Analyse IA de profil**.

**Localisation:**
```
Dashboard Candidat → Services Premium → Carte "Analyse IA de Profil"
```

**Interface:**
```
┌────────────────────────────────────┐
│  🧠 Analyse IA de Profil           │
│                                    │
│  Score de compatibilité            │
│  + Recommandations personnalisées  │
│                                    │
│  Crédits: Illimité (999)           │
│                                    │
│  [⚡ Utiliser le service]          │
└────────────────────────────────────┘
```

**Résultat:** Déclenchement du workflow et redirection vers l'interface d'analyse.

---

## 2️⃣ Vérification des Conditions d'Accès

**Contrôles automatiques effectués:**

### Vérification 1: Utilisateur authentifié
```typescript
if (!user) {
  return error('Vous devez être connecté');
}
```

### Vérification 2: Profil candidat existe
```sql
SELECT * FROM candidate_profiles WHERE id = user_id;
```

**Si profil non trouvé:**
```
❌ Erreur

Profil candidat non trouvé.
Veuillez compléter votre profil avant d'utiliser ce service.

[Compléter mon profil →]
```

### Vérification 3: Crédits disponibles (Service Illimité)

**Note:** L'Analyse IA de Profil dispose de **crédits illimités (999)**.
- ✅ Pas de déduction de crédits
- ✅ Service inclus gratuitement
- ✅ Utilisation sans limite

**Si besoin était de vérifier les crédits (pour autres services):**
```sql
SELECT credits_ia FROM subscriptions
WHERE user_id = ? AND is_active = true;
```

**Message si insuffisant (non applicable ici):**
```
⚠️ Accès Premium Requis

Ce service est réservé aux membres Premium
disposant de crédits IA actifs.

[Passer au plan Premium →]
```

**Résultat:** Si toutes les conditions sont remplies → Workflow continue.

---

## 3️⃣ Chargement du Profil Candidat

**Récupération automatique des données:**

```sql
-- Profil de base
SELECT
  full_name,
  email,
  user_type
FROM profiles
WHERE id = user_id;

-- Profil candidat complet
SELECT
  experience_years,
  experience_level,
  education_level,
  skills,
  work_history,
  education_history,
  certifications,
  languages,
  bio,
  linkedin_url,
  portfolio_url,
  profile_completion_percentage
FROM candidate_profiles
WHERE id = user_id;
```

**Données utilisées pour l'analyse:**
- ✅ Nom complet
- ✅ Poste recherché
- ✅ Compétences (skills)
- ✅ Expériences professionnelles (work_history)
- ✅ Formations (education_history)
- ✅ Langues maîtrisées
- ✅ Certifications
- ✅ Années d'expérience
- ✅ Niveau d'études

**Aucune saisie manuelle requise** - Tout est automatique!

---

## 4️⃣ Sélection d'une Offre d'Emploi

**Interface de choix:**

Le candidat a **deux options**:

### Option A: Comparer avec une offre existante

**Bouton principal:**
```
┌──────────────────────────────────────┐
│  [💼 Comparer avec une offre]        │
└──────────────────────────────────────┘
```

**Modal de sélection:**
```
┌────────────────────────────────────────┐
│  Sélectionner une offre                │
│  [🔍 Rechercher...]                    │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 💼 Développeur Full Stack        │ │
│  │    SOTELGUI                      │ │
│  │    Conakry, Guinée               │ │
│  └──────────────────────────────────┘ │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ 💼 Responsable RH                │ │
│  │    Orange Guinée                 │ │
│  │    Conakry, Guinée               │ │
│  └──────────────────────────────────┘ │
│                                        │
│  Ou saisissez manuellement:            │
│  [___________________________]         │
│  [Analyser avec ce poste →]            │
└────────────────────────────────────────┘
```

**Fonctionnalités:**
- ✅ Recherche en temps réel (titre/entreprise)
- ✅ Liste de toutes les offres publiées
- ✅ Clic pour sélectionner
- ✅ Analyse lancée automatiquement

### Option B: Saisie manuelle d'un poste

**Champ texte:**
```
Ou saisissez un poste manuellement:
[Ex: Responsable RH____________________]

[Analyser avec ce poste →]
```

**Utilisation:**
- Si le poste recherché n'est pas dans les offres
- Pour une analyse générique
- Pour un secteur spécifique

### Option C: Analyse générale

**Bouton secondaire:**
```
┌──────────────────────────────────────┐
│  [✨ Analyse générale]                │
└──────────────────────────────────────┘
```

**Utilisation:**
- Analyse du profil sans offre spécifique
- Score basé uniquement sur les qualités du profil
- Recommandations générales

---

## 5️⃣ Envoi des Données à l'IA

**Construction du prompt automatique:**

```typescript
const prompt = `
Agis comme un expert RH et consultant carrière.

Analyse le profil suivant:
Nom: ${profile.full_name}
Expérience: ${profile.experience_years} ans
Niveau: ${profile.experience_level}
Formation: ${profile.education_level}
Compétences: ${profile.skills.join(', ')}
Certifications: ${profile.certifications.length}

${offerSelected ? `
Compare-le avec l'offre suivante:
Poste: ${offer.title}
Entreprise: ${offer.company}
Exigences: ${offer.requirements}
` : 'Analyse générale du profil'}

Fournis un score de compatibilité (0-100%) et des recommandations.
`;
```

**Appel à l'API IA:**
```typescript
const { data } = await supabase.rpc('analyze_profile_with_ai', {
  p_user_id: user.id,
  p_offer_id: selectedJobId || null,
  p_manual_position: manualPosition || null
});
```

**Traitement backend (PostgreSQL):**

1. **Calcul du score:**
   - Si offre sélectionnée: Matching détaillé (skills, experience, education)
   - Sinon: Score basé sur la qualité du profil

2. **Génération des points forts:**
   - Analyse de l'expérience
   - Évaluation des compétences
   - Appréciation de la formation
   - Valorisation des certifications

3. **Identification des améliorations:**
   - LinkedIn manquant
   - Portfolio absent
   - Certifications à obtenir
   - Bio à développer

4. **Suggestions de formations:**
   - 4-6 formations adaptées au profil
   - Domaines, durées, niveaux
   - Pertinentes pour le marché guinéen

5. **Recommandations stratégiques:**
   - Conseils personnalisés
   - Actions concrètes
   - Optimisation du profil

---

## 6️⃣ Traitement et Enregistrement des Résultats

**Backend reçoit la réponse et:**

### 1. Enregistrement en base de données

```sql
INSERT INTO ai_profile_analysis (
  user_id,
  offer_id,
  score,
  points_forts,
  ameliorations,
  formations_suggerees,
  recommandations,
  rapport_json,
  offer_title,
  offer_company,
  analysis_params,
  status
) VALUES (...);
```

**Champs enregistrés:**
- Score global (0-100%)
- Scores détaillés (skills, experience, education)
- Points forts (array)
- Améliorations (array)
- Formations suggérées (array d'objets)
- Recommandations (array)
- Titre de l'offre (si applicable)
- Entreprise (si applicable)
- Date d'analyse
- Statut: 'completed'

### 2. Pas de déduction de crédits

**Service illimité** - Aucun crédit déduit.

### 3. Génération du rapport

**Rapport HTML (optionnel):**
- Structure complète
- Prêt pour export PDF
- Design professionnel

**Rapport JSON (toujours):**
- Données structurées
- Facile à afficher
- Stockage efficace

---

## 7️⃣ Affichage du Rapport d'Analyse

**Interface complète avec toutes les sections:**

### Section 1: Score Global

```
┌────────────────────────────────────┐
│  VOTRE ANALYSE IA     [📥 PDF]     │
│  Pour: Développeur Full Stack      │
│  chez SOTELGUI                     │
├────────────────────────────────────┤
│                                    │
│  Score Global: 82%                 │
│  ████████████████░░░░              │
│  Excellent                         │
│                                    │
│  Compétences: 75%                  │
│  Expérience: 90%                   │
│  Formation: 95%                    │
└────────────────────────────────────┘
```

**Éléments visuels:**
- Score en gros chiffres
- Barre de progression colorée
- Label (Excellent/Bon/Moyen/À améliorer)
- Scores détaillés si offre comparée

**Couleurs dynamiques:**
- 80-100%: Vert (Excellent)
- 60-79%: Bleu (Bon)
- 40-59%: Orange (Moyen)
- 0-39%: Rouge (À améliorer)

### Section 2: Points Forts ✅

```
┌────────────────────────────────────┐
│  ✅ Points Forts                   │
├────────────────────────────────────┤
│  • Solide expérience de 5 ans     │
│  • Large palette de compétences   │
│  • Formation universitaire solide │
│  • Certifications reconnues       │
│  • Capacités multilingues         │
└────────────────────────────────────┘
```

**Design:**
- Icône CheckCircle2 verte
- Liste à puces
- Texte descriptif
- Fond blanc avec ombre

### Section 3: Points à Améliorer ⚠️

```
┌────────────────────────────────────┐
│  ⚠️ Points à Améliorer             │
├────────────────────────────────────┤
│  • Créer un profil LinkedIn        │
│  • Développer un portfolio         │
│  • Obtenir des certifications      │
│  • Développer la bio               │
└────────────────────────────────────┘
```

**Design:**
- Icône AlertCircle orange
- Liste à puces
- Conseils actionnables
- Fond blanc avec ombre

### Section 4: Formations Suggérées 🎓

```
┌────────────────────────────────────┐
│  🎓 Formations Suggérées           │
├────────────────────────────────────┤
│  ┌─────────────────────────────┐  │
│  │ Leadership et Management    │  │
│  │ 🎯 Management               │  │
│  │ ⏱️ 3 mois                   │  │
│  │ 📊 Niveau: Intermédiaire    │  │
│  └─────────────────────────────┘  │
│                                    │
│  ┌─────────────────────────────┐  │
│  │ Communication Pro           │  │
│  │ 🎯 Soft Skills              │  │
│  │ ⏱️ 2 mois                   │  │
│  │ 📊 Niveau: Tous niveaux     │  │
│  └─────────────────────────────┘  │
└────────────────────────────────────┘
```

**Design:**
- Icône GraduationCap violette
- Grille 2 colonnes
- Cartes avec bordures
- Hover effect

**Informations par formation:**
- Titre complet
- Domaine
- Durée estimée
- Niveau requis

### Section 5: Recommandations 💡

```
┌────────────────────────────────────┐
│  💡 Recommandations                │
├────────────────────────────────────┤
│  ① Mettez à jour votre CV          │
│  ② Développez votre réseau         │
│  ③ Obtenez des recommandations     │
│  ④ Complétez JobGuinée à 100%      │
│  ⑤ Préparez vos entretiens         │
└────────────────────────────────────┘
```

**Design:**
- Icône Lightbulb jaune
- Liste numérotée
- Badges ronds colorés
- Conseils stratégiques

### Boutons d'Action

```
[Nouvelle analyse]  [📥 Télécharger le rapport]
```

**Actions:**
- Nouvelle analyse: Relance le processus
- Télécharger: Export PDF du rapport

---

## 8️⃣ Historisation et Consultation

**Section "Mes Analyses IA":**

### Accès

**Bouton "Historique" en haut:**
```
[📊 Historique]
```

### Affichage

```
┌────────────────────────────────────┐
│  MES ANALYSES PRÉCÉDENTES          │
├────────────────────────────────────┤
│  ┌────────────────────────────┐   │
│  │ [82%]  Analyse générale    │   │
│  │        12 novembre 2025    │   │
│  │        [Voir →]            │   │
│  └────────────────────────────┘   │
│                                    │
│  ┌────────────────────────────┐   │
│  │ [75%]  Développeur         │   │
│  │        SOTELGUI            │   │
│  │        10 novembre 2025    │   │
│  │        [Voir →]            │   │
│  └────────────────────────────┘   │
└────────────────────────────────────┘
```

**Informations affichées:**
- Score de l'analyse
- Titre/Poste analysé
- Entreprise (si applicable)
- Date de génération
- Bouton pour revoir

**Fonctionnalités:**
- Tri chronologique (plus récent en premier)
- Clic pour afficher l'analyse complète
- Illimité (toutes les analyses sauvegardées)
- Recherche/filtres (futur)

**Requête SQL:**
```sql
SELECT * FROM get_user_profile_analyses(
  p_user_id := user_id,
  p_limit := 20
);
```

---

## 9️⃣ Gestion Automatique des Crédits IA

### Service Illimité

**Analyse IA de Profil:**
- ✅ Crédits: 999 (illimités)
- ✅ Aucune déduction
- ✅ Service gratuit inclus
- ✅ Utilisation sans limite

**Compteur visuel (si applicable pour autres services):**
```
Crédits disponibles: 999 / 999
```

**Message si épuisés (non applicable ici):**
```
❌ Crédits IA épuisés

Vous n'avez plus de crédits IA disponibles.
Rechargez votre compte Premium pour continuer.

[Recharger →]
```

**Désactivation du bouton:**
- Service désactivé si 0 crédits
- Message d'alerte affiché
- Lien vers recharge

**Pour d'autres services premium:**
```sql
-- Déduction de crédits
UPDATE premium_credits
SET credits_available = credits_available - 1
WHERE user_id = ? AND service_type = ?;
```

---

## 🔟 Notification de Fin d'Analyse

**Notification interne:**

```javascript
await supabase.from('notifications').insert({
  user_id: user.id,
  title: 'Analyse de profil terminée',
  message: 'Votre score de compatibilité est de 82%',
  type: 'success'
});
```

**Affichage:**
```
┌────────────────────────────────────┐
│  🔔 Nouvelle notification          │
├────────────────────────────────────┤
│  ✅ Analyse de profil terminée     │
│                                    │
│  Votre score de compatibilité est │
│  de 82%. Consultez votre rapport  │
│  complet dans votre dashboard.    │
│                                    │
│  Il y a quelques secondes          │
└────────────────────────────────────┘
```

**Email (optionnel - futur):**
```
De: JobGuinée <noreply@jobguinee.com>
À: candidat@email.com
Sujet: Votre analyse IA de profil est prête

Bonjour [Nom],

Votre analyse IA de profil est terminée !

Score de compatibilité: 82%
Poste analysé: Développeur Full Stack

Consultez votre rapport complet avec toutes les
recommandations personnalisées.

[Voir mon analyse →]

L'équipe JobGuinée
```

---

## 📊 Résumé du Workflow (Vue d'Ensemble)

```
1. DÉCLENCHEMENT
   Clic "Utiliser le service"
   ↓
2. VÉRIFICATION
   ✓ Utilisateur authentifié
   ✓ Profil candidat existe
   ✓ Crédits suffisants (illimités)
   ↓
3. CHARGEMENT PROFIL
   Récupération automatique des données
   ↓
4. SÉLECTION OFFRE
   A) Choisir une offre existante
   B) Saisir un poste manuellement
   C) Analyse générale
   ↓
5. ENVOI À L'IA
   Prompt automatique construit
   Analyse intelligente
   ↓
6. TRAITEMENT
   ✓ Calcul du score
   ✓ Génération recommandations
   ✓ Enregistrement en BDD
   ✓ Pas de déduction crédits
   ↓
7. AFFICHAGE
   Rapport complet visible:
   - Score global
   - Points forts
   - Améliorations
   - Formations
   - Recommandations
   ↓
8. HISTORIQUE
   Analyse sauvegardée
   Accessible à tout moment
   ↓
9. GESTION CRÉDITS
   Service illimité
   Pas de déduction
   ↓
10. NOTIFICATION
    🔔 Alerte de succès
    📧 Email (optionnel)
```

---

## 🎯 Points Clés du Workflow

### ✅ Avantages

1. **Service Illimité**
   - Crédits: 999 (jamais épuisés)
   - Utilisation sans restriction
   - Inclus gratuitement

2. **Sélection Flexible**
   - Comparer avec offres réelles
   - Saisie manuelle de poste
   - Analyse générale possible

3. **Automatisation Complète**
   - Aucune saisie manuelle
   - Données du profil récupérées automatiquement
   - Prompt généré dynamiquement

4. **Analyse Détaillée**
   - Score global 0-100%
   - Scores détaillés (skills, experience, education)
   - 5 sections complètes

5. **Historique Complet**
   - Toutes les analyses sauvegardées
   - Consultation illimitée
   - Comparaison possible

6. **Notifications**
   - Alerte immédiate
   - Email (optionnel)
   - Centre de notifications

7. **Export PDF**
   - Téléchargement du rapport
   - Format professionnel
   - Partage facilité

### 🔧 Technologies

**Backend:**
- PostgreSQL (Supabase)
- Fonctions SQL (PL/pgSQL)
- Row Level Security (RLS)

**Frontend:**
- React + TypeScript
- TailwindCSS
- Lucide Icons

**API:**
- Supabase RPC
- Real-time updates
- Secure authentication

---

## 📞 Support

**Questions sur le workflow:**
- Documentation complète disponible
- Support technique 24/7
- Vidéos tutoriels

**Contact:**
- Email: support@jobguinee.com
- Chat: Disponible dans l'app

---

**Version:** 2.0.0
**Date:** 12 Novembre 2025
**Status:** ✅ 100% OPÉRATIONNEL
