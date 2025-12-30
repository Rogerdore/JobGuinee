import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ProfileCompletionBarProps {
  percentage: number;
  showMessage?: boolean;
  className?: string;
}

export default function ProfileCompletionBar({
  percentage,
  showMessage = true,
  className = ''
}: ProfileCompletionBarProps) {
  const isComplete = percentage >= 80;
  const barColor = percentage >= 80
    ? 'bg-green-500'
    : percentage >= 50
      ? 'bg-orange-500'
      : 'bg-red-500';

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            Complétion du profil
          </span>
          {isComplete && <CheckCircle className="w-4 h-4 text-green-500" />}
        </div>
        <span className={`text-lg font-bold ${isComplete ? 'text-green-600' : 'text-gray-600'}`}>
          {percentage}%
        </span>
      </div>

      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full ${barColor} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
        </div>
      </div>

      {showMessage && (
        <div className={`mt-3 p-3 rounded-lg ${
          isComplete
            ? 'bg-green-50 border border-green-200'
            : 'bg-blue-50 border border-blue-200'
        }`}>
          {isComplete ? (
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Profil complet débloqé
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Vous avez accès à tous les services JobGuinée, y compris les candidatures externes.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Un profil complété à 80% est plus visible par les recruteurs
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Complétez votre profil pour débloquer les services avancés comme les candidatures externes.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
