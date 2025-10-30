import { useEffect, useState } from 'react';
import {
  Search, MapPin, Building, Briefcase, Filter, X, Heart, Share2, Clock,
  ChevronDown, Grid, List, SlidersHorizontal, TrendingUp, Calendar, DollarSign
} from 'lucide-react';
import { supabase, Job, Company } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface JobsProps {
  onNavigate: (page: string, jobId?: string) => void;
  initialSearch?: string;
}

export default function Jobs({ onNavigate, initialSearch }: JobsProps) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<(Job & { companies: Company })[]>([]);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [location, setLocation] = useState('');
  const [contractType, setContractType] = useState('');
  const [sector, setSector] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [datePosted, setDatePosted] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date');

  const locations = ['Conakry', 'Boké', 'Kindia', 'Labé', 'Nzérékoré', 'Kamsar', 'Siguiri', 'Kankan'];
  const experienceLevels = ['Débutant', '1-3 ans', '3-5 ans', '+5 ans'];

  useEffect(() => {
    loadJobs();
    if (user) loadSavedJobs();
  }, [user]);

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (data) setJobs(data as any);
    setLoading(false);
  };

  const loadSavedJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_jobs')
      .select('job_id')
      .eq('candidate_id', user.id);

    if (data) setSavedJobs(data.map(item => item.job_id));
  };

  const toggleSaveJob = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onNavigate('login');
      return;
    }

    if (savedJobs.includes(jobId)) {
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('candidate_id', user.id)
        .eq('job_id', jobId);
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      await supabase
        .from('saved_jobs')
        .insert({ candidate_id: user.id, job_id: jobId });
      setSavedJobs([...savedJobs, jobId]);
    }
  };

  const shareJob = (job: Job, e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${job.title} - ${job.companies?.company_name}\nPostulez sur JobGuinée`;
    const url = window.location.origin;
    if (navigator.share) {
      navigator.share({ title: job.title, text, url });
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.companies?.company_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLocation = !location || job.location?.toLowerCase().includes(location.toLowerCase());
    const matchesContract = !contractType || job.contract_type === contractType;
    const matchesSector = !sector || job.sector === sector;
    const matchesSalary = !salaryMin || (job.salary_min && job.salary_min >= Number(salaryMin));

    let matchesDate = true;
    if (datePosted) {
      const jobDate = new Date(job.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24));

      if (datePosted === '24h' && daysDiff > 1) matchesDate = false;
      if (datePosted === '3j' && daysDiff > 3) matchesDate = false;
      if (datePosted === '7j' && daysDiff > 7) matchesDate = false;
      if (datePosted === '30j' && daysDiff > 30) matchesDate = false;
    }

    return matchesSearch && matchesLocation && matchesContract && matchesSector && matchesSalary && matchesDate;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'views') {
      return b.views_count - a.views_count;
    } else if (sortBy === 'salary') {
      return (b.salary_max || 0) - (a.salary_max || 0);
    }
    return 0;
  });

  const contractTypes = [...new Set(jobs.map((j) => j.contract_type).filter(Boolean))];
  const sectors = [...new Set(jobs.map((j) => j.sector).filter(Boolean))];

  const activeFiltersCount = [location, contractType, sector, experienceLevel, salaryMin, datePosted].filter(Boolean).length;

  const getTimeAgo = (date: string) => {
    const daysDiff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return "Aujourd'hui";
    if (daysDiff === 1) return 'Hier';
    if (daysDiff < 7) return `Il y a ${daysDiff} jours`;
    if (daysDiff < 30) return `Il y a ${Math.floor(daysDiff / 7)} semaine${Math.floor(daysDiff / 7) > 1 ? 's' : ''}`;
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#0E2F56] to-[#1a4275] text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Offres d'emploi en Guinée
          </h1>
          <p className="text-lg text-blue-100">
            {filteredJobs.length} offre{filteredJobs.length > 1 ? 's' : ''} disponible{filteredJobs.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Poste, entreprise, mot-clé..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none appearance-none"
              >
                <option value="">Toutes les régions</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none"
              >
                <option value="">Type de contrat</option>
                {contractTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full px-4 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition flex items-center justify-center space-x-2"
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span>Filtres{activeFiltersCount > 0 && ` (${activeFiltersCount})`}</span>
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secteur d'activité</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                >
                  <option value="">Tous les secteurs</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau d'expérience</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                >
                  <option value="">Tous les niveaux</option>
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Salaire minimum (GNF)</label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="Ex: 5000000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date de publication</label>
                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent"
                >
                  <option value="">Toutes les dates</option>
                  <option value="24h">Dernières 24h</option>
                  <option value="3j">3 derniers jours</option>
                  <option value="7j">7 derniers jours</option>
                  <option value="30j">30 derniers jours</option>
                </select>
              </div>
            </div>
          )}

          {activeFiltersCount > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {location && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{location}</span>}
                {contractType && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{contractType}</span>}
                {sector && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{sector}</span>}
                {experienceLevel && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">{experienceLevel}</span>}
                {datePosted && <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Publiées {datePosted}</span>}
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setLocation('');
                  setContractType('');
                  setSector('');
                  setExperienceLevel('');
                  setSalaryMin('');
                  setDatePosted('');
                }}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Réinitialiser</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF8C00] focus:border-transparent text-sm"
            >
              <option value="date">Plus récentes</option>
              <option value="views">Plus vues</option>
              <option value="salary">Salaire décroissant</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#0E2F56] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#0E2F56] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[#0E2F56]"></div>
            <p className="mt-4 text-gray-600">Chargement des offres...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Aucune offre trouvée</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setLocation('');
                setContractType('');
                setSector('');
                setExperienceLevel('');
                setSalaryMin('');
                setDatePosted('');
              }}
              className="text-[#0E2F56] hover:text-[#1a4275] font-medium"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
            {sortedJobs.map((job) => {
              const daysAgo = Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24));
              const isNew = daysAgo <= 3;

              return (
                <div
                  key={job.id}
                  className="group bg-white rounded-xl border border-gray-200 hover:shadow-xl hover:border-[#FF8C00] transition p-6 cursor-pointer"
                  onClick={() => onNavigate('job-detail', job.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#0E2F56] flex-1">
                          {job.title}
                        </h3>
                        {isNew && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            NOUVEAU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700 mb-2">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{job.companies?.company_name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                        {job.location && (
                          <div className="flex items-center space-x-1">
                            <MapPin className="w-4 h-4" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{getTimeAgo(job.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{job.views_count} vues</span>
                        </div>
                      </div>
                    </div>
                    {job.companies?.logo_url && (
                      <img
                        src={job.companies.logo_url}
                        alt={job.companies.company_name}
                        className="w-16 h-16 rounded-lg object-cover ml-4"
                      />
                    )}
                  </div>

                  {viewMode === 'list' && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{job.description}</p>
                  )}

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
                    <div className="flex items-center space-x-2 text-[#FF8C00] font-semibold mb-4">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        {job.salary_min && job.salary_max
                          ? `${(job.salary_min / 1000000).toFixed(1)}M - ${(job.salary_max / 1000000).toFixed(1)}M GNF`
                          : job.salary_min
                          ? `À partir de ${(job.salary_min / 1000000).toFixed(1)}M GNF`
                          : `Jusqu'à ${(job.salary_max! / 1000000).toFixed(1)}M GNF`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleSaveJob(job.id, e)}
                        className={`p-2 rounded-lg border transition ${
                          savedJobs.includes(job.id)
                            ? 'bg-red-50 border-red-300 text-red-600'
                            : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`w-5 h-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => shareJob(job, e)}
                        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                    </div>
                    <button className="px-6 py-2 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition">
                      Voir l'offre
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sortedJobs.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            Affichage de {sortedJobs.length} offre{sortedJobs.length > 1 ? 's' : ''} sur {jobs.length}
          </div>
        )}
      </div>

      <div className="py-12"></div>
    </div>
  );
}
