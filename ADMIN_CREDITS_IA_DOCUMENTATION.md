# Documentation - Système de Gestion des Crédits IA

## Vue d'ensemble

Cette documentation décrit le système complet de gestion des crédits IA créé pour l'administration de JobGuinée. Le système permet aux administrateurs de gérer les crédits des utilisateurs, suivre leur consommation et visualiser l'historique complet des transactions.

---

## 📦 Structure de la Base de Données

### Tables Existantes (Utilisées)

#### 1. **profiles**
Table principale des utilisateurs

**Champs pertinents:**
- `id` (uuid) - Identifiant unique de l'utilisateur
- `email` (text) - Email de l'utilisateur
- `full_name` (text) - Nom complet
- `user_type` (text) - Type d'utilisateur (candidate, recruiter, trainer, admin)
- `credits_balance` (integer, default: 0) - **Solde de crédits IA disponibles**
- `created_at` (timestamp) - Date de création du compte

#### 2. **credit_transactions**
Table des transactions de crédits

**Champs:**
- `id` (uuid) - Identifiant unique de la transaction
- `user_id` (uuid) - Référence à profiles.id
- `transaction_type` (text) - Type de transaction:
  - `admin_add` - Ajout par administrateur
  - `admin_remove` - Retrait par administrateur
  - `purchase` - Achat de crédits
  - `usage` - Utilisation de crédits
  - `bonus` - Crédits bonus
- `credits_amount` (integer) - Montant de crédits (positif ou négatif)
- `service_code` (text) - Code du service utilisé (si applicable)
- `description` (text) - Description de la transaction
- `balance_before` (integer) - Solde avant la transaction
- `balance_after` (integer) - Solde après la transaction
- `created_at` (timestamp) - Date de la transaction

#### 3. **service_credit_costs**
Table des coûts des services IA

**Champs:**
- `id` (uuid)
- `service_code` (text) - Code unique du service
- `service_name` (text) - Nom du service
- `service_description` (text) - Description
- `credits_cost` (integer) - Coût en crédits
- `category` (text) - Catégorie du service
- `is_active` (boolean) - Statut actif/inactif

**Services disponibles:**
- `job_matching` - Matching IA Emplois (20 crédits)
- `interview_coaching` - Coaching Entretien IA (100 crédits)
- `profile_visibility_boost` - Boost Visibilité Profil (200 crédits)
- `featured_application` - Candidature Prioritaire (50 crédits)
- `direct_message_recruiter` - Message Direct Recruteur (30 crédits)

---

## 🎯 Fonctionnalités Implémentées

### 1. **Dashboard des Statistiques**

Affichage en temps réel de:
- **Total des utilisateurs** sur la plateforme
- **Crédits distribués** (achats + ajouts admin + bonus)
- **Crédits utilisés** (consommation totale)
- **Moyenne de crédits par utilisateur**

### 2. **Liste des Utilisateurs**

Tableau complet avec:
- Nom et email de l'utilisateur
- Type d'utilisateur (Candidat / Recruteur / Formateur)
- Solde de crédits actuel
- Date d'inscription
- Actions rapides (Ajouter / Retirer / Historique)

**Fonctionnalités de filtrage:**
- Recherche par nom ou email
- Filtre par type d'utilisateur
- Actualisation en temps réel

### 3. **Ajout de Crédits**

Modal permettant de:
- Sélectionner un utilisateur
- Spécifier le nombre de crédits à ajouter
- Ajouter une description optionnelle
- Validation et mise à jour instantanée

**Workflow:**
1. Admin clique sur "Ajouter"
2. Entre le montant de crédits
3. Ajoute une description (optionnel)
4. Valide
5. Le système:
   - Met à jour `profiles.credits_balance`
   - Crée une entrée dans `credit_transactions` avec `type = 'admin_add'`
   - Enregistre le `balance_before` et `balance_after`

### 4. **Retrait de Crédits**

Modal permettant de:
- Sélectionner un utilisateur
- Spécifier le nombre de crédits à retirer
- Validation du solde disponible
- Ajouter une description optionnelle

**Sécurités:**
- Vérification que le montant à retirer ≤ solde disponible
- Message d'erreur si tentative de retrait excessif

### 5. **Historique Complet**

Modal détaillé affichant:
- Toutes les transactions de l'utilisateur
- Date et heure précises
- Type d'opération
- Montant (avec + ou -)
- Service concerné (si applicable)
- Description
- Solde avant/après chaque opération

**Vue Globale:**
- Tableau des 100 dernières transactions sur toute la plateforme
- Filtrable et consultable pour audit

---

## 🗂️ Fichiers Créés / Modifiés

### Fichiers Créés

#### `/src/pages/AdminCreditsIA.tsx`
Page principale de gestion des crédits IA.

