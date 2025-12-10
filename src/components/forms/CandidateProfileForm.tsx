import { useState, useEffect, useCallback } from 'react';
import {
  Save,
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  Award,
  Globe,
  DollarSign,
  Link as LinkIcon,
  MapPin,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  Input,
  Select,
  MultiSelect,
  Textarea,
  DatePicker,
  Upload,
  Checkbox,
  Repeater,
  FormSection,
  Button,
} from './FormComponents';
import CVUploadWithParser from '../profile/CVUploadWithParser';
import SkillsAutoComplete from '../profile/SkillsAutoComplete';
import AutoCompleteInput from './AutoCompleteInput';
import { ParsedCVData } from '../../services/cvUploadParserService';
import { useCVParsing } from '../../hooks/useCVParsing';

const CITIES_GUINEA = [
  'Conakry',
  'Boké',
  'Kamsar',
  'Kindia',
  'Kankan',
  'Labé',
  'Nzérékoré',
  'Siguiri',
  'Fria',
  'Dubréka',
  'Coyah',
];

const SECTORS = [
  'Technologies de l\'information',
  'Mines et ressources naturelles',
  'Finance et banques',
  'Ressources humaines',
  'Éducation et formation',
  'Santé',
  'Construction et BTP',
  'Agriculture',
  'Transport et logistique',
  'Commerce et distribution',
  'Hôtellerie et tourisme',
  'Industrie manufacturière',
  'Télécommunications',
  'Énergie',
  'Autres services',
];

const COMMON_POSITIONS = [
  'Développeur Web',
  'Développeur Mobile',
  'Responsable RH',
  'Chargé RH',
  'Comptable',
  'Chef comptable',
  'Ingénieur des mines',
  'Géologue',
  'Commercial',
  'Responsable commercial',
  'Chef de projet',
  'Assistant administratif',
  'Secrétaire',
  'Technicien',
  'Ingénieur',
];

interface CandidateProfileFormProps {
  onSaveSuccess?: () => void;
}

