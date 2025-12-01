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

export function calculateCandidateCompletion(candidateProfile: any, profile?: any): number {
  let score = 0;

  if (profile?.full_name?.trim()) score += 10;
  if (profile?.phone?.trim()) score += 10;
  if (candidateProfile?.title?.trim()) score += 15;
  if (candidateProfile?.bio?.trim()) score += 15;
  if (candidateProfile?.location?.trim()) score += 10;
  if (candidateProfile?.experience_years !== undefined && candidateProfile.experience_years >= 0) score += 10;
  if (candidateProfile?.skills && candidateProfile.skills.length > 0) score += 10;
  if (candidateProfile?.languages && candidateProfile.languages.length > 0) score += 5;
  if (candidateProfile?.cv_url?.trim()) score += 10;
  if (candidateProfile?.education && Array.isArray(candidateProfile.education) && candidateProfile.education.length > 0) score += 5;
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

export function getMissingCandidateFields(candidateProfile: any, profile?: any): string[] {
  const missing: string[] = [];
  if (!profile?.full_name?.trim()) missing.push('Nom complet');
  if (!profile?.phone?.trim()) missing.push('Téléphone');
  if (!candidateProfile?.title?.trim()) missing.push('Titre professionnel');
  if (!candidateProfile?.bio?.trim()) missing.push('Présentation');
  if (!candidateProfile?.location?.trim()) missing.push('Localisation');
  if (candidateProfile?.experience_years === undefined || candidateProfile.experience_years < 0) missing.push('Années d\'expérience');
  if (!candidateProfile?.skills || candidateProfile.skills.length === 0) missing.push('Compétences');
  if (!candidateProfile?.languages || candidateProfile.languages.length === 0) missing.push('Langues');
  if (!candidateProfile?.cv_url?.trim()) missing.push('CV');
  if (!candidateProfile?.education || !Array.isArray(candidateProfile.education) || candidateProfile.education.length === 0) missing.push('Formation');
  return missing;
}
