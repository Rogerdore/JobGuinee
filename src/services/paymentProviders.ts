import { paymentConfig, isDemoMode } from '../config/payment.config';

export interface PaymentSessionInput {
  amount: number;
  currency: string;
  reference: string;
  purchaseId: string;
  customerPhone?: string;
  customerEmail?: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface PaymentSessionResult {
  success: boolean;
  reference: string;
  status: 'pending' | 'created' | 'error';
  redirectUrl?: string;
  providerId?: string;
  message?: string;
  error?: string;
}

export interface PaymentVerificationResult {
  status: 'pending' | 'success' | 'failed' | 'cancelled';
  providerId?: string;
  amount?: number;
  completedAt?: string;
  failureReason?: string;
}

export interface PaymentProvider {
  name: string;
  createPaymentSession(input: PaymentSessionInput): Promise<PaymentSessionResult>;
  verifyPayment(reference: string, providerId?: string): Promise<PaymentVerificationResult>;
  handleWebhook?(payload: any, signature?: string): Promise<{ valid: boolean; reference?: string; status?: string }>;
}

class OrangeMoneyProvider implements PaymentProvider {
  name = 'Orange Money';

  async createPaymentSession(input: PaymentSessionInput): Promise<PaymentSessionResult> {
    if (isDemoMode()) {
      return this.simulatePaymentSession(input);
    }

    try {
      const response = await fetch(`${paymentConfig.orangeMoney.apiUrl}/webpayment/v1/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${paymentConfig.orangeMoney.apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          merchant_key: paymentConfig.orangeMoney.merchantId,
          currency: input.currency,
          order_id: input.reference,
          amount: input.amount,
          return_url: input.returnUrl || `${paymentConfig.webhookBaseUrl}/orange-money/return`,
          cancel_url: input.cancelUrl || `${paymentConfig.webhookBaseUrl}/orange-money/cancel`,
          notif_url: `${paymentConfig.webhookBaseUrl}/orange-money/webhook`,
          lang: 'fr',
          reference: input.purchaseId
        })
      });

      if (!response.ok) {
        throw new Error(`Orange Money API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        reference: input.reference,
        status: 'created',
        redirectUrl: data.payment_url,
        providerId: data.pay_token,
        message: 'Session Orange Money créée'
      };
    } catch (error) {
      console.error('Orange Money payment creation error:', error);
      return {
        success: false,
        reference: input.reference,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  async verifyPayment(reference: string, providerId?: string): Promise<PaymentVerificationResult> {
    if (isDemoMode()) {
      return this.simulateVerification();
    }

    try {
      const response = await fetch(
        `${paymentConfig.orangeMoney.apiUrl}/webpayment/v1/transactionstatus`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${paymentConfig.orangeMoney.apiKey}`
          },
          body: JSON.stringify({
            merchant_key: paymentConfig.orangeMoney.merchantId,
            pay_token: providerId,
            order_id: reference
          })
        }
      );

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        return {
          status: 'success',
          providerId: data.txnid,
          amount: data.amount,
          completedAt: new Date().toISOString()
        };
      } else if (data.status === 'FAILED') {
        return {
          status: 'failed',
          failureReason: data.message
        };
      } else if (data.status === 'CANCELLED') {
        return {
          status: 'cancelled'
        };
      }

      return { status: 'pending' };
    } catch (error) {
      console.error('Orange Money verification error:', error);
      return {
        status: 'failed',
        failureReason: 'Erreur de vérification'
      };
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<{ valid: boolean; reference?: string; status?: string }> {
    if (!signature && !isDemoMode()) {
      return { valid: false };
    }

    return {
      valid: true,
      reference: payload.order_id,
      status: payload.status
    };
  }

  private simulatePaymentSession(input: PaymentSessionInput): PaymentSessionResult {
    return {
      success: true,
      reference: input.reference,
      status: 'created',
      providerId: `OM-DEMO-${Date.now()}`,
      message: 'Session DEMO Orange Money créée'
    };
  }

  private simulateVerification(): PaymentVerificationResult {
    return {
      status: 'success',
      providerId: `OM-DEMO-${Date.now()}`,
      completedAt: new Date().toISOString()
    };
  }
}

class MTNMoneyProvider implements PaymentProvider {
  name = 'MTN Mobile Money';

  async createPaymentSession(input: PaymentSessionInput): Promise<PaymentSessionResult> {
    if (isDemoMode()) {
      return this.simulatePaymentSession(input);
    }

    try {
      const response = await fetch(
        `${paymentConfig.mtnMomo.apiUrl}/collection/v1_0/requesttopay`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'X-Reference-Id': input.reference,
            'X-Target-Environment': 'mtnguinea',
            'Ocp-Apim-Subscription-Key': paymentConfig.mtnMomo.subscriptionKey
          },
          body: JSON.stringify({
            amount: input.amount.toString(),
            currency: input.currency,
            externalId: input.purchaseId,
            payer: {
              partyIdType: 'MSISDN',
              partyId: input.customerPhone || ''
            },
            payerMessage: 'Achat crédits JobGuinée',
            payeeNote: `Référence: ${input.reference}`
          })
        }
      );

      if (!response.ok) {
        throw new Error(`MTN MoMo API error: ${response.statusText}`);
      }

      return {
        success: true,
        reference: input.reference,
        status: 'created',
        providerId: input.reference,
        message: 'Demande MTN Money envoyée'
      };
    } catch (error) {
      console.error('MTN Money payment creation error:', error);
      return {
        success: false,
        reference: input.reference,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  async verifyPayment(reference: string, providerId?: string): Promise<PaymentVerificationResult> {
    if (isDemoMode()) {
      return this.simulateVerification();
    }

    try {
      const response = await fetch(
        `${paymentConfig.mtnMomo.apiUrl}/collection/v1_0/requesttopay/${reference}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${await this.getAccessToken()}`,
            'X-Target-Environment': 'mtnguinea',
            'Ocp-Apim-Subscription-Key': paymentConfig.mtnMomo.subscriptionKey
          }
        }
      );

      const data = await response.json();

      if (data.status === 'SUCCESSFUL') {
        return {
          status: 'success',
          providerId: data.financialTransactionId,
          amount: parseFloat(data.amount),
          completedAt: new Date().toISOString()
        };
      } else if (data.status === 'FAILED') {
        return {
          status: 'failed',
          failureReason: data.reason
        };
      }

      return { status: 'pending' };
    } catch (error) {
      console.error('MTN Money verification error:', error);
      return {
        status: 'failed',
        failureReason: 'Erreur de vérification'
      };
    }
  }

  private async getAccessToken(): Promise<string> {
    return paymentConfig.mtnMomo.apiKey;
  }

  private simulatePaymentSession(input: PaymentSessionInput): PaymentSessionResult {
    return {
      success: true,
      reference: input.reference,
      status: 'created',
      providerId: `MTN-DEMO-${Date.now()}`,
      message: 'Session DEMO MTN Money créée'
    };
  }

  private simulateVerification(): PaymentVerificationResult {
    return {
      status: 'success',
      providerId: `MTN-DEMO-${Date.now()}`,
      completedAt: new Date().toISOString()
    };
  }
}

class CardPaymentProvider implements PaymentProvider {
  name = 'Card Payment';

  async createPaymentSession(input: PaymentSessionInput): Promise<PaymentSessionResult> {
    if (isDemoMode()) {
      return this.simulatePaymentSession(input);
    }

    if (paymentConfig.stripe.publishableKey) {
      return this.createStripeSession(input);
    } else if (paymentConfig.paypal.clientId) {
      return this.createPayPalSession(input);
    }

    return {
      success: false,
      reference: input.reference,
      status: 'error',
      error: 'Aucun provider de carte configuré'
    };
  }

  private async createStripeSession(input: PaymentSessionInput): Promise<PaymentSessionResult> {
    try {
      return {
        success: true,
        reference: input.reference,
        status: 'created',
        redirectUrl: 'https://checkout.stripe.com/pay/...',
        providerId: `stripe_${input.reference}`,
        message: 'Session Stripe créée'
      };
    } catch (error) {
      return {
        success: false,
        reference: input.reference,
        status: 'error',
        error: 'Erreur Stripe'
      };
    }
  }

  private async createPayPalSession(input: PaymentSessionInput): Promise<PaymentSessionResult> {
    try {
      return {
        success: true,
        reference: input.reference,
        status: 'created',
        redirectUrl: 'https://www.paypal.com/checkoutnow?token=...',
        providerId: `paypal_${input.reference}`,
        message: 'Session PayPal créée'
      };
    } catch (error) {
      return {
        success: false,
        reference: input.reference,
        status: 'error',
        error: 'Erreur PayPal'
      };
    }
  }

  async verifyPayment(reference: string, providerId?: string): Promise<PaymentVerificationResult> {
    if (isDemoMode()) {
      return this.simulateVerification();
    }

    return { status: 'pending' };
  }

  private simulatePaymentSession(input: PaymentSessionInput): PaymentSessionResult {
    return {
      success: true,
      reference: input.reference,
      status: 'created',
      providerId: `CARD-DEMO-${Date.now()}`,
      message: 'Session DEMO Carte bancaire créée'
    };
  }

  private simulateVerification(): PaymentVerificationResult {
    return {
      status: 'success',
      providerId: `CARD-DEMO-${Date.now()}`,
      completedAt: new Date().toISOString()
    };
  }
}

export class PaymentProviderFactory {
  private static providers: Map<string, PaymentProvider> = new Map([
    ['orange_money', new OrangeMoneyProvider()],
    ['mtn_money', new MTNMoneyProvider()],
    ['visa', new CardPaymentProvider()],
    ['mastercard', new CardPaymentProvider()]
  ]);

  static getProvider(method: 'orange_money' | 'mtn_money' | 'visa' | 'mastercard'): PaymentProvider {
    const provider = this.providers.get(method);
    if (!provider) {
      throw new Error(`Provider not found for method: ${method}`);
    }
    return provider;
  }

  static getAllProviders(): PaymentProvider[] {
    return Array.from(this.providers.values());
  }
}
