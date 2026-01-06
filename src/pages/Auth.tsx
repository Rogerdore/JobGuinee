import { useState, useEffect } from 'react';
import { Mail, Lock, User, AlertCircle, GraduationCap, Briefcase } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../lib/supabase';
import { getAuthRedirectIntent } from '../hooks/useAuthRedirect';

interface AuthProps {
  mode: 'login' | 'signup';
  onNavigate: (page: string, state?: any) => void;
}

export default function Auth({ mode, onNavigate }: AuthProps) {
  const { signIn, signUp, signInWithGoogle, getAndClearRedirectIntent } = useAuth();
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-4">
            <img
              src="/image.png"
              alt="JobGuinée"
              className="w-full h-full object-contain"
            />
          </div>
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              {!isLogin && (
                <p className="mt-1 text-xs text-gray-500">
                  Minimum 6 caractères
                </p>
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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Ou continuer avec</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-3 px-4 border-2 border-gray-300 hover:border-gray-400 disabled:border-gray-200 disabled:bg-gray-50 bg-white text-gray-700 font-semibold rounded-lg transition flex items-center justify-center space-x-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>
              {googleLoading ? 'Connexion...' : 'Google'}
            </span>
          </button>

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
    </div>
  );
}
