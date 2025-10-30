import { useEffect, useState } from 'react';
import { Briefcase, Plus, Eye, Users, Settings, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Job, Company, Application, Profile } from '../lib/supabase';

interface RecruiterDashboardProps {
  onNavigate: (page: string, jobId?: string) => void;
}

export default function RecruiterDashboard({ onNavigate }: RecruiterDashboardProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'jobs' | 'company' | 'create'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedJobApplications, setSelectedJobApplications] = useState<(Application & { profiles: Profile })[]>([]);
  const [viewingApplications, setViewingApplications] = useState(false);

  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requirements: '',
    location: '',
    contract_type: 'CDI',
    sector: '',
    salary_min: '',
    salary_max: '',
  });

  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    description: '',
    sector: '',
    website: '',
    location: '',
    size: '',
  });

  useEffect(() => {
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const companyData = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (companyData.data) {
      setCompany(companyData.data);
      setCompanyForm({
        company_name: companyData.data.company_name,
        description: companyData.data.description || '',
        sector: companyData.data.sector || '',
        website: companyData.data.website || '',
        location: companyData.data.location || '',
        size: companyData.data.size || '',
      });

      const jobsData = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyData.data.id)
        .order('created_at', { ascending: false });

      if (jobsData.data) setJobs(jobsData.data);
    }

    setLoading(false);
  };

  const handleSaveCompany = async () => {
    if (!profile?.id) return;

    if (company) {
      await supabase
        .from('companies')
        .update(companyForm)
        .eq('user_id', profile.id);
    } else {
      await supabase.from('companies').insert({
        user_id: profile.id,
        ...companyForm,
      });
    }

    loadData();
  };

  const handleCreateJob = async () => {
    if (!company?.id) {
      alert('Veuillez d\'abord créer votre profil entreprise');
      setActiveTab('company');
      return;
    }

    await supabase.from('jobs').insert({
      company_id: company.id,
      title: jobForm.title,
      description: jobForm.description,
      requirements: jobForm.requirements,
      location: jobForm.location,
      contract_type: jobForm.contract_type,
      sector: jobForm.sector,
      salary_min: jobForm.salary_min ? Number(jobForm.salary_min) : null,
      salary_max: jobForm.salary_max ? Number(jobForm.salary_max) : null,
      status: 'published',
    });

    setJobForm({
      title: '',
      description: '',
      requirements: '',
      location: '',
      contract_type: 'CDI',
      sector: '',
      salary_min: '',
      salary_max: '',
    });

    loadData();
    setActiveTab('jobs');
  };

  const loadApplications = async (jobId: string) => {
    const { data } = await supabase
      .from('applications')
      .select('*, profiles(*)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (data) {
      setSelectedJobApplications(data as any);
      setViewingApplications(true);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (viewingApplications) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <button
            onClick={() => setViewingApplications(false)}
            className="mb-6 text-blue-900 hover:text-blue-700 font-medium"
          >
            ← Retour aux offres
          </button>

          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Candidatures reçues ({selectedJobApplications.length})
          </h2>

          {selectedJobApplications.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune candidature pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedJobApplications.map((app) => (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{app.profiles?.full_name}</h3>
                      <p className="text-gray-600">{app.profiles?.email}</p>
                    </div>
                    {app.ai_match_score && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-900">{app.ai_match_score}%</div>
                        <div className="text-sm text-gray-600">Compatibilité</div>
                      </div>
                    )}
                  </div>

                  {app.cover_letter && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Lettre de motivation</h4>
                      <p className="text-gray-600 text-sm">{app.cover_letter}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {new Date(app.created_at).toLocaleDateString('fr-FR')}
                    </span>
                    {app.cv_url && (
                      <a
                        href={app.cv_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
                      >
                        Voir le CV
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace recruteur</h1>
          <p className="text-gray-600">Gérez vos offres et candidatures</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('jobs')}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Mes offres ({jobs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'create'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Publier une offre</span>
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`px-6 py-4 font-medium whitespace-nowrap flex items-center space-x-2 ${
                activeTab === 'company'
                  ? 'border-b-2 border-blue-900 text-blue-900'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="w-5 h-5" />
              <span>Mon entreprise</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'jobs' && (
              <div>
                {jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">Vous n'avez pas encore publié d'offres</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
                    >
                      Publier une offre
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-xl text-gray-900 mb-2">{job.title}</h3>
                            <p className="text-gray-600 mb-2">{job.location}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-2xl font-bold text-blue-900">{job.views_count}</div>
                            <div className="text-sm text-gray-600">Vues</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">-</div>
                            <div className="text-sm text-gray-600">Candidatures</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => loadApplications(job.id)}
                            className="flex-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium rounded-lg transition flex items-center justify-center space-x-2"
                          >
                            <Users className="w-4 h-4" />
                            <span>Voir les candidatures</span>
                          </button>
                          <button
                            onClick={() => onNavigate('job-detail', job.id)}
                            className="flex-1 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition flex items-center justify-center space-x-2"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Voir l'offre</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'create' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Publier une nouvelle offre</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre du poste *
                  </label>
                  <input
                    type="text"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Développeur Full Stack"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description du poste *
                  </label>
                  <textarea
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Décrivez le poste, les responsabilités..."
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exigences et compétences
                  </label>
                  <textarea
                    value={jobForm.requirements}
                    onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Listez les compétences et qualifications requises..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={jobForm.location}
                      onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Conakry"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type de contrat
                    </label>
                    <select
                      value={jobForm.contract_type}
                      onChange={(e) => setJobForm({ ...jobForm, contract_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Stage">Stage</option>
                      <option value="Freelance">Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur
                    </label>
                    <input
                      type="text"
                      value={jobForm.sector}
                      onChange={(e) => setJobForm({ ...jobForm, sector: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Technologie, Finance, Santé..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire minimum (GNF)
                    </label>
                    <input
                      type="number"
                      value={jobForm.salary_min}
                      onChange={(e) => setJobForm({ ...jobForm, salary_min: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 5000000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salaire maximum (GNF)
                    </label>
                    <input
                      type="number"
                      value={jobForm.salary_max}
                      onChange={(e) => setJobForm({ ...jobForm, salary_max: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 8000000"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleCreateJob}
                    disabled={!jobForm.title || !jobForm.description}
                    className="px-8 py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition shadow-lg"
                  >
                    Publier l'offre
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Profil de l'entreprise</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'entreprise *
                  </label>
                  <input
                    type="text"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: TechCorp Guinée"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Présentez votre entreprise..."
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secteur d'activité
                    </label>
                    <input
                      type="text"
                      value={companyForm.sector}
                      onChange={(e) => setCompanyForm({ ...companyForm, sector: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Technologie"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Site web
                    </label>
                    <input
                      type="url"
                      value={companyForm.website}
                      onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Localisation
                    </label>
                    <input
                      type="text"
                      value={companyForm.location}
                      onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Conakry, Guinée"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille de l'entreprise
                    </label>
                    <select
                      value={companyForm.size}
                      onChange={(e) => setCompanyForm({ ...companyForm, size: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Sélectionner</option>
                      <option value="1-10">1-10 employés</option>
                      <option value="11-50">11-50 employés</option>
                      <option value="51-200">51-200 employés</option>
                      <option value="201-500">201-500 employés</option>
                      <option value="500+">500+ employés</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveCompany}
                    disabled={!companyForm.company_name}
                    className="px-8 py-3 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition shadow-lg"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
