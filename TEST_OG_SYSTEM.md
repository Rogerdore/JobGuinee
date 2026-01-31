# 🔍 DIAGNOSTIC SYSTÈME OPEN GRAPH

**Problème signalé**: L'écran ne s'affiche pas

---

## 🚨 DIAGNOSTIC RAPIDE

### Problème 1: Le générateur d'image ne s'affiche pas ?

**Fichier**: `generate-og-default-image.html`

**Solutions**:

#### Option A: Ouvrir avec navigateur
```bash
# Double-cliquer sur le fichier
# OU
# Clic droit → Ouvrir avec → Chrome/Firefox
```

#### Option B: Générer l'image avec commande
```bash
# Alternative: Créer l'image directement avec un script
node create-og-image.js
```

---

### Problème 2: Le système OG ne fonctionne pas ?

**Test rapide**:
```bash
# Tester si Edge Function répond
curl https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway/test-123
```

**Résultat attendu**: HTML avec balises OG

**Si erreur 404**: Edge Function non déployée
**Si erreur 500**: Problème dans la fonction

---

### Problème 3: .htaccess ne fonctionne pas ?

**Test**:
```bash
# Simuler un crawler Facebook
curl -A "facebookexternalhit/1.1" https://jobguinee-pro.com/share/test-123
```

**Si retourne React** (`<div id="root"></div>`):
- .htaccess pas appliqué
- mod_rewrite désactivé
- Serveur ne supporte pas proxy

---

## 🛠️ SOLUTIONS ALTERNATIVES

### Solution 1: Créer l'image manuellement

Si le générateur HTML ne fonctionne pas, créez l'image avec un outil:

**Option A: Canva**
1. Aller sur canva.com
2. Créer design 1200x630px
3. Ajouter texte "JobGuinée - Offre d'emploi"
4. Télécharger en PNG
5. Placer dans `/public/assets/share/default-job.png`

**Option B: Figma**
1. Créer frame 1200x630
2. Design simple avec logo JobGuinée
3. Exporter PNG
4. Renommer en `default-job.png`

**Option C: Photoshop/GIMP**
1. Nouveau fichier 1200x630px
2. Fond bleu (#0E2F56)
3. Texte blanc "JobGuinée"
4. Sauver en PNG

---

### Solution 2: Utiliser l'image existante

**Si l'image existe déjà**:
```bash
# Vérifier
ls -la public/assets/share/image.png

# Convertir en 1200x630 si nécessaire
# (nécessite ImageMagick)
convert public/assets/share/image.png -resize 1200x630! public/assets/share/default-job.png
```

---

### Solution 3: Tester sans .htaccess

**Si .htaccess pose problème**, tester Edge Function directement:

**URL de test**:
```
https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway/{job_id}
```

**Avantage**: Bypass .htaccess, test direct
**Inconvénient**: Doit modifier le système de partage

---

## ✅ CHECKLIST DE VALIDATION

### Étape 1: Edge Function
- [ ] URL accessible: `https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway/test`
- [ ] Retourne HTML (pas JSON)
- [ ] Contient balises `og:title`, `og:image`

### Étape 2: Image OG
- [ ] Fichier existe: `/public/assets/share/default-job.png`
- [ ] Format: PNG
- [ ] Dimensions: 1200x630
- [ ] Accessible en HTTPS

### Étape 3: .htaccess
- [ ] Fichier uploadé à la racine
- [ ] Syntaxe correcte
- [ ] mod_rewrite activé
- [ ] Test crawler retourne HTML OG

### Étape 4: SPA React
- [ ] Navigation `/share/{id}` fonctionne
- [ ] Redirection automatique OK
- [ ] Aucune erreur console

---

## 🎯 TEST COMPLET SYSTÈME

**Script de test automatique**:

```bash
#!/bin/bash

echo "=== TEST SYSTÈME OPEN GRAPH ==="
echo ""

# Test 1: Edge Function
echo "1. Test Edge Function..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://hhhjzgeidjqctuveopso.supabase.co/functions/v1/social-gateway/test-123)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
  echo "✅ Edge Function accessible"
else
  echo "❌ Edge Function erreur: $RESPONSE"
fi

# Test 2: Image par défaut
echo ""
echo "2. Test image par défaut..."
if [ -f "public/assets/share/default-job.png" ]; then
  echo "✅ Image existe localement"
else
  echo "❌ Image manquante"
  echo "   → Créer avec generate-og-default-image.html"
fi

# Test 3: .htaccess
echo ""
echo "3. Test .htaccess..."
if [ -f "public/.htaccess" ]; then
  echo "✅ .htaccess existe"
  if grep -q "social-gateway" "public/.htaccess"; then
    echo "✅ Configuration OG présente"
  else
    echo "❌ Configuration OG manquante"
  fi
else
  echo "❌ .htaccess manquant"
fi

# Test 4: Build
echo ""
echo "4. Test build..."
if [ -d "dist" ]; then
  echo "✅ Build existe"
else
  echo "⚠️  Build à faire: npm run build"
fi

echo ""
echo "=== FIN DES TESTS ==="
```

**Exécuter**:
```bash
chmod +x test-og-system.sh
./test-og-system.sh
```

---

## 📞 BESOIN D'AIDE ?

**Si le problème persiste**, fournir ces informations:

1. **Quel écran ne s'affiche pas ?**
   - [ ] Le générateur d'image HTML
   - [ ] Le système OG sur Facebook
   - [ ] La page de partage /share/{id}
   - [ ] Autre: __________

2. **Environnement**
   - OS: Windows / Mac / Linux
   - Navigateur: Chrome / Firefox / Safari
   - Serveur: Local / Hostinger / Autre

3. **Messages d'erreur**
   - Console navigateur: __________
   - Erreur serveur: __________

4. **Tests effectués**
   - [ ] Ouvert generate-og-default-image.html
   - [ ] Testé Edge Function
   - [ ] Testé avec curl
   - [ ] Vérifié .htaccess

---

## 🚀 SOLUTION RAPIDE (10 MIN)

**Si vous voulez juste que ça fonctionne**:

### Étape 1: Télécharger une image
Télécharger cette image: https://via.placeholder.com/1200x630/0E2F56/FFFFFF?text=JobGuinee

### Étape 2: Renommer
Renommer en `default-job.png`

### Étape 3: Placer
Mettre dans `/public/assets/share/default-job.png`

### Étape 4: Build & Deploy
```bash
npm run build
# Upload dist/ vers serveur
```

### Étape 5: Tester
```bash
curl -A "facebookexternalhit/1.1" https://jobguinee-pro.com/share/test-123
```

**Résultat attendu**: HTML avec `og:image` pointant vers votre PNG

---

**Créé le**: 31 Janvier 2026
**Objectif**: Diagnostiquer et résoudre les problèmes d'affichage OG
