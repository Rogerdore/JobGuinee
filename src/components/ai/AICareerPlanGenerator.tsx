import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Download, Loader, Sparkles, ArrowLeft, User, Edit3, Check, AlertCircle } from 'lucide-react';
import { useConsumeCredits } from '../../hooks/useCreditService';
import { SERVICES } from '../../services/creditService';
import { useServiceCost } from '../../hooks/usePricing';
import CreditConfirmModal from '../credits/CreditConfirmModal';
import CreditBalance from '../credits/CreditBalance';
import TemplateSelector from './TemplateSelector';
import { IAConfigService } from '../../services/iaConfigService';
import PDFService from '../../services/pdfService';
import UserProfileService from '../../services/userProfileService';

interface AICareerPlanGeneratorProps {
  onNavigate?: (page: string) => void;
}

type InputMode = 'profile' | 'manual';

export default function AICareerPlanGenerator({ onNavigate }: AICareerPlanGeneratorProps = {}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const serviceCost = useServiceCost(SERVICES.AI_CAREER_PATH) || 40;

  const [inputMode, setInputMode] = useState<InputMode>('profile');
  const [planData, setPlanData] = useState<any>({
    profil_actuel: {
      poste: '',
      competences: [],
      experience_annees: 0
    },
    objectif: '',
    horizon: '3_ans',
    contraintes: ''
  });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileSummary, setProfileSummary] = useState<string>('');

  const [generatedPlan, setGeneratedPlan] = useState<string>('');
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
        const input = UserProfileService.buildCareerPlanInputFromProfile(
          result.profile,
          result.cv
        );
        setPlanData(input);
        setProfileLoaded(true);

        const summary = `
          ${input.profil_actuel.nom ? `✓ Nom: ${input.profil_actuel.nom}` : ''}
          ✓ Poste actuel: ${input.profil_actuel.poste}
          ✓ ${input.profil_actuel.competences?.length || 0} compétences
          ✓ ${input.profil_actuel.experience_annees} années d'expérience
          ✓ ${input.profil_actuel.experiences?.length || 0} expériences détaillées
          ✓ ${input.profil_actuel.formations?.length || 0} formations
          ${input.profil_actuel.bio ? `✓ Bio disponible` : ''}
          ${input.aspirations ? `✓ Aspirations définies` : ''}
        `;
        setProfileSummary(summary);
      } else {
        setProfileLoaded(false);
        setValidationErrors(['Aucun profil trouvé']);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setValidationErrors(['Erreur chargement']);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      alert('Connexion requise');
      return;
    }

    if (!planData.profil_actuel.poste) {
      setValidationErrors(['Le poste actuel est obligatoire']);
      return;
    }

    setValidationErrors([]);
    setShowCreditModal(true);
  };

  const confirmGeneration = async () => {
    setShowCreditModal(false);
    setGenerating(true);

    try {
      const creditResult = await consumeCredits(SERVICES.AI_CAREER_PATH);
      if (!creditResult.success) {
        alert(creditResult.message);
        return;
      }

      const config = await IAConfigService.getConfig('ai_career_plan');
      if (!config) {
        throw new Error('Config non trouvée');
      }

      const template = selectedTemplateId
        ? await IAConfigService.getTemplate(selectedTemplateId)
        : await IAConfigService.getDefaultTemplate('ai_career_plan');

      if (!template) {
        throw new Error('Template non trouvé');
      }

      const outputData = {
        objectif: planData.objectif || 'Évoluer vers un poste de leadership',
        etapes: [
          { titre: 'Renforcement compétences', description: 'Développer expertise technique et soft skills' },
          { titre: 'Networking', description: 'Élargir réseau professionnel' },
          { titre: 'Certifications', description: 'Obtenir certifications reconnues' }
        ],
        formations: ['Leadership', 'Management', 'Gestion de projet'],
        competences: ['Communication', 'Négociation', 'Vision stratégique'],
        echeancier: `6 mois: formations | 12 mois: certifications | ${planData.horizon}: objectif atteint`
      };

      const finalPlan = IAConfigService.applyTemplate(outputData, template.template_structure);

      setGeneratedPlan(finalPlan);
      setGeneratedFormat(template.format);

      await IAConfigService.logServiceUsage(
        user.id,
        'ai_career_plan',
        planData,
        outputData,
        serviceCost
      );

      alert('Plan généré!');
    } catch (error) {
      console.error('Error:', error);
      alert('Erreur: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Connexion requise</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          {onNavigate && (
            <button onClick={() => onNavigate('premium-ai')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              Retour
            </button>
          )}
        </div>
        <CreditBalance
          variant="prominent"
          onBuyCredits={() => onNavigate?.('credit-store')}
          className="mb-6"
        />

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Plan de Carrière IA</h1>
              <p className="text-gray-600">Planifiez votre évolution professionnelle</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Sparkles className="w-5 h-5 text-green-600 inline mr-2" />
            <span className="text-sm text-green-800"><strong>Coût:</strong> {serviceCost} crédits</span>
          </div>

          <div className="mb-8 bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Source des données</h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={() => setInputMode('profile')}
                className={`p-4 rounded-lg border-2 ${
                  inputMode === 'profile' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
              >
                <User className={`w-6 h-6 ${inputMode === 'profile' ? 'text-green-600' : 'text-gray-500'}`} />
                <p className="font-semibold">Mon profil</p>
              </button>

              <button
                onClick={() => setInputMode('manual')}
                className={`p-4 rounded-lg border-2 ${
                  inputMode === 'manual' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                }`}
              >
                <Edit3 className={`w-6 h-6 ${inputMode === 'manual' ? 'text-green-600' : 'text-gray-500'}`} />
                <p className="font-semibold">Manuel</p>
              </button>
            </div>

            {inputMode === 'profile' && profileLoaded && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
                <pre className="text-xs text-green-700">{profileSummary}</pre>
              </div>
            )}

            {validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <ul className="text-sm text-red-700">
                  {validationErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <TemplateSelector
                serviceCode="ai_career_plan"
                selectedTemplateId={selectedTemplateId}
                onSelect={setSelectedTemplateId}
                className="mb-6"
              />

              {inputMode === 'manual' && (
                <div className="space-y-4 mb-6">
                  <input
                    placeholder="Poste actuel *"
                    value={planData.profil_actuel.poste}
                    onChange={(e) => setPlanData({
                      ...planData,
                      profil_actuel: { ...planData.profil_actuel, poste: e.target.value }
                    })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  <textarea
                    placeholder="Votre objectif professionnel"
                    value={planData.objectif}
                    onChange={(e) => setPlanData({ ...planData, objectif: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleGenerate}
                  disabled={generating || validationErrors.length > 0}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
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

        {generatedPlan && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Votre Plan</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const blob = new Blob([generatedPlan], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'plan-carriere.html';
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  {generatedFormat.toUpperCase()}
                </button>
              </div>
            </div>

            <div className="border rounded-lg p-6 bg-gray-50">
              {generatedFormat === 'html' ? (
                <div dangerouslySetInnerHTML={{ __html: generatedPlan }} />
              ) : (
                <pre className="whitespace-pre-wrap">{generatedPlan}</pre>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreditModal && (
        <CreditConfirmModal
          isOpen={showCreditModal}
          onClose={() => setShowCreditModal(false)}
          onConfirm={confirmGeneration}
          serviceCode={SERVICES.AI_CAREER_PATH}
          serviceName="Plan de Carrière IA"
          serviceCost={serviceCost}
          inputPayload={planData}
        />
      )}
    </div>
  );
}
