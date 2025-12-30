import React from 'react';
import { Star, Award, Shield } from 'lucide-react';

interface ProfileQualityBadgeProps {
  completion: number;
  variant?: 'compact' | 'detailed';
  className?: string;
}

export default function ProfileQualityBadge({
  completion,
  variant = 'compact',
  className = ''
}: ProfileQualityBadgeProps) {

  const getBadgeConfig = () => {
    if (completion >= 90) {
      return {
        label: 'Profil très complet',
        icon: Award,
        bgColor: 'bg-gradient-to-r from-purple-500 to-purple-600',
        borderColor: 'border-purple-400',
        textColor: 'text-white',
        iconColor: 'text-purple-200',
        description: 'Excellence - Profil exceptionnel qui maximise vos opportunités'
      };
    } else if (completion >= 80) {
      return {
        label: 'Profil solide',
        icon: Shield,
        bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600',
        borderColor: 'border-blue-400',
        textColor: 'text-white',
        iconColor: 'text-blue-200',
        description: 'Professionnel - Profil complet qui inspire confiance'
      };
    } else if (completion >= 60) {
      return {
        label: 'Profil en progression',
        icon: Star,
        bgColor: 'bg-gradient-to-r from-orange-400 to-orange-500',
        borderColor: 'border-orange-300',
        textColor: 'text-white',
        iconColor: 'text-orange-200',
        description: 'En bonne voie - Continuez à améliorer votre profil'
      };
    } else {
      return {
        label: 'Profil à compléter',
        icon: Star,
        bgColor: 'bg-gradient-to-r from-gray-400 to-gray-500',
        borderColor: 'border-gray-300',
        textColor: 'text-white',
        iconColor: 'text-gray-200',
        description: 'Début - Complétez votre profil pour accéder à plus de fonctionnalités'
      };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${config.bgColor} px-3 py-1.5 rounded-full border ${config.borderColor} shadow-sm ${className}`}>
        <Icon className={`w-4 h-4 ${config.iconColor}`} />
        <span className={`text-sm font-semibold ${config.textColor}`}>
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <div className={`${config.bgColor} p-4 rounded-xl border ${config.borderColor} shadow-lg ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Icon className={`w-6 h-6 ${config.textColor}`} />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-bold ${config.textColor}`}>{config.label}</h4>
            <span className={`text-sm font-semibold ${config.textColor}`}>{completion}%</span>
          </div>
          <p className={`text-sm ${config.iconColor}`}>{config.description}</p>
          <div className="mt-3 w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
