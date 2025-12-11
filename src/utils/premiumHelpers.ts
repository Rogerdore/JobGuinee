export interface PremiumProfile {
  is_premium: boolean;
  premium_expiration: string | null;
}

export function isPremiumActive(profile: PremiumProfile | null | undefined): boolean {
  if (!profile) return false;
  if (!profile.is_premium) return false;
  if (!profile.premium_expiration) return false;

  const expirationDate = new Date(profile.premium_expiration);
  const now = new Date();

  return expirationDate > now;
}

export function getDaysUntilExpiration(premiumExpiration: string | null | undefined): number | null {
  if (!premiumExpiration) return null;

  const expirationDate = new Date(premiumExpiration);
  const now = new Date();

  const diffTime = expirationDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

export function formatPremiumExpirationMessage(premiumExpiration: string | null | undefined): string {
  const days = getDaysUntilExpiration(premiumExpiration);

  if (days === null) return 'Premium inactif';
  if (days === 0) return 'Expire aujourd\'hui';
  if (days === 1) return 'Expire dans 1 jour';
  if (days <= 7) return `Expire dans ${days} jours ⚠️`;
  if (days <= 30) return `Expire dans ${days} jours`;

  const months = Math.floor(days / 30);
  if (months === 1) return 'Expire dans 1 mois';
  if (months < 12) return `Expire dans ${months} mois`;

  return `Expire dans plus d'un an`;
}

export function getPremiumStatusColor(days: number | null): {
  bg: string;
  text: string;
  border: string;
} {
  if (days === null) {
    return {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      border: 'border-gray-300'
    };
  }

  if (days <= 3) {
    return {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300'
    };
  }

  if (days <= 7) {
    return {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-300'
    };
  }

  return {
    bg: 'bg-gradient-to-r from-yellow-100 to-orange-100',
    text: 'text-orange-900',
    border: 'border-yellow-300'
  };
}
