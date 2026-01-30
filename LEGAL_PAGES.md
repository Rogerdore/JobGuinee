# Pages Légales JobGuinée-Pro

## Vue d'ensemble

Ce document décrit les pages légales implémentées pour JobGuinée-Pro.com, conformes aux exigences de Google OAuth et aux bonnes pratiques de conformité.

## Pages Implémentées

### 1. Politique de Confidentialité
- **URL**: `/privacy-policy`
- **Fichier**: `src/pages/PrivacyPolicy.tsx`
- **Objectif**: Conformité Google OAuth et transparence sur l'utilisation des données

#### Sections incluses:
1. Introduction et engagement
2. Données collectées (identification, professionnelles, connexion, techniques)
3. Finalité de la collecte
4. Utilisation de Google OAuth (détails spécifiques)
5. Partage des données (aucune vente)
6. Sécurité des données
7. Droits des utilisateurs (accès, rectification, effacement)
8. Durée de conservation
9. Cookies et technologies similaires
10. Modifications de la politique
11. Contact

#### Points clés pour Google OAuth:
- Clarification des données récupérées via Google (email, nom, photo)
- Confirmation qu'aucun mot de passe Google n'est accessible
- Transparence sur l'usage des données d'authentification

### 2. Conditions d'Utilisation
- **URL**: `/terms-of-service`
- **Fichier**: `src/pages/TermsOfService.tsx`
- **Objectif**: Cadre juridique d'utilisation de la plateforme

#### Sections incluses:
1. Acceptation des conditions
2. Description des services
3. Inscription et compte utilisateur
4. Utilisation acceptable
5. Contenu utilisateur
6. Services payants et crédits
7. Propriété intellectuelle
8. Limitation de responsabilité
9. Résiliation
10. Modification des conditions
11. Loi applicable et juridiction
12. Contact

## Intégration dans l'Application

### Navigation
Les pages légales sont accessibles via:
1. **Footer principal**: Liens en bas de toutes les pages
2. **Page d'inscription**: Mention lors de la création de compte
3. **Navigation directe**: URLs dédiées

### Routes
```typescript
// App.tsx
'privacy-policy' => PrivacyPolicy
'terms-of-service' => TermsOfService
```

### Mentions sur la page d'inscription
Sur la page d'inscription (`src/pages/Auth.tsx`), un message est affiché:
```
En vous inscrivant, vous acceptez notre Politique de confidentialité
```

## Conformité Google OAuth

### Exigences respectées:

1. **Transparence des données collectées**
   - Liste exhaustive des données via OAuth
   - Finalités clairement expliquées

2. **Sécurité**
   - Confirmation de non-accès aux mots de passe
   - Mesures de sécurité détaillées

3. **Droits des utilisateurs**
   - Accès, modification, suppression clairement expliqués
   - Contact fourni pour exercer les droits

4. **Conservation des données**
   - Durées de conservation spécifiées
   - Politique de suppression claire

5. **Partage des données**
   - Aucune vente de données
   - Partage limité aux prestataires techniques

## URLs Publiques

Une fois déployé, ces pages seront accessibles aux URLs:
- https://jobguinee-pro.com/privacy-policy
- https://jobguinee-pro.com/terms-of-service

## Maintenance

### Mises à jour recommandées:
- **Annuel**: Révision complète des deux documents
- **À chaque changement majeur**: Mise à jour de la date et notification des utilisateurs
- **Nouveaux services**: Ajout dans les sections pertinentes

### Contact pour questions légales:
**Email**: contact@jobguinee-pro.com

## Langue et Juridiction

- **Langue**: Français
- **Juridiction**: République de Guinée
- **Loi applicable**: Législation guinéenne

## Validation Google OAuth

Ces documents répondent aux exigences de Google pour:
- [x] Politique de confidentialité publique et accessible
- [x] Description des données collectées via OAuth
- [x] Finalités d'utilisation des données
- [x] Mesures de sécurité
- [x] Droits des utilisateurs
- [x] Contact pour questions

## Notes Importantes

1. **Pas de RGPD strict**: Le RGPD européen ne s'applique pas directement en Guinée, mais les principes de protection des données sont respectés pour les meilleures pratiques.

2. **Adaptation locale**: Les documents sont adaptés au contexte guinéen (loi applicable, juridiction).

3. **Clarté et accessibilité**: Langage professionnel mais accessible, évitant le jargon juridique excessif.

4. **Design responsive**: Pages optimisées pour mobile et desktop.

## Checklist de Déploiement

Avant de soumettre l'application à Google pour validation OAuth:

- [ ] Vérifier que les pages sont accessibles publiquement
- [ ] Tester les liens depuis la page d'inscription
- [ ] Vérifier la cohérence de l'email de contact
- [ ] S'assurer que les URLs sont permanentes
- [ ] Tester sur mobile et desktop
- [ ] Vérifier l'orthographe et la grammaire
- [ ] Confirmer la date de dernière mise à jour

## Support et Questions

Pour toute question concernant ces pages légales:
- **Email technique**: contact@jobguinee-pro.com
- **Documentation**: Ce fichier (LEGAL_PAGES.md)
