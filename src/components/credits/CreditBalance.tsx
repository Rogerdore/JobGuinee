import { Coins, RefreshCw, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditService';

interface CreditBalanceProps {
  showDetails?: boolean;
  className?: string;
  variant?: 'default' | 'prominent' | 'compact';
  onBuyCredits?: () => void;
}

export default function CreditBalance({
  showDetails = false,
  className = '',
  variant = 'prominent',
  onBuyCredits
}: CreditBalanceProps) {
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

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Coins className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-yellow-500'}`} />
        <span className={`font-semibold text-sm ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
          {credits.toLocaleString()}
        </span>
      </div>
    );
  }

  if (variant === 'prominent') {
    return (
      <div className={`bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-4 shadow-sm ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLow ? 'bg-red-100' : 'bg-yellow-100'}`}>
              <Coins className={`w-6 h-6 ${isLow ? 'text-red-600' : 'text-yellow-600'}`} />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium mb-0.5">Solde de crédits IA</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                  {credits.toLocaleString()}
                </span>
                <span className="text-sm text-gray-500">crédits</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Actualiser le solde"
            >
              <RefreshCw className="w-4 h-4 text-gray-600 hover:text-gray-900" />
            </button>

            {onBuyCredits && (
              <button
                onClick={onBuyCredits}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                Acheter
              </button>
            )}
          </div>
        </div>

        {isLow && (
          <div className="mt-3 flex items-center gap-2 text-xs text-red-700 bg-red-100 px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Attention : Votre solde de crédits est faible. Rechargez pour continuer à utiliser les services IA.</span>
          </div>
        )}
      </div>
    );
  }

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
