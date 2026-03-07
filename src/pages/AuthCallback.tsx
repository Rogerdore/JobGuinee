import { useEffect, useState } from 'react';
import { supabase, UserRole } from '../lib/supabase';
import { Loader2, CheckCircle } from 'lucide-react';

interface AuthCallbackProps {
  onNavigate: (page: string) => void;
}

export default function AuthCallback({ onNavigate }: AuthCallbackProps) {
  const [error, setError] = useState<string | null>(null);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      try {
<<<<<<< HEAD
        // Détecter le type de callback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        const type = hashParams.get('type') || urlParams.get('type');
        const code = urlParams.get('code'); // PKCE flow
        const accessToken = hashParams.get('access_token');
        const errorParam = hashParams.get('error') || urlParams.get('error');
        const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');

        console.log('🔄 AuthCallback:', { type, hasCode: !!code, hasAccessToken: !!accessToken, error: errorParam });

        // Gestion des erreurs de Supabase Auth
        if (errorParam) {
          console.error('❌ Auth error from Supabase:', errorParam, errorDescription);
          throw new Error(errorDescription || errorParam || 'Erreur d\'authentification');
        }

        // PKCE flow: échanger le code contre une session
        if (code) {
          console.log('🔑 PKCE flow: échange du code...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('❌ Erreur échange code PKCE:', exchangeError);
            throw exchangeError;
          }
          console.log('✅ PKCE session obtenue:', data.session?.user?.email);
        }

        // Confirmation email (type=signup) — On doit quand même récupérer la session
        if (type === 'signup') {
          console.log('📧 Confirmation email signup détectée');

          // Si on a un access_token dans le hash, Supabase a déjà créé la session
          // On doit laisser le client Supabase la récupérer
          if (accessToken) {
            // Le hash contient les tokens — Supabase JS les traite automatiquement via detectSessionInUrl
            // Attendre que Supabase traite le hash
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

          // Vérifier si on a maintenant une session active
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            console.log('✅ Session active après confirmation:', session.user.email);

            // S'assurer que le profil existe
            await ensureProfileExists(session.user.id, session.user.email || '', session.user.user_metadata);

            // Afficher succès puis rediriger vers home (déjà connecté !)
            setConfirmationSuccess(true);
            setTimeout(() => {
              onNavigate('home');
            }, 2000);
            return;
          }

          // Pas de session — l'utilisateur devra se connecter manuellement
          console.log('ℹ️ Pas de session après confirmation — redirection vers login');
=======
        // Check both hash params and query params for the callback type
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);

        const type = hashParams.get('type') || searchParams.get('type');
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const code = searchParams.get('code');

        // Email confirmation link clicked (PKCE flow uses ?code=, legacy uses #access_token=)
        if (type === 'signup' || type === 'email_change' || (code && !searchParams.get('provider'))) {
          // PKCE flow: exchange the code for a session — this is what actually marks
          // email_confirmed_at in auth.users and fires the DB trigger.
          if (code) {
            try {
              await supabase.auth.exchangeCodeForSession(code);
            } catch {
              // Code may already be consumed (e.g. double-click) — still show success
            }
          } else if (accessToken && refreshToken) {
            // Legacy implicit flow
            try {
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });
            } catch {
              // Non-blocking
            }
          } else {
            try {
              await supabase.auth.getSession();
            } catch {
              // Non-blocking
            }
          }

          // Sign out so the user arrives at the login page with a clean state
          await supabase.auth.signOut();

>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
          setConfirmationSuccess(true);
          setTimeout(() => {
            onNavigate('auth');
          }, 3000);
          return;
        }

<<<<<<< HEAD
        // OAuth callback ou autre — récupérer la session
=======
        // OAuth callback (Google, etc.)
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          throw new Error('Aucune session utilisateur trouvée');
        }

        const userId = session.user.id;
        const userEmail = session.user.email;
<<<<<<< HEAD
        const userMeta = session.user.user_metadata;
=======
        const fullName = session.user.user_metadata?.full_name
          || session.user.user_metadata?.name
          || userEmail?.split('@')[0]
          || 'Utilisateur';
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a

        await ensureProfileExists(userId, userEmail || '', userMeta);

        // Gestion spécifique recruteur
        const pendingRole = localStorage.getItem('pending_oauth_role') as UserRole || 'candidate';
        localStorage.removeItem('pending_oauth_role');

