import { useEffect, useState } from 'react';
import {
  MapPin, Building, Briefcase, DollarSign, Calendar, ArrowLeft,
  FileText, Users, GraduationCap, Globe, Mail, CheckCircle2,
  Clock, Tag, Languages, BookmarkPlus, Bookmark, Share2, Star,
  Target, TrendingUp, Award, Eye, MessageCircle, Heart, Zap,
  AlertCircle, Info, ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Company } from '../lib/supabase';
import { sampleJobs } from '../utils/sampleJobsData';
import JobApplicationModal from '../components/candidate/JobApplicationModal';
import CompanyLogo from '../components/common/CompanyLogo';
import AccessRestrictionModal from '../components/common/AccessRestrictionModal';
import AuthRequiredModal from '../components/common/AuthRequiredModal';
import ApplicationSuccessModal from '../components/candidate/ApplicationSuccessModal';
import ShareJobModal from '../components/common/ShareJobModal';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import { useSavedJobs } from '../hooks/useSavedJobs';
import { saveAuthRedirectIntent } from '../hooks/useAuthRedirect';
import { useSocialShareMeta } from '../hooks/useSocialShareMeta';
import { socialShareService } from '../services/socialShareService';
import { candidateStatsService } from '../services/candidateStatsService';

interface JobDetailProps {
  jobId: string;
  onNavigate: (page: string) => void;
  autoOpenApply?: boolean;
  metadata?: Record<string, any>;
}

