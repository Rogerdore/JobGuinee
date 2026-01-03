import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase, Building, Mail, AlertCircle, Plus, Save, ArrowLeft,
  FileText, Users, MapPin, DollarSign, Calendar, GraduationCap,
  Sparkles, Percent, Building2, Shield, Image as ImageIcon, Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RichTextEditor from '../components/forms/RichTextEditor';
import AutoCompleteInput from '../components/forms/AutoCompleteInput';
import AutoSaveIndicator from '../components/forms/AutoSaveIndicator';
import { useAutoSave } from '../hooks/useAutoSave';
import LanguageLevelSelector from '../components/forms/LanguageLevelSelector';
import LanguageRequirementsManager from '../components/forms/LanguageRequirementsManager';
import {
  jobTitleSuggestions,
  companySuggestions,
  locationSuggestions,
  skillSuggestions,
  benefitSuggestions,
  sectorSuggestions,
  categorySuggestions,
} from '../utils/jobSuggestions';
import {
  calculateJobCompletion,
  getJobCompletionStatus,
  getMissingJobFields,
  validateJobField
} from '../utils/jobCompletionHelpers';
import { JobFormData } from '../types/jobFormTypes';

interface Partner {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  type: string;
}

type ApplicationMode =
  | 'company_account'
  | 'internal_admin'
  | 'external_email'
  | 'invited_partner'
  | 'external_link';

interface Props {
  onNavigate: (page: string) => void;
}

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

