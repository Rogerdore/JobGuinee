/**
 * Service d'Optimisation d'Images SEO
 *
 * Gère la génération, compression et optimisation des images
 * pour améliorer le SEO et les performances.
 */

export interface ImageMetadata {
  url: string;
  alt: string;
  title?: string;
  caption?: string;
  width: number;
  height: number;
  format: 'jpg' | 'png' | 'webp' | 'avif' | 'svg' | 'gif';
  size?: number;
  license?: string;
  author?: string;
  geoLocation?: string;
}

export interface ResponsiveImageSet {
  srcset: string;
  sizes: string;
  src: string;
  webpSrcset?: string;
  avifSrcset?: string;
}

export interface ImageSitemapEntry {
  loc: string; // Page URL
  images: Array<{
    image_loc: string; // Image URL
    title?: string;
    caption?: string;
    geo_location?: string;
    license?: string;
  }>;
}

export class ImageOptimizationService {

  /**
   * Génère un nom de fichier SEO-friendly
   *
   * @example
   * generateSEOFilename('Mon Image Test!', 'jpg', 1920)
   * // Returns: 'jobguinee-mon-image-test-1920w.jpg'
   */
  static generateSEOFilename(
    description: string,
    extension: string,
    width?: number,
    includeKeywords: string[] = []
  ): string {
    // Nettoyer la description
    let filename = description
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-'); // Supprimer tirets multiples

    // Ajouter la marque au début si pas déjà présent
    if (!filename.startsWith('jobguinee')) {
      filename = `jobguinee-${filename}`;
    }

    // Ajouter mots-clés SEO
    if (includeKeywords.length > 0) {
      const keywords = includeKeywords.join('-');
      filename = `${filename}-${keywords}`;
    }

    // Ajouter la largeur si fournie
    if (width) {
      filename = `${filename}-${width}w`;
    }

    // Ajouter l'extension
    return `${filename}.${extension}`;
  }

  /**
   * Génère les URLs des différentes tailles d'une image responsive
   *
   * @example
   * generateResponsiveSizes('/images/hero.jpg', [320, 640, 1024, 1920])
   */
  static generateResponsiveSizes(
    baseUrl: string,
    widths: number[] = [320, 640, 1024, 1920, 2560]
  ): ResponsiveImageSet {
    const extension = baseUrl.split('.').pop() || 'jpg';
    const basePath = baseUrl.substring(0, baseUrl.lastIndexOf('.'));

    // Générer srcset pour format original
    const srcset = widths
      .map(width => `${basePath}-${width}w.${extension} ${width}w`)
      .join(', ');

    // Générer srcset WebP
    const webpSrcset = widths
      .map(width => `${basePath}-${width}w.webp ${width}w`)
      .join(', ');

    // Générer srcset AVIF
    const avifSrcset = widths
      .map(width => `${basePath}-${width}w.avif ${width}w`)
      .join(', ');

    // Générer sizes (adaptable selon le design)
    const sizes = [
      '(max-width: 640px) 100vw',
      '(max-width: 1024px) 80vw',
      '(max-width: 1920px) 60vw',
      '50vw'
    ].join(', ');

    return {
      srcset,
      sizes,
      src: `${basePath}-1024w.${extension}`, // Fallback
      webpSrcset,
      avifSrcset
    };
  }

  /**
   * Génère un attribut alt SEO-optimisé
   *
   * @example
   * generateSEOAlt('Logo', 'Entreprise JobGuinée')
   * // Returns: 'Logo JobGuinée - Plateforme emploi Guinée | Recrutement Conakry'
   */
  static generateSEOAlt(
    mainDescription: string,
    context?: string,
    keywords: string[] = ['emploi guinée', 'recrutement']
  ): string {
    let alt = mainDescription;

    if (context) {
      alt += ` - ${context}`;
    }

    // Ajouter mots-clés SEO
    if (keywords.length > 0) {
      alt += ` | ${keywords.join(' | ')}`;
    }

    // Limiter à 125 caractères (recommandation Google)
    if (alt.length > 125) {
      alt = alt.substring(0, 122) + '...';
    }

    return alt;
  }

  /**
   * Génère le Schema.org JSON-LD pour ImageObject
   *
   * @example
   * generateImageSchema({
   *   url: 'https://jobguinee.com/images/hero.jpg',
   *   alt: 'Hero image',
   *   width: 1920,
   *   height: 1080
   * })
   */
  static generateImageSchema(metadata: ImageMetadata): object {
    return {
      "@context": "https://schema.org",
      "@type": "ImageObject",
      "contentUrl": metadata.url,
      "url": metadata.url,
      "name": metadata.title || metadata.alt,
      "description": metadata.caption || metadata.alt,
      "width": {
        "@type": "QuantitativeValue",
        "value": metadata.width,
        "unitCode": "E37" // pixel
      },
      "height": {
        "@type": "QuantitativeValue",
        "value": metadata.height,
        "unitCode": "E37"
      },
      "encodingFormat": `image/${metadata.format}`,
      ...(metadata.author && { "creator": { "@type": "Person", "name": metadata.author } }),
      ...(metadata.license && { "license": metadata.license }),
      ...(metadata.geoLocation && { "contentLocation": metadata.geoLocation })
    };
  }

