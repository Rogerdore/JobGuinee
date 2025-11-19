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
  employment_type: string;
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
          companies!inner(name),
          location,
          employment_type,
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

      if (error) throw error;

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
    if (!confirm('Êtes-vous sûr de vouloir approuver et publier cette offre ?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: 'published' })
        .eq('id', jobId);

      if (error) throw error;

      alert('Offre approuvée et publiée avec succès!');
      loadJobs();
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

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par titre, entreprise ou localisation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  filterStatus === 'all'
                    ? 'bg-blue-900 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Toutes ({stats.total})
              </button>
              <button
                onClick={() => setFilterStatus('draft')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  filterStatus === 'draft'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                En attente ({stats.draft})
              </button>
              <button
                onClick={() => setFilterStatus('published')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  filterStatus === 'published'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Publiées ({stats.published})
              </button>
              <button
                onClick={() => setFilterStatus('closed')}
                className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                  filterStatus === 'closed'
                    ? 'bg-gray-600 text-white shadow-lg'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Fermées ({stats.closed})
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-600">Commencez par publier une nouvelle offre</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all hover:shadow-lg ${
                  job.status === 'draft'
                    ? 'border-yellow-200 bg-yellow-50/30'
                    : job.status === 'published'
                    ? 'border-green-200'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                      {getStatusBadge(job.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span className="font-medium">{job.company_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{job.employment_type}</span>
                      </div>
                      {job.salary_min && job.salary_max && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()} GNF
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-700">{job.applications_count || 0}</span>
                      </div>
                    </div>

                    <p className="text-gray-700 line-clamp-2 mb-3">{job.description}</p>

                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Créé le {new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {job.status === 'draft' && (
                      <>
                        <button
                          onClick={() => handleApproveJob(job.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                          title="Approuver et publier"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm font-medium">Approuver</span>
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2 shadow-sm"
                          title="Rejeter l'offre"
                        >
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Rejeter</span>
                        </button>
                      </>
                    )}

                    {job.status === 'published' && (
                      <button
                        onClick={() => handleCloseJob(job.id)}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center gap-2 shadow-sm"
                        title="Fermer l'offre"
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Fermer</span>
                      </button>
                    )}

                    {job.status === 'closed' && (
                      <button
                        onClick={() => handleReopenJob(job.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
                        title="Réouvrir l'offre"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Réouvrir</span>
                      </button>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => onNavigate(`job-detail/${job.id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Voir les détails"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

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
