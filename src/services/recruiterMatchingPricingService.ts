import { supabase } from '../lib/supabase';

export interface MatchingPricingOption {
  id: string;
  mode: 'per_candidate' | 'batch' | 'subscription';
  name: string;
  description: string | null;
  credits_cost: number;
  gnf_cost: number;
  candidate_count: number | null;
  is_active: boolean;
  display_order: number;
  metadata: Record<string, any>;
}

export interface RecruiterAISubscription {
  id: string;
  recruiter_id: string;
  plan_type: 'basic' | 'pro' | 'gold';
  credits_included: number;
  matching_quota: number | null;
  matching_used: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  auto_renew: boolean;
  needs_admin_validation: boolean;
}

export interface CostEstimate {
  mode: string;
  candidateCount: number;
  creditsRequired: number;
  gnfEquivalent: number;
  hasActiveSubscription: boolean;
  subscriptionQuotaRemaining: number | null;
  canAfford: boolean;
  insufficientBy: number;
  useSubscription: boolean;
}

export class RecruiterMatchingPricingService {
  /**
   * Récupère tous les tarifs actifs
   */
  static async getActivePricing(): Promise<MatchingPricingOption[]> {
    const { data, error } = await supabase
      .from('recruiter_matching_pricing')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupère les tarifs par mode
   */
  static async getPricingByMode(mode: 'per_candidate' | 'batch' | 'subscription'): Promise<MatchingPricingOption[]> {
    const { data, error } = await supabase
      .from('recruiter_matching_pricing')
      .select('*')
      .eq('mode', mode)
      .eq('is_active', true)
      .order('display_order');

    if (error) throw error;
    return data || [];
  }

  /**
   * Récupère l'abonnement actif d'un recruteur
   */
  static async getActiveSubscription(recruiterId: string): Promise<RecruiterAISubscription | null> {
    const { data, error } = await supabase
      .from('recruiter_ai_subscriptions')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Calcule le coût pour un nombre de candidats donné
   */
  static async estimateCost(recruiterId: string, candidateCount: number): Promise<CostEstimate> {
    // Vérifier abonnement actif
    const subscription = await this.getActiveSubscription(recruiterId);

    // Récupérer le solde de crédits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits_balance')
      .eq('id', recruiterId)
      .single();

    if (profileError) throw profileError;

    const creditsBalance = profile?.credits_balance || 0;

    // Si abonnement actif avec quota disponible
    if (subscription && subscription.matching_quota !== null) {
      const quotaRemaining = subscription.matching_quota - subscription.matching_used;

      if (quotaRemaining >= candidateCount) {
        return {
          mode: 'subscription',
          candidateCount,
          creditsRequired: 0,
          gnfEquivalent: 0,
          hasActiveSubscription: true,
          subscriptionQuotaRemaining: quotaRemaining,
          canAfford: true,
          insufficientBy: 0,
          useSubscription: true
        };
      }
    }

    // Si abonnement Gold (illimité)
    if (subscription && subscription.plan_type === 'gold' && subscription.matching_quota === null) {
      return {
        mode: 'subscription',
        candidateCount,
        creditsRequired: 0,
        gnfEquivalent: 0,
        hasActiveSubscription: true,
        subscriptionQuotaRemaining: null, // illimité
        canAfford: true,
        insufficientBy: 0,
        useSubscription: true
      };
    }

    // Calculer le coût optimal (batch vs per candidate)
    const batchPricing = await this.getPricingByMode('batch');
    const perCandidatePricing = await this.getPricingByMode('per_candidate');

    let bestOption = {
      mode: 'per_candidate',
      creditsRequired: candidateCount * 10, // default
      gnfEquivalent: candidateCount * 10000
    };

    // Vérifier les batches
    for (const batch of batchPricing) {
      if (batch.candidate_count && candidateCount <= batch.candidate_count) {
        const costPerCandidate = batch.credits_cost / batch.candidate_count;
        if (costPerCandidate < bestOption.creditsRequired / candidateCount) {
          bestOption = {
            mode: 'batch',
            creditsRequired: batch.credits_cost,
            gnfEquivalent: batch.gnf_cost
          };
        }
      }
    }

    // Vérifier tarif dégressif per_candidate
    if (perCandidatePricing.length > 0) {
      const perCandidate = perCandidatePricing[0];
      if (perCandidate.metadata?.degressive) {
        const degressive = perCandidate.metadata.degressive as Array<{from: number, to: number | null, cost: number}>;
        const applicable = degressive.find(d =>
          candidateCount >= d.from && (d.to === null || candidateCount <= d.to)
        );
        if (applicable) {
          const degressiveCost = candidateCount * applicable.cost;
          if (degressiveCost < bestOption.creditsRequired) {
            bestOption = {
              mode: 'per_candidate',
              creditsRequired: degressiveCost,
              gnfEquivalent: degressiveCost * 1000
            };
          }
        }
      }
    }

    const canAfford = creditsBalance >= bestOption.creditsRequired;
    const insufficientBy = canAfford ? 0 : bestOption.creditsRequired - creditsBalance;

    return {
      ...bestOption,
      candidateCount,
      hasActiveSubscription: !!subscription,
      subscriptionQuotaRemaining: subscription?.matching_quota ? (subscription.matching_quota - subscription.matching_used) : null,
      canAfford,
      insufficientBy,
      useSubscription: false
    };
  }

  /**
   * Consomme les crédits ou met à jour le quota d'abonnement
   */
  static async consumeMatchingCredits(
    recruiterId: string,
    candidateCount: number,
    estimate: CostEstimate
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (estimate.useSubscription) {
        // Utiliser le quota d'abonnement
        const subscription = await this.getActiveSubscription(recruiterId);
        if (!subscription) {
          return { success: false, error: 'Abonnement non trouvé' };
        }

        // Vérifier le quota (sauf Gold illimité)
        if (subscription.matching_quota !== null) {
          const quotaRemaining = subscription.matching_quota - subscription.matching_used;
          if (quotaRemaining < candidateCount) {
            return { success: false, error: 'Quota d\'abonnement insuffisant' };
          }

          // Mettre à jour le quota utilisé
          const { error: updateError } = await supabase
            .from('recruiter_ai_subscriptions')
            .update({ matching_used: subscription.matching_used + candidateCount })
            .eq('id', subscription.id);

          if (updateError) throw updateError;
        }
        // Gold illimité : pas de mise à jour nécessaire

        return { success: true };
      } else {
        // Utiliser les crédits IA
        const { error: creditError } = await supabase.rpc('use_ai_credits', {
          p_user_id: recruiterId,
          p_service_code: 'ai_recruiter_matching',
          p_credits_amount: estimate.creditsRequired,
          p_metadata: {
            candidate_count: candidateCount,
            mode: estimate.mode
          }
        });

        if (creditError) {
          if (creditError.message.includes('Solde de crédits insuffisant')) {
            return { success: false, error: 'Crédits insuffisants' };
          }
          throw creditError;
        }

        return { success: true };
      }
    } catch (error: any) {
      console.error('Error consuming matching credits:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Créer un nouvel abonnement
   */
  static async createSubscription(
    recruiterId: string,
    planType: 'basic' | 'pro' | 'gold',
    paymentMethod: string,
    amountPaid: number
  ): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
    try {
      const pricingOptions = await this.getPricingByMode('subscription');
      const plan = pricingOptions.find(p => p.name.toLowerCase().includes(planType));

      if (!plan) {
        return { success: false, error: 'Plan non trouvé' };
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 jours

      const subscriptionData = {
        recruiter_id: recruiterId,
        plan_type: planType,
        credits_included: plan.credits_cost,
        matching_quota: plan.candidate_count, // null pour gold
        matching_used: 0,
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        status: planType === 'gold' ? 'pending' : 'active',
        needs_admin_validation: planType === 'gold',
        payment_method: paymentMethod,
        amount_paid: amountPaid
      };

      const { data, error } = await supabase
        .from('recruiter_ai_subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, subscriptionId: data.id };
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Mettre à jour un tarif
   */
  static async updatePricing(
    pricingId: string,
    updates: Partial<MatchingPricingOption>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('recruiter_matching_pricing')
        .update(updates)
        .eq('id', pricingId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Admin: Valider un abonnement Gold
   */
  static async validateGoldSubscription(
    subscriptionId: string,
    approved: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('recruiter_ai_subscriptions')
        .update({
          status: approved ? 'active' : 'cancelled',
          needs_admin_validation: false
        })
        .eq('id', subscriptionId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
