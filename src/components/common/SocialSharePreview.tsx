import React, { useState, useEffect } from 'react';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { SocialShareMetadata, socialShareService } from '../../services/socialShareService';

interface SocialSharePreviewProps {
  metadata: SocialShareMetadata;
  platform?: 'facebook' | 'linkedin' | 'twitter' | 'generic';
  className?: string;
}

export default function SocialSharePreview({
  metadata,
  platform = 'generic',
  className = ''
}: SocialSharePreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImage, setCurrentImage] = useState(metadata.image);
  const [fallbackAttempts, setFallbackAttempts] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
    setCurrentImage(metadata.image);
    setFallbackAttempts(0);
  }, [metadata.image]);

  const tryNextFallback = () => {
    const baseUrl = import.meta.env.VITE_APP_URL || 'https://jobguinee-pro.com';

    if (fallbackAttempts === 0) {
      // Premier fallback : image par défaut d'offre
      setCurrentImage(`${baseUrl}/assets/share/default-job.svg`);
      setFallbackAttempts(1);
    } else if (fallbackAttempts === 1) {
      // Deuxième fallback : logo JobGuinée
      setCurrentImage(`${baseUrl}/logo_jobguinee.svg`);
      setFallbackAttempts(2);
    } else {
      // Dernier recours : afficher une erreur
      setImageError(true);
    }
  };

  const displayImage = currentImage;

  const platformStyles = {
    facebook: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      titleColor: 'text-blue-900',
      urlColor: 'text-blue-600'
    },
    linkedin: {
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
      titleColor: 'text-sky-900',
      urlColor: 'text-sky-600'
    },
    twitter: {
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      titleColor: 'text-slate-900',
      urlColor: 'text-slate-600'
    },
    generic: {
      bgColor: 'bg-white',
      borderColor: 'border-slate-200',
      titleColor: 'text-slate-900',
      urlColor: 'text-slate-600'
    }
  };

  const styles = platformStyles[platform];

  return (
    <div className={`${className}`}>
      <div className={`${styles.bgColor} ${styles.borderColor} border-2 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
        <div className="relative aspect-[1.91/1] bg-slate-100">
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0E2F56]"></div>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p className="text-sm text-center">Image de partage non disponible</p>
              <p className="text-xs text-center mt-1">Impossible de charger l'image</p>
            </div>
          )}

          {!imageError && (
            <img
              src={displayImage}
              alt={metadata.title}
              className={`w-full h-full object-contain ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                if (fallbackAttempts < 2) {
                  tryNextFallback();
                } else {
                  setImageError(true);
                }
              }}
            />
          )}

          {imageLoaded && fallbackAttempts > 0 && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Fallback
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <ExternalLink className={`w-4 h-4 ${styles.urlColor} flex-shrink-0 mt-1`} />
            <div className="flex-1 min-w-0">
              <p className={`text-xs ${styles.urlColor} uppercase tracking-wide mb-1 truncate`}>
                {metadata.siteName}
              </p>
              <h3 className={`${styles.titleColor} font-semibold text-base leading-tight mb-2 line-clamp-2`}>
                {metadata.title}
              </h3>
              <p className="text-slate-600 text-sm leading-snug line-clamp-3">
                {metadata.description}
              </p>
            </div>
          </div>

          <p className={`text-xs ${styles.urlColor} mt-3 truncate`}>
            {metadata.url}
          </p>
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Aperçu similaire à ce que verront les utilisateurs sur {platform === 'generic' ? 'les réseaux sociaux' : platform}
      </div>
    </div>
  );
}
