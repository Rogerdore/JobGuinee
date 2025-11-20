import { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Loader2, RefreshCw, Calendar, Save, CheckCircle, XCircle, CreditCard, User, Plus, Minus, DollarSign } from 'lucide-react';
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

const AVAILABLE_SERVICES: ServiceDefinition[] = [];

const getServicesForUserType = (userType: string): ServiceDefinition[] => {
  return AVAILABLE_SERVICES.filter(service => service.userTypes.includes(userType));
};

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
  const [creditsNote, setCreditsNote] = useState('');

  useEffect(() => {
    if (user && profile?.user_type === 'admin') {
      loadServices();
      loadUsers();
    }
  }, [user, profile]);

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
    } catch (error: any) {
      console.error('Erreur chargement services:', error);
    }
  };

  const loadUsers = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users_with_services', {
        p_admin_id: user.id
      });

      if (usersError) throw usersError;

      if (usersData?.success) {
        const usersWithCredits = await Promise.all(
          (usersData.users || []).map(async (u: UserData) => {
            const { data: creditsData } = await supabase
              .from('user_service_credits')
              .select('service_id, credits_balance')
              .eq('user_id', u.id);

            const creditsMap: Record<string, number> = {};
            (creditsData || []).forEach((c: any) => {
              const service = services.find(s => s.id === c.service_id);
              if (service) {
                creditsMap[service.code] = c.credits_balance;
              }
            });

            const updatedServices: Record<string, UserService> = {};
            Object.keys(u.services).forEach(code => {
              updatedServices[code] = {
                ...u.services[code],
                credits_balance: creditsMap[code] || 0
              };
            });

            return { ...u, services: updatedServices };
          })
        );

        setUsers(usersWithCredits);
        setFilteredUsers(usersWithCredits);
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

  const openCreditsModal = (userData: UserData, service: ServiceDefinition) => {
    setSelectedUser(userData);
    setSelectedService(service);
    setCreditsAmount('');
    setCreditsNote('');
    setShowCreditsModal(true);
  };

  const handleCreditsSubmit = async () => {
    if (!user || !selectedUser || !selectedService || !creditsAmount) return;

    const amount = parseInt(creditsAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setProcessing('credits-update');
    try {
      const functionName = amount > 0 ? 'add_service_credits' : 'deduct_service_credits';
      const { data, error } = await supabase.rpc(functionName, {
        p_user_id: selectedUser.id,
        p_service_id: selectedService.id,
        p_amount: Math.abs(amount),
        p_note: creditsNote || null
      });

      if (error) throw error;

      if (data?.success) {
        alert(`✅ Crédits ${amount > 0 ? 'ajoutés' : 'retirés'} avec succès. Nouveau solde: ${data.new_balance}`);
        setShowCreditsModal(false);
        await loadUsers();
      } else {
        alert('❌ Erreur lors de la modification des crédits');
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
                Gérer les crédits par service pour chaque utilisateur
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
                    Crédits Généraux
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

                      const isActive = getServiceStatus(userData, service.code);
                      const serviceData = userData.services[service.code];
                      const creditsBalance = serviceData?.credits_balance || 0;

                      return (
                        <td key={service.code} className="px-3 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                              creditsBalance > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                            }`}>
                              <DollarSign className="w-3 h-3" />
                              {creditsBalance}
                            </div>
                            <button
                              onClick={() => openCreditsModal(userData, service)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-[#0E2F56] text-white rounded hover:bg-[#1a4575] transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                              Gérer
                            </button>
                          </div>
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
              Gérer les crédits
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
                  <strong>Solde actuel:</strong> {selectedUser.services[selectedService.code]?.credits_balance || 0} crédits
                </p>
              </div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (positif pour ajouter, négatif pour retirer)
                </label>
                <input
                  type="number"
                  value={creditsAmount}
                  onChange={(e) => setCreditsAmount(e.target.value)}
                  placeholder="ex: 100 ou -50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (optionnel)
                </label>
                <textarea
                  value={creditsNote}
                  onChange={(e) => setCreditsNote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                  rows={2}
                  placeholder="Raison de l'ajout/retrait..."
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
                onClick={handleCreditsSubmit}
                disabled={processing === 'credits-update' || !creditsAmount}
                className="flex-1 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4575] transition-colors disabled:opacity-50"
              >
                {processing === 'credits-update' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    En cours...
                  </span>
                ) : (
                  'Valider'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
