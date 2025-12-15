import { useEffect, useState } from 'react';
import { seoService, SEOConfig, SEOPageMeta } from '../services/seoService';
import { schemaService, SchemaData } from '../services/schemaService';

interface UseSEOOptions {
  pagePath?: string;
  customMeta?: Partial<SEOPageMeta>;
  schemas?: SchemaData[];
}

export function useSEO(options: UseSEOOptions = {}) {
  const [config, setConfig] = useState<SEOConfig | null>(null);
  const [pageMeta, setPageMeta] = useState<SEOPageMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSEO();
  }, [options.pagePath]);

  const loadSEO = async () => {
    try {
      setLoading(true);

      const [configData, pageMetaData] = await Promise.all([
        seoService.getConfig(),
        options.pagePath ? seoService.getPageMeta(options.pagePath) : Promise.resolve(null)
      ]);

      setConfig(configData);

      if (options.customMeta) {
        setPageMeta(options.customMeta as SEOPageMeta);
      } else {
        setPageMeta(pageMetaData);
      }

      const metaTags = seoService.buildMetaTags(
        options.customMeta as SEOPageMeta || pageMetaData,
        configData
      );
      seoService.updateDocumentHead(metaTags);

      if (options.schemas && options.schemas.length > 0) {
        schemaService.injectSchemas(options.schemas);
      }
    } catch (error) {
      console.error('Error loading SEO:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    config,
    pageMeta,
    loading,
    refresh: loadSEO
  };
}
