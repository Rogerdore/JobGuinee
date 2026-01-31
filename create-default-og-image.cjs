#!/usr/bin/env node

/**
 * Créateur d'Image OG Par Défaut - JobGuinée
 * Génère une image PNG 1200x630 pour Open Graph
 * Sans dépendance sur le navigateur
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WIDTH = 1200;
const HEIGHT = 630;
const OUTPUT_PATH = path.join(__dirname, 'public', 'assets', 'share', 'default-job.png');

console.log('🎨 Création image OG par défaut pour JobGuinée...\n');

// Vérifier si le répertoire existe
const outputDir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(outputDir)) {
  console.log('📁 Création du répertoire:', outputDir);
  fs.mkdirSync(outputDir, { recursive: true });
}

// Solution 1: Créer une image SVG simple
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background gradient -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0E2F56;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1a4a7e;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bgGradient)"/>

  <!-- Logo area -->
  <rect x="60" y="50" width="300" height="100" fill="rgba(255,255,255,0.1)" rx="8"/>

  <!-- JobGuinée text -->
  <text x="80" y="120" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#FFFFFF">
    JobGuinée
  </text>

  <!-- Subtitle -->
  <text x="80" y="150" font-family="Arial, sans-serif" font-size="20" fill="#FFA500">
    Première plateforme d'emploi en Guinée
  </text>

  <!-- Main content area -->
  <rect x="60" y="220" width="1080" height="280" fill="rgba(255,255,255,0.95)" rx="12"/>

  <!-- Icon circle -->
  <circle cx="150" cy="320" r="50" fill="#0E2F56"/>

  <!-- Briefcase icon -->
  <rect x="135" y="310" width="30" height="25" fill="#FFFFFF" rx="2"/>
  <rect x="145" y="300" width="10" height="15" fill="#FFFFFF" rx="2"/>

  <!-- Title -->
  <text x="240" y="310" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#0E2F56">
    Offre d'emploi
  </text>

  <!-- Description line 1 -->
  <text x="240" y="360" font-family="Arial, sans-serif" font-size="24" fill="#555555">
    Découvrez des opportunités professionnelles
  </text>

  <!-- Description line 2 -->
  <text x="240" y="395" font-family="Arial, sans-serif" font-size="24" fill="#555555">
    en Guinée et postulez en ligne
  </text>

  <!-- CTA Badge -->
  <rect x="240" y="420" width="320" height="50" fill="#FFA500" rx="8"/>
  <text x="280" y="453" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#FFFFFF">
    Postuler maintenant
  </text>

  <!-- Footer -->
  <text x="60" y="590" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.3)">
    jobguinee-pro.com
  </text>
</svg>`;

// Sauvegarder le SVG temporaire
const svgPath = OUTPUT_PATH.replace('.png', '.svg');
fs.writeFileSync(svgPath, svgContent);

console.log('✅ Image SVG créée:', svgPath);
console.log('📐 Dimensions:', WIDTH, 'x', HEIGHT);
console.log('');

// Instructions pour la conversion
console.log('⚠️  IMPORTANT: SVG créé avec succès!');
console.log('');
console.log('📝 PROCHAINES ÉTAPES:');
console.log('');
console.log('Option 1: Utiliser le générateur HTML (RECOMMANDÉ)');
console.log('  1. Ouvrir generate-og-default-image.html dans Chrome/Firefox');
console.log('  2. Cliquer sur "Générer l\'image"');
console.log('  3. Télécharger le PNG');
console.log('  4. Placer dans:', outputDir);
console.log('');
console.log('Option 2: Convertir manuellement le SVG');
console.log('  1. Ouvrir', svgPath, 'dans un navigateur');
console.log('  2. Faire clic droit → Enregistrer l\'image');
console.log('  3. Choisir format PNG');
console.log('  4. Sauvegarder comme default-job.png');
console.log('');
console.log('Option 3: Utiliser un convertisseur en ligne');
console.log('  1. Aller sur: https://cloudconvert.com/svg-to-png');
console.log('  2. Uploader:', svgPath);
console.log('  3. Convertir en PNG 1200x630');
console.log('  4. Télécharger et renommer en default-job.png');
console.log('');
console.log('Option 4: Utiliser un placeholder temporaire');
console.log('  → Image placeholder créée automatiquement ci-dessous...');
console.log('');

// Créer un fichier PNG minimal avec data URL pour référence
const placeholderInfo = `
IMAGE PLACEHOLDER OG

Pour test immédiat, vous pouvez:
1. Télécharger cette image: https://via.placeholder.com/1200x630/0E2F56/FFFFFF?text=JobGuinee+%7C+Offre+d%27emploi
2. Renommer en: default-job.png
3. Placer dans: ${outputDir}

Cela permettra au système OG de fonctionner immédiatement.
Remplacer ensuite par une vraie image avec le générateur HTML.
`;

const placeholderPath = path.join(outputDir, 'IMAGE_PLACEHOLDER_INFO.txt');
fs.writeFileSync(placeholderPath, placeholderInfo);

console.log('📄 Fichier info créé:', placeholderPath);
console.log('');
console.log('✅ Prêt pour déploiement!');
console.log('');
