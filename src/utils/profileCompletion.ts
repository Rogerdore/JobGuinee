export function calculateRecruiterCompletion(profile: any, company?: any): number {
  let score = 0;
  if (profile.full_name?.trim()) score += 10;
  if (profile.job_title?.trim()) score += 10;
  if (profile.bio?.trim()) score += 10;
  if (profile.phone?.trim()) score += 10;
  if (company?.name?.trim()) score += 10;
  if (company?.description?.trim()) score += 10;
  if (company?.industry?.trim()) score += 10;
  if (company?.location?.trim()) score += 10;
  if (profile.linkedin_url?.trim()) score += 5;
  if (profile.avatar_url?.trim()) score += 5;
  if (company?.website?.trim()) score += 2;
  if (company?.address?.trim()) score += 2;
  if (company?.email?.trim()) score += 2;
  if (company?.phone?.trim()) score += 2;
  if (company?.benefits && company.benefits.length > 0) score += 2;
  return score;
}

export function calculateCandidateCompletion(profile: any): number {
  let score = 0;
  if (profile.full_name?.trim()) score += 10;
  if (profile.desired_position?.trim()) score += 10;
  if (profile.bio?.trim()) score += 10;
  if (profile.phone?.trim()) score += 10;
  if (profile.location?.trim()) score += 10;
  if (profile.experience_years !== undefined && profile.experience_years >= 0) score += 10;
  if (profile.education_level?.trim()) score += 10;
  if (profile.skills && profile.skills.length > 0) score += 10;
  if (profile.languages && profile.languages.length > 0) score += 4;
  if (profile.cv_url?.trim()) score += 4;
  if (profile.linkedin_url?.trim()) score += 4;
  if (profile.portfolio_url?.trim()) score += 4;
  if (profile.desired_salary_min?.trim() || profile.desired_salary_max?.trim()) score += 4;
  return score;
}

export function getCompletionStatus(percentage: number) {
  if (percentage < 50) {
    return {
      status: 'incomplete',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-300',
      message: 'Votre profil nécessite plus d\'informations',
      canSubscribePremium: false
    };
  } else if (percentage < 80) {
    return {
      status: 'incomplete',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      borderColor: 'border-orange-300',
      message: 'Complétez votre profil à 80% minimum pour souscrire au Premium',
      canSubscribePremium: false
    };
  } else if (percentage < 100) {
    return {
      status: 'good',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-300',
      message: 'Bon profil! Ajoutez plus de détails pour vous démarquer',
      canSubscribePremium: true
    };
  } else {
    return {
      status: 'excellent',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      message: 'Profil complet! Vous maximisez vos chances',
      canSubscribePremium: true
    };
  }
}

export function getMissingRecruiterFields(profile: any, company?: any): string[] {
  const missing: string[] = [];
  if (!profile.full_name?.trim()) missing.push('Nom complet');
  if (!profile.job_title?.trim()) missing.push('Poste/Fonction');
  if (!profile.bio?.trim()) missing.push('Biographie');
  if (!profile.phone?.trim()) missing.push('Téléphone personnel');
  if (!company?.name?.trim()) missing.push('Nom de l\'entreprise');
  if (!company?.description?.trim()) missing.push('Description de l\'entreprise');
  if (!company?.industry?.trim()) missing.push('Secteur d\'activité');
  if (!company?.location?.trim()) missing.push('Localisation de l\'entreprise');
  return missing;
}

export function getMissingCandidateFields(profile: any): string[] {
  const missing: string[] = [];
  if (!profile.full_name?.trim()) missing.push('Nom complet');
  if (!profile.desired_position?.trim()) missing.push('Poste recherché');
  if (!profile.bio?.trim()) missing.push('Présentation');
  if (!profile.phone?.trim()) missing.push('Téléphone');
  if (!profile.location?.trim()) missing.push('Localisation');
  if (profile.experience_years === undefined || profile.experience_years < 0) missing.push('Années d\'expérience');
  if (!profile.education_level?.trim()) missing.push('Niveau d\'études');
  if (!profile.skills || profile.skills.length === 0) missing.push('Compétences');
  return missing;
}
