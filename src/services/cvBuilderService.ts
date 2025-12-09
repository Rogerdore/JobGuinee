import { IAConfigService } from './iaConfigService';
import { CVInputData } from './userProfileService';

export interface CVBuilderOptions {
  data: CVInputData;
  templateId?: string;
  serviceCode?: string;
}

export interface CVBuilderResult {
  success: boolean;
  content: string;
  format: string;
  error?: string;
}

export class CVBuilderService {
  static async buildCV(options: CVBuilderOptions): Promise<CVBuilderResult> {
    try {
      const serviceCode = options.serviceCode || 'ai_cv_generation';

      const config = await IAConfigService.getConfig(serviceCode);
      if (!config) {
        return {
          success: false,
          content: '',
          format: 'html',
          error: 'Configuration IA non trouvée'
        };
      }

      const validation = IAConfigService.validateInput(options.data, config.input_schema);
      if (!validation.valid) {
        return {
          success: false,
          content: '',
          format: 'html',
          error: `Données invalides: ${validation.errors.join(', ')}`
        };
      }

      const template = options.templateId
        ? await IAConfigService.getTemplate(options.templateId)
        : await IAConfigService.getDefaultTemplate(serviceCode);

      if (!template) {
        return {
          success: false,
          content: '',
          format: 'html',
          error: 'Template non trouvé'
        };
      }

      const outputData = {
        nom: options.data.nom,
        titre: options.data.titre,
        email: options.data.email,
        telephone: options.data.telephone,
        lieu: options.data.lieu,
        resume: options.data.resume,
        competences: options.data.competences,
        experiences: options.data.experiences,
        formations: options.data.formations
      };

      const content = IAConfigService.applyTemplate(outputData, template.template_structure);

      return {
        success: true,
        content,
        format: template.format
      };
    } catch (error) {
      console.error('Error in buildCV:', error);
      return {
        success: false,
        content: '',
        format: 'html',
        error: (error as Error).message
      };
    }
  }

  static async previewCV(
    data: CVInputData,
    templateId?: string
  ): Promise<{ success: boolean; preview: string; error?: string }> {
    try {
      const result = await this.buildCV({ data, templateId });

      if (!result.success) {
        return {
          success: false,
          preview: '',
          error: result.error
        };
      }

      return {
        success: true,
        preview: result.content
      };
    } catch (error) {
      return {
        success: false,
        preview: '',
        error: (error as Error).message
      };
    }
  }
}
