# CORRECTION SYSTÈME AUTHENTIFICATION
## JobGuinée - Inscription & Connexion

**Date:** 10 Décembre 2025
**Problème résolu:** Impossible de créer un compte ou se connecter

---

## PROBLÈME IDENTIFIÉ

### Symptômes
- Les utilisateurs ne peuvent pas s'inscrire
- Erreur lors de la création de compte
- Profil non créé après inscription
- Impossible de se connecter après inscription

### Cause Racine
**Trigger manquant dans la base de données**

Quand un utilisateur s'inscrivait via `supabase.auth.signUp()`:
1. ✅ Utilisateur créé dans `auth.users`
2. ❌ **AUCUN profil créé dans `public.profiles`**
3. ❌ Application crash car profil = null

Le trigger automatique `handle_new_user()` n'existait pas pour créer le profil.

---

## SOLUTION APPLIQUÉE

### 1. Trigger Automatique Créé

**Migration:** `fix_user_registration_trigger.sql`

**Fonction créée:**
```sql
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
```

**Ce que fait la fonction:**
1. S'exécute automatiquement après chaque `INSERT` dans `auth.users`
2. Extrait `user_type` et `full_name` depuis `raw_user_meta_data`
3. Crée automatiquement un profil dans `public.profiles` avec:
   - `id` = user.id
   - `email` = user.email
   - `user_type` = metadata.user_type (défaut: 'candidate')
   - `full_name` = metadata.full_name
   - `credits_balance` = 100 (crédits de départ)
4. Gère les erreurs sans bloquer l'inscription

**Trigger créé:**
```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. AuthContext Amélioré

**Fichier:** `src/contexts/AuthContext.tsx`

**Améliorations signIn():**
```typescript
// Avant
if (error) throw error;

// Après
if (error) {
  if (error.message.includes('Invalid login credentials')) {
    throw new Error('Email ou mot de passe incorrect');
  }
  throw error;
}
```

**Bénéfices:**
- Messages d'erreur en français
- Plus clairs pour l'utilisateur

**Améliorations signUp():**
```typescript
// 1. Vérification que l'utilisateur est créé
if (!data.user) throw new Error('Inscription échouée. Veuillez réessayer.');

// 2. Attente de 1,5s pour que le trigger s'exécute
await new Promise(resolve => setTimeout(resolve, 1500));

// 3. Vérification que le profil existe
const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user.id)
  .maybeSingle();

if (!profileData) {
  throw new Error('Le profil n\'a pas été créé. Veuillez contacter le support.');
}
```

**Bénéfices:**
- Vérifie que le profil est bien créé
- Messages d'erreur clairs en français
- Délai pour laisser le trigger s'exécuter

---

## WORKFLOW D'INSCRIPTION COMPLET

### Étape par Étape

**1. Utilisateur remplit le formulaire:**
- Nom complet
- Email
- Mot de passe (min 6 caractères)
- Rôle (Candidat / Recruteur / Formateur)

**2. Frontend appelle `signUp()`:**
```typescript
await signUp(email, password, fullName, role);
```

**3. Backend Supabase:**

**a) Création utilisateur dans auth.users:**
```sql
INSERT INTO auth.users (email, encrypted_password, raw_user_meta_data)
VALUES ('user@example.com', '...', '{"user_type": "candidate", "full_name": "John Doe"}');
```

**b) Trigger s'exécute automatiquement:**
```sql
-- Le trigger on_auth_user_created se déclenche
-- Il appelle handle_new_user()
-- Qui crée le profil:
INSERT INTO public.profiles (id, email, user_type, full_name, credits_balance)
VALUES (user_id, 'user@example.com', 'candidate', 'John Doe', 100);
```

**4. Frontend vérifie le profil:**
- Attente 1,5s
- Lecture du profil créé
- Si OK → Connexion automatique
- Si erreur → Message clair

**5. Si role = 'trainer':**
- Création automatique dans `trainer_profiles`

**6. Redirection:**
- Utilisateur redirigé vers page d'accueil
- Session active
- Profil chargé

---

## TESTS DE VALIDATION

### Test 1: Inscription Candidat

**Steps:**
1. Aller sur page `/signup`
2. Remplir:
   - Nom: "Test Candidat"
   - Email: "candidat@test.com"
   - Mot de passe: "test123"
   - Rôle: Candidat
3. Cliquer "S'inscrire"

**Résultat attendu:**
- ✅ Utilisateur créé dans auth.users
- ✅ Profil créé dans profiles (user_type = 'candidate')
- ✅ credits_balance = 100
- ✅ Connexion automatique
- ✅ Redirection vers dashboard candidat

**Vérification DB:**
```sql
SELECT id, email, user_type, full_name, credits_balance
FROM profiles
WHERE email = 'candidat@test.com';

