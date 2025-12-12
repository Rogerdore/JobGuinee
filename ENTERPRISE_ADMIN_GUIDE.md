# Guide Administrateur - Packs Enterprise

## 🎯 Accès Rapide

**URL Admin** : `/admin-enterprise-subscriptions`

**Page dans l'app** : Cliquer sur "Admin Enterprise" dans le menu admin

---

## 📊 Vue d'Ensemble

La page admin affiche 4 indicateurs clés :

1. **En attente** (orange) : Souscriptions en attente de validation
2. **Actifs** (vert) : Abonnements actifs en cours
3. **Rejetés** (rouge) : Souscriptions rejetées
4. **Revenu mensuel** (bleu) : Revenu total des abonnements actifs

---

## 🔍 Filtrage et Recherche

### Filtres disponibles :
- **Tous les statuts** : Affiche toutes les souscriptions
- **En attente** : Uniquement les souscriptions pending
- **Actifs** : Uniquement les abonnements actifs
- **Rejetés** : Uniquement les souscriptions rejetées
- **Expirés** : Abonnements expirés

### Barre de recherche :
Recherche par :
- Nom de l'entreprise
- Nom du recruteur
- Email du recruteur

---

## ✅ Approuver une Souscription

### Étapes :

1. **Cliquer sur "Gérer"** dans la ligne de la souscription

2. **Vérifier les informations** :
   - Nom de l'entreprise
   - Pack choisi
   - Prix payé
   - Référence de paiement
   - Preuve de paiement (si uploadée)

3. **Pour le pack GOLD uniquement** :
   - Configurer la **limite journalière** de matching IA
   - Recommandé : 100 matching/jour
   - Ajustable entre 50 et 500

4. **Ajouter des notes** (optionnel) :
   - Notes d'approbation
   - Conditions particulières
   - Instructions spécifiques

5. **Cliquer sur "Approuver"**

### Résultat :
- Status → `active`
- Payment status → `completed`
- `start_date` → Date actuelle
- `end_date` → Date actuelle + 30 jours
- Le recruteur reçoit accès immédiat

---

## ❌ Rejeter une Souscription

### Étapes :

1. **Cliquer sur "Gérer"** sur la souscription

2. **Cliquer sur "Rejeter"**

3. **Entrer la raison du rejet** (obligatoire) :
   - Exemples :
     - "Paiement non confirmé"
     - "Informations entreprise incomplètes"
     - "Doublons détecté"
     - "Suspicion de fraude"

4. **Confirmer**

### Résultat :
- Status → `rejected`
- Payment status → `cancelled`
- `rejection_reason` enregistrée
- Le recruteur est notifié (si système de notification activé)

---

## 🏅 Cas Spécial : Pack GOLD

### Pourquoi validation obligatoire ?

Le pack GOLD offre :
- **CV illimités**
- **Matching IA illimité**
- Risque d'abus élevé

### Protection anti-abus :

1. **Validation admin obligatoire**
   - Vérifier la légitimité de l'entreprise
   - Confirmer le besoin réel

2. **Limite journalière configurable**
   - Par défaut : 100 matching/jour
   - Empêche l'utilisation excessive en une seule journée
   - Réinitialisation automatique à minuit

3. **Audit automatique**
   - Tous les usages sont trackés dans `enterprise_usage_tracking`
   - Possibilité de suspendre en cas d'abus

### Configuration limite GOLD :

```
Limite recommandée : 100 matching/jour

Petite entreprise (< 50 employés) : 50-75/jour
Moyenne entreprise (50-200) : 100-150/jour
Grande entreprise (> 200) : 150-300/jour
Cabinet RH multi-clients : 200-500/jour
```

---

## 📋 Informations Affichées

### Colonnes du tableau :

| Colonne | Description |
|---------|-------------|
| **Entreprise** | Nom, responsable, email |
| **Pack** | Type d'abonnement + badge validation |
| **Prix** | Montant en millions GNF |
| **Statut** | pending / active / rejected / expired |
| **Paiement** | Status du paiement + lien preuve |
| **Date** | Date de création de la souscription |
| **Actions** | Bouton "Gérer" |

### Badges :

- 🔵 **ENTERPRISE BASIC** : Bleu
- 🟡 **ENTERPRISE PRO** : Jaune
- 🟠 **ENTERPRISE GOLD** : Orange + 🛡️ shield
- 🟣 **CABINET RH** : Violet

---

## 🔐 Vérification du Paiement

### Avant d'approuver :

1. **Vérifier la référence Orange Money**
   - Format : `OM` + chiffres (ex: OM123456789)
   - Doit être unique dans le système

2. **Consulter la preuve de paiement** (si fournie)
   - Cliquer sur l'icône 🔗 à côté du status paiement
   - Vérifier :
     - Montant correct
     - Destinataire correct (JobGuinée SARL)
     - Date récente

