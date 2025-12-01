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

  private static validateInput(input: any, schema: any): { valid: boolean; errors: string[] } {
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
}
