import { useEffect, useState } from 'react';
import { siteSettingsService } from '../services/siteSettingsService';

export function useFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string>('/favicon.png');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavicon();
  }, []);

  const loadFavicon = async () => {
    try {
      const url = await siteSettingsService.getSetting('favicon_url');
      if (url) {
        setFaviconUrl(url);
        updateFaviconInDOM(url);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du favicon:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFaviconInDOM = (url: string) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = url;

    const appleTouchIcon = document.querySelector("link[rel~='apple-touch-icon']") as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = url;
    }
  };

  return { faviconUrl, loading };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const brandingData = await siteSettingsService.getBrandingSettings();
      setSettings(brandingData);

      if (brandingData.favicon_url) {
        updateFaviconInDOM(brandingData.favicon_url);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFaviconInDOM = (url: string) => {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }

    link.href = url;

    const links = [
      { rel: 'icon', size: '16x16' },
      { rel: 'icon', size: '32x32' },
      { rel: 'apple-touch-icon', size: '180x180' }
    ];

    links.forEach(({ rel, size }) => {
      let linkElement = document.querySelector(`link[rel~='${rel}'][sizes='${size}']`) as HTMLLinkElement;

      if (!linkElement && rel === 'apple-touch-icon') {
        linkElement = document.querySelector(`link[rel~='${rel}']`) as HTMLLinkElement;
      }

      if (linkElement) {
        linkElement.href = url;
      }
    });
  };

  return { settings, loading };
}
