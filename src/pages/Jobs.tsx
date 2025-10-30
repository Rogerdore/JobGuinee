import { useEffect, useState } from 'react';
import { Search, MapPin, Building, Briefcase, Filter, X } from 'lucide-react';
import { supabase, Job, Company } from '../lib/supabase';

interface JobsProps {
  onNavigate: (page: string, jobId?: string) => void;
  initialSearch?: string;
}

export default function Jobs({ onNavigate, initialSearch }: JobsProps) {
  const [jobs, setJobs] = useState<(Job & { companies: Company })[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [location, setLocation] = useState('');
  const [contractType, setContractType] = useState('');
  const [sector, setSector] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setLoading(true);
    let query = supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    const { data } = await query;
    if (data) setJobs(data as any);
    setLoading(false);
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companies?.company_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation =
      !location || job.location?.toLowerCase().includes(location.toLowerCase());

    const matchesContract = !contractType || job.contract_type === contractType;
    const matchesSector = !sector || job.sector === sector;

    return matchesSearch && matchesLocation && matchesContract && matchesSector;
  });

  const contractTypes = [...new Set(jobs.map((j) => j.contract_type).filter(Boolean))];
  const sectors = [...new Set(jobs.map((j) => j.sector).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Offres d'emploi
          </h1>
          <p className="text-gray-600 text-lg">
            {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''} disponible{filteredJobs.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher un poste, une entreprise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Localisation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition flex items-center justify-center space-x-2"
            >
              <Filter className="w-5 h-5" />
              <span>Filtres</span>
            </button>
          </div>

          <div className={`${showFilters ? 'block' : 'hidden'} md:flex gap-4 mt-4`}>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Type de contrat</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="w-full md:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Secteur d'activité</option>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {(contractType || sector || location || searchQuery) && (
              <button
                onClick={() => {
                  setContractType('');
                  setSector('');
                  setLocation('');
                  setSearchQuery('');
                }}
                className="px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition flex items-center justify-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Réinitialiser</span>
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-900"></div>
            <p className="mt-4 text-gray-600">Chargement des offres...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Aucune offre trouvée</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setLocation('');
                setContractType('');
                setSector('');
              }}
              className="text-blue-900 hover:text-blue-700 font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition p-6 cursor-pointer"
                onClick={() => onNavigate('job-detail', job.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-xl text-gray-900 mb-2">{job.title}</h3>
                    <div className="flex items-center space-x-2 text-gray-700 mb-1">
                      <Building className="w-4 h-4" />
                      <span className="font-medium">{job.companies?.company_name}</span>
                    </div>
                    {job.location && (
                      <div className="flex items-center space-x-2 text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="text-sm">{job.location}</span>
                      </div>
                    )}
                  </div>
                  {job.companies?.logo_url && (
                    <img
                      src={job.companies.logo_url}
                      alt={job.companies.company_name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  )}
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.contract_type && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                      {job.contract_type}
                    </span>
                  )}
                  {job.sector && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                      {job.sector}
                    </span>
                  )}
                  {job.is_featured && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      À la une
                    </span>
                  )}
                </div>

                {(job.salary_min || job.salary_max) && (
                  <div className="text-orange-600 font-semibold mb-4">
                    {job.salary_min && job.salary_max
                      ? `${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} GNF`
                      : job.salary_min
                      ? `${job.salary_min.toLocaleString()} GNF+`
                      : `Jusqu'à ${job.salary_max?.toLocaleString()} GNF`}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    {new Date(job.created_at).toLocaleDateString('fr-FR')}
                  </span>
                  <button className="px-6 py-2 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition">
                    Voir l'offre
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
