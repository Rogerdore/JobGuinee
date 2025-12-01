import { Coins, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditService';

interface CreditBalanceProps {
  showDetails?: boolean;
  className?: string;
}

export default function CreditBalance({ showDetails = false, className = '' }: CreditBalanceProps) {
  const { balance, loading, error, refresh } = useCreditBalance();

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Coins className="w-5 h-5 text-yellow-500 animate-pulse" />
        <span className="text-gray-600">Chargement...</span>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <AlertCircle className="w-5 h-5 text-red-500" />
        <span className="text-red-600 text-sm">Erreur</span>
        <button
          onClick={refresh}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  }

  const credits = balance.credits_available;
  const isLow = credits < 50;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Coins className={`w-5 h-5 ${isLow ? 'text-red-500' : 'text-yellow-500'}`} />
        <span className={`font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
          {credits.toLocaleString()}
        </span>
        {!showDetails && <span className="text-sm text-gray-500">crédits</span>}
      </div>

      {showDetails && (
        <div className="ml-2 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">
              Total: <span className="font-medium">{balance.total_credits}</span>
            </span>
          </div>
        </div>
      )}

      <button
        onClick={refresh}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Actualiser le solde"
      >
        <RefreshCw className="w-4 h-4 text-gray-500 hover:text-gray-700" />
      </button>

      {isLow && (
        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
          Solde faible
        </span>
      )}
    </div>
  );
}
