import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  onNavigate: (page: string) => void;
  fallbackMessage?: string;
}

/**
 * Garde de route qui vérifie :
 * 1. L'utilisateur est connecté
 * 2. L'email est confirmé (email_confirmed_at non null)
 *
 * Utilisé par App.tsx dans le système de navigation custom (onNavigate).
 * Les utilisateurs Google OAuth sont automatiquement considérés confirmés.
 */
export function ProtectedRoute({ children, onNavigate, fallbackMessage }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    onNavigate('login');
    return null;
  }

  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Email non confirmé</h2>
          <p className="text-gray-600 mb-6 text-sm">
            {fallbackMessage || 'Veuillez confirmer votre adresse email pour accéder à votre compte. Vérifiez votre boîte mail.'}
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-lg transition"
          >
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}