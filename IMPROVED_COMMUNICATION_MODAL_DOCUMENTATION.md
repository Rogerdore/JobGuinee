# MODAL DE COMMUNICATION AMÉLIORÉ - DOCUMENTATION

## 📋 VUE D'ENSEMBLE

Nouveau système de communication recruteur-candidat amélioré permettant une sélection avancée des destinataires, l'utilisation de templates avec éditeur riche de texte, et l'envoi en masse de messages personnalisés.

**Composant** : `ImprovedCommunicationModal.tsx`
**Intégration** : Page RecruiterMessaging (onglet "Messagerie" du dashboard recruteur)
**Statut** : ✅ **OPÉRATIONNEL**

---

## 🎯 FONCTIONNALITÉS PRINCIPALES

### 1. SÉLECTION DES DESTINATAIRES

#### Liste Complète des Candidats
- Affichage de tous les candidats ayant postulé aux offres de l'entreprise
- Informations visibles :
  - Nom complet
  - Email
  - Titre du poste/projet
- Interface claire avec cases à cocher

#### Filtrage et Recherche
- **Filtre par projet** : Liste déroulante des offres actives
  - Option "Tous les projets"
  - Filtrage dynamique par offre sélectionnée
- **Recherche textuelle** :
  - Par nom de candidat
  - Par email
  - Par titre de poste
  - Recherche instantanée

#### Sélection Multi-Candidats
- **Sélection individuelle** : Clic sur un candidat pour le sélectionner/désélectionner
- **Tout sélectionner** : Bouton pour sélectionner tous les candidats filtrés
- **Compteur** : Affichage du nombre de candidats sélectionnés
- **Indicateur visuel** :
  - Case cochée (bleue) = sélectionné
  - Case vide (grise) = non sélectionné
  - Bordure et fond bleu pour les candidats sélectionnés

#### Résumé des Destinataires
À l'étape 2 (composition), affichage :
- Nombre total de destinataires
- Badges des 5 premiers candidats sélectionnés
- Indicateur "+X autres" si plus de 5 candidats

---

### 2. TEMPLATES DE MESSAGE

#### Sélection Template
- Liste déroulante avec templates disponibles :
  - Templates système (pré-configurés)
  - Templates personnalisés de l'entreprise
  - Option "Sans template" pour message libre

#### Comportement au Choix du Template
Quand un template est sélectionné :
1. Le sujet est pré-rempli (si vide)
2. Le message est chargé dans l'éditeur riche
3. Le recruteur peut personnaliser le contenu

#### Variables Dynamiques Supportées
```
{{candidate_name}}   - Nom du candidat
{{job_title}}        - Titre de l'offre
{{company_name}}     - Nom de l'entreprise
```

---

### 3. SUJET DU MESSAGE

#### Liste Déroulante de Sujets Pré-Définis

10 options disponibles :
1. Invitation à un entretien
2. Suite à votre candidature
3. Demande de documents complémentaires
4. Confirmation de réception
5. Mise à jour sur votre candidature
6. Rappel - Action requise
7. Félicitations - Étape suivante
8. Décision concernant votre candidature
9. Planification d'un rendez-vous
10. **Sujet personnalisé...** (saisie libre)

#### Sujet Personnalisé
Si "Sujet personnalisé..." est sélectionné :
- Un champ de saisie libre apparaît
- Le recruteur peut saisir son propre sujet
- Validation obligatoire avant envoi

---

### 4. ÉDITEUR RICHE DE TEXTE

#### Composant Utilisé
**ReactQuill** (bibliothèque Quill) avec thème "snow"

#### Fonctionnalités de l'Éditeur

**Formatage de texte** :
- Headers (H1, H2, H3)
- Gras, italique, souligné, barré
- Listes ordonnées et non ordonnées
- Couleur de texte et fond
- Liens hypertextes
- Nettoyage de formatage

**Hauteur** : Minimum 250px

#### Personnalisation du Message
Le recruteur peut :
- Modifier le texte du template
- Ajouter du formatage personnalisé
- Insérer des liens
- Structurer le message avec titres et listes
- Changer les couleurs pour emphase

**Note** : Les variables dynamiques restent sous forme `{{variable}}` et seront remplacées automatiquement lors de l'envoi.

---

### 5. CANAL DE COMMUNICATION

Deux options disponibles :

