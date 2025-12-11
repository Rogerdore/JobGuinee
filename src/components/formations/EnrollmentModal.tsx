import { useState } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, Loader } from 'lucide-react';
import { Formation } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import OrangeMoneyPaymentInfo from '../payments/OrangeMoneyPaymentInfo';

interface EnrollmentModalProps {
  formation: Formation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EnrollmentModal({ formation, onClose, onSuccess }: EnrollmentModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    payment_method: 'orange_money' as 'orange_money' | 'lengopay' | 'digitalpay' | 'card'
  });

  const paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', icon: '🟠', instructions: 'Composez #144#32# puis suivez les instructions' },
    { id: 'lengopay', name: 'LengoPay', icon: '💳', instructions: 'Connectez-vous sur LengoPay et effectuez le paiement' },
    { id: 'digitalpay', name: 'DigitalPay SA', icon: '💎', instructions: 'Utilisez votre compte DigitalPay pour payer' },
    { id: 'card', name: 'Visa / Mastercard', icon: '💳', instructions: 'Paiement par carte bancaire sécurisé' }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: enrollmentError } = await supabase
        .from('formation_enrollments')
        .insert({
          user_id: user?.id || null,
          formation_id: formation.id,
          status: 'pending',
          payment_method: formData.payment_method,
          amount: formation.price,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone
        });

      if (enrollmentError) throw enrollmentError;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find(m => m.id === formData.payment_method);

  if (success) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Inscription réussie!</h3>
            <p className="text-gray-600">Vous recevrez un email de confirmation sous peu.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8">
          <div className="bg-gradient-to-r from-[#0E2F56] to-blue-700 px-6 py-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Inscription à la formation</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-900 mb-2">{formation.title}</h3>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Prix:</span>
                <span className="text-2xl font-bold text-[#0E2F56]">{formatPrice(formation.price)}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+224 XXX XX XX XX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Méthode de paiement *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: method.id as any })}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      formData.payment_method === method.id
                        ? 'border-[#0E2F56] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-semibold text-gray-900">{method.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {formData.payment_method === 'orange_money' ? (
              <OrangeMoneyPaymentInfo
                amount={formation.price}
                serviceName={`Formation: ${formation.title}`}
                userEmail={formData.email}
                showWhatsApp={true}
              />
            ) : selectedMethod && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Instructions de paiement:</h4>
                <p className="text-sm text-gray-700">{selectedMethod.instructions}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#0E2F56] hover:bg-blue-800 text-white font-semibold rounded-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Inscription...
                  </>
                ) : (
                  'Confirmer l\'inscription'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
