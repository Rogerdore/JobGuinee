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
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');

        if (type === 'signup') {
          setConfirmationSuccess(true);
          setTimeout(() => {
            onNavigate('auth');
          }, 3000);
          return;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session?.user) {
          throw new Error('Aucune session utilisateur trouvée');
        }

        const userId = session.user.id;
        const userEmail = session.user.email;
        const fullName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail?.split('@')[0] || 'Utilisateur';

        const pendingRole = localStorage.getItem('pending_oauth_role') as UserRole || 'candidate';
        localStorage.removeItem('pending_oauth_role');

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

        if (!profileData) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: userEmail,
              full_name: fullName,
              user_type: pendingRole,
              credits_balance: 10,
              ai_credits_balance: 5,
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

        if (pendingRole === 'trainer' && profileData) {
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
                total_students: 0
              });
          }
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        onNavigate('home');

      } catch (err: any) {
        console.error('Error handling OAuth callback:', err);
        setError(err.message || 'Erreur lors de la connexion');
        setTimeout(() => onNavigate('auth'), 3000);
      }
    };

    handleCallback();
  }, [onNavigate]);

  if (confirmationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email confirmé !</h2>
          <p className="text-gray-600 mb-4">
            Votre compte a été activé avec succès.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers la page de connexion...
          </p>
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
