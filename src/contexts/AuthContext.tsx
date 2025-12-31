import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, UserRole } from '../lib/supabase';
import { AuthRedirectIntent, getAuthRedirectIntent, clearAuthRedirectIntent } from '../hooks/useAuthRedirect';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  redirectIntent: AuthRedirectIntent | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getAndClearRedirectIntent: () => AuthRedirectIntent | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirectIntent, setRedirectIntent] = useState<AuthRedirectIntent | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    if (data && data.user_type === 'recruiter' && data.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('name')
        .eq('id', data.company_id)
        .maybeSingle();

      if (companyData) {
        return { ...data, company_name: companyData.name };
      }
    }

    return data;
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        }
        setLoading(false);
      })();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const profileData = await fetchProfile(session.user.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Email ou mot de passe incorrect');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('Connexion échouée');
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: role,
        }
      }
    });

    if (error) throw error;
    if (!data.user) throw new Error('Inscription échouée. Veuillez réessayer.');

    let profileData = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (!profileData && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 300));

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile) {
        profileData = profile;
        break;
      }

      attempts++;
    }

    if (!profileData) {
      throw new Error('Inscription échouée. Veuillez rafraîchir et vous reconnecter.');
    }

    if (role === 'trainer') {
      await new Promise(resolve => setTimeout(resolve, 500));

      const { error: trainerError } = await supabase
        .from('trainer_profiles')
        .insert({
          profile_id: data.user.id,
          user_id: data.user.id,
          organization_type: 'individual',
          experience_years: 0,
          is_verified: false,
          rating: 0,
          total_students: 0
        });

      if (trainerError) console.error('Error creating trainer profile:', trainerError);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    clearAuthRedirectIntent();
    setRedirectIntent(null);
  };

  const getAndClearRedirectIntent = (): AuthRedirectIntent | null => {
    const intent = getAuthRedirectIntent();
    if (intent) {
      clearAuthRedirectIntent();
      setRedirectIntent(null);
    }
    return intent;
  };

  useEffect(() => {
    const intent = getAuthRedirectIntent();
    if (intent) {
      setRedirectIntent(intent);
    }
  }, []);

  useEffect(() => {
    if (user && !loading) {
      const intent = getAuthRedirectIntent();
      if (intent) {
        setRedirectIntent(intent);
      }
    }
  }, [user, loading]);

  const isAdmin = profile?.user_type === 'admin';

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    redirectIntent,
    signIn,
    signUp,
    signOut,
    refreshProfile,
    getAndClearRedirectIntent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
