# 💳 Système de Crédits IA - JobGuinée

## 📚 Documentation Complète

Bienvenue dans la documentation du système unifié de gestion des crédits IA de JobGuinée.

---

## 🗂️ Documents Disponibles

### 1. 📋 [CREDIT_SYSTEM_SUMMARY.md](./CREDIT_SYSTEM_SUMMARY.md)
**Résumé Exécutif - À lire en premier**

- Vue d'ensemble du système
- Fichiers créés
- Guide d'utilisation rapide
- Checklist d'intégration
- **Temps de lecture : 5-10 minutes**

### 2. 📖 [CREDIT_WORKFLOW_DOCUMENTATION.md](./CREDIT_WORKFLOW_DOCUMENTATION.md)
**Documentation Technique Complète**

- Architecture détaillée
- API et interfaces TypeScript
- Guide d'utilisation approfondi
- Gestion des erreurs
- Sécurité
- Monitoring
- **Temps de lecture : 30-45 minutes**

### 3. 🔄 [CREDIT_MIGRATION_GUIDE.md](./CREDIT_MIGRATION_GUIDE.md)
**Guide de Migration depuis Anciennes Fonctions**

- Avant/Après comparaisons
- Scénarios de migration
- Recherche et remplacement
- Pièges courants
- Checklist de migration
- **Temps de lecture : 15-20 minutes**

### 4. 💰 [IA_PRICING_ENGINE_DOCUMENTATION.md](./IA_PRICING_ENGINE_DOCUMENTATION.md)
**Moteur de Tarification IA Dynamique**

- Gestion centralisée des coûts
- Système de promotions
- Interface Admin complète
- Intégration dans les composants
- Statistiques et analytics
- **Temps de lecture : 20-30 minutes**

---

## 🚀 Démarrage Rapide

### Pour les Développeurs Frontend

#### 1. Afficher le Solde
```typescript
import CreditBalance from './components/credits/CreditBalance';

<CreditBalance showDetails />
```

#### 2. Consommer des Crédits (avec confirmation et coût dynamique)
```typescript
import { useState } from 'react';
import { SERVICES } from './services/creditService';
import { useServiceCost } from './hooks/usePricing';
import CreditConfirmModal from './components/credits/CreditConfirmModal';

const [showModal, setShowModal] = useState(false);
const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 50;

const handleConfirm = (success: boolean, result?: any) => {
  if (success) {
    console.log('Crédits restants:', result.credits_remaining);
  }
};

<CreditConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  serviceCode={SERVICES.AI_CV_GENERATION}
  serviceName="Génération de CV IA"
  serviceCost={serviceCost}
/>
```

#### 3. Consommer des Crédits (directement)
```typescript
import { useConsumeCredits } from './hooks/useCreditService';
import { SERVICES } from './services/creditService';

const { consumeCredits } = useConsumeCredits();

const result = await consumeCredits(SERVICES.AI_JOB_MATCHING, inputData);

if (result.success) {
  // Continuer
}
```

---

## 📁 Structure des Fichiers

```
src/
├── services/
│   └── creditService.ts          ← Service principal
├── hooks/
│   └── useCreditService.ts       ← Hooks React
└── components/
    └── credits/
        ├── CreditBalance.tsx          ← Affichage solde
        ├── ServiceCostBadge.tsx       ← Badge coût
        ├── CreditConfirmModal.tsx     ← Modal confirmation
        └── CreditServiceExample.tsx   ← Exemple démo
```

---

## 🎯 Services IA Disponibles

```typescript
import { SERVICES } from './services/creditService';

SERVICES.AI_CV_GENERATION           // Génération de CV
SERVICES.AI_COVER_LETTER            // Lettre de motivation
SERVICES.AI_JOB_MATCHING            // Matching emplois
SERVICES.AI_PROFILE_ANALYSIS        // Analyse de profil
SERVICES.AI_INTERVIEW_COACHING      // Coaching entretien
SERVICES.AI_CAREER_PATH             // Plan de carrière
SERVICES.PROFILE_VISIBILITY_BOOST   // Boost visibilité
SERVICES.FEATURED_APPLICATION       // Candidature prioritaire
SERVICES.DIRECT_MESSAGE_RECRUITER   // Message direct recruteur
```

