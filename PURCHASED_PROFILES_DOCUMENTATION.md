# Documentation - Page Profils Achetés (CVThèque)

## Vue d'ensemble

La page **Profils Achetés** est une interface complète permettant aux recruteurs de consulter, gérer et exporter tous les profils candidats qu'ils ont achetés via la CVThèque. Cette page offre une expérience utilisateur premium avec de multiples fonctionnalités d'export et de gestion documentaire.

## Accès

**Chemin:** RecruiterDashboard > Onglet "Profils Achetés"

**Restrictions:**
- Accessible uniquement aux utilisateurs de type `recruiter`
- Affiche uniquement les profils avec:
  - `payment_status = 'completed'`
  - `payment_verified_by_admin = true`

---

## Fonctionnalités Principales

### 1. Affichage des Profils Achetés

#### Liste Élégante avec Design Premium
Chaque profil affiché contient:

**Informations Principales:**
- Nom complet avec badge de vérification (si vérifié)
- Score IA (0-100%)
- Titre/Poste actuel
- Années d'expérience
- Localisation (ville, pays)

**Informations de Contact:**
- Email (accessible)
- Téléphone (accessible)

**Informations Complémentaires:**
- Compétences (8 premières + compteur)
- Date d'achat
- Montant payé
- Méthode de paiement

#### Design Visuel
- Dégradé bleu élégant (from-blue-50 to-white)
- Bordures bleues avec hover effect
- Badges colorés pour les scores et statuts
- Layout responsive en grille

---

### 2. Barre de Recherche Intelligente

**Champ de recherche en temps réel:**
```
Recherche par:
- Nom complet
- Titre/Poste
- Ville
- Compétences
```

**Caractéristiques:**
- Filtrage instantané
- Insensible à la casse
- Icône de recherche visible
- Placeholder informatif

---

### 3. Exports de Données

#### A. Export CSV
**Format:** `.csv`
**Colonnes exportées:**
1. Nom Complet
2. Email
3. Téléphone
4. Poste
5. Ville
6. Pays
7. Années d'expérience
8. Compétences (séparées par `;`)
9. Salaire souhaité
10. Date d'achat
11. Montant payé
12. LinkedIn
13. Portfolio

**Utilisation:**
- Idéal pour imports dans d'autres systèmes
- Compatible avec Excel, Google Sheets, etc.
- Encodage UTF-8

#### B. Export Excel
**Format:** `.xls`
**Colonnes exportées:**
1. Nom Complet
2. Email
3. Téléphone
4. Poste
5. Ville
6. Pays
7. Expérience (formaté "X ans")
8. Compétences (5 premières)
9. Salaire
10. Date Achat
11. Montant

**Caractéristiques:**
- Tableau HTML converti en Excel
- Bordures et mise en forme
- Compatible MS Excel

#### C. Export PDF
**Format:** `.pdf`
**Contenu:**
- En-tête avec titre et date
- Compteur total de profils
- Liste numérotée de tous les profils

**Pour chaque profil:**
- Nom (en gras)
- Poste
- Email
- Téléphone
- Localisation
- Années d'expérience
- 5 premières compétences
- Date et montant d'achat

**Mise en page:**
- Auto-pagination
- Espacement optimal
- Police Helvetica professionnelle

---

### 4. Téléchargement en Lot (ZIP)

#### Fonctionnalité Documents ZIP

**Bouton:** "Documents ZIP"
**Fonctionnement:**
1. Parcourt tous les profils filtrés
2. Télécharge les documents depuis Supabase Storage:
   - CV (si disponible)
   - Lettre de motivation (si disponible)
3. Nomme les fichiers: `{NomCandidat}_CV.pdf` et `{NomCandidat}_Lettre_Motivation.pdf`
4. Crée un fichier ZIP unique
5. Lance le téléchargement automatique

**Nom du fichier:** `documents_profils_YYYY-MM-DD.zip`

