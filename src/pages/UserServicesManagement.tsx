import { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Loader2, RefreshCw, Calendar, Save, CheckCircle, XCircle, CreditCard, User, Plus, Minus, Settings } from 'lucide-react';
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
  userTypes: string[];
}

const AVAILABLE_SERVICES: ServiceDefinition[] = [
  { code: 'cv_generation', name: 'Génération CV IA', description: 'Génération automatique de CV', userTypes: ['candidate'] },
  { code: 'cover_letter_generation', name: 'Lettre de Motivation IA', description: 'Génération de lettres personnalisées', userTypes: ['candidate'] },
  { code: 'profile_analysis', name: 'Analyse de Profil IA', description: 'Analyse complète du profil candidat', userTypes: ['candidate'] },
  { code: 'interview_coaching', name: 'Coaching Entretien IA', description: 'Préparation aux entretiens', userTypes: ['candidate'] },
  { code: 'job_matching', name: 'Matching IA', description: 'Recommandations d\'emplois personnalisées', userTypes: ['candidate'] },
  { code: 'profile_visibility_boost', name: 'Boost Visibilité', description: 'Profil Gold - Visibilité maximale', userTypes: ['candidate'] },
  { code: 'unlimited_applications', name: 'Candidatures Illimitées', description: 'Postuler sans limite pendant 30 jours', userTypes: ['candidate'] },
  { code: 'featured_application', name: 'Candidature Prioritaire', description: 'Candidature mise en avant', userTypes: ['candidate'] },
  { code: 'direct_message_recruiter', name: 'Message Direct', description: 'Contacter directement les recruteurs', userTypes: ['candidate'] },
  { code: 'access_contact_info', name: 'Accès Contacts', description: 'Voir les infos de contact des candidats', userTypes: ['recruiter'] }
];

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
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [showServiceCostModal, setShowServiceCostModal] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);
  const [serviceCostAmount, setServiceCostAmount] = useState('');
  const [serviceCosts, setServiceCosts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && profile?.user_type === 'admin') {
      loadUsers();
      loadServiceCosts();
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

  const loadServiceCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('service_credit_costs')
        .select('service_code, credits_cost');

      if (error) throw error;

      const costs: Record<string, number> = {};
      data?.forEach(item => {
        costs[item.service_code] = item.credits_cost;
      });
      setServiceCosts(costs);
    } catch (error: any) {
      console.error('Erreur chargement coûts:', error);
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

  const openCreditsModal = (userData: UserData) => {
    setSelectedUser(userData);
    setCreditAmount('');
    setCreditNotes('');
    setShowCreditsModal(true);
  };

  const addCredits = async () => {
    if (!user || !selectedUser || !creditAmount) return;

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    setProcessing('add-credits');
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credit_balance')
        .eq('id', selectedUser.id)
        .single();

      if (profileError) throw profileError;

      const newBalance = (profileData.credit_balance || 0) + amount;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ credit_balance: newBalance })
        .eq('id', selectedUser.id);

      if (updateError) throw updateError;

      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.id,
          amount: amount,
          transaction_type: amount > 0 ? 'admin_grant' : 'admin_deduct',
          description: creditNotes || (amount > 0 ? 'Crédits ajoutés par admin' : 'Crédits retirés par admin'),
          balance_after: newBalance,
          admin_id: user.id
        });

      if (transactionError) throw transactionError;

      alert(`✅ ${Math.abs(amount)} crédits ${amount > 0 ? 'ajoutés' : 'retirés'} avec succès`);
      setShowCreditsModal(false);
      setCreditAmount('');
      setCreditNotes('');
      await loadUsers();
    } catch (error: any) {
      console.error('Erreur:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const openServiceCostModal = (service: ServiceDefinition) => {
    setSelectedService(service);
    setServiceCostAmount(String(serviceCosts[service.code] || 0));
    setShowServiceCostModal(true);
  };

  const saveServiceCost = async () => {
    if (!user || !selectedService || !serviceCostAmount) return;

    const cost = parseInt(serviceCostAmount);
    if (isNaN(cost) || cost < 0) {
      alert('Veuillez entrer un coût valide (≥ 0)');
      return;
    }

    setProcessing('save-service-cost');
    try {
      const { data: existing, error: checkError } = await supabase
        .from('service_credit_costs')
        .select('id')
        .eq('service_code', selectedService.code)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        const { error: updateError } = await supabase
          .from('service_credit_costs')
          .update({
            credits_cost: cost,
            updated_at: new Date().toISOString()
          })
          .eq('service_code', selectedService.code);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('service_credit_costs')
          .insert({
            service_code: selectedService.code,
            service_name: selectedService.name,
            service_description: selectedService.description,
            credits_cost: cost,
            is_active: true,
            category: 'Services Premium'
          });

        if (insertError) throw insertError;
      }

      alert(`✅ Coût du service "${selectedService.name}" défini à ${cost} crédits`);
      setShowServiceCostModal(false);
      await loadServiceCosts();
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
                      title={`${service.description} - Pour: ${service.userTypes.map(t => getUserTypeLabel(t)).join(', ')}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <button
                          onClick={() => openServiceCostModal(service)}
                          className="hover:bg-gray-100 px-2 py-1 rounded transition-colors"
                        >
                          <span className="whitespace-nowrap">{service.name.split(' ')[0]}</span>
                          <span className="text-[10px] text-gray-400 normal-case block">
                            {service.name.split(' ').slice(1).join(' ')}
                          </span>
                          <span className="text-[9px] text-gray-400 italic mt-0.5 block">
                            ({service.userTypes.map(t => t === 'candidate' ? 'C' : t === 'recruiter' ? 'R' : 'F').join(',')})
                          </span>
                          {serviceCosts[service.code] !== undefined && (
                            <span className="text-[10px] font-semibold text-yellow-600 block mt-1">
                              {serviceCosts[service.code]} ⚡
                            </span>
                          )}
                        </button>
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
                      <button
                        onClick={() => openCreditsModal(userData)}
                        className="flex items-center gap-2 text-sm hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-[#0E2F56]" />
                        <span className="font-medium">{userData.credit_balance.toLocaleString()}</span>
                        <Plus className="w-3 h-3 text-gray-400" />
                      </button>
                    </td>
                    {AVAILABLE_SERVICES.map((service) => {
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

      {showServiceCostModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Settings className="w-6 h-6 text-[#0E2F56]" />
              Configuration du coût
            </h3>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Service: <strong>{selectedService.name}</strong>
              </p>
              <p className="text-sm text-gray-500">
                {selectedService.description}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Coût actuel: <strong>{serviceCosts[selectedService.code] || 0}</strong> crédits ⚡
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nouveau coût en crédits *
                </label>
                <input
                  type="number"
                  min="0"
                  value={serviceCostAmount}
                  onChange={(e) => setServiceCostAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                  placeholder="Ex: 5000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nombre de crédits nécessaires pour utiliser ce service
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setServiceCostAmount('1000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    1 000
                  </button>
                  <button
                    onClick={() => setServiceCostAmount('5000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    5 000
                  </button>
                  <button
                    onClick={() => setServiceCostAmount('10000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    10 000
                  </button>
                  <button
                    onClick={() => setServiceCostAmount('20000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    20 000
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowServiceCostModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveServiceCost}
                disabled={processing === 'save-service-cost' || !serviceCostAmount}
                className="flex-1 px-4 py-2 bg-[#0E2F56] text-white rounded-lg hover:bg-[#1a4575] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing === 'save-service-cost' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreditsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-[#0E2F56]" />
              Gérer les crédits
            </h3>
            <p className="text-gray-600 mb-2">
              Pour: <strong>{selectedUser.full_name || selectedUser.email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Solde actuel: <strong>{selectedUser.credit_balance.toLocaleString()}</strong> crédits
              </p>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de crédits *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                    placeholder="Ex: 10000 ou -5000"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Entrez un nombre positif pour ajouter, négatif pour retirer
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setCreditAmount('10000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    +10 000
                  </button>
                  <button
                    onClick={() => setCreditAmount('50000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    +50 000
                  </button>
                  <button
                    onClick={() => setCreditAmount('100000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    +100 000
                  </button>
                  <button
                    onClick={() => setCreditAmount('150000')}
                    className="flex-1 px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                  >
                    +150 000
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optionnel)
                </label>
                <textarea
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2F56] focus:border-transparent"
                  rows={3}
                  placeholder="Raison de l'ajout/retrait, conditions, etc."
                />
              </div>
              {creditAmount && !isNaN(parseInt(creditAmount)) && (
                <div className={`border rounded-lg p-3 ${parseInt(creditAmount) > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-sm ${parseInt(creditAmount) > 0 ? 'text-green-800' : 'text-red-800'}`}>
                    Nouveau solde: <strong>{(selectedUser.credit_balance + parseInt(creditAmount)).toLocaleString()}</strong> crédits
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreditsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={addCredits}
                disabled={processing === 'add-credits' || !creditAmount}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                  creditAmount && parseInt(creditAmount) < 0
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-[#0E2F56] hover:bg-[#1a4575]'
                }`}
              >
                {processing === 'add-credits' ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traitement...
                  </span>
                ) : creditAmount && parseInt(creditAmount) < 0 ? (
                  <span className="flex items-center justify-center gap-2">
                    <Minus className="w-4 h-4" />
                    Retirer
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
