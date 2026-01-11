import { supabase } from '../lib/supabase';
import { IAConfigService } from './iaConfigService';
import { useCreditService } from '../hooks/useCreditService';

/**
 * RECHERCHE IA CVTHÈQUE - SERVICE CENTRALISÉ
 *
 * RÈGLES MÉTIER:
 * - Utilise le moteur IA central (iaConfigService)
 * - Service: 'cv_semantic_search'
 * - Coût: 5 crédits IA par recherche
 * - Recherche OPTIONNELLE (le classique reste principal)
 * - Aucune logique IA locale
 *
 * FONCTIONNEMENT:
 * 1. Vérifie crédits disponibles
 * 2. Appelle le service IA configuré
 * 3. Débite les crédits
 * 4. Retourne critères de recherche optimisés
 * 5. Log usage pour analytics
 */

export interface AISearchQuery {
  query: string;
  currentFilters?: any;
}

export interface AISearchResult {
  interpretedQuery: string;
  searchCriteria: {
    skills?: string[];
    experienceMin?: number;
    experienceMax?: number;
    educationLevel?: string;
    location?: string;
    domain?: string;
  };
  suggestedKeywords: string[];
  relevanceFactors: string[];
}

export interface AISearchResponse {
  success: boolean;
  result?: AISearchResult;
  creditsUsed?: number;
  error?: string;
  insufficientCredits?: boolean;
}

class RecruiterAISearchService {
  private serviceCode = 'cv_semantic_search';

  /**
   * Effectue une recherche sémantique IA dans la CVThèque
   * RÈGLE: Appelle le moteur IA central, débite les crédits
   */
  async searchCandidates(
    userId: string,
    searchQuery: AISearchQuery
  ): Promise<AISearchResponse> {
    try {
      // 1. Vérifier les crédits disponibles
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance, is_premium')
        .eq('id', userId)
        .single();

      if (!profile) {
        return {
          success: false,
          error: 'Profil utilisateur non trouvé'
        };
      }

      // 2. Récupérer le coût du service
      const { data: serviceCost } = await supabase
        .from('service_credit_costs')
        .select('credits_cost')
        .eq('service_code', this.serviceCode)
        .eq('is_active', true)
        .single();

      const costInCredits = serviceCost?.credits_cost || 5;

      // 3. Vérifier si suffisant de crédits
      if (profile.credits_balance < costInCredits && !profile.is_premium) {
        return {
          success: false,
          insufficientCredits: true,
          error: `Crédits insuffisants. Cette recherche coûte ${costInCredits} crédits.`
        };
      }

      // 4. Récupérer la configuration du service IA
      const config = await IAConfigService.getConfig(this.serviceCode);
      if (!config || !config.is_active) {
        return {
          success: false,
          error: 'Service de recherche IA temporairement indisponible'
        };
      }

      // 5. Construire le prompt avec validation
      const builtPrompt = IAConfigService.buildPrompt(config, searchQuery);

      // 6. Appeler l'IA (ici, simulation - à remplacer par vrai appel OpenAI)
      // IMPORTANT: Dans production, appeler l'API OpenAI avec builtPrompt
      const aiResponse = await this.callOpenAI(builtPrompt);

      // 7. Parser la réponse
      const parsedResult = IAConfigService.parseOutput(aiResponse, config.output_schema);

      // 8. Débiter les crédits via RPC sécurisé
      const { data: creditResult, error: creditError } = await supabase.rpc('use_ai_credits', {
        p_user_id: userId,
        p_service_code: this.serviceCode,
        p_credits_cost: costInCredits,
        p_input_data: searchQuery,
        p_output_data: parsedResult
      });

      if (creditError) {
        console.error('Error debiting credits:', creditError);
        return {
          success: false,
          error: 'Erreur lors du débit des crédits'
        };
      }

      if (!creditResult?.success) {
        return {
          success: false,
          insufficientCredits: true,
          error: creditResult?.message || 'Crédits insuffisants'
        };
      }

      // 9. Log usage (optionnel)
      await IAConfigService.logServiceUsage(
        userId,
        this.serviceCode,
        searchQuery,
        parsedResult,
        costInCredits
      );

      // 10. Retourner le résultat
      return {
        success: true,
        result: {
          interpretedQuery: parsedResult.interpreted_query || '',
          searchCriteria: parsedResult.search_criteria || {},
          suggestedKeywords: parsedResult.suggested_keywords || [],
          relevanceFactors: parsedResult.relevance_factors || []
        },
        creditsUsed: costInCredits
      };
    } catch (error: any) {
      console.error('AI Search Service Error:', error);
      return {
        success: false,
        error: error.message || 'Une erreur est survenue lors de la recherche IA'
      };
    }
  }

  /**
   * Appel simulé à OpenAI
   * À REMPLACER par un vrai appel API en production
   */
  private async callOpenAI(builtPrompt: any): Promise<string> {
    // SIMULATION - À remplacer par:
    // const response = await openai.chat.completions.create({...});

    // Pour l'instant, retourne une réponse structurée simulée
    return JSON.stringify({
      interpreted_query: "Recherche d'un développeur full-stack avec expérience en React et Node.js",
      search_criteria: {
        skills: ['React', 'Node.js', 'JavaScript', 'TypeScript'],
        experience_min: 2,
        experience_max: 5,
        education_level: 'licence',
        domain: 'Développement Web'
      },
      suggested_keywords: ['frontend', 'backend', 'API REST', 'bases de données'],
      relevance_factors: [
        'Expérience avec React',
        'Connaissance Node.js',
        'Portfolio de projets'
      ]
    });
  }

  /**
   * Vérifie si l'utilisateur a assez de crédits pour une recherche
   */
  async canAffordSearch(userId: string): Promise<{ canAfford: boolean; creditsNeeded: number; creditsAvailable: number }> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits_balance, is_premium')
        .eq('id', userId)
        .single();

      const { data: serviceCost } = await supabase
        .from('service_credit_costs')
        .select('credits_cost')
        .eq('service_code', this.serviceCode)
        .eq('is_active', true)
        .single();

      const costInCredits = serviceCost?.credits_cost || 5;
      const creditsAvailable = profile?.credits_balance || 0;
      const isPremium = profile?.is_premium || false;

      return {
        canAfford: isPremium || creditsAvailable >= costInCredits,
        creditsNeeded: costInCredits,
        creditsAvailable
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      return {
        canAfford: false,
        creditsNeeded: 5,
        creditsAvailable: 0
      };
    }
  }

  /**
   * Récupère l'historique des recherches IA de l'utilisateur
   */
  async getSearchHistory(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('*')
        .eq('user_id', userId)
        .eq('service_code', this.serviceCode)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching search history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getSearchHistory:', error);
      return [];
    }
  }
}

export const recruiterAISearchService = new RecruiterAISearchService();