**État de téléchargement:**
- Bouton désactivé pendant le téléchargement
- Texte "Téléchargement..." visible
- Gestion d'erreurs robuste

**Technologie:** JSZip library

---

### 5. Modal de Détails Complets

#### Ouverture
Cliquer sur le bouton "Voir Détails" de n'importe quel profil

#### Contenu du Modal

**En-tête (Sticky):**
- Dégradé bleu premium (from-blue-900 to-blue-700)
- Nom complet + badge de vérification
- Titre/Poste
- Bouton de fermeture (X)

**Section 1: Informations de Contact**
- Email
- Téléphone
- Localisation complète
- LinkedIn (lien cliquable)
- Portfolio (lien cliquable)

**Section 2: Informations Professionnelles**
- Années d'expérience
- Poste souhaité
- Salaire souhaité + devise
- Score IA

**Section 3: Compétences**
- Toutes les compétences en badges bleus
- Affichage en grille flexible

**Section 4: Documents**
- Bouton "Télécharger le CV" (bleu)
- Bouton "Télécharger la Lettre de Motivation" (vert)
- Liens directs vers Supabase Storage

**Section 5: Biographie** (si disponible)
- Texte complet dans un bloc stylisé

**Section 6: Expériences Professionnelles** (si disponibles)
Pour chaque expérience:
- Titre du poste (en gras)
- Nom de l'entreprise
- Période
- Description

**Section 7: Formation** (si disponible)
Pour chaque diplôme:
- Diplôme (en gras)
- Institution
- Année/Période

**Section 8: Langues** (si disponibles)
- Nom de la langue
- Niveau de maîtrise

**Design du Modal:**
- Max-width: 4xl
- Max-height: 90vh
- Défilement vertical
- Fond semi-transparent
- Centré à l'écran

---

## Statistiques et Indicateurs

**Bloc statistique en haut à droite:**
- Total de profils achetés
- Design: fond bleu clair avec texte bleu foncé
- Mise à jour automatique selon les filtres

---

## États de l'Interface

### État de Chargement
```
Spinner animé centré
Couleur: blue-900
Taille: 12x12
```

### État Vide (Aucun profil)
```
Icône Package (grise, grande)
Message: "Aucun profil acheté pour le moment"
```

### État Vide (Recherche)
```
Icône Package (grise, grande)
Message: "Aucun profil trouvé avec ces critères"
```

### État de Téléchargement ZIP
```
Bouton désactivé
Texte: "Téléchargement..."
Opacité réduite (opacity-50)
```

---

## Intégration Base de Données

### Requête Principale
```sql
SELECT
  id, candidate_id, purchased_at, amount, payment_method,
  candidate:candidate_profiles (
    -- Toutes les colonnes du profil candidat
  )
FROM profile_purchases
WHERE buyer_id = {recruiter_id}
  AND payment_status = 'completed'
  AND payment_verified_by_admin = true
ORDER BY purchased_at DESC
```

### Bucket Storage
- **Bucket:** `candidate-documents`
- **Fichiers:** CV et lettres de motivation
- **Accès:** Public (pour les profils achetés)

---

## Workflow d'Utilisation

### Scénario 1: Consultation Simple
1. Recruteur clique sur "Profils Achetés"
2. Liste des profils s'affiche
3. Recruteur recherche un profil spécifique
4. Clique sur "Voir Détails"
5. Consulte toutes les informations
6. Télécharge le CV si besoin

### Scénario 2: Export pour Partage
1. Recruteur filtre les profils (recherche)
2. Clique sur "CSV" ou "Excel"
3. Fichier téléchargé instantanément
4. Partage avec son équipe

### Scénario 3: Archivage Complet
1. Recruteur clique sur "Documents ZIP"
2. Tous les CV et lettres sont téléchargés
3. ZIP créé automatiquement
4. Archive locale créée

### Scénario 4: Rapport Management
1. Recruteur clique sur "PDF"
2. Rapport PDF généré
3. Présente au management
4. Justification des achats

