# Système de Publication de Formations - Documentation Technique

## Vue d'ensemble

Le système de publication de formations permet aux formateurs et organismes de formation de créer et publier facilement leurs offres sur JobGuinée. Ce document décrit l'architecture, les composants et le flux de navigation.

---

## Architecture

### 1. Helper Centralisé

**Fichier** : `src/utils/trainerNavigationHelper.ts`

Le helper gère intelligemment la navigation vers la publication de formations selon le statut utilisateur.

#### Types

```typescript
export interface TrainerNavigationConfig {
  user: any;
  profile: Profile | null;
  trainerProfile?: TrainerProfile | null;
  onNavigate: (page: string, param?: string) => void;
  onShowModal?: () => void;
  onShowPublishForm?: () => void;
}

export type TrainerNavigationAction =
  | { type: 'navigate'; page: string; param?: string }
  | { type: 'showModal' }
  | { type: 'showPublishForm' };
```

#### Fonction Principale

```typescript
export function handleTrainerNavigation(config: TrainerNavigationConfig): void
```

**Logique** :
- **Utilisateur non connecté** → Affiche modal d'inscription
- **Utilisateur connecté (candidate/recruiter)** → Affiche modal pour créer compte formateur
- **Formateur sans profil complété** → Affiche modal de profil
- **Formateur avec profil** → Ouvre formulaire de publication OU redirige vers dashboard

---

## Composants

### 2. Page Formations

**Fichier** : `src/pages/Formations.tsx`

#### CTA Principal

Section orange en haut de page encourageant les organismes à publier.

```tsx
<button
  onClick={() => {
    handleTrainerNavigation({
      user,
      profile,
      trainerProfile,
      onNavigate,
      onShowModal: () => setShowTrainerModal(true),
      onShowPublishForm: () => setShowFormationPublishForm(true),
    });
  }}
>
  Publier une formation
</button>
```

**Positionnement** : Juste après le header, avant les filtres de recherche

---

### 3. Dashboard Formateur

**Fichier** : `src/pages/TrainerDashboard.tsx`

#### CTA Grande Carte (Overview)

Affiché uniquement si le formateur n'a aucune formation.

```tsx
{formations.length === 0 && (
  <div className="bg-gradient-to-r from-[#FF8C00] to-[#e67e00] rounded-2xl p-8">
    <GraduationCap className="w-16 h-16 mx-auto mb-4" />
    <h3>Publiez votre première formation</h3>
    <button onClick={() => setShowFormationForm(true)}>
      Créer ma première formation
    </button>
  </div>
)}
```

**Positionnement** : Section Overview, avant "Activité Récente"

#### Bouton Création (Onglet Formations)

```tsx
<button
  onClick={() => {
    setSelectedFormationId(undefined);
    setShowFormationForm(true);
  }}
>
  <Plus /> Créer une Formation
</button>
```

**Positionnement** : Header de l'onglet Formations

---

### 4. Formulaire de Publication

**Fichier** : `src/components/forms/FormationPublishForm.tsx`

#### Types d'Organisation

Le formulaire s'adapte selon le type d'organisation :

1. **Individual** (Formateur indépendant)
   - Lieu
   - Horaires
   - Matériel inclus

2. **Company** (Entreprise de formation)
   - Programme personnalisé
   - Réductions groupe
   - Formation corporate

3. **Institute** (Institut/Centre de formation)
   - Campus
   - Accréditation
   - Diplôme
   - Bourses

#### Structure de Données

```typescript
interface CommonData {
  title: string;
  description: string;
  category: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  price: number;
  format: 'presential' | 'online' | 'hybrid';
  duration: string;
  max_participants: number;
  language: string;
  prerequisites: string;
  objectives: string[];
  certification: boolean;
  certification_details: string;
  thumbnail_url: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published';
}
```

---

### 5. Modal d'Application Formateur

**Fichier** : `src/components/formations/TrainerApplicationModal.tsx`

Permet aux utilisateurs non-formateurs de candidater pour devenir formateur.

#### Champs du Formulaire

- Nom complet
- Email
- Téléphone
- LinkedIn
- Domaine d'expertise
- Années d'expérience
- Description
- CV URL
- Portfolio URL
- Formations proposées
- Disponibilité
- Motivation

#### Validation

L'application est créée avec le statut `pending` et doit être validée par un administrateur.

---

## Flux de Navigation

### Scénario 1 : Utilisateur Non Connecté

```
Clic "Publier une formation"
  ↓
handleTrainerNavigation()
  ↓
Affiche TrainerApplicationModal
  ↓
Candidature envoyée → En attente validation
```

### Scénario 2 : Candidat Connecté

```
Clic "Publier une formation"
  ↓
handleTrainerNavigation()
  ↓
Détecte profile.user_type = 'candidate'
  ↓
Affiche TrainerApplicationModal
  ↓
"Souhaitez-vous devenir formateur ?"
  ↓
Candidature → Validation admin
```

### Scénario 3 : Recruteur Connecté

