import { useState, lazy, Suspense, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CMSProvider } from './contexts/CMSContext';
import { ModalProvider } from './contexts/ModalContext';
import { ToastProvider } from './components/notifications/ToastContainer';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Auth from './pages/Auth';
import AuthCallback from './pages/AuthCallback';
import { seoCoreWebVitalsService } from './services/seoCoreWebVitalsService';
import { useSiteSettings } from './hooks/useFavicon';

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
const AdminBrandingSettings = lazy(() => import('./pages/AdminBrandingSettings'));
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
const AdminJobModeration = lazy(() => import('./pages/AdminJobModerationEnhanced'));
const AdminJobList = lazy(() => import('./pages/AdminJobList'));
const AdminJobBadges = lazy(() => import('./pages/AdminJobBadges'));
const B2BSolutions = lazy(() => import('./pages/B2BSolutions'));
const AdminB2BManagement = lazy(() => import('./pages/AdminB2BManagement'));
const AdminB2BSeoConfig = lazy(() => import('./pages/AdminB2BSeoConfig'));
const AdminSEOLandingPages = lazy(() => import('./pages/AdminSEOLandingPages'));
const DownloadDocumentation = lazy(() => import('./pages/DownloadDocumentation'));
const CVDesigner = lazy(() => import('./pages/CVDesigner'));
const ExternalApplication = lazy(() => import('./pages/ExternalApplication'));
const ExternalApplications = lazy(() => import('./pages/ExternalApplications'));
const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const AdminExternalApplications = lazy(() => import('./pages/AdminExternalApplications'));
const AdminEmailTemplates = lazy(() => import('./pages/AdminEmailTemplates'));
const CampaignCreate = lazy(() => import('./pages/CampaignCreate'));
const AdminCampaignPayments = lazy(() => import('./pages/AdminCampaignPayments'));
const AdminDiffusionSettings = lazy(() => import('./pages/AdminDiffusionSettings'));
const AdminCommunications = lazy(() => import('./pages/AdminCommunications'));
const AdminCommunicationCreate = lazy(() => import('./pages/AdminCommunicationCreate'));
const AdminCommunicationTemplates = lazy(() => import('./pages/AdminCommunicationTemplates'));
const AdminCommunicationLogs = lazy(() => import('./pages/AdminCommunicationLogs'));
const AdminJobCreate = lazy(() => import('./pages/AdminJobCreate'));
const PartnerHub = lazy(() => import('./pages/PartnerHub'));
const AdminFormationConfig = lazy(() => import('./pages/AdminFormationConfig'));
const AdminCVBuilderConfig = lazy(() => import('./pages/AdminCVBuilderConfig'));
const AdminJobAlertsConfig = lazy(() => import('./pages/AdminJobAlertsConfig'));
const AdminInterviewConfig = lazy(() => import('./pages/AdminInterviewConfig'));
const AdminFormationList = lazy(() => import('./pages/AdminFormationList'));
const AdminTrainerManagement = lazy(() => import('./pages/AdminTrainerManagement'));
const AdminFormationBoost = lazy(() => import('./pages/AdminFormationBoost'));
const AdminApplicationsList = lazy(() => import('./pages/AdminApplicationsList'));
const AdminSocialAnalytics = lazy(() => import('./pages/AdminSocialAnalytics'));
const Resources = lazy(() => import('./pages/Resources'));

