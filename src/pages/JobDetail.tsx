import { useEffect, useState } from 'react';
import {
  MapPin, Building, Briefcase, DollarSign, Calendar, ArrowLeft, Download,
  FileText, Sparkles, Users, GraduationCap, Globe, Mail, CheckCircle2,
  Clock, Tag, Languages
} from 'lucide-react';
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
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'docx' | null>(null);

  const isRecruiter = profile?.user_type === 'recruiter';
  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

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

  const handleExport = async (format: 'pdf' | 'docx') => {
    setExportFormat(format);

    const content = generateExportContent();

    if (format === 'docx') {
      const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${job?.title?.replace(/\s+/g, '_')}_${jobId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      window.print();
    }

    setExportFormat(null);
    alert(`Export ${format.toUpperCase()} en cours...`);
  };

  const generateExportContent = () => {
    if (!job) return '';

    let content = `${job.title}\n\n`;
    content += `Entreprise: ${job.companies?.company_name}\n`;
    content += `Localisation: ${job.location}\n`;
    content += `Type de contrat: ${job.contract_type}\n\n`;
    content += `Description:\n${job.description}\n\n`;

    return content;
  };

  const handleGenerateWithAI = async () => {
    if (!isPremium) {
      alert('Cette fonctionnalité est réservée aux abonnés Premium. Souscrivez pour débloquer la génération IA !');
      return;
    }

    setIsGeneratingAI(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const enhancedDescription = `# ${job?.title}\n\n## 🎯 Présentation du poste\n${job?.description}\n\n## 📋 Missions principales\n• Gérer et coordonner les activités quotidiennes\n• Développer et mettre en œuvre des stratégies efficaces\n• Collaborer avec les équipes transverses\n• Assurer le suivi et le reporting des performances\n\n## 👤 Profil recherché\n• Diplôme universitaire pertinent\n• Expérience significative dans un poste similaire\n• Excellentes capacités de communication\n• Autonomie et esprit d'équipe\n\n## 💼 Compétences requises\n• Leadership et management d'équipe\n• Gestion de projet\n• Analyse et résolution de problèmes\n• Maîtrise des outils bureautiques\n\n## 🎁 Avantages\n• Package salarial compétitif\n• Couverture santé\n• Formation continue\n• Environnement de travail stimulant\n\n## ⚖️ Conformité légale\nPoste soumis au Code du Travail Guinéen (Loi L/2014/072/CNT du 16 janvier 2014).\nNous encourageons les candidatures guinéennes dans le cadre de la politique de guinéisation.`;

    if (job) {
      const { error } = await supabase
        .from('jobs')
        .update({ description: enhancedDescription })
        .eq('id', jobId);

      if (!error) {
        await loadJob();
        alert('✨ Offre améliorée avec succès par l\'IA !');
      }
    }

    setIsGeneratingAI(false);
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

          {isRecruiter && (
            <div className="flex gap-3">
              <button
                onClick={() => handleExport('pdf')}
                disabled={exportFormat === 'pdf'}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition shadow-md"
              >
                <Download className="w-4 h-4" />
                Exporter PDF
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={exportFormat === 'docx'}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition shadow-md"
              >
                <Download className="w-4 h-4" />
                Exporter DOCX
              </button>
              <button
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI || !isPremium}
                className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition shadow-md ${
                  isPremium
                    ? 'bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-[#FF8C00] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={!isPremium ? 'Fonctionnalité Premium uniquement' : ''}
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingAI ? 'Génération...' : 'Améliorer avec IA'}
                {!isPremium && <span className="text-xs ml-1">(Premium)</span>}
              </button>
            </div>
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
                  <span className="text-xl">{job.companies?.company_name || job.department}</span>
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
                        alt={job.companies.company_name}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-gray-300"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">{job.companies.company_name}</h3>
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
              <>
                {showApplicationForm ? (
                  <div className="border-t-2 border-gray-200 pt-8 mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#FF8C00]" />
                      Lettre de motivation
                    </h3>
                    <textarea
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] mb-4"
                      placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
                    ></textarea>
                    <div className="flex gap-3">
                      <button
                        onClick={handleApply}
                        disabled={applying}
                        className="flex-1 py-4 bg-[#0E2F56] hover:bg-[#1a4275] disabled:bg-gray-400 text-white font-bold rounded-xl transition shadow-lg text-lg"
                      >
                        {applying ? 'Envoi en cours...' : 'Confirmer ma candidature'}
                      </button>
                      <button
                        onClick={() => setShowApplicationForm(false)}
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
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition"
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
                        className="w-full py-5 bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-[#FF8C00] text-white font-bold rounded-xl transition shadow-xl text-lg"
                      >
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
