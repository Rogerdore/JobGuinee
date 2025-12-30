import React, { useState, useEffect } from 'react';
import { Send, Check, Clock, XCircle } from 'lucide-react';
import { targetedDiffusionService, Campaign } from '../../services/targetedDiffusionService';

interface TargetedDiffusionBadgeProps {
  entityType: 'job' | 'training' | 'post';
  entityId: string;
  entityStatus: string;
  onNavigate: (path: string) => void;
}

export default function TargetedDiffusionBadge({
  entityType,
  entityId,
  entityStatus,
  onNavigate,
}: TargetedDiffusionBadgeProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, [entityId]);

  const loadCampaigns = async () => {
    try {
      const data = await targetedDiffusionService.getCampaignsByEntity(entityType, entityId);
      setCampaigns(data);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  if (entityStatus !== 'approved') {
    return null;
  }

  const activeCampaign = campaigns.find(
    (c) => c.status === 'in_progress' || c.status === 'payment_approved'
  );
  const pendingCampaign = campaigns.find(
    (c) => c.status === 'pending_payment' && c.payment_status === 'waiting_proof'
  );

  const handleClick = () => {
    if (activeCampaign || pendingCampaign) {
      return;
    }

    const url = `/campaigns/new?entity_type=${entityType}&entity_id=${entityId}`;
    onNavigate(url);
  };

  if (loading) {
    return null;
  }

  if (activeCampaign) {
    return (
      <div
        className="inline-flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg cursor-default"
        title="Diffusion en cours"
      >
        <Check className="w-4 h-4" />
        <span className="text-sm font-semibold">Diffusion en cours</span>
      </div>
    );
  }

  if (pendingCampaign) {
    return (
      <div
        className="inline-flex items-center space-x-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg cursor-default"
        title="Diffusion en attente de validation"
      >
        <Clock className="w-4 h-4" />
        <span className="text-sm font-semibold">Diffusion en attente</span>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-[#FF8C00] transition shadow-md hover:shadow-lg"
      title="Diffusez cette annonce via Email, SMS et WhatsApp à une audience ciblée"
    >
      <Send className="w-4 h-4" />
      <span className="text-sm font-semibold">Diffusion ciblée disponible</span>
    </button>
  );
}
