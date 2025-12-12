import { supabase } from '../lib/supabase';

export interface CartHistoryItem {
  id: string;
  recruiter_id: string;
  candidate_id: string;
  profile_snapshot: any;
  price_at_selection: number;
  experience_level: 'junior' | 'intermediate' | 'senior';
  added_to_cart_at: string;
  removed_from_cart_at?: string;
  converted_to_purchase: boolean;
  purchase_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DirectPurchase {
  id: string;
  recruiter_id: string;
  profile_ids: string[];
  total_profiles: number;
  total_amount: number;
  breakdown: {
    junior?: { count: number; price: number };
    intermediate?: { count: number; price: number };
    senior?: { count: number; price: number };
  };
  payment_method: string;
  payment_reference: string;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  payment_proof_url?: string;
  payment_verified_at?: string;
  payment_verified_by?: string;
  purchase_status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  confirmation_code?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  admin_notes?: string;
  validated_by?: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
}

class CartHistoryService {
  // ===== HISTORIQUE DU PANIER =====

  /**
   * Ajouter un profil à l'historique du panier
   */
  async addToCartHistory(
    recruiterId: string,
    candidateId: string,
    profileSnapshot: any,
    priceAtSelection: number,
    experienceLevel: 'junior' | 'intermediate' | 'senior'
  ): Promise<CartHistoryItem> {
    const { data, error } = await supabase
      .from('profile_cart_history')
      .insert({
        recruiter_id: recruiterId,
        candidate_id: candidateId,
        profile_snapshot: profileSnapshot,
        price_at_selection: priceAtSelection,
        experience_level: experienceLevel
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Retirer un profil du panier actif
   */
  async removeFromCartHistory(recruiterId: string, candidateId: string): Promise<boolean> {
    const { error } = await supabase
      .from('profile_cart_history')
      .update({
        removed_from_cart_at: new Date().toISOString()
      })
      .eq('recruiter_id', recruiterId)
      .eq('candidate_id', candidateId)
      .is('removed_from_cart_at', null);

    return !error;
  }

  /**
   * Obtenir le panier actif d'un recruteur
   */
  async getActiveCart(recruiterId: string): Promise<CartHistoryItem[]> {
    const { data, error } = await supabase
      .from('profile_cart_history')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .is('removed_from_cart_at', null)
      .order('added_to_cart_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtenir l'historique complet du panier (y compris les items retirés)
   */
  async getCartHistory(recruiterId: string, limit: number = 50): Promise<CartHistoryItem[]> {
    const { data, error } = await supabase
      .from('profile_cart_history')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('added_to_cart_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtenir les profils précédemment dans le panier (pour suggestions)
   */
  async getPreviouslySelectedProfiles(recruiterId: string, limit: number = 10): Promise<CartHistoryItem[]> {
    const { data, error } = await supabase
      .from('profile_cart_history')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .not('removed_from_cart_at', 'is', null)
      .eq('converted_to_purchase', false)
      .order('removed_from_cart_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Archiver le panier actuel (marquer tous les items comme retirés)
   */
  async archiveCurrentCart(recruiterId: string): Promise<boolean> {
    const { error } = await supabase.rpc('archive_current_cart', {
      p_recruiter_id: recruiterId
    });

    return !error;
  }

  // ===== ACHATS DIRECTS =====

  /**
   * Créer un achat direct de profils
   */
  async createDirectPurchase(
    recruiterId: string,
    cartItems: CartHistoryItem[]
  ): Promise<DirectPurchase> {
    // Calculer le breakdown par niveau
    const breakdown: any = {
      junior: { count: 0, price: 0 },
      intermediate: { count: 0, price: 0 },
      senior: { count: 0, price: 0 }
    };

    let totalAmount = 0;
    const profileIds: string[] = [];

    cartItems.forEach(item => {
      profileIds.push(item.candidate_id);
      totalAmount += item.price_at_selection;
      breakdown[item.experience_level].count += 1;
      breakdown[item.experience_level].price += item.price_at_selection;
    });

    // Générer une référence unique
    const paymentReference = `DP${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const purchaseData = {
      recruiter_id: recruiterId,
      profile_ids: profileIds,
      total_profiles: cartItems.length,
      total_amount: totalAmount,
      breakdown: breakdown,
      payment_method: 'orange_money',
      payment_reference: paymentReference,
      payment_status: 'pending',
      purchase_status: 'pending'
    };

    const { data, error } = await supabase
      .from('direct_profile_purchases')
      .insert(purchaseData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Mettre à jour la preuve de paiement
   */
  async updatePaymentProof(
    purchaseId: string,
    paymentProofUrl: string
  ): Promise<DirectPurchase> {
    const { data, error } = await supabase
      .from('direct_profile_purchases')
      .update({
        payment_proof_url: paymentProofUrl,
        payment_status: 'waiting_proof',
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Obtenir les achats directs d'un recruteur
   */
  async getDirectPurchases(recruiterId: string): Promise<DirectPurchase[]> {
    const { data, error } = await supabase
      .from('direct_profile_purchases')
      .select('*')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtenir un achat direct par ID
   */
  async getDirectPurchaseById(purchaseId: string): Promise<DirectPurchase | null> {
    const { data, error } = await supabase
      .from('direct_profile_purchases')
      .select('*')
      .eq('id', purchaseId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * Annuler un achat direct
   */
  async cancelDirectPurchase(
    purchaseId: string,
    recruiterId: string,
    reason?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('cancel_direct_purchase', {
      p_purchase_id: purchaseId,
      p_recruiter_id: recruiterId,
      p_reason: reason
    });

    if (error) {
      console.error('Error canceling direct purchase:', error);
      return false;
    }

    return data === true;
  }

  /**
   * Valider un achat direct (Admin uniquement)
   */
  async validateDirectPurchase(
    purchaseId: string,
    adminId: string,
    notes?: string
  ): Promise<any> {
    const { data, error } = await supabase.rpc('validate_direct_purchase', {
      p_purchase_id: purchaseId,
      p_admin_id: adminId,
      p_notes: notes
    });

    if (error) throw error;
    return data;
  }

  /**
   * Obtenir tous les achats directs en attente (Admin)
   */
  async getPendingDirectPurchases(): Promise<DirectPurchase[]> {
    const { data, error } = await supabase
      .from('direct_profile_purchases')
      .select('*')
      .eq('purchase_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Obtenir le lien WhatsApp pour le support paiement
   */
  getWhatsAppPaymentLink(purchase: DirectPurchase, userEmail: string): string {
    const message = `Bonjour JobGuinée,

Je viens d'effectuer le paiement pour l'achat direct de profils suivant:

Référence: ${purchase.payment_reference}
Nombre de profils: ${purchase.total_profiles}
Montant total: ${this.formatPrice(purchase.total_amount)} GNF
Email: ${userEmail}

Merci de valider mon paiement.`;

    const whatsappNumber = '224620000000'; // À remplacer par le vrai numéro
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  /**
   * Formater un prix
   */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Calculer les statistiques du panier
   */
  calculateCartStats(items: CartHistoryItem[]) {
    const stats = {
      total: items.length,
      junior: 0,
      intermediate: 0,
      senior: 0,
      totalAmount: 0,
      breakdown: {} as any
    };

    items.forEach(item => {
      stats[item.experience_level]++;
      stats.totalAmount += item.price_at_selection;
    });

    stats.breakdown = {
      junior: {
        count: stats.junior,
        price: items.filter(i => i.experience_level === 'junior')
          .reduce((sum, i) => sum + i.price_at_selection, 0)
      },
      intermediate: {
        count: stats.intermediate,
        price: items.filter(i => i.experience_level === 'intermediate')
          .reduce((sum, i) => sum + i.price_at_selection, 0)
      },
      senior: {
        count: stats.senior,
        price: items.filter(i => i.experience_level === 'senior')
          .reduce((sum, i) => sum + i.price_at_selection, 0)
      }
    };

    return stats;
  }
}

export const cartHistoryService = new CartHistoryService();
