import { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { socialShareService } from './services/socialShareService';
import { jobClickTrackingService } from './services/jobClickTrackingService';
import App from './App';

function ShareRedirect() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async () => {
      if (!jobId) {
        navigate('/');
        return;
      }

      try {
        const srcNetwork = searchParams.get('src') || 'direct';
        const validNetworks = ['facebook', 'linkedin', 'twitter', 'whatsapp', 'instagram', 'telegram'];
        const network = (validNetworks.includes(srcNetwork) ? srcNetwork : 'direct') as any;

        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('*, companies(name, logo_url)')
          .eq('id', jobId)
          .maybeSingle();

        if (jobError || !job) {
          navigate('/');
          return;
        }

        await socialShareService.trackShare(jobId, network);
        await jobClickTrackingService.trackJobClick({
          jobId,
          sourceNetwork: network
        });

        const jobSlug = job.slug || job.id;
        navigate(`/?page=job-detail&id=${jobSlug}&src=${network}`, { replace: true });
      } catch (err) {
        console.error('Error in share redirect:', err);
        navigate('/');
      }
    };

    handleRedirect();
  }, [jobId, searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Redirection en cours...</h2>
        <p className="text-gray-600">Veuillez patienter pendant que nous chargeons l'offre d'emploi.</p>
      </div>
    </div>
  );
}

function JobDetailRedirect() {
  const { jobId } = useParams<{ jobId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (jobId) {
      const src = searchParams.get('src') || '';
      navigate(`/?page=job-detail&id=${jobId}${src ? `&src=${src}` : ''}`, { replace: true });
    } else {
      navigate('/');
    }
  }, [jobId, searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900"></div>
    </div>
  );
}

function PublicProfileRedirect() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      navigate(`/?page=public-profile&token=${token}`, { replace: true });
    } else {
      navigate('/');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900"></div>
    </div>
  );
}

function ExternalApplicationRedirect() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (applicationId) {
      navigate(`/?page=external-application&id=${applicationId}`, { replace: true });
    } else {
      navigate('/');
    }
  }, [applicationId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900"></div>
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900"></div>
          </div>
        }
      >
        <Routes>
          <Route path="/share/:jobId" element={<ShareRedirect />} />
          <Route path="/s/:jobId" element={<ShareRedirect />} />
          <Route path="/jobs/:jobId" element={<JobDetailRedirect />} />
          <Route path="/job/:jobId" element={<JobDetailRedirect />} />
          <Route path="/offres/:jobId" element={<JobDetailRedirect />} />
          <Route path="/profile/:token" element={<PublicProfileRedirect />} />
          <Route path="/public/:token" element={<PublicProfileRedirect />} />
          <Route path="/candidatures/:applicationId" element={<ExternalApplicationRedirect />} />
          <Route path="/external/:applicationId" element={<ExternalApplicationRedirect />} />
          <Route path="*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
