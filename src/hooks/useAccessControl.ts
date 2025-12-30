import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

type UserType = 'candidate' | 'recruiter' | 'trainer' | 'admin' | null;

type RestrictedArea =
  | 'candidate-dashboard'
  | 'candidate-applications'
  | 'external-applications'
  | 'recruiter-dashboard'
  | 'cvtheque'
  | 'job-moderation'
  | 'admin-panel'
  | 'premium-services'
  | 'ai-services';

interface AccessRule {
  allowedUserTypes: UserType[];
  requiresPremium?: boolean;
  requiresProfileCompletion?: number;
}

const accessRules: Record<RestrictedArea, AccessRule> = {
  'candidate-dashboard': {
    allowedUserTypes: ['candidate']
  },
  'candidate-applications': {
    allowedUserTypes: ['candidate']
  },
  'external-applications': {
    allowedUserTypes: ['candidate'],
    requiresProfileCompletion: 80
  },
  'recruiter-dashboard': {
    allowedUserTypes: ['recruiter']
  },
  'cvtheque': {
    allowedUserTypes: ['recruiter', 'admin']
  },
  'job-moderation': {
    allowedUserTypes: ['admin']
  },
  'admin-panel': {
    allowedUserTypes: ['admin']
  },
  'premium-services': {
    allowedUserTypes: ['candidate', 'recruiter'],
    requiresPremium: true
  },
  'ai-services': {
    allowedUserTypes: ['candidate', 'recruiter'],
    requiresPremium: true
  }
};

export type AccessRestrictionType = 'candidate-only' | 'recruiter-only' | 'premium-only' | 'admin-only' | 'profile-incomplete';

interface AccessCheckResult {
  hasAccess: boolean;
  restrictionType?: AccessRestrictionType;
  message?: string;
}

export function useAccessControl(area: RestrictedArea) {
  const { user, profile } = useAuth();
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [restrictionType, setRestrictionType] = useState<AccessRestrictionType>('candidate-only');

  const checkAccess = (): AccessCheckResult => {
    if (!user || !profile) {
      return {
        hasAccess: false,
        restrictionType: 'candidate-only',
        message: 'Vous devez être connecté pour accéder à cette fonctionnalité'
      };
    }

    const rule = accessRules[area];
    const userType = profile.user_type as UserType;

    if (!rule.allowedUserTypes.includes(userType)) {
      if (rule.allowedUserTypes.includes('candidate')) {
        return {
          hasAccess: false,
          restrictionType: 'candidate-only',
          message: 'Cet espace est réservé aux candidats'
        };
      }

      if (rule.allowedUserTypes.includes('recruiter')) {
        return {
          hasAccess: false,
          restrictionType: 'recruiter-only',
          message: 'Cet espace est réservé aux recruteurs'
        };
      }

      if (rule.allowedUserTypes.includes('admin')) {
        return {
          hasAccess: false,
          restrictionType: 'admin-only',
          message: 'Cet espace est réservé aux administrateurs'
        };
      }
    }

    if (rule.requiresPremium && !profile.is_premium) {
      return {
        hasAccess: false,
        restrictionType: 'premium-only',
        message: 'Cette fonctionnalité est réservée aux membres Premium'
      };
    }

    if (rule.requiresProfileCompletion) {
      const completion = profile.profile_completion_percentage || 0;
      if (completion < rule.requiresProfileCompletion) {
        return {
          hasAccess: false,
          restrictionType: 'profile-incomplete',
          message: `Vous devez compléter votre profil à ${rule.requiresProfileCompletion}% pour accéder à cette fonctionnalité`
        };
      }
    }

    return { hasAccess: true };
  };

  const enforceAccess = (onDenied?: () => void): boolean => {
    const result = checkAccess();

    if (!result.hasAccess && result.restrictionType) {
      setRestrictionType(result.restrictionType);
      setShowRestrictionModal(true);

      if (onDenied) {
        onDenied();
      }

      return false;
    }

    return true;
  };

  const closeModal = () => {
    setShowRestrictionModal(false);
  };

  return {
    hasAccess: checkAccess().hasAccess,
    checkAccess,
    enforceAccess,
    showRestrictionModal,
    restrictionType,
    closeModal,
    currentUserType: profile?.user_type || null
  };
}
