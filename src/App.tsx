import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CMSProvider } from './contexts/CMSContext';
import { ToastProvider } from './components/notifications/ToastContainer';
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
import AdminHomepageContent from './pages/AdminHomepageContent';
import AdminCreditStoreSettings from './pages/AdminCreditStoreSettings';
import AdminCreditPurchases from './pages/AdminCreditPurchases';
import AdminSecurityLogs from './pages/AdminSecurityLogs';
import PremiumSubscribe from './pages/PremiumSubscribe';
import AdminPremiumSubscriptions from './pages/AdminPremiumSubscriptions';
import AdminIAPremiumQuota from './pages/AdminIAPremiumQuota';
import AdminProfilePurchases from './pages/AdminProfilePurchases';
import AdminCreditPackages from './pages/AdminCreditPackages';

type Page = 'home' | 'login' | 'signup' | 'jobs' | 'job-detail' | 'candidate-dashboard' | 'recruiter-dashboard' | 'trainer-dashboard' | 'formations' | 'blog' | 'cvtheque' | 'cms-admin' | 'user-management' | 'admin-credits-ia' | 'admin-ia-pricing' | 'admin-ia-config' | 'admin-ia-templates' | 'admin-chatbot' | 'admin-ia-center' | 'admin-credit-store-settings' | 'admin-credit-purchases' | 'admin-credit-packages' | 'admin-security-logs' | 'admin-premium-subscriptions' | 'admin-ia-premium-quota' | 'admin-profile-purchases' | 'admin-homepage-content' | 'candidate-profile-form' | 'premium-ai' | 'premium-subscribe' | 'ai-matching' | 'ai-cv-generator' | 'ai-cover-letter' | 'ai-career-plan' | 'ai-coach' | 'ai-interview-simulator' | 'ai-alerts' | 'ai-chat' | 'gold-profile' | 'credit-store';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobSearchParams, setJobSearchParams] = useState<string>('');
  const [formationSearchParams, setFormationSearchParams] = useState<string>('');
  const [scrollTarget, setScrollTarget] = useState<string>('');
  const { loading } = useAuth();

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page as Page);
    if (page === 'job-detail' && param) {
      setSelectedJobId(param);
    }
    if (page === 'jobs') {
      setJobSearchParams(param || '');
    }
    if (page === 'formations') {
      setFormationSearchParams(param || '');
    }
    if ((page === 'credit-store' || page === 'premium-ai') && param) {
      setScrollTarget(param);
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
      {currentPage === 'formations' && <Formations onNavigate={handleNavigate} searchParams={formationSearchParams} />}
      {currentPage === 'blog' && <Blog onNavigate={handleNavigate} />}
      {currentPage === 'cvtheque' && <CVTheque onNavigate={handleNavigate} />}
      {currentPage === 'cms-admin' && <CMSAdmin onNavigate={handleNavigate} />}
      {currentPage === 'user-management' && <UserManagement onNavigate={handleNavigate} />}
      {currentPage === 'admin-credits-ia' && <AdminCreditsIA onNavigate={handleNavigate} />}
      {currentPage === 'admin-ia-pricing' && <AdminIAPricing onNavigate={handleNavigate} />}
      {currentPage === 'admin-ia-config' && <AdminIAConfig onNavigate={handleNavigate} />}
      {currentPage === 'admin-ia-templates' && <AdminIATemplates onNavigate={handleNavigate} />}
      {currentPage === 'admin-chatbot' && <AdminChatbot onNavigate={handleNavigate} />}
      {currentPage === 'admin-ia-premium-quota' && <AdminIAPremiumQuota />}
      {currentPage === 'admin-profile-purchases' && <AdminProfilePurchases />}
      {currentPage === 'admin-homepage-content' && <AdminHomepageContent />}
      {currentPage === 'admin-ia-center' && <AdminIACenter onNavigate={handleNavigate} />}
      {currentPage === 'admin-credit-store-settings' && <AdminCreditStoreSettings onNavigate={handleNavigate} />}
      {currentPage === 'admin-credit-purchases' && <AdminCreditPurchases onNavigate={handleNavigate} />}
      {currentPage === 'admin-credit-packages' && <AdminCreditPackages />}
      {currentPage === 'admin-security-logs' && <AdminSecurityLogs onNavigate={handleNavigate} />}
      {currentPage === 'admin-premium-subscriptions' && <AdminPremiumSubscriptions onNavigate={handleNavigate} />}
      {currentPage === 'candidate-profile-form' && <CandidateProfileForm />}
      {currentPage === 'premium-subscribe' && <PremiumSubscribe onNavigate={handleNavigate} />}
      {currentPage === 'premium-ai' && <PremiumAIServices onNavigate={handleNavigate} scrollTarget={scrollTarget} />}
      {currentPage === 'ai-matching' && <AIMatchingService onNavigate={handleNavigate} />}
      {currentPage === 'ai-cv-generator' && <AICVGenerator onNavigate={handleNavigate} />}
      {currentPage === 'ai-cover-letter' && <AICoverLetterGenerator onNavigate={handleNavigate} />}
      {currentPage === 'ai-career-plan' && <AICareerPlanGenerator onNavigate={handleNavigate} />}
      {currentPage === 'ai-coach' && <AICoachChat onNavigate={handleNavigate} />}
      {currentPage === 'ai-interview-simulator' && <AIInterviewSimulator onNavigate={handleNavigate} />}
      {currentPage === 'ai-alerts' && <AIAlertsCenter onNavigate={handleNavigate} />}
      {currentPage === 'ai-chat' && <AIChat onNavigate={handleNavigate} />}
      {currentPage === 'gold-profile' && <GoldProfileService onNavigate={handleNavigate} />}
      {currentPage === 'credit-store' && <CreditStore onNavigate={handleNavigate} scrollTarget={scrollTarget} />}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <CMSProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </CMSProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
