import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import {
  Briefcase, X, Loader, DollarSign, Calendar, MapPin, Building2,
  GraduationCap, FileText, Users, Mail, Sparkles, Eye, Globe, Share2,
  CheckCircle2, Upload as UploadIcon, Wand2, Save, Clock, AlertCircle, CheckCircle,
  Image as ImageIcon, ChevronRight, ChevronLeft, Zap, Settings, Send,
  ArrowRight, Award, BookOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RichTextEditor from '../forms/RichTextEditor';
import AutoCompleteInput from '../forms/AutoCompleteInput';
import AutoSaveIndicator from '../forms/AutoSaveIndicator';
import { useAutoSave } from '../../hooks/useAutoSave';
import { supabase } from '../../lib/supabase';
import AccessRestrictionModal from '../common/AccessRestrictionModal';
import JobPreviewModal from './JobPreviewModal';
import { validateJobData } from '../../services/jobValidationService';
import LanguageRequirementsManager from '../forms/LanguageRequirementsManager';
import {
  jobTitleSuggestions,
  companySuggestions,
  locationSuggestions,
  skillSuggestions,
  benefitSuggestions,
  sectorSuggestions,
  categorySuggestions,
} from '../../utils/jobSuggestions';
import {
  calculateJobCompletion,
  getJobCompletionStatus,
  getMissingJobFields,
  validateJobField
} from '../../utils/jobCompletionHelpers';
import { JobFormData } from '../../types/jobFormTypes';

export type { JobFormData };

interface JobPublishFormProps {
  onPublish: (data: JobFormData) => void;
  onClose: () => void;
  existingJob?: any;
}

const STEPS = [
  { id: 1, label: 'Poste', shortLabel: '1', icon: Briefcase, description: 'Titre, contrat, niveau' },
  { id: 2, label: 'Description', shortLabel: '2', icon: FileText, description: 'Missions, profil, compétences' },
  { id: 3, label: 'Entreprise', shortLabel: '3', icon: Building2, description: 'Société, localisation, salaire' },
  { id: 4, label: 'Candidature', shortLabel: '4', icon: Mail, description: 'Email, documents, visibilité' },
  { id: 5, label: 'Publication', shortLabel: '5', icon: Send, description: 'Durée, validation, lancement' },
];

const inputCls = 'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition-all duration-200 bg-white text-gray-800 placeholder-gray-400 outline-none';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-2';
const selectCls = inputCls;

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {message}
    </p>
  );
}

