import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Briefcase, Building2, Mail, Link as LinkIcon, FileText, Upload, Check,
  Loader2, Eye, Send, AlertCircle, CheckCircle, X, Edit2, Trash2, Plus, ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { externalJobImportService } from '../services/externalJobImportService';
import { externalApplicationService, SupplementaryDocument } from '../services/externalApplicationService';
import { externalApplicationEmailService } from '../services/externalApplicationEmailService';
import { candidateDocumentService } from '../services/candidateDocumentService';
import RichTextEditor from '../components/forms/RichTextEditor';

type Step = 'import' | 'details' | 'cv' | 'letter' | 'supplements' | 'message' | 'preview';

interface ExternalApplicationUpgradedProps {
  onNavigate?: (page: string, param?: string) => void;
}

export default function ExternalApplicationUpgraded({ onNavigate }: ExternalApplicationUpgradedProps) {
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>('import');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);

  const [hasAccess, setHasAccess] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [profileCompletion, setProfileCompletion] = useState(0);

  const [draftId, setDraftId] = useState<string>('');
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);

  const [formData, setFormData] = useState({
    job_title: '',
    company_name: '',
    job_url: '',
    external_application_url: '',
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

  const [supplementaryDocs, setSupplementaryDocs] = useState<SupplementaryDocument[]>([]);
  const [uploadingSupp, setUploadingSupp] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string>('');
  const [editingDocName, setEditingDocName] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' | 'warning') => {
    if (type === 'error') {
      setError(message);
      setSuccess('');
      setTimeout(() => setError(''), 5000);
    } else {
      setSuccess(message);
      setError('');
      setTimeout(() => setSuccess(''), 5000);
    }
  };

  useEffect(() => {
    checkAccess();
    initializeDraft();
    loadDocuments();
  }, [user]);

  useEffect(() => {
    if (draftId && user) {
      saveDraftData();
    }
  }, [formData, currentStep, cvOption, selectedCvId, letterOption, selectedLetterId, letterContent]);

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

  const initializeDraft = async () => {
    if (!user) return;

    const result = await externalApplicationService.getOrCreateDraft(user.id);
    if (result.success && result.data) {
      setDraftId(result.data.id);

      if (result.data.draft_data) {
        const draftData = result.data.draft_data;
        setFormData(prev => ({ ...prev, ...draftData.formData }));
        if (draftData.currentStep) setCurrentStep(draftData.currentStep);
        if (draftData.cvOption) setCvOption(draftData.cvOption);
        if (draftData.selectedCvId) setSelectedCvId(draftData.selectedCvId);
        if (draftData.letterOption) setLetterOption(draftData.letterOption);
        if (draftData.selectedLetterId) setSelectedLetterId(draftData.selectedLetterId);
        if (draftData.letterContent) setLetterContent(draftData.letterContent);
      }

      if (result.data.draft_step) {
        setCurrentStep(result.data.draft_step as Step);
      }

      if (result.data.id) {
        loadSupplementaryDocs(result.data.id);
      }
    }
  };

  const saveDraftData = useCallback(async () => {
    if (!draftId || !user || savingDraft) return;

    setSavingDraft(true);
    const draftData = {
      formData,
      currentStep,
      cvOption,
      selectedCvId,
      letterOption,
      selectedLetterId,
      letterContent
    };

    await externalApplicationService.saveDraft(draftId, user.id, currentStep, draftData);
    setSavingDraft(false);
  }, [draftId, user, formData, currentStep, cvOption, selectedCvId, letterOption, selectedLetterId, letterContent, savingDraft]);

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

  const loadSupplementaryDocs = async (applicationId: string) => {
    const result = await externalApplicationService.getSupplementaryDocuments(applicationId);
    if (result.success && result.data) {
      setSupplementaryDocs(result.data);
    }
  };

  const handleImportUrl = async () => {
    if (!importUrl.trim()) {
      showNotification('Veuillez saisir une URL', 'error');
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
        job_url: importUrl,
        external_application_url: result.data?.external_application_url || prev.external_application_url
      }));

      showNotification('Offre importée avec succès!', 'success');
      setTimeout(() => setCurrentStep('details'), 1000);
    } else {
      showNotification(result.error || 'Extraction partielle. Vous pouvez compléter manuellement.', 'warning');
      setFormData(prev => ({ ...prev, job_url: importUrl }));
      setTimeout(() => setCurrentStep('details'), 2000);
    }

    setImporting(false);
  };

  const handleUploadSupplementary = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !draftId || !user) return;

    const file = e.target.files[0];
    setUploadingSupp(true);

    const result = await externalApplicationService.uploadSupplementaryDocument(
      draftId,
      user.id,
      file
    );

    if (result.success) {
      showNotification('Document ajouté avec succès', 'success');
      loadSupplementaryDocs(draftId);
    } else {
      showNotification(result.error || 'Échec de l\'upload', 'error');
    }

    setUploadingSupp(false);
    e.target.value = '';
  };

  const handleDeleteSupplementary = async (doc: SupplementaryDocument) => {
    const result = await externalApplicationService.deleteSupplementaryDocument(doc.id, doc.storage_path);
    if (result.success) {
      showNotification('Document supprimé', 'success');
      loadSupplementaryDocs(draftId);
    } else {
      showNotification(result.error || 'Échec de la suppression', 'error');
    }
  };

  const handleRenameSupplementary = async (docId: string, newName: string) => {
    if (!newName.trim()) return;

    const result = await externalApplicationService.renameSupplementaryDocument(docId, newName);
    if (result.success) {
      showNotification('Document renommé', 'success');
      loadSupplementaryDocs(draftId);
      setEditingDocId('');
    } else {
      showNotification(result.error || 'Échec du renommage', 'error');
    }
  };

  const handleSubmit = async () => {
    if (!user || !draftId) return;

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

      const finalizeResult = await externalApplicationService.finalizeDraft(draftId, user.id);

      if (!finalizeResult.success) {
        throw new Error(finalizeResult.error || 'Échec de la finalisation');
      }

      if (draftId) {
        await externalApplicationEmailService.sendApplicationEmail(draftId);
      }

      showNotification('Votre dossier est prêt. Cliquez sur le lien du recruteur pour finaliser votre candidature.', 'success');

      if (formData.external_application_url) {
        setTimeout(() => {
          window.open(formData.external_application_url, '_blank');
        }, 2000);
      }

      setTimeout(() => onNavigate?.('external-applications'), 3000);

    } catch (err: any) {
      showNotification(err.message || 'Erreur lors de l\'envoi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 'import':
        return true;
      case 'details':
        return !!(
          formData.job_title &&
          formData.company_name &&
          formData.recruiter_email &&
          formData.external_application_url
        );
      case 'cv':
        return !!(
          (cvOption === 'profile') ||
          (cvOption === 'document_center' && selectedCvId) ||
          (cvOption === 'upload' && uploadedCv)
        );
      case 'letter':
        return !!(
          (letterOption === 'new' && letterContent) ||
          (letterOption === 'existing' && selectedLetterId)
        );
      case 'supplements':
        return true;
      case 'message':
        return true;
      case 'preview':
        return true;
      default:
        return false;
    }
  };

  const getStepStatus = (step: Step): 'completed' | 'current' | 'locked' | 'pending' => {
    const steps: Step[] = ['import', 'details', 'cv', 'letter', 'supplements', 'message', 'preview'];
    const currentIndex = steps.indexOf(currentStep);
    const stepIndex = steps.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';

    if (step === 'cv' && (!formData.job_title || !formData.external_application_url)) return 'locked';
    if (step === 'letter' && !isStepValid()) return 'locked';

    return 'pending';
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
    { id: 'import', label: 'Import', icon: LinkIcon },
    { id: 'details', label: 'Détails', icon: FileText },
    { id: 'cv', label: 'CV', icon: Upload },
    { id: 'letter', label: 'Lettre', icon: Mail },
    { id: 'supplements', label: 'Documents', icon: Plus },
    { id: 'message', label: 'Message', icon: Briefcase },
    { id: 'preview', label: 'Aperçu', icon: Eye }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
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
              Pipeline complet et sécurisé - Toutes vos données sont sauvegardées automatiquement
            </p>
            {savingDraft && (
              <p className="text-orange-100 text-sm mt-2 flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Sauvegarde automatique...
              </p>
            )}
          </div>

          <div className="p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const status = getStepStatus(step.id as Step);
                  const isActive = step.id === currentStep;
                  const isCompleted = status === 'completed';
                  const isLocked = status === 'locked';

                  return (
                    <React.Fragment key={step.id}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                            isCompleted
                              ? 'bg-green-500 text-white'
                              : isActive
                              ? 'bg-orange-600 text-white'
                              : isLocked
                              ? 'bg-gray-300 text-gray-500'
                              : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                        </div>
                        <span className={`text-xs ${isActive ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                          {step.label}
                        </span>
                        {isLocked && (
                          <span className="text-xs text-red-500 mt-1">Requis</span>
                        )}
                      </div>
                      {index < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {currentStep === 'import' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Importer une offre via URL (optionnel)
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
                      Lien de candidature externe *
                      <span className="text-xs text-gray-500 ml-2">
                        (URL où vous devez postuler après préparation)
                      </span>
                    </label>
                    <input
                      type="url"
                      value={formData.external_application_url}
                      onChange={(e) => setFormData({ ...formData, external_application_url: e.target.value })}
                      placeholder="https://exemple.com/postuler"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      required
                    />
                    {formData.external_application_url && (
                      <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Lien enregistré - Vous serez redirigé après préparation du dossier
                      </p>
                    )}
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
                      URL de l'offre (pour référence)
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Sélectionner votre CV *
                </h3>
                <p className="text-red-600 text-sm mb-4 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Le CV est obligatoire pour continuer
                </p>

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
                          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Lettre de motivation *
                </h3>
                <p className="text-red-600 text-sm mb-4 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  La lettre de motivation est obligatoire pour continuer
                </p>

                <div className="space-y-4">
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
                        {letterContent && (
                          <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Lettre rédigée ({letterContent.length} caractères)
                          </p>
                        )}
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

            {currentStep === 'supplements' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Documents complémentaires (optionnel)
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Certains recruteurs demandent des documents supplémentaires (diplômes, attestations, portfolio, etc.)
                </p>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="supp-upload"
                      onChange={handleUploadSupplementary}
                      className="hidden"
                      multiple={false}
                    />
                    <label
                      htmlFor="supp-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      {uploadingSupp ? (
                        <Loader2 className="w-8 h-8 text-orange-600 animate-spin mb-2" />
                      ) : (
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      )}
                      <span className="text-sm text-gray-600">
                        {uploadingSupp ? 'Upload en cours...' : 'Cliquez pour ajouter un document'}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, JPG, PNG (max 10 MB)</span>
                    </label>
                  </div>

                  {supplementaryDocs.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Documents joints ({supplementaryDocs.length})</h4>
                      {supplementaryDocs.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          {editingDocId === doc.id ? (
                            <div className="flex-1 flex gap-2">
                              <input
                                type="text"
                                value={editingDocName}
                                onChange={(e) => setEditingDocName(e.target.value)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded"
                                autoFocus
                              />
                              <button
                                onClick={() => handleRenameSupplementary(doc.id, editingDocName)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingDocId('')}
                                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{doc.document_name}</p>
                                <p className="text-xs text-gray-500">
                                  {doc.file_type.toUpperCase()} - {(doc.file_size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingDocId(doc.id);
                                    setEditingDocName(doc.document_name);
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Renommer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSupplementary(doc)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
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
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Dossier complet - Prêt à envoyer
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">CV sélectionné</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Lettre de motivation incluse</span>
                      </div>
                      {supplementaryDocs.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">{supplementaryDocs.length} document(s) supplémentaire(s)</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Lien de candidature externe configuré</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Offre</h4>
                    <p className="text-gray-700"><strong>{formData.job_title}</strong></p>
                    <p className="text-gray-600">{formData.company_name}</p>
                    {formData.external_application_url && (
                      <a
                        href={formData.external_application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 text-sm flex items-center gap-1 mt-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Lien de candidature externe
                      </a>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Destinataire</h4>
                    <p className="text-gray-700">{formData.recruiter_name || 'Recruteur'}</p>
                    <p className="text-gray-600">{formData.recruiter_email}</p>
                  </div>

                  {formData.custom_message && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">Message personnalisé</h4>
                      <p className="text-gray-700 whitespace-pre-wrap">{formData.custom_message}</p>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      Après validation, votre dossier sera envoyé au recruteur par email et vous serez automatiquement
                      redirigé vers le lien de candidature externe pour finaliser votre candidature.
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
                    if (!isStepValid()) {
                      if (currentStep === 'details' && !formData.external_application_url) {
                        showNotification('Le lien de candidature externe est obligatoire', 'warning');
                      } else if (currentStep === 'cv') {
                        showNotification('Le CV est obligatoire pour continuer', 'warning');
                      } else if (currentStep === 'letter') {
                        showNotification('La lettre de motivation est obligatoire pour continuer', 'warning');
                      } else {
                        showNotification('Veuillez compléter cette étape avant de continuer', 'warning');
                      }
                      return;
                    }

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
                      Préparation en cours...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Finaliser et accéder au lien externe
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
