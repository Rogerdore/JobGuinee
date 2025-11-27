# Guide du Profil Gold - JobGuinée

## Vue d'ensemble

Le **Profil Gold** est le service premium ultime de JobGuinée, offrant une visibilité maximale et un accompagnement personnalisé complet aux candidats.

## Caractéristiques Principales

### 1. Visibilité Maximale
- **Positionnement prioritaire** : Les profils Gold apparaissent en première page des résultats de recherche
- **Boost de visibilité x10** : Augmentation drastique de la portée du profil
- **Badge Gold distinctif** : Badge visible sur le profil du candidat
- **Priority ranking = 100** : Score de priorité le plus élevé dans l'algorithme de classement

### 2. Coaching Personnalisé
Les membres Gold bénéficient de **3 séances de coaching** avec les experts JobGuinée :

#### Types de séances disponibles
1. **Revue de CV** (cv_review)
   - Analyse complète du CV
   - Conseils d'amélioration
   - Optimisation ATS

2. **Préparation Entretien** (interview_prep)
   - Simulation d'entretien
   - Techniques de réponse
   - Gestion du stress

3. **Planification Carrière** (career_planning)
   - Analyse de trajectoire
   - Identification d'opportunités
   - Plan de développement

4. **Négociation Salariale** (salary_negotiation)
   - Recherche de marché
   - Techniques de négociation
   - Stratégies d'argumentation

5. **Coaching Général** (general_coaching)
   - Accompagnement sur mesure
   - Problématiques spécifiques
   - Conseils personnalisés

### 3. Vidéo CV Professionnelle
- **Création assistée** par l'équipe JobGuinée
- **Qualité professionnelle** : Tournage et montage
- **Publication sur le profil** : Visibilité maximale
- **Statistiques de visionnage** : Tracking des vues

### 4. Statistiques Avancées
Tableau de bord complet avec :
- **Vues du profil** (30 derniers jours)
- **Apparitions en première page**
- **Contacts révélés** par les recruteurs
- **Apparitions totales** dans les recherches

## Tarification

**500,000 GNF pour 3 mois**
- Soit 166,667 GNF/mois
- Paiement via Orange Money, LengoPay ou DigitalPay SA
- Renouvellement possible

## Workflow d'Activation

### Pour les candidats

1. **Découvrir le service**
   ```
   Dashboard Candidat > Services Premium > Profil Gold
   ```

2. **Souscrire**
   - Cliquer sur "Devenir Membre Gold"
   - Effectuer le paiement (500,000 GNF)
   - Confirmation par l'équipe JobGuinée

3. **Activation du profil**
   - Statut Gold activé immédiatement après validation du paiement
   - Badge Gold visible sur le profil
   - Boost de visibilité actif

4. **Réserver les séances de coaching**
   - Accéder à l'espace Gold
   - Cliquer sur "Réserver une séance"
   - Choisir le type et la date
   - Confirmation par l'équipe

5. **Planifier la vidéo CV**
   - Contacter l'équipe via l'espace Gold
   - Planification du tournage
   - Validation du script
   - Tournage et montage
   - Publication sur le profil

### Pour les administrateurs

#### Activation manuelle d'un profil Gold

```bash
node activate-gold-profile.js activate user@example.com 3
```

Paramètres :
- Email du candidat
- Durée en mois (défaut: 3)

#### Désactivation d'un profil Gold

```bash
node activate-gold-profile.js deactivate user@example.com
```

#### Liste des profils Gold actifs

```bash
node activate-gold-profile.js list
```

#### Via la base de données (SQL)

```sql
-- Activer un profil Gold
UPDATE candidate_profiles
SET
  is_gold_member = true,
  gold_member_since = NOW(),
  gold_member_expires_at = NOW() + INTERVAL '3 months',
  visibility_boost = 10,
  priority_ranking = 100
WHERE user_id = 'USER_UUID';

-- Désactiver un profil Gold
UPDATE candidate_profiles
SET
  is_gold_member = false,
  gold_member_expires_at = NULL,
  visibility_boost = 0,
  priority_ranking = 0
WHERE user_id = 'USER_UUID';
```

## Gestion des Séances de Coaching

### Créer une séance

```sql
INSERT INTO coaching_sessions (
  user_id,
  coach_id,
  session_type,
  scheduled_at,
  duration_minutes,
  status
)
VALUES (
  'USER_UUID',
  'COACH_UUID',
  'cv_review',
  '2025-02-01 14:00:00',
  60,
  'scheduled'
);
```

### Mettre à jour le statut

```sql
UPDATE coaching_sessions
SET
  status = 'completed',
  coach_feedback = 'Excellente séance, candidat très motivé. Points à améliorer: ...'
WHERE id = 'SESSION_UUID';
```

### Ajouter une note

```sql
UPDATE coaching_sessions
SET rating = 5
WHERE id = 'SESSION_UUID';
```

## Gestion des Vidéos CV

### Créer une vidéo CV

```sql
INSERT INTO video_cvs (
  user_id,
  title,
  description,
  status,
  created_by_coach,
  coach_id
)
VALUES (
  'USER_UUID',
  'Présentation professionnelle - Nom Prénom',
  'Vidéo CV professionnelle créée par l''équipe JobGuinée',
  'processing',
  true,
  'COACH_UUID'
);
```

