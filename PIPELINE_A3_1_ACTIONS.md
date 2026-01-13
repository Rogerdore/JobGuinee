# Pipeline A3.1 - Actions Métier sur les Candidatures

## ✅ Implémentation Complète

Cette documentation décrit l'implémentation des actions métier sur les candidatures dans le pipeline recruteur de JobGuinée.

---

## 📋 Fonctionnalités Implémentées

### 1. Notes Internes Recruteur
- **Table**: `application_notes` (existante, réutilisée)
- **Fonctionnalité**: Les recruteurs peuvent ajouter des notes privées sur chaque candidature
- **Accès**: Notes visibles uniquement par les recruteurs de l'entreprise
- **UI**: Modal de saisie accessible via le menu d'actions (⋮)

### 2. Shortlist
- **Colonnes ajoutées**: `is_shortlisted`, `shortlisted_at` (déjà présentes dans `applications`)
- **Fonctionnalité**: Marquer les candidatures les plus prometteuses
- **UI**:
  - Badge vert "Shortlisté" avec étoile sur les cartes
  - Toggle via le menu d'actions
  - Indicateur visuel clair

### 3. Rejet avec Motif Obligatoire
- **Colonnes ajoutées**: `rejected_reason`, `rejected_at` (déjà présentes dans `applications`)
- **Fonctionnalité**:
  - Rejet de candidature avec motif obligatoire
  - Confirmation avant action
  - Déplacement automatique vers l'étape "rejected"
- **UI**:
  - Badge rouge "Rejeté" sur les cartes
  - Modal avec champ obligatoire pour le motif
  - Affichage du motif pour traçabilité interne
  - Le candidat ne voit PAS le motif (confidentiel)

### 4. Historique des Actions
- **Table créée**: `application_activity_log`
- **Fonctionnalité**: Traçabilité complète de toutes les actions
- **Actions loggées**:
  - Ajout de note
  - Shortlist / Retrait shortlist
  - Rejet avec motif
  - Changement d'étape workflow
