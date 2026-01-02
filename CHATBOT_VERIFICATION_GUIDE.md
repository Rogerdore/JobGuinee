# Guide de vérification du Chatbot Alpha

## ✅ Modifications apportées

1. **ChatbotWidget ajouté à la page d'accueil** (`src/pages/Home.tsx`)
2. **Avatar Alpha simplifié** avec icône MessageCircle par défaut
3. **Animations CSS ajoutées** (`animate-scale-in`, `animate-slide-up`, `animate-fade-in`)
4. **Service CMS créé** pour éviter les erreurs de compilation
5. **Logs de débogage ajoutés** pour tracer le chargement

## 🔍 Comment vérifier que le chatbot est visible

### Étape 1: Ouvrir la console du navigateur

1. Ouvrez votre navigateur (Chrome, Firefox, Edge, etc.)
2. Accédez à l'application: `http://localhost:5173` (en mode dev) ou votre URL de production
3. Appuyez sur **F12** pour ouvrir les outils de développement
4. Allez dans l'onglet **Console**

### Étape 2: Vérifier les logs

Vous devriez voir les messages suivants dans la console:

```
🔄 Alpha Avatar - Début du chargement de la configuration...
🤖 Alpha Avatar - Configuration chargée: { settings: {...}, style: {...}, enabled: true }
✅ Alpha Avatar - Fin du chargement
✨ Alpha Avatar - Rendu du composant
```

### Étape 3: Chercher l'avatar visuel

Le chatbot Alpha devrait apparaître sous forme d'un **cercle bleu flottant** dans le coin en bas à droite (ou gauche selon configuration) de la page d'accueil.

Caractéristiques visuelles:
- **Position**: En bas à droite par défaut
- **Forme**: Cercle rond avec un gradient bleu
- **Icône**: MessageCircle (bulle de conversation)
- **Indicateur**: Point vert clignotant en haut à droite du cercle
- **Animation**: Léger mouvement de respiration / hover
- **Z-index**: 50 (au-dessus de tous les autres éléments)

### Étape 4: Tester l'interaction

1. **Survoler** l'avatar avec la souris → devrait s'agrandir légèrement
2. **Cliquer** sur l'avatar → devrait ouvrir la fenêtre du chatbot
3. **Attendre 8 secondes** sans bouger → un message proactif devrait apparaître

## 🐛 Dépannage

### Le chatbot n'apparaît pas du tout

1. **Vérifier la console pour les erreurs:**
   ```
   ❌ Alpha Avatar - Erreur chargement configuration: ...
   ⚠️ Alpha Avatar - Pas de settings disponibles
   ```

2. **Vérifier que les tables existent dans Supabase:**
   ```bash
   node -e "
   const { createClient } = require('@supabase/supabase-js');
   require('dotenv').config();

   const supabase = createClient(
     process.env.VITE_SUPABASE_URL,
     process.env.VITE_SUPABASE_ANON_KEY
   );

   supabase.from('chatbot_settings').select('*').single()
     .then(({data}) => console.log('✅ Settings:', data))
     .catch(e => console.log('❌ Erreur:', e.message));
   "
   ```

3. **Vérifier que `is_enabled` est `true`:**
   - Connectez-vous à votre base de données Supabase
   - Ouvrez la table `chatbot_settings`
   - Vérifiez que `is_enabled = true`

### Le chatbot se charge mais ne s'affiche pas

1. **Vérifier le z-index:** Ouvrez l'inspecteur d'éléments (clic droit → Inspecter) et cherchez un élément avec `class="fixed bottom-6 right-6 z-50"`

2. **Vérifier les animations CSS:**
   - Ouvrez l'onglet Network des DevTools
   - Rechargez la page
   - Vérifiez que `index-[hash].css` se charge correctement

3. **Vérifier les animations:**
   ```javascript
   // Dans la console du navigateur
   const testDiv = document.createElement('div');
   testDiv.className = 'animate-slide-up';
   document.body.appendChild(testDiv);
   console.log('Animation:', window.getComputedStyle(testDiv).animation);
   document.body.removeChild(testDiv);
   ```

### Le chatbot s'affiche mais ne répond pas

1. **Vérifier la connexion Supabase:** Les clés API dans `.env` sont-elles correctes?
2. **Vérifier la table `chatbot_knowledge_base`:** Contient-elle des données?
3. **Vérifier les quotas IA:** Y a-t-il des crédits disponibles?

## 📋 Checklist de vérification rapide

- [ ] Le build compile sans erreur (`npm run build`)
- [ ] Le serveur dev démarre sans erreur (`npm run dev`)
- [ ] La console affiche les logs de chargement
- [ ] Un cercle bleu apparaît en bas à droite
- [ ] L'avatar a un point vert clignotant
- [ ] Cliquer sur l'avatar ouvre la fenêtre du chatbot
- [ ] Le message de bienvenue s'affiche

## 🎨 Personnalisation

### Changer la position

Modifier dans la table `chatbot_settings`:
```sql
UPDATE chatbot_settings
SET position = 'bottom-left'
WHERE id = '<votre-id>';
```

### Changer la taille

Modifier dans la table `chatbot_styles`:
```sql
UPDATE chatbot_styles
SET widget_size = 'large'  -- ou 'small', 'medium'
WHERE is_default = true;
```

### Changer l'animation

Modifier dans la table `chatbot_styles`:
```sql
UPDATE chatbot_styles
SET animation_type = 'fade'  -- ou 'slide', 'scale'
WHERE is_default = true;
```

## 📞 Support

Si le chatbot ne s'affiche toujours pas après avoir suivi ce guide:

1. Vérifiez les logs complets dans la console
2. Partagez les messages d'erreur
3. Vérifiez la configuration Supabase
4. Testez avec le fichier `test-chatbot-visibility.html`

---

**Note importante:** Le chatbot n'apparaît que sur la **page d'accueil** (`Home.tsx`). Si vous souhaitez qu'il apparaisse sur toutes les pages, il faut l'ajouter dans `App.tsx` au lieu de `Home.tsx`.