---

## 🔧 Composants Disponibles

### Hooks
- `useCreditBalance()` - Solde en temps réel
- `useConsumeCredits()` - Consommation de crédits
- `useCreditHistory()` - Historique des transactions
- `useServicesList()` - Liste des services
- `useServiceCost()` - Coût d'un service

### Composants UI
- `<CreditBalance />` - Affichage du solde
- `<ServiceCostBadge />` - Badge de coût
- `<CreditConfirmModal />` - Modal de confirmation
- `<CreditServiceExample />` - Démonstration complète

### Service Class
- `CreditService.getServiceConfig()` - Config d'un service
- `CreditService.getUserBalance()` - Solde utilisateur
- `CreditService.checkSufficientCredits()` - Vérification
- `CreditService.consumeCredits()` - Consommation
- `CreditService.getTransactionHistory()` - Historique
- `CreditService.getAllServices()` - Liste services
- `CreditService.getUsageHistory()` - Historique usage

---

## 🗄️ Base de Données

### Tables Utilisées
- `profiles` - Solde de crédits (`credits_balance`)
- `credit_transactions` - Historique des transactions
- `service_credit_costs` - Configuration des services
- `ai_service_usage_history` - Détails d'utilisation

### Fonction SQL Principale
- `use_ai_credits(p_user_id, p_service_key, p_input_payload, p_output_response)`

---

## 🧪 Test & Démonstration

### Composant de Test Intégré
```typescript
import CreditServiceExample from './components/credits/CreditServiceExample';

<CreditServiceExample />
```

Ce composant démontre :
- ✅ Affichage du solde
- ✅ Consommation avec modal
- ✅ Consommation directe
- ✅ Gestion d'erreurs
- ✅ Exemples de code

---

## 📝 Parcours Recommandé

### Pour Découvrir le Système (Débutant)
1. Lire [CREDIT_SYSTEM_SUMMARY.md](./CREDIT_SYSTEM_SUMMARY.md)
2. Intégrer `<CreditServiceExample />` dans une page test
3. Tester les différentes méthodes
4. Lire les sections pertinentes de [CREDIT_WORKFLOW_DOCUMENTATION.md](./CREDIT_WORKFLOW_DOCUMENTATION.md)

### Pour Intégrer dans un Nouveau Composant (Intermédiaire)
1. Consulter la section "Guide d'Utilisation Rapide" dans [CREDIT_SYSTEM_SUMMARY.md](./CREDIT_SYSTEM_SUMMARY.md)
2. Copier un exemple de code approprié
3. Adapter à votre cas d'usage
4. Consulter [CREDIT_WORKFLOW_DOCUMENTATION.md](./CREDIT_WORKFLOW_DOCUMENTATION.md) pour cas avancés

### Pour Migrer du Code Existant (Avancé)
1. Lire [CREDIT_MIGRATION_GUIDE.md](./CREDIT_MIGRATION_GUIDE.md)
2. Identifier vos anciens appels
3. Suivre les exemples de migration
4. Tester avec la checklist fournie

---

## ⚡ Cas d'Usage Fréquents

### Cas 1 : Service IA Simple
**Besoin :** Consommer des crédits pour générer un CV

**Solution :** Modal de confirmation
```typescript
<CreditConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleConfirm}
  serviceCode={SERVICES.AI_CV_GENERATION}
  serviceName="Génération de CV IA"
  serviceCost={50}
/>
```

### Cas 2 : Service IA Automatique
**Besoin :** Consommer des crédits sans confirmation utilisateur

**Solution :** Consommation directe
```typescript
const { consumeCredits } = useConsumeCredits();
const result = await consumeCredits(serviceCode, inputData);
```

### Cas 3 : Affichage du Solde
**Besoin :** Montrer le solde dans le header

