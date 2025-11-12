import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AdminLayout from '../components/AdminLayout';
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
  const [creatingJob, setCreatingJob] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    company_id: '',
    location: '',
    employment_type: 'full_time',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: '',
    skills_required: '',
    responsibilities: '',
    benefits: '',
    experience_required: '',
    education_required: 'Licence',
    deadline: '',
  });

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

  const handleCreateJob = async () => {
    if (!formData.title || !formData.company_id || !formData.description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setCreatingJob(true);
    try {
      const requirementsArray = formData.requirements
        .split('\n')
        .filter((r) => r.trim())
        .map((r) => r.trim());

      const skillsArray = formData.skills_required
        .split(',')
        .filter((s) => s.trim())
        .map((s) => s.trim());

      const responsibilitiesArray = formData.responsibilities
        .split('\n')
        .filter((r) => r.trim())
        .map((r) => r.trim());

      const benefitsArray = formData.benefits
        .split('\n')
        .filter((b) => b.trim())
        .map((b) => b.trim());

      const { error } = await supabase.from('jobs').insert({
        title: formData.title,
        company_id: formData.company_id,
        location: formData.location,
        employment_type: formData.employment_type,
        salary_min: formData.salary_min ? parseInt(formData.salary_min) : null,
        salary_max: formData.salary_max ? parseInt(formData.salary_max) : null,
        description: formData.description,
        requirements: requirementsArray,
        skills_required: skillsArray,
        responsibilities: responsibilitiesArray,
        benefits: benefitsArray,
        experience_required: formData.experience_required || null,
        education_required: formData.education_required,
        deadline: formData.deadline || null,
        status: 'active',
      });

      if (error) throw error;

      alert('Offre d\'emploi créée avec succès!');
      setShowCreateModal(false);
      resetForm();
      loadJobs();
    } catch (error: any) {
      console.error('Erreur création offre:', error);
      alert('Erreur lors de la création: ' + error.message);
    } finally {
      setCreatingJob(false);
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

  const resetForm = () => {
    setFormData({
      title: '',
      company_id: '',
      location: '',
      employment_type: 'full_time',
      salary_min: '',
      salary_max: '',
      description: '',
      requirements: '',
      skills_required: '',
      responsibilities: '',
      benefits: '',
      experience_required: '',
      education_required: 'Licence',
      deadline: '',
    });
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

  const employmentTypes = [
    { value: 'full_time', label: 'Temps plein' },
    { value: 'part_time', label: 'Temps partiel' },
    { value: 'contract', label: 'Contrat' },
    { value: 'internship', label: 'Stage' },
    { value: 'freelance', label: 'Freelance' },
  ];

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

        {/* Create Job Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Publier une offre d'emploi</h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Informations de base */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Informations de base</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titre du poste *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Développeur Full Stack"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Entreprise *
                      </label>
                      <select
                        value={formData.company_id}
                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Sélectionner une entreprise</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Localisation
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Conakry"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type de contrat
                      </label>
                      <select
                        value={formData.employment_type}
                        onChange={(e) =>
                          setFormData({ ...formData, employment_type: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {employmentTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Salaire Min (GNF)
                      </label>
                      <input
                        type="number"
                        value={formData.salary_min}
                        onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 2000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Salaire Max (GNF)
                      </label>
                      <input
                        type="number"
                        value={formData.salary_max}
                        onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 5000000"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Expérience requise
                      </label>
                      <input
                        type="text"
                        value={formData.experience_required}
                        onChange={(e) =>
                          setFormData({ ...formData, experience_required: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: 2-5 ans"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Niveau d'études
                      </label>
                      <select
                        value={formData.education_required}
                        onChange={(e) =>
                          setFormData({ ...formData, education_required: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="Baccalauréat">Baccalauréat</option>
                        <option value="Licence">Licence</option>
                        <option value="Master">Master</option>
                        <option value="Doctorat">Doctorat</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date limite de candidature
                      </label>
                      <input
                        type="date"
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description du poste *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez le poste en détail..."
                  />
                </div>

                {/* Responsabilités */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsabilités (une par ligne)
                  </label>
                  <textarea
                    value={formData.responsibilities}
                    onChange={(e) =>
                      setFormData({ ...formData, responsibilities: e.target.value })
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="- Développer des applications web&#10;- Participer aux revues de code&#10;- ..."
                  />
                </div>

                {/* Exigences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exigences (une par ligne)
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="- Maîtrise de JavaScript&#10;- Expérience avec React&#10;- ..."
                  />
                </div>

                {/* Compétences */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compétences requises (séparées par des virgules)
                  </label>
                  <input
                    type="text"
                    value={formData.skills_required}
                    onChange={(e) => setFormData({ ...formData, skills_required: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: JavaScript, React, Node.js, SQL"
                  />
                </div>

                {/* Avantages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Avantages (un par ligne)
                  </label>
                  <textarea
                    value={formData.benefits}
                    onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="- Assurance santé&#10;- Télétravail flexible&#10;- Formation continue&#10;- ..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4 sticky bottom-0 bg-white">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  disabled={creatingJob}
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateJob}
                  disabled={creatingJob}
                  className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {creatingJob ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Publication...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Publier l'offre</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
