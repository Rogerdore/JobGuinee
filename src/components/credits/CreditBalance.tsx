import { Coins, RefreshCw, TrendingUp, AlertCircle, ShoppingCart, Crown, Sparkles } from 'lucide-react';
import { useCreditBalance } from '../../hooks/useCreditService';
import { useAuth } from '../../contexts/AuthContext';
import { isPremiumActive, getDaysUntilExpiration, formatPremiumExpirationMessage, getPremiumStatusColor } from '../../utils/premiumHelpers';

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
  const { profile } = useAuth();

  const isPremium = isPremiumActive(profile);
  const daysUntilExpiration = getDaysUntilExpiration(profile?.premium_expiration);
  const premiumMessage = formatPremiumExpirationMessage(profile?.premium_expiration);
  const premiumColors = getPremiumStatusColor(daysUntilExpiration);

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
    if (isPremium) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <Crown className="w-4 h-4 text-orange-500" />
          <span className="font-semibold text-sm text-orange-900">
            Premium PRO+
          </span>
        </div>
      );
    }

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
    if (isPremium) {
      return (
        <div className={`bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-2 ${premiumColors.border} rounded-xl p-4 shadow-lg ${className}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 shadow-md">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-orange-900">Premium PRO+</span>
                  <Sparkles className="w-4 h-4 text-orange-500" />
                </div>
                <div className="text-xs font-medium text-orange-700">
                  {premiumMessage}
                </div>
              </div>
            </div>

            <button
              onClick={refresh}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
              title="Actualiser"
            >
              <RefreshCw className="w-4 h-4 text-orange-600 hover:text-orange-900" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-white/60 rounded-lg border border-orange-200">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <div>
              <div className="text-xs text-gray-600 font-medium">Crédits IA</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">∞</span>
                <span className="text-xs text-gray-500">(Accès illimité)</span>
              </div>
            </div>
          </div>

          {daysUntilExpiration !== null && daysUntilExpiration <= 7 && (
            <div className="mt-3 flex items-center gap-2 text-xs text-orange-700 bg-orange-100 px-3 py-2 rounded-lg border border-orange-200">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">
                Votre abonnement Premium expire bientôt. Pensez à le renouveler pour continuer à profiter de l'accès illimité.
              </span>
            </div>
          )}
        </div>
      );
    }

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

  if (isPremium) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-yellow-100 to-orange-100 border border-orange-300 rounded-lg">
          <Crown className="w-5 h-5 text-orange-600" />
          <span className="font-bold text-orange-900">Premium PRO+</span>
          <span className="text-xs text-orange-700">∞</span>
        </div>

        <button
          onClick={refresh}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-4 h-4 text-gray-500 hover:text-gray-700" />
        </button>
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
