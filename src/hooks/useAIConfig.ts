import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface AIConfig {
  id: string;
  enabled: boolean;
  name: string;
  ai_model: string;
  api_provider: string;
  api_endpoint?: string;
  api_key?: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
}

interface UseAIConfigReturn {
  config: AIConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAIConfig(): UseAIConfigReturn {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_ai_config');

      if (rpcError) {
        throw rpcError;
      }

      if (data && data.success) {
        setConfig(data.config);
      } else {
        setError(data?.message || 'Configuration IA non disponible');
      }
    } catch (err: any) {
      console.error('Error fetching AI config:', err);
      setError(err.message || 'Erreur lors du chargement de la configuration IA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
}
