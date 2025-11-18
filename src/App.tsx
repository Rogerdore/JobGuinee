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
import TrainerDashboard from './pages/TrainerDashboard';
import Formations from './pages/Formations';
import Blog from './pages/Blog';
import Resources from './pages/Resources';
import CVTheque from './pages/CVTheque';
import CMSAdmin from './pages/CMSAdmin';
import UserManagement from './pages/UserManagement';
import CandidateProfileForm from './components/forms/CandidateProfileForm';
import PremiumAIServices from './pages/PremiumAIServices';
import AIMatchingService from './components/ai/AIMatchingService';
import AICVGenerator from './components/ai/AICVGenerator';
import AICoachChat from './components/ai/AICoachChat';
import GoldProfileService from './components/ai/GoldProfileService';
import ChatBotAdmin from './pages/ChatBotAdmin';
import SocialMediaConfiguration from './pages/SocialMediaConfiguration';
import AdminProfiles from './pages/AdminProfiles';
import AdminJobs from './pages/AdminJobs';
import JobFormattingAdmin from './pages/JobFormattingAdmin';
import JobFormConfiguration from './pages/JobFormConfiguration';

type Page = 'home' | 'login' | 'signup' | 'signup-candidate' | 'signup-recruiter' | 'jobs' | 'job-detail' | 'candidate-dashboard' | 'recruiter-dashboard' | 'trainer-dashboard' | 'formations' | 'blog' | 'resources' | 'cvtheque' | 'cms-admin' | 'user-management' | 'candidate-profile-form' | 'premium-ai' | 'ai-matching' | 'ai-cv-generator' | 'ai-coach' | 'gold-profile' | 'chatbot-admin' | 'social-config' | 'admin-profiles' | 'admin-jobs' | 'job-formatting' | 'job-form-config';

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

  if (currentPage === 'login' || currentPage === 'signup' || currentPage === 'signup-candidate' || currentPage === 'signup-recruiter') {
    const mode = currentPage === 'login' ? 'login' : 'signup';
    const defaultRole = currentPage === 'signup-recruiter' ? 'recruiter' : 'candidate';
    return <Auth mode={mode} onNavigate={handleNavigate} defaultRole={defaultRole} />;
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'jobs' && <Jobs onNavigate={handleNavigate} initialSearch={jobSearchParams} />}
      {currentPage === 'job-detail' && <JobDetail jobId={selectedJobId} onNavigate={handleNavigate} />}
      {currentPage === 'candidate-dashboard' && <CandidateDashboard onNavigate={handleNavigate} />}
      {currentPage === 'recruiter-dashboard' && <RecruiterDashboard onNavigate={handleNavigate} />}
      {currentPage === 'trainer-dashboard' && <TrainerDashboard onNavigate={handleNavigate} />}
      {currentPage === 'formations' && <Formations onNavigate={handleNavigate} />}
      {currentPage === 'blog' && <Blog />}
      {currentPage === 'resources' && <Resources />}
      {currentPage === 'cvtheque' && <CVTheque onNavigate={handleNavigate} />}
      {currentPage === 'cms-admin' && <CMSAdmin onNavigate={handleNavigate} />}
      {currentPage === 'user-management' && <UserManagement onNavigate={handleNavigate} />}
      {currentPage === 'candidate-profile-form' && <CandidateProfileForm onNavigate={handleNavigate} />}
      {currentPage === 'premium-ai' && <PremiumAIServices onNavigate={handleNavigate} onBack={() => handleNavigate('candidate-dashboard')} />}
      {currentPage === 'ai-matching' && <AIMatchingService onNavigate={handleNavigate} />}
      {currentPage === 'ai-cv-generator' && <AICVGenerator onNavigate={handleNavigate} />}
      {currentPage === 'ai-coach' && <AICoachChat onNavigate={handleNavigate} />}
      {currentPage === 'gold-profile' && <GoldProfileService onNavigate={handleNavigate} />}
      {currentPage === 'chatbot-admin' && <ChatBotAdmin />}
      {currentPage === 'social-config' && <SocialMediaConfiguration />}
      {currentPage === 'admin-profiles' && <AdminProfiles onNavigate={handleNavigate} />}
      {currentPage === 'admin-jobs' && <AdminJobs onNavigate={handleNavigate} />}
      {currentPage === 'job-formatting' && <JobFormattingAdmin />}
      {currentPage === 'job-form-config' && <JobFormConfiguration />}
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
