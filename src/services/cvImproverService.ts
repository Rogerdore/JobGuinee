import { IAConfigService } from './iaConfigService';
import { CVInputData } from './userProfileService';

export interface CVImproverOptions {
  existingCV: string;
  format?: 'text' | 'html' | 'markdown';
  improvements?: string[];
  templateId?: string;
}

export interface CVImproverResult {
  success: boolean;
  improved: string;
  format: string;
  changes?: string[];
  error?: string;
}

export class CVImproverService {
  static async improveCV(options: CVImproverOptions): Promise<CVImproverResult> {
    try {
      const serviceCode = 'ai_cv_improvement';

      const config = await IAConfigService.getConfig(serviceCode);
      if (!config) {
        return {
          success: false,
          improved: '',
          format: 'html',
          error: 'Configuration IA non trouvée'
        };
      }

      const extractedData = await this.extractCVData(options.existingCV, options.format || 'text');

      const inputData = {
        cv_existant: options.existingCV,
        format_source: options.format || 'text',
        ameliorations_demandees: options.improvements || [
          'Structure professionnelle',
          'Clarté et concision',
          'Mise en valeur des compétences',
          'Optimisation pour ATS'
        ],
        ...extractedData
      };

      const template = options.templateId
        ? await IAConfigService.getTemplate(options.templateId)
        : await IAConfigService.getDefaultTemplate(serviceCode);

      if (!template) {
        return {
          success: false,
          improved: '',
          format: 'html',
          error: 'Template non trouvé'
        };
      }

      const improvedContent = IAConfigService.applyTemplate(inputData, template.template_structure);

      const changes = [
        'Structure réorganisée',
        'Formulations optimisées',
        'Mise en page améliorée',
        'Mots-clés ATS ajoutés'
      ];

      return {
        success: true,
        improved: improvedContent,
        format: template.format,
        changes
      };
    } catch (error) {
      console.error('Error in improveCV:', error);
      return {
        success: false,
        improved: '',
        format: 'html',
        error: (error as Error).message
      };
    }
  }

  static async extractCVData(
    cvContent: string,
    format: string
  ): Promise<Partial<CVInputData>> {
    try {
      const lines = cvContent.split('\n');
      const data: Partial<CVInputData> = {
        nom: '',
        titre: '',
        email: '',
        telephone: '',
        resume: '',
        competences: [],
        experiences: [],
        formations: []
      };

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.includes('@')) {
          const emailMatch = trimmed.match(/[\w.-]+@[\w.-]+\.\w+/);
          if (emailMatch) data.email = emailMatch[0];
        }

        if (trimmed.match(/\+?\d{3}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}/)) {
          data.telephone = trimmed;
        }

        if (trimmed.toLowerCase().includes('compétence') ||
            trimmed.toLowerCase().includes('skill')) {
          const nextLines = lines.slice(lines.indexOf(line) + 1, lines.indexOf(line) + 10);
          data.competences = nextLines
            .filter(l => l.trim() && !l.includes(':'))
            .map(l => l.trim().replace(/^[-•*]\s*/, ''))
            .slice(0, 8);
        }
      }

      return data;
    } catch (error) {
      console.error('Error extracting CV data:', error);
      return {};
    }
  }

  static async analyzeCVQuality(cvContent: string): Promise<{
    score: number;
    strengths: string[];
    improvements: string[];
  }> {
    const strengths: string[] = [];
    const improvements: string[] = [];
    let score = 50;

    if (cvContent.length > 500) {
      strengths.push('Contenu détaillé');
      score += 10;
    } else {
      improvements.push('Ajouter plus de détails');
    }

    if (cvContent.match(/\b(?:réalisé|développé|géré|dirigé|optimisé)\b/gi)) {
      strengths.push('Verbes d\'action utilisés');
      score += 15;
    } else {
      improvements.push('Utiliser des verbes d\'action');
    }

    if (cvContent.includes('@')) {
      strengths.push('Coordonnées présentes');
      score += 10;
    } else {
      improvements.push('Ajouter coordonnées complètes');
    }

    if (cvContent.match(/\d+\s*(?:ans|années)/i)) {
      strengths.push('Expérience quantifiée');
      score += 15;
    } else {
      improvements.push('Quantifier les réalisations');
    }

    return {
      score: Math.min(score, 100),
      strengths,
      improvements
    };
  }
}