```
Clic "Publier une formation"
  ↓
handleTrainerNavigation()
  ↓
Détecte profile.user_type = 'recruiter'
  ↓
Affiche TrainerApplicationModal
  ↓
"Votre entreprise souhaite aussi proposer des formations ?"
```

### Scénario 4 : Formateur Sans Profil

```
Clic "Publier une formation"
  ↓
handleTrainerNavigation()
  ↓
Détecte user_type = 'trainer' MAIS !trainerProfile
  ↓
Affiche modal : "Complétez d'abord votre profil formateur"
  ↓
Redirige vers TrainerProfileForm
```

### Scénario 5 : Formateur Avec Profil

```
Clic "Publier une formation"
  ↓
handleTrainerNavigation()
  ↓
Détecte user_type = 'trainer' ET trainerProfile existe
  ↓
Si onShowPublishForm fourni :
  → Affiche FormationPublishForm (modal)
Sinon :
  → Redirige vers trainer-dashboard
```

---

## Points d'Intégration

### 1. Chatbot

Le helper `handleTrainerNavigation()` peut être intégré dans le chatbot pour guider les utilisateurs.

Exemple de commande chatbot :
```
"Publier une formation" → handleTrainerNavigation()
```

### 2. Navigation Map

Ajouter dans `src/services/navigationMap.ts` :

```typescript
'publier_formation': {
  action: (context) => handleTrainerNavigation({
    user: context.user,
    profile: context.profile,
    trainerProfile: context.trainerProfile,
    onNavigate: context.onNavigate,
    onShowModal: context.onShowModal
  })
}
```

### 3. Premium

Les formateurs premium peuvent bénéficier de :
- Formations mises en avant
- Templates de formation IA
- Statistiques avancées
- Badge "Formateur Certifié"

### 4. Crédits IA

Services IA disponibles pour les formateurs :
- Génération de description de formation
- Création de programme pédagogique
- Optimisation des prix et mots-clés
- Suggestions de contenu

**Note** : Les services IA existants dans `src/services/iaConfigService.ts` peuvent être réutilisés.

---

## Base de Données

### Tables Concernées

1. **profiles**
   - Champ `user_type` : 'candidate' | 'recruiter' | 'trainer' | 'admin'

2. **trainer_profiles**
   - Profil détaillé du formateur
   - Spécialisations, certifications, tarifs

3. **formations**
   - Toutes les formations publiées
   - Champs spécifiques selon organization_type

4. **trainer_applications**
   - Candidatures pour devenir formateur
   - Status : 'pending' | 'approved' | 'rejected'

5. **formation_enrollments**
   - Inscriptions des candidats aux formations

---

## Configuration Requise

### Variables d'Environnement

Aucune variable supplémentaire nécessaire. Le système utilise la configuration Supabase existante.

### Permissions RLS

Les formations sont protégées par Row Level Security :

```sql
-- Lecture publique des formations publiées
CREATE POLICY "Public can view published formations"
  ON formations FOR SELECT
  USING (status = 'published');

-- Les formateurs peuvent gérer leurs formations
CREATE POLICY "Trainers can manage own formations"
  ON formations FOR ALL
  TO authenticated
  USING (trainer_id IN (
    SELECT id FROM trainer_profiles WHERE user_id = auth.uid()
  ));
```

---

## Tests et Validation

### Cas de Test

1. ✅ Utilisateur non connecté clique → Modal apparaît
2. ✅ Candidat clique → Modal "Devenir formateur"
3. ✅ Recruteur clique → Modal adaptée
4. ✅ Formateur sans profil → Message "Complétez profil"
5. ✅ Formateur avec profil → Formulaire s'ouvre
6. ✅ Build réussi sans erreur TypeScript
7. ✅ Aucune régression sur fonctionnalités existantes

### Validation Build

```bash
npm run build
✓ built in 22.15s
```

---

## Maintenance et Évolutions

### Améliorations Possibles

1. **Génération IA de Formation**
   - Créer un assistant IA pour rédiger description/programme
   - Intégrer avec les services IA existants

2. **Marketplace Premium**
   - Formations payantes avec gestion des paiements
   - Intégration Orange Money (déjà disponible)

3. **Certification Automatique**
   - Génération de certificats PDF après complétion
   - Intégration avec blockchain pour authenticité

4. **Live Sessions**
   - Visioconférence intégrée pour formations en ligne
   - Calendrier de réservation

5. **Analytics Avancées**
   - Dashboard formateur avec statistiques détaillées
   - Tracking de la progression des étudiants

---

## Support et Documentation

### Fichiers Connexes

- `COMPLETE_IA_ECOSYSTEM_DOCUMENTATION.md` - Système IA général
- `CREDIT_STORE_DOCUMENTATION.md` - Gestion des crédits
- `PREMIUM_AI_SERVICES.md` - Services Premium

### Contact Technique

Pour toute question ou amélioration, référez-vous à l'équipe de développement JobGuinée.

---

**Version** : 1.0
**Date** : Décembre 2024
**Auteur** : Système JobGuinée
