import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface PremiumEligibility {
  isEligible: boolean;
  isLoading: boolean;
  reason: string | null;
  profileCompletion: number;
  hasCredits: boolean;
  isAuthenticated: boolean;
  requiredCompletion: number;
}

export function usePremiumEligibility(serviceCode: string): PremiumEligibility {
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<PremiumEligibility>({
    isEligible: false,
    isLoading: true,
    reason: null,
    profileCompletion: 0,
    hasCredits: false,
    isAuthenticated: false,
    requiredCompletion: 80,
  });

  useEffect(() => {
    checkEligibility();
  }, [user, serviceCode]);

  const checkEligibility = async () => {
    if (!user) {
      setEligibility({
        isEligible: false,
        isLoading: false,
        reason: 'Vous devez être connecté pour accéder aux services premium',
        profileCompletion: 0,
        hasCredits: false,
        isAuthenticated: false,
        requiredCompletion: 80,
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setEligibility({
          isEligible: false,
          isLoading: false,
          reason: 'Profil non trouvé',
          profileCompletion: 0,
          hasCredits: false,
          isAuthenticated: true,
          requiredCompletion: 80,
        });
        return;
      }

      const profileCompletion = profile.profile_completion_percentage || 0;

      let hasCredits = false;
      let creditBalance = profile.credits_balance || 0;
      let serviceCost = 0;

      const { data: cost } = await supabase
        .from('service_credit_costs')
        .select('credits_cost')
        .eq('service_code', serviceCode)
        .eq('is_active', true)
        .maybeSingle();

      serviceCost = cost?.credits_cost || 0;
      hasCredits = creditBalance >= serviceCost;

      let reason = null;
      let isEligible = true;

      if (profileCompletion < 80) {
        isEligible = false;
        reason = `Votre profil doit être complété à minimum 80% (actuellement ${profileCompletion}%). Complétez votre profil pour accéder aux services premium.`;
      } else if (!hasCredits) {
        isEligible = false;
        reason = `Crédits insuffisants. Vous avez ${creditBalance} crédits, mais ce service nécessite ${serviceCost} crédits. Rechargez vos crédits pour continuer.`;
      }

      setEligibility({
        isEligible,
        isLoading: false,
        reason,
        profileCompletion,
        hasCredits,
        isAuthenticated: true,
        requiredCompletion: 80,
      });
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setEligibility({
        isEligible: false,
        isLoading: false,
        reason: 'Erreur lors de la vérification de l\'éligibilité',
        profileCompletion: 0,
        hasCredits: false,
        isAuthenticated: true,
        requiredCompletion: 80,
      });
    }
  };

  return eligibility;
}
