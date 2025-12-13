import { useEffect, useState } from 'react';
import {
  MapPin, Building, Briefcase, DollarSign, Calendar, ArrowLeft,
  FileText, Users, GraduationCap, Globe, Mail, CheckCircle2,
  Clock, Tag, Languages, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Company } from '../lib/supabase';
import { sampleJobs } from '../utils/sampleJobsData';
import JobApplicationModal from '../components/candidate/JobApplicationModal';

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
  const [applicationReference, setApplicationReference] = useState('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);

  const isRecruiter = profile?.user_type === 'recruiter';
  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

  useEffect(() => {
    loadJob();
    if (user) {
      trackJobView();
      checkIfApplied();
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

  const handleApplyClick = () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (profile?.user_type !== 'candidate') {
      alert('Seuls les candidats peuvent postuler aux offres');
      return;
    }

    setShowApplicationModal(true);
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
                  <button
                    onClick={handleApplyClick}
                    className="w-full py-5 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition shadow-lg text-lg"
                  >
                    Postuler maintenant
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Candidature envoyée !
                  </h2>
                </div>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 mb-1">
                        Référence de candidature
                      </p>
                      <p className="text-2xl font-mono font-bold text-blue-700">
                        {applicationReference}
                      </p>
                      <p className="text-sm text-blue-700 mt-2">
                        Conservez précieusement ce numéro pour suivre votre candidature
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                    Prochaines étapes
                  </h3>
                  <ul className="space-y-2">
                    {nextSteps.map((step, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </span>
                        <span className="text-gray-700 flex-1">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Un email de confirmation vous a été envoyé avec toutes les informations importantes.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onNavigate('candidate-dashboard')}
                  className="flex-1 px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-lg transition"
                >
                  Voir mes candidatures
                </button>
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    onNavigate('jobs');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                >
                  Autres offres
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
