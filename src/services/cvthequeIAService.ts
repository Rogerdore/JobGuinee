/**
 * Service CVThèque IA - Wrapper Unifié du Moteur IA Central
 *
 * PRINCIPE: AUCUNE DUPLICATION
 * - Utilise iaConfigService existant pour les configs
 * - Utilise use_ai_credits() RPC pour consommation
 * - Utilise check_service_quota() RPC pour quotas
 * - Utilise ia_cvtheque_config pour paramètres avancés
 *
 * RESPONSABILITÉ:
 * - Orchestrer les appels IA pour le module CVThèque
 * - Gérer le cache si configuré
 * - Valider les inputs/outputs
 * - Logger les erreurs
 */

import { supabase } from '../lib/supabase';
import { IAConfigService, iaConfigService } from './iaConfigService';

// ============================================
// TYPES
// ============================================

export interface CVThequeConfig {
  scoring_weights: {
    experience: number;
    education: number;
    skills: number;
    verification: number;
    completion: number;
  };
  search_max_results: number;
  search_relevance_threshold: number;
  search_boost_verified: boolean;
  search_boost_gold: boolean;
  enable_cache: boolean;
  cache_duration_minutes: number;
  min_visible_score: number;
  excellent_score_threshold: number;
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
  usage?: {
    daily_uses: number;
    weekly_uses: number;
    monthly_uses: number;
    daily_credits: number;
  };
  limits?: {
    max_daily_uses: number | null;
    max_weekly_uses: number | null;
    max_monthly_uses: number | null;
    max_daily_credits: number | null;
  };
}

export interface ScoringInput {
  candidate_id: string;
  experience_years: number;
  education_level: 'bac' | 'licence' | 'master' | 'doctorat';
  skills: string[];
  is_verified?: boolean;
  is_gold?: boolean;
  profile_completion?: number;
}

export interface ScoringOutput {
  score: number;
  breakdown: {
    experience_score: number;
    education_score: number;
    skills_score: number;
    verification_score: number;
    completion_score: number;
  };
  reasoning: string;
  cached?: boolean;
}

export interface SearchInput {
  query: string;
  current_filters?: Record<string, any>;
}

export interface SearchOutput {
  interpreted_query: string;
  search_criteria: {
    skills: string[];
    experience_min?: number;
    experience_max?: number;
    education_level?: string;
    location?: string;
    domain?: string;
  };
  suggested_keywords: string[];
  relevance_factors: string[];
}

export interface IAServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  credits_consumed?: number;
  credits_remaining?: number;
  quota_exceeded?: boolean;
  cached?: boolean;
}

// ============================================
// SERVICE PRINCIPAL
// ============================================

export class CVThequeIAService {
  private static instance: CVThequeIAService;
  private configCache: CVThequeConfig | null = null;
  private configCacheTime: number = 0;
  private readonly CONFIG_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Service codes (référence au moteur central)
  private readonly SERVICE_SCORING = 'cv_profile_scoring';
  private readonly SERVICE_SEARCH = 'cv_semantic_search';

  private constructor() {}

  static getInstance(): CVThequeIAService {
    if (!CVThequeIAService.instance) {
      CVThequeIAService.instance = new CVThequeIAService();
    }
    return CVThequeIAService.instance;
  }

  /**
   * Récupère la configuration CVThèque (avec cache)
   */
  private async getConfig(): Promise<CVThequeConfig> {
    const now = Date.now();

    // Utiliser cache si valide
    if (this.configCache && now - this.configCacheTime < this.CONFIG_CACHE_DURATION) {
      return this.configCache;
    }

    try {
      const { data, error } = await supabase
        .from('ia_cvtheque_config')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (error) throw error;

      this.configCache = data as CVThequeConfig;
      this.configCacheTime = now;

      return this.configCache!;
    } catch (error) {
      console.error('Error fetching CVThèque config:', error);

      // Fallback config par défaut
      return {
        scoring_weights: {
          experience: 40,
          education: 25,
          skills: 20,
          verification: 10,
          completion: 5
        },
        search_max_results: 50,
        search_relevance_threshold: 0.6,
        search_boost_verified: true,
        search_boost_gold: true,
        enable_cache: true,
        cache_duration_minutes: 60,
        min_visible_score: 60,
        excellent_score_threshold: 85
      };
    }
  }

