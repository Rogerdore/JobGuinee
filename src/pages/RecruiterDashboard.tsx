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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardStats from '../components/recruiter/DashboardStats';
import ApplicationCard from '../components/recruiter/ApplicationCard';
import AIJobGenerator, { JobGenerationData } from '../components/recruiter/AIJobGenerator';
import PremiumPlans from '../components/recruiter/PremiumPlans';
import KanbanBoard from '../components/recruiter/KanbanBoard';
import AnalyticsDashboard from '../components/recruiter/AnalyticsDashboard';
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

type Tab = 'dashboard' | 'projects' | 'applications' | 'ai-generator' | 'messages' | 'analytics' | 'premium';

export default function RecruiterDashboard({ onNavigate }: RecruiterDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const { data: companyData } = await supabase
      .from('companies')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (companyData) {
      setCompany(companyData);

      const { data: stagesData } = await supabase
        .from('workflow_stages')
        .select('*')
        .eq('company_id', companyData.id)
        .order('stage_order');

      if (stagesData && stagesData.length > 0) {
        setWorkflowStages(stagesData);
      } else {
        setWorkflowStages(sampleWorkflowStages);
      }

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (jobsData && jobsData.length > 0) {
        setJobs(jobsData);

        const jobIds = jobsData.map(j => j.id);
        const { data: appsData } = await supabase
          .from('applications')
          .select(`
            *,
            candidate:candidate_profiles!applications_candidate_id_fkey(
              id,
              title,
              experience_years,
              education_level,
              skills,
              profile:profiles!candidate_profiles_profile_id_fkey(
                full_name,
                email,
                phone,
                avatar_url
              )
            )
          `)
          .in('job_id', jobIds)
          .order('applied_at', { ascending: false });

        if (appsData && appsData.length > 0) {
          setApplications(appsData);
        } else {
          setApplications(sampleApplications);
        }
      } else {
        setJobs(sampleJobs);
        setApplications(sampleApplications);
      }
    } else {
      setWorkflowStages(sampleWorkflowStages);
      setJobs(sampleJobs);
      setApplications(sampleApplications);
    }

    setLoading(false);
  };

  const handleAIGenerate = async (data: JobGenerationData) => {
    const generatedDescription = `
# ${data.job_title}

## Description du poste
Nous recherchons un(e) ${data.job_title} talentueux(se) pour rejoindre notre équipe ${data.department ? `au sein du département ${data.department}` : ''}.

## Missions principales
- Assurer la ${data.job_title.toLowerCase()} conformément aux standards de qualité
- Collaborer avec les équipes techniques et opérationnelles
- Participer à l'amélioration continue des processus
- Contribuer au développement et à l'innovation
- Respecter les normes de sécurité et de qualité en vigueur

## Profil recherché
Nous recherchons un profil de niveau ${data.experience_level} avec :
- Formation supérieure pertinente
- Expérience significative dans un poste similaire
- Excellentes capacités d'analyse et de résolution de problèmes
- Autonomie et esprit d'équipe
- Maîtrise des outils professionnels du secteur

## Compétences techniques requises
- Expertise technique dans le domaine
- Capacité d'adaptation et d'apprentissage
- Rigueur et sens de l'organisation
- Communication efficace

## Conditions
- Type de contrat : ${data.contract_type}
- Localisation : ${data.location}
- Département : ${data.department || 'Non spécifié'}
- Rémunération : Selon profil et expérience

## Conformité légale
Poste soumis au Code du Travail Guinéen (Loi L/2014/072/CNT du 16 janvier 2014).
Nous encourageons les candidatures guinéennes dans le cadre de la politique de guinéisation.

---
Pour postuler, merci d'envoyer votre CV et lettre de motivation via JobGuinée.
    `.trim();

    if (!company?.id) {
      alert("Veuillez d'abord créer votre profil entreprise");
      return;
    }

    const { error } = await supabase.from('jobs').insert({
      company_id: company.id,
      title: data.job_title,
      description: generatedDescription,
      location: data.location,
      contract_type: data.contract_type,
      department: data.department,
      experience_level: data.experience_level,
      ai_generated: true,
      status: 'draft',
    });

    if (!error) {
      setShowAIGenerator(false);
      await loadData();
      setActiveTab('projects');
      alert('✅ Offre générée avec succès ! Vous pouvez maintenant la modifier et la publier.');
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

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: applications.length,
    avgTimeToHire: 14,
  };

  const analyticsData = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: applications.length,
    strongProfiles: applications.filter(a => a.ai_category === 'strong').length,
    mediumProfiles: applications.filter(a => a.ai_category === 'medium').length,
    weakProfiles: applications.filter(a => a.ai_category === 'weak').length,
    avgTimeToHire: 14,
    avgAIScore: applications.length > 0
      ? Math.round(applications.reduce((acc, app) => acc + (app.ai_score || 0), 0) / applications.length)
      : 0,
  };

  const filteredApplications = filterCategory === 'all'
    ? applications
    : applications.filter(app => app.ai_category === filterCategory);

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projects', label: 'Mes projets', icon: Briefcase },
    { id: 'applications', label: 'Candidatures', icon: Users, count: applications.length },
    { id: 'ai-generator', label: 'Génération IA', icon: Wand2 },
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
      {showAIGenerator && (
        <AIJobGenerator
          onGenerate={handleAIGenerate}
          onClose={() => setShowAIGenerator(false)}
        />
      )}

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
              onClick={() => setShowAIGenerator(true)}
              className="px-8 py-4 bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-[#FF8C00] text-white font-bold rounded-xl transition-all duration-300 shadow-2xl flex items-center gap-3 group hover:scale-105 transform"
            >
              <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
              <span>Générer une offre IA</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-2xl -mt-6 mb-6 overflow-hidden border-2 border-gray-100">
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
                        onClick={() => setShowAIGenerator(true)}
                        className="mt-4 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4275] transition"
                      >
                        Créer une offre
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {jobs.slice(0, 3).map((job, index) => (
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
                          <p className="text-sm text-gray-600 mb-3 flex items-center">
                            <FileText className="w-3.5 h-3.5 mr-1.5" />
                            {job.location}
                          </p>
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
                      ))}
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
                      {applications.slice(0, 3).map((app, index) => (
                        <div
                          key={app.id}
                          className="p-4 border-2 border-gray-200 rounded-xl card-hover bg-white animate-slide-up overflow-hidden relative"
                          style={{ animationDelay: `${index * 0.1}s` }}
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full opacity-50"></div>
                          <div className="flex items-center justify-between relative z-10">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 hover:text-[#0E2F56] transition-colors">
                                {app.candidate?.profile?.full_name || 'Candidat'}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {app.candidate?.title || 'Profil'}
                              </p>
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
                      ))}
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
                  onClick={() => setShowAIGenerator(true)}
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
                    onClick={() => setShowAIGenerator(true)}
                    className="px-8 py-4 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] hover:from-[#1a4275] hover:to-[#0E2F56] text-white font-bold rounded-xl transition shadow-lg"
                  >
                    Créer une offre avec l'IA
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

                      <button
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] hover:from-[#1a4275] hover:to-[#0E2F56] text-white font-semibold rounded-xl transition-all duration-300 relative z-10 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigate('job-detail', job.id);
                        }}
                      >
                        <span className="flex items-center justify-center">
                          Gérer le projet
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
                  Candidatures reçues ({applications.length})
                </h2>
                <div className="flex items-center gap-4">
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
                    onClick={() => alert('Fonctionnalité d\'export disponible prochainement')}
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
                  onViewProfile={(id) => console.log('View profile', id)}
                  onMessage={(id) => console.log('Message', id)}
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
                      onMessage={(appId) => console.log('Message', appId)}
                      onViewProfile={(appId) => console.log('View profile', appId)}
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
                      <Wand2 className="w-12 h-12" />
                    </div>
                    <div>
                      <h2 className="text-4xl font-bold mb-2">Générateur IA d'offres d'emploi</h2>
                      <p className="text-blue-100 text-lg">
                        Créez des annonces professionnelles et conformes en quelques secondes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-200 p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Comment ça marche ?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200">
                    <div className="w-16 h-16 bg-[#0E2F56] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                      1
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Renseignez les infos</h4>
                    <p className="text-sm text-gray-600">Poste, localisation, expérience requise</p>
                  </div>
                  <div className="text-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200">
                    <div className="w-16 h-16 bg-[#FF8C00] text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                      2
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">L'IA génère l'offre</h4>
                    <p className="text-sm text-gray-600">Description, missions, profil, compétences</p>
                  </div>
                  <div className="text-center p-8 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200">
                    <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
                      3
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Publiez</h4>
                    <p className="text-sm text-gray-600">Modifiez si besoin et lancez le recrutement</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="w-full py-5 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] hover:from-[#1a4275] hover:to-[#0E2F56] text-white font-bold text-lg rounded-2xl transition shadow-2xl flex items-center justify-center gap-3"
                >
                  <Wand2 className="w-7 h-7" />
                  Lancer le générateur IA
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

          {activeTab === 'analytics' && <AnalyticsDashboard data={analyticsData} />}

          {activeTab === 'premium' && <PremiumPlans />}
        </div>
      </div>
    </div>
  );
}