**Composants inclus:**
- Dashboard de statistiques (4 cartes)
- Tableau de liste des utilisateurs
- Modal d'ajout de crédits
- Modal de retrait de crédits
- Modal d'historique des transactions
- Tableau des dernières transactions globales

**Hooks utilisés:**
- `useState` pour la gestion d'état locale
- `useEffect` pour le chargement des données
- `useAuth` pour vérifier les permissions admin

**Sécurité:**
- Vérification `isAdmin` obligatoire
- Accès refusé si non-admin

### Fichiers Modifiés

#### `/src/App.tsx`
**Modifications:**
- Import de `AdminCreditsIA`
- Ajout du type `'admin-credits-ia'` dans le type `Page`
- Ajout de la route conditionnelle:
  ```tsx
  {currentPage === 'admin-credits-ia' && <AdminCreditsIA onNavigate={handleNavigate} />}
  ```

#### `/src/components/AdminLayout.tsx`
**Modifications:**
- Import de l'icône `Coins` de lucide-react
- Ajout d'un bouton "Crédits IA" dans la navigation admin:
  ```tsx
  <button onClick={() => onNavigate('admin-credits-ia')}>
    <Coins className="w-4 h-4" />
    <span>Crédits IA</span>
  </button>
  ```

---

## 🚦 Routes & Navigation

### Nouvelle Route
- **URL interne:** `admin-credits-ia`
- **Composant:** `AdminCreditsIA`
- **Accès:** Réservé aux utilisateurs avec `user_type = 'admin'`

### Navigation
L'administrateur peut accéder à la page via:
1. Le bouton "Crédits IA" dans le menu de navigation admin
2. Navigation directe depuis d'autres pages admin

---

## 🔐 Sécurité & Contrôles

### Vérification des Permissions
```tsx
const { isAdmin } = useAuth();

if (!isAdmin) {
  return <AccessDenied />;
}
```

### Validation des Opérations
- **Ajout:** Aucune limite, montant positif obligatoire
- **Retrait:** Vérification que `montant ≤ credits_balance`
- **Transactions:** Enregistrement systématique avec balance avant/après

### Audit Trail
Toutes les opérations admin sont tracées dans `credit_transactions` avec:
- Timestamp précis
- Utilisateur concerné
- Type d'opération (`admin_add` ou `admin_remove`)
- Montants et soldes
- Description de l'opération

---

## 🎨 Design & UX

### Palette de Couleurs
- **Bleu:** Navigation et actions principales
- **Vert:** Ajout de crédits, transactions positives
- **Rouge:** Retrait de crédits, transactions négatives
- **Jaune/Orange:** Icônes de crédits, mise en valeur
- **Gris:** Textes secondaires et bordures

### Composants UI
- **Cartes statistiques:** 4 cartes avec icônes et chiffres clés
- **Tableaux:** Design moderne avec hover states
- **Modals:** Centrées avec overlay sombre
- **Boutons:** Codes couleur selon l'action
- **Badges:** Pour les types d'utilisateurs

