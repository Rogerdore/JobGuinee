import { useState } from 'react';
import {
  Briefcase, X, Loader, DollarSign, Calendar, MapPin, Building2,
  GraduationCap, FileText, Users, Mail, Sparkles, Eye, Globe, Share2,
  CheckCircle2, Upload as UploadIcon
} from 'lucide-react';

interface JobPublishFormProps {
  onPublish: (data: JobFormData) => void;
  onClose: () => void;
}

export interface JobFormData {
  title: string;
  category: string;
  contract_type: string;
  position_count: number;
  position_level: string;
  deadline: string;
  description: string;
  responsibilities: string;
  profile: string;
  skills: string[];
  education_level: string;
  experience_required: string;
  languages: string[];
  company_name: string;
  company_logo?: File;
  sector: string;
  location: string;
  company_description: string;
  website?: string;
  salary_range: string;
  salary_type: string;
  benefits: string[];
  application_email: string;
  receive_in_platform: boolean;
  required_documents: string[];
  application_instructions: string;
  visibility: string;
  is_premium: boolean;
  announcement_language: string;
  auto_share: boolean;
  publication_duration: string;
  auto_renewal: boolean;
  legal_compliance: boolean;
}

export default function JobPublishForm({ onPublish, onClose }: JobPublishFormProps) {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  const [formData, setFormData] = useState<JobFormData>({
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
  });

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter(s => s !== skill) });
  };

  const handleAddBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData({ ...formData, benefits: [...formData.benefits, benefitInput.trim()] });
      setBenefitInput('');
    }
  };

  const handleRemoveBenefit = (benefit: string) => {
    setFormData({ ...formData, benefits: formData.benefits.filter(b => b !== benefit) });
  };

  const toggleLanguage = (lang: string) => {
    if (formData.languages.includes(lang)) {
      setFormData({ ...formData, languages: formData.languages.filter(l => l !== lang) });
    } else {
      setFormData({ ...formData, languages: [...formData.languages, lang] });
    }
  };

  const toggleDocument = (doc: string) => {
    if (formData.required_documents.includes(doc)) {
      setFormData({ ...formData, required_documents: formData.required_documents.filter(d => d !== doc) });
    } else {
      setFormData({ ...formData, required_documents: [...formData.required_documents, doc] });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
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
    <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Icon className="w-6 h-6 text-[#FF8C00]" />
        {title}
      </h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8">
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
          <div className="bg-orange-50 border-2 border-[#FF8C00]/30 rounded-xl p-4">
            <p className="text-sm text-gray-800 text-center">
              <span className="font-semibold text-[#FF8C00]">📋 Formulaire complet :</span> Remplissez toutes les sections pour créer une offre professionnelle et conforme.
            </p>
          </div>

          <FormSection title="1. Informations générales" icon={FileText}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Titre du poste *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="Ex : Superviseur Ressources Humaines"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catégorie / Domaine *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, position_count: Number(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Niveau de poste
                </label>
                <select
                  value={formData.position_level}
                  onChange={(e) => setFormData({ ...formData, position_level: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  required
                />
              </div>
            </div>
          </FormSection>

          <FormSection title="2. Description du poste" icon={FileText}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Présentation du poste *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                  placeholder="Décrivez brièvement le poste..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Missions principales *
                </label>
                <textarea
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                  placeholder="• Mission 1&#10;• Mission 2&#10;• Mission 3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profil recherché *
                </label>
                <textarea
                  value={formData.profile}
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none"
                  placeholder="Indiquez le type de profil souhaité..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Compétences clés
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddSkill)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                    placeholder="Ex: Excel, Leadership, Gestion de projet..."
                  />
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
                    onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, experience_required: e.target.value })}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="Ex : Winning Consortium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Secteur d'activité *
                </label>
                <select
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                >
                  <option value="Mines">Mines</option>
                  <option value="BTP">BTP</option>
                  <option value="RH">Ressources Humaines</option>
                  <option value="Comptabilité">Comptabilité</option>
                  <option value="Sécurité">Sécurité</option>
                  <option value="Transport">Transport</option>
                  <option value="IT">IT / Informatique</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2 text-[#FF8C00]" />
                  Localisation du poste *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="Ex : Boké, Kamsar"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Présentation de l'entreprise
                </label>
                <textarea
                  value={formData.company_description}
                  onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="https://www.monentreprise.com"
                />
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
                  onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, salary_type: e.target.value })}
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
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={(e) => setBenefitInput(e.target.value)}
                    onKeyPress={(e) => handleKeyPress(e, handleAddBenefit)}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                    placeholder="Ex: logement, repas, transport, couverture santé..."
                  />
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
                  onChange={(e) => setFormData({ ...formData, application_email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition"
                  placeholder="Ex : rh@entreprise.com"
                  required
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.receive_in_platform}
                    onChange={(e) => setFormData({ ...formData, receive_in_platform: e.target.checked })}
                    className="w-5 h-5 text-[#0E2F56] rounded focus:ring-[#0E2F56]"
                  />
                  <span className="text-sm font-medium text-gray-700">Recevoir les candidatures directement dans mon espace JobVision</span>
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
                  onChange={(e) => setFormData({ ...formData, application_instructions: e.target.value })}
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
                  {['Publique', 'Restreinte aux abonnés JobVision', 'Confidentielle (anonyme)'].map((option) => (
                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="visibility"
                        value={option}
                        checked={formData.visibility === option}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
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
                  onChange={(e) => setFormData({ ...formData, announcement_language: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, auto_share: e.target.checked })}
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
                  onChange={(e) => setFormData({ ...formData, publication_duration: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, auto_renewal: e.target.checked })}
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
                    onChange={(e) => setFormData({ ...formData, legal_compliance: e.target.checked })}
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
