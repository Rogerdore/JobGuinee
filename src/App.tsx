import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CMSProvider } from './contexts/CMSContext';
import Layout from './components/Layout';
import DynamicHead from './components/DynamicHead';
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
import AICoverLetterGenerator from './components/ai/AICoverLetterGenerator';
import AICoachChat from './components/ai/AICoachChat';
import GoldProfileService from './components/ai/GoldProfileService';
import ChatBotAdmin from './pages/ChatBotAdmin';
import SocialMediaConfiguration from './pages/SocialMediaConfiguration';
import AdminProfiles from './pages/AdminProfiles';
import AdminJobs from './pages/AdminJobs';
import JobFormattingAdmin from './pages/JobFormattingAdmin';
import JobFormConfiguration from './pages/JobFormConfiguration';
import SystemSettings from './pages/SystemSettings';
import JobPricingAdmin from './pages/JobPricingAdmin';
import PremiumServicesAdmin from './pages/PremiumServicesAdmin';
import PaymentManagement from './pages/PaymentManagement';
import UserServicesManagement from './pages/UserServicesManagement';
import GlobalCreditsManagement from './pages/GlobalCreditsManagement';

type Page = 'home' | 'login' | 'signup' | 'signup-candidate' | 'signup-recruiter' | 'jobs' | 'job-detail' | 'candidate-dashboard' | 'recruiter-dashboard' | 'trainer-dashboard' | 'formations' | 'blog' | 'resources' | 'cvtheque' | 'cms-admin' | 'user-management' | 'candidate-profile-form' | 'premium-ai' | 'ai-matching' | 'ai-cv-generator' | 'ai-cover-letter' | 'ai-coach' | 'gold-profile' | 'chatbot-admin' | 'social-config' | 'admin-profiles' | 'admin-jobs' | 'job-formatting' | 'job-form-config' | 'system-settings' | 'job-pricing' | 'premium-services-admin' | 'payment-management' | 'user-services' | 'global-credits';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobSearchParams, setJobSearchParams] = useState<string>('');
  const [selectedJobForCV, setSelectedJobForCV] = useState<any>(null);
  const [selectedJobForMatching, setSelectedJobForMatching] = useState<any>(null);
  const [selectedJobForCoverLetter, setSelectedJobForCoverLetter] = useState<any>(null);
  const [returnToCV, setReturnToCV] = useState(false);
  const [returnToMatching, setReturnToMatching] = useState(false);
  const [returnToCoverLetter, setReturnToCoverLetter] = useState(false);
  const { loading } = useAuth();

  const handleNavigate = (page: string, param?: string) => {
    console.log('🧭 Navigation requested:', { page, param });
    setCurrentPage(page as Page);
    if (page === 'job-detail' && param) {
      console.log('📌 Setting selectedJobId to:', param);
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
    <>
      <DynamicHead />
      <Layout currentPage={currentPage} onNavigate={handleNavigate}>
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'jobs' && (
        <Jobs
          onNavigate={handleNavigate}
          initialSearch={jobSearchParams}
          selectMode={returnToCV || returnToMatching || returnToCoverLetter}
          onSelectJob={(job) => {
            const jobWithCompanyName = {
              ...job,
              company_name: job.companies?.name || job.company_name || 'Entreprise non spécifiée'
            };

            if (returnToCV) {
              setSelectedJobForCV(jobWithCompanyName);
              setReturnToCV(false);
              handleNavigate('ai-cv-generator');
            } else if (returnToMatching) {
              setSelectedJobForMatching(jobWithCompanyName);
              setReturnToMatching(false);
              handleNavigate('ai-matching');
            } else if (returnToCoverLetter) {
              setSelectedJobForCoverLetter(jobWithCompanyName);
              setReturnToCoverLetter(false);
              handleNavigate('ai-cover-letter');
            }
          }}
        />
      )}
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
      {currentPage === 'ai-matching' && (
        <AIMatchingService
          onNavigate={handleNavigate}
          onNavigateToJobs={() => {
            setSelectedJobForMatching(null);
            setReturnToMatching(true);
            handleNavigate('jobs');
          }}
          preSelectedJob={selectedJobForMatching}
          onBack={() => {
            setSelectedJobForMatching(null);
            setReturnToMatching(false);
            handleNavigate('premium-ai');
          }}
        />
      )}
      {currentPage === 'ai-cv-generator' && (
        <AICVGenerator
          onNavigate={handleNavigate}
          onNavigateToJobs={() => {
            setSelectedJobForCV(null);
            setReturnToCV(true);
            handleNavigate('jobs');
          }}
          preSelectedJob={selectedJobForCV}
          onBack={() => {
            setSelectedJobForCV(null);
            setReturnToCV(false);
            handleNavigate('premium-ai');
          }}
        />
      )}
      {currentPage === 'ai-cover-letter' && (
        <AICoverLetterGenerator
          preSelectedJob={selectedJobForCoverLetter}
          onNavigate={(page) => {
            if (page === 'jobs') {
              setReturnToCoverLetter(true);
              handleNavigate('jobs');
            } else {
              handleNavigate(page);
            }
          }}
          onBack={() => {
            setSelectedJobForCoverLetter(null);
            setReturnToCoverLetter(false);
            handleNavigate('premium-ai');
          }}
        />
      )}
      {currentPage === 'ai-coach' && <AICoachChat onNavigate={handleNavigate} />}
      {currentPage === 'gold-profile' && <GoldProfileService onNavigate={handleNavigate} />}
      {currentPage === 'chatbot-admin' && <ChatBotAdmin onNavigate={handleNavigate} />}
      {currentPage === 'social-config' && <SocialMediaConfiguration onNavigate={handleNavigate} />}
      {currentPage === 'admin-profiles' && <AdminProfiles onNavigate={handleNavigate} />}
      {currentPage === 'admin-jobs' && <AdminJobs onNavigate={handleNavigate} />}
      {currentPage === 'job-formatting' && <JobFormattingAdmin onNavigate={handleNavigate} />}
      {currentPage === 'job-form-config' && <JobFormConfiguration onNavigate={handleNavigate} />}
      {currentPage === 'system-settings' && <SystemSettings />}
      {currentPage === 'job-pricing' && <JobPricingAdmin onNavigate={handleNavigate} />}
      {currentPage === 'premium-services-admin' && <PremiumServicesAdmin onNavigate={handleNavigate} />}
      {currentPage === 'payment-management' && <PaymentManagement onNavigate={handleNavigate} />}
      {currentPage === 'user-services' && <UserServicesManagement onNavigate={handleNavigate} />}
      {currentPage === 'global-credits' && <GlobalCreditsManagement />}
      </Layout>
    </>
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
