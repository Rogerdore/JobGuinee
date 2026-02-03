import { JobFormData } from '../types/jobFormTypes';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateJobData(data: JobFormData, isDraft: boolean = false): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (isDraft) {
    if (!data.title || data.title.trim().length < 3) {
      warnings.push('Le titre doit contenir au moins 3 caractères');
    }
    if (!data.location || data.location.trim().length < 2) {
      warnings.push('La localisation est recommandée');
    }
    return {
      isValid: true,
      errors: [],
      warnings
    };
  }

  if (!data.title || data.title.trim().length < 3) {
    errors.push('Le titre doit contenir au moins 3 caractères');
  }

  if (data.title && data.title.length > 200) {
    errors.push('Le titre ne peut pas dépasser 200 caractères');
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  if (!data.application_email || !emailRegex.test(data.application_email)) {
    errors.push('Email de candidature invalide');
  }

  if (data.website) {
    try {
      const url = new URL(data.website);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push('URL du site web doit commencer par http:// ou https://');
      }
    } catch {
      errors.push('URL du site web invalide');
    }
  }

  const deadlineDate = new Date(data.deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!data.deadline) {
    errors.push('La date limite de candidature est obligatoire');
  } else if (deadlineDate < today) {
    errors.push('La date limite doit être dans le futur');
  } else if (deadlineDate > new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000)) {
    warnings.push('La date limite est supérieure à 6 mois (recommandé : 30-60 jours)');
  }

  if (!data.description || data.description.trim().length < 20) {
    errors.push('La description doit contenir au moins 20 caractères');
  }

  if (!data.location || data.location.trim().length < 2) {
    errors.push('La localisation est obligatoire (minimum 2 caractères)');
  }

  if (!data.company_name || data.company_name.trim().length < 2) {
    errors.push('Le nom de l\'entreprise est obligatoire (minimum 2 caractères)');
  }

  if (!data.legal_compliance) {
    errors.push('Vous devez accepter la conformité légale avec le Code du Travail Guinéen');
  }

  if (data.position_count < 1) {
    errors.push('Le nombre de postes doit être au moins 1');
  }

  if (data.position_count > 100) {
    warnings.push('Nombre de postes très élevé (>100). Vérifiez que c\'est correct.');
  }

  if (data.skills.length === 0) {
    warnings.push('Ajoutez des compétences clés pour améliorer le matching des candidats');
  }

  if (data.skills.length > 0 && data.skills.length < 3) {
    warnings.push('Recommandé : ajoutez au moins 5 compétences clés pour un meilleur matching');
  }

  if (!data.company_description || data.company_description.trim().length < 10) {
    warnings.push('Une description de l\'entreprise augmente l\'attractivité de l\'offre de 25%');
  }

  if (!data.salary_range) {
    warnings.push('Les offres avec salaire indiqué reçoivent 3x plus de candidatures');
  }

  if (!data.company_logo_url) {
    warnings.push('Un logo d\'entreprise augmente l\'attractivité de 40%');
  }

  if (data.benefits.length === 0) {
    warnings.push('Ajoutez des avantages pour rendre l\'offre plus attractive');
  }

  if (!data.responsibilities || data.responsibilities.trim().length < 20) {
    warnings.push('Précisez les missions principales pour attirer les bons profils');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateJobField(field: keyof JobFormData, value: any): string | null {
  switch (field) {
    case 'title':
      if (!value || value.trim().length < 3) {
        return 'Minimum 3 caractères requis';
      }
      if (value.length > 200) {
        return 'Maximum 200 caractères';
      }
      return null;

    case 'description':
      if (!value || value.trim().length < 20) {
        return 'Minimum 20 caractères requis';
      }
      if (value.length > 5000) {
        return 'Maximum 5000 caractères';
      }
      return null;

    case 'location':
      if (!value || value.trim().length < 2) {
        return 'Minimum 2 caractères requis';
      }
      return null;

    case 'company_name':
      if (!value || value.trim().length < 2) {
        return 'Minimum 2 caractères requis';
      }
      return null;

    case 'application_email':
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
      if (!value || !emailRegex.test(value)) {
        return 'Email invalide';
      }
      return null;

    case 'website':
      if (value) {
        try {
          const url = new URL(value);
          if (!['http:', 'https:'].includes(url.protocol)) {
            return 'URL doit commencer par http:// ou https://';
          }
        } catch {
          return 'URL invalide';
        }
      }
      return null;

    case 'deadline':
      if (!value) {
        return 'Date limite obligatoire';
      }
      const deadlineDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadlineDate < today) {
        return 'La date doit être dans le futur';
      }
      return null;

    case 'position_count':
      if (!value || value < 1) {
        return 'Minimum 1 poste requis';
      }
      return null;

    default:
      return null;
  }
}
