import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Users,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  Loader,
  Sparkles,
} from 'lucide-react';
import { targetedDiffusionService, AudienceFilters } from '../services/targetedDiffusionService';
import { useAuth } from '../contexts/AuthContext';

interface CampaignCreateProps {
  onNavigate: (page: string) => void;
}

export default function CampaignCreate({ onNavigate }: CampaignCreateProps) {
  const { user } = useAuth();

  const params = new URLSearchParams(window.location.search);
  const entityType = params.get('entity_type') as 'job' | 'training' | 'post' | null;
  const entityId = params.get('entity_id');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entityDetails, setEntityDetails] = useState<any>(null);
  const [entityApproved, setEntityApproved] = useState(false);

  const [campaignName, setCampaignName] = useState('');

  const [audienceFilters, setAudienceFilters] = useState<AudienceFilters>({
    active_within_days: 30,
    min_completion: 80,
  });
  const [audienceAvailable, setAudienceAvailable] = useState(0);
  const [calculatingAudience, setCalculatingAudience] = useState(false);

  const [channels, setChannels] = useState({
    email: { enabled: false, quantity: 0 },
    sms: { enabled: false, quantity: 0 },
    whatsapp: { enabled: false, quantity: 0 },
  });

  const [totalCost, setTotalCost] = useState(0);
  const [channelCosts, setChannelCosts] = useState({ email: 500, sms: 1000, whatsapp: 3000 });
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState('+224 622 00 00 00');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const costs = await targetedDiffusionService.getChannelCosts();
        setChannelCosts({
          email: costs.email || 500,
          sms: costs.sms || 1000,
          whatsapp: costs.whatsapp || 3000,
        });

        const omNumber = await targetedDiffusionService.getOrangeMoneyNumber();
        setOrangeMoneyNumber(omNumber);
      } catch (error) {
        console.error('Error loading config:', error);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!entityType || !entityId) {
      setError('Paramètres manquants');
      return;
    }

    loadEntityDetails();
  }, [entityType, entityId]);

  useEffect(() => {
    if (audienceFilters) {
      calculateAudience();
    }
  }, [audienceFilters]);

  useEffect(() => {
    calculateTotalCost();
  }, [channels]);

  const loadEntityDetails = async () => {
    if (!entityType || !entityId) return;

    setLoading(true);
    try {
      const approved = await targetedDiffusionService.checkEntityApproved(entityType, entityId);
      setEntityApproved(approved);

      if (!approved) {
        setError('Cette annonce doit être validée avant de pouvoir lancer une diffusion ciblée.');
        return;
      }

      const details = await targetedDiffusionService.getEntityDetails(entityType, entityId);
      setEntityDetails(details);

      if (details) {
        const defaultName = `Campagne ${details.title || details.name || 'Sans titre'} - ${new Date().toLocaleDateString('fr-FR')}`;
        setCampaignName(defaultName);
      }
    } catch (err) {
      console.error('Error loading entity:', err);
      setError('Erreur lors du chargement de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const calculateAudience = async () => {
    setCalculatingAudience(true);
    try {
      const count = await targetedDiffusionService.calculateAvailableAudience(audienceFilters);
      setAudienceAvailable(count);
    } catch (err) {
      console.error('Error calculating audience:', err);
    } finally {
      setCalculatingAudience(false);
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    if (channels.email.enabled) total += channels.email.quantity * channelCosts.email;
    if (channels.sms.enabled) total += channels.sms.quantity * channelCosts.sms;
    if (channels.whatsapp.enabled) total += channels.whatsapp.quantity * channelCosts.whatsapp;
    setTotalCost(total);
  };

  const handleChannelToggle = (channelType: 'email' | 'sms' | 'whatsapp') => {
    setChannels((prev) => ({
      ...prev,
      [channelType]: {
        ...prev[channelType],
        enabled: !prev[channelType].enabled,
        quantity: !prev[channelType].enabled ? Math.min(100, audienceAvailable) : 0,
      },
    }));
  };

  const handleQuantityChange = (channelType: 'email' | 'sms' | 'whatsapp', value: number) => {
    const clampedValue = Math.max(1, Math.min(value, audienceAvailable));
    setChannels((prev) => ({
      ...prev,
      [channelType]: {
        ...prev[channelType],
        quantity: clampedValue,
      },
    }));
  };

  const canGoToNextStep = () => {
    switch (step) {
      case 1:
        return entityDetails && campaignName.trim().length > 0;
      case 2:
        return audienceAvailable > 0;
      case 3:
        return (
          (channels.email.enabled && channels.email.quantity > 0) ||
          (channels.sms.enabled && channels.sms.quantity > 0) ||
          (channels.whatsapp.enabled && channels.whatsapp.quantity > 0)
        );
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canGoToNextStep()) {
      setStep(step + 1);
    }
  };

  const handleSubmitCampaign = async () => {
    if (!entityType || !entityId || !user) return;

    setLoading(true);
    setError(null);

    try {
      const enabledChannels = [];
      if (channels.email.enabled && channels.email.quantity > 0) {
        enabledChannels.push({ channel_type: 'email' as const, quantity: channels.email.quantity });
      }
      if (channels.sms.enabled && channels.sms.quantity > 0) {
        enabledChannels.push({ channel_type: 'sms' as const, quantity: channels.sms.quantity });
      }
      if (channels.whatsapp.enabled && channels.whatsapp.quantity > 0) {
        enabledChannels.push({ channel_type: 'whatsapp' as const, quantity: channels.whatsapp.quantity });
      }

      const campaign = await targetedDiffusionService.createCampaign(
        entityType,
        entityId,
        campaignName,
        audienceFilters,
        enabledChannels
      );

      await targetedDiffusionService.submitCampaignForPayment(campaign.id);

      setShowPaymentModal(true);
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setError(err.message || 'Erreur lors de la création de la campagne');
    } finally {
      setLoading(false);
    }
  };

  if (error && !entityApproved) {
    const isParamsMissing = error === 'Paramètres manquants';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {isParamsMissing ? 'Un instant !' : 'Votre annonce est en cours de validation'}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {isParamsMissing
                  ? "Il semble qu'il manque des informations pour accéder à cette page. Pas d'inquiétude, nous allons vous guider !"
                  : "Votre annonce doit être approuvée par notre équipe avant de pouvoir lancer une campagne de diffusion ciblée. Ce processus garantit la qualité et la conformité de toutes les annonces sur la plateforme."
                }
              </p>
            </div>
          </div>

          {!isParamsMissing && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Étapes à suivre
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Votre annonce est en cours d'examen par notre équipe de modération</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Vous recevrez une notification dès qu'elle sera approuvée (généralement sous 24h)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Une fois approuvée, vous pourrez lancer votre campagne de diffusion</span>
                </li>
              </ul>
            </div>
          )}

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">Conseil pro</h4>
                <p className="text-sm text-amber-800">
                  {isParamsMissing
                    ? "Pour créer une campagne de diffusion, commencez par sélectionner une annonce depuis votre tableau de bord."
                    : "En attendant la validation, vous pouvez consulter les statistiques de vos autres annonces et préparer votre stratégie de diffusion."
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onNavigate('recruiter-dashboard')}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-[#0E2F56] to-blue-700 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour au tableau de bord
            </button>
            <button
              onClick={() => onNavigate('jobs')}
              className="flex-1 px-6 py-3.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-[#0E2F56] hover:text-[#0E2F56] hover:shadow-md transition-all duration-200 font-semibold flex items-center justify-center gap-2"
            >
              <Briefcase className="w-5 h-5" />
              Voir les offres d'emploi
            </button>
          </div>

          {!isParamsMissing && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Besoin d'aide ?{' '}
                <button
                  onClick={() => onNavigate('partner-hub')}
                  className="text-[#0E2F56] hover:text-blue-700 font-semibold underline"
                >
                  Contactez notre support
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (showPaymentModal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Paiement de la diffusion ciblée</h2>

          <div className="bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white rounded-xl p-6 mb-6">
            <p className="text-lg font-semibold mb-2">Montant total</p>
            <p className="text-4xl font-bold">{targetedDiffusionService.formatCurrency(totalCost)}</p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[#0E2F56] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-semibold text-gray-900">Effectuez le paiement via Orange Money</p>
                <p className="text-gray-600 text-sm mt-1">
                  Numéro Admin : <span className="font-mono font-bold text-[#FF8C00]">{orangeMoneyNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[#0E2F56] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-semibold text-gray-900">Envoyez la preuve de paiement</p>
                <p className="text-gray-600 text-sm mt-1">
                  Par WhatsApp ou SMS au même numéro
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-[#0E2F56] text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-semibold text-gray-900">Validation Admin</p>
                <p className="text-gray-600 text-sm mt-1">
                  La diffusion sera lancée après validation par notre équipe
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note :</strong> Votre campagne est enregistrée. Vous recevrez une notification dès que la diffusion sera lancée.
            </p>
          </div>

          <button
            onClick={() => onNavigate('recruiter-dashboard')}
            className="w-full py-3 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4275] transition font-semibold"
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => onNavigate('recruiter-dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Retour
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#0E2F56] to-[#1a4275] px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Créer une campagne de diffusion ciblée</h1>
            <p className="text-blue-100">Diffusez votre annonce via Email, SMS et WhatsApp</p>
          </div>

          <div className="px-8 py-6">
            <div className="flex items-center justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition ${
                        s === step
                          ? 'bg-[#FF8C00] text-white'
                          : s < step
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {s < step ? <CheckCircle className="w-6 h-6" /> : s}
                    </div>
                    <span className="text-xs mt-2 text-gray-600 font-medium">
                      {s === 1 && 'Annonce'}
                      {s === 2 && 'Audience'}
                      {s === 3 && 'Canaux'}
                      {s === 4 && 'Validation'}
                    </span>
                  </div>
                  {s < 4 && (
                    <div
                      className={`flex-1 h-1 mx-2 transition ${
                        s < step ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Sélection de l'annonce</h2>

                {entityDetails && (
                  <div className="border-2 border-[#FF8C00] rounded-xl p-6 bg-orange-50">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-[#0E2F56] rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {entityDetails.title || entityDetails.name}
                        </h3>
                        {entityDetails.company_name && (
                          <p className="text-gray-600 mb-1">{entityDetails.company_name}</p>
                        )}
                        {entityDetails.location && (
                          <p className="text-gray-500 text-sm">{entityDetails.location}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de la campagne
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    placeholder="Ex: Campagne Recrutement Développeur - Janvier 2024"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Définir l'audience cible</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Métier / Poste recherché
                    </label>
                    <input
                      type="text"
                      value={audienceFilters.job_title || ''}
                      onChange={(e) =>
                        setAudienceFilters({ ...audienceFilters, job_title: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      placeholder="Ex: Développeur, Comptable..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur d'activité
                    </label>
                    <input
                      type="text"
                      value={audienceFilters.sector || ''}
                      onChange={(e) =>
                        setAudienceFilters({ ...audienceFilters, sector: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      placeholder="Ex: Informatique, Finance..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={audienceFilters.location || ''}
                      onChange={(e) =>
                        setAudienceFilters({ ...audienceFilters, location: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                      placeholder="Ex: Conakry, Kindia..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expérience minimale (années)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={audienceFilters.min_experience || 0}
                      onChange={(e) =>
                        setAudienceFilters({
                          ...audienceFilters,
                          min_experience: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expérience maximale (années)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={audienceFilters.max_experience || 100}
                      onChange={(e) =>
                        setAudienceFilters({
                          ...audienceFilters,
                          max_experience: parseInt(e.target.value) || 100,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Actif dans les derniers (jours)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={audienceFilters.active_within_days || 30}
                      onChange={(e) =>
                        setAudienceFilters({
                          ...audienceFilters,
                          active_within_days: parseInt(e.target.value) || 30,
                        })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Audience disponible</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {calculatingAudience ? (
                            <Loader className="w-8 h-8 animate-spin text-[#FF8C00]" />
                          ) : (
                            `${audienceAvailable} candidats`
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Sélectionner les canaux</h2>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Audience disponible :</strong> {audienceAvailable} candidats
                  </p>
                </div>

                <div className="space-y-4">
                  <div
                    className={`border-2 rounded-xl p-6 transition ${
                      channels.email.enabled
                        ? 'border-[#FF8C00] bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">Email</h3>
                          <p className="text-sm text-gray-600">
                            {targetedDiffusionService.formatCurrency(channelCosts.email)} / personne
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channels.email.enabled}
                          onChange={() => handleChannelToggle('email')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF8C00]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF8C00]"></div>
                      </label>
                    </div>

                    {channels.email.enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de personnes à atteindre
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={audienceAvailable}
                          value={channels.email.quantity}
                          onChange={(e) =>
                            handleQuantityChange('email', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Coût : <span className="font-bold text-[#FF8C00]">
                            {targetedDiffusionService.formatCurrency(
                              channels.email.quantity * channelCosts.email
                            )}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`border-2 rounded-xl p-6 transition ${
                      channels.sms.enabled
                        ? 'border-[#FF8C00] bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">SMS</h3>
                          <p className="text-sm text-gray-600">
                            {targetedDiffusionService.formatCurrency(channelCosts.sms)} / personne
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channels.sms.enabled}
                          onChange={() => handleChannelToggle('sms')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF8C00]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF8C00]"></div>
                      </label>
                    </div>

                    {channels.sms.enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de personnes à atteindre
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={audienceAvailable}
                          value={channels.sms.quantity}
                          onChange={(e) =>
                            handleQuantityChange('sms', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Coût : <span className="font-bold text-[#FF8C00]">
                            {targetedDiffusionService.formatCurrency(
                              channels.sms.quantity * channelCosts.sms
                            )}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div
                    className={`border-2 rounded-xl p-6 transition ${
                      channels.whatsapp.enabled
                        ? 'border-[#FF8C00] bg-orange-50'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <Send className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">WhatsApp</h3>
                          <p className="text-sm text-gray-600">
                            {targetedDiffusionService.formatCurrency(channelCosts.whatsapp)} / personne
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channels.whatsapp.enabled}
                          onChange={() => handleChannelToggle('whatsapp')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF8C00]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF8C00]"></div>
                      </label>
                    </div>

                    {channels.whatsapp.enabled && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de personnes à atteindre
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={audienceAvailable}
                          value={channels.whatsapp.quantity}
                          onChange={(e) =>
                            handleQuantityChange('whatsapp', parseInt(e.target.value) || 0)
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                        />
                        <p className="text-sm text-gray-600 mt-2">
                          Coût : <span className="font-bold text-[#FF8C00]">
                            {targetedDiffusionService.formatCurrency(
                              channels.whatsapp.quantity * channelCosts.whatsapp
                            )}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white rounded-xl p-6">
                  <p className="text-lg mb-2">Coût total de la campagne</p>
                  <p className="text-4xl font-bold">{targetedDiffusionService.formatCurrency(totalCost)}</p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Récapitulatif de la campagne</h2>

                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Informations générales</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nom de la campagne</span>
                        <span className="font-medium text-gray-900">{campaignName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Audience disponible</span>
                        <span className="font-medium text-gray-900">{audienceAvailable} candidats</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-bold text-gray-900 mb-4">Canaux sélectionnés</h3>
                    <div className="space-y-3">
                      {channels.email.enabled && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-900">Email</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{channels.email.quantity} personnes</p>
                            <p className="text-sm text-gray-600">
                              {targetedDiffusionService.formatCurrency(
                                channels.email.quantity * channelCosts.email
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      {channels.sms.enabled && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="w-5 h-5 text-green-600" />
                            <span className="text-gray-900">SMS</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{channels.sms.quantity} personnes</p>
                            <p className="text-sm text-gray-600">
                              {targetedDiffusionService.formatCurrency(
                                channels.sms.quantity * channelCosts.sms
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                      {channels.whatsapp.enabled && (
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Send className="w-5 h-5 text-green-600" />
                            <span className="text-gray-900">WhatsApp</span>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{channels.whatsapp.quantity} personnes</p>
                            <p className="text-sm text-gray-600">
                              {targetedDiffusionService.formatCurrency(
                                channels.whatsapp.quantity * channelCosts.whatsapp
                              )}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white rounded-xl p-6">
                    <p className="text-lg mb-2">Montant total</p>
                    <p className="text-4xl font-bold">{targetedDiffusionService.formatCurrency(totalCost)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Précédent
              </button>

              {step < 4 ? (
                <button
                  onClick={handleNext}
                  disabled={!canGoToNextStep() || loading}
                  className="flex items-center px-6 py-3 bg-[#FF8C00] text-white rounded-lg hover:bg-[#e67e00] transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitCampaign}
                  disabled={loading}
                  className="flex items-center px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Création...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Demander la diffusion
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
