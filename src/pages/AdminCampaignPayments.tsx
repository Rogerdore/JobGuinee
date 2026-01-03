import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  Send,
  Users,
  Calendar,
  DollarSign,
  Loader,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { targetedDiffusionService, Campaign } from '../services/targetedDiffusionService';

export default function AdminCampaignPayments() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationAction, setValidationAction] = useState<'approve' | 'reject' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadPendingCampaigns();
  }, []);

  const loadPendingCampaigns = async () => {
    setLoading(true);
    try {
      const data = await targetedDiffusionService.getPendingPaymentCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenValidation = (campaign: Campaign, action: 'approve' | 'reject') => {
    setSelectedCampaign(campaign);
    setValidationAction(action);
    setAdminNotes('');
    setShowValidationModal(true);
  };

  const handleValidate = async () => {
    if (!selectedCampaign || !validationAction) return;

    setProcessing(true);
    try {
      if (validationAction === 'approve') {
        await targetedDiffusionService.validateCampaignPayment(
          selectedCampaign.id,
          adminNotes
        );
      } else {
        await targetedDiffusionService.rejectCampaignPayment(
          selectedCampaign.id,
          adminNotes || 'Paiement rejeté'
        );
      }

      await loadPendingCampaigns();
      setShowValidationModal(false);
      setSelectedCampaign(null);
      setValidationAction(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error validating campaign:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(false);
    }
  };

  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case 'email':
        return <Mail className="w-5 h-5 text-blue-600" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'whatsapp':
        return <Send className="w-5 h-5 text-green-600" />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Validation des Paiements - Diffusion Ciblée
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez les demandes de diffusion en attente de validation
            </p>
          </div>

          <button
            onClick={loadPendingCampaigns}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4275] transition disabled:opacity-50"
          >
            <Loader className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-[#FF8C00]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Aucune demande en attente
            </h3>
            <p className="text-gray-600">
              Il n'y a actuellement aucune campagne en attente de validation
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onApprove={() => handleOpenValidation(campaign, 'approve')}
                onReject={() => handleOpenValidation(campaign, 'reject')}
              />
            ))}
          </div>
        )}

        {showValidationModal && selectedCampaign && (
          <ValidationModal
            campaign={selectedCampaign}
            action={validationAction!}
            adminNotes={adminNotes}
            setAdminNotes={setAdminNotes}
            processing={processing}
            onValidate={handleValidate}
            onClose={() => {
              setShowValidationModal(false);
              setSelectedCampaign(null);
              setValidationAction(null);
              setAdminNotes('');
            }}
          />
        )}
      </div>
    </>
  );
}

interface CampaignCardProps {
  campaign: Campaign;
  onApprove: () => void;
  onReject: () => void;
}

function CampaignCard({ campaign, onApprove, onReject }: CampaignCardProps) {
  const [channels, setChannels] = useState<any[]>([]);
  const [entityDetails, setEntityDetails] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadCampaignDetails();
  }, [campaign.id]);

  const loadCampaignDetails = async () => {
    try {
      const channelsData = await targetedDiffusionService.getCampaignChannels(campaign.id);
      setChannels(channelsData);

      const entity = await targetedDiffusionService.getEntityDetails(
        campaign.entity_type,
        campaign.entity_id
      );
      setEntityDetails(entity);
    } catch (error) {
      console.error('Error loading campaign details:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{campaign.campaign_name}</h3>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                En attente
              </span>
            </div>

            {entityDetails && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span className="font-medium">
                  {campaign.entity_type === 'job' && 'Offre d\'emploi'}
                  {campaign.entity_type === 'training' && 'Formation'}
                  {campaign.entity_type === 'post' && 'Publication'}
                </span>
                <span>•</span>
                <span>{entityDetails.title || entityDetails.name}</span>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-[#FF8C00]">
              {targetedDiffusionService.formatCurrency(campaign.total_cost)}
            </p>
            <p className="text-sm text-gray-600">Montant total</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Audience</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{campaign.audience_available}</p>
            <p className="text-xs text-gray-600">candidats disponibles</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Créée le</span>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {new Date(campaign.created_at).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-xs text-gray-600">
              {new Date(campaign.created_at).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Canaux</span>
            </div>
            <p className="text-lg font-bold text-gray-900">{channels.length}</p>
            <p className="text-xs text-gray-600">actifs</p>
          </div>
        </div>

        {showDetails && channels.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">Canaux sélectionnés</h4>
            <div className="space-y-2">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0"
                >
                  <div className="flex items-center space-x-3">
                    {channel.channel_type === 'email' && <Mail className="w-5 h-5 text-blue-600" />}
                    {channel.channel_type === 'sms' && (
                      <MessageSquare className="w-5 h-5 text-green-600" />
                    )}
                    {channel.channel_type === 'whatsapp' && (
                      <Send className="w-5 h-5 text-green-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {targetedDiffusionService.getChannelLabel(channel.channel_type)}
                      </p>
                      <p className="text-sm text-gray-600">{channel.quantity} personnes</p>
                    </div>
                  </div>
                  <p className="font-bold text-gray-900">
                    {targetedDiffusionService.formatCurrency(channel.total_cost)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 text-sm text-[#0E2F56] hover:underline"
          >
            <Eye className="w-4 h-4" />
            <span>{showDetails ? 'Masquer les détails' : 'Voir les détails'}</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onReject}
              className="flex items-center space-x-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
            >
              <XCircle className="w-5 h-5" />
              <span>Rejeter</span>
            </button>
            <button
              onClick={onApprove}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Valider</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ValidationModalProps {
  campaign: Campaign;
  action: 'approve' | 'reject';
  adminNotes: string;
  setAdminNotes: (notes: string) => void;
  processing: boolean;
  onValidate: () => void;
  onClose: () => void;
}

function ValidationModal({
  campaign,
  action,
  adminNotes,
  setAdminNotes,
  processing,
  onValidate,
  onClose,
}: ValidationModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div
          className={`p-6 border-b ${
            action === 'approve'
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center space-x-3">
            {action === 'approve' ? (
              <CheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {action === 'approve' ? 'Valider le paiement' : 'Rejeter le paiement'}
              </h2>
              <p className="text-gray-600">{campaign.campaign_name}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Montant total</p>
                <p className="text-xl font-bold text-[#FF8C00]">
                  {targetedDiffusionService.formatCurrency(campaign.total_cost)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Audience</p>
                <p className="text-xl font-bold text-gray-900">
                  {campaign.audience_available} candidats
                </p>
              </div>
            </div>
          </div>

          {action === 'approve' ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-semibold mb-1">La diffusion sera lancée automatiquement</p>
                  <p>
                    En validant ce paiement, la campagne sera activée et les messages seront envoyés
                    aux candidats ciblés selon les canaux sélectionnés.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-semibold mb-1">La campagne sera annulée</p>
                  <p>
                    Le recruteur sera notifié du rejet et devra soumettre une nouvelle preuve de
                    paiement ou contacter l'administration.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes administratives {action === 'reject' && <span className="text-red-600">*</span>}
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
              placeholder={
                action === 'approve'
                  ? 'Ajouter des notes (optionnel)...'
                  : 'Expliquer la raison du rejet...'
              }
              required={action === 'reject'}
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={onValidate}
            disabled={processing || (action === 'reject' && !adminNotes.trim())}
            className={`flex items-center space-x-2 px-6 py-3 text-white rounded-lg transition disabled:opacity-50 ${
              action === 'approve'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {processing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Traitement...</span>
              </>
            ) : (
              <>
                {action === 'approve' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
                <span>{action === 'approve' ? 'Valider' : 'Rejeter'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
