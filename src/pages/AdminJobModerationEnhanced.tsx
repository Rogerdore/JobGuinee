import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Eye, Calendar, MapPin, Briefcase,
  Building, DollarSign, Users, AlertCircle, FileText, ChevronDown,
  ChevronUp, History, Search, RefreshCw, Zap, BarChart3,
  Filter, CheckSquare, Square, TrendingUp, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AdminLayout from '../components/AdminLayout';

interface PendingJob {
  id: string;
  title: string;
  description: string;
  location: string;
  contract_type: string;
  sector: string;
  salary_range: string;
  company_name: string;
  submitted_at: string;
  user_id: string;
  recruiter_name: string;
  recruiter_email: string;
  company_id: string;
  category: string;
  position_count: number;
  experience_level: string;
  education_level: string;
  status: string;
  published_at?: string;
  expires_at?: string;
  validity_days?: number;
  renewal_count?: number;
}

interface ModerationStats {
  pending_count: number;
  published_count: number;
  rejected_count: number;
  closed_count: number;
  expiring_soon_count: number;
  expiring_urgent_count: number;
  avg_moderation_hours: number;
  moderated_today: number;
}

interface AdminJobModerationProps {
  onNavigate: (page: string) => void;
}

export default function AdminJobModerationEnhanced({ onNavigate }: AdminJobModerationProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [moderationNotes, setModerationNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);
  const [showRepublishModal, setShowRepublishModal] = useState<string | null>(null);
  const [validityDays, setValidityDays] = useState(30);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all' | 'published' | 'closed' | 'rejected'>('pending');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadJobs(), loadStats()]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      showMessage('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_moderation_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error loading stats:', error);
    }
  };

  const loadJobs = async () => {
    try {
      let query = supabase
        .from('jobs')
        .select(`
          id,
          title,
          description,
          location,
          contract_type,
          sector,
          salary_range,
          department,
          submitted_at,
          user_id,
          company_id,
          category,
          position_count,
          experience_level,
          education_level,
          status,
          published_at,
          expires_at,
          validity_days,
          renewal_count
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter === 'all') {
        query = query.in('status', ['pending', 'published', 'rejected', 'closed']);
      } else {
        query = query.eq('status', statusFilter);
      }

      const { data: jobsData, error: jobsError } = await query;

      if (jobsError) throw jobsError;

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
      console.error('Error loading jobs:', error);
      showMessage('error', 'Erreur lors du chargement des offres');
    }
  };

  const quickApprove = async (jobId: string, days: number = 30) => {
    setProcessing(jobId);
    try {
      const { data, error } = await supabase.rpc('approve_job_with_validity', {
        p_job_id: jobId,
        p_validity_days: days,
        p_notes: `Approbation rapide - ${days} jours`
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', `Offre approuvée avec succès pour ${days} jours`);
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error approving job:', error);
      showMessage('error', error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const customApprove = async () => {
    if (!showApproveModal) return;

    setProcessing(showApproveModal);
    try {
      const { data, error } = await supabase.rpc('approve_job_with_validity', {
        p_job_id: showApproveModal,
        p_validity_days: validityDays,
        p_notes: moderationNotes || null
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', `Offre approuvée pour ${validityDays} jours`);
        setShowApproveModal(null);
        setModerationNotes('');
        setValidityDays(30);
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error approving job:', error);
      showMessage('error', error.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const republishJob = async () => {
    if (!showRepublishModal) return;

    setProcessing(showRepublishModal);
    try {
      const { data, error } = await supabase.rpc('republish_job', {
        p_job_id: showRepublishModal,
        p_validity_days: validityDays,
        p_notes: moderationNotes || 'Republication'
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', `Offre republiée pour ${validityDays} jours`);
        setShowRepublishModal(null);
        setModerationNotes('');
        setValidityDays(30);
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error republishing job:', error);
      showMessage('error', error.message || 'Erreur lors de la republication');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (jobId: string) => {
    if (!rejectionReason.trim()) {
      showMessage('error', 'Veuillez indiquer une raison de rejet');
      return;
    }

    setProcessing(jobId);
    try {
      const { data, error } = await supabase.rpc('reject_job', {
        p_job_id: jobId,
        p_reason: rejectionReason,
        p_notes: moderationNotes || null
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', 'Offre rejetée avec succès');
        setShowRejectModal(null);
        setRejectionReason('');
        setModerationNotes('');
        await loadData();
      } else {
        throw new Error(data?.error || 'Erreur inconnue');
      }
    } catch (error: any) {
      console.error('Error rejecting job:', error);
      showMessage('error', error.message || 'Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const toggleJobSelection = (jobId: string) => {
    const newSet = new Set(selectedJobs);
    if (newSet.has(jobId)) {
      newSet.delete(jobId);
    } else {
      newSet.add(jobId);
    }
    setSelectedJobs(newSet);
    setShowBulkActions(newSet.size > 0);
  };

  const selectAllVisible = () => {
    const visibleJobIds = filteredJobs.filter(j => j.status === 'pending').map(j => j.id);
    setSelectedJobs(new Set(visibleJobIds));
    setShowBulkActions(visibleJobIds.length > 0);
  };

  const clearSelection = () => {
    setSelectedJobs(new Set());
    setShowBulkActions(false);
  };

  const bulkApprove = async () => {
    if (selectedJobs.size === 0) return;

    setProcessing('bulk');
    let successCount = 0;
    let errorCount = 0;

    for (const jobId of selectedJobs) {
      try {
        const { data, error } = await supabase.rpc('approve_job_with_validity', {
          p_job_id: jobId,
          p_validity_days: 30,
          p_notes: 'Approbation en masse'
        });

        if (error) throw error;
        if (data?.success) successCount++;
        else errorCount++;
      } catch (error) {
        errorCount++;
      }
    }

    showMessage('success', `${successCount} offre(s) approuvée(s) ${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`);
    clearSelection();
    await loadData();
    setProcessing(null);
  };

  const filteredJobs = jobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company_name.toLowerCase().includes(query) ||
      job.recruiter_name.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (job: PendingJob) => {
    const isExpiring = job.expires_at && new Date(job.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const isExpiringUrgent = job.expires_at && new Date(job.expires_at) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    switch (job.status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
            ⏳ En attente
          </span>
        );
      case 'published':
        if (isExpiringUrgent) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
              🔥 Expire bientôt
            </span>
          );
        }
        if (isExpiring) {
          return (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              ⚠️ Expire sous 7j
            </span>
          );
        }
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            ✅ Publiée
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            ❌ Rejetée
          </span>
        );
      case 'closed':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 border border-gray-200">
            🔒 Fermée
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout onNavigate={onNavigate}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Chargement des offres...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modération des Offres d'Emploi</h1>
            <p className="text-gray-600 mt-1">Validation rapide et gestion des offres avec durée de validité configurable</p>
          </div>
          <button
            onClick={loadData}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Actualiser"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-800">{stats.pending_count}</div>
              <div className="text-xs text-yellow-700">En attente</div>
            </div>
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-800">{stats.published_count}</div>
              <div className="text-xs text-green-700">Publiées</div>
            </div>
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-800">{stats.expiring_soon_count}</div>
              <div className="text-xs text-orange-700">Expirent 7j</div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-800">{stats.expiring_urgent_count}</div>
              <div className="text-xs text-red-700">Expirent 3j</div>
            </div>
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-800">{stats.closed_count}</div>
              <div className="text-xs text-gray-700">Fermées</div>
            </div>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-800">{stats.rejected_count}</div>
              <div className="text-xs text-red-700">Rejetées</div>
            </div>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-800">{stats.moderated_today}</div>
              <div className="text-xs text-blue-700">Aujourd'hui</div>
            </div>
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-800">{stats.avg_moderation_hours?.toFixed(1) || '0'}h</div>
              <div className="text-xs text-purple-700">Tps moyen</div>
            </div>
          </div>
        )}

        {message && (
          <div className={`p-4 rounded-lg border-2 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">{selectedJobs.size} offre(s) sélectionnée(s)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={bulkApprove}
                  disabled={processing === 'bulk'}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Approuver tout (30j)
                </button>
                <button
                  onClick={clearSelection}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, entreprise, recruteur, localisation..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="pending">En attente uniquement</option>
              <option value="published">Publiées uniquement</option>
              <option value="closed">Fermées uniquement</option>
              <option value="rejected">Rejetées uniquement</option>
              <option value="all">Tous les statuts</option>
            </select>
            {statusFilter === 'pending' && filteredJobs.filter(j => j.status === 'pending').length > 0 && (
              <button
                onClick={selectAllVisible}
                className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium rounded-lg transition flex items-center gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Tout sélectionner
              </button>
            )}
          </div>
        </div>

        {/* Jobs List */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune offre trouvée</p>
            <p className="text-gray-500 text-sm mt-2">Les offres apparaîtront ici selon le filtre sélectionné</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox for bulk selection */}
                      {job.status === 'pending' && (
                        <button
                          onClick={() => toggleJobSelection(job.id)}
                          className="mt-1 p-1 hover:bg-gray-100 rounded transition"
                        >
                          {selectedJobs.has(job.id) ? (
                            <CheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                      )}

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                          {getStatusBadge(job)}
                          {job.renewal_count > 0 && (
                            <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800 font-medium">
                              🔄 Renouvellement #{job.renewal_count}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            <span>{job.company_name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{job.contract_type}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Soumis le {new Date(job.submitted_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                          {job.expires_at && (
                            <div className="flex items-center gap-1 text-orange-600 font-medium">
                              <Clock className="w-4 h-4" />
                              <span>Expire le {new Date(job.expires_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Recruteur:</span> {job.recruiter_name} ({job.recruiter_email})
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    >
                      {expandedJob === job.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>

                  {/* Quick Actions */}
                  {job.status === 'pending' && !expandedJob && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => quickApprove(job.id, 30)}
                        disabled={processing === job.id}
                        className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                        title="Approbation rapide pour 30 jours"
                      >
                        <Zap className="w-4 h-4" />
                        Approuver 30j
                      </button>
                      <button
                        onClick={() => setShowApproveModal(job.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition flex items-center gap-2"
                        title="Configurer la durée de validité"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Personnaliser
                      </button>
                      <button
                        onClick={() => setShowRejectModal(job.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                        title="Rejeter l'offre"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Republish Button for closed/published jobs */}
                  {(job.status === 'closed' || (job.status === 'published' && job.expires_at)) && !expandedJob && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setShowRepublishModal(job.id)}
                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Republier l'offre
                      </button>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {expandedJob === job.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Description du poste</h4>
                        <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          {job.description}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Secteur</div>
                          <div className="font-medium text-gray-900">{job.sector || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Expérience</div>
                          <div className="font-medium text-gray-900">{job.experience_level || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Niveau d'études</div>
                          <div className="font-medium text-gray-900">{job.education_level || 'N/A'}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-xs text-gray-500 mb-1">Postes</div>
                          <div className="font-medium text-gray-900">{job.position_count || 1}</div>
                        </div>
                      </div>

                      {job.status === 'pending' && (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes de modération (optionnel)
                            </label>
                            <textarea
                              value={moderationNotes}
                              onChange={(e) => setModerationNotes(e.target.value)}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ajoutez des notes internes..."
                            />
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => quickApprove(job.id, 30)}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <Zap className="w-5 h-5" />
                              Approuver 30j
                            </button>
                            <button
                              onClick={() => setShowApproveModal(job.id)}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Personnaliser
                            </button>
                            <button
                              onClick={() => setShowRejectModal(job.id)}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-5 h-5" />
                              Rejeter
                            </button>
                          </div>
                        </div>
                      )}

                      {(job.status === 'closed' || (job.status === 'published' && job.expires_at)) && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowRepublishModal(job.id)}
                            className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                          >
                            <RefreshCw className="w-5 h-5" />
                            Republier l'offre
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Approve Modal */}
        {showApproveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Approuver l'offre</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée de validité <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[7, 15, 30, 45, 60, 90].map(days => (
                      <button
                        key={days}
                        onClick={() => setValidityDays(days)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          validityDays === days
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                      >
                        {days} jours
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ou saisissez une durée personnalisée (1-365 jours)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Notes internes..."
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    L'offre sera visible pendant <strong>{validityDays} jours</strong> et expirera automatiquement le{' '}
                    <strong>{new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</strong>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowApproveModal(null);
                      setValidityDays(30);
                      setModerationNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={customApprove}
                    disabled={processing === showApproveModal}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {processing === showApproveModal ? 'Approbation...' : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Republish Modal */}
        {showRepublishModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Republier l'offre</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouvelle durée de validité <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[7, 15, 30, 45, 60, 90].map(days => (
                      <button
                        key={days}
                        onClick={() => setValidityDays(days)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          validityDays === days
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                        }`}
                      >
                        {days} jours
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                    min="1"
                    max="365"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ou saisissez une durée personnalisée (1-365 jours)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={moderationNotes}
                    onChange={(e) => setModerationNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Raison de la republication..."
                  />
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-sm text-purple-800">
                    L'offre sera à nouveau visible pendant <strong>{validityDays} jours</strong> jusqu'au{' '}
                    <strong>{new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</strong>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRepublishModal(null);
                      setValidityDays(30);
                      setModerationNotes('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={republishJob}
                    disabled={processing === showRepublishModal}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {processing === showRepublishModal ? 'Republication...' : 'Republier'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Rejeter l'offre</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Raison du rejet <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ex: L'offre ne respecte pas les standards de qualité, informations incomplètes, contenu inapproprié..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Cette raison sera envoyée au recruteur</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleReject(showRejectModal)}
                    disabled={!rejectionReason.trim() || processing === showRejectModal}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                  >
                    {processing === showRejectModal ? 'Rejet en cours...' : 'Confirmer le rejet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
