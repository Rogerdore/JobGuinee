import { useEffect, useState } from 'react';
import { MapPin, Building, Briefcase, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Company } from '../lib/supabase';
import { sampleJobs } from '../utils/sampleJobsData';

interface JobDetailProps {
  jobId: string;
  onNavigate: (page: string) => void;
}

export default function JobDetail({ jobId, onNavigate }: JobDetailProps) {
  const { user, profile } = useAuth();
  const [job, setJob] = useState<(Job & { companies: Company }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    loadJob();
    incrementViews();
    if (user) checkIfApplied();
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
            company_name: sampleJob.company_name,
            logo_url: sampleJob.company_logo,
          }
        } as any);
      }
    }
    setLoading(false);
  };

  const incrementViews = async () => {
    await supabase.rpc('increment_job_views', { job_id: jobId }).catch(() => {});
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

  const handleApply = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    if (profile?.user_type !== 'candidate') {
      alert('Seuls les candidats peuvent postuler aux offres');
      return;
    }

    setApplying(true);

    const aiScore = Math.floor(Math.random() * 30) + 70;

    await supabase.from('applications').insert({
      job_id: jobId,
      candidate_id: user.id,
      cover_letter: coverLetter,
      status: 'pending',
      ai_match_score: aiScore,
    });

    setApplying(false);
    setHasApplied(true);
    setShowApplicationForm(false);
    alert('Votre candidature a été envoyée avec succès !');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
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
            className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
          >
            Retour aux offres
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => onNavigate('jobs')}
          className="flex items-center space-x-2 text-blue-900 hover:text-blue-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux offres</span>
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-8">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">{job.title}</h1>
                <div className="flex items-center space-x-2 mb-2">
                  <Building className="w-5 h-5" />
                  <span className="text-xl">{job.companies?.company_name}</span>
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
                  alt={job.companies.company_name}
                  className="w-20 h-20 rounded-lg bg-white object-cover"
                />
              )}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {job.contract_type && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-900" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="font-semibold text-gray-900">{job.contract_type}</div>
                  </div>
                </div>
              )}

              {job.sector && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Secteur</div>
                    <div className="font-semibold text-gray-900">{job.sector}</div>
                  </div>
                </div>
              )}

              {(job.salary_min || job.salary_max) && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Salaire</div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {job.salary_min && job.salary_max
                        ? `${(job.salary_min / 1000000).toFixed(1)}M - ${(job.salary_max / 1000000).toFixed(1)}M`
                        : job.salary_min
                        ? `${(job.salary_min / 1000000).toFixed(1)}M+`
                        : `${(job.salary_max! / 1000000).toFixed(1)}M`}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">Publié</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {new Date(job.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </div>
                </div>
              </div>

              {job.deadline && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Date limite</div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {new Date(job.deadline).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description du poste</h2>
              <div className="prose prose-blue max-w-none">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
              </div>
            </div>

            {job.requirements && (
              <div className="border-t border-gray-200 pt-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Exigences et compétences</h2>
                <div className="prose prose-blue max-w-none">
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">{job.requirements}</p>
                </div>
              </div>
            )}

            {job.companies && (
              <div className="border-t border-gray-200 pt-8 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">À propos de l'entreprise</h2>
                <div className="flex items-start space-x-4">
                  {job.companies.logo_url && (
                    <img
                      src={job.companies.logo_url}
                      alt={job.companies.company_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{job.companies.company_name}</h3>
                    {job.companies.description && (
                      <p className="text-gray-700 mb-3">{job.companies.description}</p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {job.companies.sector && (
                        <div>
                          <span className="font-medium">Secteur:</span> {job.companies.sector}
                        </div>
                      )}
                      {job.companies.size && (
                        <div>
                          <span className="font-medium">Taille:</span> {job.companies.size}
                        </div>
                      )}
                      {job.companies.website && (
                        <div>
                          <a
                            href={job.companies.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-900 hover:text-blue-700"
                          >
                            Site web
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showApplicationForm ? (
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Lettre de motivation</h3>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                  placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
                ></textarea>
                <div className="flex gap-3">
                  <button
                    onClick={handleApply}
                    disabled={applying}
                    className="flex-1 py-4 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition shadow-lg text-lg"
                  >
                    {applying ? 'Envoi en cours...' : 'Confirmer ma candidature'}
                  </button>
                  <button
                    onClick={() => setShowApplicationForm(false)}
                    className="px-6 py-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-8">
                {hasApplied ? (
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-green-800 font-semibold text-lg mb-2">
                      Vous avez déjà postulé à cette offre
                    </div>
                    <p className="text-green-700">
                      Suivez l'évolution de votre candidature dans votre espace candidat
                    </p>
                    <button
                      onClick={() => onNavigate('candidate-dashboard')}
                      className="mt-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                    >
                      Voir mes candidatures
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) {
                        onNavigate('login');
                      } else if (profile?.user_type !== 'candidate') {
                        alert('Seuls les candidats peuvent postuler aux offres');
                      } else {
                        setShowApplicationForm(true);
                      }
                    }}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition shadow-lg text-lg"
                  >
                    Postuler maintenant
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
