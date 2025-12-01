import { Coins, Loader } from 'lucide-react';
import { useServiceCost } from '../../hooks/useCreditService';
import { ServiceCode } from '../../services/creditService';

interface ServiceCostBadgeProps {
  serviceCode: ServiceCode | string;
  className?: string;
  showName?: boolean;
}

export default function ServiceCostBadge({
  serviceCode,
  className = '',
  showName = false
}: ServiceCostBadgeProps) {
  const { serviceCost, serviceName, loading } = useServiceCost(serviceCode);

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg ${className}`}>
        <Loader className="w-4 h-4 text-gray-400 animate-spin" />
        <span className="text-xs text-gray-500">...</span>
      </div>
    );
  }

  if (!serviceCost) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-lg ${className}`}>
      <Coins className="w-4 h-4 text-yellow-600" />
      <span className="text-sm font-medium text-yellow-900">
        {serviceCost}
      </span>
      {showName && serviceName && (
        <span className="text-xs text-yellow-700 ml-1">
          {serviceName}
        </span>
      )}
    </div>
  );
}
