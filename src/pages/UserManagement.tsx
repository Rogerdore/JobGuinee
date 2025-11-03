import { useState, useEffect } from 'react';
import { Users, Shield, UserCog, Search, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

interface UserManagementProps {
  onNavigate: (page: string) => void;
}

interface Profile {
  id: string;
  email: string;
  full_name: string;
  user_type: 'candidate' | 'recruiter' | 'admin';
  created_at: string;
}

export default function UserManagement({ onNavigate }: UserManagementProps) {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'candidate' | 'recruiter' | 'admin'>('all');
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
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

  const handleChangeUserType = async (userId: string, newType: 'candidate' | 'recruiter' | 'admin') => {
    setUpdatingUserId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ user_type: newType })
        .eq('id', userId);

      if (error) throw error;

      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, user_type: newType } : user
      ));

      showMessage('success', 'Type d\'utilisateur modifié avec succès');
    } catch (error) {
      console.error('Error updating user type:', error);
      showMessage('error', 'Erreur lors de la modification');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getUserTypeLabel = (type: string) => {
    const labels = {
      candidate: 'Candidat',
      recruiter: 'Recruteur',
      admin: 'Administrateur'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getUserTypeBadgeClass = (type: string) => {
    const classes = {
      candidate: 'bg-blue-100 text-blue-700',
      recruiter: 'bg-green-100 text-green-700',
      admin: 'bg-red-100 text-red-700'
    };
    return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-700';
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="neo-clay-card rounded-2xl p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-6">
              Vous devez être administrateur pour accéder à cette page.
            </p>
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des utilisateurs</h1>
            <p className="text-gray-600">Gérez les comptes et les rôles des utilisateurs</p>
          </div>

          {message && (
            <div className={`mb-6 neo-clay-card rounded-xl p-4 flex items-center gap-3 ${
              message.type === 'success' ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {message.text}
              </p>
              <button
                onClick={() => setMessage(null)}
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <div className="neo-clay-card rounded-2xl p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl neo-clay-input focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {['all', 'candidate', 'recruiter', 'admin'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type as any)}
                    className={`px-4 py-2 rounded-xl font-medium transition ${
                      filterType === type
                        ? 'neo-clay-pressed text-primary-700'
                        : 'neo-clay-button text-gray-600'
                    }`}
                  >
                    {type === 'all' ? 'Tous' : getUserTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <p>
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''}
              </p>
              <button
                onClick={loadUsers}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Actualiser
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-primary-600"></div>
              <p className="mt-4 text-gray-600">Chargement...</p>
            </div>
          ) : (
            <div className="neo-clay-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Utilisateur
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Type actuel
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Date d'inscription
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold">
                              {user.full_name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.full_name || 'Sans nom'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {user.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getUserTypeBadgeClass(user.user_type)}`}>
                            {getUserTypeLabel(user.user_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {new Date(user.created_at).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={user.user_type}
                              onChange={(e) => handleChangeUserType(user.id, e.target.value as any)}
                              disabled={updatingUserId === user.id}
                              className="px-3 py-2 rounded-lg neo-clay-input text-sm font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="candidate">Candidat</option>
                              <option value="recruiter">Recruteur</option>
                              <option value="admin">Administrateur</option>
                            </select>
                            {updatingUserId === user.id && (
                              <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Aucun utilisateur trouvé</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
