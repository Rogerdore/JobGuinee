import { useState, useEffect } from 'react';
import { PricingEngine, CreditServiceConfig } from '../services/creditService';

export function useServiceCost(serviceCode: string): number | null {
  const [cost, setCost] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchCost = async () => {
      const effectiveCost = await PricingEngine.getServiceCost(serviceCode);
      if (mounted) {
        setCost(effectiveCost);
      }
    };

    fetchCost();

    return () => {
      mounted = false;
    };
  }, [serviceCode]);

  return cost;
}

export function useServiceDetails(serviceCode: string): CreditServiceConfig | null {
  const [service, setService] = useState<CreditServiceConfig | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchService = async () => {
      const serviceDetails = await PricingEngine.getServiceDetails(serviceCode);
      if (mounted) {
        setService(serviceDetails);
      }
    };

    fetchService();

    return () => {
      mounted = false;
    };
  }, [serviceCode]);

  return service;
}

export function useAllServices(): CreditServiceConfig[] {
  const [services, setServices] = useState<CreditServiceConfig[]>([]);

  useEffect(() => {
    let mounted = true;

    const fetchServices = async () => {
      const allServices = await PricingEngine.fetchAllPricing();
      if (mounted) {
        setServices(allServices);
      }
    };

    fetchServices();

    return () => {
      mounted = false;
    };
  }, []);

  return services;
}
