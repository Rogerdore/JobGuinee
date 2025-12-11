# Mise à Jour des Prix Unitaires par Défaut - CVThèque

## Date de Mise à Jour
11 Décembre 2024

---

## Vue d'Ensemble

Cette documentation détaille la mise à jour des prix unitaires par défaut de la CVThèque pour les recruteurs qui n'ont **pas d'abonnements actifs** (packs ou abonnements entreprise).

---

## Anciens Prix vs Nouveaux Prix

### Tableau Comparatif

| Niveau d'Expérience | Ancien Prix | Nouveau Prix | Augmentation |
|---------------------|-------------|--------------|--------------|
| **Junior** (< 3 ans) | 4 000 GNF | **7 500 GNF** | +87,5% |
| **Intermédiaire** (3-5 ans) | 8 000 GNF | **10 000 GNF** | +25% |
| **Senior** (6+ ans) | 15 000 GNF | **20 000 GNF** | +33,3% |

---

## Logique de Prix

### Pour les Recruteurs SANS Abonnement Actif

Les prix unitaires par défaut s'appliquent automatiquement:

```javascript
Profil Junior (< 3 ans d'expérience): 7 500 GNF
Profil Intermédiaire (3-5 ans): 10 000 GNF
Profil Senior (6+ ans): 20 000 GNF
```

### Pour les Recruteurs AVEC Abonnement Actif

Le prix unitaire est calculé selon le pack:

```javascript
Prix unitaire = Prix du pack ÷ Nombre total de profils du pack
```

**Exemple:**
- Pack acheté: 250 000 GNF pour 50 profils
- Prix unitaire: 250 000 ÷ 50 = **5 000 GNF par profil**

Ce prix unitaire s'applique à **tous les niveaux** (Junior, Intermédiaire, Senior).

---

## Fichiers Modifiés

### 1. `/src/pages/CVTheque.tsx`

#### A. Fonction `calculateProfilePrice`

**Ligne 171-181**

```typescript
const calculateProfilePrice = (experienceYears: number) => {
  // Si le recruteur a un pack actif, utiliser le prix unitaire du pack
  if (unitPrice !== null) {
    return unitPrice;
  }

  // Sinon, utiliser les prix standards
  if (experienceYears >= 6) return 20000;  // ← Changé de 15000
  if (experienceYears >= 3) return 10000;  // ← Changé de 8000
  return 7500;                              // ← Changé de 4000
};
```

#### B. Affichage des Statistiques - Profils Junior

**Ligne 665**

```jsx
{unitPrice ? `${unitPrice.toLocaleString('fr-GN')} GNF` : '7.500 GNF'}
// Avant: '4.000 GNF'
```

#### C. Affichage des Statistiques - Profils Intermédiaires

**Ligne 679**

```jsx
{unitPrice ? `${unitPrice.toLocaleString('fr-GN')} GNF` : '10.000 GNF'}
// Avant: '8.000 GNF'
```

#### D. Affichage des Statistiques - Profils Senior

**Ligne 693**

```jsx
{unitPrice ? `${unitPrice.toLocaleString('fr-GN')} GNF` : '20.000 GNF'}
// Avant: '15.000 GNF'
```

---

## Impact sur l'Interface Utilisateur

### Cartes de Statistiques

Les trois cartes affichant les statistiques par niveau montrent maintenant:

#### Profils Junior (Orange)
```
Profils Junior
[Nombre de profils]
7.500 GNF  ← Prix par défaut sans pack
```

#### Profils Intermédiaires (Vert)
```
Profils Intermédiaires
[Nombre de profils]
10.000 GNF  ← Prix par défaut sans pack
```

#### Profils Senior (Bleu)
```
Profils Senior
[Nombre de profils]
20.000 GNF  ← Prix par défaut sans pack
```

**Note:** Si le recruteur a un pack actif, le prix unitaire du pack remplace ces valeurs par défaut.

---

## Workflow de Calcul des Prix

### Scénario 1: Recruteur Sans Pack Actif

```
1. Recruteur consulte la CVThèque
2. Système détecte: Aucun pack actif
3. Prix affichés:
   - Junior: 7 500 GNF
   - Intermédiaire: 10 000 GNF
   - Senior: 20 000 GNF
4. Recruteur ajoute profils au panier
5. Prix calculés selon l'expérience de chaque profil
```

