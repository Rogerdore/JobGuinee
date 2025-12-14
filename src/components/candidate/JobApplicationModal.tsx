import { useState, useEffect } from 'react';
import {
  X, FileText, User, Upload, CheckCircle2, AlertCircle,
  Briefcase, Mail, Phone, MapPin, Award, Clock, Send, FolderOpen,
  Sparkles, Zap, Edit3, Plus, ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { applicationSubmissionService } from '../../services/applicationSubmissionService';
import { fastApplicationValidator, ValidationResult } from '../../services/fastApplicationValidator';
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

type ApplicationMode = 'select' | 'quick' | 'custom';

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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showMissingFieldsModal, setShowMissingFieldsModal] = useState(false);

  const [customData, setCustomData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    coverLetter: '',
    cvFile: null as File | null,
    useExistingCV: true,
    saveNewCVToProfile: false,
    desiredSalary: '',
    additionalComments: ''
  });

  useEffect(() => {
    loadData();
  }, [candidateId, jobId]);

  useEffect(() => {
    if (profileData && candidateProfile) {
      const nameParts = (profileData.full_name || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      setCustomData(prev => ({
        ...prev,
        firstName: firstName,
        lastName: lastName,
        email: profileData.email || '',
        phone: profileData.phone || '',
        useExistingCV: !!candidateProfile.cv_url
      }));
    }
  }, [profileData, candidateProfile]);

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

  const handleQuickApplyClick = async () => {
    const validation = await fastApplicationValidator.checkEligibility(candidateId, jobId);
    setValidationResult(validation);

    if (!validation.isEligible) {
      setShowMissingFieldsModal(true);
      return;
    }

    setMode('quick');
  };

  const handleQuickApply = async () => {
    if (!candidateProfile?.cv_url) {
      alert('Veuillez d\'abord ajouter un CV à votre profil ou utiliser une autre méthode de candidature.');
      return;
    }

    if (jobDetails?.cover_letter_required && !candidateProfile?.professional_summary?.trim()) {
      alert('Une lettre de motivation est requise. Veuillez utiliser la candidature classique.');
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

  const handleCompleteProfile = () => {
    sessionStorage.setItem('pendingApplicationJobId', jobId);
    sessionStorage.setItem('pendingApplicationJobTitle', jobTitle);
    sessionStorage.setItem('pendingApplicationCompanyName', companyName);
    window.location.href = '/candidate-dashboard?tab=profile';
  };

  const handleCustomSubmit = async () => {
    if (!customData.firstName.trim()) {
      alert('Le prénom est obligatoire.');
      return;
    }

    if (!customData.lastName.trim()) {
      alert('Le nom est obligatoire.');
      return;
    }

    if (!customData.email.trim()) {
      alert('L\'email est obligatoire.');
      return;
    }

    if (!customData.phone.trim()) {
      alert('Le téléphone est obligatoire.');
      return;
    }

    const hasExistingCV = candidateProfile?.cv_url && customData.useExistingCV;
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
      const fullName = `${customData.firstName} ${customData.lastName}`.trim();

      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: customData.phone
        })
        .eq('id', candidateId);

      let cvUrl = (hasExistingCV ? candidateProfile?.cv_url : '') || '';

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

        if (customData.saveNewCVToProfile) {
          await supabase
            .from('candidate_profiles')
            .update({ cv_url: cvUrl })
            .eq('id', candidateId);
        }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl max-h-[calc(100vh-4rem)]">
        <div className="max-h-full overflow-y-auto rounded-2xl">
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
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Choisissez la meilleure façon de postuler
                </h3>
                <p className="text-gray-600">
                  Nous vous aidons à maximiser vos chances de sélection
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OPTION 1 - CANDIDATURE RAPIDE */}
                <button
                  onClick={handleQuickApplyClick}
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

                {/* OPTION 2 - CANDIDATURE CLASSIQUE */}
                <button
                  onClick={() => setMode('custom')}
                  className="group relative p-6 rounded-xl border-2 border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-xl transition-all hover:border-gray-500"
                >
                  <div className="flex flex-col h-full">
                    <div className="w-14 h-14 rounded-full bg-gray-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <FileText className="w-7 h-7 text-white" />
                    </div>

                    <h4 className="text-lg font-bold text-gray-900 mb-2 text-left">
                      Candidature Classique
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
                        Le recruteur exige une lettre de motivation pour cette offre. Vous devrez la fournir via la <strong>candidature classique</strong>.
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

          {mode === 'custom' && (
            <div>
              <button
                onClick={() => setMode('select')}
                className="mb-6 text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
              >
                ← Retour
              </button>

              <div className="space-y-8">
                {/* Section 1: Informations candidat */}
                <div>
                  <h5 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg border-b-2 border-blue-500 pb-3">
                    <User className="w-6 h-6 text-blue-600" />
                    1. Informations candidat
                  </h5>
                  <div className="space-y-4">
                    {/* Prénom */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Prénom <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={customData.firstName}
                        onChange={(e) => setCustomData({ ...customData, firstName: e.target.value })}
                        placeholder="Ex: Jean"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {!customData.firstName && (
                        <p className="mt-1 text-xs text-red-600">Ce champ est obligatoire</p>
                      )}
                    </div>

                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Nom <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={customData.lastName}
                        onChange={(e) => setCustomData({ ...customData, lastName: e.target.value })}
                        placeholder="Ex: Dupont"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {!customData.lastName && (
                        <p className="mt-1 text-xs text-red-600">Ce champ est obligatoire</p>
                      )}
                    </div>

                    {/* Email (non modifiable) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Email <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="email"
                        value={customData.email}
                        readOnly
                        disabled
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        L'email est celui de votre compte et ne peut pas être modifié ici
                      </p>
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Téléphone <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customData.phone}
                        onChange={(e) => setCustomData({ ...customData, phone: e.target.value })}
                        placeholder="Ex: +224 XXX XX XX XX"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {!customData.phone && (
                        <p className="mt-1 text-xs text-red-600">Ce champ est obligatoire</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 2: CV */}
                <div>
                  <h5 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg border-b-2 border-gray-400 pb-3">
                    <Briefcase className="w-6 h-6 text-gray-700" />
                    2. CV <span className="text-red-600">*</span>
                  </h5>

                  {candidateProfile?.cv_url ? (
                    <div className="space-y-4">
                      {/* Option: CV existant */}
                      <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition hover:bg-white" style={{ borderColor: customData.useExistingCV ? '#3b82f6' : '#d1d5db', backgroundColor: customData.useExistingCV ? '#eff6ff' : 'white' }}>
                        <input
                          type="radio"
                          name="cvChoice"
                          checked={customData.useExistingCV}
                          onChange={() => setCustomData({ ...customData, useExistingCV: true, cvFile: null })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <p className="font-semibold text-gray-900">Utiliser mon CV enregistré</p>
                          </div>
                          <p className="text-sm text-gray-600">Votre CV sera automatiquement joint à la candidature</p>
                          {customData.useExistingCV && (
                            <a
                              href={candidateProfile.cv_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Voir mon CV
                            </a>
                          )}
                        </div>
                      </label>

                      {/* Option: Nouveau CV */}
                      <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition hover:bg-white" style={{ borderColor: !customData.useExistingCV ? '#3b82f6' : '#d1d5db', backgroundColor: !customData.useExistingCV ? '#eff6ff' : 'white' }}>
                        <input
                          type="radio"
                          name="cvChoice"
                          checked={!customData.useExistingCV}
                          onChange={() => setCustomData({ ...customData, useExistingCV: false })}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Upload className="w-5 h-5 text-gray-700" />
                            <p className="font-semibold text-gray-900">Télécharger un nouveau CV</p>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">Pour cette candidature spécifique</p>

                          {!customData.useExistingCV && (
                            <div className="mt-3 space-y-3">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="cv-upload-new"
                              />
                              <label
                                htmlFor="cv-upload-new"
                                className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg cursor-pointer transition"
                              >
                                <Upload className="w-5 h-5 text-gray-600" />
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {customData.cvFile ? customData.cvFile.name : 'Cliquez pour sélectionner un fichier'}
                                  </p>
                                  <p className="text-sm text-gray-600">PDF, DOC, DOCX, Image (max 5 MB)</p>
                                </div>
                              </label>

                              {customData.cvFile && (
                                <label className="flex items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={customData.saveNewCVToProfile}
                                    onChange={(e) => setCustomData({ ...customData, saveNewCVToProfile: e.target.checked })}
                                    className="rounded border-gray-300"
                                  />
                                  <span className="text-gray-700">Enregistrer ce CV dans mon profil pour les futures candidatures</span>
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="cv-upload"
                      />
                      <label
                        htmlFor="cv-upload"
                        className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-red-300 hover:border-red-500 rounded-lg cursor-pointer transition"
                      >
                        <Upload className="w-6 h-6 text-red-600" />
                        <div>
                          <p className="font-semibold text-gray-900">
                            {customData.cvFile ? customData.cvFile.name : 'Télécharger votre CV (obligatoire)'}
                          </p>
                          <p className="text-sm text-gray-600">PDF, DOC, DOCX, Image (max 5 MB)</p>
                        </div>
                      </label>

                      {!customData.cvFile && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          Le CV est obligatoire pour postuler
                        </p>
                      )}

                      {customData.cvFile && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={customData.saveNewCVToProfile}
                            onChange={(e) => setCustomData({ ...customData, saveNewCVToProfile: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <span className="text-gray-700">Enregistrer ce CV dans mon profil pour les futures candidatures</span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Lettre de motivation - intégrée dans la section CV */}
                  <div className="mt-8 pt-8 border-t-2 border-gray-200">
                    <h6 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-base">
                      <FileText className="w-5 h-5 text-purple-600" />
                      Lettre de motivation {coverLetterRequired ? (
                        <span className="text-red-600">*</span>
                      ) : (
                        <span className="text-gray-500 font-normal text-sm">(recommandée)</span>
                      )}
                    </h6>

                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowImportModal(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium transition"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Importer
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            alert('Cette fonctionnalité IA est disponible pour les utilisateurs Premium. Elle vous permettra de générer ou améliorer automatiquement votre lettre de motivation.');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium transition shadow-md"
                        >
                          <Sparkles className="w-4 h-4" />
                          Générer / Améliorer avec l'IA
                        </button>
                      </div>

                      <textarea
                        value={customData.coverLetter}
                        onChange={(e) => setCustomData({ ...customData, coverLetter: e.target.value })}
                        rows={12}
                        placeholder="Expliquez pourquoi vous êtes le candidat idéal pour ce poste...

Exemple :
Madame, Monsieur,

Je me permets de vous présenter ma candidature pour le poste de [titre du poste]...

[Expérience et compétences pertinentes]

[Motivation et valeur ajoutée]

Cordialement"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-sans"
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          {customData.coverLetter.length} caractères
                        </p>
                        {coverLetterRequired && !customData.coverLetter.trim() && (
                          <p className="text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-4 h-4" />
                            Ce champ est requis par le recruteur
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                  <button
                    onClick={() => setMode('select')}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={
                      submitting ||
                      !customData.firstName.trim() ||
                      !customData.lastName.trim() ||
                      !customData.phone.trim() ||
                      (!(candidateProfile?.cv_url && customData.useExistingCV) && !customData.cvFile) ||
                      (coverLetterRequired && !customData.coverLetter.trim())
                    }
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
            )}
          </div>
        </div>
      </div>

      {/* Modal de champs manquants pour candidature rapide */}
      {showMissingFieldsModal && validationResult && !validationResult.isEligible && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl">
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Profil Incomplet</h3>
                  <p className="text-orange-100 text-sm">Complétez votre profil pour postuler</p>
                </div>
              </div>
              <button
                onClick={() => setShowMissingFieldsModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4">
                  Pour utiliser la <strong>Candidature Rapide</strong>, votre profil doit contenir toutes les informations obligatoires.
                </p>
                <p className="text-sm text-gray-600">
                  Il vous manque les éléments suivants :
                </p>
              </div>

              <div className="space-y-3 mb-6">
                {validationResult.missingFields.map((field, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${
                      field.isJobSpecific
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                        field.isJobSpecific ? 'text-orange-600' : 'text-red-600'
                      }`} />
                      <div className="flex-1">
                        <h4 className={`font-semibold ${
                          field.isJobSpecific ? 'text-orange-900' : 'text-red-900'
                        }`}>
                          {field.label}
                          {field.isJobSpecific && (
                            <span className="ml-2 text-xs px-2 py-0.5 bg-orange-200 text-orange-800 rounded-full">
                              Exigé par l'offre
                            </span>
                          )}
                        </h4>
                        <p className={`text-sm mt-1 ${
                          field.isJobSpecific ? 'text-orange-700' : 'text-red-700'
                        }`}>
                          {field.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-blue-900 mb-1">
                      Autres options disponibles
                    </h5>
                    <p className="text-sm text-blue-700">
                      En attendant, vous pouvez utiliser la <strong>Candidature Classique</strong> qui ne nécessite pas un profil 100% complet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowMissingFieldsModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition"
                >
                  Retour
                </button>
                <button
                  onClick={handleCompleteProfile}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-lg"
                >
                  <ExternalLink className="w-5 h-5" />
                  Compléter mon profil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CoverLetterImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportCoverLetter}
        candidateId={candidateId}
      />
    </div>
  );
}
