import { supabase } from '../lib/supabase';

export interface AIServiceRequest {
  service_type: 'cv_generation' | 'cover_letter' | 'profile_analysis' | 'job_generation' | 'matching';
  prompt: string;
  context?: any;
  temperature?: number;
  max_tokens?: number;
}

export interface AIServiceResponse {
  success: boolean;
  data?: {
    content: string;
    model: string;
    provider: string;
    usage?: any;
  };
  error?: string;
  service_type?: string;
}

const serviceTypeToKeyMap: Record<string, string> = {
  'cv_generation': 'generation_cv',
  'cover_letter': 'lettre_motivation',
  'profile_analysis': 'analyse_profil',
  'job_generation': 'generation_cv',
  'matching': 'alertes_ia',
};

export async function callAIService(request: AIServiceRequest): Promise<AIServiceResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();

    if (!session || !user) {
      throw new Error('Session non disponible');
    }

    const serviceKey = serviceTypeToKeyMap[request.service_type];
    if (!serviceKey) {
      throw new Error(`Service type "${request.service_type}" non reconnu`);
    }

    const payload: Record<string, any> = {
      prompt_content: request.prompt
    };

    if (request.context) {
      payload.context = JSON.stringify(request.context);
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        service_key: serviceKey,
        payload: payload,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || result.message || 'Erreur lors de l\'appel au service IA');
    }

    return {
      success: true,
      data: {
        content: result.response?.content || '',
        model: result.response?.model || 'unknown',
        provider: result.response?.provider || 'unknown',
        usage: result.response?.usage,
      },
      service_type: request.service_type,
    };
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
    };
  }
}
