import { supabase } from '../lib/supabase';

/**
 * Service de validation pour la candidature rapide
 * Vérifie que le profil candidat contient toutes les données obligatoires
 */

export interface ValidationResult {
  isEligible: boolean;
  missingFields: MissingField[];
  profileData?: {
    full_name?: string;
    email?: string;
    phone?: string;
    cv_url?: string;
    professional_summary?: string;
  };
}

export interface MissingField {
  field: string;
  label: string;
  description: string;
  required: boolean;
  isJobSpecific?: boolean;
}

/**
 * Vérifie l'éligibilité d'un candidat pour la candidature rapide
 * @param candidateId - ID du candidat
 * @param jobId - ID de l'offre
 * @returns Résultat de la validation avec les champs manquants
 */
export async function checkFastApplicationEligibility(
  candidateId: string,
  jobId: string
): Promise<ValidationResult> {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', candidateId)
      .single();

    const { data: candidateProfile } = await supabase
      .from('candidate_profiles')
      .select('cv_url, bio, full_name, phone')
      .eq('profile_id', candidateId)
      .maybeSingle();

    const { data: job } = await supabase
      .from('jobs')
      .select('cover_letter_required')
      .eq('id', jobId)
      .single();

    if (!profile) {
      return {
        isEligible: false,
        missingFields: [{
          field: 'profile',
          label: 'Profil',
          description: 'Profil non trouvé',
          required: true
        }]
      };
    }

    const missingFields: MissingField[] = [];

    const fullName = profile.full_name || candidateProfile?.full_name;
    const phone = profile.phone || candidateProfile?.phone;

    if (!fullName || fullName.trim() === '') {
      missingFields.push({
        field: 'full_name',
        label: 'Nom complet',
        description: 'Votre nom et prénom sont requis',
        required: true
      });
    }

    if (!profile.email || profile.email.trim() === '') {
      missingFields.push({
        field: 'email',
        label: 'Email',
        description: 'Une adresse email valide est requise',
        required: true
      });
    }

    if (!phone || phone.trim() === '') {
      missingFields.push({
        field: 'phone',
        label: 'Téléphone',
        description: 'Un numéro de téléphone est requis pour vous contacter',
        required: true
      });
    }

    if (!candidateProfile?.cv_url || candidateProfile.cv_url.trim() === '') {
      missingFields.push({
        field: 'cv_url',
        label: 'CV',
        description: 'Un CV est obligatoire pour toute candidature',
        required: true
      });
    }

    if (job?.cover_letter_required) {
      if (!candidateProfile?.bio || candidateProfile.bio.trim() === '') {
        missingFields.push({
          field: 'bio',
          label: 'Lettre de motivation',
          description: 'Cette offre exige une lettre de motivation (résumé professionnel)',
          required: true,
          isJobSpecific: true
        });
      }
    }

    return {
      isEligible: missingFields.length === 0,
      missingFields,
      profileData: {
        full_name: fullName,
        email: profile.email,
        phone: phone,
        cv_url: candidateProfile?.cv_url,
        professional_summary: candidateProfile?.bio
      }
    };

  } catch (error) {
    console.error('Error checking fast application eligibility:', error);
    return {
      isEligible: false,
      missingFields: [{
        field: 'error',
        label: 'Erreur',
        description: 'Impossible de vérifier votre profil',
        required: true
      }]
    };
  }
}

/**
 * Récupère les données du profil pour affichage
 */
export async function getProfileCompletionStatus(candidateId: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .eq('id', candidateId)
      .single();

    const { data: candidateProfile } = await supabase
      .from('candidate_profiles')
      .select('*')
      .eq('profile_id', candidateId)
      .maybeSingle();

    return {
      hasName: !!(profile?.full_name && profile.full_name.trim()),
      hasEmail: !!(profile?.email && profile.email.trim()),
      hasPhone: !!(profile?.phone && profile.phone.trim()),
      hasCV: !!(candidateProfile?.cv_url && candidateProfile.cv_url.trim()),
      hasProfessionalSummary: !!(candidateProfile?.bio && candidateProfile.bio.trim()),
      profileCompletionPercentage: candidateProfile?.profile_completion_percentage || 0
    };
  } catch (error) {
    console.error('Error getting profile completion status:', error);
    return {
      hasName: false,
      hasEmail: false,
      hasPhone: false,
      hasCV: false,
      hasProfessionalSummary: false,
      profileCompletionPercentage: 0
    };
  }
}

export const fastApplicationValidator = {
  checkEligibility: checkFastApplicationEligibility,
  getProfileStatus: getProfileCompletionStatus
};