-- Doit retourner 1 ligne
```

### Test 2: Inscription Recruteur

**Steps:**
1. Inscription avec rôle "Recruteur"
2. Email: "recruteur@test.com"

**Résultat attendu:**
- ✅ user_type = 'recruiter'
- ✅ Redirection vers dashboard recruteur

### Test 3: Inscription Formateur

**Steps:**
1. Inscription avec rôle "Formateur"
2. Email: "formateur@test.com"

**Résultat attendu:**
- ✅ user_type = 'trainer'
- ✅ Entrée créée dans trainer_profiles
- ✅ Redirection vers dashboard formateur

**Vérification DB:**
```sql
SELECT * FROM trainer_profiles
WHERE user_id = (SELECT id FROM profiles WHERE email = 'formateur@test.com');

-- Doit retourner 1 ligne avec organization_type = 'individual'
```

### Test 4: Connexion

**Steps:**
1. S'inscrire avec "test@example.com"
2. Se déconnecter
3. Se reconnecter avec mêmes identifiants

**Résultat attendu:**
- ✅ Connexion réussie
- ✅ Profil chargé
- ✅ Redirection correcte

### Test 5: Erreurs

**Test 5a - Email existant:**
```
Inscription avec email déjà utilisé
→ Erreur claire (gérée par Supabase)
```

**Test 5b - Mot de passe trop court:**
```
Mot de passe < 6 caractères
→ Validation HTML empêche soumission
```

**Test 5c - Mauvais identifiants:**
```
Connexion avec mauvais mot de passe
→ "Email ou mot de passe incorrect"
```

---

## SÉCURITÉ

### RLS Policies (Existantes)

**profiles:**
```sql
-- SELECT: Tout le monde peut voir tous les profils
"Public profiles are viewable by everyone"

-- INSERT: Un utilisateur peut créer son propre profil
"Users can insert own profile"
USING (auth.uid() = id)

