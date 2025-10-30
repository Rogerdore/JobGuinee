import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import Formations from './pages/Formations';
import Blog from './pages/Blog';

type Page = 'home' | 'login' | 'signup' | 'jobs' | 'job-detail' | 'candidate-dashboard' | 'recruiter-dashboard' | 'formations' | 'blog' | 'cvtheque';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobSearchParams, setJobSearchParams] = useState<string>('');
  const { loading } = useAuth();

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page as Page);
    if (page === 'job-detail' && param) {
      setSelectedJobId(param);
    }
    if (page === 'jobs' && param) {
      setJobSearchParams(param);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600 text-lg">Chargement...</p>
        </div>
      </div>
    );
  }

  if (currentPage === 'login' || currentPage === 'signup') {
    return <Auth mode={currentPage} onNavigate={handleNavigate} />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'jobs' && <Jobs onNavigate={handleNavigate} initialSearch={jobSearchParams} />}
      {currentPage === 'job-detail' && <JobDetail jobId={selectedJobId} onNavigate={handleNavigate} />}
      {currentPage === 'candidate-dashboard' && <CandidateDashboard onNavigate={handleNavigate} />}
      {currentPage === 'recruiter-dashboard' && <RecruiterDashboard onNavigate={handleNavigate} />}
      {currentPage === 'formations' && <Formations onNavigate={handleNavigate} />}
      {currentPage === 'blog' && <Blog />}
      {currentPage === 'cvtheque' && (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">CVthèque</h2>
            <p className="text-gray-600 mb-8 max-w-md">
              Accédez à notre base de données de candidats qualifiés. Fonctionnalité réservée aux recruteurs avec abonnement actif.
            </p>
            <p className="text-sm text-gray-500">Fonctionnalité en cours de développement</p>
          </div>
        </div>
      )}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