- **UI**: Modal d'historique affichant chronologiquement:
  - Notes internes
  - Actions effectuées
  - Qui a fait l'action et quand
  - Métadonnées (motif de rejet, changement d'étape, etc.)

---

## 🗄️ Structure de la Base de Données

### Table: `application_notes`
Réutilisée (déjà existante)
```sql
- id: uuid
- application_id: uuid (FK vers applications)
- recruiter_id: uuid (FK vers auth.users)
- note_text: text
- is_private: boolean
- created_at: timestamptz
```

### Table: `application_activity_log`
Nouvellement créée
```sql
- id: uuid
- application_id: uuid (FK vers applications)
- actor_id: uuid (FK vers auth.users)
- action_type: text (note_added, shortlisted, rejected, stage_changed, etc.)
- metadata: jsonb (données additionnelles sur l'action)
- created_at: timestamptz
```

### Trigger Automatique
Un trigger `log_application_action()` enregistre automatiquement:
- Changements de shortlist
- Rejets
- Changements d'étape workflow

---

## 🔐 Sécurité (RLS)

### application_notes
- ✅ Recruteurs peuvent lire leurs notes
- ✅ Recruteurs peuvent créer des notes
- ❌ Candidats n'ont AUCUN accès

### application_activity_log
- ✅ Recruteurs peuvent voir l'historique de leurs candidatures
- ✅ Recruteurs peuvent créer des entrées d'historique
- ❌ Candidats n'ont AUCUN accès

### Vérifications
- Toutes les actions vérifient que l'utilisateur est bien recruteur
- Accès limité aux candidatures de l'entreprise du recruteur
- Les motifs de rejet sont confidentiels (internes uniquement)

---

## 🎨 Interface Utilisateur

### Menu d'Actions (⋮)
Disponible sur chaque carte candidature avec:
- 📝 **Ajouter une note**: Ouvre un modal pour saisir une note privée
- ⭐ **Shortlister / Retirer de la shortlist**: Toggle instantané avec badge visuel
- 🕒 **Voir l'historique**: Affiche toutes les notes et actions passées
- ❌ **Rejeter la candidature**: Modal avec motif obligatoire + confirmation

### Badges Visuels
- **Badge vert "Shortlisté"**: Avec icône étoile, en haut à gauche de la carte
- **Badge rouge "Rejeté"**: En haut à gauche de la carte
- **Encart motif de rejet**: Affiché sous la carte si candidature rejetée

### Modals
1. **Modal Note**: Textarea pour saisir note + boutons Annuler/Enregistrer
2. **Modal Rejet**:
   - Message d'information
   - Textarea obligatoire pour le motif
   - Confirmation avant rejet
3. **Modal Historique**:
   - Section "Notes internes" avec toutes les notes
   - Section "Activités" avec timeline des actions
   - Auteur et timestamp pour chaque entrée

---

## 📦 Fichiers Créés/Modifiés

### Nouveaux Fichiers
- `/src/services/applicationActionsService.ts`: Service centralisé pour toutes les actions
- `/supabase/migrations/create_application_actions_history_v2.sql`: Table d'historique + triggers

### Fichiers Modifiés
- `/src/components/recruiter/ApplicationCard.tsx`:
  - Ajout du menu d'actions
  - Ajout des 3 modals
  - Badges visuels
  - Gestion des états

---

## 🔄 Workflow

### Ajouter une Note
```
1. Clic sur ⋮ > "Ajouter une note"
2. Modal s'ouvre
3. Saisie de la note
4. Clic "Enregistrer"
5. Note enregistrée en DB
6. Entrée créée dans activity_log
7. Carte mise à jour
```

### Shortlister
```
1. Clic sur ⋮ > "Ajouter à la shortlist"
2. Mise à jour immédiate is_shortlisted = true
3. Trigger automatique log l'action dans activity_log
4. Badge vert "Shortlisté" apparaît
5. Carte mise à jour
```

### Rejeter
```
1. Clic sur ⋮ > "Rejeter la candidature"
2. Modal s'ouvre
3. Saisie obligatoire du motif
4. Confirmation "Êtes-vous sûr ?"
5. Si oui:
   - rejected_reason enregistré
   - rejected_at = now()
   - workflow_stage = 'rejected'
   - Trigger log l'action avec motif
6. Badge rouge "Rejeté" + encart motif apparaissent
```

### Voir Historique
```
1. Clic sur ⋮ > "Voir l'historique"
2. Modal s'ouvre
3. Chargement parallèle de:
   - Toutes les notes (application_notes)
   - Toutes les activités (application_activity_log)
4. Affichage chronologique inversé (plus récent en haut)
```

---

## 🧪 Tests Effectués

✅ Build sans erreur
✅ ApplicationCard affiche correctement le menu d'actions
✅ Les 3 modals s'ouvrent et se ferment correctement
✅ Les badges s'affichent selon l'état
✅ Le service applicationActionsService fonctionne
✅ Pas de régression sur le pipeline existant

---

## 🚀 Prochaines Étapes (Hors Scope A3.1)

Les fonctionnalités suivantes sont **volontairement exclues** de A3.1:
- ❌ Envoi d'emails/SMS/WhatsApp aux candidats
- ❌ Notifications push
- ❌ Filtres avancés par shortlist
- ❌ Export des candidatures
- ❌ Statistiques sur les rejets

---

## 📝 Notes Importantes

1. **Aucune donnée supprimée**: Tous les champs existants ont été préservés
2. **Pas de duplication**: Réutilisation des tables existantes quand possible
3. **Sécurité maximale**: RLS stricte sur toutes les tables
4. **Traçabilité complète**: Tout est loggé dans activity_log
5. **UX intuitive**: Menu contextuel, badges visuels, confirmations
6. **Confidentialité**: Les motifs de rejet ne sont JAMAIS visibles par les candidats

---

## 🔧 Maintenance

### Ajouter un nouveau type d'action
1. Ajouter le type dans `action_type` de activity_log
2. Ajouter le label dans `getActionLabel()` du service
3. Si besoin, étendre le trigger `log_application_action()`

### Modifier les permissions
- Éditer les policies RLS dans la migration
- Redéployer la migration

---

## 📞 Support

Pour toute question sur cette implémentation:
- Consulter le code dans `/src/services/applicationActionsService.ts`
- Vérifier les policies RLS dans la migration
- Tester dans l'interface recruteur via le menu ⋮

---

**Date d'implémentation**: 2024
**Version**: A3.1 - Actions Métier
**Statut**: ✅ Complet et Opérationnel
