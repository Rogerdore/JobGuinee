/**
 * Configuration Centralisée pour l'Optimisation d'Images SEO
 *
 * Ce fichier contient toutes les configurations par défaut pour
 * l'optimisation des images sur JobGuinée.
 */

export const IMAGE_CONFIG = {
  // Formats supportés
  FORMATS: {
    modern: ['webp', 'avif'],
    legacy: ['jpg', 'png', 'gif'],
    vector: ['svg']
  },

  // Tailles responsive par défaut
  RESPONSIVE_WIDTHS: [320, 640, 1024, 1920, 2560],

  // Qualité de compression par format
  QUALITY: {
    jpg: 85,
    png: 90,
    webp: 85,
    avif: 80
  },

  // Attribut sizes par défaut
  DEFAULT_SIZES: [
    '(max-width: 640px) 100vw',
    '(max-width: 1024px) 80vw',
    '(max-width: 1920px) 60vw',
    '50vw'
  ].join(', '),

  // Convention de nommage
  NAMING: {
    prefix: 'jobguinee',
    separator: '-',
    includeDimensions: true,
    keywords: {
      default: ['emploi', 'guinée', 'recrutement'],
      jobs: ['offre', 'poste', 'candidature'],
      profiles: ['candidat', 'cv', 'professionnel'],
      formations: ['formation', 'cours', 'apprentissage'],
      blog: ['article', 'guide', 'conseil']
    }
  },

  // Optimisation performance
  PERFORMANCE: {
    lazyLoadThreshold: '50px', // Marge avant viewport
    preloadLimit: 2, // Max 2 images preload
    maxFileSize: 200 * 1024, // 200KB
    placeholderQuality: 10 // Pour LQIP
  },

  // SEO
  SEO: {
    altMinLength: 10,
    altMaxLength: 125,
    titleMaxLength: 70,
    includeGeoLocation: true,
    defaultGeoLocation: 'Conakry, Guinée',
    includeBrand: true
  },

  // CDN
  CDN: {
    enabled: false, // À activer en production
    baseUrl: 'https://cdn.jobguinee.com',
    transformations: true // URL-based transformations
  },

  // Cache
  CACHE: {
    duration: 31536000, // 1 an en secondes
    immutable: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Vary': 'Accept'
    }
  },

  // Compression
  COMPRESSION: {
    removeMetadata: true,
    progressive: true, // JPEG progressif
    optimizeScans: true,
    stripMetadata: ['exif', 'icc', 'xmp']
  },

  // Sitemap
  SITEMAP: {
    maxImages: 1000, // Par sitemap
    includeCaption: true,
    includeGeoLocation: true,
    includeLicense: true,
    updateFrequency: 'daily'
  },

  // Types d'images par contexte
  IMAGE_TYPES: {
    hero: {
      priority: 'high',
      loading: 'eager',
      responsive: true,
      modernFormats: true,
      schema: true,
      preload: true
    },
    logo: {
      priority: 'high',
      loading: 'eager',
      responsive: false,
      modernFormats: false,
      schema: false,
      preload: true
    },
    content: {
      priority: 'low',
      loading: 'lazy',
      responsive: true,
      modernFormats: true,
      schema: false,
      preload: false
    },
    thumbnail: {
      priority: 'low',
      loading: 'lazy',
      responsive: true,
      modernFormats: true,
      schema: false,
      preload: false
    },
    background: {
      priority: 'low',
      loading: 'lazy',
      responsive: true,
      modernFormats: true,
      schema: false,
      preload: false
    }
  },

  // Dimensions recommandées par type
  DIMENSIONS: {
    hero: { width: 1920, height: 1080 }, // 16:9
    logo: { width: 300, height: 80 },
    jobCard: { width: 1200, height: 630 }, // Open Graph
    profilePhoto: { width: 400, height: 400 }, // Carré
    thumbnail: { width: 300, height: 200 }, // 3:2
    banner: { width: 1200, height: 400 }, // 3:1
    socialShare: { width: 1200, height: 630 } // Facebook/LinkedIn
  },

  // Extensions autorisées
  ALLOWED_EXTENSIONS: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'
  ],

  // Taille maximale par type (en bytes)
  MAX_SIZE: {
    hero: 500 * 1024, // 500KB
    logo: 50 * 1024, // 50KB
    content: 200 * 1024, // 200KB
    thumbnail: 100 * 1024, // 100KB
    profile: 150 * 1024 // 150KB
  },

  // Open Graph / Social Media
  SOCIAL_MEDIA: {
    facebook: {
      width: 1200,
      height: 630,
      aspectRatio: '1.91:1'
    },
    twitter: {
      width: 1200,
      height: 675,
      aspectRatio: '16:9'
    },
    linkedin: {
      width: 1200,
      height: 627,
      aspectRatio: '1.91:1'
    },
    whatsapp: {
      width: 400,
      height: 400,
      aspectRatio: '1:1'
    }
  },

  // Placeholders
  PLACEHOLDER: {
    enabled: true,
    type: 'shimmer', // 'shimmer' | 'blur' | 'none'
    color: '#e5e7eb',
    shimmerColor: '#f3f4f6'
  },

  // Watermark (optionnel)
  WATERMARK: {
    enabled: false,
    text: '© JobGuinée 2025',
    position: 'bottom-right',
    opacity: 0.7,
    fontSize: 14,
    color: '#ffffff'
  }
} as const;

/**
 * Configuration par environnement
 */
export const ENV_CONFIG = {
  development: {
    ...IMAGE_CONFIG,
    CDN: { ...IMAGE_CONFIG.CDN, enabled: false },
    COMPRESSION: { ...IMAGE_CONFIG.COMPRESSION, progressive: false }
  },
  production: {
    ...IMAGE_CONFIG,
    CDN: { ...IMAGE_CONFIG.CDN, enabled: true },
    COMPRESSION: { ...IMAGE_CONFIG.COMPRESSION, progressive: true }
  },
  test: {
    ...IMAGE_CONFIG,
    RESPONSIVE_WIDTHS: [320, 640],
    PERFORMANCE: { ...IMAGE_CONFIG.PERFORMANCE, maxFileSize: 100 * 1024 }
  }
} as const;

/**
 * Récupère la configuration pour l'environnement actuel
 */
export function getImageConfig() {
  const env = process.env.NODE_ENV || 'development';
  return ENV_CONFIG[env as keyof typeof ENV_CONFIG] || IMAGE_CONFIG;
}

/**
 * Types TypeScript
 */
export type ImageType = keyof typeof IMAGE_CONFIG.IMAGE_TYPES;
export type ImageFormat = 'jpg' | 'png' | 'gif' | 'webp' | 'avif' | 'svg';
export type ImagePriority = 'high' | 'low' | 'auto';
export type ImageLoading = 'lazy' | 'eager';

export interface ImageConfigOptions {
  type?: ImageType;
  format?: ImageFormat;
  width?: number;
  height?: number;
  quality?: number;
  responsive?: boolean;
  modernFormats?: boolean;
  priority?: ImagePriority;
  loading?: ImageLoading;
}
