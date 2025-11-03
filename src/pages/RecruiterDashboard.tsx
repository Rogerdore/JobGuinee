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
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DashboardStats from '../components/recruiter/DashboardStats';
import ApplicationCard from '../components/recruiter/ApplicationCard';
import AIJobGenerator, { JobGenerationData } from '../components/recruiter/AIJobGenerator';
import PremiumPlans from '../components/recruiter/PremiumPlans';

interface RecruiterDashboardProps {
  onNavigate: (page: string, jobId?: string) => void;
}

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
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
}

type Tab = 'dashboard' | 'projects' | 'applications' | 'ai-generator' | 'messages' | 'analytics' | 'premium';

export default function RecruiterDashboard({ onNavigate }: RecruiterDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (jobsData) {
        setJobs(jobsData);

        const jobIds = jobsData.map(j => j.id);
        if (jobIds.length > 0) {
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

          if (appsData) {
            setApplications(appsData);
          }
        }
      }
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
- Rémunération : Selon profil et expérience

## Conformité légale
Poste soumis au Code du Travail Guinéen (Loi L/2014/072/CNT du 16 janvier 2014).
Nous encourageons les candidatures guinéennes dans le cadre de la politique de guinéisation.

---
Pour postuler, merci d'envoyer votre CV et lettre de motivation via JobGuinée.
    `.trim();

    if (!company?.id) {
      alert('Veuillez d\'abord créer votre profil entreprise');
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

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter(j => j.status === 'published').length,
    totalApplications: applications.length,
    avgTimeToHire: 14,
  };

  const filteredApplications = filterCategory === 'all'
    ? applications
    : applications.filter(app => app.ai_category === filterCategory);

  const tabs = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projects', label: 'Mes projets', icon: Briefcase },
    { id: 'applications', label: 'Candidatures', icon: Users },
    { id: 'ai-generator', label: 'Génération IA', icon: Wand2 },
    { id: 'messages', label: 'Messagerie', icon: MessageSquare },
    { id: 'analytics', label: 'Analyses', icon: BarChart3 },
    { id: 'premium', label: 'Premium', icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement de votre espace recruteur...</p>
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

      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-8 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Espace Recruteur</h1>
              <p className="text-blue-100">Gestion complète du processus de recrutement avec IA</p>
            </div>
            <button
              onClick={() => setShowAIGenerator(true)}
              className="px-6 py-3 bg-white text-blue-900 font-semibold rounded-lg hover:bg-blue-50 transition shadow-lg flex items-center gap-2"
            >
              <Wand2 className="w-5 h-5" />
              Générer une offre IA
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-4">
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`px-6 py-4 font-medium whitespace-nowrap flex items-center gap-2 transition ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-900 text-blue-900 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  {tab.id === 'applications' && applications.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 bg-blue-900 text-white text-xs rounded-full">
                      {applications.length}
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
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Projets récents</h3>
                  {jobs.slice(0, 3).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucun projet de recrutement</p>
                  ) : (
                    <div className="space-y-3">
                      {jobs.slice(0, 3).map((job) => (
                        <div key={job.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer">
                          <h4 className="font-semibold text-gray-900">{job.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{job.location}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{job.applications_count || 0} candidatures</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              job.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-4">Candidatures récentes</h3>
                  {applications.slice(0, 3).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Aucune candidature récente</p>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 3).map((app) => (
                        <div key={app.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {app.candidate?.profile?.full_name || 'Candidat'}
                              </h4>
                              <p className="text-sm text-gray-600">{app.candidate?.title || 'Profil'}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-blue-900">{app.ai_score || 0}%</div>
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
                <h2 className="text-2xl font-bold text-gray-900">
                  Mes projets de recrutement ({jobs.length})
                </h2>
                <button
                  onClick={() => onNavigate('create-job')}
                  className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition shadow-lg flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nouvelle offre
                </button>
              </div>

              {jobs.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Aucun projet de recrutement pour le moment</p>
                  <button
                    onClick={() => setShowAIGenerator(true)}
                    className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
                  >
                    Créer une offre avec l'IA
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {jobs.map((job) => (
                    <div key={job.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-xl text-gray-900 mb-2">{job.title}</h3>
                          <p className="text-gray-600">{job.location}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-2xl font-bold text-blue-900">{job.views_count || 0}</div>
                          <div className="text-sm text-gray-600">Vues</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">{job.applications_count || 0}</div>
                          <div className="text-sm text-gray-600">Candidatures</div>
                        </div>
                      </div>

                      <button
                        onClick={() => onNavigate('job-detail', job.id)}
                        className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium rounded-lg transition"
                      >
                        Voir le projet
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
                <h2 className="text-2xl font-bold text-gray-900">
                  Candidatures reçues ({applications.length})
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <Filter className="w-5 h-5 text-gray-500" />
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="border-none focus:ring-0 text-sm"
                    >
                      <option value="all">Tous les profils</option>
                      <option value="strong">🟢 Profils forts</option>
                      <option value="medium">🟡 Profils moyens</option>
                      <option value="weak">🔴 Profils faibles</option>
                    </select>
                  </div>
                  <button className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium rounded-lg transition flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Exporter
                  </button>
                </div>
              </div>

              {filteredApplications.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Aucune candidature pour le moment</p>
                </div>
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
              <div className="bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl p-8 text-white mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-4 bg-white/20 rounded-xl">
                    <Wand2 className="w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Générateur IA d'offres d'emploi</h2>
                    <p className="text-blue-100">
                      Créez des annonces professionnelles et conformes en quelques secondes
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Comment ça marche ?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      1
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Renseignez les infos</h4>
                    <p className="text-sm text-gray-600">Poste, localisation, expérience requise</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      2
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">L'IA génère l'offre</h4>
                    <p className="text-sm text-gray-600">Description, missions, profil, compétences</p>
                  </div>
                  <div className="text-center p-6 bg-blue-50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      3
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">Publiez</h4>
                    <p className="text-sm text-gray-600">Modifiez si besoin et lancez le recrutement</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowAIGenerator(true)}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-900 hover:from-blue-700 hover:to-blue-950 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-6 h-6" />
                  Lancer le générateur IA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Messagerie RH</h3>
              <p className="text-gray-600">Communiquez directement avec les candidats</p>
              <p className="text-sm text-gray-500 mt-4">Fonctionnalité disponible prochainement</p>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Analyses & Rapports RH</h3>
              <p className="text-gray-600">Visualisez vos indicateurs de performance</p>
              <p className="text-sm text-gray-500 mt-4">Fonctionnalité disponible prochainement</p>
            </div>
          )}

          {activeTab === 'premium' && <PremiumPlans />}
        </div>
      </div>
    </div>
  );
}
