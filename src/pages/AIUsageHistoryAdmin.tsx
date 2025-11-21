import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';
import {
  BarChart3,
  Search,
  Filter,
  Download,
  AlertCircle,
  Loader,
  Calendar,
  User,
  TrendingUp,
  Activity
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UsageRecord {
  id: string;
  user_id: string;
  service_code: string;
  service_name: string;
  credits_consumed: number;
  balance_before: number;
  balance_after: number;
  metadata: any;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function AIUsageHistoryAdmin() {
  const { user } = useAuth();
  const [records, setRecords] = useState<UsageRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<UsageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadRecords();
  }, [dateRange]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedService, records]);

  const loadRecords = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('ai_service_usage_history')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `);

      if (dateRange !== 'all') {
        const daysMap = { today: 0, week: 7, month: 30 };
        const startDate = startOfDay(subDays(new Date(), daysMap[dateRange]));
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      showMessage('error', 'Erreur lors du chargement de l\'historique: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (searchTerm.trim()) {
      filtered = filtered.filter(record =>
        record.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.service_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedService !== 'all') {
      filtered = filtered.filter(record => record.service_code === selectedService);
    }

    setFilteredRecords(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Utilisateur', 'Email', 'Service', 'Crédits Consommés', 'Solde Avant', 'Solde Après'];
    const rows = filteredRecords.map(record => [
      format(new Date(record.created_at), 'dd/MM/yyyy HH:mm'),
      record.profiles?.full_name || 'N/A',
      record.profiles?.email || 'N/A',
      record.service_name,
      record.credits_consumed,
      record.balance_before,
      record.balance_after,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `historique-utilisation-ia-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getUniqueServices = () => {
    const services = [...new Set(records.map(r => ({ code: r.service_code, name: r.service_name })))];
    return services.filter((v, i, a) => a.findIndex(t => t.code === v.code) === i);
  };

  const getStats = () => {
    return {
      totalUsages: filteredRecords.length,
      totalCreditsUsed: filteredRecords.reduce((sum, r) => sum + r.credits_consumed, 0),
      uniqueUsers: new Set(filteredRecords.map(r => r.user_id)).size,
      topService: getTopService(),
    };
  };

  const getTopService = () => {
    const serviceCounts: Record<string, number> = {};
    filteredRecords.forEach(record => {
      serviceCounts[record.service_name] = (serviceCounts[record.service_name] || 0) + 1;
    });
    const topEntry = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0];
    return topEntry ? topEntry[0] : 'N/A';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
  };

  const stats = getStats();

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Historique d'Utilisation des Services IA</h1>
          </div>
          <p className="text-gray-600">
            Consultez l'historique complet d'utilisation des services Premium IA par les utilisateurs
          </p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Utilisations</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsages}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Crédits Consommés</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalCreditsUsed.toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Utilisateurs Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.uniqueUsers}</p>
              </div>
              <User className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Service Top</p>
                <p className="text-sm font-bold text-purple-600 truncate">{stats.topService}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par utilisateur ou service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Tous les services</option>
                  {getUniqueServices().map(service => (
                    <option key={service.code} value={service.code}>{service.name}</option>
                  ))}
                </select>

                <Calendar className="w-5 h-5 text-gray-400" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as any)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="today">Aujourd'hui</option>
                  <option value="week">7 derniers jours</option>
                  <option value="month">30 derniers jours</option>
                  <option value="all">Tout l'historique</option>
                </select>

                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                  title="Exporter en CSV"
                >
                  <Download className="w-4 h-4" />
                  <span>Exporter</span>
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Crédits
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Solde Avant
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Solde Après
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-3 text-gray-400">
                        <BarChart3 className="w-12 h-12" />
                        <p className="text-lg font-medium">Aucun enregistrement trouvé</p>
                        <p className="text-sm">Essayez de modifier vos filtres</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{record.profiles?.full_name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{record.profiles?.email || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{record.service_name}</div>
                          <div className="text-xs text-gray-500">{record.service_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                          -{record.credits_consumed}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {record.balance_before}
                      </td>
                      <td className="px-6 py-4 text-center text-sm font-semibold text-green-600">
                        {record.balance_after}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-2">Informations</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>L'historique enregistre chaque utilisation d'un service Premium IA</li>
                <li>Les données incluent le solde avant et après chaque transaction</li>
                <li>Utilisez les filtres pour analyser des périodes ou services spécifiques</li>
                <li>Exportez les données en CSV pour analyses avancées</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
