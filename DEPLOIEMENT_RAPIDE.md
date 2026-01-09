# ⚡ Déploiement Rapide - JobGuinee

## 🚀 Méthode la plus simple (RECOMMANDÉE)

### Option 1 : Script Automatique

```bash
# 1. Compiler et préparer
./deploy-simple.sh

# 2. Déployer via FTP (si configuré)
./deploy-ftp.sh
```

### Option 2 : Upload Manuel via FileZilla

```bash
# 1. Compiler
npm run build

# 2. Ouvrir FileZilla et se connecter

# 3. SUPPRIMER tout dans public_html/

# 4. Uploader TOUT le contenu de dist/ vers public_html/
```

### Option 3 : Upload via cPanel (PLUS FACILE)

```bash
# 1. Créer le ZIP
./create-production-zip.sh

# 2. Upload dans cPanel :
#    - Ouvrir cPanel
#    - Gestionnaire de fichiers → public_html/
#    - Supprimer tout
#    - Upload jobguinee-production.zip
#    - Clic droit → Extract
```

---

## ⚠️ IMPORTANT

### Après CHAQUE déploiement :

1. **Vider le cache du navigateur** : `Ctrl + Shift + R`
2. **Tester en navigation privée**
3. Attendre 2-5 minutes si nécessaire

---

## ✅ Vérification

Votre site doit contenir :
```
public_html/
├── .htaccess        ← IMPORTANT pour le routing
├── index.html       ← Page principale
├── assets/          ← CSS, JS, images
├── logo_jobguinee.png
└── ...
```

---

## 🐛 Problèmes courants

### "Je ne vois pas mes modifications"
- ✅ Videz le cache : `Ctrl + Shift + R`
- ✅ Testez en navigation privée
- ✅ Attendez 5 minutes

### "Page blanche / Erreur 404"
- ✅ Vérifiez que `.htaccess` est présent
- ✅ Vérifiez que `index.html` est à la racine de `public_html/`
- ✅ Vérifiez les permissions (fichiers: 644, dossiers: 755)

### "Les styles ne se chargent pas"
- ✅ Vérifiez que le dossier `assets/` est uploadé
- ✅ Videz le cache du navigateur

---

## 📞 Support

Consultez le guide complet : `GUIDE_DEPLOIEMENT_PRODUCTION.md`
