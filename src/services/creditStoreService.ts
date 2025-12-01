import { supabase } from '../lib/supabase';
import { PaymentProviderFactory, PaymentSessionInput } from './paymentProviders';
import { isDemoMode, paymentConfig } from '../config/payment.config';

export interface CreditPackage {
  id: string;
  name: string;
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
  payment_method: string | null;
  payment_reference: string | null;
  payment_provider_id: string | null;
  payment_status: string;
  purchase_status: string;
  completed_at: string | null;
  failed_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = 'orange_money' | 'mtn_money' | 'visa' | 'mastercard';

export class CreditStoreService {
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
        .single();

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
    packageId: string,
    paymentMethod?: PaymentMethod,
    customerInfo?: { phone?: string; email?: string }
  ): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_credit_purchase', {
        p_package_id: packageId,
        p_payment_method: paymentMethod || null
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

      const purchaseData = {
        purchase_id: data.purchase_id,
        payment_reference: data.payment_reference,
        amount: data.amount,
        currency: data.currency,
        credits: data.credits
      };

      if (paymentMethod && !isDemoMode()) {
        try {
          const provider = PaymentProviderFactory.getProvider(paymentMethod);

          const sessionInput: PaymentSessionInput = {
            amount: data.amount,
            currency: data.currency,
            reference: data.payment_reference,
            purchaseId: data.purchase_id,
            customerPhone: customerInfo?.phone,
            customerEmail: customerInfo?.email,
            returnUrl: `${window.location.origin}/payment/success`,
            cancelUrl: `${window.location.origin}/payment/cancel`
          };

          const sessionResult = await provider.createPaymentSession(sessionInput);

          if (sessionResult.success && sessionResult.redirectUrl) {
            return {
              success: true,
              message: sessionResult.message || data.message,
              data: {
                ...purchaseData,
                redirect_url: sessionResult.redirectUrl,
                provider_id: sessionResult.providerId,
                requires_redirect: true
              }
            };
          }
        } catch (providerError) {
          console.error('Provider error:', providerError);
        }
      }

      return {
        success: true,
        message: data.message,
        data: purchaseData
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

  static async createPurchaseAndInitiatePayment(
    packageId: string,
    paymentMethod: PaymentMethod,
    customerInfo?: { phone?: string; email?: string }
  ): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    const purchaseResult = await this.createPurchase(packageId, paymentMethod, customerInfo);

    if (!purchaseResult.success) {
      return purchaseResult;
    }

    if (isDemoMode()) {
      setTimeout(async () => {
        await this.completePurchase(
          purchaseResult.data.purchase_id,
          `DEMO-${Date.now()}`
        );
      }, 2000);
    }

    return purchaseResult;
  }

  static async completePurchase(
    purchaseId: string,
    paymentProviderId?: string
  ): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('complete_credit_purchase', {
        p_purchase_id: purchaseId,
        p_payment_provider_id: paymentProviderId || null
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

  static async getPurchaseStatus(purchaseId: string): Promise<CreditPurchase | null> {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('id', purchaseId)
        .single();

      if (error) {
        console.error('Error fetching purchase status:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPurchaseStatus:', error);
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
}
