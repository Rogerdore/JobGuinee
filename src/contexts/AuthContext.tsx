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
  signInWithGoogle: (role?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getAndClearRedirectIntent: () => AuthRedirectIntent | null;
  resetPassword: (email: string) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
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
    // PRODUCTION SAFETY: Bootstrap auth avec timeout et fallback REST
    // L'app ne doit JAMAIS être bloquée par Realtime WebSocket
    const initAuth = async () => {
      console.log('🚀 JobGuinée: Initialisation auth (REST + fallback)');

      let authResolved = false;

      // Timeout de sécurité global: débloquer l'app après 3s maximum
      const safetyTimeout = setTimeout(() => {
        if (!authResolved) {
          console.warn('⏱️ Auth timeout (3s) - déblocage immédiat de l\'app');
          console.warn('💡 L\'app fonctionne en mode REST uniquement (WebSocket indisponible)');
          authResolved = true;
          setLoading(false);
        }
      }, 3000);

      try {
        // Stratégie 1: Essayer getSession() avec timeout court
        console.log('📡 Tentative auth.getSession() avec timeout 2.5s...');
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('getSession timeout')), 2500)
        );

        try {
          const { data: { session }, error } = await Promise.race([
            sessionPromise,
            timeoutPromise
          ]);

          if (!authResolved) {
            authResolved = true;
            clearTimeout(safetyTimeout);

            if (error) {
              console.error('⚠️ Erreur getSession:', error.message);
              setLoading(false);
              return;
            }

            console.log('✅ Session récupérée:', session ? 'utilisateur connecté' : 'aucune session');
            setUser(session?.user ?? null);

            // Récupération du profil avec timeout séparé
            if (session?.user) {
              try {
                const profileData = await Promise.race([
                  fetchProfile(session.user.id),
                  new Promise<null>((_, reject) =>
                    setTimeout(() => reject(new Error('Profile timeout')), 2000)
                  )
                ]);
                setProfile(profileData as Profile | null);
                console.log('✅ Profil chargé');
              } catch (profileError) {
                console.warn('⚠️ Timeout profil - continuons sans profil:', profileError);
                // Continue sans profil
              }
            }

            setLoading(false);
          }
        } catch (timeoutError) {
          // Stratégie 2: Fallback REST pur si getSession() timeout
          if (!authResolved) {
            console.warn('🔄 Fallback: mode REST uniquement (WebSocket timeout)');

            try {
              // Vérifier si on a un token stocké localement
              const storedToken = localStorage.getItem('jobguinee-auth-token');

              if (storedToken) {
                console.log('💾 Token local trouvé - tentative validation REST');
                // On a un token, essayer de le valider via REST
                const { data: { user: restUser }, error: restError } = await supabase.auth.getUser();

                if (!restError && restUser) {
                  console.log('✅ Session validée via REST');
                  setUser(restUser);

                  // Charger profil via REST direct
                  try {
                    const profileData = await fetchProfile(restUser.id);
                    setProfile(profileData);
                    console.log('✅ Profil chargé via REST');
                  } catch (profileErr) {
                    console.warn('⚠️ Erreur chargement profil REST:', profileErr);
                  }
                } else {
                  console.log('ℹ️ Pas de session active');
                }
              } else {
                console.log('ℹ️ Pas de token local - utilisateur non connecté');
              }
            } catch (fallbackError) {
              console.error('⚠️ Erreur fallback REST:', fallbackError);
            }

            authResolved = true;
            clearTimeout(safetyTimeout);
            setLoading(false);
          }
        }
      } catch (criticalError) {
        console.error('❌ Erreur critique auth bootstrap:', criticalError);
        if (!authResolved) {
          authResolved = true;
          clearTimeout(safetyTimeout);
          setLoading(false);
        }
      }
    };

    initAuth();

    // Protection de l'abonnement aux changements d'état
    // N'utilise PAS WebSocket, juste les events locaux d'auth
    let subscription: any = null;
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        // Utiliser une fonction async immédiatement invoquée (IIFE)
        // pour éviter de bloquer le callback sync
        (async () => {
          try {
            setUser(session?.user ?? null);
            if (session?.user) {
              // Timeout pour le profil même dans onAuthStateChange
              const profilePromise = fetchProfile(session.user.id);
              const timeoutPromise = new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
              );

              try {
                const profileData = await Promise.race([profilePromise, timeoutPromise]);
                setProfile(profileData as Profile | null);
              } catch (timeoutErr) {
                console.warn('⚠️ Timeout récupération profil dans onAuthStateChange');
                // Continue sans profil
              }
            } else {
              setProfile(null);
            }
          } catch (error) {
            console.error('⚠️ Erreur dans onAuthStateChange:', error);
            // Ne pas crasher, juste logger
          }
        })();
      });
      subscription = data.subscription;
      console.log('✅ Auth state listener configuré (mode non-bloquant)');
    } catch (error) {
      console.error('⚠️ Impossible de configurer auth listener:', error);
      console.warn('💡 L\'app continuera sans listener temps réel');
      // Ne pas crasher, l'app fonctionne quand même
    }

    return () => {
      try {
        if (subscription) {
          subscription.unsubscribe();
        }
      } catch (error) {
        // Silent fail, ne pas logger en cleanup
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error('EMAIL_NOT_CONFIRMED');
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('INVALID_CREDENTIALS');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('Connexion échouée');
    }

    // Email confirmation désactivée - connexion immédiate
    // L'email de bienvenue est envoyé via le service SMTP custom
  };

  const signUp = async (email: string, password: string, fullName: string, role: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          user_type: role,
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        throw new Error('EMAIL_EXISTS');
      }
      if (error.message.includes('Password')) {
        throw new Error('WEAK_PASSWORD');
      }
      throw error;
    }

    if (!data.user) {
      throw new Error('Inscription échouée. Veuillez réessayer.');
    }

    // Email confirmation désactivée - l'utilisateur peut se connecter immédiatement
    // Un email de bienvenue sera envoyé automatiquement via le service SMTP custom

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

  const signInWithGoogle = async (role: UserRole = 'candidate') => {
    const redirectUrl = `${window.location.origin}/auth/callback`;

    localStorage.setItem('pending_oauth_role', role);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    clearAuthRedirectIntent();
    setRedirectIntent(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      throw new Error('Impossible d\'envoyer l\'email de réinitialisation. Vérifiez votre adresse email.');
    }
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      if (error.message.includes('already confirmed')) {
        throw new Error('EMAIL_ALREADY_CONFIRMED');
      }
      throw new Error('Impossible de renvoyer l\'email. Veuillez réessayer.');
    }
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
    signInWithGoogle,
    signOut,
    refreshProfile,
    getAndClearRedirectIntent,
    resetPassword,
    resendConfirmationEmail,
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
