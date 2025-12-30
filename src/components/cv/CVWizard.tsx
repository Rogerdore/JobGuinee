import { useState, useEffect } from 'react';
import { Check, ChevronRight, ChevronLeft, Save, Eye, Sparkles, User, Briefcase, GraduationCap, Award, Languages, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cvVersionService } from '../../services/cvVersionService';
import { iaConfigService } from '../../services/iaConfigService';

interface CVWizardProps {
  cvId?: string;
  onSave?: (cvId: string) => void;
  onCancel?: () => void;
}

type WizardStep = 'personal' | 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'links' | 'review';

interface WizardStepConfig {
  id: WizardStep;
  title: string;
  icon: any;
  description: string;
}

const WIZARD_STEPS: WizardStepConfig[] = [
  { id: 'personal', title: 'Informations personnelles', icon: User, description: 'Vos coordonnées' },
  { id: 'summary', title: 'Résumé professionnel', icon: Sparkles, description: 'Votre présentation' },
  { id: 'experience', title: 'Expériences', icon: Briefcase, description: 'Votre parcours' },
  { id: 'education', title: 'Formations', icon: GraduationCap, description: 'Vos diplômes' },
  { id: 'skills', title: 'Compétences', icon: Award, description: 'Vos savoir-faire' },
  { id: 'languages', title: 'Langues', icon: Languages, description: 'Vos langues' },
  { id: 'links', title: 'Liens', icon: LinkIcon, description: 'Réseaux sociaux' },
  { id: 'review', title: 'Aperçu', icon: Eye, description: 'Vérification finale' }
];

export default function CVWizard({ cvId, onSave, onCancel }: CVWizardProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<WizardStep>('personal');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const [formData, setFormData] = useState({
    cv_title: 'Mon CV',
    full_name: '',
    professional_title: '',
    email: '',
    phone: '',
    location: '',
    nationality: '',
    professional_summary: '',
    experiences: [] as any[],
    education: [] as any[],
    skills: [] as string[],
    languages: [] as any[],
    linkedin_url: '',
    portfolio_url: '',
    github_url: ''
  });

  useEffect(() => {
    if (cvId) {
      loadCV();
    }
  }, [cvId]);

  const loadCV = async () => {
    if (!cvId) return;

    const result = await cvVersionService.getCVVersion(cvId);
    if (result.success && result.data) {
      setFormData({
        cv_title: result.data.cv_title,
        full_name: result.data.full_name || '',
        professional_title: result.data.professional_title || '',
        email: result.data.email || '',
        phone: result.data.phone || '',
        location: result.data.location || '',
        nationality: result.data.nationality || '',
        professional_summary: result.data.professional_summary || '',
        experiences: result.data.experiences || [],
        education: result.data.education || [],
        skills: result.data.skills || [],
        languages: result.data.languages || [],
        linkedin_url: result.data.linkedin_url || '',
        portfolio_url: result.data.portfolio_url || '',
        github_url: result.data.github_url || ''
      });
    }
  };

  const handleSave = async (markComplete: boolean = false) => {
    if (!user) return;

    setSaving(true);

    try {
      let result;
      if (cvId) {
        result = await cvVersionService.updateCVVersion(cvId, formData);
      } else {
        result = await cvVersionService.createCVVersion(user.id, {
          cv_title: formData.cv_title,
          data: formData
        });
      }

      if (result.success && result.data) {
        if (markComplete && onSave) {
          onSave(result.data.id);
        }
      } else {
        alert('Erreur lors de la sauvegarde: ' + result.error);
      }
    } catch (error) {
      console.error('Error saving CV:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAISuggestion = async (field: string) => {
    setAiSuggesting(true);

    try {
      let prompt = '';
      const context = {
        title: formData.professional_title,
        experience: formData.experiences.length,
        skills: formData.skills.join(', ')
      };

      switch (field) {
        case 'summary':
          prompt = `Génère un résumé professionnel percutant (3-4 phrases) pour un(e) ${context.title || 'professionnel(le)'} avec ${context.experience} expérience(s). Compétences: ${context.skills || 'non spécifié'}`;
          break;
        case 'skills':
          prompt = `Suggère 5-8 compétences clés pour un(e) ${context.title || 'professionnel(le)'}`;
          break;
      }

      const result = await iaConfigService.executeService('ai_coach', {
        question: prompt,
        contexte: 'Aide à la rédaction de CV'
      });

      if (result.success && result.data?.reponse) {
        if (field === 'summary') {
          setFormData(prev => ({ ...prev, professional_summary: result.data.reponse }));
        }
      }
    } catch (error) {
      console.error('Error getting AI suggestion:', error);
    } finally {
      setAiSuggesting(false);
    }
  };

  const markStepComplete = (step: WizardStep) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const goToNextStep = () => {
    markStepComplete(currentStep);
    handleSave();

    const currentIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < WIZARD_STEPS.length - 1) {
      setCurrentStep(WIZARD_STEPS[currentIndex + 1].id);
    }
  };

  const goToPreviousStep = () => {
    const currentIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(WIZARD_STEPS[currentIndex - 1].id);
    }
  };

  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / WIZARD_STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Navigation latérale */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  {formData.cv_title}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
              </div>

              <nav className="space-y-1">
                {WIZARD_STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isCompleted = completedSteps.includes(step.id);

                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition ${
                        isActive
                          ? 'bg-blue-100 text-blue-900'
                          : isCompleted
                          ? 'bg-green-50 text-green-900 hover:bg-green-100'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500'
                          : isActive
                          ? 'bg-blue-600'
                          : 'bg-gray-300'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <span className="text-xs font-bold text-white">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isActive ? 'text-blue-900' : isCompleted ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {step.title}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="flex-1 p-8">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {WIZARD_STEPS[currentStepIndex].title}
                  </h1>
                  <p className="text-gray-600">
                    {WIZARD_STEPS[currentStepIndex].description}
                  </p>
                </div>

                {/* Formulaire pour chaque étape */}
                {currentStep === 'personal' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet *
                      </label>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Jean Dupont"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre professionnel *
                      </label>
                      <input
                        type="text"
                        value={formData.professional_title}
                        onChange={(e) => setFormData({ ...formData, professional_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Développeur Full Stack"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="jean@exemple.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Téléphone *
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+224 XXX XX XX XX"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Localisation
                        </label>
                        <input
                          type="text"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Conakry, Guinée"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nationalité
                        </label>
                        <input
                          type="text"
                          value={formData.nationality}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Guinéenne"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 'summary' && (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Résumé professionnel
                        </label>
                        <button
                          onClick={() => handleAISuggestion('summary')}
                          disabled={aiSuggesting}
                          className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                        >
                          <Sparkles className="w-4 h-4" />
                          {aiSuggesting ? 'Génération...' : 'Générer avec IA'}
                        </button>
                      </div>
                      <textarea
                        value={formData.professional_summary}
                        onChange={(e) => setFormData({ ...formData, professional_summary: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Décrivez brièvement votre profil professionnel, vos points forts et vos objectifs de carrière..."
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        {formData.professional_summary.length} / 500 caractères recommandés
                      </p>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={goToPreviousStep}
                    disabled={currentStepIndex === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Précédent
                  </button>

                  {currentStepIndex < WIZARD_STEPS.length - 1 ? (
                    <button
                      onClick={goToNextStep}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Suivant
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      <Check className="w-5 h-5" />
                      {saving ? 'Finalisation...' : 'Finaliser le CV'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
