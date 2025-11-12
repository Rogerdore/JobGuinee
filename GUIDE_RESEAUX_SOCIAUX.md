# 📱 Guide de Configuration des Réseaux Sociaux

## ✅ Migration Appliquée

La table `social_media_configuration` a été créée avec succès dans la base de données avec **tous les réseaux sociaux activés par défaut** pour test.

## 🎯 Vérifier que les Icônes Apparaissent

### 1. Position des Icônes

Les icônes des réseaux sociaux apparaissent dans la barre de navigation:

```
┌────────────────────────────────────────────────────────────────┐
│ JobGuinée  [Accueil] [Emploi] [CV]...  [f][i][t][y][l][x]  👤 │
└────────────────────────────────────────────────────────────────┘
```

**Position**: Entre les liens de navigation et le menu utilisateur
**Visibilité**: Seulement sur desktop (masqué sur mobile)

### 2. Réseaux Activés par Défaut

✅ **Facebook** - https://facebook.com/jobguinee
✅ **Instagram** - https://instagram.com/jobguinee
✅ **TikTok** - https://tiktok.com/@jobguinee
✅ **YouTube** - https://youtube.com/@jobguinee
✅ **LinkedIn** - https://linkedin.com/company/jobguinee
✅ **Twitter/X** - https://twitter.com/jobguinee

## 🔧 Gérer les Réseaux Sociaux (Admin)

### 1. Accéder à la Configuration

1. Connectez-vous en tant qu'**admin**
2. Dans la navbar admin, cliquez sur **"Réseaux Sociaux"**
3. Vous verrez tous les réseaux disponibles

### 2. Activer/Désactiver un Réseau

Pour chaque réseau:
- **Toggle ON** (bleu) = Réseau visible dans le menu
- **Toggle OFF** (gris) = Réseau masqué

### 3. Modifier une URL

1. Cliquez dans le champ "URL du profil"
2. Entrez votre URL complète (ex: https://facebook.com/votreprofil)
3. Cliquez sur **"Sauvegarder les modifications"**

### 4. Exemple de Configuration

```
┌─────────────────────────────────────────────┐
│ [🔵 Facebook]  Activé           [🔵 ON]    │
│ URL: https://facebook.com/jobguinee_off    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ [🌸 Instagram]  Désactivé      [⚪ OFF]    │
│ URL: https://instagram.com/jobguinee        │
└─────────────────────────────────────────────┘
```

## 🎨 Apparence des Icônes

### Couleurs par Réseau

| Réseau    | Couleur          | Icône |
|-----------|------------------|-------|
| Facebook  | Bleu (#3B82F6)   | f     |
| Instagram | Rose (#EC4899)   | 📷    |
| TikTok    | Noir (#111827)   | 🎵    |
| YouTube   | Rouge (#DC2626)  | ▶️    |
| LinkedIn  | Bleu (#1D4ED8)   | in    |
| Twitter/X | Cyan (#0EA5E9)   | 🐦    |

### Effets au Survol

- **Hover**: Fond coloré léger + légère transition
- **Tooltip**: Nom du réseau au survol
- **Clic**: Ouverture dans nouvel onglet

## 🧪 Tester la Configuration

### Test Rapide

1. **Accédez à la page d'accueil**
2. **Regardez la navbar** (haut de page)
3. **Vous devriez voir 6 icônes** entre le menu et votre profil
4. **Cliquez sur une icône** → S'ouvre dans un nouvel onglet

### Si les Icônes n'Apparaissent Pas

#### Vérification 1: Base de Données

```bash
node init-social-media-simple.js
```

Devrait afficher:
```
✅ Configuration trouvée!
📊 État actuel:
  Facebook: ✓ Activé
  Instagram: ✓ Activé
  ...
```

#### Vérification 2: Console Navigateur

1. Ouvrez les DevTools (F12)
2. Onglet "Console"
3. Recherchez des erreurs liées à `social_media_configuration`

#### Vérification 3: Layout

Le code suivant devrait être dans `Layout.tsx`:

```tsx
const [socialMedia, setSocialMedia] = useState<SocialMedia | null>(null);

useEffect(() => {
  loadSocialMedia();
}, []);

const loadSocialMedia = async () => {
  const { data } = await supabase
    .from('social_media_configuration')
    .select('*')
    .single();
  if (data) setSocialMedia(data);
};
```

## 🔄 Workflow Complet

### Scénario: Ajouter Facebook

1. **Admin** se connecte
2. **Admin** va dans "Réseaux Sociaux"
3. **Admin** active Facebook (toggle ON)
4. **Admin** entre: `https://facebook.com/jobguinee_officiel`
5. **Admin** sauvegarde
6. **Utilisateurs** voient l'icône Facebook immédiatement
7. **Clic** sur Facebook → Redirige vers la page

### Scénario: Retirer Temporairement TikTok

1. **Admin** désactive TikTok (toggle OFF)
2. **Admin** sauvegarde
3. **Icône TikTok** disparaît du menu
4. **URLs TikTok** restent sauvegardées
5. **Réactivation** facile quand nécessaire

## 📊 Vérification SQL Manuelle

Si besoin, vérifiez directement dans Supabase:

```sql
SELECT * FROM social_media_configuration;
```

Devrait retourner:
```json
{
  "enable_facebook": true,
  "facebook_url": "https://facebook.com/jobguinee",
  "enable_instagram": true,
  ...
}
```

## 🎯 Points Clés

✅ **Tous les réseaux activés** par défaut pour test
✅ **Visible uniquement sur desktop** (>= 768px)
✅ **Position**: À droite du menu, avant le profil utilisateur
✅ **Gestion**: Page admin "Réseaux Sociaux"
✅ **Temps réel**: Changements instantanés
✅ **Sécurité**: Liens externes sécurisés

## 🆘 Support

Si les icônes n'apparaissent toujours pas:

1. Vérifiez que vous êtes sur **desktop** (pas mobile)
2. Vérifiez la **largeur de fenêtre** (>= 768px)
3. **Rechargez** la page (Ctrl+R)
4. Vérifiez la **console** pour erreurs
5. Vérifiez que la **migration** est appliquée

---

**Les réseaux sociaux sont maintenant configurables et visibles! 🎉**
