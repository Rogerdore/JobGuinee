# 🎁 Guide des Crédits Gratuits - JobGuinée

## 📋 Vue d'Ensemble

Tous les nouveaux candidats qui s'inscrivent sur JobGuinée reçoivent automatiquement des **crédits gratuits** pour tester les services premium IA, d'une valeur totale de **150,000 GNF** !

## ✨ Crédits Gratuits Attribués

### Services Illimités (Inclus Gratuitement)

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
- **Crédits gratuits:** 1 génération
- **Valeur:** 100,000 GNF
- **Utilisation:**
  - Générez 1 CV professionnel GRATUIT
  - Ou 1 lettre de motivation
  - Design moderne et ATS-friendly
  - Export PDF haute qualité

#### 💬 Chatbot Travail & Emploi
- **Crédits gratuits:** 50 requêtes
- **Valeur:** 50,000 GNF d'essai
- **Utilisation:**
  - 50 questions sur le Code du Travail guinéen
  - Conseils juridiques emploi
  - Réponses instantanées 24/7
  - Historique des conversations

### Services Premium (Achat Requis)

#### 📊 Rapport Mensuel IA
- **Crédits gratuits:** 0
- **Prix:** 150,000 GNF
- **Fonctionnalités:**
  - Rapport détaillé de vos candidatures
  - Statistiques complètes
  - Analyse de performance
  - Recommandations stratégiques

#### 🎯 Coaching Carrière IA
- **Crédits gratuits:** 0
- **Prix:** 250,000 GNF
- **Fonctionnalités:**
  - 3 sessions de coaching
  - Simulations d'entretien
  - Feedback personnalisé
  - Préparation aux questions techniques

## 💰 Valeur Totale des Crédits

**Total:** 150,000 GNF de crédits gratuits !

```
Création CV/Lettre:  100,000 GNF (1 crédit)
Chatbot Emploi:       50,000 GNF (50 requêtes)
Services illimités:   Inclus
───────────────────────────────────────────
TOTAL:               150,000 GNF
```

## 🚀 Comment Ça Marche ?

### Attribution Automatique

**Processus:**
```
Nouveau candidat s'inscrit
    ↓
Création du profil candidat
    ↓
🎁 TRIGGER AUTOMATIQUE
    ↓
Attribution des crédits gratuits (150,000 GNF)
    ↓
Notification dans le dashboard
    ↓
Modal de bienvenue s'affiche
```

### Modal de Bienvenue

**Affichage automatique:**
- S'affiche 2 secondes après la première connexion
- Design festif et coloré
- Liste complète des crédits reçus
- Valeur totale: 150,000 GNF
- Boutons d'action vers les services

## 📖 Guide d'Utilisation

### Ordre Recommandé

**1. Analyse IA de Profil (Illimité - Gratuit)**
- Comprendre vos forces
- Identifier les améliorations
- Utilisation illimitée

**2. Création CV/Lettre (1 crédit - 100,000 GNF)**
- Générer votre CV professionnel
- Utiliser judicieusement
- Export PDF inclus

**3. Chatbot Emploi (50 requêtes - 50,000 GNF)**
- Questions sur le Code du Travail
- Conseils juridiques
- 50 requêtes gratuites

**4. Alertes IA (Illimité - Gratuit)**
- Notifications automatiques
- Matching intelligent
- Utilisation illimitée

### Recharger des Crédits

**Quand épuisés:**
```
1. Cliquer "Acheter maintenant"
2. Choisir Orange Money, MTN ou Moov
3. Entrer numéro de téléphone
4. Confirmer paiement
5. Crédits ajoutés instantanément
```

## 🔧 Architecture Technique

### Fonction d'Initialisation

```sql
CREATE FUNCTION initialize_free_subscription(p_user_id uuid)
```

**Crédits attribués:**
- `profile_analysis`: 999 (illimité)
- `smart_alerts`: 999 (illimité)
- `cv_generation`: 1 (100,000 GNF)
- `cover_letter_generation`: 1 (100,000 GNF)
- `chatbot_queries`: 50 (50,000 GNF)
- `monthly_report`: 0 (achat requis)
- `career_coaching`: 0 (achat requis)

### Trigger Automatique

```sql
CREATE TRIGGER trigger_auto_initialize_premium
  AFTER INSERT ON profiles
  FOR EACH ROW
  WHEN (NEW.user_type = 'candidate')
  EXECUTE FUNCTION auto_initialize_premium_on_profile_creation();
```

### Fonctions SQL

**Récapitulatif:**
```sql
SELECT * FROM get_welcome_credits_summary('{user_id}');
```

**Valeur totale:**
```sql
SELECT calculate_free_credits_value('{user_id}');
-- Retourne: 150000
```

**Statut complet:**
```sql
SELECT get_user_premium_status('{user_id}');
```

## 📊 Statistiques

### KPIs Principaux

1. **Taux d'Attribution:** 100%
2. **Taux d'Utilisation CV:** > 70%
3. **Taux d'Utilisation Chatbot:** > 40%
4. **Taux de Conversion:** > 10%

### Requêtes Monitoring

**Total distribué:**
```sql
SELECT COUNT(DISTINCT user_id) * 150000 as total_value
FROM premium_credits
WHERE service_type = 'cv_generation';
```

**Taux d'utilisation:**
```sql
SELECT
  service_type,
  SUM(credits_used) as used,
  SUM(credits_total) as total,
  ROUND(100.0 * SUM(credits_used) / NULLIF(SUM(credits_total), 0), 2) as usage_rate
FROM premium_credits
WHERE service_type IN ('cv_generation', 'chatbot_queries')
GROUP BY service_type;
```

## 🎯 Marketing

### Message Principal

**Titre:**
> "Inscrivez-vous et recevez 150,000 GNF de crédits gratuits!"

**Sous-titre:**
> "Testez nos services premium IA sans engagement"

### Avantages

**Pour les Candidats:**
- ✅ Test gratuit des services essentiels
- ✅ Valeur réelle de 150,000 GNF
- ✅ Aucun engagement
- ✅ Services illimités inclus

**Pour JobGuinée:**
- ✅ Augmentation des inscriptions
- ✅ Découverte des services premium
- ✅ Conversion optimisée
- ✅ Coût maîtrisé

## 🐛 Dépannage

### Crédits non attribués

```sql
-- Vérifier
SELECT * FROM premium_credits WHERE user_id = '{user_id}';

-- Attribuer manuellement
SELECT initialize_free_subscription('{user_id}');
```

### Modal ne s'affiche pas

```typescript
// Réinitialiser
localStorage.removeItem('hasSeenWelcomeCredits');
```

## 📞 Support

- Email: credits@jobguinee.com
- Téléphone: +224 XXX XX XX XX
- Chat: Disponible 24/7

---

**Version:** 2.0.0 (150,000 GNF)
**Date:** 12 Novembre 2025