---

## Avantages Business

### Pour le Recruteur
1. **Centralisation:** Tous les profils achetés au même endroit
2. **Accessibilité:** Informations complètes + documents
3. **Export Flexible:** 4 formats différents
4. **Archivage Simple:** ZIP automatique
5. **Partage Facile:** Exports compatibles avec tous les outils

### Pour l'Entreprise
1. **Traçabilité:** Historique complet des achats
2. **ROI Visible:** Montants payés + dates
3. **Compliance:** Données structurées et exportables
4. **Efficacité:** Gain de temps sur la gestion documentaire

---

## Design System

### Palette de Couleurs
- **Primary:** Blue-900 (#0E2F56)
- **Secondary:** Blue-700
- **Success:** Green-600
- **Accent:** Orange-500
- **Background:** Blue-50 to White gradient
- **Borders:** Blue-100 to Blue-200

### Typographie
- **Titres:** Bold, 2xl à 3xl
- **Sous-titres:** Semibold, lg à xl
- **Corps:** Normal, base
- **Compteurs:** Bold, 2xl

### Espacements
- **Sections:** mb-8
- **Cards:** p-6
- **Gaps:** gap-3 à gap-6
- **Grid:** grid-cols-1 md:2 lg:3

### Effets
- **Hover:** Shadow-lg + transition
- **Active:** Ring-2 ring-blue-500
- **Focus:** Border-transparent + ring

---

## Technologies Utilisées

1. **React 18** - Framework UI
2. **TypeScript** - Type safety
3. **Tailwind CSS** - Styling
4. **Lucide React** - Icônes
5. **jsPDF** - Export PDF
6. **JSZip** - Création de fichiers ZIP
7. **Supabase** - Base de données + Storage

---

## Sécurité

### Contrôles d'Accès
- Vérification du type utilisateur (recruiter)
- Filtrage par `buyer_id`
- Validation du statut de paiement
- RLS Supabase actif

### Protection des Données
- URLs signées pour les documents
- Pas de données sensibles exposées
- Export uniquement des profils achetés
- Téléchargements sécurisés via Supabase Storage

---

## Performance

### Optimisations
- Chargement unique au mount
- Filtrage côté client (instantané)
- Lazy loading pour JSZip
- Exports asynchrones
- Modal avec défilement optimisé

### Indicateurs
- Temps de chargement: < 2s (50 profils)
- Recherche: < 100ms
- Export CSV/Excel: < 500ms
- Export PDF: < 2s (50 profils)
- ZIP: Variable selon nombre de documents

---

## Maintenance et Support

### Logs
- Erreurs de chargement des profils
- Échecs de téléchargement de documents
- Erreurs lors de la création du ZIP

### Debug
```javascript
console.log('Purchased profiles loaded:', purchases.length);
console.error('Error downloading document:', error);
```

### Points de Surveillance
1. Performance des requêtes SQL
2. Taille des fichiers ZIP
3. Taux d'échec des téléchargements
4. Utilisation de la recherche

---

## Évolutions Futures Possibles

1. **Filtres Avancés:** Par date d'achat, montant, score IA
2. **Tri Personnalisé:** Par nom, date, score, expérience
3. **Notes/Tags:** Ajouter des notes sur les profils achetés
4. **Favoris:** Marquer des profils comme favoris
5. **Comparaison:** Comparer plusieurs profils côte à côte
6. **Export Sélectif:** Choisir les profils à exporter
7. **Statistiques:** Graphiques des achats par période
8. **Intégration ATS:** Push vers systèmes externes

---

## Conclusion

La page **Profils Achetés** offre une solution complète et professionnelle pour la gestion des profils candidats achetés via la CVThèque. Avec ses multiples fonctionnalités d'export, son design premium et son interface intuitive, elle répond aux besoins des recruteurs modernes tout en garantissant une expérience utilisateur exceptionnelle.
