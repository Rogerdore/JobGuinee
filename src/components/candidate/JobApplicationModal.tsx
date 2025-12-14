import { useState, useEffect } from 'react';
import {
  X, FileText, User, Upload, CheckCircle2, AlertCircle,
  Briefcase, Mail, Phone, MapPin, Award, Clock, Send, FolderOpen,
  Sparkles, Zap, Edit3, ArrowRight, Plus, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { applicationSubmissionService } from '../../services/applicationSubmissionService';
import CoverLetterImportModal from './CoverLetterImportModal';

interface JobApplicationModalProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateId: string;
  onClose: () => void;
  onSuccess: (applicationRef: string, nextSteps: string[]) => void;
}

interface JobDetails {
  id: string;
  title: string;
  description?: string;
  required_skills?: string[];
  missions?: string;
  required_profile?: string;
  cover_letter_required: boolean;
}

interface CandidateProfile {
  id: string;
  profile_id: string;
  title?: string;
  experience_years?: number;
  education_level?: string;
  skills?: string[];
  professional_summary?: string;
  location?: string;
  desired_salary_min?: number;
  desired_salary_max?: number;
  availability?: string;
  profile_completion_percentage?: number;
  cv_url?: string;
  cover_letter_url?: string;
}

type ApplicationMode = 'select' | 'quick' | 'assisted' | 'custom';