const StepIndicator = memo(({
  currentStep,
  completionByStep,
}: {
  currentStep: number;
  completionByStep: Record<number, number>;
}) => (
  <div className="flex items-center justify-between relative px-2">
    <div className="absolute top-5 left-8 right-8 h-0.5 bg-gray-200 z-0">
      <div
        className="h-full bg-gradient-to-r from-[#0E2F56] to-blue-500 transition-all duration-500"
        style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
      />
    </div>
    {STEPS.map((step) => {
      const pct = completionByStep[step.id] ?? 0;
      const isDone = currentStep > step.id;
      const isActive = currentStep === step.id;
      const Icon = step.icon;
      return (
        <div key={step.id} className="relative z-10 flex flex-col items-center gap-1.5 min-w-0">
          <div
            className={`
              w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 font-bold text-sm
              ${isDone
                ? 'bg-[#0E2F56] border-[#0E2F56] text-white shadow-md'
                : isActive
                  ? 'bg-white border-[#0E2F56] text-[#0E2F56] shadow-lg ring-4 ring-blue-100 scale-110'
                  : 'bg-white border-gray-300 text-gray-400'}
            `}
          >
            {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
          </div>
          <span className={`text-xs font-semibold whitespace-nowrap hidden sm:block transition-colors duration-200 ${isActive ? 'text-[#0E2F56]' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
            {step.label}
          </span>
          {isActive && pct > 0 && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
          )}
        </div>
      );
    })}
  </div>
));
StepIndicator.displayName = 'StepIndicator';

export default function JobPublishForm({ onPublish, onClose, existingJob }: JobPublishFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>({});
  const bodyRef = useRef<HTMLDivElement>(null);

  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

  const getInitialFormData = useCallback((): JobFormData => {
    if (existingJob) {
      return {
        title: existingJob.title || '',
        category: existingJob.category || 'Ressources Humaines',
        contract_type: existingJob.contract_type || 'CDI',
        position_count: existingJob.position_count || 1,
        position_level: existingJob.position_level || 'Intermédiaire',
        deadline: existingJob.deadline || existingJob.application_deadline || '',
        description: existingJob.description || '',
        responsibilities: existingJob.responsibilities || '',
        profile: existingJob.profile_sought || '',
        skills: existingJob.keywords || [],
        education_level: existingJob.education_level || 'Licence',
        primary_qualification: existingJob.primary_qualification || '',
        experience_required: existingJob.experience_level || '3–5 ans',
        languages: existingJob.languages || [],
        language_requirements: existingJob.language_requirements || [],
        company_name: existingJob.department || '',
        company_logo_url: existingJob.company_logo_url || '',
        featured_image_url: existingJob.featured_image_url || '',
        use_profile_logo: false,
        sector: existingJob.sector || 'Mines',
        location: existingJob.location || '',
        company_description: existingJob.company_description || '',
        website: existingJob.company_website || '',
        salary_range: existingJob.salary_range || '',
        salary_type: existingJob.salary_type || 'Négociable',
        benefits: existingJob.benefits ? existingJob.benefits.split(', ') : [],
        application_email: existingJob.application_email || '',
        receive_in_platform: existingJob.receive_in_platform !== undefined ? existingJob.receive_in_platform : true,
        required_documents: existingJob.required_documents || ['CV', 'Lettre de motivation'],
        application_instructions: existingJob.application_instructions || '',
        visibility: existingJob.visibility || 'Publique',
        is_premium: existingJob.is_premium || false,
        announcement_language: existingJob.announcement_language || 'Français',
        auto_share: existingJob.auto_share || false,
        publication_duration: existingJob.publication_duration || '30 jours',
        auto_renewal: existingJob.auto_renewal || false,
        auto_renewal_pending_admin: existingJob.auto_renewal_pending_admin || false,
        legal_compliance: existingJob.legal_compliance || false,
      };
    }
    return {
      title: '',
      category: 'Ressources Humaines',
      contract_type: 'CDI',
      position_count: 1,
      position_level: 'Intermédiaire',
      deadline: '',
      description: '',
      responsibilities: '',
      profile: '',
      skills: [],
      education_level: 'Licence',
      primary_qualification: '',
      experience_required: '3–5 ans',
      languages: [],
      language_requirements: [],
      company_name: '',
      featured_image_url: '',
      use_profile_logo: false,
      sector: 'Mines',
      location: '',
      company_description: '',
      website: '',
      salary_range: '',
      salary_type: 'Négociable',
      benefits: [],
      application_email: '',
      receive_in_platform: true,
      required_documents: ['CV', 'Lettre de motivation'],
      application_instructions: '',
      visibility: 'Publique',
      is_premium: false,
      announcement_language: 'Français',
      auto_share: false,
      publication_duration: '30 jours',
      auto_renewal: false,
      auto_renewal_pending_admin: false,
      legal_compliance: false,
    };
  }, [existingJob]);

  const [formData, setFormData] = useState<JobFormData>(getInitialFormData());
  const formDataRef = useRef(formData);
  const validationErrorsRef = useRef<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => { formDataRef.current = formData; }, [formData]);

  const completionPercentage = useMemo(() => calculateJobCompletion(formData), [formData]);
  const completionStatus = useMemo(() => getJobCompletionStatus(completionPercentage), [completionPercentage]);

  const { status: autoSaveStatus, lastSaved, clearDraft, loadDraft } = useAutoSave({
    data: formData,
    key: `job-draft-${profile?.id || 'anonymous'}`,
    delay: 10000,
    enabled: draftLoaded,
  });

  useEffect(() => {
    const savedData = localStorage.getItem(`autosave_job-draft-${profile?.id || 'anonymous'}`);
    if (savedData && !draftLoaded) setShowDraftRecovery(true);
    else setDraftLoaded(true);
  }, [profile?.id, draftLoaded]);

  const handleRecoverDraft = useCallback(() => {
    const draft = loadDraft();
    if (draft) { setFormData(draft); setDraftLoaded(true); setShowDraftRecovery(false); }
  }, [loadDraft]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft(); setShowDraftRecovery(false); setDraftLoaded(true);
  }, [clearDraft]);

  const updateFormField = useCallback((field: keyof JobFormData, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      formDataRef.current = next;
      return next;
    });
    const error = validateJobField(field, value);
    const currentError = validationErrorsRef.current[field];
    if (error !== currentError) {
      validationErrorsRef.current = error
        ? { ...validationErrorsRef.current, [field]: error }
        : (() => { const e = { ...validationErrorsRef.current }; delete e[field]; return e; })();
      setValidationErrors(validationErrorsRef.current);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const field = e.target.name as keyof JobFormData;
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked
      : e.target.type === 'number' ? Number(e.target.value)
        : e.target.value;
    updateFormField(field, value);
  }, [updateFormField]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Fichier image requis (PNG, JPG)'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Maximum 5 MB'); return; }
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
    try {
      const ext = file.name.split('.').pop();
      const path = `company-logos/${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('company-logos').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
      updateFormField('company_logo_url', publicUrl);
    } catch { alert('Erreur lors de l\'upload du logo'); }
    setUploadingLogo(false);
  }, [updateFormField]);

  const handleFeaturedImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Image requise'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Maximum 5 MB'); return; }
    setUploadingFeaturedImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `job-featured-images/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('company-logos').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
      updateFormField('featured_image_url', publicUrl);
    } catch { alert('Erreur lors de l\'upload de l\'image'); }
    setUploadingFeaturedImage(false);
  }, [updateFormField]);

  const handleGenerateWithAI = useCallback(async () => {
    if (!isPremium) { setShowPremiumModal(true); return; }
    if (!formData.title || !formData.location) {
      alert('Veuillez renseigner le titre du poste et la localisation d\'abord.');
      return;
    }
    setIsGeneratingAI(true);
    await new Promise(r => setTimeout(r, 2500));
    setFormData(prev => ({
      ...prev,
      description: `Nous recherchons un(e) ${prev.title} talentueux(se) pour rejoindre notre équipe dynamique basée à ${prev.location}. Ce poste stratégique offre l'opportunité de contribuer activement au développement de nos activités.`,
      responsibilities: `• Assurer la gestion quotidienne des activités\n• Piloter les projets stratégiques\n• Développer des processus d'amélioration continue\n• Collaborer avec les équipes transverses\n• Garantir les standards de qualité`,
      profile: `Profil dynamique et rigoureux, doté d'excellentes compétences en ${prev.category.toLowerCase()}. Fort sens de l'organisation, autonomie et capacité à travailler en équipe.`,
      skills: [...new Set([...prev.skills, 'Leadership', 'Gestion de projet', 'Communication', 'Analyse'])],
      benefits: [...new Set([...prev.benefits, 'Package compétitif', 'Couverture médicale', 'Formation continue'])],
      company_description: prev.company_description || `Entreprise leader dans le secteur ${prev.sector}, engagée envers l'excellence opérationnelle.`,
      application_instructions: prev.application_instructions || 'Envoyez votre dossier complet (CV + lettre de motivation) avant la date limite. Seuls les candidats présélectionnés seront contactés.',
    }));
    setIsGeneratingAI(false);
  }, [isPremium, formData.title, formData.location, formData.category, formData.sector]);

  const validateStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1: return !!(formData.title && formData.contract_type && formData.deadline);
      case 2: return !!(formData.description);
      case 3: return !!(formData.company_name && formData.sector && formData.location);
      case 4: return !!(formData.application_email || formData.receive_in_platform);
      case 5: return formData.legal_compliance;
      default: return true;
    }
  }, [formData]);

  const goToStep = useCallback((next: number) => {
    if (next < currentStep) {
      setCurrentStep(next);
      bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!validateStep(currentStep)) {
      setStepErrors(prev => ({ ...prev, [currentStep]: true }));
      return;
    }
    setStepErrors(prev => ({ ...prev, [currentStep]: false }));
    setCurrentStep(next);
    bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep, validateStep]);

  const handlePublish = useCallback(async () => {
    if (!formData.legal_compliance) return;
    setLoading(true);
    await onPublish(formData);
    setLoading(false);
  }, [formData, onPublish]);

  const completionByStep: Record<number, number> = useMemo(() => {
    const s1 = [formData.title, formData.contract_type, formData.deadline, formData.position_level].filter(Boolean).length / 4 * 100;
    const s2 = [formData.description, formData.responsibilities, formData.profile, formData.skills.length > 0, formData.primary_qualification].filter(Boolean).length / 5 * 100;
    const s3 = [formData.company_name, formData.sector, formData.location, formData.company_description].filter(Boolean).length / 4 * 100;
    const s4 = [(formData.application_email || formData.receive_in_platform), formData.required_documents.length > 0].filter(Boolean).length / 2 * 100;
    const s5 = [formData.publication_duration, formData.legal_compliance].filter(Boolean).length / 2 * 100;
    return { 1: Math.round(s1), 2: Math.round(s2), 3: Math.round(s3), 4: Math.round(s4), 5: Math.round(s5) };
  }, [formData]);

  const canProceed = validateStep(currentStep);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white px-6 py-4 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold leading-tight">Publier une offre d'emploi</h2>
              <p className="text-xs text-blue-200 mt-0.5">{STEPS[currentStep - 1].description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
            <button onClick={onClose} type="button" className="p-1.5 hover:bg-white/20 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <StepIndicator currentStep={currentStep} completionByStep={completionByStep} />

          {/* Global progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${completionStatus.bgColor}`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className={`text-xs font-bold ${completionStatus.color} whitespace-nowrap`}>
              {completionPercentage}% complet
            </span>
          </div>
        </div>

        {/* Draft recovery banner */}
        {showDraftRecovery && (
          <div className="mx-6 mt-4 bg-blue-50 border border-blue-300 rounded-xl p-3 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Save className="w-4 h-4 flex-shrink-0" />
              <span>Brouillon non publié détecté. Voulez-vous le récupérer ?</span>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button type="button" onClick={handleRecoverDraft} className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition">Récupérer</button>
              <button type="button" onClick={handleDiscardDraft} className="px-3 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300 transition">Ignorer</button>
            </div>
          </div>
        )}

        {/* Step Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Step error alert */}
          {stepErrors[currentStep] && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              Veuillez compléter les champs obligatoires avant de continuer.
            </div>
          )}

          {/* ── STEP 1: Informations générales ── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#0E2F56] rounded-lg"><Briefcase className="w-4 h-4 text-white" /></div>
                <h3 className="text-base font-bold text-gray-800">Informations générales</h3>
              </div>

              {/* AI generate button */}
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm ${
                  isPremium
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-orange-200'
                    : 'bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200'
                }`}
              >
                {isGeneratingAI ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isGeneratingAI ? 'Génération en cours…' : isPremium ? 'Générer l\'offre avec l\'IA' : 'Générer avec l\'IA (Premium)'}
              </button>

              <div>
                <AutoCompleteInput
                  value={formData.title}
                  onChange={(v) => updateFormField('title', v)}
                  suggestions={jobTitleSuggestions}
                  placeholder="Ex : Superviseur Ressources Humaines"
                  label="Titre du poste *"
                  required
                  minChars={2}
                />
                <FieldError message={validationErrors.title} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <AutoCompleteInput
                    value={formData.category}
                    onChange={(v) => updateFormField('category', v)}
                    suggestions={categorySuggestions}
                    placeholder="Ex : Ressources Humaines, Finance…"
                    label="Catégorie / Domaine *"
                    required
                    minChars={1}
                  />
                </div>
                <div>
                  <label className={labelCls}>Type de contrat *</label>
                  <select name="contract_type" value={formData.contract_type} onChange={handleInputChange} className={selectCls}>
                    {['CDI', 'CDD', 'Stage', 'Intérim', 'Freelance'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Niveau de poste</label>
                  <select name="position_level" value={formData.position_level} onChange={handleInputChange} className={selectCls}>
                    {['Débutant', 'Intermédiaire', 'Senior', 'Direction'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Nombre de postes</label>
                  <input type="number" name="position_count" min="1" value={formData.position_count} onChange={handleInputChange} className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls + ' flex items-center gap-1.5'}>
                  <Calendar className="w-4 h-4 text-amber-500" />
                  Date limite de candidature *
                </label>
                <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className={inputCls} required />
                <FieldError message={validationErrors.deadline} />
              </div>
            </div>
          )}

          {/* ── STEP 2: Description ── */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#0E2F56] rounded-lg"><FileText className="w-4 h-4 text-white" /></div>
                <h3 className="text-base font-bold text-gray-800">Description du poste</h3>
              </div>

              <div>
                <RichTextEditor value={formData.description} onChange={(v) => updateFormField('description', v)} placeholder="Décrivez brièvement le poste…" label="Présentation du poste *" />
                <FieldError message={validationErrors.description} />
              </div>

              <div>
                <label className={labelCls}>Missions principales</label>
                <textarea name="responsibilities" value={formData.responsibilities} onChange={handleInputChange} rows={4} className={inputCls + ' resize-none'} placeholder="• Mission 1&#10;• Mission 2&#10;• Mission 3" />
              </div>

              <div>
                <label className={labelCls}>Profil recherché</label>
                <textarea name="profile" value={formData.profile} onChange={handleInputChange} rows={3} className={inputCls + ' resize-none'} placeholder="Indiquez le type de profil souhaité…" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    Niveau d'études requis
                  </label>
                  <select name="education_level" value={formData.education_level} onChange={handleInputChange} className={selectCls}>
                    {['BEP', 'BAC', 'BTS', 'Licence', 'Master', 'Doctorat'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <Award className="w-4 h-4 text-emerald-500" />
                    Expérience requise
                  </label>
                  <select name="experience_required" value={formData.experience_required} onChange={handleInputChange} className={selectCls}>
                    {['Débutant', '1–3 ans', '3–5 ans', '5–10 ans', '+10 ans'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>Qualification principale requise *</label>
                <input type="text" name="primary_qualification" value={formData.primary_qualification} onChange={handleInputChange} className={inputCls} placeholder="Ex: Ingénieur civil, Expert comptable, Développeur…" />
                <p className="text-xs text-gray-400 mt-1.5">Titre professionnel ou compétence clé pour ce poste</p>
              </div>

              <div>
                <label className={labelCls}>Autres compétences requises</label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <AutoCompleteInput value={skillInput} onChange={setSkillInput} suggestions={skillSuggestions} placeholder="Ex: Excel, Leadership, Gestion de projet…" minChars={2} />
                  </div>
                  <button type="button" onClick={() => {
                    if (skillInput.trim()) {
                      setFormData(p => p.skills.includes(skillInput.trim()) ? p : { ...p, skills: [...p.skills, skillInput.trim()] });
                      setSkillInput('');
                    }
                  }} className="px-5 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition text-sm">
                    Ajouter
                  </button>
                </div>
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.skills.map((skill, i) => (
                      <span key={i} className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1.5">
                        {skill}
                        <button type="button" onClick={() => setFormData(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))} className="hover:text-blue-900 transition">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <LanguageRequirementsManager requirements={formData.language_requirements} onChange={(r) => updateFormField('language_requirements', r)} />
            </div>
          )}

          {/* ── STEP 3: Entreprise & Rémunération ── */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#0E2F56] rounded-lg"><Building2 className="w-4 h-4 text-white" /></div>
                <h3 className="text-base font-bold text-gray-800">Entreprise & Rémunération</h3>
              </div>

              {/* Logo */}
              <div>
                <label className={labelCls + ' flex items-center gap-1.5'}><ImageIcon className="w-4 h-4 text-blue-500" /> Logo de l'entreprise</label>
                <div className="flex gap-2 mb-3">
                  {['Utiliser logo du profil', 'Télécharger un logo'].map((opt, i) => (
                    <button key={opt} type="button" onClick={() => updateFormField('use_profile_logo', i === 0)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                        formData.use_profile_logo === (i === 0) ? 'bg-[#0E2F56] text-white border-[#0E2F56]' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}>{opt}
                    </button>
                  ))}
                </div>
                {formData.use_profile_logo ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center"><Building2 className="w-6 h-6 text-[#0E2F56]" /></div>
                    <p className="text-sm text-gray-700">Logo de votre profil recruteur utilisé automatiquement</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    {(logoPreview || formData.company_logo_url) && (
                      <div className="relative flex-shrink-0">
                        <img src={logoPreview || formData.company_logo_url} alt="Logo" className="w-16 h-16 object-cover rounded-xl border-2 border-blue-200 shadow" />
                        {uploadingLogo && <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center"><Loader className="w-4 h-4 text-white animate-spin" /></div>}
                      </div>
                    )}
                    <label htmlFor="logo-upload" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-sm text-gray-600 font-medium">
                        <UploadIcon className="w-4 h-4 text-blue-500" />
                        {uploadingLogo ? 'Upload…' : 'Choisir un logo (PNG, JPG — max 5 MB)'}
                      </div>
                    </label>
                    <input id="logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                  </div>
                )}
              </div>

              {/* Featured image */}
              <div>
                <label className={labelCls + ' flex items-center gap-1.5'}><ImageIcon className="w-4 h-4 text-rose-400" /> Image de mise en avant <span className="text-gray-400 font-normal text-xs">(optionnel)</span></label>
                {formData.featured_image_url ? (
                  <div className="space-y-2">
                    <img src={formData.featured_image_url} alt="Featured" className="w-full max-h-48 object-cover rounded-xl border border-gray-200 shadow-sm" />
                    <button type="button" onClick={() => updateFormField('featured_image_url', '')} className="text-xs text-red-500 hover:text-red-700 transition flex items-center gap-1">
                      <X className="w-3 h-3" /> Supprimer l'image
                    </button>
                  </div>
                ) : (
                  <label htmlFor="featured-upload" className="cursor-pointer block">
                    <div className="flex items-center justify-center gap-2 px-4 py-5 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition text-sm text-gray-500 font-medium">
                      {uploadingFeaturedImage ? <><Loader className="w-4 h-4 animate-spin" /> Upload…</> : <><ImageIcon className="w-4 h-4" /> Cliquez pour ajouter une image principale (16:9 recommandé)</>}
                    </div>
                    <input id="featured-upload" type="file" accept="image/*" onChange={handleFeaturedImageUpload} className="hidden" disabled={uploadingFeaturedImage} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <AutoCompleteInput value={formData.company_name} onChange={(v) => updateFormField('company_name', v)} suggestions={companySuggestions} placeholder="Ex : Winning Consortium" label="Nom de l'entreprise *" required minChars={2} />
                  <FieldError message={validationErrors.company_name} />
                </div>
                <div>
                  <AutoCompleteInput value={formData.sector} onChange={(v) => updateFormField('sector', v)} suggestions={sectorSuggestions} placeholder="Ex : Mines, Banque, IT…" label="Secteur d'activité *" required minChars={1} maxSuggestions={150} />
                </div>
                <div>
                  <AutoCompleteInput value={formData.location} onChange={(v) => updateFormField('location', v)} suggestions={locationSuggestions} placeholder="Ex : Conakry, Kankan…" label="Localisation *" required minChars={2} />
                  <FieldError message={validationErrors.location} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Présentation de l'entreprise</label>
                  <textarea name="company_description" value={formData.company_description} onChange={handleInputChange} rows={3} className={inputCls + ' resize-none'} placeholder="Décrivez votre entreprise en quelques lignes…" />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelCls}>Site web <span className="text-gray-400 font-normal text-xs">(optionnel)</span></label>
                  <input type="url" name="website" value={formData.website} onChange={handleInputChange} className={inputCls} placeholder="https://www.monentreprise.com" />
                  <FieldError message={validationErrors.website} />
                </div>
              </div>

              {/* Salary */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-emerald-500 rounded-lg"><DollarSign className="w-4 h-4 text-white" /></div>
                  <h3 className="text-base font-bold text-gray-800">Rémunération & Avantages</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Fourchette salariale (GNF)</label>
                    <input type="text" name="salary_range" value={formData.salary_range} onChange={handleInputChange} className={inputCls} placeholder="Ex : 6.000.000 – 8.000.000 GNF" />
                  </div>
                  <div>
                    <label className={labelCls}>Type de salaire</label>
                    <select name="salary_type" value={formData.salary_type} onChange={handleInputChange} className={selectCls}>
                      {['Fixe', 'Négociable', 'Non communiqué'].map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className={labelCls}>Avantages</label>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <AutoCompleteInput value={benefitInput} onChange={setBenefitInput} suggestions={benefitSuggestions} placeholder="Ex: logement, repas, transport…" minChars={2} />
                    </div>
                    <button type="button" onClick={() => {
                      if (benefitInput.trim()) {
                        setFormData(p => p.benefits.includes(benefitInput.trim()) ? p : { ...p, benefits: [...p.benefits, benefitInput.trim()] });
                        setBenefitInput('');
                      }
                    }} className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition text-sm">
                      Ajouter
                    </button>
                  </div>
                  {formData.benefits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((b, i) => (
                        <span key={i} className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium flex items-center gap-1.5">
                          {b}
                          <button type="button" onClick={() => setFormData(p => ({ ...p, benefits: p.benefits.filter(x => x !== b) }))} className="hover:text-emerald-900 transition">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: Candidature & Visibilité ── */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#0E2F56] rounded-lg"><Mail className="w-4 h-4 text-white" /></div>
                <h3 className="text-base font-bold text-gray-800">Modalités de candidature</h3>
              </div>

              <div>
                <label className={labelCls}>Email de réception des candidatures *</label>
                <input type="email" name="application_email" value={formData.application_email} onChange={handleInputChange} className={inputCls} placeholder="Ex : rh@entreprise.com" />
                <FieldError message={validationErrors.application_email} />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition">
                <input type="checkbox" name="receive_in_platform" checked={formData.receive_in_platform} onChange={handleInputChange} className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]" />
                <div>
                  <span className="text-sm font-semibold text-gray-800">Recevoir dans mon espace recruteur</span>
                  <p className="text-xs text-gray-500 mt-0.5">Les candidatures arrivent directement dans votre tableau de bord</p>
                </div>
              </label>

              <div>
                <label className={labelCls}>Documents requis</label>
                <div className="grid grid-cols-2 gap-2">
                  {['CV', 'Lettre de motivation', 'Certificat de travail', 'CNSS'].map((doc) => (
                    <label key={doc} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border-2 transition text-sm font-medium ${formData.required_documents.includes(doc) ? 'bg-[#0E2F56]/5 border-[#0E2F56] text-[#0E2F56]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={formData.required_documents.includes(doc)} onChange={() => setFormData(p => ({ ...p, required_documents: p.required_documents.includes(doc) ? p.required_documents.filter(d => d !== doc) : [...p.required_documents, doc] }))} className="w-4 h-4 text-[#0E2F56] rounded focus:ring-[#0E2F56]" />
                      {doc}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Instructions supplémentaires <span className="text-gray-400 font-normal text-xs">(optionnel)</span></label>
                <textarea name="application_instructions" value={formData.application_instructions} onChange={handleInputChange} rows={3} className={inputCls + ' resize-none'} placeholder="Ex : Envoyez vos dossiers avant le 15 novembre…" />
              </div>

              {/* Visibility */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-amber-500 rounded-lg"><Eye className="w-4 h-4 text-white" /></div>
                  <h3 className="text-base font-bold text-gray-800">Options de visibilité</h3>
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'Publique', desc: 'Visible par tous les candidats' },
                    { value: 'Restreinte aux abonnés', desc: 'Visible uniquement par les abonnés premium' },
                    { value: 'Confidentielle (anonyme)', desc: 'Entreprise masquée dans l\'annonce' },
                  ].map(({ value, desc }) => (
                    <label key={value} className={`flex items-start gap-3 cursor-pointer p-3 rounded-xl border-2 transition ${formData.visibility === value ? 'bg-[#0E2F56]/5 border-[#0E2F56]' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" name="visibility" value={value} checked={formData.visibility === value} onChange={handleInputChange} className="w-4 h-4 text-[#0E2F56] mt-0.5 focus:ring-[#0E2F56]" />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{value}</span>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition ${formData.is_premium ? 'bg-amber-50 border-amber-400 text-amber-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="checkbox" name="is_premium" checked={formData.is_premium} onChange={handleInputChange} className="w-4 h-4 rounded" />
                    <div>
                      <span className="text-sm font-semibold">Annonce Premium</span>
                      <p className="text-xs opacity-70 mt-0.5">Mise en avant sur la plateforme</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-2 cursor-pointer p-3 rounded-xl border-2 transition ${formData.auto_share ? 'bg-sky-50 border-sky-400 text-sky-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="checkbox" name="auto_share" checked={formData.auto_share} onChange={handleInputChange} className="w-4 h-4 rounded" />
                    <div>
                      <span className="text-sm font-semibold">Auto-partage réseaux</span>
                      <p className="text-xs opacity-70 mt-0.5">Facebook, LinkedIn, Telegram RH</p>
                    </div>
                  </label>
                </div>

                <div className="mt-4">
                  <label className={labelCls}>Langue de l'annonce</label>
                  <select name="announcement_language" value={formData.announcement_language} onChange={handleInputChange} className={selectCls}>
                    {['Français', 'Anglais', 'Français + Anglais'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 5: Publication & Validation ── */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-[#0E2F56] rounded-lg"><Send className="w-4 h-4 text-white" /></div>
                <h3 className="text-base font-bold text-gray-800">Publication & Validation</h3>
              </div>

              {/* Récapitulatif */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-2">
                <h4 className="text-sm font-bold text-gray-700 mb-3">Récapitulatif de votre offre</h4>
                {[
                  { label: 'Titre', value: formData.title || '—' },
                  { label: 'Contrat', value: formData.contract_type },
                  { label: 'Localisation', value: formData.location || '—' },
                  { label: 'Entreprise', value: formData.company_name || '—' },
                  { label: 'Secteur', value: formData.sector },
                  { label: 'Visibilité', value: formData.visibility },
                  { label: 'Date limite', value: formData.deadline ? new Date(formData.deadline).toLocaleDateString('fr-FR') : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-800 text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">Complétion</span>
                  <span className={`text-sm font-bold ${completionStatus.color}`}>{completionPercentage}% — {completionStatus.label}</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Durée de publication</label>
                <div className="grid grid-cols-3 gap-3">
                  {['15 jours', '30 jours', '60 jours'].map((d) => (
                    <button key={d} type="button" onClick={() => updateFormField('publication_duration', d)}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${formData.publication_duration === d ? 'bg-[#0E2F56] border-[#0E2F56] text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-[#0E2F56] hover:text-[#0E2F56]'}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl border-2 p-4 transition-all ${formData.auto_renewal ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="auto_renewal" checked={formData.auto_renewal} onChange={(e) => { handleInputChange(e); if (e.target.checked) updateFormField('auto_renewal_pending_admin', true); }} className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56] mt-0.5" />
                  <div>
                    <span className="text-sm font-semibold text-gray-800">Renouvellement automatique après expiration</span>
                    <p className="text-xs text-gray-500 mt-0.5">L'offre sera automatiquement republiée après expiration</p>
                  </div>
                </label>
                {formData.auto_renewal && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-300 text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                    <span><strong>Validation admin requise</strong> — Le renouvellement sera soumis à validation. Vous serez notifié.</span>
                  </div>
                )}
              </div>

              <div className={`rounded-xl border-2 p-4 transition-all ${formData.legal_compliance ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'}`}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" name="legal_compliance" checked={formData.legal_compliance} onChange={handleInputChange} className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56] mt-0.5" required />
                  <div>
                    <span className="text-sm font-semibold text-gray-800">
                      Je certifie que cette offre respecte le Code du Travail Guinéen (2014) *
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">Obligatoire pour la publication de l'annonce</p>
                  </div>
                </label>
                {formData.legal_compliance && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Conformité légale validée
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-3 flex-shrink-0 bg-white rounded-b-2xl">
          {currentStep > 1 ? (
            <button type="button" onClick={() => goToStep(currentStep - 1)} className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-sm">
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>
          ) : (
            <button type="button" onClick={onClose} className="px-4 py-2.5 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition text-sm">
              Annuler
            </button>
          )}

          <div className="flex-1" />

          {currentStep < 5 && (
            <button type="button" onClick={() => setShowPreview(true)} disabled={!formData.title || !formData.description} className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#0E2F56] text-[#0E2F56] font-semibold rounded-xl hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm">
              <Eye className="w-4 h-4" /> Aperçu
            </button>
          )}

          {currentStep < 5 ? (
            <button type="button" onClick={() => goToStep(currentStep + 1)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-sm ${
                canProceed
                  ? 'bg-gradient-to-r from-[#0E2F56] to-blue-600 hover:from-[#1a4275] hover:to-blue-700 text-white shadow-blue-200'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}>
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setShowPreview(true)} disabled={!formData.title || !formData.description} className="flex items-center gap-2 px-4 py-2.5 border-2 border-[#0E2F56] text-[#0E2F56] font-semibold rounded-xl hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm">
                <Eye className="w-4 h-4" /> Aperçu
              </button>
              <button type="button" onClick={handlePublish} disabled={!formData.legal_compliance || loading}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition shadow-lg text-sm">
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Publication…</> : <><Send className="w-4 h-4" /> Publier l'offre</>}
              </button>
            </div>
          )}
        </div>
      </div>

      <AccessRestrictionModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} restrictionType="premium-only" currentUserType={profile?.user_type} />

      {showPreview && (
        <JobPreviewModal jobData={formData} onClose={() => setShowPreview(false)} onPublish={() => { setShowPreview(false); handlePublish(); }} />
      )}
    </div>
  );
}
