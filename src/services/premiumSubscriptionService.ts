import { supabase } from '../lib/supabase';

export interface PremiumSubscription {
  id: string;
  user_id: string;
  plan_code: string;
  plan_name: string;
  price_amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled';
  subscription_status: 'pending' | 'active' | 'expired' | 'cancelled';
  payment_proof_url: string | null;
  admin_notes: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubscriptionInput {
  plan_code?: string;
  plan_name?: string;
  price_amount: number;
  currency?: string;
  payment_method?: string;
}

export class PremiumSubscriptionService {
  private static readonly PREMIUM_PRICE = 350000;
  private static readonly PREMIUM_CURRENCY = 'GNF';
  private static readonly PREMIUM_PLAN_CODE = 'premium_pro_plus';
  private static readonly PREMIUM_PLAN_NAME = 'Premium PRO+';

  static async getUserSubscriptions(userId?: string): Promise<PremiumSubscription[]> {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', userId || (await supabase.auth.getUser()).data.user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user subscriptions:', error);
      return [];
    }

    return data || [];
  }

  static async getActiveSubscription(userId?: string): Promise<PremiumSubscription | null> {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', userId || (await supabase.auth.getUser()).data.user?.id)
      .eq('subscription_status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching active subscription:', error);
      return null;
    }

    return data;
  }

  static async hasActivePremium(userId?: string): Promise<boolean> {
    const user = userId || (await supabase.auth.getUser()).data.user?.id;
    if (!user) return false;

    const { data, error } = await supabase.rpc('has_active_premium_subscription', {
      user_id_param: user
    });

    if (error) {
      console.error('Error checking premium status:', error);
      return false;
    }

    return data || false;
  }

  static async createSubscription(input?: Partial<CreateSubscriptionInput>): Promise<{
    success: boolean;
    subscription_id?: string;
    payment_reference?: string;
    message?: string;
  }> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      return { success: false, message: 'Utilisateur non connecté' };
    }

    const reference = `PREM-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const subscriptionData = {
      user_id: user.id,
      plan_code: input?.plan_code || this.PREMIUM_PLAN_CODE,
      plan_name: input?.plan_name || this.PREMIUM_PLAN_NAME,
      price_amount: input?.price_amount || this.PREMIUM_PRICE,
      currency: input?.currency || this.PREMIUM_CURRENCY,
      payment_method: input?.payment_method || 'orange_money',
      payment_reference: reference,
      payment_status: 'pending' as const,
      subscription_status: 'pending' as const
    };

    const { data, error } = await supabase
      .from('premium_subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      console.error('Error creating subscription:', error);
      return { success: false, message: 'Erreur lors de la création de l\'abonnement' };
    }

    return {
      success: true,
      subscription_id: data.id,
      payment_reference: data.payment_reference,
      message: 'Abonnement créé avec succès'
    };
  }

  static async markAsWaitingProof(subscriptionId: string): Promise<{ success: boolean; message: string; error?: any }> {
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .update({
        payment_status: 'waiting_proof',
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating subscription status:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour',
        error: error
      };
    }

    if (!data) {
      return {
        success: false,
        message: 'Abonnement introuvable ou non modifiable'
      };
    }

    return {
      success: true,
      message: 'Statut mis à jour avec succès'
    };
  }

  static async getAllSubscriptions(filters?: {
    payment_status?: string;
    subscription_status?: string;
  }): Promise<PremiumSubscription[]> {
    let query = supabase
      .from('premium_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.payment_status) {
      query = query.eq('payment_status', filters.payment_status);
    }

    if (filters?.subscription_status) {
      query = query.eq('subscription_status', filters.subscription_status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all subscriptions:', error);
      return [];
    }

    return data || [];
  }

  static async activateSubscription(
    subscriptionId: string,
    durationDays: number = 30
  ): Promise<{ success: boolean; message: string; expires_at?: string }> {
    const { data, error } = await supabase.rpc('activate_premium_subscription', {
      subscription_id_param: subscriptionId,
      duration_days: durationDays
    });

    if (error) {
      console.error('Error activating subscription:', error);
      return { success: false, message: 'Erreur lors de l\'activation' };
    }

    return data as { success: boolean; message: string; expires_at?: string };
  }

  static async cancelSubscription(
    subscriptionId: string,
    cancelReason?: string
  ): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('cancel_premium_subscription', {
      subscription_id_param: subscriptionId,
      cancel_reason: cancelReason
    });

    if (error) {
      console.error('Error cancelling subscription:', error);
      return { success: false, message: 'Erreur lors de l\'annulation' };
    }

    return data as { success: boolean; message: string };
  }

  static async updateAdminNotes(
    subscriptionId: string,
    notes: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('premium_subscriptions')
      .update({
        admin_notes: notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId);

    if (error) {
      console.error('Error updating admin notes:', error);
      return false;
    }

    return true;
  }

  static getWhatsAppLink(
    phoneNumber: string,
    planName: string,
    userEmail: string,
    reference: string
  ): string {
    const message = encodeURIComponent(
      `Bonjour, je souhaite activer mon abonnement ${planName}.\n\n` +
      `Email: ${userEmail}\n` +
      `Référence: ${reference}\n\n` +
      `J'ai effectué le paiement et je vous envoie la preuve ci-joint.`
    );
    return `https://wa.me/${phoneNumber}?text=${message}`;
  }

  static formatPrice(amount: number, currency: string = 'GNF'): string {
    if (currency === 'GNF') {
      return `${amount.toLocaleString('fr-FR')} GNF`;
    }
    return `${amount.toLocaleString('fr-FR')} ${currency}`;
  }

  static formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static formatDateTime(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  static getRemainingDays(expirationDate: string | null): number {
    if (!expirationDate) return 0;
    const now = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  static isExpiringSoon(expirationDate: string | null, daysThreshold: number = 7): boolean {
    const remainingDays = this.getRemainingDays(expirationDate);
    return remainingDays > 0 && remainingDays <= daysThreshold;
  }
}
