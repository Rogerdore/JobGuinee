import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { FileText, Download, Loader, Sparkles, ArrowLeft, FileDown, User, Edit3, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import CreditBalance from '../credits/CreditBalance';
import TemplateSelector from './TemplateSelector';
import { IAConfigService } from '../../services/iaConfigService';
import PDFService from '../../services/pdfService';
import UserProfileService, { CVInputData } from '../../services/userProfileService';

interface EnhancedAICVGeneratorProps {
  onNavigate?: (page: string) => void;
}

type InputMode = 'profile' | 'manual';

export default function EnhancedAICVGenerator({ onNavigate }: EnhancedAICVGeneratorProps = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 50;

  const [inputMode, setInputMode] = useState<InputMode>('profile');
  const [cvData, setCVData] = useState<CVInputData>(UserProfileService.getEmptyInput());
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSummary, setProfileSummary] = useState<string>('');

  const [generatedCV, setGeneratedCV] = useState<string>('');
  const [generatedFormat, setGeneratedFormat] = useState<string>('html');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { consumeCredits } = useConsumeCredits();

  useEffect(() => {
    if (!user) {
      alert('Vous devez être connecté pour utiliser ce service');
      return;
    }

    if (inputMode === 'profile') {
      loadProfileData();
    } else {
      setProfileLoaded(false);
      setProfileSummary('');
      if (cvData.nom === '') {
        setCVData(UserProfileService.getEmptyInput());
      }
    }
  }, [inputMode, user]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    setValidationErrors([]);

    try {
      const result = await UserProfileService.loadUserData(user.id);

      if (result.success && result.profile) {
        const assembled = UserProfileService.assembleAutoInput(result.profile, result.cv);
        setCVData(assembled);
        setProfileLoaded(true);

        const summary = `
          ✓ Profil: ${assembled.nom || 'Non défini'}
          ✓ Titre: ${assembled.titre || 'Non défini'}
          ✓ ${assembled.competences.length} compétences
          ✓ ${assembled.experiences.length} expériences
          ✓ ${assembled.formations.length} formations
        `;
        setProfileSummary(summary);

        const validation = UserProfileService.validateMinimalData(assembled);
        if (!validation.valid) {
          setValidationErrors(validation.errors);
        }
      } else {
        setProfileLoaded(false);
        setProfileSummary('');
        setValidationErrors(['Aucun profil trouvé. Veuillez compléter votre profil ou utiliser la saisie manuelle.']);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setValidationErrors(['Erreur lors du chargement du profil']);
    } finally {
      setLoading(false);
    }
  };

  const handleModeSwitch = (mode: InputMode) => {
    setInputMode(mode);
    setValidationErrors([]);
  };

  const handleGenerateCV = async () => {
    if (!user) {
      alert('Vous devez être connecté');
      return;
    }

    const inputData = inputMode === 'profile'
      ? cvData
      : UserProfileService.assembleManualInput(cvData);

    const validation = UserProfileService.validateMinimalData(inputData);
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setValidationErrors([]);
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

      const config = await IAConfigService.getConfig('ai_cv_generation');
      if (!config) {
        throw new Error('Configuration IA non trouvée');
      }

      const inputData = inputMode === 'profile'
        ? cvData
        : UserProfileService.assembleManualInput(cvData);

      const validationResult = IAConfigService.validateInput(inputData, config.input_schema);
      if (!validationResult.valid) {
        throw new Error('Données invalides: ' + validationResult.errors.join(', '));
      }

      const template = selectedTemplateId
        ? await IAConfigService.getTemplate(selectedTemplateId)
        : await IAConfigService.getDefaultTemplate('ai_cv_generation');

      if (!template) {
        throw new Error('Template non trouvé');
      }

      const prompt = IAConfigService.buildPrompt(config, inputData);

      console.log('Prompt IA généré:', prompt);

      const outputData = {
        nom: inputData.nom,
        titre: inputData.titre,
        email: inputData.email,
        telephone: inputData.telephone,
        resume: inputData.resume,
        competences: inputData.competences,
        experiences: inputData.experiences,
        formations: inputData.formations
      };

      const finalCV = IAConfigService.applyTemplate(outputData, template.template_structure);

      setGeneratedCV(finalCV);
      setGeneratedFormat(template.format);

      await IAConfigService.logServiceUsage(
        user.id,
        'ai_cv_generation',
        inputData,
        outputData,
        creditResult.cost || serviceCost
      );

      alert('CV généré avec succès!');
    } catch (error) {
      console.error('Error generating CV:', error);
      alert('Erreur lors de la génération du CV: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadCV = () => {
    const blob = new Blob([generatedCV], {
      type: generatedFormat === 'html' ? 'text/html' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-${cvData.nom.replace(/\s+/g, '-')}.${generatedFormat === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      let htmlContent = generatedCV;

      if (generatedFormat === 'markdown') {
        htmlContent = await PDFService.convertMarkdownToHTML(generatedCV);
      } else if (generatedFormat === 'text') {
        htmlContent = `<pre style="font-family: Arial; white-space: pre-wrap;">${generatedCV}</pre>`;
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

  const addExperience = () => {
    setCVData({
      ...cvData,
      experiences: [...cvData.experiences, { poste: '', entreprise: '', periode: '', missions: [] }]
    });
  };

  const addFormation = () => {
    setCVData({
      ...cvData,
      formations: [...cvData.formations, { diplome: '', ecole: '', annee: '' }]
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">
            Connexion requise
          </h2>
          <p className="text-gray-600 text-center">
            Vous devez être connecté pour utiliser le générateur de CV IA.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          {onNavigate && (
            <button
              onClick={() => onNavigate('premium-ai')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          )}
          <CreditBalance />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Générateur de CV IA</h1>
              <p className="text-gray-600">Créez un CV professionnel avec l'aide de l'IA</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>Coût:</strong> {serviceCost} crédits par génération
              </p>
            </div>
          </div>

          <div className="mb-8 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Source des données
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => handleModeSwitch('profile')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inputMode === 'profile'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${inputMode === 'profile' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    <User className={`w-6 h-6 ${inputMode === 'profile' ? 'text-purple-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Utiliser mon profil</p>
                    <p className="text-xs text-gray-600">Données JobGuinée</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleModeSwitch('manual')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  inputMode === 'manual'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${inputMode === 'manual' ? 'bg-purple-100' : 'bg-gray-100'}`}>
                    <Edit3 className={`w-6 h-6 ${inputMode === 'manual' ? 'text-purple-600' : 'text-gray-500'}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800">Saisie manuelle</p>
                    <p className="text-xs text-gray-600">Remplir le formulaire</p>
                  </div>
                </div>
              </button>
            </div>

            {inputMode === 'profile' && profileLoaded && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 mb-2">Profil chargé avec succès</p>
                    <pre className="text-xs text-green-700 whitespace-pre-line">{profileSummary}</pre>
                    <button
                      onClick={loadProfileData}
                      className="mt-2 text-sm text-green-700 hover:text-green-900 flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Recharger
                    </button>
                  </div>
                </div>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
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

          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement de votre profil...</p>
            </div>
          ) : (
            <>
              <TemplateSelector
                serviceCode="ai_cv_generation"
                selectedTemplateId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
                className="mb-6"
              />

              {inputMode === 'manual' && (
                <div className="space-y-6 mb-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={cvData.nom}
                        onChange={(e) => setCVData({ ...cvData, nom: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre professionnel *
                      </label>
                      <input
                        type="text"
                        value={cvData.titre}
                        onChange={(e) => setCVData({ ...cvData, titre: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="Développeur Full Stack"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={cvData.email}
                        onChange={(e) => setCVData({ ...cvData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="jean@exemple.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={cvData.telephone}
                        onChange={(e) => setCVData({ ...cvData, telephone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        placeholder="+224 XXX XX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Résumé professionnel
                    </label>
                    <textarea
                      value={cvData.resume}
                      onChange={(e) => setCVData({ ...cvData, resume: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="Décrivez votre profil professionnel en quelques lignes..."
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="JavaScript, React, Node.js, PostgreSQL"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4">
                <button
                  onClick={handleGenerateCV}
                  disabled={generating || validationErrors.length > 0}
                  className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
                >
                  {generating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Générer mon CV ({serviceCost} crédits)
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {generatedCV && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Votre CV Généré</h2>
              <div className="flex gap-3">
                <button
                  onClick={downloadCV}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger {generatedFormat.toUpperCase()}
                </button>
                {(generatedFormat === 'html' || generatedFormat === 'markdown') && (
                  <button
                    onClick={downloadPDF}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4" />
                    Télécharger PDF
                  </button>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-gray-50">
              {generatedFormat === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: generatedCV }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">{generatedCV}</pre>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreditModal && (
        <CreditConfirmModal
          serviceName="Génération CV IA"
          cost={serviceCost}
          onConfirm={confirmGeneration}
          onCancel={() => setShowCreditModal(false)}
        />
      )}
    </div>
  );
}
