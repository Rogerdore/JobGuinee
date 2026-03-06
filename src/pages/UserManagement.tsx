import { useState, useEffect } from 'react';
import {
  Users, Shield, UserCog, Search, AlertCircle, CheckCircle, X,
  ArrowLeft, Home, ChevronRight, Trash2, UserPlus, RefreshCw,
  Crown, Send, Mail, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserManagementProps {
  onNavigate: (page: string) => void;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'candidate' | 'recruiter' | 'admin' | 'trainer';
  created_at: string;
  phone?: string;
}

const USER_TYPES = [
  { value: 'candidate', label: 'Candidat',       color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'recruiter', label: 'Recruteur',       color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'trainer',   label: 'Formateur',       color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'admin',     label: 'Administrateur',  color: 'bg-red-100 text-red-700 border-red-200' },
];

export default function UserManagement({ onNavigate }: UserManagementProps) {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'candidate' | 'recruiter' | 'admin' | 'trainer'>('all');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Profile | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', name: '' });
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);

  useEffect(() => { loadUsers(); loadPendingInvitations(); }, []);
  useEffect(() => { filterUsers(); }, [users, searchTerm, filterType]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, created_at, phone')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setUsers(data || []);
    } catch {
      showMessage('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      const { count } = await supabase
        .from('admin_invitations')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());
      setPendingInvitationsCount(count || 0);
    } catch {
      /* non-critical */
    }
  };

  const filterUsers = () => {
    let filtered = users;
    if (filterType !== 'all') {
      filtered = filtered.filter(u => u.user_type === filterType);
    }
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(s) || u.full_name?.toLowerCase().includes(s)
      );
    }
    setFilteredUsers(filtered);
  };

  const handleChangeUserType = async (userId: string, newType: Profile['user_type']) => {
    if (userId === currentUser?.id) {
      showMessage('error', 'Vous ne pouvez pas modifier votre propre rôle');
      return;
    }
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase.rpc('admin_update_user_type', {
        target_user_id: userId,
        new_type: newType,
      });
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type: newType } : u));
      showMessage('success', 'Rôle mis à jour avec succès');
    } catch (err: any) {
      showMessage('error', err.message?.includes('admin required') ? 'Droits administrateur requis' : 'Erreur lors de la modification du rôle');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = (user: Profile) => {
    if (user.id === currentUser?.id) {
      showMessage('error', 'Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    setShowDeleteConfirm(user);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;
    setDeletingUserId(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', showDeleteConfirm.id);
      if (error) throw error;
      setUsers(prev => prev.filter(u => u.id !== showDeleteConfirm.id));
      showMessage('success', `Utilisateur ${showDeleteConfirm.full_name || showDeleteConfirm.email} supprimé`);
    } catch {
      showMessage('error', 'Erreur lors de la suppression');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteForm.email.trim() || !inviteForm.name.trim()) {
      showMessage('error', 'Nom et email sont obligatoires');
      return;
    }

    setInviting(true);
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
        body: JSON.stringify({
          invitee_email: inviteForm.email.trim(),
          invitee_name: inviteForm.name.trim(),
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        showMessage('error', result.error || "Erreur lors de l'envoi");
        return;
      }

      showMessage('success', `Invitation envoyée à ${inviteForm.email}. La personne recevra un lien pour créer son compte.`);
      setShowInviteModal(false);
      setInviteForm({ email: '', name: '' });
      setPendingInvitationsCount(c => c + 1);
    } catch (err: any) {
      showMessage('error', err.message || "Erreur lors de l'envoi de l'invitation");
    } finally {
      setInviting(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 7000);
  };

  const getUserTypeInfo = (type: string) =>
    USER_TYPES.find(t => t.value === type) || { value: type, label: type, color: 'bg-gray-100 text-gray-700 border-gray-200' };

  const userCounts = USER_TYPES.reduce((acc, type) => {
    acc[type.value] = users.filter(u => u.user_type === type.value).length;
    return acc;
  }, {} as Record<string, number>);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="neo-clay-card rounded-2xl p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-6">Vous devez être administrateur pour accéder à cette page.</p>
            <button onClick={() => onNavigate('home')} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="mb-6">
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
              <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-blue-600 transition">
                <Home className="w-4 h-4" /><span>Accueil</span>
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Administration</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-blue-600 font-medium">Gestion des utilisateurs</span>
            </div>
            <button onClick={() => onNavigate('cms-admin')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Retour au CMS</span>
            </button>
          </div>

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Gestion des utilisateurs</h1>
              <p className="text-gray-600">Gérez les comptes, rôles et accès des utilisateurs</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('admin-invitations')}
                className="relative flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-sm"
              >
                <Mail className="w-4 h-4" />
                Invitations
                {pendingInvitationsCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingInvitationsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition shadow-md"
              >
                <UserPlus className="w-5 h-5" />
                Créer un administrateur
              </button>
            </div>
          </div>

          {message && (
            <div className={`mb-6 neo-clay-card rounded-xl p-4 flex items-center gap-3 ${message.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
              {message.type === 'success'
                ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>{message.text}</p>
              <button onClick={() => setMessage(null)} className="ml-auto text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {USER_TYPES.map(type => (
              <div key={type.value} className="neo-clay-card rounded-xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color.split(' ').slice(0, 2).join(' ')}`}>
                  {type.value === 'admin'     && <Crown className="w-5 h-5" />}
                  {type.value === 'recruiter' && <UserCog className="w-5 h-5" />}
                  {type.value === 'trainer'   && <Shield className="w-5 h-5" />}
                  {type.value === 'candidate' && <Users className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userCounts[type.value] || 0}</p>
                  <p className="text-xs text-gray-500">{type.label}{(userCounts[type.value] || 0) > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="neo-clay-card rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl neo-clay-input focus:outline-none"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'candidate', 'recruiter', 'trainer', 'admin'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-4 py-2 rounded-xl font-medium transition text-sm ${filterType === type ? 'neo-clay-pressed text-blue-700' : 'neo-clay-button text-gray-600'}`}
                  >
                    {type === 'all' ? 'Tous' : getUserTypeInfo(type).label}
                    {type !== 'all' && <span className="ml-1.5 text-xs opacity-70">({userCounts[type] || 0})</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <p>{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}</p>
              <button onClick={loadUsers} className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium">
                <RefreshCw className="w-4 h-4" />Actualiser
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="neo-clay-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Utilisateur</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rôle actuel</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Inscription</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Changer le rôle</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Supprimer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map((user) => {
                      const typeInfo = getUserTypeInfo(user.user_type);
                      const isSelf = user.id === currentUser?.id;
                      const isUpdating = updatingUserId === user.id;
                      const isDeleting = deletingUserId === user.id;
                      return (
                        <tr key={user.id} className={`hover:bg-gray-50/50 transition ${isSelf ? 'bg-blue-50/30' : ''}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                                {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {user.full_name || 'Sans nom'}
                                  {isSelf && <span className="ml-2 text-xs text-blue-600 font-normal">(vous)</span>}
                                </p>
                                {user.phone && <p className="text-xs text-gray-400">{user.phone}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${typeInfo.color}`}>
                              {user.user_type === 'admin' && <Crown className="w-3 h-3" />}
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={user.user_type}
                                onChange={(e) => handleChangeUserType(user.id, e.target.value as Profile['user_type'])}
                                disabled={isUpdating || isSelf}
                                title={isSelf ? 'Vous ne pouvez pas modifier votre propre rôle' : 'Changer le rôle'}
                                className="px-3 py-2 rounded-lg neo-clay-input text-sm font-medium focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <option value="candidate">Candidat</option>
                                <option value="recruiter">Recruteur</option>
                                <option value="trainer">Formateur</option>
                                <option value="admin">Administrateur</option>
                              </select>
                              {isUpdating && <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isDeleting ? (
                              <div className="inline-flex items-center justify-center w-8 h-8">
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={isSelf}
                                title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer'}
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredUsers.length === 0 && !loading && (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 neo-clay-card rounded-xl p-4 flex items-start gap-3 bg-amber-50 border border-amber-100">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Promouvoir un utilisateur existant en administrateur</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Pour rendre administrateur un utilisateur déjà inscrit, utilisez le menu déroulant dans la colonne "Changer le rôle" du tableau.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Inviter un administrateur</h2>
                  <p className="text-xs text-gray-500">Invitation sécurisée par email</p>
                </div>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Jean Dupont"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email *</label>
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="admin@exemple.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-xs font-semibold text-blue-800">Processus d'invitation sécurisée</p>
                </div>
                <ol className="text-xs text-blue-700 space-y-1 pl-5 list-decimal">
                  <li>Un email avec un lien sécurisé est envoyé à la personne</li>
                  <li>Elle clique sur le lien et choisit son propre mot de passe</li>
                  <li>Son compte administrateur est activé automatiquement</li>
                  <li>L'invitation expire au bout de 72 heures</li>
                </ol>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {inviting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi...</>
                  ) : (
                    <><Send className="w-4 h-4" />Envoyer l'invitation</>
                  )}
                </button>
              </div>
            </form>

            <div className="px-6 pb-5 border-t border-gray-100 pt-4">
              <button
                onClick={() => { setShowInviteModal(false); onNavigate('admin-invitations'); }}
                className="w-full flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Gérer toutes les invitations
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Supprimer cet utilisateur ?</h2>
              <p className="text-gray-600 text-sm">
                Vous êtes sur le point de supprimer le profil de{' '}
                <strong>{showDeleteConfirm.full_name || showDeleteConfirm.email}</strong>.
                Cette action est irréversible.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