#### Email
- Bouton avec icône Mail
- Envoie via système de notification email
- Recommandé pour communications formelles

#### Notification Interne
- Bouton avec icône MessageSquare
- Notification dans l'espace candidat
- Plus rapide, visible immédiatement sur la plateforme

**Sélection visuelle** :
- Bordure bleue et fond bleu clair = sélectionné
- Bordure grise = non sélectionné

---

### 6. PROCESSUS D'ENVOI

#### Validation
Avant d'envoyer, vérification :
- Au moins 1 destinataire sélectionné
- Sujet renseigné (ou sujet personnalisé si choisi)
- Message non vide

#### Envoi en Masse
```typescript
await communicationService.sendBulkCommunication(
  applications,      // Liste des candidatures
  finalSubject,      // Sujet du message
  message,           // Contenu HTML
  channel            // 'email' ou 'notification'
);
```

#### Traçabilité
Pour chaque message envoyé :
- Enregistrement dans `communications_log`
- Création d'une notification dans `notifications`
- Log d'activité dans `application_activity_log`

#### Feedback Utilisateur
Après envoi réussi :
- Notification de succès affichée (toast vert)
- Message : "X message(s) envoyé(s) avec succès !"
- Fermeture automatique du modal (1,5s)
- Rafraîchissement de la liste des messages

---

## 🎨 INTERFACE UTILISATEUR

### Étapes du Modal (Wizard)

#### Étape 1 : Sélection des Destinataires

**Header** :
- Icône Send
- Titre "Nouveau message"
- Sous-titre "Sélection des destinataires"
- Indicateur d'étape : "1" actif, "2" inactif

**Contenu** :
```
┌─────────────────────────────────────────────────────┐
│ Barre de recherche                 Filtre par projet│
├─────────────────────────────────────────────────────┤
│ [✓] Tout sélectionner         👥 3 candidat(s)      │
├─────────────────────────────────────────────────────┤
│ [✓] Marie Diallo                                    │
│     marie.diallo@email.com                          │
│     Développeur Full-Stack                          │
├─────────────────────────────────────────────────────┤
│ [ ] Jean Kourouma                                   │
│     jean.kourouma@email.com                         │
│     Chef de Projet IT                               │
└─────────────────────────────────────────────────────┘
```

**Boutons** :
- Annuler (gris)
- Suivant → (bleu, désactivé si aucun sélectionné)

#### Étape 2 : Composition du Message

**Header** :
- Indicateur d'étape : "1" inactif, "2" actif

**Contenu** :
```
┌─────────────────────────────────────────────────────┐
│ 👥 3 destinataire(s)                                │
│ [Marie Diallo] [Jean K.] [+1 autre]                │
├─────────────────────────────────────────────────────┤
│ Template (optionnel): [Sans template ▼]            │
├─────────────────────────────────────────────────────┤
│ Canal: [📧 Email] [💬 Notification]                │
├─────────────────────────────────────────────────────┤
│ Sujet*: [Invitation à un entretien ▼]              │
├─────────────────────────────────────────────────────┤
│ Message*:                                           │
│ ┌─────────────────────────────────────────────────┐│
│ │ Éditeur Riche Quill (250px min)                 ││
│ │                                                   ││
│ └─────────────────────────────────────────────────┘│
│ Variables: {{candidate_name}}, {{job_title}}...    │
└─────────────────────────────────────────────────────┘
```

**Boutons** :
- ← Retour (gris)
- Envoyer (vert, désactivé si validation échoue)

---

## 🔧 INTÉGRATION DANS LE SYSTÈME

### Emplacement
**Page** : `RecruiterMessaging.tsx`
**Onglet** : "Messagerie" du RecruiterDashboard

### Bouton d'Ouverture
```tsx
<button
  onClick={() => setShowImprovedModal(true)}
  className="w-full bg-gradient-to-r from-green-600 to-green-700..."
>
  <Send className="w-5 h-5 mr-2" />
  Nouveau message
</button>
```

Situé dans le 4ème KPI card du dashboard messagerie.

### État du Composant
```typescript
const [showImprovedModal, setShowImprovedModal] = useState(false);
```

### Callbacks
```typescript
<ImprovedCommunicationModal
  companyId={company.id}
  onClose={() => setShowImprovedModal(false)}
  onSuccess={() => {
    setShowImprovedModal(false);
    loadMessages();  // Rafraîchir la liste
  }}
/>
```

