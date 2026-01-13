# Module de Sélection d'Offres d'Emploi - CV Central

## Fonctionnalité Ajoutée

Le module **CV Central** (mode "Adapter à une offre") dispose maintenant d'un système de sélection d'offres d'emploi depuis la base de données.

## Comment Utiliser

### 1. Accéder au Module CV Central
- Depuis le tableau de bord candidat, cliquez sur "Générateur CV IA Central"
- Sélectionnez le mode **"Adapter à une offre"** (icône cible orange)

### 2. Charger les Offres d'Emploi
- À l'étape 2, vous verrez un bouton **"Charger les offres d'emploi"** (bouton teal avec icône cible)
- Cliquez sur ce bouton pour ouvrir le sélecteur d'offres

### 3. Sélectionner une Offre
Le modal affiche :
- **Liste des 20 dernières offres publiées**
- **Barre de recherche** pour filtrer par titre, entreprise ou localisation
- **Informations de chaque offre** :
  - Titre du poste
  - Nom de l'entreprise avec logo
  - Localisation
  - Type de contrat
  - Fourchette de salaire

### 4. Chargement Automatique
Une fois l'offre sélectionnée :
- La description complète de l'offre est automatiquement remplie dans le champ de texte
- Inclut : titre, entreprise, localisation, description, exigences et responsabilités
- Vous pouvez ensuite procéder à la génération du CV ciblé

## Avantages

1. **Gain de temps** : Plus besoin de copier-coller manuellement les offres
2. **Précision** : Toutes les informations de l'offre sont chargées automatiquement
3. **Recherche facile** : Filtrage instantané parmi toutes les offres disponibles
4. **Interface intuitive** : Cartes cliquables avec toutes les informations essentielles

## Données Chargées

Lorsqu'une offre est sélectionnée, le module charge :
- Titre du poste
- Nom de l'entreprise
- Localisation
- Type de contrat
- Description complète
- Exigences détaillées
- Responsabilités du poste

L'IA utilisera ensuite ces informations pour adapter le CV du candidat et mettre en avant les compétences et expériences les plus pertinentes pour l'offre.

## Interface

### Bouton Principal
```
[🎯 Charger les offres d'emploi]
Sélectionnez une offre depuis notre base de données pour remplir automatiquement
```

### Modal de Sélection
- Header avec nombre d'offres disponibles
- Barre de recherche avec icône
- Liste scrollable d'offres
- Chaque offre affichée comme une carte cliquable
- Badges colorés pour localisation, contrat et salaire

## Intégration Base de Données

Le module se connecte directement à la table `jobs` de Supabase et charge :
- Les offres avec statut `published`
- Les 20 offres les plus récentes
- Les informations de l'entreprise associée via la relation `companies`

## Compatibilité

Cette fonctionnalité fonctionne avec :
- Les 10 offres d'emploi existantes dans la base de données
- Toutes les nouvelles offres ajoutées par les recruteurs
- Mode de saisie "profil" ou "manuelle"
