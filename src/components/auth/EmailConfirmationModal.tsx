import { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowRight, LogIn, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface EmailConfirmationModalProps {
  email: string;
  onClose: () => void;
  onGoToLogin?: () => void;
}

function getMailboxUrl(email: string): { url: string; label: string } | null {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return null;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return { url: 'https://mail.google.com', label: 'Ouvrir Gmail' };
  }
  if (domain === 'outlook.com' || domain === 'hotmail.com' || domain === 'live.com' || domain === 'msn.com' || domain === 'outlook.fr') {
    return { url: 'https://outlook.live.com', label: 'Ouvrir Outlook' };
  }
  if (domain === 'yahoo.com' || domain === 'yahoo.fr' || domain === 'ymail.com') {
    return { url: 'https://mail.yahoo.com', label: 'Ouvrir Yahoo Mail' };
  }
  if (domain === 'icloud.com' || domain === 'me.com' || domain === 'mac.com') {
    return { url: 'https://www.icloud.com/mail', label: 'Ouvrir iCloud Mail' };
  }
  if (domain === 'protonmail.com' || domain === 'proton.me' || domain === 'pm.me') {
    return { url: 'https://mail.proton.me', label: 'Ouvrir ProtonMail' };
  }
  return null;
}

export function EmailConfirmationModal({ email, onClose, onGoToLogin }: EmailConfirmationModalProps) {
  const { resendConfirmationEmail } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      await resendConfirmationEmail(email);
      setResendSuccess(true);
    } catch (err: any) {
      if (err.message === 'EMAIL_ALREADY_CONFIRMED') {
        setAlreadyConfirmed(true);
        setError(null);
      } else {
        setError(err.message || "Erreur lors de l'envoi de l'email.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">

        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-6 text-center">
          <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Inscription en cours...</h2>
          <p className="text-blue-100 text-sm mt-1">Un email de confirmation vous a été envoyé</p>
        </div>

        <div className="p-8">
          {alreadyConfirmed ? (
            <div className="text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Email deja confirme !</h3>
              <p className="text-gray-600 mb-6 text-sm">
                Votre compte est actif. Vous pouvez maintenant vous connecter avec vos identifiants.
              </p>
              <button
                onClick={onGoToLogin ?? onClose}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl transition"
              >
                <LogIn className="w-5 h-5" />
                <span>Se connecter maintenant</span>
              </button>
            </div>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-900 mb-1">Action requise</p>
                    <p className="text-sm text-amber-800">
                      Veuillez consulter votre boite mail pour confirmer votre inscription avant de vous connecter.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <p className="text-sm text-gray-500 mb-1">Email de confirmation envoyé a :</p>
                <div className="flex items-center space-x-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 text-sm">{email}</span>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                {[
                  { step: '1', text: 'Ouvrez votre boîte mail' },
                  { step: '2', text: 'Cliquez sur le lien de confirmation' },
                  { step: '3', text: 'Revenez vous connecter avec vos identifiants' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step}
                    </div>
                    <p className="text-sm text-gray-700">{text}</p>
                  </div>
                ))}
              </div>

              {(() => {
                const mailbox = getMailboxUrl(email);
                if (!mailbox) return null;
                return (
                  <a
                    href={mailbox.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center space-x-2 py-3 mb-5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
                  >
                    <ExternalLink className="w-5 h-5" />
                    <span>{mailbox.label}</span>
                  </a>
                );
              })()}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 text-xs text-blue-800">
                <strong>Apres confirmation</strong>, revenez sur cette page et connectez-vous avec :<br />
                <span className="font-mono">Email :</span> <span className="font-semibold">{email}</span><br />
                <span className="font-mono">Mot de passe :</span> <span className="font-semibold">votre mot de passe choisi</span>
              </div>

              {resendSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-green-800">Email renvoyé ! Vérifiez également votre dossier spam.</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={onGoToLogin ?? onClose}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-900 hover:bg-blue-800 text-white font-semibold rounded-xl transition"
                >
                  <LogIn className="w-5 h-5" />
                  <span>Aller a la page de connexion</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleResend}
                  disabled={isResending || resendSuccess}
                  className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : resendSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Email renvoyé</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Renvoyer l'email de confirmation</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">
                Vérifiez votre dossier spam si vous ne voyez pas l'email dans votre boite de réception.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
