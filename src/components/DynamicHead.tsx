import { useEffect } from 'react';
import { useCMS } from '../contexts/CMSContext';

export default function DynamicHead() {
  const { settings } = useCMS();

  useEffect(() => {
    if (settings.site_name) {
      document.title = settings.site_name;
    }
  }, [settings.site_name]);

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
