import { useEffect, useState } from 'react';
import {
  Search, MapPin, Building, Briefcase, Filter, X, Heart, Share2, Clock,
  ChevronDown, Grid, List, SlidersHorizontal, TrendingUp, Calendar, DollarSign,
  Zap, Users, Award, GraduationCap, Globe, Star, ChevronLeft, ChevronRight,
  Sparkles, Target, Mail, Send, ArrowRight, CheckCircle, Quote, BarChart3
} from 'lucide-react';
import { supabase, Job, Company } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { sampleJobs } from '../utils/sampleJobsData';
import { testimonials, companies as recruitingCompanies, jobCategories, guineaRegions } from '../utils/testimonials';

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
  const [educationLevel, setEducationLevel] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [datePosted, setDatePosted] = useState('');
  const [nationalityRequired, setNationalityRequired] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('date');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDomain, setNewsletterDomain] = useState('');
  const [stats, setStats] = useState({ jobs: 0, candidates: 0, companies: 0, regions: 10 });

  const locations = ['Conakry', 'Boké', 'Kamsar', 'Kindia', 'Labé', 'Nzérékoré', 'Siguiri', 'Kankan', 'Mamou', 'Faranah'];
  const contractTypes = ['CDI', 'CDD', 'Stage', 'Mission', 'Freelance', 'Temps partiel'];
  const sectors = [
    'Mines et Carrières',
    'BTP et Construction',
    'Finance et Banque',
    'Ressources Humaines',
    'Logistique et Transport',
    'Énergie',
    'Santé',
    'Éducation',
    'Agriculture',
    'Technologies',
    'Commerce et Distribution',
    'Industrie',
    'Télécommunications',
    'Tourisme et Hôtellerie'
  ];
  const experienceLevels = ['Débutant', '1-3 ans', '3-5 ans', '+5 ans'];
  const educationLevels = ['Bac', 'Bac+2', 'Licence', 'Master', 'Doctorat', 'Certification'];
  const nationalities = ['Local', 'Expatrié', 'Tous'];

  useEffect(() => {
    loadJobs();
    loadStats();
    if (user) loadSavedJobs();
  }, [user]);

  useEffect(() => {
    if (initialSearch) {
      const params = new URLSearchParams(initialSearch);
      const sectorParam = params.get('sector');
      if (sectorParam) {
        setSector(sectorParam);
      }
    }
  }, [initialSearch]);

  const loadStats = async () => {
    const { count: jobsCount } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: candidatesCount } = await supabase
      .from('candidate_profiles')
      .select('*', { count: 'exact', head: true });

    const { count: companiesCount } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    setStats({
      jobs: jobsCount || sampleJobs.length,
      candidates: candidatesCount || 1247,
      companies: companiesCount || recruitingCompanies.length,
      regions: 10,
    });
  };

  const loadJobs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setJobs(data as any);
    } else {
      setJobs(sampleJobs.map(job => ({
        ...job,
        companies: {
          id: 'sample-company',
          company_name: job.company_name,
          logo_url: job.company_logo,
          industry: job.department || 'Divers',
          location: job.location,
        }
      })) as any);
    }
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
    const text = `${job.title} - ${job.companies?.company_name}\n📍 ${job.location}\n💼 ${job.contract_type}\n\nPostulez sur JobGuinée`;
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
      job.companies?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.keywords?.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation = !location || job.location?.toLowerCase().includes(location.toLowerCase());
    const matchesContract = !contractType || job.contract_type === contractType;
    const matchesSector = !sector || job.sector === sector;
    const matchesExperience = !experienceLevel || job.experience_level === experienceLevel;
    const matchesEducation = !educationLevel || job.education_level === educationLevel;
    const matchesNationality = !nationalityRequired || job.nationality_required === nationalityRequired || job.nationality_required === 'Tous';
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

    return matchesSearch && matchesLocation && matchesContract && matchesSector &&
           matchesExperience && matchesEducation && matchesNationality && matchesSalary && matchesDate;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    } else if (sortBy === 'views') {
      return b.views_count - a.views_count;
    } else if (sortBy === 'salary') {
      return (b.salary_max || 0) - (a.salary_max || 0);
    } else if (sortBy === 'relevance') {
      return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }
    return 0;
  });

  const activeFiltersCount = [
    location, contractType, sector, experienceLevel, educationLevel,
    salaryMin, datePosted, nationalityRequired
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearchQuery('');
    setLocation('');
    setContractType('');
    setSector('');
    setExperienceLevel('');
    setEducationLevel('');
    setSalaryMin('');
    setDatePosted('');
    setNationalityRequired('');
  };

  const getTimeAgo = (date: string) => {
    const daysDiff = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) return "Aujourd'hui";
    if (daysDiff === 1) return 'Hier';
    if (daysDiff < 7) return `Il y a ${daysDiff}j`;
    if (daysDiff < 30) return `Il y a ${Math.floor(daysDiff / 7)} sem.`;
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'À négocier';
    const format = (val: number) => {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
      return val.toString();
    };

    if (min && max) return `${format(min)} - ${format(max)} GNF`;
    if (min) return `À partir de ${format(min)} GNF`;
    return `Jusqu'à ${format(max!)} GNF`;
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const subscribeNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    await supabase.from('newsletter_subscribers').insert({
      email: newsletterEmail,
      domain: newsletterDomain || 'all',
      subscribed_at: new Date().toISOString(),
    });

    setNewsletterEmail('');
    setNewsletterDomain('');
    alert('Merci pour votre inscription ! Vous recevrez nos alertes emploi.');
  };

  const recommendedJobs = sortedJobs.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="bg-gradient-to-br from-[#0E2F56] via-[#1a4275] to-[#0E2F56] text-white py-16 relative overflow-hidden"
        style={{
          backgroundImage: 'url("https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1920")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'multiply',
        }}
      >
        <div className="absolute inset-0 bg-[#0E2F56] opacity-85"></div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              Trouvez votre emploi idéal
              <span className="block text-[#FF8C00] mt-2">en Guinée</span>
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              {jobs.length} opportunités professionnelles vous attendent
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-5 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Poste, entreprise, mot-clé..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white placeholder-white/60 rounded-xl focus:bg-white/30 focus:border-[#FF8C00] focus:outline-none transition"
                />
              </div>

              <div className="md:col-span-4 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white rounded-xl focus:bg-white/30 focus:border-[#FF8C00] focus:outline-none appearance-none transition"
                >
                  <option value="" className="text-gray-900">Toutes les régions</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc} className="text-gray-900">{loc}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none" />
              </div>

              <div className="md:col-span-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full px-6 py-4 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-xl transition flex items-center justify-center space-x-2 shadow-md"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  <span>
                    Filtres
                    {activeFiltersCount > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-white text-[#FF8C00] text-xs rounded-full font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-20">
        {showFilters && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Filter className="w-5 h-5 mr-2 text-[#FF8C00]" />
                Filtres avancés
              </h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type de contrat</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none transition"
                >
                  <option value="">Tous les types</option>
                  {contractTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Secteur d'activité</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none transition"
                >
                  <option value="">Tous les secteurs</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau d'expérience</label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none transition"
                >
                  <option value="">Tous les niveaux</option>
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Niveau d'études</label>
                <select
                  value={educationLevel}
                  onChange={(e) => setEducationLevel(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none transition"
                >
                  <option value="">Tous les niveaux</option>
                  {educationLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Salaire minimum (GNF)</label>
                <input
                  type="number"
                  value={salaryMin}
                  onChange={(e) => setSalaryMin(e.target.value)}
                  placeholder="Ex: 5000000"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date de publication</label>
                <select
                  value={datePosted}
                  onChange={(e) => setDatePosted(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none transition"
                >
                  <option value="">Toutes les dates</option>
                  <option value="24h">Dernières 24h</option>
                  <option value="3j">3 derniers jours</option>
                  <option value="7j">7 derniers jours</option>
                  <option value="30j">30 derniers jours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nationalité requise</label>
                <select
                  value={nationalityRequired}
                  onChange={(e) => setNationalityRequired(e.target.value)}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none transition"
                >
                  <option value="">Toutes</option>
                  {nationalities.map((nat) => (
                    <option key={nat} value={nat}>{nat}</option>
                  ))}
                </select>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {location && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">{location}</span>}
                  {contractType && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">{contractType}</span>}
                  {sector && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">{sector}</span>}
                  {experienceLevel && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">{experienceLevel}</span>}
                  {educationLevel && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">{educationLevel}</span>}
                  {nationalityRequired && <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-200">{nationalityRequired}</span>}
                </div>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-semibold rounded-lg flex items-center space-x-2 transition"
                >
                  <X className="w-4 h-4" />
                  <span>Réinitialiser</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 font-medium">
              <span className="text-[#0E2F56] text-lg font-bold">{filteredJobs.length}</span> offre{filteredJobs.length > 1 ? 's' : ''} trouvée{filteredJobs.length > 1 ? 's' : ''}
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:border-[#FF8C00] focus:outline-none text-sm font-medium bg-white shadow-sm"
            >
              <option value="relevance">Pertinence</option>
              <option value="date">Plus récentes</option>
              <option value="views">Plus vues</option>
              <option value="salary">Salaire décroissant</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-white rounded-lg border-2 border-gray-200 p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-[#0E2F56] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-[#0E2F56] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#0E2F56]"></div>
            <p className="mt-6 text-gray-600 font-medium">Chargement des opportunités...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <Briefcase className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Aucune offre trouvée</h3>
            <p className="text-gray-500 text-lg mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-lg transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
            {sortedJobs.map((job) => {
              const daysAgo = Math.floor((new Date().getTime() - new Date(job.created_at).getTime()) / (1000 * 60 * 60 * 24));
              const isNew = daysAgo <= 3;
              const hasDeadline = job.deadline && new Date(job.deadline) > new Date();

              return (
                <div
                  key={job.id}
                  className="group bg-white rounded-2xl border-2 border-gray-200 hover:border-[#FF8C00] card-hover relative overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${sortedJobs.indexOf(job) * 0.05}s` }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#FF8C00]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  {job.is_featured && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-[#FF8C00] to-orange-500 text-white px-4 py-1.5 text-xs font-bold rounded-bl-xl flex items-center space-x-1 shadow-lg z-10">
                      <Zap className="w-3.5 h-3.5" />
                      <span>À LA UNE</span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {job.companies?.logo_url ? (
                        <div className="flex-shrink-0">
                          <img
                            src={job.companies.logo_url}
                            alt={job.companies.company_name}
                            className="w-16 h-16 rounded-xl object-cover border-2 border-gray-100 group-hover:border-[#FF8C00] transition-colors"
                          />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-[#0E2F56] to-blue-700 flex items-center justify-center border-2 border-gray-100">
                          <Building className="w-8 h-8 text-white" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-2">
                          <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#0E2F56] transition flex-1">
                            {job.title}
                          </h3>
                          {isNew && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-green-100 to-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 flex-shrink-0">
                              NOUVEAU
                            </span>
                          )}
                          {job.is_urgent && (
                            <span className="px-2.5 py-1 bg-gradient-to-r from-red-100 to-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-200 flex-shrink-0 animate-pulse">
                              URGENT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4 text-[#FF8C00]" />
                          <span className="font-semibold text-gray-800">{job.companies?.company_name}</span>
                        </div>

                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                          {job.location && (
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 text-[#FF8C00]" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-[#FF8C00]" />
                            <span>{getTimeAgo(job.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-blue-500" />
                            <span>{job.views_count} vues</span>
                          </div>
                          {job.applications_count > 0 && (
                            <div className="flex items-center gap-1.5">
                              <Users className="w-4 h-4 text-green-500" />
                              <span>{job.applications_count} candidat{job.applications_count > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {job.description && (
                      <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                        {job.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.contract_type && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200">
                          💼 {job.contract_type}
                        </span>
                      )}
                      {job.experience_level && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 text-xs font-semibold rounded-lg border border-purple-200 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          {job.experience_level}
                        </span>
                      )}
                      {job.education_level && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {job.education_level}
                        </span>
                      )}
                      {job.diploma_required && (
                        <span className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-teal-100 text-teal-700 text-xs font-semibold rounded-lg border border-teal-200 flex items-center gap-1">
                          📜 {job.diploma_required}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[#FF8C00] font-bold">
                          <DollarSign className="w-5 h-5" />
                          <span className="text-base">{formatSalary(job.salary_min, job.salary_max)}</span>
                        </div>
                      </div>

                      {hasDeadline && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                          <Calendar className="w-3.5 h-3.5 text-red-500" />
                          <span>Avant le {new Date(job.deadline!).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleSaveJob(job.id, e)}
                          className={`p-2.5 rounded-lg border-2 transition-all ${
                            savedJobs.includes(job.id)
                              ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
                              : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400'
                          }`}
                          title={savedJobs.includes(job.id) ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        >
                          <Heart className={`w-5 h-5 ${savedJobs.includes(job.id) ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => shareJob(job, e)}
                          className="p-2.5 rounded-lg border-2 border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-all"
                          title="Partager"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Navigating to job:', job.id);
                          onNavigate('job-detail', job.id);
                        }}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] hover:from-[#1a4275] hover:to-[#0E2F56] text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg group"
                      >
                        <span className="flex items-center justify-center">
                          Voir l'offre
                          <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sortedJobs.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-2 px-6 py-3 bg-white rounded-full shadow-md border border-gray-200">
              <span className="text-sm text-gray-600">
                Affichage de <span className="font-bold text-[#0E2F56]">{sortedJobs.length}</span> offre{sortedJobs.length > 1 ? 's' : ''} sur <span className="font-bold">{jobs.length}</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Section 4: Recommandations IA */}
      {user && recommendedJobs.length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md mb-4">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-600">Recommandé pour vous</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Offres qui pourraient vous intéresser</h2>
              <p className="text-gray-600">Sélectionnées par notre algorithme IA selon votre profil</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => onNavigate('job-detail', job.id)}
                  className="bg-white rounded-xl border-2 border-purple-200 p-6 cursor-pointer hover:border-purple-400 hover:shadow-xl transition-all card-hover"
                >
                  <div className="flex items-center gap-3 mb-4">
                    {job.companies?.logo_url && (
                      <img src={job.companies.logo_url} alt="" className="w-12 h-12 rounded-lg" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 line-clamp-1">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.companies?.company_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    <span>{job.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-purple-600">{formatSalary(job.salary_min, job.salary_max)}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Target className="w-3 h-3" />
                      <span>95% match</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Entreprises qui recrutent */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Entreprises qui recrutent</h2>
            <p className="text-sm text-gray-600">Découvrez nos partenaires et leurs opportunités</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recruitingCompanies.map((company) => (
              <div
                key={company.id}
                className="bg-gray-50 rounded-lg p-4 text-center hover:shadow-lg hover:bg-white transition-all card-hover cursor-pointer"
                onClick={() => {
                  setSector(company.sector);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-lg overflow-hidden bg-white shadow-sm flex items-center justify-center">
                  <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-xs leading-tight line-clamp-2">{company.name}</h3>
                <p className="text-[10px] text-gray-600 mb-2 truncate">{company.sector}</p>
                <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#0E2F56] text-white text-[10px] font-semibold rounded-full">
                  <Briefcase className="w-3 h-3" />
                  <span>{company.activeJobs} offres</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 6: Statistiques */}
      <div className="bg-gradient-to-br from-[#0E2F56] to-[#1a4275] py-16 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">JobGuinée en chiffres</h2>
            <p className="text-blue-100">La plateforme de référence pour l'emploi en Guinée</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="text-5xl font-bold mb-2 text-[#FF8C00]">{stats.jobs}+</div>
              <div className="text-blue-100">Offres d'emploi</div>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="text-5xl font-bold mb-2 text-[#FF8C00]">{stats.candidates}+</div>
              <div className="text-blue-100">Candidats inscrits</div>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="text-5xl font-bold mb-2 text-[#FF8C00]">{stats.companies}+</div>
              <div className="text-blue-100">Entreprises partenaires</div>
            </div>
            <div className="text-center p-6 bg-white/10 backdrop-blur-sm rounded-xl">
              <div className="text-5xl font-bold mb-2 text-[#FF8C00]">{stats.regions}</div>
              <div className="text-blue-100">Régions couvertes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 7: Témoignages */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Ils ont trouvé leur emploi avec nous</h2>
            <p className="text-gray-600">Découvrez les success stories de notre communauté</p>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <Quote className="w-12 h-12 text-[#FF8C00] mb-6" />
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">{testimonials[currentTestimonial].content}</p>
              <div className="flex items-center gap-4">
                <img
                  src={testimonials[currentTestimonial].avatar}
                  alt={testimonials[currentTestimonial].name}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <div className="font-bold text-gray-900">{testimonials[currentTestimonial].name}</div>
                  <div className="text-sm text-gray-600">{testimonials[currentTestimonial].role}</div>
                  <div className="text-sm text-[#FF8C00]">{testimonials[currentTestimonial].company}</div>
                </div>
                <div className="ml-auto flex gap-1">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={prevTestimonial}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <button
              onClick={nextTestimonial}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition ${
                    index === currentTestimonial ? 'bg-[#FF8C00] w-8' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 8: CTA Recruteur */}
      <div className="bg-gradient-to-r from-[#FF8C00] to-orange-600 py-16 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
            <BarChart3 className="w-5 h-5" />
            <span className="font-semibold">Pour les recruteurs</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Vous recrutez ?</h2>
          <p className="text-xl mb-8 text-orange-50">
            Publiez vos offres et trouvez les meilleurs talents guinéens en quelques clics
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Publication illimitée</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Tri IA des candidatures</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Accès CVthèque Premium</span>
            </div>
          </div>
          <button
            onClick={() => onNavigate('recruiter-dashboard')}
            className="px-8 py-4 bg-white text-[#FF8C00] font-bold rounded-xl hover:bg-gray-50 transition shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto"
          >
            <span>Publier une offre</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Section 11: Newsletter */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Mail className="w-16 h-16 text-[#0E2F56] mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Alertes emploi personnalisées</h2>
          <p className="text-gray-600 mb-8">
            Recevez les nouvelles offres correspondant à votre profil directement par email
          </p>

          <form onSubmit={subscribeNewsletter} className="max-w-xl mx-auto">
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Votre adresse email"
                required
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#0E2F56] focus:outline-none"
              />
              <select
                value={newsletterDomain}
                onChange={(e) => setNewsletterDomain(e.target.value)}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-[#0E2F56] focus:outline-none"
              >
                <option value="">Tous les domaines</option>
                {sectors.map((sector) => (
                  <option key={sector} value={sector}>{sector}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 mx-auto"
            >
              <Send className="w-5 h-5" />
              <span>S'abonner aux alertes</span>
            </button>
          </form>
        </div>
      </div>

      {/* Section 12: Offres par catégorie */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Explorez par secteur d'activité</h2>
            <p className="text-gray-600">Trouvez rapidement les offres dans votre domaine</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {jobCategories.map((category) => (
              <div
                key={category.id}
                onClick={() => {
                  setSector(category.name);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`bg-gradient-to-br ${category.color} text-white rounded-xl p-6 cursor-pointer hover:shadow-2xl transition-all card-hover text-center`}
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-bold mb-2">{category.name}</h3>
                <div className="text-2xl font-bold">{category.count}</div>
                <div className="text-sm opacity-90">offres disponibles</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 13: Carte interactive */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Offres d'emploi par région</h2>
            <p className="text-gray-600">Cliquez sur une région pour voir les opportunités locales</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {guineaRegions.map((region) => (
              <div
                key={region.name}
                onClick={() => {
                  setLocation(region.name);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="bg-gradient-to-br from-[#0E2F56] to-blue-700 text-white rounded-xl p-6 cursor-pointer hover:shadow-xl transition-all card-hover text-center"
              >
                <MapPin className="w-8 h-8 mx-auto mb-3" />
                <h3 className="font-bold mb-2">{region.name}</h3>
                <div className="text-2xl font-bold text-[#FF8C00]">{region.jobs}</div>
                <div className="text-sm opacity-90">offres</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="py-8"></div>
    </div>
  );
}
