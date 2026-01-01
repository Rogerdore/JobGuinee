import { useState, useEffect } from 'react';
import {
  Briefcase, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle,
  Clock, Archive, RefreshCw, Calendar, MapPin, Building2, Mail, User,
  Zap, Star, AlertTriangle, Settings, BarChart3, TrendingUp, Download,
  X, Save, Plus, Minus
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  sector: string;
  salary_range: string;
  department: string;
  category: string;
  status: 'draft' | 'pending' | 'published' | 'rejected' | 'closed';
  submitted_at: string;
  published_at: string | null;
  expires_at: string | null;
  validity_days: number | null;
  user_id: string;
  company_name?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  is_urgent?: boolean;
  is_featured?: boolean;
  views_count?: number;
  applications_count?: number;
}

type StatusFilter = 'all' | 'published' | 'pending' | 'closed' | 'rejected' | 'draft';
type TabType = 'list' | 'stats' | 'badges';

interface JobStats {
  total: number;
  published: number;
  pending: number;
  closed: number;
  rejected: number;
  urgent: number;
  featured: number;
  expiring_soon: number;
}

export default function AdminJobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [stats, setStats] = useState<JobStats | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  useEffect(() => {
    console.log('🚀 AdminJobList montée - Premier chargement');
    loadJobs();
    loadStats();
  }, []);

  const statusLabels = {
    all: 'Tous les statuts',
    published: 'Publiées',
    pending: 'En attente',
    closed: 'Fermées',
    rejected: 'Rejetées',
    draft: 'Brouillons'
  };

  const statusColors = {
    published: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-100 text-gray-800',
    rejected: 'bg-red-100 text-red-800',
    draft: 'bg-blue-100 text-blue-800'
  };

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadStats = async () => {
    try {
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*');

      if (jobsData) {
        const now = new Date();
        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        setStats({
          total: jobsData.length,
          published: jobsData.filter(j => j.status === 'published').length,
          pending: jobsData.filter(j => j.status === 'pending').length,
          closed: jobsData.filter(j => j.status === 'closed').length,
          rejected: jobsData.filter(j => j.status === 'rejected').length,
          urgent: jobsData.filter(j => j.is_urgent).length,
          featured: jobsData.filter(j => j.is_featured).length,
          expiring_soon: jobsData.filter(j =>
            j.expires_at && new Date(j.expires_at) < weekFromNow && new Date(j.expires_at) > now
          ).length
        });
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);
      console.log('🔍 [AdminJobList] Début chargement des offres');

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('❌ [AdminJobList] Pas d\'utilisateur connecté');
        setJobs([]);
        setLoading(false);
        return;
      }

      let query = supabase
        .from('jobs')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data: jobsData, error } = await query;

      if (error) {
        console.error('❌ [AdminJobList] Erreur SQL:', error);
        throw error;
      }

      if (!jobsData || jobsData.length === 0) {
        console.warn('⚠️ [AdminJobList] Aucune offre retournée');
        setJobs([]);
        setLoading(false);
        return;
      }

      const jobsWithRecruiter = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', job.user_id)
            .single();

          return {
            ...job,
            company_name: job.department || 'N/A',
            recruiter_name: profileData?.full_name || 'Inconnu',
            recruiter_email: profileData?.email || 'N/A'
          };
        })
      );

      setJobs(jobsWithRecruiter);
    } catch (error: any) {
      console.error('❌ [AdminJobList] Erreur chargement offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBadge = async (jobId: string, badgeType: 'urgent' | 'featured') => {
    setProcessing(jobId);
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;

      const newValue = badgeType === 'urgent' ? !job.is_urgent : !job.is_featured;

      const { error } = await supabase
        .from('jobs')
        .update({
          [badgeType === 'urgent' ? 'is_urgent' : 'is_featured']: newValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      await loadJobs();
      await loadStats();
      alert(`Badge ${badgeType === 'urgent' ? 'URGENT' : 'À LA UNE'} ${newValue ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du badge');
    } finally {
      setProcessing(null);
    }
  };

  const handleExtendValidity = async (jobId: string) => {
    const days = prompt('Prolonger de combien de jours ?', '30');
    if (!days || isNaN(parseInt(days))) return;

    setProcessing(jobId);
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job || !job.expires_at) return;

      const currentExpiry = new Date(job.expires_at);
      const newExpiry = new Date(currentExpiry.getTime() + parseInt(days) * 24 * 60 * 60 * 1000);

      const { error } = await supabase
        .from('jobs')
        .update({
          expires_at: newExpiry.toISOString(),
          validity_days: (job.validity_days || 0) + parseInt(days),
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      await loadJobs();
      await loadStats();
      alert(`Validité prolongée de ${days} jours`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la prolongation');
    } finally {
      setProcessing(null);
    }
  };

  const handleApprove = async (jobId: string) => {
    const days = prompt('Approuver pour combien de jours ?', '30');
    if (!days || isNaN(parseInt(days))) return;

    setProcessing(jobId);
    try {
      const { error } = await supabase.rpc('approve_job_with_validity', {
        p_job_id: jobId,
        p_validity_days: parseInt(days),
        p_notes: 'Approuvé via gestion complète'
      });

      if (error) throw error;

      await loadJobs();
      await loadStats();
      alert('Offre approuvée avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const handleRepublish = async (jobId: string) => {
    const days = prompt('Republier pour combien de jours ?', '30');
    if (!days || isNaN(parseInt(days))) return;

    setProcessing(jobId);
    try {
      const { error } = await supabase.rpc('republish_job', {
        p_job_id: jobId,
        p_validity_days: parseInt(days),
        p_notes: 'Republiée via gestion complète'
      });

      if (error) throw error;

      await loadJobs();
      await loadStats();
      alert('Offre republiée avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la republication');
    } finally {
      setProcessing(null);
    }
  };

  const handleClose = async (jobId: string) => {
    if (!confirm('Fermer cette offre ?')) return;

    setProcessing(jobId);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed', updated_at: new Date().toISOString() })
        .eq('id', jobId);

      if (error) throw error;

      await loadJobs();
      await loadStats();
      alert('Offre fermée avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la fermeture');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (jobId: string) => {
    const reason = prompt('Raison du rejet ?');
    if (!reason) return;

    setProcessing(jobId);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);

      if (error) throw error;

      await loadJobs();
      await loadStats();
      alert('Offre rejetée avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('⚠️ ATTENTION: Supprimer définitivement cette offre ?')) return;

    setProcessing(jobId);
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      await loadJobs();
      await loadStats();
      alert('Offre supprimée avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingJob) return;

    setProcessing(editingJob.id);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          title: editingJob.title,
          description: editingJob.description,
          location: editingJob.location,
          contract_type: editingJob.contract_type,
          sector: editingJob.sector,
          salary_range: editingJob.salary_range,
          validity_days: editingJob.validity_days,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingJob.id);

      if (error) throw error;

      await loadJobs();
      setShowEditModal(false);
      setEditingJob(null);
      alert('Offre mise à jour avec succès!');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setProcessing(null);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.recruiter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.sector?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionButtons = (job: Job) => {
    const isProcessing = processing === job.id;

    return (
      <div className="flex flex-wrap gap-2">
        {/* Boutons de badge */}
        <button
          onClick={() => handleToggleBadge(job.id, 'urgent')}
          disabled={isProcessing}
          className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
            job.is_urgent
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          <AlertTriangle className="w-4 h-4" />
          {job.is_urgent ? 'URGENT ON' : 'URGENT OFF'}
        </button>

        <button
          onClick={() => handleToggleBadge(job.id, 'featured')}
          disabled={isProcessing}
          className={`px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-1 ${
            job.is_featured
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          } disabled:opacity-50`}
        >
          <Star className="w-4 h-4" />
          {job.is_featured ? 'UNE ON' : 'UNE OFF'}
        </button>

        {/* Actions selon statut */}
        {job.status === 'pending' && (
          <>
            <button
              onClick={() => handleApprove(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              Approuver
            </button>
            <button
              onClick={() => handleReject(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
              <XCircle className="w-4 h-4" />
              Rejeter
            </button>
          </>
        )}

        {job.status === 'published' && (
          <>
            <button
              onClick={() => handleExtendValidity(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Prolonger
            </button>
            <button
              onClick={() => handleRepublish(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Republier
            </button>
            <button
              onClick={() => handleClose(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Archive className="w-4 h-4" />
              Fermer
            </button>
          </>
        )}

        {(job.status === 'closed' || job.status === 'rejected') && (
          <>
            <button
              onClick={() => handleRepublish(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Réactiver
            </button>
            <button
              onClick={() => handleDelete(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          </>
        )}

        {/* Boutons communs */}
        <button
          onClick={() => {
            setEditingJob(job);
            setShowEditModal(true);
          }}
          disabled={isProcessing}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 flex items-center gap-1"
        >
          <Edit className="w-4 h-4" />
          Modifier
        </button>

        <button
          onClick={() => {
            setSelectedJob(job);
            setShowModal(true);
          }}
          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          Voir
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Gestion Complète des Offres d'Emploi
          </h1>
          <p className="text-gray-600 mt-2">
            Gestion centralisée: statuts, visibilité, badges, durées et paramètres
          </p>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-4 font-medium flex items-center gap-2 ${
                activeTab === 'list'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Liste des Offres
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-6 py-4 font-medium flex items-center gap-2 ${
                activeTab === 'stats'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Statistiques
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-6 py-4 font-medium flex items-center gap-2 ${
                activeTab === 'badges'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Zap className="w-5 h-5" />
              Gestion Badges
            </button>
          </div>
        </div>

        {/* Onglet Statistiques */}
        {activeTab === 'stats' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Offres</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Briefcase className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Publiées</p>
                  <p className="text-3xl font-bold text-green-600">{stats.published}</p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Attente</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Expirent Bientôt</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.expiring_soon}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Badge URGENT</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.urgent}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Badge À LA UNE</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.featured}</p>
                </div>
                <Star className="w-12 h-12 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fermées</p>
                  <p className="text-3xl font-bold text-gray-600">{stats.closed}</p>
                </div>
                <Archive className="w-12 h-12 text-gray-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejetées</p>
                  <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
          </div>
        )}

        {/* Onglet Badges */}
        {activeTab === 'badges' && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Gestion des Badges</h2>
            <div className="space-y-4">
              <div className="border border-orange-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Badge URGENT</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Offres nécessitant un recrutement rapide - Badge orange visible
                </p>
                <p className="text-2xl font-bold text-orange-600">{stats?.urgent || 0} offres actives</p>
              </div>

              <div className="border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-6 h-6 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Badge À LA UNE</h3>
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  Offres mises en avant sur la page d'accueil - Badge violet visible
                </p>
                <p className="text-2xl font-bold text-purple-600">{stats?.featured || 0} offres actives</p>
              </div>
            </div>
          </div>
        )}

        {/* Liste des offres */}
        {activeTab === 'list' && (
          <>
            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par titre, entreprise, recruteur, ville, secteur..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    loadJobs();
                    loadStats();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Actualiser
                </button>
              </div>
            </div>

            {/* Compteur */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <p className="text-sm text-gray-600">
                <strong>{filteredJobs.length}</strong> offre(s) trouvée(s)
              </p>
            </div>

            {/* Loader */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="space-y-4">
                      {/* En-tête */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {job.title}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                              {statusLabels[job.status]}
                            </span>
                            {job.is_urgent && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                URGENT
                              </span>
                            )}
                            {job.is_featured && (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                À LA UNE
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>{job.company_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span>{job.recruiter_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{new Date(job.submitted_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>

                          {job.expires_at && (
                            <div className="mt-2 flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                Expire le: {new Date(job.expires_at).toLocaleDateString('fr-FR')}
                              </div>
                              {job.validity_days && (
                                <div className="text-gray-500">
                                  Validité: {job.validity_days} jours
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="border-t pt-4">
                        {getActionButtons(job)}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredJobs.length === 0 && (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Aucune offre trouvée
                    </h3>
                    <p className="text-gray-600">
                      Essayez de modifier vos filtres ou votre recherche
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de détail */}
      {showModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {selectedJob.title}
                  </h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[selectedJob.status]}`}>
                    {statusLabels[selectedJob.status]}
                  </span>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Entreprise</h3>
                    <p className="text-gray-600">{selectedJob.company_name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Localisation</h3>
                    <p className="text-gray-600">{selectedJob.location}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Type de contrat</h3>
                    <p className="text-gray-600">{selectedJob.contract_type}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Secteur</h3>
                    <p className="text-gray-600">{selectedJob.sector}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Recruteur</h3>
                  <p className="text-gray-600">{selectedJob.recruiter_name}</p>
                  <p className="text-gray-500 text-sm">{selectedJob.recruiter_email}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {showEditModal && editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Modifier l'offre
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingJob(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingJob.description}
                    onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={editingJob.location}
                      onChange={(e) => setEditingJob({...editingJob, location: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de contrat
                    </label>
                    <input
                      type="text"
                      value={editingJob.contract_type}
                      onChange={(e) => setEditingJob({...editingJob, contract_type: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur
                    </label>
                    <input
                      type="text"
                      value={editingJob.sector}
                      onChange={(e) => setEditingJob({...editingJob, sector: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Durée de validité (jours)
                    </label>
                    <input
                      type="number"
                      value={editingJob.validity_days || 30}
                      onChange={(e) => setEditingJob({...editingJob, validity_days: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingJob(null);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={processing === editingJob.id}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
