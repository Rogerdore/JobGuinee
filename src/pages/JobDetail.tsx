import { useEffect, useState } from 'react';
import {
  MapPin, Building, Briefcase, DollarSign, Calendar, ArrowLeft,
  FileText, Users, GraduationCap, Globe, Mail, CheckCircle2,
  Clock, Tag, Languages, X, BookmarkPlus, Bookmark
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Company } from '../lib/supabase';
import { sampleJobs } from '../utils/sampleJobsData';
import JobApplicationModal from '../components/candidate/JobApplicationModal';
import CompanyLogo from '../components/common/CompanyLogo';
import AccessRestrictionModal from '../components/common/AccessRestrictionModal';
import AuthRequiredModal from '../components/common/AuthRequiredModal';
import ApplicationSuccessModal from '../components/common/ApplicationSuccessModal';
import { useSavedJobs } from '../hooks/useSavedJobs';

interface JobDetailProps {
  jobId: string;
  onNavigate: (page: string) => void;
}

export default function JobDetail({ jobId, onNavigate }: JobDetailProps) {
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

  const { isSaved, loading: savingJob, toggleSave } = useSavedJobs(jobId);

  const isRecruiter = profile?.user_type === 'recruiter';
  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

  useEffect(() => {
    loadJob();
    if (user) {
      trackJobView();
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
    if (!user || !jobId || jobId.startsWith('sample-')) return;

    try {
      // Enregistrer la vue dans job_views
      await supabase
        .from('job_views')
        .insert({
          user_id: user.id,
          job_id: jobId,
          viewed_at: new Date().toISOString()
        });

      // Incrémenter le compteur sur la table jobs
      await supabase.rpc('increment', {
        table_name: 'jobs',
        row_id: jobId,
        column_name: 'views_count'
      }).catch(() => {
        // Fallback si la fonction RPC n'existe pas
        supabase
          .from('jobs')
          .update({ views_count: (job?.views_count || 0) + 1 })
          .eq('id', jobId)
          .then(() => {});
      });
    } catch (error) {
      // Ignorer les erreurs (ex: contrainte unique si vue déjà enregistrée aujourd'hui)
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
            onClick={() => onNavigate('jobs')}
            className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition"
          >
            Retour aux offres
          </button>
        </div>
      </div>
    );
  }

  const sections = parseJobDescription(job.description);

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
                <div className="flex items-center space-x-3 mb-2">
                  <CompanyLogo
                    logoUrl={job.companies?.logo_url}
                    companyName={job.companies?.name || job.department || 'Entreprise'}
                    size="sm"
                  />
                  <span className="text-xl font-semibold">{job.companies?.name || job.department}</span>
                </div>
                {job.location && (
                  <div className="flex items-center space-x-2 text-blue-100">
                    <MapPin className="w-4 h-4" />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
              <CompanyLogo
                logoUrl={job.companies?.logo_url}
                companyName={job.companies?.name || job.department || 'Entreprise'}
                size="xl"
                className="border-4 border-white/20 shadow-lg"
              />
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

              {job.application_deadline && (
                <div className="flex items-center space-x-3 bg-red-50 p-4 rounded-xl border-2 border-red-100">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Date limite</div>
                    <div className="font-bold text-gray-900 text-sm">
                      {new Date(job.application_deadline).toLocaleDateString('fr-FR', {
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

              {job.view_count !== undefined && (
                <div className="flex items-center space-x-3 bg-yellow-50 p-4 rounded-xl border-2 border-yellow-100">
                  <div className="w-10 h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Vues</div>
                    <div className="font-bold text-gray-900">{job.view_count || 0}</div>
                  </div>
                </div>
              )}
            </div>

            {job.required_skills && job.required_skills.length > 0 && (
              <div className="mb-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-[#0E2F56]" />
                  <h3 className="text-lg font-bold text-gray-900">Compétences requises</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((skill, index) => (
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

            <div className="space-y-8">
              <div className="border-t-2 border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#FF8C00]" />
                  Description complète
                </h2>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
                </div>
              </div>

              {job.requirements && (
                <div className="border-t-2 border-gray-200 pt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-[#FF8C00]" />
                    Exigences et compétences
                  </h2>
                  <div className="prose prose-blue max-w-none">
                    <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.requirements}</p>
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
            </div>

            {!isRecruiter && (
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
                  <div className="space-y-3">
                    <button
                      onClick={handleApplyClick}
                      className="w-full py-5 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition shadow-lg text-lg"
                    >
                      Postuler maintenant
                    </button>
                    <button
                      onClick={handleSaveJob}
                      disabled={savingJob}
                      className={`w-full py-3 border-2 rounded-xl font-semibold transition flex items-center justify-center gap-2 ${
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
                      {isSaved ? 'Offre enregistrée' : 'Enregistrer cette offre'}
                    </button>
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
        onCompleteProfile={() => {
          setShowSuccessModal(false);
          onNavigate('candidate-profile-form');
        }}
        onViewMoreJobs={() => {
          setShowSuccessModal(false);
          onNavigate('jobs');
        }}
        jobTitle={job?.title}
        applicationReference={applicationReference}
        profileCompletionPercentage={profileCompletionPercentage}
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
    </div>
  );
}
