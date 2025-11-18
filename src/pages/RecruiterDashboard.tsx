import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  BarChart3,
  Wand2,
  Sparkles,
  Plus,
  Filter,
  List,
  Kanban,
  FileText,
  TrendingUp,
  Settings,
  Target,
  Database,
  X,
  AlertCircle,
  Download,
  MessageCircle,
  Calendar,
  Mail,
  CheckCircle,
  Bell,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardStats from '../components/recruiter/DashboardStats';
import ApplicationCard from '../components/recruiter/ApplicationCard';
import JobPublishForm, { JobFormData } from '../components/recruiter/JobPublishForm';
import PremiumPlans from '../components/recruiter/PremiumPlans';
import KanbanBoard from '../components/recruiter/KanbanBoard';
import AnalyticsDashboard from '../components/recruiter/AnalyticsDashboard';
import AIMatchingModal from '../components/recruiter/AIMatchingModal';
import RecruiterProfileForm from '../components/recruiter/RecruiterProfileForm';
import ExportApplicationsButton from '../components/recruiter/ExportApplicationsButton';
import MessagingSystem from '../components/messaging/MessagingSystem';
import SkeletonLoader from '../components/recruiter/SkeletonLoader';
import { sampleJobs, sampleApplications, sampleWorkflowStages } from '../utils/sampleJobsData';

interface RecruiterDashboardProps {
  onNavigate: (page: string, jobId?: string) => void;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  department?: string;
  status: string;
  created_at: string;
  applications_count: number;
  views_count: number;
  keywords?: string[];
  experience_level?: string;
  education_level?: string;
  requirements?: string;
}

interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  ai_score: number;
  ai_category: string;
  workflow_stage: string;
  applied_at: string;
  cover_letter?: string;
  cv_url?: string;
  candidate?: any;
}

interface WorkflowStage {
  id: string;
  stage_name: string;
  stage_order: number;
  stage_color: string;
}

type Tab = 'dashboard' | 'projects' | 'applications' | 'ai-generator' | 'messages' | 'analytics' | 'premium' | 'profile';

