import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface CreditInfo {
  balance: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface ServiceCost {
  serviceCode: string;
  cost: number;
}

export function useGlobalCredits(): CreditInfo {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCredits = async () => {
    if (!user) {
      setBalance(0);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      setBalance(profile?.credits_balance || 0);
    } catch (err: any) {
      console.error('Error loading credits:', err);
      setError(err.message || 'Erreur lors du chargement des crédits');
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCredits();
  }, [user]);

  return {
    balance,
    isLoading,
    error,
    refresh: loadCredits,
  };
}

export async function getServiceCost(serviceCode: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('service_credit_costs')
      .select('credits_cost')
      .eq('service_code', serviceCode)
      .eq('is_active', true)
      .maybeSingle();

    if (error) throw error;
    return data?.credits_cost || 0;
  } catch (error) {
    console.error('Error loading service cost:', error);
    return 0;
  }
}

export async function getAllServiceCosts(): Promise<ServiceCost[]> {
  try {
    const { data, error } = await supabase
      .from('service_credit_costs')
      .select('service_code, credits_cost')
      .eq('is_active', true);

    if (error) throw error;

    return (data || []).map(item => ({
      serviceCode: item.service_code,
      cost: item.credits_cost,
    }));
  } catch (error) {
    console.error('Error loading service costs:', error);
    return [];
  }
}