3. **Confirmer avec Orange Money** (recommandé)
   - Contacter le service pour vérifier la transaction
   - Numéro : 657 76 99 99

---

## 🎯 Workflow Recommandé

### Pour les packs BASIC et PRO (sans validation) :

1. Recruteur souscrit → Status `pending`
2. Admin vérifie paiement
3. Admin approuve → Status `active`
4. Accès immédiat

**Temps recommandé** : < 24h

### Pour le pack GOLD (avec validation) :

1. Recruteur souscrit → Status `pending` + flag validation
2. Admin vérifie :
   - Paiement
   - Légitimité entreprise
   - Profil LinkedIn de l'entreprise
   - Site web de l'entreprise
3. Admin configure limite journalière
4. Admin approuve → Status `active`
5. Accès avec limites configurées

**Temps recommandé** : 24-48h (vérifications approfondies)

---

## 🚨 Situations Problématiques

### 1. Doublon de souscription

**Symptôme** : Même entreprise/email apparaît 2 fois

**Action** :
- Vérifier les dates
- Approuver la plus récente
- Rejeter l'ancienne avec raison "Souscription remplacée"

### 2. Paiement non confirmé

**Symptôme** : Aucune preuve de paiement + référence suspecte

**Action** :
- Contacter le recruteur par email
- Demander preuve de paiement
- Ne pas approuver sans confirmation

### 3. Informations entreprise suspectes

**Symptôme** : Nom générique, pas de site web, email non professionnel

**Action** :
- Demander documents officiels (RCCM, NIF)
- Vérifier existence réelle de l'entreprise
- Rejeter si suspicion de fraude

### 4. Demande d'upgrade/downgrade

**Symptôme** : Recruteur veut changer de pack

**Action** :
- Le recruteur doit créer une nouvelle souscription
- Annuler l'ancienne (si demandé)
- Pas de prorata automatique

---

## 📊 Monitoring des Usages

### Pour surveiller l'utilisation :

1. **Via la base de données** :
```sql
SELECT
  usage_type,
  COUNT(*) as count
FROM enterprise_usage_tracking
WHERE company_id = '<company_id>'
  AND used_at > NOW() - INTERVAL '30 days'
GROUP BY usage_type;
```

2. **Indicateurs à surveiller** :
   - Matching IA : > 500/mois → usage intensif
   - CV views : > 800/mois → usage intensif
   - Pattern suspect : tous les usages le même jour

3. **Actions si abus détecté** :
   - Contacter le recruteur
   - Expliquer les limites
   - Suspendre temporairement si nécessaire
   - Proposer upgrade vers pack supérieur

---

## 🔄 Gestion des Renouvellements

### Processus actuel :

Les renouvellements sont **manuels** :
- 7 jours avant expiration → Envoyer rappel au recruteur
- Le recruteur doit créer une nouvelle souscription
- Admin valide comme une nouvelle souscription

### Renouvellement automatique (non implémenté) :

Pour l'avenir :
- Intégration API Orange Money
- Prélèvement automatique mensuel
- Notification en cas d'échec

---

## 🆘 Support et Assistance

### Questions fréquentes :

**Q : Peut-on modifier une souscription active ?**
R : Non. Il faut l'annuler et en créer une nouvelle.

**Q : Comment annuler un abonnement ?**
R : Utiliser la fonction cancel dans la base de données ou contacter le développeur.

**Q : Un GOLD peut-il vraiment être illimité ?**
R : Oui, mais avec limite journalière. C'est pour éviter les abus tout en offrant de la flexibilité.

**Q : Que faire si le paiement est partiel ?**
R : Rejeter et demander paiement complet. Pas de paiements partiels.

**Q : Peut-on offrir un essai gratuit ?**
R : Oui, créer manuellement une souscription avec price_gnf = 0.

---

## 📞 Contacts Utiles

**Service Orange Money** : 657 76 99 99
**Email support JobGuinée** : admin@jobguinee.com
**Support technique** : dev@jobguinee.com

---

## ✅ Checklist Validation

Avant d'approuver une souscription :

- [ ] Vérifier paiement (référence + preuve)
- [ ] Vérifier informations entreprise
- [ ] Pour GOLD : configurer limite journalière
- [ ] Ajouter notes si conditions particulières
- [ ] Cliquer sur "Approuver"
- [ ] Vérifier que status passe à "active"

---

## 🎉 Bonnes Pratiques

1. **Réactivité** : Valider dans les 24h pour bonne expérience client
2. **Communication** : Toujours expliquer les rejets clairement
3. **Sécurité** : Ne jamais approuver sans confirmation paiement
4. **Monitoring** : Surveiller les usages GOLD toutes les semaines
5. **Documentation** : Noter les cas particuliers dans les notes admin

---

**Dernière mise à jour** : Décembre 2024
**Version** : 1.0
