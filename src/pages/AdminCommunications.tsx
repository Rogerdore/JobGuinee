import { useState, useEffect } from 'react';
import { Send, Clock, CheckCircle, XCircle, Plus, Eye, Edit, Trash2, Calendar, Users, Mail, MessageSquare, Bell } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import { adminCommunicationService, AdminCommunication } from '../services/adminCommunicationService';
import { useModalContext } from '../contexts/ModalContext';

interface AdminCommunicationsProps {
  onNavigate: (page: string, param?: string) => void;
}

const typeLabels: Record<string, string> = {
  system_info: 'Information Système',
  important_notice: 'Notification Importante',
  promotion: 'Promotion',
  maintenance_alert: 'Alerte Maintenance',
  institutional: 'Message Institutionnel',
};

const statusLabels: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Brouillon', color: 'gray', icon: Edit },
  scheduled: { label: 'Programmée', color: 'blue', icon: Clock },
  sending: { label: 'En cours', color: 'yellow', icon: Send },
  completed: { label: 'Terminée', color: 'green', icon: CheckCircle },
  canceled: { label: 'Annulée', color: 'red', icon: XCircle },
  failed: { label: 'Échec', color: 'red', icon: XCircle },
};

export default function AdminCommunications({ onNavigate }: AdminCommunicationsProps) {
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext();
  const [communications, setCommunications] = useState<AdminCommunication[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedCommunication, setSelectedCommunication] = useState<AdminCommunication | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const filters = filterStatus !== 'all' ? { status: filterStatus } : undefined;
      const [commsData, statsData] = await Promise.all([
        adminCommunicationService.getCommunications(filters),
        adminCommunicationService.getStats(),
      ]);
      setCommunications(commsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCommunication) return;

    try {
      await adminCommunicationService.deleteCommunication(selectedCommunication.id);
      setShowDeleteModal(false);
      setSelectedCommunication(null);
      loadData();
    } catch (error) {
      console.error('Error deleting communication:', error);
      showError('Erreur', 'Erreur lors de la suppression. Veuillez réessayer.');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await adminCommunicationService.cancelCommunication(id);
      loadData();
    } catch (error) {
      console.error('Error canceling communication:', error);
      alert('Erreur lors de l\'annulation');
    }
  };

  const getChannelIcons = (channelsJson: any) => {
    const icons = [];
    if (channelsJson.email?.enabled) icons.push(<Mail key="email" className="w-4 h-4 text-blue-600" />);
    if (channelsJson.sms?.enabled) icons.push(<MessageSquare key="sms" className="w-4 h-4 text-green-600" />);
    if (channelsJson.whatsapp?.enabled) icons.push(<MessageSquare key="whatsapp" className="w-4 h-4 text-green-700" />);
    if (channelsJson.notification?.enabled) icons.push(<Bell key="notification" className="w-4 h-4 text-orange-600" />);
    return icons;
  };

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Communications Admin</h1>
              <p className="text-gray-600 mt-1">Gestion des communications multicanales</p>
            </div>
            <button
              onClick={() => onNavigate('admin-communication-create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#FF8C00] to-[#FF6B00] text-white rounded-xl hover:shadow-lg transition"
            >
              <Plus className="w-5 h-5" />
              Nouvelle Communication
            </button>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Send className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En cours</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.by_status.sending || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Terminées</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{stats.by_status.completed || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">30 derniers jours</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.last_30_days}</p>
                  </div>
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-gray-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="draft">Brouillons</option>
                  <option value="scheduled">Programmées</option>
                  <option value="sending">En cours</option>
                  <option value="completed">Terminées</option>
                  <option value="canceled">Annulées</option>
                  <option value="failed">Échecs</option>
                </select>

                <button
                  onClick={() => onNavigate('admin-communication-templates')}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Templates
                </button>

                <button
                  onClick={() => onNavigate('admin-communication-logs')}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Logs
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
                <p className="text-gray-500 mt-4">Chargement...</p>
              </div>
            ) : communications.length === 0 ? (
              <div className="p-12 text-center">
                <Send className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune communication trouvée</p>
                <button
                  onClick={() => onNavigate('admin-communication-create')}
                  className="mt-4 px-6 py-2 bg-[#FF8C00] text-white rounded-lg hover:bg-[#FF6B00] transition"
                >
                  Créer une communication
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Canaux</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Audience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {communications.map((comm) => {
                      const StatusIcon = statusLabels[comm.status].icon;
                      return (
                        <tr key={comm.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{comm.title}</p>
                                {comm.description && (
                                  <p className="text-xs text-gray-500 mt-1">{comm.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                              {typeLabels[comm.type]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getChannelIcons(comm.channels_json)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Users className="w-4 h-4" />
                              {comm.estimated_audience_count}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-${statusLabels[comm.status].color}-100 text-${statusLabels[comm.status].color}-700`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[comm.status].label}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {comm.scheduled_at ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(comm.scheduled_at).toLocaleDateString('fr-FR')}
                              </div>
                            ) : (
                              new Date(comm.created_at).toLocaleDateString('fr-FR')
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onNavigate('admin-communication-detail', comm.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Voir"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {comm.status === 'draft' && (
                                <button
                                  onClick={() => onNavigate('admin-communication-edit', comm.id)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                                  title="Modifier"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                              )}
                              {(comm.status === 'scheduled' || comm.status === 'draft') && (
                                <button
                                  onClick={() => handleCancel(comm.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Annuler"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedCommunication(comm);
                                  setShowDeleteModal(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
      </div>

      {showDeleteModal && selectedCommunication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer la communication "{selectedCommunication.title}" ?
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCommunication(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
