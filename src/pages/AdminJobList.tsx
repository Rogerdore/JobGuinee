import { useState, useEffect } from 'react';
import {
  Briefcase, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle,
  Clock, Archive, RefreshCw, Calendar, MapPin, Building2, Mail, User
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
}

type StatusFilter = 'all' | 'published' | 'pending' | 'closed' | 'rejected' | 'draft';

export default function AdminJobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    console.log('🚀 AdminJobList montée - Premier chargement');
    loadJobs();
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

  const loadJobs = async () => {
    try {
      setLoading(true);
      console.log('🔍 [AdminJobList] Début chargement des offres');
      console.log('📋 [AdminJobList] Filtre actuel:', statusFilter);

      // Vérifier l'utilisateur connecté
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('👤 [AdminJobList] Utilisateur:', {
        id: user?.id,
        email: user?.email,
        error: authError
      });

      if (authError || !user) {
        console.error('❌ [AdminJobList] Pas d\'utilisateur connecté');
        setJobs([]);
        setLoading(false);
        return;
      }

      // Vérifier le profil admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      console.log('🔐 [AdminJobList] Profil:', {
        user_type: profile?.user_type,
        error: profileError
      });

      let query = supabase
        .from('jobs')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      console.log('⚡ [AdminJobList] Exécution requête jobs...');
      const { data: jobsData, error } = await query;

      console.log('📊 [AdminJobList] Résultat requête:', {
        count: jobsData?.length || 0,
        error: error,
        errorDetails: error ? {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        } : null
      });

      if (error) {
        console.error('❌ [AdminJobList] Erreur SQL:', error);
        alert('Erreur de chargement: ' + error.message);
        throw error;
      }

      if (!jobsData || jobsData.length === 0) {
        console.warn('⚠️ [AdminJobList] Aucune offre retournée');
        setJobs([]);
        setLoading(false);
        return;
      }

      console.log('✅ [AdminJobList] Offres récupérées:', jobsData.length);

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

      console.log('✅ [AdminJobList] Offres avec recruteurs:', jobsWithRecruiter.length);
      setJobs(jobsWithRecruiter);
    } catch (error: any) {
      console.error('❌ [AdminJobList] Erreur chargement offres:', error);
      alert('Erreur: ' + (error?.message || 'Erreur inconnue'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId: string) => {
    if (!confirm('Approuver cette offre pour 30 jours ?')) return;

    setProcessing(jobId);
    try {
      const { data, error } = await supabase.rpc('approve_job_with_validity', {
        p_job_id: jobId,
        p_validity_days: 30,
        p_notes: 'Approuvé via la liste des offres'
      });

      if (error) throw error;

      alert('Offre approuvée avec succès!');
      loadJobs();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation');
    } finally {
      setProcessing(null);
    }
  };

  const handleRepublish = async (jobId: string) => {
    const days = prompt('Nombre de jours de validité ?', '30');
    if (!days) return;

    setProcessing(jobId);
    try {
      const { data, error } = await supabase.rpc('republish_job', {
        p_job_id: jobId,
        p_validity_days: parseInt(days),
        p_notes: 'Republiée via la liste des offres'
      });

      if (error) throw error;

      alert('Offre republiée avec succès!');
      loadJobs();
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

      alert('Offre fermée avec succès!');
      loadJobs();
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

      alert('Offre rejetée avec succès!');
      loadJobs();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du rejet');
    } finally {
      setProcessing(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('⚠️ ATTENTION: Supprimer définitivement cette offre ? Cette action est irréversible.')) return;

    setProcessing(jobId);
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      alert('Offre supprimée avec succès!');
      loadJobs();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setProcessing(null);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.recruiter_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getActionButtons = (job: Job) => {
    const isProcessing = processing === job.id;

    switch (job.status) {
      case 'pending':
        return (
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
        );

      case 'published':
        return (
          <>
            <button
              onClick={() => handleRepublish(job.id)}
              disabled={isProcessing}
              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
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
        );

      case 'closed':
      case 'rejected':
        return (
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8" />
            Toutes les Offres d'Emploi
          </h1>
          <p className="text-gray-600 mt-2">
            Gestion complète de toutes les offres d'emploi de la plateforme
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par titre, entreprise, recruteur..."
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
              onClick={loadJobs}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <p className="text-sm text-gray-600">
                <strong>{filteredJobs.length}</strong> offre(s) trouvée(s)
              </p>
            </div>

            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {job.title}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status]}`}>
                          {statusLabels[job.status] || job.status}
                        </span>
                        {job.is_urgent && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            URGENT
                          </span>
                        )}
                        {job.is_featured && (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            À LA UNE
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-sm text-gray-600">
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
                        <div className="mt-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4 inline mr-1" />
                          Expire le: {new Date(job.expires_at).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
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
          </>
        )}
      </div>

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
                  ✕
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

              <div className="mt-6 flex justify-end gap-2">
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
    </div>
  );
}
