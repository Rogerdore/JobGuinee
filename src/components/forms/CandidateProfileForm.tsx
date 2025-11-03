import { useState } from 'react';
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
  const [formData, setFormData] = useState({
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Profil enregistré avec succès !');
  };

  const handleAIAnalysis = () => {
    alert('Analyse IA du profil en cours... Cette fonctionnalité sera disponible prochainement.');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow-lg space-y-8">
      <div className="text-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">👤 Créer mon profil JobGuinée</h1>
        <p className="text-gray-500 mt-2">
          Complétez les informations ci-dessous pour créer votre profil professionnel.
        </p>
      </div>

      <FormSection title="1️⃣ Informations personnelles">
        <Input
          label="Nom complet"
          placeholder="Ex : Fatoumata Camara"
          value={formData.fullName}
          onChange={(value) => setFormData({ ...formData, fullName: value })}
        />
        <Input
          label="Adresse email"
          type="email"
          placeholder="Ex : fatou.camara@gmail.com"
          value={formData.email}
          onChange={(value) => setFormData({ ...formData, email: value })}
        />
        <Input
          label="Numéro de téléphone"
          placeholder="Ex : +224 620 00 00 00"
          value={formData.phone}
          onChange={(value) => setFormData({ ...formData, phone: value })}
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
        />
        <Upload
          label="Certificats / Attestations (optionnel)"
          onChange={(file) => setFormData({ ...formData, certificates: file })}
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