export default function RecruiterDashboard({ onNavigate }: RecruiterDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJobForm, setShowJobForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [company, setCompany] = useState<any>(null);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('all');
  const [selectedJobAnalytics, setSelectedJobAnalytics] = useState<string>('all');
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [selectedJobForMatching, setSelectedJobForMatching] = useState<Job | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedApplicationForMessage, setSelectedApplicationForMessage] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplicationForProfile, setSelectedApplicationForProfile] = useState<any>(null);
  const [showPaymentContactModal, setShowPaymentContactModal] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<Job | null>(null);
  const [showPublicationSuccessModal, setShowPublicationSuccessModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  // Check if we need to open the edit form from localStorage
  useEffect(() => {
    const editJobId = localStorage.getItem('editJobId');
    if (editJobId) {
      setEditingJobId(editJobId);
      setShowJobForm(true);
      setActiveTab('projects');
      localStorage.removeItem('editJobId');
    }
  }, []);

  useEffect(() => {
    if (profile && !loading && profile.user_type === 'recruiter') {
      if (!profile.profile_completed && activeTab !== 'profile') {
        setActiveTab('profile');
      }
    }
  }, [profile, loading]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    const startTime = performance.now();

    try {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name, logo_url, subscription_tier, profile_id')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!companiesData) {
        setWorkflowStages(sampleWorkflowStages);
        setJobs(sampleJobs);
        setApplications(sampleApplications);
        setLoading(false);
        return;
      }

      setCompany(companiesData);
      console.log('⚡ Company loaded in', Math.round(performance.now() - startTime), 'ms');

      const loadStart = performance.now();
      const [stagesResult, jobsResult] = await Promise.all([
        supabase
          .from('workflow_stages')
          .select('id, stage_name, stage_color, stage_order, company_id')
          .eq('company_id', companiesData.id)
          .order('stage_order'),
        supabase
          .from('jobs')
          .select('id, title, location, department, status, views_count, applications_count, created_at, company_id')
          .eq('company_id', companiesData.id)
          .order('created_at', { ascending: false })
      ]);

      console.log('⚡ Parallel data loaded in', Math.round(performance.now() - loadStart), 'ms');

      const stagesData = stagesResult.data;
      const jobsData = jobsResult.data;

      setWorkflowStages(stagesData && stagesData.length > 0 ? stagesData : sampleWorkflowStages);

      if (!jobsData || jobsData.length === 0) {
        setJobs([]);
        setApplications([]);
        setLoading(false);
        return;
      }

      setJobs(jobsData);
      const jobIds = jobsData.map(j => j.id);

      const appsStart = performance.now();
      console.log('🔍 Fetching applications for job IDs:', jobIds);
      const { data: appsData, error: appsError } = await supabase
        .from('applications')
        .select('id, job_id, candidate_id, first_name, last_name, email, phone, cv_url, cover_letter_url, message, ai_score, ai_category, workflow_stage, status, applied_at')
        .in('job_id', jobIds)
        .order('applied_at', { ascending: false });

      console.log('📊 Applications query result:', {
        count: appsData?.length || 0,
        error: appsError,
        data: appsData
      });

      if (!appsData || appsData.length === 0) {
        console.log('⚠️ No applications found for these jobs');
        setApplications([]);
        setLoading(false);
        console.log('⚡ Total load time:', Math.round(performance.now() - startTime), 'ms');
        return;
      }

      console.log('⚡ Applications loaded in', Math.round(performance.now() - appsStart), 'ms');

      const candidateIds = [...new Set(appsData.map(app => app.candidate_id))];

      const profilesStart = performance.now();
      const [candidateProfilesResult, userProfilesResult] = await Promise.all([
        supabase
          .from('candidate_profiles')
          .select('user_id, id, title, experience_years, education, skills')
          .in('user_id', candidateIds),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', candidateIds)
      ]);

      console.log('⚡ Profiles loaded in', Math.round(performance.now() - profilesStart), 'ms');

      const candidateProfilesMap = new Map(candidateProfilesResult.data?.map(p => [p.user_id, p]) || []);
      const userProfilesMap = new Map(userProfilesResult.data?.map(p => [p.id, p]) || []);

      const enrichedApps = appsData.map(app => {
        const userProfile = userProfilesMap.get(app.candidate_id);
        const names = userProfile?.full_name?.split(' ') || [];

        return {
          ...app,
          first_name: app.first_name || names[0] || '',
          last_name: app.last_name || names.slice(1).join(' ') || '',
          email: app.email || userProfile?.email || '',
          candidate_profile: candidateProfilesMap.get(app.candidate_id)
        };
      });

      console.log('✅ Enriched applications:', enrichedApps);
      setApplications(enrichedApps as any);
      console.log('✅ Total load time:', Math.round(performance.now() - startTime), 'ms');
      console.log('📊 Loaded:', jobsData.length, 'jobs,', enrichedApps.length, 'applications');

    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenJobForm = () => {
    console.log('🔍 Opening job form...');
    console.log('Company:', company);
    console.log('Profile:', profile);
    console.log('Profile completed:', profile?.profile_completed);

    if (!company?.id) {
      console.log('❌ No company found - redirecting to profile');
      alert("⚠️ Profil entreprise requis\n\nVeuillez d'abord compléter votre profil entreprise dans l'onglet 'Profil' avant de publier une offre d'emploi.");
      setActiveTab('profile');
      return;
    }

    console.log('✅ Opening job form');
    setShowJobForm(true);
  };

  const handlePublishJob = async (data: JobFormData) => {
    console.log(editingJobId ? '📝 Updating job...' : '📤 Publishing job...', { company, data });

    if (!company?.id) {
      alert("Veuillez d'abord créer votre profil entreprise dans l'onglet 'Profil'");
      setShowJobForm(false);
      setActiveTab('profile');
      return;
    }

    // Prepare description (use the description directly from the form if it's already formatted)
    const description = data.description;

    // Prepare job data
    const jobPayload = {
      user_id: profile?.id,
      company_id: company.id,
      recruiter_id: profile?.id,
      title: data.title,
      description: description,
      location: data.location,
      contract_type: data.contract_type,
      sector: data.sector,
      department: data.company_name,
      experience_level: data.experience_required,
      education_level: data.education_level,
      application_deadline: data.deadline,
      languages: data.languages,
      required_skills: data.skills,
      benefits: data.benefits,
      application_email: data.application_email,
      receive_applications_in_platform: data.receive_in_platform,
      required_documents: data.required_documents,
      application_instructions: data.application_instructions,
      visibility: data.visibility,
      is_premium: data.is_premium,
      language: data.announcement_language,
      auto_share_social: data.auto_share,
      publication_duration: data.publication_duration,
      auto_renewal: data.auto_renewal,
      is_featured: data.is_premium,
      ai_generated: false,
    };

    // Parse salary
    if (data.salary_range) {
      const salaryParts = data.salary_range.split('-');
      if (salaryParts.length === 2) {
        jobPayload.salary_min = parseInt(salaryParts[0]);
        jobPayload.salary_max = parseInt(salaryParts[1]);
      } else {
        jobPayload.salary_min = parseInt(data.salary_range);
      }
    }

    let jobData, error;

    if (editingJobId) {
      // Update existing job
      const result = await supabase
        .from('jobs')
        .update(jobPayload)
        .eq('id', editingJobId)
        .select()
        .single();

      jobData = result.data;
      error = result.error;
    } else {
      // Create new job
      jobPayload.status = 'draft';
      const result = await supabase
        .from('jobs')
        .insert(jobPayload)
        .select()
        .single();

      jobData = result.data;
      error = result.error;
    }

    if (!error && jobData) {
      if (!editingJobId) {
        // Only handle publication for new jobs
        const { data: publicationResult } = await supabase.rpc('handle_job_publication', {
          p_job_id: jobData.id,
          p_company_id: company.id
        });

        setIsSubscribed(publicationResult?.auto_approved || false);
        setShowPublicationSuccessModal(true);
      } else {
        alert('✅ Offre modifiée avec succès!');
      }

      setShowJobForm(false);
      setEditingJobId(null);
      await loadData();
      setActiveTab('projects');
    } else {
      console.error('Error publishing/updating job:', error);
      alert(`❌ Erreur: ${error?.message || 'Erreur inconnue'}`);
    }
  };

  const handleMoveApplication = async (applicationId: string, newStage: string) => {
    const { error } = await supabase
      .from('applications')
      .update({ workflow_stage: newStage })
      .eq('id', applicationId);

    if (!error) {
      await loadData();
    }
  };

  const handleViewProfile = (applicationId: string) => {
    const app = applications.find(a => a.id === applicationId);
    if (app) {
      setSelectedApplicationForProfile(app);
      setShowProfileModal(true);
    }
  };

  const handleSendMessage = (applicationId: string) => {
    setSelectedApplicationForMessage(applicationId);
    setShowMessageModal(true);
  };

  const handleDownloadCV = async (cvUrl: string) => {
    if (!cvUrl) {
      alert('CV non disponible');
      return;
    }
    window.open(cvUrl, '_blank');
  };

  const handleStartMatching = (job: Job) => {
    console.log('🚀 handleStartMatching called');
    console.log('Job:', job);
    console.log('Company:', company);

    if (!company) {
      console.error('❌ Company not found');
      alert('Erreur: Profil entreprise non trouvé');
      return;
    }

    console.log('✅ Opening matching modal');
    setSelectedJobForMatching(job);
    setShowMatchingModal(true);
  };

  const isPremium = Boolean(company?.subscription_tier === 'premium' || company?.subscription_tier === 'enterprise');

  console.log('RecruiterDashboard - company:', company);
  console.log('RecruiterDashboard - isPremium:', isPremium);
  console.log('RecruiterDashboard - showMatchingModal:', showMatchingModal);
  console.log('RecruiterDashboard - selectedJobForMatching:', selectedJobForMatching);

  const handleUpdateScores = async (scores: Array<{ id: string; score: number; category: string }>) => {
    for (const score of scores) {
      await supabase
        .from('applications')
        .update({
          ai_score: score.score,
          ai_category: score.category
        })
        .eq('id', score.id);
    }
    await loadData();
  };

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: applications.length,
    avgTimeToHire: 14,
  };


  const filteredApplications = applications.filter(app => {
    const categoryMatch = filterCategory === 'all' || app.ai_category === filterCategory;
    const jobMatch = selectedJobFilter === 'all' || app.job_id === selectedJobFilter;

    if (selectedJobFilter !== 'all') {
      console.log('🔍 Filtering app:', {
        appId: app.id,
        appJobId: app.job_id,
        selectedFilter: selectedJobFilter,
        matches: jobMatch,
        fullApp: app
      });
    }

    return categoryMatch && jobMatch;
  });

  console.log('📊 RecruiterDashboard State:', {
    activeTab,
    totalApplications: applications.length,
    filteredApplications: filteredApplications.length,
    selectedJobFilter,
    filterCategory,
    applications: applications.map(a => ({ id: a.id, job_id: a.job_id, name: `${a.first_name} ${a.last_name}` }))
  });

  console.log('📋 All applications:', applications.length);
  console.log('📋 Filtered applications:', filteredApplications.length);
  console.log('📋 Filter settings:', { filterCategory, selectedJobFilter });

  console.log('📊 Filter Results:', {
    activeTab,
    selectedJobFilter,
    totalApplications: applications.length,
    filteredApplications: filteredApplications.length,
    filterCategory
  });

  const selectedJob = jobs.find(j => j.id === selectedJobAnalytics);
  const jobApplications = selectedJobAnalytics === 'all'
    ? applications
    : applications.filter(app => app.job_id === selectedJobAnalytics);

  const analyticsData = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: jobApplications.length,
    strongProfiles: jobApplications.filter(a => a.ai_category === 'strong').length,
    mediumProfiles: jobApplications.filter(a => a.ai_category === 'medium').length,
    weakProfiles: jobApplications.filter(a => a.ai_category === 'weak').length,
    avgTimeToHire: 14,
    avgAIScore: jobApplications.length > 0
      ? Math.round(jobApplications.reduce((acc, app) => acc + (app.ai_score || 0), 0) / jobApplications.length)
      : 0,
  };


  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'profile', label: 'Mon Profil', icon: Settings },
    { id: 'projects', label: 'Mes projets', icon: Briefcase },
    { id: 'applications', label: 'Candidatures', icon: Users, count: applications.length },
    { id: 'ai-generator', label: 'Publier une offre', icon: Plus },
    { id: 'messages', label: 'Messagerie', icon: MessageSquare },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    { id: 'premium', label: 'Premium', icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0E2F56] via-blue-900 to-[#0E2F56] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-[#FF8C00] rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="inline-block relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-white/20 border-t-[#FF8C00]"></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white animate-pulse" />
          </div>
          <p className="mt-8 text-white font-bold text-xl">Chargement de votre espace recruteur...</p>
          <p className="mt-2 text-blue-200">Préparation du tableau de bord ATS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {showPaymentContactModal && selectedJobForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-[#FF8C00] to-orange-600 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Contacter l'administration</h2>
                  <p className="text-sm text-gray-600">Pour finaliser la publication de votre offre</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaymentContactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg text-gray-900 mb-3">📋 Offre en attente</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-semibold">Titre:</span> {selectedJobForPayment.title}</p>
                <p><span className="font-semibold">Localisation:</span> {selectedJobForPayment.location}</p>
                <p className="text-sm text-orange-700 font-medium mt-3">
                  💰 Frais de publication: 50 000 GNF
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Options de contact
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">WhatsApp</p>
                      <a href="https://wa.me/224620000000" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline text-sm">
                        +224 620 00 00 00
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <a href="mailto:admin@emploi-guinee.gn" className="text-blue-600 hover:underline text-sm">
                        admin@emploi-guinee.gn
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-green-600" />
                  Abonnement Premium
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Publiez des offres illimitées sans frais supplémentaires !
                </p>
                <button
                  onClick={() => {
                    setShowPaymentContactModal(false);
                    setActiveTab('premium');
                  }}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg transition-all duration-200"
                >
                  Voir les offres Premium
                </button>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentContactModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
              >
                Fermer
              </button>
              <a
                href="https://wa.me/224620000000?text=Bonjour, je souhaite publier mon offre d'emploi"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-[#FF8C00]/90 hover:to-orange-600/90 text-white font-semibold rounded-xl transition text-center"
              >
                Contacter maintenant
              </a>
            </div>
          </div>
        </div>
      )}

      {showJobForm && (
        <JobPublishForm
          onPublish={handlePublishJob}
          onClose={() => {
            setShowJobForm(false);
            setEditingJobId(null);
          }}
          companyData={company ? {
            name: company.name,
            description: company.description,
            location: company.location,
            website: company.website,
            industry: company.industry,
            email: company.email,
            benefits: company.benefits
          } : undefined}
          editJobId={editingJobId}
        />
      )}

      {showMatchingModal && selectedJobForMatching ? (
        <>
          {console.log('🎨 Rendering AIMatchingModal')}
          <AIMatchingModal
            job={{
              id: selectedJobForMatching.id,
              title: selectedJobForMatching.title,
              description: selectedJobForMatching.description || '',
              required_skills: selectedJobForMatching.keywords || [],
              experience_level: selectedJobForMatching.experience_level || '',
              education_level: selectedJobForMatching.education_level || '',
            }}
          applications={applications
            .filter(app => app.job_id === selectedJobForMatching.id)
            .map(app => ({
              id: app.id,
              ai_score: app.ai_score || 0,
              ai_category: app.ai_category || 'medium',
              applied_at: app.applied_at,
              candidate: {
                full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Candidat',
                email: app.email || '',
                avatar_url: undefined,
              },
              candidate_profile: {
                title: app.candidate_profile?.title,
                experience_years: app.candidate_profile?.experience_years,
                education_level: app.candidate_profile?.education,
                skills: app.candidate_profile?.skills,
              },
            }))}
          onClose={() => setShowMatchingModal(false)}
          onUpdateScores={handleUpdateScores}
          isPremium={isPremium}
          onUpgrade={() => {
            setShowMatchingModal(false);
            setActiveTab('premium');
          }}
          />
        </>
      ) : null}

      <div className="bg-gradient-to-r from-[#0E2F56] via-blue-800 to-[#1a4275] text-white py-12 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF8C00] rounded-full filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-400 rounded-full filter blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="animate-fade-in flex items-start gap-4">
              {company?.logo_url && (
                <div className="flex-shrink-0">
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="w-24 h-24 rounded-xl bg-white object-cover border-4 border-white/30 shadow-lg"
                  />
                </div>
              )}
              <div>
                <h1 className="text-5xl font-bold mb-3 flex items-center">
                  <Sparkles className="w-12 h-12 mr-3 text-[#FF8C00] animate-pulse" />
                  Espace Recruteur ATS
                </h1>
                <p className="text-blue-100 text-lg">
                  Gestion intelligente du processus de recrutement avec IA
                </p>
                {company ? (
                  <div className="mt-2 flex items-center text-sm text-blue-200">
                    <Briefcase className="w-4 h-4 mr-2" />
                    {company.name}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center text-sm text-[#FF8C00] font-semibold">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Mode Démonstration
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleOpenJobForm}
              className="px-8 py-4 bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-[#FF8C00] text-white font-bold rounded-xl transition-all duration-300 shadow-2xl flex items-center gap-3 group hover:scale-105 transform"
            >
              <Plus className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <span>Publier une offre</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {profile && !profile.profile_completed && (
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-[#FF8C00] p-6 rounded-lg shadow-lg mt-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF8C00] bg-opacity-20 rounded-full flex items-center justify-center">
                <Settings className="w-6 h-6 text-[#FF8C00]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">Complétez votre profil</h3>
                <p className="text-gray-700">
                  Pour profiter pleinement de toutes les fonctionnalités, veuillez compléter vos informations personnelles et celles de votre entreprise.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('profile')}
                className="px-6 py-3 bg-[#FF8C00] text-white rounded-lg font-semibold hover:bg-orange-600 transition whitespace-nowrap"
              >
                Compléter maintenant
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-2xl mt-6 mb-6 overflow-hidden border-2 border-gray-100">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-6 py-4 font-semibold whitespace-nowrap flex items-center gap-3 transition-all ${
                    activeTab === tab.id
                      ? 'border-b-4 border-[#FF8C00] text-[#0E2F56] bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.count && tab.count > 0 && (
                    <span className="ml-1 px-2.5 py-1 bg-[#0E2F56] text-white text-xs font-bold rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-6">
          {activeTab === 'dashboard' && (
            <div>
              <DashboardStats stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-lg transition">
                  <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
                    <Briefcase className="w-6 h-6 mr-2 text-[#FF8C00]" />
                    Projets récents
                  </h3>
                  {jobs.slice(0, 3).length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucun projet de recrutement</p>
                      <button
                        onClick={handleOpenJobForm}
                        className="mt-4 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4275] transition"
                      >
                        Créer une offre
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.slice(0, 3).map((job, index) => {
                        const publishedDate = job.created_at ? new Date(job.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : '';
                        return (
                        <div
                          key={job.id}
                          className="p-4 border-2 border-gray-200 rounded-xl card-hover cursor-pointer bg-white animate-slide-up"
                          style={{ animationDelay: `${index * 0.1}s` }}
                          onClick={() => onNavigate('job-detail', job.id)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 flex-1 hover:text-[#FF8C00] transition-colors">{job.title}</h4>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              job.status === 'published'
                                ? 'bg-green-100 text-green-800 animate-pulse-glow'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2 flex items-center">
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            {job.location}
                          </p>
                          {publishedDate && (
                            <p className="text-xs text-gray-500 mb-3 flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1.5" />
                              Publié le {publishedDate}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center text-blue-600 font-medium">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              {job.views_count || 0}
                            </span>
                            <span className="flex items-center text-green-600 font-medium">
                              <Users className="w-4 h-4 mr-1" />
                              {job.applications_count || 0}
                            </span>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-lg transition">
                  <h3 className="font-bold text-xl text-gray-900 mb-4 flex items-center">
                    <Users className="w-6 h-6 mr-2 text-[#FF8C00]" />
                    Candidatures récentes
                  </h3>
                  {applications.slice(0, 3).length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Aucune candidature récente</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 3).map((app, index) => {
                        const fullName = `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Candidat';
                        const appliedDate = app.applied_at ? new Date(app.applied_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '';
                        return (
                        <div
                          key={app.id}
                          className="p-4 border-2 border-gray-200 rounded-xl card-hover bg-white animate-slide-up overflow-hidden relative"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-50"></div>
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 hover:text-[#0E2F56] transition-colors">
                                {fullName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {app.candidate_profile?.title || 'Profil'}
                              </p>
                              {appliedDate && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Postulé le {appliedDate}
                                </p>
                              )}
                              <div className="mt-2">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                                  app.ai_category === 'strong'
                                    ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-700 border border-green-200'
                                    : app.ai_category === 'medium'
                                    ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-700 border border-yellow-200'
                                    : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
                                }`}>
                                  {app.ai_category === 'strong' && '🟢 Profil Fort'}
                                  {app.ai_category === 'medium' && '🟡 Profil Moyen'}
                                  {app.ai_category === 'weak' && '🔴 Profil Faible'}
                                </span>
                              </div>
                            </div>
                            <div className="text-center ml-4 bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-3 rounded-xl border-2 border-blue-200">
                              <div className="text-4xl font-bold bg-gradient-to-r from-[#0E2F56] to-blue-600 bg-clip-text text-transparent">
                                {app.ai_score || 0}%
                              </div>
                              <div className="text-xs text-blue-700 font-medium mt-1">Score IA</div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Mes projets de recrutement ({jobs.length})
                </h2>
                <button
                  onClick={handleOpenJobForm}
                  className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nouvelle offre
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center">
                  <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Aucun projet de recrutement
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Commencez par créer votre première offre d'emploi
                  </p>
                  <button
                    onClick={handleOpenJobForm}
                    className="px-8 py-4 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] hover:from-[#1a4275] hover:to-[#0E2F56] text-white font-bold rounded-xl transition shadow-lg"
                  >
                    Créer une offre
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {jobs.map((job, index) => (
                    <div
                      key={job.id}
                      onClick={() => onNavigate('job-detail', job.id)}
                      className="bg-white rounded-2xl border-2 border-gray-200 p-6 card-hover relative overflow-hidden group animate-slide-up cursor-pointer"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#FF8C00]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-[#0E2F56] transition-colors">{job.title}</h3>
                          <p className="text-gray-600 flex items-center mb-1">
                            <FileText className="w-4 h-4 mr-1.5 text-[#FF8C00]" />
                            {job.location}
                          </p>
                          {job.department && (
                            <p className="text-sm text-gray-500 flex items-center">
                              <Briefcase className="w-3.5 h-3.5 mr-1" />
                              {job.department}
                            </p>
                          )}
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                          job.status === 'published'
                            ? 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200'
                            : job.status === 'draft'
                            ? 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200'
                            : 'bg-gradient-to-r from-red-100 to-red-50 text-red-800 border border-red-200'
                        }`}>
                          {job.status === 'published' ? '🟢 Publié' : job.status === 'draft' ? '📝 Brouillon' : '⏸️ Fermé'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔘 Vues button clicked!');
                            setSelectedJobForViews(job);
                            setShowViewsModal(true);
                          }}
                          className="p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-xl border border-blue-200 relative overflow-hidden hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/30 rounded-full -mr-8 -mt-8"></div>
                          <div className="relative">
                            <div className="text-3xl font-bold bg-gradient-to-r from-[#0E2F56] to-blue-600 bg-clip-text text-transparent">
                              {job.views_count || 0}
                            </div>
                            <div className="text-sm text-blue-700 font-medium flex items-center mt-1">
                              <TrendingUp className="w-3.5 h-3.5 mr-1" />
                              Vues
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          data-job-id={job.id}
                          data-job-title={job.title}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const jobId = e.currentTarget.getAttribute('data-job-id');
                            const jobTitle = e.currentTarget.getAttribute('data-job-title');
                            console.log('🔘 GREEN Candidatures button clicked!');
                            console.log('   Job ID from data-attr:', jobId);
                            console.log('   Job ID from closure:', job.id);
                            console.log('   Job Title:', jobTitle);
                            console.log('   Current activeTab:', activeTab);
                            console.log('   Current selectedJobFilter:', selectedJobFilter);
                            console.log('   Total applications:', applications.length);
                            console.log('   Applications for this job:', applications.filter(a => a.job_id === job.id).length);
                            console.log('   All application job_ids:', applications.map(a => ({ id: a.id, job_id: a.job_id })));
                            setActiveTab('applications');
                            setSelectedJobFilter(job.id);
                            console.log('   ✅ Set activeTab to: applications');
                            console.log('   ✅ Set selectedJobFilter to:', job.id);
                          }}
                          className="p-4 bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-xl border border-green-200 relative overflow-hidden hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
                        >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-green-200/30 rounded-full -mr-8 -mt-8 pointer-events-none"></div>
                          <div className="relative pointer-events-none">
                            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                              {job.applications_count || 0}
                            </div>
                            <div className="text-sm text-green-700 font-medium flex items-center mt-1">
                              <Users className="w-3.5 h-3.5 mr-1" />
                              Candidatures
                            </div>
                          </div>
                        </button>
                      </div>

                      <div className="space-y-3 mb-4 relative z-10">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('🔘 GRAY Candidatures button clicked!');
                              console.log('   Job ID:', job.id);
                              console.log('   Job Title:', job.title);
                              console.log('   Applications for this job:', applications.filter(a => a.job_id === job.id).length);
                              setActiveTab('applications');
                              setSelectedJobFilter(job.id);
                              console.log('   ✅ Changed to applications tab with filter:', job.id);
                            }}
                          >
                            <Users className="w-4 h-4" />
                            <span>Candidatures</span>
                          </button>
                          <button
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🔘 Analyses button clicked!');
                              setActiveTab('analytics');
                              setSelectedJobAnalytics(job.id);
                            }}
                          >
                            <BarChart3 className="w-4 h-4" />
                            <span>Analyses</span>
                          </button>
                        </div>
                        <button
                          className="w-full px-4 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-[#0E2F56] cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔘 Matching IA button clicked!');
                            handleStartMatching(job);
                          }}
                        >
                          <Target className="w-5 h-5" />
                          <Sparkles className="w-4 h-4" />
                          <span>Matching IA</span>
                        </button>
                        {job.status === 'draft' && (
                          <button
                            className="w-full px-4 py-3 bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-[#FF8C00]/90 hover:to-orange-600/90 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-orange-500 cursor-pointer shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedJobForPayment(job);
                              setShowPaymentContactModal(true);
                            }}
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span>Contacter l'admin pour paiement</span>
                          </button>
                        )}
                      </div>

                      <button
                        className="w-full px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200 relative z-10 group border-2 border-gray-300 hover:border-gray-400 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('job-detail', job.id);
                        }}
                      >
                        <span className="flex items-center justify-center">
                          Voir les détails
                          <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              {selectedJobFilter !== 'all' && (
                <div className="mb-6 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white rounded-xl p-4 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6" />
                      <div>
                        <p className="font-bold text-lg">
                          Filtre actif: {jobs.find(j => j.id === selectedJobFilter)?.title || 'Offre'}
                        </p>
                        <p className="text-sm text-white/90">
                          Affichage de {filteredApplications.length} candidature(s) pour cette offre uniquement
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedJobFilter('all');
                        setFilterCategory('all');
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-medium rounded-lg transition flex items-center gap-2 border border-white/30"
                    >
                      <X className="w-4 h-4" />
                      Afficher toutes les candidatures
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    Candidatures reçues ({filteredApplications.length})
                  </h2>
                  {(selectedJobFilter !== 'all' || filterCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSelectedJobFilter('all');
                        setFilterCategory('all');
                      }}
                      className="mt-2 text-sm text-[#FF8C00] hover:text-[#0E2F56] font-medium flex items-center gap-1 transition"
                    >
                      <X className="w-4 h-4" />
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 shadow-sm transition ${
                    selectedJobFilter !== 'all' ? 'border-[#FF8C00] bg-orange-50' : 'border-gray-200'
                  }`}>
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <select
                      value={selectedJobFilter}
                      onChange={(e) => setSelectedJobFilter(e.target.value)}
                      className="border-none focus:ring-0 text-sm font-medium bg-transparent"
                    >
                      <option value="all">Tous les projets ({applications.length})</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({applications.filter(app => app.job_id === job.id).length})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={`flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 shadow-sm transition ${
                    filterCategory !== 'all' ? 'border-[#FF8C00] bg-orange-50' : 'border-gray-200'
                  }`}>
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="border-none focus:ring-0 text-sm font-medium bg-transparent"
                    >
                      <option value="all">Tous les profils</option>
                      <option value="strong">Profils forts</option>
                      <option value="medium">Profils moyens</option>
                      <option value="weak">Profils faibles</option>
                    </select>
                  </div>

                  <div className="flex items-center bg-white rounded-xl border-2 border-gray-200 p-1 shadow-sm">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition ${
                        viewMode === 'list'
                          ? 'bg-[#0E2F56] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Vue liste"
                    >
                      <List className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('kanban')}
                      className={`p-2 rounded-lg transition ${
                        viewMode === 'kanban'
                          ? 'bg-[#0E2F56] text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      title="Vue Kanban"
                    >
                      <Kanban className="w-5 h-5" />
                    </button>
                  </div>

                  <ExportApplicationsButton
                    applications={filteredApplications}
                    isPremium={isPremium}
                    jobTitle={selectedJobFilter !== 'all' ? jobs.find(j => j.id === selectedJobFilter)?.title : undefined}
                  />
                </div>
              </div>

              {selectedJobFilter === 'all' && applications.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className="w-8 h-8 text-blue-700" />
                      <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full font-bold">
                        Total
                      </span>
                    </div>
                    <div className="text-4xl font-bold text-blue-900 mb-1">{applications.length}</div>
                    <div className="text-sm text-blue-700 font-medium">Candidatures totales</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 text-green-700" />
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-bold">
                        Profils forts
                      </span>
                    </div>
                    <div className="text-4xl font-bold text-green-900 mb-1">
                      {applications.filter(a => a.ai_category === 'strong').length}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Candidats qualifiés</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border-2 border-orange-200">
                    <div className="flex items-center justify-between mb-2">
                      <Target className="w-8 h-8 text-orange-700" />
                      <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full font-bold">
                        Projets
                      </span>
                    </div>
                    <div className="text-4xl font-bold text-orange-900 mb-1">{jobs.length}</div>
                    <div className="text-sm text-orange-700 font-medium">Offres actives</div>
                  </div>
                </div>
              )}

              {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Aucune candidature
                  </h3>
                  <p className="text-gray-600">
                    {selectedJobFilter !== 'all'
                      ? `Aucune candidature trouvée pour cette offre (ID: ${selectedJobFilter})`
                      : 'Les candidatures apparaîtront ici une fois que les candidats postuleront'
                    }
                  </p>
                </div>
              ) : viewMode === 'kanban' ? (
                <KanbanBoard
                  applications={filteredApplications.map(app => ({
                    id: app.id,
                    ai_score: app.ai_score || 0,
                    ai_category: app.ai_category || 'medium',
                    workflow_stage: app.workflow_stage || 'received',
                    applied_at: app.applied_at,
                    candidate: {
                      full_name: `${app.first_name || ''} ${app.last_name || ''}`.trim() || 'Candidat',
                      email: app.email || '',
                      phone: app.phone,
                      avatar_url: undefined,
                    },
                    candidate_profile: {
                      title: app.candidate_profile?.title,
                      experience_years: app.candidate_profile?.experience_years,
                      education_level: app.candidate_profile?.education,
                      skills: app.candidate_profile?.skills,
                    },
                  }))}
                  stages={workflowStages.map(stage => ({
                    id: stage.id,
                    name: stage.stage_name,
                    color: stage.stage_color,
                  }))}
                  onMoveApplication={handleMoveApplication}
                  onViewProfile={handleViewProfile}
                  onMessage={handleSendMessage}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredApplications.map((app) => {
                    const job = jobs.find(j => j.id === app.job_id);
                    return (
                      <ApplicationCard
                        key={app.id}
                        application={{
                          id: app.id,
                          first_name: app.first_name || '',
                          last_name: app.last_name || '',
                          email: app.email || '',
                          phone: app.phone || '',
                          cv_url: app.cv_url || '',
                          cover_letter_url: app.cover_letter_url,
                          message: app.message,
                          ai_score: app.ai_score || 0,
                          ai_category: app.ai_category || 'medium',
                          workflow_stage: app.workflow_stage || 'received',
                          applied_at: app.applied_at,
                          created_at: app.applied_at,
                          candidate_profile: app.candidate_profile ? {
                            id: app.candidate_profile.id,
                            title: app.candidate_profile.title,
                            experience_years: app.candidate_profile.experience_years,
                            education_level: app.candidate_profile.education,
                            skills: app.candidate_profile.skills,
                          } : undefined,
                        }}
                        jobTitle={job?.title}
                        onMessage={handleSendMessage}
                        onViewProfile={handleViewProfile}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai-generator' && (
            <div>
              <div className="bg-gradient-to-br from-[#0E2F56] via-blue-700 to-[#0E2F56] rounded-3xl p-8 text-white mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF8C00] rounded-full filter blur-3xl opacity-20"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                      <Briefcase className="w-12 h-12" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-bold mb-2">Publication d'offres d'emploi</h2>
                      <p className="text-blue-100 text-lg">
                        Créez et publiez vos offres de recrutement
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Comment publier une offre ?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
                    <div className="w-16 h-16 bg-[#0E2F56] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                      1
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Remplissez le formulaire</h4>
                    <p className="text-sm text-gray-600">Poste, localisation, salaire, compétences</p>
                  </div>
                  <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200">
                    <div className="w-16 h-16 bg-[#FF8C00] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                      2
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Vérifiez les détails</h4>
                    <p className="text-sm text-gray-600">Assurez-vous que tout est correct</p>
                  </div>
                  <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200">
                    <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                      3
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Publiez</h4>
                    <p className="text-sm text-gray-600">Votre offre est visible immédiatement</p>
                  </div>
                </div>

                <button
                  onClick={handleOpenJobForm}
                  className="w-full py-5 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] hover:from-[#1a4275] hover:to-[#0E2F56] text-white font-bold text-lg rounded-2xl transition shadow-2xl flex items-center justify-center gap-3"
                >
                  <Plus className="w-7 h-7" />
                  Publier une offre
                </button>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <MessagingSystem userType="recruiter" onNavigate={onNavigate} />
          )}

          {activeTab === 'analytics' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Analyses et statistiques
                </h2>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-gray-200 shadow-sm">
                  <Briefcase className="w-5 h-5 text-gray-500" />
                  <select
                    value={selectedJobAnalytics}
                    onChange={(e) => setSelectedJobAnalytics(e.target.value)}
                    className="border-none focus:ring-0 text-sm font-medium"
                  >
                    <option value="all">Tous les projets</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedJobAnalytics !== 'all' && selectedJob && (
                <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white p-6 rounded-2xl mb-6 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{selectedJob.title}</h3>
                      <p className="text-blue-200 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        {selectedJob.location} • {selectedJob.contract_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center px-4">
                        <div className="text-3xl font-bold">{jobApplications.length}</div>
                        <div className="text-sm text-blue-200">Candidatures</div>
                      </div>
                      <div className="text-center px-4">
                        <div className="text-3xl font-bold">{selectedJob.views_count || 0}</div>
                        <div className="text-sm text-blue-200">Vues</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <AnalyticsDashboard data={analyticsData} />
            </div>
          )}

          {activeTab === 'premium' && <PremiumPlans onNavigateToProfile={() => setActiveTab('profile')} />}

          {activeTab === 'profile' && <RecruiterProfileForm />}
          </div>
        </div>

        {/* Profile Modal */}
        {showProfileModal && selectedApplicationForProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-[#0E2F56] to-blue-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Profil du candidat</h2>
                  <button
                    onClick={() => setShowProfileModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {selectedApplicationForProfile.first_name} {selectedApplicationForProfile.last_name}
                    </h3>
                    {selectedApplicationForProfile.candidate_profile?.title && (
                      <p className="text-[#0E2F56] font-medium">{selectedApplicationForProfile.candidate_profile.title}</p>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-700 mb-2">Coordonnées</h4>
                    <p className="text-sm text-gray-600">Email: {selectedApplicationForProfile.email}</p>
                    {selectedApplicationForProfile.phone && (
                      <p className="text-sm text-gray-600">Téléphone: {selectedApplicationForProfile.phone}</p>
                    )}
                  </div>

                  {selectedApplicationForProfile.candidate_profile && (
                    <>
                      {selectedApplicationForProfile.candidate_profile.experience_years && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Expérience</h4>
                          <p className="text-sm text-gray-600">{selectedApplicationForProfile.candidate_profile.experience_years} années</p>
                        </div>
                      )}

                      {selectedApplicationForProfile.candidate_profile.education && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Formation</h4>
                          <p className="text-sm text-gray-600">{selectedApplicationForProfile.candidate_profile.education}</p>
                        </div>
                      )}

                      {selectedApplicationForProfile.candidate_profile.skills && selectedApplicationForProfile.candidate_profile.skills.length > 0 && (
                        <div className="border-t pt-4">
                          <h4 className="font-semibold text-gray-700 mb-2">Compétences</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedApplicationForProfile.candidate_profile.skills.map((skill: string, idx: number) => (
                              <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedApplicationForProfile.message && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Message de motivation</h4>
                      <p className="text-sm text-gray-600">{selectedApplicationForProfile.message}</p>
                    </div>
                  )}

                  <div className="border-t pt-4 flex gap-3">
                    {selectedApplicationForProfile.cv_url && (
                      <button
                        onClick={() => handleDownloadCV(selectedApplicationForProfile.cv_url)}
                        className="flex-1 px-4 py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition font-medium flex items-center justify-center gap-2"
                      >
                        <Download className="w-5 h-5" />
                        Télécharger le CV
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        handleSendMessage(selectedApplicationForProfile.id);
                      }}
                      className="flex-1 px-4 py-3 bg-[#FF8C00] text-white rounded-lg hover:bg-orange-600 transition font-medium flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-5 h-5" />
                      Envoyer un message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {showMessageModal && selectedApplicationForMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full">
              <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 p-6 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Envoyer un message</h2>
                  <button
                    onClick={() => setShowMessageModal(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  La messagerie intégrée sera bientôt disponible. Pour l'instant, vous pouvez contacter le candidat par email.
                </p>
                <button
                  onClick={() => {
                    const app = applications.find(a => a.id === selectedApplicationForMessage);
                    if (app?.email) {
                      window.location.href = `mailto:${app.email}`;
                    }
                    setShowMessageModal(false);
                  }}
                  className="w-full px-4 py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-800 transition font-medium"
                >
                  Ouvrir l'email
                </button>
              </div>
            </div>
          </div>
        )}

        {showPublicationSuccessModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {isSubscribed ? 'Offre publiée avec succès !' : 'Offre soumise avec succès !'}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {isSubscribed ? 'Votre annonce est maintenant en ligne' : 'Votre annonce est en cours de validation'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPublicationSuccessModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {isSubscribed ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-green-100 p-2 rounded-lg">
                          <Sparkles className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 text-lg mb-2">
                            Abonnement Premium Actif
                          </h3>
                          <p className="text-green-800">
                            Votre entreprise dispose d'un abonnement premium actif. Votre offre a été automatiquement publiée et est maintenant visible par tous les candidats.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 mb-1">Offre en ligne immédiatement</h4>
                          <p className="text-blue-800 text-sm">
                            Vous pouvez commencer à recevoir des candidatures dès maintenant. Les candidats peuvent voir et postuler à votre offre.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 text-purple-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-purple-900 mb-1">Notifications actives</h4>
                          <p className="text-purple-800 text-sm">
                            Vous recevrez une notification pour chaque nouvelle candidature reçue.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-blue-900 text-lg mb-2">
                            Offre enregistrée
                          </h3>
                          <p className="text-blue-800">
                            Votre offre a été enregistrée et sera examinée par notre équipe d'administration avant sa publication.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="bg-amber-100 p-2 rounded-lg">
                          <CreditCard className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-amber-900 text-lg mb-2">
                            Options de publication
                          </h3>
                          <div className="space-y-3">
                            <div className="flex items-start gap-2">
                              <div className="bg-amber-200 rounded-full w-2 h-2 mt-2"></div>
                              <p className="text-amber-900">
                                <span className="font-semibold">Publication unique :</span> 50 000 GNF par offre
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <div className="bg-amber-200 rounded-full w-2 h-2 mt-2"></div>
                              <p className="text-amber-900">
                                <span className="font-semibold">Abonnement Premium :</span> Publications illimitées + validation automatique
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-gray-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">Validation administrative</h4>
                          <p className="text-gray-700 text-sm">
                            Un administrateur va vérifier et valider votre offre avant sa mise en ligne. Ce processus garantit la qualité des offres sur notre plateforme.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <Bell className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900 mb-1">Notification de publication</h4>
                          <p className="text-green-800 text-sm">
                            Vous recevrez une notification dès que votre offre sera publiée et visible par les candidats.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                      <div className="flex items-center gap-3 mb-3">
                        <Sparkles className="w-6 h-6" />
                        <h4 className="font-bold text-lg">Passez au Premium dès maintenant !</h4>
                      </div>
                      <p className="text-blue-100 mb-4">
                        Bénéficiez de publications illimitées, de validations automatiques et d'outils de recrutement avancés.
                      </p>
                      <button
                        onClick={() => {
                          setShowPublicationSuccessModal(false);
                          setActiveTab('subscription');
                        }}
                        className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
                      >
                        Découvrir les offres Premium
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-gray-600 font-medium">
                      Merci pour votre patience et votre confiance ! 🙏
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowPublicationSuccessModal(false)}
                    className="px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
