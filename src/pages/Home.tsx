import { useEffect, useState } from 'react';
import { Search, Briefcase, Users, TrendingUp, MapPin, Building, ArrowRight } from 'lucide-react';
import { supabase, Job, Company } from '../lib/supabase';

interface HomeProps {
  onNavigate: (page: string, jobId?: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [featuredJobs, setFeaturedJobs] = useState<(Job & { companies: Company })[]>([]);
  const [stats, setStats] = useState({ jobs: 0, companies: 0, candidates: 0 });

  useEffect(() => {
    loadFeaturedJobs();
    loadStats();
  }, []);

  const loadFeaturedJobs = async () => {
    const { data } = await supabase
      .from('jobs')
      .select('*, companies(*)')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(6);

    if (data) setFeaturedJobs(data as any);
  };

  const loadStats = async () => {
    const [jobsCount, companiesCount, candidatesCount] = await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true }),
      supabase.from('companies').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'candidate'),
    ]);

    setStats({
      jobs: jobsCount.count || 0,
      companies: companiesCount.count || 0,
      candidates: candidatesCount.count || 0,
    });
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (location) params.set('location', location);
    onNavigate('jobs', params.toString());
  };

  return (
    <div className="w-full">
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-20 px-4">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Trouvez votre prochain emploi en Guinée
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-blue-100">
            La plateforme moderne qui connecte talents et opportunités
          </p>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Poste, compétence, entreprise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 text-lg"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Ville, région..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 text-lg"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
              >
                <Search className="w-5 h-5" />
                <span>Rechercher</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 text-white rounded-full mb-4">
                <Briefcase className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-blue-900 mb-2">{stats.jobs}+</div>
              <div className="text-gray-700 font-medium">Offres d'emploi</div>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full mb-4">
                <Building className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-orange-600 mb-2">{stats.companies}+</div>
              <div className="text-gray-700 font-medium">Entreprises</div>
            </div>

            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full mb-4">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-green-600 mb-2">{stats.candidates}+</div>
              <div className="text-gray-700 font-medium">Candidats</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Offres à la une
              </h2>
              <p className="text-gray-600 text-lg">Découvrez les opportunités les plus récentes</p>
            </div>
            <button
              onClick={() => onNavigate('jobs')}
              className="hidden md:flex items-center space-x-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
            >
              <span>Voir toutes les offres</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {featuredJobs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune offre disponible pour le moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl border border-gray-200 hover:shadow-xl transition p-6 cursor-pointer"
                  onClick={() => onNavigate('job-detail', job.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">{job.title}</h3>
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Building className="w-4 h-4" />
                        <span className="text-sm font-medium">{job.companies?.company_name}</span>
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
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                  </div>

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

                  <button className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium rounded-lg transition">
                    Voir l'offre
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <button
              onClick={() => onNavigate('jobs')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition"
            >
              <span>Voir toutes les offres</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 text-center">
            Comment ça marche ?
          </h2>
          <p className="text-gray-600 text-lg text-center mb-12">
            Trouvez votre emploi en 3 étapes simples
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900 text-white rounded-full text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Créez votre profil</h3>
              <p className="text-gray-600">
                Inscrivez-vous gratuitement et complétez votre profil avec vos compétences et expériences
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 text-white rounded-full text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recherchez des offres</h3>
              <p className="text-gray-600">
                Explorez des centaines d'offres adaptées à votre profil grâce à notre système de matching IA
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 text-white rounded-full text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Postulez en un clic</h3>
              <p className="text-gray-600">
                Envoyez votre candidature directement et suivez son évolution en temps réel
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition shadow-lg hover:shadow-xl text-lg"
            >
              Commencer maintenant
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
