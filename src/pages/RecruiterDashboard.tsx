import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  MessageSquare,
  BarChart3,
  Wand2,
  Download,
  Sparkles,
  Plus,
  Filter,
  List,
  Kanban,
  FileText,
  TrendingUp,
  Settings,
  Target,
  Package,
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
import PurchasedProfiles from './PurchasedProfiles';
import RecentJobsCard from '../components/recruiter/RecentJobsCard';
import RecentApplicationsCard from '../components/recruiter/RecentApplicationsCard';
import CandidateProfileModal from '../components/recruiter/CandidateProfileModal';
import ExportModal from '../components/recruiter/ExportModal';
import SendMessageModal from '../components/recruiter/SendMessageModal';
import { sampleJobs, sampleApplications, sampleWorkflowStages } from '../utils/sampleJobsData';
import { recruiterDashboardService, DashboardMetrics, RecentJob, RecentApplication } from '../services/recruiterDashboardService';

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

type Tab = 'dashboard' | 'projects' | 'applications' | 'ai-generator' | 'messages' | 'analytics' | 'premium' | 'profile' | 'purchased-profiles';

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
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedApplicationForMessage, setSelectedApplicationForMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  useEffect(() => {
    if (company?.id && activeTab === 'dashboard') {
      loadDashboardData();
    }
  }, [company?.id, activeTab]);

  const loadDashboardData = async () => {
    if (!company?.id) return;

    setLoadingDashboard(true);

    const [metrics, jobs, apps] = await Promise.all([
      recruiterDashboardService.getMetrics(company.id),
      recruiterDashboardService.getRecentJobs(company.id, 5),
      recruiterDashboardService.getRecentApplications(company.id, 10)
    ]);

    if (metrics) setDashboardMetrics(metrics);
    setRecentJobs(jobs);
    setRecentApplications(apps);

    setLoadingDashboard(false);
  };

  useEffect(() => {
    if (profile && !loading && profile.user_type === 'recruiter') {
      if (!company && activeTab !== 'profile') {
        setActiveTab('profile');
      }
    }
  }, [profile, loading, company]);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (companyData) {
      console.log('Company loaded:', companyData);
      console.log('Subscription tier:', companyData.subscription_tier);
      setCompany(companyData);

      const { data: stagesData } = await supabase
        .from('workflow_stages')
        .select('*')
        .eq('company_id', companyData.id)
        .order('stage_order');

      if (stagesData && stagesData.length > 0) {
        setWorkflowStages(stagesData);
      } else {
        console.warn('⚠️ No workflow stages found for company, should have been created automatically');
        setWorkflowStages([]);
      }

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (jobsData && jobsData.length > 0) {
        setJobs(jobsData);

        const jobIds = jobsData.map(j => j.id);
        const { data: appsData, error: appsError } = await supabase
          .from('applications')
          .select(`
            *,
            candidate:profiles!applications_candidate_id_fkey(
              id,
              full_name,
              email,
              phone,
              avatar_url
            ),
            candidate_profile:candidate_profiles!candidate_profiles_profile_id_fkey(
              title,
              experience_years,
              education_level,
              skills
            )
          `)
          .in('job_id', jobIds)
          .order('applied_at', { ascending: false });

        if (appsError) {
          console.error('Error loading applications:', appsError);
        }

        console.log('✅ Loaded applications from DB:', appsData?.length || 0);
        setApplications(appsData || []);
      } else {
        console.log('ℹ️ No jobs found');
        setJobs([]);
        setApplications([]);
      }
    } else {
      console.log('ℹ️ No company profile found, please complete your profile');
      setWorkflowStages([]);
      setJobs([]);
      setApplications([]);
    }

    setLoading(false);
  };

  const handlePublishJob = async (data: JobFormData) => {
    if (!company?.id) {
      alert("Veuillez d'abord créer votre profil entreprise");
      return;
    }

    let fullDescription = `# ${data.title}\n\n`;
    fullDescription += `**Catégorie:** ${data.category} | **Contrat:** ${data.contract_type} | **Postes:** ${data.position_count}\n\n`;

    fullDescription += `## Présentation du poste\n${data.description}\n\n`;

    if (data.responsibilities) {
      fullDescription += `## Missions principales\n${data.responsibilities}\n\n`;
    }

    if (data.profile) {
      fullDescription += `## Profil recherché\n${data.profile}\n\n`;
    }

    if (data.skills.length > 0) {
      fullDescription += `## Compétences clés\n${data.skills.join(' • ')}\n\n`;
    }

    fullDescription += `## Qualifications\n`;
    fullDescription += `- **Niveau d'études:** ${data.education_level}\n`;
    fullDescription += `- **Expérience:** ${data.experience_required}\n`;
    if (data.languages.length > 0) {
      fullDescription += `- **Langues:** ${data.languages.join(', ')}\n`;
    }
    fullDescription += `\n`;

    if (data.salary_range) {
      fullDescription += `## Rémunération\n`;
      fullDescription += `- **Salaire:** ${data.salary_range}\n`;
      fullDescription += `- **Type:** ${data.salary_type}\n`;
      if (data.benefits.length > 0) {
        fullDescription += `- **Avantages:** ${data.benefits.join(', ')}\n`;
      }
      fullDescription += `\n`;
    }

    if (data.company_description) {
      fullDescription += `## À propos de l'entreprise\n${data.company_description}\n\n`;
    }

    fullDescription += `## Modalités de candidature\n`;
    fullDescription += `- **Email:** ${data.application_email}\n`;
    fullDescription += `- **Date limite:** ${data.deadline}\n`;
    if (data.required_documents.length > 0) {
      fullDescription += `- **Documents requis:** ${data.required_documents.join(', ')}\n`;
    }
    if (data.application_instructions) {
      fullDescription += `\n${data.application_instructions}\n`;
    }
    fullDescription += `\n`;

    fullDescription += `## Conformité légale\nPoste soumis au Code du Travail Guinéen (Loi L/2014/072/CNT du 16 janvier 2014).\nNous encourageons les candidatures guinéennes dans le cadre de la politique de guinéisation.`;

    const { error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: data.title,
      description: fullDescription,
      location: data.location,
      contract_type: data.contract_type,
      department: data.company_name,
      experience_level: data.experience_required,
      education_level: data.education_level,
      application_deadline: data.deadline,
      required_skills: data.skills,
      status: 'published',
    });

    if (!error) {
      setShowJobForm(false);
      await loadData();
      setActiveTab('projects');
      alert('✅ Offre publiée avec succès !');
    } else {
      alert('❌ Erreur lors de la publication de l\'offre');
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

  const stats = dashboardMetrics ? {
    totalJobs: dashboardMetrics.total_jobs,
    activeJobs: dashboardMetrics.active_jobs,
    totalApplications: dashboardMetrics.total_applications,
    avgTimeToHire: dashboardMetrics.avg_time_to_hire_days,
    avgMatchingScore: dashboardMetrics.avg_matching_score,
    thisWeekApplications: dashboardMetrics.this_week_applications,
  } : {
    totalJobs: company ? jobs.length : 0,
    activeJobs: company ? jobs.filter(j => j.status === 'published').length : 0,
    totalApplications: company ? applications.length : 0,
    avgTimeToHire: 0,
    avgMatchingScore: 0,
  };


  const filteredApplications = applications.filter(app => {
    const categoryMatch = filterCategory === 'all' || app.ai_category === filterCategory;
    const jobMatch = selectedJobFilter === 'all' || app.job_id === selectedJobFilter;
    return categoryMatch && jobMatch;
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
    { id: 'projects', label: 'Mes projets', icon: Briefcase },
    { id: 'applications', label: 'Candidatures', icon: Users, count: dashboardMetrics?.total_applications || applications.length },
    { id: 'purchased-profiles', label: 'Profils Achetés', icon: Package },
    { id: 'ai-generator', label: 'Publier une offre', icon: Plus },
    { id: 'messages', label: 'Messagerie', icon: MessageSquare },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    { id: 'premium', label: 'Premium', icon: Sparkles },
    { id: 'profile', label: 'Mon Profil', icon: Settings },
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
      {showJobForm && (
        <JobPublishForm
          onPublish={handlePublishJob}
          onClose={() => setShowJobForm(false)}
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
              candidate: {
                id: app.candidate?.id,
                full_name: app.candidate?.full_name || 'Candidat',
                email: app.candidate?.email || '',
                avatar_url: app.candidate?.avatar_url,
              },
              candidate_profile: {
                title: app.candidate_profile?.title,
                experience_years: app.candidate_profile?.experience_years,
                education_level: app.candidate_profile?.education_level,
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
            <div className="animate-fade-in">
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
            <button
              onClick={() => setShowJobForm(true)}
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
        </div>

        <div className="pb-12">
          {activeTab === 'dashboard' && (
            <div>
              <DashboardStats stats={stats} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <RecentJobsCard
                  jobs={recentJobs}
                  onJobClick={(jobId) => onNavigate('job-detail', jobId)}
                  loading={loadingDashboard}
                />

                <RecentApplicationsCard
                  applications={recentApplications}
                  onApplicationClick={(applicationId, candidateId) => {
                    console.log('Application clicked:', applicationId, candidateId);
                  }}
                  loading={loadingDashboard}
                />
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
                  onClick={() => setShowJobForm(true)}
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
                    onClick={() => setShowJobForm(true)}
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
                      className="bg-white rounded-2xl border-2 border-gray-200 p-6 card-hover cursor-pointer relative overflow-hidden group animate-slide-up"
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => onNavigate('job-detail', job.id)}
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
                        <div className="p-4 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-50 rounded-xl border border-blue-200 relative overflow-hidden">
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
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-50 via-green-100 to-green-50 rounded-xl border border-green-200 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-16 h-16 bg-green-200/30 rounded-full -mr-8 -mt-8"></div>
                          <div className="relative">
                            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                              {job.applications_count || 0}
                            </div>
                            <div className="text-sm text-green-700 font-medium flex items-center mt-1">
                              <Users className="w-3.5 h-3.5 mr-1" />
                              Candidatures
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-4 relative z-10">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('applications');
                              setSelectedJobFilter(job.id);
                            }}
                          >
                            <Users className="w-4 h-4" />
                            <span>Candidatures</span>
                          </button>
                          <button
                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('analytics');
                              setSelectedJobAnalytics(job.id);
                            }}
                          >
                            <BarChart3 className="w-4 h-4" />
                            <span>Analyses</span>
                          </button>
                        </div>
                        <button
                          className="w-full px-4 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-[#0E2F56]"
                          onClick={(e) => {
                            console.log('🔘 Matching IA button clicked!');
                            e.stopPropagation();
                            handleStartMatching(job);
                          }}
                        >
                          <Target className="w-5 h-5" />
                          <Sparkles className="w-4 h-4" />
                          <span>Matching IA</span>
                        </button>
                      </div>

                      <button
                        className="w-full px-4 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-all duration-200 relative z-10 group border-2 border-gray-300 hover:border-gray-400"
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-gray-900">
                  Candidatures reçues ({filteredApplications.length})
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-gray-200 shadow-sm">
                    <Briefcase className="w-5 h-5 text-gray-500" />
                    <select
                      value={selectedJobFilter}
                      onChange={(e) => setSelectedJobFilter(e.target.value)}
                      className="border-none focus:ring-0 text-sm font-medium"
                    >
                      <option value="all">Tous les projets</option>
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>
                          {job.title} ({applications.filter(app => app.job_id === job.id).length})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border-2 border-gray-200 shadow-sm">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="border-none focus:ring-0 text-sm font-medium"
                    >
                      <option value="all">Tous les profils</option>
                      <option value="strong">🟢 Profils forts</option>
                      <option value="medium">🟡 Profils moyens</option>
                      <option value="weak">🔴 Profils faibles</option>
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

                  <button
                    onClick={() => setShowExportModal(true)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-200 text-gray-700 font-medium rounded-xl transition flex items-center gap-2 shadow-sm"
                  >
                    <Download className="w-5 h-5" />
                    Exporter
                  </button>
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center">
                  <Users className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Aucune candidature
                  </h3>
                  <p className="text-gray-600">
                    Les candidatures apparaîtront ici une fois que les candidats postuleront
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
                      full_name: app.candidate?.profile?.full_name || 'Candidat',
                      email: app.candidate?.profile?.email || '',
                      phone: app.candidate?.profile?.phone,
                      avatar_url: app.candidate?.profile?.avatar_url,
                    },
                    candidate_profile: {
                      title: app.candidate?.title,
                      experience_years: app.candidate?.experience_years,
                      education_level: app.candidate?.education_level,
                      skills: app.candidate?.skills,
                    },
                  }))}
                  stages={workflowStages.map(stage => ({
                    id: stage.id,
                    name: stage.stage_name,
                    color: stage.stage_color,
                  }))}
                  onMoveApplication={handleMoveApplication}
                  onViewProfile={(id) => {
                    setSelectedApplicationId(id);
                    setShowProfileModal(true);
                  }}
                  onMessage={(id) => {
                    setSelectedApplicationForMessage(id);
                    setShowMessageModal(true);
                  }}
                />
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {filteredApplications.map((app) => (
                    <ApplicationCard
                      key={app.id}
                      application={{
                        id: app.id,
                        ai_score: app.ai_score || 0,
                        ai_category: app.ai_category || 'medium',
                        workflow_stage: app.workflow_stage || 'received',
                        applied_at: app.applied_at,
                        cover_letter: app.cover_letter,
                        cv_url: app.cv_url,
                        candidate: {
                          full_name: app.candidate?.profile?.full_name || 'Candidat',
                          email: app.candidate?.profile?.email || '',
                          phone: app.candidate?.profile?.phone,
                          avatar_url: app.candidate?.profile?.avatar_url,
                        },
                        candidate_profile: {
                          title: app.candidate?.title,
                          experience_years: app.candidate?.experience_years,
                          education_level: app.candidate?.education_level,
                          skills: app.candidate?.skills,
                        },
                      }}
                      onMessage={(appId) => {
                        setSelectedApplicationForMessage(appId);
                        setShowMessageModal(true);
                      }}
                      onViewProfile={(appId) => {
                        setSelectedApplicationId(appId);
                        setShowProfileModal(true);
                      }}
                    />
                  ))}
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
                  onClick={() => setShowJobForm(true)}
                  className="w-full py-5 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] hover:from-[#1a4275] hover:to-[#0E2F56] text-white font-bold text-lg rounded-2xl transition shadow-2xl flex items-center justify-center gap-3"
                >
                  <Plus className="w-7 h-7" />
                  Publier une offre
                </button>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-16 text-center">
              <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Messagerie RH</h3>
              <p className="text-gray-600 text-lg mb-2">
                Communiquez directement avec les candidats
              </p>
              <p className="text-sm text-gray-500 mt-4 px-4 py-2 bg-gray-50 rounded-lg inline-block">
                Fonctionnalité disponible prochainement
              </p>
            </div>
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

          {activeTab === 'purchased-profiles' && <PurchasedProfiles profile={profile} />}
        </div>
      </div>

      {showProfileModal && selectedApplicationId && (
        <CandidateProfileModal
          applicationId={selectedApplicationId}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedApplicationId(null);
          }}
        />
      )}

      {showExportModal && (
        <ExportModal
          jobs={jobs}
          selectedJobId={selectedJobFilter}
          companyId={company?.id}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {showMessageModal && selectedApplicationForMessage && (
        <SendMessageModal
          applicationId={selectedApplicationForMessage}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedApplicationForMessage(null);
          }}
        />
      )}
    </div>
  );
}
