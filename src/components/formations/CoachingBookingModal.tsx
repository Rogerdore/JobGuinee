import { useState } from 'react';
import { X, Calendar, Clock, CheckCircle, Loader, MessageSquare, Video, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CoachingBookingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CoachingBookingModal({ onClose, onSuccess }: CoachingBookingModalProps) {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    coaching_type: 'cv_review' as 'cv_review' | 'interview_prep' | 'career_orientation',
    scheduled_date: '',
    scheduled_time: '',
    duration: 60,
    full_name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || '',
    notes: '',
    payment_method: 'orange_money' as 'orange_money' | 'lengopay' | 'digitalpay' | 'card'
  });

  const coachingTypes = [
    {
      id: 'cv_review',
      name: 'Révision de CV',
      icon: FileText,
      description: 'Optimisez votre CV avec un expert',
      prices: { 30: 50000, 60: 90000, 120: 150000 }
    },
    {
      id: 'interview_prep',
      name: 'Préparation entretien',
      icon: Video,
      description: 'Entraînez-vous pour vos entretiens',
      prices: { 30: 60000, 60: 100000, 120: 180000 }
    },
    {
      id: 'career_orientation',
      name: 'Orientation carrière',
      icon: MessageSquare,
      description: 'Définissez votre parcours professionnel',
      prices: { 30: 70000, 60: 120000, 120: 200000 }
    }
  ];

  const durations = [
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 heure' },
    { value: 120, label: '2 heures' }
  ];

  const paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', icon: '🟠' },
    { id: 'lengopay', name: 'LengoPay', icon: '💳' },
    { id: 'digitalpay', name: 'DigitalPay SA', icon: '💎' },
    { id: 'card', name: 'Visa / Mastercard', icon: '💳' }
  ];

  const selectedCoaching = coachingTypes.find(c => c.id === formData.coaching_type);
  const calculatedPrice = selectedCoaching?.prices[formData.duration as keyof typeof selectedCoaching.prices] || 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'currency',
      currency: 'GNF',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const scheduledDateTime = new Date(`${formData.scheduled_date}T${formData.scheduled_time}`);

      const { error: bookingError } = await supabase
        .from('coaching_bookings')
        .insert({
          user_id: user?.id || null,
          coaching_type: formData.coaching_type,
          scheduled_date: scheduledDateTime.toISOString(),
          duration: formData.duration,
          status: 'pending',
          payment_method: formData.payment_method,
          amount: calculatedPrice,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes
        });

      if (bookingError) throw bookingError;

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

  if (success) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm"></div>
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Réservation confirmée!</h3>
            <p className="text-gray-600">Vous recevrez un email avec les détails de votre session.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-[#0E2F56] to-blue-700 px-6 py-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Réserver une session de coaching</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type de coaching *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {coachingTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, coaching_type: type.id as any })}
                      className={`p-4 border-2 rounded-lg text-left transition ${
                        formData.coaching_type === type.id
                          ? 'border-[#0E2F56] bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mb-2 ${formData.coaching_type === type.id ? 'text-[#0E2F56]' : 'text-gray-600'}`} />
                      <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
                      <p className="text-xs text-gray-600">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Durée de la session *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {durations.map((dur) => (
                  <button
                    key={dur.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, duration: dur.value })}
                    className={`p-3 border-2 rounded-lg text-center transition ${
                      formData.duration === dur.value
                        ? 'border-[#0E2F56] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{dur.label}</div>
                    <div className="text-sm text-gray-600 mt-1">{formatPrice(selectedCoaching?.prices[dur.value as keyof typeof selectedCoaching.prices] || 0)}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  min={getMinDate()}
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heure *
                </label>
                <input
                  type="time"
                  required
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes / Questions (optionnel)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Partagez vos objectifs ou questions pour cette session..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Méthode de paiement *
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: method.id as any })}
                    className={`p-3 border-2 rounded-lg text-center transition ${
                      formData.payment_method === method.id
                        ? 'border-[#0E2F56] bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-xs font-medium text-gray-900">{method.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total à payer:</span>
                <span className="text-3xl font-bold text-[#0E2F56]">{formatPrice(calculatedPrice)}</span>
              </div>
            </div>

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
                    Réservation...
                  </>
                ) : (
                  'Confirmer la réservation'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
