import { useEffect, useState } from 'react';
import {
  MapPin, Building, Briefcase, DollarSign, Calendar, ArrowLeft,
  FileText, Users, GraduationCap, Globe, Mail, CheckCircle2,
  Clock, Tag, Languages, Edit
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Company } from '../lib/supabase';
import { sampleJobs } from '../utils/sampleJobsData';
import ApplicationModal from '../components/jobs/ApplicationModal';
import QuickApplyModal from '../components/jobs/QuickApplyModal';
import FormattedJobDescription from '../components/jobs/FormattedJobDescription';
import DynamicHead from '../components/DynamicHead';
import Breadcrumb from '../components/Breadcrumb';

interface JobDetailProps {
  jobId: string;
  onNavigate: (page: string) => void;
}

const parseJsonField = (field: any): string[] => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export default function JobDetail({ jobId, onNavigate }: JobDetailProps) {
  console.log('🎯 JobDetail component rendered with jobId:', jobId);

  const { user, profile } = useAuth();
  const [job, setJob] = useState<(Job & { companies: Company }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [showQuickApplyModal, setShowQuickApplyModal] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const isRecruiter = profile?.user_type === 'recruiter';
  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';
  const isJobOwner = isRecruiter && job && user && job.recruiter_id === user.id;

  const handleGoBack = () => {
    if (isRecruiter) {
      onNavigate('recruiter-dashboard');
    } else {
      onNavigate('jobs');
    }
  };

  const handleEditJob = () => {
    if (isJobOwner) {
      console.log('🔧 Edit job button clicked');
      console.log('   Job ID:', jobId);
      // Store the job ID to edit in localStorage BEFORE navigating
      localStorage.setItem('editJobId', jobId);
      console.log('   ✅ Stored editJobId in localStorage:', jobId);
      // Navigate to recruiter dashboard with edit mode
      console.log('   🔄 Navigating to recruiter-dashboard');
      onNavigate('recruiter-dashboard');
    }
  };

  useEffect(() => {
    const init = async () => {
      await incrementViews();
      await loadJob();
      if (user) checkIfApplied();
    };
    init();
  }, [jobId, user]);

  const loadJob = async () => {
    console.log('🔍 Loading job with ID:', jobId);
    const { data, error } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('id', jobId)
      .maybeSingle();

    console.log('📦 Job data received:', data);
    console.log('❌ Job error:', error);

    if (data) {
      console.log('✅ Setting job data');
      setJob(data as any);
    } else if (jobId.startsWith('sample-')) {
      console.log('📋 Loading sample job');
      const sampleJob = sampleJobs.find(j => j.id === jobId);
      if (sampleJob) {
        setJob({
          ...sampleJob,
          sector: sampleJob.department,
          companies: {
            id: sampleJob.company_id,
            company_name: sampleJob.company_name,
            logo_url: sampleJob.company_logo,
          }
        } as any);
      }
    } else {
      console.log('⚠️ No job found for ID:', jobId);
    }
    setLoading(false);
  };

  const incrementViews = async () => {
    if (jobId.startsWith('sample-')) {
      console.log('Skipping view increment for sample job:', jobId);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('increment_job_views', { job_id: jobId });
      if (error) {
        console.error('Error incrementing views:', error);
      } else {
        console.log('Views incremented successfully for job:', jobId);
      }
    } catch (error) {
      console.error('Exception incrementing views:', error);
    }
  };

  const checkIfApplied = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('candidate_id', user.id)
      .maybeSingle();

    setHasApplied(!!data);
  };

  const handleApply = () => {
    if (!user) {
      const confirmLogin = confirm(
        '⚠️ Vous devez créer un compte pour postuler\n\n' +
        'Créez votre compte gratuitement en quelques secondes pour:\n' +
        '• Postuler à cette offre\n' +
        '• Gérer vos candidatures\n' +
        '• Recevoir des alertes emploi\n\n' +
        'Cliquez sur OK pour vous inscrire'
      );

      if (confirmLogin) {
        onNavigate('login');
      }
      return;
    }

    if (profile?.user_type !== 'candidate') {
      alert('Seuls les candidats peuvent postuler aux offres d\'emploi');
      return;
    }

    setShowQuickApplyModal(true);
  };

  const handleApplicationSuccess = () => {
    setHasApplied(true);
    setShowQuickApplyModal(false);
    setShowApplicationModal(false);
    checkIfApplied();
  };

  const parseJobDescription = (description: string) => {
    const sections: { [key: string]: string } = {};
    const lines = description.split('\n');
    let currentSection = 'introduction';
    let currentContent = '';

    lines.forEach((line) => {
      if (line.startsWith('##')) {
        if (currentContent) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = line.replace('##', '').trim().toLowerCase();
        currentContent = '';
      } else if (line.trim()) {
        currentContent += line + '\n';
      }
    });

    if (currentContent) {
      sections[currentSection] = currentContent.trim();
    }

    return sections;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0E2F56]"></div>
          <p className="mt-4 text-gray-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Offre non trouvée</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const sections = job.description ? parseJobDescription(job.description) : {};

  const jobTitle = job ? `${job.title} - ${job.companies?.name || job.department || 'Emploi Guinée'}` : 'Offre d\'emploi';
  const jobDescription = job ? `Postulez pour ${job.title} à ${job.location}. ${job.contract_type} - ${job.experience_level || 'Tous niveaux'}` : '';
  const jobKeywords = job ? [
    job.title,
    job.location,
    job.contract_type,
    job.department || '',
    job.category || '',
    'emploi guinée',
    'offre emploi',
    'recrutement guinée',
    ...(job.keywords || [])
  ].filter(Boolean).join(', ') : '';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {job && (
        <DynamicHead
          title={jobTitle}
          description={jobDescription}
          keywords={jobKeywords}
          ogTitle={job.title}
          ogDescription={`${job.title} chez ${job.companies?.name || job.department || 'Emploi Guinée'}. ${job.location} - ${job.contract_type}`}
          ogType="article"
          canonical={`https://emploi-guinee.gn/jobs/${job.id}`}
        />
      )}

      {job && (
        <>
          <QuickApplyModal
            isOpen={showQuickApplyModal}
            onClose={() => setShowQuickApplyModal(false)}
            job={{
              id: job.id,
              title: job.title,
              company: job.companies?.name || job.department || ''
            }}
            onSuccess={handleApplicationSuccess}
            onCustomApply={() => {
              setShowQuickApplyModal(false);
              setShowApplicationModal(true);
            }}
          />

          <ApplicationModal
            isOpen={showApplicationModal}
            onClose={() => setShowApplicationModal(false)}
            job={{
              id: job.id,
              title: job.title,
              company: job.companies?.name || job.department || ''
            }}
            onSuccess={handleApplicationSuccess}
          />
        </>
      )}

      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <Breadcrumb
            items={[
              { label: 'Accueil', onClick: () => onNavigate('home') },
              { label: 'Offres d\'emploi', onClick: () => onNavigate('jobs') },
              { label: job?.title || 'Détail de l\'offre' }
            ]}
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-[#0E2F56] hover:text-[#1a4275] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isRecruiter ? 'Retour au tableau de bord' : 'Retour aux offres'}</span>
          </button>

          {isJobOwner && (
            <button
              onClick={handleEditJob}
              className="flex items-center space-x-2 px-6 py-3 bg-[#FF8C00] hover:bg-[#e67e00] text-white font-semibold rounded-lg transition shadow-lg"
            >
              <Edit className="w-4 h-4" />
              <span>Modifier l'offre</span>
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-3xl font-bold">{job.title}</h1>
                  {job.status === 'published' && (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                      Publiée
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <Building className="w-5 h-5" />
                  <span className="text-xl">{job.companies?.name || job.department}</span>
                </div>
                {job.location && (
                  <div className="flex items-center space-x-2 text-blue-100">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
              {job.companies?.logo_url && (
                <img
                  src={job.companies.logo_url}
                  alt={job.companies.name}
                  className="w-24 h-24 rounded-xl bg-white object-cover border-4 border-white/20"
                />
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {job.contract_type && (
                <div className="flex items-center space-x-3 bg-blue-50 p-4 rounded-xl border-2 border-blue-100">
                  <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Type de contrat</div>
                    <div className="font-bold text-gray-900">{job.contract_type}</div>
                  </div>
                </div>
              )}

              {job.experience_level && (
                <div className="flex items-center space-x-3 bg-orange-50 p-4 rounded-xl border-2 border-orange-100">
                  <div className="w-10 h-10 bg-[#FF8C00] rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Expérience</div>
                    <div className="font-bold text-gray-900">{job.experience_level}</div>
                  </div>
                </div>
              )}

              {job.education_level && (
                <div className="flex items-center space-x-3 bg-purple-50 p-4 rounded-xl border-2 border-purple-100">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Formation</div>
                    <div className="font-bold text-gray-900">{job.education_level}</div>
                  </div>
                </div>
              )}

              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center space-x-3 bg-green-50 p-4 rounded-xl border-2 border-green-100">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Salaire (GNF)</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {job.salary_min && job.salary_max
                        ? `${(job.salary_min / 1000000).toFixed(1)}M - ${(job.salary_max / 1000000).toFixed(1)}M`
                        : job.salary_min
                        ? `${(job.salary_min / 1000000).toFixed(1)}M+`
                        : `${(job.salary_max! / 1000000).toFixed(1)}M`}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Publié le</div>
                  <div className="font-bold text-gray-900 text-sm">
                    {new Date(job.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {job.deadline && (
                <div className="flex items-center space-x-3 bg-red-50 p-4 rounded-xl border-2 border-red-100">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Date limite</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {new Date(job.deadline).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {job.sector && (
                <div className="flex items-center space-x-3 bg-indigo-50 p-4 rounded-xl border-2 border-indigo-100">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Secteur</div>
                    <div className="font-bold text-gray-900">{job.sector}</div>
                  </div>
                </div>
              )}

              {job.views_count !== undefined && (
                <div className="flex items-center space-x-3 bg-yellow-50 p-4 rounded-xl border-2 border-yellow-100">
                  <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Vues</div>
                    <div className="font-bold text-gray-900">{job.views_count || 0}</div>
                  </div>
                </div>
              )}

              {job.category && (
                <div className="flex items-center space-x-3 bg-teal-50 p-4 rounded-xl border-2 border-teal-100">
                  <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Catégorie</div>
                    <div className="font-bold text-gray-900">{job.category}</div>
                  </div>
                </div>
              )}

              {job.positions_available && job.positions_available > 1 && (
                <div className="flex items-center space-x-3 bg-cyan-50 p-4 rounded-xl border-2 border-cyan-100">
                  <div className="w-10 h-10 bg-cyan-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Postes disponibles</div>
                    <div className="font-bold text-gray-900">{job.positions_available}</div>
                  </div>
                </div>
              )}

              {job.experience_required && (
                <div className="flex items-center space-x-3 bg-amber-50 p-4 rounded-xl border-2 border-amber-100">
                  <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Expérience requise</div>
                    <div className="font-bold text-gray-900">{job.experience_required}</div>
                  </div>
                </div>
              )}
            </div>

            {parseJsonField(job.required_skills).length > 0 && (
              <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-[#0E2F56]" />
                  <h3 className="text-lg font-bold text-gray-900">Compétences requises</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parseJsonField(job.required_skills).map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-[#0E2F56] text-white rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parseJsonField(job.languages).length > 0 && (
              <div className="mb-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Languages className="w-5 h-5 text-green-700" />
                  <h3 className="text-lg font-bold text-gray-900">Langues requises</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {parseJsonField(job.languages).map((language, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parseJsonField(job.benefits).length > 0 && (
              <div className="mb-8 p-6 bg-orange-50 border-2 border-orange-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#FF8C00]" />
                  <h3 className="text-lg font-bold text-gray-900">Avantages</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parseJsonField(job.benefits).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-[#FF8C00] flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-8">
              <div className="border-t-2 border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#FF8C00]" />
                  Description complète
                </h2>
                <div className="prose prose-blue max-w-none">
                  <FormattedJobDescription description={job.description} />
                </div>
              </div>

              {job.requirements && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#FF8C00]" />
                    Exigences et compétences
                  </h2>
                  <div className="prose prose-blue max-w-none">
                    <FormattedJobDescription description={job.requirements} />
                  </div>
                </div>
              )}

              {job.companies && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-6 h-6 text-[#FF8C00]" />
                    À propos de l'entreprise
                  </h2>
                  <div className="flex items-start space-x-4 bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                    {job.companies.logo_url && (
                      <img
                        src={job.companies.logo_url}
                        alt={job.companies.name}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-300"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">{job.companies.name}</h3>
                      {job.companies.description && (
                        <p className="text-gray-700 mb-3 leading-relaxed">{job.companies.description}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {job.companies.sector && (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span className="font-medium">Secteur:</span> {job.companies.sector}
                          </div>
                        )}
                        {job.companies.size && (
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span className="font-medium">Taille:</span> {job.companies.size}
                          </div>
                        )}
                        {job.companies.website && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4" />
                            <a
                              href={job.companies.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0E2F56] hover:text-[#1a4275] font-medium"
                            >
                              Site web →
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(job.application_email || job.required_documents || job.application_instructions) && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="w-6 h-6 text-[#FF8C00]" />
                    Comment postuler
                  </h2>
                  <div className="bg-blue-50 p-6 rounded-xl border-2 border-blue-200 space-y-4">
                    {job.application_email && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Email de candidature :</p>
                        <a
                          href={`mailto:${job.application_email}`}
                          className="text-[#0E2F56] hover:text-[#1a4275] font-medium flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          {job.application_email}
                        </a>
                      </div>
                    )}

                    {parseJsonField(job.required_documents).length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Documents requis :</p>
                        <div className="flex flex-wrap gap-2">
                          {parseJsonField(job.required_documents).map((doc, index) => (
                            <span
                              key={index}
                              className="px-3 py-1.5 bg-white border-2 border-blue-300 text-gray-800 rounded-lg text-sm font-medium flex items-center gap-1"
                            >
                              <FileText className="w-4 h-4" />
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {job.application_instructions && (
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">Instructions de candidature :</p>
                        <p className="text-gray-700 leading-relaxed">{job.application_instructions}</p>
                      </div>
                    )}

                    {job.receive_applications_in_platform && (
                      <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Vous pouvez également postuler directement via la plateforme
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isRecruiter && (
              <>
                {false && showQuickApplyModal ? (
                  <div className="border-t-2 border-gray-200 pt-8 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#FF8C00]" />
                      Lettre de motivation
                    </h3>
                    <textarea
                      value=""
                      onChange={() => {}}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] mb-4"
                      placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
                    ></textarea>
                    <div className="flex gap-3">
                      <button
                        onClick={handleApply}
                        disabled={loading}
                        className="flex-1 py-4 bg-[#0E2F56] hover:bg-[#1a4275] disabled:bg-gray-400 text-white font-bold rounded-xl transition shadow-lg text-lg"
                      >
                        {loading ? 'Envoi en cours...' : 'Confirmer ma candidature'}
                      </button>
                      <button
                        onClick={() => setShowQuickApplyModal(false)}
                        className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t-2 border-gray-200 pt-8 mt-8">
                    {hasApplied ? (
                      <div className="text-center p-8 bg-green-50 rounded-xl border-2 border-green-200">
                        <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                          <CheckCircle2 className="w-12 h-12 text-green-600" />
                        </div>
                        <div className="text-green-800 font-bold text-xl mb-2">
                          Vous avez déjà postulé à cette offre
                        </div>
                        <p className="text-green-700 mb-4">
                          Suivez l'évolution de votre candidature dans votre espace candidat
                        </p>
                        <button
                          onClick={() => onNavigate('candidate-dashboard')}
                          className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition"
                        >
                          Voir mes candidatures
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleApply}
                        className="w-full py-5 bg-[#FF8C00] hover:bg-[#e67e00] text-white font-bold rounded-xl transition shadow-lg text-lg flex items-center justify-center gap-2"
                      >
                        <Briefcase className="w-5 h-5" />
                        Postuler maintenant
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
