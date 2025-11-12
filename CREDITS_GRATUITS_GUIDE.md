# 🎁 Guide des Crédits Gratuits - JobGuinée

## 📋 Vue d'Ensemble

Tous les nouveaux candidats qui s'inscrivent sur JobGuinée reçoivent automatiquement des **crédits gratuits** pour tester l'ensemble des services premium IA, d'une valeur totale de **600,000 GNF** !

## ✨ Crédits Gratuits Attribués

### Services Illimités (Inclus)

#### 🧠 Analyse IA de Profil
- **Crédits:** Illimité (999)
- **Valeur:** Inclus gratuitement
- **Fonctionnalités:**
  - Analyse complète du profil
  - Score de compatibilité avec offres
  - Suggestions de formations
  - Recommandations d'amélioration

#### 🔔 Alertes IA Ciblées
- **Crédits:** Illimité (999)
- **Valeur:** Inclus gratuitement
- **Fonctionnalités:**
  - Alertes intelligentes personnalisées
  - Matching avancé IA
  - Notifications multi-canal
  - Suggestions d'offres similaires

### Services avec Crédits de Test

#### 📄 Création CV/Lettre IA
- **Crédits gratuits:** 2 générations
- **Valeur:** 200,000 GNF (2 × 100,000)
- **Utilisation:**
  - Générez 2 CV professionnels GRATUITS
  - Ou 2 lettres de motivation
  - Ou 1 CV + 1 lettre
  - Design moderne et ATS-friendly
  - Export PDF haute qualité

#### 💬 Chatbot Travail & Emploi
- **Crédits gratuits:** 100 requêtes
- **Valeur:** Inclus
- **Utilisation:**
  - 100 questions sur le Code du Travail guinéen
  - Conseils juridiques emploi
  - Réponses instantanées 24/7
  - Historique des conversations

#### 📊 Rapport Mensuel IA
- **Crédits gratuits:** 1 rapport
- **Valeur:** 150,000 GNF
- **Utilisation:**
  - 1 rapport détaillé GRATUIT
  - Statistiques complètes de candidatures
  - Analyse de performance
  - Recommandations stratégiques

#### 🎯 Coaching Carrière IA
- **Crédits gratuits:** 1 session
- **Valeur:** 250,000 GNF
- **Utilisation:**
  - 1 session de coaching GRATUITE
  - Simulation d'entretien réaliste
  - Feedback personnalisé détaillé
  - Préparation aux questions techniques

## 💰 Valeur Totale des Crédits

**Total:** 600,000 GNF de crédits gratuits !

```
Création CV/Lettre:  200,000 GNF (2 crédits)
Rapport mensuel:     150,000 GNF (1 crédit)
Coaching carrière:   250,000 GNF (1 session)
Services illimités:  Inclus
─────────────────────────────────────
TOTAL:              600,000 GNF
```

## 🚀 Comment Ça Marche ?

### Attribution Automatique

**1. Lors de l'inscription:**
```
Nouveau candidat s'inscrit
    ↓
Création du profil candidat
    ↓
🎁 TRIGGER AUTOMATIQUE
    ↓
Attribution de tous les crédits gratuits
    ↓
Notification dans le dashboard
```

**2. Technologies:**
- Trigger PostgreSQL sur table `profiles`
- Fonction `auto_initialize_premium_on_profile_creation()`
- Attribution en quelques millisecondes
- Aucune action manuelle requise

### Modal de Bienvenue

**Affichage automatique:**
- S'affiche 2 secondes après la première connexion
- Design festif et coloré
- Liste complète des crédits reçus
- Valeur totale affichée
- Boutons d'action vers les services

**Contenu du modal:**
- 🎉 Message de bienvenue
- 💎 Valeur totale des crédits
- 📋 Liste détaillée par service
- ℹ️ Instructions d'utilisation
- 🚀 Bouton "Découvrir les services"

## 📖 Guide d'Utilisation

### Pour les Candidats

#### 1. Voir ses Crédits

**Option A:** Dashboard
```
Dashboard → Onglet "Services Premium"
Voir les crédits disponibles sur chaque carte
```

**Option B:** Modal de bienvenue
```
Affichage automatique à la première connexion
Liste complète des crédits reçus
```

#### 2. Utiliser les Crédits

**Étape 1:** Accéder au service
```
Dashboard → Services Premium → Sélectionner un service
```

**Étape 2:** Utiliser le service
```
Services inclus: Cliquer "Utiliser le service"
Services avec crédits: Cliquer "Utiliser (X crédits)"
```

**Étape 3:** Profiter du service
```
Suivre les instructions du service
Recevoir le résultat (CV, rapport, coaching, etc.)
Crédits automatiquement déduits
```

#### 3. Recharger des Crédits

**Quand les crédits sont épuisés:**
```
1. Cliquer sur "Acheter maintenant"
2. Choisir la méthode de paiement (Orange Money, MTN, Moov)
3. Entrer le numéro de téléphone
4. Confirmer le paiement
5. Crédits ajoutés instantanément
```

