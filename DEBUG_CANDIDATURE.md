# 🔍 Guide de Débogage - Problème Candidature

## Problème Identifié

Le bouton "Envoyer la candidature" ne fonctionne pas. Voici comment identifier et résoudre le problème.

---

## 🎯 Diagnostic Rapide

### 1. Vérifier si le bouton est désactivé

Le bouton est **désactivé automatiquement** si l'une des conditions suivantes n'est **PAS** remplie :

#### ✅ Conditions requises :
- [ ] **Prénom** renseigné
- [ ] **Nom** renseigné
- [ ] **Téléphone** renseigné
- [ ] **Au moins 1 CV** uploadé
- [ ] **Lettre de motivation** uploadée (SI requise par l'offre)

### 2. Vérifier la console du navigateur

1. Appuyez sur **F12** pour ouvrir les outils de développement
2. Allez dans l'onglet **Console**
3. Cliquez sur le bouton "Envoyer la candidature"
4. Regardez s'il y a des erreurs en rouge

---

## 🔧 Solutions par Type de Problème

### Problème A : Bouton Désactivé (Grisé)

**Cause :** Une des conditions n'est pas remplie

**Solution :**
```
1. Vérifiez que TOUS les champs obligatoires sont remplis :
   - Prénom
   - Nom
   - Email (pré-rempli normalement)
   - Téléphone

2. Vérifiez qu'au moins 1 CV est uploadé :
   - Cliquez sur "Parcourir" dans la section CV
   - Sélectionnez un fichier PDF, DOC ou DOCX
   - Attendez que le fichier apparaisse dans la liste

3. SI l'offre requiert une lettre de motivation :
   - Uploadez une lettre de motivation
   - OU remplissez le champ texte de motivation
```

### Problème B : Bouton Actif mais Ne Se Clique Pas

**Cause :** Cache du navigateur ou erreur JavaScript

**Solution :**
```
1. Vider le cache du navigateur :
   - Chrome/Edge : Ctrl + Shift + Delete
   - Cochez "Images et fichiers en cache"
   - Cliquez sur "Effacer les données"

2. Forcer le rechargement de la page :
   - Appuyez sur Ctrl + F5 (Windows)
   - OU Cmd + Shift + R (Mac)

3. Vérifier la console JavaScript :
   - F12 → Console
   - Regardez s'il y a des erreurs
```

### Problème C : Envoi Échoue Avec Erreur

**Erreurs courantes et solutions :**

#### "Vous avez déjà postulé à cette offre"
```
✅ C'est normal ! Vous ne pouvez postuler qu'une seule fois.
👉 Consultez vos candidatures dans votre tableau de bord
```

#### "Profil candidat non trouvé"
```
❌ Votre profil n'est pas correctement créé
👉 Allez dans "Mon profil" et remplissez au minimum :
   - Nom complet
   - Email
   - Téléphone
```

#### "Erreur lors de la création de la candidature"
```
❌ Problème de base de données
👉 Vérifications :
   1. Votre connexion internet est stable ?
   2. Vous êtes bien connecté(e) ?
   3. Réessayez dans quelques minutes
```

#### "Le fichier ne doit pas dépasser 5 MB"
```
❌ Votre CV/lettre est trop lourd(e)
👉 Solution :
   1. Compressez votre PDF sur https://smallpdf.com
   2. OU supprimez des images du document
   3. Taille recommandée : < 2 MB
```

---

## 🛠️ Débogage Avancé (Développeur)

### Vérifier l'état du formulaire dans la console

Ouvrez la console (F12) et tapez :

```javascript
// Vérifier si des fichiers sont uploadés
console.log('Fichiers CV:', document.querySelectorAll('[data-file-type="cv"]').length);
console.log('Fichiers LM:', document.querySelectorAll('[data-file-type="cover_letter"]').length);

// Vérifier les champs du formulaire
const fields = {
  firstName: document.querySelector('input[placeholder*="Prénom"]')?.value,
  lastName: document.querySelector('input[placeholder*="Nom"]')?.value,
  phone: document.querySelector('input[placeholder*="Téléphone"]')?.value,
};
console.log('Champs formulaire:', fields);

// Vérifier si le bouton est désactivé
const button = document.querySelector('button[disabled]');
console.log('Bouton désactivé ?', !!button);
```

### Vérifier les appels API

Dans la console, allez dans l'onglet **Network** :

1. Cliquez sur "Envoyer la candidature"
2. Regardez les requêtes qui partent vers `/rest/v1/applications`
3. Si une requête échoue (rouge), cliquez dessus
4. Regardez l'onglet "Response" pour voir l'erreur exacte

### Erreurs de permissions RLS

Si vous voyez : `"new row violates row-level security policy"`

```sql
-- Vérifier les policies RLS pour applications
SELECT * FROM applications WHERE candidate_id = 'VOTRE_USER_ID';

-- Si ça ne fonctionne pas, contactez l'admin
```

---

## 🔄 Workflow Normal de Candidature

Voici comment ça devrait se passer :

```
1. Utilisateur clique "Postuler" sur une offre
   ↓
2. Modal de candidature s'ouvre
   ↓
3. Formulaire pré-rempli avec données du profil
   ↓
4. Utilisateur vérifie/complète les infos
   ↓
5. Utilisateur uploade CV (et lettre si requise)
   ↓
6. Bouton "Envoyer" devient actif (vert/bleu)
   ↓
7. Utilisateur clique "Envoyer la candidature"
   ↓
8. Spinner "Envoi en cours..."
   ↓
9. Modal de succès avec référence de candidature
   ↓
10. Email de confirmation envoyé
```

---

## 📝 Checklist de Vérification

Avant de cliquer sur "Envoyer" :

- [ ] Je suis bien **connecté(e)** en tant que **candidat**
- [ ] Mon **profil est complété** (nom, email, téléphone)
- [ ] J'ai uploadé **au moins 1 CV** (PDF, DOC ou DOCX)
- [ ] J'ai uploadé une **lettre de motivation** (si requise)
- [ ] Le bouton "Envoyer" est **actif** (pas grisé)
- [ ] Ma **connexion internet** est stable
- [ ] Je **n'ai pas déjà postulé** à cette offre

---

## 🆘 Besoin d'Aide ?

### Si le problème persiste :

1. **Prenez une capture d'écran** :
   - Du formulaire complet
   - De la console JavaScript (F12 → Console)
   - De l'onglet Network si possible

2. **Notez l'erreur exacte** :
   - Message affiché
   - Moment où ça échoue
   - Offre concernée

3. **Vérifiez votre profil** :
   - Allez dans "Mon profil"
   - Assurez-vous qu'il est bien créé
   - Vérifiez votre type de compte (doit être "candidat")

### Actions de dernière chance :

```bash
1. Se déconnecter complètement
2. Vider le cache du navigateur
3. Redémarrer le navigateur
4. Se reconnecter
5. Réessayer de postuler
```

---

## 🔍 Logs Utiles pour Débogage

Si vous êtes développeur, ajoutez ces logs dans `JobApplicationModal.tsx` :

```typescript
// Dans handleCustomSubmit, avant la soumission
console.log('=== DEBUG CANDIDATURE ===');
console.log('Candidate ID:', candidateId);
console.log('Job ID:', jobId);
console.log('Custom Data:', customData);
console.log('Files to Upload:', filesToUpload);
console.log('Cover Letter Required:', coverLetterRequired);
console.log('CV Files:', getFilesByType('cv'));
console.log('Cover Letter Files:', getFilesByType('cover_letter'));
console.log('========================');
```

---

**Dernière mise à jour :** 31 Décembre 2024
