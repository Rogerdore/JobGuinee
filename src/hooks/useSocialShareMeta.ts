import { useEffect } from 'react';
import { SocialShareMetadata } from '../services/socialShareService';

export function useSocialShareMeta(metadata: SocialShareMetadata) {
  useEffect(() => {
    const metaTags: Array<{ property?: string; name?: string; content: string }> = [
      { property: 'og:type', content: metadata.type },
      { property: 'og:site_name', content: metadata.siteName },
      { property: 'og:title', content: metadata.title },
      { property: 'og:description', content: metadata.description },
      { property: 'og:image', content: metadata.image },
      { property: 'og:url', content: metadata.url },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:locale', content: 'fr_FR' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: metadata.title },
      { name: 'twitter:description', content: metadata.description },
      { name: 'twitter:image', content: metadata.image },
      { name: 'twitter:site', content: '@JobGuinee' },
      { name: 'description', content: metadata.description }
    ];

    const existingTags: HTMLMetaElement[] = [];

    metaTags.forEach(({ property, name, content }) => {
      let metaElement: HTMLMetaElement | null = null;

      if (property) {
        metaElement = document.querySelector(`meta[property="${property}"]`);
        if (!metaElement) {
          metaElement = document.createElement('meta');
          metaElement.setAttribute('property', property);
          document.head.appendChild(metaElement);
        }
      } else if (name) {
        metaElement = document.querySelector(`meta[name="${name}"]`);
        if (!metaElement) {
          metaElement = document.createElement('meta');
          metaElement.setAttribute('name', name);
          document.head.appendChild(metaElement);
        }
      }

      if (metaElement) {
        metaElement.setAttribute('content', content);
        existingTags.push(metaElement);
      }
    });

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', metadata.url);
    existingTags.push(canonicalLink as any);

    const titleElement = document.querySelector('title');
    const originalTitle = titleElement?.textContent || '';
    if (titleElement) {
      titleElement.textContent = metadata.title;
    }

    return () => {
      if (titleElement && originalTitle) {
        titleElement.textContent = originalTitle;
      }
    };
  }, [metadata]);
}
