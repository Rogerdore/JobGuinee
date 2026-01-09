# 📢 Assets de Partage Social - JobGuinée

## 📁 Structure des Dossiers

```
public/assets/share/
├── README.md                    (ce fichier)
├── default-job.png             (image fallback 1200×630px)
└── jobs/
    ├── [job-id-1].png          (image spécifique offre 1)
    ├── [job-id-2].png          (image spécifique offre 2)
    └── ...
```

## 🎨 Spécifications des Images

### Images de Partage (Open Graph)

**Dimensions obligatoires :**
- Largeur : 1200px
- Hauteur : 630px
- Ratio : 1.91:1

**Format et poids :**
- Format : PNG ou JPG
- Poids maximum : 500 Ko
- Qualité : Haute résolution pour affichage mobile et desktop

**Accessibilité :**
- URL publique directe (pas de bundling Vite)
- Accessible via : `https://jobguinee-pro.com/assets/share/jobs/[ID].png`

### Contenu Recommandé par Image

Chaque image de partage d'offre devrait contenir :
1. **Logo JobGuinée** (coin supérieur)
2. **Titre du poste** (gros, centré)
3. **Nom de l'entreprise** (sous le titre)
4. **Ville / Localisation** (icône + texte)
5. **Type de contrat** (badge)
6. **Salaire** (si disponible)
7. **Background** : Dégradé bleu JobGuinée (#0E2F56)
8. **CTA** : "Postuler sur JobGuinée"

## 🖼️ Image par Défaut (default-job.png)

L'image `default-job.png` est utilisée comme **fallback** quand :
- L'image spécifique d'une offre n'existe pas
- L'offre vient d'être créée
- Erreur de chargement

**Contenu de l'image par défaut :**
- Logo JobGuinée (grand, centré)
- Texte : "Offre d'Emploi en Guinée"
- Slogan : "Trouvez votre prochain emploi sur JobGuinée"
- Background : Dégradé bleu JobGuinée

## 🔄 Génération Automatique des Images

### Option 1 : Génération Manuelle
Pour chaque nouvelle offre importante :
1. Utiliser un outil comme Canva ou Figma
2. Template pré-défini aux dimensions 1200×630
3. Exporter en PNG < 500 Ko
4. Nommer : `[job-id].png`
5. Placer dans `public/assets/share/jobs/`

### Option 2 : Génération Automatique (Edge Function)
Une edge function peut générer les images à la volée :
- Entrée : ID de l'offre
- Sortie : Image 1200×630 générée avec les données de l'offre
- Cache : Image sauvegardée pour réutilisation

## 📝 Exemple de Génération

```javascript
// Exemple conceptuel - à implémenter côté serveur
async function generateJobShareImage(jobData) {
  const canvas = createCanvas(1200, 630);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#0E2F56';
  ctx.fillRect(0, 0, 1200, 630);

  // Logo
  const logo = await loadImage('/logo_jobguinee.png');
  ctx.drawImage(logo, 50, 50, 150, 50);

  // Titre
  ctx.font = 'bold 60px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.fillText(jobData.title, 600, 280);

  // Entreprise
  ctx.font = '36px Arial';
  ctx.fillStyle = '#FF8C00';
  ctx.fillText(jobData.company, 600, 340);

  // Localisation
  ctx.font = '28px Arial';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(`📍 ${jobData.location}`, 600, 400);

  // CTA
  ctx.font = 'bold 32px Arial';
  ctx.fillStyle = '#FF8C00';
  ctx.fillText('Postuler sur JobGuinée.com', 600, 550);

  return canvas.toBuffer('image/png');
}
```

## 🚀 Déploiement

### Hostinger
1. Placer les images dans `public/assets/share/`
2. Après build, les images sont copiées dans `dist/assets/share/`
3. Vérifier l'accessibilité : `https://jobguinee-pro.com/assets/share/jobs/[ID].png`

### Vérification
Tester chaque URL d'image :
```bash
curl -I https://jobguinee-pro.com/assets/share/default-job.png
# Doit retourner : HTTP 200 OK
```

## 🔍 Validation Réseaux Sociaux

### Facebook Debugger
- URL : https://developers.facebook.com/tools/debug/
- Coller l'URL de l'offre
- Vérifier que l'image s'affiche correctement
- "Scrape Again" pour forcer le rafraîchissement du cache

### LinkedIn Post Inspector
- URL : https://www.linkedin.com/post-inspector/
- Coller l'URL de l'offre
- Vérifier le preview

### Twitter Card Validator
- URL : https://cards-dev.twitter.com/validator
- Coller l'URL de l'offre
- Vérifier la "Large Image Card"

## ⚠️ Important

1. **Pas de bundling Vite** : Les images doivent être dans `public/` pour être accessibles directement
2. **URL absolues** : Toujours utiliser des URLs complètes dans les meta tags
3. **Cache** : Les réseaux sociaux cachent les images, utiliser "?v=2" pour forcer le refresh si besoin
4. **HTTPS** : Obligatoire pour Facebook et LinkedIn

## 📊 Statistiques

Pour tracker l'utilisation :
- Créer une table `social_share_analytics`
- Colonnes : `job_id`, `platform` (facebook/linkedin/whatsapp/twitter), `shared_at`
- Permet de mesurer quels postes sont le plus partagés