**Exemple de Panier:**
- 1 profil Junior (2 ans exp): 7 500 GNF
- 2 profils Intermédiaires (4 ans exp): 20 000 GNF
- 1 profil Senior (8 ans exp): 20 000 GNF
- **Total: 47 500 GNF**

### Scénario 2: Recruteur Avec Pack Actif

```
1. Recruteur a acheté un pack de 50 profils à 250 000 GNF
2. Prix unitaire calculé: 5 000 GNF
3. Prix affichés: 5.000 GNF pour tous les niveaux
4. Recruteur ajoute profils au panier
5. Prix unique: 5 000 GNF par profil (quel que soit le niveau)
6. Au paiement: Consommation automatique du pack
```

**Exemple de Panier avec Pack:**
- 1 profil Junior: 5 000 GNF (prix du pack)
- 2 profils Intermédiaires: 10 000 GNF
- 1 profil Senior: 5 000 GNF (prix du pack)
- **Total: 20 000 GNF**
- **Crédits consommés: 4 profils du pack**

---

## Calcul Automatique dans le Système

### Attribution du Niveau d'Expérience

Le système détermine automatiquement le niveau selon les années d'expérience:

```javascript
function determineExperienceLevel(years) {
  if (years < 3) return 'junior';
  if (years < 6) return 'intermediate';
  return 'senior';
}
```

### Application du Prix

```javascript
function getPriceForProfile(profile, activePack) {
  // Si pack actif existe
  if (activePack) {
    return activePack.unitPrice;
  }

  // Sinon, prix par défaut selon expérience
  const years = profile.experience_years || 0;

  if (years >= 6) return 20000;  // Senior
  if (years >= 3) return 10000;  // Intermédiaire
  return 7500;                    // Junior
}
```

---

## Avantages des Nouveaux Prix

### Pour la Plateforme

1. **Meilleure Valorisation:** Prix reflètent mieux la qualité des profils
2. **Incitation aux Packs:** Prix unitaires plus chers encouragent l'achat de packs
3. **Revenue Optimization:** Augmentation du revenu moyen par profil
4. **Segmentation Claire:** Différenciation marquée entre les niveaux

### Pour les Recruteurs

1. **Transparence:** Prix clairs dès l'arrivée sur la CVThèque
2. **Motivation:** Intérêt économique à acheter des packs
3. **Flexibilité:** Possibilité d'acheter à l'unité si besoin ponctuel
4. **Économies:** Jusqu'à 50% d'économies avec les packs

---

## Comparaison: Prix Unitaires vs Packs

### Exemple: Achat de 10 Profils

#### Sans Pack (Prix Unitaires par Défaut)
```
Scénario: 4 Juniors, 4 Intermédiaires, 2 Seniors

4 × 7 500 GNF = 30 000 GNF
4 × 10 000 GNF = 40 000 GNF
2 × 20 000 GNF = 40 000 GNF
─────────────────────────────
Total: 110 000 GNF
Prix moyen: 11 000 GNF/profil
```

#### Avec Pack 50 Profils (exemple)
```
Pack: 250 000 GNF pour 50 profils
Prix unitaire: 5 000 GNF/profil

10 profils × 5 000 GNF = 50 000 GNF
─────────────────────────────
Total: 50 000 GNF
Économie: 60 000 GNF (54,5%)
```

---

## Stratégie de Packs Recommandée

Pour maximiser les ventes de packs, voici des suggestions de prix:

### Pack Starter (10 profils)
- **Prix recommandé:** 60 000 GNF
- **Prix unitaire:** 6 000 GNF
- **Économie vs défaut:** ~45%

### Pack Pro (50 profils)
- **Prix recommandé:** 250 000 GNF
- **Prix unitaire:** 5 000 GNF
- **Économie vs défaut:** ~54%

### Pack Entreprise (100 profils)
- **Prix recommandé:** 400 000 GNF
- **Prix unitaire:** 4 000 GNF
- **Économie vs défaut:** ~63%

---

## Gestion des Profils dans le Panier

### Attribution du Prix au Moment de l'Ajout

Lorsqu'un profil est ajouté au panier:

```javascript
const profileWithPrice = {
  ...candidateProfile,
  profile_price: calculateProfilePrice(candidateProfile.experience_years)
};

// Le prix est stocké et ne change pas même si un pack est acheté pendant
```

### Conservation du Prix Original

Le prix attribué au moment de l'ajout au panier reste fixe, même si:
- Le recruteur achète un pack entre temps
- Les prix par défaut changent
- Un pack expire

