import { useState, useEffect } from 'react';
import { Copy, Check, MessageCircle, Phone, AlertCircle } from 'lucide-react';
import { CreditStoreService, CreditStoreSettings } from '../../services/creditStoreService';

interface OrangeMoneyPaymentInfoProps {
  amount: number;
  reference?: string;
  serviceName: string;
  userEmail?: string;
  showWhatsApp?: boolean;
  className?: string;
}

export default function OrangeMoneyPaymentInfo({
  amount,
  reference,
  serviceName,
  userEmail = '',
  showWhatsApp = true,
  className = ''
}: OrangeMoneyPaymentInfoProps) {
  const [settings, setSettings] = useState<CreditStoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await CreditStoreService.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumber = () => {
    if (settings) {
      navigator.clipboard.writeText(settings.admin_phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCallNumber = () => {
    if (settings) {
      window.location.href = `tel:${settings.admin_phone_number}`;
    }
  };

  const handleOpenWhatsApp = () => {
    if (!settings) return;

    const message = reference
      ? `Bonjour,\n\nJe souhaite effectuer un paiement Orange Money pour ${serviceName}.\n\nMontant: ${amount.toLocaleString()} GNF\nRéférence: ${reference}\nEmail: ${userEmail}\n\nMerci de confirmer.`
      : `Bonjour,\n\nJe souhaite effectuer un paiement Orange Money pour ${serviceName}.\n\nMontant: ${amount.toLocaleString()} GNF\nEmail: ${userEmail}\n\nMerci de confirmer.`;

    const whatsappLink = `https://wa.me/${settings.admin_whatsapp_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
  };

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-24 bg-gray-200 rounded-lg"></div>
        <div className="h-16 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-900 mb-1">Configuration manquante</h4>
            <p className="text-sm text-red-700">
              Les informations de paiement ne sont pas disponibles. Veuillez contacter l'administrateur.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 rounded-xl p-6">
        <div className="flex items-center justify-center mb-3">
          <div className="text-5xl">🟠</div>
        </div>

        <div className="text-center mb-4">
          <div className="text-sm text-gray-600 mb-2">Numéro Orange Money</div>
          <div className="text-4xl font-bold text-orange-600 mb-3">
            {settings.admin_phone_number}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCopyNumber}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition border border-gray-200"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copié!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copier</span>
              </>
            )}
          </button>

          <button
            onClick={handleCallNumber}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
          >
            <Phone className="w-4 h-4" />
            <span>Appeler</span>
          </button>
        </div>
      </div>

      {showWhatsApp && (
        <button
          onClick={handleOpenWhatsApp}
          className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Envoyer preuve via WhatsApp</span>
        </button>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-bold text-blue-900 mb-2 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          Instructions de paiement
        </h4>
        <p className="text-sm text-blue-800">
          {settings.payment_instructions}
        </p>
      </div>

      {reference && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Référence de transaction</div>
          <div className="text-lg font-mono font-bold text-gray-900">{reference}</div>
          <p className="text-xs text-gray-500 mt-2">
            Conservez cette référence pour le suivi de votre paiement
          </p>
        </div>
      )}
    </div>
  );
}
