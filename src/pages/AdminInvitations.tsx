import { useState, useEffect } from 'react';
import {
  Crown, UserPlus, Mail, Clock, CheckCircle, XCircle, RefreshCw,
  Trash2, Send, AlertCircle, Home, ChevronRight, ArrowLeft, Copy, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AdminInvitationsProps {
  onNavigate: (page: string) => void;
}

interface Invitation {
  id: string;
  invitation_token: string;
  invitee_email: string;
  invitee_name: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  inviter_id: string | null;
}

const STATUS_CONFIG = {
  pending:  { label: 'En attente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  accepted: { label: 'Acceptée',   color: 'bg-green-100 text-green-700 border-green-200' },
  expired:  { label: 'Expirée',    color: 'bg-gray-100 text-gray-500 border-gray-200' },
  revoked:  { label: 'Révoquée',   color: 'bg-red-100 text-red-600 border-red-200' },
};

export default function AdminInvitations({ onNavigate }: AdminInvitationsProps) {
  const { isAdmin, user: currentUser } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '' });

  useEffect(() => { loadInvitations(); }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_invitations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvitations(data || []);
    } catch {
      showMsg('error', 'Erreur lors du chargement des invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.name.trim()) {
      showMsg('error', 'Nom et email sont obligatoires');
      return;
    }
    setSending(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`${supabaseUrl}/functions/v1/send-admin-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || supabaseAnonKey}`,
        },
        body: JSON.stringify({ invitee_email: form.email.trim(), invitee_name: form.name.trim() }),
      });

      const result = await response.json();
      if (!response.ok) {
        showMsg('error', result.error || "Erreur lors de l'envoi");
        return;
      }

      showMsg('success', `Invitation envoyée à ${form.email.trim()}${result.email_sent ? ' par email' : ' (email en attente)'}`);
      setForm({ email: '', name: '' });
      setShowForm(false);
      await loadInvitations();
    } catch (err: any) {
      showMsg('error', err.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setSending(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    try {
      const { error } = await supabase.rpc('revoke_admin_invitation', { p_invitation_id: id });
      if (error) throw error;
      setInvitations(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'revoked' } : inv));
      showMsg('success', 'Invitation révoquée');
    } catch {
      showMsg('error', "Erreur lors de la révocation");
    } finally {
      setRevoking(null);
    }
  };

  const copyInviteLink = (token: string) => {
    const url = `${window.location.origin}/admin-invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedToken(token);
      setTimeout(() => setCopiedToken(null), 2000);
    });
  };

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const pendingCount = invitations.filter(i => i.status === 'pending').length;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <button onClick={() => onNavigate('home')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
            <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-blue-600 transition">
              <Home className="w-4 h-4" /><span>Accueil</span>
            </button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Administration</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-blue-600 font-medium">Invitations administrateurs</span>
          </div>
          <button onClick={() => onNavigate('user-management')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Retour à la gestion des utilisateurs</span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Invitations administrateurs</h1>
            <p className="text-gray-600">Gérez les invitations envoyées pour créer des comptes administrateurs</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition shadow-md"
          >
            <UserPlus className="w-5 h-5" />
            Inviter un administrateur
          </button>
        </div>

        {message && (
          <div className={`mb-6 neo-clay-card rounded-xl p-4 flex items-center gap-3 ${message.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
            {message.type === 'success'
              ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
            <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>{message.text}</p>
            <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {(['pending', 'accepted', 'expired', 'revoked'] as const).map(s => (
            <div key={s} className="neo-clay-card rounded-xl p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${STATUS_CONFIG[s].color.split(' ').slice(0, 2).join(' ')}`}>
                {s === 'pending' && <Clock className="w-5 h-5" />}
                {s === 'accepted' && <CheckCircle className="w-5 h-5" />}
                {s === 'expired' && <XCircle className="w-5 h-5" />}
                {s === 'revoked' && <Trash2 className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{invitations.filter(i => i.status === s).length}</p>
                <p className="text-xs text-gray-500">{STATUS_CONFIG[s].label}{invitations.filter(i => i.status === s).length > 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="neo-clay-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              {invitations.length} invitation{invitations.length !== 1 ? 's' : ''}
              {pendingCount > 0 && <span className="ml-2 text-sm text-amber-600">({pendingCount} en attente)</span>}
            </h2>
            <button onClick={loadInvitations} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium text-sm">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </button>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-blue-600"></div>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-16">
              <Mail className="w-14 h-14 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucune invitation envoyée</p>
              <p className="text-gray-400 text-sm mt-1">Utilisez le bouton ci-dessus pour inviter un administrateur</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invité</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Envoyée le</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Expire le</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invitations.map((inv) => {
                    const cfg = STATUS_CONFIG[inv.status];
                    const isExpired = inv.status === 'pending' && new Date(inv.expires_at) < new Date();
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                              {inv.invitee_name?.charAt(0).toUpperCase() || inv.invitee_email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{inv.invitee_name || '—'}</p>
                              <p className="text-xs text-gray-500">{inv.invitee_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${isExpired ? STATUS_CONFIG.expired.color : cfg.color}`}>
                            {isExpired ? STATUS_CONFIG.expired.label : cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(inv.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {inv.status === 'accepted' && inv.accepted_at
                            ? <span className="text-green-600 text-xs">Acceptée le {new Date(inv.accepted_at).toLocaleDateString('fr-FR')}</span>
                            : new Date(inv.expires_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {(inv.status === 'pending' && !isExpired) && (
                              <>
                                <button
                                  onClick={() => copyInviteLink(inv.invitation_token)}
                                  title="Copier le lien d'invitation"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                                >
                                  {copiedToken === inv.invitation_token
                                    ? <><Check className="w-3.5 h-3.5" /> Copié</>
                                    : <><Copy className="w-3.5 h-3.5" /> Lien</>}
                                </button>
                                <button
                                  onClick={() => handleRevoke(inv.id)}
                                  disabled={revoking === inv.id}
                                  title="Révoquer l'invitation"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-40"
                                >
                                  {revoking === inv.id
                                    ? <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    : <><XCircle className="w-3.5 h-3.5" /> Révoquer</>}
                                </button>
                              </>
                            )}
                            {(inv.status === 'pending' && !isExpired) && (
                              <button
                                onClick={() => copyInviteLink(inv.invitation_token)}
                                title="Renvoyer le lien"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                              >
                                <Send className="w-3.5 h-3.5" /> Renvoyer
                              </button>
                            )}
                            {(inv.status === 'expired' || isExpired || inv.status === 'revoked') && (
                              <span className="text-xs text-gray-400 italic">Aucune action disponible</span>
                            )}
                            {inv.status === 'accepted' && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-600">
                                <Crown className="w-3.5 h-3.5" /> Admin activé
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inviter un administrateur</h2>
                  <p className="text-xs text-gray-500">Un email sera envoyé avec un lien sécurisé</p>
                </div>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@exemple.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2">
                <Mail className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700">
                  <p className="font-medium mb-0.5">Comment ça fonctionne</p>
                  <p>Un email contenant un lien sécurisé sera envoyé. La personne invitée devra cliquer dessus pour créer son mot de passe. L'invitation expire dans 72h.</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {sending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</>
                  ) : (
                    <><Send className="w-4 h-4" />Envoyer l'invitation</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