  /**
   * Vérifie les quotas utilisateur pour un service
   */
  async checkQuota(userId: string, serviceCode: string): Promise<QuotaCheck> {
    try {
      const { data, error } = await supabase.rpc('check_service_quota', {
        p_user_id: userId,
        p_service_code: serviceCode
      });

      if (error) {
        console.error('Error checking quota:', error);
        return { allowed: false, reason: 'QUOTA_CHECK_ERROR' };
      }

      return data as QuotaCheck;
    } catch (error) {
      console.error('Exception checking quota:', error);
      return { allowed: false, reason: 'QUOTA_CHECK_EXCEPTION' };
    }
  }

  /**
   * Consomme des crédits IA (délègue au moteur central)
   */
  private async consumeCredits(
    userId: string,
    serviceCode: string,
    inputPayload: any,
    outputResponse: any
  ): Promise<{ success: boolean; credits_consumed?: number; credits_remaining?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('use_ai_credits', {
        p_user_id: userId,
        p_service_key: serviceCode,
        p_input_payload: inputPayload,
        p_output_response: outputResponse
      });

      if (error) {
        console.error('Error consuming credits:', error);
        return { success: false, error: 'CREDIT_CONSUMPTION_ERROR' };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'CREDIT_CONSUMPTION_FAILED'
        };
      }

