import { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Loader2, RefreshCw, Calendar, Save, CheckCircle, XCircle, CreditCard, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface UserService {
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  granted_at: string;
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  credit_balance: number;
  services: Record<string, UserService>;
  created_at: string;
}

interface ServiceDefinition {
  code: string;
  name: string;
  description: string;
}

const AVAILABLE_SERVICES: ServiceDefinition[] = [
  { code: 'cv_generation', name: 'Génération CV IA', description: 'Génération automatique de CV' },
  { code: 'cover_letter_generation', name: 'Lettre de Motivation IA', description: 'Génération de lettres personnalisées' },
  { code: 'profile_analysis', name: 'Analyse de Profil IA', description: 'Analyse complète du profil candidat' },
  { code: 'interview_coaching', name: 'Coaching Entretien IA', description: 'Préparation aux entretiens' },
  { code: 'job_matching', name: 'Matching IA', description: 'Recommandations d\'emplois personnalisées' },
  { code: 'profile_visibility_boost', name: 'Boost Visibilité', description: 'Profil Gold - Visibilité maximale' },
  { code: 'unlimited_applications', name: 'Candidatures Illimitées', description: 'Postuler sans limite pendant 30 jours' },
  { code: 'featured_application', name: 'Candidature Prioritaire', description: 'Candidature mise en avant' },
  { code: 'direct_message_recruiter', name: 'Message Direct', description: 'Contacter directement les recruteurs' },
  { code: 'access_contact_info', name: 'Accès Contacts', description: 'Voir les infos de contact des recruteurs' }
];

interface UserServicesManagementProps {
  onNavigate?: (page: string) => void;
}

export default function UserServicesManagement({ onNavigate }: UserServicesManagementProps = {}) {
  const { user, profile } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalNotes, setModalNotes] = useState('');
  const [modalExpires, setModalExpires] = useState('');

  useEffect(() => {
    if (user && profile?.user_type === 'admin') {
      loadUsers();
    }
  }, [user, profile]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterType, users]);

  const loadUsers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_all_users_with_services', {
        p_admin_id: user.id
      });

      if (error) throw error;

      if (data?.success) {
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      }
    } catch (error: any) {
      console.error('Erreur chargement utilisateurs:', error);
      alert('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(u => u.user_type === filterType);
    }

    setFilteredUsers(filtered);
  };

  const toggleService = async (userId: string, serviceCode: string, currentState: boolean) => {
    if (!user) return;

    const key = `${userId}-${serviceCode}`;
    setProcessing(key);

    try {
      const { data, error } = await supabase.rpc('toggle_user_service_access', {
        p_admin_id: user.id,
        p_user_id: userId,
        p_service_code: serviceCode,
        p_is_active: !currentState
      });

      if (error) throw error;

      if (data?.success) {
        await loadUsers();
      } else {
        alert('❌ ' + (data?.message || 'Erreur lors de la modification'));
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const openBulkModal = (userData: UserData) => {
    setSelectedUser(userData);
    setModalNotes('');
    setModalExpires('');
    setShowModal(true);
  };

  const grantAllServices = async () => {
    if (!user || !selectedUser) return;

    setProcessing('bulk-grant');
    try {
      const serviceCodes = AVAILABLE_SERVICES.map(s => s.code);
      const expiresAt = modalExpires ? new Date(modalExpires).toISOString() : null;

      const { data, error } = await supabase.rpc('grant_services_to_user', {
        p_admin_id: user.id,
        p_user_id: selectedUser.id,
        p_service_codes: serviceCodes,
        p_expires_at: expiresAt,
        p_notes: modalNotes || null
      });

      if (error) throw error;

      if (data?.success) {
        alert('✅ ' + data.message);
        setShowModal(false);
        await loadUsers();
      } else {
        alert('❌ ' + (data?.message || 'Erreur'));
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Illimité';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getUserTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      candidate: 'Candidat',
      recruiter: 'Recruteur',
      trainer: 'Formateur',
      admin: 'Admin'
    };
    return types[type] || type;
  };

  const getServiceStatus = (userData: UserData, serviceCode: string) => {
    return userData.services[serviceCode]?.is_active || false;
  };

  if (profile?.user_type !== 'admin') {
    return (
      <AdminLayout onNavigate={onNavigate || (() => {})}>
        <div className="text-center py-12">
          <p className="text-red-600">Accès réservé aux administrateurs</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onNavigate={onNavigate || (() => {})}>
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Services Utilisateurs</h1>
              <p className="text-gray-600 mt-2">
                Activer/Désactiver les services premium pour chaque utilisateur
              </p>
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4575] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par email ou nom..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
            >
              <option value="all">Tous les types</option>
              <option value="candidate">Candidats</option>
              <option value="recruiter">Recruteurs</option>
              <option value="trainer">Formateurs</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Total:</strong> {filteredUsers.length} utilisateur(s) •
              <strong className="ml-3">Services disponibles:</strong> {AVAILABLE_SERVICES.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0E2F56]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucun utilisateur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Utilisateur
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Crédits
                  </th>
                  {AVAILABLE_SERVICES.map((service) => (
                    <th
                      key={service.code}
                      className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      title={service.description}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="whitespace-nowrap">{service.name.split(' ')[0]}</span>
                        <span className="text-[10px] text-gray-400 normal-case">
                          {service.name.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((userData) => (
                  <tr key={userData.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 sticky left-0 bg-white z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0E2F56] to-[#1a4575] flex items-center justify-center text-white font-semibold">
                          {userData.full_name?.charAt(0).toUpperCase() || userData.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{userData.full_name || 'Sans nom'}</div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {getUserTypeLabel(userData.user_type)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{userData.credit_balance.toLocaleString()}</span>
                      </div>
                    </td>
                    {AVAILABLE_SERVICES.map((service) => {
                      const isActive = getServiceStatus(userData, service.code);
                      const serviceData = userData.services[service.code];
                      const key = `${userData.id}-${service.code}`;
                      const isProcessing = processing === key;

                      return (
                        <td key={service.code} className="px-3 py-4 text-center">
                          <button
                            onClick={() => toggleService(userData.id, service.code, isActive)}
                            disabled={isProcessing}
                            className={`inline-flex items-center justify-center w-12 h-12 rounded-lg transition-all ${
                              isActive
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            } disabled:opacity-50`}
                            title={serviceData?.notes || service.description}
                          >
                            {isProcessing ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isActive ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
                          </button>
                          {serviceData?.expires_at && (
                            <div className="text-[10px] text-gray-500 mt-1">
                              {formatDate(serviceData.expires_at)}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => openBulkModal(userData)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#0E2F56] rounded hover:bg-[#1a4575] transition-colors"
                      >
                        Tout Activer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Activer tous les services
            </h3>
            <p className="text-gray-600 mb-4">
              Pour: <strong>{selectedUser.full_name || selectedUser.email}</strong>
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'expiration (optionnel)
                </label>
                <input
                  type="date"
                  value={modalExpires}
                  onChange={(e) => setModalExpires(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laisser vide pour un accès illimité
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                  rows={3}
                  placeholder="Raison de l'activation, conditions, etc."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={grantAllServices}
                disabled={processing === 'bulk-grant'}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {processing === 'bulk-grant' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Activation...
                  </span>
                ) : (
                  'Activer Tout'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