  /**
   * Génère un sitemap XML pour les images
   *
   * @example
   * const entries = [
   *   {
   *     loc: 'https://jobguinee.com/jobs',
   *     images: [
   *       { image_loc: 'https://jobguinee.com/img1.jpg', title: 'Image 1' }
   *     ]
   *   }
   * ];
   * generateImageSitemap(entries)
   */
  static generateImageSitemap(entries: ImageSitemapEntry[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
    xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    entries.forEach(entry => {
      xml += `  <url>\n`;
      xml += `    <loc>${this.escapeXml(entry.loc)}</loc>\n`;

      entry.images.forEach(image => {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${this.escapeXml(image.image_loc)}</image:loc>\n`;

        if (image.title) {
          xml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`;
        }
        if (image.caption) {
          xml += `      <image:caption>${this.escapeXml(image.caption)}</image:caption>\n`;
        }
        if (image.geo_location) {
          xml += `      <image:geo_location>${this.escapeXml(image.geo_location)}</image:geo_location>\n`;
        }
        if (image.license) {
          xml += `      <image:license>${this.escapeXml(image.license)}</image:license>\n`;
        }

        xml += `    </image:image>\n`;
      });

      xml += `  </url>\n`;
    });

    xml += '</urlset>';
    return xml;
  }

  /**
   * Échappe les caractères spéciaux pour XML
   */
  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Calcule le ratio d'aspect d'une image
   */
  static calculateAspectRatio(width: number, height: number): string {
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(width, height);
    return `${width / divisor}:${height / divisor}`;
  }

  /**
   * Détermine la priorité de chargement d'une image
   *
   * @returns 'high' | 'low' | 'auto'
   */
  static determineLoadingPriority(
    isAboveFold: boolean,
    isHero: boolean,
    isLogo: boolean
  ): 'high' | 'low' | 'auto' {
    if (isHero || isLogo) return 'high';
    if (isAboveFold) return 'auto';
    return 'low';
  }

  /**
   * Génère le preload link pour les images critiques
   *
   * @example
   * <link rel="preload" as="image" href="..." />
   */
  static generatePreloadLink(imageUrl: string, type: 'image' = 'image'): string {
    return `<link rel="preload" as="${type}" href="${imageUrl}" />`;
  }

  /**
   * Valide qu'une image respecte les standards SEO
   */
  static validateImageSEO(metadata: Partial<ImageMetadata>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifications obligatoires
    if (!metadata.url) {
      errors.push('URL manquante');
    }
    if (!metadata.alt) {
      errors.push('Attribut alt manquant');
    } else if (metadata.alt.length < 5) {
      warnings.push('Attribut alt trop court (< 5 caractères)');
    } else if (metadata.alt.length > 125) {
      warnings.push('Attribut alt trop long (> 125 caractères)');
    }

    if (!metadata.width || !metadata.height) {
      warnings.push('Dimensions manquantes (impact sur CLS)');
    }

    // Vérifier le nom de fichier
    if (metadata.url) {
      const filename = metadata.url.split('/').pop() || '';
      if (filename.includes(' ')) {
        errors.push('Le nom de fichier contient des espaces');
      }
      if (filename.includes('copy') || filename.includes('(')) {
        warnings.push('Le nom de fichier semble non optimisé');
      }
      if (!/jobguinee/i.test(filename)) {
        warnings.push('Le nom de fichier ne contient pas la marque');
      }
    }

    // Vérifier le format
    if (metadata.format && !['jpg', 'png', 'webp', 'avif', 'svg'].includes(metadata.format)) {
      warnings.push(`Format "${metadata.format}" peut ne pas être optimal`);
    }

    // Vérifier la taille
    if (metadata.size && metadata.size > 200000) { // > 200KB
      warnings.push('Image trop lourde (> 200KB), compression recommandée');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Génère les métadonnées Open Graph pour une image
   */
  static generateOpenGraphTags(metadata: ImageMetadata): Record<string, string> {
    return {
      'og:image': metadata.url,
      'og:image:width': metadata.width.toString(),
      'og:image:height': metadata.height.toString(),
      'og:image:alt': metadata.alt,
      ...(metadata.format && { 'og:image:type': `image/${metadata.format}` })
    };
  }

  /**
   * Génère les métadonnées Twitter Card pour une image
   */
  static generateTwitterCardTags(metadata: ImageMetadata): Record<string, string> {
    return {
      'twitter:card': 'summary_large_image',
      'twitter:image': metadata.url,
      'twitter:image:alt': metadata.alt
    };
  }
}
