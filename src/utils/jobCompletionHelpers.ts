import { JobFormData } from '../components/recruiter/JobPublishForm';

export function calculateJobCompletion(formData: JobFormData): number {
  const fields = [
    { value: formData.title, weight: 10 },
    { value: formData.category, weight: 5 },
    { value: formData.contract_type, weight: 5 },
    { value: formData.deadline, weight: 10 },
    { value: formData.description, weight: 15 },
    { value: formData.responsibilities, weight: 10 },
    { value: formData.profile, weight: 10 },
    { value: formData.skills.length > 0, weight: 8 },
    { value: formData.education_level, weight: 5 },
    { value: formData.experience_required, weight: 5 },
    { value: formData.company_name, weight: 8 },
    { value: formData.sector, weight: 5 },
    { value: formData.location, weight: 10 },
    { value: formData.application_email, weight: 8 },
    { value: formData.legal_compliance, weight: 10 },
  ];

  let totalWeight = 0;
  let earnedWeight = 0;

  fields.forEach(field => {
    totalWeight += field.weight;
    if (field.value) {
      earnedWeight += field.weight;
    }
  });

  return Math.round((earnedWeight / totalWeight) * 100);
}

export function getJobCompletionStatus(percentage: number): {
  color: string;
  bgColor: string;
  label: string;
} {
  if (percentage === 100) {
    return {
      color: 'text-green-700',
      bgColor: 'bg-green-500',
      label: 'Offre complète'
    };
  } else if (percentage >= 70) {
    return {
      color: 'text-blue-700',
      bgColor: 'bg-blue-500',
      label: 'Presque terminé'
    };
  } else if (percentage >= 40) {
    return {
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-500',
      label: 'En progression'
    };
  } else {
    return {
      color: 'text-orange-700',
      bgColor: 'bg-orange-500',
      label: 'À compléter'
    };
  }
}

export function getMissingJobFields(formData: JobFormData): string[] {
  const missingFields: string[] = [];

  if (!formData.title) missingFields.push('Titre du poste');
  if (!formData.deadline) missingFields.push('Date limite');
  if (!formData.description) missingFields.push('Description du poste');
  if (!formData.responsibilities) missingFields.push('Missions principales');
  if (!formData.profile) missingFields.push('Profil recherché');
  if (formData.skills.length === 0) missingFields.push('Compétences clés');
  if (!formData.company_name) missingFields.push('Nom de l\'entreprise');
  if (!formData.location) missingFields.push('Localisation');
  if (!formData.application_email) missingFields.push('Email de candidature');
  if (!formData.legal_compliance) missingFields.push('Conformité légale');

  return missingFields;
}

export function validateJobField(field: keyof JobFormData, value: any): string {
  switch (field) {
    case 'title':
      if (!value || value.trim().length < 5) {
        return 'Le titre doit contenir au moins 5 caractères';
      }
      break;
    case 'description':
      if (!value || value.trim().length < 50) {
        return 'La description doit contenir au moins 50 caractères';
      }
      break;
    case 'application_email':
      if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Email invalide';
      }
      break;
    case 'deadline':
      if (!value) {
        return 'Date limite requise';
      }
      const deadlineDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        return 'La date limite doit être dans le futur';
      }
      break;
    case 'website':
      if (value && !/^https?:\/\/.+/.test(value)) {
        return 'URL invalide (doit commencer par http:// ou https://)';
      }
      break;
    case 'company_name':
      if (!value || value.trim().length < 2) {
        return 'Le nom de l\'entreprise doit contenir au moins 2 caractères';
      }
      break;
    case 'location':
      if (!value || value.trim().length < 2) {
        return 'La localisation doit contenir au moins 2 caractères';
      }
      break;
  }
  return '';
}
