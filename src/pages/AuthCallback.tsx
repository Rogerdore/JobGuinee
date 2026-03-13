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
        // Détecter le type de callback
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlParams = new URLSearchParams(window.location.search);
        const type = hashParams.get('type') || urlParams.get('type');
        const code = urlParams.get('code'); // PKCE flow
        const accessToken = hashParams.get('access_token');
        const errorParam = hashParams.get('error') || urlParams.get('error');
        const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');

        console.log('🔄 AuthCallback:', { type, hasCode: !!code, hasAccessToken: !!accessToken, error: errorParam });

        // Gestion des erreurs de Supabase Auth (erreurs dans les paramètres URL)
        if (errorParam) {
          console.error('❌ Auth error from Supabase:', errorParam, errorDescription);
          
          // Pour les liens expirés/invalides (pré-chargement client mail),
          // vérifier si une session existe quand même
          const isLinkError = errorDescription?.includes('expired') || errorDescription?.includes('invalid');
          if (isLinkError) {
            console.log('🔍 Lien expiré/invalide — vérification session existante...');
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: { session: existingSession } } = await supabase.auth.getSession();
            if (existingSession?.user) {
              // Session active (OAuth ou confirmation réussie malgré erreur)
              console.log('✅ Session active malgré erreur:', existingSession.user.email);
              if (type === 'signup') {
                await ensureProfileExists(existingSession.user.id, existingSession.user.email || '', existingSession.user.user_metadata);
                await sendWelcomeEmail(existingSession.user.id, existingSession.user.email || '', existingSession.user.user_metadata);
                await supabase.auth.signOut();
                setConfirmationSuccess(true);
                setTimeout(() => onNavigate('login'), 3000);
              } else {
                onNavigate('home');
              }
              return;
            }
            // Pas de session — pour signup, l'email a probablement été confirmé
            if (type === 'signup') {
              setConfirmationSuccess(true);
              setTimeout(() => onNavigate('login'), 3000);
              return;
            }
          }

          throw new Error(errorDescription || errorParam || 'Erreur d\'authentification');
        }

        // Variable pour stocker la session obtenue via PKCE
        let pkceSession: any = null;

        // PKCE flow: échanger le code contre une session
        // Note: detectSessionInUrl peut avoir déjà consommé le code,
        // donc on gère gracieusement les erreurs d'échange
        if (code) {
          console.log('🔑 PKCE flow: échange du code...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.log('⚠️ Échange PKCE échoué (peut-être déjà traité par detectSessionInUrl):', exchangeError.message);

            // Attendre que detectSessionInUrl finisse si en cours
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: existingSession } } = await supabase.auth.getSession();

            if (existingSession?.user) {
              console.log('✅ Session existante trouvée:', existingSession.user.email);
              pkceSession = existingSession;
            } else if (type === 'signup') {
              // Email confirmation ouverte dans un autre navigateur/appareil
              // L'email est confirmé côté serveur, on redirige vers login
              console.log('ℹ️ Pas de session — email confirmé côté serveur, redirection login');
              setConfirmationSuccess(true);
              setTimeout(() => onNavigate('login'), 3000);
              return;
            } else {
              throw new Error('La connexion a échoué. Veuillez réessayer.');
            }
          } else {
            pkceSession = data.session;
            console.log('✅ PKCE session obtenue:', data.session?.user?.email);
          }
        }

        // Confirmation email (type=signup)
        if (type === 'signup') {
          console.log('📧 Confirmation email signup détectée');

          let session = pkceSession;

          // Si pas de session PKCE, essayer via access_token (implicit flow)
          if (!session && accessToken) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: { session: implicitSession } } = await supabase.auth.getSession();
            session = implicitSession;
          }

          // Dernier recours: getSession
          if (!session) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const { data: { session: fallbackSession } } = await supabase.auth.getSession();
            session = fallbackSession;
          }

          if (session?.user) {
            console.log('✅ Session active après confirmation:', session.user.email);
            await ensureProfileExists(session.user.id, session.user.email || '', session.user.user_metadata);

            // Déclencher l'email de bienvenue après confirmation réussie
            await sendWelcomeEmail(session.user.id, session.user.email || '', session.user.user_metadata);

            // Déconnecter l'utilisateur pour qu'il se connecte avec ses identifiants
            await supabase.auth.signOut();

            setConfirmationSuccess(true);
            setTimeout(() => {
              onNavigate('login');
            }, 3000);
            return;
          }

          // Pas de session — l'email a été confirmé mais pas de session auto
          // Le trigger DB handle_user_email_confirmed a quand même créé le profil
          console.log('ℹ️ Email confirmé mais pas de session — tentative envoi welcome email');

          // Tenter d'envoyer l'email de bienvenue même sans session
          // en cherchant le profil le plus récemment confirmé
          try {
            const emailParam = urlParams.get('email') || hashParams.get('email');
            if (emailParam) {
              const { data: confirmedProfile } = await supabase
                .from('profiles')
                .select('id, email, full_name, user_type')
                .eq('email', emailParam.toLowerCase())
                .eq('is_account_confirmed', true)
                .maybeSingle();

              if (confirmedProfile) {
                await sendWelcomeEmail(
                  confirmedProfile.id,
                  confirmedProfile.email,
                  { full_name: confirmedProfile.full_name, user_type: confirmedProfile.user_type }
                );
              }
            }
          } catch {
            // Non-bloquant
          }

          setConfirmationSuccess(true);
          setTimeout(() => {
            onNavigate('login');
          }, 3000);
          return;
        }

        // OAuth callback ou autre
        const session = pkceSession || (await supabase.auth.getSession()).data.session;

        if (!session?.user) {
          throw new Error('Aucune session utilisateur trouvée');
        }

        const userId = session.user.id;
        const userEmail = session.user.email;
        const userMeta = session.user.user_metadata;

        await ensureProfileExists(userId, userEmail || '', userMeta);

        // Gestion spécifique recruteur
        const pendingRole = localStorage.getItem('pending_oauth_role') as UserRole || 'candidate';
        localStorage.removeItem('pending_oauth_role');

        if (pendingRole === 'recruiter') {
          await ensureCompanyExists(userId, userMeta?.full_name || userMeta?.name || 'Utilisateur');
        }

        if (pendingRole === 'trainer') {
          await ensureTrainerProfileExists(userId);
        }

        await new Promise(resolve => setTimeout(resolve, 300));
        onNavigate('home');

      } catch (err: any) {
        console.error('❌ Error handling auth callback:', err);
        setError(err.message || 'Erreur lors de la connexion');
        setTimeout(() => onNavigate('login'), 5000);
      }
    };

    handleCallback();
  }, [onNavigate]);

  // ============================================
  // Helpers
  // ============================================

  async function sendWelcomeEmail(userId: string, email: string, userMeta: any) {
    try {
      const fullName = userMeta?.full_name || userMeta?.name || email.split('@')[0] || 'Utilisateur';
      const userType = userMeta?.user_type || 'candidate';
      const appUrl = 'https://jobguinee-pro.com';
      const dashboardUrl = userType === 'recruiter'
        ? `${appUrl}/recruiter/dashboard`
        : userType === 'trainer'
          ? `${appUrl}/trainer/dashboard`
          : `${appUrl}/candidate/dashboard`;

      // Chercher le template welcome_confirmed
      const { data: templateData } = await supabase
        .from('email_templates')
        .select('id')
        .eq('template_key', 'welcome_confirmed')
        .eq('is_active', true)
        .maybeSingle();

      if (!templateData) {
        console.log('ℹ️ Template welcome_confirmed non trouvé — skip welcome email');
        return;
      }

      // Vérifier qu'un email n'a pas déjà été envoyé (éviter les doublons)
      const { data: existingEmail } = await supabase
        .from('email_queue')
        .select('id')
        .eq('user_id', userId)
        .eq('template_id', templateData.id)
        .maybeSingle();

      if (existingEmail) {
        console.log('ℹ️ Welcome email déjà dans la queue — skip');
        return;
      }

      await supabase.from('email_queue').insert({
        template_id: templateData.id,
        to_email: email,
        to_name: fullName,
        template_variables: {
          user_name: fullName,
          user_email: email,
          user_type: userType,
          dashboard_url: dashboardUrl,
          profile_url: userType === 'recruiter'
            ? `${appUrl}/recruiter/profile`
            : `${appUrl}/candidate/profile`,
          jobs_url: `${appUrl}/jobs`,
          alerts_url: `${appUrl}/candidate/dashboard`,
          app_url: appUrl,
        },
        priority: 8,
        scheduled_for: new Date().toISOString(),
        user_id: userId,
      });

      console.log('📧 Welcome email queued for', email);
    } catch (err) {
      // Non-bloquant — ne pas empêcher la confirmation
      console.warn('⚠️ Erreur envoi welcome email (non-bloquant):', err);
    }
  }

  async function ensureProfileExists(userId: string, email: string, userMeta: any) {
    const fullName = userMeta?.full_name || userMeta?.name || email.split('@')[0] || 'Utilisateur';
    // Priority: auth metadata > localStorage (for OAuth) > default 'candidate'
    const role = (userMeta?.user_type || localStorage.getItem('pending_oauth_role') || 'candidate') as UserRole;

    let profileData = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!profileData && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 400));

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
      console.log('📝 Création du profil manquant pour', email, 'role:', role);
      
      // Try inserting via Supabase client (RLS: id = auth.uid())
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName,
          user_type: role,
          credits_balance: 100,
          is_account_confirmed: true,
        });

      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('⚠️ Erreur création profil:', insertError.message);
      }
    } else if (!profileData.is_account_confirmed) {
      // Profile exists but not confirmed — mark it confirmed (OAuth users)
      await supabase
        .from('profiles')
        .update({ is_account_confirmed: true, confirmation_token: null })
        .eq('id', userId);
    }

    // Wait and verify profile was created
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const { data: verifyProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (verifyProfile) {
      console.log('✅ Profil créé avec succès:', verifyProfile.email, 'type:', verifyProfile.user_type);
    } else {
      console.error('❌ Profil toujours manquant après insertion pour:', email);
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
            Votre compte a été activé avec succès. Vous pouvez maintenant vous connecter avec votre email et mot de passe.
          </p>
          <p className="text-sm text-gray-500">Redirection en cours...</p>
          <button
            onClick={() => onNavigate('login')}
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Se connecter maintenant
          </button>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Problème de confirmation</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-4">Redirection vers la page de connexion...</p>
          <button
            onClick={() => onNavigate('login')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Se connecter maintenant
          </button>
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
