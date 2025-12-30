import React from 'react';
import { LucideIcon, Lock } from 'lucide-react';

interface CTACardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  isLocked?: boolean;
  lockedMessage?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function CTACard({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  isLocked = false,
  lockedMessage,
  variant = 'primary',
  className = ''
}: CTACardProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-br from-green-50 to-blue-50 border-green-200',
    secondary: 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
  };

  return (
    <div className={`relative rounded-2xl border-2 ${variantStyles[variant]} p-6 ${className}`}>
      {isLocked && (
        <div className="absolute top-4 right-4">
          <Lock className="w-5 h-5 text-orange-500" />
        </div>
      )}

      <div className="flex items-start gap-4 mb-4">
        <div className={`p-3 rounded-xl ${
          isLocked
            ? 'bg-gray-200'
            : variant === 'primary'
              ? 'bg-green-100'
              : 'bg-gray-200'
        }`}>
          <Icon className={`w-6 h-6 ${
            isLocked
              ? 'text-gray-400'
              : variant === 'primary'
                ? 'text-green-600'
                : 'text-gray-600'
          }`} />
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-bold mb-2 ${isLocked ? 'text-gray-500' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-sm ${isLocked ? 'text-gray-400' : 'text-gray-600'}`}>
            {description}
          </p>
        </div>
      </div>

      {isLocked && lockedMessage && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            {lockedMessage}
          </p>
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={primaryAction.onClick}
          disabled={isLocked}
          className={`w-full px-6 py-3 rounded-xl font-semibold transition-all ${
            isLocked
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : variant === 'primary'
                ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                : 'bg-gray-700 text-white hover:bg-gray-800'
          }`}
        >
          {primaryAction.label}
        </button>

        {secondaryAction && !isLocked && (
          <button
            onClick={secondaryAction.onClick}
            className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
