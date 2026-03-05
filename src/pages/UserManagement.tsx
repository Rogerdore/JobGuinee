import { useState, useEffect } from 'react';
import {
  Users, Shield, UserCog, Search, AlertCircle, CheckCircle, X,
  ArrowLeft, Home, ChevronRight, Trash2, UserPlus, Eye, EyeOff,
  RefreshCw, Crown
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

interface NewAdminForm {
  email: string;
  password: string;
  full_name: string;
}

const USER_TYPES = [
  { value: 'candidate', label: 'Candidat', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'recruiter', label: 'Recruteur', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'trainer', label: 'Formateur', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'admin', label: 'Administrateur', color: 'bg-red-100 text-red-700 border-red-200' },
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
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Profile | null>(null);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newAdminForm, setNewAdminForm] = useState<NewAdminForm>({
    email: '',
    password: '',
    full_name: '',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, filterType]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, user_type, created_at, phone')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      showMessage('error', 'Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterType);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        user.email?.toLowerCase().includes(search) ||
        user.full_name?.toLowerCase().includes(search)
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
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newType })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, user_type: newType } : u));
      showMessage('success', 'Rôle mis à jour avec succès');
    } catch (error) {
      showMessage('error', 'Erreur lors de la modification du rôle');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (user: Profile) => {
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
    } catch (error) {
      showMessage('error', 'Erreur lors de la suppression');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminForm.email || !newAdminForm.password || !newAdminForm.full_name) {
      showMessage('error', 'Tous les champs sont obligatoires');
      return;
    }
    if (newAdminForm.password.length < 8) {
      showMessage('error', 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: newAdminForm.email,
        password: newAdminForm.password,
        options: {
          data: {
            full_name: newAdminForm.full_name,
            user_type: 'admin',
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: newAdminForm.email,
            full_name: newAdminForm.full_name,
            user_type: 'admin',
          });

        if (profileError) throw profileError;
      }

      showMessage('success', `Compte administrateur créé pour ${newAdminForm.full_name}`);
      setShowCreateModal(false);
      setNewAdminForm({ email: '', password: '', full_name: '' });
      await loadUsers();
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        showMessage('error', 'Cet email est déjà utilisé. Vous pouvez changer le rôle d\'un compte existant.');
      } else {
        showMessage('error', error.message || 'Erreur lors de la création du compte');
      }
    } finally {
      setCreating(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  };

  const getUserTypeInfo = (type: string) => {
    return USER_TYPES.find(t => t.value === type) || { value: type, label: type, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

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
            <button onClick={() => onNavigate('home')} className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition">
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
              <button onClick={() => onNavigate('home')} className="flex items-center gap-1 hover:text-primary-600 transition">
                <Home className="w-4 h-4" />
                <span>Accueil</span>
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 font-medium">Administration</span>
              <ChevronRight className="w-4 h-4" />
              <span className="text-primary-600 font-medium">Gestion des utilisateurs</span>
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition shadow-md"
            >
              <UserPlus className="w-5 h-5" />
              Créer un administrateur
            </button>
          </div>

          {message && (
            <div className={`mb-6 neo-clay-card rounded-xl p-4 flex items-center gap-3 ${message.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
              <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>{message.text}</p>
              <button onClick={() => setMessage(null)} className="ml-auto text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {USER_TYPES.map(type => (
              <div key={type.value} className="neo-clay-card rounded-xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type.color.split(' ').slice(0, 2).join(' ')}`}>
                  {type.value === 'admin' ? <Crown className="w-5 h-5" /> :
                   type.value === 'recruiter' ? <UserCog className="w-5 h-5" /> :
                   type.value === 'trainer' ? <Shield className="w-5 h-5" /> :
                   <Users className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{userCounts[type.value] || 0}</p>
                  <p className="text-xs text-gray-500">{type.label}{(userCounts[type.value] || 0) > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
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
                    className={`px-4 py-2 rounded-xl font-medium transition text-sm ${filterType === type ? 'neo-clay-pressed text-primary-700' : 'neo-clay-button text-gray-600'}`}
                  >
                    {type === 'all' ? 'Tous' : getUserTypeInfo(type).label}
                    {type !== 'all' && <span className="ml-1.5 text-xs opacity-70">({userCounts[type] || 0})</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <p>{filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}</p>
              <button onClick={loadUsers} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium">
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
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
                              {isUpdating && <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
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
                                title={isSelf ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer cet utilisateur'}
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
        </div>
      </div>

      {/* Modal: Créer un administrateur */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Créer un administrateur</h2>
                  <p className="text-xs text-gray-500">Nouveau compte avec accès complet</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  value={newAdminForm.full_name}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Jean Dupont"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email *</label>
                <input
                  type="email"
                  value={newAdminForm.email}
                  onChange={(e) => setNewAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="admin@exemple.com"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newAdminForm.password}
                    onChange={(e) => setNewAdminForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Minimum 8 caractères</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Ce compte aura un accès complet à l'administration.
                  Partagez les identifiants de façon sécurisée.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Créer le compte
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="px-6 pb-6 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 text-center">
                Pour rendre administrateur un utilisateur déjà inscrit, utilisez le menu déroulant dans le tableau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmer la suppression */}
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
