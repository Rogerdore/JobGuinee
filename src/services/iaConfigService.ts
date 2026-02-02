import { supabase } from '../lib/supabase';

export interface IAServiceConfig {
  id: string;
  service_code: string;
  service_name: string;
  service_description?: string;
  base_prompt: string;
  instructions?: string;
  system_message?: string;
  input_schema: any;
  output_schema: any;
  example_input?: any;
  example_output?: any;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
  version: number;
  is_active: boolean;
  category: string;
  tags?: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface IAConfigHistory {
  id: string;
  service_id: string;
  service_code: string;
  previous_version: number;
  new_version: number;
  changes_summary?: string;
  field_changes: any;
  previous_config: any;
  new_config: any;
  changed_by?: string;
  change_reason?: string;
  created_at: string;
}

export interface BuiltPrompt {
  systemMessage: string;
  userMessage: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export class IAConfigService {
  static async getConfig(serviceCode: string): Promise<IAServiceConfig | null> {
    try {
      const { data, error } = await supabase.rpc('get_ia_service_config', {
        p_service_code: serviceCode
      });

      if (error) {
        console.error('Error fetching IA config:', error);
        return null;
      }

      if (!data || !data.success) {
        console.error('Service config not found:', serviceCode);
        return null;
      }

      return data.config;
    } catch (error) {
      console.error('Error in getConfig:', error);
      return null;
    }
  }

  static async getAllConfigs(activeOnly: boolean = false): Promise<IAServiceConfig[]> {
    try {
      let query = supabase
        .from('ia_service_config')
        .select('*')
        .order('category', { ascending: true })
        .order('service_name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching configs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllConfigs:', error);
      return [];
    }
  }

  static async updateConfig(
    serviceCode: string,
    updates: Partial<IAServiceConfig>,
    changeReason?: string
  ): Promise<{ success: boolean; message: string; newVersion?: number }> {
    try {
      const { data, error } = await supabase.rpc('update_ia_service_config', {
        p_service_code: serviceCode,
        p_updates: updates,
        p_change_reason: changeReason || null
      });

      if (error) {
        console.error('Error updating config:', error);
        return {
          success: false,
          message: 'Erreur lors de la mise a jour'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Erreur inconnue'
        };
      }

      return {
        success: true,
        message: data.message,
        newVersion: data.new_version
      };
    } catch (error) {
      console.error('Error in updateConfig:', error);
      return {
        success: false,
        message: 'Une erreur est survenue'
      };
    }
  }

  static async createConfig(
    config: Partial<IAServiceConfig>
  ): Promise<{ success: boolean; message: string; serviceId?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_ia_service_config', {
        p_config: config
      });

      if (error) {
        console.error('Error creating config:', error);
        return {
          success: false,
          message: 'Erreur lors de la creation'
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Erreur inconnue'
        };
      }