### Responsive Design
- Grilles adaptatives (1 à 4 colonnes selon l'écran)
- Tables avec scroll horizontal sur mobile
- Modals avec hauteur maximale et scroll

---

## 📊 Logique Métier

### Calcul des Statistiques

**Total Crédits Distribués:**
```sql
SUM(credits_amount) WHERE transaction_type IN ('purchase', 'admin_add', 'bonus')
```

**Total Crédits Utilisés:**
```sql
SUM(credits_amount) WHERE transaction_type = 'usage'
```

**Moyenne par Utilisateur:**
```sql
SUM(profiles.credits_balance) / COUNT(profiles.id)
```

### Workflow d'Ajout de Crédits

1. Admin sélectionne un utilisateur
2. Entre le montant souhaité
3. (Optionnel) Ajoute une description
4. Clique sur "Ajouter"
5. Système exécute:
   ```typescript
   // 1. Calcul nouveau solde
   const newBalance = currentBalance + creditAmount;

   // 2. Mise à jour du profil
   await supabase
     .from('profiles')
     .update({ credits_balance: newBalance })
     .eq('id', userId);

   // 3. Enregistrement de la transaction
   await supabase
     .from('credit_transactions')
     .insert({
       user_id: userId,
       transaction_type: 'admin_add',
       credits_amount: creditAmount,
       description: description,
       balance_before: currentBalance,
       balance_after: newBalance
     });
   ```

### Workflow de Retrait de Crédits

Identique à l'ajout mais avec:
- Validation: `creditAmount <= currentBalance`
- `transaction_type: 'admin_remove'`
- `credits_amount: -creditAmount` (négatif)

---

## 🧪 Tests & Validation

### Tests Fonctionnels Recommandés

1. **Test d'Accès**
   - ✅ Utilisateur non-admin ne peut pas accéder
   - ✅ Admin peut accéder

2. **Test d'Ajout de Crédits**
   - ✅ Ajout de crédits valide
   - ✅ Mise à jour du solde
   - ✅ Création de transaction
   - ✅ Refresh automatique des données

3. **Test de Retrait de Crédits**
   - ✅ Retrait valide
   - ✅ Blocage si montant > solde
   - ✅ Enregistrement correct

4. **Test d'Historique**
   - ✅ Affichage des transactions
   - ✅ Tri chronologique inverse
   - ✅ Affichage des soldes avant/après

5. **Test de Recherche/Filtres**
   - ✅ Recherche par email
   - ✅ Recherche par nom
   - ✅ Filtre par type d'utilisateur

---

## 🚀 Améliorations Futures (Recommandations)

### Fonctionnalités Additionnelles

1. **Export de Données**
   - Export CSV/Excel de l'historique
   - Rapports mensuels automatiques

2. **Notifications**
   - Email à l'utilisateur lors d'ajout/retrait de crédits
   - Alertes pour soldes faibles

3. **Packages de Crédits**
   - Interface pour définir des packages prédéfinis
   - Offres promotionnelles

4. **Analytics Avancés**
   - Graphiques de consommation
   - Prévisions de besoins
   - Rapports par service

5. **Actions en Masse**
   - Ajout de crédits à plusieurs utilisateurs simultanément
   - Crédits bonus pour groupes d'utilisateurs

---

## 📝 Notes Importantes

### Doublons Évités
- ✅ Aucun doublon créé
- ✅ Utilisation des tables existantes
- ✅ Respect de l'architecture existante

### Intégration
- ✅ S'intègre parfaitement dans le système admin existant
- ✅ Utilise les composants et styles cohérents
- ✅ Respecte les patterns de code du projet

### Performance
- Chargement optimisé des données (LIMIT 100 sur transactions)
- Requêtes avec index sur `user_id` et `created_at`
- Refresh manuel pour éviter les polls constants

---

## 🔗 Dépendances

### Librairies Utilisées
- `react` - Framework UI
- `lucide-react` - Icônes
- `@supabase/supabase-js` - Client Supabase
- `tailwindcss` - Styles

### Contextes
- `AuthContext` - Gestion de l'authentification et permissions
- `CMSContext` - (non utilisé directement mais disponible)
- `NotificationContext` - (prêt pour futures notifications)

---

## 🎓 Formation Admin

### Guide Rapide d'Utilisation

1. **Accéder à la page:**
   - Se connecter en tant qu'admin
   - Cliquer sur "Crédits IA" dans le menu

2. **Voir les statistiques:**
   - Dashboard en haut de page avec 4 indicateurs clés

3. **Chercher un utilisateur:**
   - Utiliser la barre de recherche (nom ou email)
   - Filtrer par type si besoin

4. **Ajouter des crédits:**
   - Cliquer sur "Ajouter" pour l'utilisateur
   - Entrer le montant
   - Valider

5. **Retirer des crédits:**
   - Cliquer sur "Retirer"
   - Entrer le montant (doit être ≤ solde)
   - Valider

6. **Consulter l'historique:**
   - Cliquer sur "Historique" pour un utilisateur
   - Voir toutes ses transactions

---

## 📞 Support & Maintenance

### En cas de problème

1. **Erreur de chargement:**
   - Vérifier la connexion Supabase
   - Vérifier les permissions de la table

2. **Impossibilité d'ajouter/retirer:**
   - Vérifier les logs console
   - Vérifier les RLS policies sur `credit_transactions`

3. **Données non à jour:**
   - Cliquer sur "Actualiser"
   - Vérifier les triggers DB

### Logs
- Tous les erreurs sont loggées dans la console
- Les transactions sont enregistrées avec timestamp précis

---

## ✅ Résumé Final

### Ce qui a été créé:
✅ Page AdminCreditsIA complète et fonctionnelle
✅ 4 statistiques clés en temps réel
✅ Gestion complète (ajout/retrait/historique)
✅ Interface responsive et moderne
✅ Sécurité admin obligatoire
✅ Navigation intégrée au menu admin

### Ce qui a été modifié:
✅ App.tsx - Ajout de la route
✅ AdminLayout.tsx - Ajout du bouton de navigation

### Ce qui existait déjà et a été utilisé:
✅ Tables: profiles, credit_transactions, service_credit_costs
✅ Champ: profiles.credits_balance
✅ Système de transactions complet
✅ Types de transactions définis

### Aucun doublon créé
✅ 0 table dupliquée
✅ 0 composant dupliqué
✅ 0 route dupliquée

---

**Date de création:** 1er Décembre 2025
**Version:** 1.0
**Statut:** Production Ready ✅