### Pour les Développeurs

#### Vérifier les Crédits d'un Utilisateur

**SQL:**
```sql
SELECT * FROM get_welcome_credits_summary('{user_id}');
```

**Résultat:**
```
service_name                  | credits_available | service_value    | description
-----------------------------|-------------------|------------------|------------------
Analyse IA de profil         | 999               | Illimité         | Analysez...
Création CV/Lettre IA        | 2                 | 200 000 GNF      | Générez...
Chatbot Travail & Emploi     | 100               | Inclus           | 100 questions...
Alertes IA ciblées           | 999               | Illimité         | Recevez...
Rapport mensuel IA           | 1                 | 150 000 GNF      | 1 rapport...
Coaching carrière IA         | 1                 | 250 000 GNF      | 1 session...
```

#### Calculer la Valeur Totale

**SQL:**
```sql
SELECT calculate_free_credits_value('{user_id}');
```

**Résultat:**
```
600000  -- en GNF
```

#### Attribuer les Crédits Manuellement

**Pour un utilisateur spécifique:**
```sql
SELECT initialize_free_subscription('{user_id}');
```

**Pour tous les candidats existants:**
```sql
SELECT * FROM grant_trial_credits_to_existing_candidates();
```

## 🔧 Architecture Technique

### Base de Données

#### Fonction d'Initialisation

```sql
CREATE FUNCTION initialize_free_subscription(p_user_id uuid)
RETURNS void
```

**Crée:**
1. Abonnement gratuit actif
2. Tous les crédits gratuits:
   - `profile_analysis`: 999
   - `smart_alerts`: 999
   - `cv_generation`: 2
   - `cover_letter_generation`: 2
   - `chatbot_queries`: 100
   - `monthly_report`: 1
   - `career_coaching`: 1
3. Transactions bonus pour traçabilité

#### Trigger Automatique

```sql
CREATE TRIGGER trigger_auto_initialize_premium
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.user_type = 'candidate')
  EXECUTE FUNCTION auto_initialize_premium_on_profile_creation();
```

**Fonctionnement:**
- Déclenché à chaque création de profil candidat
- Appelle `initialize_free_subscription()`
- Attribution instantanée
- Aucune action manuelle

#### Fonctions Utiles

**1. Récapitulatif des Crédits:**
```sql
SELECT * FROM get_welcome_credits_summary('{user_id}');
```

**2. Valeur Totale:**
```sql
SELECT calculate_free_credits_value('{user_id}');
```

**3. Statut Premium Complet:**
```sql
SELECT get_user_premium_status('{user_id}');
```

Retourne:
```json
{
  "subscription_type": "free",
  "status": "active",
  "credits": {
    "cv_generation": {
      "available": 2,
      "used": 0,
      "total": 2,
      "last_recharged": "2025-11-12T..."
    },
    ...
  },
  "free_credits_value": 600000,
  "is_trial": true
}
```

### Frontend

#### Composant WelcomeCreditsModal

**Emplacement:** `src/components/candidate/WelcomeCreditsModal.tsx`

**Fonctionnalités:**
- Affichage automatique première connexion
- Design festif et coloré
- Liste complète des crédits
- Valeur totale calculée
- Navigation vers services premium
- localStorage pour éviter ré-affichage

**Props:**
```typescript
interface WelcomeCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToServices: () => void;
}
```

**Utilisation:**
```tsx
<WelcomeCreditsModal
  isOpen={showWelcomeModal}
  onClose={() => setShowWelcomeModal(false)}
  onNavigateToServices={() => onNavigate('premium-ai')}
/>
```

#### Intégration Dashboard

**Emplacement:** `src/pages/CandidateDashboard.tsx`

**Logique:**
```typescript
const checkForWelcomeModal = () => {
  const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeCredits');
  if (!hasSeenWelcome && user) {
    setTimeout(() => {
      setShowWelcomeModal(true);
      localStorage.setItem('hasSeenWelcomeCredits', 'true');
    }, 2000);
  }
};
```

## 📊 Statistiques et Monitoring

### Requêtes Utiles

#### 1. Total de Crédits Distribués

```sql
SELECT
  service_type,
  SUM(credits_total) as total_credits_distributed,
  COUNT(DISTINCT user_id) as users_count
FROM premium_credits
WHERE service_type NOT IN ('profile_analysis', 'smart_alerts')
GROUP BY service_type;
```

#### 2. Taux d'Utilisation des Crédits Gratuits

```sql
SELECT
  service_type,
  SUM(credits_used) as used,
  SUM(credits_total) as total,
  ROUND(100.0 * SUM(credits_used) / NULLIF(SUM(credits_total), 0), 2) as usage_rate
FROM premium_credits
WHERE service_type NOT IN ('profile_analysis', 'smart_alerts')
GROUP BY service_type;
```

