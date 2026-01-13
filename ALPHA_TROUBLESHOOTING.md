# Dépannage Avatar Alpha - "Je ne vois pas l'avatar"

## ✅ Checklist de vérification

### 1. Vérifier que le chatbot est activé

Ouvrir la console du navigateur (F12) et exécuter :

```javascript
// Vérifier les paramètres du chatbot
fetch(window.location.origin + '/api/chatbot/settings')
  .then(r => r.json())
  .then(console.log);
```

Résultat attendu : `is_enabled: true`

### 2. Vérifier que l'image est chargée

Dans la console du navigateur :

```javascript
// Tester le chargement de l'image
const img = new Image();
img.onload = () => console.log('✅ Avatar image loaded successfully');
img.onerror = () => console.error('❌ Avatar image failed to load');
img.src = '/alpha-avatar.png';
```

### 3. Vérifier que le composant est monté

Dans la console du navigateur :

```javascript
// Chercher l'avatar dans le DOM
const avatar = document.querySelector('[class*="fixed bottom-6"]');
console.log('Avatar element:', avatar);

// Si non trouvé, vérifier les erreurs React
if (!avatar) {
  console.log('Avatar component not found in DOM');
}
```

### 4. Vérifier les erreurs JavaScript

1. Ouvrir DevTools (F12)
2. Aller dans l'onglet Console
3. Chercher des erreurs rouges
4. Copier les erreurs et les analyser

### 5. Vérifier que vous êtes sur la bonne page

L'avatar s'affiche sur **toutes les pages** sauf :
- Page de connexion (`/auth`)
- Pages d'administration (certaines)

**Solution** : Allez sur la page d'accueil (`/`)

### 6. Vérifier le cache du navigateur

```bash
# Vider le cache :
- Chrome/Edge : Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)
- Firefox : Ctrl + F5 (Windows) / Cmd + Shift + R (Mac)
```

### 7. Vérifier le positionnement

L'avatar est positionné en **bas à droite** par défaut.

Si votre écran est très petit ou zoomé, il peut être hors du viewport.

**Solution** : Dézoomez (Ctrl + 0) ou élargissez la fenêtre.

### 8. Vérifier dans la base de données

Exécuter cette requête SQL dans Supabase :

```sql
-- Vérifier les paramètres
SELECT is_enabled, position FROM chatbot_settings;

-- Vérifier le style
SELECT widget_size, animation_type FROM chatbot_styles WHERE is_default = true;
```

Résultat attendu :
- `is_enabled: true`
- `position: bottom-right`
- `widget_size: medium` (ou small/large)

## 🔧 Solutions rapides

### Solution 1 : Forcer l'affichage

Ajouter temporairement dans `ChatbotWidget.tsx` ligne 98 :

```typescript
// AVANT
if (loading || !settings || !settings.is_enabled) {
  return null;
}

// APRÈS (pour debug)
if (loading) {
  return <div className="fixed bottom-6 right-6 bg-red-500 text-white p-4">Loading...</div>;
}
if (!settings) {
  return <div className="fixed bottom-6 right-6 bg-red-500 text-white p-4">No settings</div>;
}
if (!settings.is_enabled) {
  return <div className="fixed bottom-6 right-6 bg-red-500 text-white p-4">Disabled</div>;
}
```

Cela vous dira exactement pourquoi le widget ne s'affiche pas.

### Solution 2 : Activer le chatbot via SQL

```sql
UPDATE chatbot_settings
SET is_enabled = true
WHERE id = (SELECT id FROM chatbot_settings LIMIT 1);
```

### Solution 3 : Recréer le style par défaut

```sql
INSERT INTO chatbot_styles (
  name,
  primary_color,
  secondary_color,
  widget_size,
  is_default
) VALUES (
  'JobGuinée Default',
  '#0E2F56',
  '#1a4a7e',
  'large',
  true
)
ON CONFLICT (id) DO UPDATE SET
  widget_size = 'large',
  is_default = true;
```

### Solution 4 : Vérifier l'emplacement de l'image

```bash
# Terminal
ls -lh public/alpha-avatar.png

# Doit afficher : -rw-r--r-- 1 user user 60K Dec 31 ... alpha-avatar.png
```

Si le fichier n'existe pas :
```bash
# Copier l'image fournie
cp image.png public/alpha-avatar.png
```

## 🐛 Erreurs connues

### Erreur : "Cannot read property 'widget_size' of null"

**Cause** : La table `chatbot_styles` n'a pas de style par défaut.

**Solution** :
```sql
INSERT INTO chatbot_styles (name, widget_size, is_default)
VALUES ('Default', 'medium', true)
ON CONFLICT DO NOTHING;
```

### Erreur : "Image failed to load"

**Cause** : L'image n'est pas dans `/public/alpha-avatar.png`

**Solution** : Copier l'image au bon endroit (voir Solution 4)

### Erreur : "settings.is_enabled is not defined"

**Cause** : La table `chatbot_settings` est vide.

**Solution** :
```sql
INSERT INTO chatbot_settings (is_enabled, position)
VALUES (true, 'bottom-right')
ON CONFLICT DO NOTHING;
```

## 📱 Test sur mobile

Sur mobile, l'avatar peut être :
- Plus petit (responsive)
- Caché par un clavier virtuel
- Hors viewport si scroll en bas

**Solution** : Scrollez en haut de la page.

## 🎯 Test final

Si tout le reste échoue, testez avec ce code minimal dans la console :

```javascript
// Créer un avatar de test
const testAvatar = document.createElement('div');
testAvatar.style.cssText = `
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 96px;
  height: 96px;
  background: linear-gradient(135deg, #0E2F56, #1a4a7e);
  border-radius: 50%;
  box-shadow: 0 10px 40px rgba(6, 182, 212, 0.5);
  cursor: pointer;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 48px;
`;
testAvatar.innerHTML = '👤';
document.body.appendChild(testAvatar);

console.log('✅ Test avatar créé ! Vous devriez le voir en bas à droite.');
```

Si vous voyez cet avatar de test, cela signifie que :
- ✅ Le positionnement CSS fonctionne
- ✅ Le z-index est correct
- ❌ Le problème vient de la logique React ou des données

Si vous ne le voyez toujours pas :
- ❌ Problème de viewport ou de CSS global
- Vérifiez les styles de la page parente

## 📞 Support avancé

Si rien ne fonctionne :

1. Exporter les logs console (F12 → Console → Right-click → Save as...)
2. Faire une capture d'écran de la page
3. Vérifier l'onglet Network (F12) pour les erreurs de chargement
4. Partager les informations ci-dessus

---

**La plupart du temps, le problème est simplement que le chatbot est désactivé ou que l'image n'est pas au bon endroit.**
