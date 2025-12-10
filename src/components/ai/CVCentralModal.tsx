import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Sparkles,
  Upload,
  Target,
  ChevronRight,
  ChevronLeft,
  Download,
  Check,
  AlertCircle,
  Loader,
  User,
  Edit3,
  FileDown,
  Briefcase,
  Search,
  Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import TemplateSelector from './TemplateSelector';
import { IAConfigService } from '../../services/iaConfigService';
import PDFService from '../../services/pdfService';
import UserProfileService, { CVInputData } from '../../services/userProfileService';
import { CVBuilderService } from '../../services/cvBuilderService';
import { CVImproverService } from '../../services/cvImproverService';
import { CVTargetedService, JobOffer } from '../../services/cvTargetedService';
import { supabase } from '../../lib/supabase';

type CVMode = 'create' | 'improve' | 'target';
type Step = 1 | 2 | 3 | 4 | 5;
type InputSource = 'profile' | 'manual';

interface CVCentralModalProps {
  onClose: () => void;
}

interface JobListing {
  id: string;
  title: string;
  location: string;
  contract_type: string;
  salary_min: number;
  salary_max: number;
  description: string;
  requirements: string;
  responsibilities: string;
  company: {
    name: string;
    logo_url: string;
  };
}

export default function CVCentralModal({ onClose }: CVCentralModalProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [selectedMode, setSelectedMode] = useState<CVMode | null>(null);
  const [inputSource, setInputSource] = useState<InputSource>('profile');

  const [cvData, setCVData] = useState<CVInputData>(UserProfileService.getEmptyInput());
  const [existingCV, setExistingCV] = useState<string>('');
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [jobDescription, setJobDescription] = useState<string>('');

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [previewFormat, setPreviewFormat] = useState<string>('html');

  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showCreditModal, setShowCreditModal] = useState(false);

  const [finalCV, setFinalCV] = useState<string>('');
  const [finalFormat, setFinalFormat] = useState<string>('html');

  const [showJobSelector, setShowJobSelector] = useState(false);
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 50;
  const { consumeCredits } = useConsumeCredits();

  useEffect(() => {
    if (currentStep === 2 && inputSource === 'profile' && !profileLoaded) {
      loadProfileData();
    }
  }, [currentStep, inputSource]);

  useEffect(() => {
    if (currentStep === 2 && selectedMode === 'target' && jobListings.length === 0 && !loadingJobs) {
      loadJobListings();
    }
  }, [currentStep, selectedMode]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await UserProfileService.loadUserData(user.id);

      if (result.success && result.profile) {
        const assembled = UserProfileService.assembleAutoInput(result.profile, result.cv);
        setCVData(assembled);
        setProfileLoaded(true);

        const validation = UserProfileService.validateMinimalData(assembled);
        if (!validation.valid) {
          setValidationErrors(validation.errors);
        }
      } else {
        setValidationErrors(['Aucun profil trouvé. Veuillez utiliser la saisie manuelle.']);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setValidationErrors(['Erreur lors du chargement du profil']);
    } finally {
      setLoading(false);
    }
  };

  const loadJobListings = async () => {
    setLoadingJobs(true);
    setShowJobSelector(true);

    try {
      // Charger d'abord les jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(20);

      if (jobsError) throw jobsError;

      // Récupérer les IDs des entreprises
      const companyIds = [...new Set(jobsData?.map(job => job.company_id).filter(Boolean))];

      // Charger les entreprises
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, logo_url')
        .in('id', companyIds);

      if (companiesError) throw companiesError;

      // Créer un map des entreprises
      const companiesMap = new Map(companiesData?.map(c => [c.id, c]));

      // Formatter les jobs avec les données des entreprises
      const formattedJobs = jobsData?.map(job => {
        const company = companiesMap.get(job.company_id);
        return {
          id: job.id,
          title: job.title,
          location: job.location,
          contract_type: job.contract_type,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          description: job.description,
          requirements: job.requirements,
          responsibilities: job.responsibilities,
          company: {
            name: company?.name || 'Entreprise',
            logo_url: company?.logo_url || ''
          }
        };
      }) || [];

      setJobListings(formattedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      alert('Erreur lors du chargement des offres: ' + (error as Error).message);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleSelectJob = (job: JobListing) => {
    const fullDescription = `
${job.title} - ${job.company.name}
Localisation: ${job.location}
Type de contrat: ${job.contract_type}

DESCRIPTION:
${job.description}

EXIGENCES:
${job.requirements}

RESPONSABILITÉS:
${job.responsibilities}
    `.trim();

    setJobDescription(fullDescription);
    setJobOffer({
      title: job.title,
      company: job.company.name,
      description: fullDescription
    });
    setShowJobSelector(false);
  };

  const handleModeSelect = (mode: CVMode) => {
    setSelectedMode(mode);
    setCurrentStep(2);
  };

  const handleGeneratePreview = async () => {
    if (!selectedMode) return;

    setLoading(true);
    setValidationErrors([]);

    try {
      let result;

      if (selectedMode === 'create') {
        result = await CVBuilderService.previewCV(cvData, selectedTemplateId || undefined);
        if (result.success) {
          setPreview(result.preview);
          setPreviewFormat('html');
        } else {
          setValidationErrors([result.error || 'Erreur de génération']);
        }
      } else if (selectedMode === 'improve') {
        if (!existingCV) {
          setValidationErrors(['Veuillez fournir un CV à améliorer']);
          return;
        }

        const improveResult = await CVImproverService.improveCV({
          existingCV,
          format: 'text',
          templateId: selectedTemplateId || undefined
        });

        if (improveResult.success) {
          setPreview(improveResult.improved);
          setPreviewFormat(improveResult.format);
        } else {
          setValidationErrors([improveResult.error || 'Erreur d\'amélioration']);
        }
      } else if (selectedMode === 'target') {
        if (!jobOffer && !jobDescription) {
          setValidationErrors(['Veuillez fournir une offre d\'emploi']);
          return;
        }

        const targetJobOffer: JobOffer = jobOffer || {
          title: 'Poste ciblé',
          company: 'Entreprise',
          description: jobDescription
        };

        const targetResult = await CVTargetedService.targetCV({
          cvData,
          jobOffer: targetJobOffer,
          templateId: selectedTemplateId || undefined
        });

        if (targetResult.success) {
          setPreview(targetResult.targeted);
          setPreviewFormat(targetResult.format);
        } else {
          setValidationErrors([targetResult.error || 'Erreur d\'adaptation']);
        }
      }

      if (preview || validationErrors.length === 0) {
        setCurrentStep(4);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      setValidationErrors(['Erreur lors de la génération: ' + (error as Error).message]);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalGeneration = async () => {
    setShowCreditModal(true);
  };

  const confirmGeneration = async () => {
    setShowCreditModal(false);
    setGenerating(true);

    try {
      const creditResult = await consumeCredits(SERVICES.AI_CV_GENERATION);
      if (!creditResult.success) {
        alert(creditResult.message);
        return;
      }

      setFinalCV(preview);
      setFinalFormat(previewFormat);

      await IAConfigService.logServiceUsage(
        user!.id,
        'ai_cv_generation',
        cvData,
        { preview },
        creditResult.cost || serviceCost
      );

      setCurrentStep(5);
      alert('CV généré avec succès!');
    } catch (error) {
      console.error('Error generating CV:', error);
      alert('Erreur lors de la génération: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadCV = () => {
    const blob = new Blob([finalCV], {
      type: finalFormat === 'html' ? 'text/html' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-${cvData.nom.replace(/\s+/g, '-')}.${finalFormat === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      let htmlContent = finalCV;

      if (finalFormat === 'markdown') {
        htmlContent = await PDFService.convertMarkdownToHTML(finalCV);
      } else if (finalFormat === 'text') {
        htmlContent = `<pre style="font-family: Arial; white-space: pre-wrap;">${finalCV}</pre>`;
      }

      htmlContent = PDFService.cleanHtmlForPDF(htmlContent);

      await PDFService.generateAndDownload({
        htmlContent,
        fileName: `cv-${cvData.nom.replace(/\s+/g, '-')}.pdf`
      });

      alert('PDF téléchargé avec succès!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF');
    }
  };

  const canProceedToStep3 = () => {
    if (selectedMode === 'create' || selectedMode === 'target') {
      return UserProfileService.validateMinimalData(cvData).valid;
    } else if (selectedMode === 'improve') {
      return existingCV.trim().length > 0;
    }
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Générateur CV IA Central</h2>
              <p className="text-sm text-gray-600">
                {selectedMode === 'create' && 'Créer un CV professionnel'}
                {selectedMode === 'improve' && 'Améliorer un CV existant'}
                {selectedMode === 'target' && 'Adapter mon CV à une offre'}
                {!selectedMode && 'Choisissez votre mode'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="flex items-center justify-center px-6 py-4 bg-gray-50 border-b border-gray-200">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  currentStep >= step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 5 && (
                <div
                  className={`w-16 h-1 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
                Choisissez votre mode de génération
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={() => handleModeSelect('create')}
                  className="p-6 border-2 border-gray-300 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                    <Sparkles className="w-8 h-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Créer un CV</h4>
                  <p className="text-sm text-gray-600">
                    Générez un CV professionnel à partir de vos données ou d'une saisie manuelle
                  </p>
                </button>

                <button
                  onClick={() => handleModeSelect('improve')}
                  className="p-6 border-2 border-gray-300 rounded-xl hover:border-green-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                    <Upload className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Améliorer un CV</h4>
                  <p className="text-sm text-gray-600">
                    Uploadez votre CV existant et laissez l'IA l'optimiser
                  </p>
                </button>

                <button
                  onClick={() => handleModeSelect('target')}
                  className="p-6 border-2 border-gray-300 rounded-xl hover:border-orange-500 hover:shadow-lg transition-all group"
                >
                  <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
                    <Target className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Adapter à une offre</h4>
                  <p className="text-sm text-gray-600">
                    Optimisez votre CV pour une offre d'emploi spécifique
                  </p>
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && selectedMode === 'create' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Source des données</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setInputSource('profile')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputSource === 'profile'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-6 h-6 ${inputSource === 'profile' ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div className="text-left">
                      <p className="font-semibold">Utiliser mon profil</p>
                      <p className="text-xs text-gray-600">Données JobGuinée</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setInputSource('manual')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputSource === 'manual'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Edit3 className={`w-6 h-6 ${inputSource === 'manual' ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div className="text-left">
                      <p className="font-semibold">Saisie manuelle</p>
                      <p className="text-xs text-gray-600">Remplir le formulaire</p>
                    </div>
                  </div>
                </button>
              </div>

              {loading && (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement de votre profil...</p>
                </div>
              )}

              {!loading && inputSource === 'profile' && profileLoaded && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800 mb-2">Profil chargé avec succès</p>
                      <div className="text-sm text-green-700">
                        <p>✓ Nom: {cvData.nom}</p>
                        <p>✓ Titre: {cvData.titre}</p>
                        <p>✓ {cvData.competences.length} compétences</p>
                        <p>✓ {cvData.experiences.length} expériences</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && inputSource === 'manual' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
                      <input
                        type="text"
                        value={cvData.nom}
                        onChange={(e) => setCVData({ ...cvData, nom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Titre professionnel *</label>
                      <input
                        type="text"
                        value={cvData.titre}
                        onChange={(e) => setCVData({ ...cvData, titre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Développeur Full Stack"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={cvData.email}
                        onChange={(e) => setCVData({ ...cvData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="jean@exemple.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        value={cvData.telephone}
                        onChange={(e) => setCVData({ ...cvData, telephone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="+224 XXX XX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Résumé professionnel</label>
                    <textarea
                      value={cvData.resume}
                      onChange={(e) => setCVData({ ...cvData, resume: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Décrivez votre profil professionnel..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compétences (séparées par des virgules)
                    </label>
                    <input
                      type="text"
                      value={cvData.competences.join(', ')}
                      onChange={(e) => setCVData({
                        ...cvData,
                        competences: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="JavaScript, React, Node.js, PostgreSQL"
                    />
                  </div>
                </div>
              )}

              {validationErrors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-800 mb-1">Erreurs de validation</p>
                      <ul className="text-sm text-red-700 list-disc list-inside">
                        {validationErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 2 && selectedMode === 'improve' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fournissez votre CV existant</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collez le contenu de votre CV
                  </label>
                  <textarea
                    value={existingCV}
                    onChange={(e) => setExistingCV(e.target.value)}
                    rows={15}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    placeholder="Collez ici le texte de votre CV..."
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Conseil:</strong> Collez le texte complet de votre CV pour obtenir les meilleures améliorations.
                    L'IA restructurera, optimisera et améliorera le contenu.
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && selectedMode === 'target' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Données du CV et offre ciblée</h3>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  onClick={() => setInputSource('profile')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputSource === 'profile'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <User className={`w-6 h-6 ${inputSource === 'profile' ? 'text-orange-600' : 'text-gray-500'}`} />
                    <div className="text-left">
                      <p className="font-semibold">Utiliser mon profil</p>
                      <p className="text-xs text-gray-600">Données JobGuinée</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setInputSource('manual')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    inputSource === 'manual'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Edit3 className={`w-6 h-6 ${inputSource === 'manual' ? 'text-orange-600' : 'text-gray-500'}`} />
                    <div className="text-left">
                      <p className="font-semibold">Saisie manuelle</p>
                      <p className="text-xs text-gray-600">Remplir le formulaire</p>
                    </div>
                  </div>
                </button>
              </div>

              {loading && (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 animate-spin text-orange-600 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement...</p>
                </div>
              )}

              {!loading && (
                <>
                  <div className="mb-8 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      Offres d'emploi disponibles
                    </h4>

                    {loadingJobs ? (
                      <div className="text-center py-8">
                        <Loader className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">Chargement des offres...</p>
                      </div>
                    ) : jobListings.length > 0 ? (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-green-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-medium text-green-800 mb-2">
                              {jobListings.length} offres chargées avec succès
                            </p>
                            <button
                              onClick={() => setShowJobSelector(true)}
                              className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                            >
                              <Search className="w-4 h-4" />
                              Parcourir les offres
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={loadJobListings}
                        className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium flex items-center justify-center gap-2"
                      >
                        <Target className="w-5 h-5" />
                        Charger les offres d'emploi
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description de l'offre d'emploi {jobOffer ? '' : '*'}
                    </label>
                    {jobOffer && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-blue-900">{jobOffer.title}</p>
                            <p className="text-sm text-blue-700">{jobOffer.company}</p>
                          </div>
                          <button
                            onClick={() => {
                              setJobOffer(null);
                              setJobDescription('');
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      placeholder="Collez la description complète de l'offre d'emploi ici ou sélectionnez une offre ci-dessus..."
                    />
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-orange-600 mt-0.5" />
                      <p className="text-sm text-orange-800">
                        L'IA analysera l'offre et adaptera votre CV pour mettre en avant les compétences
                        et expériences les plus pertinentes.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choisissez un template</h3>

              <TemplateSelector
                serviceCode="ai_cv_generation"
                selectedTemplateId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
              />

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Info:</strong> Le template détermine le style et la mise en page de votre CV.
                  Les templates premium offrent des designs plus sophistiqués.
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Aperçu du CV</h3>

              {loading ? (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Génération de l'aperçu...</p>
                </div>
              ) : preview ? (
                <div className="border rounded-lg p-6 bg-gray-50 max-h-[500px] overflow-y-auto">
                  {previewFormat === 'html' ? (
                    <div dangerouslySetInnerHTML={{ __html: preview }} />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm">{preview}</pre>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun aperçu disponible</p>
                </div>
              )}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">CV généré avec succès!</h3>
                <p className="text-gray-600">Votre CV professionnel est prêt à être téléchargé</p>
              </div>

              <div className="border rounded-lg p-6 bg-gray-50 max-h-[400px] overflow-y-auto">
                {finalFormat === 'html' ? (
                  <div dangerouslySetInnerHTML={{ __html: finalCV }} />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm">{finalCV}</pre>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={downloadCV}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Télécharger {finalFormat.toUpperCase()}
                </button>
                {(finalFormat === 'html' || finalFormat === 'markdown') && (
                  <button
                    onClick={downloadPDF}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FileDown className="w-5 h-5" />
                    Télécharger PDF
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => {
              if (currentStep === 1) {
                onClose();
              } else {
                setCurrentStep((prev) => Math.max(1, prev - 1) as Step);
              }
            }}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg flex items-center gap-2 transition-colors"
            disabled={generating}
          >
            <ChevronLeft className="w-5 h-5" />
            {currentStep === 1 ? 'Fermer' : 'Retour'}
          </button>

          <div className="flex gap-3">
            {currentStep < 3 && selectedMode && (
              <button
                onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1) as Step)}
                disabled={currentStep === 2 && !canProceedToStep3()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Suivant
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={() => {
                  handleGeneratePreview();
                }}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    Générer aperçu
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}

            {currentStep === 4 && preview && (
              <button
                onClick={handleFinalGeneration}
                disabled={generating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Générer CV final ({serviceCost} crédits)
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {showCreditModal && (
        <CreditConfirmModal
          serviceName="Génération CV IA"
          cost={serviceCost}
          onConfirm={confirmGeneration}
          onCancel={() => setShowCreditModal(false)}
        />
      )}

      {showJobSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col m-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Briefcase className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Sélectionner une offre d'emploi</h3>
                  <p className="text-sm text-gray-600">
                    {jobListings.length} offre{jobListings.length > 1 ? 's' : ''} disponible{jobListings.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowJobSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par titre, entreprise, localisation..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingJobs ? (
                <div className="text-center py-12">
                  <Loader className="w-12 h-12 animate-spin text-teal-600 mx-auto mb-4" />
                  <p className="text-gray-600">Chargement des offres...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobListings
                    .filter(job => {
                      if (!searchQuery) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        job.title.toLowerCase().includes(query) ||
                        job.company.name.toLowerCase().includes(query) ||
                        job.location.toLowerCase().includes(query)
                      );
                    })
                    .map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleSelectJob(job)}
                        className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {job.company.logo_url ? (
                              <img
                                src={job.company.logo_url}
                                alt={job.company.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-teal-600 transition-colors">
                              {job.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">{job.company.name}</p>
                            <div className="flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                                {job.location}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                                {job.contract_type}
                              </span>
                              {job.salary_min && (
                                <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                                  {(job.salary_min / 1000000).toFixed(0)}-{(job.salary_max / 1000000).toFixed(0)}M GNF
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-teal-600 transition-colors" />
                        </div>
                      </button>
                    ))}

                  {jobListings.filter(job => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      job.title.toLowerCase().includes(query) ||
                      job.company.name.toLowerCase().includes(query) ||
                      job.location.toLowerCase().includes(query)
                    );
                  }).length === 0 && (
                    <div className="text-center py-12">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Aucune offre ne correspond à votre recherche</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