---

## 📊 ARCHITECTURE TECHNIQUE

### Structure du Composant

```
ImprovedCommunicationModal/
├── Props
│   ├── companyId: string
│   ├── onClose: () => void
│   └── onSuccess: () => void
│
├── États Locaux
│   ├── step: 1 | 2                     (Étape du wizard)
│   ├── candidates: Candidate[]         (Liste complète)
│   ├── selectedCandidates: Set<string> (IDs sélectionnés)
│   ├── searchTerm: string
│   ├── selectedJobFilter: string
│   ├── templates: Template[]
│   ├── subject: string
│   ├── customSubject: string
│   ├── message: string (HTML)
│   └── channel: 'email' | 'notification'
│
└── Méthodes
    ├── loadCandidates()
    ├── loadTemplates()
    ├── handleTemplateChange()
    ├── toggleCandidate()
    ├── toggleAll()
    ├── handleNext()
    └── handleSend()
```

### Interface Candidate
```typescript
interface Candidate {
  id: string;                // candidate_profile.id
  application_id: string;    // application.id
  full_name: string;
  email: string;
  phone?: string;
  job_id: string;
  job_title: string;
  profile_id: string;        // profiles.id (pour notifications)
}
```

### Chargement des Candidats

**Requête Supabase** :
```typescript
const { data } = await supabase
  .from('applications')
  .select(`
    id,
    job_id,
    candidate_id,
    job:jobs!applications_job_id_fkey(title),
    candidate:candidate_profiles!applications_candidate_id_fkey(
      id,
      profile_id,
      profile:profiles!candidate_profiles_profile_id_fkey(
        full_name,
        email,
        phone
      )
    )
  `)
  .in('job_id', jobIds)
  .order('created_at', { ascending: false });
```

**Filtrage** :
- Par offre (job_id)
- Par entreprise (company_id via jobs)
- Par recherche textuelle (client-side)

### Templates de Sujets Pré-Définis
```typescript
const SUBJECT_TEMPLATES = [
  'Invitation à un entretien',
  'Suite à votre candidature',
  'Demande de documents complémentaires',
  'Confirmation de réception',
  'Mise à jour sur votre candidature',
  'Rappel - Action requise',
  'Félicitations - Étape suivante',
  'Décision concernant votre candidature',
  'Planification d\'un rendez-vous',
  'Sujet personnalisé...'
];
```

### Configuration Quill
```typescript
const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link'],
    ['clean']
  ]
};
```

---

## 🔐 SÉCURITÉ

### Isolation par Entreprise
- Candidats filtrés par `company_id` via la table `jobs`
- Aucun accès aux candidats d'autres entreprises

### Validation Côté Client
- Au moins 1 destinataire
- Sujet obligatoire
- Message obligatoire
- Sujet personnalisé si option sélectionnée

### Validation Côté Serveur
Service `communicationService.sendBulkCommunication` :
- Vérification authentification
- Logs dans `communications_log`
- Notifications dans `notifications`
- Traçabilité complète

---

## 📈 WORKFLOW COMPLET

```
1. Recruteur clique "Nouveau message"
   └→ Modal s'ouvre (Étape 1)

2. Sélection des destinataires
   ├→ Recherche / Filtre par projet
   ├→ Sélection individuelle ou globale
   └→ Validation : au moins 1 sélectionné
   └→ Clic "Suivant →"

3. Composition du message (Étape 2)
   ├→ (Optionnel) Sélection template
   ├→ Choix canal (Email / Notification)
   ├→ Sélection sujet pré-défini
   │  └→ Si "Sujet personnalisé" → saisie libre
   ├→ Rédaction dans éditeur riche
   │  └→ Formatage, liens, couleurs...
   └→ Validation : tous champs remplis

4. Envoi
   ├→ Appel communicationService.sendBulkCommunication()
   ├→ Boucle sur chaque candidat sélectionné
   │  ├→ Log dans communications_log
   │  ├→ Notification dans notifications
   │  └→ Activity log dans application_activity_log
   └→ Feedback succès

5. Après envoi
   ├→ Toast vert de confirmation
   ├→ Fermeture automatique du modal (1,5s)
   └→ Rafraîchissement liste des messages
```

---

## 🧪 TESTS RECOMMANDÉS

