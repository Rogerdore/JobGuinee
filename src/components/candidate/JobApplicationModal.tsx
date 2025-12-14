import { useState, useEffect } from 'react';
import {
  X, FileText, User, Upload, CheckCircle2, AlertCircle,
  Briefcase, Mail, Phone, MapPin, Award, Clock, Send, FolderOpen
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

type ApplicationMode = 'select' | 'profile' | 'manual';

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
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  const [manualData, setManualData] = useState({
    coverLetter: '',
    cvFile: null as File | null,
    motivation: ''
  });

  useEffect(() => {
    loadCandidateProfile();
    loadJobDetails();
  }, [candidateId, jobId]);

  const loadJobDetails = async () => {
    try {
      const { data: job } = await supabase
        .from('jobs')
        .select('cover_letter_required')
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
    setLoading(true);
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
    } catch (error) {
      console.error('Error loading candidate profile:', error);
    }
    setLoading(false);
  };

  const handleSubmitWithProfile = async () => {
    if (!candidateProfile?.cv_url) {
      alert('Votre profil ne contient pas de CV. Veuillez utiliser la candidature personnalisée pour télécharger votre CV.');
      return;
    }

    if (jobDetails?.cover_letter_required && !candidateProfile?.professional_summary?.trim()) {
      alert('Une lettre de motivation est requise pour cette offre. Veuillez compléter votre résumé professionnel ou utiliser la candidature personnalisée.');
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
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Une erreur est survenue lors de l\'envoi de votre candidature');
    }
    setSubmitting(false);
  };

  const handleSubmitManual = async () => {
    const hasExistingCV = candidateProfile?.cv_url;
    const hasNewCV = manualData.cvFile;

    if (!hasExistingCV && !hasNewCV) {
      alert('Veuillez télécharger votre CV. Le CV est obligatoire pour postuler.');
      return;
    }

    if (jobDetails?.cover_letter_required && !manualData.coverLetter.trim()) {
      alert('Une lettre de motivation est requise par le recruteur pour cette offre.');
      return;
    }

    setSubmitting(true);
    try {
      let cvUrl = candidateProfile?.cv_url || '';

      if (manualData.cvFile) {
        const fileName = `${candidateId}-${Date.now()}.pdf`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('candidate-cvs')
          .upload(fileName, manualData.cvFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('candidate-cvs')
          .getPublicUrl(fileName);

        cvUrl = urlData.publicUrl;
      }

      const result = await applicationSubmissionService.submitApplication({
        jobId,
        candidateId,
        coverLetter: manualData.coverLetter,
        cvUrl: cvUrl
      });

      if (result.success) {
        onSuccess(result.applicationReference || '', result.nextSteps || []);
      } else {
        alert(result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Une erreur est survenue lors de l\'envoi de votre candidature');
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
      setManualData({ ...manualData, cvFile: file });
    }
  };

  const handleImportCoverLetter = (content: string, fileName?: string) => {
    setManualData({ ...manualData, coverLetter: content });
    setShowImportModal(false);
  };

  const completionPercentage = candidateProfile?.profile_completion_percentage || 0;
  const hasCV = !!candidateProfile?.cv_url;
  const hasCoverLetter = !!candidateProfile?.professional_summary?.trim();
  const coverLetterRequired = jobDetails?.cover_letter_required || false;
  const canUseProfile = completionPercentage >= 80 && hasCV && (!coverLetterRequired || hasCoverLetter);

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
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl">
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Postuler à cette offre</h2>
            <p className="text-blue-100 mt-1">{jobTitle} - {companyName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {mode === 'select' && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                Comment souhaitez-vous postuler ?
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => setMode('profile')}
                  disabled={!canUseProfile}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    canUseProfile
                      ? 'border-blue-500 hover:border-blue-600 hover:shadow-lg bg-blue-50'
                      : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      canUseProfile ? 'bg-blue-600' : 'bg-gray-400'
                    }`}>
                      <User className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Utiliser mon profil
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Postulez rapidement avec les informations de votre profil
                    </p>

                    {canUseProfile ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Profil {completionPercentage}% complété</span>
                        </div>
                        <div className="flex items-center gap-2 text-green-600 font-semibold">
                          <CheckCircle2 className="w-5 h-5" />
                          <span>CV enregistré</span>
                        </div>
                        {coverLetterRequired && (
                          <div className="flex items-center gap-2 text-green-600 font-semibold">
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Lettre de motivation présente</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {completionPercentage < 80 && (
                          <div className="flex items-center gap-2 text-orange-600 font-semibold text-xs">
                            <AlertCircle className="w-5 h-5" />
                            <span>Profil {completionPercentage}% (80% requis)</span>
                          </div>
                        )}
                        {!hasCV && (
                          <div className="flex items-center gap-2 text-orange-600 font-semibold text-xs">
                            <AlertCircle className="w-5 h-5" />
                            <span>CV manquant</span>
                          </div>
                        )}
                        {coverLetterRequired && !hasCoverLetter && (
                          <div className="flex items-center gap-2 text-orange-600 font-semibold text-xs">
                            <AlertCircle className="w-5 h-5" />
                            <span>Lettre de motivation manquante (requise)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => setMode('manual')}
                  className="relative p-6 rounded-xl border-2 border-green-500 hover:border-green-600 hover:shadow-lg bg-green-50 transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Candidature personnalisée
                    </h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Remplissez un formulaire spécifique pour cette offre
                    </p>
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Toujours disponible</span>
                    </div>
                  </div>
                </button>
              </div>

              {!canUseProfile && (
                <div className="mt-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                  <div className="flex gap-3">
                    <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-semibold text-orange-900 mb-1">
                        Conditions non remplies
                      </h5>
                      <p className="text-sm text-orange-700">
                        Pour utiliser votre profil, vous devez :
                      </p>
                      <ul className="text-sm text-orange-700 mt-2 space-y-1">
                        {completionPercentage < 80 && (
                          <li>• Compléter votre profil à au moins 80% (actuellement {completionPercentage}%)</li>
                        )}
                        {!hasCV && (
                          <li>• Ajouter un CV à votre profil</li>
                        )}
                        {coverLetterRequired && !hasCoverLetter && (
                          <li>• Ajouter une lettre de motivation (résumé professionnel) - requise par le recruteur</li>
                        )}
                      </ul>
                      <p className="text-sm text-orange-700 mt-2">
                        En attendant, vous pouvez faire une candidature personnalisée.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'profile' && candidateProfile && (
            <div>
              <button
                onClick={() => setMode('select')}
                className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                ← Retour
              </button>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-6 h-6 text-blue-600" />
                  Aperçu de votre candidature
                </h4>

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

                  {candidateProfile.title && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{candidateProfile.title}</span>
                    </div>
                  )}

                  {candidateProfile.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{candidateProfile.location}</span>
                    </div>
                  )}

                  {candidateProfile.experience_years !== undefined && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">
                        {candidateProfile.experience_years} an{candidateProfile.experience_years > 1 ? 's' : ''} d'expérience
                      </span>
                    </div>
                  )}

                  {candidateProfile.education_level && (
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700">{candidateProfile.education_level}</span>
                    </div>
                  )}

                  {candidateProfile.skills && candidateProfile.skills.length > 0 && (
                    <div className="pt-3 border-t border-gray-200">
                      <h5 className="font-semibold text-gray-900 mb-2 text-sm">Compétences</h5>
                      <div className="flex flex-wrap gap-2">
                        {candidateProfile.skills.slice(0, 5).map((skill, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {skill}
                          </span>
                        ))}
                        {candidateProfile.skills.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{candidateProfile.skills.length - 5} autres
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                  <div>
                    <h5 className="font-semibold text-green-900 mb-1">
                      Candidature rapide
                    </h5>
                    <p className="text-sm text-green-700">
                      Votre profil et votre CV seront automatiquement envoyés au recruteur.
                    </p>
                  </div>
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
                  onClick={handleSubmitWithProfile}
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

          {mode === 'manual' && (
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
                        <p className="text-xs text-green-700">Votre CV enregistré sera utilisé (vous pouvez en télécharger un nouveau si vous le souhaitez)</p>
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
                        !candidateProfile?.cv_url && !manualData.cvFile
                          ? 'border-red-300 hover:border-red-500'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      <Upload className={`w-6 h-6 ${!candidateProfile?.cv_url && !manualData.cvFile ? 'text-red-600' : 'text-gray-600'}`} />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {manualData.cvFile ? manualData.cvFile.name : (candidateProfile?.cv_url ? 'Télécharger un nouveau CV (optionnel)' : 'Télécharger votre CV (obligatoire)')}
                        </p>
                        <p className="text-sm text-gray-600">PDF, DOC, DOCX (max 5 MB)</p>
                      </div>
                    </label>
                  </div>

                  {!candidateProfile?.cv_url && !manualData.cvFile && (
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
                        <span className="text-red-600">* (requise par le recruteur)</span>
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
                    value={manualData.coverLetter}
                    onChange={(e) => setManualData({ ...manualData, coverLetter: e.target.value })}
                    rows={10}
                    placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste..."
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-2 text-sm text-gray-600">
                    {manualData.coverLetter.length} caractères
                  </p>
                </div>

                <div className={`border-2 rounded-lg p-4 ${coverLetterRequired ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h5 className={`font-semibold mb-2 flex items-center gap-2 ${coverLetterRequired ? 'text-orange-900' : 'text-blue-900'}`}>
                    <FileText className="w-5 h-5" />
                    {coverLetterRequired ? 'Lettre de motivation requise' : 'Conseils pour votre lettre de motivation'}
                  </h5>
                  {coverLetterRequired && (
                    <p className="text-sm text-orange-800 font-semibold mb-2">
                      Le recruteur exige une lettre de motivation pour cette offre.
                    </p>
                  )}
                  <ul className={`space-y-1 text-sm ${coverLetterRequired ? 'text-orange-800' : 'text-blue-800'}`}>
                    <li>• Personnalisez votre lettre pour ce poste spécifique</li>
                    <li>• Mettez en avant vos compétences pertinentes</li>
                    <li>• Expliquez votre motivation pour l'entreprise</li>
                    <li>• Restez concis et professionnel</li>
                  </ul>
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
                    onClick={handleSubmitManual}
                    disabled={submitting || (!candidateProfile?.cv_url && !manualData.cvFile) || (coverLetterRequired && !manualData.coverLetter.trim())}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
