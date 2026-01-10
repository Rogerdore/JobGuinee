#!/usr/bin/env node
/**
 * Script d'Optimisation d'Images en Batch
 *
 * Optimise toutes les images d'un répertoire :
 * - Compression optimale
 * - Génération formats modernes (WebP, AVIF)
 * - Création versions responsive
 * - Renommage SEO
 * - Suppression métadonnées EXIF
 *
 * Usage:
 *   node scripts/optimize-images-batch.mjs [input-dir] [output-dir]
 *
 * Exemple:
 *   node scripts/optimize-images-batch.mjs public/images/originals public/images/optimized
 *
 * Prérequis:
 *   npm install sharp
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  widths: [320, 640, 1024, 1920],
  formats: ['jpg', 'webp', 'avif'],
  quality: {
    jpg: 85,
    webp: 85,
    avif: 80
  },
  progressive: true,
  removeMetadata: true
};

// Statistiques
const stats = {
  processed: 0,
  failed: 0,
  skipped: 0,
  totalOriginalSize: 0,
  totalOptimizedSize: 0,
  startTime: Date.now()
};

/**
 * Génère un nom SEO-friendly
 */
function generateSEOFilename(originalName) {
  return originalName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Optimise une seule image
 */
async function optimizeImage(inputPath, outputDir) {
  const filename = path.basename(inputPath, path.extname(inputPath));
  const seoFilename = generateSEOFilename(filename);

  console.log(`\n📸 Processing: ${filename}`);

  try {
    // Obtenir les dimensions originales
    const metadata = await sharp(inputPath).metadata();
    const originalSize = (await fs.stat(inputPath)).size;
    stats.totalOriginalSize += originalSize;

    console.log(`  ├─ Original: ${(originalSize / 1024).toFixed(2)} KB (${metadata.width}x${metadata.height})`);

    let totalOptimizedSize = 0;

    // Générer toutes les variantes
    for (const width of CONFIG.widths) {
      // Ignorer si la largeur est supérieure à l'original
      if (width > (metadata.width || 0)) continue;

      for (const format of CONFIG.formats) {
        const outputPath = path.join(
          outputDir,
          `jobguinee-${seoFilename}-${width}w.${format}`
        );

        try {
          let pipeline = sharp(inputPath)
            .resize(width, null, {
              withoutEnlargement: true,
              fit: 'inside'
            });

          // Supprimer les métadonnées EXIF
          if (CONFIG.removeMetadata) {
            pipeline = pipeline.withMetadata({
              exif: {},
              icc: false
            });
          }

          // Appliquer le format spécifique
          switch (format) {
            case 'jpg':
              pipeline = pipeline.jpeg({
                quality: CONFIG.quality.jpg,
                progressive: CONFIG.progressive,
                mozjpeg: true
              });
              break;
            case 'webp':
              pipeline = pipeline.webp({
                quality: CONFIG.quality.webp,
                effort: 6
              });
              break;
            case 'avif':
              pipeline = pipeline.avif({
                quality: CONFIG.quality.avif,
                effort: 6
              });
              break;
          }

          await pipeline.toFile(outputPath);

          const optimizedSize = (await fs.stat(outputPath)).size;
          totalOptimizedSize += optimizedSize;

          const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
          console.log(`  ├─ ${width}w.${format}: ${(optimizedSize / 1024).toFixed(2)} KB (-${reduction}%)`);

        } catch (err) {
          console.error(`  ├─ ❌ Error ${width}w.${format}:`, err.message);
        }
      }
    }

    stats.totalOptimizedSize += totalOptimizedSize;
    stats.processed++;

    const overallReduction = ((1 - totalOptimizedSize / (originalSize * CONFIG.widths.length * CONFIG.formats.length)) * 100).toFixed(1);
    console.log(`  └─ ✅ Done! Overall reduction: ${overallReduction}%`);

  } catch (error) {
    console.error(`  └─ ❌ Failed:`, error.message);
    stats.failed++;
  }
}

/**
 * Traite tous les fichiers d'un répertoire
 */
async function processDirectory(inputDir, outputDir) {
  try {
    // Créer le répertoire de sortie s'il n'existe pas
    await fs.mkdir(outputDir, { recursive: true });

    // Lire tous les fichiers
    const files = await fs.readdir(inputDir);

    console.log(`\n🚀 Starting image optimization...`);
    console.log(`📂 Input: ${inputDir}`);
    console.log(`📂 Output: ${outputDir}`);
    console.log(`📊 Files found: ${files.length}\n`);

    // Filtrer les images
    const imageFiles = files.filter(file =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      console.log('⚠️  No images found!');
      return;
    }

    // Traiter chaque image
    for (const file of imageFiles) {
      const inputPath = path.join(inputDir, file);
      await optimizeImage(inputPath, outputDir);
    }

    // Afficher les statistiques finales
    printStats();

  } catch (error) {
    console.error('❌ Error processing directory:', error);
    process.exit(1);
  }
}

/**
 * Affiche les statistiques finales
 */
function printStats() {
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);
  const originalMB = (stats.totalOriginalSize / 1024 / 1024).toFixed(2);
  const optimizedMB = (stats.totalOptimizedSize / 1024 / 1024).toFixed(2);
  const reduction = ((1 - stats.totalOptimizedSize / stats.totalOriginalSize) * 100).toFixed(1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Processed: ${stats.processed} images`);
  console.log(`❌ Failed: ${stats.failed} images`);
  console.log(`⏭️  Skipped: ${stats.skipped} images`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log(`📦 Original size: ${originalMB} MB`);
  console.log(`📦 Optimized size: ${optimizedMB} MB`);
  console.log(`💾 Space saved: ${(originalMB - optimizedMB).toFixed(2)} MB (${reduction}%)`);
  console.log('='.repeat(60) + '\n');
}

/**
 * Point d'entrée principal
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🖼️  Image Optimization Script

Usage:
  node optimize-images-batch.mjs [input-dir] [output-dir]

Arguments:
  input-dir   Directory containing original images (default: public/images/originals)
  output-dir  Directory for optimized images (default: public/images/optimized)

Options:
  --help, -h  Show this help message

Examples:
  node optimize-images-batch.mjs
  node optimize-images-batch.mjs public/images public/optimized
  node optimize-images-batch.mjs ~/Downloads public/images

Features:
  ✓ Multiple formats (JPEG, WebP, AVIF)
  ✓ Responsive sizes (320w, 640w, 1024w, 1920w)
  ✓ SEO-friendly naming
  ✓ EXIF metadata removal
  ✓ Progressive JPEG
  ✓ Optimal compression

Required:
  npm install sharp
    `);
    process.exit(0);
  }

  const inputDir = args[0] || path.join(process.cwd(), 'public/images/originals');
  const outputDir = args[1] || path.join(process.cwd(), 'public/images/optimized');

  // Vérifier que le répertoire d'entrée existe
  try {
    await fs.access(inputDir);
  } catch {
    console.error(`❌ Input directory not found: ${inputDir}`);
    console.log(`💡 Tip: Create it with: mkdir -p ${inputDir}`);
    process.exit(1);
  }

  await processDirectory(inputDir, outputDir);
}

// Exécuter
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