<<<<<<< HEAD
        if (pendingRole === 'recruiter') {
          await ensureCompanyExists(userId, userMeta?.full_name || userMeta?.name || 'Utilisateur');
        }

        if (pendingRole === 'trainer') {
          await ensureTrainerProfileExists(userId);
=======
        // Wait for the trigger (handle_new_user) to create the profile for OAuth
        let profileData = null;
        let attempts = 0;
        const maxAttempts = 20;

        while (!profileData && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 200));

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          if (profile) {
            profileData = profile;
            break;
          }

          attempts++;
        }

        // Fallback: manually create profile if trigger didn't fire
        if (!profileData) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              full_name: fullName,
              user_type: pendingRole,
              credits_balance: 0,
            });

          if (insertError && !insertError.message.includes('duplicate')) {
            throw insertError;
          }

          await new Promise(resolve => setTimeout(resolve, 500));

          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

          profileData = newProfile;
        }

        // Update user_type to the requested OAuth role if it differs
        if (profileData && profileData.user_type !== pendingRole) {
          await supabase
            .from('profiles')
            .update({ user_type: pendingRole })
            .eq('id', userId);
          profileData = { ...profileData, user_type: pendingRole };
        }

        // Create default company for recruiter
        if (pendingRole === 'recruiter' && profileData) {
          const { data: existingCompany } = await supabase
            .from('companies')
            .select('id')
            .eq('created_by', userId)
            .maybeSingle();

          if (!existingCompany) {
            const companyName = fullName.includes(' ')
              ? `Entreprise de ${fullName.split(' ')[0]}`
              : `Entreprise de ${fullName}`;

            const { data: newCompany, error: companyError } = await supabase
              .from('companies')
              .insert({ name: companyName, created_by: userId })
              .select()
              .single();

            if (newCompany && !companyError) {
              await supabase
                .from('profiles')
                .update({ company_id: newCompany.id })
                .eq('id', userId);
            }
          }
        }

        // Create trainer sub-profile
        if (pendingRole === 'trainer' && profileData) {
          const { data: existingTrainerProfile } = await supabase
            .from('trainer_profiles')
            .select('id')
            .eq('profile_id', userId)
            .maybeSingle();

          if (!existingTrainerProfile) {
            await supabase.from('trainer_profiles').insert({
              profile_id: userId,
              user_id: userId,
              organization_type: 'individual',
              experience_years: 0,
              is_verified: false,
              rating: 0,
              total_students: 0,
            });
          }
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        onNavigate('home');

      } catch (err: any) {
<<<<<<< HEAD
        console.error('❌ Error handling auth callback:', err);
=======
        console.error('Error handling auth callback:', err);
>>>>>>> ddf5518560d0e6e4159ed7f2c0ee6e684b9e257a
        setError(err.message || 'Erreur lors de la connexion');
        setTimeout(() => onNavigate('auth'), 4000);
      }
    };

    handleCallback();
  }, [onNavigate]);

  // ============================================
  // Helpers
  // ============================================

  async function ensureProfileExists(userId: string, email: string, userMeta: any) {
    const fullName = userMeta?.full_name || userMeta?.name || email.split('@')[0] || 'Utilisateur';
    const role = (userMeta?.user_type || localStorage.getItem('pending_oauth_role') || 'candidate') as UserRole;

    let profileData = null;
    let attempts = 0;
    const maxAttempts = 15;

    while (!profileData && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 300));

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        profileData = profile;
        break;
      }
      attempts++;
    }

    if (!profileData) {
      console.log('📝 Création du profil manquant pour', email);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          user_type: role,
          credits_balance: 10,
          ai_credits_balance: 5,
        });

      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('⚠️ Erreur création profil:', insertError);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async function ensureCompanyExists(userId: string, fullName: string) {
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('created_by', userId)
      .maybeSingle();

    if (!existingCompany) {
      const companyName = fullName.includes(' ')
        ? `Entreprise de ${fullName.split(' ')[0]}`
        : `Entreprise de ${fullName}`;

      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({
          name: companyName,
          created_by: userId,
        })
        .select()
        .single();

      if (newCompany && !companyError) {
        await supabase
          .from('profiles')
          .update({ company_id: newCompany.id })
          .eq('id', userId);
      }
    }
  }

  async function ensureTrainerProfileExists(userId: string) {
    const { data: existingTrainerProfile } = await supabase
      .from('trainer_profiles')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle();

    if (!existingTrainerProfile) {
      await supabase
        .from('trainer_profiles')
        .insert({
          profile_id: userId,
          user_id: userId,
          organization_type: 'individual',
          experience_years: 0,
          is_verified: false,
          rating: 0,
          total_students: 0,
        });
    }
  }

  if (confirmationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email confirmé !</h2>
          <p className="text-gray-600 mb-4">
            Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <p className="text-sm text-gray-500">Redirection vers la page de connexion...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Erreur de connexion</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Connexion en cours</h2>
        <p className="text-gray-600">Veuillez patienter...</p>
      </div>
    </div>
  );
}
