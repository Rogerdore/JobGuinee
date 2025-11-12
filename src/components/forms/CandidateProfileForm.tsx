import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateCandidateCompletion } from '../../utils/profileCompletion';
import {
  Input,
  Select,
  MultiSelect,
  Textarea,
  DatePicker,
  Upload,
  Checkbox,
  TagsInput,
  Repeater,
  FormSection,
  Button,
} from './FormComponents';

interface CandidateProfileFormProps {
  onNavigate?: (page: string) => void;
}

export default function CandidateProfileForm({ onNavigate }: CandidateProfileFormProps) {
  const { user, profile } = useAuth();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
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
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  function getInitialFormData() {
    return {
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    gender: '',
    address: '',
    region: '',
    profilePhoto: null as File | null,
    professionalStatus: '',
    currentPosition: '',
    currentCompany: '',
    availability: '',
    professionalSummary: '',
    experiences: [] as Record<string, any>[],
    formations: [] as Record<string, any>[],
    skills: [] as string[],
    languages: [] as string[],
    englishLevel: '',
    cv: null as File | null,
    certificates: null as File | null,
    visibleInCVTheque: false,
    receiveAlerts: false,
    professionalGoal: '',
    acceptTerms: false,
    certifyAccuracy: false,
    };
  }

  const calculateProgress = () => {
    const profileData = {
      full_name: formData.fullName || '',
      desired_position: formData.currentPosition || formData.professionalStatus || '',
      bio: formData.professionalSummary || '',
      phone: formData.phone || '',
      location: formData.address || '',
      experience_years: formData.experiences && formData.experiences.length > 0 ? formData.experiences.reduce((sum, exp) => {
        const years = parseInt(exp.years) || 0;
        return sum + years;
      }, 0) : 0,
      education_level: formData.formations && formData.formations.length > 0 ? (formData.formations[0]?.degree || '') : '',
      skills: formData.skills || [],
      languages: formData.languages || [],
      cv_url: formData.cv ? 'has_cv' : '',
      linkedin_url: '',
      portfolio_url: '',
      desired_salary_min: '',
      desired_salary_max: '',
    };
    return calculateCandidateCompletion(profileData);
  };

  useEffect(() => {
    loadExistingProfile();
  }, [profile?.id]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setAutoSaving(true);
        localStorage.setItem('candidateProfileDraft', JSON.stringify(formData));
        setLastSaved(new Date());
        setTimeout(() => setAutoSaving(false), 1000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [formData, loading]);

  const loadExistingProfile = async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: candidateData } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (candidateData) {
        setFormData({
          fullName: candidateData.full_name || profile.full_name || '',
          email: user?.email || '',
          phone: profile.phone || '',
          birthDate: candidateData.birth_date || '',
          gender: candidateData.gender || '',
          address: candidateData.location || '',
          region: candidateData.nationality || '',
          profilePhoto: null,
          professionalStatus: candidateData.professional_status || '',
          currentPosition: candidateData.title || '',
          currentCompany: candidateData.current_company || '',
          availability: candidateData.availability || '',
          professionalSummary: candidateData.bio || '',
          experiences: candidateData.work_experience || [],
          formations: candidateData.education || [],
          skills: candidateData.skills || [],
          languages: candidateData.languages || [],
          englishLevel: candidateData.english_level || '',
          cv: null,
          certificates: null,
          visibleInCVTheque: candidateData.visibility === 'public',
          receiveAlerts: candidateData.receive_alerts || false,
          professionalGoal: candidateData.professional_goal || '',
          acceptTerms: false,
          certifyAccuracy: false,
        });
      } else {
        setFormData({
          ...getInitialFormData(),
          fullName: profile.full_name || '',
          email: user?.email || '',
          phone: profile.phone || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateField = (fieldName: string, value: any): string => {
    switch (fieldName) {
      case 'email':
        if (!value) return 'L\'adresse email est obligatoire';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Veuillez saisir un email valide';
        }
        return '';
      case 'phone':
        if (!value) return 'Le numéro de téléphone est obligatoire';
        if (!/^\+?[0-9\s]{8,}$/.test(value)) {
          return 'Veuillez saisir un numéro de téléphone valide';
        }
        return '';
      case 'fullName':
        if (!value || value.trim().length < 3) {
          return 'Le nom complet doit contenir au moins 3 caractères';
        }
        return '';
      default:
        return '';
    }
  };

  const updateField = (fieldName: string, value: any) => {
    setFormData({ ...formData, [fieldName]: value });
    const error = validateField(fieldName, value);
    setErrors({ ...errors, [fieldName]: error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Ce champ est obligatoire';
    if (!formData.email) newErrors.email = 'Ce champ est obligatoire';
    if (!formData.phone) newErrors.phone = 'Ce champ est obligatoire';
    if (!formData.birthDate) newErrors.birthDate = 'La date de naissance est obligatoire';

    // Validate birth date is not in the future
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birthDate = 'La date de naissance ne peut pas être dans le futur';
      }
      // Check if age is reasonable (between 16 and 100 years old)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 16) {
        newErrors.birthDate = 'Vous devez avoir au moins 16 ans';
      } else if (age > 100) {
        newErrors.birthDate = 'Veuillez vérifier la date saisie';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    if (!profile?.id) {
      alert('Erreur: Profil utilisateur introuvable');
      return;
    }

    if (!user?.id) {
      alert('Erreur: Utilisateur introuvable');
      return;
    }

    setSubmitting(true);

    try {
      // Upload files if provided
      let profilePhotoUrl = null;
      let cvUrl = null;
      let certificatesUrl = null;

      if (formData.profilePhoto) {
        const photoPath = `${user.id}/photo_${Date.now()}.${formData.profilePhoto.name.split('.').pop()}`;
        const { error: photoError } = await supabase.storage
          .from('candidate-profiles')
          .upload(photoPath, formData.profilePhoto, { upsert: true });

        if (!photoError) {
          const { data } = supabase.storage.from('candidate-profiles').getPublicUrl(photoPath);
          profilePhotoUrl = data.publicUrl;
        }
      }

      if (formData.cv) {
        const cvPath = `${user.id}/cv_${Date.now()}.pdf`;
        const { error: cvError } = await supabase.storage
          .from('candidate-profiles')
          .upload(cvPath, formData.cv, { upsert: true });

        if (!cvError) {
          const { data } = supabase.storage.from('candidate-profiles').getPublicUrl(cvPath);
          cvUrl = data.publicUrl;
        }
      }

      if (formData.certificates) {
        const certPath = `${user.id}/certificates_${Date.now()}.pdf`;
        const { error: certError } = await supabase.storage
          .from('candidate-profiles')
          .upload(certPath, formData.certificates, { upsert: true });

        if (!certError) {
          const { data } = supabase.storage.from('candidate-profiles').getPublicUrl(certPath);
          certificatesUrl = data.publicUrl;
        }
      }

      // Update or insert candidate profile
      const candidateData = {
        profile_id: profile.id,
        user_id: user.id,
        full_name: formData.fullName,
        birth_date: formData.birthDate || null,
        gender: formData.gender || null,
        location: formData.address || '',
        nationality: formData.region || 'Guinéenne',
        professional_status: formData.professionalStatus || null,
        title: formData.currentPosition || formData.professionalStatus || '',
        current_company: formData.currentCompany || null,
        availability: formData.availability || 'Immédiate',
        bio: formData.professionalSummary || '',
        experience_years: formData.experiences.length || 0,
        work_experience: formData.experiences || [],
        education: formData.formations || [],
        skills: formData.skills || [],
        languages: formData.languages || [],
        english_level: formData.englishLevel || null,
        professional_goal: formData.professionalGoal || null,
        receive_alerts: formData.receiveAlerts || false,
        profile_photo_url: profilePhotoUrl,
        cv_url: cvUrl,
        certificates_url: certificatesUrl,
        visibility: formData.visibleInCVTheque ? 'public' : 'private',
        last_active_at: new Date().toISOString(),
      };

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('candidate_profiles')
        .select('id, profile_photo_url, cv_url, certificates_url')
        .eq('profile_id', profile.id)
        .maybeSingle();

      // Only update file URLs if new files were uploaded
      if (existingProfile) {
        const updateData = {
          ...candidateData,
          profile_photo_url: profilePhotoUrl || existingProfile.profile_photo_url,
          cv_url: cvUrl || existingProfile.cv_url,
          certificates_url: certificatesUrl || existingProfile.certificates_url,
        };

        // Update existing profile
        const { error } = await supabase
          .from('candidate_profiles')
          .update(updateData)
          .eq('profile_id', profile.id);

        if (error) throw error;
      } else {
        // Insert new profile
        const { error } = await supabase
          .from('candidate_profiles')
          .insert(candidateData);

        if (error) throw error;
      }

      // Update main profile
      await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
        })
        .eq('id', profile.id);

      localStorage.removeItem('candidateProfileDraft');

      // Show success message
      setShowSuccessMessage(true);

      // Redirect to candidate dashboard after 2 seconds
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('candidate-dashboard');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Error saving profile:', error);

      let errorMessage = 'Erreur inconnue';

      if (error.message) {
        errorMessage = error.message;
      }

      if (error.code === '23505') {
        errorMessage = 'Un profil existe déjà pour cet utilisateur.';
      } else if (error.code === '23502') {
        errorMessage = 'Certains champs obligatoires sont manquants.';
      } else if (error.code === '23503') {
        errorMessage = 'Référence invalide dans les données du profil.';
      }

      alert(`Erreur lors de l'enregistrement du profil:\n\n${errorMessage}\n\nVeuillez réessayer ou contacter le support.`);
    } finally {
      setSubmitting(false);
    }
  };

  const clearDraft = () => {
    if (confirm('Voulez-vous vraiment effacer le brouillon ?')) {
      localStorage.removeItem('candidateProfileDraft');
      setFormData(getInitialFormData());
      setErrors({});
    }
  };

  const handleAIAnalysis = () => {
    alert('Analyse IA du profil en cours... Cette fonctionnalité sera disponible prochainement.');
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-[#0E2F56] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Success Message Overlay */}
      {showSuccessMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform animate-bounce">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Profil Enregistré !
              </h2>
              <p className="text-gray-600 mb-1">
                Votre profil a été enregistré avec succès.
              </p>
              <p className="text-gray-500 text-sm">
                Redirection vers votre espace candidat...
              </p>
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-8">
        <div className="text-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">👤 Mon Profil Professionnel</h1>
          <p className="text-gray-500 mt-2">
            Complétez les informations ci-dessous pour créer ou mettre à jour votre profil professionnel.
          </p>
        </div>

      {/* Progress Bar */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Profil complété</span>
          <div className="flex items-center gap-3">
            {autoSaving && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Save className="w-3 h-3 animate-pulse" />
                Sauvegarde...
              </span>
            )}
            {lastSaved && !autoSaving && (
              <span className="text-xs text-gray-500">
                Sauvegardé à {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <span className="text-sm font-bold text-[#0E2F56]">{progress}%</span>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#0E2F56] to-blue-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <button
          type="button"
          onClick={clearDraft}
          className="mt-3 text-xs text-gray-500 hover:text-red-600 underline"
        >
          Effacer le brouillon
        </button>
      </div>

      <FormSection title="1️⃣ Informations personnelles">
        <Input
          label="Nom complet"
          placeholder="Ex : Fatoumata Camara"
          value={formData.fullName}
          onChange={(value) => updateField('fullName', value)}
          error={errors.fullName}
          helpText="Saisissez votre nom et prénom complets tels qu'ils apparaissent sur vos documents officiels"
          required
        />
        <Input
          label="Adresse email"
          type="email"
          placeholder="Ex : fatou.camara@gmail.com"
          value={formData.email}
          onChange={(value) => updateField('email', value)}
          error={errors.email}
          helpText="Utilisez une adresse email professionnelle que vous consultez régulièrement"
          required
        />
        <Input
          label="Numéro de téléphone"
          placeholder="Ex : +224 620 00 00 00"
          value={formData.phone}
          onChange={(value) => updateField('phone', value)}
          error={errors.phone}
          helpText="Incluez l'indicatif pays pour faciliter le contact international"
          required
        />
        <DatePicker
          label="Date de naissance"
          value={formData.birthDate}
          onChange={(value) => setFormData({ ...formData, birthDate: value })}
          error={errors.birthDate}
          required
          helpText="Votre âge permet aux recruteurs d'évaluer votre profil selon les exigences du poste"
        />
        <Select
          label="Genre"
          options={['Homme', 'Femme', 'Autre']}
          value={formData.gender}
          onChange={(value) => setFormData({ ...formData, gender: value })}
        />
        <Input
          label="Adresse / Ville de résidence"
          placeholder="Ex : Ratoma, Conakry"
          value={formData.address}
          onChange={(value) => setFormData({ ...formData, address: value })}
        />
        <Select
          label="Région / Préfecture"
          options={['Conakry', 'Boké', 'Kankan', 'Labé', 'Kindia', 'Nzérékoré']}
          value={formData.region}
          onChange={(value) => setFormData({ ...formData, region: value })}
        />
        <Upload
          label="Photo de profil"
          onChange={(file) => setFormData({ ...formData, profilePhoto: file })}
        />
      </FormSection>

      <FormSection title="2️⃣ Situation professionnelle actuelle">
        <Select
          label="Statut professionnel"
          options={['En emploi', 'Sans emploi', 'Étudiant(e)', 'Freelance']}
          value={formData.professionalStatus}
          onChange={(value) => setFormData({ ...formData, professionalStatus: value })}
        />
        <Input
          label="Intitulé actuel du poste"
          placeholder="Ex : Assistant RH"
          value={formData.currentPosition}
          onChange={(value) => setFormData({ ...formData, currentPosition: value })}
        />
        <Input
          label="Entreprise actuelle (si applicable)"
          placeholder="Ex : Winning Consortium"
          value={formData.currentCompany}
          onChange={(value) => setFormData({ ...formData, currentCompany: value })}
        />
        <Select
          label="Disponibilité"
          options={['Immédiate', 'Dans 1 mois', 'Flexible']}
          value={formData.availability}
          onChange={(value) => setFormData({ ...formData, availability: value })}
        />
        <Textarea
          label="Résumé professionnel (À propos de moi)"
          placeholder="Décrivez brièvement votre parcours et vos objectifs professionnels..."
          value={formData.professionalSummary}
          onChange={(value) => setFormData({ ...formData, professionalSummary: value })}
          rows={5}
          helpText="Exemple : 'Professionnel RH avec 5 ans d'expérience dans le recrutement et la gestion du personnel, spécialisé dans le secteur minier. Passionné par le développement des talents et la mise en place de politiques RH innovantes.'"
        />
      </FormSection>

      <FormSection title="3️⃣ Expériences professionnelles">
        <Repeater
          label="Ajouter une expérience"
          fields={[
            { label: 'Poste occupé', type: 'text', placeholder: 'Ex : Chargé RH' },
            { label: 'Entreprise', type: 'text', placeholder: 'Ex : UMS Mining' },
            { label: 'Période', type: 'text', placeholder: 'Ex : 2020 - 2023' },
            {
              label: 'Missions principales',
              type: 'textarea',
              placeholder: 'Décrivez vos responsabilités...',
            },
          ]}
          value={formData.experiences}
          onChange={(value) => setFormData({ ...formData, experiences: value })}
        />
      </FormSection>

      <FormSection title="4️⃣ Formations et diplômes">
        <Repeater
          label="Ajouter une formation"
          fields={[
            {
              label: 'Diplôme obtenu',
              type: 'text',
              placeholder: 'Ex : Licence en Gestion des Ressources Humaines',
            },
            { label: 'Établissement', type: 'text', placeholder: 'Ex : Université de Conakry' },
            { label: 'Année d\'obtention', type: 'text', placeholder: 'Ex : 2021' },
          ]}
          value={formData.formations}
          onChange={(value) => setFormData({ ...formData, formations: value })}
        />
      </FormSection>

      <FormSection title="5️⃣ Compétences et langues">
        <TagsInput
          label="Compétences clés"
          placeholder="Ex : Excel, Leadership, Paie, Communication..."
          value={formData.skills}
          onChange={(value) => setFormData({ ...formData, skills: value })}
        />
        <MultiSelect
          label="Langues parlées"
          options={['Français', 'Anglais', 'Chinois', 'Arabe', 'Autres']}
          value={formData.languages}
          onChange={(value) => setFormData({ ...formData, languages: value })}
        />
        <Select
          label="Niveau d'anglais"
          options={['Débutant', 'Intermédiaire', 'Avancé', 'Courant']}
          value={formData.englishLevel}
          onChange={(value) => setFormData({ ...formData, englishLevel: value })}
        />
      </FormSection>

      <FormSection title="6️⃣ Documents et CV">
        <Upload
          label="CV principal (PDF ou Word)"
          onChange={(file) => setFormData({ ...formData, cv: file })}
          helpText="Téléchargez votre CV le plus récent. Formats acceptés : PDF, Word (max 5 Mo)"
        />
        <Upload
          label="Certificats / Attestations (optionnel)"
          onChange={(file) => setFormData({ ...formData, certificates: file })}
          helpText="Ajoutez vos diplômes, certificats de formation ou attestations de travail"
        />
        <Checkbox
          label="Je souhaite que mon profil soit visible dans la CVThèque JobGuinée"
          checked={formData.visibleInCVTheque}
          onChange={(checked) => setFormData({ ...formData, visibleInCVTheque: checked })}
        />
        <Checkbox
          label="Je souhaite recevoir des alertes sur les offres correspondant à mon profil"
          checked={formData.receiveAlerts}
          onChange={(checked) => setFormData({ ...formData, receiveAlerts: checked })}
        />
      </FormSection>

      <FormSection title="7️⃣ Assistance IA et analyse de profil">
        <Button variant="secondary" onClick={handleAIAnalysis}>
          🧠 Analyser mon profil avec IA
        </Button>
        <p className="text-sm text-gray-500">
          L'IA analysera vos informations pour suggérer des offres adaptées et améliorer votre CV.
        </p>
        <Textarea
          label="Commentaire ou objectif professionnel"
          placeholder="Décrivez le type d'emploi ou secteur que vous recherchez..."
          value={formData.professionalGoal}
          onChange={(value) => setFormData({ ...formData, professionalGoal: value })}
          helpText="Exemple : 'Je recherche un poste de responsable RH dans une entreprise internationale basée à Conakry, avec des opportunités d'évolution et de formation continue.'"
        />
      </FormSection>

      <FormSection title="8️⃣ Validation et enregistrement">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            En enregistrant votre profil, vous confirmez que les informations fournies sont exactes et à jour.
          </p>
        </div>
        <Button variant="primary" type="submit" disabled={submitting}>
          {submitting ? 'Enregistrement en cours...' : '✅ Enregistrer mon profil'}
        </Button>
      </FormSection>
    </form>
    </div>
  );
}
