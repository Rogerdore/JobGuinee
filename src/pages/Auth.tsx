import { useState, useEffect } from 'react';
import { Mail, Lock, User, AlertCircle, GraduationCap, Briefcase, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';
import { getAuthRedirectIntent } from '../hooks/useAuthRedirect';

interface AuthProps {
  mode: 'login' | 'signup';
  onNavigate: (page: string, state?: any) => void;
}

export default function Auth({ mode, onNavigate }: AuthProps) {
  const { signIn, signUp, signInWithGoogle, getAndClearRedirectIntent, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        if (!fullName.trim()) {
          setError('Veuillez entrer votre nom complet');
          setLoading(false);
          return;
        }
        await signUp(email, password, fullName, role);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const intent = getAndClearRedirectIntent();

      if (intent) {
        if (intent.type === 'apply_job' && intent.jobId) {
          onNavigate('job-detail', {
            jobId: intent.jobId,
            autoOpenApply: true,
            metadata: intent.metadata
          });
        } else if (intent.type === 'save_job' && intent.jobId) {
          onNavigate('job-detail', { jobId: intent.jobId });
        } else if (intent.returnPath) {
          onNavigate(intent.returnPath);
        } else if (intent.returnPage) {
          onNavigate(intent.returnPage);
        } else {
          onNavigate('home');
        }
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);

    try {
      await signInWithGoogle(role);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la connexion avec Google');
      setGoogleLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword(resetEmail);
      setResetSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Connexion' : 'Inscription'}
          </h1>
          <p className="text-gray-600">
            {isLogin
              ? 'Accédez à votre compte JobGuinée'
              : 'Créez votre compte gratuitement'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Votre nom complet"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Je suis
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('candidate')}
                      className={`p-3 rounded-lg border-2 transition ${
                        role === 'candidate'
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <User className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-semibold">Candidat</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('recruiter')}
                      className={`p-3 rounded-lg border-2 transition ${
                        role === 'recruiter'
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Briefcase className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-semibold">Recruteur</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('trainer')}
                      className={`p-3 rounded-lg border-2 transition ${
                        role === 'trainer'
                          ? 'border-blue-500 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-xs font-semibold">Formateur</div>
                    </button>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="votre@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 6 caractères
                </p>
              )}
              {isLogin && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(true)}
                    className="text-sm text-blue-900 hover:text-blue-700 font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition shadow-lg"
            >
              {loading
                ? 'Chargement...'
                : isLogin
                ? 'Se connecter'
                : "S'inscrire"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-900 hover:text-blue-700 font-medium"
            >
              {isLogin
                ? "Pas encore de compte ? S'inscrire"
                : 'Déjà inscrit ? Se connecter'}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-600 hover:text-gray-900"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>

      {showResetPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            {!resetSuccess ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Réinitialiser le mot de passe
                </h2>
                <p className="text-gray-600 mb-6">
                  Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                </p>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="votre@email.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetPassword(false);
                        setError('');
                        setResetEmail('');
                      }}
                      className="flex-1 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition"
                    >
                      {loading ? 'Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Email envoyé !
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Un lien de réinitialisation a été envoyé à <strong>{resetEmail}</strong>. Vérifiez votre boîte de réception.
                  </p>
                  <button
                    onClick={() => {
                      setShowResetPassword(false);
                      setResetSuccess(false);
                      setResetEmail('');
                    }}
                    className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