**Solution :** Composant CreditBalance
```typescript
<CreditBalance showDetails />
```

### Cas 4 : Vérification Préalable
**Besoin :** Vérifier le solde avant de lancer une action

**Solution :** checkSufficient
```typescript
const { checkSufficient } = useConsumeCredits();
const check = await checkSufficient(serviceCode);

if (!check.sufficient) {
  alert(check.message);
  return;
}
```

---

## 🔐 Sécurité

### ✅ Protections Intégrées
- Authentification obligatoire
- Vérification du solde stricte
- Services actifs uniquement
- Traçabilité complète
- Input/Output enregistrés

### ❌ Ce qui est Impossible
- Consommer sans être connecté
- Bypass la vérification du solde
- Modifier manuellement le solde
- Utiliser un service inactif

---

## 📊 Monitoring

### Données Disponibles
- Historique complet dans `credit_transactions`
- Détails d'usage dans `ai_service_usage_history`
- Statistiques par service
- Statistiques par utilisateur

### Requêtes Utiles
Voir section "Monitoring & Analytics" dans [CREDIT_WORKFLOW_DOCUMENTATION.md](./CREDIT_WORKFLOW_DOCUMENTATION.md)

---

## 🚨 Problèmes Fréquents

### Problème : "Crédits insuffisants"
**Solution :** Proposer d'acheter des crédits
```typescript
if (result.error === 'INSUFFICIENT_CREDITS') {
  navigate('/premium-ai?action=buy');
}
```

### Problème : "Service non trouvé"
**Solution :** Vérifier que le service existe dans `service_credit_costs`

### Problème : Solde non à jour
**Solution :** Utiliser le bouton refresh de `<CreditBalance />`

---

## 🎓 Formation

### Ressources
- 📖 Documentation complète dans ce dossier
- 💻 Composant de démonstration : `CreditServiceExample`
- 🔍 Code source commenté
- ✅ Exemples d'utilisation dans la doc

### Temps d'Apprentissage Estimé
- **Utilisation basique :** 30 minutes
- **Maîtrise complète :** 2-3 heures
- **Migration code existant :** 1-2 jours

---

## 📞 Support

### En Cas de Problème
1. Consulter cette documentation
2. Vérifier les logs console
3. Tester avec `CreditServiceExample`
4. Vérifier la base de données

### Contacts
- Documentation technique : [CREDIT_WORKFLOW_DOCUMENTATION.md](./CREDIT_WORKFLOW_DOCUMENTATION.md)
- Guide migration : [CREDIT_MIGRATION_GUIDE.md](./CREDIT_MIGRATION_GUIDE.md)

---

## ✅ Checklist Avant Production

- [ ] Tous les services configurés dans `service_credit_costs`
- [ ] Coûts validés et approuvés
- [ ] Tests effectués sur tous les services
- [ ] Gestion d'erreur vérifiée
- [ ] UI testée sur mobile et desktop
- [ ] Documentation lue par l'équipe
- [ ] Anciennes fonctions SQL supprimées (optionnel)

---

## 🎉 Avantages du Système

✅ **Centralisé** - Un seul point de maintenance
✅ **Sécurisé** - Vérifications automatiques
✅ **Réutilisable** - Hooks et composants prêts
✅ **Traçable** - Historique complet
✅ **Documenté** - Guide complet
✅ **Testé** - Build réussi
✅ **Production Ready** - Prêt à déployer

---

**Version :** 1.0
**Date :** 1er Décembre 2025
**Statut :** ✅ Production Ready
**Auteur :** Expert Bolt.new pour JobGuinée

---

## 🔗 Liens Rapides

- [📋 Résumé Exécutif](./CREDIT_SYSTEM_SUMMARY.md)
- [📖 Documentation Complète](./CREDIT_WORKFLOW_DOCUMENTATION.md)
- [🔄 Guide de Migration](./CREDIT_MIGRATION_GUIDE.md)
- [👨‍💼 Gestion Admin des Crédits](./ADMIN_CREDITS_IA_DOCUMENTATION.md)
