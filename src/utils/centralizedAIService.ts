import { supabase } from '../lib/supabase';

export interface AIServiceRequest {
  service_key: string;
  payload: Record<string, any>;
}

export interface AIServiceResponse {
  success: boolean;
  response?: {
    content: string;
    model: string;
    provider: string;
    usage: any;
  };
  credits_remaining?: number;
  credits_consumed?: number;
  service_name?: string;
  usage_id?: string;
  error?: string;
  message?: string;
  required_credits?: number;
  available_credits?: number;
}

export class CentralizedAIService {
  private static async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('Session non trouvée. Veuillez vous reconnecter.');
    }
    return session.access_token;
  }

  private static async getUserId(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utilisateur non trouvé. Veuillez vous reconnecter.');
    }
    return user.id;
  }

  static async callService(
    serviceKey: string,
    payload: Record<string, any>
  ): Promise<AIServiceResponse> {
    try {
      const token = await this.getAuthToken();
      const userId = await this.getUserId();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            service_key: serviceKey,
            payload: payload
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Erreur serveur',
          message: data.message || 'Une erreur est survenue'
        };
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: error.message || 'Erreur de connexion'
      };
    }
  }

  static async analyseProfile(profileData: any): Promise<AIServiceResponse> {
    return this.callService('analyse_profil', {
      profile_data: JSON.stringify(profileData)
    });
  }

  static async generateCV(
    profileData: any,
    targetPosition: string,
    format: string = 'html'
  ): Promise<AIServiceResponse> {
    return this.callService('generation_cv', {
      profile_data: JSON.stringify(profileData),
      target_position: targetPosition,
      format: format
    });
  }

  static async generateCoverLetter(
    candidateProfile: any,
    jobDescription: any,
    tone: string = 'formal'
  ): Promise<AIServiceResponse> {
    return this.callService('lettre_motivation', {
      candidate_profile: JSON.stringify(candidateProfile),
      job_description: JSON.stringify(jobDescription),
      tone: tone
    });
  }

  static async chatbotQuery(
    userQuestion: string,
    context?: string
  ): Promise<AIServiceResponse> {
    return this.callService('chatbot_job', {
      user_question: userQuestion,
      context: context || ''
    });
  }

  static async getCareerCoaching(
    userProfile: any,
    careerGoal: string,
    currentSituation: string
  ): Promise<AIServiceResponse> {
    return this.callService('coaching_ia', {
      user_profile: JSON.stringify(userProfile),
      career_goal: careerGoal,
      current_situation: currentSituation
    });
  }

  static async generateMonthlyReport(
    monthlyData: any,
    applicationsCount: number,
    interviewsCount: number,
    responsesCount: number
  ): Promise<AIServiceResponse> {
    return this.callService('rapport_mensuel', {
      monthly_data: JSON.stringify(monthlyData),
      applications_count: applicationsCount.toString(),
      interviews_count: interviewsCount.toString(),
      responses_count: responsesCount.toString()
    });
  }

  static async matchJobToProfile(
    userProfile: any,
    jobOffer: any
  ): Promise<AIServiceResponse> {
    return this.callService('alertes_ia', {
      user_profile: JSON.stringify(userProfile),
      job_offer: JSON.stringify(jobOffer)
    });
  }

  static async getUserCredits(): Promise<number | null> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('user_credit_balances')
        .select('total_credits')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data?.total_credits ?? 0;
    } catch (error) {
      console.error('Error fetching credits:', error);
      return null;
    }
  }

  static async getServiceConfig(serviceKey: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('service_credit_costs')
        .select('*')
        .eq('service_key', serviceKey)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching service config:', error);
      return null;
    }
  }

  static async getUserUsageHistory(limit: number = 10): Promise<any[]> {
    try {
      const userId = await this.getUserId();
      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching usage history:', error);
      return [];
    }
  }
}

export default CentralizedAIService;