### Publier une vidéo

```sql
UPDATE video_cvs
SET
  status = 'published',
  video_url = 'https://storage.example.com/videos/cv_user123.mp4',
  thumbnail_url = 'https://storage.example.com/thumbnails/cv_user123.jpg',
  duration_seconds = 120,
  file_size_mb = 25.5
WHERE id = 'VIDEO_UUID';
```

## Tracking de Visibilité

La visibilité des profils Gold est automatiquement trackée via la fonction `track_profile_view()`.

### Appel dans le code

```typescript
// Lorsqu'un profil apparaît dans les résultats
await supabase.rpc('track_profile_view', {
  p_user_id: candidateId,
  p_is_first_page: isFirstPage
});
```

### Consulter les statistiques

```sql
SELECT
  date,
  first_page_appearances,
  total_appearances,
  profile_views,
  contact_reveals
FROM profile_visibility_stats
WHERE user_id = 'USER_UUID'
ORDER BY date DESC
LIMIT 30;
```

## Algorithme de Boost

Les profils Gold bénéficient d'un boost automatique dans les résultats de recherche :

```sql
-- Fonction exécutée régulièrement (cron job)
SELECT boost_gold_profiles();
```

Cette fonction :
1. Met à jour le `priority_ranking` à 100 pour les Gold actifs
2. Met à jour le `visibility_boost` à 10
3. Désactive automatiquement les profils Gold expirés

## Intégration dans la CVthèque

Les recruteurs voient les profils Gold en priorité :

```sql
-- Exemple de requête de recherche
SELECT *
FROM candidate_profiles cp
JOIN profiles p ON p.id = cp.user_id
WHERE cp.skills @> ARRAY['JavaScript']
ORDER BY
  cp.priority_ranking DESC,  -- Gold = 100, Normal = 0
  cp.visibility_boost DESC,  -- Gold = 10, Normal = 0
  cp.updated_at DESC
LIMIT 20;
```

## Notifications et Communications

### Email de bienvenue Gold
Envoyé automatiquement lors de l'activation :
- Félicitations pour le statut Gold
- Instructions pour réserver les séances
- Contact pour la vidéo CV
- Guide d'utilisation

### Rappels
- 1 semaine avant expiration : Proposition de renouvellement
- Au moment de l'expiration : Notification de fin d'abonnement
- Après séance de coaching : Email de feedback

## Support et Assistance

### Pour les membres Gold
- **Support prioritaire** : Réponse sous 2h ouvrées
- **Contact direct** : Ligne dédiée équipe JobGuinée
- **Chat prioritaire** : File d'attente prioritaire

### Coordonnées support
- Email : gold@jobguinee.com
- Téléphone : +224 XXX XX XX XX (ligne Gold)
- WhatsApp Business : +224 XXX XX XX XX

## Métriques de Succès

Indicateurs à suivre pour les profils Gold :

1. **Taux de conversion**
   - Candidatures reçues
   - Entretiens obtenus
   - Offres reçues

2. **Engagement**
   - Vues de profil
   - Contacts révélés
   - Messages reçus

3. **Satisfaction**
   - Notes séances de coaching
   - Taux de renouvellement
   - NPS (Net Promoter Score)

## Best Practices

### Pour maximiser la visibilité Gold

1. **Profil complet à 100%**
   - Photo professionnelle
   - CV à jour
   - Compétences détaillées
   - Expériences complètes

2. **Vidéo CV impactante**
   - Durée optimale : 90-120 secondes
   - Message clair et concis
   - Professionnel mais authentique

3. **Utilisation des séances de coaching**
   - Préparer les questions à l'avance
   - Appliquer les conseils reçus
   - Demander un suivi si nécessaire

4. **Activité régulière**
   - Connexion régulière
   - Mise à jour du profil
   - Réponse rapide aux messages

## Roadmap

### Fonctionnalités futures
- [ ] Live chat avec les recruteurs
- [ ] Webinaires exclusifs Gold
- [ ] Events networking réservés
- [ ] Analyse IA avancée du profil
- [ ] Recommandations d'emploi prédictives
- [ ] Matching proactif avec entreprises premium

## FAQ

**Q: Que se passe-t-il si je n'utilise pas mes 3 séances de coaching ?**
R: Les séances sont valables pendant toute la durée de votre abonnement Gold. Elles ne sont pas reportables après expiration.

**Q: Puis-je renouveler mon abonnement Gold avant l'expiration ?**
R: Oui, le renouvellement étend simplement la date d'expiration de 3 mois supplémentaires.

**Q: La vidéo CV reste-t-elle après l'expiration du Gold ?**
R: Oui, la vidéo CV créée reste sur votre profil même après expiration. Seul le boost de visibilité est désactivé.

**Q: Puis-je annuler mon abonnement Gold ?**
R: Le Gold n'est pas remboursable mais vous pouvez choisir de ne pas renouveler.

**Q: Comment les recruteurs voient-ils mon badge Gold ?**
R: Le badge Gold apparaît sur votre profil, dans les résultats de recherche et dans la CVthèque.

## Changelog

### v1.0.0 (2025-01-04)
- Lancement du service Profil Gold
- 3 séances de coaching incluses
- Création vidéo CV professionnelle
- Statistiques de visibilité avancées
- Badge et boost de visibilité
