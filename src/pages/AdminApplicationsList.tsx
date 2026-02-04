import { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Calendar, Users, Briefcase,
  TrendingUp, CheckCircle2, XCircle, Clock, Eye, FileText,
  Mail, Phone, Award, AlertCircle, ChevronDown, ChevronUp,
  RefreshCw, ArrowUpDown, Star, Zap, BarChart3, User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { publicProfileTokenService } from '../services/publicProfileTokenService';

interface Application {
  id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
  ai_match_score: number | null;
  ai_score: number | null;
  ai_category: string | null;
  workflow_stage: string | null;
  cv_url: string | null;
  recruiter_notes: string | null;
  ai_match_explanation: string | null;
  is_shortlisted: boolean | null;
  shortlisted_at: string | null;
  rejected_reason: string | null;
  rejected_at: string | null;
  application_reference: string | null;
  ai_matching_score: number | null;
  job: {
    title: string;
    company_name: string;
    location: string;
  };
  candidate_profile: {
    full_name: string;
    email: string;
    phone: string | null;
    skills: string[] | null;
    experience_years: number | null;
  };
}

type SortField = 'applied_at' | 'ai_match_score' | 'status' | 'job_title' | 'candidate_name';
type SortOrder = 'asc' | 'desc';

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'il y a moins d\'une minute';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(months / 12);
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
};

