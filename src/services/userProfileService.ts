import { supabase } from '../lib/supabase';

export interface CandidateProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  bio: string;
  skills: string[];
  experience: any[];
  education: any[];
  languages: string[];
  [key: string]: any;
}

export interface CandidateCV {
  id: string;
  user_id: string;
  cv_data: any;
  created_at: string;
  updated_at: string;
}

export interface CVInputData {
  nom: string;
  titre: string;
  email: string;
  telephone: string;
  lieu: string;
  resume: string;
  competences: string[];
  experiences: Array<{
    poste: string;
    entreprise: string;
    periode: string;
    missions: string[];
  }>;
  formations: Array<{
    diplome: string;
    ecole: string;
    annee: string;
  }>;
}

export class UserProfileService {
  /**
   * Récupère le profil candidat depuis candidate_profiles
   */
  static async getCandidateProfile(userId: string): Promise<CandidateProfile | null> {
    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error loading candidate profile:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getCandidateProfile:', error);
      return null;
    }
  }

  /**
   * Récupère le CV candidat depuis candidate_cv
   */
  static async getCandidateCV(userId: string): Promise<CandidateCV | null> {
    try {
      const { data, error } = await supabase
        .from('candidate_cv')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading candidate CV:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in getCandidateCV:', error);
      return null;
    }
  }

  /**
   * Assemble les données du profil automatique en format input IA
   */
  static assembleAutoInput(
    profile: CandidateProfile | null,
    cv: CandidateCV | null
  ): CVInputData {
    if (!profile) {
      return this.getEmptyInput();
    }

    const cvData = cv?.cv_data || {};

    const experiences = (profile.experience || cvData.experience || []).map((exp: any) => ({
      poste: exp.position || exp.title || exp.poste || '',
      entreprise: exp.company || exp.entreprise || '',
      periode: exp.period ||
               (exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Présent'}` : '') ||
               exp.periode || '',
      missions: Array.isArray(exp.missions)
        ? exp.missions
        : (exp.description ? [exp.description] : [])
    }));

    const formations = (profile.education || cvData.education || []).map((edu: any) => ({
      diplome: edu.degree || edu.diploma || edu.diplome || '',
      ecole: edu.institution || edu.school || edu.ecole || '',
      annee: edu.year || edu.graduation_year || edu.annee || ''
    }));

    const competences = profile.skills || cvData.skills || [];

    return {
      nom: profile.full_name || cvData.full_name || '',
      titre: profile.title || cvData.title || '',
      email: profile.email || cvData.email || '',
      telephone: profile.phone || cvData.phone || '',
      lieu: profile.location || cvData.location || '',
      resume: profile.bio || cvData.summary || cvData.bio || '',
      competences: Array.isArray(competences) ? competences : [],
      experiences,
      formations
    };
  }

  /**
   * Assemble les données de saisie manuelle en format input IA
   */
  static assembleManualInput(formData: any): CVInputData {
    return {
      nom: formData.nom || formData.fullName || '',
      titre: formData.titre || formData.title || '',
      email: formData.email || '',
      telephone: formData.telephone || formData.phone || '',
      lieu: formData.lieu || formData.location || '',
      resume: formData.resume || formData.summary || formData.bio || '',
      competences: Array.isArray(formData.competences)
        ? formData.competences
        : (Array.isArray(formData.skills) ? formData.skills : []),
      experiences: (formData.experiences || formData.experience || []).map((exp: any) => ({
        poste: exp.poste || exp.position || exp.title || '',
        entreprise: exp.entreprise || exp.company || '',
        periode: exp.periode || exp.period || '',
        missions: exp.missions || (exp.description ? [exp.description] : [])
      })),
      formations: (formData.formations || formData.education || []).map((edu: any) => ({
        diplome: edu.diplome || edu.degree || '',
        ecole: edu.ecole || edu.institution || edu.school || '',
        annee: edu.annee || edu.year || ''
      }))
    };
  }

  /**
   * Retourne un objet vide conforme au schema
   */
  static getEmptyInput(): CVInputData {
    return {
      nom: '',
      titre: '',
      email: '',
      telephone: '',
      lieu: '',
      resume: '',
      competences: [],
      experiences: [],
      formations: []
    };
  }

  /**
   * Valide que les données minimales sont présentes
   */
  static validateMinimalData(data: CVInputData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.nom || data.nom.trim() === '') {
      errors.push('Le nom est obligatoire');
    }

    if (!data.titre || data.titre.trim() === '') {
      errors.push('Le titre professionnel est obligatoire');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Charge toutes les données utilisateur (profil + CV)
   */
  static async loadUserData(userId: string): Promise<{
    success: boolean;
    profile: CandidateProfile | null;
    cv: CandidateCV | null;
    inputData: CVInputData;
  }> {
    const profile = await this.getCandidateProfile(userId);
    const cv = await this.getCandidateCV(userId);
    const inputData = this.assembleAutoInput(profile, cv);

    return {
      success: true,
      profile,
      cv,
      inputData
    };
  }
}

export default UserProfileService;