      return {
        success: true,
        credits_consumed: data.credits_consumed,
        credits_remaining: data.credits_remaining
      };
    } catch (error) {
      console.error('Exception consuming credits:', error);
      return { success: false, error: 'CREDIT_CONSUMPTION_EXCEPTION' };
    }
  }

  /**
   * Score un profil candidat via IA (utilise moteur central)
   */
  async scoreProfile(
    userId: string,
    input: ScoringInput
  ): Promise<IAServiceResult<ScoringOutput>> {
    try {
      // 1. Vérifier quota
      const quotaCheck = await this.checkQuota(userId, this.SERVICE_SCORING);
      if (!quotaCheck.allowed) {
        return {
          success: false,
          error: quotaCheck.reason || 'QUOTA_EXCEEDED',
          quota_exceeded: true
        };
      }

      // 2. Récupérer config service depuis moteur central
      const serviceConfig = await iaConfigService.getConfig(this.SERVICE_SCORING);
      if (!serviceConfig) {
        return {
          success: false,
          error: 'SERVICE_CONFIG_NOT_FOUND'
        };
      }

      // 3. Valider input
      const validationResult = IAConfigService.validateInput(input, serviceConfig.input_schema);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `VALIDATION_ERROR: ${validationResult.errors.join(', ')}`
        };
      }

      // 4. Construire prompt via moteur central
      const prompt = iaConfigService.buildPrompt(serviceConfig, input);

      // 5. Appel IA (simulé - à remplacer par vrai appel OpenAI)
      // TODO: Intégrer vrai appel OpenAI ici
      const mockOutput: ScoringOutput = {
        score: 75,
        breakdown: {
          experience_score: 30,
          education_score: 20,
          skills_score: 15,
          verification_score: input.is_verified ? 10 : 0,
          completion_score: 5
        },
        reasoning: 'Profil solide avec bonne expérience et formation adaptée.'
      };

      // 6. Consommer crédits via RPC central
      const creditResult = await this.consumeCredits(
        userId,
        this.SERVICE_SCORING,
        input,
        mockOutput
      );

      if (!creditResult.success) {
        return {
          success: false,
          error: creditResult.error
        };
      }

      // 7. Retourner résultat
      return {
        success: true,
        data: mockOutput,
        credits_consumed: creditResult.credits_consumed,
        credits_remaining: creditResult.credits_remaining
      };
    } catch (error) {
      console.error('Error scoring profile:', error);
      return {
        success: false,
        error: 'SCORING_SERVICE_ERROR'
      };
    }
  }

  /**
   * Recherche sémantique de candidats via IA (utilise moteur central)
   */
  async searchCandidates(
    userId: string,
    input: SearchInput
  ): Promise<IAServiceResult<SearchOutput>> {
    try {
      // 1. Vérifier quota
      const quotaCheck = await this.checkQuota(userId, this.SERVICE_SEARCH);
      if (!quotaCheck.allowed) {
        return {
          success: false,
          error: quotaCheck.reason || 'QUOTA_EXCEEDED',
          quota_exceeded: true
        };
      }

      // 2. Récupérer config service depuis moteur central
      const serviceConfig = await iaConfigService.getConfig(this.SERVICE_SEARCH);
      if (!serviceConfig) {
        return {
          success: false,
          error: 'SERVICE_CONFIG_NOT_FOUND'
        };
      }

      // 3. Récupérer config CVThèque pour paramètres avancés
      const cvthequeConfig = await this.getConfig();

      // 4. Valider input
      const validationResult = IAConfigService.validateInput(input, serviceConfig.input_schema);
      if (!validationResult.valid) {
        return {
          success: false,
          error: `VALIDATION_ERROR: ${validationResult.errors.join(', ')}`
        };
      }

      // 5. Construire prompt via moteur central
      const prompt = iaConfigService.buildPrompt(serviceConfig, input);

      // 6. Appel IA (simulé - à remplacer par vrai appel OpenAI)
      // TODO: Intégrer vrai appel OpenAI ici
      const mockOutput: SearchOutput = {
        interpreted_query: `Recherche de développeurs avec expertise en ${input.query}`,
        search_criteria: {
          skills: ['JavaScript', 'React', 'Node.js'],
          experience_min: 2,
          experience_max: 10,
          education_level: 'licence',
          location: 'Conakry',
          domain: 'Informatique'
        },
        suggested_keywords: ['TypeScript', 'PostgreSQL', 'API REST'],
        relevance_factors: ['Compétences techniques', 'Années d\'expérience', 'Formation']
      };

      // 7. Consommer crédits via RPC central
      const creditResult = await this.consumeCredits(
        userId,
        this.SERVICE_SEARCH,
        input,
        mockOutput
      );

      if (!creditResult.success) {
        return {
          success: false,
          error: creditResult.error
        };
      }

      // 8. Retourner résultat
      return {
        success: true,
        data: mockOutput,
        credits_consumed: creditResult.credits_consumed,
        credits_remaining: creditResult.credits_remaining
      };
    } catch (error) {
      console.error('Error searching candidates:', error);
      return {
        success: false,
        error: 'SEARCH_SERVICE_ERROR'
      };
    }
  }

  /**
   * Récupère les stats d'usage IA utilisateur
   */
  async getUserConsumption(userId?: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_user_ia_consumption', {
        p_user_id: userId || null
      });

      if (error) {
        console.error('Error fetching user consumption:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching user consumption:', error);
      return null;
    }
  }

  /**
   * Récupère les stats globales services IA (admin only)
   */
  async getServiceStats(serviceCode?: string, days: number = 30): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_ia_service_stats', {
        p_service_code: serviceCode || null,
        p_days: days
      });

      if (error) {
        console.error('Error fetching service stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Exception fetching service stats:', error);
      return null;
    }
  }

  /**
   * Invalide le cache de configuration
   */
  clearConfigCache(): void {
    this.configCache = null;
    this.configCacheTime = 0;
  }
}

// Export singleton
export const cvthequeIAService = CVThequeIAService.getInstance();