export default function CandidateProfileForm({ onSaveSuccess }: CandidateProfileFormProps = {}) {
  const { user, profile } = useAuth();
  const { mapToFormData } = useCVParsing();

  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('candidateProfileDraft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return getInitialFormData();
      }
    }
    return getInitialFormData();
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [cvParsed, setCvParsed] = useState(false);

  function getInitialFormData() {
    return {
      fullName: profile?.full_name || '',
      email: user?.email || '',
      phone: profile?.phone || '',
      birthDate: '',
      gender: '',
      nationality: '',
      address: '',
      city: '',
      region: '',
      profilePhoto: null as File | null,

      desiredPosition: '',
      desiredSectors: [] as string[],
      desiredContractTypes: [] as string[],
      availability: '',

      professionalStatus: '',
      currentPosition: '',
      currentCompany: '',
      professionalSummary: '',

      experiences: [] as Record<string, any>[],
      formations: [] as Record<string, any>[],

      skills: [] as string[],
      languagesDetailed: [] as Array<{ language: string; level: string }>,

      mobility: [] as string[],
      willingToRelocate: false,

      desiredSalaryMin: '',
      desiredSalaryMax: '',

      linkedinUrl: '',
      portfolioUrl: '',
      githubUrl: '',
      otherUrls: [] as string[],

      drivingLicense: [] as string[],
      cv: null as File | null,
      coverLetter: null as File | null,
      certificates: null as File | null,

      visibleInCVTheque: false,
      receiveAlerts: false,
      acceptTerms: false,
      certifyAccuracy: false,

      cvParsedData: null as ParsedCVData | null,
      cvParsedAt: null as string | null,
    };
  }

  const calculateProgress = useCallback(() => {
    const totalFields = 20;
    let completedFields = 0;

    // Calcul simplifié basé sur les champs principaux du formulaire
    // Note: Le calcul final sera fait par le trigger SQL en base de données
    if (formData.desiredPosition && formData.desiredPosition !== '') completedFields += 2; // title + desired_position
    if (formData.professionalSummary && formData.professionalSummary !== '') completedFields++; // bio
    if (formData.city && formData.city !== '') completedFields++; // location
    if (formData.skills && formData.skills.length > 0) completedFields++; // skills
    if (formData.experiences && formData.experiences.length > 0) completedFields += 2; // experience_years + work_experience
    if (formData.formations && formData.formations.length > 0) completedFields += 2; // education + education_level
    if (formData.cv) completedFields++; // cv_url
    if (formData.desiredSalaryMin) completedFields++; // desired_salary_min
    if (formData.desiredSectors && formData.desiredSectors.length > 0) completedFields++; // desired_sectors
    if (formData.mobility && formData.mobility.length > 0) completedFields++; // mobility
    if (formData.availability && formData.availability !== '') completedFields++; // availability
    if (formData.languagesDetailed && formData.languagesDetailed.length > 0) completedFields++; // languages
    if (formData.linkedinUrl && formData.linkedinUrl !== '') completedFields++; // linkedin_url
    if (formData.portfolioUrl && formData.portfolioUrl !== '') completedFields++; // portfolio_url
    if (formData.githubUrl && formData.githubUrl !== '') completedFields++; // github_url
    if (formData.drivingLicense && formData.drivingLicense.length > 0) completedFields++; // driving_license
    if (formData.nationality && formData.nationality !== '') completedFields++; // nationality

    return Math.round((completedFields / totalFields) * 100);
  }, [formData]);

  useEffect(() => {
    const loadExistingProfile = async () => {
      if (!profile?.id) return;

      try {
        const { data, error } = await supabase
          .from('candidate_profiles')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (error) {
          console.error('Error loading candidate profile:', error);
          return;
        }

        if (data) {
          setFormData({
            fullName: profile?.full_name || '',
            email: user?.email || '',
            phone: data.phone || profile?.phone || '',
            birthDate: data.birth_date || '',
            gender: data.gender || '',
            nationality: data.nationality || '',
            address: data.address || '',
            city: data.city || data.location || '',
            region: data.region || '',
            profilePhoto: null,

            desiredPosition: data.desired_position || data.title || '',
            desiredSectors: data.desired_sectors || [],
            desiredContractTypes: data.desired_contract_types || [],
            availability: data.availability || '',

            professionalStatus: data.professional_status || '',
            currentPosition: data.current_position || '',
            currentCompany: data.current_company || '',
            professionalSummary: data.bio || data.professional_summary || '',

            experiences: data.work_experience || [],
            formations: data.education || [],

            skills: data.skills || [],
            languagesDetailed: data.languages || [],

            mobility: data.mobility || [],
            willingToRelocate: data.willing_to_relocate || false,

            desiredSalaryMin: data.desired_salary_min?.toString() || '',
            desiredSalaryMax: data.desired_salary_max?.toString() || '',

            linkedinUrl: data.linkedin_url || '',
            portfolioUrl: data.portfolio_url || '',
            githubUrl: data.github_url || '',
            otherUrls: data.other_urls || [],

            drivingLicense: data.driving_license || [],
            cv: null,
            coverLetter: null,
            certificates: null,

            visibleInCVTheque: data.visible_in_cvtheque || false,
            receiveAlerts: data.receive_alerts || false,
            acceptTerms: true,
            certifyAccuracy: true,

            cvParsedData: data.cv_parsed_data || null,
            cvParsedAt: data.cv_parsed_at || null,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    loadExistingProfile();
  }, [profile?.id, user?.email]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSaving(true);
      localStorage.setItem('candidateProfileDraft', JSON.stringify(formData));
      setLastSaved(new Date());
      setTimeout(() => setAutoSaving(false), 1000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleCVParsed = useCallback((parsedData: ParsedCVData) => {
    const mappedData = mapToFormData(parsedData, formData);
    setFormData(mappedData);
    setCvParsed(true);
    setShowManualForm(true);
  }, [formData, mapToFormData]);

  const updateField = useCallback((fieldName: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [fieldName]: value }));
  }, []);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!file || !user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(folder)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from(folder)
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error(`Error uploading file to ${folder}:`, error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Ce champ est obligatoire';
    if (!formData.email) newErrors.email = 'Ce champ est obligatoire';
    if (!formData.phone) newErrors.phone = 'Ce champ est obligatoire';
    if (formData.experiences.length === 0) newErrors.experiences = 'Au moins une expérience professionnelle est obligatoire';
    if (formData.formations.length === 0) newErrors.formations = 'Au moins une formation/diplôme est obligatoire';
    if (!formData.city && formData.mobility.length === 0) newErrors.location = 'La localisation ou la mobilité est obligatoire';
    if (!formData.acceptTerms) newErrors.acceptTerms = 'Vous devez accepter les conditions';
    if (!formData.certifyAccuracy) newErrors.certifyAccuracy = 'Vous devez certifier l\'exactitude';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const errorMessages = Object.values(newErrors).join('\n');
      alert('Veuillez corriger les erreurs suivantes:\n\n' + errorMessages);
      return;
    }

    if (!profile?.id) {
      alert('Erreur: Profil utilisateur introuvable');
      return;
    }

    try {
      // Upload files if provided
      const cvUrl = formData.cv ? await uploadFile(formData.cv, 'candidate-cvs') : null;
      const coverLetterUrl = formData.coverLetter ? await uploadFile(formData.coverLetter, 'candidate-cover-letters') : null;
      const certificatesUrl = formData.certificates ? await uploadFile(formData.certificates, 'candidate-certificates') : null;
      const candidateData = {
        profile_id: profile.id,
        user_id: user?.id,
        full_name: formData.fullName,
        title: formData.desiredPosition || formData.currentPosition || '',
        bio: formData.professionalSummary,
        experience_years: formData.experiences.length,
        skills: formData.skills,
        education: formData.formations,
        work_experience: formData.experiences,
        languages: formData.languagesDetailed,
        location: formData.city || formData.address,
        availability: formData.availability,
        nationality: formData.nationality,
        visibility: formData.visibleInCVTheque ? 'public' : 'private',
        last_active_at: new Date().toISOString(),
        desired_position: formData.desiredPosition,
        desired_sectors: formData.desiredSectors,
        desired_salary_min: formData.desiredSalaryMin ? parseInt(formData.desiredSalaryMin) : null,
        desired_salary_max: formData.desiredSalaryMax ? parseInt(formData.desiredSalaryMax) : null,
        mobility: formData.mobility,
        education_level: formData.formations[0]?.['Diplôme obtenu'] || '',
        driving_license: formData.drivingLicense,
        linkedin_url: formData.linkedinUrl,
        portfolio_url: formData.portfolioUrl,
        github_url: formData.githubUrl,
        other_urls: formData.otherUrls,
        cv_url: cvUrl,
        cover_letter_url: coverLetterUrl,
        certificates_url: certificatesUrl,
        cv_parsed_data: formData.cvParsedData,
        cv_parsed_at: formData.cvParsedAt,
        profile_completion_percentage: calculateProgress(),
      };

      const { data: existingProfile } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (existingProfile) {
        const { error } = await supabase
          .from('candidate_profiles')
          .update(candidateData)
          .eq('profile_id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('candidate_profiles').insert(candidateData);
        if (error) throw error;
      }

      await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('id', profile.id);

      localStorage.removeItem('candidateProfileDraft');
      alert('Profil enregistré avec succès! Votre profil est maintenant complet.');

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de l\'enregistrement du profil. Veuillez réessayer.');
    }
  };

  const progress = calculateProgress();

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-8"
    >
      {/* En-tête */}
      <div className="text-center border-b pb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
          <User className="w-8 h-8 text-blue-600" />
          Mon Profil Professionnel JobGuinée
        </h1>
        <p className="text-gray-600 mt-2">
          Complétez votre profil pour maximiser vos chances d'être recruté
        </p>
      </div>

      {/* Barre de progression */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-gray-800">Profil complété</span>
          </div>
          <div className="flex items-center gap-3">
            {autoSaving && (
              <span className="text-xs text-green-600 flex items-center gap-1 animate-pulse">
                <Save className="w-3 h-3" />
                Sauvegarde...
              </span>
            )}
            {lastSaved && !autoSaving && (
              <span className="text-xs text-gray-500">
                Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="text-xl font-bold text-blue-700">{progress}%</span>
          </div>
        </div>
        <div className="w-full bg-white rounded-full h-4 overflow-hidden shadow-inner">
          <div
            className={`h-4 rounded-full transition-all duration-500 ${
              progress < 40
                ? 'bg-gradient-to-r from-red-400 to-orange-400'
                : progress < 70
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                : 'bg-gradient-to-r from-green-400 to-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* SECTION 1: Upload de CV */}
      {!showManualForm && (
        <FormSection
          title="📄 Téléversez votre CV"
          subtitle="Notre IA analysera votre CV et remplira automatiquement le formulaire"
        >
          <CVUploadWithParser
            onParsed={handleCVParsed}
            onError={(error) => {
              alert(error);
              setShowManualForm(true);
            }}
          />
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setShowManualForm(true)}
              className="text-blue-600 hover:text-blue-700 underline font-medium"
            >
              Ou remplir manuellement le formulaire
            </button>
          </div>
        </FormSection>
      )}

      {/* SECTIONS SUIVANTES (affichées après parsing ou si manuel) */}
      {showManualForm && (
        <>
          {/* SECTION 2: Identité & Contact */}
          <FormSection
            title="1️⃣ Identité & Informations de contact"
            icon={<User className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nom complet"
                placeholder="Ex: Fatoumata Camara"
                value={formData.fullName}
                onChange={(value) => updateField('fullName', value)}
                error={errors.fullName}
                required
              />
              <Input
                label="Adresse email"
                type="email"
                placeholder="fatou.camara@gmail.com"
                value={formData.email}
                onChange={(value) => updateField('email', value)}
                error={errors.email}
                required
              />
              <Input
                label="Téléphone"
                placeholder="+224 620 00 00 00"
                value={formData.phone}
                onChange={(value) => updateField('phone', value)}
                error={errors.phone}
                required
              />
              <DatePicker
                label="Date de naissance"
                value={formData.birthDate}
                onChange={(value) => updateField('birthDate', value)}
              />
              <Select
                label="Genre"
                options={['Homme', 'Femme', 'Autre']}
                value={formData.gender}
                onChange={(value) => updateField('gender', value)}
              />
              <AutoCompleteInput
                label="Nationalité"
                value={formData.nationality}
                onChange={(value) => updateField('nationality', value)}
                suggestions={['Guinéenne', 'Française', 'Sénégalaise', 'Ivoirienne', 'Malienne']}
                placeholder="Ex: Guinéenne"
              />
            </div>
          </FormSection>

          {/* SECTION 3: Résumé Professionnel */}
          <FormSection
            title="2️⃣ Résumé Professionnel"
            icon={<Sparkles className="w-6 h-6" />}
            subtitle="Décrivez brièvement votre parcours et vos objectifs"
          >
            <Textarea
              label="À propos de moi"
              placeholder="Professionnel RH avec 5 ans d'expérience dans le recrutement et la gestion du personnel..."
              value={formData.professionalSummary}
              onChange={(value) => updateField('professionalSummary', value)}
              rows={5}
              helpText="Recommandé: 150-300 caractères. Soyez concis et percutant."
            />
            {cvParsed && formData.professionalSummary && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                <Sparkles className="w-4 h-4" />
                Résumé détecté depuis votre CV
              </div>
            )}
          </FormSection>

          {/* SECTION 4: Poste & Objectifs */}
          <FormSection
            title="3️⃣ Poste recherché & Objectifs"
            icon={<Briefcase className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AutoCompleteInput
                label="Poste recherché"
                value={formData.desiredPosition}
                onChange={(value) => updateField('desiredPosition', value)}
                suggestions={COMMON_POSITIONS}
                placeholder="Ex: Développeur Full-Stack"
              />
              <Select
                label="Disponibilité"
                options={['Immédiate', 'Dans 1 mois', 'Dans 3 mois', 'Négociable']}
                value={formData.availability}
                onChange={(value) => updateField('availability', value)}
              />
            </div>
            <MultiSelect
              label="Secteurs d'activité souhaités"
              options={SECTORS}
              value={formData.desiredSectors}
              onChange={(value) => updateField('desiredSectors', value)}
            />
            <MultiSelect
              label="Types de contrat souhaités"
              options={['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance']}
              value={formData.desiredContractTypes}
              onChange={(value) => updateField('desiredContractTypes', value)}
            />
          </FormSection>

          {/* SECTION 5: Expériences */}
          <FormSection
            title="4️⃣ Expériences Professionnelles"
            icon={<Briefcase className="w-6 h-6" />}
            subtitle={
              <span className="text-gray-600">
                Au moins une expérience requise <span className="text-red-500">*</span>
              </span>
            }
          >
            <Repeater
              label="Ajouter une expérience"
              fields={[
                { label: 'Poste occupé', type: 'text', placeholder: 'Ex: Chargé RH' },
                { label: 'Entreprise', type: 'text', placeholder: 'Ex: UMS Mining' },
                { label: 'Période', type: 'text', placeholder: 'Ex: 2020 - 2023' },
                {
                  label: 'Missions principales',
                  type: 'textarea',
                  placeholder: 'Décrivez vos responsabilités...',
                },
              ]}
              value={formData.experiences}
              onChange={(value) => updateField('experiences', value)}
            />
            {errors.experiences && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {errors.experiences}
              </div>
            )}
            {cvParsed && formData.experiences.length > 0 && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-sm text-green-700">
                <Sparkles className="w-4 h-4" />
                {formData.experiences.length} expérience(s) détectée(s) depuis votre CV
              </div>
            )}
          </FormSection>

          {/* SECTION 6: Formations */}
          <FormSection
            title="5️⃣ Formations & Diplômes"
            icon={<GraduationCap className="w-6 h-6" />}
            subtitle={
              <span className="text-gray-600">
                Au moins une formation/diplôme requis <span className="text-red-500">*</span>
              </span>
            }
          >
            <Repeater
              label="Ajouter une formation"
              fields={[
                {
                  label: 'Diplôme obtenu',
                  type: 'text',
                  placeholder: 'Ex: Licence en GRH',
                },
                { label: 'Établissement', type: 'text', placeholder: 'Ex: Université de Conakry' },
                { label: 'Année d\'obtention', type: 'text', placeholder: 'Ex: 2021' },
              ]}
              value={formData.formations}
              onChange={(value) => updateField('formations', value)}
            />
            {errors.formations && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {errors.formations}
              </div>
            )}
          </FormSection>

          {/* SECTION 7: Compétences & Langues */}
          <FormSection
            title="6️⃣ Compétences & Langues"
            icon={<Award className="w-6 h-6" />}
          >
            <SkillsAutoComplete
              label="Compétences clés"
              value={formData.skills}
              onChange={(value) => updateField('skills', value)}
              aiSuggestions={formData.cvParsedData?.skills || []}
              helpText="Ajoutez vos compétences techniques et soft skills. Appuyez sur Entrée pour ajouter."
            />
            <MultiSelect
              label="Langues parlées"
              options={['Français', 'Anglais', 'Soussou', 'Malinké', 'Peul', 'Arabe', 'Chinois', 'Espagnol']}
              value={formData.languagesDetailed.map(l => l.language)}
              onChange={(value) =>
                updateField(
                  'languagesDetailed',
                  value.map((lang) => ({ language: lang, level: 'Intermédiaire' }))
                )
              }
            />
          </FormSection>

          {/* SECTION 8: Localisation & Mobilité */}
          <FormSection
            title="7️⃣ Localisation & Mobilité"
            icon={<MapPin className="w-6 h-6" />}
            subtitle={
              <span className="text-gray-600">
                Ville ou zones de mobilité requises <span className="text-red-500">*</span>
              </span>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Adresse actuelle"
                placeholder="Ex: Quartier Ratoma"
                value={formData.address}
                onChange={(value) => updateField('address', value)}
              />
              <AutoCompleteInput
                label="Ville / Commune"
                value={formData.city}
                onChange={(value) => updateField('city', value)}
                suggestions={CITIES_GUINEA}
                placeholder="Ex: Conakry"
              />
            </div>
            <MultiSelect
              label="Zones de mobilité géographique"
              options={CITIES_GUINEA}
              value={formData.mobility}
              onChange={(value) => updateField('mobility', value)}
            />
            <Checkbox
              label="Je suis ouvert(e) à la relocalisation dans d'autres régions"
              checked={formData.willingToRelocate}
              onChange={(checked) => updateField('willingToRelocate', checked)}
            />
            {errors.location && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {errors.location}
              </div>
            )}
          </FormSection>

          {/* SECTION 9: Rémunération */}
          <FormSection
            title="8️⃣ Rémunération Souhaitée"
            icon={<DollarSign className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Salaire minimum souhaité (GNF)"
                type="number"
                placeholder="Ex: 5000000"
                value={formData.desiredSalaryMin}
                onChange={(value) => updateField('desiredSalaryMin', value)}
                helpText="Montant mensuel brut en Francs Guinéens"
              />
              <Input
                label="Salaire maximum souhaité (GNF)"
                type="number"
                placeholder="Ex: 8000000"
                value={formData.desiredSalaryMax}
                onChange={(value) => updateField('desiredSalaryMax', value)}
                helpText="Montant mensuel brut en Francs Guinéens"
              />
            </div>
          </FormSection>

          {/* SECTION 10: Liens & Documents */}
          <FormSection
            title="9️⃣ Liens Professionnels & Documents"
            icon={<LinkIcon className="w-6 h-6" />}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Profil LinkedIn"
                placeholder="https://linkedin.com/in/votre-profil"
                value={formData.linkedinUrl}
                onChange={(value) => updateField('linkedinUrl', value)}
              />
              <Input
                label="Portfolio / Site web"
                placeholder="https://votre-portfolio.com"
                value={formData.portfolioUrl}
                onChange={(value) => updateField('portfolioUrl', value)}
              />
              <Input
                label="GitHub (pour développeurs)"
                placeholder="https://github.com/votre-profil"
                value={formData.githubUrl}
                onChange={(value) => updateField('githubUrl', value)}
              />
            </div>
            <MultiSelect
              label="Permis de conduire"
              options={['Permis B (voiture)', 'Permis A (moto)', 'Permis C (poids lourd)', 'Aucun']}
              value={formData.drivingLicense}
              onChange={(value) => updateField('drivingLicense', value)}
            />
            <Upload
              label="CV principal (PDF ou Word)"
              onChange={(file) => updateField('cv', file)}
              helpText="Téléchargez votre CV le plus récent (max 5 Mo)"
            />
            <Upload
              label="Lettre de motivation (optionnel)"
              onChange={(file) => updateField('coverLetter', file)}
              helpText="Formats acceptés: PDF, Word, JPG, PNG"
            />
            <Upload
              label="Certificats / Attestations (optionnel)"
              onChange={(file) => updateField('certificates', file)}
            />
          </FormSection>

          {/* SECTION 11: Validation */}
          <FormSection
            title="🔒 Validation & Confidentialité"
          >
            <div className="space-y-4">
              <Checkbox
                label="Je souhaite que mon profil soit visible dans la CVThèque JobGuinée"
                checked={formData.visibleInCVTheque}
                onChange={(checked) => updateField('visibleInCVTheque', checked)}
              />
              <Checkbox
                label="Je souhaite recevoir des alertes sur les offres correspondant à mon profil"
                checked={formData.receiveAlerts}
                onChange={(checked) => updateField('receiveAlerts', checked)}
              />
              <div className="pt-4 border-t">
                <Checkbox
                  label="J'accepte les conditions générales et la politique de confidentialité"
                  checked={formData.acceptTerms}
                  onChange={(checked) => updateField('acceptTerms', checked)}
                />
                {errors.acceptTerms && (
                  <p className="text-sm text-red-600 mt-1">{errors.acceptTerms}</p>
                )}
              </div>
              <Checkbox
                label="Je certifie que les informations fournies sont exactes"
                checked={formData.certifyAccuracy}
                onChange={(checked) => updateField('certifyAccuracy', checked)}
              />
              {errors.certifyAccuracy && (
                <p className="text-sm text-red-600 mt-1">{errors.certifyAccuracy}</p>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <Button variant="primary" type="submit" className="flex-1">
                <Save className="w-5 h-5 mr-2" />
                Enregistrer mon profil
              </Button>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous vraiment effacer toutes les données?')) {
                    localStorage.removeItem('candidateProfileDraft');
                    setFormData(getInitialFormData());
                    setShowManualForm(false);
                    setCvParsed(false);
                  }
                }}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Réinitialiser
              </button>
            </div>
          </FormSection>
        </>
      )}
    </form>
  );
}
