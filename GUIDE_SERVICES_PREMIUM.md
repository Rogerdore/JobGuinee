# 👑 Guide des Services Premium IA - JobGuinée

## 📋 Vue d'Ensemble

Le système de services premium IA de JobGuinée offre des fonctionnalités avancées propulsées par l'intelligence artificielle pour booster la recherche d'emploi des candidats.

## ✨ Services Disponibles

### 1. 🧠 Analyse IA de Profil
**Prix:** Inclus gratuitement
**Type:** Illimité

**Fonctionnalités:**
- Analyse complète du profil candidat
- Score de compatibilité avec les offres d'emploi
- Suggestions de formations personnalisées
- Recommandations d'amélioration du profil

**Utilisation:**
- Accédez via Dashboard → Services Premium
- Cliquez sur "Utiliser le service"
- Redirige vers l'analyse IA

---

### 2. 📄 Création CV / Lettre IA
**Prix:** 100,000 GNF
**Type:** 1 crédit par achat

**Fonctionnalités:**
- Génération automatique de CV professionnel
- Création de lettre de motivation personnalisée
- Design moderne et ATS-friendly
- Export PDF haute qualité

**Utilisation:**
1. Acheter des crédits (100,000 GNF)
2. Accéder au générateur de CV
3. Remplir vos informations
4. Générer et télécharger

---

### 3. 🔔 Alertes IA Ciblées
**Prix:** Inclus gratuitement
**Type:** Illimité

**Fonctionnalités:**
- Alertes intelligentes personnalisées
- Matching avancé IA
- Notifications multi-canal (email, SMS, WhatsApp)
- Suggestions d'offres similaires

**Utilisation:**
- Configurez vos critères d'alerte
- Recevez des notifications automatiques
- Consultez les offres correspondantes

---

### 4. 💬 Chatbot Travail & Emploi
**Prix:** Inclus gratuitement
**Type:** 100 crédits initiaux

**Fonctionnalités:**
- Conseils juridiques emploi
- Réponses sur le Code du Travail guinéen
- Assistance 24/7 instantanée
- Historique des conversations

**Utilisation:**
- Posez vos questions juridiques
- Obtenez des réponses instantanées
- 1 crédit = 1 conversation

---

### 5. 📊 Rapport Mensuel IA
**Prix:** 150,000 GNF/mois
**Type:** Abonnement mensuel

**Fonctionnalités:**
- Rapport détaillé de vos candidatures
- Statistiques de matching
- Analyse de performance
- Recommandations stratégiques personnalisées

**Utilisation:**
- Souscrivez à l'abonnement mensuel
- Recevez votre rapport automatiquement
- Consultez vos statistiques détaillées

---

### 6. 🎯 Coaching Carrière IA
**Prix:** 250,000 GNF
**Type:** 3 sessions

**Fonctionnalités:**
- Simulations d'entretien réalistes
- Feedback personnalisé détaillé
- Préparation aux questions techniques
- 3 sessions de coaching complètes

**Utilisation:**
- Acheter le package coaching (250,000 GNF)
- Planifier vos sessions
- Pratiquer et recevoir des feedbacks
- Améliorer vos compétences d'entretien

---

## 💳 Système de Paiement

### Méthodes de Paiement Acceptées

1. **Orange Money** 🟠
   - Service mobile money d'Orange Guinée
   - Paiement instantané

2. **MTN Mobile Money** 🔴
   - Service MTN Guinée
   - Transfert sécurisé

3. **Moov Money** 🔵
   - Service Moov Africa
   - Confirmation rapide

### Processus d'Achat

1. **Sélectionner un Service**
   - Parcourir les services premium
   - Cliquer sur "Acheter maintenant"

2. **Choisir la Méthode**
   - Sélectionner Orange Money, MTN ou Moov
   - Entrer votre numéro de téléphone

3. **Confirmer le Paiement**
   - Valider le montant
   - Confirmer sur votre téléphone
   - Attendre la confirmation

4. **Recevoir les Crédits**
   - Crédits ajoutés instantanément
   - Notification de confirmation
   - Prêt à utiliser le service

---

## 🎫 Système de Crédits

### Types de Crédits

**Crédits Gratuits:**
- Analyse IA de profil: Illimité
- Alertes IA: Illimité
- Chatbot: 100 requêtes initiales

**Crédits Payants:**
- CV/Lettre IA: 1 crédit = 100,000 GNF
- Coaching carrière: 3 sessions = 250,000 GNF
- Rapport mensuel: Abonnement 150,000 GNF/mois

### Gestion des Crédits

**Consulter vos Crédits:**
```
Dashboard → Services Premium → Voir les crédits
```

**Recharger des Crédits:**
- Acheter directement depuis la page du service
- Les crédits n'expirent pas (sauf indication contraire)
- Historique complet des transactions

