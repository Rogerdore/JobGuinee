export type PaymentMode = 'DEMO' | 'PRODUCTION';

export interface PaymentConfig {
  mode: PaymentMode;
  webhookBaseUrl: string;
  orangeMoney: {
    apiKey: string;
    merchantId: string;
    apiUrl: string;
  };
  mtnMomo: {
    apiKey: string;
    apiUser: string;
    subscriptionKey: string;
    apiUrl: string;
  };
  stripe: {
    publishableKey: string;
  };
  paypal: {
    clientId: string;
  };
  webhookSecrets: {
    orange: string;
    mtn: string;
    stripe: string;
  };
}

export const paymentConfig: PaymentConfig = {
  mode: (import.meta.env.VITE_PAYMENT_MODE || 'DEMO') as PaymentMode,
  webhookBaseUrl: import.meta.env.VITE_PAYMENT_WEBHOOK_BASE_URL || 'http://localhost:5173/api/payments',
  orangeMoney: {
    apiKey: import.meta.env.VITE_ORANGE_MONEY_API_KEY || '',
    merchantId: import.meta.env.VITE_ORANGE_MONEY_MERCHANT_ID || '',
    apiUrl: import.meta.env.VITE_ORANGE_MONEY_API_URL || 'https://api.orange.com/orange-money-webpay/gn/v1'
  },
  mtnMomo: {
    apiKey: import.meta.env.VITE_MTN_MOMO_API_KEY || '',
    apiUser: import.meta.env.VITE_MTN_MOMO_API_USER || '',
    subscriptionKey: import.meta.env.VITE_MTN_MOMO_SUBSCRIPTION_KEY || '',
    apiUrl: import.meta.env.VITE_MTN_MOMO_API_URL || 'https://sandbox.momodeveloper.mtn.com'
  },
  stripe: {
    publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''
  },
  paypal: {
    clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || ''
  },
  webhookSecrets: {
    orange: import.meta.env.VITE_ORANGE_WEBHOOK_SECRET || '',
    mtn: import.meta.env.VITE_MTN_WEBHOOK_SECRET || '',
    stripe: import.meta.env.VITE_STRIPE_WEBHOOK_SECRET || ''
  }
};

export const isProductionMode = (): boolean => {
  return paymentConfig.mode === 'PRODUCTION';
};

export const isDemoMode = (): boolean => {
  return paymentConfig.mode === 'DEMO';
};

export const getPaymentModeLabel = (): string => {
  return paymentConfig.mode === 'DEMO' ? 'Mode DÉMO (paiements simulés)' : 'Mode PRODUCTION';
};

export const validatePaymentConfig = (method: 'orange_money' | 'mtn_money' | 'visa' | 'mastercard'): boolean => {
  if (isDemoMode()) return true;

  switch (method) {
    case 'orange_money':
      return !!(paymentConfig.orangeMoney.apiKey && paymentConfig.orangeMoney.merchantId);
    case 'mtn_money':
      return !!(paymentConfig.mtnMomo.apiKey && paymentConfig.mtnMomo.subscriptionKey);
    case 'visa':
    case 'mastercard':
      return !!(paymentConfig.stripe.publishableKey || paymentConfig.paypal.clientId);
    default:
      return false;
  }
};