const AdminJobCreate: React.FC<Props> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);

  const getInitialFormData = useCallback((): JobFormData & {
    published_by_admin: boolean;
    publication_source: 'jobguinee' | 'partenaire';
    application_mode: ApplicationMode;
    partner_id: string;
    partner_type: string;
    partner_name: string;
    partner_email: string;
    partner_logo_url: string;
    external_apply_url: string;
    admin_notes: string;
  } => ({
    // Champs standard du formulaire recruteur
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
    company_logo_url: '',
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

    // Champs spécifiques admin
    published_by_admin: true,
    publication_source: 'jobguinee',
    application_mode: 'internal_admin',
    partner_id: '',
    partner_type: '',
    partner_name: '',
    partner_email: '',
    partner_logo_url: '',
    external_apply_url: '',
    admin_notes: ''
  }), []);

  const [formData, setFormData] = useState(getInitialFormData());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    type: 'cabinet',
    logo_url: '',
    notes: ''
  });

  useEffect(() => {
    loadPartners();
    setDraftLoaded(true);
  }, []);

  const loadPartners = async () => {
    const { data } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (data) setPartners(data);
  };

  const completionPercentage = useMemo(() => calculateJobCompletion(formData), [formData]);
  const completionStatus = useMemo(() => getJobCompletionStatus(completionPercentage), [completionPercentage]);
  const missingFields = useMemo(() => getMissingJobFields(formData), [formData]);

  const { status: autoSaveStatus, lastSaved } = useAutoSave({
    data: formData,
    key: `admin-job-draft-${profile?.id || 'anonymous'}`,
    delay: 10000,
    enabled: draftLoaded,
  });

  const updateFormField = useCallback((field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    if (field in formData) {
      const error = validateJobField(field as keyof JobFormData, value);
      setValidationErrors(prev => {
        if (error) {
          return { ...prev, [field]: error };
        } else {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        }
      });
    }
  }, [formData]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const field = e.target.name;
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                  e.target.type === 'number' ? Number(e.target.value) :
                  e.target.value;
    updateFormField(field as any, value);
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

  const handleLanguageRequirementsChange = useCallback((requirements: any[]) => {
    setFormData(prev => ({ ...prev, language_requirements: requirements }));
  }, []);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `company-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, company_logo_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Erreur lors du téléchargement du logo');
    } finally {
      setUploadingLogo(false);
    }
  }, []);

  const handleFeaturedImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }

    setUploadingFeaturedImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `job-featured-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-logos')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, featured_image_url: publicUrl }));
    } catch (error) {
      console.error('Error uploading featured image:', error);
      alert('Erreur lors du téléchargement de l\'image de mise en avant');
    } finally {
      setUploadingFeaturedImage(false);
    }
  }, []);

  const handleCreatePartner = async () => {
    if (!newPartner.name || !newPartner.email) {
      alert('Nom et email requis');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('partners')
      .insert({
        ...newPartner,
        invited_by: user.id,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      alert('Erreur lors de la création du partenaire');
      return;
    }

    setPartners(prev => [...prev, data]);
    setFormData(prev => ({
      ...prev,
      partner_id: data.id,
      partner_name: data.name,
      partner_email: data.email,
      partner_logo_url: data.logo_url || '',
      partner_type: data.type
    }));

    setNewPartner({ name: '', email: '', type: 'cabinet', logo_url: '', notes: '' });
    setShowPartnerForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.location || !formData.description) {
      alert('Veuillez remplir tous les champs obligatoires (titre, localisation, description)');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const jobData: any = {
        title: formData.title,
        category: formData.category,
        contract_type: formData.contract_type,
        position_count: formData.position_count,
        position_level: formData.position_level,
        deadline: formData.deadline,
        description: formData.description,
        responsibilities: formData.responsibilities,
        profile_sought: formData.profile,
        keywords: formData.skills,
        education_level: formData.education_level,
        primary_qualification: formData.primary_qualification,
        experience_level: formData.experience_required,
        languages: formData.languages,
        language_requirements: formData.language_requirements,
        department: formData.company_name,
        company_name: formData.company_name,
        company_logo_url: formData.company_logo_url,
        featured_image_url: formData.featured_image_url,
        sector: formData.sector,
        location: formData.location,
        company_description: formData.company_description,
        company_website: formData.website,
        salary_range: formData.salary_range,
        salary_type: formData.salary_type,
        benefits: formData.benefits.join(', '),
        application_email: formData.application_email,
        receive_in_platform: formData.receive_in_platform,
        required_documents: formData.required_documents,
        application_instructions: formData.application_instructions,
        visibility: formData.visibility,
        announcement_language: formData.announcement_language,

        // Champs admin spécifiques
        published_by_admin: true,
        admin_publisher_id: user.id,
        publication_source: formData.publication_source,
        application_mode: formData.application_mode,
        admin_notes: formData.admin_notes,
        status: 'active',
        is_visible: true
      };

      if (formData.publication_source === 'partenaire' && formData.partner_id) {
        jobData.partner_id = formData.partner_id;
        jobData.partner_name = formData.partner_name;
        jobData.partner_email = formData.partner_email;
        jobData.partner_logo_url = formData.partner_logo_url;
        jobData.partner_type = formData.partner_type;
      }

      if (formData.application_mode === 'external_email') {
        jobData.partner_email = formData.partner_email;
      }

      if (formData.application_mode === 'external_link') {
        jobData.external_apply_url = formData.external_apply_url;
      }

      const { error } = await supabase
        .from('jobs')
        .insert(jobData);

      if (error) throw error;

      alert('✅ Offre publiée avec succès');
      onNavigate('admin-job-list');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button
          onClick={() => onNavigate('admin-job-list')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour à la liste
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Publier une offre d'emploi (Admin)
        </h1>
        <p className="text-gray-600">
          Publication directe par l'administration avec formulaire complet
        </p>
      </div>

      <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />

      <form onSubmit={handleSubmit} className="space-y-6 mt-6">
        {/* Barre de progression */}
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

        {/* 1. Informations générales */}
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
              <AutoCompleteInput
                value={formData.category}
                onChange={(value) => updateFormField('category', value)}
                suggestions={categorySuggestions}
                placeholder="Ex : Ressources Humaines, Finance, IT..."
                label={`Catégorie / Domaine * (${categorySuggestions.length} catégories)`}
                required
                minChars={1}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Type de contrat *
              </label>
              <select
                name="contract_type"
                value={formData.contract_type}
                onChange={handleInputChange}
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
                name="position_count"
                min="1"
                value={formData.position_count}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Niveau de poste
              </label>
              <select
                name="position_level"
                value={formData.position_level}
                onChange={handleInputChange}
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
                name="deadline"
                value={formData.deadline}
                onChange={handleInputChange}
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

        {/* 2. Description du poste */}
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
                name="responsibilities"
                value={formData.responsibilities}
                onChange={handleInputChange}
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
                name="profile"
                value={formData.profile}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                placeholder="Décrivez le profil idéal..."
              />
            </div>
          </div>
        </FormSection>

        {/* 3. Compétences et qualifications */}
        <FormSection title="3. Compétences et qualifications" icon={GraduationCap}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Niveau d'études requis
                </label>
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Aucun diplôme requis">Aucun diplôme requis</option>
                  <option value="BEPC / CAP">BEPC / CAP</option>
                  <option value="BAC">BAC</option>
                  <option value="BAC+2">BAC+2</option>
                  <option value="Licence">Licence (BAC+3)</option>
                  <option value="Master">Master (BAC+5)</option>
                  <option value="Doctorat">Doctorat (BAC+8)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expérience requise
                </label>
                <select
                  name="experience_required"
                  value={formData.experience_required}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Aucune expérience">Aucune expérience</option>
                  <option value="0–2 ans">0–2 ans</option>
                  <option value="3–5 ans">3–5 ans</option>
                  <option value="6–10 ans">6–10 ans</option>
                  <option value="Plus de 10 ans">Plus de 10 ans</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Qualification et compétence principale requise *
              </label>
              <input
                type="text"
                name="primary_qualification"
                value={formData.primary_qualification}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                placeholder="Ex: Ingénieur en génie civil, Expert en gestion de projet, Comptable certifié..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Indiquez le titre professionnel, la qualification ou la compétence principale requise pour ce poste
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Autres compétences requises
              </label>
              <div className="flex gap-2 mb-2">
                <AutoCompleteInput
                  value={skillInput}
                  onChange={setSkillInput}
                  suggestions={skillSuggestions}
                  placeholder="Ex: Leadership, Gestion de projet..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  minChars={2}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:bg-blue-200"
                    onClick={() => handleRemoveSkill(skill)}
                  >
                    {skill}
                    <span className="text-blue-500">×</span>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <LanguageRequirementsManager
                requirements={formData.language_requirements}
                onChange={handleLanguageRequirementsChange}
              />
            </div>
          </div>
        </FormSection>

        {/* 4. Entreprise et localisation */}
        <FormSection title="4. Entreprise et localisation" icon={Building}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <AutoCompleteInput
                  value={formData.company_name}
                  onChange={(value) => updateFormField('company_name', value)}
                  suggestions={companySuggestions}
                  placeholder="Ex : SMB-Winning"
                  label="Nom de l'entreprise *"
                  required
                  minChars={2}
                />
              </div>

              <div>
                <AutoCompleteInput
                  value={formData.sector}
                  onChange={(value) => updateFormField('sector', value)}
                  suggestions={sectorSuggestions}
                  placeholder="Ex : Mines et Ressources Minérales"
                  label={`Secteur d'activité * (${sectorSuggestions.length} catégories)`}
                  required
                  minChars={2}
                />
              </div>
            </div>

            <div>
              <AutoCompleteInput
                value={formData.location}
                onChange={(value) => updateFormField('location', value)}
                suggestions={locationSuggestions}
                placeholder="Ex : Conakry"
                label="Localisation *"
                required
                minChars={2}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description de l'entreprise
              </label>
              <textarea
                name="company_description"
                value={formData.company_description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                placeholder="Présentez brièvement l'entreprise..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Site web
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Logo de l'entreprise */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Logo de l'entreprise
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-500 transition">
                  {formData.company_logo_url ? (
                    <div className="space-y-3">
                      <img
                        src={formData.company_logo_url}
                        alt="Logo"
                        className="w-32 h-32 object-contain mx-auto"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, company_logo_url: '' }))}
                        className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploadingLogo ? 'Téléchargement...' : 'Cliquez pour télécharger'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploadingLogo}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Image de mise en avant */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image de mise en avant
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-500 transition">
                  {formData.featured_image_url ? (
                    <div className="space-y-3">
                      <img
                        src={formData.featured_image_url}
                        alt="Image de mise en avant"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, featured_image_url: '' }))}
                        className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-600">
                        {uploadingFeaturedImage ? 'Téléchargement...' : 'Cliquez pour télécharger'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFeaturedImageUpload}
                        className="hidden"
                        disabled={uploadingFeaturedImage}
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Image principale affichée avec l'offre (ratio 16:9 recommandé)
                </p>
              </div>
            </div>
          </div>
        </FormSection>

        {/* 5. Rémunération et avantages */}
        <FormSection title="5. Rémunération et avantages" icon={DollarSign}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Fourchette salariale
                </label>
                <input
                  type="text"
                  name="salary_range"
                  value={formData.salary_range}
                  onChange={handleInputChange}
                  placeholder="Ex: 500,000 - 800,000 GNF"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type de salaire
                </label>
                <select
                  name="salary_type"
                  value={formData.salary_type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Négociable">Négociable</option>
                  <option value="Fixe">Fixe</option>
                  <option value="Selon profil">Selon profil</option>
                  <option value="Non divulgué">Non divulgué</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Avantages
              </label>
              <div className="flex gap-2 mb-2">
                <AutoCompleteInput
                  value={benefitInput}
                  onChange={setBenefitInput}
                  suggestions={benefitSuggestions}
                  placeholder="Ex: Assurance santé, Transport..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddBenefit();
                    }
                  }}
                  minChars={2}
                />
                <button
                  type="button"
                  onClick={handleAddBenefit}
                  className="px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.benefits.map((benefit, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:bg-green-200"
                    onClick={() => handleRemoveBenefit(benefit)}
                  >
                    {benefit}
                    <span className="text-green-500">×</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FormSection>

        {/* 6. Modalités de candidature */}
        <FormSection title="6. Modalités de candidature" icon={Mail}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Documents requis
              </label>
              <div className="space-y-2">
                {['CV', 'Lettre de motivation', 'Diplômes', 'Certificats', 'Références'].map((doc) => (
                  <label key={doc} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.required_documents.includes(doc)}
                      onChange={() => toggleDocument(doc)}
                      className="w-4 h-4 text-[#0E2F56] border-gray-300 rounded focus:ring-[#0E2F56]"
                    />
                    <span className="text-sm font-medium text-gray-700">{doc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Instructions de candidature
              </label>
              <textarea
                name="application_instructions"
                value={formData.application_instructions}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                placeholder="Instructions supplémentaires pour les candidats..."
              />
            </div>
          </div>
        </FormSection>

        {/* SECTIONS ADMIN SPÉCIFIQUES */}

        {/* 7. Source de publication (ADMIN) */}
        <FormSection title="7. Source de publication (Admin)" icon={Building2}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publié par
              </label>
              <select
                value={formData.publication_source}
                onChange={(e) => updateFormField('publication_source', e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="jobguinee">JobGuinée</option>
                <option value="partenaire">Partenaire</option>
              </select>
            </div>

            {formData.publication_source === 'partenaire' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Partenaire
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPartnerForm(!showPartnerForm)}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau partenaire
                  </button>
                </div>

                {showPartnerForm ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3 mb-4">
                    <input
                      type="text"
                      placeholder="Nom du partenaire"
                      value={newPartner.name}
                      onChange={(e) => setNewPartner(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newPartner.email}
                      onChange={(e) => setNewPartner(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <select
                      value={newPartner.type}
                      onChange={(e) => setNewPartner(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="cabinet">Cabinet de recrutement</option>
                      <option value="institution">Institution</option>
                      <option value="entreprise">Entreprise</option>
                      <option value="autre">Autre</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCreatePartner}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Créer
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPartnerForm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={formData.partner_id}
                    onChange={(e) => {
                      const partnerId = e.target.value;
                      updateFormField('partner_id', partnerId);
                      const partner = partners.find(p => p.id === partnerId);
                      if (partner) {
                        updateFormField('partner_name', partner.name);
                        updateFormField('partner_email', partner.email);
                        updateFormField('partner_logo_url', partner.logo_url || '');
                        updateFormField('partner_type', partner.type);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un partenaire</option>
                    {partners.map(partner => (
                      <option key={partner.id} value={partner.id}>
                        {partner.name} ({partner.type})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        </FormSection>

        {/* 8. Mode de réception des candidatures (ADMIN) */}
        <FormSection title="8. Mode de réception des candidatures (Admin)" icon={Mail}>
          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="application_mode"
                value="internal_admin"
                checked={formData.application_mode === 'internal_admin'}
                onChange={(e) => updateFormField('application_mode', e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Admin JobGuinée uniquement</div>
                <div className="text-sm text-gray-600">
                  Les candidatures sont visibles uniquement par l'administration
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="application_mode"
                value="external_email"
                checked={formData.application_mode === 'external_email'}
                onChange={(e) => updateFormField('application_mode', e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Email automatique + Copie JobGuinée</div>
                <div className="text-sm text-gray-600">
                  Envoi automatique à l'email indiqué + archivage JobGuinée
                </div>
              </div>
            </label>

            {formData.application_mode === 'external_email' && (
              <div className="ml-12">
                <input
                  type="email"
                  placeholder="Email de réception"
                  value={formData.partner_email}
                  onChange={(e) => updateFormField('partner_email', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="application_mode"
                value="invited_partner"
                checked={formData.application_mode === 'invited_partner'}
                onChange={(e) => updateFormField('application_mode', e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Partenaire invité</div>
                <div className="text-sm text-gray-600">
                  Le partenaire reçoit un compte pour gérer les candidatures
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="application_mode"
                value="external_link"
                checked={formData.application_mode === 'external_link'}
                onChange={(e) => updateFormField('application_mode', e.target.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium">Lien externe</div>
                <div className="text-sm text-gray-600">
                  Redirection vers un site externe + tracking
                </div>
              </div>
            </label>

            {formData.application_mode === 'external_link' && (
              <div className="ml-12">
                <input
                  type="url"
                  placeholder="https://example.com/apply"
                  value={formData.external_apply_url}
                  onChange={(e) => updateFormField('external_apply_url', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        </FormSection>

        {/* 9. Notes internes (ADMIN) */}
        <FormSection title="9. Notes internes (Admin uniquement)" icon={Shield}>
          <div>
            <textarea
              value={formData.admin_notes}
              onChange={(e) => updateFormField('admin_notes', e.target.value)}
              placeholder="Notes privées pour l'équipe administrative..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Ces notes ne seront visibles que par les administrateurs
            </p>
          </div>
        </FormSection>

        {/* Boutons d'action */}
        <div className="flex gap-4 pt-6 border-t-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Publication...' : 'Publier l\'offre'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('admin-job-list')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminJobCreate;
