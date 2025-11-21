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

export async function callAIService(request: AIServiceRequest): Promise<AIServiceResponse> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Session non disponible');
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-service`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de l\'appel au service IA');
    }

    return result;
  } catch (error: any) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
    };
  }
}
