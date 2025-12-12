import { useState, useEffect } from 'react';
import {
  BarChart3,
  Settings,
  FileText,
  CreditCard,
  Activity,
  FileBarChart,
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  Power,
  Plus,
  ArrowLeft
} from 'lucide-react';
import { IAConfigService, IAServiceConfig, IAServiceTemplate } from '../services/iaConfigService';
import { CreditService, PricingEngine, CreditServiceConfig } from '../services/creditService';
import { supabase } from '../lib/supabase';
import RecruiterMatchingPricingAdmin from '../components/admin/RecruiterMatchingPricingAdmin';

type TabType = 'dashboard' | 'services' | 'templates' | 'pricing' | 'stats' | 'logs' | 'matching-pricing';

interface IAStats {
  totalCalls: number;
  totalCredits: number;
  uniqueUsers: number;
  successRate: number;
  avgDuration: number;
}

interface ServiceUsage {
  service_key: string;
  service_name: string;
  total_calls: number;
  total_credits: number;
  success_count: number;
  error_count: number;
}

interface RecentLog {
  id: string;
  user_id: string;
  service_key: string;
  credits_consumed: number;
  status: string;
  duration_ms: number;
  error_message?: string;
  created_at: string;
}

interface PageProps {
  onNavigate: (page: string) => void;
}

