import { supabase } from '../lib/supabase';

export interface CVThequePack {
  id: string;
  pack_name: string;
  pack_type: 'junior' | 'intermediate' | 'senior' | 'mixed' | 'enterprise' | 'gold';
  total_profiles: number;
  price_gnf: number;
  description?: string;
  features?: string[];
  is_active: boolean;
  order_index: number;
  experience_level?: string;
  mix_composition?: {
    junior?: number;
    intermediate?: number;
    senior?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface EnterpriseSubscription {
  id: string;
  company_id: string;
  profile_id: string;
  subscription_type: 'basic' | 'silver' | 'gold';
  price_gnf: number;
  status: 'pending' | 'active' | 'rejected' | 'expired' | 'cancelled';
  requires_validation: boolean;
  approved_by?: string;
  approval_notes?: string;
  approved_at?: string;
  rejection_reason?: string;
  payment_method: string;
  payment_reference?: string;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled';
  payment_proof_url?: string;
  start_date?: string;
  end_date?: string;
  monthly_cv_quota?: number;
  cv_consumed: number;
  created_at: string;
  updated_at: string;
}

export interface PackPurchase {
  id: string;
  buyer_id: string;
  pack_id?: string;
  pack_name: string;
  pack_type: string;
  total_profiles: number;
  price_paid: number;
  profiles_remaining: number;
  profiles_consumed: number;
  payment_method: string;
  payment_reference?: string;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled';
  payment_proof_url?: string;
  purchase_status: 'pending' | 'active' | 'expired' | 'cancelled';
  activated_at?: string;
  expires_at?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

class CVThequePricingService {
  // ===== PACKS =====

  async getAllPacks(): Promise<CVThequePack[]> {
    const { data, error } = await supabase
      .from('cvtheque_pricing_packs')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getPackById(packId: string): Promise<CVThequePack | null> {
    const { data, error } = await supabase
      .from('cvtheque_pricing_packs')
      .select('*')
      .eq('id', packId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async getPacksByType(packType: string): Promise<CVThequePack[]> {
    const { data, error } = await supabase
      .from('cvtheque_pricing_packs')
      .select('*')
      .eq('pack_type', packType)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // ===== ACHATS DE PACKS =====

  async purchasePack(
    buyerId: string,
    packId: string,
    paymentProofUrl?: string
  ): Promise<PackPurchase> {
    const pack = await this.getPackById(packId);
    if (!pack) throw new Error('Pack non trouvé');

    const purchaseData: Partial<PackPurchase> = {
      buyer_id: buyerId,
      pack_id: packId,
      pack_name: pack.pack_name,
      pack_type: pack.pack_type,
      total_profiles: pack.total_profiles,
      price_paid: pack.price_gnf,
      profiles_remaining: pack.total_profiles,
      profiles_consumed: 0,
      payment_method: 'orange_money',
      payment_status: paymentProofUrl ? 'waiting_proof' : 'pending',
      payment_proof_url: paymentProofUrl,
      purchase_status: 'pending',
      payment_reference: `CVPACK_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`
    };

    const { data, error } = await supabase
      .from('cvtheque_pack_purchases')
      .insert(purchaseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserPacks(userId: string): Promise<PackPurchase[]> {
    const { data, error } = await supabase
      .from('cvtheque_pack_purchases')
      .select('*')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActivePacks(userId: string): Promise<PackPurchase[]> {
    const { data, error } = await supabase
      .from('cvtheque_pack_purchases')
      .select('*')
      .eq('buyer_id', userId)
      .eq('purchase_status', 'active')
      .gt('profiles_remaining', 0)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async consumePackCredit(buyerId: string, candidateId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('consume_cvtheque_pack_credit', {
      p_buyer_id: buyerId,
      p_candidate_id: candidateId
    });

    if (error) {
      console.error('Error consuming pack credit:', error);
      return false;
    }

    return data === true;
  }

  // ===== ABONNEMENTS ENTREPRISE =====

  async createEnterpriseSubscription(
    companyId: string,
    profileId: string,
    subscriptionType: 'basic' | 'silver' | 'gold',
    paymentProofUrl?: string
  ): Promise<EnterpriseSubscription> {
    // Récupérer le pack correspondant
    const packName = subscriptionType === 'basic' ? 'Basic Entreprise' :
                     subscriptionType === 'silver' ? 'Silver Entreprise' : 'Gold Entreprise';

    const { data: pack } = await supabase
      .from('cvtheque_pricing_packs')
      .select('*')
      .eq('pack_name', packName)
      .maybeSingle();

    if (!pack) throw new Error('Pack entreprise non trouvé');

    const requiresValidation = subscriptionType === 'gold';
    const monthlyQuota = subscriptionType === 'basic' ? 60 :
                        subscriptionType === 'silver' ? 150 : null;

    const subscriptionData: Partial<EnterpriseSubscription> = {
      company_id: companyId,
      profile_id: profileId,
      subscription_type: subscriptionType,
      price_gnf: pack.price_gnf,
      status: requiresValidation ? 'pending' : 'active',
      requires_validation: requiresValidation,
      payment_method: 'orange_money',
      payment_status: paymentProofUrl ? 'waiting_proof' : 'pending',
      payment_proof_url: paymentProofUrl,
      monthly_cv_quota: monthlyQuota,
      cv_consumed: 0,
      payment_reference: `ENTSUB_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`
    };

    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserSubscriptions(profileId: string): Promise<EnterpriseSubscription[]> {
    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getActiveSubscription(profileId: string): Promise<EnterpriseSubscription | null> {
    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString())
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async isGoldActive(profileId: string): Promise<boolean> {
    const subscription = await this.getActiveSubscription(profileId);
    return subscription?.subscription_type === 'gold' && subscription.status === 'active';
  }

  async hasAvailableCredits(profileId: string): Promise<boolean> {
    // Vérifier si GOLD actif
    if (await this.isGoldActive(profileId)) {
      return true;
    }

    // Vérifier les packs actifs
    const packs = await this.getActivePacks(profileId);
    if (packs.some(pack => pack.profiles_remaining > 0)) {
      return true;
    }

    // Vérifier abonnement entreprise avec quota
    const subscription = await this.getActiveSubscription(profileId);
    if (subscription && subscription.monthly_cv_quota) {
      return subscription.cv_consumed < subscription.monthly_cv_quota;
    }

    return false;
  }

  // ===== ADMIN =====

  async updatePack(packId: string, updates: Partial<CVThequePack>): Promise<CVThequePack> {
    const { data, error } = await supabase
      .from('cvtheque_pricing_packs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', packId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async approveSubscription(
    subscriptionId: string,
    adminId: string,
    notes?: string
  ): Promise<EnterpriseSubscription> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // 30 jours

    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .update({
        status: 'active',
        approved_by: adminId,
        approval_notes: notes,
        approved_at: new Date().toISOString(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async rejectSubscription(
    subscriptionId: string,
    reason: string
  ): Promise<EnterpriseSubscription> {
    const { data, error } = await supabase
      .from('enterprise_subscriptions')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async activatePackPurchase(purchaseId: string): Promise<PackPurchase> {
    const { data, error } = await supabase
      .from('cvtheque_pack_purchases')
      .update({
        purchase_status: 'active',
        payment_status: 'completed',
        activated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async markPackAsWaitingProof(purchaseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('cvtheque_pack_purchases')
      .update({
        payment_status: 'waiting_proof',
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId);

    return !error;
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' GNF';
  }

  getWhatsAppLink(whatsappNumber: string, packName: string, userEmail: string, reference: string): string {
    const message = `Bonjour JobGuinée,\n\nJe viens d'effectuer le paiement pour le pack CVThèque suivant:\n\nPack: ${packName}\nRéférence: ${reference}\nEmail: ${userEmail}\n\nMerci de valider mon achat.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }
}

export const cvthequePricingService = new CVThequePricingService();