export default function AdminApplicationsList() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('applied_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    rejected: 0,
    avgScore: 0
  });

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterAndSortApplications();
  }, [applications, searchTerm, statusFilter, periodFilter, scoreFilter, sortField, sortOrder]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(title, company_name, location),
          candidate_profile:candidate_profiles(full_name, email, phone, skills, experience_years)
        `)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      setApplications(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (apps: Application[]) => {
    const total = apps.length;
    const pending = apps.filter(a => a.status === 'pending').length;
    const shortlisted = apps.filter(a => a.is_shortlisted).length;
    const rejected = apps.filter(a => a.status === 'rejected').length;
    const scores = apps.filter(a => a.ai_match_score).map(a => a.ai_match_score!);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    setStats({ total, pending, shortlisted, rejected, avgScore });
  };

  const handleViewProfile = async (candidateId: string, applicationId: string) => {
    try {
      const result = await publicProfileTokenService.generateToken(candidateId, applicationId);

      if (result.success && result.token) {
        window.location.href = `/profile/${result.token}`;
      } else {
        alert('Erreur lors de la génération du lien de profil');
      }
    } catch (error) {
      console.error('Error generating profile token:', error);
      alert('Erreur lors de la génération du lien de profil');
    }
  };

  const filterAndSortApplications = () => {
    let filtered = [...applications];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app =>
        app.candidate_profile?.full_name?.toLowerCase().includes(term) ||
        app.candidate_profile?.email?.toLowerCase().includes(term) ||
        app.job?.title?.toLowerCase().includes(term) ||
        app.job?.company_name?.toLowerCase().includes(term) ||
        app.application_reference?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'shortlisted') {
        filtered = filtered.filter(app => app.is_shortlisted);
      } else {
        filtered = filtered.filter(app => app.status === statusFilter);
      }
    }

    if (periodFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (periodFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(app => new Date(app.applied_at) >= filterDate);
    }

    if (scoreFilter !== 'all') {
      filtered = filtered.filter(app => {
        if (!app.ai_match_score) return false;
        switch (scoreFilter) {
          case 'excellent':
            return app.ai_match_score >= 80;
          case 'good':
            return app.ai_match_score >= 60 && app.ai_match_score < 80;
          case 'average':
            return app.ai_match_score >= 40 && app.ai_match_score < 60;
          case 'low':
            return app.ai_match_score < 40;
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'applied_at':
          comparison = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
          break;
        case 'ai_match_score':
          comparison = (a.ai_match_score || 0) - (b.ai_match_score || 0);
          break;
        case 'status':
          comparison = (a.status || '').localeCompare(b.status || '');
          break;
        case 'job_title':
          comparison = (a.job?.title || '').localeCompare(b.job?.title || '');
          break;
        case 'candidate_name':
          comparison = (a.candidate_profile?.full_name || '').localeCompare(b.candidate_profile?.full_name || '');
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredApplications(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (status: string, isShortlisted: boolean) => {
    if (isShortlisted) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 flex items-center gap-1">
          <Star className="w-3 h-3 fill-current" />
          Shortlisté
        </span>
      );
    }

    const statusConfig: Record<string, { bg: string; text: string; icon: any; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: 'En attente' },
      reviewed: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Eye, label: 'Examiné' },
      interview: { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: Users, label: 'Entretien' },
      accepted: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Accepté' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejeté' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getScoreBadge = (score: number | null) => {
    if (!score) return <span className="text-gray-400 text-sm">N/A</span>;

    let colorClass = '';
    if (score >= 80) colorClass = 'text-green-600 bg-green-50';
    else if (score >= 60) colorClass = 'text-blue-600 bg-blue-50';
    else if (score >= 40) colorClass = 'text-yellow-600 bg-yellow-50';
    else colorClass = 'text-red-600 bg-red-50';

    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${colorClass}`}>
        <Award className="w-4 h-4" />
        <span className="font-bold text-sm">{score}%</span>
      </div>
    );
  };

  const exportToCSV = () => {
    const headers = ['Référence', 'Candidat', 'Email', 'Poste', 'Entreprise', 'Statut', 'Score IA', 'Date'];
    const rows = filteredApplications.map(app => [
      app.application_reference || app.id.slice(0, 8),
      app.candidate_profile?.full_name || 'N/A',
      app.candidate_profile?.email || 'N/A',
      app.job?.title || 'N/A',
      app.job?.company_name || 'N/A',
      app.status,
      app.ai_match_score || 'N/A',
      new Date(app.applied_at).toLocaleDateString('fr-FR')
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidatures-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors"
    >
      {label}
      {sortField === field && (
        sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
      )}
      {sortField !== field && <ArrowUpDown className="w-4 h-4 opacity-30" />}
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement des candidatures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Toutes les Candidatures</h1>
            <p className="text-blue-100">Gestion complète et intelligente des candidatures internes</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <Users className="w-12 h-12" />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Total</span>
              <Briefcase className="w-5 h-5 text-blue-200" />
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">En attente</span>
              <Clock className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-3xl font-bold">{stats.pending}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Shortlistés</span>
              <Star className="w-5 h-5 text-purple-300" />
            </div>
            <p className="text-3xl font-bold">{stats.shortlisted}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Rejetés</span>
              <XCircle className="w-5 h-5 text-red-300" />
            </div>
            <p className="text-3xl font-bold">{stats.rejected}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100 text-sm">Score moyen</span>
              <Award className="w-5 h-5 text-green-300" />
            </div>
            <p className="text-3xl font-bold">{stats.avgScore}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par candidat, email, poste, entreprise ou référence..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filtres
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>

            <button
              onClick={loadApplications}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="reviewed">Examiné</option>
                  <option value="shortlisted">Shortlisté</option>
                  <option value="interview">Entretien</option>
                  <option value="accepted">Accepté</option>
                  <option value="rejected">Rejeté</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Période</label>
                <select
                  value={periodFilter}
                  onChange={(e) => setPeriodFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Toutes les périodes</option>
                  <option value="today">Aujourd'hui</option>
                  <option value="week">Cette semaine</option>
                  <option value="month">Ce mois</option>
                  <option value="quarter">Ce trimestre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Score IA</label>
                <select
                  value={scoreFilter}
                  onChange={(e) => setScoreFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tous les scores</option>
                  <option value="excellent">Excellent (80%+)</option>
                  <option value="good">Bon (60-79%)</option>
                  <option value="average">Moyen (40-59%)</option>
                  <option value="low">Faible (&lt;40%)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <SortButton field="candidate_name" label="Candidat" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <SortButton field="job_title" label="Poste" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <SortButton field="status" label="Statut" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <SortButton field="ai_match_score" label="Score IA" />
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  <SortButton field="applied_at" label="Date" />
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredApplications.map((app) => (
                <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {app.candidate_profile?.full_name?.charAt(0).toUpperCase() || 'C'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{app.candidate_profile?.full_name || 'N/A'}</p>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {app.candidate_profile?.email || 'N/A'}
                          </span>
                          {app.candidate_profile?.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {app.candidate_profile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{app.job?.title || 'N/A'}</p>
                    <p className="text-sm text-gray-500">{app.job?.company_name || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(app.status, app.is_shortlisted || false)}
                  </td>
                  <td className="px-6 py-4">
                    {getScoreBadge(app.ai_match_score)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTimeAgo(new Date(app.applied_at))}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(app.applied_at).toLocaleDateString('fr-FR')}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedApplication(app)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Détails
                      </button>
                      <button
                        onClick={() => handleViewProfile(app.candidate_id, app.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm"
                      >
                        <User className="w-4 h-4" />
                        Profil
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredApplications.length === 0 && (
            <div className="text-center py-16">
              <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune candidature trouvée</p>
              <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos filtres de recherche</p>
            </div>
          )}
        </div>
      </div>

      {selectedApplication && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Détails de la candidature</h2>
                  <p className="text-blue-100 mt-1">
                    Réf: {selectedApplication.application_reference || selectedApplication.id.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Informations du candidat
                    </h3>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      <p><span className="font-medium">Nom:</span> {selectedApplication.candidate_profile?.full_name}</p>
                      <p><span className="font-medium">Email:</span> {selectedApplication.candidate_profile?.email}</p>
                      {selectedApplication.candidate_profile?.phone && (
                        <p><span className="font-medium">Téléphone:</span> {selectedApplication.candidate_profile.phone}</p>
                      )}
                      {selectedApplication.candidate_profile?.experience_years && (
                        <p><span className="font-medium">Expérience:</span> {selectedApplication.candidate_profile.experience_years} ans</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-600" />
                      Poste
                    </h3>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      <p><span className="font-medium">Titre:</span> {selectedApplication.job?.title}</p>
                      <p><span className="font-medium">Entreprise:</span> {selectedApplication.job?.company_name}</p>
                      <p><span className="font-medium">Localisation:</span> {selectedApplication.job?.location}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Analyse IA
                    </h3>
                    <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Score de correspondance:</span>
                        {getScoreBadge(selectedApplication.ai_match_score)}
                      </div>
                      {selectedApplication.ai_category && (
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Catégorie:</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                            {selectedApplication.ai_category}
                          </span>
                        </div>
                      )}
                      {selectedApplication.ai_match_explanation && (
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700">{selectedApplication.ai_match_explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Statut et dates
                    </h3>
                    <div className="space-y-2 bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Statut:</span>
                        {getStatusBadge(selectedApplication.status, selectedApplication.is_shortlisted || false)}
                      </div>
                      <p><span className="font-medium">Candidaté le:</span> {new Date(selectedApplication.applied_at).toLocaleString('fr-FR')}</p>
                      <p><span className="font-medium">Mis à jour le:</span> {new Date(selectedApplication.updated_at).toLocaleString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {selectedApplication.cover_letter && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Lettre de motivation
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                  </div>
                </div>
              )}

              {selectedApplication.recruiter_notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Notes du recruteur
                  </h3>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-gray-700">{selectedApplication.recruiter_notes}</p>
                  </div>
                </div>
              )}

              {selectedApplication.candidate_profile?.skills && selectedApplication.candidate_profile.skills.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" />
                    Compétences
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedApplication.candidate_profile.skills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewProfile(selectedApplication.candidate_id, selectedApplication.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  Voir le profil complet
                </button>
                {selectedApplication.cv_url && (
                  <button className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Download className="w-5 h-5" />
                    Télécharger CV
                  </button>
                )}
                <button
                  onClick={() => setSelectedApplication(null)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
