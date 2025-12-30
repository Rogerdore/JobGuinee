import { useState, lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CMSProvider } from './contexts/CMSContext';
import { ToastProvider } from './components/notifications/ToastContainer';
import Layout from './components/Layout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import { seoCoreWebVitalsService } from './services/seoCoreWebVitalsService';

const Jobs = lazy(() => import('./pages/Jobs'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const JobMarketplacePage = lazy(() => import('./pages/JobMarketplacePage'));
const CVthequeTeaserPage = lazy(() => import('./pages/CVthequeTeaserPage'));
const CandidateDashboard = lazy(() => import('./pages/CandidateDashboard'));
const RecruiterDashboard = lazy(() => import('./pages/RecruiterDashboard'));
const TrainerDashboard = lazy(() => import('./pages/TrainerDashboard'));
const Formations = lazy(() => import('./pages/Formations'));
const Blog = lazy(() => import('./pages/Blog'));
const CVTheque = lazy(() => import('./pages/CVTheque'));
const CMSAdmin = lazy(() => import('./pages/CMSAdmin'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AdminCreditsIA = lazy(() => import('./pages/AdminCreditsIA'));
const AdminIAPricing = lazy(() => import('./pages/AdminIAPricing'));
const CandidateProfileForm = lazy(() => import('./components/forms/CandidateProfileForm'));
const PremiumAIServices = lazy(() => import('./pages/PremiumAIServices'));
const AIMatchingService = lazy(() => import('./components/ai/AIMatchingService'));
const AICVGenerator = lazy(() => import('./components/ai/EnhancedAICVGenerator'));
const AICoachChat = lazy(() => import('./components/ai/AICoachChat'));
const GoldProfileService = lazy(() => import('./components/ai/GoldProfileService'));
const AICoverLetterGenerator = lazy(() => import('./components/ai/AICoverLetterGenerator'));
const AICareerPlanGenerator = lazy(() => import('./components/ai/AICareerPlanGenerator'));
const AIInterviewSimulator = lazy(() => import('./components/ai/AIInterviewSimulator'));
const AIAlertsCenter = lazy(() => import('./components/ai/AIAlertsCenter'));
const AIChat = lazy(() => import('./components/ai/AIChat'));
const CreditStore = lazy(() => import('./pages/CreditStore'));
const AdminIAConfig = lazy(() => import('./pages/AdminIAConfig'));
const AdminIATemplates = lazy(() => import('./pages/AdminIATemplates'));
const AdminChatbot = lazy(() => import('./pages/AdminChatbot'));
const AdminIACenter = lazy(() => import('./pages/AdminIACenter'));
const AdminHomepageContent = lazy(() => import('./pages/AdminHomepageContent'));
const AdminCreditStoreSettings = lazy(() => import('./pages/AdminCreditStoreSettings'));
const AdminCreditPurchases = lazy(() => import('./pages/AdminCreditPurchases'));
const AdminSecurityLogs = lazy(() => import('./pages/AdminSecurityLogs'));
const PremiumSubscribe = lazy(() => import('./pages/PremiumSubscribe'));
const AdminPremiumSubscriptions = lazy(() => import('./pages/AdminPremiumSubscriptions'));
const AdminIAPremiumQuota = lazy(() => import('./pages/AdminIAPremiumQuota'));
const AdminProfilePurchases = lazy(() => import('./pages/AdminProfilePurchases'));
const AdminCreditPackages = lazy(() => import('./pages/AdminCreditPackages'));
const EnterpriseSubscribe = lazy(() => import('./pages/EnterpriseSubscribe'));
const AdminEnterpriseSubscriptions = lazy(() => import('./pages/AdminEnterpriseSubscriptions'));
const RecruiterMessaging = lazy(() => import('./pages/RecruiterMessaging'));
const AdminAutomationRules = lazy(() => import('./pages/AdminAutomationRules'));
const AdminRecruiterNotifications = lazy(() => import('./pages/AdminRecruiterNotifications'));
const AdminSEO = lazy(() => import('./pages/AdminSEO'));
const AdminJobModeration = lazy(() => import('./pages/AdminJobModeration'));
const B2BSolutions = lazy(() => import('./pages/B2BSolutions'));
const AdminB2BManagement = lazy(() => import('./pages/AdminB2BManagement'));
const AdminB2BSeoConfig = lazy(() => import('./pages/AdminB2BSeoConfig'));
const AdminSEOLandingPages = lazy(() => import('./pages/AdminSEOLandingPages'));
const DownloadDocumentation = lazy(() => import('./pages/DownloadDocumentation'));
const CVDesigner = lazy(() => import('./pages/CVDesigner'));

type Page = 'home' | 'login' | 'signup' | 'jobs' | 'job-detail' | 'job-marketplace' | 'cvtheque-teaser' | 'candidate-dashboard' | 'recruiter-dashboard' | 'trainer-dashboard' | 'formations' | 'blog' | 'cvtheque' | 'cms-admin' | 'user-management' | 'admin-credits-ia' | 'admin-ia-pricing' | 'admin-ia-config' | 'admin-ia-templates' | 'admin-chatbot' | 'admin-ia-center' | 'admin-credit-store-settings' | 'admin-credit-purchases' | 'admin-credit-packages' | 'admin-security-logs' | 'admin-premium-subscriptions' | 'admin-ia-premium-quota' | 'admin-profile-purchases' | 'admin-homepage-content' | 'admin-automation-rules' | 'admin-recruiter-notifications' | 'admin-seo' | 'admin-job-moderation' | 'candidate-profile-form' | 'premium-ai' | 'premium-subscribe' | 'enterprise-subscribe' | 'admin-enterprise-subscriptions' | 'recruiter-messaging' | 'ai-matching' | 'ai-cv-generator' | 'ai-cover-letter' | 'ai-career-plan' | 'ai-coach' | 'ai-interview-simulator' | 'ai-alerts' | 'ai-chat' | 'gold-profile' | 'credit-store' | 'b2b-solutions' | 'admin-b2b-management' | 'admin-b2b-seo-config' | 'admin-seo-landing-pages' | 'download-documentation' | 'cv-designer';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [marketplaceSlug, setMarketplaceSlug] = useState<string>('');
  const [cvthequeTeaserSlug, setCvthequeTeaserSlug] = useState<string>('');
  const [jobSearchParams, setJobSearchParams] = useState<string>('');
  const [formationSearchParams, setFormationSearchParams] = useState<string>('');
  const [scrollTarget, setScrollTarget] = useState<string>('');
  const { loading } = useAuth();

  useEffect(() => {
    seoCoreWebVitalsService.initRUM();
  }, []);

  const handleNavigate = (page: string, param?: string) => {
    setCurrentPage(page as Page);
    if (page === 'job-detail' && param) {
      setSelectedJobId(param);
    }
    if (page === 'job-marketplace' && param) {
      setMarketplaceSlug(param);
    }
    if (page === 'cvtheque-teaser' && param) {
      setCvthequeTeaserSlug(param);
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
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
            <p className="mt-4 text-gray-600">Chargement de la page...</p>
          </div>
        </div>
      }>
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'jobs' && <Jobs onNavigate={handleNavigate} initialSearch={jobSearchParams} />}
        {currentPage === 'job-detail' && <JobDetail jobId={selectedJobId} onNavigate={handleNavigate} />}
        {currentPage === 'job-marketplace' && <JobMarketplacePage slug={marketplaceSlug} onNavigate={handleNavigate} />}
        {currentPage === 'cvtheque-teaser' && <CVthequeTeaserPage slug={cvthequeTeaserSlug} onNavigate={handleNavigate} />}
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
        {currentPage === 'admin-enterprise-subscriptions' && <AdminEnterpriseSubscriptions onNavigate={handleNavigate} />}
        {currentPage === 'admin-automation-rules' && <AdminAutomationRules />}
        {currentPage === 'admin-recruiter-notifications' && <AdminRecruiterNotifications />}
        {currentPage === 'admin-seo' && <AdminSEO onNavigate={handleNavigate} />}
        {currentPage === 'admin-job-moderation' && <AdminJobModeration onNavigate={handleNavigate} />}
        {currentPage === 'candidate-profile-form' && <CandidateProfileForm />}
        {currentPage === 'premium-subscribe' && <PremiumSubscribe onNavigate={handleNavigate} />}
        {currentPage === 'enterprise-subscribe' && <EnterpriseSubscribe onNavigate={handleNavigate} />}
        {currentPage === 'recruiter-messaging' && <RecruiterMessaging onNavigate={handleNavigate} />}
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
        {currentPage === 'b2b-solutions' && <B2BSolutions />}
        {currentPage === 'admin-b2b-management' && <AdminB2BManagement />}
        {currentPage === 'admin-b2b-seo-config' && <AdminB2BSeoConfig />}
        {currentPage === 'admin-seo-landing-pages' && <AdminSEOLandingPages />}
        {currentPage === 'download-documentation' && <DownloadDocumentation />}
        {currentPage === 'cv-designer' && <CVDesigner onNavigate={handleNavigate} />}
      </Suspense>
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