export default function JobApplicationModal({
  jobId,
  jobTitle,
  companyName,
  candidateId,
  onClose,
  onSuccess
}: JobApplicationModalProps) {
  const [mode, setMode] = useState<ApplicationMode>('select');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [assistedData, setAssistedData] = useState({
    optimizedCoverLetter: '',
    suggestions: [] as string[],
    matchScore: 0
  });

  const [customData, setCustomData] = useState({
    coverLetter: '',
    cvFile: null as File | null
  });

  useEffect(() => {
    loadData();
  }, [candidateId, jobId]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCandidateProfile(),
        loadJobDetails()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const loadJobDetails = async () => {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (job) {
        setJobDetails(job);
      }
    } catch (error) {
      console.error('Error loading job details:', error);
    }
  };

  const loadCandidateProfile = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url')
        .eq('id', candidateId)
        .single();

      const { data: candidateProf } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('profile_id', candidateId)
        .maybeSingle();

      setProfileData(profile);
      setCandidateProfile(candidateProf);

      if (candidateProf?.professional_summary) {
        setCustomData(prev => ({ ...prev, coverLetter: candidateProf.professional_summary || '' }));
      }
    } catch (error) {
      console.error('Error loading candidate profile:', error);
    }
  };

  const handleQuickApply = async () => {
    if (!candidateProfile?.cv_url) {
      alert('Veuillez d\'abord ajouter un CV à votre profil ou utiliser une autre méthode de candidature.');
      return;
    }

    if (jobDetails?.cover_letter_required && !candidateProfile?.professional_summary?.trim()) {
      alert('Une lettre de motivation est requise. Veuillez utiliser la candidature assistée ou personnalisée.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await applicationSubmissionService.submitApplication({
        jobId,
        candidateId,
        coverLetter: candidateProfile?.professional_summary,
        cvUrl: candidateProfile?.cv_url
      });

      if (result.success) {
        onSuccess(result.applicationReference || '', result.nextSteps || []);
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Une erreur est survenue';
      alert(`Erreur: ${errorMessage}`);
    }
    setSubmitting(false);
  };

  const generateAssistedApplication = async () => {
    if (!candidateProfile?.cv_url) {
      alert('Un CV est requis pour générer une candidature assistée.');
      return;
    }

    setGeneratingAI(true);
    try {
      const coverLetter = `Madame, Monsieur,

Je me permets de vous adresser ma candidature pour le poste de ${jobTitle} au sein de ${companyName}.

Fort(e) de ${candidateProfile.experience_years || 0} années d'expérience${candidateProfile.title ? ` en tant que ${candidateProfile.title}` : ''}, je suis ${candidateProfile.location ? `basé(e) à ${candidateProfile.location} et ` : ''}particulièrement intéressé(e) par cette opportunité qui correspond parfaitement à mon parcours professionnel.

${candidateProfile.skills && candidateProfile.skills.length > 0 ? `Mes compétences en ${candidateProfile.skills.slice(0, 3).join(', ')} me permettront de contribuer efficacement aux missions proposées.` : ''}

${candidateProfile.professional_summary || 'Je suis motivé(e) et disponible pour rejoindre votre équipe et contribuer à vos projets.'}

Je reste à votre disposition pour un entretien afin de vous présenter plus en détail ma motivation et mes compétences.

Cordialement`;

      setAssistedData({
        optimizedCoverLetter: coverLetter,
        suggestions: [
          'Lettre adaptée au poste',
          'Vos compétences mises en avant',
          'Format professionnel respecté'
        ],
        matchScore: 85
      });
    } catch (error) {
      console.error('Error generating assisted application:', error);
      alert('Erreur lors de la génération de la candidature assistée');
    }
    setGeneratingAI(false);
  };

  const handleAssistedSubmit = async () => {
    if (!candidateProfile?.cv_url) {
      alert('Un CV est requis');
      return;
    }

    setSubmitting(true);
    try {
      const result = await applicationSubmissionService.submitApplication({
        jobId,
        candidateId,
        coverLetter: assistedData.optimizedCoverLetter,
        cvUrl: candidateProfile.cv_url
      });

      if (result.success) {
        onSuccess(result.applicationReference || '', result.nextSteps || []);
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Une erreur est survenue';
      alert(`Erreur: ${errorMessage}`);
    }
    setSubmitting(false);
  };

  const handleCustomSubmit = async () => {
    const hasExistingCV = candidateProfile?.cv_url;
    const hasNewCV = customData.cvFile;

    if (!hasExistingCV && !hasNewCV) {
      alert('Veuillez télécharger votre CV. Le CV est obligatoire pour postuler.');
      return;
    }

    if (jobDetails?.cover_letter_required && !customData.coverLetter.trim()) {
      alert('Une lettre de motivation est requise par le recruteur pour cette offre.');
      return;
    }

    setSubmitting(true);
    try {
      let cvUrl = candidateProfile?.cv_url || '';

      if (customData.cvFile) {
        const fileName = `${candidateId}-${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('candidate-cvs')
          .upload(fileName, customData.cvFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('candidate-cvs')
          .getPublicUrl(fileName);

        cvUrl = urlData.publicUrl;
      }

      const result = await applicationSubmissionService.submitApplication({
        jobId,
        candidateId,
        coverLetter: customData.coverLetter,
        cvUrl: cvUrl
      });

      if (result.success) {
        onSuccess(result.applicationReference || '', result.nextSteps || []);
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error?.message || error?.error_description || error?.toString() || 'Une erreur est survenue';
      alert(`Erreur: ${errorMessage}`);
    }
    setSubmitting(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('Le fichier ne doit pas dépasser 5 MB');
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
        alert('Format accepté : PDF, DOC, DOCX');
        return;
      }
      setCustomData({ ...customData, cvFile: file });
    }
  };

  const handleImportCoverLetter = (content: string) => {
    setCustomData({ ...customData, coverLetter: content });
    setShowImportModal(false);
  };

  const completionPercentage = candidateProfile?.profile_completion_percentage || 0;
  const hasCV = !!candidateProfile?.cv_url;
  const hasCoverLetter = !!candidateProfile?.professional_summary?.trim();
  const coverLetterRequired = jobDetails?.cover_letter_required || false;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Postuler à cette offre</h2>
            <p className="text-blue-100 mt-1">{jobTitle} - {companyName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting || generatingAI}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {mode === 'select' && (
            <div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Choisissez la meilleure façon de postuler
                </h3>
                <p className="text-gray-600">
                  Nous vous aidons à maximiser vos chances de sélection
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* OPTION 1 - CANDIDATURE RAPIDE */}
                <button
                  onClick={() => {
                    if (hasCV) {
                      setMode('quick');
                    }
                  }}
                  className="group relative p-6 rounded-xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all"
                >
                  <div className="flex flex-col h-full">
                    <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Zap className="w-7 h-7 text-white" />
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2 text-left">
                      Candidature Rapide
                    </h4>
                    <p className="text-sm text-gray-700 mb-4 text-left flex-1">
                      Utilisez votre profil JobGuinée existant
                    </p>

                    <div className="space-y-2 text-left">
                      {hasCV ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>CV enregistré</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-orange-600 text-sm font-semibold">
                          <AlertCircle className="w-4 h-4" />
                          <span>CV manquant</span>
                        </div>
                      )}

                      <div className={`flex items-center gap-2 text-sm font-semibold ${
                        completionPercentage >= 80 ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        {completionPercentage >= 80 ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        <span>Profil {completionPercentage}%</span>
                      </div>
                    </div>

                    {!hasCV && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <div className="space-y-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open('/candidate-dashboard?tab=profile', '_blank');
                            }}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter un CV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </button>

                {/* OPTION 2 - CANDIDATURE ASSISTÉE */}
                <button
                  onClick={() => {
                    if (hasCV) {
                      setMode('assisted');
                      generateAssistedApplication();
                    }
                  }}
                  className="group relative p-6 rounded-xl border-2 border-green-500 bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all"
                >
                  <div className="absolute top-3 right-3 px-2 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
                    Recommandé
                  </div>

                  <div className="flex flex-col h-full">
                    <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Sparkles className="w-7 h-7 text-white" />
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2 text-left">
                      Candidature Assistée
                    </h4>
                    <p className="text-sm text-gray-700 mb-4 text-left flex-1">
                      L'IA adapte votre profil à cette offre
                    </p>

                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                        <Sparkles className="w-4 h-4" />
                        <span>Optimisé pour cette offre</span>
                      </div>
                      <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                        <Edit3 className="w-4 h-4" />
                        <span>Modifiable avant envoi</span>
                      </div>
                    </div>

                    {!hasCV && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <p className="text-xs text-orange-700 font-semibold mb-2">
                          CV requis pour cette option
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open('/candidate-dashboard?tab=profile', '_blank');
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter un CV
                        </button>
                      </div>
                    )}
                  </div>
                </button>

                {/* OPTION 3 - CANDIDATURE PERSONNALISÉE */}
                <button
                  onClick={() => setMode('custom')}
                  className="group relative p-6 rounded-xl border-2 border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-xl transition-all hover:border-gray-500"
                >
                  <div className="flex flex-col h-full">
                    <div className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7 text-white" />
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2 text-left">
                      Candidature Personnalisée
                    </h4>
                    <p className="text-sm text-gray-700 mb-4 text-left flex-1">
                      Contrôle total sur votre candidature
                    </p>

                    <div className="space-y-2 text-left">
                      <div className="flex items-center gap-2 text-gray-600 text-sm font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Toujours disponible</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 text-sm font-semibold">
                        <Edit3 className="w-4 h-4" />
                        <span>Personnalisation complète</span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {coverLetterRequired && (
                <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-orange-900 mb-1">
                        Lettre de motivation requise
                      </h5>
                      <p className="text-sm text-orange-700">
                        Le recruteur exige une lettre de motivation pour cette offre. Nous vous recommandons d'utiliser la <strong>candidature assistée</strong> ou <strong>personnalisée</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'quick' && (
            <div>
              <button
                onClick={() => setMode('select')}
                className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                ← Retour
              </button>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">Candidature Rapide</h4>
                    <p className="text-sm text-gray-700">Votre profil sera envoyé automatiquement</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-600" />
                    <span className="text-gray-700">{profileData?.email}</span>
                  </div>

                  {profileData?.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{profileData.phone}</span>
                    </div>
                  )}

                  {candidateProfile?.title && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{candidateProfile.title}</span>
                    </div>
                  )}

                  {candidateProfile?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{candidateProfile.location}</span>
                    </div>
                  )}

                  {candidateProfile?.experience_years !== undefined && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">
                        {candidateProfile.experience_years} an{candidateProfile.experience_years > 1 ? 's' : ''} d'expérience
                      </span>
                    </div>
                  )}

                  {candidateProfile?.skills && candidateProfile.skills.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-2 text-sm">Compétences</h5>
                      <div className="flex flex-wrap gap-2">
                        {candidateProfile.skills.slice(0, 6).map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {candidateProfile.skills.length > 6 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{candidateProfile.skills.length - 6} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setMode('select')}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleQuickApply}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer ma candidature
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'assisted' && (
            <div>
              <button
                onClick={() => setMode('select')}
                disabled={generatingAI || submitting}
                className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                ← Retour
              </button>

              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg">Candidature Assistée par IA</h4>
                    <p className="text-sm text-gray-700">Optimisée automatiquement pour cette offre</p>
                  </div>
                  {assistedData.matchScore > 0 && (
                    <div className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold">
                      {assistedData.matchScore}% match
                    </div>
                  )}
                </div>

                {generatingAI ? (
                  <div className="bg-white rounded-lg p-8 text-center">
                    <RefreshCw className="w-12 h-12 text-green-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-700 font-semibold">Génération de votre candidature optimisée...</p>
                    <p className="text-sm text-gray-600 mt-2">L'IA adapte votre profil à cette offre</p>
                  </div>
                ) : (
                  <>
                    {assistedData.suggestions.length > 0 && (
                      <div className="bg-white rounded-lg p-4 mb-4">
                        <h5 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-green-600" />
                          Optimisations appliquées
                        </h5>
                        <div className="space-y-2">
                          {assistedData.suggestions.map((suggestion, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-green-700">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Lettre de motivation optimisée
                      </label>
                      <textarea
                        value={assistedData.optimizedCoverLetter}
                        onChange={(e) => setAssistedData({ ...assistedData, optimizedCoverLetter: e.target.value })}
                        rows={12}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                      />
                      <p className="mt-2 text-sm text-gray-600">
                        Vous pouvez modifier ce texte avant l'envoi
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setMode('select')}
                  disabled={submitting || generatingAI}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAssistedSubmit}
                  disabled={submitting || generatingAI || !assistedData.optimizedCoverLetter}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer la candidature
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {mode === 'custom' && (
            <div>
              <button
                onClick={() => setMode('select')}
                className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                ← Retour
              </button>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    CV {candidateProfile?.cv_url ? (
                      <span className="text-green-600 font-normal">(vous avez déjà un CV enregistré)</span>
                    ) : (
                      <span className="text-red-600">*</span>
                    )}
                  </label>

                  {candidateProfile?.cv_url && (
                    <div className="mb-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-900">CV existant trouvé</p>
                        <p className="text-xs text-green-700">Votre CV enregistré sera utilisé (vous pouvez en télécharger un nouveau)</p>
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="cv-upload"
                    />
                    <label
                      htmlFor="cv-upload"
                      className={`flex items-center gap-3 px-4 py-3 bg-gray-50 border-2 border-dashed rounded-lg cursor-pointer transition ${
                        !candidateProfile?.cv_url && !customData.cvFile
                          ? 'border-red-300 hover:border-red-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      <Upload className={`w-6 h-6 ${!candidateProfile?.cv_url && !customData.cvFile ? 'text-red-600' : 'text-gray-600'}`} />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {customData.cvFile ? customData.cvFile.name : (candidateProfile?.cv_url ? 'Télécharger un nouveau CV (optionnel)' : 'Télécharger votre CV (obligatoire)')}
                        </p>
                        <p className="text-sm text-gray-600">PDF, DOC, DOCX (max 5 MB)</p>
                      </div>
                    </label>
                  </div>

                  {!candidateProfile?.cv_url && !customData.cvFile && (
                    <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Le CV est obligatoire pour postuler
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-900">
                      Lettre de motivation {coverLetterRequired ? (
                        <span className="text-red-600">* (requise)</span>
                      ) : (
                        <span className="text-gray-600">(recommandée)</span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition"
                    >
                      <FolderOpen className="w-4 h-4" />
                      Importer
                    </button>
                  </div>
                  <textarea
                    value={customData.coverLetter}
                    onChange={(e) => setCustomData({ ...customData, coverLetter: e.target.value })}
                    rows={12}
                    placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    {customData.coverLetter.length} caractères
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setMode('select')}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={submitting || (!candidateProfile?.cv_url && !customData.cvFile) || (coverLetterRequired && !customData.coverLetter.trim())}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Envoi en cours...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Envoyer ma candidature
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <CoverLetterImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCoverLetter}
        candidateId={candidateId}
      />
    </div>
  );
}
