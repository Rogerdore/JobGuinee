import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Building2,
  CheckCircle,
  AlertCircle,
  Upload,
  CreditCard,
  Briefcase,
  Users,
  TrendingUp,
  Zap,
  Shield
} from 'lucide-react';
import { EnterpriseSubscriptionService, ENTERPRISE_PACKS } from '../services/enterpriseSubscriptionService';
import OrangeMoneyPaymentInfo from '../components/payments/OrangeMoneyPaymentInfo';

interface EnterpriseSubscribeProps {
  onNavigate?: (page: string) => void;
}

export default function EnterpriseSubscribe({ onNavigate }: EnterpriseSubscribeProps) {
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCompany();
  }, [user]);

  const loadCompany = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('companies')
      .select('*')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (data) {
      setCompany(data);
    } else {
      setError('Veuillez créer votre profil entreprise avant de souscrire');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const uploadProof = async () => {
    if (!paymentProof || !user) return null;

    setUploading(true);
    try {
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      const { data, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, paymentProof);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPack || !company || !paymentReference) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let proofUrl = null;
      if (paymentProof) {
        proofUrl = await uploadProof();
      }

      await EnterpriseSubscriptionService.createSubscription(
        company.id,
        selectedPack,
        paymentReference,
        proofUrl || undefined
      );

      setSuccess(true);
      setTimeout(() => {
        onNavigate?.('recruiter-dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Vous devez être connecté pour souscrire</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Veuillez créer votre profil entreprise avant de souscrire à un pack
          </p>
          <button
            onClick={() => onNavigate?.('recruiter-dashboard')}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Aller au dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Souscription envoyée!</h2>
          <p className="text-gray-600">
            Votre demande a été enregistrée. Vous serez redirigé vers votre dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre Pack Enterprise
          </h1>
          <p className="text-xl text-gray-600">
            Des solutions complètes pour optimiser votre recrutement
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {Object.entries(ENTERPRISE_PACKS).map(([code, pack]) => (
            <div
              key={code}
              className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all ${
                selectedPack === code
                  ? 'ring-4 ring-green-500 scale-105'
                  : 'hover:shadow-xl'
              }`}
              onClick={() => setSelectedPack(code)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{pack.name}</h3>
                {selectedPack === code && (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                )}
              </div>

              <div className="text-3xl font-bold text-green-600 mb-6">
                {(pack.price / 1000000).toFixed(1)}M GNF
                <span className="text-sm text-gray-500 font-normal">/mois</span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-700">
                  <Briefcase className="w-4 h-4 mr-2 text-green-600" />
                  {pack.maxActiveJobs === 999 ? 'Offres illimitées' : `${pack.maxActiveJobs} offres actives`}
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Users className="w-4 h-4 mr-2 text-green-600" />
                  {pack.monthlyCVQuota ? `${pack.monthlyCVQuota} CV/mois` : 'CV illimités'}
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Zap className="w-4 h-4 mr-2 text-green-600" />
                  {pack.maxMonthlyMatching ? `${pack.maxMonthlyMatching} matching/mois` : 'Matching illimité'}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                {pack.features.slice(0, 4).map((feature, idx) => (
                  <div key={idx} className="flex items-start text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
                {pack.features.length > 4 && (
                  <p className="text-xs text-gray-500">
                    +{pack.features.length - 4} fonctionnalités
                  </p>
                )}
              </div>

              {pack.requiresValidation && (
                <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center text-sm text-orange-800">
                    <Shield className="w-4 h-4 mr-2" />
                    Validation admin requise
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedPack && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Finaliser la souscription
            </h2>

            <OrangeMoneyPaymentInfo
              amount={ENTERPRISE_PACKS[selectedPack].price}
              serviceName={ENTERPRISE_PACKS[selectedPack].name}
              userEmail={user?.email}
            />

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Référence de paiement Orange Money *
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Ex: OM123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preuve de paiement (optionnel)
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                    id="proof-upload"
                  />
                  <label
                    htmlFor="proof-upload"
                    className="flex items-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Choisir un fichier
                  </label>
                  {paymentProof && (
                    <span className="text-sm text-gray-600">{paymentProof.name}</span>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleSubscribe}
                disabled={loading || uploading || !paymentReference}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading || uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    {uploading ? 'Upload en cours...' : 'Traitement...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Confirmer la souscription
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center">
                En souscrivant, vous acceptez nos conditions d'utilisation.
                {ENTERPRISE_PACKS[selectedPack].requiresValidation &&
                  ' Votre pack nécessite une validation administrative avant activation.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
