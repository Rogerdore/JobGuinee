import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Save } from 'lucide-react';
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
  TagsInput,
  Repeater,
  FormSection,
  Button,
} from './FormComponents';

export default function CandidateProfileForm() {
  const { user, profile } = useAuth();
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
    const fields = [
      formData.fullName,
      formData.email,
      formData.phone,
      formData.birthDate,
      formData.gender,
      formData.address,
      formData.region,
      formData.professionalStatus,
      formData.availability,
      formData.professionalSummary,
      formData.skills.length > 0,
      formData.languages.length > 0,
      formData.englishLevel,
      formData.experiences.length > 0,
      formData.formations.length > 0,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
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
          fullName: profile.full_name || '',
          email: user?.email || '',
          phone: profile.phone || '',
          birthDate: '',
          gender: '',
          address: candidateData.location || '',
          region: candidateData.nationality || '',
          profilePhoto: null,
          professionalStatus: '',
          currentPosition: candidateData.title || '',
          currentCompany: '',
          availability: candidateData.availability || '',
          professionalSummary: candidateData.bio || '',
          experiences: candidateData.work_experience || [],
          formations: candidateData.education || [],
          skills: candidateData.skills || [],
          languages: candidateData.languages || [],
          englishLevel: '',
          cv: null,
          certificates: null,
          visibleInCVTheque: candidateData.visibility === 'public',
          receiveAlerts: false,
          professionalGoal: '',
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
    if (!formData.acceptTerms) newErrors.acceptTerms = 'Vous devez accepter les conditions';
    if (!formData.certifyAccuracy) newErrors.certifyAccuracy = 'Vous devez certifier l\'exactitude';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    if (!profile?.id) {
      alert('Erreur: Profil utilisateur introuvable');
      return;
    }

    try {
      // Update or insert candidate profile
      const candidateData = {
        profile_id: profile.id,
        title: formData.currentPosition || formData.professionalStatus,
        bio: formData.professionalSummary,
        experience_years: formData.experiences.length,
        skills: formData.skills,
        education: formData.formations,
        work_experience: formData.experiences,
        languages: formData.languages,
        location: formData.address,
        availability: formData.availability,
        nationality: formData.region,
        visibility: formData.visibleInCVTheque ? 'public' : 'private',
        last_active_at: new Date().toISOString(),
      };

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle();

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('candidate_profiles')
          .update(candidateData)
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
      alert('Profil enregistré avec succès ! Votre profil est maintenant visible dans la CVThèque.');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de l\'enregistrement du profil. Veuillez réessayer.');
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

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-8">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">👤 Créer mon profil JobGuinée</h1>
        <p className="text-gray-500 mt-2">
          Complétez les informations ci-dessous pour créer votre profil professionnel.
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

      <FormSection title="8️⃣ Sécurité et validation">
        <Checkbox
          label="J'accepte les conditions générales et la politique de confidentialité"
          checked={formData.acceptTerms}
          onChange={(checked) => setFormData({ ...formData, acceptTerms: checked })}
        />
        <Checkbox
          label="Je certifie que les informations fournies sont exactes"
          checked={formData.certifyAccuracy}
          onChange={(checked) => setFormData({ ...formData, certifyAccuracy: checked })}
        />
        <Button variant="primary" type="submit">
          ✅ Enregistrer mon profil
        </Button>
      </FormSection>
    </form>
  );
}