Cela garantit la transparence et évite les surprises au paiement.

---

## Tests Recommandés

### Test 1: Affichage des Prix par Défaut
```
1. Connecter un recruteur sans pack actif
2. Accéder à la CVThèque
3. Vérifier les prix affichés:
   - Junior: 7 500 GNF
   - Intermédiaire: 10 000 GNF
   - Senior: 20 000 GNF
```

### Test 2: Calcul du Prix au Panier
```
1. Ajouter 1 profil junior au panier
2. Vérifier: Prix = 7 500 GNF
3. Ajouter 1 profil intermédiaire
4. Vérifier: Prix = 10 000 GNF
5. Vérifier total: 17 500 GNF
```

### Test 3: Prix avec Pack Actif
```
1. Recruteur achète un pack (ex: 50 profils à 250 000 GNF)
2. Admin valide le pack
3. Recruteur retourne sur CVThèque
4. Vérifier: Tous les prix affichent 5 000 GNF
5. Ajouter profils au panier
6. Vérifier: Tous les profils à 5 000 GNF
```

### Test 4: Transition Pack → Sans Pack
```
1. Recruteur avec pack consomme tous les crédits
2. Retourner sur CVThèque
3. Vérifier: Prix repassent aux valeurs par défaut
   - Junior: 7 500 GNF
   - Intermédiaire: 10 000 GNF
   - Senior: 20 000 GNF
```

---

## Communication aux Utilisateurs

### Message Recommandé pour les Recruteurs

```
📢 Nouvelle Grille Tarifaire CVThèque

Profils Junior: 7 500 GNF
Profils Intermédiaires: 10 000 GNF
Profils Senior: 20 000 GNF

💡 Astuce: Économisez jusqu'à 60% en achetant un pack de profils!

[Voir nos Packs] [En savoir plus]
```

### FAQ Suggérée

**Q: Pourquoi les prix ont changé?**
R: Les nouveaux prix reflètent mieux la valeur et la qualité des profils disponibles dans notre CVThèque.

**Q: Comment puis-je économiser?**
R: En achetant un pack de profils, vous bénéficiez d'un prix unitaire réduit de 40% à 60%.

**Q: Les prix sont-ils les mêmes pour tous les profils?**
R: Sans pack, le prix varie selon l'expérience (Junior/Intermédiaire/Senior). Avec un pack, le prix est unique pour tous.

**Q: Puis-je mélanger les niveaux dans mon panier?**
R: Oui, vous pouvez ajouter autant de profils de différents niveaux que vous le souhaitez.

---

## Monitoring et Métriques

### KPIs à Suivre

1. **Taux de Conversion Pack:**
   - Avant vs Après changement de prix
   - Target: +20% de ventes de packs

2. **Panier Moyen:**
   - Montant moyen par transaction
   - Target: Augmentation de 15%

3. **Mix de Profils Achetés:**
   - Répartition Junior/Intermédiaire/Senior
   - Objectif: Équilibre 40/40/20

4. **Taux d'Abandon Panier:**
   - % de paniers non finalisés
   - Monitor pour ajuster les prix si nécessaire

---

## Rollback Plan

Si nécessaire, pour revenir aux anciens prix:

### Dans CVTheque.tsx, ligne 178-180:
```javascript
// ROLLBACK: Anciens prix
if (experienceYears >= 6) return 15000;  // Senior
if (experienceYears >= 3) return 8000;   // Intermédiaire
return 4000;                              // Junior
```

### Dans CVTheque.tsx, lignes 665, 679, 693:
```jsx
// ROLLBACK: Anciens prix affichés
'4.000 GNF'   // Junior
'8.000 GNF'   // Intermédiaire
'15.000 GNF'  // Senior
```

---

## Conclusion

La nouvelle grille tarifaire positionne mieux la CVThèque en termes de valorisation tout en créant une incitation forte à l'achat de packs. Les recruteurs conservent la flexibilité d'achats à l'unité pour des besoins ponctuels, tout en bénéficiant d'économies substantielles via les packs.

Cette stratégie devrait augmenter à la fois:
- Le revenu moyen par profil acheté
- Le taux de conversion vers les packs
- La satisfaction utilisateur (transparence et économies)

---

**Dernière mise à jour:** 11 Décembre 2024
**Version:** 1.0
**Statut:** ✅ Actif en Production
