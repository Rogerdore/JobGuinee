# Services Premium d'Assistance IA - JobGuinée

## Vue d'ensemble

Le système de Services Premium IA offre aux candidats une suite complète d'outils propulsés par l'intelligence artificielle pour améliorer leur recherche d'emploi et développement de carrière.

## Architecture du Système

### Base de données

#### Tables principales

1. **premium_services**
   - Catalogue des services IA disponibles
   - Gestion des prix et disponibilité
   - Catégorisation des services

2. **user_premium_services**
   - Suivi des abonnements utilisateurs
   - Gestion des dates d'expiration
   - Historique des transactions

3. **ai_cv_generations**
   - Stockage des CV générés par IA
   - Historique des versions

4. **ai_cover_letters**
   - Lettres de motivation personnalisées
   - Liaison avec les offres d'emploi

5. **ai_career_plans**
   - Plans de carrière à 3, 5 et 10 ans
   - Recommandations de compétences et formations

6. **ai_chat_history**
   - Historique des conversations avec JobCoach IA
   - Suivi des sessions de chat

### Services Disponibles

#### 1. Analyse & Matching IA
**Catégorie:** `matching`
**Prix:** 25,000 GNF

**Fonctionnalités:**
- Analyse automatique du profil candidat
- Score de compatibilité (0-100) avec les offres
- Suggestions d'offres personnalisées
- Recommandations d'amélioration du profil

**Composant:** `AIMatchingService.tsx`

**Algorithme de matching:**
- Compétences (50% du score)
- Expérience (30% du score)
- Formation (20% du score)

#### 2. Rédaction de CV IA
**Catégorie:** `cv`
**Prix:** 15,000 GNF

**Fonctionnalités:**
- Génération automatique de CV professionnel
- Import du profil existant ou saisie manuelle
- Format HTML téléchargeable
- Design moderne et optimisé ATS
- Multiples modèles disponibles

**Composant:** `AICVGenerator.tsx`

#### 3. Lettre de Motivation IA
**Catégorie:** `cover_letter`
**Prix:** 10,000 GNF

**Fonctionnalités:**
- Génération personnalisée par offre
- 3 tons disponibles (formel, créatif, simple)
- Adaptation automatique à l'entreprise et au poste
- Contenu éditable

#### 4. JobCoach IA
**Catégorie:** `coaching`
**Prix:** 30,000 GNF

**Fonctionnalités:**
- Assistant virtuel 24/7
- Conseils sur la préparation d'entretien
- Stratégies de recherche d'emploi
- Développement de compétences
- Négociation salariale
- Reconversion professionnelle

**Composant:** `AICoachChat.tsx`

**Questions rapides disponibles:**
- Préparation d'entretien
- Développement de compétences
- Rédaction de lettre de motivation
- Négociation salariale
- Reconversion professionnelle

#### 5. Plan de Carrière IA
**Catégorie:** `career_plan`
**Prix:** 20,000 GNF

**Fonctionnalités:**
- Plan à court terme (3 ans)
- Plan à moyen terme (5 ans)
- Plan à long terme (10 ans)
- Compétences à développer
- Formations recommandées
- Opportunités identifiées dans la base JobVision

#### 6. Simulation d'Entretien IA
**Catégorie:** `interview`
**Prix:** 15,000 GNF

**Fonctionnalités:**
- Questions personnalisées selon le poste
- Feedback détaillé sur les réponses
- Analyse de la performance
- Conseils d'amélioration

## Intégration Frontend

### Pages principales

1. **PremiumAIServices** (`/premium-ai`)
   - Page de découverte des services
   - Catalogue avec badges Premium
   - Indicateurs d'accès utilisateur
   - Call-to-action pour abonnement

2. **AIMatchingService** (`/ai-matching`)
   - Interface d'analyse et matching
   - Affichage des scores de compatibilité
   - Liste des meilleures correspondances

3. **AICVGenerator** (`/ai-cv-generator`)
   - Formulaire de génération de CV
   - Aperçu en temps réel
   - Téléchargement du document

4. **AICoachChat** (`/ai-coach`)
   - Interface de chat en temps réel
   - Questions rapides prédéfinies
   - Historique de conversation

### Navigation

Accès depuis le Dashboard Candidat :
1. Onglet "Services Premium"
2. Bouton "Découvrir tous les services IA"
3. Ou directement via les routes

## Système de Paiement

### Méthodes supportées
- Orange Money
- LengoPay
- DigitalPay SA

### Modèle de tarification
- Paiement à l'acte pour services individuels
- Abonnement Premium PRO+ : 350,000 GNF/mois (tous services inclus)

## Sécurité

### Row Level Security (RLS)
- Tous les services sont protégés par RLS
- Les utilisateurs ne peuvent accéder qu'à leurs propres données
- Les services publics sont visibles par tous
- Seuls les admins peuvent gérer le catalogue

### Politiques d'accès
```sql
-- Lecture des services actifs
CREATE POLICY "Anyone can view active services"
  ON premium_services FOR SELECT
  USING (is_active = true);

-- Gestion des abonnements
CREATE POLICY "Users can view own services"
  ON user_premium_services FOR SELECT
  USING (user_id = (SELECT auth.uid()));
```

## Extension Future

### Services à implémenter
1. Coaching en ligne personnalisé avec professionnels
2. Audit de CV avec IA Feedback
3. Analyse de marché salariale
4. Recommandations de formations ciblées
5. Networking intelligent
6. Suivi de candidatures automatisé

### Intégrations possibles
- API OpenAI pour améliorer la qualité des réponses
- API HuggingFace pour le traitement du langage
- Stripe/LengoPay pour automatiser les paiements
- Analytics pour tracking d'utilisation

## Utilisation

### Pour les candidats

1. **Accéder aux services**
   ```
   Dashboard Candidat > Services Premium > Découvrir tous les services IA
   ```

2. **Utiliser un service**
   - Si Premium actif : Accès direct
   - Sinon : Bouton "Passer à Premium"

3. **Abonnement Premium**
   - Choisir un service ou l'abonnement complet
   - Payer via Orange Money, LengoPay ou DigitalPay
   - Accès immédiat après validation

### Pour les administrateurs

1. **Gérer les services**
   - Ajouter/modifier/désactiver des services
   - Ajuster les prix
   - Suivre les statistiques d'utilisation

2. **Suivi des abonnements**
   - Table `user_premium_services`
   - Statuts : active, expired, cancelled
   - Renouvellements automatiques

## Support Technique

Pour toute question ou problème :
- Support prioritaire pour les membres Premium
- Email : support@jobguinee.com
- Chat en ligne disponible

## Changelog

### v1.0.0 (2025-01-04)
- Système de base de données complet
- 6 services IA disponibles
- Interface utilisateur moderne
- Intégration dashboard candidat
- Système de paiement multi-méthodes