#### 3. Candidats avec Crédits Restants

```sql
SELECT
  COUNT(DISTINCT user_id) as candidates_with_credits
FROM premium_credits
WHERE credits_available > 0
  AND service_type NOT IN ('profile_analysis', 'smart_alerts');
```

#### 4. Valeur Totale Distribuée

```sql
SELECT
  SUM(calculate_free_credits_value(DISTINCT user_id)) as total_value_distributed
FROM premium_credits;
```

## 🎯 Stratégie Marketing

### Objectifs

1. **Acquisition:** Attirer de nouveaux candidats
2. **Activation:** Faire tester les services premium
3. **Conversion:** Transformer en clients payants
4. **Rétention:** Fidéliser les utilisateurs

### Avantages

**Pour les Candidats:**
- ✅ Test gratuit de tous les services
- ✅ Valeur réelle de 600,000 GNF
- ✅ Aucun engagement
- ✅ Expérience complète

**Pour JobGuinée:**
- ✅ Augmentation des inscriptions
- ✅ Découverte des services premium
- ✅ Taux de conversion plus élevé
- ✅ Bouche-à-oreille positif

### Messages Marketing

**Titre Principal:**
> "Inscrivez-vous et recevez 600,000 GNF de crédits gratuits!"

**Sous-titre:**
> "Testez gratuitement tous nos services premium IA"

**Call-to-Action:**
> "S'inscrire gratuitement et recevoir mes crédits"

## 💡 Bonnes Pratiques

### Pour les Candidats

1. **Explorez Tous les Services**
   - Utilisez vos crédits gratuits pour tester
   - Identifiez les services les plus utiles
   - Planifiez vos achats futurs

2. **Commencez par le Coaching**
   - Service à plus haute valeur (250,000 GNF)
   - Session gratuite très utile
   - Préparez-vous aux entretiens

3. **Générez votre CV IA**
   - 2 crédits = 2 versions de CV
   - Testez différents formats
   - Choisissez le meilleur

4. **Utilisez le Chatbot**
   - 100 questions gratuites
   - Comprenez vos droits
   - Conseils juridiques illimités

### Pour les Développeurs

1. **Monitoring**
   - Surveiller l'attribution automatique
   - Vérifier les erreurs de trigger
   - Analyser l'utilisation des crédits

2. **Optimisation**
   - Identifier les services populaires
   - Ajuster les quantités de crédits
   - Améliorer le taux de conversion

3. **Support**
   - Réattribuer des crédits si nécessaire
   - Gérer les cas particuliers
   - Documenter les incidents

## 🐛 Dépannage

### Problème: Crédits non attribués

**Vérification:**
```sql
SELECT * FROM premium_credits
WHERE user_id = '{user_id}';
```

**Si vide, attribuer manuellement:**
```sql
SELECT initialize_free_subscription('{user_id}');
```

### Problème: Modal ne s'affiche pas

**Vérifications:**
1. localStorage cleared?
2. Composant importé?
3. État `showWelcomeModal` géré?

**Solution:**
```typescript
// Forcer l'affichage
localStorage.removeItem('hasSeenWelcomeCredits');
```

### Problème: Crédits déjà utilisés

**Vérification:**
```sql
SELECT * FROM premium_service_usage
WHERE user_id = '{user_id}'
ORDER BY created_at DESC;
```

**Recharger si nécessaire:**
```sql
UPDATE premium_credits
SET credits_available = credits_available + 1
WHERE user_id = '{user_id}'
  AND service_type = 'cv_generation';
```

## 📈 Métriques de Succès

### KPIs à Suivre

1. **Taux d'Attribution**
   - % de nouveaux candidats recevant les crédits
   - Cible: 100%

2. **Taux d'Utilisation**
   - % de crédits gratuits utilisés
   - Cible: > 60%

3. **Taux de Conversion**
   - % passant de gratuit à payant
   - Cible: > 15%

4. **Service le Plus Populaire**
   - Identifier le service #1
   - Optimiser son marketing

## 🚀 Évolutions Futures

### Phase 2
- 🔜 Crédits bonus pour parrainage
- 🔜 Programme de fidélité
- 🔜 Récompenses mensuelles
- 🔜 Crédits anniversaire

### Phase 3
- 🔜 Gamification des crédits
- 🔜 Niveaux VIP
- 🔜 Challenges avec récompenses
- 🔜 Marketplace de crédits

---

## 📞 Support

**Questions sur les crédits:**
- Email: credits@jobguinee.com
- Téléphone: +224 XXX XX XX XX
- Chat: Disponible 24/7

**Documentation:**
- Guide complet: docs.jobguinee.com/credits
- FAQ: jobguinee.com/faq/credits
- Tutoriels: youtube.com/jobguinee

---

**Version:** 1.0.0
**Date:** 12 Novembre 2025
**Dernière mise à jour:** 12 Novembre 2025
