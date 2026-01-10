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
  Trash2,
  FileText,
  Upload as UploadIcon,
  Lock,
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
import SuccessModal from '../notifications/SuccessModal';
import ErrorListModal from '../notifications/ErrorListModal';
import ModernModal from '../modals/ModernModal';
import LanguageRequirementsManager from './LanguageRequirementsManager';
import ExperienceFieldsImproved from './ExperienceFieldsImproved';
import EducationFieldsImproved from './EducationFieldsImproved';
import ProfilePhotoUpload from './ProfilePhotoUpload';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useCreditBalance, useServiceCost } from '../../hooks/useCreditService';
import { useAutoSave } from '../../hooks/useAutoSave';

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

type FileType = 'cv' | 'certificate';

interface FileToUpload {
  id: string;
  file: File;
  fileType: FileType;
  customTitle: string;
}

interface CandidateProfileFormProps {
  onSaveSuccess?: () => void;
}

export default function CandidateProfileForm({ onSaveSuccess }: CandidateProfileFormProps = {}) {
  const { user, profile } = useAuth();
  const { mapToFormData } = useCVParsing();
  const { balance } = useCreditBalance();
  const { serviceCost: cvParseCost } = useServiceCost('cv_parse');

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
  const [showCVUploadModal, setShowCVUploadModal] = useState(false);
  const [cvParsed, setCvParsed] = useState(false);
  const [showManualForm, setShowManualForm] = useState(true);

  const saveToDatabaseCallback = useCallback(async (data: any) => {
    if (!profile?.id || !user) return;

    try {
      const { error } = await supabase
        .from('candidate_profiles')
        .upsert({
          profile_id: profile.id,
          phone: data.phone,
          birth_date: data.birthDate || null,
          gender: data.gender || null,
          nationality: data.nationality || null,
          address: data.address || null,
          city: data.city || null,
          region: data.region || null,
          location: data.city || null,
          title: data.desiredPosition || null,
          desired_position: data.desiredPosition || null,
          desired_sectors: data.desiredSectors || [],
          desired_contract_types: data.desiredContractTypes || [],
          availability: data.availability || null,
          professional_status: data.professionalStatus || null,
          current_position: data.currentPosition || null,
          current_company: data.currentCompany || null,
          bio: data.professionalSummary || null,
          work_experience: data.experiences || [],
          education: data.formations || [],
          skills: data.skills || [],
          languages: data.languagesDetailed || [],
          mobility: data.mobility || [],
          willing_to_relocate: data.willingToRelocate || false,
          desired_salary_min: data.desiredSalaryMin ? parseInt(data.desiredSalaryMin) : null,
          desired_salary_max: data.desiredSalaryMax ? parseInt(data.desiredSalaryMax) : null,
          linkedin_url: data.linkedinUrl || null,
          portfolio_url: data.portfolioUrl || null,
          github_url: data.githubUrl || null,
          other_urls: data.otherUrls || [],
          driving_license: data.drivingLicense || [],
          visible_in_cvtheque: data.visibleInCVTheque || false,
          receive_alerts: data.receiveAlerts || false,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'profile_id'
        });

      if (error) {
        console.error('Error auto-saving to database:', error);
      }
    } catch (error) {
      console.error('Error auto-saving to database:', error);
    }
  }, [profile?.id, user]);

  const { status: autoSaveStatus, lastSaved, lastDatabaseSave } = useAutoSave({
    data: formData,
    key: 'candidateProfileDraft',
    delay: 2000,
    enabled: true,
    saveToDatabase: saveToDatabaseCallback,
    databaseSaveDelay: 15000,
  });
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [errorListModal, setErrorListModal] = useState<{
    isOpen: boolean;
    errors: string[];
  }>({
    isOpen: false,
    errors: []
  });

  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [filesToUpload, setFilesToUpload] = useState<FileToUpload[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

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
      cvUrl: '',
      coverLetterUrl: '',
      certificatesUrl: '',

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

  const addFiles = (files: File[], fileType: FileType) => {
    const newFiles: FileToUpload[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      fileType,
      customTitle: ''
    }));
    setFilesToUpload(prev => [...prev, ...newFiles]);
  };

  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: FileType) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      const oversizedFiles: string[] = [];
      const validFiles = filesArray.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          oversizedFiles.push(file.name);
          return false;
        }
        return true;
      });

      if (oversizedFiles.length > 0) {
        setWarningModal({
          isOpen: true,
          title: 'Fichier(s) trop volumineux',
          message: `${oversizedFiles.length > 1 ? 'Les fichiers suivants dépassent' : 'Le fichier suivant dépasse'} la limite de 10 MB:\n\n${oversizedFiles.map(name => `• ${name}`).join('\n')}\n\nVeuillez compresser ${oversizedFiles.length > 1 ? 'ces fichiers' : 'ce fichier'} ou en sélectionner ${oversizedFiles.length > 1 ? 'd\'autres' : 'un autre'}.`
        });
      }

      if (validFiles.length > 0) {
        addFiles(validFiles, fileType);
      }
    }
  };

  const removeFile = (id: string) => {
    setFilesToUpload(prev => prev.filter(f => f.id !== id));
  };

  const updateFileTitle = (id: string, title: string) => {
    setFilesToUpload(prev =>
      prev.map(f => f.id === id ? { ...f, customTitle: title } : f)
    );
  };

  const getFileTypeLabel = (type: FileType) => {
    const labels: Record<FileType, string> = {
      cv: 'CV',
      certificate: 'Certificat / Attestation'
    };
    return labels[type];
  };

  const getFilesByType = (type: FileType) => {
    return filesToUpload.filter(f => f.fileType === type);
  };

  const MultipleFileUploadSection = ({ fileType, label, required = false }: { fileType: FileType; label: string; required?: boolean }) => {
    const filesOfType = getFilesByType(fileType);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-gray-900">
            {label} {required && <span className="text-red-600">*</span>}
          </label>
        </div>

        <input
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => handleMultipleFilesChange(e, fileType)}
          className="hidden"
          id={`file-upload-${fileType}`}
        />

        <label
          htmlFor={`file-upload-${fileType}`}
          className="flex items-center justify-center gap-3 px-4 py-6 bg-white border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg cursor-pointer transition"
        >
          <UploadIcon className="w-6 h-6 text-gray-600" />
          <div className="text-center">
            <p className="font-semibold text-gray-900">
              Cliquer pour télécharger {filesOfType.length > 0 ? 'd\'autres fichiers' : 'un ou plusieurs fichiers'}
            </p>
            <p className="text-sm text-gray-600">Formats acceptés: PDF, Word, JPG, PNG (max 10 MB par fichier)</p>
          </div>
        </label>

        {filesOfType.length > 0 && (
          <div className="space-y-2">
            {filesOfType.map((fileItem) => (
              <div key={fileItem.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{fileItem.file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(fileItem.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>

                    <input
                      type="text"
                      value={fileItem.customTitle}
                      onChange={(e) => updateFileTitle(fileItem.id, e.target.value)}
                      placeholder="Titre personnalisé (optionnel)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={() => removeFile(fileItem.id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                    type="button"
                    title="Supprimer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

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
            cvUrl: data.cv_url || '',
            coverLetterUrl: data.cover_letter_url || '',
            certificatesUrl: data.certificates_url || '',

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
      setErrorListModal({
        isOpen: true,
        errors: Object.values(newErrors)
      });
      return;
    }

    if (!profile?.id) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Erreur',
        message: 'Profil utilisateur introuvable'
      });
      return;
    }

    try {
      setUploadingFiles(true);

      const uploadedFiles: { type: FileType; url: string; title: string }[] = [];

      for (const fileItem of filesToUpload) {
        const fileExt = fileItem.file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random()}.${fileExt}`;

        const storageBucket = fileItem.fileType === 'cv'
          ? 'candidate-cvs'
          : 'candidate-certificates';

        const { error: uploadError } = await supabase.storage
          .from(storageBucket)
          .upload(fileName, fileItem.file);

        if (uploadError) {
          console.error(`Error uploading file to ${storageBucket}:`, uploadError);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from(storageBucket)
          .getPublicUrl(fileName);

        uploadedFiles.push({
          type: fileItem.fileType,
          url: urlData.publicUrl,
          title: fileItem.customTitle || fileItem.file.name
        });
      }

      const cvFiles = uploadedFiles.filter(f => f.type === 'cv');
      const cvUrl = cvFiles.length > 0 ? cvFiles[0].url : (formData.cvUrl || null);

      const certificateFiles = uploadedFiles.filter(f => f.type === 'certificate');
      const certificatesUrl = certificateFiles.length > 0 ? certificateFiles[0].url : (formData.certificatesUrl || null);

      // Upload photo de profil si présente
      let photoUrl = null;
      if (formData.profilePhoto) {
        const photoExt = formData.profilePhoto.name.split('.').pop();
        const photoFileName = `${user.id}/profile-${Date.now()}.${photoExt}`;

        const { error: photoError } = await supabase.storage
          .from('candidate-profile-photos')
          .upload(photoFileName, formData.profilePhoto);

        if (!photoError) {
          const { data: photoUrlData } = supabase.storage
            .from('candidate-profile-photos')
            .getPublicUrl(photoFileName);
          photoUrl = photoUrlData.publicUrl;
        }
      }
      const candidateData = {
        profile_id: profile.id,
        user_id: user?.id,
        full_name: formData.fullName,
        phone: formData.phone,
        birth_date: formData.birthDate || null,
        gender: formData.gender || null,
        nationality: formData.nationality || null,
        address: formData.address || null,
        city: formData.city || null,
        region: formData.region || null,
        photo_url: photoUrl || formData.profilePhoto || null,
        title: formData.desiredPosition || formData.currentPosition || '',
        bio: formData.professionalSummary,
        professional_status: formData.professionalStatus || null,
        current_position: formData.currentPosition || null,
        current_company: formData.currentCompany || null,
        experience_years: formData.experiences.length,
        skills: formData.skills,
        education: formData.formations,
        work_experience: formData.experiences,
        languages: formData.languagesDetailed,
        location: formData.city || formData.address,
        availability: formData.availability,
        visibility: formData.visibleInCVTheque ? 'public' : 'private',
        visible_in_cvtheque: formData.visibleInCVTheque,
        last_active_at: new Date().toISOString(),
        desired_position: formData.desiredPosition,
        desired_sectors: formData.desiredSectors,
        desired_contract_types: formData.desiredContractTypes,
        desired_salary_min: formData.desiredSalaryMin ? parseInt(formData.desiredSalaryMin) : null,
        desired_salary_max: formData.desiredSalaryMax ? parseInt(formData.desiredSalaryMax) : null,
        mobility: formData.mobility,
        willing_to_relocate: formData.willingToRelocate,
        education_level: formData.formations[0]?.degree || '',
        driving_license: formData.drivingLicense,
        linkedin_url: formData.linkedinUrl,
        portfolio_url: formData.portfolioUrl,
        github_url: formData.githubUrl,
        other_urls: formData.otherUrls,
        receive_alerts: formData.receiveAlerts,
        cv_url: cvUrl,
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

      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Profil enregistré avec succès !',
        message: 'Votre profil est maintenant complet et visible par les recruteurs.'
      });

      if (onSaveSuccess) {
        setTimeout(() => {
          onSaveSuccess();
        }, 2000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Erreur d\'enregistrement',
        message: 'Une erreur est survenue lors de l\'enregistrement de votre profil. Veuillez réessayer.'
      });
    } finally {
      setUploadingFiles(false);
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

      {/* Indicateur de sauvegarde automatique */}
      <AutoSaveIndicator
        status={autoSaveStatus}
        lastSaved={lastSaved}
        lastDatabaseSave={lastDatabaseSave}
      />

      {/* Barre de progression */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-semibold text-gray-800">Profil complété</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-orange-600">{progress}%</span>
          </div>
        </div>

        {/* Barre de progression intelligente */}
        <div className="relative">
          {/* Barre de fond avec marqueurs */}
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden relative">
            {/* Barre de progression avec dégradé orange uniforme */}
            <div
              className="h-full transition-all duration-1000 ease-out bg-gradient-to-r from-amber-500 to-orange-500"
              style={{ width: `${progress}%` }}
            >
              {/* Animation de brillance */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse"></div>
            </div>

            {/* Marqueurs d'étapes clés */}
            <div className="absolute top-0 left-1/2 w-0.5 h-full bg-white opacity-30"></div>
            <div className="absolute top-0 left-[80%] w-0.5 h-full bg-white opacity-40"></div>
          </div>

          {/* Labels des étapes positionnés exactement */}
          <div className="relative mt-2 h-5">
            {/* 0% */}
            <span className="absolute left-0 text-xs text-gray-600 font-medium">
              0%
            </span>

            {/* 50% */}
            <span className="absolute left-1/2 -translate-x-1/2 text-xs text-gray-600 font-medium">
              50%
            </span>

            {/* 80% CVthèque */}
            <span className={`absolute left-[80%] -translate-x-1/2 text-xs ${
              progress >= 80 ? 'text-orange-600 font-semibold' : 'text-gray-500 font-medium'
            } flex items-center gap-1 whitespace-nowrap`}>
              {progress >= 80 && <CheckCircle2 className="w-3 h-3" />}
              80% CVthèque
            </span>

            {/* 100% */}
            <span className={`absolute right-0 text-xs ${
              progress >= 100 ? 'text-orange-600 font-semibold' : 'text-gray-500 font-medium'
            } flex items-center gap-1`}>
              {progress >= 100 && <CheckCircle2 className="w-3 h-3" />}
              100%
            </span>
          </div>
        </div>
      </div>

      {/* Bouton d'analyse IA du CV */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>Gagnez du temps avec l'analyse IA</span>
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              Notre IA analysera automatiquement votre CV et remplira tous les champs du formulaire (identité, expériences, formations, compétences, etc.). Vous pourrez ensuite modifier les informations si nécessaire.
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Coût: {cvParseCost || 10} crédits
              </span>
              <span>•</span>
              <span>Solde: {balance?.credits_available || 0} crédits</span>
              <span>•</span>
              <span>Temps d'analyse: ~10 secondes</span>
            </div>
            {balance && balance.credits_available < (cvParseCost || 10) && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                <Lock className="w-4 h-4" />
                <span>
                  Le téléversement du CV nécessite {cvParseCost || 10} crédits. Veuillez recharger votre solde.
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (balance && balance.credits_available < (cvParseCost || 10)) {
                setWarningModal({
                  isOpen: true,
                  title: 'Crédits insuffisants',
                  message: `Vous ne disposez pas de suffisamment de crédits pour utiliser cette fonctionnalité.\n\nVotre solde actuel: ${balance.credits_available} crédits\nCoût du service: ${cvParseCost || 10} crédits\n\nVeuillez recharger votre compte pour continuer.`
                });
                return;
              }
              setShowCVUploadModal(true);
            }}
            disabled={balance && balance.credits_available < (cvParseCost || 10)}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 whitespace-nowrap ${
              balance && balance.credits_available < (cvParseCost || 10)
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {balance && balance.credits_available < (cvParseCost || 10) ? (
              <>
                <Lock className="w-5 h-5" />
                Crédits insuffisants
              </>
            ) : (
              <>
                <UploadIcon className="w-5 h-5" />
                Téléverser mon CV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal d'upload de CV */}
      {showCVUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Téléversez votre CV</h2>
                <button
                  onClick={() => setShowCVUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <CVUploadWithParser
                onParsed={(data) => {
                  handleCVParsed(data);
                  setShowCVUploadModal(false);
                }}
                onError={(error) => {
                  setModalConfig({
                    isOpen: true,
                    type: 'error',
                    title: 'Erreur lors de l\'analyse du CV',
                    message: error
                  });
                  setShowCVUploadModal(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: Identité & Contact */}
      <FormSection
        title="1️⃣ Identité & Informations de contact"
        icon={<User className="w-6 h-6" />}
      >
        <ProfilePhotoUpload
          currentPhotoUrl={formData.cvUrl}
          onPhotoChange={(file) => updateField('profilePhoto', file)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
        <ExperienceFieldsImproved
          experiences={formData.experiences}
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
        <EducationFieldsImproved
          educations={formData.formations}
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

        <div className="mt-6">
          <LanguageRequirementsManager
            requirements={formData.languagesDetailed}
            onChange={(value) => updateField('languagesDetailed', value)}
          />
        </div>
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
        <MultipleFileUploadSection
          fileType="cv"
          label="CV principal (PDF ou Word)"
          required={false}
        />

        <MultipleFileUploadSection
          fileType="certificate"
          label="Certificats / Attestations"
          required={false}
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

      <SuccessModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        autoClose={modalConfig.type === 'success'}
        autoCloseDelay={2500}
      />

      <ErrorListModal
        isOpen={errorListModal.isOpen}
        onClose={() => setErrorListModal({ isOpen: false, errors: [] })}
        errors={errorListModal.errors}
      />

      <ModernModal
        isOpen={warningModal.isOpen}
        onClose={() => setWarningModal({ isOpen: false, title: '', message: '' })}
        title={warningModal.title}
        message={warningModal.message}
        type="warning"
        confirmText="Compris"
      />
    </form>
  );
}
