import React, { useState, useEffect } from 'react';
import { ArrowLeft, Briefcase, Building2, Mail, Link as LinkIcon, FileText, Upload, Check, Loader2, Eye, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { externalJobImportService } from '../services/externalJobImportService';
import { externalApplicationService } from '../services/externalApplicationService';
import { externalApplicationEmailService } from '../services/externalApplicationEmailService';
import { candidateDocumentService } from '../services/candidateDocumentService';
import RichTextEditor from '../components/forms/RichTextEditor';

type Step = 'import' | 'details' | 'cv' | 'letter' | 'message' | 'preview';

interface ExternalApplicationProps {
  onNavigate?: (page: string, param?: string) => void;
}

export default function ExternalApplication({ onNavigate }: ExternalApplicationProps) {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('import');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [profileCompletion, setProfileCompletion] = useState(0);

  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    job_url: '',
    job_description: '',
    recruiter_email: '',
    recruiter_name: '',
    custom_message: ''
  });

  const [cvOption, setCvOption] = useState<'profile' | 'document_center' | 'upload'>('profile');
  const [selectedCvId, setSelectedCvId] = useState('');
  const [uploadedCv, setUploadedCv] = useState<File | null>(null);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);

  const [letterOption, setLetterOption] = useState<'none' | 'new' | 'existing'>('none');
  const [letterContent, setLetterContent] = useState('');
  const [selectedLetterId, setSelectedLetterId] = useState('');
  const [availableLetters, setAvailableLetters] = useState<any[]>([]);

  const [additionalDocuments, setAdditionalDocuments] = useState<string[]>([]);

  useEffect(() => {
    checkAccess();
    loadDocuments();
  }, [user]);

  const checkAccess = async () => {
    if (!user) return;

    setLoading(true);
    const result = await externalApplicationService.checkAccess(user.id);

    setHasAccess(result.hasAccess);
    setAccessMessage(result.reason || '');
    setProfileCompletion(result.profileCompletion || 0);
    setLoading(false);

    if (!result.hasAccess) {
      setError(result.reason || 'Accès refusé');
    }
  };

  const loadDocuments = async () => {
    if (!user) return;

    const result = await candidateDocumentService.getDocuments(user.id);
    if (result.success && result.data) {
      const cvDocs = result.data.filter(doc => doc.document_type === 'cv');
      const letterDocs = result.data.filter(doc => doc.document_type === 'cover_letter');

      setAvailableDocuments(cvDocs);
      setAvailableLetters(letterDocs);
    }
  };

  const handleImportUrl = async () => {
    if (!importUrl.trim()) {
      setError('Veuillez saisir une URL');
      return;
    }

    setImporting(true);
    setError('');

    const result = await externalJobImportService.importJobFromURL(importUrl);

    if (result.success && result.data) {
      setFormData(prev => ({
        ...prev,
        job_title: result.data?.job_title || prev.job_title,
        company_name: result.data?.company_name || prev.company_name,
        job_description: result.data?.job_description || prev.job_description,
        recruiter_email: result.data?.recruiter_email || prev.recruiter_email,
        recruiter_name: result.data?.recruiter_name || prev.recruiter_name,
        job_url: importUrl
      }));

      setSuccess('Offre importée avec succès!');
      setTimeout(() => setCurrentStep('details'), 1000);
    } else {
      setError(result.error || 'Échec de l\'import. Veuillez saisir manuellement.');
      setFormData(prev => ({ ...prev, job_url: importUrl }));
      setTimeout(() => setCurrentStep('details'), 2000);
    }

    setImporting(false);
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      let cvDocId = selectedCvId;

      if (cvOption === 'upload' && uploadedCv) {
        const uploadResult = await candidateDocumentService.uploadDocument(
          user.id,
          uploadedCv,
          'cv',
          uploadedCv.name
        );

        if (!uploadResult.success) {
          throw new Error('Échec de l\'upload du CV');
        }

        cvDocId = uploadResult.data?.id || '';
      }

      let letterDocId = selectedLetterId;

      if (letterOption === 'new' && letterContent) {
        const blob = new Blob([letterContent], { type: 'text/html' });
        const file = new File([blob], 'lettre_motivation.html', { type: 'text/html' });

        const uploadResult = await candidateDocumentService.uploadDocument(
          user.id,
          file,
          'cover_letter',
          `Lettre - ${formData.company_name}`
        );

        if (uploadResult.success && uploadResult.data) {
          letterDocId = uploadResult.data.id;
        }
      }

      const applicationData = {
        ...formData,
        cv_document_id: cvDocId || undefined,
        cover_letter_document_id: letterDocId || undefined,
        additional_document_ids: additionalDocuments,
        cv_source: cvOption,
        imported_from_url: !!importUrl
      };

      const result = await externalApplicationService.createApplication(
        user.id,
        applicationData
      );

      if (!result.success) {
        throw new Error(result.error || 'Échec de la création');
      }

      if (result.data) {
        await externalApplicationEmailService.sendApplicationEmail(result.data.id);
      }

      setSuccess('Candidature envoyée avec succès!');
      setTimeout(() => onNavigate?.('external-applications'), 2000);

    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'import':
        return true;
      case 'details':
        return !!(formData.job_title && formData.company_name && formData.recruiter_email);
      case 'cv':
        return !!(
          (cvOption === 'profile') ||
          (cvOption === 'document_center' && selectedCvId) ||
          (cvOption === 'upload' && uploadedCv)
        );
      case 'letter':
        return true;
      case 'message':
        return true;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  if (loading && !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Accès aux candidatures externes
            </h2>
            <p className="text-gray-600 mb-6">{accessMessage}</p>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Complétion du profil</span>
                <span className="font-semibold text-gray-900">{profileCompletion}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => onNavigate?.('candidate-dashboard')}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Retour au tableau de bord
              </button>
              <button
                onClick={() => onNavigate?.('candidate-profile-form')}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Compléter mon profil
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'import', label: 'Import offre', icon: LinkIcon },
    { id: 'details', label: 'Détails', icon: FileText },
    { id: 'cv', label: 'CV', icon: Upload },
    { id: 'letter', label: 'Lettre', icon: Mail },
    { id: 'message', label: 'Message', icon: Briefcase },
    { id: 'preview', label: 'Aperçu', icon: Eye }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => onNavigate?.('candidate-dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-8 py-6">
            <h1 className="text-2xl font-bold text-white mb-2">
              Postuler à une offre externe
            </h1>
            <p className="text-orange-100">
              Utilisez votre profil JobGuinée pour candidater à des offres externes
            </p>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  const isCompleted = index < currentStepIndex;

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isActive
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <span className={`text-xs ${isActive ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                          {step.label}
                        </span>
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            {currentStep === 'import' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Importer une offre via URL
                </h3>
                <p className="text-gray-600 mb-6">
                  Collez l'URL de l'offre d'emploi pour extraire automatiquement les informations.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de l'offre
                    </label>
                    <input
                      type="url"
                      value={importUrl}
                      onChange={(e) => setImportUrl(e.target.value)}
                      placeholder="https://exemple.com/offre-emploi"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleImportUrl}
                      disabled={importing || !importUrl.trim()}
                      className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-5 h-5" />
                          Importer l'offre
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setCurrentStep('details')}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Saisie manuelle
                    </button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'details' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Détails de l'offre
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Titre du poste *
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Entreprise *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email du recruteur *
                    </label>
                    <input
                      type="email"
                      value={formData.recruiter_email}
                      onChange={(e) => setFormData({ ...formData, recruiter_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du recruteur
                    </label>
                    <input
                      type="text"
                      value={formData.recruiter_name}
                      onChange={(e) => setFormData({ ...formData, recruiter_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL de l'offre
                    </label>
                    <input
                      type="url"
                      value={formData.job_url}
                      onChange={(e) => setFormData({ ...formData, job_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description du poste
                    </label>
                    <textarea
                      value={formData.job_description}
                      onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'cv' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Sélectionner votre CV
                </h3>

                <div className="space-y-4">
                  <div
                    onClick={() => setCvOption('profile')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      cvOption === 'profile'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        cvOption === 'profile' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {cvOption === 'profile' && <div className="w-3 h-3 bg-orange-600 rounded-full" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Utiliser le CV de mon profil</p>
                        <p className="text-sm text-gray-600">CV principal associé à votre profil JobGuinée</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setCvOption('document_center')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      cvOption === 'document_center'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        cvOption === 'document_center' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {cvOption === 'document_center' && <div className="w-3 h-3 bg-orange-600 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Choisir depuis mes documents</p>
                        <p className="text-sm text-gray-600">Sélectionner un CV de votre centre de documents</p>
                      </div>
                    </div>

                    {cvOption === 'document_center' && (
                      <div className="mt-4 space-y-2">
                        {availableDocuments.map(doc => (
                          <div
                            key={doc.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCvId(doc.id);
                            }}
                            className={`p-3 border rounded-lg cursor-pointer ${
                              selectedCvId === doc.id
                                ? 'border-orange-600 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <p className="font-medium text-gray-900">{doc.document_name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        ))}

                        {availableDocuments.length === 0 && (
                          <p className="text-sm text-gray-500 italic">Aucun CV disponible</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => setCvOption('upload')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      cvOption === 'upload'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        cvOption === 'upload' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {cvOption === 'upload' && <div className="w-3 h-3 bg-orange-600 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Uploader un nouveau CV</p>
                        <p className="text-sm text-gray-600">Télécharger un CV spécifique pour cette candidature</p>
                      </div>
                    </div>

                    {cvOption === 'upload' && (
                      <div className="mt-4">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setUploadedCv(e.target.files?.[0] || null)}
                          className="w-full"
                        />
                        {uploadedCv && (
                          <p className="mt-2 text-sm text-green-600">
                            Fichier sélectionné: {uploadedCv.name}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'letter' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Lettre de motivation
                </h3>

                <div className="space-y-4">
                  <div
                    onClick={() => setLetterOption('none')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      letterOption === 'none'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        letterOption === 'none' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {letterOption === 'none' && <div className="w-3 h-3 bg-orange-600 rounded-full" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Ne pas joindre de lettre</p>
                        <p className="text-sm text-gray-600">Si l'offre ne l'exige pas</p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => setLetterOption('new')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      letterOption === 'new'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        letterOption === 'new' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {letterOption === 'new' && <div className="w-3 h-3 bg-orange-600 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Créer une nouvelle lettre</p>
                        <p className="text-sm text-gray-600">Rédiger une lettre spécifique pour cette offre</p>
                      </div>
                    </div>

                    {letterOption === 'new' && (
                      <div className="mt-4">
                        <RichTextEditor
                          value={letterContent}
                          onChange={setLetterContent}
                          placeholder="Rédigez votre lettre de motivation..."
                        />
                      </div>
                    )}
                  </div>

                  <div
                    onClick={() => setLetterOption('existing')}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      letterOption === 'existing'
                        ? 'border-orange-600 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        letterOption === 'existing' ? 'border-orange-600' : 'border-gray-300'
                      }`}>
                        {letterOption === 'existing' && <div className="w-3 h-3 bg-orange-600 rounded-full" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Utiliser une lettre existante</p>
                        <p className="text-sm text-gray-600">Sélectionner depuis vos documents</p>
                      </div>
                    </div>

                    {letterOption === 'existing' && (
                      <div className="mt-4 space-y-2">
                        {availableLetters.map(letter => (
                          <div
                            key={letter.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLetterId(letter.id);
                            }}
                            className={`p-3 border rounded-lg cursor-pointer ${
                              selectedLetterId === letter.id
                                ? 'border-orange-600 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <p className="font-medium text-gray-900">{letter.document_name}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(letter.uploaded_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        ))}

                        {availableLetters.length === 0 && (
                          <p className="text-sm text-gray-500 italic">Aucune lettre disponible</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'message' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Message personnalisé (optionnel)
                </h3>
                <p className="text-gray-600 mb-6">
                  Ajoutez un message personnalisé qui sera inclus dans l'email de candidature.
                </p>

                <textarea
                  value={formData.custom_message}
                  onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                  rows={6}
                  placeholder="Ex: Je suis particulièrement intéressé par ce poste car..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            {currentStep === 'preview' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Aperçu de votre candidature
                </h3>

                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Offre</h4>
                    <p className="text-gray-700"><strong>{formData.job_title}</strong></p>
                    <p className="text-gray-600">{formData.company_name}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Destinataire</h4>
                    <p className="text-gray-700">{formData.recruiter_name || 'Recruteur'}</p>
                    <p className="text-gray-600">{formData.recruiter_email}</p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Documents joints</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li>✓ CV ({cvOption === 'profile' ? 'Profil' : cvOption === 'document_center' ? 'Mes documents' : 'Uploadé'})</li>
                      {letterOption !== 'none' && <li>✓ Lettre de motivation</li>}
                    </ul>
                  </div>

                  {formData.custom_message && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Message personnalisé</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{formData.custom_message}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Un lien vers votre profil public JobGuinée sera automatiquement inclus dans l'email,
                      permettant au recruteur de consulter votre profil complet sans créer de compte.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-8">
              {currentStep !== 'import' && (
                <button
                  onClick={() => {
                    const stepIndex = steps.findIndex(s => s.id === currentStep);
                    if (stepIndex > 0) {
                      setCurrentStep(steps[stepIndex - 1].id as Step);
                    }
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Précédent
                </button>
              )}

              {currentStep !== 'preview' ? (
                <button
                  onClick={() => {
                    const stepIndex = steps.findIndex(s => s.id === currentStep);
                    if (stepIndex < steps.length - 1) {
                      setCurrentStep(steps[stepIndex + 1].id as Step);
                    }
                  }}
                  disabled={!isStepValid()}
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer la candidature
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