      return {
        success: true,
        message: data.message,
        serviceId: data.service_id
      };
    } catch (error) {
      console.error('Error in createConfig:', error);
      return {
        success: false,
        message: 'Une erreur est survenue'
      };
    }
  }

  static async getConfigHistory(serviceCode: string): Promise<IAConfigHistory[]> {
    try {
      const { data, error } = await supabase
        .from('ia_service_config_history')
        .select('*')
        .eq('service_code', serviceCode)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConfigHistory:', error);
      return [];
    }
  }

  static buildPrompt(config: IAServiceConfig, userInput: any): BuiltPrompt {
    let systemMessage = '';
    let userMessage = '';

    if (config.system_message) {
      systemMessage = config.system_message;
    } else {
      systemMessage = config.base_prompt;
      if (config.instructions) {
        systemMessage += '\n\n## Instructions:\n' + config.instructions;
      }
    }

    const validationResult = this.validateInput(userInput, config.input_schema);
    if (!validationResult.valid) {
      throw new Error(`Invalid input: ${validationResult.errors.join(', ')}`);
    }

    userMessage = this.formatUserInput(userInput, config.input_schema);

    return {
      systemMessage,
      userMessage,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.max_tokens,
      topP: config.top_p,
      frequencyPenalty: config.frequency_penalty,
      presencePenalty: config.presence_penalty
    };
  }

  public static validateInput(input: any, schema: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!schema || typeof schema !== 'object') {
      return { valid: true, errors: [] };
    }

    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (!input[field]) {
          errors.push(`Field "${field}" is required`);
        }
      }
    }

    if (schema.properties && typeof schema.properties === 'object') {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (input[field] !== undefined && typeof fieldSchema === 'object') {
          const fieldSchemaObj = fieldSchema as any;

          if (fieldSchemaObj.type) {
            const actualType = Array.isArray(input[field]) ? 'array' : typeof input[field];
            if (actualType !== fieldSchemaObj.type) {
              errors.push(`Field "${field}" should be of type ${fieldSchemaObj.type}`);
            }
          }

          if (fieldSchemaObj.minLength && typeof input[field] === 'string') {
            if (input[field].length < fieldSchemaObj.minLength) {
              errors.push(`Field "${field}" should be at least ${fieldSchemaObj.minLength} characters`);
            }
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private static formatUserInput(input: any, schema: any): string {
    let formatted = '';

    if (schema && schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        const fieldSchemaObj = fieldSchema as any;
        if (input[field] !== undefined) {
          const label = fieldSchemaObj.label || field;
          const value = input[field];

          if (Array.isArray(value)) {
            formatted += `\n${label}:\n${value.map((v: any) => `- ${v}`).join('\n')}\n`;
          } else if (typeof value === 'object') {
            formatted += `\n${label}:\n${JSON.stringify(value, null, 2)}\n`;
          } else {
            formatted += `\n${label}: ${value}\n`;
          }
        }
      }
    } else {
      formatted = JSON.stringify(input, null, 2);
    }

    return formatted;
  }

  static async getConfigByCategory(category: string): Promise<IAServiceConfig[]> {
    try {
      const { data, error } = await supabase
        .from('ia_service_config')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('service_name', { ascending: true });

      if (error) {
        console.error('Error fetching configs by category:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getConfigByCategory:', error);
      return [];
    }
  }

  static async toggleActive(serviceCode: string, isActive: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ia_service_config')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('service_code', serviceCode);

      if (error) {
        console.error('Error toggling active status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in toggleActive:', error);
      return false;
    }
  }

  static parseOutput(rawOutput: string, outputSchema: any): any {
    if (!outputSchema || typeof outputSchema !== 'object') {
      return rawOutput;
    }

    try {
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Could not parse JSON from output:', error);
    }

    return rawOutput;
  }

  static getServiceCategories(): string[] {
    return [
      'document_generation',
      'coaching',
      'matching',
      'analysis',
      'general'
    ];
  }

  static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      document_generation: 'Generation de Documents',
      coaching: 'Coaching et Conseils',
      matching: 'Matching et Compatibilite',
      analysis: 'Analyse et Evaluation',
      general: 'General'
    };

    return labels[category] || category;
  }

  static async getTemplates(serviceCode: string, activeOnly: boolean = true): Promise<IAServiceTemplate[]> {
    try {
      const { data, error } = await supabase.rpc('get_ia_service_templates', {
        p_service_code: serviceCode,
        p_active_only: activeOnly
      });

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      if (!data || !data.success) {
        return [];
      }

      return data.templates || [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  }

  static async getTemplate(templateId: string): Promise<IAServiceTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('ia_service_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error('Error fetching template:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getTemplate:', error);
      return null;
    }
  }

  static async getDefaultTemplate(serviceCode: string): Promise<IAServiceTemplate | null> {
    try {
      const { data, error } = await supabase.rpc('get_default_template', {
        p_service_code: serviceCode
      });

      if (error || !data || !data.success) {
        return null;
      }

      return data.template;
    } catch (error) {
      console.error('Error in getDefaultTemplate:', error);
      return null;
    }
  }

  static async createTemplate(
    template: Partial<IAServiceTemplate>
  ): Promise<{ success: boolean; message: string; templateId?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_ia_service_template', {
        p_template: template
      });

      if (error) {
        return { success: false, message: 'Erreur lors de la creation' };
      }

      if (!data || !data.success) {
        return { success: false, message: data?.message || 'Erreur inconnue' };
      }

      return {
        success: true,
        message: data.message,
        templateId: data.template_id
      };
    } catch (error) {
      console.error('Error in createTemplate:', error);
      return { success: false, message: 'Une erreur est survenue' };
    }
  }

  static async updateTemplate(
    templateId: string,
    updates: Partial<IAServiceTemplate>,
    changeReason?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.rpc('update_ia_service_template', {
        p_template_id: templateId,
        p_updates: updates,
        p_change_reason: changeReason || null
      });

      if (error) {
        return { success: false, message: 'Erreur lors de la mise a jour' };
      }

      if (!data || !data.success) {
        return { success: false, message: data?.message || 'Erreur inconnue' };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error in updateTemplate:', error);
      return { success: false, message: 'Une erreur est survenue' };
    }
  }

  static async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ia_service_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error('Error deleting template:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTemplate:', error);
      return false;
    }
  }

  static applyTemplate(contentData: any, templateStructure: string): string {
    let result = templateStructure;

    const applyData = (data: any, prefix: string = ''): void => {
      if (!data || typeof data !== 'object') return;

      for (const [key, value] of Object.entries(data)) {
        const placeholder = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value)) {
          const arrayPattern = new RegExp(
            `{{#each\\s+${placeholder}}}([\\s\\S]*?){{/each}}`,
            'g'
          );

          result = result.replace(arrayPattern, (match, itemTemplate) => {
            return value
              .map((item, index) => {
                let itemResult = itemTemplate;

                itemResult = itemResult.replace(/{{number}}/g, String(index + 1));

                if (typeof item === 'object' && item !== null) {
                  for (const [itemKey, itemValue] of Object.entries(item)) {
                    const itemPlaceholder = `{{${itemKey}}}`;
                    itemResult = itemResult.replace(
                      new RegExp(itemPlaceholder, 'g'),
                      String(itemValue || '')
                    );
                  }
                } else {
                  itemResult = itemResult.replace(/{{this}}/g, String(item || ''));
                }

                return itemResult;
              })
              .join('');
          });
        } else if (value && typeof value === 'object') {
          applyData(value, placeholder);
        } else {
          const regex = new RegExp(`{{${placeholder}}}`, 'g');
          result = result.replace(regex, String(value || ''));
        }
      }
    };

    applyData(contentData);

    result = result.replace(/{{[^}]+}}/g, '');

    return result;
  }

  static validateTemplatePlaceholders(
    templateStructure: string,
    outputSchema: any
  ): { valid: boolean; missingFields: string[]; extraPlaceholders: string[] } {
    const placeholderRegex = /{{([^}]+)}}/g;
    const placeholders = new Set<string>();

    let match;
    while ((match = placeholderRegex.exec(templateStructure)) !== null) {
      const placeholder = match[1].trim();
      if (!placeholder.startsWith('#') && !placeholder.startsWith('/') && placeholder !== 'this') {
        placeholders.add(placeholder.split('.')[0]);
      }
    }

    const schemaFields = new Set<string>();
    if (outputSchema && outputSchema.properties) {
      for (const field of Object.keys(outputSchema.properties)) {
        schemaFields.add(field);
      }
    }

    const missingFields: string[] = [];
    const extraPlaceholders: string[] = [];

    for (const field of schemaFields) {
      if (!placeholders.has(field)) {
        missingFields.push(field);
      }
    }

    for (const placeholder of placeholders) {
      if (!schemaFields.has(placeholder)) {
        extraPlaceholders.push(placeholder);
      }
    }

    return {
      valid: missingFields.length === 0 && extraPlaceholders.length === 0,
      missingFields,
      extraPlaceholders
    };
  }

  static extractPlaceholders(templateStructure: string): string[] {
    const placeholderRegex = /{{([^}]+)}}/g;
    const placeholders: string[] = [];

    let match;
    while ((match = placeholderRegex.exec(templateStructure)) !== null) {
      const placeholder = match[1].trim();
      if (!placeholder.startsWith('#') && !placeholder.startsWith('/')) {
        placeholders.push(placeholder);
      }
    }

    return [...new Set(placeholders)];
  }

  static previewTemplate(template: IAServiceTemplate, sampleData: any): string {
    try {
      return this.applyTemplate(sampleData, template.template_structure);
    } catch (error) {
      console.error('Error previewing template:', error);
      return 'Error rendering preview';
    }
  }

  static async getTemplateHistory(templateId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ia_service_templates_history')
        .select('*')
        .eq('template_id', templateId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching template history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTemplateHistory:', error);
      return [];
    }
  }

  /**
   * Log service usage for analytics (optional)
   */
  static async logServiceUsage(
    userId: string,
    serviceCode: string,
    inputData: any,
    outputData: any,
    creditsCost: number
  ): Promise<void> {
    try {
      console.log('IA Service Usage:', {
        userId,
        serviceCode,
        creditsCost,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging service usage:', error);
    }
  }

  static async executeService(
    serviceCode: string,
    inputPayload: any,
    options: { skipCreditConsumption?: boolean } = {}
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const config = await this.getConfig(serviceCode);

      if (!config) {
        return {
          success: false,
          error: `Service ${serviceCode} non trouvé ou inactif`
        };
      }

      if (!config.is_active) {
        return {
          success: false,
          error: 'Ce service est actuellement désactivé'
        };
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: 'Vous devez être connecté pour utiliser ce service'
        };
      }

      if (!options.skipCreditConsumption) {
        const { data: creditResult, error: creditError } = await supabase.rpc('use_ai_credits', {
          p_user_id: user.id,
          p_service_key: serviceCode,
          p_input_payload: inputPayload,
          p_output_response: null
        });

        if (creditError) {
          console.error('Credit consumption error:', creditError);
          return {
            success: false,
            error: 'Erreur lors de la consommation des crédits'
          };
        }

        if (!creditResult || !creditResult.success) {
          return {
            success: false,
            error: creditResult?.message || 'Crédits insuffisants'
          };
        }
      }

      const aiResponse = await this.executeAIService(serviceCode, inputPayload, config);

      return {
        success: true,
        data: aiResponse
      };
    } catch (error) {
      console.error('Execute service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private static async executeAIService(
    serviceCode: string,
    inputPayload: any,
    config: IAServiceConfig
  ): Promise<any> {
    if (serviceCode === 'ai_cv_parser') {
      return this.mockCVParser(inputPayload.cv_text);
    }

    throw new Error(`Service ${serviceCode} non implémenté`);
  }

  private static mockCVParser(cvText: string): any {
    const lines = cvText.split('\n').map(l => l.trim()).filter(l => l);

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const phoneRegex = /(\+?[0-9]{2,4}[\s.-]?[0-9]{2,3}[\s.-]?[0-9]{2,3}[\s.-]?[0-9]{2,4})/g;
    const linkedinRegex = /(linkedin\.com\/[^\s]+)/gi;
    const githubRegex = /(github\.com\/[^\s]+)/gi;

    const emails = cvText.match(emailRegex) || [];
    const phones = cvText.match(phoneRegex) || [];
    const linkedinUrls = cvText.match(linkedinRegex) || [];
    const githubUrls = cvText.match(githubRegex) || [];

    const skills: string[] = [];
    const skillKeywords = ['javascript', 'python', 'java', 'react', 'vue', 'angular', 'node', 'sql', 'mongodb', 'aws', 'docker', 'git'];
    skillKeywords.forEach(skill => {
      if (cvText.toLowerCase().includes(skill)) {
        skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
      }
    });

    const experiences: any[] = [];
    const education: any[] = [];

    const experienceKeywords = ['expérience', 'experience', 'poste', 'emploi'];
    const educationKeywords = ['formation', 'éducation', 'education', 'diplôme', 'université'];

    let currentSection = '';
    let tempExp = { position: '', company: '', period: '', missions: [] as string[] };
    let tempEdu = { degree: '', institution: '', year: '' };

    lines.forEach((line) => {
      const lowerLine = line.toLowerCase();

      if (experienceKeywords.some(kw => lowerLine.includes(kw))) {
        currentSection = 'experience';
        if (tempExp.position && tempExp.company) {
          experiences.push({...tempExp});
          tempExp = { position: '', company: '', period: '', missions: [] };
        }
      } else if (educationKeywords.some(kw => lowerLine.includes(kw))) {
        currentSection = 'education';
        if (tempEdu.degree && tempEdu.institution) {
          education.push({...tempEdu});
          tempEdu = { degree: '', institution: '', year: '' };
        }
      } else if (currentSection === 'experience' && line.length > 3) {
        if (!tempExp.position) {
          tempExp.position = line;
        } else if (!tempExp.company && line.length < 50) {
          tempExp.company = line;
        } else if (!tempExp.period && /\d{4}/.test(line)) {
          tempExp.period = line;
        } else if (line.startsWith('-') || line.startsWith('•')) {
          tempExp.missions.push(line.replace(/^[-•]\s*/, ''));
        }
      } else if (currentSection === 'education' && line.length > 3) {
        if (!tempEdu.degree) {
          tempEdu.degree = line;
        } else if (!tempEdu.institution && line.length < 60) {
          tempEdu.institution = line;
        } else if (!tempEdu.year && /\d{4}/.test(line)) {
          tempEdu.year = line;
        }
      }
    });

    if (tempExp.position && tempExp.company) {
      experiences.push(tempExp);
    }
    if (tempEdu.degree && tempEdu.institution) {
      education.push(tempEdu);
    }

    return {
      full_name: lines[0] || '',
      title: lines[1] || '',
      email: emails[0] || '',
      phone: phones[0] || '',
      location: '',
      summary: lines.slice(2, 5).join(' ').substring(0, 200),
      experiences: experiences.length > 0 ? experiences : [
        { position: 'Poste extrait du CV', company: 'Entreprise', period: '2020-2023', missions: ['Mission 1', 'Mission 2'] }
      ],
      education: education.length > 0 ? education : [
        { degree: 'Diplôme extrait du CV', institution: 'Institution', year: '2020' }
      ],
      skills: skills.length > 0 ? skills : ['Compétence 1', 'Compétence 2'],
      languages: [{ language: 'Français', level: 'Courant' }],
      certifications: [],
      driving_license: [],
      linkedin_url: linkedinUrls[0] ? 'https://' + linkedinUrls[0] : '',
      github_url: githubUrls[0] ? 'https://' + githubUrls[0] : '',
      other_urls: []
    };
  }
}

export interface IAServiceTemplate {
  id: string;
  service_code: string;
  template_name: string;
  template_description?: string;
  template_structure: string;
  format: 'html' | 'markdown' | 'text' | 'json';
  css_styles?: string;
  preview_data?: any;
  is_default: boolean;
  is_active: boolean;
  display_order: number;
  placeholders?: string[];
  required_fields?: string[];
  tags?: string[];
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export const iaConfigService = new IAConfigService();
