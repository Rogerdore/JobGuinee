import { Profile, TrainerProfile } from '../lib/supabase';

export interface TrainerNavigationConfig {
  user: any;
  profile: Profile | null;
  trainerProfile?: TrainerProfile | null;
  onNavigate: (page: string, param?: string) => void;
  onShowModal?: () => void;
  onShowPublishForm?: () => void;
}

export type TrainerNavigationAction =
  | { type: 'navigate'; page: string; param?: string }
  | { type: 'showModal' }
  | { type: 'showPublishForm' };

export function getTrainerNavigationAction(
  config: TrainerNavigationConfig
): TrainerNavigationAction {
  const { user, profile, trainerProfile, onShowPublishForm } = config;

  if (!user) {
    return { type: 'showModal' };
  }

  if (profile?.user_type === 'trainer') {
    if (!trainerProfile) {
      return { type: 'showModal' };
    }

    if (onShowPublishForm) {
      return { type: 'showPublishForm' };
    }

    return { type: 'navigate', page: 'trainer-dashboard' };
  }

  if (profile?.user_type === 'candidate' || profile?.user_type === 'recruiter') {
    return { type: 'showModal' };
  }

  return { type: 'showModal' };
}

export function handleTrainerNavigation(config: TrainerNavigationConfig): void {
  const action = getTrainerNavigationAction(config);

  if (action.type === 'navigate') {
    config.onNavigate(action.page, action.param);
  } else if (action.type === 'showModal' && config.onShowModal) {
    config.onShowModal();
  } else if (action.type === 'showPublishForm' && config.onShowPublishForm) {
    config.onShowPublishForm();
  }
}
