import { useEffect } from 'react';
import { Job, Company } from '../lib/supabase';
import { updateSocialMetaTags, generateJobShareMeta } from '../utils/socialShareMeta';

/**
 * Hook to update social media meta tags for job detail pages
 * This ensures proper preview when sharing job links on Facebook, LinkedIn, etc.
 */
export const useJobMetaTags = (job: (Job & { companies?: Company }) | null) => {
  useEffect(() => {
    if (job) {
      const meta = generateJobShareMeta({
        id: job.id,
        title: job.title,
        description: job.description || undefined,
        location: job.location || undefined,
        contract_type: job.contract_type || undefined,
        companies: job.companies ? {
          name: job.companies.name,
          logo_url: job.companies.logo_url || undefined
        } : undefined
      });

      updateSocialMetaTags(meta);
    }

    // Cleanup function to restore default meta tags when leaving the page
    return () => {
      updateSocialMetaTags({
        title: 'JobGuinée - Plateforme N°1 de l\'emploi en Guinée',
        description: 'La première plateforme guinéenne de recrutement digital connectant talents et opportunités. Trouvez votre emploi idéal ou recrutez les meilleurs profils.',
        image: '/assets/hero/image_hero.gif',
        url: window.location.origin,
        type: 'website',
      });
    };
  }, [job]);
};

/**
 * Hook to update meta tags for the homepage
 */
export const useHomeMetaTags = () => {
  useEffect(() => {
    updateSocialMetaTags({
      title: 'JobGuinée - Simplifiez votre recrutement, trouvez votre emploi',
      description: 'La première plateforme guinéenne de recrutement digital. Plus de 1250 candidats inscrits, 15+ entreprises partenaires. Matching IA, CVthèque, formations professionnelles.',
      image: '/assets/hero/image_hero.gif',
      url: window.location.origin,
      type: 'website',
    });
  }, []);
};