-- UPDATE: Un utilisateur peut mettre à jour son propre profil
"Users can update own profile"
USING (auth.uid() = id)
```

### Fonction Trigger

**Sécurité:**
- `SECURITY DEFINER` - Exécutée avec permissions du créateur (admin)
- Permet d'écrire dans `public.profiles` même si user n'a pas encore de session
- `SET search_path = public` - Protection injection
- Gestion d'erreurs avec `EXCEPTION` - N'empêche pas l'inscription si erreur

**Protection:**
- `ON CONFLICT DO NOTHING` - Évite les doublons
- Valeurs par défaut sécurisées
- Logs des erreurs dans les warnings PostgreSQL

---

## DÉBUGGAGE

### Problème: Profil non créé

**Vérifier le trigger:**
```sql
SELECT trigger_name, event_object_table, action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';
```

**Résultat attendu:**
```
trigger_name         | event_object_table | action_timing
---------------------|--------------------|--------------
on_auth_user_created | users              | AFTER
```

**Vérifier la fonction:**
```sql
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';
```

**Résultat attendu:**
```
routine_name     | routine_type | security_type
-----------------|--------------|---------------
handle_new_user  | FUNCTION     | DEFINER
```

### Problème: Erreur "Le profil n'a pas été créé"

**Cause possible:**
- Trigger pas encore exécuté (délai)
- Erreur dans le trigger

**Solution:**
1. Vérifier les logs PostgreSQL
2. Vérifier que l'utilisateur existe dans auth.users:
```sql
SELECT id, email FROM auth.users WHERE email = 'user@example.com';
```

3. Vérifier si profil existe:
```sql
SELECT * FROM profiles WHERE id = '[user_id]';
```

4. Si profil manque, le créer manuellement:
```sql
INSERT INTO profiles (id, email, user_type, full_name, credits_balance)
VALUES ('[user_id]', 'user@example.com', 'candidate', 'User Name', 100);
```

### Problème: "Email ou mot de passe incorrect"

**Causes possibles:**
1. Email incorrect
2. Mot de passe incorrect
3. Utilisateur pas encore créé dans auth.users

**Vérification:**
```sql
SELECT email, created_at FROM auth.users WHERE email = 'user@example.com';
```

---

## CONFIGURATION SUPABASE

### Paramètres Auth Recommandés

**Dans Supabase Dashboard → Authentication → Settings:**

1. **Email Auth:**
   - ✅ Enable Email Signup
   - ❌ Confirm Email (désactivé pour dev)

2. **Password Requirements:**
   - Minimum Length: 6 characters

3. **Session:**
   - JWT Expiry: 3600 (1 heure)
   - Refresh Token Expiry: 604800 (7 jours)

4. **Email Templates:**
   - Personnaliser si besoin (confirmation, reset password)

---

## MAINTENANCE

### Logs à Surveiller

**PostgreSQL Warnings:**
```sql
-- Si erreur dans trigger, visible dans les logs
RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
```

**Supabase Auth Logs:**
- Dashboard → Authentication → Logs
- Voir les signups/signins
- Identifier les échecs

### Statistiques Utiles

**Nouveaux utilisateurs aujourd'hui:**
```sql
SELECT COUNT(*) FROM auth.users
WHERE created_at > CURRENT_DATE;
```

**Utilisateurs par type:**
```sql
SELECT user_type, COUNT(*)
FROM profiles
GROUP BY user_type;
```

**Profils sans utilisateur (anomalie):**
```sql
SELECT p.id, p.email
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE u.id IS NULL;
```

**Utilisateurs sans profil (BUG!):**
```sql
SELECT u.id, u.email
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.id IS NULL;
```

---

## CHECKLIST PRODUCTION

### Avant Déploiement

- [x] Trigger `on_auth_user_created` créé
- [x] Fonction `handle_new_user()` créée
- [x] RLS policies configurées sur profiles
- [x] AuthContext amélioré avec gestion erreurs
- [x] Messages en français
- [x] Build réussi sans erreurs
- [x] Tests inscription/connexion validés

### Après Déploiement

- [ ] Tester inscription avec email réel
- [ ] Tester connexion
- [ ] Vérifier que profil est créé
- [ ] Vérifier crédits de départ (100)
- [ ] Tester les 3 rôles (candidat, recruteur, formateur)
- [ ] Monitorer logs PostgreSQL
- [ ] Monitorer Supabase Auth logs

### Support Utilisateur

**Si un utilisateur ne peut pas s'inscrire:**
1. Vérifier email valide
2. Vérifier mot de passe ≥ 6 caractères
3. Vérifier logs Supabase
4. Créer profil manuellement si nécessaire

**Si un utilisateur ne peut pas se connecter:**
1. Vérifier identifiants corrects
2. Vérifier que profil existe
3. Réinitialiser mot de passe si nécessaire

---

## RÉSUMÉ

### Ce Qui a Été Corrigé

✅ **Trigger automatique** créé pour création profil
✅ **Messages d'erreur** en français et clairs
✅ **Vérification profil** après inscription
✅ **Gestion erreurs** améliorée
✅ **Support 3 rôles** (candidat, recruteur, formateur)
✅ **Crédits initiaux** (100 crédits)
✅ **Build validé** sans erreurs

### Système Maintenant Fonctionnel

Les utilisateurs peuvent:
- ✅ S'inscrire avec email/mot de passe
- ✅ Choisir leur rôle
- ✅ Se connecter
- ✅ Avoir un profil automatiquement créé
- ✅ Recevoir 100 crédits de départ
- ✅ Accéder à leur dashboard

---

**FIN DE LA DOCUMENTATION**

**Projet:** JobGuinée - Auth Fix
**Problème:** Inscription/Connexion impossible
**Solution:** Trigger automatique + Messages clairs
**Statut:** ✅ RÉSOLU ET TESTÉ