export default function JobDetail({ jobId, onNavigate, autoOpenApply, metadata }: JobDetailProps) {
  const { user, profile } = useAuth();
  const [job, setJob] = useState<(Job & { companies: Company }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalContext, setAuthModalContext] = useState<'apply' | 'save'>('apply');
  const [applicationReference, setApplicationReference] = useState('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [profileCompletionPercentage, setProfileCompletionPercentage] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  const { isSaved, loading: savingJob, toggleSave } = useSavedJobs(jobId);

  const shareMetadata = job ? socialShareService.generateJobMetadata(job) : null;
  useSocialShareMeta(shareMetadata);

  const isRecruiter = profile?.user_type === 'recruiter';
  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

  useEffect(() => {
    if (autoOpenApply && user && profile?.user_type === 'candidate' && !loading && job) {
      setShowApplicationModal(true);
    }
  }, [autoOpenApply, user, profile, loading, job]);

  useEffect(() => {
    loadJob();
    // Track job view pour TOUS les utilisateurs (connectés, anonymes, recruteurs)
    trackJobView();

    if (user) {
      checkIfApplied();
      loadProfileCompletion();
    }
  }, [jobId, user]);

  const loadJob = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('id', jobId)
      .maybeSingle();

    if (data) {
      setJob(data as any);
    } else if (jobId.startsWith('sample-')) {
      const sampleJob = sampleJobs.find(j => j.id === jobId);
      if (sampleJob) {
        setJob({
          ...sampleJob,
          sector: sampleJob.department,
          companies: {
            id: sampleJob.company_id,
            profile_id: 'sample-profile',
            name: sampleJob.company_name,
            logo_url: sampleJob.company_logo,
          }
        } as any);
      }
    }
    setLoading(false);
  };

  const trackJobView = async () => {
    // Skip tracking pour les offres sample/demo
    if (jobId.startsWith('sample-')) return;

    try {
      // Appeler Edge Function qui gère l'anti-spam et la validation backend
      // Fonctionne pour tous les utilisateurs (connectés, anonymes, recruteurs)
      await candidateStatsService.trackJobView(jobId);
    } catch (error) {
      // Silencieux: ne jamais bloquer l'affichage de l'offre pour un problème de tracking
      console.debug('Job view tracking:', error);
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

  const loadProfileCompletion = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('candidate_profiles')
      .select('profile_completion_percentage')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (data) {
      setProfileCompletionPercentage(data.profile_completion_percentage || 0);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      saveAuthRedirectIntent({
        type: 'apply_job',
        jobId,
        returnPage: 'job-detail',
        autoAction: true,
        metadata: { jobTitle: job?.title }
      });
      setAuthModalContext('apply');
      setShowAuthModal(true);
      return;
    }

    if (profile?.user_type !== 'candidate') {
      setShowAccessModal(true);
      return;
    }

    setShowApplicationModal(true);
  };

  const handleSaveJob = async () => {
    if (!user) {
      saveAuthRedirectIntent({
        type: 'save_job',
        jobId,
        returnPage: 'job-detail',
        autoAction: false
      });
      setAuthModalContext('save');
      setShowAuthModal(true);
      return;
    }

    try {
      await toggleSave();
    } catch (error) {
      console.error('Error toggling saved job:', error);
    }
  };

  const handleApplicationSuccess = (appRef: string, steps: string[]) => {
    setHasApplied(true);
    setShowApplicationModal(false);
    setApplicationReference(appRef);
    setNextSteps(steps);
    setShowSuccessModal(true);
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
            onClick={() => onNavigate('jobs')}
            className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition"
          >
            Retour aux offres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('jobs')}
            className="flex items-center space-x-2 text-[#0E2F56] hover:text-[#1a4275] font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux offres</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-[#0E2F56] rounded-lg transition font-medium"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>
            <button
              onClick={handleSaveJob}
              disabled={savingJob}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium ${
                isSaved
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isSaved ? <Bookmark className="w-4 h-4 fill-current" /> : <BookmarkPlus className="w-4 h-4" />}
              {isSaved ? 'Sauvegardée' : 'Sauvegarder'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white p-8">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h1 className="text-4xl font-bold">{job.title}</h1>

                  {job.status === 'published' && (
                    <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                      ✓ Publiée
                    </span>
                  )}
                  {job.is_featured && (
                    <span className="px-3 py-1 bg-yellow-400 text-gray-900 text-sm font-semibold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> À la Une
                    </span>
                  )}
                  {job.is_urgent && (
                    <span className="px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full animate-pulse">
                      ⚡ Urgent
                    </span>
                  )}
                  {job.is_premium && (
                    <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-semibold rounded-full">
                      ⭐ Premium
                    </span>
                  )}
                </div>

                {job.category && (
                  <div className="mb-3">
                    <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                      📂 {job.category}
                    </span>
                  </div>
                )}

                <div className="flex items-center space-x-3 mb-3">
                  <CompanyLogo
                    logoUrl={job.featured_image_url || job.company_logo_url || job.companies?.logo_url}
                    companyName={job.companies?.name || job.department || 'Entreprise'}
                    size="sm"
                  />
                  <span className="text-2xl font-semibold">{job.companies?.name || job.department}</span>
                </div>

                {job.location && (
                  <div className="flex items-center space-x-2 text-blue-100 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-lg">{job.location}</span>
                  </div>
                )}

                {(job as any).position_level && (
                  <div className="mb-2">
                    <span className="text-blue-200 text-sm">Niveau: </span>
                    <span className="text-white font-medium">{(job as any).position_level}</span>
                  </div>
                )}

                {(job as any).position_count && (job as any).position_count > 1 && (
                  <div className="mt-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                      🎯 {(job as any).position_count} poste{(job as any).position_count > 1 ? 's' : ''} à pourvoir
                    </span>
                  </div>
                )}

                {(job as any).announcement_language && (
                  <div className="mt-2">
                    <span className="text-blue-200 text-sm">Langue: </span>
                    <span className="text-white font-medium">{(job as any).announcement_language}</span>
                  </div>
                )}
              </div>

              <CompanyLogo
                logoUrl={job.featured_image_url || job.company_logo_url || job.companies?.logo_url}
                companyName={job.companies?.name || job.department || 'Entreprise'}
                size="xl"
                className="border-4 border-white/20 shadow-lg"
              />
            </div>
          </div>

          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Informations clés</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {job.contract_type && (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Type de contrat</div>
                    <div className="font-bold text-gray-900">{job.contract_type}</div>
                  </div>
                </div>
              )}

              {job.experience_level && (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Expérience requise</div>
                    <div className="font-bold text-gray-900">{job.experience_level}</div>
                  </div>
                </div>
              )}

              {job.education_level && (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Formation requise</div>
                    <div className="font-bold text-gray-900">{job.education_level}</div>
                  </div>
                </div>
              )}

              {(job as any).primary_qualification && (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Qualification principale</div>
                    <div className="font-bold text-gray-900 text-sm">{(job as any).primary_qualification}</div>
                  </div>
                </div>
              )}

              {((job.salary_min || job.salary_max) || (job as any).salary_range) && (
                <div className="flex items-center space-x-3 bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">
                      Salaire {(job as any).salary_type ? `(${(job as any).salary_type})` : ''}
                    </div>
                    <div className="font-bold text-gray-900 text-sm">
                      {(job as any).salary_range || (
                        job.salary_min && job.salary_max
                          ? `${(job.salary_min / 1000000).toFixed(1)}M - ${(job.salary_max / 1000000).toFixed(1)}M GNF`
                          : job.salary_min
                          ? `${(job.salary_min / 1000000).toFixed(1)}M+ GNF`
                          : job.salary_max
                          ? `Jusqu'à ${(job.salary_max / 1000000).toFixed(1)}M GNF`
                          : 'Non spécifié'
                      )}
                    </div>
                  </div>
                </div>
              )}

              {job.sector && (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Secteur d'activité</div>
                    <div className="font-bold text-gray-900">{job.sector}</div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-medium">Publié le</div>
                  <div className="font-bold text-gray-900 text-sm">
                    {new Date(job.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>

              {(job.deadline || job.application_deadline) && (
                <div className="flex items-center space-x-3 bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Date limite de candidature</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {new Date(job.deadline || job.application_deadline!).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              )}

              {(job as any).publication_duration && (
                <div className="flex items-center space-x-3 bg-white p-4 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Durée de publication</div>
                    <div className="font-bold text-gray-900">{(job as any).publication_duration}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#0E2F56] rounded-full mx-auto mb-2">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{job.views_count || 0}</div>
                <div className="text-xs text-gray-600">Vues</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#0E2F56] rounded-full mx-auto mb-2">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{job.applications_count || 0}</div>
                <div className="text-xs text-gray-600">Candidatures</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#0E2F56] rounded-full mx-auto mb-2">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{(job as any).saves_count || 0}</div>
                <div className="text-xs text-gray-600">Favoris</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-[#0E2F56] rounded-full mx-auto mb-2">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{(job as any).comments_count || 0}</div>
                <div className="text-xs text-gray-600">Commentaires</div>
              </div>
            </div>

            {job.keywords && job.keywords.length > 0 && (
              <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-6 h-6 text-[#0E2F56]" />
                  <h3 className="text-xl font-bold text-gray-900">Compétences requises</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.keywords.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-[#0E2F56] text-white rounded-full text-sm font-medium hover:bg-[#1a4275] transition"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {((job.languages && job.languages.length > 0) || ((job as any).language_requirements && (job as any).language_requirements.length > 0)) && (
              <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Languages className="w-6 h-6 text-[#0E2F56]" />
                  <h3 className="text-xl font-bold text-gray-900">Langues requises</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(job as any).language_requirements && (job as any).language_requirements.length > 0 ? (
                    (job as any).language_requirements.map((lang: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                        <span className="font-semibold text-gray-800">{lang.language}</span>
                        <span className="px-3 py-1 bg-[#0E2F56] text-white rounded-full text-xs font-medium">
                          {lang.level}
                        </span>
                      </div>
                    ))
                  ) : job.languages && job.languages.length > 0 ? (
                    job.languages.map((lang, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-[#0E2F56] text-white rounded-full text-sm font-medium text-center"
                      >
                        {lang}
                      </span>
                    ))
                  ) : null}
                </div>
              </div>
            )}

            {job.benefits && job.benefits.length > 0 && (
              <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-6 h-6 text-green-600" />
                  <h3 className="text-xl font-bold text-gray-900">Avantages proposés</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(typeof job.benefits === 'string' ? job.benefits.split(', ') : job.benefits).map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <span className="text-gray-800 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-8">
              <div className="border-t-2 border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#0E2F56]" />
                  Description du poste
                </h2>
                <div className="bg-white p-6 rounded-xl border border-gray-200">
                  <MarkdownRenderer content={job.description} />
                </div>
              </div>

              {job.responsibilities && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-[#0E2F56]" />
                    Responsabilités
                  </h2>
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <MarkdownRenderer content={job.responsibilities} />
                  </div>
                </div>
              )}

              {job.requirements && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#0E2F56]" />
                    Exigences et compétences
                  </h2>
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <MarkdownRenderer content={job.requirements} />
                  </div>
                </div>
              )}

              {(job as any).profile_sought && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users className="w-6 h-6 text-[#0E2F56]" />
                    Profil recherché
                  </h2>
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <MarkdownRenderer content={(job as any).profile_sought} />
                  </div>
                </div>
              )}

              {((job as any).application_email || (job as any).application_instructions || (job as any).required_documents) && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Mail className="w-6 h-6 text-[#0E2F56]" />
                    Modalités de candidature
                  </h2>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 space-y-4">
                    {(job as any).application_email && (
                      <div>
                        <div className="text-sm font-semibold text-gray-600 mb-2">Email de candidature :</div>
                        <a
                          href={`mailto:${(job as any).application_email}`}
                          className="text-[#0E2F56] hover:text-[#1a4275] font-bold text-lg flex items-center gap-2"
                        >
                          <Mail className="w-5 h-5" />
                          {(job as any).application_email}
                        </a>
                      </div>
                    )}

                    {(job as any).receive_in_platform && (
                      <div className="flex items-center gap-2 text-green-700 bg-green-100 p-3 rounded-lg">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Les candidatures sont acceptées via la plateforme</span>
                      </div>
                    )}

                    {(job as any).required_documents && (job as any).required_documents.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-gray-600 mb-2">Documents requis :</div>
                        <div className="text-gray-700">
                          {(job as any).required_documents.map((doc: string, index: number) => (
                            <span key={index}>
                              {index > 0 && ', '}
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(job as any).application_instructions && (
                      <div>
                        <div className="text-sm font-semibold text-gray-600 mb-2">Instructions spéciales :</div>
                        <div className="bg-white p-4 rounded-lg border border-gray-200 text-gray-700">
                          {(job as any).application_instructions}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {job.companies && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-6 h-6 text-[#0E2F56]" />
                    À propos de l'entreprise
                  </h2>
                  <div className="flex items-start space-x-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    {(job.featured_image_url || job.company_logo_url || job.companies.logo_url) && (
                      <img
                        src={job.featured_image_url || job.company_logo_url || job.companies.logo_url}
                        alt={job.companies.name}
                        className="w-24 h-24 rounded-xl object-cover border-2 border-gray-300 shadow-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-2xl text-gray-900 mb-3">{job.companies.name}</h3>

                      {((job as any).company_description || job.companies.description) && (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {(job as any).company_description || job.companies.description}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        {(job.companies.sector || job.sector) && (
                          <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                            <Building className="w-4 h-4 text-[#0E2F56]" />
                            <span className="font-medium">Secteur:</span> {job.companies.sector || job.sector}
                          </div>
                        )}
                        {job.companies.size && (
                          <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200">
                            <Users className="w-4 h-4 text-[#0E2F56]" />
                            <span className="font-medium">Taille:</span> {job.companies.size}
                          </div>
                        )}
                        {((job as any).company_website || job.companies.website) && (
                          <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-gray-200 col-span-2">
                            <Globe className="w-4 h-4 text-[#0E2F56]" />
                            <a
                              href={(job as any).company_website || job.companies.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#0E2F56] hover:text-[#1a4275] font-medium flex items-center gap-1"
                            >
                              Site web
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {((job as any).visibility || (job as any).nationality_required || (job as any).auto_renewal) && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Info className="w-6 h-6 text-[#0E2F56]" />
                    Informations supplémentaires
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(job as any).visibility && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 font-medium mb-1">Visibilité</div>
                        <div className="font-bold text-gray-900">{(job as any).visibility}</div>
                      </div>
                    )}

                    {(job as any).nationality_required && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-xs text-gray-500 font-medium mb-1">Nationalité requise</div>
                        <div className="font-bold text-gray-900">{(job as any).nationality_required}</div>
                      </div>
                    )}

                    {(job as any).auto_renewal && (
                      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-xs text-gray-500 font-medium mb-1">Renouvellement</div>
                          <div className="font-bold text-gray-900">Automatique</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isRecruiter && (
              <div className="border-t-2 border-gray-200 pt-8 mt-8">
                {hasApplied ? (
                  <div className="text-center p-8 bg-green-50 rounded-xl border-2 border-green-200">
                    <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                      <CheckCircle2 className="w-12 h-12 text-green-600" />
                    </div>
                    <div className="text-green-800 font-bold text-xl mb-2">
                      ✓ Vous avez déjà postulé à cette offre
                    </div>
                    <p className="text-green-700 mb-4">
                      Suivez l'évolution de votre candidature dans votre espace candidat
                    </p>
                    <button
                      onClick={() => onNavigate('candidate-dashboard')}
                      className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition"
                    >
                      Voir mes candidatures →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleApplyClick}
                      className="w-full py-5 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-bold rounded-xl transition shadow-lg text-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-6 h-6" />
                      Postuler maintenant
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleSaveJob}
                        disabled={savingJob}
                        className={`py-3 border-2 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
                          isSaved
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        } ${savingJob ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {savingJob ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                        ) : isSaved ? (
                          <Bookmark className="w-5 h-5 fill-current" />
                        ) : (
                          <BookmarkPlus className="w-5 h-5" />
                        )}
                        {isSaved ? 'Sauvegardée' : 'Sauvegarder'}
                      </button>
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="py-3 border-2 border-[#FF8C00] text-[#FF8C00] hover:bg-[#FF8C00] hover:text-white rounded-xl font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Partager
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ApplicationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        applicationReference={applicationReference}
        nextSteps={nextSteps}
        profileCompletionPercentage={profileCompletionPercentage}
        jobTitle={job?.title}
        onNavigate={onNavigate}
      />

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={() => {
          setShowAuthModal(false);
          onNavigate('login');
        }}
        onSignup={() => {
          setShowAuthModal(false);
          onNavigate('signup');
        }}
        context={authModalContext}
        jobTitle={job?.title}
      />

      {showApplicationModal && user && job && (
        <JobApplicationModal
          jobId={jobId}
          jobTitle={job.title}
          companyName={job.companies?.name || job.department}
          candidateId={user.id}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={handleApplicationSuccess}
        />
      )}

      <AccessRestrictionModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        restrictionType="candidate-only"
        currentUserType={profile?.user_type}
        onNavigate={onNavigate}
      />

      {job && (
        <ShareJobModal
          job={job}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
