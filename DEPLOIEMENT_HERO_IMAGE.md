# 🚀 Déploiement de l'image Hero en Production

## ✅ Ce qui a été fait

1. **Image GIF réelle (6.2MB)** copiée dans `public/assets/hero/image_hero.gif`
2. **Build réussi** - L'image est maintenant dans `dist/assets/hero/image_hero.gif`
3. **Code mis à jour** pour utiliser le chemin `/assets/hero/image_hero.gif`
4. **Fichier de test** créé dans `dist/test-hero.html`

## 📦 Structure des fichiers

```
dist/
├── assets/
│   └── hero/
│       └── image_hero.gif (6.2MB) ✓
├── index.html
└── test-hero.html (fichier de test)
```

## 🔄 Étapes de déploiement

### Option 1 : Déploiement complet via FTP

1. **Connectez-vous à votre FTP Hostinger**
2. **Uploadez tout le dossier `dist/`** vers votre répertoire web (généralement `public_html/`)
3. **Vérifiez** que la structure est :
   ```
   public_html/
   ├── assets/
   │   └── hero/
   │       └── image_hero.gif
   ├── index.html
   └── test-hero.html
   ```

### Option 2 : Upload seulement de l'image (si le reste est déjà déployé)

Si votre site est déjà en ligne :

1. Créez le dossier `public_html/assets/hero/` (si non existant)
2. Uploadez uniquement `dist/assets/hero/image_hero.gif`
3. Vérifiez les permissions : `chmod 644 image_hero.gif`

## 🧪 Tests après déploiement

### Test 1 : Accès direct à l'image

Ouvrez dans votre navigateur :
```
https://votre-domaine.com/assets/hero/image_hero.gif
```

**Résultat attendu** : L'image GIF animée s'affiche

### Test 2 : Page de test

Ouvrez :
```
https://votre-domaine.com/test-hero.html
```

**Résultat attendu** :
- Section hero avec arrière-plan animé
- Coches vertes dans les vérifications

### Test 3 : Page d'accueil

Ouvrez :
```
https://votre-domaine.com
```

**Résultat attendu** : La section hero affiche l'image GIF en arrière-plan

## 🔍 Dépannage

### L'image ne s'affiche pas

1. **Vérifiez que le fichier existe** :
   ```bash
   curl -I https://votre-domaine.com/assets/hero/image_hero.gif
   ```
   Doit retourner : `HTTP/2 200`

2. **Vérifiez les permissions** :
   ```bash
   chmod 644 public_html/assets/hero/image_hero.gif
   ```

3. **Videz le cache** :
   - Cache du navigateur : Ctrl + Shift + R (ou Cmd + Shift + R sur Mac)
   - Cache Cloudflare (si utilisé) : Purgez le cache dans le tableau de bord

4. **Vérifiez la console du navigateur** :
   - Ouvrez DevTools (F12)
   - Onglet Console
   - Cherchez des erreurs 404

### L'image s'affiche mais pas sur la page d'accueil

1. Vérifiez que `index.html` est bien à jour
2. Videz le cache du navigateur
3. Inspectez la section hero avec DevTools

## 📊 Vérifications avec les DevTools

1. **Ouvrez votre site**
2. **Appuyez sur F12**
3. **Onglet Network**
4. **Filtrez par "image_hero"**
5. **Rechargez la page (Ctrl + R)**

Vous devriez voir :
- Status : `200 OK`
- Type : `image/gif`
- Size : `6.2 MB`

## 🎯 Commandes rapides

### Depuis votre machine locale

```bash
# 1. Vérifier que l'image est dans dist
ls -lh dist/assets/hero/image_hero.gif

# 2. Uploader via FTP (exemple avec lftp)
lftp -u utilisateur,motdepasse ftp.votresite.com
cd public_html
mirror -R dist/ ./
quit

# 3. Tester
curl -I https://votre-domaine.com/assets/hero/image_hero.gif
```

### Depuis SSH Hostinger (si disponible)

```bash
# Vérifier le fichier
ls -lh ~/public_html/assets/hero/image_hero.gif

# Vérifier les permissions
chmod 644 ~/public_html/assets/hero/image_hero.gif

# Tester localement
file ~/public_html/assets/hero/image_hero.gif
```

## 📱 Cache CDN / Cloudflare

Si vous utilisez Cloudflare ou un CDN :

1. **Connectez-vous à Cloudflare**
2. **Allez dans "Caching"**
3. **Cliquez sur "Purge Everything"** ou
4. **Purgez spécifiquement** : `https://votre-domaine.com/assets/hero/image_hero.gif`

## ✨ Optimisation (facultatif)

Si l'image est trop lourde (6.2MB), vous pouvez l'optimiser :

1. Allez sur https://ezgif.com/optimize
2. Uploadez `image_hero.gif`
3. Réduisez à 3-4MB sans perte de qualité visible
4. Remplacez le fichier

## 🎨 Alternative : Utiliser un CDN externe

Si vous hébergez l'image ailleurs :

1. Uploadez l'image sur un CDN (ex: Cloudinary, ImgBB)
2. Obtenez l'URL : `https://cdn.example.com/hero.gif`
3. Modifiez `src/pages/Home.tsx` ligne 280 :
   ```typescript
   style={{ backgroundImage: `url('https://cdn.example.com/hero.gif')` }}
   ```

## 📞 Support

Si le problème persiste après avoir suivi toutes ces étapes :

1. Vérifiez les logs du serveur Hostinger
2. Contactez le support Hostinger
3. Partagez l'URL de test et les erreurs de la console

## ✅ Checklist finale

- [ ] L'image `image_hero.gif` (6.2MB) est uploadée
- [ ] Le fichier est dans `public_html/assets/hero/image_hero.gif`
- [ ] Les permissions sont correctes (644)
- [ ] L'image est accessible via URL directe
- [ ] La page de test fonctionne
- [ ] La page d'accueil affiche l'image
- [ ] Le cache est vidé
- [ ] Testé sur plusieurs navigateurs

---

**Note** : Le build actuel contient déjà l'image correcte de 6.2MB. Il suffit de déployer le dossier `dist/` vers votre serveur.
