import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Download, Loader, Sparkles, ArrowLeft, FileDown, User, Edit3, Check, AlertCircle, Briefcase } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import CreditBalance from '../credits/CreditBalance';
import TemplateSelector from './TemplateSelector';
import { IAConfigService } from '../../services/iaConfigService';
import PDFService from '../../services/pdfService';
import UserProfileService from '../../services/userProfileService';

interface AICoverLetterGeneratorProps {
  onNavigate?: (page: string) => void;
  jobData?: {
    title: string;
    company: string;
    description?: string;
  };
}

type InputMode = 'profile' | 'manual';

export default function AICoverLetterGenerator({ onNavigate, jobData }: AICoverLetterGeneratorProps = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const serviceCost = useServiceCost(SERVICES.AI_CV_GENERATION) || 30;

  const [inputMode, setInputMode] = useState<InputMode>('profile');
  const [letterData, setLetterData] = useState<any>({
    nom: '',
    poste_cible: jobData?.title || '',
    entreprise: jobData?.company || '',
    date: new Date().toLocaleDateString('fr-FR'),
    extrait_offre: jobData?.description || '',
    competences_candidat: [],
    ton: 'moderne'
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSummary, setProfileSummary] = useState<string>('');

  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [generatedFormat, setGeneratedFormat] = useState<string>('html');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { consumeCredits } = useConsumeCredits();

  useEffect(() => {
    if (!user) return;

    if (inputMode === 'profile') {
      loadProfileData();
    } else {
      setProfileLoaded(false);
      setProfileSummary('');
    }
  }, [inputMode, user]);

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    setValidationErrors([]);

    try {
      const result = await UserProfileService.loadUserData(user.id);

      if (result.success && result.profile) {
        const input = UserProfileService.buildCoverLetterInputFromProfile(
          result.profile,
          result.cv,
          jobData
        );
        setLetterData(input);
        setProfileLoaded(true);

        const summary = `
          ✓ Nom: ${input.nom}
          ✓ Poste ciblé: ${input.poste_cible}
          ✓ Entreprise: ${input.entreprise}
          ✓ ${input.competences_candidat?.length || 0} compétences
        `;
        setProfileSummary(summary);

        if (!input.nom || !input.poste_cible) {
          setValidationErrors(['Veuillez compléter votre profil ou utiliser la saisie manuelle']);
        }
      } else {
        setProfileLoaded(false);
        setValidationErrors(['Aucun profil trouvé']);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setValidationErrors(['Erreur lors du chargement du profil']);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      alert('Vous devez être connecté');
      return;
    }

    if (!letterData.nom || !letterData.poste_cible || !letterData.entreprise) {
      setValidationErrors(['Le nom, le poste et l\'entreprise sont obligatoires']);
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

      const config = await IAConfigService.getConfig('ai_cover_letter');
      if (!config) {
        throw new Error('Configuration IA non trouvée');
      }

      const validationResult = IAConfigService.validateInput(letterData, config.input_schema);
      if (!validationResult.valid) {
        throw new Error('Données invalides');
      }

      const template = selectedTemplateId
        ? await IAConfigService.getTemplate(selectedTemplateId)
        : await IAConfigService.getDefaultTemplate('ai_cover_letter');

      if (!template) {
        throw new Error('Template non trouvé');
      }

      const outputData = {
        date: letterData.date,
        entreprise: letterData.entreprise,
        poste: letterData.poste_cible,
        nom: letterData.nom,
        introduction: `Je me permets de vous adresser ma candidature pour le poste de ${letterData.poste_cible} au sein de ${letterData.entreprise}.`,
        corps: `Fort de mes compétences en ${letterData.competences_candidat.slice(0, 3).join(', ')}, je suis convaincu de pouvoir contribuer efficacement aux objectifs de votre entreprise.`,
        motivation: `Intégrer votre équipe représenterait pour moi une opportunité unique de mettre mes compétences au service de vos projets.`
      };

      const finalLetter = IAConfigService.applyTemplate(outputData, template.template_structure);

      setGeneratedLetter(finalLetter);
      setGeneratedFormat(template.format);

      await IAConfigService.logServiceUsage(
        user.id,
        'ai_cover_letter',
        letterData,
        outputData,
        creditResult.cost || serviceCost
      );

      alert('Lettre générée avec succès!');
    } catch (error) {
      console.error('Error generating letter:', error);
      alert('Erreur: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const downloadLetter = () => {
    const blob = new Blob([generatedLetter], {
      type: generatedFormat === 'html' ? 'text/html' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lettre-${letterData.entreprise.replace(/\s+/g, '-')}.${generatedFormat === 'html' ? 'html' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = async () => {
    try {
      let htmlContent = generatedLetter;

      if (generatedFormat === 'markdown') {
        htmlContent = await PDFService.convertMarkdownToHTML(generatedLetter);
      }

      htmlContent = PDFService.cleanHtmlForPDF(htmlContent);

      await PDFService.generateAndDownload({
        htmlContent,
        fileName: `lettre-${letterData.entreprise.replace(/\s+/g, '-')}.pdf`
      });

      alert('PDF téléchargé!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur PDF');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Connexion requise</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          {onNavigate && (
            <button onClick={() => onNavigate('premium-ai')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          )}
          <CreditBalance />
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Lettre de Motivation IA</h1>
              <p className="text-gray-600">Créez une lettre personnalisée avec l'IA</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                <strong>Coût:</strong> {serviceCost} crédits
              </p>
            </div>
          </div>

          <div className="mb-8 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Source des données</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => setInputMode('profile')}
                className={`p-4 rounded-lg border-2 ${
                  inputMode === 'profile' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className={`w-6 h-6 ${inputMode === 'profile' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="font-semibold">Utiliser mon profil</p>
                    <p className="text-xs text-gray-600">Auto</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setInputMode('manual')}
                className={`p-4 rounded-lg border-2 ${
                  inputMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Edit3 className={`w-6 h-6 ${inputMode === 'manual' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <div className="text-left">
                    <p className="font-semibold">Saisie manuelle</p>
                    <p className="text-xs text-gray-600">Formulaire</p>
                  </div>
                </div>
              </button>
            </div>

            {inputMode === 'profile' && profileLoaded && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600 mb-2" />
                <p className="font-medium text-green-800 mb-2">Profil chargé</p>
                <pre className="text-xs text-green-700 whitespace-pre-line">{profileSummary}</pre>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <ul className="text-sm text-red-700 list-disc list-inside">
                  {validationErrors.map((error, idx) => <li key={idx}>{error}</li>)}
                </ul>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Chargement...</p>
            </div>
          ) : (
            <>
              <TemplateSelector
                serviceCode="ai_cover_letter"
                selectedTemplateId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
                className="mb-6"
              />

              {inputMode === 'manual' && (
                <div className="space-y-6 mb-6">
                  <div className="grid grid-cols-2 gap-6">
                    <input
                      type="text"
                      placeholder="Votre nom *"
                      value={letterData.nom}
                      onChange={(e) => setLetterData({ ...letterData, nom: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Poste ciblé *"
                      value={letterData.poste_cible}
                      onChange={(e) => setLetterData({ ...letterData, poste_cible: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Entreprise *"
                      value={letterData.entreprise}
                      onChange={(e) => setLetterData({ ...letterData, entreprise: e.target.value })}
                      className="px-4 py-2 border rounded-lg"
                    />
                  </div>
                  <textarea
                    placeholder="Extrait de l'offre"
                    value={letterData.extrait_offre}
                    onChange={(e) => setLetterData({ ...letterData, extrait_offre: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={4}
                  />
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating || validationErrors.length > 0}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Générer ({serviceCost} crédits)
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {generatedLetter && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Votre Lettre</h2>
              <div className="flex gap-3">
                <button onClick={downloadLetter} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {generatedFormat.toUpperCase()}
                </button>
                {generatedFormat === 'html' && (
                  <button onClick={downloadPDF} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                    <FileDown className="w-4 h-4" />
                    PDF
                  </button>
                )}
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-gray-50">
              {generatedFormat === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: generatedLetter }} />
              ) : (
                <pre className="whitespace-pre-wrap font-sans text-sm">{generatedLetter}</pre>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreditModal && (
        <CreditConfirmModal
          serviceName="Lettre de Motivation IA"
          cost={serviceCost}
          onConfirm={confirmGeneration}
          onCancel={() => setShowCreditModal(false)}
        />
      )}
    </div>
  );
}
