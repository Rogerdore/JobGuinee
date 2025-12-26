import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase, X, Loader, DollarSign, Calendar, MapPin, Building2,
  GraduationCap, FileText, Users, Mail, Sparkles, Eye, Globe, Share2,
  CheckCircle2, Upload as UploadIcon, Download, Wand2, Save, Clock, AlertCircle, CheckCircle,
  Image as ImageIcon, Percent
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RichTextEditor from '../forms/RichTextEditor';
import AutoCompleteInput from '../forms/AutoCompleteInput';
import AutoSaveIndicator from '../forms/AutoSaveIndicator';
import { useAutoSave } from '../../hooks/useAutoSave';
import { supabase } from '../../lib/supabase';
import {
  jobTitleSuggestions,
  companySuggestions,
  locationSuggestions,
  skillSuggestions,
  benefitSuggestions,
  sectorSuggestions,
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

export default function JobPublishForm({ onPublish, onClose, existingJob }: JobPublishFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [importingFile, setImportingFile] = useState(false);
  const [showDraftRecovery, setShowDraftRecovery] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [logoPreview, setLogoPreview] = useState<string>('');

  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

  const getInitialFormData = (): JobFormData => {
    if (existingJob) {
      return {
        title: existingJob.title || '',
        category: existingJob.category || 'Ressources Humaines',
        contract_type: existingJob.contract_type || 'CDI',
        position_count: existingJob.position_count || 1,
        position_level: existingJob.position_level || 'Intermédiaire',
        deadline: existingJob.application_deadline || existingJob.deadline || '',
        description: existingJob.description || '',
        responsibilities: existingJob.responsibilities || '',
        profile: existingJob.profile_sought || '',
        skills: existingJob.keywords || existingJob.required_skills || [],
        education_level: existingJob.education_level || 'Licence',
        experience_required: existingJob.experience_level || '3–5 ans',
        languages: existingJob.languages || [],
        company_name: existingJob.department || '',
        company_logo_url: existingJob.company_logo_url || '',
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
      experience_required: '3–5 ans',
      languages: [],
      company_name: '',
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
      legal_compliance: false,
    };
  };

  const [formData, setFormData] = useState<JobFormData>(getInitialFormData());

  const completionPercentage = useMemo(() => calculateJobCompletion(formData), [formData]);
  const completionStatus = useMemo(() => getJobCompletionStatus(completionPercentage), [completionPercentage]);
  const missingFields = useMemo(() => getMissingJobFields(formData), [formData]);

  const { status: autoSaveStatus, lastSaved, clearDraft, loadDraft, hasDraft } = useAutoSave({
    data: formData,
    key: `job-draft-${profile?.id || 'anonymous'}`,
    delay: 5000,
    enabled: !draftLoaded,
  });

  useEffect(() => {
    if (hasDraft() && !draftLoaded) {
      setShowDraftRecovery(true);
    }
  }, [hasDraft, draftLoaded]);

  const handleRecoverDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft);
      setDraftLoaded(true);
      setShowDraftRecovery(false);
    }
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowDraftRecovery(false);
    setDraftLoaded(true);
  };

  const updateFormField = useCallback((field: keyof JobFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    const error = validateJobField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  }, []);

  const handleInputChange = useCallback((field: keyof JobFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    e.target.type === 'number' ? Number(e.target.value) :
                    e.target.value;
      updateFormField(field, value);
    };
  }, [updateFormField]);

  const handleAddSkill = useCallback(() => {
    if (skillInput.trim()) {
      setFormData(prev => {
        if (prev.skills.includes(skillInput.trim())) return prev;
        return { ...prev, skills: [...prev.skills, skillInput.trim()] };
      });
      setSkillInput('');
    }
  }, [skillInput]);

  const handleRemoveSkill = useCallback((skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  }, []);

  const handleAddBenefit = useCallback(() => {
    if (benefitInput.trim()) {
      setFormData(prev => {
        if (prev.benefits.includes(benefitInput.trim())) return prev;
        return { ...prev, benefits: [...prev.benefits, benefitInput.trim()] };
      });
      setBenefitInput('');
    }
  }, [benefitInput]);

  const handleRemoveBenefit = useCallback((benefit: string) => {
    setFormData(prev => ({ ...prev, benefits: prev.benefits.filter(b => b !== benefit) }));
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  }, []);

  const toggleDocument = useCallback((doc: string) => {
    setFormData(prev => ({
      ...prev,
      required_documents: prev.required_documents.includes(doc)
        ? prev.required_documents.filter(d => d !== doc)
        : [...prev.required_documents, doc]
    }));
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.split('.').pop()?.toLowerCase();
    if (fileType !== 'pdf' && fileType !== 'docx' && fileType !== 'doc') {
      alert('Format non supporté. Veuillez importer un fichier PDF ou DOCX.');
      return;
    }

    setImportingFile(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;

      const extractedTitle = text.match(/Titre[:\s]+(.+)/i)?.[1] || formData.title;
      const extractedLocation = text.match(/Localisation[:\s]+(.+)/i)?.[1] || formData.location;
      const extractedDescription = text.substring(0, 500);

      setFormData(prev => ({
        ...prev,
        title: extractedTitle.trim(),
        location: extractedLocation.trim(),
        description: extractedDescription.trim(),
      }));

      setImportingFile(false);
      alert('Fichier importé avec succès ! Veuillez vérifier et compléter les informations.');
    };

    reader.onerror = () => {
      setImportingFile(false);
      alert('Erreur lors de l\'import du fichier.');
    };

    reader.readAsText(file);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image (PNG, JPG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (maximum 5 MB)');
      return;
    }

    setUploadingLogo(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      updateFormField('company_logo_url', publicUrl);
      setUploadingLogo(false);
    } catch (error) {
      console.error('Erreur upload logo:', error);
      alert('Erreur lors de l\'upload du logo');
      setUploadingLogo(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!isPremium) {
      alert('Cette fonctionnalité est réservée aux abonnés Premium. Souscrivez pour débloquer la génération IA !');
      return;
    }

    if (!formData.title || !formData.location) {
      alert('Veuillez d\'abord renseigner le titre du poste et la localisation.');
      return;
    }

    setIsGeneratingAI(true);

    await new Promise(resolve => setTimeout(resolve, 2500));

    const aiGeneratedData = {
      description: `Nous recherchons un(e) ${formData.title} talentueux(se) pour rejoindre notre équipe dynamique basée à ${formData.location}. Ce poste stratégique offre l'opportunité de contribuer activement au développement de nos activités dans un environnement professionnel stimulant.`,

      responsibilities: `• Assurer la gestion quotidienne des activités du département ${formData.category}
• Piloter et coordonner les projets stratégiques en lien avec le poste
• Développer et mettre en œuvre des processus d'amélioration continue
• Collaborer étroitement avec les équipes transverses
• Garantir le respect des standards de qualité et des procédures internes
• Participer activement aux réunions de coordination et de reporting
• Contribuer à l'innovation et à l'optimisation des pratiques`,

      profile: `Nous recherchons un profil dynamique et rigoureux, doté d'excellentes compétences en ${formData.category.toLowerCase()}. Le candidat idéal possède une forte capacité d'adaptation, un excellent sens de l'organisation et une aptitude avérée à travailler en équipe. Autonome et proactif, vous faites preuve d'un engagement sans faille dans l'atteinte des objectifs fixés.`,

      skills: [
        'Leadership',
        'Gestion de projet',
        'Communication efficace',
        'Analyse et résolution de problèmes',
        'Maîtrise des outils bureautiques (Excel, Word, PowerPoint)',
        'Esprit d\'équipe',
        'Sens de l\'organisation',
        'Autonomie'
      ],

      benefits: [
        'Package salarial compétitif',
        'Couverture médicale',
        'Formation continue',
        'Environnement de travail moderne',
        'Opportunités d\'évolution'
      ],

      company_description: `Entreprise leader dans le secteur ${formData.sector}, nous nous distinguons par notre excellence opérationnelle et notre engagement envers nos collaborateurs. Rejoignez une équipe passionnée et dynamique où vos talents seront valorisés.`,

      application_instructions: `Les candidats intéressés sont priés d'envoyer leur dossier de candidature complet (CV détaillé et lettre de motivation) à l'adresse email indiquée avant la date limite. Seuls les candidats présélectionnés seront contactés pour un entretien.`
    };

    setFormData(prev => ({
      ...prev,
      description: aiGeneratedData.description,
      responsibilities: aiGeneratedData.responsibilities,
      profile: aiGeneratedData.profile,
      skills: [...new Set([...prev.skills, ...aiGeneratedData.skills])],
      benefits: [...new Set([...prev.benefits, ...aiGeneratedData.benefits])],
      company_description: aiGeneratedData.company_description || prev.company_description,
      application_instructions: aiGeneratedData.application_instructions || prev.application_instructions,
    }));

    setIsGeneratingAI(false);
    alert('✨ Offre générée avec succès par l\'IA ! Vérifiez et ajustez les informations si nécessaire.');
  };

  const handlePublish = async () => {
    if (!formData.title || !formData.location || !formData.description || !formData.legal_compliance) {
      alert('Veuillez remplir tous les champs obligatoires et accepter la conformité légale.');
      return;
    }

    setLoading(true);
    await onPublish(formData);
    setLoading(false);
  };

  const FormSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl p-6 border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-5 pb-3 border-b-2 border-blue-100">
        <div className="p-2 bg-gradient-to-br from-[#0E2F56] to-blue-600 rounded-lg">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">
          {title}
        </h3>
      </div>
      <div className="space-y-5">
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ contain: 'layout' }}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8" style={{ contain: 'content' }}>
        <div className="sticky top-0 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Publier une offre d'emploi</h2>
              <p className="text-sm text-blue-100">Créez votre annonce professionnelle complète</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-100px)] overflow-y-auto">
          {showDraftRecovery && (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-blue-900 text-lg">Brouillon détecté</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Nous avons trouvé un brouillon non publié. Voulez-vous le récupérer pour continuer votre travail ?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleRecoverDraft}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm shadow-md hover:shadow-lg"
                  >
                    Récupérer
                  </button>
                  <button
                    type="button"
                    onClick={handleDiscardDraft}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-all font-medium text-sm"
                  >
                    Ignorer
                  </button>
                </div>
              </div>
            </div>
          )}

          <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-5 border-2 border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Percent className="w-5 h-5 text-[#0E2F56]" />
                </div>
                <div>
                  <p className="font-bold text-gray-800">Complétion de l'offre</p>
                  <p className={`text-sm font-medium ${completionStatus.color}`}>
                    {completionStatus.label}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-[#0E2F56]">{completionPercentage}%</p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-full ${completionStatus.bgColor} transition-all duration-500 ease-out rounded-full`}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>

            {missingFields.length > 0 && completionPercentage < 100 && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Champs manquants :</p>
                <div className="flex flex-wrap gap-1">
                  {missingFields.slice(0, 5).map((field, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                      {field}
                    </span>
                  ))}
                  {missingFields.length > 5 && (
                    <span className="text-xs px-2 py-1 bg-white rounded-full text-gray-600 border border-gray-200">
                      +{missingFields.length - 5} autres
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-orange-50 border-2 border-[#FF8C00]/30 rounded-xl p-4">
            <p className="text-sm text-gray-800 text-center">
              <span className="font-semibold text-[#FF8C00]">📋 Formulaire complet :</span> Remplissez toutes les sections pour créer une offre professionnelle et conforme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
            <div>
              <label htmlFor="file-import" className="cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition shadow-md">
                  <UploadIcon className="w-5 h-5" />
                  <span>{importingFile ? 'Import en cours...' : 'Importer depuis PDF/DOCX'}</span>
                </div>
              </label>
              <input
                id="file-import"
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleImportFile}
                className="hidden"
                disabled={importingFile}
              />
              <p className="text-xs text-gray-600 mt-2 text-center">Remplir automatiquement depuis un fichier</p>
            </div>

            <div>
              <button
                type="button"
                onClick={handleGenerateWithAI}
                disabled={isGeneratingAI || !isPremium}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-xl transition shadow-md ${
                  isPremium
                    ? 'bg-gradient-to-r from-[#FF8C00] to-orange-600 hover:from-orange-600 hover:to-[#FF8C00] text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={!isPremium ? 'Fonctionnalité Premium uniquement' : ''}
              >
                <Sparkles className="w-5 h-5" />
                <span>{isGeneratingAI ? 'Génération IA...' : 'Générer avec IA'}</span>
                {!isPremium && <span className="text-xs">(Premium)</span>}
              </button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                {isPremium ? 'Remplir automatiquement avec l\'IA' : 'Abonnement Premium requis'}
              </p>
            </div>
          </div>

          <FormSection title="1. Informations générales" icon={FileText}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <AutoCompleteInput
                  value={formData.title}
                  onChange={(value) => updateFormField('title', value)}
                  suggestions={jobTitleSuggestions}
                  placeholder="Ex : Superviseur Ressources Humaines"
                  label="Titre du poste"
                  required
                  minChars={2}
                />
                {validationErrors.title && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.title}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie / Domaine *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Ressources Humaines">Ressources Humaines</option>
                  <option value="Finance">Finance</option>
                  <option value="Mines">Mines</option>
                  <option value="Sécurité">Sécurité</option>
                  <option value="Transport">Transport</option>
                  <option value="IT">IT / Informatique</option>
                  <option value="BTP">BTP</option>
                  <option value="Santé">Santé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de contrat *
                </label>
                <select
                  value={formData.contract_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_type: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="CDI">CDI</option>
                  <option value="CDD">CDD</option>
                  <option value="Stage">Stage</option>
                  <option value="Intérim">Intérim</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de postes
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.position_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, position_count: Number(e.target.value) }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Niveau de poste
                </label>
                <select
                  value={formData.position_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, position_level: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Débutant">Débutant</option>
                  <option value="Intermédiaire">Intermédiaire</option>
                  <option value="Senior">Senior</option>
                  <option value="Direction">Direction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-[#FF8C00]" />
                  Date limite de candidature *
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => updateFormField('deadline', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  required
                />
                {validationErrors.deadline && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.deadline}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="2. Description du poste" icon={FileText}>
            <div className="space-y-4">
              <div>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => updateFormField('description', value)}
                  placeholder="Décrivez brièvement le poste..."
                  label="Présentation du poste *"
                />
                {validationErrors.description && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Missions principales
                </label>
                <textarea
                  value={formData.responsibilities}
                  onChange={(e) => setFormData(prev => ({ ...prev, responsibilities: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                  placeholder="• Mission 1&#10;• Mission 2&#10;• Mission 3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profil recherché
                </label>
                <textarea
                  value={formData.profile}
                  onChange={(e) => setFormData(prev => ({ ...prev, profile: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                  placeholder="Indiquez le type de profil souhaité..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Compétences clés
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <AutoCompleteInput
                      value={skillInput}
                      onChange={setSkillInput}
                      suggestions={skillSuggestions}
                      placeholder="Ex: Excel, Leadership, Gestion de projet..."
                      minChars={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-blue-900 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Niveau d'études requis
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, education_level: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  >
                    <option value="BEP">BEP</option>
                    <option value="BAC">BAC</option>
                    <option value="BTS">BTS</option>
                    <option value="Licence">Licence (Bac+3)</option>
                    <option value="Master">Master (Bac+5)</option>
                    <option value="Doctorat">Doctorat (Bac+8)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expérience requise
                  </label>
                  <select
                    value={formData.experience_required}
                    onChange={(e) => setFormData(prev => ({ ...prev, experience_required: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  >
                    <option value="Débutant">Débutant</option>
                    <option value="1–3 ans">1–3 ans</option>
                    <option value="3–5 ans">3–5 ans</option>
                    <option value="5–10 ans">5–10 ans</option>
                    <option value="+10 ans">+10 ans</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Langues exigées
                </label>
                <div className="flex flex-wrap gap-3">
                  {['Français', 'Anglais', 'Chinois'].map((lang) => (
                    <label key={lang} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.languages.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                      />
                      <span className="text-sm font-medium text-gray-700">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="3. Informations sur l'entreprise" icon={Building2}>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 border-2 border-blue-200 mb-5">
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0E2F56]" />
                Logo de l'entreprise (optionnel)
              </label>

              <div className="flex items-start gap-4">
                {(logoPreview || formData.company_logo_url) && (
                  <div className="relative">
                    <img
                      src={logoPreview || formData.company_logo_url}
                      alt="Logo entreprise"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-blue-300 shadow-md"
                    />
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
                        <Loader className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1">
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border-2 border-dashed border-blue-300 rounded-xl transition-all hover:border-blue-500 group">
                      <UploadIcon className="w-5 h-5 text-[#0E2F56] group-hover:text-blue-600 transition" />
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-[#0E2F56] transition">
                        {uploadingLogo ? 'Upload en cours...' : 'Télécharger un logo'}
                      </span>
                    </div>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                  <p className="text-xs text-gray-600 mt-2">PNG, JPG ou GIF (max 5 MB)</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <AutoCompleteInput
                  value={formData.company_name}
                  onChange={(value) => updateFormField('company_name', value)}
                  suggestions={companySuggestions}
                  placeholder="Ex : Winning Consortium"
                  label="Nom de l'entreprise"
                  required
                  minChars={2}
                />
                {validationErrors.company_name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.company_name}
                  </p>
                )}
              </div>

              <div>
                <AutoCompleteInput
                  value={formData.sector}
                  onChange={(value) => updateFormField('sector', value)}
                  suggestions={sectorSuggestions}
                  placeholder="Ex : Mines, Banque, IT..."
                  label="Secteur d'activité"
                  required
                  minChars={1}
                />
              </div>

              <div>
                <AutoCompleteInput
                  value={formData.location}
                  onChange={(value) => updateFormField('location', value)}
                  suggestions={locationSuggestions}
                  placeholder="Ex : Kinshasa, Lubumbashi..."
                  label="Localisation du poste"
                  required
                  minChars={2}
                />
                {validationErrors.location && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.location}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Présentation de l'entreprise
                </label>
                <textarea
                  value={formData.company_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                  placeholder="Décrivez votre entreprise en quelques lignes..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Site web (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormField('website', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="https://www.monentreprise.com"
                />
                {validationErrors.website && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.website}
                  </p>
                )}
              </div>
            </div>
          </FormSection>

          <FormSection title="4. Rémunération et avantages" icon={DollarSign}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fourchette salariale (GNF)
                </label>
                <input
                  type="text"
                  value={formData.salary_range}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary_range: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="Ex : 6.000.000 - 8.000.000 GNF"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de salaire
                </label>
                <select
                  value={formData.salary_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary_type: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Fixe">Fixe</option>
                  <option value="Négociable">Négociable</option>
                  <option value="Non communiqué">Non communiqué</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Avantages
                </label>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <AutoCompleteInput
                      value={benefitInput}
                      onChange={setBenefitInput}
                      suggestions={benefitSuggestions}
                      placeholder="Ex: logement, repas, transport, couverture santé..."
                      minChars={2}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBenefit}
                    className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-xl transition"
                  >
                    Ajouter
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {benefit}
                      <button
                        type="button"
                        onClick={() => handleRemoveBenefit(benefit)}
                        className="hover:text-green-900 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </FormSection>

          <FormSection title="5. Modalités de candidature" icon={Mail}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email de réception des candidatures *
                </label>
                <input
                  type="email"
                  value={formData.application_email}
                  onChange={(e) => updateFormField('application_email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="Ex : rh@entreprise.com"
                  required
                />
                {validationErrors.application_email && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.application_email}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.receive_in_platform}
                    onChange={(e) => setFormData(prev => ({ ...prev, receive_in_platform: e.target.checked }))}
                    className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                  />
                  <span className="text-sm font-medium text-gray-700">Recevoir les candidatures directement dans mon espace recruteur</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Documents requis
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['CV', 'Lettre de motivation', 'Certificat de travail', 'CNSS'].map((doc) => (
                    <label key={doc} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.required_documents.includes(doc)}
                        onChange={() => toggleDocument(doc)}
                        className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                      />
                      <span className="text-sm font-medium text-gray-700">{doc}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Instructions supplémentaires
                </label>
                <textarea
                  value={formData.application_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, application_instructions: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                  placeholder="Ex : Envoyez vos dossiers complets avant le 15 novembre..."
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="6. Options de visibilité" icon={Eye}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Visibilité de l'annonce
                </label>
                <div className="space-y-2">
                  {['Publique', 'Restreinte aux abonnés', 'Confidentielle (anonyme)'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value={option}
                        checked={formData.visibility === option}
                        onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value }))}
                        className="w-5 h-5 text-[#0E2F56] focus:ring-[#0E2F56]"
                      />
                      <span className="text-sm font-medium text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_premium: e.target.checked }))}
                    className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                  />
                  <span className="text-sm font-medium text-gray-700">Mettre l'annonce en avant (Premium)</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Langue de l'annonce
                </label>
                <select
                  value={formData.announcement_language}
                  onChange={(e) => setFormData(prev => ({ ...prev, announcement_language: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Français + Anglais">Français + Anglais</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_share}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_share: e.target.checked }))}
                    className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                  />
                  <span className="text-sm font-medium text-gray-700">Partager automatiquement sur Facebook / LinkedIn / Telegram RH</span>
                </label>
              </div>
            </div>
          </FormSection>

          <FormSection title="7. Publication et validation" icon={CheckCircle2}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Durée de publication
                </label>
                <select
                  value={formData.publication_duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, publication_duration: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="15 jours">15 jours</option>
                  <option value="30 jours">30 jours</option>
                  <option value="60 jours">60 jours</option>
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.auto_renewal}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_renewal: e.target.checked }))}
                    className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                  />
                  <span className="text-sm font-medium text-gray-700">Renouvellement automatique après expiration</span>
                </label>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.legal_compliance}
                    onChange={(e) => setFormData(prev => ({ ...prev, legal_compliance: e.target.checked }))}
                    className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                    required
                  />
                  <span className="text-sm font-semibold text-gray-800">
                    Je certifie que cette offre respecte le Code du Travail Guinéen (2014) *
                  </span>
                </label>
              </div>
            </div>
          </FormSection>

          <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              onClick={handlePublish}
              disabled={!formData.title || !formData.location || !formData.description || !formData.legal_compliance || loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0E2F56] to-blue-700 hover:from-[#1a4275] hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Publication en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Publier mon offre
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
