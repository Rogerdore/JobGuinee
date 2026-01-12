import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { socialShareService } from '../services/socialShareService';
import { jobClickTrackingService } from '../services/jobClickTrackingService';

/**
 * Page de redirection pour les partages sociaux
 * Route: /s/{job_id}?src={network}
 *
 * Cette page:
 * 1. Récupère l'offre d'emploi
 * 2. Enregistre le partage s'il y a un utilisateur authentifié
 * 3. Enregistre le clic
 * 4. Met à jour les métadonnées OG
 * 5. Redirige vers /offres/{job.slug}?src={network}
 */
export default function ShareRedirect({ jobId, onNavigate }: { jobId: string; onNavigate: (page: string, param?: any) => void }) {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const srcNetwork = searchParams.get('src') || 'direct';
        const validNetworks = ['facebook', 'linkedin', 'twitter', 'whatsapp', 'instagram', 'telegram'];
        const network = (validNetworks.includes(srcNetwork) ? srcNetwork : 'direct') as any;

        // 1. Récupérer l'offre d'emploi
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('*, companies(name, logo_url)')
          .eq('id', jobId)
          .maybeSingle();

        if (jobError || !job) {
          setError('Offre d\'emploi non trouvée');
          return;
        }

        // 2. Enregistrer le partage (track que quelqu'un a cliqué depuis un lien partagé)
        await socialShareService.trackShare(jobId, network);

        // 3. Enregistrer le clic
        await jobClickTrackingService.trackJobClick({
          jobId,
          sourceNetwork: network
        });

        // 4. Mettre à jour les métadonnées OG dynamiquement
        const metadata = socialShareService.generateJobMetadata(job);
        updateMetaTags(metadata);

        // 5. Rediriger vers la page de détail de l'offre avec le paramètre source
        const jobSlug = job.slug || job.id;
        const redirectUrl = `/offres/${jobSlug}?src=${network}`;

        // Utiliser window.location pour une redirection vraie
        window.location.href = redirectUrl;
      } catch (err) {
        console.error('Error in share redirect:', err);
        setError('Erreur lors de la redirection');
      } finally {
        setLoading(false);
      }
    };

    handleRedirect();
  }, [jobId, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
        {loading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900 mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirection en cours...</h2>
            <p className="text-gray-600">Veuillez patienter pendant que nous chargeons l'offre d'emploi.</p>
          </>
        ) : error ? (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-red-600 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-900 text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition"
            >
              Retour à l'accueil
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Met à jour les métadonnées OG de la page
 */
function updateMetaTags(metadata: any) {
  // Mettre à jour le titre
  document.title = metadata.title;

  // Mettre à jour ou créer les métadonnées OG
  const ogTags = [
    { property: 'og:title', content: metadata.title },
    { property: 'og:description', content: metadata.description },
    { property: 'og:image', content: metadata.image },
    { property: 'og:url', content: metadata.url },
    { property: 'og:type', content: 'website' },
    { name: 'description', content: metadata.description },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: metadata.title },
    { name: 'twitter:description', content: metadata.description },
    { name: 'twitter:image', content: metadata.image }
  ];

  ogTags.forEach(tag => {
    let element = document.querySelector(`meta[property="${tag.property}"]`) ||
                  document.querySelector(`meta[name="${tag.name}"]`);

    if (!element) {
      element = document.createElement('meta');
      if (tag.property) {
        element.setAttribute('property', tag.property);
      } else if (tag.name) {
        element.setAttribute('name', tag.name);
      }
      document.head.appendChild(element);
    }

    element.setAttribute('content', tag.content);
  });
}
