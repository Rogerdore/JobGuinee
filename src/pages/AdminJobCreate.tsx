import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Briefcase, Building, Mail, AlertCircle, Plus, ArrowLeft, ArrowRight,
  FileText, Users, MapPin, DollarSign, Calendar, GraduationCap,
  Building2, Shield, Image as ImageIcon, Upload, CheckCircle,
  ChevronRight, Eye, Globe, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import RichTextEditor from '../components/forms/RichTextEditor';
import AutoCompleteInput from '../components/forms/AutoCompleteInput';
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
import { JobFormData } from '../types/jobFormTypes';

interface Partner {
  id: string;
  name: string;
  email: string;
  logo_url?: string;
  type: string;
}

type ApplicationMode = 'company_account' | 'internal_admin' | 'external_email' | 'invited_partner' | 'external_link';

interface Props {
  onNavigate: (page: string) => void;
}

type AdminFormData = JobFormData & {
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
};

const STEPS = [
  { id: 1, label: 'Informations', icon: FileText, description: 'Titre, catégorie, contrat' },
  { id: 2, label: 'Description', icon: Briefcase, description: 'Description et profil' },
  { id: 3, label: 'Qualifications', icon: GraduationCap, description: 'Compétences et langues' },
  { id: 4, label: 'Entreprise', icon: Building, description: 'Entreprise et localisation' },
  { id: 5, label: 'Rémunération', icon: DollarSign, description: 'Salaire et avantages' },
  { id: 6, label: 'Candidature', icon: Mail, description: 'Modalités et documents' },
  { id: 7, label: 'Admin', icon: Shield, description: 'Source et mode de candidature' },
  { id: 8, label: 'Publication', icon: Eye, description: 'Révision et publication' },
];

const getInitialFormData = (): AdminFormData => ({
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
});

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    {children}
    {required && <span className="text-red-500 ml-1">*</span>}
  </label>
);

const inputClass = "w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white";
const textareaClass = `${inputClass} resize-none`;

