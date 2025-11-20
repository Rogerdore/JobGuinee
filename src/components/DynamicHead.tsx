import { useEffect } from 'react';
import { useCMS } from '../contexts/CMSContext';

interface DynamicHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
  canonical?: string;
}

export default function DynamicHead({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  ogType = 'website',
  canonical
}: DynamicHeadProps = {}) {
  const { settings } = useCMS();

  useEffect(() => {
    const pageTitle = title || settings.site_name || 'Emploi Guinée - Plateforme d\'Emploi en Guinée';
    document.title = pageTitle;

    updateMetaTag('description', description || settings.site_description || 'Trouvez votre prochain emploi en Guinée. Plateforme leader de recrutement avec des milliers d\'offres d\'emploi actualisées quotidiennement.');

    if (keywords) {
      updateMetaTag('keywords', keywords);
    }

    updateMetaTag('og:title', ogTitle || pageTitle, 'property');
    updateMetaTag('og:description', ogDescription || description || settings.site_description || 'Trouvez votre prochain emploi en Guinée', 'property');
    updateMetaTag('og:type', ogType, 'property');
    updateMetaTag('og:site_name', settings.site_name || 'Emploi Guinée', 'property');

    if (ogImage) {
      updateMetaTag('og:image', ogImage, 'property');
      updateMetaTag('og:image:width', '1200', 'property');
      updateMetaTag('og:image:height', '630', 'property');
    }

    if (ogUrl) {
      updateMetaTag('og:url', ogUrl, 'property');
    }

    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', ogTitle || pageTitle);
    updateMetaTag('twitter:description', ogDescription || description || settings.site_description || '');
    if (ogImage) {
      updateMetaTag('twitter:image', ogImage);
    }

    updateMetaTag('robots', 'index, follow');
    updateMetaTag('googlebot', 'index, follow');

    if (canonical) {
      updateLinkTag('canonical', canonical);
    }
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogUrl, ogType, canonical, settings]);

  useEffect(() => {
    if (settings.site_favicon) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = settings.site_favicon;
    }
  }, [settings.site_favicon]);

  return null;
}

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  if (!content) return;

  let meta = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function updateLinkTag(rel: string, href: string) {
  if (!href) return;

  let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }
  link.href = href;
}
