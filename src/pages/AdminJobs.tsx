import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
import JobPublishForm, { JobFormData } from '../components/recruiter/JobPublishForm';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
  Loader,
  AlertCircle,
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  TrendingUp,
} from 'lucide-react';

interface Job {
  id: string;
  title: string;
  company_id: string;
  company_name: string;
  location: string;
  contract_type: string;
  salary_min: number;
  salary_max: number;
  description: string;
  requirements: string[];
  status: string;
  created_at: string;
  applications_count: number;
}

interface Company {
  id: string;
  name: string;
}

interface AdminJobsProps {
  onNavigate: (page: string) => void;
}

export default function AdminJobs({ onNavigate }: AdminJobsProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published' | 'closed'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  useEffect(() => {
    loadJobs();
    loadCompanies();
  }, []);

  const loadJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select(
          `
          id,
          title,
          company_id,
          companies(name),
          location,
          contract_type,
          salary_min,
          salary_max,
          description,
          requirements,
          status,
          created_at,
          applications_count
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('Jobs chargés depuis Supabase:', data?.length || 0);
      console.log('Offres draft:', data?.filter(j => j.status === 'draft').length || 0);

      const formattedJobs = (data || []).map((job: any) => ({
        ...job,
        company_name: job.companies?.name || 'N/A',
      }));

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Erreur chargement offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erreur chargement entreprises:', error);
    }
  };

  const handlePublishJob = async (jobData: JobFormData) => {
    try {
      // Le JobPublishForm gère déjà la création du job
      // On recharge juste la liste après
      await loadJobs();
      setShowCreateModal(false);
      setSelectedCompany(null);
    } catch (error: any) {
      console.error('Erreur publication offre:', error);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette offre ?')) return;

    try {
      const { error } = await supabase.from('jobs').delete().eq('id', jobId);

      if (error) throw error;

      alert('Offre supprimée avec succès!');
      loadJobs();
    } catch (error: any) {
      console.error('Erreur suppression offre:', error);
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleApproveJob = async (jobId: string) => {
    console.log('handleApproveJob appelé avec jobId:', jobId);

    if (!confirm('Êtes-vous sûr de vouloir approuver et publier cette offre ?')) {
      console.log('Approbation annulée par l\'utilisateur');
      return;
    }

    try {
      console.log('Tentative de mise à jour du statut vers published...');
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'published' })
        .eq('id', jobId);

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('Offre mise à jour avec succès');
      alert('Offre approuvée et publiée avec succès!');
      await loadJobs();
    } catch (error: any) {
      console.error('Erreur approbation offre:', error);
      alert('Erreur lors de l\'approbation: ' + error.message);
    }
  };

  const handleRejectJob = async (jobId: string) => {
    const reason = prompt('Raison du rejet (optionnel):');
    if (reason === null) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId);

      if (error) throw error;

      alert('Offre rejetée avec succès!');
      loadJobs();
    } catch (error: any) {
      console.error('Erreur rejet offre:', error);
      alert('Erreur lors du rejet: ' + error.message);
    }
  };

  const handleCloseJob = async (jobId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir fermer cette offre ?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'closed' })
        .eq('id', jobId);

      if (error) throw error;

      alert('Offre fermée avec succès!');
      loadJobs();
    } catch (error: any) {
      console.error('Erreur fermeture offre:', error);
      alert('Erreur lors de la fermeture: ' + error.message);
    }
  };

  const handleReopenJob = async (jobId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir réouvrir cette offre ?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'published' })
        .eq('id', jobId);

      if (error) throw error;

      alert('Offre réouverte avec succès!');
      loadJobs();
    } catch (error: any) {
      console.error('Erreur réouverture offre:', error);
      alert('Erreur lors de la réouverture: ' + error.message);
    }
  };


  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: jobs.length,
    draft: jobs.filter((j) => j.status === 'draft').length,
    published: jobs.filter((j) => j.status === 'published').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
    totalApplications: jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0),
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <AlertCircle className="w-4 h-4 mr-1" />
            En attente
          </span>
        );
      case 'published':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Publiée
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            <XCircle className="w-4 h-4 mr-1" />
            Fermée
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
            {status}
          </span>
        );
    }
  };

  return (
    <AdminLayout onNavigate={onNavigate}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Offres</h1>
              <p className="text-gray-600 mt-2">Publier et gérer les offres d'emploi</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-blue-900 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition"
            >
              <Plus className="w-5 h-5" />
              <span>Publier une offre</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-sm border-2 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">En attente</p>
                <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.draft}</p>
                <p className="text-xs text-yellow-700 mt-1">À valider</p>
              </div>
              <div className="bg-yellow-200 p-3 rounded-full">
                <AlertCircle className="w-8 h-8 text-yellow-800" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-sm border-2 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Publiées</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{stats.published}</p>
                <p className="text-xs text-green-700 mt-1">Actives</p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <TrendingUp className="w-8 h-8 text-green-800" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-sm border-2 border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Fermées</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.closed}</p>
                <p className="text-xs text-gray-700 mt-1">Archivées</p>
              </div>
              <div className="bg-gray-200 p-3 rounded-full">
                <XCircle className="w-8 h-8 text-gray-800" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-sm border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Candidatures</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalApplications}</p>
                <p className="text-xs text-blue-700 mt-1">Total</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <Users className="w-8 h-8 text-blue-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher par titre, entreprise ou localisation..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Jobs List with Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              {/* Tab Header */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="flex space-x-1 p-2">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      filterStatus === 'all'
                        ? 'bg-blue-900 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      <span>Toutes</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        filterStatus === 'all' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {stats.total}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setFilterStatus('draft')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      filterStatus === 'draft'
                        ? 'bg-yellow-500 text-white shadow-md'
                        : 'text-gray-600 hover:bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      <span>En attente</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        filterStatus === 'draft' ? 'bg-white/20' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {stats.draft}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setFilterStatus('published')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      filterStatus === 'published'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-green-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Publiées</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        filterStatus === 'published' ? 'bg-white/20' : 'bg-green-100 text-green-800'
                      }`}>
                        {stats.published}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => setFilterStatus('closed')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                      filterStatus === 'closed'
                        ? 'bg-gray-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5" />
                      <span>Fermées</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        filterStatus === 'closed' ? 'bg-white/20' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {stats.closed}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Aucune offre {filterStatus !== 'all' && (
                        filterStatus === 'draft' ? 'en attente' :
                        filterStatus === 'published' ? 'publiée' : 'fermée'
                      )}
                    </h3>
                    <p className="text-gray-500 text-sm">
                      {filterStatus === 'draft' && 'Les offres soumises par les recruteurs apparaîtront ici'}
                      {filterStatus === 'published' && 'Publiez une nouvelle offre pour commencer'}
                      {filterStatus === 'closed' && 'Les offres fermées seront archivées ici'}
                      {filterStatus === 'all' && 'Aucune offre disponible pour le moment'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredJobs.map((job) => (
                      <div
                        key={job.id}
                        className={`rounded-lg p-5 border-2 transition-all hover:shadow-md ${
                          job.status === 'draft'
                            ? 'border-yellow-200 bg-yellow-50/50 hover:bg-yellow-50'
                            : job.status === 'published'
                            ? 'border-green-200 bg-green-50/30 hover:bg-green-50/50'
                            : 'border-gray-200 bg-gray-50/30 hover:bg-gray-50/50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Job Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold text-gray-900 truncate">{job.title}</h3>
                              {getStatusBadge(job.status)}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <Building2 className="w-4 h-4 flex-shrink-0" />
                                <span className="font-medium">{job.company_name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4 flex-shrink-0" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span>{job.contract_type}</span>
                              </div>
                              {job.salary_min && job.salary_max && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4 flex-shrink-0" />
                                  <span>{job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} GNF</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1 bg-blue-100 px-2 py-0.5 rounded">
                                <Users className="w-4 h-4 text-blue-700" />
                                <span className="font-semibold text-blue-700">{job.applications_count || 0}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Créé le {new Date(job.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              })}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            {/* Toggle Status Button */}
                            {job.status === 'draft' && (
                              <button
                                onClick={() => handleApproveJob(job.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
                                title="Activer (Approuver et publier)"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Activer
                              </button>
                            )}

                            {job.status === 'published' && (
                              <button
                                onClick={() => handleCloseJob(job.id)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
                                title="Désactiver (Fermer)"
                              >
                                <XCircle className="w-4 h-4" />
                                Désactiver
                              </button>
                            )}

                            {job.status === 'closed' && (
                              <button
                                onClick={() => handleReopenJob(job.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-sm font-medium"
                                title="Activer (Réouvrir)"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Activer
                              </button>
                            )}

                            {/* Action Buttons */}
                            <button
                              onClick={() => onNavigate(`job-detail/${job.id}`)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Voir les détails"
                            >
                              <Eye className="w-5 h-5" />
                            </button>

                            {job.status === 'draft' && (
                              <button
                                onClick={() => handleRejectJob(job.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Rejeter"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}

                            {job.status !== 'draft' && (
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Job Publish Form */}
        {showCreateModal && (
          <JobPublishForm
            onPublish={handlePublishJob}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedCompany(null);
            }}
            companyData={selectedCompany}
          />
        )}
      </div>
    </AdminLayout>
  );
}
