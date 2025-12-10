import { supabase } from '../lib/supabase';

export interface CreditServiceConfig {
  id?: string;
  service_code: string;
  service_name: string;
  service_description?: string;
  credits_cost: number;
  is_active: boolean;
  category: string;
  promotion_active?: boolean;
  discount_percent?: number;
  effective_cost?: number;
  display_order?: number;
  icon?: string;
  created_at?: string;
  updated_at?: string;
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
  AI_COVER_LETTER: 'ai_cover_letter',
  AI_JOB_MATCHING: 'ai_matching',
  AI_INTERVIEW_COACHING: 'ai_coach',
  AI_CAREER_PATH: 'ai_career_plan',
  PROFILE_VISIBILITY_BOOST: 'profile_visibility_boost',
  FEATURED_APPLICATION: 'featured_application'
} as const;

export type ServiceCode = typeof SERVICES[keyof typeof SERVICES];

export interface PricingUpdateParams {
  service_code: string;
  credits_cost?: number;
  is_active?: boolean;
  promotion_active?: boolean;
  discount_percent?: number;
  display_order?: number;
  icon?: string;
  service_description?: string;
}

export interface NewServiceParams {
  service_code: string;
  service_name: string;
  service_description: string;
  credits_cost: number;
  category?: string;
  icon?: string;
  is_active?: boolean;
}

export interface ServiceStatistics {
  service_code: string;
  service_name: string;
  total_usage_count: number;
  total_credits_consumed: number;
  last_used_at: string | null;
  unique_users_count: number;
}

export interface ServiceCostHistory {
  id: string;
  service_code: string;
  service_name: string;
  old_credits_cost: number | null;
  new_credits_cost: number | null;
  old_is_active: boolean | null;
  new_is_active: boolean | null;
  old_promotion_active: boolean | null;
  new_promotion_active: boolean | null;
  old_discount_percent: number | null;
  new_discount_percent: number | null;
  change_type: 'created' | 'updated' | 'deleted';
  changed_by_email: string | null;
  change_reason: string | null;
  created_at: string;
}

export class PricingEngine {
  static async fetchAllPricing(): Promise<CreditServiceConfig[]> {
    try {
      const { data, error } = await supabase.rpc('get_all_ia_services');

      if (error) {
        console.error('Error fetching all pricing:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in fetchAllPricing:', error);
      return [];
    }
  }

  static async getServiceCost(serviceCode: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from('service_credit_costs')
        .select('credits_cost, promotion_active, discount_percent')
        .eq('service_code', serviceCode)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching service cost:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      let cost = data.credits_cost;
      if (data.promotion_active && data.discount_percent > 0) {
        cost = Math.round(cost * (1 - data.discount_percent / 100));
      }

      return cost;
    } catch (error) {
      console.error('Error in getServiceCost:', error);
      return null;
    }
  }

  static async getServiceDetails(serviceCode: string): Promise<CreditServiceConfig | null> {
    try {
      const allServices = await this.fetchAllPricing();
      return allServices.find(s => s.service_code === serviceCode) || null;
    } catch (error) {
      console.error('Error in getServiceDetails:', error);
      return null;
    }
  }

  static async updatePricing(params: PricingUpdateParams): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('update_ia_service_pricing', {
        p_service_code: params.service_code,
        p_credits_cost: params.credits_cost || null,
        p_is_active: params.is_active !== undefined ? params.is_active : null,
        p_promotion_active: params.promotion_active !== undefined ? params.promotion_active : null,
        p_discount_percent: params.discount_percent !== undefined ? params.discount_percent : null,
        p_display_order: params.display_order !== undefined ? params.display_order : null,
        p_icon: params.icon || null,
        p_service_description: params.service_description || null
      });

      if (error) {
        console.error('Error updating pricing:', error);
        return {
          success: false,
          message: 'Erreur lors de la mise à jour',
          error: error.message
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Erreur inconnue',
          error: data?.error
        };
      }

      this.clearCache(params.service_code);

      return {
        success: true,
        message: data.message || 'Service mis à jour avec succès'
      };
    } catch (error) {
      console.error('Error in updatePricing:', error);
      return {
        success: false,
        message: 'Une erreur inattendue est survenue',
        error: 'EXCEPTION'
      };
    }
  }

  static async addService(params: NewServiceParams): Promise<{ success: boolean; message: string; error?: string; service_id?: string }> {
    try {
      const { data, error } = await supabase.rpc('add_new_ia_service', {
        p_service_code: params.service_code,
        p_service_name: params.service_name,
        p_service_description: params.service_description,
        p_credits_cost: params.credits_cost,
        p_category: params.category || 'ia_services',
        p_icon: params.icon || 'Sparkles',
        p_is_active: params.is_active !== undefined ? params.is_active : true
      });

      if (error) {
        console.error('Error adding service:', error);
        return {
          success: false,
          message: 'Erreur lors de la création',
          error: error.message
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Erreur inconnue',
          error: data?.error
        };
      }

      this.clearCache();

      return {
        success: true,
        message: data.message || 'Service créé avec succès',
        service_id: data.service_id
      };
    } catch (error) {
      console.error('Error in addService:', error);
      return {
        success: false,
        message: 'Une erreur inattendue est survenue',
        error: 'EXCEPTION'
      };
    }
  }

  static async getStatistics(): Promise<ServiceStatistics[]> {
    try {
      const { data, error } = await supabase.rpc('get_service_statistics');

      if (error) {
        console.error('Error fetching statistics:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStatistics:', error);
      return [];
    }
  }

  static calculateEffectiveCost(
    baseCost: number,
    promotionActive: boolean = false,
    discountPercent: number = 0
  ): number {
    if (!promotionActive || discountPercent === 0) {
      return baseCost;
    }

    const discount = Math.floor(baseCost * discountPercent / 100);
    return Math.max(0, baseCost - discount);
  }

  static async getHistory(serviceCode?: string): Promise<ServiceCostHistory[]> {
    try {
      const { data, error } = await supabase.rpc('get_service_cost_history', {
        p_service_code: serviceCode || null
      });

      if (error) {
        console.error('Error fetching history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getHistory:', error);
      return [];
    }
  }

  static async getRecentChanges(limit: number = 20): Promise<ServiceCostHistory[]> {
    try {
      const allHistory = await this.getHistory();
      return allHistory.slice(0, limit);
    } catch (error) {
      console.error('Error in getRecentChanges:', error);
      return [];
    }
  }

  private static pricingCache: Map<string, { cost: number; timestamp: number }> = new Map();
  private static readonly CACHE_DURATION = 5 * 60 * 1000;

  static async getServiceCostCached(serviceCode: string): Promise<number | null> {
    const cached = this.pricingCache.get(serviceCode);
    const now = Date.now();

    if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
      return cached.cost;
    }

    const cost = await this.getServiceCost(serviceCode);
    if (cost !== null) {
      this.pricingCache.set(serviceCode, { cost, timestamp: now });
    }

    return cost;
  }

  static clearCache(serviceCode?: string): void {
    if (serviceCode) {
      this.pricingCache.delete(serviceCode);
    } else {
      this.pricingCache.clear();
    }
  }
}
