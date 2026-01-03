import { useState, useEffect } from 'react';
import { Activity, Clock, User, FileText, TrendingUp, Calendar } from 'lucide-react';
import { adminCommunicationService, CommunicationLog } from '../services/adminCommunicationService';

interface AdminCommunicationLogsProps {
  onNavigate: (page: string, param?: string) => void;
}

const actionLabels: Record<string, { label: string; color: string }> = {
  create: { label: 'Création', color: 'blue' },
  update: { label: 'Modification', color: 'yellow' },
  send: { label: 'Envoi', color: 'green' },
  cancel: { label: 'Annulation', color: 'red' },
  schedule: { label: 'Programmation', color: 'blue' },
  complete: { label: 'Terminée', color: 'green' },
  fail: { label: 'Échec', color: 'red' },
};

export default function AdminCommunicationLogs({ onNavigate }: AdminCommunicationLogsProps) {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('all');
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    loadData();
  }, [limit]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, statsData] = await Promise.all([
        adminCommunicationService.getLogs({ limit }),
        adminCommunicationService.getStats(),
      ]);
      setLogs(logsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = filterAction === 'all'
    ? logs
    : logs.filter((log) => log.action === filterAction);

  const getActionStats = () => {
    const actionCounts: Record<string, number> = {};
    logs.forEach((log) => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });
    return actionCounts;
  };

  const actionStats = getActionStats();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Logs & Statistiques</h1>
              <p className="text-gray-600 mt-1">Suivi des actions et activités</p>
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Communications</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
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
                    <TrendingUp className="w-6 h-6 text-green-600" />
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

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Actions totales</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{logs.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions par type</h3>
              <div className="space-y-3">
                {Object.entries(actionStats).map(([action, count]) => {
                  const { label, color } = actionLabels[action] || { label: action, color: 'gray' };
                  const percentage = Math.round((count / logs.length) * 100);
                  return (
                    <div key={action}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{label}</span>
                        <span className="text-sm font-semibold text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-${color}-500 h-2 rounded-full transition-all`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 lg:col-span-2">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Statistiques par statut</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats && Object.entries(stats.by_status).map(([status, count]) => (
                  <div key={status} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 capitalize">{status}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{count as number}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                >
                  <option value="all">Toutes les actions</option>
                  <option value="create">Créations</option>
                  <option value="update">Modifications</option>
                  <option value="send">Envois</option>
                  <option value="cancel">Annulations</option>
                  <option value="schedule">Programmations</option>
                  <option value="complete">Terminées</option>
                  <option value="fail">Échecs</option>
                </select>

                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00]"
                >
                  <option value={50}>50 derniers</option>
                  <option value={100}>100 derniers</option>
                  <option value={200}>200 derniers</option>
                  <option value={500}>500 derniers</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF8C00] mx-auto"></div>
                <p className="text-gray-500 mt-4">Chargement...</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun log trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Administrateur</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log) => {
                      const { label, color } = actionLabels[log.action] || { label: log.action, color: 'gray' };
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {new Date(log.created_at).toLocaleString('fr-FR', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-700`}>
                              {label}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {log.details?.title && (
                                <p className="font-medium">{log.details.title}</p>
                              )}
                              {log.details?.type && (
                                <p className="text-xs text-gray-500 capitalize">{log.details.type}</p>
                              )}
                              {log.details?.estimated_audience && (
                                <p className="text-xs text-gray-500">
                                  {log.details.estimated_audience} utilisateurs ciblés
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <div className="text-sm">
                                <p className="text-gray-900">{log.admin_email || 'Admin'}</p>
                              </div>
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
    </>
  );
}
