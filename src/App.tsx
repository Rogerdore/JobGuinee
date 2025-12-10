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
import CVTheque from './pages/CVTheque';
import CMSAdmin from './pages/CMSAdmin';
import UserManagement from './pages/UserManagement';
import AdminCreditsIA from './pages/AdminCreditsIA';
import AdminIAPricing from './pages/AdminIAPricing';
import CandidateProfileForm from './components/forms/CandidateProfileForm';
import PremiumAIServices from './pages/PremiumAIServices';
import AIMatchingService from './components/ai/AIMatchingService';
import AICVGenerator from './components/ai/EnhancedAICVGenerator';
import AICoachChat from './components/ai/AICoachChat';
import GoldProfileService from './components/ai/GoldProfileService';
import AICoverLetterGenerator from './components/ai/AICoverLetterGenerator';
import AICareerPlanGenerator from './components/ai/AICareerPlanGenerator';
import AIInterviewSimulator from './components/ai/AIInterviewSimulator';
import AIAlertsCenter from './components/ai/AIAlertsCenter';
import AIChat from './components/ai/AIChat';
import CreditStore from './pages/CreditStore';
import AdminIAConfig from './pages/AdminIAConfig';
import AdminIATemplates from './pages/AdminIATemplates';
import AdminChatbot from './pages/AdminChatbot';
import AdminIACenter from './pages/AdminIACenter';
import AdminCreditStoreSettings from './pages/AdminCreditStoreSettings';
import AdminCreditPurchases from './pages/AdminCreditPurchases';
import AdminSecurityLogs from './pages/AdminSecurityLogs';

type Page = 'home' | 'login' | 'signup' | 'jobs' | 'job-detail' | 'candidate-dashboard' | 'recruiter-dashboard' | 'trainer-dashboard' | 'formations' | 'blog' | 'cvtheque' | 'cms-admin' | 'user-management' | 'admin-credits-ia' | 'admin-ia-pricing' | 'admin-ia-config' | 'admin-ia-templates' | 'admin-chatbot' | 'admin-ia-center' | 'admin-credit-store-settings' | 'admin-credit-purchases' | 'admin-security-logs' | 'candidate-profile-form' | 'premium-ai' | 'ai-matching' | 'ai-cv-generator' | 'ai-cover-letter' | 'ai-career-plan' | 'ai-coach' | 'ai-interview-simulator' | 'ai-alerts' | 'ai-chat' | 'gold-profile' | 'credit-store';

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
      {currentPage === 'trainer-dashboard' && <TrainerDashboard onNavigate={handleNavigate} />}
      {currentPage === 'formations' && <Formations onNavigate={handleNavigate} />}
      {currentPage === 'blog' && <Blog />}
      {currentPage === 'cvtheque' && <CVTheque onNavigate={handleNavigate} />}
      {currentPage === 'cms-admin' && <CMSAdmin onNavigate={handleNavigate} />}
      {currentPage === 'user-management' && <UserManagement onNavigate={handleNavigate} />}
      {currentPage === 'admin-credits-ia' && <AdminCreditsIA onNavigate={handleNavigate} />}
      {currentPage === 'admin-ia-pricing' && <AdminIAPricing />}
      {currentPage === 'admin-ia-config' && <AdminIAConfig />}
      {currentPage === 'admin-ia-templates' && <AdminIATemplates />}
      {currentPage === 'admin-chatbot' && <AdminChatbot />}
      {currentPage === 'admin-ia-center' && <AdminIACenter />}
      {currentPage === 'admin-credit-store-settings' && <AdminCreditStoreSettings />}
      {currentPage === 'admin-credit-purchases' && <AdminCreditPurchases />}
      {currentPage === 'admin-security-logs' && <AdminSecurityLogs />}
      {currentPage === 'candidate-profile-form' && <CandidateProfileForm />}
      {currentPage === 'premium-ai' && <PremiumAIServices onNavigate={handleNavigate} />}
      {currentPage === 'ai-matching' && <AIMatchingService onNavigate={handleNavigate} />}
      {currentPage === 'ai-cv-generator' && <AICVGenerator onNavigate={handleNavigate} />}
      {currentPage === 'ai-cover-letter' && <AICoverLetterGenerator onNavigate={handleNavigate} />}
      {currentPage === 'ai-career-plan' && <AICareerPlanGenerator onNavigate={handleNavigate} />}
      {currentPage === 'ai-coach' && <AICoachChat onNavigate={handleNavigate} />}
      {currentPage === 'ai-interview-simulator' && <AIInterviewSimulator onNavigate={handleNavigate} />}
      {currentPage === 'ai-alerts' && <AIAlertsCenter onNavigate={handleNavigate} />}
      {currentPage === 'ai-chat' && <AIChat onNavigate={handleNavigate} />}
      {currentPage === 'gold-profile' && <GoldProfileService onNavigate={handleNavigate} />}
      {currentPage === 'credit-store' && <CreditStore />}
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
