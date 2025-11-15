import { useState } from 'react';
import {
  Briefcase, X, Loader, DollarSign, Calendar, MapPin, Building2,
  GraduationCap, FileText, Users, Mail, Sparkles, Eye, Globe, Share2,
  CheckCircle2, Upload as UploadIcon, Download, Wand2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import DocumentImporter from './DocumentImporter';

interface JobPublishFormProps {
  onPublish: (data: JobFormData) => void;
  onClose: () => void;
  companyData?: {
    name: string;
    description?: string;
    location?: string;
    website?: string;
    industry?: string;
    email?: string;
    benefits?: string[];
  };
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

export default function JobPublishForm({ onPublish, onClose, companyData }: JobPublishFormProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [importingFile, setImportingFile] = useState(false);

  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

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
    company_name: companyData?.name || '',
    sector: companyData?.industry || 'Mines',
    location: companyData?.location || '',
    company_description: companyData?.description || '',
    website: companyData?.website || '',
    salary_range: '',
    salary_type: 'Négociable',
    benefits: companyData?.benefits || [],
    application_email: companyData?.email || '',
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

      setFormData({
        ...formData,
        title: extractedTitle.trim(),
        location: extractedLocation.trim(),
        description: extractedDescription.trim(),
      });

      setImportingFile(false);
      alert('Fichier importé avec succès ! Veuillez vérifier et compléter les informations.');
    };

    reader.onerror = () => {
      setImportingFile(false);
      alert('Erreur lors de l\'import du fichier.');
    };

    reader.readAsText(file);
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

    setFormData({
      ...formData,
      description: aiGeneratedData.description,
      responsibilities: aiGeneratedData.responsibilities,
      profile: aiGeneratedData.profile,
      skills: [...new Set([...formData.skills, ...aiGeneratedData.skills])],
      benefits: [...new Set([...formData.benefits, ...aiGeneratedData.benefits])],
      company_description: aiGeneratedData.company_description || formData.company_description,
      application_instructions: aiGeneratedData.application_instructions || formData.application_instructions,
    });

    setIsGeneratingAI(false);
    alert('✨ Offre générée avec succès par l\'IA ! Vérifiez et ajustez les informations si nécessaire.');
  };

  const handlePublish = async () => {
    console.log('🔄 handlePublish called');
    console.log('Form data:', formData);

    const missingFields = [];
    if (!formData.title) missingFields.push('Titre du poste');
    if (!formData.location) missingFields.push('Localisation');
    if (!formData.description) missingFields.push('Présentation du poste');
    if (!formData.company_name) missingFields.push('Nom de l\'entreprise');
    if (!formData.application_email) missingFields.push('Email de candidature');
    if (!formData.deadline) missingFields.push('Date limite');
    if (!formData.legal_compliance) missingFields.push('Conformité légale (case à cocher)');

    if (missingFields.length > 0) {
      alert(`Veuillez remplir les champs obligatoires manquants:\n\n• ${missingFields.join('\n• ')}`);
      return;
    }

    try {
      setLoading(true);
      console.log('📤 Calling onPublish...');
      await onPublish(formData);
      console.log('✅ onPublish completed');
    } catch (error) {
      console.error('❌ Error in handlePublish:', error);
      alert('Une erreur est survenue lors de la publication');
    } finally {
      setLoading(false);
    }
  };

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
                  Description complète du poste *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0E2F56] focus:border-[#0E2F56] transition resize-none font-mono text-sm"
                  placeholder="Saisissez la description complète de l'offre ou importez un document...&#10;&#10;Vous pouvez utiliser le format Markdown:&#10;# Titre principal&#10;## Sous-titre&#10;### Titre de niveau 3&#10;&#10;**Texte en gras**&#10;- Liste à puces&#10;- Point 2"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                <DocumentImporter
                  onImport={(content) => setFormData({ ...formData, description: content })}
                  buttonText="Importer depuis PDF/DOCX"
                />
                <button
                  type="button"
                  onClick={() => {
                    const template = `# ${formData.title || 'TITRE DU POSTE'}

**Catégorie:** ${formData.category || 'Catégorie'} | **Contrat:** ${formData.contract_type || 'Type de contrat'} | **Postes:** 1

## PRÉSENTATION DU POSTE
Description du poste et du contexte...

## MISSIONS PRINCIPALES
- Mission 1
- Mission 2
- Mission 3

## PROFIL RECHERCHÉ
Description du profil idéal...

## COMPÉTENCES CLÉS
- Compétence 1
- Compétence 2
- Compétence 3

## QUALIFICATIONS
- **Niveau d'études:**
- **Expérience:**
- **Langues:**

## MODALITÉS DE CANDIDATURE
- **Email:** ${formData.company_email || 'email@entreprise.com'}
- **Date limite:** ${formData.deadline || 'À définir'}
- **Documents requis:** CV, Lettre de motivation`;
                    setFormData({ ...formData, description: template });
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition shadow-md"
                >
                  <Wand2 className="w-5 h-5" />
                  Utiliser un modèle
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Missions principales
                </label>
                <textarea
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
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
                  {['Publique', 'Restreinte aux abonnés', 'Confidentielle (anonyme)'].map((option) => (
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
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!formData.title || !formData.location || !formData.description || !formData.company_name || !formData.application_email || !formData.deadline || !formData.legal_compliance || loading}
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
