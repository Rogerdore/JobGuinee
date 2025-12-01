import { supabase } from '../lib/supabase';

export interface CreditServiceConfig {
  service_code: string;
  service_name: string;
  credits_cost: number;
  is_active: boolean;
  category: string;
}

export interface CreditBalance {
  total_credits: number;
  credits_used: number;
  credits_available: number;
}

export interface ConsumeCreditsResult {
  success: boolean;
  error?: string;
  message: string;
  credits_consumed?: number;
  credits_remaining?: number;
  usage_id?: string;
  service_name?: string;
  required_credits?: number;
  available_credits?: number;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  transaction_type: string;
  credits_amount: number;
  service_code?: string;
  description: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export class CreditService {
  static async getServiceConfig(serviceCode: string): Promise<CreditServiceConfig | null> {
    try {
      const { data, error } = await supabase
        .from('service_credit_costs')
        .select('service_code, service_name, credits_cost, is_active, category')
        .eq('service_code', serviceCode)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching service config:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getServiceConfig:', error);
      return null;
    }
  }

  static async getUserBalance(userId: string): Promise<CreditBalance | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user balance:', error);
        return null;
      }

      const totalCredits = profile?.credits_balance || 0;

      return {
        total_credits: totalCredits,
        credits_used: 0,
        credits_available: totalCredits
      };
    } catch (error) {
      console.error('Error in getUserBalance:', error);
      return null;
    }
  }

  static async checkSufficientCredits(
    userId: string,
    serviceCode: string
  ): Promise<{ sufficient: boolean; required: number; available: number; message: string }> {
    try {
      const serviceConfig = await this.getServiceConfig(serviceCode);

      if (!serviceConfig) {
        return {
          sufficient: false,
          required: 0,
          available: 0,
          message: 'Service non trouvé ou inactif'
        };
      }

      const balance = await this.getUserBalance(userId);

      if (!balance) {
        return {
          sufficient: false,
          required: serviceConfig.credits_cost,
          available: 0,
          message: 'Impossible de récupérer le solde'
        };
      }

      const sufficient = balance.credits_available >= serviceConfig.credits_cost;

      return {
        sufficient,
        required: serviceConfig.credits_cost,
        available: balance.credits_available,
        message: sufficient
          ? 'Crédits suffisants'
          : `Crédits insuffisants. Requis: ${serviceConfig.credits_cost}, Disponible: ${balance.credits_available}`
      };
    } catch (error) {
      console.error('Error in checkSufficientCredits:', error);
      return {
        sufficient: false,
        required: 0,
        available: 0,
        message: 'Erreur lors de la vérification des crédits'
      };
    }
  }

  static async consumeCredits(
    userId: string,
    serviceCode: string,
    inputPayload?: any,
    outputResponse?: any
  ): Promise<ConsumeCreditsResult> {
    try {
      const { data, error } = await supabase.rpc('use_ai_credits', {
        p_user_id: userId,
        p_service_key: serviceCode,
        p_input_payload: inputPayload || null,
        p_output_response: outputResponse || null
      });

      if (error) {
        console.error('Error consuming credits:', error);
        return {
          success: false,
          error: 'RPC_ERROR',
          message: `Erreur lors de la consommation des crédits: ${error.message}`
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          error: data?.error || 'UNKNOWN_ERROR',
          message: data?.message || 'Erreur inconnue',
          required_credits: data?.required_credits,
          available_credits: data?.available_credits
        };
      }

      return {
        success: true,
        message: data.message || 'Crédits consommés avec succès',
        credits_consumed: data.credits_consumed,
        credits_remaining: data.credits_remaining,
        usage_id: data.usage_id,
        service_name: data.service_name
      };
    } catch (error) {
      console.error('Error in consumeCredits:', error);
      return {
        success: false,
        error: 'EXCEPTION',
        message: 'Une erreur inattendue est survenue'
      };
    }
  }

  static async getTransactionHistory(
    userId: string,
    limit: number = 50
  ): Promise<CreditTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching transaction history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTransactionHistory:', error);
      return [];
    }
  }

  static async getAllServices(): Promise<CreditServiceConfig[]> {
    try {
      const { data, error } = await supabase
        .from('service_credit_costs')
        .select('service_code, service_name, credits_cost, is_active, category')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('service_name', { ascending: true });

      if (error) {
        console.error('Error fetching services:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllServices:', error);
      return [];
    }
  }

  static async getUsageHistory(
    userId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching usage history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUsageHistory:', error);
      return [];
    }
  }
}

export const SERVICES = {
  AI_CV_GENERATION: 'ai_cv_generation',
  AI_COVER_LETTER: 'ai_cover_letter_generation',
  AI_JOB_MATCHING: 'job_matching',
  AI_PROFILE_ANALYSIS: 'profile_analysis',
  AI_INTERVIEW_COACHING: 'interview_coaching',
  AI_CAREER_PATH: 'career_path_planning',
  PROFILE_VISIBILITY_BOOST: 'profile_visibility_boost',
  FEATURED_APPLICATION: 'featured_application',
  DIRECT_MESSAGE_RECRUITER: 'direct_message_recruiter'
} as const;

export type ServiceCode = typeof SERVICES[keyof typeof SERVICES];
