import { Profile } from '../lib/supabase';

export interface RecruiterNavigationConfig {
  user: any;
  profile: Profile | null;
  onNavigate: (page: string, param?: string) => void;
  onShowModal?: () => void;
}

export type RecruiterNavigationAction =
  | { type: 'navigate'; page: string; param?: string }
  | { type: 'showModal' };

export function getRecruiterNavigationAction(
  config: RecruiterNavigationConfig
): RecruiterNavigationAction {
  const { user, profile } = config;

  if (!user) {
    return { type: 'showModal' };
  }

  if (profile?.user_type === 'recruiter') {
    return { type: 'navigate', page: 'recruiter-dashboard' };
  }

  if (profile?.user_type === 'candidate' || profile?.user_type === 'trainer') {
    return { type: 'showModal' };
  }

  return { type: 'showModal' };
}

export function handleRecruiterNavigation(config: RecruiterNavigationConfig): void {
  const action = getRecruiterNavigationAction(config);

  if (action.type === 'navigate') {
    config.onNavigate(action.page, action.param);
  } else if (action.type === 'showModal' && config.onShowModal) {
    config.onShowModal();
  }
}