**Utilisation des Crédits:**
- Déduction automatique lors de l'utilisation
- Notification si crédits insuffisants
- Barre de progression visuelle

---

## 🔧 Architecture Technique

### Base de Données

#### Table `premium_subscriptions`
```sql
CREATE TABLE premium_subscriptions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  subscription_type text, -- free, basic, premium, enterprise
  status text, -- active, cancelled, expired
  started_at timestamptz,
  expires_at timestamptz,
  auto_renew boolean,
  amount_paid numeric,
  currency text DEFAULT 'GNF'
);
```

#### Table `premium_credits`
```sql
CREATE TABLE premium_credits (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  service_type text,
  credits_available integer,
  credits_used integer,
  credits_total integer,
  last_recharged_at timestamptz,
  expires_at timestamptz
);
```

**Types de Services:**
- `profile_analysis` - Analyse de profil
- `cv_generation` - Génération CV
- `cover_letter_generation` - Lettres
- `smart_alerts` - Alertes
- `chatbot_queries` - Chatbot
- `monthly_report` - Rapports
- `career_coaching` - Coaching

#### Table `premium_transactions`
```sql
CREATE TABLE premium_transactions (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  transaction_type text, -- purchase, usage, refund, bonus
  service_type text,
  amount numeric,
  credits_change integer,
  payment_method text,
  payment_reference text,
  status text, -- pending, completed, failed
  created_at timestamptz
);
```

#### Table `premium_service_usage`
```sql
CREATE TABLE premium_service_usage (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  service_type text,
  usage_type text,
  credits_used integer,
  input_data jsonb,
  output_data jsonb,
  success boolean,
  created_at timestamptz
);
```

### Fonctions SQL Essentielles

#### 1. Initialiser Abonnement Gratuit
```sql
SELECT initialize_free_subscription('{user_id}');
```

Crée automatiquement:
- Abonnement gratuit actif
- Crédits gratuits (analyse, alertes, chatbot)

#### 2. Acheter des Crédits
```sql
SELECT purchase_service_credits(
  p_user_id := '{user_id}',
  p_service_type := 'cv_generation',
  p_credits := 1,
  p_amount := 100000,
  p_payment_method := 'orange_money',
  p_payment_reference := 'OM123456'
);
```

Retourne:
```json
{
  "success": true,
  "transaction_id": "uuid",
  "credits_added": 1
}
```

#### 3. Utiliser des Crédits
```sql
SELECT use_service_credits(
  p_user_id := '{user_id}',
  p_service_type := 'cv_generation',
  p_credits := 1,
  p_usage_type := 'generate_cv',
  p_input_data := '{"profile_id": "123"}'::jsonb
);
```

Retourne:
```json
{
  "success": true,
  "usage_id": "uuid",
  "credits_used": 1,
  "credits_remaining": 0
}
```

Ou en cas d'erreur:
```json
{
  "success": false,
  "error": "insufficient_credits",
  "available_credits": 0,
  "required_credits": 1
}
```

#### 4. Statut Premium
```sql
SELECT get_user_premium_status('{user_id}');
```

Retourne:
```json
{
  "subscription_type": "free",
  "status": "active",
  "credits": {
    "profile_analysis": {
      "available": 999,
      "used": 0,
      "total": 999
    },
    "chatbot_queries": {
      "available": 95,
      "used": 5,
      "total": 100
    }
  }
}
```

---

## 🔐 Sécurité

### Row Level Security (RLS)

✅ **Activé sur toutes les tables**

**Policies:**
- Utilisateurs voient uniquement leurs données
- Pas d'accès cross-user
- Isolation complète des données

### Paiements Sécurisés

**Protection:**
- Validation côté serveur
- Références de paiement uniques
- Historique complet des transactions
- Pas de stockage de données bancaires

**Conformité:**
- Respect des standards de paiement mobile
- Confirmation requise sur téléphone
- Traçabilité complète

---

## 💡 Utilisation Pratique

### Pour les Candidats

#### Première Connexion

1. **Initialisation Automatique**
   - Abonnement gratuit créé automatiquement
   - Crédits gratuits attribués
   - Accès immédiat aux services inclus

2. **Explorer les Services**
   - Dashboard → Services Premium
   - Parcourir les 6 services disponibles
   - Voir les prix et fonctionnalités

3. **Utiliser un Service Gratuit**
   - Cliquer sur "Utiliser le service"
   - Redirection vers l'outil
   - Utilisation illimitée (selon service)

4. **Acheter un Service Premium**
   - Cliquer sur "Acheter maintenant"
   - Sélectionner méthode de paiement
   - Entrer numéro de téléphone
   - Confirmer l'achat
   - Recevoir les crédits
   - Utiliser le service

#### Gestion des Crédits

**Vérifier les Crédits:**
- Page Services Premium
- Voir les cartes de services
- Jauge de crédits visible

**Recharger:**
- Bouton "Acheter maintenant"
- Choisir montant/crédits
- Payer

