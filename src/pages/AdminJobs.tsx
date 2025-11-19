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
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all');
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

  const handleToggleStatus = async (jobId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'closed' : 'active';

    try {
      const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);

      if (error) throw error;

      loadJobs();
    } catch (error: any) {
      console.error('Erreur changement statut:', error);
      alert('Erreur lors du changement de statut: ' + error.message);
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
    active: jobs.filter((j) => j.status === 'active').length,
    closed: jobs.filter((j) => j.status === 'closed').length,
    totalApplications: jobs.reduce((sum, job) => sum + (job.applications_count || 0), 0),
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Offres</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <Briefcase className="w-12 h-12 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offres Actives</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <Clock className="w-12 h-12 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offres Fermées</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.closed}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-gray-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Candidatures</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalApplications}</p>
              </div>
              <Users className="w-12 h-12 text-purple-600" />
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

            <div className="flex space-x-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'all'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'active'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actives
              </button>
              <button
                onClick={() => setFilterStatus('closed')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filterStatus === 'closed'
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Fermées
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
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          job.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {job.status === 'active' ? 'Active' : 'Fermée'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Building2 className="w-4 h-4" />
                        <span>{job.company_name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {employmentTypes.find((t) => t.value === job.employment_type)?.label}
                        </span>
                      </div>
                      {job.salary_min && job.salary_max && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {job.salary_min.toLocaleString()} - {job.salary_max.toLocaleString()}{' '}
                            GNF
                          </span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{job.applications_count || 0} candidatures</span>
                      </div>
                    </div>

                    <p className="text-gray-700 line-clamp-2">{job.description}</p>

                    <div className="flex items-center space-x-2 mt-3 text-xs text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Publié le {new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleStatus(job.id, job.status)}
                      className={`p-2 rounded-lg transition ${
                        job.status === 'active'
                          ? 'text-gray-600 hover:bg-gray-100'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={job.status === 'active' ? 'Fermer l\'offre' : 'Réactiver l\'offre'}
                    >
                      {job.status === 'active' ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <Check className="w-5 h-5" />
                      )}
                    </button>
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
