import { useState, useEffect, useCallback } from 'react';
import { CreditService, ConsumeCreditsResult, CreditBalance, ServiceCode } from '../services/creditService';
import { useAuth } from '../contexts/AuthContext';

export function useCreditBalance() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!user?.id) {
      setBalance(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userBalance = await CreditService.getUserBalance(user.id);
      setBalance(userBalance);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Impossible de charger le solde');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance
  };
}

export function useConsumeCredits() {
  const { user } = useAuth();
  const [consuming, setConsuming] = useState(false);
  const [result, setResult] = useState<ConsumeCreditsResult | null>(null);

  const consumeCredits = useCallback(
    async (
      serviceCode: ServiceCode | string,
      inputPayload?: any,
      outputResponse?: any
    ): Promise<ConsumeCreditsResult> => {
      if (!user?.id) {
        const errorResult: ConsumeCreditsResult = {
          success: false,
          error: 'NOT_AUTHENTICATED',
          message: 'Utilisateur non authentifié'
        };
        setResult(errorResult);
        return errorResult;
      }

      setConsuming(true);
      setResult(null);

      try {
        const consumeResult = await CreditService.consumeCredits(
          user.id,
          serviceCode,
          inputPayload,
          outputResponse
        );

        setResult(consumeResult);
        return consumeResult;
      } catch (error) {
        console.error('Error in consumeCredits:', error);
        const errorResult: ConsumeCreditsResult = {
          success: false,
          error: 'EXCEPTION',
          message: 'Une erreur est survenue lors de la consommation des crédits'
        };
        setResult(errorResult);
        return errorResult;
      } finally {
        setConsuming(false);
      }
    },
    [user?.id]
  );

  const checkSufficient = useCallback(
    async (serviceCode: ServiceCode | string) => {
      if (!user?.id) {
        return {
          sufficient: false,
          required: 0,
          available: 0,
          message: 'Utilisateur non authentifié'
        };
      }

      return await CreditService.checkSufficientCredits(user.id, serviceCode);
    },
    [user?.id]
  );

  return {
    consumeCredits,
    checkSufficient,
    consuming,
    result
  };
}

export function useCreditHistory(limit: number = 50) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user?.id) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const history = await CreditService.getTransactionHistory(user.id, limit);
      setTransactions(history);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  }, [user?.id, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    transactions,
    loading,
    error,
    refresh: fetchHistory
  };
}

export function useServicesList() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const servicesList = await CreditService.getAllServices();
      setServices(servicesList);
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Impossible de charger les services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    refresh: fetchServices
  };
}

export function useServiceCost(serviceCode: ServiceCode | string) {
  const [serviceCost, setServiceCost] = useState<number | null>(null);
  const [serviceName, setServiceName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCost = async () => {
      setLoading(true);
      const config = await CreditService.getServiceConfig(serviceCode);
      if (config) {
        setServiceCost(config.credits_cost);
        setServiceName(config.service_name);
      }
      setLoading(false);
    };

    fetchCost();
  }, [serviceCode]);

  return {
    serviceCost,
    serviceName,
    loading
  };
}
