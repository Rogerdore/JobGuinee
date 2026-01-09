# 🌐 Configuration DNS pour Bolt.new

## 📍 Situation Actuelle

- ✅ Votre site est hébergé sur **Bolt.new**
- ❌ Votre DNS pointe encore vers **Hostinger**
- ❌ Les visiteurs voient l'ancienne version sur Hostinger

## 🎯 Solution : Pointer le DNS vers Bolt.new

### Étape 1 : Trouver l'URL de votre site Bolt.new

1. Allez sur votre projet Bolt.new
2. Cherchez l'URL de déploiement (généralement : `votre-projet.bolt.new`)
3. Notez cette URL

### Étape 2 : Configuration DNS chez votre fournisseur de domaine

Vous avez 2 options selon votre fournisseur de domaine :

---

## Option A : CNAME Record (Recommandé)

### Si votre domaine est chez Hostinger :

1. Connectez-vous à votre **Panel Hostinger**
2. Allez dans **Domaines** → Sélectionnez votre domaine
3. Cliquez sur **DNS / Nameservers**
4. Modifiez ou ajoutez les enregistrements :

```
Type: CNAME
Nom: www
Pointe vers: votre-projet.bolt.new
TTL: 3600 (ou 1 heure)

Type: A ou CNAME
Nom: @
Pointe vers: [IP fournie par Bolt.new ou redirection]
TTL: 3600
```

### Si votre domaine est chez un autre fournisseur (GoDaddy, Namecheap, etc.) :

1. Connectez-vous à votre panneau de gestion DNS
2. Trouvez la section **DNS Management** ou **DNS Records**
3. Ajoutez/Modifiez :
   - **CNAME** pour `www` → `votre-projet.bolt.new`
   - Contactez le support Bolt.new pour l'IP pour l'enregistrement A (`@`)

---

## Option B : Si Bolt.new fournit une IP statique

Si Bolt.new vous a fourni une adresse IP :

```
Type: A
Nom: @
Valeur: [IP fournie par Bolt.new]
TTL: 3600

Type: A
Nom: www
Valeur: [IP fournie par Bolt.new]
TTL: 3600
```

---

## 📋 Vérification de la Configuration Bolt.new

Dans votre projet Bolt.new :

1. Allez dans **Settings** ou **Deployment Settings**
2. Cherchez la section **Custom Domain** ou **Domain Settings**
3. Ajoutez votre domaine : `votredomaine.com`
4. Bolt.new vous donnera les enregistrements DNS exacts à configurer

---

## ⏰ Propagation DNS

Après avoir modifié le DNS :

- ⏱️ **Propagation** : 1 à 48 heures (généralement 1-4 heures)
- 🔍 **Vérification** : Utilisez https://dnschecker.org avec votre domaine

### Pendant la propagation :

Vous pouvez accéder à votre site via :
- ✅ L'URL Bolt.new directe : `votre-projet.bolt.new`
- ⏳ Votre domaine custom (après propagation)

---

## 🔧 Configuration Recommandée

### 1. Désactiver l'ancien hébergement Hostinger

Pour éviter la confusion :

1. Connectez-vous à votre cPanel Hostinger
2. Allez dans **Gestionnaire de fichiers**
3. Dans `public_html/`, créez un fichier `index.html` avec :

```html
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url=https://votredomaine.com">
    <title>Redirection...</title>
</head>
<body>
    <p>Redirection en cours...</p>
</body>
</html>
```

Cela redirigera automatiquement vers votre nouveau site.

### 2. Certificat SSL

Une fois le DNS configuré :
- Bolt.new génère automatiquement un certificat SSL
- Votre site sera accessible en HTTPS
- Cela peut prendre quelques heures après la propagation DNS

---

## ✅ Checklist de Migration

- [ ] Noter l'URL Bolt.new de votre projet
- [ ] Accéder à la gestion DNS de votre domaine
- [ ] Modifier les enregistrements DNS (CNAME ou A)
- [ ] Sauvegarder les changements DNS
- [ ] Ajouter le domaine custom dans les settings Bolt.new
- [ ] Attendre la propagation (1-4 heures typiquement)
- [ ] Vérifier sur https://dnschecker.org
- [ ] Tester le site sur votre domaine
- [ ] Vérifier le certificat SSL (cadenas vert)
- [ ] Désactiver ou rediriger l'ancien site Hostinger

---

## 🐛 Résolution des Problèmes

### "Mon domaine ne fonctionne toujours pas après 24h"

1. **Vérifier la configuration DNS** :
   ```bash
   # Sur Mac/Linux
   nslookup votredomaine.com

   # Ou
   dig votredomaine.com
   ```

2. **Vérifier sur dnschecker.org** :
   - Allez sur https://dnschecker.org
   - Entrez votre domaine
   - Vérifiez que l'IP correspond à Bolt.new

3. **Contacter le support** :
   - Support Bolt.new pour la configuration de domaine
   - Support de votre fournisseur DNS pour les enregistrements

### "Je vois l'ancien site Hostinger"

- Videz le cache DNS local :
  ```bash
  # Windows
  ipconfig /flushdns

  # Mac
  sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

  # Linux
  sudo systemd-resolve --flush-caches
  ```

- Testez en navigation privée
- Testez sur un autre réseau (4G mobile)

### "Erreur SSL / HTTPS"

- Attendez 2-4 heures après la propagation DNS
- Vérifiez que le domaine est bien ajouté dans Bolt.new
- Contactez le support Bolt.new si l'erreur persiste

---

## 🎯 Résumé des Actions Immédiates

1. **Trouvez votre URL Bolt.new** (ex: `monprojet.bolt.new`)
2. **Allez dans votre gestion DNS** (Hostinger ou autre)
3. **Pointez vers Bolt.new** :
   - CNAME `www` → `monprojet.bolt.new`
   - Demandez l'IP pour l'enregistrement A `@`
4. **Ajoutez le domaine** dans les settings Bolt.new
5. **Attendez la propagation** (1-4 heures)
6. **Testez** sur https://dnschecker.org

---

## 📞 Support

- **Bolt.new Support** : Pour la configuration de domaine custom
- **Fournisseur DNS** : Pour l'aide sur les enregistrements DNS
- **Documentation Bolt.new** : Consultez leur guide sur les custom domains

---

## 💡 Alternative Temporaire

En attendant la propagation DNS, partagez l'URL Bolt.new directe :
- `https://votre-projet.bolt.new`

Vos modifications seront visibles immédiatement sur cette URL !
