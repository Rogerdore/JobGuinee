import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CMSProvider } from './contexts/CMSContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import Formations from './pages/Formations';
import Blog from './pages/Blog';
import CVTheque from './pages/CVTheque';
import CMSAdmin from './pages/CMSAdmin';
import UserManagement from './pages/UserManagement';
import CandidateProfileForm from './components/forms/CandidateProfileForm';
import PremiumAIServices from './pages/PremiumAIServices';
import AIMatchingService from './components/ai/AIMatchingService';
import AICVGenerator from './components/ai/AICVGenerator';
import AICoachChat from './components/ai/AICoachChat';
import GoldProfileService from './components/ai/GoldProfileService';

type Page = 'home' | 'login' | 'signup' | 'jobs' | 'job-detail' | 'candidate-dashboard' | 'recruiter-dashboard' | 'formations' | 'blog' | 'cvtheque' | 'cms-admin' | 'user-management' | 'candidate-profile-form' | 'premium-ai' | 'ai-matching' | 'ai-cv-generator' | 'ai-coach' | 'gold-profile';

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
      {currentPage === 'cvtheque' && <CVTheque onNavigate={handleNavigate} />}
      {currentPage === 'cms-admin' && <CMSAdmin onNavigate={handleNavigate} />}
      {currentPage === 'user-management' && <UserManagement onNavigate={handleNavigate} />}
      {currentPage === 'candidate-profile-form' && <CandidateProfileForm />}
      {currentPage === 'premium-ai' && <PremiumAIServices onNavigate={handleNavigate} />}
      {currentPage === 'ai-matching' && <AIMatchingService />}
      {currentPage === 'ai-cv-generator' && <AICVGenerator />}
      {currentPage === 'ai-coach' && <AICoachChat />}
      {currentPage === 'gold-profile' && <GoldProfileService />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CMSProvider>
          <AppContent />
        </CMSProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