export default function AdminIACenter({ onNavigate }: PageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [loading, setLoading] = useState(false);

  const [iaConfigs, setIaConfigs] = useState<IAServiceConfig[]>([]);
  const [allTemplates, setAllTemplates] = useState<IAServiceTemplate[]>([]);
  const [pricingData, setPricingData] = useState<CreditServiceConfig[]>([]);
  const [iaStats, setIaStats] = useState<IAStats | null>(null);
  const [serviceUsage, setServiceUsage] = useState<ServiceUsage[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard' || activeTab === 'stats') {
        await loadStats();
        await loadServiceUsage();
        await loadRecentActivity();
      }
      if (activeTab === 'services') {
        await loadConfigs();
      }
      if (activeTab === 'templates') {
        await loadAllTemplates();
      }
      if (activeTab === 'pricing') {
        await loadPricing();
      }
      if (activeTab === 'logs') {
        await loadLogs();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('credits_consumed, status, duration_ms, user_id');

      if (!error && data) {
        const totalCalls = data.length;
        const totalCredits = data.reduce((sum, item) => sum + (item.credits_consumed || 0), 0);
        const uniqueUsers = new Set(data.map(item => item.user_id)).size;
        const successCount = data.filter(item => item.status === 'success').length;
        const successRate = totalCalls > 0 ? (successCount / totalCalls) * 100 : 0;
        const durations = data.filter(item => item.duration_ms > 0).map(item => item.duration_ms);
        const avgDuration = durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : 0;

        setIaStats({
          totalCalls,
          totalCredits,
          uniqueUsers,
          successRate,
          avgDuration
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadServiceUsage = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('service_key, credits_consumed, status');

      if (!error && data) {
        const configs = await IAConfigService.getAllConfigs();
        const pricingData = await PricingEngine.fetchAllPricing();

        const usageMap = new Map<string, ServiceUsage>();

        data.forEach(item => {
          const existing = usageMap.get(item.service_key) || {
            service_key: item.service_key,
            service_name: '',
            total_calls: 0,
            total_credits: 0,
            success_count: 0,
            error_count: 0
          };

          existing.total_calls++;
          existing.total_credits += item.credits_consumed || 0;
          if (item.status === 'success') existing.success_count++;
          if (item.status === 'error') existing.error_count++;

          usageMap.set(item.service_key, existing);
        });

        const usage: ServiceUsage[] = Array.from(usageMap.values()).map(item => {
          const config = configs.find(c => c.service_code === item.service_key);
          const pricing = pricingData.find(p => p.service_code === item.service_key);
          return {
            ...item,
            service_name: config?.service_name || pricing?.service_name || item.service_key
          };
        });

        usage.sort((a, b) => b.total_calls - a.total_calls);
        setServiceUsage(usage);
      }
    } catch (error) {
      console.error('Error loading service usage:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentLogs(data);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadConfigs = async () => {
    const configs = await IAConfigService.getAllConfigs();
    setIaConfigs(configs);
  };

  const loadAllTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('ia_service_templates')
        .select('*')
        .order('service_code', { ascending: true })
        .order('display_order', { ascending: true });

      if (!error && data) {
        setAllTemplates(data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadPricing = async () => {
    const pricing = await PricingEngine.fetchAllPricing();
    setPricingData(pricing);
  };

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_service_usage_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setRecentLogs(data);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vue d'ensemble IA</h2>
        <p className="text-gray-600">Statistiques globales et activité récente</p>
      </div>

      {iaStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatsCard
            icon={<Activity className="w-6 h-6 text-blue-600" />}
            label="Appels IA Total"
            value={iaStats.totalCalls.toLocaleString()}
            bgColor="bg-blue-50"
          />
          <StatsCard
            icon={<CreditCard className="w-6 h-6 text-purple-600" />}
            label="Crédits Consommés"
            value={iaStats.totalCredits.toLocaleString()}
            bgColor="bg-purple-50"
          />
          <StatsCard
            icon={<Users className="w-6 h-6 text-green-600" />}
            label="Utilisateurs Uniques"
            value={iaStats.uniqueUsers.toLocaleString()}
            bgColor="bg-green-50"
          />
          <StatsCard
            icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
            label="Taux de Succès"
            value={`${iaStats.successRate.toFixed(1)}%`}
            bgColor="bg-orange-50"
          />
          <StatsCard
            icon={<Clock className="w-6 h-6 text-indigo-600" />}
            label="Temps Moyen"
            value={`${(iaStats.avgDuration / 1000).toFixed(1)}s`}
            bgColor="bg-indigo-50"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Services les Plus Utilisés
          </h3>
          <div className="space-y-3">
            {serviceUsage.slice(0, 5).map((service, idx) => (
              <div key={service.service_key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{service.service_name}</p>
                    <p className="text-sm text-gray-500">{service.service_key}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{service.total_calls} appels</p>
                  <p className="text-sm text-gray-500">{service.total_credits} crédits</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Activité Récente
          </h3>
          <div className="space-y-2">
            {recentLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 flex-1">
                  {log.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-700 truncate">{log.service_key}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span>{log.credits_consumed} cr.</span>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services IA</h2>
          <p className="text-gray-600">Gérer les configurations et paramètres IA</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" />
          Nouveau Service
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modèle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paramètres</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {iaConfigs.map((config) => (
              <tr key={config.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{config.service_name}</p>
                    <p className="text-sm text-gray-500">{config.service_code}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {IAConfigService.getCategoryLabel(config.category)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{config.model}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  T: {config.temperature} | Tokens: {config.max_tokens}
                </td>
                <td className="px-6 py-4">
                  {config.is_active ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Actif
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-gray-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Inactif
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <Power className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates IA</h2>
          <p className="text-gray-600">Gérer les templates pour tous les services</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
          <Plus className="w-4 h-4" />
          Nouveau Template
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(
          allTemplates.reduce((acc, template) => {
            if (!acc[template.service_code]) acc[template.service_code] = [];
            acc[template.service_code].push(template);
            return acc;
          }, {} as Record<string, IAServiceTemplate[]>)
        ).map(([serviceCode, templates]) => (
          <div key={serviceCode} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              {templates[0]?.service_code}
              <span className="ml-auto text-sm font-normal text-gray-500">
                {templates.length} template{templates.length > 1 ? 's' : ''}
              </span>
            </h3>
            <div className="space-y-2">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    {template.is_default && (
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{template.template_name}</p>
                      <p className="text-xs text-gray-500">
                        {template.format.toUpperCase()}
                        {!template.is_active && ' - Inactif'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPricing = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Tarification & Crédits IA</h2>
        <p className="text-gray-600">Gérer les coûts en crédits pour chaque service</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût Base</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coût Effectif</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promotion</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pricingData.map((service) => (
              <tr key={service.service_code} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{service.service_name}</p>
                    <p className="text-sm text-gray-500">{service.service_code}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {service.category}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  {service.credits_cost} crédits
                </td>
                <td className="px-6 py-4 font-semibold text-blue-600">
                  {service.effective_cost || service.credits_cost} crédits
                </td>
                <td className="px-6 py-4">
                  {service.promotion_active ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                      -{service.discount_percent}%
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Modifier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Statistiques Détaillées</h2>
        <p className="text-gray-600">Analyse approfondie de l'utilisation des services IA</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage par Service</h3>
        <div className="space-y-4">
          {serviceUsage.map((service) => {
            const successRate = service.total_calls > 0
              ? ((service.success_count / service.total_calls) * 100).toFixed(1)
              : '0.0';

            return (
              <div key={service.service_key} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{service.service_name}</h4>
                  <span className="text-sm text-gray-500">{service.service_key}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Appels Total</p>
                    <p className="text-xl font-bold text-gray-900">{service.total_calls}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Crédits Consommés</p>
                    <p className="text-xl font-bold text-purple-600">{service.total_credits}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Taux de Succès</p>
                    <p className="text-xl font-bold text-green-600">{successRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Erreurs</p>
                    <p className="text-xl font-bold text-red-600">{service.error_count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Logs IA</h2>
        <p className="text-gray-600">Historique complet des appels IA</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Heure</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Crédits</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durée</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {recentLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{log.service_key}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono truncate max-w-[200px]">
                  {log.user_id.slice(0, 8)}...
                </td>
                <td className="px-6 py-4 text-sm font-medium text-purple-600">
                  {log.credits_consumed}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(2)}s` : '—'}
                </td>
                <td className="px-6 py-4">
                  {log.status === 'success' ? (
                    <span className="flex items-center gap-1 text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      Succès
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      Erreur
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => onNavigate('home')}
            className="mb-4 flex items-center gap-2 text-white hover:text-blue-100 font-semibold transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Centre d'Administration IA</h1>
          </div>
          <p className="text-blue-100">Gestion complète de l'écosystème Intelligence Artificielle</p>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'services'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5" />
              Services IA
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileText className="w-5 h-5" />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'pricing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              Tarification
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FileBarChart className="w-5 h-5" />
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Activity className="w-5 h-5" />
              Logs
            </button>
            <button
              onClick={() => setActiveTab('matching-pricing')}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
                activeTab === 'matching-pricing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              Matching IA
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'services' && renderServices()}
            {activeTab === 'templates' && renderTemplates()}
            {activeTab === 'pricing' && renderPricing()}
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'logs' && renderLogs()}
            {activeTab === 'matching-pricing' && <RecruiterMatchingPricingAdmin />}
          </>
        )}
      </div>
    </div>
  );
}

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  bgColor: string;
}

function StatsCard({ icon, label, value, bgColor }: StatsCardProps) {
  return (
    <div className={`${bgColor} rounded-xl p-6 border border-gray-200`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="p-3 bg-white rounded-lg shadow-sm">
          {icon}
        </div>
      </div>
    </div>
  );
}