type Page = 'home' | 'login' | 'signup' | 'auth-callback' | 'jobs' | 'job-detail' | 'job-marketplace' | 'cvtheque-teaser' | 'candidate-dashboard' | 'recruiter-dashboard' | 'trainer-dashboard' | 'formations' | 'blog' | 'resources' | 'cvtheque' | 'cms-admin' | 'user-management' | 'admin-credits-ia' | 'admin-ia-pricing' | 'admin-ia-config' | 'admin-ia-templates' | 'admin-chatbot' | 'admin-ia-center' | 'admin-credit-store-settings' | 'admin-credit-purchases' | 'admin-credit-packages' | 'admin-security-logs' | 'admin-premium-subscriptions' | 'admin-ia-premium-quota' | 'admin-profile-purchases' | 'admin-homepage-content' | 'admin-automation-rules' | 'admin-recruiter-notifications' | 'admin-seo' | 'admin-job-moderation' | 'admin-job-list' | 'admin-job-create' | 'admin-job-badges' | 'admin-social-analytics' | 'partner-hub' | 'candidate-profile-form' | 'premium-ai' | 'premium-subscribe' | 'enterprise-subscribe' | 'admin-enterprise-subscriptions' | 'recruiter-messaging' | 'ai-matching' | 'ai-cv-generator' | 'ai-cover-letter' | 'ai-career-plan' | 'ai-coach' | 'ai-interview-simulator' | 'ai-alerts' | 'ai-chat' | 'gold-profile' | 'credit-store' | 'b2b-solutions' | 'admin-b2b-management' | 'admin-b2b-seo-config' | 'admin-seo-landing-pages' | 'download-documentation' | 'cv-designer' | 'external-application' | 'external-applications' | 'public-profile' | 'admin-external-applications' | 'admin-email-templates' | 'campaign-create' | 'admin-campaign-payments' | 'admin-diffusion-settings' | 'admin-communications' | 'admin-communication-create' | 'admin-communication-templates' | 'admin-communication-logs' | 'admin-formation-config' | 'admin-cv-builder-config' | 'admin-job-alerts-config' | 'admin-interview-config' | 'admin-formation-list' | 'admin-trainer-management' | 'admin-formation-boost' | 'admin-applications-list';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [jobDetailState, setJobDetailState] = useState<any>(null);
  const [marketplaceSlug, setMarketplaceSlug] = useState<string>('');
  const [cvthequeTeaserSlug, setCvthequeTeaserSlug] = useState<string>('');
  const [jobSearchParams, setJobSearchParams] = useState<string>('');
  const [formationSearchParams, setFormationSearchParams] = useState<string>('');
  const [scrollTarget, setScrollTarget] = useState<string>('');
  const [publicProfileToken, setPublicProfileToken] = useState<string>('');
  const { loading } = useAuth();
  useSiteSettings();

  useEffect(() => {
    // Disabled temporarily - RLS permissions issue
    // seoCoreWebVitalsService.initRUM();

    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      setCurrentPage('auth-callback');
    }
  }, []);

  const handleNavigate = (page: string, paramOrState?: string | any) => {
    setCurrentPage(page as Page);
    if (page === 'job-detail') {
      if (typeof paramOrState === 'string') {
        setSelectedJobId(paramOrState);
        setJobDetailState(null);
      } else if (paramOrState && typeof paramOrState === 'object') {
        setSelectedJobId(paramOrState.jobId || '');
        setJobDetailState(paramOrState);
      }
    }
    if (page === 'job-marketplace' && paramOrState) {
      setMarketplaceSlug(paramOrState as string);
    }
    if (page === 'cvtheque-teaser' && paramOrState) {
      setCvthequeTeaserSlug(paramOrState as string);
    }
    if (page === 'jobs') {
      setJobSearchParams((paramOrState as string) || '');
    }
    if (page === 'formations') {
      setFormationSearchParams((paramOrState as string) || '');
    }
    if ((page === 'credit-store' || page === 'premium-ai') && paramOrState) {
      setScrollTarget(paramOrState as string);
    }
    if (page === 'public-profile' && paramOrState) {
      setPublicProfileToken(paramOrState as string);
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

  const adminPages: Page[] = [
    'cms-admin', 'user-management', 'admin-credits-ia', 'admin-ia-pricing',
    'admin-ia-config', 'admin-ia-templates', 'admin-chatbot', 'admin-ia-center',
    'admin-credit-store-settings', 'admin-credit-purchases', 'admin-credit-packages',
    'admin-security-logs', 'admin-premium-subscriptions', 'admin-ia-premium-quota',
    'admin-profile-purchases', 'admin-homepage-content', 'admin-branding', 'admin-automation-rules',
    'admin-recruiter-notifications', 'admin-seo', 'admin-job-moderation', 'admin-job-list',
    'admin-job-create', 'admin-job-badges', 'admin-social-analytics', 'admin-enterprise-subscriptions',
    'admin-b2b-management', 'admin-b2b-seo-config', 'admin-seo-landing-pages',
    'admin-external-applications', 'admin-email-templates', 'admin-campaign-payments',
    'admin-diffusion-settings', 'admin-communications', 'admin-communication-create',
    'admin-communication-templates', 'admin-communication-logs', 'admin-formation-config',
    'admin-cv-builder-config', 'admin-job-alerts-config', 'admin-interview-config',
    'admin-formation-list', 'admin-trainer-management', 'admin-formation-boost',
    'admin-applications-list'
  ];

  const isAdminPage = adminPages.includes(currentPage);

  if (currentPage === 'login' || currentPage === 'signup') {
    return <Auth mode={currentPage} onNavigate={handleNavigate} />;
  }

  if (currentPage === 'auth-callback') {
    return <AuthCallback onNavigate={handleNavigate} />;
  }

  const loadingFallback = (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
        <p className="mt-4 text-gray-600">Chargement de la page...</p>
      </div>
    </div>
  );

  if (isAdminPage) {
    return (
      <AdminLayout currentPage={currentPage} onNavigate={handleNavigate}>
        <Suspense fallback={loadingFallback}>
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'jobs' && <Jobs onNavigate={handleNavigate} initialSearch={jobSearchParams} />}
        {currentPage === 'job-detail' && (
          <JobDetail
            jobId={selectedJobId}
            onNavigate={handleNavigate}
            autoOpenApply={jobDetailState?.autoOpenApply}
            metadata={jobDetailState?.metadata}
          />
        )}
        {currentPage === 'job-marketplace' && <JobMarketplacePage slug={marketplaceSlug} onNavigate={handleNavigate} />}
        {currentPage === 'cvtheque-teaser' && <CVthequeTeaserPage slug={cvthequeTeaserSlug} onNavigate={handleNavigate} />}
        {currentPage === 'candidate-dashboard' && <CandidateDashboard onNavigate={handleNavigate} />}
        {currentPage === 'recruiter-dashboard' && <RecruiterDashboard onNavigate={handleNavigate} />}
        {currentPage === 'trainer-dashboard' && <TrainerDashboard onNavigate={handleNavigate} />}
        {currentPage === 'formations' && <Formations onNavigate={handleNavigate} searchParams={formationSearchParams} />}
        {currentPage === 'blog' && <Blog onNavigate={handleNavigate} />}
        {currentPage === 'resources' && <Resources />}
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
        {currentPage === 'admin-branding' && <AdminBrandingSettings />}
        {currentPage === 'admin-ia-center' && <AdminIACenter onNavigate={handleNavigate} />}
        {currentPage === 'admin-credit-store-settings' && <AdminCreditStoreSettings onNavigate={handleNavigate} />}
        {currentPage === 'admin-credit-purchases' && <AdminCreditPurchases onNavigate={handleNavigate} />}
        {currentPage === 'admin-credit-packages' && <AdminCreditPackages onNavigate={handleNavigate} />}
        {currentPage === 'admin-security-logs' && <AdminSecurityLogs onNavigate={handleNavigate} />}
        {currentPage === 'admin-premium-subscriptions' && <AdminPremiumSubscriptions onNavigate={handleNavigate} />}
        {currentPage === 'admin-enterprise-subscriptions' && <AdminEnterpriseSubscriptions onNavigate={handleNavigate} />}
        {currentPage === 'admin-automation-rules' && <AdminAutomationRules />}
        {currentPage === 'admin-recruiter-notifications' && <AdminRecruiterNotifications />}
        {currentPage === 'admin-seo' && <AdminSEO onNavigate={handleNavigate} />}
        {currentPage === 'admin-job-moderation' && <AdminJobModeration onNavigate={handleNavigate} />}
        {currentPage === 'admin-job-list' && <AdminJobList />}
        {currentPage === 'admin-job-badges' && <AdminJobBadges />}
        {currentPage === 'admin-job-create' && <AdminJobCreate onNavigate={handleNavigate} />}
        {currentPage === 'admin-formation-config' && <AdminFormationConfig />}
        {currentPage === 'admin-cv-builder-config' && <AdminCVBuilderConfig />}
        {currentPage === 'admin-job-alerts-config' && <AdminJobAlertsConfig />}
        {currentPage === 'admin-interview-config' && <AdminInterviewConfig />}
        {currentPage === 'admin-formation-list' && <AdminFormationList />}
        {currentPage === 'admin-trainer-management' && <AdminTrainerManagement />}
        {currentPage === 'admin-formation-boost' && <AdminFormationBoost onNavigate={handleNavigate} />}
        {currentPage === 'candidate-profile-form' && <CandidateProfileForm onNavigateDashboard={() => handleNavigate('candidate-dashboard')} />}
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
        {currentPage === 'b2b-solutions' && <B2BSolutions onNavigate={handleNavigate} />}
        {currentPage === 'admin-b2b-management' && <AdminB2BManagement />}
        {currentPage === 'admin-b2b-seo-config' && <AdminB2BSeoConfig />}
        {currentPage === 'admin-seo-landing-pages' && <AdminSEOLandingPages />}
        {currentPage === 'download-documentation' && <DownloadDocumentation />}
        {currentPage === 'cv-designer' && <CVDesigner onNavigate={handleNavigate} />}
        {currentPage === 'external-application' && <ExternalApplication onNavigate={handleNavigate} />}
        {currentPage === 'external-applications' && <ExternalApplications onNavigate={handleNavigate} />}
        {currentPage === 'public-profile' && <PublicProfile token={publicProfileToken} onNavigate={handleNavigate} />}
        {currentPage === 'admin-external-applications' && <AdminExternalApplications />}
        {currentPage === 'admin-applications-list' && <AdminApplicationsList />}
        {currentPage === 'admin-email-templates' && <AdminEmailTemplates />}
        {currentPage === 'campaign-create' && <CampaignCreate onNavigate={handleNavigate} />}
        {currentPage === 'admin-campaign-payments' && <AdminCampaignPayments />}
        {currentPage === 'admin-diffusion-settings' && <AdminDiffusionSettings />}
        {currentPage === 'admin-communications' && <AdminCommunications onNavigate={handleNavigate} />}
        {currentPage === 'admin-communication-create' && <AdminCommunicationCreate onNavigate={handleNavigate} />}
        {currentPage === 'admin-communication-templates' && <AdminCommunicationTemplates onNavigate={handleNavigate} />}
        {currentPage === 'admin-communication-logs' && <AdminCommunicationLogs onNavigate={handleNavigate} />}
        {currentPage === 'admin-social-analytics' && <AdminSocialAnalytics onNavigate={handleNavigate} />}
        {currentPage === 'partner-hub' && <PartnerHub onNavigate={handleNavigate} />}
        </Suspense>
      </AdminLayout>
    );
  }

  return (
    <Layout currentPage={currentPage} onNavigate={handleNavigate}>
      <Suspense fallback={loadingFallback}>
        {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
        {currentPage === 'jobs' && <Jobs onNavigate={handleNavigate} initialSearch={jobSearchParams} />}
        {currentPage === 'job-detail' && (
          <JobDetail
            jobId={selectedJobId}
            onNavigate={handleNavigate}
            autoOpenApply={jobDetailState?.autoOpenApply}
            metadata={jobDetailState?.metadata}
          />
        )}
        {currentPage === 'job-marketplace' && <JobMarketplacePage slug={marketplaceSlug} onNavigate={handleNavigate} />}
        {currentPage === 'cvtheque-teaser' && <CVthequeTeaserPage slug={cvthequeTeaserSlug} onNavigate={handleNavigate} />}
        {currentPage === 'candidate-dashboard' && <CandidateDashboard onNavigate={handleNavigate} />}
        {currentPage === 'recruiter-dashboard' && <RecruiterDashboard onNavigate={handleNavigate} />}
        {currentPage === 'trainer-dashboard' && <TrainerDashboard onNavigate={handleNavigate} />}
        {currentPage === 'formations' && <Formations onNavigate={handleNavigate} searchParams={formationSearchParams} />}
        {currentPage === 'blog' && <Blog onNavigate={handleNavigate} />}
        {currentPage === 'resources' && <Resources />}
        {currentPage === 'cvtheque' && <CVTheque onNavigate={handleNavigate} />}
        {currentPage === 'candidate-profile-form' && <CandidateProfileForm onNavigateDashboard={() => handleNavigate('candidate-dashboard')} />}
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
        {currentPage === 'b2b-solutions' && <B2BSolutions onNavigate={handleNavigate} />}
        {currentPage === 'download-documentation' && <DownloadDocumentation />}
        {currentPage === 'cv-designer' && <CVDesigner onNavigate={handleNavigate} />}
        {currentPage === 'external-application' && <ExternalApplication onNavigate={handleNavigate} />}
        {currentPage === 'external-applications' && <ExternalApplications onNavigate={handleNavigate} />}
        {currentPage === 'public-profile' && <PublicProfile token={publicProfileToken} onNavigate={handleNavigate} />}
        {currentPage === 'campaign-create' && <CampaignCreate onNavigate={handleNavigate} />}
        {currentPage === 'partner-hub' && <PartnerHub onNavigate={handleNavigate} />}
      </Suspense>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <CMSProvider>
            <ModalProvider>
              <ToastProvider>
                <AppContent />
              </ToastProvider>
            </ModalProvider>
          </CMSProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