**Historique:**
```sql
SELECT *
FROM premium_transactions
WHERE user_id = '{current_user_id}'
ORDER BY created_at DESC;
```

---

## 📊 Statistiques et Reporting

### Métriques Disponibles

#### Pour les Utilisateurs

**Tableau de Bord Personnel:**
- Crédits disponibles par service
- Historique d'utilisation
- Montant dépensé total
- Services les plus utilisés

#### Pour les Administrateurs

**Statistiques Plateforme:**

```sql
-- Revenus totaux par service
SELECT
  service_type,
  COUNT(*) as transactions,
  SUM(amount) as total_revenue
FROM premium_transactions
WHERE transaction_type = 'purchase'
  AND status = 'completed'
GROUP BY service_type;

-- Utilisateurs premium actifs
SELECT COUNT(DISTINCT user_id)
FROM premium_subscriptions
WHERE subscription_type != 'free'
  AND status = 'active';

-- Service le plus populaire
SELECT
  service_type,
  COUNT(*) as usage_count
FROM premium_service_usage
GROUP BY service_type
ORDER BY usage_count DESC;
```

---

## 🚀 Intégration avec Services IA

### Workflow d'Utilisation

#### 1. Vérification des Crédits

```typescript
// Avant d'utiliser un service
const { data: status } = await supabase.rpc('get_user_premium_status', {
  p_user_id: userId
});

const credits = status.credits[serviceType];
if (credits.available < 1) {
  // Proposer d'acheter des crédits
}
```

#### 2. Utilisation du Service

```typescript
// Utiliser le service IA
const result = await callAIService(inputData);

// Déduire les crédits
const { data } = await supabase.rpc('use_service_credits', {
  p_user_id: userId,
  p_service_type: serviceType,
  p_credits: 1,
  p_usage_type: 'service_call',
  p_input_data: inputData,
  p_output_data: result
});

if (!data.success) {
  // Gérer l'erreur (crédits insuffisants)
}
```

#### 3. Gestion des Erreurs

```typescript
try {
  const { data, error } = await supabase.rpc('use_service_credits', {
    p_user_id: userId,
    p_service_type: serviceType,
    p_credits: 1
  });

  if (!data.success) {
    if (data.error === 'insufficient_credits') {
      alert(`Crédits insuffisants. Disponible: ${data.available_credits}`);
      // Proposer l'achat
    }
  }
} catch (error) {
  console.error('Erreur:', error);
}
```

---

## 🔄 Renouvellement et Abonnements

### Gestion des Abonnements

**Abonnements Mensuels:**
- Rapport mensuel IA (150,000 GNF/mois)
- Renouvellement automatique optionnel
- Annulation possible à tout moment

**Activation du Renouvellement:**
```sql
UPDATE premium_subscriptions
SET auto_renew = true
WHERE user_id = '{user_id}';
```

**Annulation:**
```sql
UPDATE premium_subscriptions
SET status = 'cancelled',
    auto_renew = false
WHERE user_id = '{user_id}';
```

---

## 🐛 Dépannage

### Problème: Paiement non confirmé

**Solutions:**
1. Vérifier le solde du compte mobile money
2. Confirmer le paiement sur le téléphone
3. Attendre 1-2 minutes
4. Contacter le support si échec

### Problème: Crédits non ajoutés

**Vérifications:**
```sql
-- Vérifier les transactions
SELECT * FROM premium_transactions
WHERE user_id = '{user_id}'
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier les crédits
SELECT * FROM premium_credits
WHERE user_id = '{user_id}';
```

### Problème: Service ne fonctionne pas

**Checklist:**
1. Vérifier les crédits disponibles
2. Vérifier l'état de l'abonnement
3. Consulter les logs d'utilisation
4. Contacter le support technique

---

## 📱 Interface Mobile

**Responsive Design:**
- ✅ Optimisé pour mobile
- ✅ Paiement mobile money natif
- ✅ Navigation tactile
- ✅ Notifications push

---

## 🚀 Améliorations Futures

### Phase 2
- 🔜 API Keys pour développeurs
- 🔜 Webhooks de paiement
- 🔜 Plans d'abonnement premium
- 🔜 Programme de parrainage

### Phase 3
- 🔜 IA vocale pour coaching
- 🔜 Réalité virtuelle pour entretiens
- 🔜 Blockchain pour certificats
- 🔜 Marketplace de services

---

## 📞 Support

**Contact:**
- Email: premium@jobguinee.com
- Téléphone: +224 XXX XX XX XX
- Chat: Disponible 24/7

**Documentation:**
- Guide utilisateur: docs.jobguinee.com/premium
- API: api.jobguinee.com/docs
- FAQ: jobguinee.com/faq

---

**Version:** 1.0.0
**Date:** 12 Novembre 2025
**Dernière mise à jour:** 12 Novembre 2025
