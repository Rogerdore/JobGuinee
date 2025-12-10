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
        .eq('user_id', userId)
        .maybeSingle();

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
        .maybeSingle();

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
   * Fusion intelligente profile + cv_parsed_data avec déduplication
   */
  static assembleAutoInput(
    profile: CandidateProfile | null,
    cv: CandidateCV | null
  ): CVInputData {
    if (!profile) {
      return this.getEmptyInput();
    }

    const cvData = cv?.cv_data || {};

    // Expériences : CV prioritaire (plus détaillé)
    const experiences = ((cvData.experience || cvData.experiences) || profile.work_experience || [])
      .map((exp: any) => ({
        poste: exp.position || exp.title || exp.poste || '',
        entreprise: exp.company || exp.entreprise || '',
        periode: exp.period ||
                 (exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Présent'}` : '') ||
                 exp.periode || '',
        missions: Array.isArray(exp.missions)
          ? exp.missions
          : Array.isArray(exp.tasks) ? exp.tasks
          : (exp.description ? [exp.description] : [])
      }));

    // Formations : fusion avec déduplication
    const formationsMap = new Map();

    // D'abord CV
    (cvData.education || cvData.formations || []).forEach((edu: any) => {
      const key = `${edu.degree || edu.diploma || edu.diplome}`.toLowerCase();
      formationsMap.set(key, {
        diplome: edu.degree || edu.diploma || edu.diplome || '',
        ecole: edu.institution || edu.school || edu.ecole || '',
        annee: edu.year || edu.graduation_year || edu.annee || ''
      });
    });

    // Puis profil (complément)
    (profile.education || []).forEach((edu: any) => {
      const key = `${edu.degree || edu.diploma || edu.diplome}`.toLowerCase();
      if (!formationsMap.has(key)) {
        formationsMap.set(key, {
          diplome: edu.degree || edu.diploma || edu.diplome || '',
          ecole: edu.institution || edu.school || edu.ecole || '',
          annee: edu.year || edu.graduation_year || edu.annee || ''
        });
      }
    });

    const formations = Array.from(formationsMap.values());

    // Compétences : fusion avec déduplication et normalisation
    const skillsSet = new Set<string>();

    // CV skills
    (cvData.skills || []).forEach((skill: string) => {
      if (skill && typeof skill === 'string') {
        skillsSet.add(skill.trim().toLowerCase());
      }
    });

    // Tools du CV
    (cvData.tools || []).forEach((tool: string) => {
      if (tool && typeof tool === 'string') {
        skillsSet.add(tool.trim().toLowerCase());
      }
    });

    // Profil skills
    (profile.skills || []).forEach((skill: string) => {
      if (skill && typeof skill === 'string') {
        skillsSet.add(skill.trim().toLowerCase());
      }
    });

    const competences = Array.from(skillsSet).map(s =>
      s.charAt(0).toUpperCase() + s.slice(1)
    );

    return {
      nom: profile.full_name || cvData.full_name || cvData.name || '',
      titre: profile.title || profile.desired_position || cvData.title || cvData.position || '',
      email: profile.email || cvData.email || '',
      telephone: profile.phone || cvData.phone || cvData.telephone || '',
      lieu: profile.location || cvData.location || cvData.lieu || '',
      resume: profile.bio || cvData.summary || cvData.bio || cvData.resume || '',
      competences: competences.filter(c => c.length > 0),
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
      success: profile !== null,
      profile,
      cv,
      inputData
    };
  }

  /**
   * Build input for Cover Letter service
   */
  static buildCoverLetterInputFromProfile(
    profile: CandidateProfile | null,
    cv: CandidateCV | null,
    jobData?: {
      title: string;
      company: string;
      description?: string;
      requirements?: string[];
    }
  ): any {
    if (!profile) {
      return {
        nom: '',
        poste_cible: jobData?.title || '',
        entreprise: jobData?.company || '',
        date: new Date().toLocaleDateString('fr-FR'),
        extrait_offre: jobData?.description || '',
        competences_candidat: [],
        ton: 'moderne'
      };
    }

    return {
      nom: profile.full_name || '',
      poste_cible: jobData?.title || profile.title || '',
      entreprise: jobData?.company || '',
      date: new Date().toLocaleDateString('fr-FR'),
      extrait_offre: jobData?.description || '',
      competences_candidat: profile.skills || [],
      ton: 'moderne'
    };
  }

  /**
   * Build input for Matching service - SIMPLE FORMAT
   */
  static buildMatchingInputFromProfile(
    profile: CandidateProfile | null,
    cv?: CandidateCV | null
  ): any {
    if (!profile && !cv) {
      return {
        competences: [],
        experience: 0,
        niveau_etude: '',
        localisation_preferee: '',
        type_contrat_prefere: 'CDI',
        secteur_prefere: ''
      };
    }

    const cvData = cv?.cv_data || {};
    const workExperience = profile?.work_experience || [];
    const experienceYears = profile?.experience_years || workExperience.length || 0;

    const formations = (profile?.education || cvData.education || [])
      .map((edu: any) => edu['Diplôme obtenu'] || edu.degree || edu.diploma || '')
      .filter(Boolean);

    return {
      competences: profile?.skills || cvData.competences || [],
      experience: experienceYears,
      niveau_etude: profile?.education_level || '',
      localisation_preferee: profile?.location || '',
      type_contrat_prefere: 'CDI',
      secteur_prefere: profile?.desired_sectors?.[0] || ''
    };
  }

  /**
   * Build COMPLETE MATCHING INPUT for IA Service
   * Fuses profile + CV + job offer with full details for AI analysis
   */
  static buildCompleteMatchingInput(
    profile: CandidateProfile | null,
    cv: CandidateCV | null,
    jobOffer?: {
      id?: string;
      title?: string;
      description?: string;
      location?: string;
      salary_min?: number;
      salary_max?: number;
      contract_type?: string;
      required_skills?: string[];
      preferred_skills?: string[];
      min_experience?: number;
      education_level?: string;
      languages?: string[];
      sector?: string;
    }
  ): any {
    const cvData = cv?.cv_data || {};

    // Fused candidate profile
    const candidate_profile = {
      full_name: profile?.full_name || cvData.full_name || cvData.name || '',
      title: profile?.title || profile?.desired_position || cvData.title || cvData.position || '',
      email: profile?.email || cvData.email || '',
      phone: profile?.phone || cvData.phone || cvData.telephone || '',
      location: profile?.location || cvData.location || cvData.lieu || '',
      bio: profile?.bio || cvData.summary || cvData.bio || cvData.resume || '',

      // Competencies (deduplicated)
      skills: this.mergeDedupSkills(profile, cvData),

      // Experience details
      work_experience: ((cvData.experience || cvData.experiences) || profile?.work_experience || [])
        .map((exp: any) => ({
          position: exp.position || exp.title || exp.poste || '',
          company: exp.company || exp.entreprise || '',
          period: exp.period || (exp.start_date ? `${exp.start_date} - ${exp.end_date || 'Présent'}` : '') || exp.periode || '',
          missions: Array.isArray(exp.missions) ? exp.missions : Array.isArray(exp.tasks) ? exp.tasks : (exp.description ? [exp.description] : []),
          achievements: exp.achievements || exp.realisations || []
        })),

      years_of_experience: profile?.experience_years ||
                          ((cvData.experience || cvData.experiences) || profile?.work_experience || []).length || 0,

      // Education
      education: this.mergeDedupEducation(profile, cvData),
      education_level: profile?.education_level || cvData.education_level || 'Non spécifié',

      // Languages
      languages: (profile?.languages || cvData.languages || [])
        .filter((l: any) => l)
        .map((lang: any) => typeof lang === 'string' ? lang : lang.language || lang.name || ''),

      // Additional info
      location_mobility: profile?.mobility || [],
      availability: profile?.availability || 'Immédiate',
      desired_salary_min: profile?.desired_salary_min || null,
      desired_salary_max: profile?.desired_salary_max || null,
      desired_sectors: profile?.desired_sectors || [],
      certifications: cvData.certifications || [],
      tools_technologies: cvData.tools || []
    };

    // Job offer
    const job_offer = {
      id: jobOffer?.id || '',
      title: jobOffer?.title || '',
      description: jobOffer?.description || '',
      sector: jobOffer?.sector || '',
      location: jobOffer?.location || '',
      contract_type: jobOffer?.contract_type || 'CDI',
      salary_min: jobOffer?.salary_min || null,
      salary_max: jobOffer?.salary_max || null,
      required_skills: jobOffer?.required_skills || [],
      preferred_skills: jobOffer?.preferred_skills || [],
      min_experience: jobOffer?.min_experience || 0,
      required_education_level: jobOffer?.education_level || 'BAC',
      required_languages: jobOffer?.languages || ['Français']
    };

    return {
      candidate_profile,
      job_offer,
      analysis_context: {
        merged_from: ['candidate_profile', 'cv_parsed_data', 'job_offer'],
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Helper: Merge and deduplicate skills
   */
  private static mergeDedupSkills(profile: CandidateProfile | null, cvData: any): string[] {
    const skillsSet = new Set<string>();

    // CV skills
    (cvData.skills || []).forEach((skill: string) => {
      if (skill && typeof skill === 'string') {
        skillsSet.add(skill.trim());
      }
    });

    // CV tools
    (cvData.tools || []).forEach((tool: string) => {
      if (tool && typeof tool === 'string') {
        skillsSet.add(tool.trim());
      }
    });

    // Profile skills
    (profile?.skills || []).forEach((skill: string) => {
      if (skill && typeof skill === 'string') {
        skillsSet.add(skill.trim());
      }
    });

    return Array.from(skillsSet).filter(s => s.length > 0);
  }

  /**
   * Helper: Merge and deduplicate education
   */
  private static mergeDedupEducation(profile: CandidateProfile | null, cvData: any): any[] {
    const educationMap = new Map();

    // CV education first (priority)
    (cvData.education || cvData.formations || []).forEach((edu: any) => {
      const key = `${edu.degree || edu.diploma || edu.diplome}${edu.institution || edu.school || edu.ecole}`.toLowerCase();
      educationMap.set(key, {
        degree: edu.degree || edu.diploma || edu.diplome || '',
        school: edu.institution || edu.school || edu.ecole || '',
        graduation_year: edu.year || edu.graduation_year || edu.annee || '',
        field: edu.field || edu.domaine || ''
      });
    });

    // Profile education (complement)
    (profile?.education || []).forEach((edu: any) => {
      const key = `${edu.degree || edu.diploma}${edu.institution || edu.school}`.toLowerCase();
      if (!educationMap.has(key)) {
        educationMap.set(key, {
          degree: edu.degree || edu.diploma || '',
          school: edu.institution || edu.school || '',
          graduation_year: edu.year || edu.graduation_year || '',
          field: edu.field || edu.domaine || ''
        });
      }
    });

    return Array.from(educationMap.values());
  }

  /**
   * Build input for Career Plan service
   */
  static buildCareerPlanInputFromProfile(
    profile: CandidateProfile | null,
    cv: CandidateCV | null
  ): any {
    if (!profile) {
      return {
        profil_actuel: {
          poste: '',
          competences: [],
          experience_annees: 0
        },
        objectif: '',
        horizon: '3_ans',
        contraintes: ''
      };
    }

    const experienceYears = profile.experience?.length || 0;
    const currentJob = profile.experience?.[0];

    return {
      profil_actuel: {
        poste: currentJob?.position || currentJob?.title || profile.title || '',
        competences: profile.skills || [],
        experience_annees: experienceYears
      },
      objectif: profile.bio || '',
      horizon: '3_ans',
      contraintes: ''
    };
  }

  /**
   * Get job application data for candidate
   */
  static async getCandidateApplications(userId: string, jobId?: string): Promise<any[]> {
    try {
      let query = supabase
        .from('candidate_applications')
        .select(`
          *,
          jobs:job_id(
            title,
            description,
            required_skills,
            min_experience,
            companies(name)
          )
        `)
        .eq('candidate_id', userId);

      if (jobId) {
        query = query.eq('job_id', jobId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading applications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getCandidateApplications:', error);
      return [];
    }
  }
}

export default UserProfileService;
