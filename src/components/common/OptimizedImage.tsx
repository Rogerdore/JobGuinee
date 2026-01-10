import React, { useState, useEffect, useRef } from 'react';
import { ImageOptimizationService, ImageMetadata } from '../../services/imageOptimizationService';

interface OptimizedImageProps {
  src: string;
  alt: string;
  title?: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: 'high' | 'low' | 'auto';
  loading?: 'lazy' | 'eager';
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  responsive?: boolean;
  modernFormats?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  placeholder?: 'blur' | 'shimmer' | 'none';
  schema?: boolean;
  sizes?: string;
}

/**
 * Composant d'image optimisé pour le SEO et les performances
 *
 * Fonctionnalités :
 * - Lazy loading natif et Intersection Observer
 * - Formats modernes (WebP, AVIF) avec fallback
 * - Images responsive avec srcset
 * - Schema.org ImageObject
 * - Placeholders pendant le chargement
 * - Attributs SEO optimaux
 *
 * @example
 * <OptimizedImage
 *   src="/images/hero.jpg"
 *   alt="Plateforme emploi Guinée"
 *   width={1920}
 *   height={1080}
 *   responsive
 *   modernFormats
 *   priority="high"
 *   schema
 * />
 */
export default function OptimizedImage({
  src,
  alt,
  title,
  className = '',
  width,
  height,
  priority = 'auto',
  loading,
  objectFit = 'cover',
  responsive = true,
  modernFormats = true,
  onLoad,
  onError,
  placeholder = 'shimmer',
  schema = false,
  sizes
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority === 'high');
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer pour lazy loading avancé
  useEffect(() => {
    if (priority === 'high' || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px' // Charger 50px avant d'entrer dans le viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, loading]);

  // Générer les URLs responsive
  const generateImageUrls = () => {
    if (!responsive) {
      return { src, srcset: '', webpSrcset: '', avifSrcset: '' };
    }

    const basePath = src.substring(0, src.lastIndexOf('.'));
    const extension = src.split('.').pop() || 'jpg';
    const widths = [320, 640, 1024, 1920];

    const srcset = widths
      .map(w => `${basePath}-${w}w.${extension} ${w}w`)
      .join(', ');

    const webpSrcset = widths
      .map(w => `${basePath}-${w}w.webp ${w}w`)
      .join(', ');

    const avifSrcset = widths
      .map(w => `${basePath}-${w}w.avif ${w}w`)
      .join(', ');

    return { src, srcset, webpSrcset, avifSrcset };
  };

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const imageUrls = generateImageUrls();

  // Générer Schema.org si demandé
  useEffect(() => {
    if (schema && isLoaded && width && height) {
      const metadata: ImageMetadata = {
        url: window.location.origin + src,
        alt,
        title,
        width,
        height,
        format: (src.split('.').pop() as any) || 'jpg'
      };

      const schemaData = ImageOptimizationService.generateImageSchema(metadata);

      // Injecter le schema dans le head
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schemaData);
      script.id = `image-schema-${src.replace(/[^a-z0-9]/gi, '-')}`;

      // Éviter les doublons
      const existing = document.getElementById(script.id);
      if (existing) {
        existing.remove();
      }

      document.head.appendChild(script);

      return () => {
        const el = document.getElementById(script.id);
        if (el) el.remove();
      };
    }
  }, [schema, isLoaded, src, alt, title, width, height]);

  // Déterminer le loading attribute
  const loadingAttr = loading || (priority === 'high' ? 'eager' : 'lazy');

  // Classes pour les placeholders
  const placeholderClass = !isLoaded && placeholder !== 'none' ? 'animate-pulse bg-gray-200' : '';

  // Classes pour l'object-fit
  const objectFitClass = `object-${objectFit}`;

  // Sizes par défaut si non fourni
  const defaultSizes = sizes || [
    '(max-width: 640px) 100vw',
    '(max-width: 1024px) 80vw',
    '(max-width: 1920px) 60vw',
    '50vw'
  ].join(', ');

  // Si erreur, afficher un placeholder
  if (hasError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width: width || '100%', height: height || 'auto' }}
        role="img"
        aria-label={alt}
      >
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Si pas encore dans le viewport, afficher un placeholder
  if (!isInView) {
    return (
      <div
        ref={imgRef as any}
        className={`${placeholderClass} ${className}`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          aspectRatio: width && height ? `${width}/${height}` : undefined
        }}
        role="img"
        aria-label={`Chargement: ${alt}`}
      />
    );
  }

  // Rendu avec formats modernes (picture element)
  if (modernFormats && responsive) {
    return (
      <picture>
        {/* Format AVIF (le plus optimal) */}
        <source
          type="image/avif"
          srcSet={imageUrls.avifSrcset}
          sizes={defaultSizes}
        />

        {/* Format WebP (bon support) */}
        <source
          type="image/webp"
          srcSet={imageUrls.webpSrcset}
          sizes={defaultSizes}
        />

        {/* Format original (fallback) */}
        <img
          ref={imgRef}
          src={imageUrls.src}
          srcSet={imageUrls.srcset}
          sizes={defaultSizes}
          alt={alt}
          title={title}
          width={width}
          height={height}
          loading={loadingAttr}
          className={`${className} ${objectFitClass} ${placeholderClass} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          decoding="async"
          fetchPriority={priority}
        />
      </picture>
    );
  }

  // Rendu simple sans formats modernes
  return (
    <img
      ref={imgRef}
      src={imageUrls.src}
      srcSet={responsive ? imageUrls.srcset : undefined}
      sizes={responsive ? defaultSizes : undefined}
      alt={alt}
      title={title}
      width={width}
      height={height}
      loading={loadingAttr}
      className={`${className} ${objectFitClass} ${placeholderClass} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      onLoad={handleLoad}
      onError={handleError}
      decoding="async"
      fetchPriority={priority}
    />
  );
}

/**
 * Composant pour les images hero optimisées
 *
 * @example
 * <HeroImage
 *   src="/images/hero.jpg"
 *   alt="Trouvez votre emploi en Guinée"
 * />
 */
export function HeroImage(props: Omit<OptimizedImageProps, 'priority' | 'loading' | 'schema'>) {
  return (
    <OptimizedImage
      {...props}
      priority="high"
      loading="eager"
      schema
      responsive
      modernFormats
    />
  );
}

/**
 * Composant pour les logos optimisés
 *
 * @example
 * <LogoImage
 *   src="/logo.svg"
 *   alt="JobGuinée - Plateforme emploi Guinée"
 *   width={200}
 *   height={50}
 * />
 */
export function LogoImage(props: Omit<OptimizedImageProps, 'priority' | 'loading' | 'objectFit'>) {
  return (
    <OptimizedImage
      {...props}
      priority="high"
      loading="eager"
      objectFit="contain"
      responsive={false}
      modernFormats={false}
    />
  );
}

/**
 * Composant pour les images de contenu
 *
 * @example
 * <ContentImage
 *   src="/images/article.jpg"
 *   alt="Guide recrutement Guinée"
 * />
 */
export function ContentImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority={props.priority || 'low'}
      loading={props.loading || 'lazy'}
      responsive
      modernFormats
    />
  );
}
