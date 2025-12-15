import React from 'react';
import { Building2 } from 'lucide-react';

interface CompanyLogoProps {
  logoUrl?: string | null;
  companyName: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl',
  xl: 'text-3xl'
};

export default function CompanyLogo({
  logoUrl,
  companyName,
  size = 'md',
  className = '',
  showFallback = true
}: CompanyLogoProps) {
  const getInitials = (name: string) => {
    const words = name.trim().split(' ').filter(Boolean);
    if (words.length === 0) return '?';
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  if (logoUrl) {
    return (
      <div className={`${sizeClasses[size]} flex-shrink-0 ${className}`}>
        <img
          src={logoUrl}
          alt={`Logo ${companyName}`}
          className="w-full h-full object-contain rounded-lg bg-white border border-gray-200"
          onError={(e) => {
            if (showFallback) {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }
          }}
        />
        {showFallback && (
          <div
            className={`${sizeClasses[size]} bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200 flex items-center justify-center`}
            style={{ display: 'none' }}
          >
            <span className={`${textSizes[size]} font-bold text-blue-700`}>
              {getInitials(companyName)}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (!showFallback) {
    return null;
  }

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg border border-blue-200 flex items-center justify-center flex-shrink-0 ${className}`}
    >
      <span className={`${textSizes[size]} font-bold text-blue-700`}>
        {getInitials(companyName)}
      </span>
    </div>
  );
}

export function CompanyLogoWithIcon({
  logoUrl,
  companyName,
  size = 'sm',
  className = ''
}: CompanyLogoProps) {
  if (logoUrl) {
    return (
      <div className={`${sizeClasses[size]} flex-shrink-0 ${className}`}>
        <img
          src={logoUrl}
          alt={`Logo ${companyName}`}
          className="w-full h-full object-contain rounded-lg"
        />
      </div>
    );
  }

  return <Building2 className={`${iconSizes[size]} text-[#FF8C00] flex-shrink-0 ${className}`} />;
}
