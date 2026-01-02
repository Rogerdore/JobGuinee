import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, Eye, Filter, RefreshCw, Ban, UserX, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useModalContext } from '../contexts/ModalContext';

interface SecurityLog {
  id: string;
  user_id: string;
  user_email: string;
  service_code: string;
  event_type: 'allowed' | 'blocked' | 'warning' | 'suspicious';
  reason: string;
  call_count_minute: number | null;
  call_count_hour: number | null;
  call_count_day: number | null;
  ip_address: string | null;
  user_agent: string | null;
  request_payload: any;
  created_at: string;
}

interface UserRestriction {
  id: string;
  user_id: string;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspension_until: string | null;
  custom_rate_limit_minute: number | null;
  custom_rate_limit_hour: number | null;
  custom_rate_limit_day: number | null;
  notes: string | null;
  created_at: string;
}

type EventFilter = 'all' | 'allowed' | 'blocked' | 'warning' | 'suspicious';

interface PageProps {
  onNavigate: (page: string) => void;
}

export default function AdminSecurityLogs({
  const { showSuccess, showError, showWarning, showConfirm } = useModalContext(); onNavigate }: PageProps) {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState<EventFilter>('all');
  const [selectedLog, setSelectedLog] = useState<SecurityLog | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [suspendUserId, setSuspendUserId] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState('24h');

  useEffect(() => {
    loadLogs();
  }, [eventFilter]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (eventFilter !== 'all') {
        query = query.eq('event_type', eventFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading logs:', error);
      } else {
        setLogs(data || []);
      }
    } catch (error) {
      console.error('Error in loadLogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!suspendUserId || !suspendReason) {
      showWarning('Attention', 'Veuillez saisir une raison de suspension');
      return;
    }

    try {
      let suspensionUntil = null;
      const now = new Date();

      switch (suspendDuration) {
        case '1h':
          suspensionUntil = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
          break;
        case '24h':
          suspensionUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          suspensionUntil = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          suspensionUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case 'permanent':
          suspensionUntil = null;
          break;
      }

      const { error } = await supabase
        .from('ai_user_restrictions')
        .upsert({
          user_id: suspendUserId,
          is_suspended: true,
          suspension_reason: suspendReason,
          suspension_until: suspensionUntil,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error suspending user:', error);
        showError('Erreur', 'Erreur lors de la suspension. Veuillez réessayer.');
      } else {
        alert('Utilisateur suspendu avec succès');
        setShowSuspendModal(false);
        setSuspendUserId(null);
        setSuspendReason('');
      }
    } catch (error) {
      console.error('Error in handleSuspendUser:', error);
      alert('Une erreur est survenue');
    }
  };

  const getEventBadge = (eventType: string) => {
    const badges = {
      allowed: { icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-700', label: 'Autorisé' },
      blocked: { icon: Ban, bg: 'bg-red-100', text: 'text-red-700', label: 'Bloqué' },
      warning: { icon: AlertTriangle, bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Avertissement' },
      suspicious: { icon: Shield, bg: 'bg-orange-100', text: 'text-orange-700', label: 'Suspect' }
    };

    const badge = badges[eventType as keyof typeof badges] || badges.allowed;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text} flex items-center gap-2`}>
        <Icon className="w-4 h-4" />
        {badge.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(new Date(dateString));
  };

  const stats = {
    total: logs.length,
    allowed: logs.filter(l => l.event_type === 'allowed').length,
    blocked: logs.filter(l => l.event_type === 'blocked').length,
    warnings: logs.filter(l => l.event_type === 'warning').length,
    suspicious: logs.filter(l => l.event_type === 'suspicious').length
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <button
          onClick={() => onNavigate('home')}
          className="mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Retour à l'accueil
        </button>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Logs de Sécurité IA</h1>
                  <p className="text-blue-100">Surveillance et protection contre les abus</p>
                </div>
              </div>

              <button
                onClick={loadLogs}
                disabled={loading}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                Actualiser
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Total</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 mb-1">Autorisés</div>
                <div className="text-3xl font-bold text-green-700">{stats.allowed}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-sm text-red-600 mb-1">Bloqués</div>
                <div className="text-3xl font-bold text-red-700">{stats.blocked}</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-600 mb-1">Avertissements</div>
                <div className="text-3xl font-bold text-yellow-700">{stats.warnings}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-sm text-orange-600 mb-1">Suspects</div>
                <div className="text-3xl font-bold text-orange-700">{stats.suspicious}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-gray-600" />
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: 'blocked', label: 'Bloqués' },
                  { value: 'warning', label: 'Avertissements' },
                  { value: 'suspicious', label: 'Suspects' },
                  { value: 'allowed', label: 'Autorisés' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setEventFilter(filter.value as EventFilter)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      eventFilter === filter.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucun log à afficher</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Date/Heure</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Utilisateur</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Service</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Raison</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Appels</th>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-gray-900">{log.user_email || 'N/A'}</div>
                          <div className="text-xs text-gray-500 font-mono">
                            {log.user_id?.substring(0, 8)}...
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-900">
                          {log.service_code}
                        </td>
                        <td className="px-4 py-4">
                          {getEventBadge(log.event_type)}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {log.reason}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {log.call_count_minute && (
                            <div>Min: {log.call_count_minute}</div>
                          )}
                          {log.call_count_hour && (
                            <div>H: {log.call_count_hour}</div>
                          )}
                          {log.call_count_day && (
                            <div>Jour: {log.call_count_day}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedLog(log);
                                setShowModal(true);
                              }}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition"
                              title="Voir détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {(log.event_type === 'blocked' || log.event_type === 'suspicious') && (
                              <button
                                onClick={() => {
                                  setSuspendUserId(log.user_id);
                                  setShowSuspendModal(true);
                                }}
                                className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                                title="Suspendre utilisateur"
                              >
                                <UserX className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Limites de Rate Limiting</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
              <div className="text-sm text-blue-600 mb-1">Par minute</div>
              <div className="text-3xl font-bold text-blue-700">10 appels</div>
              <div className="text-xs text-blue-600 mt-1">Limite standard</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
              <div className="text-sm text-green-600 mb-1">Par heure</div>
              <div className="text-3xl font-bold text-green-700">100 appels</div>
              <div className="text-xs text-green-600 mt-1">Limite standard</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
              <div className="text-sm text-purple-600 mb-1">Par jour</div>
              <div className="text-3xl font-bold text-purple-700">500 appels</div>
              <div className="text-xs text-purple-600 mt-1">Limite standard</div>
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
              <h2 className="text-2xl font-bold">Détails du Log</h2>
              <p className="text-blue-100 mt-1">{selectedLog.id}</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Date/Heure</div>
                  <div className="font-bold text-gray-900">{formatDate(selectedLog.created_at)}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Type d'événement</div>
                  <div>{getEventBadge(selectedLog.event_type)}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Utilisateur</div>
                  <div className="font-bold text-gray-900">{selectedLog.user_email || 'N/A'}</div>
                  <div className="text-xs text-gray-500 font-mono">{selectedLog.user_id}</div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-1">Service</div>
                  <div className="font-mono font-bold text-gray-900">{selectedLog.service_code}</div>
                </div>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-500">
                <div className="text-sm text-yellow-600 mb-1">Raison</div>
                <div className="text-yellow-900">{selectedLog.reason}</div>
              </div>

              {(selectedLog.call_count_minute || selectedLog.call_count_hour || selectedLog.call_count_day) && (
                <div className="grid grid-cols-3 gap-4">
                  {selectedLog.call_count_minute && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="text-sm text-blue-600 mb-1">Appels/minute</div>
                      <div className="text-2xl font-bold text-blue-700">{selectedLog.call_count_minute}</div>
                    </div>
                  )}
                  {selectedLog.call_count_hour && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-sm text-green-600 mb-1">Appels/heure</div>
                      <div className="text-2xl font-bold text-green-700">{selectedLog.call_count_hour}</div>
                    </div>
                  )}
                  {selectedLog.call_count_day && (
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-sm text-purple-600 mb-1">Appels/jour</div>
                      <div className="text-2xl font-bold text-purple-700">{selectedLog.call_count_day}</div>
                    </div>
                  )}
                </div>
              )}

              {selectedLog.request_payload && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">Payload de la requête</div>
                  <pre className="text-xs text-gray-900 overflow-x-auto">
                    {JSON.stringify(selectedLog.request_payload, null, 2)}
                  </pre>
                </div>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
              <h2 className="text-2xl font-bold">Suspendre l'utilisateur</h2>
              <p className="text-red-100 mt-1">Action de sécurité</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Durée de suspension
                </label>
                <select
                  value={suspendDuration}
                  onChange={(e) => setSuspendDuration(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="1h">1 heure</option>
                  <option value="24h">24 heures</option>
                  <option value="7d">7 jours</option>
                  <option value="30d">30 jours</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Raison de la suspension
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Décrivez la raison de la suspension..."
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSuspendModal(false);
                    setSuspendUserId(null);
                    setSuspendReason('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-lg transition"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSuspendUser}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg transition"
                >
                  Suspendre
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
