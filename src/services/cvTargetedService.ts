import { IAConfigService } from './iaConfigService';
import { CVInputData } from './userProfileService';
import { supabase } from '../lib/supabase';

export interface JobOffer {
  id?: string;
  title: string;
  company: string;
  description: string;
  required_skills?: string[];
  min_experience?: number;
  keywords?: string[];
}

export interface CVTargetedOptions {
  cvData: CVInputData;
  jobOffer: JobOffer;
  templateId?: string;
}

export interface CVTargetedResult {
  success: boolean;
  targeted: string;
  format: string;
  matchScore?: number;
  optimizations?: string[];
  error?: string;
}

export class CVTargetedService {
  static async targetCV(options: CVTargetedOptions): Promise<CVTargetedResult> {
    try {
      const serviceCode = 'ai_cv_targeted';

      const config = await IAConfigService.getConfig(serviceCode);
      if (!config) {
        return {
          success: false,
          targeted: '',
          format: 'html',
          error: 'Configuration IA non trouvée'
        };
      }

      const analysis = this.analyzeJobMatch(options.cvData, options.jobOffer);

      const inputData = {
        nom: options.cvData.nom,
        titre: options.cvData.titre,
        email: options.cvData.email,
        telephone: options.cvData.telephone,
        lieu: options.cvData.lieu,
        resume: options.cvData.resume,
        competences: options.cvData.competences,
        experiences: options.cvData.experiences,
        formations: options.cvData.formations,
        offre: {
          titre: options.jobOffer.title,
          entreprise: options.jobOffer.company,
          description: options.jobOffer.description,
          competences_requises: options.jobOffer.required_skills || [],
          experience_requise: options.jobOffer.min_experience || 0
        },
        optimisation: {
          competences_a_mettre_en_avant: analysis.skillsToHighlight,
          mots_cles_ats: analysis.atsKeywords,
          experiences_pertinentes: analysis.relevantExperiences
        }
      };

      const template = options.templateId
        ? await IAConfigService.getTemplate(options.templateId)
        : await IAConfigService.getDefaultTemplate(serviceCode);

      if (!template) {
        return {
          success: false,
          targeted: '',
          format: 'html',
          error: 'Template non trouvé'
        };
      }

      const targetedContent = IAConfigService.applyTemplate(inputData, template.template_structure);

      const optimizations = [
        `${analysis.skillsToHighlight.length} compétences mises en avant`,
        `${analysis.atsKeywords.length} mots-clés ATS intégrés`,
        'Expériences réorganisées par pertinence',
        'Résumé adapté au poste ciblé'
      ];

      return {
        success: true,
        targeted: targetedContent,
        format: template.format,
        matchScore: analysis.matchScore,
        optimizations
      };
    } catch (error) {
      console.error('Error in targetCV:', error);
      return {
        success: false,
        targeted: '',
        format: 'html',
        error: (error as Error).message
      };
    }
  }

  static analyzeJobMatch(
    cvData: CVInputData,
    jobOffer: JobOffer
  ): {
    matchScore: number;
    skillsToHighlight: string[];
    atsKeywords: string[];
    relevantExperiences: number[];
  } {
    const candidateSkills = cvData.competences.map(s => s.toLowerCase());
    const requiredSkills = (jobOffer.required_skills || []).map(s => s.toLowerCase());

    const matchingSkills = candidateSkills.filter(skill =>
      requiredSkills.some(req =>
        skill.includes(req) || req.includes(skill)
      )
    );

    const matchScore = requiredSkills.length > 0
      ? Math.round((matchingSkills.length / requiredSkills.length) * 100)
      : 50;

    const atsKeywords = this.extractATSKeywords(jobOffer.description);

    const relevantExperiences = cvData.experiences
      .map((exp, index) => {
        const expText = `${exp.poste} ${exp.missions.join(' ')}`.toLowerCase();
        const relevance = atsKeywords.filter(keyword =>
          expText.includes(keyword.toLowerCase())
        ).length;
        return { index, relevance };
      })
      .filter(exp => exp.relevance > 0)
      .sort((a, b) => b.relevance - a.relevance)
      .map(exp => exp.index);

    return {
      matchScore,
      skillsToHighlight: matchingSkills,
      atsKeywords,
      relevantExperiences
    };
  }

  static extractATSKeywords(description: string): string[] {
    const keywords: string[] = [];
    const text = description.toLowerCase();

    const commonKeywords = [
      'expérience',
      'compétence',
      'maîtrise',
      'gestion',
      'développement',
      'analyse',
      'communication',
      'leadership',
      'organisation',
      'autonome',
      'équipe',
      'projet'
    ];

    for (const keyword of commonKeywords) {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    }

    const technicalMatch = text.match(/\b[A-Z][a-z]+(?:[A-Z][a-z]+)*\b/g);
    if (technicalMatch) {
      keywords.push(...technicalMatch.slice(0, 5));
    }

    return [...new Set(keywords)].slice(0, 10);
  }

  static async loadJobOffer(jobId: string): Promise<JobOffer | null> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          required_skills,
          min_experience,
          companies (
            name
          )
        `)
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error loading job offer:', error);
        return null;
      }

      return {
        id: data.id,
        title: data.title,
        company: (data.companies as any)?.name || 'Entreprise',
        description: data.description || '',
        required_skills: data.required_skills || [],
        min_experience: data.min_experience || 0
      };
    } catch (error) {
      console.error('Error in loadJobOffer:', error);
      return null;
    }
  }
}
