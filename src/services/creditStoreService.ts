import { supabase } from '../lib/supabase';

export interface CreditPackage {
  id: string;
  package_name: string;
  description: string | null;
  credits_amount: number;
  price_amount: number;
  currency: string;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreditPurchase {
  id: string;
  user_id: string;
  package_id: string;
  credits_amount: number;
  bonus_credits: number;
  total_credits: number;
  price_amount: number;
  currency: string;
  payment_method: string;
  payment_reference: string | null;
  payment_status: 'pending' | 'waiting_proof' | 'completed' | 'failed' | 'cancelled';
  purchase_status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_proof_url: string | null;
  admin_notes: string | null;
  completed_at: string | null;
  failed_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreditStoreSettings {
  id: string;
  admin_phone_number: string;
  admin_whatsapp_number: string;
  payment_instructions: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export class CreditStoreService {
  static async getSettings(): Promise<CreditStoreSettings | null> {
    try {
      const { data, error } = await supabase
        .from('credit_store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching store settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getSettings:', error);
      return null;
    }
  }

  static async updateSettings(settings: Partial<CreditStoreSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      if (!currentSettings) return false;

      const { error } = await supabase
        .from('credit_store_settings')
        .update(settings)
        .eq('id', currentSettings.id);

      if (error) {
        console.error('Error updating settings:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return false;
    }
  }

  static async getAllPackages(): Promise<CreditPackage[]> {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching packages:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllPackages:', error);
      return [];
    }
  }

  static async getPackageById(packageId: string): Promise<CreditPackage | null> {
    try {
      const { data, error } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('id', packageId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error fetching package:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPackageById:', error);
      return null;
    }
  }

  static async createPurchase(
    packageId: string
  ): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_credit_purchase', {
        p_package_id: packageId,
        p_payment_method: 'orange_money'
      });

      if (error) {
        console.error('Error creating purchase:', error);
        return {
          success: false,
          message: 'Erreur lors de la création de l\'achat',
          error: error.message
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Erreur inconnue',
          error: data?.error
        };
      }

      return {
        success: true,
        message: data.message,
        data: {
          purchase_id: data.purchase_id,
          payment_reference: data.payment_reference,
          amount: data.amount,
          currency: data.currency,
          credits: data.credits
        }
      };
    } catch (error) {
      console.error('Error in createPurchase:', error);
      return {
        success: false,
        message: 'Une erreur inattendue est survenue',
        error: 'EXCEPTION'
      };
    }
  }

  static async markAsWaitingProof(purchaseId: string): Promise<{ success: boolean; message: string; error?: any }> {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .update({ payment_status: 'waiting_proof' })
        .eq('id', purchaseId)
        .select()
        .single();

      if (error) {
        console.error('Error updating purchase status:', error);
        return {
          success: false,
          message: error.message || 'Erreur lors de la mise à jour',
          error: error
        };
      }

      if (!data) {
        return {
          success: false,
          message: 'Achat introuvable ou non modifiable'
        };
      }

      return {
        success: true,
        message: 'Statut mis à jour avec succès'
      };
    } catch (error: any) {
      console.error('Error in markAsWaitingProof:', error);
      return {
        success: false,
        message: error?.message || 'Erreur inattendue',
        error: error
      };
    }
  }

  static async completePurchase(
    purchaseId: string,
    adminNotes?: string
  ): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('complete_credit_purchase', {
        p_purchase_id: purchaseId,
        p_admin_notes: adminNotes || null
      });

      if (error) {
        console.error('Error completing purchase:', error);
        return {
          success: false,
          message: 'Erreur lors de la finalisation de l\'achat',
          error: error.message
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Erreur inconnue',
          error: data?.error
        };
      }

      return {
        success: true,
        message: data.message,
        data: {
          credits_added: data.credits_added,
          new_balance: data.new_balance
        }
      };
    } catch (error) {
      console.error('Error in completePurchase:', error);
      return {
        success: false,
        message: 'Une erreur inattendue est survenue',
        error: 'EXCEPTION'
      };
    }
  }

  static async cancelPurchase(
    purchaseId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('cancel_credit_purchase', {
        p_purchase_id: purchaseId,
        p_reason: reason || null
      });

      if (error) {
        console.error('Error cancelling purchase:', error);
        return {
          success: false,
          message: 'Erreur lors de l\'annulation',
          error: error.message
        };
      }

      if (!data || !data.success) {
        return {
          success: false,
          message: data?.message || 'Erreur inconnue',
          error: data?.error
        };
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Error in cancelPurchase:', error);
      return {
        success: false,
        message: 'Une erreur inattendue est survenue',
        error: 'EXCEPTION'
      };
    }
  }

  static async getUserPurchases(limit: number = 50): Promise<CreditPurchase[]> {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching purchases:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserPurchases:', error);
      return [];
    }
  }

  static async getAllPurchases(
    status?: string,
    limit: number = 100
  ): Promise<CreditPurchase[]> {
    try {
      let query = supabase
        .from('credit_purchases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('payment_status', status);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching all purchases:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllPurchases:', error);
      return [];
    }
  }

  static async getPurchaseById(purchaseId: string): Promise<CreditPurchase | null> {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('id', purchaseId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching purchase:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPurchaseById:', error);
      return null;
    }
  }

  static formatPrice(amount: number, currency: string = 'GNF'): string {
    if (currency === 'GNF') {
      return new Intl.NumberFormat('fr-GN', {
        style: 'currency',
        currency: 'GNF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    }

    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }

  static formatCredits(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount);
  }

  static getWhatsAppLink(
    phoneNumber: string,
    packageName: string,
    userEmail: string,
    reference: string
  ): string {
    const message = encodeURIComponent(
      `Preuve Paiement JobGuinée\n\nPack: ${packageName}\nUtilisateur: ${userEmail}\nRéférence: ${reference}\n\nVeuillez trouver ci-joint la capture d'écran de la confirmation Orange Money.`
    );

    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`;
  }
}