const AdminJobCreate: React.FC<Props> = ({ onNavigate }) => {
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFeaturedImage, setUploadingFeaturedImage] = useState(false);
  const [formData, setFormData] = useState<AdminFormData>(getInitialFormData());
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [newPartner, setNewPartner] = useState({ name: '', email: '', type: 'cabinet', logo_url: '', notes: '' });

  useEffect(() => { loadPartners(); }, []);

  const loadPartners = async () => {
    const { data } = await supabase.from('partners').select('*').eq('status', 'active').order('name');
    if (data) setPartners(data);
  };

  const updateField = useCallback((field: keyof AdminFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setStepErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    updateField(name as keyof AdminFormData, type === 'checkbox' ? (e.target as HTMLInputElement).checked : type === 'number' ? Number(value) : value);
  }, [updateField]);

  const addSkill = useCallback(() => {
    if (!skillInput.trim()) return;
    setFormData(prev => prev.skills.includes(skillInput.trim()) ? prev : { ...prev, skills: [...prev.skills, skillInput.trim()] });
    setSkillInput('');
  }, [skillInput]);

  const addBenefit = useCallback(() => {
    if (!benefitInput.trim()) return;
    setFormData(prev => prev.benefits.includes(benefitInput.trim()) ? prev : { ...prev, benefits: [...prev.benefits, benefitInput.trim()] });
    setBenefitInput('');
  }, [benefitInput]);

  const toggleDocument = useCallback((doc: string) => {
    setFormData(prev => ({
      ...prev,
      required_documents: prev.required_documents.includes(doc)
        ? prev.required_documents.filter(d => d !== doc)
        : [...prev.required_documents, doc]
    }));
  }, []);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `company-logos/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('company-logos').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
      updateField('company_logo_url', publicUrl);
    } catch { alert('Erreur lors du téléchargement du logo'); }
    finally { setUploadingLogo(false); }
  }, [updateField]);

  const handleFeaturedImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setUploadingFeaturedImage(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `job-featured-images/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      const { error } = await supabase.storage.from('company-logos').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path);
      updateField('featured_image_url', publicUrl);
    } catch { alert('Erreur lors du téléchargement de l\'image'); }
    finally { setUploadingFeaturedImage(false); }
  }, [updateField]);

  const handleCreatePartner = async () => {
    if (!newPartner.name || !newPartner.email) { alert('Nom et email requis'); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from('partners').insert({ ...newPartner, invited_by: user.id, status: 'active' }).select().single();
    if (error) { alert('Erreur lors de la création du partenaire'); return; }
    setPartners(prev => [...prev, data]);
    setFormData(prev => ({ ...prev, partner_id: data.id, partner_name: data.name, partner_email: data.email, partner_logo_url: data.logo_url || '', partner_type: data.type }));
    setNewPartner({ name: '', email: '', type: 'cabinet', logo_url: '', notes: '' });
    setShowPartnerForm(false);
  };

  const validateStep = (step: number): boolean => {
    const errors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.title.trim()) errors.title = 'Le titre est obligatoire';
      if (!formData.deadline) errors.deadline = 'La date limite est obligatoire';
    }
    if (step === 2) {
      if (!formData.description.trim()) errors.description = 'La description est obligatoire';
    }
    if (step === 4) {
      if (!formData.company_name.trim()) errors.company_name = 'Le nom de l\'entreprise est obligatoire';
      if (!formData.location.trim()) errors.location = 'La localisation est obligatoire';
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(s => Math.min(s + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goPrev = () => {
    setCurrentStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const jobData: any = {
        user_id: user.id,
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
        published_by_admin: true,
        admin_publisher_id: user.id,
        publication_source: formData.publication_source,
        application_mode: formData.application_mode,
        admin_notes: formData.admin_notes,
        status: 'published',
        is_visible: true
      };

      if (formData.publication_source === 'partenaire' && formData.partner_id) {
        jobData.partner_id = formData.partner_id;
        jobData.partner_name = formData.partner_name;
        jobData.partner_email = formData.partner_email;
        jobData.partner_logo_url = formData.partner_logo_url;
        jobData.partner_type = formData.partner_type;
      }
      if (formData.application_mode === 'external_email') jobData.partner_email = formData.partner_email;
      if (formData.application_mode === 'external_link') jobData.external_apply_url = formData.external_apply_url;

      const { error } = await supabase.from('jobs').insert(jobData);
      if (error) throw error;

      onNavigate('admin-job-list');
    } catch (error: any) {
      console.error('Error creating job:', error);
      alert(`Erreur lors de la publication: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  const completedSteps = useMemo(() => {
    const completed = new Set<number>();
    if (formData.title && formData.deadline) completed.add(1);
    if (formData.description) completed.add(2);
    completed.add(3);
    if (formData.company_name && formData.location) completed.add(4);
    completed.add(5);
    completed.add(6);
    completed.add(7);
    return completed;
  }, [formData]);

  const progressPct = Math.round((completedSteps.size / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate('admin-job-list')}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
              <div className="w-px h-6 bg-gray-200" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Publier une offre d'emploi</h1>
                <p className="text-xs text-gray-500">Administration • Publication directe</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-500">Complété</p>
                <p className="text-sm font-bold text-blue-600">{progressPct}%</p>
              </div>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 sticky top-24">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Étapes</p>
              <nav className="space-y-1">
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = currentStep === step.id;
                  const isDone = completedSteps.has(step.id);
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isDone && !isActive ? 'bg-green-100' : isActive ? 'bg-blue-600' : 'bg-gray-100'
                      }`}>
                        {isDone && !isActive
                          ? <CheckCircle className="w-4 h-4 text-green-600" />
                          : <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                        }
                      </div>
                      <div>
                        <p className={`text-sm font-medium leading-tight ${isActive ? 'text-blue-700' : ''}`}>
                          {step.label}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight">{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Mobile step indicator */}
          <div className="lg:hidden w-full mb-4">
            <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-white" />; })()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">Étape {currentStep}/{STEPS.length}: {STEPS[currentStep - 1].label}</p>
                <p className="text-xs text-gray-500">{STEPS[currentStep - 1].description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-bold text-blue-600">{progressPct}%</p>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              {/* Step header */}
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0E2F56] to-blue-600 rounded-xl flex items-center justify-center">
                  {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="w-5 h-5 text-white" />; })()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{STEPS[currentStep - 1].label}</h2>
                  <p className="text-sm text-gray-500">{STEPS[currentStep - 1].description}</p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => setCurrentStep(s.id)}
                      className={`w-2 h-2 rounded-full cursor-pointer transition-all ${
                        s.id === currentStep ? 'w-6 bg-blue-600' : completedSteps.has(s.id) ? 'bg-green-400' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* STEP 1: General Info */}
              {currentStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <AutoCompleteInput
                      value={formData.title}
                      onChange={(v) => updateField('title', v)}
                      suggestions={jobTitleSuggestions}
                      placeholder="Ex : Superviseur Ressources Humaines"
                      label="Titre du poste *"
                      required
                      minChars={2}
                    />
                    {stepErrors.title && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{stepErrors.title}</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <AutoCompleteInput
                        value={formData.category}
                        onChange={(v) => updateField('category', v)}
                        suggestions={categorySuggestions}
                        placeholder="Ex : Ressources Humaines, Finance..."
                        label="Catégorie / Domaine *"
                        required
                        minChars={1}
                      />
                    </div>
                    <div>
                      <FieldLabel required>Type de contrat</FieldLabel>
                      <select name="contract_type" value={formData.contract_type} onChange={handleChange} className={inputClass}>
                        <option value="CDI">CDI</option>
                        <option value="CDD">CDD</option>
                        <option value="Stage">Stage</option>
                        <option value="Intérim">Intérim</option>
                        <option value="Freelance">Freelance</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Nombre de postes</FieldLabel>
                      <input type="number" name="position_count" min="1" value={formData.position_count} onChange={handleChange} className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel>Niveau de poste</FieldLabel>
                      <select name="position_level" value={formData.position_level} onChange={handleChange} className={inputClass}>
                        <option value="Débutant">Débutant</option>
                        <option value="Intermédiaire">Intermédiaire</option>
                        <option value="Senior">Senior</option>
                        <option value="Direction">Direction</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <FieldLabel required>
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-orange-500" />Date limite de candidature</span>
                    </FieldLabel>
                    <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className={inputClass} required />
                    {stepErrors.deadline && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{stepErrors.deadline}</p>}
                  </div>
                </div>
              )}

              {/* STEP 2: Description */}
              {currentStep === 2 && (
                <div className="space-y-5">
                  <div>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(v) => updateField('description', v)}
                      placeholder="Décrivez brièvement le poste..."
                      label="Présentation du poste *"
                    />
                    {stepErrors.description && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{stepErrors.description}</p>}
                  </div>
                  <div>
                    <FieldLabel>Missions principales</FieldLabel>
                    <textarea name="responsibilities" value={formData.responsibilities} onChange={handleChange} rows={4} className={textareaClass} placeholder="• Mission 1&#10;• Mission 2&#10;• Mission 3" />
                  </div>
                  <div>
                    <FieldLabel>Profil recherché</FieldLabel>
                    <textarea name="profile" value={formData.profile} onChange={handleChange} rows={4} className={textareaClass} placeholder="Décrivez le profil idéal..." />
                  </div>
                </div>
              )}

              {/* STEP 3: Qualifications */}
              {currentStep === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Niveau d'études requis</FieldLabel>
                      <select name="education_level" value={formData.education_level} onChange={handleChange} className={inputClass}>
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
                      <FieldLabel>Expérience requise</FieldLabel>
                      <select name="experience_required" value={formData.experience_required} onChange={handleChange} className={inputClass}>
                        <option value="Aucune expérience">Aucune expérience</option>
                        <option value="0–2 ans">0–2 ans</option>
                        <option value="3–5 ans">3–5 ans</option>
                        <option value="6–10 ans">6–10 ans</option>
                        <option value="Plus de 10 ans">Plus de 10 ans</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Qualification principale requise</FieldLabel>
                    <input type="text" name="primary_qualification" value={formData.primary_qualification} onChange={handleChange} className={inputClass} placeholder="Ex: Ingénieur en génie civil, Expert en gestion de projet..." />
                    <p className="text-xs text-gray-500 mt-1">Titre professionnel ou compétence principale requise pour ce poste</p>
                  </div>
                  <div>
                    <FieldLabel>Autres compétences requises</FieldLabel>
                    <div className="flex gap-2 mb-3">
                      <AutoCompleteInput
                        value={skillInput}
                        onChange={setSkillInput}
                        suggestions={skillSuggestions}
                        placeholder="Ex: Leadership, Gestion de projet..."
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        minChars={2}
                      />
                      <button type="button" onClick={addSkill} className="px-4 py-2 bg-[#0E2F56] text-white rounded-xl hover:bg-blue-800 transition flex-shrink-0">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((s, i) => (
                        <span key={i} onClick={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter(x => x !== s) }))}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:bg-blue-100 border border-blue-200 transition">
                          {s}<span className="text-blue-400 hover:text-red-500">×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <LanguageRequirementsManager requirements={formData.language_requirements} onChange={(r) => updateField('language_requirements', r)} />
                  </div>
                </div>
              )}

              {/* STEP 4: Company */}
              {currentStep === 4 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <AutoCompleteInput
                        value={formData.company_name}
                        onChange={(v) => updateField('company_name', v)}
                        suggestions={companySuggestions}
                        placeholder="Ex : SMB-Winning"
                        label="Nom de l'entreprise *"
                        required
                        minChars={2}
                      />
                      {stepErrors.company_name && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{stepErrors.company_name}</p>}
                    </div>
                    <div>
                      <AutoCompleteInput
                        value={formData.sector}
                        onChange={(v) => updateField('sector', v)}
                        suggestions={sectorSuggestions}
                        placeholder="Ex : Mines et Ressources Minérales"
                        label="Secteur d'activité *"
                        required
                        minChars={2}
                      />
                    </div>
                  </div>
                  <div>
                    <AutoCompleteInput
                      value={formData.location}
                      onChange={(v) => updateField('location', v)}
                      suggestions={locationSuggestions}
                      placeholder="Ex : Conakry"
                      label="Localisation *"
                      required
                      minChars={2}
                    />
                    {stepErrors.location && <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{stepErrors.location}</p>}
                  </div>
                  <div>
                    <FieldLabel>Description de l'entreprise</FieldLabel>
                    <textarea name="company_description" value={formData.company_description} onChange={handleChange} rows={3} className={textareaClass} placeholder="Présentez brièvement l'entreprise..." />
                  </div>
                  <div>
                    <FieldLabel>Site web</FieldLabel>
                    <input type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://example.com" className={inputClass} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Logo de l'entreprise</FieldLabel>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-400 transition cursor-pointer">
                        {formData.company_logo_url ? (
                          <div className="space-y-2">
                            <img src={formData.company_logo_url} alt="Logo" className="w-24 h-24 object-contain mx-auto rounded-lg" />
                            <button type="button" onClick={() => updateField('company_logo_url', '')} className="w-full text-sm text-red-500 hover:text-red-700">Supprimer</button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center cursor-pointer">
                            <Upload className="w-8 h-8 text-gray-300 mb-2" />
                            <span className="text-sm text-gray-500">{uploadingLogo ? 'Téléchargement...' : 'Cliquer pour télécharger'}</span>
                            <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploadingLogo} />
                          </label>
                        )}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Image de mise en avant</FieldLabel>
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-blue-400 transition">
                        {formData.featured_image_url ? (
                          <div className="space-y-2">
                            <img src={formData.featured_image_url} alt="Image" className="w-full h-28 object-cover rounded-lg" />
                            <button type="button" onClick={() => updateField('featured_image_url', '')} className="w-full text-sm text-red-500 hover:text-red-700">Supprimer</button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center cursor-pointer">
                            <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                            <span className="text-sm text-gray-500">{uploadingFeaturedImage ? 'Téléchargement...' : 'Ratio 16:9 recommandé'}</span>
                            <input type="file" accept="image/*" onChange={handleFeaturedImageUpload} className="hidden" disabled={uploadingFeaturedImage} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Salary & Benefits */}
              {currentStep === 5 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Fourchette salariale</FieldLabel>
                      <input type="text" name="salary_range" value={formData.salary_range} onChange={handleChange} placeholder="Ex: 5 000 000 - 8 000 000 GNF" className={inputClass} />
                    </div>
                    <div>
                      <FieldLabel>Type de salaire</FieldLabel>
                      <select name="salary_type" value={formData.salary_type} onChange={handleChange} className={inputClass}>
                        <option value="Négociable">Négociable</option>
                        <option value="Fixe">Fixe</option>
                        <option value="Selon profil">Selon profil</option>
                        <option value="Non divulgué">Non divulgué</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Avantages</FieldLabel>
                    <div className="flex gap-2 mb-3">
                      <AutoCompleteInput
                        value={benefitInput}
                        onChange={setBenefitInput}
                        suggestions={benefitSuggestions}
                        placeholder="Ex: Assurance santé, Transport..."
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBenefit(); } }}
                        minChars={2}
                      />
                      <button type="button" onClick={addBenefit} className="px-4 py-2 bg-[#0E2F56] text-white rounded-xl hover:bg-blue-800 transition flex-shrink-0">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.benefits.map((b, i) => (
                        <span key={i} onClick={() => setFormData(prev => ({ ...prev, benefits: prev.benefits.filter(x => x !== b) }))}
                          className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-2 cursor-pointer hover:bg-green-100 border border-green-200 transition">
                          {b}<span className="text-green-400 hover:text-red-500">×</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 6: Application */}
              {currentStep === 6 && (
                <div className="space-y-5">
                  <div>
                    <FieldLabel>Documents requis</FieldLabel>
                    <div className="grid grid-cols-2 gap-2">
                      {['CV', 'Lettre de motivation', 'Diplômes', 'Certificats', 'Références'].map((doc) => (
                        <label key={doc} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${formData.required_documents.includes(doc) ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="checkbox" checked={formData.required_documents.includes(doc)} onChange={() => toggleDocument(doc)} className="w-4 h-4 text-blue-600 rounded" />
                          <span className="text-sm font-medium text-gray-700">{doc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Visibilité de l'offre</FieldLabel>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { value: 'Publique', icon: Globe, desc: 'Visible par tous' },
                        { value: 'Restreinte aux abonnés', icon: Users, desc: 'Abonnés premium' },
                        { value: 'Confidentielle', icon: Lock, desc: 'Admin uniquement' },
                      ].map(({ value, icon: Icon, desc }) => (
                        <label key={value} className={`flex flex-col items-center gap-2 p-4 border-2 rounded-xl cursor-pointer transition ${formData.visibility === value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" name="visibility" value={value} checked={formData.visibility === value} onChange={handleChange} className="sr-only" />
                          <Icon className={`w-5 h-5 ${formData.visibility === value ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className="text-sm font-semibold text-center">{value}</span>
                          <span className="text-xs text-gray-500 text-center">{desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FieldLabel>Email de réception des candidatures</FieldLabel>
                    <input type="email" name="application_email" value={formData.application_email} onChange={handleChange} placeholder="recrutement@entreprise.com" className={inputClass} />
                  </div>
                  <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                    <input type="checkbox" name="receive_in_platform" checked={formData.receive_in_platform} onChange={handleChange} className="w-4 h-4 text-blue-600 rounded" />
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Recevoir les candidatures via la plateforme</p>
                      <p className="text-xs text-gray-500">Les candidatures seront visibles dans votre tableau de bord</p>
                    </div>
                  </label>
                  <div>
                    <FieldLabel>Instructions supplémentaires</FieldLabel>
                    <textarea name="application_instructions" value={formData.application_instructions} onChange={handleChange} rows={3} className={textareaClass} placeholder="Instructions supplémentaires pour les candidats..." />
                  </div>
                </div>
              )}

              {/* STEP 7: Admin specific */}
              {currentStep === 7 && (
                <div className="space-y-6">
                  <div>
                    <FieldLabel>Source de publication</FieldLabel>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'jobguinee', label: 'JobGuinée', desc: 'Publication directe' },
                        { value: 'partenaire', label: 'Partenaire', desc: 'Via un partenaire' },
                      ].map(({ value, label, desc }) => (
                        <label key={value} className={`flex flex-col gap-1 p-4 border-2 rounded-xl cursor-pointer transition ${formData.publication_source === value ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <input type="radio" value={value} checked={formData.publication_source === value} onChange={() => updateField('publication_source', value as any)} className="sr-only" />
                          <span className="text-sm font-bold">{label}</span>
                          <span className="text-xs text-gray-500">{desc}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {formData.publication_source === 'partenaire' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <FieldLabel>Partenaire</FieldLabel>
                        <button type="button" onClick={() => setShowPartnerForm(!showPartnerForm)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Plus className="w-4 h-4" />Nouveau partenaire
                        </button>
                      </div>
                      {showPartnerForm ? (
                        <div className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-200">
                          <input type="text" placeholder="Nom du partenaire" value={newPartner.name} onChange={(e) => setNewPartner(p => ({ ...p, name: e.target.value }))} className={inputClass} />
                          <input type="email" placeholder="Email" value={newPartner.email} onChange={(e) => setNewPartner(p => ({ ...p, email: e.target.value }))} className={inputClass} />
                          <select value={newPartner.type} onChange={(e) => setNewPartner(p => ({ ...p, type: e.target.value }))} className={inputClass}>
                            <option value="cabinet">Cabinet de recrutement</option>
                            <option value="institution">Institution</option>
                            <option value="entreprise">Entreprise</option>
                            <option value="autre">Autre</option>
                          </select>
                          <div className="flex gap-2">
                            <button type="button" onClick={handleCreatePartner} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Créer</button>
                            <button type="button" onClick={() => setShowPartnerForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <select value={formData.partner_id} onChange={(e) => {
                          const p = partners.find(x => x.id === e.target.value);
                          if (p) setFormData(prev => ({ ...prev, partner_id: p.id, partner_name: p.name, partner_email: p.email, partner_logo_url: p.logo_url || '', partner_type: p.type }));
                        }} className={inputClass}>
                          <option value="">Sélectionner un partenaire</option>
                          {partners.map(p => <option key={p.id} value={p.id}>{p.name} ({p.type})</option>)}
                        </select>
                      )}
                    </div>
                  )}

                  <div>
                    <FieldLabel>Mode de réception des candidatures</FieldLabel>
                    <div className="space-y-2">
                      {[
                        { value: 'internal_admin', label: 'Admin JobGuinée uniquement', desc: 'Candidatures gérées en interne' },
                        { value: 'external_email', label: 'Email automatique + Copie JobGuinée', desc: 'Envoi vers email externe' },
                        { value: 'invited_partner', label: 'Partenaire invité', desc: 'Compte dédié pour le partenaire' },
                        { value: 'external_link', label: 'Lien externe', desc: 'Redirection + tracking' },
                        { value: 'company_account', label: 'Compte recruteur', desc: 'Géré par le recruteur' },
                      ].map(({ value, label, desc }) => (
                        <label key={value} className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${formData.application_mode === value ? 'border-blue-300 bg-blue-50' : 'border-gray-200 hover:border-gray-100'}`}>
                          <input type="radio" name="application_mode" value={value} checked={formData.application_mode === value} onChange={(e) => updateField('application_mode', e.target.value as ApplicationMode)} className="mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{label}</p>
                            <p className="text-xs text-gray-500">{desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {formData.application_mode === 'external_email' && (
                      <div className="mt-3 ml-6">
                        <input type="email" placeholder="Email de réception" value={formData.partner_email} onChange={(e) => updateField('partner_email', e.target.value)} className={inputClass} />
                      </div>
                    )}
                    {formData.application_mode === 'external_link' && (
                      <div className="mt-3 ml-6">
                        <input type="url" placeholder="https://example.com/apply" value={formData.external_apply_url} onChange={(e) => updateField('external_apply_url', e.target.value)} className={inputClass} />
                      </div>
                    )}
                  </div>

                  <div>
                    <FieldLabel>Notes internes</FieldLabel>
                    <textarea value={formData.admin_notes} onChange={(e) => updateField('admin_notes', e.target.value)} placeholder="Notes privées pour l'équipe administrative..." rows={4} className={textareaClass} />
                    <p className="text-xs text-gray-400 mt-1">Ces notes ne seront visibles que par les administrateurs</p>
                  </div>
                </div>
              )}

              {/* STEP 8: Review & Publish */}
              {currentStep === 8 && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-5 border border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5 text-blue-600" />
                      Récapitulatif de l'offre
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Titre :</span>
                          <span className="font-semibold text-gray-900">{formData.title || <span className="text-red-400 italic">Non renseigné</span>}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Entreprise :</span>
                          <span className="font-medium text-gray-800">{formData.company_name || <span className="text-orange-400 italic">Non renseigné</span>}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Localisation :</span>
                          <span className="font-medium text-gray-800">{formData.location || <span className="text-orange-400 italic">Non renseigné</span>}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Contrat :</span>
                          <span className="font-medium text-gray-800">{formData.contract_type}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Niveau :</span>
                          <span className="font-medium text-gray-800">{formData.position_level}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Secteur :</span>
                          <span className="font-medium text-gray-800">{formData.sector}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Expérience :</span>
                          <span className="font-medium text-gray-800">{formData.experience_required}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Date limite :</span>
                          <span className="font-medium text-gray-800">{formData.deadline || <span className="text-red-400 italic">Non renseigné</span>}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Source :</span>
                          <span className="font-medium text-gray-800">{formData.publication_source === 'partenaire' ? `Partenaire: ${formData.partner_name}` : 'JobGuinée'}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-gray-500 w-28 flex-shrink-0">Mode :</span>
                          <span className="font-medium text-gray-800">{formData.application_mode}</span>
                        </div>
                      </div>
                    </div>
                    {formData.skills.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-blue-200">
                        <p className="text-xs text-gray-500 mb-2">Compétences requises :</p>
                        <div className="flex flex-wrap gap-1">
                          {formData.skills.map((s, i) => <span key={i} className="px-2 py-1 bg-blue-200 text-blue-800 rounded-full text-xs">{s}</span>)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2">
                    {[
                      { ok: !!formData.title, label: 'Titre du poste renseigné' },
                      { ok: !!formData.description, label: 'Description du poste complète' },
                      { ok: !!formData.company_name, label: 'Nom de l\'entreprise renseigné' },
                      { ok: !!formData.location, label: 'Localisation renseignée' },
                      { ok: !!formData.deadline, label: 'Date limite définie' },
                    ].map(({ ok, label }, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${ok ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        {ok
                          ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          : <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        }
                        <span className={`text-sm font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Legal */}
                  <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition">
                    <input
                      type="checkbox"
                      checked={formData.legal_compliance}
                      onChange={(e) => updateField('legal_compliance', e.target.checked)}
                      className="w-5 h-5 mt-0.5 text-blue-600 rounded"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">Certification de conformité légale</p>
                      <p className="text-xs text-gray-500 mt-1">Je certifie que cette offre est conforme aux lois guinéennes du travail et ne contient pas de discriminations illégales.</p>
                    </div>
                  </label>

                  {/* Publish button */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !formData.title || !formData.company_name || !formData.location || !formData.description || !formData.deadline}
                    className="w-full py-4 bg-gradient-to-r from-[#0E2F56] to-blue-600 text-white text-base font-bold rounded-2xl hover:from-blue-800 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Publication en cours...</>
                    ) : (
                      <><CheckCircle className="w-5 h-5" />Publier l'offre maintenant</>
                    )}
                  </button>
                  {(!formData.title || !formData.company_name || !formData.location || !formData.description || !formData.deadline) && (
                    <p className="text-center text-sm text-red-500 flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Complétez les champs obligatoires avant de publier
                    </p>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={currentStep === 1 ? () => onNavigate('admin-job-list') : goPrev}
                  className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-200 rounded-xl text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition font-medium"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </button>

                {currentStep < STEPS.length && (
                  <button
                    type="button"
                    onClick={goNext}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0E2F56] text-white rounded-xl hover:bg-blue-800 transition font-medium"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminJobCreate;
