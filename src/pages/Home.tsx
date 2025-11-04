import { useEffect, useState } from 'react';
import {
  Search, Briefcase, Users, MapPin, Building, ArrowRight,
  Award, BookOpen, CheckCircle, Star, Zap, Target, Shield,
  Truck, DollarSign, Code, GraduationCap, UserCheck, Clock, Calendar
} from 'lucide-react';
import { supabase, Job, Company, Formation } from '../lib/supabase';
import { sampleJobs } from '../utils/sampleJobsData';
import { sampleFormations } from '../utils/sampleFormationsData';
import { useCMS } from '../contexts/CMSContext';

interface HomeProps {
  onNavigate: (page: string, jobId?: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const { getSetting, getSection } = useCMS();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [contractType, setContractType] = useState('');
  const [recentJobs, setRecentJobs] = useState<(Job & { companies: Company })[]>([]);
  const [featuredFormations, setFeaturedFormations] = useState<Formation[]>([]);
  const [stats, setStats] = useState({ jobs: 0, companies: 0, candidates: 0, formations: 0 });
  const [animatedStats, setAnimatedStats] = useState({ jobs: 0, companies: 0, candidates: 0, formations: 0 });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const interval = duration / steps;

    const timer = setInterval(() => {
      setAnimatedStats(prev => ({
        jobs: prev.jobs < stats.jobs ? Math.min(prev.jobs + Math.ceil(stats.jobs / steps), stats.jobs) : prev.jobs,
        companies: prev.companies < stats.companies ? Math.min(prev.companies + Math.ceil(stats.companies / steps), stats.companies) : prev.companies,
        candidates: prev.candidates < stats.candidates ? Math.min(prev.candidates + Math.ceil(stats.candidates / steps), stats.candidates) : prev.candidates,
        formations: prev.formations < stats.formations ? Math.min(prev.formations + Math.ceil(stats.formations / steps), stats.formations) : prev.formations,
      }));
    }, interval);

    return () => clearInterval(timer);
  }, [stats]);

  const loadData = async () => {
    const [jobsData, formationsData, jobsCount, companiesCount, candidatesCount, formationsCount] = await Promise.all([
      supabase
        .from('jobs')
        .select('*, companies(*)')
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('formations')
        .select('*')
        .eq('status', 'active')
        .limit(3),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('user_type', 'candidate'),
      supabase.from('formations').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    // Use sample data if database is empty
    if (jobsData.data && jobsData.data.length > 0) {
      setRecentJobs(jobsData.data as any);
    } else {
      // Transform sample jobs to match the expected format
      const transformedSampleJobs = sampleJobs.map(job => ({
        ...job,
        sector: job.department,
        companies: {
          id: job.company_id,
          company_name: job.company_name,
          logo_url: job.company_logo,
        }
      }));
      setRecentJobs(transformedSampleJobs as any);
    }

    if (formationsData.data && formationsData.data.length > 0) {
      setFeaturedFormations(formationsData.data);
    } else {
      setFeaturedFormations(sampleFormations.slice(0, 3) as any);
    }

    setStats({
      jobs: jobsCount.count || sampleJobs.length,
      companies: companiesCount.count || 15,
      candidates: candidatesCount.count || 1250,
      formations: formationsCount.count || 8,
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    if (contractType) params.set('contract', contractType);
    onNavigate('jobs', params.toString());
  };

  const categories = [
    { name: 'Mines & Extraction', icon: Shield, color: 'from-orange-500 to-orange-600', count: 45 },
    { name: 'Finance & Comptabilité', icon: DollarSign, color: 'from-green-500 to-green-600', count: 32 },
    { name: 'Informatique & Tech', icon: Code, color: 'from-blue-500 to-blue-600', count: 28 },
    { name: 'Logistique & Transport', icon: Truck, color: 'from-purple-500 to-purple-600', count: 38 },
    { name: 'RH & Administration', icon: UserCheck, color: 'from-pink-500 to-pink-600', count: 25 },
    { name: 'Formation & Éducation', icon: GraduationCap, color: 'from-indigo-500 to-indigo-600', count: 18 },
  ];

  const testimonials = [
    {
      name: 'Aïssatou Diallo',
      role: 'Comptable',
      company: 'SMB-Winning',
      text: "Grâce à JobGuinée, j'ai trouvé un emploi en 3 semaines ! La plateforme est simple et efficace.",
      avatar: '👩‍💼',
    },
    {
      name: 'Mamadou Camara',
      role: 'Ingénieur Mines',
      company: 'WCS Mining',
      text: "Excellent service ! J'ai reçu plusieurs propositions d'emploi adaptées à mon profil.",
      avatar: '👨‍💼',
    },
    {
      name: 'Fatoumata Bah',
      role: 'Responsable RH',
      company: 'Orange Guinée',
      text: "Nous recrutons désormais tous nos talents via JobGuinée. Interface intuitive et candidats qualifiés.",
      avatar: '👩',
    },
  ];

  const partners = [
    {
      name: 'SMB-Winning',
      logo: 'https://ui-avatars.com/api/?name=SMB&background=3B82F6&color=fff&size=120&bold=true',
    },
    {
      name: 'Orange Guinée',
      logo: 'https://ui-avatars.com/api/?name=Orange&background=3B82F6&color=fff&size=120&bold=true',
    },
    {
      name: 'Bolloré',
      logo: 'https://ui-avatars.com/api/?name=Bollore&background=3B82F6&color=fff&size=120&bold=true',
    },
    {
      name: 'WCS Mining',
      logo: 'https://ui-avatars.com/api/?name=WCS&background=3B82F6&color=fff&size=120&bold=true',
    },
    {
      name: 'UMS',
      logo: 'https://ui-avatars.com/api/?name=UMS&background=3B82F6&color=fff&size=120&bold=true',
    },
    {
      name: 'CBG',
      logo: 'https://ui-avatars.com/api/?name=CBG&background=3B82F6&color=fff&size=120&bold=true',
    },
    {
      name: 'Rio Tinto',
      logo: 'https://ui-avatars.com/api/?name=Rio+Tinto&background=3B82F6&color=fff&size=120&bold=true',
    },
    {
      name: 'Total Energies',
      logo: 'https://ui-avatars.com/api/?name=Total&background=3B82F6&color=fff&size=120&bold=true',
    },
  ];

  return (
    <div className="w-full">
      <section className="relative bg-gradient-to-br from-[#0E2F56] via-[#1a4275] to-[#0E2F56] text-white overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-white bg-opacity-10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-[#FF8C00]" />
              <span className="text-sm font-medium">{getSetting('site_tagline', 'Plateforme N°1 de l\'emploi en Guinée')}</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              {getSetting('homepage_hero_title', 'Simplifiez votre recrutement, trouvez votre emploi').split(',')[0]},<br />
              <span className="text-[#FF8C00]">{getSetting('homepage_hero_title', 'Simplifiez votre recrutement, trouvez votre emploi').split(',')[1] || 'trouvez votre emploi'}</span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
              {getSetting('homepage_hero_subtitle', 'La première plateforme guinéenne de recrutement digital connectant talents et opportunités')}
            </p>

            <div className="max-w-5xl mx-auto neo-clay-card rounded-3xl p-4 md:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">
                <div className="md:col-span-5 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Métier, compétence, entreprise..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-12 pr-4 py-4 rounded-xl neo-clay-input focus:outline-none text-gray-900 text-base"
                  />
                </div>

                <div className="md:col-span-3 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Ville, région..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-12 pr-4 py-4 rounded-xl neo-clay-input focus:outline-none text-gray-900 text-base"
                  />
                </div>

                <div className="md:col-span-2">
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 focus:border-[#FF8C00] focus:outline-none text-gray-900 text-base"
                  >
                    <option value="">Type</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Stage">Stage</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    onClick={handleSearch}
                    className="w-full h-full px-6 py-4 bg-[#FF8C00] hover:bg-[#e67e00] text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <Search className="w-5 h-5" />
                    <span className="hidden md:inline">Rechercher</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-600 flex flex-wrap gap-2">
                <span className="font-medium">Suggestions:</span>
                {['Assistant RH', 'Chauffeur', 'Comptable', 'Technicien', 'Ingénieur', 'Commercial', 'Logisticien', 'Secrétaire'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-700 transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent"></div>
      </section>

      <section className="py-12 border-b border-white/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0E2F56] mb-2">
                {animatedStats.candidates.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Candidats inscrits</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0E2F56] mb-2">
                {animatedStats.companies.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Entreprises</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0E2F56] mb-2">
                {animatedStats.jobs.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Offres actives</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#0E2F56] mb-2">
                {animatedStats.formations.toLocaleString()}+
              </div>
              <div className="text-gray-600 font-medium">Formations</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explorez par secteur
            </h2>
            <p className="text-lg text-gray-600">Trouvez les opportunités dans votre domaine</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => {
                    const params = new URLSearchParams();
                    params.set('sector', category.name);
                    onNavigate('jobs', params.toString());
                  }}
                  className="group p-6 neo-clay-card rounded-2xl transition cursor-pointer"
                >
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center group-hover:scale-110 transition`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 text-center">{category.name}</h3>
                  <div className="text-xs text-gray-500 text-center">{category.count} offres</div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Offres récentes
              </h2>
              <p className="text-lg text-gray-600">Les dernières opportunités publiées</p>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="hidden md:flex items-center space-x-2 px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-xl transition"
            >
              <span>Voir toutes les offres</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune offre disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentJobs.slice(0, 6).map((job) => (
                <div
                  key={job.id}
                  className="group neo-clay-card rounded-2xl transition p-6 cursor-pointer"
                  onClick={() => onNavigate('job-detail', job.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-[#0E2F56]">
                        {job.title}
                      </h3>
                      <div className="flex items-center space-x-2 text-gray-700 mb-1">
                        <Building className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm font-medium line-clamp-1">{job.companies?.company_name}</span>
                      </div>
                      {job.location && (
                        <div className="flex items-center space-x-2 text-gray-500">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{job.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.contract_type && (
                      <span className="px-3 py-1 soft-gradient-blue text-primary-700 text-xs font-medium rounded-full">
                        {job.contract_type}
                      </span>
                    )}
                    {job.sector && (
                      <span className="px-3 py-1 neo-clay-pressed text-gray-700 text-xs font-medium rounded-full">
                        {job.sector}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-gray-600">
                    {job.education_level && (
                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                        <span className="line-clamp-1">{job.education_level}</span>
                      </div>
                    )}
                    {job.experience_level && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-gray-500" />
                        <span>{job.experience_level}</span>
                      </div>
                    )}
                    {job.deadline && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 flex-shrink-0 text-red-500" />
                        <span className="text-red-600 font-medium">
                          Expire le {new Date(job.deadline).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(job.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('job-detail', job.id);
                      }}
                      className="text-[#FF8C00] font-semibold group-hover:underline"
                    >
                      Voir l'offre →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <button
              onClick={() => onNavigate('jobs')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-xl transition"
            >
              <span>Voir toutes les offres</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-[#FF8C00] rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Espace Candidat</h3>
              </div>

              <p className="text-blue-100 mb-6 text-lg">
                Rejoignez la première communauté d'emploi en Guinée. Créez votre profil, déposez votre CV et recevez des offres personnalisées.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Création de profil gratuit',
                  'Matching IA avec les offres',
                  'Suivi de candidatures en temps réel',
                  'Alertes emploi personnalisées',
                ].map((item) => (
                  <li key={item} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#FF8C00] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onNavigate('signup')}
                className="w-full py-4 bg-[#FF8C00] hover:bg-[#e67e00] text-white font-semibold rounded-xl transition shadow-lg"
              >
                Créer mon profil gratuitement
              </button>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 border border-white border-opacity-20">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-[#FF8C00] rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold">Espace Recruteur</h3>
              </div>

              <p className="text-blue-100 mb-6 text-lg">
                Simplifiez votre recrutement. Publiez vos offres, gérez vos candidatures et trouvez le bon profil plus vite.
              </p>

              <ul className="space-y-3 mb-8">
                {[
                  'Publication d\'offres illimitée',
                  'Accès à la CVthèque',
                  'Tri intelligent des candidatures',
                  'Tableau de bord analytique',
                ].map((item) => (
                  <li key={item} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-[#FF8C00] flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => onNavigate('recruiter-dashboard')}
                className="w-full py-4 bg-white hover:bg-gray-100 text-[#0E2F56] font-semibold rounded-xl transition shadow-lg"
              >
                Publier une annonce maintenant
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#0E2F56]/10 to-[#FF8C00]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <BookOpen className="w-4 h-4 text-[#FF8C00]" />
              <span className="text-sm font-semibold text-gray-700">Formations à la une</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Développez vos compétences
            </h2>
            <p className="text-lg text-gray-600">Formations professionnelles pour booster votre carrière</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredFormations.slice(0, 3).map((formation: any) => (
              <div
                key={formation.id}
                className="neo-clay-card rounded-2xl transition overflow-hidden group cursor-pointer hover:shadow-2xl"
                onClick={() => onNavigate('formations')}
              >
                <div className="h-48 bg-gradient-to-br from-[#0E2F56] to-[#1a4275] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtNi42MjcgNS4zNzMtMTIgMTItMTJzMTIgNS4zNzMgMTIgMTItNS4zNzMgMTItMTIgMTItMTItNS4zNzMtMTItMTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                  <BookOpen className="w-20 h-20 text-white opacity-70 group-hover:scale-110 transition-transform duration-300 relative z-10" />
                  <div className="absolute top-4 right-4 bg-[#FF8C00] text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Populaire
                  </div>
                </div>
                <div className="p-6">
                  {formation.category && (
                    <span className="inline-block px-3 py-1 soft-gradient-blue text-primary-700 text-xs font-medium rounded-full mb-3">
                      {formation.category}
                    </span>
                  )}
                  <h3 className="font-bold text-xl text-gray-900 mb-3 line-clamp-2 group-hover:text-[#0E2F56] transition">
                    {formation.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {formation.duration && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formation.duration}</span>
                      </div>
                    )}
                    {formation.duration_hours && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formation.duration_hours} heures</span>
                      </div>
                    )}
                    {formation.level && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Target className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formation.level}</span>
                      </div>
                    )}
                    {formation.students && (
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formation.students} participants</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-[#FF8C00]">
                        {formation.price.toLocaleString()} GNF
                      </div>
                      <button
                        onClick={() => onNavigate('formations')}
                        className="px-4 py-2 bg-[#0E2F56] hover:bg-[#1a4275] text-white font-medium rounded-lg transition group-hover:shadow-lg"
                      >
                        Voir détails
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('formations')}
              className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-[#FF8C00] to-[#e67e00] hover:from-[#e67e00] hover:to-[#d67500] text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl"
            >
              <span>Découvrir toutes les formations</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-lg text-gray-600">Témoignages de nos utilisateurs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="neo-clay-card rounded-2xl p-8 transition">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <div className="font-bold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-xs text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 italic">"{testimonial.text}"</p>
              </div>
            ))}
          </div>

          <div className="relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#0E2F56]/10 to-[#FF8C00]/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <Award className="w-4 h-4 text-[#FF8C00]" />
                <span className="text-sm font-semibold text-gray-700">Entreprises partenaires</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Nos partenaires</h3>
              <p className="text-lg text-gray-600">Les entreprises leaders qui recrutent avec JobGuinée</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {partners.map((partner, index) => (
                <div
                  key={partner.name}
                  className="group relative bg-gradient-to-br from-blue-100/60 to-blue-200/60 backdrop-blur-xl rounded-2xl border-2 border-blue-300/40 p-6 hover:scale-105 transition-all duration-300 hover:shadow-blue-400/30 hover:shadow-2xl cursor-pointer overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 mb-4 rounded-xl overflow-hidden shadow-lg ring-2 ring-blue-300/30 group-hover:ring-blue-400/50 transition-all duration-300 group-hover:scale-110">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <h4 className="text-center font-bold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">
                      {partner.name}
                    </h4>

                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-gray-600 font-medium">Partenaire actif</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-gradient-to-br from-blue-300/20 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-gray-600 mb-4">
                <span className="font-semibold text-[#0E2F56]">{partners.length}+</span> entreprises leaders font confiance à JobGuinée
              </p>
              <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0E2F56] to-[#1a4275] text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <Building className="w-4 h-4" />
                <span className="font-medium">Devenir partenaire</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gradient-to-br from-[#FF8C00] to-[#e67e00] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ne manquez plus aucune offre !
          </h2>
          <p className="text-xl mb-8">
            Recevez les dernières annonces directement par email
          </p>

          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                onClick={async () => {
                  const email = (document.querySelector('input[type="email"]') as HTMLInputElement)?.value;
                  if (!email) {
                    alert('Veuillez entrer votre adresse email');
                    return;
                  }
                  const { error } = await supabase.from('newsletter_subscribers').insert({ email });
                  if (error) {
                    if (error.code === '23505') {
                      alert('Cet email est déjà inscrit à la newsletter');
                    } else {
                      alert('Erreur lors de l\'inscription');
                    }
                  } else {
                    alert('Merci de vous être inscrit à notre newsletter !');
                    (document.querySelector('input[type="email"]') as HTMLInputElement).value = '';
                  }
                }}
                className="px-8 py-4 bg-white hover:bg-gray-100 text-[#FF8C00] font-semibold rounded-xl transition shadow-lg whitespace-nowrap"
              >
                S'abonner
              </button>
            </div>
            <p className="text-sm mt-4 text-white text-opacity-90">
              Pas de spam. Désabonnez-vous à tout moment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
