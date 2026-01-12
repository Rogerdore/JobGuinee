import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Share2, MousePointer2, Eye, Percent, Target, Network } from 'lucide-react';
import { jobClickTrackingService } from '../services/jobClickTrackingService';
import { socialShareAnalyticsService } from '../services/socialShareAnalyticsService';
import { supabase } from '../lib/supabase';

interface SocialStat {
  jobId: string;
  jobTitle: string;
  companyName: string;
  totalShares: number;
  totalClicks: number;
  ctr: number;
  facebookClicks: number;
  linkedinClicks: number;
  twitterClicks: number;
  whatsappClicks: number;
}

const COLORS = ['#1f2937', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminSocialAnalytics({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [stats, setStats] = useState<SocialStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('7days');
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await jobClickTrackingService.getGlobalSocialStats(100);
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques globales
  const totalShares = stats.reduce((sum, s) => sum + (s.totalShares || 0), 0);
  const totalClicks = stats.reduce((sum, s) => sum + (s.totalClicks || 0), 0);
  const globalCTR = totalShares > 0 ? ((totalClicks / totalShares) * 100).toFixed(2) : '0';

  // Données par réseau social
  const networkData = [
    {
      name: 'Facebook',
      clicks: stats.reduce((sum, s) => sum + (s.facebookClicks || 0), 0),
      color: '#1877F2'
    },
    {
      name: 'LinkedIn',
      clicks: stats.reduce((sum, s) => sum + (s.linkedinClicks || 0), 0),
      color: '#0A66C2'
    },
    {
      name: 'Twitter',
      clicks: stats.reduce((sum, s) => sum + (s.twitterClicks || 0), 0),
      color: '#000000'
    },
    {
      name: 'WhatsApp',
      clicks: stats.reduce((sum, s) => sum + (s.whatsappClicks || 0), 0),
      color: '#25D366'
    }
  ].filter(n => n.clicks > 0);

  // Offres les plus partagées
  const topSharedJobs = [...stats].sort((a, b) => (b.totalShares || 0) - (a.totalShares || 0)).slice(0, 5);

  // Offres avec meilleur CTR
  const topCTRJobs = [...stats]
    .filter(s => (s.totalShares || 0) > 0)
    .sort((a, b) => (b.ctr || 0) - (a.ctr || 0))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-900 mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Sociaux</h1>
          <p className="text-gray-600">Suivi des partages et des clics en provenance des réseaux sociaux</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={loadStats}
              className="mt-2 text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* KPIs globales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Partages Totaux</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalShares.toLocaleString()}</p>
              </div>
              <Share2 className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Clics Totaux</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalClicks.toLocaleString()}</p>
              </div>
              <Click className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">CTR Global</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{globalCTR}%</p>
              </div>
              <Percent className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Offres Actives</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.length}</p>
              </div>
              <Target className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Clics par réseau */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Network className="w-5 h-5" />
              Clics par Réseau Social
            </h2>
            {networkData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={networkData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, clicks }) => `${name}: ${clicks}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="clicks"
                  >
                    {networkData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">Pas de données disponibles</p>
            )}
          </div>

          {/* Distribution des offres */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Répartition Offres</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Avec partages</span>
                  <span className="font-semibold">{stats.filter(s => s.totalShares > 0).length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(stats.filter(s => s.totalShares > 0).length / Math.max(stats.length, 1)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">Avec clics</span>
                  <span className="font-semibold">{stats.filter(s => s.totalClicks > 0).length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(stats.filter(s => s.totalClicks > 0).length / Math.max(stats.length, 1)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableaux de détail */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Offres les plus partagées */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top 5 Offres - Partages
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-gray-600 font-semibold py-2">Offre</th>
                    <th className="text-right text-gray-600 font-semibold py-2">Partages</th>
                  </tr>
                </thead>
                <tbody>
                  {topSharedJobs.map((job, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <div className="text-gray-900 font-medium">{job.jobTitle}</div>
                        <div className="text-xs text-gray-500">{job.companyName}</div>
                      </td>
                      <td className="text-right text-gray-900 font-semibold">{job.totalShares}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Offres avec meilleur CTR */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Top 5 Offres - CTR
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-gray-600 font-semibold py-2">Offre</th>
                    <th className="text-right text-gray-600 font-semibold py-2">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {topCTRJobs.map((job, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <div className="text-gray-900 font-medium">{job.jobTitle}</div>
                        <div className="text-xs text-gray-500">{job.companyName}</div>
                      </td>
                      <td className="text-right">
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded font-semibold">
                          {job.ctr.toFixed(2)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tableau complet */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vue d'Ensemble Complète</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-gray-600 font-semibold py-2 px-2">Offre</th>
                  <th className="text-right text-gray-600 font-semibold py-2 px-2">Partages</th>
                  <th className="text-right text-gray-600 font-semibold py-2 px-2">Clics</th>
                  <th className="text-right text-gray-600 font-semibold py-2 px-2">CTR</th>
                  <th className="text-right text-gray-600 font-semibold py-2 px-2">FB</th>
                  <th className="text-right text-gray-600 font-semibold py-2 px-2">LI</th>
                  <th className="text-right text-gray-600 font-semibold py-2 px-2">TW</th>
                  <th className="text-right text-gray-600 font-semibold py-2 px-2">WA</th>
                </tr>
              </thead>
              <tbody>
                {stats.slice(0, 20).map((job, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2">
                      <div className="text-gray-900 font-medium max-w-xs truncate">{job.jobTitle}</div>
                      <div className="text-xs text-gray-500">{job.companyName}</div>
                    </td>
                    <td className="text-right text-gray-900 py-2 px-2">{job.totalShares || 0}</td>
                    <td className="text-right text-gray-900 py-2 px-2 font-semibold">{job.totalClicks || 0}</td>
                    <td className="text-right py-2 px-2">
                      <span className="inline-flex items-center bg-purple-50 text-purple-700 px-2 py-1 rounded font-semibold">
                        {job.ctr?.toFixed(2) || '0'}%
                      </span>
                    </td>
                    <td className="text-right text-gray-900 py-2 px-2">{job.facebookClicks || 0}</td>
                    <td className="text-right text-gray-900 py-2 px-2">{job.linkedinClicks || 0}</td>
                    <td className="text-right text-gray-900 py-2 px-2">{job.twitterClicks || 0}</td>
                    <td className="text-right text-gray-900 py-2 px-2">{job.whatsappClicks || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
