import { useState } from 'react';
import {
  Briefcase, X, Loader, DollarSign, Calendar, MapPin, Building2,
  GraduationCap, FileText, Users, Mail, Eye, Globe, Share2,
  CheckCircle2, Upload as UploadIcon, Download, Wand2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import RichTextEditor from './RichTextEditor';

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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [previousDescription, setPreviousDescription] = useState<string>('');

  const isPremium = profile?.subscription_plan === 'premium' || profile?.subscription_plan === 'enterprise';

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    category: 'Ressources Humaines',
    contract_type: 'CDI',
    position_count: 1,
    position_level: 'Intermédiaire',
    deadline: '',
    description: '',
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

  const applyTemplate = (template: string) => {
    // Sauvegarder l'état actuel avant d'appliquer le modèle
    setPreviousDescription(formData.description);
    setFormData({ ...formData, description: template });
    setShowTemplateModal(false);
  };

  const undoTemplate = () => {
    if (previousDescription !== undefined) {
      setFormData({ ...formData, description: previousDescription });
      setPreviousDescription('');
    }
  };

  const getBeginnerTemplate = () => {
    return `<h1 style="color: #0E2F56; font-size: 28px; margin-bottom: 20px;">${formData.title || 'TITRE DU POSTE'}</h1>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📋 INFORMATIONS GÉNÉRALES</h2>
<ul style="line-height: 1.8;">
  <li><strong>Contrat :</strong> ${formData.contract_type || 'CDI'}</li>
  <li><strong>Localisation :</strong> ${formData.location || 'Conakry'}</li>
  <li><strong>Catégorie :</strong> ${formData.category || 'À définir'}</li>
  <li><strong>Nombre de postes :</strong> ${formData.position_count || '1'}</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📝 PRÉSENTATION DU POSTE</h2>
<p style="line-height: 1.8;">Bref résumé du rôle, du service, et de l'objectif principal du poste. Expliquez en quelques phrases ce que le candidat fera au quotidien.</p>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">💼 COMPÉTENCES REQUISES</h2>
<p style="margin-bottom: 8px;"><strong>Compétences techniques :</strong></p>
<ul style="line-height: 1.8; margin-bottom: 16px;">
  <li>Compétence 1 (niveau débutant)</li>
  <li>Compétence 2 (notions de base suffisantes)</li>
</ul>
<p style="margin-bottom: 8px;"><strong>Compétences comportementales :</strong></p>
<ul style="line-height: 1.8;">
  <li>Ponctualité</li>
  <li>Travail en équipe</li>
  <li>Rigueur</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🎓 QUALIFICATIONS</h2>
<ul style="line-height: 1.8;">
  <li><strong>Niveau d'études :</strong> Bac / BTS / Licence débutant</li>
  <li><strong>Expérience :</strong> Pas d'expérience requise ou 0–1 an</li>
  <li><strong>Langues :</strong> Français (courant)</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📩 MODALITÉS DE CANDIDATURE</h2>
<ul style="line-height: 1.8;">
  <li><strong>Email :</strong> ${formData.application_email || 'recrutement@entreprise.com'}</li>
  <li><strong>Date limite :</strong> ${formData.deadline || 'À définir'}</li>
  <li><strong>Documents requis :</strong> CV + Lettre de motivation</li>
</ul>`;
  };

  const getIntermediateTemplate = () => {
    return `<h1 style="color: #0E2F56; font-size: 28px; margin-bottom: 20px;">${formData.title || 'TITRE DU POSTE'}</h1>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📋 INFORMATIONS GÉNÉRALES</h2>
<ul style="line-height: 1.8;">
  <li><strong>Département :</strong> ${formData.category || 'À définir'}</li>
  <li><strong>Type de contrat :</strong> ${formData.contract_type || 'CDI'}</li>
  <li><strong>Localisation :</strong> ${formData.location || 'Conakry'}</li>
  <li><strong>Nombre de postes :</strong> ${formData.position_count || '1'}</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📝 PRÉSENTATION DU POSTE</h2>
<p style="line-height: 1.8;">Description du contexte, de la finalité du poste et des enjeux. Précisez comment ce poste s'inscrit dans la stratégie de l'entreprise et quel sera son impact.</p>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">💼 COMPÉTENCES CLÉS</h2>
<p style="margin-bottom: 8px;"><strong>Hard skills :</strong></p>
<ul style="line-height: 1.8; margin-bottom: 16px;">
  <li>Compétence technique 1 (niveau intermédiaire)</li>
  <li>Compétence technique 2 (maîtrise confirmée)</li>
  <li>Maîtrise des outils bureautiques (Excel intermédiaire/avancé)</li>
</ul>
<p style="margin-bottom: 8px;"><strong>Soft skills :</strong></p>
<ul style="line-height: 1.8;">
  <li>Organisation et gestion du temps</li>
  <li>Communication efficace</li>
  <li>Capacité à résoudre des problèmes</li>
  <li>Adaptabilité</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🎓 QUALIFICATIONS</h2>
<ul style="line-height: 1.8;">
  <li><strong>Niveau d'études :</strong> Licence / Master</li>
  <li><strong>Expérience :</strong> 2–5 ans dans un poste similaire</li>
  <li><strong>Langues :</strong> Français (courant), Anglais (atout)</li>
  <li><strong>Outils :</strong> Logiciels métier / Excel avancé</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🏢 CONDITIONS DE TRAVAIL</h2>
<ul style="line-height: 1.8;">
  <li><strong>Environnement :</strong> Bureau moderne avec équipements adaptés</li>
  <li><strong>Horaires :</strong> Du lundi au vendredi, 8h-17h</li>
  <li><strong>Avantages :</strong> Assurance santé, primes de performance, formation continue</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📩 MODALITÉS DE CANDIDATURE</h2>
<ul style="line-height: 1.8;">
  <li><strong>Email :</strong> ${formData.application_email || 'recrutement@entreprise.com'}</li>
  <li><strong>Date limite :</strong> ${formData.deadline || 'À définir'}</li>
  <li><strong>Pièces à fournir :</strong> CV détaillé, Lettre de motivation, Diplômes</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🔄 PROCESSUS DE RECRUTEMENT</h2>
<p style="line-height: 1.8;">Analyse des dossiers → Test technique → Entretien RH → Entretien avec le manager → Décision finale</p>`;
  };

  const getSeniorTemplate = () => {
    return `<h1 style="color: #0E2F56; font-size: 32px; margin-bottom: 20px;">${formData.title || 'TITRE DU POSTE'}</h1>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🎯 INFORMATIONS CLÉS</h2>
<ul style="line-height: 1.8;">
  <li><strong>Direction / Département :</strong> ${formData.category || 'Direction Générale'}</li>
  <li><strong>Référence de l'offre :</strong> ${formData.title?.toUpperCase().replace(/\s+/g, '-') || 'REF-001'}-2024</li>
  <li><strong>Type de contrat :</strong> ${formData.contract_type || 'CDI'}</li>
  <li><strong>Localisation stratégique :</strong> ${formData.location || 'Conakry'}</li>
  <li><strong>Nombre de postes :</strong> ${formData.position_count || '1'}</li>
  <li><strong>Prise de fonction :</strong> Dès que possible</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🏢 PRÉSENTATION DE L'ENTREPRISE</h2>
<p style="line-height: 1.8;">${formData.company_description || 'Leader dans son secteur d\'activité, notre entreprise se distingue par son excellence opérationnelle, son innovation constante et son engagement envers le développement économique. Nous recherchons des talents d\'exception pour accompagner notre croissance stratégique.'}</p>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📝 PRÉSENTATION DU POSTE</h2>
<p style="line-height: 1.8;"><strong>Contexte :</strong> Dans le cadre de notre expansion et de la structuration de nos opérations, nous recrutons un profil senior pour piloter des initiatives stratégiques majeures.</p>
<p style="line-height: 1.8; margin-top: 12px;"><strong>Objectifs stratégiques :</strong></p>
<ul style="line-height: 1.8;">
  <li>Définir et mettre en œuvre la stratégie du département</li>
  <li>Optimiser la performance opérationnelle et financière</li>
  <li>Assurer la conformité et l'excellence des processus</li>
</ul>
<p style="line-height: 1.8; margin-top: 12px;"><strong>Impact sur l'organisation :</strong> Ce poste stratégique a un impact direct sur la performance globale de l'entreprise et contribue activement aux décisions de la Direction Générale.</p>
<p style="line-height: 1.8; margin-top: 12px;"><strong>Interactions hiérarchiques :</strong> Rattachement direct à la Direction Générale. Coordination étroite avec les Directeurs de département.</p>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">💼 COMPÉTENCES REQUISES</h2>

<p style="margin-bottom: 8px;"><strong>Hard skills :</strong></p>
<ul style="line-height: 1.8; margin-bottom: 16px;">
  <li>Expertise technique avancée dans le domaine ${formData.category || '[secteur]'}</li>
  <li>Maîtrise des méthodologies professionnelles (Lean, Six Sigma, Agile, etc.)</li>
  <li>Connaissance approfondie des normes et réglementations applicables</li>
</ul>

<p style="margin-bottom: 8px;"><strong>Soft skills :</strong></p>
<ul style="line-height: 1.8; margin-bottom: 16px;">
  <li>Leadership et influence</li>
  <li>Gestion de conflit et négociation</li>
  <li>Prise de décision sous pression</li>
  <li>Pensée analytique et stratégique</li>
</ul>

<p style="margin-bottom: 8px;"><strong>Outils & technologies :</strong></p>
<ul style="line-height: 1.8;">
  <li>ERP / Systèmes de gestion métier (SAP, Oracle, etc.)</li>
  <li>Tableaux de bord avancés (Power BI, Tableau)</li>
  <li>Excel expert (VBA, modélisation financière)</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🎓 QUALIFICATIONS</h2>
<ul style="line-height: 1.8;">
  <li><strong>Niveau d'études :</strong> Master / MBA / équivalent (Grande École ou Université reconnue)</li>
  <li><strong>Expérience :</strong> 5–10+ ans d'expérience sur des postes similaires avec responsabilités managériales</li>
  <li><strong>Langues :</strong> Français obligatoire (courant), Anglais professionnel exigé</li>
  <li><strong>Certifications / spécialités :</strong> PMP, Six Sigma Black Belt, ou équivalent (atout majeur)</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">💰 CONDITIONS & AVANTAGES</h2>
<ul style="line-height: 1.8;">
  <li><strong>Rémunération :</strong> Package compétitif aligné sur le marché international</li>
  <li><strong>Primes / avantages sociaux :</strong> Primes de performance, bonus annuel, assurance santé premium</li>
  <li><strong>Autres avantages :</strong> Véhicule de fonction, logement (si applicable), voyages professionnels</li>
  <li><strong>Environnement :</strong> Poste stratégique avec forte visibilité et impact</li>
</ul>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">🔄 PROCESSUS DE RECRUTEMENT</h2>
<ol style="line-height: 1.8;">
  <li><strong>Présélection :</strong> Analyse approfondie des dossiers</li>
  <li><strong>Entretien Direction / RH :</strong> Évaluation du fit culturel et des motivations</li>
  <li><strong>Évaluation technique :</strong> Étude de cas / Assessment center</li>
  <li><strong>Validation Direction Générale :</strong> Entretien final avec le DG</li>
  <li><strong>Offre :</strong> Proposition et négociation du package</li>
</ol>

<h2 style="color: #FF8C00; font-size: 20px; margin-top: 24px; margin-bottom: 12px;">📩 MODALITÉS DE CANDIDATURE</h2>
<ul style="line-height: 1.8;">
  <li><strong>Email :</strong> ${formData.application_email || 'recrutement.senior@entreprise.com'}</li>
  <li><strong>Objet :</strong> Candidature ${formData.title || '[Poste]'} - [NOM Prénom]</li>
  <li><strong>Deadline :</strong> ${formData.deadline || 'À définir'}</li>
  <li><strong>Dossier complet :</strong> CV détaillé, Lettre de motivation, Copies des diplômes, Attestations de travail, Références professionnelles</li>
</ul>

<p style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-left: 4px solid #FF8C00; line-height: 1.8;"><strong>Note :</strong> Seuls les candidats présélectionnés seront contactés. Toute candidature incomplète sera automatiquement rejetée. La confidentialité des dossiers est garantie.</p>`;
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
    <>
      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-5 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h3 className="text-2xl font-bold">Choisissez votre modèle</h3>
                <p className="text-sm text-purple-100">Sélectionnez le modèle adapté au niveau du poste</p>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Version 1 - Débutant */}
              <div
                onClick={() => applyTemplate(getBeginnerTemplate())}
                className="border-2 border-green-200 rounded-xl p-6 hover:border-green-500 hover:shadow-lg transition cursor-pointer bg-gradient-to-r from-green-50 to-green-100"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-green-900 mb-2">VERSION DÉBUTANT</h4>
                    <p className="text-sm text-green-800 mb-3">Simple, claire et guidée - Idéale pour les profils junior ou sans expérience</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>✅ Structure simplifiée</li>
                      <li>✅ Missions de base</li>
                      <li>✅ Compétences comportementales</li>
                      <li>✅ Expérience : 0-1 an</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Version 2 - Intermédiaire */}
              <div
                onClick={() => applyTemplate(getIntermediateTemplate())}
                className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-500 hover:shadow-lg transition cursor-pointer bg-gradient-to-r from-blue-50 to-blue-100"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-blue-900 mb-2">VERSION INTERMÉDIAIRE</h4>
                    <p className="text-sm text-blue-800 mb-3">Plus détaillée, orientée responsabilités - Pour profils confirmés</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>✅ Missions & responsabilités détaillées</li>
                      <li>✅ Hard skills et Soft skills</li>
                      <li>✅ Conditions de travail</li>
                      <li>✅ Processus de recrutement</li>
                      <li>✅ Expérience : 2-5 ans</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Version 3 - Senior */}
              <div
                onClick={() => applyTemplate(getSeniorTemplate())}
                className="border-2 border-orange-200 rounded-xl p-6 hover:border-orange-500 hover:shadow-lg transition cursor-pointer bg-gradient-to-r from-orange-50 to-orange-100"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-orange-900 mb-2">VERSION SENIOR</h4>
                    <p className="text-sm text-orange-800 mb-3">Avancée, stratégique et complète - Pour postes de direction</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>✅ Présentation de l'entreprise</li>
                      <li>✅ Missions stratégiques (3 niveaux)</li>
                      <li>✅ Leadership & management</li>
                      <li>✅ Conditions & avantages détaillés</li>
                      <li>✅ Processus de recrutement complet</li>
                      <li>✅ Expérience : 5-10+ ans</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center mb-3">
                💡 <strong>Astuce :</strong> Choisissez le modèle qui correspond au niveau d'expérience recherché. Vous pourrez ensuite modifier le contenu dans l'éditeur.
              </p>
              {formData.description && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-800 font-medium">
                    ⚠️ <strong>Attention :</strong> Vous avez déjà du contenu dans l'éditeur.
                    Appliquer un modèle remplacera votre texte actuel.
                    Vous pourrez ensuite cliquer sur "Annuler" pour le récupérer.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Form */}
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

          <FormSection title="2. Description de l'offre" icon={FileText}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Description complète de l'offre *
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Utilisez l'éditeur ci-dessous pour rédiger, formater, coller du texte, et importer des PDF, images ou scans.
                </p>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Commencez à rédiger la description de l'offre... Vous pouvez également coller du texte ou importer des fichiers PDF/Images."
                  onGenerateWithAI={handleGenerateWithAI}
                  isGeneratingAI={isGeneratingAI}
                  isPremium={isPremium}
                />
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTemplateModal(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition shadow-md"
                  >
                    <Wand2 className="w-5 h-5" />
                    Utiliser un modèle professionnel
                  </button>

                  {previousDescription && (
                    <button
                      type="button"
                      onClick={undoTemplate}
                      className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl transition shadow-md"
                      title="Annuler le modèle et revenir à la version précédente"
                    >
                      <X className="w-5 h-5" />
                      Annuler
                    </button>
                  )}
                </div>
                {previousDescription && (
                  <p className="text-xs text-orange-600 mt-2 text-center font-medium">
                    💡 Un modèle a été appliqué. Cliquez sur "Annuler" pour revenir à la version précédente.
                  </p>
                )}
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
    </>
  );
}
