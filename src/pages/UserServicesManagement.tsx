import { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Loader2, RefreshCw, Calendar, Save, CheckCircle, XCircle, CreditCard, User, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';

interface UserService {
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
  granted_at: string;
  credits_balance?: number;
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
  id: string;
  code: string;
  name: string;
  description: string;
  userTypes: string[];
}


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
  const [services, setServices] = useState<ServiceDefinition[]>([]);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [creditsAmount, setCreditsAmount] = useState('');
  const [userServiceCredits, setUserServiceCredits] = useState<Record<string, Record<string, number>>>({});

  const getServicesForUserType = (userType: string): ServiceDefinition[] => {
    return services.filter(service => service.userTypes.includes(userType));
  };

  useEffect(() => {
    if (user && profile?.user_type === 'admin') {
      loadServicesAndUsers();
    }
  }, [user, profile]);

  const loadServicesAndUsers = async () => {
    await loadServices();
    await loadUsers();
  };

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterType, users]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('premium_services')
        .select('id, code, name, description, target_user_type')
        .order('display_order');

      if (error) throw error;

      const servicesList: ServiceDefinition[] = (data || []).map((s: any) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        description: s.description,
        userTypes: s.target_user_type === 'all' ? ['candidate', 'recruiter', 'trainer'] : [s.target_user_type]
      }));

      setServices(servicesList);
      return servicesList;
    } catch (error: any) {
      console.error('Erreur chargement services:', error);
      return [];
    }
  };

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
        await loadServiceCredits();
      }
    } catch (error: any) {
      console.error('Erreur chargement utilisateurs:', error);
      alert('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const loadServiceCredits = async () => {
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('premium_services')
        .select('id, code');

      if (servicesError) {
        console.error('Erreur chargement services:', servicesError);
        return;
      }

      const { data: creditsData, error: creditsError } = await supabase
        .from('user_service_credits')
        .select('user_id, service_id, credits_balance');

      if (creditsError) {
        console.error('Erreur chargement crédits:', creditsError);
        return;
      }

      const creditsMap: Record<string, Record<string, number>> = {};

      (creditsData || []).forEach((credit: any) => {
        if (!creditsMap[credit.user_id]) {
          creditsMap[credit.user_id] = {};
        }
        const service = (servicesData || []).find((s: any) => s.id === credit.service_id);
        if (service) {
          creditsMap[credit.user_id][service.code] = credit.credits_balance;
        }
      });

      console.log('Credits chargés:', Object.keys(creditsMap).length, 'utilisateurs');
      setUserServiceCredits(creditsMap);
    } catch (error: any) {
      console.error('Erreur chargement crédits:', error);
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

  const openCreditsModal = (userData: UserData, service: ServiceDefinition) => {
    setSelectedUser(userData);
    setSelectedService(service);
    setCreditsAmount('');
    setShowCreditsModal(true);
  };

  const handleAddCredits = async () => {
    if (!user || !selectedUser || !selectedService || !creditsAmount) return;

    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Veuillez entrer un montant valide (positif)');
      return;
    }

    setProcessing('add-credits');
    try {
      const { data, error } = await supabase.rpc('add_service_credits', {
        p_user_id: selectedUser.id,
        p_service_id: selectedService.id,
        p_amount: amount,
        p_note: `Ajout manuel par admin`
      });

      if (error) throw error;

      if (data?.success) {
        setShowCreditsModal(false);
        await loadServiceCredits();
        alert(`✅ ${amount} crédits ajoutés avec succès pour ${selectedService.name}. Nouveau solde: ${data.new_balance}`);
      } else {
        alert('❌ Erreur lors de l\'ajout des crédits');
      }
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const grantAllServices = async () => {
    if (!user || !selectedUser) return;

    setProcessing('bulk-grant');
    try {
      const applicableServices = getServicesForUserType(selectedUser.user_type);
      const serviceCodes = applicableServices.map(s => s.code);
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
              onClick={async () => {
                await loadUsers();
                await loadServiceCredits();
              }}
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
              <strong className="ml-3">Services disponibles:</strong> {services.length}
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
                  {services.map((service) => (
                    <th
                      key={service.code}
                      className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                      title={`${service.description} - Pour: ${service.userTypes.map(t => getUserTypeLabel(t)).join(', ')}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="whitespace-nowrap">{service.name.split(' ')[0]}</span>
                        <span className="text-[10px] text-gray-400 normal-case">
                          {service.name.split(' ').slice(1).join(' ')}
                        </span>
                        <span className="text-[9px] text-gray-400 italic mt-0.5">
                          ({service.userTypes.map(t => t === 'candidate' ? 'C' : t === 'recruiter' ? 'R' : 'F').join(',')})
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
                    {services.map((service) => {
                      const isApplicable = service.userTypes.includes(userData.user_type);

                      if (!isApplicable) {
                        return (
                          <td key={service.code} className="px-3 py-4 text-center bg-gray-50">
                            <div className="text-gray-300">—</div>
                          </td>
                        );
                      }

                      const creditsBalance = userServiceCredits[userData.id]?.[service.code] || 0;

                      return (
                        <td key={service.code} className="px-3 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-gray-400" />
                              <span className={`font-semibold text-sm ${
                                creditsBalance > 0 ? 'text-green-600' : 'text-gray-400'
                              }`}>
                                {creditsBalance}
                              </span>
                            </div>
                            <button
                              onClick={() => openCreditsModal(userData, service)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-[#0E2F56] text-white rounded hover:bg-[#1a4575] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Ajouter
                            </button>
                          </div>
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
            <p className="text-gray-600 mb-2">
              Pour: <strong>{selectedUser.full_name || selectedUser.email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>{getServicesForUserType(selectedUser.user_type).length}</strong> service(s) seront activés pour ce {getUserTypeLabel(selectedUser.user_type).toLowerCase()}
              </p>
            </div>
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

      {showCreditsModal && selectedUser && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              Ajouter des crédits
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                <strong>Utilisateur:</strong> {selectedUser.full_name || selectedUser.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Service:</strong> {selectedService.name}
              </p>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Solde actuel:</strong> {userServiceCredits[selectedUser.id]?.[selectedService.code] || 0} crédits
                </p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de crédits à ajouter
                </label>
                <input
                  type="number"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  placeholder="Ex: 100"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreditsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddCredits}
                disabled={processing === 'add-credits' || !creditsAmount}
                className="flex-1 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4575] transition-colors disabled:opacity-50"
              >
                {processing === 'add-credits' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Ajout...
                  </span>
                ) : (
                  'Ajouter'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