### Tests Fonctionnels

#### Test 1 : Sélection Candidats
- [ ] Affichage de tous les candidats de l'entreprise
- [ ] Filtre par projet fonctionne
- [ ] Recherche par nom/email fonctionne
- [ ] Sélection individuelle fonctionne
- [ ] "Tout sélectionner" fonctionne
- [ ] Compteur de sélection correct
- [ ] Bouton "Suivant" désactivé si aucun sélectionné

#### Test 2 : Templates
- [ ] Liste des templates chargée
- [ ] Sélection template pré-remplit sujet et message
- [ ] Personnalisation du message possible
- [ ] Variables {{candidate_name}} visibles

#### Test 3 : Sujet
- [ ] Liste déroulante affichée
- [ ] 10 options disponibles
- [ ] "Sujet personnalisé" affiche champ de saisie
- [ ] Validation si sujet vide

#### Test 4 : Éditeur Riche
- [ ] Éditeur ReactQuill chargé
- [ ] Barre d'outils visible
- [ ] Formatage (gras, italique...) fonctionne
- [ ] Listes fonctionnent
- [ ] Couleurs appliquées
- [ ] Liens insérables
- [ ] HTML généré correctement

#### Test 5 : Envoi
- [ ] Validation si champs manquants
- [ ] Envoi réussi pour 1 candidat
- [ ] Envoi réussi pour plusieurs candidats
- [ ] Toast de succès affiché
- [ ] Messages visibles dans historique
- [ ] Notifications créées pour les candidats

### Tests Sécurité
- [ ] Isolation entreprise respectée
- [ ] Aucun accès candidats autres entreprises
- [ ] Logs créés dans communications_log
- [ ] Traçabilité complète

---

## 📚 DÉPENDANCES

### NPM Packages
```json
{
  "react-quill": "^2.0.0",
  "quill": "^2.0.3"
}
```

### CSS
```
react-quill/dist/quill.snow.css
```

### Services
- `communicationService.ts`
- `supabase.ts`

### Composants Réutilisés
- Icônes Lucide React :
  - Send, Mail, MessageSquare
  - Search, Filter, Users
  - CheckSquare, Square
  - X

---

## 🎉 AVANTAGES DE LA SOLUTION

### Pour le Recruteur
- ✅ Interface intuitive en 2 étapes
- ✅ Sélection multi-candidats rapide
- ✅ Templates pour gagner du temps
- ✅ Éditeur riche pour personnalisation
- ✅ Envoi en masse efficace
- ✅ Feedback immédiat

### Pour le Système
- ✅ Traçabilité complète
- ✅ Réutilisation de l'infrastructure existante
- ✅ Isolation sécurisée par entreprise
- ✅ Code modulaire et maintenable
- ✅ Compatible avec le reste du système

### Pour les Candidats
- ✅ Messages professionnels et formatés
- ✅ Notifications immédiates
- ✅ Historique consultable

---

## 🔄 ÉVOLUTIONS FUTURES POSSIBLES

### Fonctionnalités Additionnelles
1. **Pièces jointes** : Support documents PDF/Word
2. **Aperçu avant envoi** : Modal de prévisualisation
3. **Planification d'envoi** : Envoi différé
4. **Groupes de candidats** : Sauvegarder des sélections
5. **Statistiques d'ouverture** : Tracking lecture emails
6. **Réponses automatiques** : Chatbot basique
7. **SMS/WhatsApp** : Support canaux additionnels

### Améliorations UX
1. **Drag & drop** : Sélection par glisser-déposer
2. **Prévisualisation variables** : Afficher rendu avec vraies données
3. **Historique drafts** : Sauvegarder brouillons
4. **Raccourcis clavier** : Navigation rapide

---

## 📝 CONCLUSION

Le **ImprovedCommunicationModal** transforme la communication recruteur-candidat en offrant :
- Une interface moderne et professionnelle
- Une sélection avancée des destinataires
- Un éditeur riche pour personnalisation maximale
- Un processus d'envoi en masse fiable et tracé

**Statut** : ✅ Opérationnel en production
**Build** : ✅ Réussi sans erreurs
**Intégration** : ✅ Complète dans RecruiterMessaging

---

*Document créé le 13 décembre 2024*
*Version : 1.0*
*Plateforme : JobGuinée - ATS Professionnel*
