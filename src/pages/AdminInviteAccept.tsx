import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Crown, CheckCircle, XCircle, Eye, EyeOff, Shield, AlertCircle,
  Loader2, ArrowRight, Lock
} from 'lucide-react';

interface InvitationData {
  id: string;
  invitation_token: string;
  invitee_email: string;
  invitee_name: string;
  status: string;
  expires_at: string;
  inviter_name: string;
  created_at: string;
}

type Step = 'loading' | 'valid' | 'setting-password' | 'success' | 'invalid' | 'expired' | 'already-accepted';

export default function AdminInviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('loading');
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStep('invalid');
      return;
    }
    loadInvitation();
  }, [token]);

  const loadInvitation = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_invitation_by_token', { p_token: token });

      if (error || !data || data.length === 0) {
        setStep('invalid');
        return;
      }

      const inv: InvitationData = data[0];
      setInvitation(inv);

      if (inv.status === 'accepted') {
        setStep('already-accepted');
      } else if (inv.status === 'expired' || new Date(inv.expires_at) < new Date()) {
        setStep('expired');
      } else if (inv.status === 'revoked') {
        setStep('invalid');
      } else {
        setStep('valid');
      }
    } catch {
      setStep('invalid');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    if (!invitation) return;

    setSubmitting(true);
    setStep('setting-password');

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.invitee_email,
        password,
        options: {
          data: {
            full_name: invitation.invitee_name,
            user_type: 'admin',
          },
        },
      });

      if (signUpError) {
        if (signUpError.message?.includes('already registered')) {
          setError('Cet email est déjà enregistré. Contactez l\'administrateur principal.');
        } else {
          setError(signUpError.message);
        }
        setStep('valid');
        setSubmitting(false);
        return;
      }

      if (!signUpData.user) {
        setError('Erreur lors de la création du compte. Réessayez.');
        setStep('valid');
        setSubmitting(false);
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: signUpData.user.id,
          email: invitation.invitee_email,
          full_name: invitation.invitee_name,
          user_type: 'admin',
        });

      if (profileError) {
        console.error('Profile upsert error:', profileError);
      }

      await supabase.rpc('mark_invitation_accepted', {
        p_token: token,
        p_user_id: signUpData.user.id,
      });

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setStep('valid');
    } finally {
      setSubmitting(false);
    }
  };

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 8) return { label: 'Trop court', color: 'bg-red-500', width: '25%' };
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
    if (score <= 1) return { label: 'Faible', color: 'bg-orange-400', width: '40%' };
    if (score === 2) return { label: 'Moyen', color: 'bg-yellow-400', width: '60%' };
    if (score === 3) return { label: 'Fort', color: 'bg-blue-500', width: '80%' };
    return { label: 'Très fort', color: 'bg-green-500', width: '100%' };
  };

  const strength = passwordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white mb-2">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold tracking-tight">JobGuinée</span>
          </div>
          <p className="text-slate-400 text-sm">Portail d'administration</p>
        </div>

        {step === 'loading' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Vérification de l'invitation...</p>
          </div>
        )}

        {(step === 'valid' || step === 'setting-password') && invitation && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-blue-800 p-6 text-center">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-xl font-bold text-white">Invitation Administrateur</h1>
              <p className="text-blue-200 text-sm mt-1">Configurez votre accès administrateur</p>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-1">
                  Invité par <strong>{invitation.inviter_name}</strong>
                </p>
                <p className="text-xs text-blue-600">
                  Compte : <strong>{invitation.invitee_email}</strong>
                </p>
                <p className="text-xs text-blue-500 mt-1">
                  Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={invitation.invitee_name}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    value={invitation.invitee_email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Choisissez votre mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      required
                      minLength={8}
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                          style={{ width: strength.width }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Répétez le mot de passe"
                      required
                      className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                  )}
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Mots de passe identiques
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || step === 'setting-password'}
                  className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-blue-700 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-blue-800 transition disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                >
                  {(submitting || step === 'setting-password') ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création du compte...
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      Activer mon compte administrateur
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Compte activé !</h2>
            <p className="text-gray-600 mb-2">
              Votre compte administrateur <strong>{invitation?.invitee_name}</strong> a été créé avec succès.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Vous pouvez maintenant vous connecter avec votre adresse email et le mot de passe que vous venez de définir.
            </p>
            <button
              onClick={() => navigate('/?page=login')}
              className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-blue-700 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-blue-800 transition flex items-center justify-center gap-2"
            >
              Se connecter à l'administration
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'expired' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Invitation expirée</h2>
            <p className="text-gray-600 mb-8">
              Cette invitation a expiré (validité 72 heures). Contactez l'administrateur principal pour recevoir une nouvelle invitation.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {step === 'already-accepted' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Invitation déjà acceptée</h2>
            <p className="text-gray-600 mb-8">
              Ce compte administrateur a déjà été activé. Connectez-vous directement.
            </p>
            <button
              onClick={() => navigate('/?page=login')}
              className="w-full py-3.5 bg-gradient-to-r from-slate-800 to-blue-700 text-white rounded-xl font-semibold hover:from-slate-900 hover:to-blue-800 transition flex items-center justify-center gap-2"
            >
              Se connecter
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'invalid' && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Invitation invalide</h2>
            <p className="text-gray-600 mb-8">
              Ce lien d'invitation est invalide ou a été révoqué. Contactez l'administrateur principal.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
