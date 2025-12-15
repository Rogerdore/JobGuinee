import { useEffect, useState } from 'react';
import {
  CheckCircle, XCircle, Clock, Eye, Calendar, MapPin, Briefcase,
  Building, DollarSign, Users, AlertCircle, FileText, ChevronDown,
  ChevronUp, History, Search
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
}

interface ModerationHistory {
  id: string;
  job_id: string;
  action: string;
  previous_status: string;
  new_status: string;
  reason: string;
  notes: string;
  created_at: string;
  moderator_name: string;
}

interface AdminJobModerationProps {
  onNavigate: (page: string) => void;
}

export default function AdminJobModeration({ onNavigate }: AdminJobModerationProps) {
  const { user } = useAuth();
  const [pendingJobs, setPendingJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [moderationNotes, setModerationNotes] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'all'>('pending');
  const [historyModal, setHistoryModal] = useState<string | null>(null);
  const [moderationHistory, setModerationHistory] = useState<ModerationHistory[]>([]);
  const [showApproveModal, setShowApproveModal] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, [statusFilter]);

  const loadJobs = async () => {
    setLoading(true);
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
          status
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('status', 'pending');
      } else {
        query = query.in('status', ['pending', 'rejected', 'published']);
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

      setPendingJobs(jobsWithRecruiter);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      showMessage('error', 'Erreur lors du chargement des offres');
    } finally {
      setLoading(false);
    }
  };

  const loadModerationHistory = async (jobId: string) => {
    try {
      const { data, error } = await supabase
        .from('job_moderation_history')
        .select(`
          *,
          profiles:moderator_id (full_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const historyWithNames = (data || []).map(item => ({
        ...item,
        moderator_name: item.profiles?.full_name || 'Système'
      }));

      setModerationHistory(historyWithNames);
      setHistoryModal(jobId);
    } catch (error: any) {
      console.error('Error loading history:', error);
      showMessage('error', 'Erreur lors du chargement de l\'historique');
    }
  };

  const confirmApprove = async () => {
    if (!showApproveModal) return;

    setProcessing(showApproveModal);
    try {
      const { data, error } = await supabase.rpc('approve_job', {
        p_job_id: showApproveModal,
        p_notes: moderationNotes || null
      });

      if (error) throw error;

      if (data?.success) {
        showMessage('success', 'Offre approuvée avec succès');
        setShowApproveModal(null);
        setModerationNotes('');
        await loadJobs();
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
        await loadJobs();
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

  const filteredJobs = pendingJobs.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.company_name.toLowerCase().includes(query) ||
      job.recruiter_name.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200">
            ⏳ En attente
          </span>
        );
      case 'published':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            ✅ Approuvé
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            ❌ Rejeté
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Modération des Offres d'Emploi</h1>
            <p className="text-gray-600 mt-1">Validation et gestion des offres soumises par les recruteurs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <div className="text-2xl font-bold text-yellow-800">{pendingJobs.filter(j => j.status === 'pending').length}</div>
              <div className="text-xs text-yellow-700">En attente</div>
            </div>
          </div>
        </div>

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
              <option value="all">Tous les statuts</option>
            </select>
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Aucune offre à modérer</p>
            <p className="text-gray-500 text-sm mt-2">Les nouvelles soumissions apparaîtront ici</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                        {getStatusBadge(job.status)}
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
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Recruteur:</span> {job.recruiter_name} ({job.recruiter_email})
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => loadModerationHistory(job.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                        title="Voir l'historique"
                      >
                        <History className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        {expandedJob === job.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

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
                              onClick={() => setShowApproveModal(job.id)}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Approuver
                            </button>
                            <button
                              onClick={() => setShowRejectModal(job.id)}
                              disabled={processing === job.id}
                              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-5 h-5" />
                              Rejeter
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

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
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === showRejectModal ? 'Rejet en cours...' : 'Confirmer le rejet'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {historyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <History className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Historique de modération</h3>
                </div>
                <button
                  onClick={() => setHistoryModal(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {moderationHistory.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Aucun historique disponible</p>
              ) : (
                <div className="space-y-3">
                  {moderationHistory.map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          entry.action === 'approved' ? 'bg-green-100 text-green-800' :
                          entry.action === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.action === 'approved' ? '✅ Approuvé' :
                           entry.action === 'rejected' ? '❌ Rejeté' :
                           entry.action === 'submitted' ? '📤 Soumis' : entry.action}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.created_at).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div><span className="font-medium">Par:</span> {entry.moderator_name}</div>
                        {entry.reason && (
                          <div className="mt-2">
                            <span className="font-medium">Raison:</span>
                            <div className="bg-gray-50 p-2 rounded mt-1">{entry.reason}</div>
                          </div>
                        )}
                        {entry.notes && (
                          <div className="mt-2">
                            <span className="font-medium">Notes:</span>
                            <div className="bg-gray-50 p-2 rounded mt-1">{entry.notes}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-gray-700 leading-relaxed">
                    Vous êtes sur le point d'approuver cette offre d'emploi.
                  </p>
                  <ul className="mt-3 space-y-2 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>L'offre sera immédiatement visible publiquement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Le recruteur recevra une notification d'approbation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">✓</span>
                      <span>Les candidats pourront postuler à cette offre</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApproveModal(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmApprove}
                    disabled={processing === showApproveModal}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing === showApproveModal ? 'Approbation...' : 'Confirmer l\'approbation'}
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
