export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: true };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Format d\'email invalide'
    };
  }

  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: true };
  }

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  const phoneRegex = /^(\+224|00224)?[0-9]{8,12}$/;

  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Format de téléphone invalide (ex: +224 XXX XX XX XX)'
    };
  }

  return { isValid: true };
};

export const validateLinkedInUrl = (url: string): ValidationResult => {
  if (!url) {
    return { isValid: true };
  }

  const linkedInRegex = /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w\-]+\/?$/;

  if (!linkedInRegex.test(url)) {
    return {
      isValid: false,
      error: 'URL LinkedIn invalide (ex: https://linkedin.com/in/votre-profil)'
    };
  }

  return { isValid: true };
};

export const validateWebsiteUrl = (url: string): ValidationResult => {
  if (!url) {
    return { isValid: true };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        isValid: false,
        error: 'L\'URL doit commencer par http:// ou https://'
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Format d\'URL invalide'
    };
  }
};

export const validateAllRecruiterFields = (
  profileData: {
    professional_email?: string;
    phone?: string;
    linkedin_url?: string;
  },
  companyData: {
    email?: string;
    phone?: string;
    website?: string;
  }
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const professionalEmailValidation = validateEmail(profileData.professional_email || '');
  if (!professionalEmailValidation.isValid && professionalEmailValidation.error) {
    errors.professional_email = professionalEmailValidation.error;
  }

  const phoneValidation = validatePhone(profileData.phone || '');
  if (!phoneValidation.isValid && phoneValidation.error) {
    errors.phone = phoneValidation.error;
  }

  const linkedInValidation = validateLinkedInUrl(profileData.linkedin_url || '');
  if (!linkedInValidation.isValid && linkedInValidation.error) {
    errors.linkedin_url = linkedInValidation.error;
  }

  const companyEmailValidation = validateEmail(companyData.email || '');
  if (!companyEmailValidation.isValid && companyEmailValidation.error) {
    errors.company_email = companyEmailValidation.error;
  }

  const companyPhoneValidation = validatePhone(companyData.phone || '');
  if (!companyPhoneValidation.isValid && companyPhoneValidation.error) {
    errors.company_phone = companyPhoneValidation.error;
  }

  const websiteValidation = validateWebsiteUrl(companyData.website || '');
  if (!websiteValidation.isValid && websiteValidation.error) {
    errors.website = websiteValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
